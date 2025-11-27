// src/pages/api/marketplace/buy.ts
import type { NextApiRequest, NextApiResponse } from "next";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../../server/db";
import { getOrCreateUserFromRequest } from "../../../server/auth";
import { nftVault } from "../../../server/web3/nftVault";

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

  const { listingId } = req.body;

  if (!listingId || typeof listingId !== "string") {
    return res.status(400).json({ error: "Invalid body" });
  }

  const listing = await prisma.nftListing.findUnique({
    where: { id: listingId },
    include: {
      nft: true,
      seller: true,
    },
  });

  if (!listing) {
    return res.status(404).json({ error: "Listing not found" });
  }

  if (listing.status !== "ACTIVE") {
    return res.status(400).json({ error: "Listing is not active" });
  }

  if (listing.currency !== "GEMS" || !listing.priceGems) {
    return res.status(400).json({ error: "Listing is not in GEMS" });
  }

  if (listing.sellerId === user.id) {
    return res.status(400).json({ error: "Cannot buy your own listing" });
  }

  const buyerBalance = await prisma.userBalance.findUnique({
    where: { userId: user.id },
  });

  if (!buyerBalance || buyerBalance.gems < listing.priceGems) {
    return res.status(400).json({ error: "Not enough gems" });
  }

  // 1) Önce on-chain transfer (NftVault -> buyer)
  try {
    const tx = await nftVault.transferOnSale(
      listing.nft.contractAddress,
      listing.nft.tokenId,
      user.walletAddress
    );

    await tx.wait();
  } catch (err) {
    console.error("NftVault transferOnSale failed:", err);
    return res
      .status(500)
      .json({ error: "On-chain transfer failed" });
  }

  // 2) Transfer başarılı ise DB'de elmasları ve listing durumunu güncelle
  try {
    const updated = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // Buyer bakiyesini tekrar oku (race condition güvenliği için)
        const freshBuyerBalance = await tx.userBalance.findUnique({
          where: { userId: user.id },
        });

        if (
          !freshBuyerBalance ||
          freshBuyerBalance.gems < listing.priceGems!
        ) {
          throw new Error("Buyer gems balance changed");
        }

        await tx.userBalance.update({
          where: { userId: user.id },
          data: {
            gems: { decrement: listing.priceGems! },
          },
        });

        await tx.userBalance.update({
          where: { userId: listing.sellerId },
          data: {
            gems: { increment: listing.priceGems! },
          },
        });

        const updatedListing = await tx.nftListing.update({
          where: { id: listing.id },
          data: {
            status: "SOLD",
            closedAt: new Date(),
          },
        });

        return updatedListing;
      }
    );

    return res.status(200).json({ listing: updated });
  } catch (err) {
    console.error(
      "DB transaction failed after on-chain transfer:",
      err
    );
    return res
      .status(500)
      .json({ error: "Database update failed" });
  }
}
