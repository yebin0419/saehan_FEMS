import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "비가동 분석기 · 새한프라텍 EMS",
  description:
    "새한프라텍 청주 공장 EMS 기반 설비 비가동 분석 및 알림 서비스",
};

const navItems = [
  { href: "/", label: "대시보드" },
  { href: "/upload", label: "데이터 수집" },
  { href: "/causes", label: "원인 분석" },
  { href: "/trends", label: "추세 뷰" },
  { href: "/alerts", label: "알림" },
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-800">
        <ToastProvider>
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-slate-900">
                비가동 분석기 <span className="text-blue-600">v2</span>
              </h1>
              <p className="text-xs text-slate-500">
                새한프라텍 EMS 기반 설비 가동 분석
              </p>
            </div>
          </div>
          <nav className="max-w-7xl mx-auto px-6 flex gap-6 text-sm">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="py-3 font-medium text-slate-600 hover:text-blue-600"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="max-w-7xl mx-auto w-full px-6 py-6 flex-1">
          {children}
        </main>
        </ToastProvider>
      </body>
    </html>
  );
}
