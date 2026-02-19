import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import type {
  AuthResponse,
  ConversationMessagesResponse,
  ConversationSummary,
  Settings,
  StreamEvent,
  UsagePoint,
  User
} from "./types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";
const ACCESS_TOKEN_KEY = "ai_chatbot_access_token";

const http = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

let accessToken: string | null = localStorage.getItem(ACCESS_TOKEN_KEY);

function setTokenStorage(token: string | null) {
  accessToken = token;
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
}

function authHeaders() {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

function toError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { error?: string } | undefined)?.error;
    return new Error(message ?? error.message);
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error("Unknown request error");
}

async function refreshAccessToken() {
  try {
    const response = await http.post<AuthResponse>("/auth/refresh");
    setTokenStorage(response.data.accessToken);
    return response.data.accessToken;
  } catch {
    setTokenStorage(null);
    return null;
  }
}

async function requestWithRetry<T>(config: AxiosRequestConfig, retry = true): Promise<T> {
  try {
    const response = await http.request<T>({
      ...config,
      headers: {
        ...(config.headers ?? {}),
        ...authHeaders()
      }
    });

    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    if (retry && axiosError.response?.status === 401) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return requestWithRetry<T>(config, false);
      }
    }

    throw toError(error);
  }
}

async function parseErrorResponse(response: Response) {
  try {
    const json = (await response.json()) as { error?: string };
    return json.error ?? `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
  }
}

async function streamNdjson(path: string, body: Record<string, unknown>, onEvent: (event: StreamEvent) => void) {
  const runFetch = async () =>
    fetch(`${API_URL}${path}`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
      },
      body: JSON.stringify(body)
    });

  let response = await runFetch();
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      throw new Error("Session expired. Please sign in again.");
    }

    response = await runFetch();
  }

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  if (!response.body) {
    throw new Error("Streaming is not supported in this browser.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });

    let newlineIndex = buffer.indexOf("\n");
    while (newlineIndex >= 0) {
      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);

      if (line) {
        onEvent(JSON.parse(line) as StreamEvent);
      }

      newlineIndex = buffer.indexOf("\n");
    }
  }

  if (buffer.trim()) {
    onEvent(JSON.parse(buffer.trim()) as StreamEvent);
  }
}

export const tokenStore = {
  get() {
    return accessToken;
  },
  set(token: string | null) {
    setTokenStorage(token);
  },
  clear() {
    setTokenStorage(null);
  }
};

export const authApi = {
  async register(payload: { email: string; password: string; name?: string }) {
    try {
      const response = await http.post<AuthResponse>("/auth/register", payload);
      setTokenStorage(response.data.accessToken);
      return response.data;
    } catch (error) {
      throw toError(error);
    }
  },

  async login(payload: { email: string; password: string }) {
    try {
      const response = await http.post<AuthResponse>("/auth/login", payload);
      setTokenStorage(response.data.accessToken);
      return response.data;
    } catch (error) {
      throw toError(error);
    }
  },

  async refresh() {
    const token = await refreshAccessToken();
    return token;
  },

  async logout() {
    try {
      await requestWithRetry<{ success: boolean }>({
        method: "POST",
        url: "/auth/logout"
      });
    } finally {
      setTokenStorage(null);
    }
  }
};

export const userApi = {
  getMe() {
    return requestWithRetry<User>({
      method: "GET",
      url: "/users/me"
    });
  },

  updateProfile(payload: { name?: string; email?: string }) {
    return requestWithRetry<{ user: User }>({
      method: "PATCH",
      url: "/users/me",
      data: payload
    });
  },

  updatePassword(payload: { currentPassword: string; newPassword: string }) {
    return requestWithRetry<{ success: boolean }>({
      method: "PATCH",
      url: "/users/me/password",
      data: payload
    });
  }
};

export const settingsApi = {
  get() {
    return requestWithRetry<Settings>({
      method: "GET",
      url: "/settings"
    });
  },

  setApiKey(apiKey: string) {
    return requestWithRetry<{ success: boolean }>({
      method: "PUT",
      url: "/settings/api-key",
      data: { apiKey }
    });
  },

  removeApiKey() {
    return requestWithRetry<{ success: boolean }>({
      method: "DELETE",
      url: "/settings/api-key"
    });
  },

  updatePreferences(payload: { preferredModel?: string; systemPrompt?: string | null; theme?: "dark" | "light" }) {
    return requestWithRetry<{ settings: Settings }>({
      method: "PATCH",
      url: "/settings/preferences",
      data: payload
    });
  }
};

export const conversationApi = {
  list() {
    return requestWithRetry<{ conversations: ConversationSummary[] }>({
      method: "GET",
      url: "/conversations"
    });
  },

  create(title?: string) {
    return requestWithRetry<{ conversation: { id: string; title: string } }>({
      method: "POST",
      url: "/conversations",
      data: title ? { title } : {}
    });
  },

  getMessages(conversationId: string) {
    return requestWithRetry<ConversationMessagesResponse>({
      method: "GET",
      url: `/conversations/${conversationId}/messages`
    });
  },

  rename(conversationId: string, title: string) {
    return requestWithRetry<{ success: boolean }>({
      method: "PATCH",
      url: `/conversations/${conversationId}`,
      data: { title }
    });
  },

  delete(conversationId: string) {
    return requestWithRetry<{ success: boolean }>({
      method: "DELETE",
      url: `/conversations/${conversationId}`
    });
  },

  async exportMarkdown(conversationId: string) {
    const response = await fetch(`${API_URL}/conversations/${conversationId}/export?format=markdown`, {
      method: "GET",
      credentials: "include",
      headers: {
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
      }
    });

    if (!response.ok) {
      throw new Error(await parseErrorResponse(response));
    }

    return response.text();
  },

  async exportJson(conversationId: string) {
    return requestWithRetry({
      method: "GET",
      url: `/conversations/${conversationId}/export?format=json`
    });
  }
};

export const chatApi = {
  streamMessage(
    conversationId: string,
    payload: { message: string; model?: string; attachments?: Array<{ name: string; mimeType: string; data: string }> },
    onEvent: (event: StreamEvent) => void
  ) {
    return streamNdjson(`/chat/conversations/${conversationId}/stream`, payload, onEvent);
  },

  regenerate(
    conversationId: string,
    assistantMessageId: string,
    payload: { model?: string },
    onEvent: (event: StreamEvent) => void
  ) {
    return streamNdjson(
      `/chat/conversations/${conversationId}/regenerate/${assistantMessageId}/stream`,
      payload,
      onEvent
    );
  }
};

export const analyticsApi = {
  getUsage() {
    return requestWithRetry<{ usage: UsagePoint[] }>({
      method: "GET",
      url: "/analytics/usage"
    });
  }
};
