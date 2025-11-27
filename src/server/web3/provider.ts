// src/server/web3/provider.ts
import { ethers } from "ethers";
import { ENV } from "../config/env";

export const provider = new ethers.JsonRpcProvider(ENV.BASE_RPC_URL);

// ADMIN_PRIVATE_KEY, NftVault'taki onlyOwner fonksiyonlarını çağıracak
export const adminWallet = new ethers.Wallet(ENV.ADMIN_PRIVATE_KEY, provider);
