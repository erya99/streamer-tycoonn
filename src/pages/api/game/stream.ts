// src/pages/api/game/stream.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../server/db";
import { getOrCreateUserFromRequest } from "../../../server/auth";
import { getOrCreateChannelForUser } from "../../../server/game/channel";
import {
  simulateStream,
  CONTENT_TYPES,
  type ContentType,
} from "../../../server/game/simulate";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const user = await getOrCreateUserFromRequest(req, res);
  if (!user) return;

  const { contentType, durationMinutes, title } = req.body;

  // contentType kontrolü
  if (!contentType || typeof contentType !== "string") {
    return res.status(400).json({ error: "contentType gerekli" });
  }

  if (!CONTENT_TYPES.includes(contentType as ContentType)) {
    return res.status(400).json({ error: "Geçersiz contentType" });
  }

  // süre kontrolü
  const duration = Number(durationMinutes);
  if (!duration || duration <= 0) {
    return res
      .status(400)
      .json({ error: "durationMinutes pozitif sayı olmalı" });
  }

  const safeTitle =
    typeof title === "string" && title.trim().length > 0
      ? title.trim().slice(0, 120)
      : "Yayın";

  const channel = await getOrCreateChannelForUser(user.id);

  const sim = simulateStream({
    followers: channel.followers,
    avgViewers: channel.avgViewers,
    hype: channel.hype,
    setupLevel: channel.setupLevel,
    reputation: channel.reputation,
    contentType: contentType as ContentType,
    durationMinutes: duration,
  });

  // Ortalama izleyici (kabaca smoothing)
  const newAvgViewers = Math.round(
    (channel.avgViewers * 4 + sim.views / (duration / 10)) / 5
  );

  const newFollowers = channel.followers + sim.newFollowers;
  const newHype = channel.hype + sim.hypeGain;
  const newReputation = Math.min(
    1000,
    channel.reputation + Math.floor(sim.views / 1000)
  );

  // DB transaction: session oluştur + channel güncelle
  const [session, updatedChannel] = await prisma.$transaction([
    prisma.streamSession.create({
      data: {
        channelId: channel.id,
        contentType: contentType as any, // ContentType enum'u DB tarafında string olarak saklanıyor
        title: safeTitle,
        durationMinutes: duration,
        resultViews: sim.views,
        resultNewFollowers: sim.newFollowers,
        resultCoinsEarned: sim.coinsEarned,
        resultHypeGain: sim.hypeGain,
        startedAt: new Date(),
        endedAt: new Date(),
      },
    }),
    prisma.channel.update({
      where: { id: channel.id },
      data: {
        followers: newFollowers,
        avgViewers: newAvgViewers,
        hype: newHype,
        reputation: newReputation,
      },
    }),
  ]);

  return res.status(200).json({
    session,
    channel: updatedChannel,
  });
}
