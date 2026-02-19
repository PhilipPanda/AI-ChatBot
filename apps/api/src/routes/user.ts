import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.js";
import { hashPassword, verifyPassword } from "../utils/password.js";

export const userRouter = Router();

userRouter.use(authenticate);

const profileSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  email: z.string().email().transform((value) => value.toLowerCase()).optional()
});

const passwordSchema = z.object({
  currentPassword: z.string().min(8).max(128),
  newPassword: z.string().min(8).max(128)
});

userRouter.get("/me", async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.auth!.id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        preferredModel: true,
        theme: true,
        systemPrompt: true,
        openaiApiKeyEnc: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { openaiApiKeyEnc, ...safeUser } = user;

    return res.json({
      ...safeUser,
      hasApiKey: Boolean(openaiApiKeyEnc)
    });
  } catch (error) {
    return next(error);
  }
});

userRouter.patch("/me", async (req, res, next) => {
  try {
    const payload = profileSchema.parse(req.body);

    if (payload.email) {
      const existing = await prisma.user.findFirst({
        where: {
          email: payload.email,
          id: {
            not: req.auth!.id
          }
        },
        select: { id: true }
      });

      if (existing) {
        return res.status(409).json({ error: "Email already in use" });
      }
    }

    const user = await prisma.user.update({
      where: { id: req.auth!.id },
      data: payload,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        preferredModel: true,
        theme: true,
        systemPrompt: true
      }
    });

    return res.json({ user });
  } catch (error) {
    return next(error);
  }
});

userRouter.patch("/me/password", async (req, res, next) => {
  try {
    const payload = passwordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: req.auth!.id },
      select: { id: true, passwordHash: true }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const valid = await verifyPassword(payload.currentPassword, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await hashPassword(payload.newPassword)
      }
    });

    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});
