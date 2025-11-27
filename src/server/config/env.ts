// src/server/config/env.ts

export const ENV = {
  DATABASE_URL: process.env.DATABASE_URL!,
  BASE_RPC_URL: process.env.BASE_RPC_URL!,
  GEM_TREASURY_ADDRESS: process.env.GEM_TREASURY_ADDRESS!,
  NFT_VAULT_ADDRESS: process.env.NFT_VAULT_ADDRESS!,
  ADMIN_PRIVATE_KEY: process.env.ADMIN_PRIVATE_KEY!,
};
