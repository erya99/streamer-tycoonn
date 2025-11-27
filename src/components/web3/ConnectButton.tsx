// src/components/web3/ConnectButton.tsx
"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connectors, connect, status, error } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono border rounded px-2 py-1">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <button
          onClick={() => disconnect()}
          className="text-xs border px-2 py-1 rounded"
        >
          Çıkış
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {connectors.map((connector) => (
        <button
          key={connector.uid}
          onClick={() => connect({ connector })}
          disabled={status === "pending"}
          className="text-xs border px-2 py-1 rounded"
        >
          {status === "pending"
            ? "Bağlanıyor..."
            : `Cüzdan Bağla (${connector.name})`}
        </button>
      ))}
      {error && (
        <span className="text-xs text-red-500">
          {error.message}
        </span>
      )}
    </div>
  );
}
