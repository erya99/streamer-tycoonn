// src/pages/api/game/channel.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getOrCreateUserFromRequest } from "../../../server/auth";
import { getOrCreateChannelForUser, getRecentSessions } from "../../../server/game/channel";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end("Method Not Allowed");
  }

  const user = await getOrCreateUserFromRequest(req, res);
  if (!user) return;

  const channel = await getOrCreateChannelForUser(user.id);
  const sessions = await getRecentSessions(channel.id, 5);

  return res.status(200).json({
    channel,
    recentSessions: sessions,
  });
}
