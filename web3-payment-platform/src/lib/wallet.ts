import { HDNodeWallet, Mnemonic, ethers } from "ethers";

const MNEMONIC = process.env.MASTER_WALLET_MNEMONIC!;
const DEPOSIT_PATH = process.env.DEPOSIT_WALLET_PATH || "m/44'/60'/0'/0";

function getMasterNode(): HDNodeWallet {
  const mnemonic = Mnemonic.fromPhrase(MNEMONIC);
  return HDNodeWallet.fromMnemonic(mnemonic, DEPOSIT_PATH);
}

export function deriveDepositAddress(index: number): string {
  const master = getMasterNode();
  const child = master.deriveChild(index);
  return child.address.toLowerCase();
}

export function getMasterWallet(): ethers.Wallet {
  const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL);
  const mnemonic = Mnemonic.fromPhrase(MNEMONIC);
  const master = HDNodeWallet.fromMnemonic(mnemonic, "m/44'/60'/0'/0/0");
  return new ethers.Wallet(master.privateKey, provider);
}

export function getDepositWallet(index: number): ethers.Wallet {
  const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL);
  const master = getMasterNode();
  const child = master.deriveChild(index);
  return new ethers.Wallet(child.privateKey, provider);
}

export function getProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(process.env.ETH_RPC_URL);
}

export function formatEth(value: bigint | string | number): string {
  return ethers.formatEther(value);
}

export function parseEth(value: string): bigint {
  return ethers.parseEther(value);
}
