"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, X, XCircle } from "lucide-react";
import type { ToastItem } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

/** Por encima de navbar (z-50), dropdowns (z-60) y modales (z-100–120). */
const TOAST_Z_INDEX = 9999;

type ToastStackProps = {
  toasts: ToastItem[];
  onDismiss?: (id: number) => void;
};

const toastVariants = {
  success: {
    shell:
      "border-medical-border bg-medical-secondary shadow-[0_12px_36px_-10px_rgba(69,76,146,0.28)] ring-1 ring-medical-primary/25",
    iconWrap: "bg-medical-primary/15 text-medical-primary",
    title: "text-medical-text",
    description: "text-medical-primaryDark",
    close:
      "text-medical-primaryDark/80 hover:bg-medical-primary/10 hover:text-medical-primaryDark",
  },
  error: {
    shell:
      "border-medical-danger/30 bg-medical-danger/10 shadow-[0_12px_36px_-10px_rgba(220,38,38,0.28)] ring-1 ring-medical-danger/20",
    iconWrap: "bg-medical-danger/15 text-medical-danger",
    title: "text-medical-text",
    description: "text-medical-danger",
    close: "text-medical-danger/80 hover:bg-medical-danger/10 hover:text-medical-danger",
  },
} as const;

export function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || toasts.length === 0 || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-5 flex flex-col items-end gap-3 px-4 sm:px-6 md:top-6"
      style={{ zIndex: TOAST_Z_INDEX }}
    >
      {toasts.map((t) => {
        const v = toastVariants[t.kind];
        return (
          <div
            key={t.id}
            role="status"
            className={cn(
              "pointer-events-auto toast-enter flex w-full max-w-md items-start gap-3 rounded-2xl border px-4 py-3.5",
              v.shell
            )}
          >
            <div
              className={cn(
                "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                v.iconWrap
              )}
            >
              {t.kind === "success" ? (
                <CheckCircle2 className="h-5 w-5" aria-hidden />
              ) : (
                <XCircle className="h-5 w-5" aria-hidden />
              )}
            </div>
            <div className="min-w-0 flex-1 pr-1">
              <p className={cn("text-sm font-semibold", v.title)}>{t.message}</p>
              {t.description ? (
                <p className={cn("mt-0.5 text-xs leading-relaxed", v.description)}>
                  {t.description}
                </p>
              ) : null}
            </div>
            {onDismiss ? (
              <button
                type="button"
                onClick={() => onDismiss(t.id)}
                className={cn("shrink-0 rounded-lg p-1 transition", v.close)}
                aria-label="Cerrar notificación"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        );
      })}
    </div>,
    document.body
  );
}
