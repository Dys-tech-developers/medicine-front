"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatTarifaContexto, formatTarifaValor } from "@/lib/servicios-display";
import type { TarifaListItem } from "@/lib/tarifas-list";

type TarifaDeleteConfirmDialogProps = {
  open: boolean;
  tarifa: TarifaListItem | null;
  loading: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function TarifaDeleteConfirmDialog({
  open,
  tarifa,
  loading,
  error,
  onConfirm,
  onCancel,
}: TarifaDeleteConfirmDialogProps) {
  useEffect(() => {
    if (!open || loading) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, loading, onCancel]);

  if (!open || !tarifa || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="tarifa-delete-title"
      aria-describedby="tarifa-delete-desc"
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
            <h2 id="tarifa-delete-title" className="text-base font-semibold">
              Eliminar tarifa
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

        <div className="space-y-4 px-5 py-5">
          <div className="flex gap-3 rounded-xl border border-medical-warning/35 bg-medical-warning/10 px-3 py-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-medical-warning" />
            <p id="tarifa-delete-desc" className="text-sm text-medical-text">
              Se eliminará la tarifa de{" "}
              <span className="font-semibold">{tarifa.servicioNombre}</span>. Esta
              acción no se puede deshacer.
            </p>
          </div>

          <div className="rounded-xl border border-medical-border bg-medical-surface/50 px-4 py-3">
            <p className="text-sm font-semibold text-medical-text">
              {formatTarifaValor(tarifa.valor)}
            </p>
            <p className="mt-0.5 text-xs text-medical-mutedText">
              {formatTarifaContexto(tarifa)}
            </p>
          </div>

          {error ? (
            <p className="rounded-lg border border-medical-danger/30 bg-medical-danger/10 px-3 py-2 text-sm text-medical-danger">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={loading}
              className="cursor-pointer bg-medical-danger text-white hover:bg-medical-danger/90"
              onClick={onConfirm}
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              Eliminar
            </Button>
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              disabled={loading}
              onClick={onCancel}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
