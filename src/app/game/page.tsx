// src/app/game/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAccount } from "wagmi";
import { ConnectButton } from "../../components/web3/ConnectButton";

// --- Types ---
type Channel = {
  id: string;
  name: string;
  followers: number;
  avgViewers: number;
  hype: number;
  setupLevel: number;
  reputation: number;
  createdAt: string;
};

type StreamSession = {
  id: string;
  contentType: string;
  title: string;
  durationMinutes: number;
  startedAt: string;
  resultViews: number;
  resultNewFollowers: number;
  resultCoinsEarned: number;
  resultHypeGain: number;
};

type ChannelResponse = {
  channel: Channel;
  recentSessions: StreamSession[];
};

type BalanceResponse = {
  walletAddress: string;
  gems: number;
};

const CONTENT_TYPES = [
  { value: "JUST_CHATTING", label: "Just Chatting" },
  { value: "COMPETITIVE", label: "Rekabetçi Oyun" },
  { value: "VARIETY", label: "Variety" },
  { value: "IRL", label: "IRL" },
  { value: "TALK_SHOW", label: "Talk Show" },
];

export default function GamePage() {
  const { address, isConnected } = useAccount();

  const [channel, setChannel] = useState<Channel | null>(null);
  const [sessions, setSessions] = useState<StreamSession[]>([]);
  const [balance, setBalance] = useState<BalanceResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Yayın formu
  const [formContentType, setFormContentType] =
    useState<string>("JUST_CHATTING");
  const [formDuration, setFormDuration] = useState<number>(60);
  const [formTitle, setFormTitle] =
    useState<string>("Chat & Chill");

  // Soft in-game para birimi: son session'lardaki coinsEarned toplamı
  const softCoins = useMemo(
    () =>
      sessions.reduce(
        (sum, s) => sum + (s.resultCoinsEarned ?? 0),
        0
      ),
    [sessions]
  );

  // Görsel stat overlay için textler
  const followersText = loading
    ? "..."
    : (channel?.followers?.toLocaleString("tr-TR") ?? "-");
  const avgViewersText = loading
    ? "..."
    : (channel?.avgViewers?.toLocaleString("tr-TR") ?? "-");
  const hypeText =
    channel?.hype !== undefined ? channel.hype.toString() : "-";
  const reputationText =
    channel?.reputation !== undefined
      ? channel.reputation.toString()
      : "-";
  const setupLevelText =
    channel?.setupLevel !== undefined
      ? channel.setupLevel.toString()
      : "-";
  const totalStreamsText = sessions.length.toString();

  const recentToShow = sessions.slice(0, 4);

  // Channel + son yayınları çek
  const fetchChannel = async () => {
    if (!isConnected || !address) {
      setChannel(null);
      setSessions([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/game/channel", {
        headers: {
          "x-wallet-address": address,
        },
      });
      if (!res.ok) {
        throw new Error("Kanal bilgisi alınamadı");
      }
      const data = (await res.json()) as ChannelResponse;
      setChannel(data.channel);
      setSessions(data.recentSessions);
    } catch (err: any) {
      setError(err.message || "Kanal bilgisi alınırken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  // Elmas bakiyesini çek
  const fetchBalance = async () => {
    if (!isConnected || !address) {
      setBalance(null);
      return;
    }
    try {
      const res = await fetch("/api/me/balance", {
        headers: {
          "x-wallet-address": address,
        },
      });
      if (!res.ok) return;
      const data = (await res.json()) as BalanceResponse;
      setBalance(data);
    } catch {
      // sessiz geç
    }
  };

  useEffect(() => {
    fetchChannel();
    fetchBalance();
  }, [address, isConnected]);

  // Yayın simülasyonu
  const handleStartStream = async () => {
    if (!isConnected || !address) {
      setError("Yayın başlatmak için cüzdanını bağlamalısın.");
      return;
    }

    if (!formDuration || formDuration <= 0) {
      setError("Yayın süresi pozitif bir dakika değeri olmalı.");
      return;
    }

    try {
      setStreaming(true);
      setError(null);
      setInfo(null);

      const res = await fetch("/api/game/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-wallet-address": address,
        },
        body: JSON.stringify({
          contentType: formContentType,
          durationMinutes: formDuration,
          title: formTitle,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error || "Yayın simülasyonu başarısız"
        );
      }

      const data = (await res.json()) as {
        channel: Channel;
        session: StreamSession;
      };

      setChannel(data.channel);
      setSessions((prev) => [data.session, ...prev].slice(0, 5));
      setInfo(
        `Yayın bitti! İzlenme: ${data.session.resultViews}, Yeni takipçi: ${data.session.resultNewFollowers}, Hype +${data.session.resultHypeGain}`
      );
    } catch (err: any) {
      setError(err.message || "Yayın başlatırken hata oluştu");
    } finally {
      setStreaming(false);
    }
  };

  const lastSession = sessions[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-6 flex flex-col gap-6">
        {/* TOP BAR */}
        <header className="flex items-center justify-between gap-4 border-b border-slate-800 pb-4">
          {/* Sol – Logo + Tabs */}
          <div className="flex items-center gap-6">
            <div className="text-xl font-bold tracking-wide">
              StreamLife<span className="text-sky-400">.gg</span>
            </div>
            <nav className="flex items-center gap-3 text-xs md:text-sm">
              <Link
                href="/game"
                className="px-3 py-1 rounded-md border border-sky-500/70 bg-sky-500/10"
              >
                GAME
              </Link>
              <Link
                href="/marketplace"
                className="px-3 py-1 rounded-md border border-slate-700 hover:border-sky-500/60 hover:bg-sky-500/5 transition"
              >
                MARKETPLACE
              </Link>
              <Link
                href="/store/gems"
                className="px-3 py-1 rounded-md border border-slate-700 hover:border-sky-500/60 hover:bg-sky-500/5 transition"
              >
                MUTFAK
              </Link>
              <Link
                href="/inventory"
                className="px-3 py-1 rounded-md border border-slate-700 hover:border-sky-500/60 hover:bg-sky-500/5 transition"
              >
                ENVANTER
              </Link>
            </nav>
          </div>

          {/* Sağ – Para birimleri + Cüzdan */}
          <div className="flex items-center gap-4">
            {/* Oyun içi coin */}
            <div className="flex items-center gap-1 text-xs md:text-sm">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400/80 text-slate-900 text-[10px] font-bold">
                $
              </span>
              <span className="font-semibold">
                {softCoins.toLocaleString("tr-TR")}
              </span>
            </div>

            {/* Gems */}
            <div className="flex items-center gap-1 text-xs md:text-sm">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-400 text-slate-900 text-[10px] font-bold">
                💎
              </span>
              <span className="font-semibold">
                {balance?.gems ?? 0}
              </span>
            </div>

            {/* Connect Button */}
            <ConnectButton />
          </div>
        </header>

        {/* Info / Error mesajları */}
        {error && (
          <div className="p-3 border border-red-500/60 bg-red-900/30 text-xs rounded-md">
            {error}
          </div>
        )}
        {info && (
          <div className="p-3 border border-sky-500/60 bg-sky-900/30 text-xs rounded-md">
            {info}
          </div>
        )}

        {/* ANA İÇERİK: Sol virtual setup, sağ istatistikler */}
        <main className="flex flex-col lg:flex-row gap-6">
          {/* SOL: VIRTUAL SETUP – tamamen görsel üstü UI */}
          <section className="flex-1 flex justify-center items-start py-4">
            <div className="relative w-full max-w-3xl mx-auto aspect-[908/490] rounded-2xl overflow-hidden border border-sky-500/60 bg-slate-900 shadow-neon">
              {/* Arka plan görseli */}
              <Image
                src="/ui/virtual-setup3.png"
                alt="Virtual setup screen"
                fill
                sizes="(min-width: 1024px) 800px, 100vw"
                className="object-cover"
              />

              {/* Overlay katmanı – form elemanları */}
              <div className="absolute inset-0 z-10 text-xs text-slate-100">
                {/* Son yayın bilgisi – sağ üst boşlukta */}
                {lastSession && (
                  <div
                    style={{
                      right: "7%",
                      top: "13%",
                    }}
                    className="absolute text-[11px] text-slate-100 text-right drop-shadow"
                  >
                    <p>Son yayın</p>
                    <p>
                      {lastSession.resultViews} izlenme • +
                      {lastSession.resultNewFollowers} takipçi
                    </p>
                  </div>
                )}

                {/* Content Type alanı – soldaki ilk mavi kutu */}
                <div
                  style={{
                    left: "6%",
                    top: "46.2%", // hizalanmış
                    width: "20%",
                  }}
                  className="absolute"
                >
                  <label className="sr-only">Content Type</label>
                  <select
                    className="w-full h-7 bg-transparent border-none outline-none text-[14px] leading-tight text-slate-100 px-1 text-left appearance-none font-semibold"
                    value={formContentType}
                    onChange={(e) =>
                      setFormContentType(e.target.value)
                    }
                  >
                    {CONTENT_TYPES.map((c) => (
                      <option
                        key={c.value}
                        value={c.value}
                        className="bg-slate-900 text-slate-100"
                      >
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Stream Duration alanı – soldaki ikinci mavi kutu */}
                <div
                  style={{
                    left: "6%",
                    top: "64.7%", // hizalanmış
                    width: "15%",
                  }}
                  className="absolute"
                >
                  <label className="sr-only">Stream Duration</label>
                  <input
                    type="number"
                    min={10}
                    max={240}
                    className="w-full h-7 bg-transparent border-none outline-none text-[14px] leading-tight text-slate-100 px-1 text-left font-semibold"
                    value={formDuration}
                    onChange={(e) =>
                      setFormDuration(Number(e.target.value))
                    }
                  />
                </div>

                {/* Title alanı – alttaki geniş mavi kutu */}
                <div
                  style={{
                    left: "6%",
                    bottom: "8.95%", // hizalanmış
                    width: "50%",
                  }}
                  className="absolute"
                >
                  <label className="sr-only">Title</label>
                  <input
                    type="text"
                    className="w-full h-8 bg-transparent border-none outline-none text-[14px] leading-tight text-slate-100 px-1 text-left font-semibold"
                    value={formTitle}
                    onChange={(e) =>
                      setFormTitle(e.target.value)
                    }
                  />
                </div>

                {/* Start Stream – tamamen şeffaf, görseldeki butonun üstünde */}
                <button
                  onClick={handleStartStream}
                  disabled={streaming || !isConnected}
                  className="absolute disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    right: "3%",
                    bottom: "9%",
                    width: "25%",
                    height: "13%",
                    backgroundColor: "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <span className="sr-only">
                    {isConnected
                      ? streaming
                        ? "Simüle ediliyor..."
                        : "Start Stream"
                      : "Cüzdan Bağla"}
                  </span>
                </button>
              </div>
            </div>
          </section>

          {/* SAĞ: İSTATİSTİK PANELİ – piksel görsel üstü UI + oval çerçeve */}
          <aside className="w-full lg:w-80 flex justify-center items-start py-4">
            {/* Oval dış çerçeve */}
            <div className="relative w-full max-w-xs mx-auto rounded-[32px] border border-sky-500/70 bg-slate-950/80 p-2 shadow-neon">
              {/* İçte gerçek panel oranı */}
              <div className="relative w-full aspect-[768/1145] rounded-[28px] overflow-hidden">
                <Image
                  src="/ui/stats-panel.png"
                  alt="Statistics panel"
                  fill
                  sizes="(min-width: 1024px) 320px, 100vw"
                  className="object-cover"
                />

                <div className="absolute inset-0 z-10 text-slate-100">
                  {/* Üst 6 kutudaki sayılar (biraz sağa ve yukarı) */}
                  <div
                    style={{ left: "23%", top: "15%" }}
                    className="absolute text-[13px] font-semibold drop-shadow"
                  >
                    {followersText}
                  </div>

                  <div
                    style={{ right: "17%", top: "15%" }}
                    className="absolute text-[13px] font-semibold drop-shadow text-right"
                  >
                    {avgViewersText}
                  </div>

                  <div
                    style={{ left: "23%", top: "36.5%" }}
                    className="absolute text-[13px] font-semibold drop-shadow"
                  >
                    {hypeText}
                  </div>

                  <div
                    style={{ right: "17%", top: "36.5%" }}
                    className="absolute text-[13px] font-semibold drop-shadow text-right"
                  >
                    {reputationText}
                  </div>

                  <div
                    style={{ left: "23%", top: "52%" }}
                    className="absolute text-[13px] font-semibold drop-shadow"
                  >
                    {setupLevelText}
                  </div>

                  <div
                    style={{ right: "17%", top: "52%" }}
                    className="absolute text-[13px] font-semibold drop-shadow text-right"
                  >
                    {totalStreamsText}
                  </div>

                  {/* Recent Streams kutuları */}
                  {recentToShow.length === 0 ? (
                    <div
                      style={{
                        left: "15%",
                        top: "71%",
                        width: "72%",
                      }}
                      className="absolute text-[11px] text-slate-200 drop-shadow"
                    >
                      Henüz yayın yok
                    </div>
                  ) : (
                    recentToShow.map((s, idx) => {
                      const baseTop = 69; // ilk kart
                      const step = 7.6;
                      const top = baseTop + idx * step;

                      return (
                        <div
                          key={s.id}
                          style={{
                            left: "15%",
                            width: "72%",
                            top: `${top}%`,
                          }}
                          className="absolute text-[10px] leading-tight drop-shadow"
                        >
                          <p className="font-semibold text-[11px] truncate">
                            {s.title}
                          </p>
                          <p>
                            {s.resultViews} izlenme • +
                            {s.resultNewFollowers} takipçi
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
