"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Building2, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ObraSocialListItemDto } from "@/lib/api/types";

type ObraSocialEstadoConfirmDialogProps = {
  open: boolean;
  obra: ObraSocialListItemDto | null;
  nextEstado: boolean;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ObraSocialEstadoConfirmDialog({
  open,
  obra,
  nextEstado,
  loading,
  onConfirm,
  onCancel,
}: ObraSocialEstadoConfirmDialogProps) {
  useEffect(() => {
    if (!open || loading) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, loading, onCancel]);

  if (!open || !obra || typeof document === "undefined") return null;

  const activar = nextEstado;
  const title = activar ? "Activar obra social" : "Desactivar obra social";

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="obra-estado-dialog-title"
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
            <Building2 className="size-5 shrink-0" />
            <h2 id="obra-estado-dialog-title" className="text-base font-semibold">
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
          <p className="text-sm leading-relaxed text-medical-text">
            {activar ? (
              <>
                ¿Desea <span className="font-semibold">activar</span>{" "}
                <span className="font-semibold text-medical-primary">{obra.nombre}</span>?
              </>
            ) : (
              <>
                ¿Desea <span className="font-semibold">desactivar</span>{" "}
                <span className="font-semibold text-medical-primary">{obra.nombre}</span>? No
                estará disponible para nuevos pacientes mientras esté inactiva.
              </>
            )}
          </p>
          {loading ? (
            <p className="inline-flex items-center gap-2 text-sm text-medical-mutedText">
              <Loader2 className="size-4 animate-spin text-medical-primary" />
              Guardando cambios…
            </p>
          ) : null}
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-medical-border bg-medical-surface/80 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <Button className="cursor-pointer" type="button" variant="outline" disabled={loading} onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            type="button"
            className={
              activar
                ? "bg-medical-primary cursor-pointer text-white hover:bg-medical-primaryDark"
                : "bg-medical-warning cursor-pointer text-white hover:bg-medical-warning/90"
            }
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Procesando…
              </>
            ) : activar ? (
              "Sí, activar"
            ) : (
              "Sí, desactivar"
            )}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
