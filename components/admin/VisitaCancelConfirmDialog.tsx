"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Loader2, X, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VisitaListItemDto } from "@/lib/api/types";
import { getPacienteNombre } from "@/lib/visitas-display";

type VisitaCancelConfirmDialogProps = {
  open: boolean;
  visita: VisitaListItemDto | null;
  loading: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function VisitaCancelConfirmDialog({
  open,
  visita,
  loading,
  error,
  onConfirm,
  onCancel,
}: VisitaCancelConfirmDialogProps) {
  useEffect(() => {
    if (!open || loading) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, loading, onCancel]);

  if (!open || !visita || typeof document === "undefined") return null;

  const paciente = getPacienteNombre(visita);

  return createPortal(
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="visita-cancel-title"
      aria-describedby="visita-cancel-desc"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-pointer bg-medical-text/55 backdrop-blur-sm"
        aria-label="Cerrar"
        disabled={loading}
        onClick={onCancel}
      />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-medical-border bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-medical-warning/40 bg-medical-warning/15 px-5 py-4">
          <div className="flex items-center gap-2 text-medical-text">
            <XCircle className="size-5 shrink-0 text-medical-warning" />
            <h2 id="visita-cancel-title" className="text-base font-semibold">
              Cancelar visita
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="cursor-pointer text-medical-mutedText hover:bg-medical-warning/20"
            disabled={loading}
            onClick={onCancel}
          >
            <X className="size-5" />
          </Button>
        </div>

        <div className="space-y-3 px-5 py-5 sm:px-6">
          <p id="visita-cancel-desc" className="text-sm leading-relaxed text-medical-text">
            ¿Cancelar la visita iniciada de{" "}
            <span className="font-semibold text-medical-primary">{paciente}</span>? Quedará como
            cancelada sin generar finanzas.
          </p>
          {error ? (
            <p className="rounded-lg border border-medical-danger/30 bg-medical-danger/10 px-3 py-2 text-sm text-medical-danger">
              {error}
            </p>
          ) : null}
          {loading ? (
            <p className="inline-flex items-center gap-2 text-sm text-medical-mutedText">
              <Loader2 className="size-4 animate-spin text-medical-primary" />
              Cancelando…
            </p>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-medical-border bg-medical-surface/80 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer sm:min-w-[100px]"
            disabled={loading}
            onClick={onCancel}
          >
            Volver
          </Button>
          <Button
            type="button"
            className="cursor-pointer bg-medical-warning text-white hover:bg-medical-warning/90 sm:min-w-[160px]"
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Procesando…
              </>
            ) : (
              "Sí, cancelar"
            )}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
