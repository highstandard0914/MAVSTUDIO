"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatAmount, formatDate, txTypeLabel, txTypeColor } from "@/lib/utils";
import type { TransactionRecord } from "@/types";

const TX_TYPES = [
  { value: "", label: "전체" },
  { value: "DEPOSIT", label: "입금" },
  { value: "WITHDRAWAL", label: "출금" },
  { value: "PURCHASE", label: "구매" },
  { value: "REFUND", label: "환불" },
  { value: "ADJUSTMENT", label: "조정" },
];

export default function TransactionsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [typeFilter, setTypeFilter] = useState("");
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/connect");
  }, [user, loading, router]);

  const fetchTx = async (p = 1, type = typeFilter) => {
    setFetching(true);
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (type) params.set("type", type);
      const res = await fetch(`/api/transactions?${params}`);
      const data = await res.json();
      setTransactions(data.transactions || []);
      setPages(data.pages || 1);
      setTotal(data.total || 0);
      setPage(p);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (user) fetchTx(1, typeFilter);
  }, [user, typeFilter]);

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
        <h1 className="text-2xl font-bold text-white mb-1">거래 내역</h1>
        <p className="text-gray-500 text-sm">총 {total}건의 거래 내역</p>
      </div>

      <Card>
        {/* Filter Tabs */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center gap-2 overflow-x-auto">
          {TX_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setTypeFilter(t.value)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                typeFilter === t.value
                  ? "bg-brand-500/20 text-brand-400 border border-brand-500/30"
                  : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Table */}
        {fetching ? (
          <div className="py-16 flex justify-center">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-16 text-center">
            <svg className="w-10 h-10 text-gray-700 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-600 text-sm">거래 내역이 없습니다</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-6 py-3 text-xs text-gray-600 font-medium">유형</th>
                    <th className="text-right px-6 py-3 text-xs text-gray-600 font-medium">금액</th>
                    <th className="text-right px-6 py-3 text-xs text-gray-600 font-medium hidden md:table-cell">변동 전</th>
                    <th className="text-right px-6 py-3 text-xs text-gray-600 font-medium">변동 후</th>
                    <th className="text-left px-6 py-3 text-xs text-gray-600 font-medium hidden lg:table-cell">설명</th>
                    <th className="text-right px-6 py-3 text-xs text-gray-600 font-medium">일시</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {transactions.map((tx) => {
                    const isPositive = ["DEPOSIT", "REFUND"].includes(tx.type);
                    return (
                      <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                              isPositive ? "bg-green-500/10" : "bg-red-500/10"
                            }`}>
                              <svg className={`w-3.5 h-3.5 ${txTypeColor(tx.type)}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                {isPositive ? (
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m0 0l-3-3m3 3l3-3" />
                                ) : (
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15V9m0 0l-3 3m3-3l3 3" />
                                )}
                              </svg>
                            </div>
                            <span className={`font-medium text-sm ${txTypeColor(tx.type)}`}>
                              {txTypeLabel(tx.type)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`font-semibold ${isPositive ? "text-green-400" : "text-red-400"}`}>
                            {isPositive ? "+" : "-"}{formatAmount(tx.amount)} ETH
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-gray-500 text-xs hidden md:table-cell">
                          {formatAmount(tx.balanceBefore)} ETH
                        </td>
                        <td className="px-6 py-4 text-right text-white text-xs font-medium">
                          {formatAmount(tx.balanceAfter)} ETH
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-xs hidden lg:table-cell max-w-48 truncate">
                          {tx.description || "-"}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-500 text-xs">
                          {formatDate(tx.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {pages > 1 && (
              <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
                <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => fetchTx(page - 1)}>이전</Button>
                <span className="text-xs text-gray-500">페이지 {page} / {pages}</span>
                <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => fetchTx(page + 1)}>다음</Button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
