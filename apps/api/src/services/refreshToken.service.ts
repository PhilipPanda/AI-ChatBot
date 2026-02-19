import crypto from "crypto";
import { env, isProduction } from "../config/env.js";
import { prisma } from "../lib/prisma.js";

const REFRESH_COOKIE_NAME = "refresh_token";

export function getRefreshCookieName() {
  return REFRESH_COOKIE_NAME;
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateRefreshToken() {
  return crypto.randomBytes(48).toString("base64url");
}

export async function persistRefreshToken(userId: string, rawToken: string) {
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(rawToken),
      expiresAt
    }
  });

  return expiresAt;
}

export function refreshCookieConfig(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
    domain: env.COOKIE_DOMAIN || undefined
  };
}

export function clearRefreshCookieConfig() {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
    domain: env.COOKIE_DOMAIN || undefined
  };
}

export async function revokeRefreshToken(rawToken: string) {
  const tokenHash = hashToken(rawToken);

  await prisma.refreshToken.updateMany({
    where: {
      tokenHash,
      revokedAt: null
    },
    data: {
      revokedAt: new Date()
    }
  });
}

export async function rotateRefreshToken(rawToken: string) {
  const tokenHash = hashToken(rawToken);

  const record = await prisma.refreshToken.findFirst({
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: {
        gt: new Date()
      }
    },
    include: {
      user: true
    }
  });

  if (!record) {
    return null;
  }

  await prisma.refreshToken.update({
    where: { id: record.id },
    data: {
      revokedAt: new Date()
    }
  });

  const newRawToken = generateRefreshToken();
  const expiresAt = await persistRefreshToken(record.userId, newRawToken);

  return {
    user: record.user,
    refreshToken: newRawToken,
    expiresAt
  };
}
