"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Loader2, Trash2, User, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ServicioConTarifasDto } from "@/lib/api/types";
import {
  asignacionEstadoLabel,
  getPacienteAsignadoNombre,
  getServicioPacientesCount,
} from "@/lib/servicios-display";

type ServicioDeleteConfirmDialogProps = {
  open: boolean;
  servicio: ServicioConTarifasDto | null;
  loading: boolean;
  refreshing?: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ServicioDeleteConfirmDialog({
  open,
  servicio,
  loading,
  refreshing = false,
  error,
  onConfirm,
  onCancel,
}: ServicioDeleteConfirmDialogProps) {
  useEffect(() => {
    if (!open || loading) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, loading, onCancel]);

  if (!open || !servicio || typeof document === "undefined") return null;

  const pacientes = servicio.pacientes ?? [];
  const pacientesCount = getServicioPacientesCount(servicio);
  const blockedByPacientes = pacientesCount > 0;
  const busy = loading || refreshing;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="servicio-delete-title"
      aria-describedby="servicio-delete-desc"
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
            <h2 id="servicio-delete-title" className="text-base font-semibold">
              Eliminar servicio
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
          {refreshing ? (
            <p className="inline-flex items-center gap-2 text-sm text-medical-mutedText">
              <Loader2 className="size-4 animate-spin text-medical-primary" />
              Verificando asignaciones…
            </p>
          ) : null}

          <p id="servicio-delete-desc" className="text-sm leading-relaxed text-medical-text">
            {blockedByPacientes ? (
              <>
                No se puede eliminar{" "}
                <span className="font-semibold text-medical-primary">{servicio.nombre}</span> porque
                tiene {pacientesCount} asignación{pacientesCount === 1 ? "" : "es"} a pacientes.
              </>
            ) : (
              <>
                ¿Eliminar el servicio{" "}
                <span className="font-semibold text-medical-primary">{servicio.nombre}</span>? Esta
                acción no se puede deshacer. Las tarifas y vínculos con prestadores se eliminan en
                cascada.
              </>
            )}
          </p>

          {blockedByPacientes ? (
            <ul className="max-h-40 space-y-2 overflow-y-auto rounded-xl border border-medical-border bg-medical-surface/60 p-3">
              {pacientes.map((p) => (
                <li
                  key={p.pacienteServicioId}
                  className="flex items-start justify-between gap-2 text-sm text-medical-text"
                >
                  <span className="inline-flex min-w-0 items-center gap-2">
                    <User className="size-3.5 shrink-0 text-medical-mutedText" />
                    <span className="truncate font-medium">{getPacienteAsignadoNombre(p)}</span>
                  </span>
                  <Badge variant="outline" className="shrink-0 text-[10px]">
                    {asignacionEstadoLabel(p.estado)}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : null}

          {blockedByPacientes ? (
            <div className="flex gap-2 rounded-xl border border-medical-warning/35 bg-medical-warning/10 px-3.5 py-3 text-xs leading-relaxed text-medical-text">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-medical-warning" />
              <p>
                Cada asignación debe eliminarse desde la ficha del paciente. Si tiene visitas
                registradas no se puede borrar: en ese caso finalizá la asignación. Mientras exista
                el registro en paciente-servicios, el catálogo no permite eliminar el servicio.
              </p>
            </div>
          ) : (
            <div className="flex gap-2 rounded-xl border border-medical-warning/35 bg-medical-warning/10 px-3.5 py-3 text-xs leading-relaxed text-medical-text">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-medical-warning" />
              <p>
                Solo podés eliminar servicios sin ninguna asignación a pacientes. El vínculo con
                prestadores no impide el borrado.
              </p>
            </div>
          )}

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
            {blockedByPacientes ? "Entendido" : "Cancelar"}
          </Button>
          {!blockedByPacientes ? (
            <Button
              type="button"
              className="cursor-pointer bg-medical-danger text-white hover:bg-medical-danger/90 sm:min-w-[140px]"
              disabled={busy}
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
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
}
