"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { defaultApiClient } from "@/lib/api-utils";
import { refreshApiClientAuth } from "@/lib/auth-utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { MarkdownRenderer } from "@/components/ui/Chat/markdown-renderer";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  workflowId: string;
  workflowName: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

function ChatPageContent() {
  const searchParams = useSearchParams();
  const workflowId = searchParams.get("workflow");

  const [workflow, setWorkflow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [remainingCredits, setRemainingCredits] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const loadWorkflow = async () => {
      if (!workflowId) {
        toast.error("No workflow selected");
        setLoading(false);
        return;
      }

      try {
        refreshApiClientAuth();
        const response = await defaultApiClient.getWorkflow(workflowId);

        if (response.success && response.data) {
          setWorkflow(response.data);

          // Create or load chat session
          const newSessionId = `session_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`;
          setSessionId(newSessionId);

          // Add welcome message
          const welcomeMessage: Message = {
            id: `msg_${Date.now()}`,
            role: "assistant",
            content: `Hi! I'm your agent for "${response.data.name}". How can I help you today?`,
            timestamp: new Date(),
          };
          setMessages([welcomeMessage]);
        } else {
          toast.error("Failed to load workflow");
        }
      } catch (error) {
        console.error("Error loading workflow:", error);
        toast.error("Failed to load workflow");
      } finally {
        setLoading(false);
      }
    };

    loadWorkflow();
  }, [workflowId]);

  const handleSendMessage = async () => {
    if (!input.trim() || sending) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setSending(true);

    try {
      // Add a typing placeholder message so UI shows assistant typing
      const typingId = `typing_${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: typingId,
          role: "assistant",
          content: "",
          timestamp: new Date(),
        },
      ]);

      // Use the API client for proper auth handling
      const response = await defaultApiClient.chatCompletion({
        messages: updatedMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        agentId: workflowId ?? undefined,
        sessionId,
        workflowContext: {
          workflowId,
          workflowName: workflow?.name,
          nodes: workflow?.nodes || [],
        },
      });

      if (response.success) {
        // update conversation/session id if backend returned one
        const respData: any = response.data || {};
        if (respData.conversationId) {
          setSessionId(respData.conversationId);
        }
        if (respData.remainingCredits !== undefined) {
          setRemainingCredits(respData.remainingCredits);
        }

        // extract assistant text from different possible shapes
        let assistantText = "";
        if (typeof respData.message === "string") {
          assistantText = respData.message;
        } else if (respData.choices && respData.choices[0]) {
          assistantText =
            respData.choices[0].message?.content ||
            respData.choices[0].text ||
            "";
        } else if (respData.choicesText) {
          assistantText = respData.choicesText;
        }

        // Animate typing by updating the placeholder message incrementally
        const chars = assistantText.split("");
        chars.forEach((_, i) => {
          setTimeout(() => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === typingId
                  ? { ...m, content: assistantText.slice(0, i + 1) }
                  : m
              )
            );
          }, 15 * i);
        });

        // After animation completes, replace placeholder id with a stable id
        setTimeout(() => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === typingId ? { ...m, id: `msg_${Date.now()}` } : m
            )
          );
        }, 15 * chars.length + 100);
      } else {
        // Remove typing placeholder and report error
        setMessages((prev) => prev.filter((m) => !m.id.startsWith("typing_")));
        toast.error(response.error || "Failed to get response");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center h-screen bg-[#0A0B0F]">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      </AuthGuard>
    );
  }

  if (!workflow) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center h-screen bg-[#0A0B0F]">
          <div className="text-center">
            <p className="text-red-400 mb-4">Workflow not found</p>
            <Button onClick={() => (window.location.href = "/workflows")}>
              Go to Workflows
            </Button>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="flex flex-col h-screen bg-[#0A0B0F] text-white">
        {/* Header */}
        <div className="border-b border-white/10 bg-[#1A1B23] px-6 py-4">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div>
              <h1 className="text-xl font-semibold">{workflow.name}</h1>
              <div className="flex items-center space-x-4">
                <p className="text-sm text-gray-400">
                  {workflow.description || "Chat with your workflow agent"}
                </p>
                {remainingCredits !== null && (
                  <div className="text-sm text-yellow-300 bg-gray-800 px-2 py-1 rounded">
                    Credits: {remainingCredits}
                  </div>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/workflows")}
              className="border-gray-700 text-black cursor-pointer"
            >
              Back to Workflows
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${
                  message.role === "user" ? "justify-end" : ""
                }`}
              >
                {message.role === "assistant" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-orange-500 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}

                <div
                  className={`max-w-[70%] rounded-lg px-4 py-3 ${
                    message.role === "user"
                      ? "bg-gradient-to-r from-orange-400 to-orange-500 text-white"
                      : "bg-[#1A1B23] border border-white/10 text-gray-100"
                  }`}
                >
                  {message.role === "assistant" ? (
                    <MarkdownRenderer content={message.content} />
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                  <p className="text-xs mt-2 opacity-70">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>

                {message.role === "user" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-white/10 bg-[#1A1B23] px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center space-x-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={sending}
              className="flex-1 bg-[#0A0B0F] border-white/10 text-white placeholder:text-gray-500 focus:border-orange-500"
            />
            <Button
              onClick={handleSendMessage}
              disabled={sending || !input.trim()}
              className="bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen bg-[#0A0B0F]">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      }
    >
      <ChatPageContent />
    </Suspense>
  );
}
