"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Banknote,
  CalendarRange,
  CheckCircle2,
  Clock,
  Stethoscope,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PrestadorListItemDto, ReportesMetaDto } from "@/lib/api/types";
import { getPrestadorEstadoCuenta, parsePrestadorMonto } from "@/lib/prestadores-estado-cuenta";
import { getPrestadorInitials } from "@/lib/prestadores-display";
import { formatMetaRango, formatReporteHoras, formatReporteMonto } from "@/lib/reportes-display";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  prestador: PrestadorListItemDto | null;
  meta: ReportesMetaDto | null;
  onClose: () => void;
};

export function PrestadorEstadoCuentaDialog({ open, prestador, meta, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open || !prestador || typeof document === "undefined") return null;

  const cuenta = getPrestadorEstadoCuenta(prestador);
  const debe = parsePrestadorMonto(cuenta.montoPendiente);
  const total = parsePrestadorMonto(cuenta.finanzas.totalGenerado);
  const sinActividad = total < 0.005;
  const todoSaldado = total > 0 && debe < 0.005;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="prestador-estado-cuenta-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-medical-text/50 backdrop-blur-[3px]"
        aria-label="Cerrar"
        onClick={onClose}
      />

      <div className="relative z-10 flex w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-medical-border bg-white shadow-2xl sm:rounded-2xl">

        {/* Header */}
        <div className="relative overflow-hidden bg-linear-to-br from-medical-primary to-medical-primaryDark px-5 pb-5 pt-5">
          <div className="pointer-events-none absolute -top-8 -right-8 size-32 rounded-full bg-white/8" />
          <div className="pointer-events-none absolute -bottom-10 -left-4 size-24 rounded-full bg-white/5" />

          <div className="relative flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/20 text-sm font-bold text-white ring-1 ring-white/30">
                {getPrestadorInitials(prestador.nombre)}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/65">
                  Estado de cuenta
                </p>
                <h2
                  id="prestador-estado-cuenta-title"
                  className="truncate text-lg font-bold text-white"
                >
                  {prestador.nombre}
                </h2>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-white/70">
                  <CalendarRange className="size-3 shrink-0" />
                  {formatMetaRango(meta)}
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 cursor-pointer text-white/80 hover:bg-white/15 hover:text-white"
              onClick={onClose}
            >
              <X className="size-4" />
              <span className="sr-only">Cerrar</span>
            </Button>
          </div>

          {/* Pills */}
          <div className="relative mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white">
              <Stethoscope className="size-3 shrink-0" />
              {cuenta.cantidadVisitas} visita{cuenta.cantidadVisitas !== 1 ? "s" : ""}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white">
              <Clock className="size-3 shrink-0" />
              {formatReporteHoras(cuenta.horasTrabajadas)}
            </span>
            {todoSaldado ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-medical-success/30 px-3 py-1 text-xs font-semibold text-white">
                <CheckCircle2 className="size-3 shrink-0" />
                Cuenta al día
              </span>
            ) : null}
          </div>
        </div>

        {/* Cuerpo */}
        <div className="px-5 py-5">
          {sinActividad ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-medical-border/70 bg-medical-surface/50 px-4 py-8 text-center">
              <Stethoscope className="size-8 text-medical-border" />
              <p className="text-sm font-medium text-medical-mutedText">
                Sin visitas en este período
              </p>
            </div>
          ) : (
            <div className="divide-y divide-medical-border/60 rounded-xl border border-medical-border/70 overflow-hidden">
              {/* Total */}
              <div className="flex items-center justify-between px-4 py-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-medical-secondary text-medical-primary">
                    <Banknote className="size-3.5" />
                  </span>
                  <span className="text-sm font-medium text-medical-text">Total generado</span>
                </div>
                <span className="text-base font-extrabold tabular-nums text-medical-text">
                  {formatReporteMonto(cuenta.finanzas.totalGenerado)}
                </span>
              </div>

              {/* Pagado */}
              <div className="flex items-center justify-between bg-medical-success/6 px-4 py-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-medical-success/15 text-medical-success">
                    <TrendingUp className="size-3.5" />
                  </span>
                  <span className="text-sm font-medium text-medical-text">Pagado</span>
                </div>
                <span className="text-base font-extrabold tabular-nums text-medical-success">
                  {formatReporteMonto(cuenta.montoPagado)}
                </span>
              </div>

              {/* Debe */}
              <div
                className={cn(
                  "flex items-center justify-between px-4 py-3.5",
                  debe > 0.005 ? "bg-medical-warning/6" : "bg-medical-success/6"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "flex size-7 items-center justify-center rounded-lg",
                      debe > 0.005
                        ? "bg-medical-warning/15 text-medical-warning"
                        : "bg-medical-success/15 text-medical-success"
                    )}
                  >
                    {debe > 0.005
                      ? <TrendingDown className="size-3.5" />
                      : <CheckCircle2 className="size-3.5" />
                    }
                  </span>
                  <span className="text-sm font-medium text-medical-text">Debe</span>
                </div>
                <span
                  className={cn(
                    "text-base font-extrabold tabular-nums",
                    debe > 0.005 ? "text-medical-warning" : "text-medical-success"
                  )}
                >
                  {formatReporteMonto(cuenta.montoPendiente)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-medical-border/70 bg-medical-surface/50 px-5 py-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="cursor-pointer border-medical-border/80"
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
