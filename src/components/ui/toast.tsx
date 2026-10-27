"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ToastKind = "info" | "success" | "warn" | "error";
type ToastItem = { id: number; kind: ToastKind; message: string };
type ToastCtx = { push: (message: string, kind?: ToastKind) => void };

const Ctx = createContext<ToastCtx | null>(null);

const COLORS: Record<ToastKind, string> = {
  info: "bg-blue-500",
  success: "bg-emerald-500",
  warn: "bg-amber-500",
  error: "bg-red-500",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((message: string, kind: ToastKind = "info") => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, kind, message }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);
  const value = useMemo(() => ({ push }), [push]);
  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[60] space-y-2 w-80 pointer-events-none">
        {items.map((t) => (
          <div
            key={t.id}
            className={`${COLORS[t.kind]} text-white px-4 py-3 rounded-lg shadow-lg text-sm pointer-events-auto`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // 토스트 없이도 조용히 작동
    return {
      push: (msg: string) => {
        if (typeof window !== "undefined") console.log("[toast]", msg);
      },
    };
  }
  return ctx;
}

export function useAutoDismiss(deps: unknown[], onDismiss: () => void, ms = 3000) {
  useEffect(() => {
    const t = window.setTimeout(onDismiss, ms);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
