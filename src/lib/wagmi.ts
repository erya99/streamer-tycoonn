// src/lib/wagmi.ts
import { createConfig, http } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

export const wagmiConfig = createConfig({
  chains: [base, baseSepolia],
  connectors: [injected()],
  transports: {
    [base.id]: http(),        // public RPC – local geliştirme için yeterli
    [baseSepolia.id]: http(), // test ağı istersen
  },
  ssr: true,
});
