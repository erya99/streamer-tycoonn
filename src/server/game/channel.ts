// src/server/game/channel.ts
import { prisma } from "../db";

export async function getOrCreateChannelForUser(userId: string) {
  let channel = await prisma.channel.findUnique({
    where: { userId },
  });

  if (!channel) {
    // Basit default isim: "Streamer-XXXX"
    const suffix = userId.slice(0, 4).toUpperCase();
    channel = await prisma.channel.create({
      data: {
        userId,
        name: `Streamer-${suffix}`,
        followers: 0,
        avgViewers: 0,
        hype: 0,
        setupLevel: 1,
        reputation: 0,
      },
    });
  }

  return channel;
}

export async function getRecentSessions(channelId: string, limit = 5) {
  const sessions = await prisma.streamSession.findMany({
    where: { channelId },
    orderBy: { startedAt: "desc" },
    take: limit,
  });

  return sessions;
}
