"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { useState, useEffect, useRef, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { defaultApiClient } from "@/lib/api-utils";
import { refreshApiClientAuth } from "@/lib/auth-utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Send,
  Bot,
  User,
  Loader2,
  Menu,
  X,
  MessageSquare,
  Plus,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { MarkdownRenderer } from "@/components/ui/Chat/markdown-renderer";
import { cn } from "@/lib/utils";

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
  const sessionParam = searchParams.get("session");

  const router = useRouter();
  const [workflow, setWorkflow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState<string>(sessionParam || "");
  const [remainingCredits, setRemainingCredits] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [typingIndicator, setTypingIndicator] = useState(false);
  const [messageFeedback, setMessageFeedback] = useState<
    Record<string, string>
  >({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fetchSessionsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFetchingSessionsRef = useRef(false);
  const isLoadingWorkflowRef = useRef(false);
  const isSavingSessionRef = useRef(false);
  const currentRequestsRef = useRef<Set<string>>(new Set());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Update URL when session changes
  const updateSessionInUrl = useCallback(
    (newSessionId: string) => {
      if (workflowId && newSessionId) {
        const newUrl = `/chat?workflow=${workflowId}&session=${newSessionId}`;
        router.replace(newUrl);
      }
    },
    [workflowId, router]
  );

  // Load a specific session by ID
  const loadSessionById = useCallback(
    async (sessionId: string) => {
      try {
        const sessionResponse = await defaultApiClient.getChatSessionById(
          workflowId!,
          sessionId
        );
        if (sessionResponse.success && sessionResponse.data) {
          return {
            messages: sessionResponse.data.messages.map((m: any) => ({
              ...m,
              timestamp: new Date(m.timestamp),
            })),
            remainingCredits: sessionResponse.data.remainingCredits || 0,
          };
        }
      } catch (error) {
        console.warn("Failed to load session by ID:", error);
      }
      return null;
    },
    [workflowId]
  );

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cleanup on unmount
  useEffect(() => {
    const timeoutRef = fetchSessionsTimeoutRef.current;
    const requestsRef = currentRequestsRef.current;

    return () => {
      // Clear any pending timeouts
      if (timeoutRef) {
        clearTimeout(timeoutRef);
      }
      // Clear request tracking
      requestsRef.clear();
      // Reset refs
      isFetchingSessionsRef.current = false;
      isLoadingWorkflowRef.current = false;
      isSavingSessionRef.current = false;
    };
  }, []);

  // Save session to backend database
  const saveSessionToBackend = useCallback(
    async (currentSessionId: string, currentMessages: Message[]) => {
      if (!workflowId || !currentSessionId) return;

      // Prevent duplicate saves
      const requestKey = `save-${currentSessionId}`;
      if (
        isSavingSessionRef.current ||
        currentRequestsRef.current.has(requestKey)
      ) {
        return;
      }

      isSavingSessionRef.current = true;
      currentRequestsRef.current.add(requestKey);

      try {
        await defaultApiClient.saveChatSession({
          workflowId,
          sessionId: currentSessionId,
          messages: currentMessages,
          remainingCredits: remainingCredits || 0,
        });
      } catch (error) {
        console.warn("Failed to save session to backend:", error);
      } finally {
        isSavingSessionRef.current = false;
        currentRequestsRef.current.delete(requestKey);
      }
    },
    [workflowId, remainingCredits]
  );

  // Load message feedback
  const loadMessageFeedback = useCallback(async (sessionId: string) => {
    try {
      const response = await defaultApiClient.getMessageFeedback(sessionId);
      if (response.success && response.data) {
        setMessageFeedback(response.data.feedback);
      }
    } catch (error) {
      console.warn("Failed to load message feedback:", error);
    }
  }, []);

  // Handle message feedback
  const handleMessageFeedback = useCallback(
    async (messageId: string, feedback: "like" | "unlike") => {
      if (!sessionId) return;

      try {
        const response = await defaultApiClient.addMessageFeedback(
          sessionId,
          messageId,
          feedback
        );
        if (response.success) {
          setMessageFeedback((prev) => ({
            ...prev,
            [messageId]: feedback,
          }));
          toast.success(`Message ${feedback}d`);
        }
      } catch (error) {
        console.error("Failed to save feedback:", error);
        toast.error("Failed to save feedback");
      }
    },
    [sessionId]
  );

  useEffect(() => {
    const loadWorkflow = async () => {
      if (!workflowId) {
        toast.error("No workflow selected");
        setLoading(false);
        return;
      }

      // Prevent duplicate workflow loads
      const requestKey = `workflow-${workflowId}`;
      if (
        isLoadingWorkflowRef.current ||
        currentRequestsRef.current.has(requestKey)
      ) {
        return;
      }

      isLoadingWorkflowRef.current = true;
      currentRequestsRef.current.add(requestKey);

      try {
        refreshApiClientAuth();
        const response = await defaultApiClient.getWorkflow(workflowId);

        if (response.success && response.data) {
          setWorkflow(response.data);

          // If session ID is in URL, try to load that specific session first
          if (sessionParam) {
            try {
              // call API directly to avoid extra deps
              const specificSessionResp =
                await defaultApiClient.getChatSessionById(
                  workflowId,
                  sessionParam
                );
              if (specificSessionResp.success && specificSessionResp.data) {
                setSessionId(sessionParam);
                setMessages(
                  specificSessionResp.data.messages.map((m: any) => ({
                    ...m,
                    timestamp: new Date(m.timestamp),
                  }))
                );
                setRemainingCredits(
                  specificSessionResp.data.remainingCredits || 0
                );
                try {
                  const fb = await defaultApiClient.getMessageFeedback(
                    sessionParam
                  );
                  if (fb.success && fb.data)
                    setMessageFeedback(fb.data.feedback);
                } catch (e) {
                  /* ignore feedback load errors */
                }
                return;
              }
            } catch (e) {
              console.warn("Failed to load session from URL parameter:", e);
            }
          }

          // Try to restore the most recent session from backend
          try {
            const sessionResponse = await defaultApiClient.getChatSession(
              workflowId
            );

            if (sessionResponse.success && sessionResponse.data?.sessionId) {
              const loadedSessionId = sessionResponse.data.sessionId;
              setSessionId(loadedSessionId);
              setMessages(
                sessionResponse.data.messages.map((m: any) => ({
                  ...m,
                  timestamp: new Date(m.timestamp),
                }))
              );
              setRemainingCredits(sessionResponse.data.remainingCredits || 0);

              // Update URL with the loaded session
              router.replace(
                `/chat?workflow=${workflowId}&session=${loadedSessionId}`
              );
              try {
                const fb = await defaultApiClient.getMessageFeedback(
                  loadedSessionId
                );
                if (fb.success && fb.data) setMessageFeedback(fb.data.feedback);
              } catch (e) {
                /* ignore feedback load errors */
              }
            } else {
              // create new session inline
              const newSessionId = `session_${Date.now()}_${Math.random()
                .toString(36)
                .substr(2, 9)}`;
              setSessionId(newSessionId);

              const welcomeMessage: Message = {
                id: `msg_${Date.now()}`,
                role: "assistant",
                content: `Hi! I'm your agent for "${response.data.name}". How can I help you today?`,
                timestamp: new Date(),
              };
              setMessages([welcomeMessage]);

              // Update URL and save session
              router.replace(
                `/chat?workflow=${workflowId}&session=${newSessionId}`
              );
              try {
                await defaultApiClient.saveChatSession({
                  workflowId,
                  sessionId: newSessionId,
                  messages: [welcomeMessage],
                });
              } catch (e) {
                console.warn("Failed to save new session:", e);
              }
            }
          } catch (e) {
            console.warn("Failed to restore session, creating new one");
            // fallback: create new session (minimal)
            const newSessionId = `session_${Date.now()}_${Math.random()
              .toString(36)
              .substr(2, 9)}`;
            setSessionId(newSessionId);
            const welcomeMessage: Message = {
              id: `msg_${Date.now()}`,
              role: "assistant",
              content: `Hi! I'm your agent for "${response.data.name}". How can I help you today?`,
              timestamp: new Date(),
            };
            setMessages([welcomeMessage]);
            router.replace(
              `/chat?workflow=${workflowId}&session=${newSessionId}`
            );
          }
        } else {
          toast.error("Failed to load workflow");
        }
      } catch (error) {
        console.error("Error loading workflow:", error);
        toast.error("Failed to load workflow");
      } finally {
        isLoadingWorkflowRef.current = false;
        currentRequestsRef.current.delete(`workflow-${workflowId}`);
        setLoading(false);
      }
    };
    loadWorkflow();
  }, [workflowId, sessionParam, router]);

  // Note: Session saving is now handled by the backend after chat completion
  // This prevents multiple saves and ensures both user and assistant messages are saved together

  // Fetch all chat sessions for the current workflow
  const fetchChatSessions = useCallback(async () => {
    if (!workflowId) return;

    // Prevent duplicate simultaneous requests
    const requestKey = `fetch-sessions-${workflowId}`;
    if (
      isFetchingSessionsRef.current ||
      currentRequestsRef.current.has(requestKey)
    ) {
      return;
    }

    // Clear any pending timeout
    if (fetchSessionsTimeoutRef.current) {
      clearTimeout(fetchSessionsTimeoutRef.current);
    }

    isFetchingSessionsRef.current = true;
    currentRequestsRef.current.add(requestKey);
    setLoadingSessions(true);

    try {
      refreshApiClientAuth();
      const response = await defaultApiClient.getAllChatSessions(workflowId);

      if (response.success && response.data?.sessions) {
        setChatSessions(
          response.data.sessions.map((session: any) => ({
            ...session,
            createdAt: new Date(session.createdAt),
            updatedAt: new Date(session.updatedAt || session.createdAt),
            messages: session.messages.map((m: any) => ({
              ...m,
              timestamp: new Date(m.timestamp),
            })),
          }))
        );
      } else {
        // No sessions found
        setChatSessions([]);
      }
    } catch (error) {
      console.warn("Failed to fetch chat sessions:", error);
      setChatSessions([]);
    } finally {
      isFetchingSessionsRef.current = false;
      currentRequestsRef.current.delete(requestKey);
      setLoadingSessions(false);
    }
  }, [workflowId]);

  // Create a new chat session
  const createNewChatSession = useCallback(() => {
    if (!workflow) return;

    const newSessionId = `session_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    setSessionId(newSessionId);

    // Add welcome message
    const welcomeMessage: Message = {
      id: `msg_${Date.now()}`,
      role: "assistant",
      content: `Hi! I'm your agent for "${workflow.name}". How can I help you today?`,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);

    // Update URL with new session
    updateSessionInUrl(newSessionId);

    // Save initial session
    saveSessionToBackend(newSessionId, [welcomeMessage]);
  }, [workflow, updateSessionInUrl, saveSessionToBackend]);

  // Switch to an existing chat session
  const switchChatSession = useCallback(
    async (selectedSession: ChatSession) => {
      setSessionId(selectedSession.id);
      setMessages(selectedSession.messages);

      // Update URL
      updateSessionInUrl(selectedSession.id);

      // Load feedback for this session
      await loadMessageFeedback(selectedSession.id);

      // Close sidebar on mobile after selection
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    },
    [updateSessionInUrl, loadMessageFeedback]
  );

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
      // Show typing indicator
      const typingId = `typing_${Date.now()}`;
      setTypingIndicator(true);
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
          updateSessionInUrl(respData.conversationId);
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
        const stableId = `msg_${Date.now()}`;
        setTimeout(() => {
          setTypingIndicator(false);
          setMessages((prev) => {
            const updatedMessages = prev.map((m) =>
              m.id === typingId ? { ...m, id: stableId } : m
            );

            // Debounced session refresh to prevent multiple calls
            if (fetchSessionsTimeoutRef.current) {
              clearTimeout(fetchSessionsTimeoutRef.current);
            }
            fetchSessionsTimeoutRef.current = setTimeout(() => {
              if (!isFetchingSessionsRef.current) {
                fetchChatSessions();
              }
            }, 2000);

            return updatedMessages;
          });
        }, 15 * chars.length + 100);
      } else {
        // Remove typing placeholder and report error
        setTypingIndicator(false);
        setMessages((prev) => prev.filter((m) => !m.id.startsWith("typing_")));
        toast.error(response.error || "Failed to get response");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setTypingIndicator(false);
      setMessages((prev) => prev.filter((m) => !m.id.startsWith("typing_")));
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
      <div className="flex h-screen bg-[#0A0B0F] text-white">
        {/* Sidebar */}
        <div
          className={`fixed md:relative inset-y-0 left-0 z-50 w-80 border-r border-white/10 bg-[#0f1014] transform transition-transform duration-300 ease-in-out ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        >
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h2 className="text-lg font-semibold">Chat History</h2>
            <div className="flex items-center space-x-2">
              {/* Desktop collapse button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className="hidden md:flex"
                title="Collapse sidebar"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
              {/* Mobile close button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className="md:hidden"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="p-4">
            <Button
              variant="outline"
              className="w-full flex items-center text-black justify-center gap-2 mb-2 border-white/20 hover:border-white/40"
              onClick={createNewChatSession}
            >
              <Plus className="w-4 h-4" />
              New Chat
            </Button>

            <Button
              variant="ghost"
              className="w-full flex items-center  justify-center gap-2 mb-4 text-gray-400 hover:text-black cursor-pointer hover:bg-gray-500"
              onClick={fetchChatSessions}
              disabled={loadingSessions}
            >
              {loadingSessions ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MessageSquare className="w-4 h-4" />
              )}
              Load Chat History
            </Button>

            {loadingSessions ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
              </div>
            ) : (
              <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
                {chatSessions.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">
                    No chat history found
                  </p>
                ) : (
                  chatSessions.map((session) => (
                    <div
                      key={session.id}
                      className={`p-3 rounded-md cursor-pointer flex items-center justify-between ${
                        sessionId === session.id
                          ? "bg-orange-500/20 border border-orange-500/40"
                          : "hover:bg-white/5 border border-transparent"
                      }`}
                      onClick={() => switchChatSession(session)}
                    >
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <MessageSquare className="w-5 h-5 flex-shrink-0 text-gray-400" />
                        <div className="overflow-hidden">
                          <p className="font-medium truncate">
                            {session.messages[0]?.content.slice(0, 30) ||
                              "New chat"}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {new Date(session.updatedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {sessionId === session.id && (
                        <ChevronRight className="w-5 h-5 text-orange-500" />
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col flex-1 h-full">
          {/* Header */}
          <div className="border-b border-white/10 bg-[#1A1B23] px-6 py-4">
            <div className="flex items-center justify-between max-w-6xl mx-auto">
              <div className="flex items-center">
                {/* Mobile menu button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="mr-2 md:hidden"
                >
                  <Menu className="w-5 h-5" />
                </Button>
                {/* Desktop expand button (when sidebar is collapsed) */}
                {!sidebarOpen && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(true)}
                    className="mr-2 hidden md:flex"
                    title="Expand sidebar"
                  >
                    <Menu className="w-5 h-5" />
                  </Button>
                )}
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
                      {message.id.startsWith("typing_") && !message.content ? (
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <Bot className="w-5 h-5 text-white" />
                      )}
                    </div>
                  )}

                  <div className="flex flex-col max-w-[70%]">
                    <div
                      className={`rounded-lg px-4 py-3 ${
                        message.role === "user"
                          ? "bg-gradient-to-r from-orange-400 to-orange-500 text-white"
                          : "bg-[#1A1B23] border border-white/10 text-gray-100"
                      }`}
                    >
                      {message.role === "assistant" ? (
                        message.id.startsWith("typing_") && !message.content ? (
                          <div className="flex items-center space-x-2">
                            <div className="flex space-x-1">
                              <div
                                className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"
                                style={{ animationDelay: "0ms" }}
                              ></div>
                              <div
                                className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"
                                style={{ animationDelay: "150ms" }}
                              ></div>
                              <div
                                className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"
                                style={{ animationDelay: "300ms" }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-400">
                              Thinking...
                            </span>
                          </div>
                        ) : (
                          <MarkdownRenderer content={message.content} />
                        )
                      ) : (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      )}
                      {!(
                        message.id.startsWith("typing_") && !message.content
                      ) && (
                        <p className="text-xs mt-2 opacity-70">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      )}
                    </div>

                    {/* Message Feedback - Only for assistant messages */}
                    {message.role === "assistant" &&
                      !message.id.startsWith("typing_") &&
                      message.content && (
                        <div className="flex items-center space-x-2 mt-2 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleMessageFeedback(message.id, "like")
                            }
                            className={cn(
                              "h-6 w-6 p-0",
                              messageFeedback[message.id] === "like"
                                ? "text-green-500 bg-green-500/10"
                                : "text-gray-400 hover:text-green-500"
                            )}
                          >
                            <ThumbsUp className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleMessageFeedback(message.id, "unlike")
                            }
                            className={cn(
                              "h-6 w-6 p-0",
                              messageFeedback[message.id] === "unlike"
                                ? "text-red-500 bg-red-500/10"
                                : "text-gray-400 hover:text-red-500"
                            )}
                          >
                            <ThumbsDown className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
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
