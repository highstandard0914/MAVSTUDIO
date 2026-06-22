"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { Card, StatCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { formatAmount, formatDate, shortenAddress } from "@/lib/utils";
import type { AdminUser, DepositRecord, WithdrawalRecord } from "@/types";
import toast from "react-hot-toast";

type Tab = "overview" | "users" | "deposits" | "withdrawals";

interface Stats {
  totalUsers: number;
  totalDeposits: number;
  totalWithdrawals: number;
  pendingWithdrawals: number;
  totalDepositAmount: string;
  totalWithdrawalAmount: string;
  totalUserBalance: string;
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [deposits, setDeposits] = useState<DepositRecord[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);
  const [wPage, setWPage] = useState(1);
  const [wPages, setWPages] = useState(1);
  const [dPage, setDPage] = useState(1);
  const [dPages, setDPages] = useState(1);
  const [uPage, setUPage] = useState(1);
  const [uPages, setUPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [wStatusFilter, setWStatusFilter] = useState("");
  const [fetching, setFetching] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [refundModal, setRefundModal] = useState<AdminUser | null>(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundNote, setRefundNote] = useState("");

  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) router.push("/");
  }, [user, loading, router]);

  const fetchStats = useCallback(async () => {
    const res = await fetch("/api/admin/stats");
    if (res.ok) setStats(await res.json());
  }, []);

  const fetchUsers = useCallback(async (p = 1) => {
    setFetching(true);
    const params = new URLSearchParams({ page: String(p) });
    if (searchQuery) params.set("search", searchQuery);
    const res = await fetch(`/api/admin/users?${params}`);
    const data = await res.json();
    setUsers(data.users || []);
    setUPages(data.pages || 1);
    setUPage(p);
    setFetching(false);
  }, [searchQuery]);

  const fetchDeposits = useCallback(async (p = 1) => {
    setFetching(true);
    const res = await fetch(`/api/admin/deposits?page=${p}`);
    const data = await res.json();
    setDeposits(data.deposits || []);
    setDPages(data.pages || 1);
    setDPage(p);
    setFetching(false);
  }, []);

  const fetchWithdrawals = useCallback(async (p = 1, status = wStatusFilter) => {
    setFetching(true);
    const params = new URLSearchParams({ page: String(p) });
    if (status) params.set("status", status);
    const res = await fetch(`/api/admin/withdrawals?${params}`);
    const data = await res.json();
    setWithdrawals(data.withdrawals || []);
    setWPages(data.pages || 1);
    setWPage(p);
    setFetching(false);
  }, [wStatusFilter]);

  useEffect(() => {
    if (!user?.isAdmin) return;
    fetchStats();
  }, [user, fetchStats]);

  useEffect(() => {
    if (!user?.isAdmin) return;
    if (tab === "users") fetchUsers(1);
    else if (tab === "deposits") fetchDeposits(1);
    else if (tab === "withdrawals") fetchWithdrawals(1);
  }, [tab, user]);

  const handleWithdrawalAction = async (withdrawalId: string, action: "approve" | "reject") => {
    setActionLoading(withdrawalId);
    try {
      const res = await fetch("/api/admin/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ withdrawalId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(action === "approve" ? "출금 처리 완료!" : "출금 거절 완료");
      await fetchWithdrawals(wPage);
      await fetchStats();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "처리 실패");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefund = async () => {
    if (!refundModal || !refundAmount) return;
    setActionLoading("refund");
    try {
      const res = await fetch("/api/admin/balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: refundModal.id,
          amount: refundAmount,
          type: "REFUND",
          description: refundNote || "관리자 환불",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("환불 처리 완료!");
      setRefundModal(null);
      setRefundAmount("");
      setRefundNote("");
      await fetchUsers(uPage);
      await fetchStats();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "환불 실패");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading || !user?.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "대시보드" },
    { id: "users", label: "회원 관리" },
    { id: "deposits", label: "입금 내역" },
    { id: "withdrawals", label: "출금 관리" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="px-3 py-1 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-medium">
          ADMIN
        </div>
        <h1 className="text-2xl font-bold text-white">관리자 패널</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 bg-surface-800 rounded-xl p-1 border border-white/10 w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              tab === t.id
                ? "bg-brand-500 text-white shadow-lg shadow-brand-500/25"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {t.label}
            {t.id === "withdrawals" && stats?.pendingWithdrawals ? (
              <span className="ml-2 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-xs">
                {stats.pendingWithdrawals}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && stats && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="총 회원수"
              value={`${stats.totalUsers}명`}
              color="brand"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              }
            />
            <StatCard
              label="총 입금 확인"
              value={`${stats.totalDeposits}건`}
              sub={`${formatAmount(stats.totalDepositAmount)} ETH`}
              color="green"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                </svg>
              }
            />
            <StatCard
              label="총 출금 완료"
              value={`${stats.totalWithdrawals}건`}
              sub={`${formatAmount(stats.totalWithdrawalAmount)} ETH`}
              color="orange"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              }
            />
            <StatCard
              label="출금 대기"
              value={`${stats.pendingWithdrawals}건`}
              color="red"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          </div>

          <Card className="p-6">
            <p className="text-sm font-medium text-gray-400 mb-4">전체 유저 잔액 합계</p>
            <p className="text-4xl font-bold text-white">
              {formatAmount(stats.totalUserBalance)} <span className="text-xl text-gray-500">ETH</span>
            </p>
            <p className="text-xs text-gray-600 mt-2">모든 회원의 사이트 내부 잔액 총합</p>
          </Card>
        </div>
      )}

      {/* Users */}
      {tab === "users" && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="지갑 주소 검색..."
              className="flex-1 bg-surface-700 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-500/50 font-mono"
            />
            <Button onClick={() => fetchUsers(1)}>검색</Button>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-6 py-3 text-xs text-gray-600 font-medium">지갑 주소</th>
                    <th className="text-left px-6 py-3 text-xs text-gray-600 font-medium hidden md:table-cell">입금 주소</th>
                    <th className="text-right px-6 py-3 text-xs text-gray-600 font-medium">잔액</th>
                    <th className="text-center px-6 py-3 text-xs text-gray-600 font-medium hidden lg:table-cell">거래수</th>
                    <th className="text-right px-6 py-3 text-xs text-gray-600 font-medium hidden lg:table-cell">가입일</th>
                    <th className="text-center px-6 py-3 text-xs text-gray-600 font-medium">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {fetching ? (
                    <tr><td colSpan={6} className="px-6 py-10 text-center">
                      <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    </td></tr>
                  ) : users.map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.02]">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {u.isAdmin && (
                            <span className="px-1.5 py-0.5 rounded text-xs bg-brand-500/10 text-brand-400 border border-brand-500/20">A</span>
                          )}
                          <span className="font-mono text-xs text-gray-300">{shortenAddress(u.walletAddress)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className="font-mono text-xs text-gray-500">{shortenAddress(u.depositAddress)}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-white font-semibold">{formatAmount(u.balance)} ETH</span>
                      </td>
                      <td className="px-6 py-4 text-center text-gray-500 text-xs hidden lg:table-cell">
                        입금 {u._count.deposits} · 출금 {u._count.withdrawals}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-500 text-xs hidden lg:table-cell">
                        {formatDate(u.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setRefundModal(u); setRefundAmount(""); setRefundNote(""); }}
                        >
                          환불
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {uPages > 1 && (
              <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
                <Button variant="secondary" size="sm" disabled={uPage <= 1} onClick={() => fetchUsers(uPage - 1)}>이전</Button>
                <span className="text-xs text-gray-500">{uPage} / {uPages}</span>
                <Button variant="secondary" size="sm" disabled={uPage >= uPages} onClick={() => fetchUsers(uPage + 1)}>다음</Button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Deposits */}
      {tab === "deposits" && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-6 py-3 text-xs text-gray-600 font-medium">유저 지갑</th>
                  <th className="text-left px-6 py-3 text-xs text-gray-600 font-medium">TX Hash</th>
                  <th className="text-right px-6 py-3 text-xs text-gray-600 font-medium">금액</th>
                  <th className="text-center px-6 py-3 text-xs text-gray-600 font-medium">상태</th>
                  <th className="text-right px-6 py-3 text-xs text-gray-600 font-medium">일시</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {fetching ? (
                  <tr><td colSpan={5} className="px-6 py-10 text-center">
                    <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td></tr>
                ) : deposits.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-600 text-sm">입금 내역 없음</td></tr>
                ) : deposits.map((d: DepositRecord & { userWallet?: string }) => (
                  <tr key={d.id} className="hover:bg-white/[0.02]">
                    <td className="px-6 py-4 font-mono text-xs text-gray-400">
                      {(d as { userWallet?: string }).userWallet ? shortenAddress((d as { userWallet: string }).userWallet) : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <a href={`https://sepolia.etherscan.io/tx/${d.txHash}`} target="_blank" rel="noopener noreferrer"
                        className="text-brand-400 hover:text-brand-300 font-mono text-xs">
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
          {dPages > 1 && (
            <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
              <Button variant="secondary" size="sm" disabled={dPage <= 1} onClick={() => fetchDeposits(dPage - 1)}>이전</Button>
              <span className="text-xs text-gray-500">{dPage} / {dPages}</span>
              <Button variant="secondary" size="sm" disabled={dPage >= dPages} onClick={() => fetchDeposits(dPage + 1)}>다음</Button>
            </div>
          )}
        </Card>
      )}

      {/* Withdrawals */}
      {tab === "withdrawals" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {["", "PENDING", "APPROVED", "PROCESSING", "COMPLETED", "REJECTED"].map((s) => (
              <button
                key={s}
                onClick={() => { setWStatusFilter(s); fetchWithdrawals(1, s); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  wStatusFilter === s
                    ? "bg-brand-500/20 text-brand-400 border border-brand-500/30"
                    : "text-gray-500 hover:text-gray-300 border border-transparent"
                }`}
              >
                {s || "전체"}
              </button>
            ))}
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-6 py-3 text-xs text-gray-600 font-medium">유저</th>
                    <th className="text-right px-6 py-3 text-xs text-gray-600 font-medium">금액</th>
                    <th className="text-left px-6 py-3 text-xs text-gray-600 font-medium hidden md:table-cell">TX Hash</th>
                    <th className="text-center px-6 py-3 text-xs text-gray-600 font-medium">상태</th>
                    <th className="text-right px-6 py-3 text-xs text-gray-600 font-medium hidden lg:table-cell">신청일</th>
                    <th className="text-center px-6 py-3 text-xs text-gray-600 font-medium">처리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {fetching ? (
                    <tr><td colSpan={6} className="px-6 py-10 text-center">
                      <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    </td></tr>
                  ) : withdrawals.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-600 text-sm">출금 내역 없음</td></tr>
                  ) : withdrawals.map((w: WithdrawalRecord & { userWallet?: string }) => (
                    <tr key={w.id} className="hover:bg-white/[0.02]">
                      <td className="px-6 py-4 font-mono text-xs text-gray-400">
                        {(w as { userWallet?: string }).userWallet ? shortenAddress((w as { userWallet: string }).userWallet) : "-"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-orange-400 font-semibold">{formatAmount(w.amount)} ETH</span>
                        <p className="text-xs text-gray-600">수수료 {formatAmount(w.fee)}</p>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        {w.txHash ? (
                          <a href={`https://sepolia.etherscan.io/tx/${w.txHash}`} target="_blank" rel="noopener noreferrer"
                            className="text-brand-400 hover:text-brand-300 font-mono text-xs">
                            {w.txHash.slice(0, 10)}...
                          </a>
                        ) : <span className="text-gray-600 text-xs">-</span>}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={w.status} />
                      </td>
                      <td className="px-6 py-4 text-right text-gray-500 text-xs hidden lg:table-cell">
                        {formatDate(w.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {w.status === "PENDING" ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              variant="primary"
                              size="sm"
                              loading={actionLoading === w.id}
                              onClick={() => handleWithdrawalAction(w.id, "approve")}
                            >
                              승인
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              loading={actionLoading === w.id}
                              onClick={() => handleWithdrawalAction(w.id, "reject")}
                            >
                              거절
                            </Button>
                          </div>
                        ) : (
                          <span className="text-gray-600 text-xs">처리완료</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {wPages > 1 && (
              <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
                <Button variant="secondary" size="sm" disabled={wPage <= 1} onClick={() => fetchWithdrawals(wPage - 1)}>이전</Button>
                <span className="text-xs text-gray-500">{wPage} / {wPages}</span>
                <Button variant="secondary" size="sm" disabled={wPage >= wPages} onClick={() => fetchWithdrawals(wPage + 1)}>다음</Button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Refund Modal */}
      {refundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card glow className="w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-white">환불 처리</h3>
              <button onClick={() => setRefundModal(null)} className="text-gray-500 hover:text-white cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="bg-surface-700 rounded-xl p-3 mb-4 border border-white/5">
              <p className="text-xs text-gray-500 mb-1">대상 유저</p>
              <p className="text-sm font-mono text-gray-300">{refundModal.walletAddress}</p>
              <p className="text-xs text-gray-500 mt-1">현재 잔액: {formatAmount(refundModal.balance)} ETH</p>
            </div>

            <div className="mb-3">
              <label className="block text-xs text-gray-500 mb-2">환불 금액 (ETH)</label>
              <input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="0.0"
                className="w-full bg-surface-700 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500/50"
              />
            </div>
            <div className="mb-5">
              <label className="block text-xs text-gray-500 mb-2">사유 (선택)</label>
              <input
                type="text"
                value={refundNote}
                onChange={(e) => setRefundNote(e.target.value)}
                placeholder="환불 사유를 입력하세요"
                className="w-full bg-surface-700 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500/50"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setRefundModal(null)}>취소</Button>
              <Button
                className="flex-1"
                loading={actionLoading === "refund"}
                disabled={!refundAmount || parseFloat(refundAmount) <= 0}
                onClick={handleRefund}
              >
                환불하기
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
