import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatEth(wei: string): string {
  const eth = Number(wei) / 1e18;
  if (eth < 0.0001) return "< 0.0001";
  return eth.toFixed(4);
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const categoryColors: Record<string, string> = {
  swap: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  bridge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  nft_buy: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  nft_sell: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  gas: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  transfer_in: "bg-green-500/20 text-green-300 border-green-500/30",
  transfer_out: "bg-red-500/20 text-red-300 border-red-500/30",
  contract: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  other: "bg-gray-500/20 text-gray-300 border-gray-500/30",
};

export const categoryLabels: Record<string, string> = {
  swap: "Swap",
  bridge: "Bridge",
  nft_buy: "NFT Buy",
  nft_sell: "NFT Sell",
  gas: "Gas",
  transfer_in: "Received",
  transfer_out: "Sent",
  contract: "Contract",
  other: "Other",
};

export const categoryIcons: Record<string, string> = {
  swap: "M",
  bridge: "B",
  nft_buy: "N",
  nft_sell: "N",
  gas: "G",
  transfer_in: "+",
  transfer_out: "-",
  contract: "C",
  other: "?",
};
