"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useConnect, useAccount, useSignMessage, useDisconnect } from "wagmi";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import toast from "react-hot-toast";

export default function ConnectPage() {
  const router = useRouter();
  const { user, refresh } = useAuth();
  const { connectors, connect, isPending: isConnecting } = useConnect();
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();
  const [isSigning, setIsSigning] = useState(false);
  const [step, setStep] = useState<"select" | "sign">("select");

  useEffect(() => {
    if (user) router.push("/dashboard");
  }, [user, router]);

  useEffect(() => {
    if (isConnected && address) setStep("sign");
    else setStep("select");
  }, [isConnected, address]);

  const handleSignIn = async () => {
    if (!address) return;
    setIsSigning(true);
    try {
      const nonceRes = await fetch(`/api/auth/nonce?address=${address}`);
      const { nonce } = await nonceRes.json();

      const message = `Web3Pay에 로그인합니다.\n\nNonce: ${nonce}`;
      const signature = await signMessageAsync({ message });

      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, signature, nonce }),
      });

      if (!verifyRes.ok) {
        const err = await verifyRes.json();
        throw new Error(err.error || "인증 실패");
      }

      await refresh();
      toast.success("로그인 성공!");
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "알 수 없는 오류";
      if (msg.includes("User rejected") || msg.includes("user rejected")) {
        toast.error("서명이 취소되었습니다");
      } else {
        toast.error(msg);
      }
    } finally {
      setIsSigning(false);
    }
  };

  const metamaskConnector = connectors.find((c) =>
    c.name.toLowerCase().includes("metamask") || c.id === "injected"
  );
  const wcConnector = connectors.find((c) =>
    c.name.toLowerCase().includes("walletconnect") || c.id === "walletConnect"
  );

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-brand items-center justify-center mb-5 shadow-xl shadow-brand-500/30">
            <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-white" stroke="currentColor" strokeWidth={2}>
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Web3Pay 로그인</h1>
          <p className="text-gray-400 text-sm">
            {step === "select"
              ? "지갑을 선택하여 연결하세요"
              : "서명으로 신원을 확인하세요"}
          </p>
        </div>

        <Card glow>
          <div className="p-6">
            {step === "select" ? (
              <>
                <p className="text-xs text-gray-500 mb-4 text-center uppercase tracking-wider">
                  지갑 선택
                </p>
                <div className="space-y-3">
                  {/* MetaMask */}
                  <button
                    onClick={() => metamaskConnector && connect({ connector: metamaskConnector })}
                    disabled={isConnecting}
                    className="w-full flex items-center gap-4 px-4 py-4 rounded-xl bg-surface-700 border border-white/10 hover:border-orange-500/40 hover:bg-orange-500/5 transition-all cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                      <svg viewBox="0 0 35 33" className="w-6 h-6" fill="none">
                        <path d="M32.9582 1L19.8241 10.7183L22.2665 5.09082L32.9582 1Z" fill="#E17726" stroke="#E17726" strokeWidth="0.25"/>
                        <path d="M2.04858 1L15.0707 10.809L12.7401 5.09082L2.04858 1Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25"/>
                        <path d="M28.2291 23.533L24.6537 29.1098L32.2399 31.2L34.4035 23.6522L28.2291 23.533Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25"/>
                        <path d="M0.608643 23.6522L2.76011 31.2L10.3463 29.1098L6.77094 23.533L0.608643 23.6522Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25"/>
                        <path d="M9.94798 14.5169L7.82715 17.6952L15.3418 18.0353L15.0908 9.91797L9.94798 14.5169Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25"/>
                        <path d="M25.0587 14.5169L19.8283 9.82714L19.6649 18.0353L27.1795 17.6952L25.0587 14.5169Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25"/>
                        <path d="M10.3463 29.1098L14.8825 26.9062L10.9816 23.7083L10.3463 29.1098Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25"/>
                        <path d="M20.1232 26.9062L24.6536 29.1098L24.0241 23.7083L20.1232 26.9062Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25"/>
                      </svg>
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-white font-medium">MetaMask</p>
                      <p className="text-gray-500 text-xs">브라우저 확장 지갑</p>
                    </div>
                    <svg className="w-4 h-4 text-gray-600 group-hover:text-orange-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* WalletConnect */}
                  <button
                    onClick={() => wcConnector && connect({ connector: wcConnector })}
                    disabled={isConnecting}
                    className="w-full flex items-center gap-4 px-4 py-4 rounded-xl bg-surface-700 border border-white/10 hover:border-blue-500/40 hover:bg-blue-500/5 transition-all cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <svg viewBox="0 0 300 185" className="w-6 h-6" fill="none">
                        <path d="M61.4385 36.2562C114.168 -15.4187 198.849 -15.4187 251.577 36.2562L257.824 42.4399C260.45 45.0199 260.45 49.1896 257.824 51.7696L235.905 73.39C234.592 74.68 232.45 74.68 231.137 73.39L222.557 64.9096C186.462 29.5276 113.554 29.5276 77.4592 64.9096L68.2889 73.9611C66.9763 75.2514 64.8341 75.2514 63.5215 73.9611L41.6026 52.3412C38.977 49.7612 38.977 45.5915 41.6026 43.0115L61.4385 36.2562ZM296.539 80.1243L316.181 99.5644C318.807 102.144 318.807 106.314 316.181 108.894L230.014 193.818C227.389 196.398 223.104 196.398 220.479 193.818L157.478 131.638C156.821 130.993 155.75 130.993 155.093 131.638L92.0924 193.818C89.4668 196.398 85.1824 196.398 82.5568 193.818L-3.61028 108.894C-6.23588 106.314 -6.23588 102.144 -3.61028 99.5644L15.7324 80.1243C18.358 77.5443 22.6424 77.5443 25.268 80.1243L88.269 142.304C88.9259 142.95 89.9971 142.95 90.654 142.304L153.655 80.1243C156.281 77.5443 160.565 77.5443 163.191 80.1243L226.192 142.304C226.849 142.95 227.92 142.95 228.577 142.304L291.578 80.1243C294.203 77.5443 298.488 77.5443 301.113 80.1243H296.539Z" fill="#3B99FC"/>
                      </svg>
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-white font-medium">WalletConnect</p>
                      <p className="text-gray-500 text-xs">모바일 지갑 QR 연결</p>
                    </div>
                    <svg className="w-4 h-4 text-gray-600 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                <p className="text-xs text-gray-600 text-center mt-5">
                  지갑 연결은 가스비가 발생하지 않습니다
                </p>
              </>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="inline-flex w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-400">지갑 연결됨</p>
                  <p className="text-white font-mono text-sm mt-1">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </p>
                </div>

                <div className="bg-surface-700 rounded-xl p-4 mb-5 border border-white/5">
                  <p className="text-xs text-gray-500 mb-2">서명 내용</p>
                  <p className="text-sm text-gray-300 font-mono leading-relaxed">
                    Web3Pay에 로그인합니다.
                  </p>
                  <p className="text-xs text-gray-600 mt-2">
                    * 이 서명은 블록체인에 기록되지 않으며 가스비가 없습니다
                  </p>
                </div>

                <div className="space-y-3">
                  <Button
                    className="w-full"
                    size="lg"
                    loading={isSigning}
                    onClick={handleSignIn}
                  >
                    서명으로 로그인
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full"
                    size="md"
                    onClick={() => disconnect()}
                  >
                    다른 지갑 선택
                  </Button>
                </div>
              </>
            )}
          </div>
        </Card>

        <p className="text-center text-xs text-gray-600 mt-6">
          연결함으로써{" "}
          <span className="text-gray-400">이용약관</span>에 동의하게 됩니다
        </p>
      </div>
    </div>
  );
}
