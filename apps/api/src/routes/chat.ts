import { MessageRole } from "@prisma/client";
import { Router } from "express";
import type { Response } from "express";
import { z } from "zod";
import { decryptSecret } from "../lib/crypto.js";
import { createOpenAIClient } from "../lib/openai.js";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.js";
import { chatLimiter } from "../middleware/rateLimit.js";
import { incrementUsage } from "../services/usage.service.js";
import { writeNdjson } from "../utils/ndjson.js";

type OpenAIContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string; detail?: "low" | "high" | "auto" } };

type OpenAIMessage = {
  role: "system" | "user" | "assistant";
  content: string | OpenAIContentPart[];
};

type Attachment = {
  name: string;
  mimeType: string;
  data: string;
};

export const chatRouter = Router();

chatRouter.use(authenticate);

const attachmentSchema = z.object({
  name: z.string(),
  mimeType: z.string(),
  data: z.string()
});

const streamPayloadSchema = z.object({
  message: z.string().min(1).max(10000),
  model: z.string().min(2).max(64).optional(),
  attachments: z.array(attachmentSchema).max(10).optional()
});

const regeneratePayloadSchema = z.object({
  model: z.string().min(2).max(64).optional()
});

function autoTitleFromMessage(input: string) {
  return input.trim().replace(/\s+/g, " ").slice(0, 60) || "New conversation";
}

function paramAsString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function buildVisionContent(text: string, attachments: Attachment[]): OpenAIContentPart[] {
  const parts: OpenAIContentPart[] = [{ type: "text", text }];

  for (const attachment of attachments) {
    if (attachment.mimeType.startsWith("image/")) {
      parts.push({
        type: "image_url",
        image_url: {
          url: `data:${attachment.mimeType};base64,${attachment.data}`,
          detail: "auto"
        }
      });
    } else {
      parts.push({
        type: "text",
        text: `\n\n[Attached file: ${attachment.name}]\n\`\`\`\n${Buffer.from(attachment.data, "base64").toString("utf-8")}\n\`\`\``
      });
    }
  }

  return parts;
}

function toOpenAIMessages(
  messages: Array<{ role: MessageRole; content: string }>,
  systemPrompt?: string | null,
  lastUserAttachments?: Attachment[]
) {
  const openAiMessages: OpenAIMessage[] = [];

  if (systemPrompt?.trim()) {
    openAiMessages.push({
      role: "system",
      content: systemPrompt.trim()
    });
  }

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    const isLastUser = message.role === MessageRole.user && i === messages.length - 1;

    if (message.role === MessageRole.user) {
      if (isLastUser && lastUserAttachments && lastUserAttachments.length > 0) {
        openAiMessages.push({
          role: "user",
          content: buildVisionContent(message.content, lastUserAttachments)
        });
      } else {
        openAiMessages.push({ role: "user", content: message.content });
      }
    }

    if (message.role === MessageRole.assistant) {
      openAiMessages.push({ role: "assistant", content: message.content });
    }

    if (message.role === MessageRole.system) {
      openAiMessages.push({ role: "system", content: message.content });
    }
  }

  return openAiMessages;
}

function prepareStream(res: Response) {
  res.status(200);
  res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");

  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  }
}

async function runStreamingCompletion({
  res,
  apiKey,
  model,
  messages
}: {
  res: Response;
  apiKey: string;
  model: string;
  messages: OpenAIMessage[];
}) {
  const client = createOpenAIClient(apiKey);

  const stream = await client.chat.completions.create({
    model,
    messages,
    stream: true,
    stream_options: {
      include_usage: true
    }
  });

  let assistantText = "";
  let promptTokens = 0;
  let completionTokens = 0;
  let totalTokens = 0;

  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content ?? "";
    if (token) {
      assistantText += token;
      writeNdjson(res, { type: "token", token });
    }

    if (chunk.usage) {
      promptTokens = chunk.usage.prompt_tokens ?? promptTokens;
      completionTokens = chunk.usage.completion_tokens ?? completionTokens;
      totalTokens = chunk.usage.total_tokens ?? totalTokens;
    }
  }

  return {
    assistantText,
    promptTokens,
    completionTokens,
    totalTokens
  };
}

