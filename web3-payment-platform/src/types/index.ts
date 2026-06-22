export interface AuthUser {
  id: string;
  walletAddress: string;
  depositAddress: string;
  balance: string;
  isAdmin: boolean;
}

export interface DepositRecord {
  id: string;
  txHash: string;
  amount: string;
  fromAddress: string;
  toAddress: string;
  blockNumber: string;
  network: string;
  status: "PENDING" | "CONFIRMED" | "FAILED";
  createdAt: string;
}

export interface WithdrawalRecord {
  id: string;
  amount: string;
  fee: string;
  toAddress: string;
  txHash: string | null;
  network: string;
  status: "PENDING" | "APPROVED" | "PROCESSING" | "COMPLETED" | "REJECTED";
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionRecord {
  id: string;
  type: "DEPOSIT" | "WITHDRAWAL" | "PURCHASE" | "REFUND" | "ADJUSTMENT";
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  description: string | null;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  walletAddress: string;
  depositAddress: string;
  balance: string;
  isAdmin: boolean;
  createdAt: string;
  _count: {
    deposits: number;
    withdrawals: number;
    transactions: number;
  };
}

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };
