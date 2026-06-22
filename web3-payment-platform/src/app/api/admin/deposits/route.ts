import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
  const limit = 20;
  const skip = (page - 1) * limit;

  const [deposits, total] = await Promise.all([
    prisma.deposit.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        user: { select: { walletAddress: true } },
      },
    }),
    prisma.deposit.count(),
  ]);

  return NextResponse.json({
    deposits: deposits.map((d) => ({
      id: d.id,
      txHash: d.txHash,
      amount: d.amount.toString(),
      fromAddress: d.fromAddress,
      toAddress: d.toAddress,
      blockNumber: d.blockNumber.toString(),
      network: d.network,
      status: d.status,
      createdAt: d.createdAt.toISOString(),
      userWallet: d.user.walletAddress,
    })),
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}
