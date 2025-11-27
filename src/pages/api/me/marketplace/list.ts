// src/pages/api/marketplace/list.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../../server/db";
import { getOrCreateUserFromRequest } from "../../../../server/auth";

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

  const { tokenAddress, tokenId, priceGems } = req.body;

  if (
    !tokenAddress ||
    typeof tokenAddress !== "string" ||
    !tokenId ||
    typeof tokenId !== "string" ||
    typeof priceGems !== "number" ||
    priceGems <= 0
  ) {
    return res.status(400).json({ error: "Invalid body" });
  }

  const normalizedToken = tokenAddress.toLowerCase();

  // TODO (opsiyonel): Burada on-chain kontrol yapılabilir:
  // NftVault'ta gerçekten bu NFT emanet mi?

  // Önce NftAsset kaydını bul / oluştur
  const nftAsset = await prisma.nftAsset.upsert({
    where: {
      // composite unique key kullanmak daha temiz olur; şimdilik id üzerinden çözmek için
      // "chain + contractAddress + tokenId" için unique index tanımlayabilirsin schema'da.
      // Burada basit tutuyoruz:
      id: `${normalizedToken}-${tokenId}`,
    },
    update: {},
    create: {
      id: `${normalizedToken}-${tokenId}`,
      chain: "base",
      contractAddress: normalizedToken,
      tokenId,
    },
  });

  const listing = await prisma.nftListing.create({
    data: {
      nftId: nftAsset.id,
      sellerId: user.id,
      currency: "GEMS",
      priceGems,
    },
  });

  return res.status(200).json({
    listing,
  });
}
