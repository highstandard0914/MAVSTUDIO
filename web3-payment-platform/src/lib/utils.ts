import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatAmount(amount: string | number, decimals = 6): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "0";
  return num.toFixed(decimals).replace(/\.?0+$/, "");
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function generateNonce(): string {
  return Math.random().toString(36).substring(2) +
    Math.random().toString(36).substring(2);
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    PENDING: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
    CONFIRMED: "text-green-400 bg-green-400/10 border-green-400/20",
    APPROVED: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    PROCESSING: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    COMPLETED: "text-green-400 bg-green-400/10 border-green-400/20",
    REJECTED: "text-red-400 bg-red-400/10 border-red-400/20",
    FAILED: "text-red-400 bg-red-400/10 border-red-400/20",
  };
  return map[status] || "text-gray-400 bg-gray-400/10 border-gray-400/20";
}

export function txTypeLabel(type: string): string {
  const map: Record<string, string> = {
    DEPOSIT: "입금",
    WITHDRAWAL: "출금",
    PURCHASE: "구매",
    REFUND: "환불",
    ADJUSTMENT: "조정",
  };
  return map[type] || type;
}

export function txTypeColor(type: string): string {
  const map: Record<string, string> = {
    DEPOSIT: "text-green-400",
    WITHDRAWAL: "text-red-400",
    PURCHASE: "text-orange-400",
    REFUND: "text-blue-400",
    ADJUSTMENT: "text-purple-400",
  };
  return map[type] || "text-gray-400";
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    PENDING: "대기중",
    CONFIRMED: "확인됨",
    APPROVED: "승인됨",
    PROCESSING: "처리중",
    COMPLETED: "완료",
    REJECTED: "거절됨",
    FAILED: "실패",
  };
  return map[status] || status;
}
