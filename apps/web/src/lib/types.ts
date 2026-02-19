export type User = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  preferredModel: string;
  systemPrompt: string | null;
  theme: "dark" | "light";
  hasApiKey: boolean;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
};

export type AuthResponse = {
  user: AuthUser;
  accessToken: string;
};

export type ConversationSummary = {
  id: string;
  title: string;
  updatedAt: string;
  messageCount: number;
  lastMessage: {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    createdAt: string;
  } | null;
};

export type Message = {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  model?: string | null;
  createdAt: string;
};

export type ConversationMessagesResponse = {
  conversation: {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
  };
  messages: Message[];
};

export type Settings = {
  preferredModel: string;
  systemPrompt: string | null;
  theme: "dark" | "light";
  hasApiKey: boolean;
};

export type UsagePoint = {
  id: string;
  date: string;
  requests: number;
  totalTokens: number;
};

export type StreamEvent =
  | { type: "token"; token: string }
  | { type: "done"; message: Message; replacedMessageId?: string }
  | { type: "error"; error: string };