chatRouter.post("/conversations/:conversationId/stream", chatLimiter, async (req, res, next) => {
  try {
    const payload = streamPayloadSchema.parse(req.body);
    const conversationId = paramAsString(req.params.conversationId);

    if (!conversationId) {
      return res.status(400).json({ error: "Missing conversation id" });
    }

    const [user, conversation] = await Promise.all([
      prisma.user.findUnique({
        where: { id: req.auth!.id },
        select: {
          openaiApiKeyEnc: true,
          preferredModel: true,
          systemPrompt: true
        }
      }),
      prisma.conversation.findFirst({
        where: {
          id: conversationId,
          userId: req.auth!.id
        },
        select: {
          id: true,
          title: true
        }
      })
    ]);

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    if (!user?.openaiApiKeyEnc) {
      return res.status(400).json({ error: "OpenAI API key not configured" });
    }

    const initialMessageCount = await prisma.message.count({
      where: {
        conversationId: conversation.id
      }
    });

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: MessageRole.user,
        content: payload.message
      }
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        updatedAt: new Date(),
        ...(initialMessageCount === 0 && conversation.title === "New conversation"
          ? { title: autoTitleFromMessage(payload.message) }
          : {})
      }
    });

    const fullHistory = await prisma.message.findMany({
      where: {
        conversationId: conversation.id
      },
      orderBy: {
        createdAt: "asc"
      },
      select: {
        role: true,
        content: true
      }
    });

    prepareStream(res);

    const model = payload.model ?? user.preferredModel;
    const apiKey = decryptSecret(user.openaiApiKeyEnc);

    const attachments = payload.attachments ?? [];

    const completion = await runStreamingCompletion({
      res,
      apiKey,
      model,
      messages: toOpenAIMessages(fullHistory, user.systemPrompt, attachments)
    });

    if (!completion.assistantText.trim()) {
      writeNdjson(res, { type: "error", error: "Model returned an empty response" });
      return res.end();
    }

    const assistantMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: MessageRole.assistant,
        content: completion.assistantText,
        model,
        promptTokens: completion.promptTokens,
        completionTokens: completion.completionTokens,
        totalTokens: completion.totalTokens
      }
    });

    await Promise.all([
      prisma.conversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() }
      }),
      incrementUsage(req.auth!.id, completion.totalTokens)
    ]);

    writeNdjson(res, {
      type: "done",
      message: assistantMessage
    });

    return res.end();
  } catch (error) {
    if (!res.headersSent) {
      return next(error);
    }

    writeNdjson(res, {
      type: "error",
      error: error instanceof Error ? error.message : "Failed to stream response"
    });
    return res.end();
  }
});

chatRouter.post(
  "/conversations/:conversationId/regenerate/:assistantMessageId/stream",
  chatLimiter,
  async (req, res, next) => {
    try {
      const payload = regeneratePayloadSchema.parse(req.body ?? {});
      const conversationId = paramAsString(req.params.conversationId);
      const assistantMessageId = paramAsString(req.params.assistantMessageId);

      if (!conversationId || !assistantMessageId) {
        return res.status(400).json({ error: "Missing route parameters" });
      }

      const [user, conversation, targetAssistant] = await Promise.all([
        prisma.user.findUnique({
          where: { id: req.auth!.id },
          select: {
            openaiApiKeyEnc: true,
            preferredModel: true,
            systemPrompt: true
          }
        }),
        prisma.conversation.findFirst({
          where: {
            id: conversationId,
            userId: req.auth!.id
          },
          select: { id: true }
        }),
        prisma.message.findFirst({
          where: {
            id: assistantMessageId,
            conversationId,
            role: MessageRole.assistant
          },
          select: {
            id: true,
            createdAt: true
          }
        })
      ]);

      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      if (!targetAssistant) {
        return res.status(404).json({ error: "Assistant message not found" });
      }

      if (!user?.openaiApiKeyEnc) {
        return res.status(400).json({ error: "OpenAI API key not configured" });
      }

      const contextMessages = await prisma.message.findMany({
        where: {
          conversationId: conversation.id,
          createdAt: {
            lt: targetAssistant.createdAt
          }
        },
        orderBy: {
          createdAt: "asc"
        },
        select: {
          role: true,
          content: true
        }
      });

      if (!contextMessages.length || !contextMessages.some((message) => message.role === MessageRole.user)) {
        return res.status(400).json({ error: "No user context to regenerate from" });
      }

      await prisma.message.delete({
        where: {
          id: targetAssistant.id
        }
      });

      prepareStream(res);

      const model = payload.model ?? user.preferredModel;
      const apiKey = decryptSecret(user.openaiApiKeyEnc);

      const completion = await runStreamingCompletion({
        res,
        apiKey,
        model,
        messages: toOpenAIMessages(contextMessages, user.systemPrompt)
      });

      if (!completion.assistantText.trim()) {
        writeNdjson(res, { type: "error", error: "Model returned an empty response" });
        return res.end();
      }

      const assistantMessage = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: MessageRole.assistant,
          content: completion.assistantText,
          model,
          promptTokens: completion.promptTokens,
          completionTokens: completion.completionTokens,
          totalTokens: completion.totalTokens
        }
      });

      await Promise.all([
        prisma.conversation.update({
          where: { id: conversation.id },
          data: { updatedAt: new Date() }
        }),
        incrementUsage(req.auth!.id, completion.totalTokens)
      ]);

      writeNdjson(res, {
        type: "done",
        replacedMessageId: targetAssistant.id,
        message: assistantMessage
      });

      return res.end();
    } catch (error) {
      if (!res.headersSent) {
        return next(error);
      }

      writeNdjson(res, {
        type: "error",
        error: error instanceof Error ? error.message : "Failed to stream response"
      });
      return res.end();
    }
  }
);
