// src/pages/api/me/balance.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../server/db";
import { getOrCreateUserFromRequest } from "../../../server/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end("Method Not Allowed");
  }

  const user = await getOrCreateUserFromRequest(req, res);
  if (!user) return; // hata zaten dönüldü

  const balance = await prisma.userBalance.findUnique({
    where: { userId: user.id },
  });

  return res.status(200).json({
    walletAddress: user.walletAddress,
    gems: balance?.gems ?? 0,
  });
}
