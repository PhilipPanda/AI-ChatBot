import crypto from "crypto";
import { env } from "../config/env.js";

const ALGO = "aes-256-gcm";

function deriveEncryptionKey() {
  const raw = env.ENCRYPTION_KEY;
  if (/^[A-Za-z0-9+/=]+$/.test(raw) && raw.length >= 44) {
    const decoded = Buffer.from(raw, "base64");
    if (decoded.length === 32) {
      return decoded;
    }
  }

  return crypto.createHash("sha256").update(raw).digest();
}

const key = deriveEncryptionKey();

export function encryptSecret(plainText: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${iv.toString("base64")}.${tag.toString("base64")}.${encrypted.toString("base64")}`;
}

export function decryptSecret(encoded: string) {
  const [ivB64, tagB64, encryptedB64] = encoded.split(".");
  if (!ivB64 || !tagB64 || !encryptedB64) {
    throw new Error("Invalid encrypted payload format");
  }

  const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedB64, "base64")),
    decipher.final()
  ]);

  return decrypted.toString("utf8");
}
