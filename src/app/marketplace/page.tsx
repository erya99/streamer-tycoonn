// src/app/marketplace/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

type Listing = {
  id: string;
  priceGems: number | null;
  currency: "GEMS" | "TOKEN";
  status: "ACTIVE" | "SOLD" | "CANCELLED";
  createdAt: string;
  nft: {
    id: string;
    contractAddress: string;
    tokenId: string;
    metadataUri?: string | null;
  };
  seller: {
    walletAddress: string;
  };
};

type ListingsResponse = {
  listings: Listing[];
};

export default function MarketplacePage() {
  const { address, isConnected } = useAccount();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Listeye koyma formu için state (deposit sonrası)
  const [tokenAddress, setTokenAddress] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [priceGems, setPriceGems] = useState<number>(0);
  const [listingLoading, setListingLoading] = useState(false);

  const fetchListings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/marketplace/listings");
      if (!res.ok) {
        throw new Error("Failed to fetch listings");
      }
      const data = (await res.json()) as ListingsResponse;
      setListings(data.listings);
    } catch (err: any) {
      setError(err.message || "Error fetching listings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleBuy = async (listing: Listing) => {
    if (!isConnected || !address) {
      setError("NFT satın almak için cüzdanını bağlaman gerekiyor.");
      return;
    }
    if (!listing.priceGems) return;

    try {
      setBuyingId(listing.id);
      setError(null);
      setInfo(null);

      const res = await fetch("/api/marketplace/buy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-wallet-address": address,
        },
        body: JSON.stringify({ listingId: listing.id }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Satın alma başarısız");
      }

      setInfo("Satın alma başarılı! NFT birazdan cüzdanında görünecek.");
      await fetchListings();
    } catch (err: any) {
      setError(err.message || "Satın alma sırasında hata oluştu");
    } finally {
      setBuyingId(null);
    }
  };

  const handleCreateListing = async () => {
    if (!isConnected || !address) {
      setError("NFT'yi listelemek için cüzdanını bağlaman gerekiyor.");
      return;
    }

    if (!tokenAddress || !tokenId || priceGems <= 0) {
      setError("Token adresi, tokenId ve fiyatı doğru gir.");
      return;
    }

    // ÖNEMLİ:
    // Burada NftVault.deposit(tokenAddress, tokenId) çağrısını
    // frontend'de wagmi ile yapman gerekiyor.
    // Bu iskelette sadece backend'e listing kaydı açıyoruz.
    setListingLoading(true);
    setError(null);
    setInfo(
      "Bu form, deposit işlemi yapıldığını varsayıyor. Gerçekte önce NftVault.deposit çağırmalısın."
    );

    try {
      const res = await fetch("/api/marketplace/list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-wallet-address": address,
        },
        body: JSON.stringify({
          tokenAddress,
          tokenId,
          priceGems,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Listing oluşturulamadı");
      }

      setTokenAddress("");
      setTokenId("");
      setPriceGems(0);
      await fetchListings();
    } catch (err: any) {
      setError(err.message || "Listing oluştururken hata oluştu");
    } finally {
      setListingLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6">
      <h1 className="text-2xl font-bold mb-4">NFT Marketplace (Beta)</h1>

      {!isConnected && (
        <div className="p-4 border rounded-md">
          <p>
            Marketplace&apos;i kullanmak için lütfen cüzdanını bağla
            (RainbowKit, wagmi vs.).
          </p>
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

      {/* Aktif ilanlar */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Aktif İlanlar</h2>

        {loading ? (
          <p>İlanlar yükleniyor...</p>
        ) : listings.length === 0 ? (
          <p>Şu anda aktif ilan yok.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {listings.map((listing) => (
              <div
                key={listing.id}
                className="border rounded-lg p-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">
                    Koleksiyon:{" "}
                    <span className="font-mono text-xs">
                      {listing.nft.contractAddress.slice(0, 6)}...
                      {listing.nft.contractAddress.slice(-4)}
                    </span>
                  </p>
                  <p className="text-sm">
                    Token ID:{" "}
                    <span className="font-mono">{listing.nft.tokenId}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Satıcı:{" "}
                    <span className="font-mono text-xs">
                      {listing.seller.walletAddress.slice(0, 6)}...
                      {listing.seller.walletAddress.slice(-4)}
                    </span>
                  </p>
                  <p className="text-lg font-semibold">
                    Fiyat: {listing.priceGems} 💎
                  </p>
                </div>
                <button
                  className="mt-4 py-2 px-3 rounded-md border text-sm disabled:opacity-50"
                  disabled={
                    !isConnected ||
                    buyingId === listing.id ||
                    listing.seller.walletAddress.toLowerCase() ===
                      address?.toLowerCase()
                  }
                  onClick={() => handleBuy(listing)}
                >
                  {!isConnected
                    ? "Cüzdan bağla"
                    : listing.seller.walletAddress.toLowerCase() ===
                      address?.toLowerCase()
                    ? "Kendi ilanını alamazsın"
                    : buyingId === listing.id
                    ? "Satın alınıyor..."
                    : "Satın al"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Basit listing oluşturma formu */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">NFT Listele (Elmas ile)</h2>
        <p className="text-sm text-gray-500">
          Gerçekte önce NftVault.deposit(tokenAddress, tokenId) çağırman
          gerekiyor. Bu form, deposit sonrası backend&apos;e ilan kaydı açar.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            className="border rounded-md px-2 py-1 text-sm"
            placeholder="Token adresi (0x...)"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
          />
          <input
            className="border rounded-md px-2 py-1 text-sm"
            placeholder="Token ID"
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value)}
          />
          <input
            className="border rounded-md px-2 py-1 text-sm"
            placeholder="Fiyat (Elmas)"
            type="number"
            value={priceGems || ""}
            onChange={(e) => setPriceGems(Number(e.target.value))}
          />
        </div>

        <button
          className="mt-2 py-2 px-3 rounded-md border text-sm disabled:opacity-50"
          disabled={!isConnected || listingLoading}
          onClick={handleCreateListing}
        >
          {listingLoading ? "İlan oluşturuluyor..." : "İlan oluştur"}
        </button>
      </section>
    </div>
  );
}
