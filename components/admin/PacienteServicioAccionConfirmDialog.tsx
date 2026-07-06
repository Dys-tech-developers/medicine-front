"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Ban, Loader2, PauseCircle, RotateCcw, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PacienteServicioAccion } from "@/lib/paciente-servicios-access";
import { ASIGNACION_ESTADO_LABELS } from "@/lib/paciente-servicios-labels";
import type { PacienteServicioEstado } from "@/lib/api/types";

export type PacienteServicioAccionTarget = {
  id: number;
  servicioNombre: string;
  estado: PacienteServicioEstado;
};

type Props = {
  open: boolean;
  target: PacienteServicioAccionTarget | null;
  accion: PacienteServicioAccion | null;
  loading: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

const ACCION_META: Record<
  PacienteServicioAccion,
  {
    title: string;
    confirmLabel: string;
    icon: React.ElementType;
    danger?: boolean;
    description: (nombre: string) => React.ReactNode;
  }
> = {
  finalizar: {
    title: "Finalizar asignación",
    confirmLabel: "Sí, finalizar",
    icon: Ban,
    description: (nombre) => (
      <>
        Vas a cerrar definitivamente <span className="font-semibold text-medical-primary">{nombre}</span>
        . El servicio dejará de estar disponible para nuevas visitas y quedará en el historial.
      </>
    ),
  },
  suspender: {
    title: "Suspender asignación",
    confirmLabel: "Sí, suspender",
    icon: PauseCircle,
    description: (nombre) => (
      <>
        Vas a pausar temporalmente{" "}
        <span className="font-semibold text-medical-primary">{nombre}</span>. Podés reactivarla más
        adelante si el paciente retoma el servicio.
      </>
    ),
  },
  reactivar: {
    title: "Reactivar asignación",
    confirmLabel: "Sí, reactivar",
    icon: RotateCcw,
    description: (nombre) => (
      <>
        Vas a reactivar{" "}
        <span className="font-semibold text-medical-primary">{nombre}</span> para que vuelva a estar
        disponible.
      </>
    ),
  },
  eliminar: {
    title: "Eliminar asignación",
    confirmLabel: "Sí, eliminar",
    icon: Trash2,
    danger: true,
    description: (nombre) => (
      <>
        ¿Eliminar la asignación de{" "}
        <span className="font-semibold text-medical-primary">{nombre}</span>? Solo es posible si no
        tiene visitas registradas.
      </>
    ),
  },
};

export function PacienteServicioAccionConfirmDialog({
  open,
  target,
  accion,
  loading,
  error,
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

  if (!open || !target || !accion || typeof document === "undefined") return null;

  const meta = ACCION_META[accion];
  const Icon = meta.icon;
  const estadoLabel = ASIGNACION_ESTADO_LABELS[target.estado];

  return createPortal(
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="asignacion-accion-title"
      aria-describedby="asignacion-accion-desc"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-pointer bg-medical-text/55 backdrop-blur-sm"
        aria-label="Cerrar"
        disabled={loading}
        onClick={onCancel}
      />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-medical-border bg-white shadow-xl">
        <div
          className={`flex items-start justify-between border-b px-5 py-4 ${
            meta.danger
              ? "border-medical-danger/30 bg-medical-danger/10"
              : "border-medical-border bg-medical-primary"
          }`}
        >
          <div
            className={`flex items-center gap-2 ${meta.danger ? "text-medical-danger" : "text-white"}`}
          >
            <Icon className="size-5 shrink-0" />
            <h2 id="asignacion-accion-title" className="text-base font-semibold">
              {meta.title}
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={`cursor-pointer ${
              meta.danger
                ? "text-medical-danger hover:bg-medical-danger/10"
                : "text-white hover:bg-white/15 hover:text-white"
            }`}
            disabled={loading}
            onClick={onCancel}
          >
            <X className="size-5" />
          </Button>
        </div>

        <div className="space-y-4 px-5 py-6 sm:px-6">
          <p id="asignacion-accion-desc" className="text-sm leading-relaxed text-medical-text">
            {meta.description(target.servicioNombre)}
          </p>
          <p className="text-xs text-medical-mutedText">
            Estado actual: <span className="font-medium text-medical-text">{estadoLabel}</span>
          </p>

          {accion === "eliminar" ? (
            <div className="flex gap-2 rounded-xl border border-medical-warning/35 bg-medical-warning/10 px-3.5 py-3 text-xs leading-relaxed text-medical-text">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-medical-warning" />
              <p>
                Si ya hubo visitas, el servidor rechazará el borrado. En ese caso usá{" "}
                <span className="font-semibold">Finalizar</span> para cerrar la asignación sin
                eliminar el historial.
              </p>
            </div>
          ) : null}

          {error ? (
            <p className="rounded-lg border border-medical-danger/30 bg-medical-danger/10 px-3 py-2 text-sm text-medical-danger">
              {error}
            </p>
          ) : null}

          {loading ? (
            <p className="inline-flex items-center gap-2 text-sm text-medical-mutedText">
              <Loader2 className="size-4 animate-spin text-medical-primary" />
              Procesando…
            </p>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-medical-border bg-medical-surface/80 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
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
            className={`cursor-pointer ${
              meta.danger
                ? "bg-medical-danger text-white hover:bg-medical-danger/90"
                : "bg-medical-primary text-white hover:bg-medical-primaryDark"
            }`}
            disabled={loading}
            onClick={onConfirm}
          >
            {meta.confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
