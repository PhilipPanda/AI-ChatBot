import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { generalLimiter } from "./middleware/rateLimit.js";
import { analyticsRouter } from "./routes/analytics.js";
import { authRouter } from "./routes/auth.js";
import { chatRouter } from "./routes/chat.js";
import { conversationRouter } from "./routes/conversations.js";
import { healthRouter } from "./routes/health.js";
import { settingsRouter } from "./routes/settings.js";
import { userRouter } from "./routes/user.js";

export function createServer() {
  const app = express();

  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true
    })
  );

  app.use(
    helmet({
      crossOriginResourcePolicy: false
    })
  );

  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
  app.use(generalLimiter);
  app.use(cookieParser());
  app.use(express.json({ limit: "20mb" }));

  app.use("/api/health", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/users", userRouter);
  app.use("/api/settings", settingsRouter);
  app.use("/api/conversations", conversationRouter);
  app.use("/api/chat", chatRouter);
  app.use("/api/analytics", analyticsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
