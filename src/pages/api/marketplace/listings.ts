// src/pages/api/marketplace/listings.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../server/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end("Method Not Allowed");
  }

  const listings = await prisma.nftListing.findMany({
    where: {
      status: "ACTIVE",
      currency: "GEMS",
    },
    include: {
      nft: true,
      seller: {
        select: {
          walletAddress: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return res.status(200).json({ listings });
}
