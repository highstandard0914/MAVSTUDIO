"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { formatAmount, formatDate, shortenAddress } from "@/lib/utils";
import type { WithdrawalRecord } from "@/types";
import toast from "react-hot-toast";

const MIN_WITHDRAWAL = 0.01;
const WITHDRAWAL_FEE = 0.001;

export default function WithdrawPage() {
  const { user, loading, refresh } = useAuth();
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/connect");
  }, [user, loading, router]);

  const fetchWithdrawals = async (p = 1) => {
    setFetching(true);
    try {
      const res = await fetch(`/api/withdraw?page=${p}`);
      const data = await res.json();
      setWithdrawals(data.withdrawals || []);
      setPages(data.pages || 1);
      setPage(p);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (user) fetchWithdrawals(1);
  }, [user]);

  const amountNum = parseFloat(amount) || 0;
  const netAmount = Math.max(0, amountNum - WITHDRAWAL_FEE);
  const isValid = amountNum >= MIN_WITHDRAWAL && amountNum <= parseFloat(user?.balance || "0");

  const handleWithdraw = async () => {
    if (!isValid || !confirmed) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("출금 신청이 접수되었습니다!");
      setAmount("");
      setConfirmed(false);
      await fetchWithdrawals(1);
      await refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "출금 신청 실패");
    } finally {
      setSubmitting(false);
    }
  };

  const setMax = () => {
    if (!user) return;
    const max = Math.max(0, parseFloat(user.balance) - WITHDRAWAL_FEE);
    setAmount(max.toFixed(6));
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">출금</h1>
        <p className="text-gray-500 text-sm">마스터 지갑에서 연결된 지갑으로 자동 송금됩니다</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Withdraw Form */}
        <Card glow className="p-6">
          <p className="text-sm font-medium text-gray-400 mb-5">출금 신청</p>

          {/* Balance */}
          <div className="bg-surface-700 rounded-xl p-4 mb-5 border border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">사용 가능 잔액</span>
              <button onClick={setMax} className="text-xs text-brand-400 hover:text-brand-300 cursor-pointer">최대</button>
            </div>
            <p className="text-2xl font-bold text-white mt-1">
              {formatAmount(user.balance)} <span className="text-base text-gray-500">ETH</span>
            </p>
          </div>

          {/* Amount Input */}
          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-2">출금 금액 (ETH)</label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`최소 ${MIN_WITHDRAWAL} ETH`}
                min={MIN_WITHDRAWAL}
                step="0.001"
                className="w-full bg-surface-700 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-500/50 transition-colors pr-16"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">ETH</span>
            </div>
          </div>

          {/* Fee Info */}
          {amountNum > 0 && (
            <div className="bg-surface-700/50 rounded-xl p-4 mb-4 border border-white/5 space-y-2 text-sm">
              <div className="flex justify-between text-gray-400">
                <span>출금 금액</span>
                <span>{amountNum.toFixed(6)} ETH</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>수수료</span>
                <span>- {WITHDRAWAL_FEE} ETH</span>
              </div>
              <div className="flex justify-between text-white font-semibold border-t border-white/10 pt-2">
                <span>실수령액</span>
                <span>{netAmount.toFixed(6)} ETH</span>
              </div>
            </div>
          )}

          {/* Destination */}
          <div className="bg-surface-700 rounded-xl p-3 mb-4 border border-white/5">
            <p className="text-xs text-gray-500 mb-1">출금 주소</p>
            <p className="text-sm font-mono text-gray-300">{user.walletAddress}</p>
          </div>

          {/* Confirm Checkbox */}
          <label className="flex items-start gap-3 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-white/20 bg-surface-700 accent-brand-500 cursor-pointer"
            />
            <span className="text-xs text-gray-500 leading-relaxed">
              출금 후 취소가 불가능함을 확인했습니다. 위 지갑 주소로 {netAmount.toFixed(6)} ETH가 전송됩니다.
            </span>
          </label>

          <Button
            className="w-full"
            size="lg"
            onClick={handleWithdraw}
            loading={submitting}
            disabled={!isValid || !confirmed}
          >
            출금 신청하기
          </Button>

          {amountNum > 0 && amountNum < MIN_WITHDRAWAL && (
            <p className="text-xs text-red-400 mt-2 text-center">
              최소 출금 금액은 {MIN_WITHDRAWAL} ETH입니다
            </p>
          )}
          {amountNum > parseFloat(user.balance) && (
            <p className="text-xs text-red-400 mt-2 text-center">잔액이 부족합니다</p>
          )}
        </Card>

        {/* Info Card */}
        <div className="space-y-4">
          <Card className="p-5">
            <p className="text-sm font-medium text-gray-400 mb-4">출금 안내</p>
            <ul className="space-y-3">
              {[
                { icon: "⏱", text: "출금 신청 후 관리자 승인 시 자동 송금됩니다" },
                { icon: "💸", text: `수수료 ${WITHDRAWAL_FEE} ETH가 차감됩니다` },
                { icon: "📋", text: `최소 출금 금액은 ${MIN_WITHDRAWAL} ETH입니다` },
                { icon: "🔒", text: "일일 최대 3회 출금 신청 가능합니다" },
                { icon: "✅", text: "가입 시 연결한 지갑 주소로만 출금됩니다" },
              ].map((item) => (
                <li key={item.text} className="flex items-start gap-3">
                  <span className="text-base">{item.icon}</span>
                  <span className="text-xs text-gray-500 leading-relaxed">{item.text}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5">
            <p className="text-sm font-medium text-gray-400 mb-3">출금 대상 지갑</p>
            <div className="flex items-center gap-3 p-3 bg-surface-700 rounded-xl border border-white/5">
              <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18-3a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3m18-3v3m0 0H3" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">연결된 지갑</p>
                <p className="text-sm font-mono text-white">{shortenAddress(user.walletAddress)}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Withdrawal History */}
      <Card>
        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="font-semibold text-white">출금 내역</h2>
        </div>
        {fetching ? (
          <div className="py-12 flex justify-center">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-600 text-sm">출금 내역이 없습니다</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-6 py-3 text-xs text-gray-600 font-medium">금액</th>
                    <th className="text-left px-6 py-3 text-xs text-gray-600 font-medium">TX Hash</th>
                    <th className="text-center px-6 py-3 text-xs text-gray-600 font-medium">상태</th>
                    <th className="text-right px-6 py-3 text-xs text-gray-600 font-medium">신청일시</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-orange-400 font-semibold">-{formatAmount(w.amount)} ETH</p>
                        <p className="text-xs text-gray-600">수수료 {formatAmount(w.fee)} ETH</p>
                      </td>
                      <td className="px-6 py-4">
                        {w.txHash ? (
                          <a
                            href={`https://sepolia.etherscan.io/tx/${w.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-400 hover:text-brand-300 font-mono text-xs"
                          >
                            {w.txHash.slice(0, 10)}...{w.txHash.slice(-6)}
                          </a>
                        ) : (
                          <span className="text-gray-600 text-xs">처리 대기중</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={w.status} />
                      </td>
                      <td className="px-6 py-4 text-right text-gray-500 text-xs">
                        {formatDate(w.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pages > 1 && (
              <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
                <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => fetchWithdrawals(page - 1)}>이전</Button>
                <span className="text-xs text-gray-500">{page} / {pages}</span>
                <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => fetchWithdrawals(page + 1)}>다음</Button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
