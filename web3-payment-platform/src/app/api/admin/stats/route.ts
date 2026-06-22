import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [
    totalUsers,
    totalDeposits,
    totalWithdrawals,
    pendingWithdrawals,
    depositSum,
    withdrawalSum,
    userBalanceSum,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.deposit.count({ where: { status: "CONFIRMED" } }),
    prisma.withdrawal.count({ where: { status: "COMPLETED" } }),
    prisma.withdrawal.count({ where: { status: "PENDING" } }),
    prisma.deposit.aggregate({ _sum: { amount: true }, where: { status: "CONFIRMED" } }),
    prisma.withdrawal.aggregate({ _sum: { amount: true }, where: { status: "COMPLETED" } }),
    prisma.user.aggregate({ _sum: { balance: true } }),
  ]);

  return NextResponse.json({
    totalUsers,
    totalDeposits,
    totalWithdrawals,
    pendingWithdrawals,
    totalDepositAmount: depositSum._sum.amount?.toString() || "0",
    totalWithdrawalAmount: withdrawalSum._sum.amount?.toString() || "0",
    totalUserBalance: userBalanceSum._sum.balance?.toString() || "0",
  });
}
