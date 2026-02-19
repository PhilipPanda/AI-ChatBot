import { Router } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { decryptSecret, encryptSecret } from "../lib/crypto.js";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.js";

export const settingsRouter = Router();

settingsRouter.use(authenticate);

const apiKeySchema = z.object({
  apiKey: z.string().min(20)
});

const preferencesSchema = z.object({
  preferredModel: z.string().min(2).max(64).optional(),
  systemPrompt: z.string().max(4000).nullable().optional(),
  theme: z.enum(["dark", "light"]).optional()
});

settingsRouter.get("/", async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.auth!.id },
      select: {
        preferredModel: true,
        systemPrompt: true,
        theme: true,
        openaiApiKeyEnc: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({
      preferredModel: user.preferredModel,
      systemPrompt: user.systemPrompt,
      theme: user.theme,
      hasApiKey: Boolean(user.openaiApiKeyEnc)
    });
  } catch (error) {
    return next(error);
  }
});

settingsRouter.put("/api-key", async (req, res, next) => {
  try {
    const payload = apiKeySchema.parse(req.body);

    if (!payload.apiKey.startsWith("sk-")) {
      return res.status(400).json({ error: "Invalid OpenAI API key format" });
    }

    const encrypted = encryptSecret(payload.apiKey);

    await prisma.user.update({
      where: { id: req.auth!.id },
      data: { openaiApiKeyEnc: encrypted }
    });

    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

settingsRouter.get("/api-key/preview", async (req, res, next) => {
  try {
    if (env.NODE_ENV === "production") {
      return res.status(404).json({ error: "Not found" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.auth!.id },
      select: { openaiApiKeyEnc: true }
    });

    if (!user?.openaiApiKeyEnc) {
      return res.json({ apiKeyPreview: null });
    }

    const decrypted = decryptSecret(user.openaiApiKeyEnc);
    return res.json({
      apiKeyPreview: `${decrypted.slice(0, 6)}...${decrypted.slice(-4)}`
    });
  } catch (error) {
    return next(error);
  }
});

settingsRouter.delete("/api-key", async (req, res, next) => {
  try {
    await prisma.user.update({
      where: { id: req.auth!.id },
      data: { openaiApiKeyEnc: null }
    });

    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

settingsRouter.patch("/preferences", async (req, res, next) => {
  try {
    const payload = preferencesSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.auth!.id },
      data: {
        preferredModel: payload.preferredModel,
        systemPrompt: payload.systemPrompt === "" ? null : payload.systemPrompt,
        theme: payload.theme
      },
      select: {
        preferredModel: true,
        systemPrompt: true,
        theme: true
      }
    });

    return res.json({ settings: user });
  } catch (error) {
    return next(error);
  }
});
