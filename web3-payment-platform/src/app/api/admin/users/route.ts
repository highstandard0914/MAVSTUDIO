import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
  const search = req.nextUrl.searchParams.get("search") || "";
  const limit = 20;
  const skip = (page - 1) * limit;

  const where = search
    ? { walletAddress: { contains: search.toLowerCase() } }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        walletAddress: true,
        depositAddress: true,
        balance: true,
        isAdmin: true,
        createdAt: true,
        _count: { select: { deposits: true, withdrawals: true, transactions: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({
    users: users.map((u) => ({
      ...u,
      balance: u.balance.toString(),
      createdAt: u.createdAt.toISOString(),
    })),
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}
