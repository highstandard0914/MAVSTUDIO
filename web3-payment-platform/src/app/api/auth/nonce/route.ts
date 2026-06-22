import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateNonce } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address")?.toLowerCase();

  if (!address || !/^0x[0-9a-f]{40}$/i.test(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  // Clean up expired nonces
  await prisma.nonce.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });

  const nonce = generateNonce();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

  await prisma.nonce.create({
    data: { address, nonce, expiresAt },
  });

  return NextResponse.json({ nonce });
}
