"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VisitaListItemDto } from "@/lib/api/types";
import { getPacienteNombre } from "@/lib/visitas-display";

type VisitaDeleteConfirmDialogProps = {
  open: boolean;
  visita: VisitaListItemDto | null;
  loading: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function VisitaDeleteConfirmDialog({
  open,
  visita,
  loading,
  error,
  onConfirm,
  onCancel,
}: VisitaDeleteConfirmDialogProps) {
  useEffect(() => {
    if (!open || loading) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, loading, onCancel]);

  if (!open || !visita || typeof document === "undefined") return null;

  const insumos = visita.insumos ?? [];
  const paciente = getPacienteNombre(visita);

  return createPortal(
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="visita-delete-title"
      aria-describedby="visita-delete-desc"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-pointer bg-medical-text/55 backdrop-blur-sm"
        aria-label="Cerrar"
        disabled={loading}
        onClick={onCancel}
      />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-medical-border bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-medical-danger/30 bg-medical-danger/10 px-5 py-4">
          <div className="flex items-center gap-2 text-medical-danger">
            <Trash2 className="size-5 shrink-0" />
            <h2 id="visita-delete-title" className="text-base font-semibold">
              Eliminar visita
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="cursor-pointer text-medical-danger hover:bg-medical-danger/10"
            disabled={loading}
            onClick={onCancel}
          >
            <X className="size-5" />
          </Button>
        </div>

        <div className="space-y-3 px-5 py-5 sm:px-6">
          <p id="visita-delete-desc" className="text-sm leading-relaxed text-medical-text">
            ¿Eliminar la visita de{" "}
            <span className="font-semibold">{paciente}</span> (#{visita.id})? Se borra el registro
            y su tarifa. No se puede deshacer.
          </p>
          {insumos.length > 0 ? (
            <p className="flex gap-2 rounded-lg border border-medical-warning/35 bg-medical-warning/10 px-3 py-2 text-xs text-medical-text">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-medical-warning" />
              Los insumos consumidos vuelven al stock automáticamente.
            </p>
          ) : null}
          {error ? (
            <p className="rounded-lg border border-medical-danger/30 bg-medical-danger/10 px-3 py-2 text-sm text-medical-danger">
              {error}
            </p>
          ) : null}
          {loading ? (
            <p className="inline-flex items-center gap-2 text-sm text-medical-mutedText">
              <Loader2 className="size-4 animate-spin text-medical-primary" />
              Eliminando…
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
            Cancelar
          </Button>
          <Button
            type="button"
            className="cursor-pointer bg-medical-danger text-white hover:bg-medical-danger/90 sm:min-w-[140px]"
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Procesando…
              </>
            ) : (
              "Sí, eliminar"
            )}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
