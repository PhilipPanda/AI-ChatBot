import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Bot, Code, FileText, MessageCircle, Sparkles } from "lucide-react";
import { ChatComposer } from "../components/ChatComposer";
import { MessageBubble } from "../components/MessageBubble";
import { Sidebar } from "../components/Sidebar";
import { TypingIndicator } from "../components/TypingIndicator";
import { useAuth } from "../hooks/useAuth";
import { chatApi, conversationApi } from "../lib/api";
import type { ConversationSummary, Message } from "../lib/types";

const MODE_PREFIXES: Record<string, string> = {
  honest: "[Mode: Brutally Honest — Be direct, no sugarcoating, give raw unfiltered feedback]\n\n",
  creative: "[Mode: Creative — Think outside the box, be imaginative and expressive]\n\n",
  concise: "[Mode: Concise — Keep responses short and to the point, no fluff]\n\n",
  explain: "[Mode: Explain Like I'm 5 — Use simple language, analogies, and examples]\n\n",
  secure: "[Mode: Security Audit — Analyze for vulnerabilities, best practices, and security concerns]\n\n",
};

const EXAMPLE_QUESTIONS = [
  { icon: Code, text: "Write a Python script that scrapes a website and exports to CSV" },
  { icon: Sparkles, text: "Explain quantum computing in simple terms" },
  { icon: FileText, text: "Help me write a professional cover letter" },
  { icon: MessageCircle, text: "What are the best practices for REST API design?" },
];

function downloadFile(filename: string, content: string, contentType: string) {
  const blob = new Blob([content], { type: contentType });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(href);
}

