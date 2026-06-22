import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendWithdrawal } from "@/lib/blockchain";
import { Decimal } from "@prisma/client/runtime/library";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
  const status = req.nextUrl.searchParams.get("status") || undefined;
  const limit = 20;
  const skip = (page - 1) * limit;

  const where = status ? { status: status as never } : {};

  const [withdrawals, total] = await Promise.all([
    prisma.withdrawal.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        user: { select: { walletAddress: true } },
      },
    }),
    prisma.withdrawal.count({ where }),
  ]);

  return NextResponse.json({
    withdrawals: withdrawals.map((w) => ({
      id: w.id,
      amount: w.amount.toString(),
      fee: w.fee.toString(),
      toAddress: w.toAddress,
      txHash: w.txHash,
      network: w.network,
      status: w.status,
      adminNote: w.adminNote,
      createdAt: w.createdAt.toISOString(),
      updatedAt: w.updatedAt.toISOString(),
      userWallet: w.user.walletAddress,
      userId: w.userId,
    })),
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}

// POST /api/admin/withdrawals — approve or reject
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { withdrawalId, action, adminNote } = await req.json();

  if (!withdrawalId || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const withdrawal = await prisma.withdrawal.findUnique({
    where: { id: withdrawalId },
    include: { user: { select: { balance: true } } },
  });

  if (!withdrawal) {
    return NextResponse.json({ error: "Withdrawal not found" }, { status: 404 });
  }

  if (withdrawal.status !== "PENDING") {
    return NextResponse.json({ error: "Already processed" }, { status: 400 });
  }

  if (action === "reject") {
    // Refund balance
    await prisma.$transaction(async (tx) => {
      const newBalance = new Decimal(withdrawal.user.balance.toString()).add(
        new Decimal(withdrawal.amount.toString())
      );
      await tx.withdrawal.update({
        where: { id: withdrawalId },
        data: { status: "REJECTED", adminNote: adminNote || "관리자 거절" },
      });
      await tx.user.update({
        where: { id: withdrawal.userId },
        data: { balance: newBalance },
      });
      await tx.transaction.create({
        data: {
          userId: withdrawal.userId,
          type: "ADJUSTMENT",
          amount: new Decimal(withdrawal.amount.toString()),
          balanceBefore: new Decimal(withdrawal.user.balance.toString()),
          balanceAfter: newBalance,
          description: `출금 거절 환불`,
          refId: withdrawal.id,
        },
      });
    });
    return NextResponse.json({ success: true, action: "rejected" });
  }

  // Approve and send
  await prisma.withdrawal.update({
    where: { id: withdrawalId },
    data: { status: "PROCESSING" },
  });

  const result = await sendWithdrawal(withdrawal.toAddress, withdrawal.amount.toString());

  if (!result.success) {
    // Revert to pending and refund if send failed
    const newBalance = new Decimal(withdrawal.user.balance.toString()).add(
      new Decimal(withdrawal.amount.toString())
    );
    await prisma.$transaction([
      prisma.withdrawal.update({
        where: { id: withdrawalId },
        data: { status: "PENDING", adminNote: `전송 실패: ${result.error}` },
      }),
      prisma.user.update({
        where: { id: withdrawal.userId },
        data: { balance: newBalance },
      }),
    ]);
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  await prisma.withdrawal.update({
    where: { id: withdrawalId },
    data: { status: "COMPLETED", txHash: result.txHash, adminNote: adminNote || null },
  });

  return NextResponse.json({ success: true, txHash: result.txHash });
}
