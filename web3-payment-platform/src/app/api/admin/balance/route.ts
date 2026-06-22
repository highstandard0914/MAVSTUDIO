import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

// POST /api/admin/balance — adjust user balance (manual refund/adjustment)
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, amount, type, description } = await req.json();

  if (!userId || !amount || !["REFUND", "ADJUSTMENT"].includes(type)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { balance: true },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const amountDecimal = new Decimal(Math.abs(parseFloat(amount)).toString());
  const currentBalance = new Decimal(user.balance.toString());
  const newBalance = type === "REFUND"
    ? currentBalance.add(amountDecimal)
    : currentBalance.sub(amountDecimal);

  if (newBalance.lt(0)) {
    return NextResponse.json({ error: "잔액이 부족합니다" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { balance: newBalance },
    }),
    prisma.transaction.create({
      data: {
        userId,
        type: type as never,
        amount: amountDecimal,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        description: description || `관리자 ${type === "REFUND" ? "환불" : "조정"}`,
      },
    }),
  ]);

  return NextResponse.json({ success: true, newBalance: newBalance.toString() });
}
