import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import { createServer } from "./server.js";

async function bootstrap() {
  const app = createServer();

  const server = app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`[api] listening on http://localhost:${env.PORT}`);
  });

  const shutdown = async () => {
    // eslint-disable-next-line no-console
    console.log("[api] shutting down");
    server.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

bootstrap().catch(async (error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start API", error);
  await prisma.$disconnect();
  process.exit(1);
});
