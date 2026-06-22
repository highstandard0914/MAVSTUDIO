import type { Metadata } from "next";
import "./globals.css";
import { Web3Provider } from "@/providers/Web3Provider";
import { AuthProvider } from "@/providers/AuthProvider";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Web3Pay — 암호화폐 결제 플랫폼",
  description: "지갑 연결만으로 가입하고, ETH를 입금·출금·결제하세요.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <Web3Provider>
          <AuthProvider>
            <Navbar />
            <main className="min-h-screen pt-16">{children}</main>
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: "#1a1a27",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                },
                success: { iconTheme: { primary: "#4ade80", secondary: "#1a1a27" } },
                error: { iconTheme: { primary: "#f87171", secondary: "#1a1a27" } },
              }}
            />
          </AuthProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
