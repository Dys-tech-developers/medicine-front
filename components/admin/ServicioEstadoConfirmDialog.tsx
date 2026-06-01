"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Layers, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ServicioConTarifasDto } from "@/lib/api/types";

type ServicioEstadoConfirmDialogProps = {
  open: boolean;
  servicio: ServicioConTarifasDto | null;
  /** Estado que se aplicará si el usuario confirma. */
  nextEstado: boolean;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ServicioEstadoConfirmDialog({
  open,
  servicio,
  nextEstado,
  loading,
  onConfirm,
  onCancel,
}: ServicioEstadoConfirmDialogProps) {
  useEffect(() => {
    if (!open || loading) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, loading, onCancel]);

  if (!open || !servicio || typeof document === "undefined") return null;

  const activar = nextEstado;
  const title = activar ? "Activar servicio" : "Desactivar servicio";
  const actionLabel = activar ? "Sí, activar" : "Sí, desactivar";

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="servicio-estado-dialog-title"
      aria-describedby="servicio-estado-dialog-desc"
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
            <Layers className="size-5 shrink-0" />
            <h2 id="servicio-estado-dialog-title" className="text-base font-semibold">
              {title}
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-white cursor-pointer hover:bg-white/15 hover:text-white"
            disabled={loading}
            onClick={onCancel}
          >
            <X className="size-5" />
          </Button>
        </div>

        <div className="space-y-4 px-5 py-6 sm:px-6">
          <p id="servicio-estado-dialog-desc" className="text-sm leading-relaxed text-medical-text">
            {activar ? (
              <>
                ¿Desea <span className="font-semibold">activar</span> el servicio{" "}
                <span className="font-semibold text-medical-primary">{servicio.nombre}</span>?
              </>
            ) : (
              <>
                ¿Desea <span className="font-semibold">desactivar</span> el servicio{" "}
                <span className="font-semibold text-medical-primary">{servicio.nombre}</span>? No
                estará disponible para nuevas asignaciones a pacientes mientras esté inactivo.
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
          <Button
            type="button"
            variant="outline"
            className="sm:min-w-[100px] cursor-pointer"
            disabled={loading}
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className={
              activar
                ? "bg-medical-primary text-white cursor-pointer hover:bg-medical-primaryDark sm:min-w-[130px]"
                : "bg-medical-warning text-white cursor-pointer hover:bg-medical-warning/90 sm:min-w-[130px]"
            }
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Procesando…
              </>
            ) : (
              actionLabel
            )}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
