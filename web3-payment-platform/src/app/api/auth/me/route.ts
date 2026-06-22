import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch fresh balance
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      walletAddress: true,
      depositAddress: true,
      balance: true,
      isAdmin: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      ...user,
      balance: user.balance.toString(),
    },
  });
}
