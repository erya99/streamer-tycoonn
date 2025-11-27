// src/server/listeners/gemsListener.ts
import { ethers } from "ethers";
import type { Prisma } from "@prisma/client";
import { prisma } from "../db";
import { ENV } from "../config/env";
// GemTreasury ABI'yi buraya koymuştuk
import GemTreasuryAbi from "./GemTreasury.abi.json";

export function startGemListener() {
  const provider = new ethers.JsonRpcProvider(ENV.BASE_RPC_URL);

  const gemTreasury = new ethers.Contract(
    ENV.GEM_TREASURY_ADDRESS,
    GemTreasuryAbi,
    provider
  );

  gemTreasury.on(
    "GemsPurchased",
    async (
      buyer: string,
      packId: bigint,
      usdcAmount: bigint,
      gems: bigint,
      event: any
    ) => {
      try {
        const txHash: string = event.log.transactionHash;

        const user = await prisma.user.findUnique({
          where: { walletAddress: buyer.toLowerCase() },
        });

        if (!user) {
          console.log("Unknown buyer:", buyer);
          return;
        }

        await prisma.$transaction(
          async (tx: Prisma.TransactionClient) => {
            const existing = await tx.gemPurchase.findUnique({
              where: { txHash },
            });
            if (existing) return;

            await tx.userBalance.upsert({
              where: { userId: user.id },
              create: { userId: user.id, gems: Number(gems) },
              update: { gems: { increment: Number(gems) } },
            });

            await tx.gemPurchase.create({
              data: {
                userId: user.id,
                txHash,
                packId: Number(packId),
                usdcAmount: usdcAmount.toString(),
                gems: Number(gems),
                status: "CONFIRMED",
              },
            });
          }
        );

        console.log(`Gems added to ${buyer}: +${gems.toString()}`);
      } catch (err) {
        console.error("Error processing GemsPurchased event:", err);
      }
    }
  );

  console.log("Gem listener started...");
}
