// src/server/game/simulate.ts

// Oyun içi içerik türlerini burada tanımlıyoruz (Prisma'dan bağımsız)
export const CONTENT_TYPES = [
  "JUST_CHATTING",
  "COMPETITIVE",
  "VARIETY",
  "IRL",
  "TALK_SHOW",
] as const;

export type ContentType = (typeof CONTENT_TYPES)[number];

export type SimulateInput = {
  followers: number;
  avgViewers: number;
  hype: number;
  setupLevel: number;
  reputation: number;
  contentType: ContentType;
  durationMinutes: number;
};

export type SimulateResult = {
  views: number;
  newFollowers: number;
  coinsEarned: number;
  hypeGain: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function contentMultiplier(contentType: ContentType): number {
  switch (contentType) {
    case "JUST_CHATTING":
      return 1.0;
    case "COMPETITIVE":
      return 1.3;
    case "VARIETY":
      return 1.1;
    case "IRL":
      return 1.4;
    case "TALK_SHOW":
      return 1.2;
    default:
      return 1.0;
  }
}

export function simulateStream(input: SimulateInput): SimulateResult {
  const {
    followers,
    avgViewers,
    hype,
    setupLevel,
    reputation,
    contentType,
    durationMinutes,
  } = input;

  const dur = clamp(durationMinutes, 10, 240); // 10–240 dk arası

  const baseFromFollowers = Math.sqrt(followers + 1) * 8;
  const baseFromSetup = setupLevel * 15;
  const baseFromHype = hype * 4;
  const baseFromReputation = reputation * 3;
  const baseFromDuration = dur * 4;

  let rawViews =
    80 +
    baseFromFollowers +
    baseFromSetup +
    baseFromHype +
    baseFromReputation +
    baseFromDuration;

  rawViews *= contentMultiplier(contentType);

  // Rastgelelik: ±%25
  const randomFactor = 0.75 + Math.random() * 0.5;
  rawViews *= randomFactor;

  const views = Math.round(rawViews);

  // Yeni takipçi: izlenmenin %5–12'si, hype'a bağlı
  const followerRatioBase = 0.05 + hype / 2000;
  const followerRatio = clamp(followerRatioBase, 0.05, 0.12);
  const newFollowers = Math.round(views * followerRatio);

  // Soft coin: izlenmenin yaklaşık %3'ü
  const coinsEarned = Math.round(views * 0.03);

  // Hype artışı
  const hypeGainBase = Math.round(views / 500 + setupLevel / 2);
  const hypeGain = clamp(hypeGainBase, 1, 25);

  return {
    views,
    newFollowers,
    coinsEarned,
    hypeGain,
  };
}
