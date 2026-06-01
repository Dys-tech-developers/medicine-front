"use client";

import { useCallback, useRef, useState } from "react";

export type ToastKind = "success" | "error";

export type ToastItem = {
  id: number;
  message: string;
  description?: string;
  kind: ToastKind;
};

export function useToast(durationMs = 4500) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, kind: ToastKind, description?: string) => {
      const id = ++counter.current;
      setToasts((prev) => [...prev, { id, message, description, kind }]);
      window.setTimeout(() => dismiss(id), durationMs);
    },
    [dismiss, durationMs]
  );

  return { toasts, showToast, dismiss };
}
