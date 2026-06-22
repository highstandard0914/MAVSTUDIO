"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "@/providers/AuthProvider";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { formatAmount, formatDate } from "@/lib/utils";
import type { DepositRecord } from "@/types";
import toast from "react-hot-toast";

export default function DepositPage() {
  const { user, loading, refresh } = useAuth();
  const router = useRouter();
  const [deposits, setDeposits] = useState<DepositRecord[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [copied, setCopied] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/connect");
  }, [user, loading, router]);

  const fetchDeposits = async (p = 1) => {
    setFetching(true);
    try {
      const res = await fetch(`/api/deposit?page=${p}`);
      const data = await res.json();
      setDeposits(data.deposits || []);
      setPages(data.pages || 1);
      setPage(p);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (user) fetchDeposits(1);
  }, [user]);

  const copyAddress = () => {
    if (!user?.depositAddress) return;
    navigator.clipboard.writeText(user.depositAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitTx = async () => {
    if (!txHash.trim()) return toast.error("트랜잭션 해시를 입력하세요");
    setSubmitting(true);
    try {
      const res = await fetch("/api/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash: txHash.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("입금이 처리되었습니다!");
      setTxHash("");
      await fetchDeposits(1);
      await refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "처리 실패");
    } finally {
      setSubmitting(false);
    }
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
        <h1 className="text-2xl font-bold text-white mb-1">입금</h1>
        <p className="text-gray-500 text-sm">전용 주소로 ETH를 입금하면 자동으로 잔액이 충전됩니다</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* QR + Address */}
        <Card glow className="p-6">
          <p className="text-sm font-medium text-gray-400 mb-5">내 전용 입금 주소</p>

          <div className="flex justify-center mb-5">
            <div className="p-3 bg-white rounded-2xl">
              <QRCodeSVG
                value={user.depositAddress}
                size={160}
                level="M"
                includeMargin={false}
              />
            </div>
          </div>

          <div className="bg-surface-700 rounded-xl p-4 mb-4 border border-white/5">
            <p className="text-xs text-gray-500 mb-1.5">입금 주소 (ETH)</p>
            <p className="text-sm font-mono text-white break-all">{user.depositAddress}</p>
          </div>

          <button
            onClick={copyAddress}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm hover:bg-brand-500/20 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {copied ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              )}
            </svg>
            {copied ? "복사됨!" : "주소 복사하기"}
          </button>

          <div className="mt-4 space-y-2">
            <div className="flex items-start gap-2 text-xs text-gray-600">
              <svg className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              이 주소는 본인 전용입니다. 타인과 공유하지 마세요.
            </div>
            <div className="flex items-start gap-2 text-xs text-gray-600">
              <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              ETH만 입금 가능합니다. 다른 토큰은 복구가 불가합니다.
            </div>
          </div>
        </Card>

        {/* Manual TX Submit */}
        <Card className="p-6">
          <p className="text-sm font-medium text-gray-400 mb-5">입금 수동 처리</p>
          <p className="text-xs text-gray-500 mb-4 leading-relaxed">
            자동 감지가 안 될 경우 트랜잭션 해시를 직접 입력하여 입금을 처리할 수 있습니다.
          </p>

          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-2">트랜잭션 해시 (TX Hash)</label>
            <input
              type="text"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              placeholder="0x..."
              className="w-full bg-surface-700 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 font-mono focus:outline-none focus:border-brand-500/50 transition-colors"
            />
          </div>
          <Button
            className="w-full"
            onClick={handleSubmitTx}
            loading={submitting}
            disabled={!txHash.trim()}
          >
            입금 처리하기
          </Button>

          <div className="mt-6 p-4 bg-surface-700/50 rounded-xl border border-white/5">
            <p className="text-xs font-medium text-gray-400 mb-3">현재 잔액</p>
            <p className="text-3xl font-bold text-white">{formatAmount(user.balance)} <span className="text-lg text-gray-500">ETH</span></p>
          </div>
        </Card>
      </div>

      {/* Deposit History */}
      <Card>
        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="font-semibold text-white">입금 내역</h2>
        </div>
        {fetching ? (
          <div className="py-12 flex justify-center">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : deposits.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-600 text-sm">입금 내역이 없습니다</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-6 py-3 text-xs text-gray-600 font-medium">TX Hash</th>
                    <th className="text-right px-6 py-3 text-xs text-gray-600 font-medium">금액</th>
                    <th className="text-center px-6 py-3 text-xs text-gray-600 font-medium">상태</th>
                    <th className="text-right px-6 py-3 text-xs text-gray-600 font-medium">일시</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {deposits.map((d) => (
                    <tr key={d.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <a
                          href={`https://sepolia.etherscan.io/tx/${d.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-400 hover:text-brand-300 font-mono text-xs"
                        >
                          {d.txHash.slice(0, 10)}...{d.txHash.slice(-6)}
                        </a>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-green-400 font-semibold">+{formatAmount(d.amount)} ETH</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={d.status} />
                      </td>
                      <td className="px-6 py-4 text-right text-gray-500 text-xs">
                        {formatDate(d.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pages > 1 && (
              <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
                <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => fetchDeposits(page - 1)}>이전</Button>
                <span className="text-xs text-gray-500">{page} / {pages}</span>
                <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => fetchDeposits(page + 1)}>다음</Button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
