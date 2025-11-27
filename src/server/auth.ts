// src/server/auth.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "./db";

function normalizeAddress(addr: string): string {
  return addr.toLowerCase();
}

export async function getOrCreateUserFromRequest(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const walletAddress = req.headers["x-wallet-address"];

  if (!walletAddress || typeof walletAddress !== "string") {
    res.status(401).json({ error: "Missing x-wallet-address header" });
    return null;
  }

  const normalized = normalizeAddress(walletAddress);

  // Basit bir doğrulama, istersen ethers.utils.isAddress ile sertleştirebilirsin.
  if (!normalized.startsWith("0x") || normalized.length < 10) {
    res.status(400).json({ error: "Invalid wallet address" });
    return null;
  }

  let user = await prisma.user.findUnique({
    where: { walletAddress: normalized },
    include: { balance: true },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        walletAddress: normalized,
        balance: {
          create: {
            gems: 0,
          },
        },
      },
      include: { balance: true },
    });
  } else if (!user.balance) {
    await prisma.userBalance.create({
      data: { userId: user.id, gems: 0 },
    });
    user = await prisma.user.findUnique({
      where: { walletAddress: normalized },
      include: { balance: true },
    }) as typeof user;
  }

  return user;
}
