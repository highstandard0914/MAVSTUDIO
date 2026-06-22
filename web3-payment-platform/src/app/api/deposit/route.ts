import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { processDeposit } from "@/lib/blockchain";

// GET /api/deposit — list user's deposits
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
  const limit = 10;
  const skip = (page - 1) * limit;

  const [deposits, total] = await Promise.all([
    prisma.deposit.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        txHash: true,
        amount: true,
        fromAddress: true,
        toAddress: true,
        blockNumber: true,
        network: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.deposit.count({ where: { userId: session.id } }),
  ]);

  return NextResponse.json({
    deposits: deposits.map((d) => ({
      ...d,
      amount: d.amount.toString(),
      blockNumber: d.blockNumber.toString(),
      createdAt: d.createdAt.toISOString(),
    })),
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}

// POST /api/deposit — manually submit a tx hash for processing
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { txHash } = await req.json();
  if (!txHash || typeof txHash !== "string") {
    return NextResponse.json({ error: "Invalid tx hash" }, { status: 400 });
  }

  const result = await processDeposit(txHash.trim(), session.id);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
