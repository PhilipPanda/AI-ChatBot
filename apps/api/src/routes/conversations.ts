import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.js";

export const conversationRouter = Router();

conversationRouter.use(authenticate);

const createConversationSchema = z.object({
  title: z.string().min(1).max(120).optional()
});

const renameConversationSchema = z.object({
  title: z.string().min(1).max(120)
});

conversationRouter.get("/", async (req, res, next) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: { userId: req.auth!.id },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            role: true,
            content: true,
            createdAt: true
          }
        },
        _count: {
          select: { messages: true }
        }
      }
    });

    return res.json({
      conversations: conversations.map((conversation) => ({
        id: conversation.id,
        title: conversation.title,
        updatedAt: conversation.updatedAt,
        messageCount: conversation._count.messages,
        lastMessage: conversation.messages[0] ?? null
      }))
    });
  } catch (error) {
    return next(error);
  }
});

conversationRouter.post("/", async (req, res, next) => {
  try {
    const payload = createConversationSchema.parse(req.body ?? {});

    const conversation = await prisma.conversation.create({
      data: {
        userId: req.auth!.id,
        title: payload.title ?? "New conversation"
      }
    });

    return res.status(201).json({ conversation });
  } catch (error) {
    return next(error);
  }
});

conversationRouter.get("/:conversationId/messages", async (req, res, next) => {
  try {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: req.params.conversationId,
        userId: req.auth!.id
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" }
        }
      }
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    return res.json({
      conversation: {
        id: conversation.id,
        title: conversation.title,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt
      },
      messages: conversation.messages
    });
  } catch (error) {
    return next(error);
  }
});

conversationRouter.patch("/:conversationId", async (req, res, next) => {
  try {
    const payload = renameConversationSchema.parse(req.body);

    const updated = await prisma.conversation.updateMany({
      where: {
        id: req.params.conversationId,
        userId: req.auth!.id
      },
      data: {
        title: payload.title
      }
    });

    if (updated.count === 0) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

conversationRouter.delete("/:conversationId", async (req, res, next) => {
  try {
    const deleted = await prisma.conversation.deleteMany({
      where: {
        id: req.params.conversationId,
        userId: req.auth!.id
      }
    });

    if (deleted.count === 0) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

conversationRouter.get("/:conversationId/export", async (req, res, next) => {
  try {
    const format = z.enum(["json", "markdown"]).parse((req.query.format as string | undefined) ?? "markdown");

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: req.params.conversationId,
        userId: req.auth!.id
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" }
        }
      }
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    if (format === "json") {
      return res.json({
        id: conversation.id,
        title: conversation.title,
        exportedAt: new Date().toISOString(),
        messages: conversation.messages
      });
    }

    const markdown = [
      `# ${conversation.title}`,
      "",
      ...conversation.messages.map((message) => `## ${message.role}\n\n${message.content}\n`)
    ].join("\n");

    res.setHeader("Content-Type", "text/markdown; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=conversation-${conversation.id}.md`);
    return res.send(markdown);
  } catch (error) {
    return next(error);
  }
});
