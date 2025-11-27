// src/app/inventory/page.tsx
import Link from "next/link";

export default function InventoryPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">Envanter (yakında)</h1>
      <p className="text-sm text-slate-400 max-w-md text-center">
        Burada yayıncının ekipmanları, kostümleri ve özel kartları olacak.
        Şimdilik sadece placeholder. Ana oyun ekranına dönüp yayın
        yapmaya devam edebilirsin.
      </p>
      <Link
        href="/game"
        className="border border-sky-500/80 px-4 py-2 rounded-md text-sm"
      >
        🎮 Oyuna Dön
      </Link>
    </main>
  );
}
