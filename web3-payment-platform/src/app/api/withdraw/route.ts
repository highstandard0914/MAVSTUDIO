import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

const MIN_WITHDRAWAL = parseFloat(process.env.MIN_WITHDRAWAL || "0.01");
const WITHDRAWAL_FEE = parseFloat(process.env.WITHDRAWAL_FEE || "0.001");
const MAX_DAILY_WITHDRAWALS = 3;

// GET /api/withdraw — list user's withdrawals
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
  const limit = 10;
  const skip = (page - 1) * limit;

  const [withdrawals, total] = await Promise.all([
    prisma.withdrawal.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.withdrawal.count({ where: { userId: session.id } }),
  ]);

  return NextResponse.json({
    withdrawals: withdrawals.map((w) => ({
      ...w,
      amount: w.amount.toString(),
      fee: w.fee.toString(),
      createdAt: w.createdAt.toISOString(),
      updatedAt: w.updatedAt.toISOString(),
    })),
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}

// POST /api/withdraw — request a withdrawal
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { amount } = await req.json();
  const amountNum = parseFloat(amount);

  if (isNaN(amountNum) || amountNum < MIN_WITHDRAWAL) {
    return NextResponse.json(
      { error: `최소 출금 금액은 ${MIN_WITHDRAWAL} ETH입니다` },
      { status: 400 }
    );
  }

  // Check daily limit
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dailyCount = await prisma.withdrawal.count({
    where: {
      userId: session.id,
      createdAt: { gte: today },
      status: { not: "REJECTED" },
    },
  });

  if (dailyCount >= MAX_DAILY_WITHDRAWALS) {
    return NextResponse.json(
      { error: `일일 출금 신청 한도(${MAX_DAILY_WITHDRAWALS}회)를 초과했습니다` },
      { status: 429 }
    );
  }

  // Check for pending withdrawal
  const pendingWithdrawal = await prisma.withdrawal.findFirst({
    where: { userId: session.id, status: { in: ["PENDING", "APPROVED", "PROCESSING"] } },
  });
  if (pendingWithdrawal) {
    return NextResponse.json(
      { error: "이미 처리 중인 출금 신청이 있습니다" },
      { status: 400 }
    );
  }

  // Check balance
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { balance: true, walletAddress: true },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const balance = new Decimal(user.balance.toString());
  const amountDecimal = new Decimal(amountNum.toString());

  if (balance.lt(amountDecimal)) {
    return NextResponse.json({ error: "잔액이 부족합니다" }, { status: 400 });
  }

  const feeDecimal = new Decimal(WITHDRAWAL_FEE.toString());
  const newBalance = balance.sub(amountDecimal);

  await prisma.$transaction(async (tx) => {
    await tx.withdrawal.create({
      data: {
        userId: session.id,
        amount: amountDecimal,
        fee: feeDecimal,
        toAddress: user.walletAddress,
        status: "PENDING",
      },
    });

    await tx.user.update({
      where: { id: session.id },
      data: { balance: newBalance },
    });

    await tx.transaction.create({
      data: {
        userId: session.id,
        type: "WITHDRAWAL",
        amount: amountDecimal,
        balanceBefore: balance,
        balanceAfter: newBalance,
        description: `출금 신청 ${amountNum} ETH`,
      },
    });
  });

  return NextResponse.json({ success: true });
}
