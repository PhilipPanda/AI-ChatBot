import { prisma } from "../lib/prisma.js";

function getUtcDayStart(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export async function incrementUsage(userId: string, totalTokens: number) {
  const day = getUtcDayStart();

  await prisma.usageDaily.upsert({
    where: {
      userId_date: {
        userId,
        date: day
      }
    },
    update: {
      requests: { increment: 1 },
      totalTokens: { increment: totalTokens }
    },
    create: {
      userId,
      date: day,
      requests: 1,
      totalTokens
    }
  });
}

export async function getUsage(userId: string, days = 30) {
  const now = new Date();
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  return prisma.usageDaily.findMany({
    where: {
      userId,
      date: {
        gte: since
      }
    },
    orderBy: {
      date: "asc"
    }
  });
}
