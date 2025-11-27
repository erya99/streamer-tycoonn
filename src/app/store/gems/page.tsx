// src/app/store/gems/page.tsx
"use client";

import { useEffect, useState } from "react";
// Eğer wagmi kullanıyorsan:
import { useAccount } from "wagmi";

type BalanceResponse = {
  walletAddress: string;
  gems: number;
};

type GemPack = {
  id: number;
  name: string;
  gems: number;
  usdcPrice: number; // gösterim için
};

const GEM_PACKS: GemPack[] = [
  { id: 1, name: "Starter Pack", gems: 500, usdcPrice: 5 },
  { id: 2, name: "Streamer Pack", gems: 1200, usdcPrice: 10 },
  { id: 3, name: "Whale Pack", gems: 2500, usdcPrice: 20 },
];

export default function GemsStorePage() {
  const { address, isConnected } = useAccount();
  const [balance, setBalance] = useState<BalanceResponse | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [buyingPackId, setBuyingPackId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected || !address) {
      setBalance(null);
      return;
    }
    const fetchBalance = async () => {
      try {
        setLoadingBalance(true);
        setError(null);
        const res = await fetch("/api/me/balance", {
          headers: {
            "x-wallet-address": address,
          },
        });
        if (!res.ok) {
          throw new Error("Failed to fetch balance");
        }
        const data = (await res.json()) as BalanceResponse;
        setBalance(data);
      } catch (err: any) {
        setError(err.message || "Error fetching balance");
      } finally {
        setLoadingBalance(false);
      }
    };
    fetchBalance();
  }, [address, isConnected]);

  const handleBuyPack = async (pack: GemPack) => {
    if (!address) {
      setError("Önce cüzdanını bağlamalısın.");
      return;
    }

    setError(null);
    setInfo(
      "Şu an yalnızca frontend iskeletindesin. Bu butona gem alımı için USDC approve + GemTreasury.buy(packId) bağlaman gerekiyor."
    );
    setBuyingPackId(pack.id);

    // TODO:
    // 1. USDC kontratına approve:
    //    await writeContract({
    //      address: USDC_ADDRESS,
    //      abi: UsdcAbi,
    //      functionName: "approve",
    //      args: [GEM_TREASURY_ADDRESS, usdcAmount],
    //    });
    //
    // 2. GemTreasury.buy(pack.id) çağır:
    //    await writeContract({
    //      address: GEM_TREASURY_ADDRESS,
    //      abi: GemTreasuryAbi,
    //      functionName: "buy",
    //      args: [pack.id],
    //    });
    //
    // 3. Transaction onaylandıktan sonra /api/me/balance'i tekrar çek.

    setTimeout(() => {
      setBuyingPackId(null);
    }, 1000);
  };

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Elmas Mağazası</h1>

      {!isConnected && (
        <div className="p-4 border rounded-md">
          <p>Elmas bakiyeni görmek için lütfen cüzdanını bağla.</p>
        </div>
      )}

      {isConnected && (
        <div className="p-4 border rounded-md flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Cüzdan:</p>
            <p className="font-mono text-sm">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Elmas Bakiyesi:</p>
            <p className="text-xl font-semibold">
              {loadingBalance
                ? "Yükleniyor..."
                : typeof balance?.gems === "number"
                ? balance.gems
                : 0}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 border border-red-400 bg-red-50 text-sm rounded-md">
          {error}
        </div>
      )}

      {info && (
        <div className="p-3 border border-blue-400 bg-blue-50 text-sm rounded-md">
          {info}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {GEM_PACKS.map((pack) => (
          <div
            key={pack.id}
            className="border rounded-lg p-4 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <h2 className="font-semibold text-lg">{pack.name}</h2>
              <p className="text-2xl font-bold">{pack.gems} 💎</p>
              <p className="text-sm text-gray-500">
                {pack.usdcPrice} USDC (örnek fiyat)
              </p>
            </div>
            <button
              disabled={!isConnected || buyingPackId === pack.id}
              onClick={() => handleBuyPack(pack)}
              className="mt-4 py-2 px-3 rounded-md border text-sm disabled:opacity-50"
            >
              {!isConnected
                ? "Cüzdan bağla"
                : buyingPackId === pack.id
                ? "İşleniyor..."
                : "Satın al"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
