"use client";

import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/Button";

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18-3a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3m18-3v3m0 0H3" />
      </svg>
    ),
    title: "지갑 연결로 가입",
    desc: "이메일·비밀번호 없이 MetaMask 또는 WalletConnect로 즉시 가입하세요.",
    color: "brand",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
      </svg>
    ),
    title: "전용 입금 주소",
    desc: "회원마다 고유 입금 주소가 발급됩니다. 입금 즉시 잔액이 자동 충전됩니다.",
    color: "green",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "내부 잔액 시스템",
    desc: "사이트 내부 잔액으로 상품 구매 및 서비스를 이용하세요.",
    color: "blue",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
    ),
    title: "빠른 출금",
    desc: "출금 신청 시 마스터 지갑에서 연결된 지갑으로 자동 송금됩니다.",
    color: "orange",
  },
];

const iconColors: Record<string, string> = {
  brand: "text-brand-400 bg-brand-500/10 border-brand-500/20",
  green: "text-green-400 bg-green-500/10 border-green-500/20",
  blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  orange: "text-orange-400 bg-orange-500/10 border-orange-500/20",
};

const stats = [
  { label: "지원 체인", value: "ETH" },
  { label: "지갑 지원", value: "MetaMask & WalletConnect" },
  { label: "최소 출금", value: "0.01 ETH" },
  { label: "보안", value: "HD Wallet" },
];

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 bg-grid-pattern bg-grid-size opacity-100"
        aria-hidden="true"
      />
      {/* Glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Hero */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-24 pb-20 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-medium mb-8 animate-fade-in">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse-slow" />
          Web3 기반 암호화폐 결제 플랫폼
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 animate-slide-up">
          지갑 하나로
          <br />
          <span className="text-gradient">모든 결제를</span>
        </h1>

        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up">
          이메일도, 비밀번호도 필요 없습니다. <br className="hidden sm:block" />
          지갑을 연결하고 입금·결제·출금을 한 곳에서 관리하세요.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
          {user ? (
            <>
              <Link href="/dashboard">
                <Button size="lg">마이페이지 바로가기</Button>
              </Link>
              <Link href="/deposit">
                <Button variant="secondary" size="lg">입금하기</Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/connect">
                <Button size="lg">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21.2 12c0-1.1-.3-2.1-.8-3H3.6c-.5.9-.8 1.9-.8 3s.3 2.1.8 3h16.8c.5-.9.8-1.9.8-3z"/>
                  </svg>
                  지갑 연결하기
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="secondary" size="lg">기능 살펴보기</Button>
              </Link>
            </>
          )}
        </div>

        {/* Stats row */}
        <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {stats.map((s) => (
            <div key={s.label} className="bg-surface-800/50 border border-white/10 rounded-xl px-4 py-3">
              <p className="text-xs text-gray-500 mb-1">{s.label}</p>
              <p className="text-sm font-semibold text-white">{s.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative px-4 sm:px-6 lg:px-8 py-20 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            왜 <span className="text-gradient">Web3Pay</span>인가요?
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            블록체인 기술과 HD 지갑을 활용해 안전하고 빠른 결제 환경을 제공합니다.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-surface-800 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors group"
            >
              <div className={`inline-flex p-3 rounded-xl border mb-4 ${iconColors[f.color]}`}>
                {f.icon}
              </div>
              <h3 className="text-white font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section className="relative px-4 sm:px-6 lg:px-8 py-20 max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-brand-900/50 to-purple-900/30 border border-brand-500/20 rounded-3xl p-10 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">지금 바로 시작하세요</h2>
            <p className="text-gray-400 mb-8">
              MetaMask 또는 WalletConnect로 30초 안에 가입 완료.
            </p>
            <Link href="/connect">
              <Button size="lg">무료로 시작하기</Button>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
