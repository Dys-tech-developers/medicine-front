"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { InsumoListItemDto } from "@/lib/api/types";

type InsumoDeleteConfirmDialogProps = {
  open: boolean;
  insumos: InsumoListItemDto[];
  loading: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function InsumoDeleteConfirmDialog({
  open,
  insumos,
  loading,
  error,
  onConfirm,
  onCancel,
}: InsumoDeleteConfirmDialogProps) {
  useEffect(() => {
    if (!open || loading) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, loading, onCancel]);

  if (!open || insumos.length === 0 || typeof document === "undefined") return null;

  const isBulk = insumos.length > 1;
  const preview = insumos.slice(0, 5);
  const rest = insumos.length - preview.length;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="insumo-delete-title"
      aria-describedby="insumo-delete-desc"
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
            <h2 id="insumo-delete-title" className="text-base font-semibold">
              {isBulk ? `Eliminar ${insumos.length} insumos` : "Eliminar insumo"}
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
          <p id="insumo-delete-desc" className="text-sm leading-relaxed text-medical-text">
            {isBulk ? (
              <>
                ¿Eliminar{" "}
                <span className="font-semibold text-medical-primary">{insumos.length}</span> insumos
                del catálogo? Esta acción no se puede deshacer.
              </>
            ) : (
              <>
                ¿Eliminar{" "}
                <span className="font-semibold text-medical-primary">{insumos[0].nombre}</span>
                {insumos[0].codigo ? (
                  <>
                    {" "}
                    (<span className="font-mono text-xs">{insumos[0].codigo}</span>)
                  </>
                ) : null}
                ? Esta acción no se puede deshacer.
              </>
            )}
          </p>

          {isBulk ? (
            <ul className="max-h-40 space-y-1.5 overflow-y-auto rounded-xl border border-medical-border bg-medical-surface/60 p-3 text-sm text-medical-text">
              {preview.map((insumo) => (
                <li key={insumo.id} className="truncate font-medium">
                  {insumo.nombre}
                  {insumo.codigo ? (
                    <span className="ml-1 font-mono text-xs font-normal text-medical-mutedText">
                      ({insumo.codigo})
                    </span>
                  ) : null}
                </li>
              ))}
              {rest > 0 ? (
                <li className="text-xs text-medical-mutedText">y {rest} más…</li>
              ) : null}
            </ul>
          ) : null}

          <div className="flex gap-2 rounded-xl border border-medical-warning/35 bg-medical-warning/10 px-3.5 py-3 text-xs leading-relaxed text-medical-text">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-medical-warning" />
            <p>
              Si un insumo fue consumido en visitas, el servidor puede rechazar el borrado. En ese
              caso eliminá solo los que no tengan consumos registrados.
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
            ) : isBulk ? (
              `Sí, eliminar ${insumos.length}`
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
