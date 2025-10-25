"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { useState, useEffect, useRef, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { defaultApiClient } from "@/lib/api-utils";
import { refreshApiClientAuth } from "@/lib/auth-utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  ChevronLeft,
  ThumbsUp,
  ThumbsDown,
  Clock4,
  ArrowLeft,
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
  >({}); // Always initialized as empty object
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fetchSessionsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFetchingSessionsRef = useRef(false);
  const isLoadingWorkflowRef = useRef(false);
  const isSavingSessionRef = useRef(false);
  const currentRequestsRef = useRef<Set<string>>(new Set());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 128)}px`;
    }
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
            messages: (sessionResponse.data.messages || []).map((m: any) => ({
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
    console.debug(
      "Messages state changed:",
      messages.length,
      "messages",
      messages
    );
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    autoResizeTextarea();
  }, [input]);

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

  const fetchChatSessions = useCallback(async () => {
    if (!workflowId) return;

    const requestKey = `fetch-sessions-${workflowId}`;
    console.debug("fetchChatSessions: start", {
      workflowId,
      requestKey,
      currentRequests: Array.from(currentRequestsRef.current),
    });
    if (
      isFetchingSessionsRef.current ||
      currentRequestsRef.current.has(requestKey)
    ) {
      console.debug("fetchChatSessions: skipped due to existing request", {
        requestKey,
        isFetching: isFetchingSessionsRef.current,
      });
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

      if (response.success) {
        const sessionsCandidate =
          response.data?.sessions ?? (response.data as any)?.data?.sessions;
        const sessionsRaw = Array.isArray(sessionsCandidate)
          ? sessionsCandidate
          : [];

        const mapped = sessionsRaw.map((session: any) => ({
          id: String(session.id || session.sessionId || ""),
          workflowId: String(session.workflowId || workflowId || ""),
          workflowName: session.workflowName || session.workflowName || "",
          createdAt: session.createdAt
            ? new Date(session.createdAt)
            : new Date(),
          updatedAt: session.updatedAt
            ? new Date(session.updatedAt)
            : session.createdAt
            ? new Date(session.createdAt)
            : new Date(),
          messages: Array.isArray(session.messages)
            ? session.messages.map((m: any) => ({
                id: String(m.id || ""),
                role: m.role || "assistant",
                content: m.content || "",
                timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
              }))
            : [],
        }));

        console.debug("fetchChatSessions: received", {
          count: mapped.length,
          ids: mapped.map((s) => s.id),
          rawCount: sessionsRaw.length,
          rawSample: sessionsRaw[0],
        });

        setChatSessions(mapped);
        console.debug("fetchChatSessions: setChatSessions ->", mapped.length);
      } else {
        setChatSessions([]);
      }
    } catch (error) {
      console.warn("Failed to fetch chat sessions:", error);
      setChatSessions([]);
    } finally {
      console.debug("fetchChatSessions: finally", { requestKey });
      isFetchingSessionsRef.current = false;
      currentRequestsRef.current.delete(requestKey);
      setLoadingSessions(false);
    }
  }, [workflowId]);

  useEffect(() => {
    const loadWorkflow = async () => {
      if (!workflowId) {
        toast.error("No workflow selected");
        setLoading(false);
        return;
      }

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

          if (sessionParam) {
            console.log("Loading session from URL parameter:", sessionParam);
            try {
              const specificSessionResp =
                await defaultApiClient.getChatSessionById(
                  workflowId,
                  sessionParam
                );
              console.log("Specific session response:", specificSessionResp);

              if (specificSessionResp.success && specificSessionResp.data) {
                // Handle nested response structure - actual data might be at .data.data
                const sessionData =
                  (specificSessionResp.data as any).data ||
                  specificSessionResp.data;

                console.log("Session data structure:", {
                  hasData: !!sessionData,
                  hasMessages: !!sessionData.messages,
                  messagesType: typeof sessionData.messages,
                  messagesIsArray: Array.isArray(sessionData.messages),
                  messageCount: sessionData.messages?.length,
                  fullData: sessionData,
                });

                // Ensure we have a valid messages array (defensive check)
                if (!Array.isArray(sessionData.messages)) {
                  console.warn(
                    "Messages is not an array, received:",
                    typeof sessionData.messages,
                    sessionData.messages
                  );
                  sessionData.messages = [];
                }

                console.debug("Loading specific session:", {
                  sessionId: sessionParam,
                  messageCount: sessionData.messages.length,
                  messages: sessionData.messages,
                });

                setSessionId(sessionParam);

                try {
                  const messagesArray = sessionData.messages;
                  console.debug("About to map messages:", {
                    arrayLength: messagesArray.length,
                    firstMessage: messagesArray[0],
                  });

                  const mappedMessages = messagesArray.map(
                    (m: any, index: number) => {
                      console.debug(`Mapping message ${index}:`, m);
                      return {
                        ...m,
                        timestamp: new Date(m.timestamp),
                      };
                    }
                  );

                  console.debug("Successfully mapped messages:", {
                    count: mappedMessages.length,
                    messages: mappedMessages,
                  });

                  setMessages(mappedMessages);
                  console.debug(
                    "setMessages called with",
                    mappedMessages.length,
                    "messages"
                  );
                } catch (mappingError) {
                  console.error("Error mapping messages:", mappingError);
                  console.error(
                    "Messages data that failed:",
                    sessionData.messages
                  );
                  setMessages([]);
                }

                // Set credits - log for debugging
                const credits = sessionData.remainingCredits;
                console.debug("Credits from session response:", credits);
                setRemainingCredits(credits !== undefined ? credits : null);

                // The session API now returns feedback directly in the response
                if (sessionData.feedback) {
                  console.debug(
                    "Setting message feedback from session response:",
                    sessionData.feedback
                  );
                  console.debug(
                    "Current message IDs:",
                    sessionData.messages.map((m: any) => m.id)
                  );
                  console.debug(
                    "Feedback message IDs:",
                    Object.keys(sessionData.feedback)
                  );

                  // Check if any feedback matches current messages
                  const matchingFeedback = Object.keys(
                    sessionData.feedback
                  ).filter((msgId) =>
                    sessionData.messages.some((m: any) => m.id === msgId)
                  );
                  console.debug("Matching feedback entries:", matchingFeedback);

                  setMessageFeedback(sessionData.feedback);
                } else {
                  // Fallback to separate feedback API call if not included
                  try {
                    console.debug(
                      "Loading message feedback for session:",
                      sessionParam
                    );
                    const fb = await defaultApiClient.getMessageFeedback(
                      sessionParam
                    );
                    console.debug("Message feedback response:", fb);
                    if (fb.success && fb.data) {
                      console.debug(
                        "Setting message feedback:",
                        fb.data.feedback
                      );
                      setMessageFeedback(fb.data.feedback);
                    }
                  } catch (e) {
                    console.warn("Failed to load message feedback:", e);
                  }
                }
                try {
                  await fetchChatSessions();
                } catch (e) {
                  /* ignore */
                }
                return;
              } else {
                // If specific session not found, stay with the session from URL but show error
                console.warn(
                  `Session ${sessionParam} not found, creating new session with this ID`
                );
                setSessionId(sessionParam);
                const welcomeMessage: Message = {
                  id: `msg_${Date.now()}`,
                  role: "assistant",
                  content: `Hi! I'm your agent for "${response.data.name}". How can I help you today?`,
                  timestamp: new Date(),
                };
                setMessages([welcomeMessage]);
                try {
                  await defaultApiClient.saveChatSession({
                    workflowId,
                    sessionId: sessionParam,
                    messages: [welcomeMessage],
                  });
                } catch (e) {
                  console.warn("Failed to save new session:", e);
                }
                try {
                  await fetchChatSessions();
                } catch (e) {
                  /* ignore */
                }
                return;
              }
            } catch (e) {
              console.warn("Failed to load session from URL parameter:", e);
              // Even if there's an error, keep the session ID from URL
              setSessionId(sessionParam);
              const welcomeMessage: Message = {
                id: `msg_${Date.now()}`,
                role: "assistant",
                content: `Hi! I'm your agent for "${response.data.name}". How can I help you today?`,
                timestamp: new Date(),
              };
              setMessages([welcomeMessage]);
              return;
            }
          }

          // Only try to load latest session if NO session was specified in URL
          if (!sessionParam) {
            console.debug("No session param, loading latest session");
            try {
              const sessionResponse = await defaultApiClient.getChatSession(
                workflowId
              );

              if (sessionResponse.success && sessionResponse.data?.sessionId) {
                const loadedSessionId = sessionResponse.data.sessionId;
                setSessionId(loadedSessionId);
                setMessages(
                  (sessionResponse.data.messages || []).map((m: any) => ({
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
                  if (fb.success && fb.data)
                    setMessageFeedback(fb.data.feedback);
                } catch (e) {
                  /* ignore feedback load errors */
                }
                try {
                  await fetchChatSessions();
                } catch (e) {
                  /* ignore */
                }
              } else {
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
                try {
                  await defaultApiClient.saveChatSession({
                    workflowId,
                    sessionId: newSessionId,
                    messages: [welcomeMessage],
                  });
                } catch (e) {
                  console.warn("Failed to save new session:", e);
                }
                try {
                  await fetchChatSessions();
                } catch (e) {
                  /* ignore */
                }
              }
            } catch (e) {
              console.warn("Failed to restore session, creating new one");
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
              try {
                await fetchChatSessions();
              } catch (e) {
                /* ignore */
              }
            }
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
  }, [workflowId, sessionParam, router, fetchChatSessions]);
  const createNewChatSession = useCallback(() => {
    if (!workflow) return;

    const newSessionId = `session_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    setSessionId(newSessionId);

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
        // Update remaining credits but DO NOT change session ID
        // The conversationId from chat completion is different from our session management
        const respData: any = response.data || {};
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

            // Save session with updated messages
            saveSessionToBackend(sessionId, updatedMessages);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    autoResizeTextarea();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (e.shiftKey) {
        return;
      } else {
        e.preventDefault();
        handleSendMessage();
      }
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
          className={`fixed md:relative inset-y-0 left-0 z-50 border-r border-white/10 bg-[#0f1014] transform transition-all duration-300 ease-in-out ${
            sidebarOpen
              ? "w-80 translate-x-0"
              : "w-0 md:w-0 -translate-x-full md:translate-x-0"
          } ${!sidebarOpen && "md:border-r-0"}`}
        >
          {sidebarOpen && (
            <>
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h2 className="text-lg font-semibold">Chat History</h2>
                <div className="flex items-center space-x-2">
                  {/* Desktop toggle: show left chevron when closed (expand), right when open (collapse) */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="hidden md:flex"
                    title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                  >
                    {!sidebarOpen ? (
                      <ChevronRight className="w-5 h-5 transition-transform duration-200" />
                    ) : (
                      <ChevronLeft className="w-5 h-5 transition-transform duration-200" />
                    )}
                  </Button>

                  {/* Mobile toggle: show X when open, Menu when closed */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="md:hidden"
                    title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
                  >
                    {sidebarOpen ? (
                      <X className="w-5 h-5 transition-transform duration-200" />
                    ) : (
                      <Menu className="w-5 h-5 transition-transform duration-200" />
                    )}
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
            </>
          )}
        </div>

        <div className="flex flex-col flex-1 h-full transition-[margin] duration-300 ease-in-out">
          {/* Header */}

          <div className="border-b flex w-full border-white/10 bg-[#1A1B23] px-4 md:px-6 py-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-4">
              <div className="flex items-center min-w-0 flex-1">
                {!sidebarOpen && (
                  <div className="flex items-center gap-3 mr-4">
                    <Clock4 className="w-5 h-5 flex-shrink-0" />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSidebarOpen(!sidebarOpen)}
                      className="hidden md:flex"
                      title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </div>
                )}

                {/* Mobile menu button: Menu when closed, X when open */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="mr-2 md:hidden flex-shrink-0"
                  title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
                >
                  {sidebarOpen ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <Menu className="w-5 h-5" />
                  )}
                </Button>

                <div className="min-w-0 flex-1">
                  <h1 className="text-lg md:text-xl font-semibold truncate">{workflow.name}</h1>
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4">
                    <p className="text-sm text-gray-400 truncate">
                      {workflow.description || "Chat with your workflow agent"}
                    </p>
                    {remainingCredits !== null && (
                      <div className="text-sm text-yellow-300 bg-gray-800 px-2 py-1 rounded flex-shrink-0">
                        Credits: {remainingCredits}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/workflows")}
                className="border-gray-700 text-black cursor-pointer flex items-center gap-2 w-full md:w-auto flex-shrink-0 cursor-pointer"
              >
                <ArrowLeft className="!w-4 !h-4" />
                <span className="hidden sm:inline">Back to Workflows</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
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
                              messageFeedback?.[message.id] === "like"
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
                              messageFeedback?.[message.id] === "unlike"
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
          <div className="border-t border-white/10 bg-gradient-to-r from-[#1A1B23] to-[#0f1014] px-4 md:px-6 py-4 md:py-6">
            <div className="max-w-4xl mx-auto">
              <div className="relative">
                <div className="flex items-end space-x-2 md:space-x-3 bg-[#0A0B0F]/50 backdrop-blur-sm border border-white/10 rounded-2xl p-3 md:p-4 shadow-lg hover:border-white/20 transition-all duration-200">
                  <div className="flex-1">
                    <Textarea
                      ref={textareaRef}
                      value={input}
                      onChange={handleInputChange}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      disabled={sending}
                      className="w-full bg-transparent border-0 text-white placeholder:text-gray-400 focus:ring-0 focus:outline-none focus:border-0 focus:shadow-none text-base resize-none min-h-[24px] max-h-32 overflow-hidden shadow-none"
                      style={{ minHeight: '24px', maxHeight: '128px', border: 'none', outline: 'none', boxShadow: 'none' }}
                      rows={1}
                    />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-2 gap-2 md:block hidden">
                      <p className="text-xs text-gray-500 ">
                        Press Enter to send, Shift+Enter for new line
                      </p>
                      
                    </div>
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={sending || !input.trim()}
                    size="lg"
                    className="bg-gradient-to-r cursor-pointer from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-orange-500/25 transition-all duration-200 rounded-xl px-6 py-3"
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
