// src/server/web3/nftVault.ts
import { Contract } from "ethers";
import { adminWallet } from "./provider";
import { ENV } from "../config/env";
// Derlediğin ABI'yi bu dosyaya koyacaksın
import NftVaultAbi from "./NftVault.abi.json";

export const nftVault = new Contract(
  ENV.NFT_VAULT_ADDRESS,
  NftVaultAbi,
  adminWallet
);
