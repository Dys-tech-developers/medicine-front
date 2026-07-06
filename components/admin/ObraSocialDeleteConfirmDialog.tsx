"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ObraSocialListItemDto } from "@/lib/api/types";

type ObraSocialDeleteConfirmDialogProps = {
  open: boolean;
  obra: ObraSocialListItemDto | null;
  loading: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ObraSocialDeleteConfirmDialog({
  open,
  obra,
  loading,
  error,
  onConfirm,
  onCancel,
}: ObraSocialDeleteConfirmDialogProps) {
  useEffect(() => {
    if (!open || loading) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, loading, onCancel]);

  if (!open || !obra || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="obra-delete-title"
      aria-describedby="obra-delete-desc"
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
            <h2 id="obra-delete-title" className="text-base font-semibold">
              Eliminar obra social
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

        <div className="space-y-4 px-5 py-6 sm:px-6">
          <p id="obra-delete-desc" className="text-sm leading-relaxed text-medical-text">
            ¿Eliminar{" "}
            <span className="font-semibold text-medical-primary">{obra.nombre}</span> (
            <span className="font-mono text-xs">{obra.codigo}</span>)? Esta acción no se puede
            deshacer.
          </p>
          <div className="flex gap-2 rounded-xl border border-medical-warning/35 bg-medical-warning/10 px-3.5 py-3 text-xs leading-relaxed text-medical-text">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-medical-warning" />
            <p>
              Si la obra social tiene pacientes asociados, el servidor rechazará el borrado.
              Reasigná o eliminá esos pacientes antes de intentar de nuevo.
            </p>
          </div>
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
