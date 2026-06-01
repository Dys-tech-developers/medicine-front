"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Banknote, User, Users, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ServicioConTarifasDto } from "@/lib/api/types";
import {
  asignacionEstadoBadgeClass,
  asignacionEstadoLabel,
  formatAsignacionFrecuencia,
  formatAsignacionModalidad,
  formatAsignacionVigencia,
  formatTarifaContexto,
  formatTarifaValor,
  getPacienteAsignadoNombre,
  hasPacienteAsignadoTarifas,
} from "@/lib/servicios-display";
import { cn } from "@/lib/utils";

type ServicioPacientesDialogProps = {
  open: boolean;
  servicio: ServicioConTarifasDto | null;
  onClose: () => void;
};

export function ServicioPacientesDialog({
  open,
  servicio,
  onClose,
}: ServicioPacientesDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || !servicio || typeof document === "undefined") return null;

  const pacientes = servicio.pacientes ?? [];

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="servicio-pacientes-dialog-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-pointer bg-medical-text/55 backdrop-blur-sm"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[min(85vh,720px)] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-medical-border bg-white shadow-xl">
        <div className="flex shrink-0 items-start justify-between border-b border-medical-border bg-medical-primary px-5 py-4">
          <div className="flex min-w-0 items-center gap-2 text-white">
            <Users className="size-5 shrink-0" />
            <div className="min-w-0">
              <h2 id="servicio-pacientes-dialog-title" className="truncate text-base font-semibold">
                Pacientes asignados
              </h2>
              <p className="truncate text-sm text-white/85">{servicio.nombre}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 cursor-pointer text-white hover:bg-white/15 hover:text-white"
            onClick={onClose}
          >
            <X className="size-5" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          {pacientes.length === 0 ? (
            <p className="py-8 text-center text-sm text-medical-mutedText">
              Este servicio no tiene pacientes asignados.
            </p>
          ) : (
            <ul className="space-y-3">
              {pacientes.map((p) => (
                <li
                  key={p.pacienteServicioId}
                  className="rounded-xl border border-medical-border/80 bg-medical-surface/50 px-4 py-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-medical-secondary text-medical-primary">
                      <User className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="font-semibold text-medical-text">
                          {getPacienteAsignadoNombre(p)}
                        </p>
                        <Badge
                          variant="outline"
                          className={cn(
                            "shrink-0 text-xs font-semibold",
                            asignacionEstadoBadgeClass(p.estado)
                          )}
                        >
                          {asignacionEstadoLabel(p.estado)}
                        </Badge>
                      </div>
                      {p.numeroDocumento || p.codigoQr ? (
                        <p className="mt-0.5 text-xs text-medical-mutedText">
                          {p.numeroDocumento ? `DNI ${p.numeroDocumento}` : null}
                          {p.numeroDocumento && p.codigoQr ? " · " : null}
                          {p.codigoQr ?? null}
                        </p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-md border border-medical-primary/20 bg-medical-secondary/60 px-2 py-0.5 font-medium text-medical-primaryDark">
                          {formatAsignacionModalidad(p)}
                        </span>
                        <span className="rounded-md border border-medical-border bg-white px-2 py-0.5 font-medium text-medical-text">
                          {formatAsignacionFrecuencia(p)}
                        </span>
                      </div>
                      {p.fechaInicio ? (
                        <p className="mt-1.5 text-xs text-medical-mutedText">
                          Vigencia: {formatAsignacionVigencia(p)}
                        </p>
                      ) : null}
                      {hasPacienteAsignadoTarifas(p) ? (
                        <div className="mt-3">
                          <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-medical-mutedText">
                            <Banknote className="size-3.5" />
                            Tarifas del paciente
                          </p>
                          <ul className="space-y-1.5">
                            {p.tarifas.map((tarifa) => (
                              <li
                                key={tarifa.id}
                                className="rounded-lg border border-medical-border/80 bg-white px-3 py-2"
                              >
                                <p className="text-sm font-semibold text-medical-text">
                                  {formatTarifaValor(tarifa.valor)}
                                </p>
                                <p className="mt-0.5 text-xs text-medical-mutedText">
                                  {formatTarifaContexto(tarifa)}
                                </p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-medical-mutedText">
                          Sin tarifas cargadas para esta asignación.
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="shrink-0 border-t border-medical-border bg-medical-surface/80 px-5 py-4 sm:px-6">
          <Button
            type="button"
            variant="outline"
            className="w-full cursor-pointer sm:w-auto"
            onClick={onClose}
          >
            Cerrar
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
