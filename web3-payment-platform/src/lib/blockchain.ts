import { ethers } from "ethers";
import { prisma } from "./prisma";
import { getProvider, formatEth, getMasterWallet } from "./wallet";
import { Decimal } from "@prisma/client/runtime/library";

export async function checkDepositByTxHash(txHash: string): Promise<{
  success: boolean;
  deposit?: {
    amount: string;
    fromAddress: string;
    toAddress: string;
    blockNumber: number;
  };
  error?: string;
}> {
  try {
    const provider = getProvider();
    const tx = await provider.getTransaction(txHash);
    if (!tx) return { success: false, error: "Transaction not found" };

    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt || !receipt.status) {
      return { success: false, error: "Transaction failed or pending" };
    }

    const currentBlock = await provider.getBlockNumber();
    const required = parseInt(process.env.REQUIRED_CONFIRMATIONS || "12");
    if (currentBlock - Number(receipt.blockNumber) < required) {
      return { success: false, error: "Insufficient confirmations" };
    }

    return {
      success: true,
      deposit: {
        amount: formatEth(tx.value),
        fromAddress: tx.from.toLowerCase(),
        toAddress: (tx.to || "").toLowerCase(),
        blockNumber: Number(receipt.blockNumber),
      },
    };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function processDeposit(
  txHash: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const existing = await prisma.deposit.findUnique({ where: { txHash } });
  if (existing) return { success: false, error: "Duplicate transaction" };

  const result = await checkDepositByTxHash(txHash);
  if (!result.success || !result.deposit) {
    return { success: false, error: result.error };
  }

  const { amount, fromAddress, toAddress, blockNumber } = result.deposit;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { depositAddress: true, balance: true },
  });

  if (!user || user.depositAddress.toLowerCase() !== toAddress) {
    return { success: false, error: "Address mismatch" };
  }

  await prisma.$transaction(async (tx) => {
    const amountDecimal = new Decimal(amount);
    const newBalance = new Decimal(user.balance.toString()).add(amountDecimal);

    await tx.deposit.create({
      data: {
        userId,
        txHash,
        amount: amountDecimal,
        fromAddress,
        toAddress,
        blockNumber,
        status: "CONFIRMED",
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: { balance: newBalance },
    });

    await tx.transaction.create({
      data: {
        userId,
        type: "DEPOSIT",
        amount: amountDecimal,
        balanceBefore: new Decimal(user.balance.toString()),
        balanceAfter: newBalance,
        description: `ETH 입금 (TX: ${txHash.slice(0, 10)}...)`,
        refId: txHash,
      },
    });
  });

  return { success: true };
}

export async function sendWithdrawal(
  toAddress: string,
  amountEth: string
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    const wallet = getMasterWallet();
    const fee = ethers.parseEther(process.env.WITHDRAWAL_FEE || "0.001");
    const amount = ethers.parseEther(amountEth);
    const netAmount = amount - fee;

    if (netAmount <= 0n) {
      return { success: false, error: "Amount too small after fee deduction" };
    }

    const gasEstimate = await wallet.provider!.estimateGas({
      to: toAddress,
      value: netAmount,
    });

    const tx = await wallet.sendTransaction({
      to: toAddress,
      value: netAmount,
      gasLimit: gasEstimate,
    });

    await tx.wait(1);
    return { success: true, txHash: tx.hash };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
