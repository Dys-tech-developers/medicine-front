"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { CircleDollarSign, Loader2, Receipt, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VISITA_FINANZAS_UI } from "@/lib/visita-finanzas-labels";

export type VisitaFinanzasConfirmAction = "facturado" | "pagado";

type Props = {
  open: boolean;
  action: VisitaFinanzasConfirmAction | null;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

const COPY: Record<
  VisitaFinanzasConfirmAction,
  { title: string; description: string; confirm: string; Icon: typeof Receipt }
> = {
  facturado: {
    title: `Marcar como ${VISITA_FINANZAS_UI.facturado.estadoSi.toLowerCase()}`,
    description: `¿Confirmás marcar esta visita como ${VISITA_FINANZAS_UI.facturado.estadoSi.toLowerCase()}? ${VISITA_FINANZAS_UI.disclaimer}`,
    confirm: "Sí, marcar",
    Icon: Receipt,
  },
  pagado: {
    title: `Marcar como ${VISITA_FINANZAS_UI.pagado.estadoSi.toLowerCase()}`,
    description: `¿Confirmás marcar esta visita como ${VISITA_FINANZAS_UI.pagado.estadoSi.toLowerCase()}? ${VISITA_FINANZAS_UI.disclaimer}`,
    confirm: "Sí, marcar",
    Icon: CircleDollarSign,
  },
};

export function VisitaFinanzasConfirmDialog({
  open,
  action,
  loading,
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    if (!open || loading) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, loading, onCancel]);

  if (!open || !action || typeof document === "undefined") return null;

  const { title, description, confirm, Icon } = COPY[action];

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="visita-finanzas-confirm-title"
      aria-describedby="visita-finanzas-confirm-desc"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-pointer bg-medical-text/55 backdrop-blur-sm"
        aria-label="Cerrar"
        disabled={loading}
        onClick={onCancel}
      />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-medical-border bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-medical-border bg-medical-primary px-5 py-4">
          <div className="flex items-center gap-2 text-white">
            <Icon className="size-5 shrink-0" />
            <h2 id="visita-finanzas-confirm-title" className="text-base font-semibold">
              {title}
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="cursor-pointer text-white hover:bg-white/15 hover:text-white"
            disabled={loading}
            onClick={onCancel}
          >
            <X className="size-5" />
          </Button>
        </div>

        <div className="space-y-4 px-5 py-6 sm:px-6">
          <p id="visita-finanzas-confirm-desc" className="text-sm leading-relaxed text-medical-text">
            {description}
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              disabled={loading}
              onClick={onCancel}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="cursor-pointer bg-medical-primary hover:bg-medical-primaryDark"
              disabled={loading}
              onClick={onConfirm}
            >
              {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              {confirm}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
