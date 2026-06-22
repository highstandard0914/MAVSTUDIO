import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { prisma } from "@/lib/prisma";
import { signToken, setSessionCookie } from "@/lib/auth";
import { deriveDepositAddress } from "@/lib/wallet";

export async function POST(req: NextRequest) {
  try {
    const { address, signature, nonce } = await req.json();

    if (!address || !signature || !nonce) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const normalizedAddress = address.toLowerCase();

    // Verify nonce
    const nonceRecord = await prisma.nonce.findUnique({ where: { nonce } });
    if (
      !nonceRecord ||
      nonceRecord.used ||
      nonceRecord.address !== normalizedAddress ||
      nonceRecord.expiresAt < new Date()
    ) {
      return NextResponse.json({ error: "Invalid or expired nonce" }, { status: 401 });
    }

    // Verify signature
    const message = `Web3Pay에 로그인합니다.\n\nNonce: ${nonce}`;
    const recoveredAddress = ethers.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== normalizedAddress) {
      return NextResponse.json({ error: "Signature verification failed" }, { status: 401 });
    }

    // Mark nonce as used
    await prisma.nonce.update({ where: { nonce }, data: { used: true } });

    // Get or create user
    let user = await prisma.user.findUnique({ where: { walletAddress: normalizedAddress } });

    if (!user) {
      // Get next deposit index
      const count = await prisma.user.count();
      const depositIndex = count;
      const depositAddress = deriveDepositAddress(depositIndex);

      const adminAddresses = (process.env.ADMIN_WALLET_ADDRESSES || "")
        .split(",")
        .map((a) => a.trim().toLowerCase());
      const isAdmin = adminAddresses.includes(normalizedAddress);

      user = await prisma.user.create({
        data: {
          walletAddress: normalizedAddress,
          depositIndex,
          depositAddress,
          isAdmin,
        },
      });
    }

    const token = await signToken({
      id: user.id,
      walletAddress: user.walletAddress,
      depositAddress: user.depositAddress,
      balance: user.balance.toString(),
      isAdmin: user.isAdmin,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        depositAddress: user.depositAddress,
        balance: user.balance.toString(),
        isAdmin: user.isAdmin,
      },
    });
    response.headers.set("Set-Cookie", setSessionCookie(token));
    return response;
  } catch (err) {
    console.error("Auth verify error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
