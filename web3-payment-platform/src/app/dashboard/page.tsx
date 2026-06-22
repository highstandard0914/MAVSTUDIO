"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { Card, StatCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { formatAmount, formatDate, txTypeLabel, txTypeColor } from "@/lib/utils";
import type { TransactionRecord } from "@/types";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/connect");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/transactions?page=1")
      .then((r) => r.json())
      .then((d) => setTransactions(d.transactions?.slice(0, 5) || []));
  }, [user]);

  const copyAddress = () => {
    if (!user?.depositAddress) return;
    navigator.clipboard.writeText(user.depositAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">마이페이지</h1>
        <p className="text-gray-500 text-sm font-mono">{user.walletAddress}</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="보유 잔액"
          value={`${formatAmount(user.balance)} ETH`}
          sub="사이트 내부 잔액"
          color="brand"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="입금"
          value="입금하기"
          sub="전용 주소로 ETH 입금"
          color="green"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
            </svg>
          }
        />
        <StatCard
          label="출금"
          value="출금하기"
          sub="지갑으로 ETH 출금"
          color="orange"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          }
        />
        <StatCard
          label="최근 거래"
          value={`${transactions.length}건`}
          sub="최근 5건 기준"
          color="blue"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
            </svg>
          }
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Deposit Address Card */}
        <div className="lg:col-span-1 space-y-4">
          <Card glow className="p-5">
            <p className="text-sm text-gray-400 mb-3 font-medium">내 전용 입금 주소</p>
            <div className="bg-surface-700 rounded-xl p-3 mb-3 border border-white/5">
              <p className="text-xs text-gray-500 break-all font-mono leading-relaxed">
                {user.depositAddress}
              </p>
            </div>
            <button
              onClick={copyAddress}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm hover:bg-brand-500/20 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {copied ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                )}
              </svg>
              {copied ? "복사됨!" : "주소 복사"}
            </button>
            <p className="text-xs text-gray-600 mt-2 text-center">
              이 주소로만 입금하세요 (ETH 전용)
            </p>
          </Card>

          {/* Quick Actions */}
          <Card className="p-5">
            <p className="text-sm text-gray-400 mb-3 font-medium">빠른 메뉴</p>
            <div className="space-y-2">
              <Link href="/deposit" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors group cursor-pointer">
                <span className="text-green-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3" />
                  </svg>
                </span>
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">입금하기</span>
                <svg className="w-3.5 h-3.5 text-gray-600 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <Link href="/withdraw" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors group cursor-pointer">
                <span className="text-orange-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </span>
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">출금하기</span>
                <svg className="w-3.5 h-3.5 text-gray-600 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <Link href="/transactions" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors group cursor-pointer">
                <span className="text-blue-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </span>
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">거래 내역</span>
                <svg className="w-3.5 h-3.5 text-gray-600 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </Card>
        </div>

        {/* Recent Transactions */}
        <div className="lg:col-span-2">
          <Card>
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="font-semibold text-white">최근 거래 내역</h2>
              <Link href="/transactions">
                <Button variant="ghost" size="sm">전체 보기</Button>
              </Link>
            </div>
            {transactions.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <svg className="w-10 h-10 text-gray-700 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-gray-600 text-sm">아직 거래 내역이 없습니다</p>
                <Link href="/deposit" className="mt-3 inline-block">
                  <Button size="sm">첫 입금하기</Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {transactions.map((tx) => (
                  <div key={tx.id} className="px-6 py-4 flex items-center justify-between hover:bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        tx.type === "DEPOSIT" ? "bg-green-500/10" :
                        tx.type === "WITHDRAWAL" ? "bg-orange-500/10" :
                        tx.type === "REFUND" ? "bg-blue-500/10" : "bg-gray-500/10"
                      }`}>
                        <svg className={`w-4 h-4 ${txTypeColor(tx.type)}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          {tx.type === "DEPOSIT" || tx.type === "REFUND" ? (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m0 0l-3-3m3 3l3-3" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15V9m0 0l-3 3m3-3l3 3" />
                          )}
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-white font-medium">{txTypeLabel(tx.type)}</p>
                        <p className="text-xs text-gray-500">{formatDate(tx.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${txTypeColor(tx.type)}`}>
                        {["DEPOSIT", "REFUND"].includes(tx.type) ? "+" : "-"}{formatAmount(tx.amount)} ETH
                      </p>
                      <p className="text-xs text-gray-600">잔액 {formatAmount(tx.balanceAfter)} ETH</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
