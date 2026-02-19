import { Router, type Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authLimiter } from "../middleware/rateLimit.js";
import {
  clearRefreshCookieConfig,
  generateRefreshToken,
  getRefreshCookieName,
  persistRefreshToken,
  refreshCookieConfig,
  revokeRefreshToken,
  rotateRefreshToken
} from "../services/refreshToken.service.js";
import { signAccessToken } from "../utils/jwt.js";
import { hashPassword, verifyPassword } from "../utils/password.js";

export const authRouter = Router();

const authBodySchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128)
});

const registerSchema = authBodySchema.extend({
  name: z.string().min(2).max(80).optional()
});

type SafeUser = {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
};

function mapUser(user: SafeUser) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt
  };
}

async function issueTokens(user: SafeUser, res: Response) {
  const accessToken = signAccessToken({
    userId: user.id,
    email: user.email
  });

  const refreshToken = generateRefreshToken();
  const expiresAt = await persistRefreshToken(user.id, refreshToken);
  res.cookie(getRefreshCookieName(), refreshToken, refreshCookieConfig(expiresAt));

  return accessToken;
}

authRouter.post("/register", authLimiter, async (req, res, next) => {
  try {
    const payload = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({
      where: { email: payload.email }
    });

    if (existing) {
      return res.status(409).json({ error: "Email already in use" });
    }

    const user = await prisma.user.create({
      data: {
        email: payload.email,
        passwordHash: await hashPassword(payload.password),
        name: payload.name
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    });

    const accessToken = await issueTokens(user, res);

    return res.status(201).json({
      user: mapUser(user),
      accessToken
    });
  } catch (error) {
    return next(error);
  }
});

authRouter.post("/login", authLimiter, async (req, res, next) => {
  try {
    const payload = authBodySchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        createdAt: true
      }
    });

    if (!user || !(await verifyPassword(payload.password, user.passwordHash))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt
    };

    const accessToken = await issueTokens(safeUser, res);

    return res.json({
      user: mapUser(safeUser),
      accessToken
    });
  } catch (error) {
    return next(error);
  }
});

authRouter.post("/refresh", async (req, res, next) => {
  try {
    const refreshToken = req.cookies[getRefreshCookieName()];
    if (!refreshToken) {
      return res.status(401).json({ error: "Missing refresh token" });
    }

    const rotated = await rotateRefreshToken(refreshToken);
    if (!rotated) {
      res.clearCookie(getRefreshCookieName(), clearRefreshCookieConfig());
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const accessToken = signAccessToken({
      userId: rotated.user.id,
      email: rotated.user.email
    });

    res.cookie(getRefreshCookieName(), rotated.refreshToken, refreshCookieConfig(rotated.expiresAt));

    return res.json({
      accessToken,
      user: mapUser(rotated.user)
    });
  } catch (error) {
    return next(error);
  }
});

authRouter.post("/logout", async (req, res, next) => {
  try {
    const refreshToken = req.cookies[getRefreshCookieName()];
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    res.clearCookie(getRefreshCookieName(), clearRefreshCookieConfig());

    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});