export function ChatPage() {
  const { conversationId: conversationIdFromRoute } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedModel, setSelectedModel] = useState(user?.preferredModel ?? "gpt-4o-mini");
  const [activeMode, setActiveMode] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const activeConversationId = conversationIdFromRoute ?? null;

  useEffect(() => {
    if (user?.preferredModel) {
      setSelectedModel(user.preferredModel);
    }
  }, [user?.preferredModel]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, submitting]);

  const loadConversations = useCallback(async () => {
    try {
      setLoadingConversations(true);
      const data = await conversationApi.list();
      setConversations(data.conversations);

      if (!activeConversationId && data.conversations.length > 0) {
        navigate(`/chat/${data.conversations[0].id}`, { replace: true });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load conversations");
    } finally {
      setLoadingConversations(false);
    }
  }, [activeConversationId, navigate]);

  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      setLoadingMessages(true);
      const data = await conversationApi.getMessages(conversationId);
      setMessages(data.messages);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load messages");
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    void loadMessages(activeConversationId);
  }, [activeConversationId, loadMessages]);

  const createConversation = useCallback(async () => {
    try {
      const response = await conversationApi.create();
      await loadConversations();
      navigate(`/chat/${response.conversation.id}`);
      toast.success("Conversation created");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create conversation");
    }
  }, [loadConversations, navigate]);

  const sendMessage = useCallback(
    async (text: string, fileAttachments?: File[]) => {
      if (!user?.hasApiKey) {
        toast.error("Set your OpenAI API key in Settings before chatting");
        return;
      }

      let conversationId = activeConversationId;
      if (!conversationId) {
        const created = await conversationApi.create();
        conversationId = created.conversation.id;
        navigate(`/chat/${conversationId}`);
      }

      if (!conversationId) {
        return;
      }

      const modePrefix = activeMode && MODE_PREFIXES[activeMode] ? MODE_PREFIXES[activeMode] : "";
      const fullMessage = `${modePrefix}${text}`;

      let attachments: Array<{ name: string; mimeType: string; data: string }> | undefined;
      if (fileAttachments && fileAttachments.length > 0) {
        attachments = await Promise.all(
          fileAttachments.map(
            (file) =>
              new Promise<{ name: string; mimeType: string; data: string }>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                  const base64 = (reader.result as string).split(",")[1];
                  resolve({ name: file.name, mimeType: file.type || "application/octet-stream", data: base64 });
                };
                reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
                reader.readAsDataURL(file);
              })
          )
        );
      }

      const streamId = `stream-${Date.now()}`;
      const userDraft: Message = {
        id: `draft-user-${Date.now()}`,
        conversationId,
        role: "user",
        content: fileAttachments?.length ? `${text}\n\n📎 ${fileAttachments.map((f) => f.name).join(", ")}` : text,
        createdAt: new Date().toISOString()
      };

      const assistantDraft: Message = {
        id: streamId,
        conversationId,
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString()
      };

      setMessages((prev) => [...prev, userDraft, assistantDraft]);
      setSubmitting(true);

      let streamError: Error | null = null;

      try {
        await chatApi.streamMessage(conversationId, { message: fullMessage, model: selectedModel, attachments }, (event) => {
          if (event.type === "token") {
            setMessages((prev) =>
              prev.map((message) =>
                message.id === streamId ? { ...message, content: `${message.content}${event.token}` } : message
              )
            );
          }

          if (event.type === "error") {
            streamError = new Error(event.error);
          }

          if (event.type === "done") {
            setMessages((prev) => prev.map((message) => (message.id === streamId ? event.message : message)));
          }
        });

        if (streamError) {
          throw streamError;
        }

        await Promise.all([loadConversations(), loadMessages(conversationId)]);
      } catch (error) {
        setMessages((prev) => prev.filter((message) => message.id !== streamId));
        toast.error(error instanceof Error ? error.message : "Failed to send message");
      } finally {
        setSubmitting(false);
      }
    },
    [user?.hasApiKey, activeConversationId, selectedModel, activeMode, navigate, loadConversations, loadMessages]
  );

  const regenerate = useCallback(
    async (assistantMessageId: string) => {
      if (!activeConversationId) {
        return;
      }

      const streamId = `regen-${Date.now()}`;
      setSubmitting(true);
      setMessages((prev) => [
        ...prev.filter((message) => message.id !== assistantMessageId),
        {
          id: streamId,
          conversationId: activeConversationId,
          role: "assistant",
          content: "",
          createdAt: new Date().toISOString()
        }
      ]);

      let streamError: Error | null = null;

      try {
        await chatApi.regenerate(activeConversationId, assistantMessageId, { model: selectedModel }, (event) => {
          if (event.type === "token") {
            setMessages((prev) =>
              prev.map((message) =>
                message.id === streamId ? { ...message, content: `${message.content}${event.token}` } : message
              )
            );
          }

          if (event.type === "error") {
            streamError = new Error(event.error);
          }

          if (event.type === "done") {
            setMessages((prev) =>
              prev.map((message) => {
                if (message.id === streamId) {
                  return event.message;
                }

                if (event.replacedMessageId && message.id === event.replacedMessageId) {
                  return event.message;
                }

                return message;
              })
            );
          }
        });

        if (streamError) {
          throw streamError;
        }

        await Promise.all([loadConversations(), loadMessages(activeConversationId)]);
        toast.success("Response regenerated");
      } catch (error) {
        setMessages((prev) => prev.filter((message) => message.id !== streamId));
        toast.error(error instanceof Error ? error.message : "Regeneration failed");
      } finally {
        setSubmitting(false);
      }
    },
    [activeConversationId, selectedModel, loadConversations, loadMessages]
  );

  const renameConversation = useCallback(
    async (conversationId: string, title: string) => {
      try {
        await conversationApi.rename(conversationId, title);
        await loadConversations();
        toast.success("Renamed");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to rename");
      }
    },
    [loadConversations]
  );

  const deleteConversation = useCallback(
    async (conversationId: string) => {
      try {
        await conversationApi.delete(conversationId);
        const data = await conversationApi.list();
        setConversations(data.conversations);

        if (activeConversationId === conversationId) {
          if (data.conversations.length) {
            navigate(`/chat/${data.conversations[0].id}`);
          } else {
            navigate("/chat");
          }
        }

        toast.success("Conversation deleted");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to delete conversation");
      }
    },
    [activeConversationId, navigate]
  );

  const exportConversation = useCallback(async (conversationId: string, format: "markdown" | "json") => {
    try {
      if (format === "markdown") {
        const markdown = await conversationApi.exportMarkdown(conversationId);
        downloadFile(`conversation-${conversationId}.md`, markdown, "text/markdown");
      } else {
        const json = await conversationApi.exportJson(conversationId);
        downloadFile(`conversation-${conversationId}.json`, JSON.stringify(json, null, 2), "application/json");
      }

      toast.success("Conversation exported");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to export conversation");
    }
  }, []);

  const lastAssistantMessageId = useMemo(() => {
    const found = [...messages].reverse().find((message) => message.role === "assistant" && !message.id.startsWith("stream"));
    return found?.id;
  }, [messages]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
      toast.success("Signed out");
    } catch {
      navigate("/login", { replace: true });
    }
  };

  if (loadingConversations) {
    return <div className="screen-loader">Loading chat...</div>;
  }

  return (
    <div className="chat-page">
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={(conversationId) => navigate(`/chat/${conversationId}`)}
        onCreateConversation={createConversation}
        onRenameConversation={renameConversation}
        onDeleteConversation={deleteConversation}
        onExportConversation={exportConversation}
        onOpenSettings={() => navigate("/settings")}
        onLogout={handleLogout}
      />

      <main className="chat-main">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }} className="chat-thread">
          {!activeConversationId ? (
            <motion.div
              className="welcome-state"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="welcome-icon">
                <Bot size={32} />
              </div>
              <h2>What can I help you with?</h2>
              <p>Start a conversation or pick an example below.</p>
              <div className="example-questions">
                {EXAMPLE_QUESTIONS.map((eq) => {
                  const Icon = eq.icon;
                  return (
                    <button
                      key={eq.text}
                      type="button"
                      className="example-question"
                      onClick={() => {
                        void createConversation().then(() => {
                          void sendMessage(eq.text);
                        });
                      }}
                    >
                      <span className="eq-icon"><Icon size={16} /></span>
                      {eq.text}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ) : loadingMessages ? (
            <div className="screen-loader" style={{ minHeight: "auto" }}>Loading messages...</div>
          ) : messages.length === 0 ? (
            <motion.div
              className="welcome-state"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="welcome-icon">
                <Bot size={32} />
              </div>
              <h2>Ready when you are</h2>
              <p>Send your first message below, or try one of these.</p>
              <div className="example-questions">
                {EXAMPLE_QUESTIONS.map((eq) => {
                  const Icon = eq.icon;
                  return (
                    <button
                      key={eq.text}
                      type="button"
                      className="example-question"
                      onClick={() => void sendMessage(eq.text)}
                    >
                      <span className="eq-icon"><Icon size={16} /></span>
                      {eq.text}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <>
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isStreaming={submitting && message.id.startsWith("stream")}
                  onRegenerate={
                    message.role === "assistant" && message.id === lastAssistantMessageId
                      ? (messageId) => void regenerate(messageId)
                      : undefined
                  }
                />
              ))}

              {submitting ? <TypingIndicator /> : null}
              <div ref={bottomRef} />
            </>
          )}
        </motion.div>

        <ChatComposer
          onSend={sendMessage}
          disabled={submitting || (!activeConversationId && loadingConversations)}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          activeMode={activeMode}
          onModeChange={setActiveMode}
        />
      </main>
    </div>
  );
}
