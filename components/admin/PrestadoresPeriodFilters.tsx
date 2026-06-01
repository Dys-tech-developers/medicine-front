"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReportePeriodo } from "@/lib/api/types";
import {
  DEFAULT_PRESTADORES_PERIOD_FILTERS,
  type PrestadoresPeriodFiltersState,
} from "@/lib/prestadores-period-filters";
import { REPORTE_PERIODO_LABELS } from "@/lib/reportes-display";
import { cn } from "@/lib/utils";

const PERIODOS: ReportePeriodo[] = ["diario", "semanal", "mensual"];

const inputClass =
  "h-9 min-w-0 flex-1 rounded-md border border-medical-border/80 bg-background px-2.5 text-sm shadow-sm outline-none focus:border-medical-primary focus:ring-2 focus:ring-medical-primary/15";

type Props = {
  filters: PrestadoresPeriodFiltersState;
  onChange: (next: PrestadoresPeriodFiltersState) => void;
  loading?: boolean;
  onApply: (next?: PrestadoresPeriodFiltersState) => void;
};

export function PrestadoresPeriodFilters({ filters, onChange, loading, onApply }: Props) {
  const hasCustomRange = Boolean(filters.fechaDesde && filters.fechaHasta);
  const showCustomDates = hasCustomRange || filters.periodo === null;

  const set = (patch: Partial<PrestadoresPeriodFiltersState>) => {
    onChange({ ...filters, ...patch });
  };

  const selectPeriodo = (p: ReportePeriodo) => {
    const next = {
      ...filters,
      periodo: p,
      fechaDesde: "",
      fechaHasta: "",
    };
    onChange(next);
    onApply(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-full text-xs font-semibold uppercase tracking-wide text-medical-mutedText sm:w-auto sm:mr-1">
          Período
        </span>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          {PERIODOS.map((p) => (
            <button
              key={p}
              type="button"
              disabled={loading}
              onClick={() => selectPeriodo(p)}
              className={cn(
                "min-h-9 flex-1 cursor-pointer rounded-lg border px-3 py-2 text-xs font-semibold leading-none transition disabled:opacity-60 sm:flex-none sm:px-2.5 sm:py-1.5",
                !hasCustomRange && filters.periodo === p
                  ? "border-medical-primary bg-medical-primary text-white shadow-sm"
                  : "border-medical-border/80 bg-white text-medical-mutedText hover:border-medical-primary/40"
              )}
            >
              {REPORTE_PERIODO_LABELS[p]}
            </button>
          ))}
          <button
            type="button"
            disabled={loading}
            onClick={() => onChange({ ...filters, periodo: null })}
            className={cn(
              "min-h-9 flex-1 cursor-pointer rounded-lg border px-3 py-2 text-xs font-semibold leading-none transition disabled:opacity-60 sm:flex-none sm:px-2.5 sm:py-1.5",
              showCustomDates && !filters.periodo
                ? "border-medical-primary bg-medical-secondary text-medical-primaryDark"
                : "border-medical-border/80 bg-white text-medical-mutedText hover:border-medical-primary/40"
            )}
          >
            Rango
          </button>
        </div>
      </div>

      {showCustomDates ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="flex min-w-0 items-center gap-2">
            <input
              type="date"
              title="Desde"
              aria-label="Fecha desde"
              disabled={loading}
              value={filters.fechaDesde}
              onChange={(e) =>
                set({
                  fechaDesde: e.target.value,
                  periodo: e.target.value ? null : filters.periodo,
                })
              }
              className={inputClass}
            />
            <span className="shrink-0 text-xs text-medical-mutedText">—</span>
            <input
              type="date"
              title="Hasta"
              aria-label="Fecha hasta"
              disabled={loading}
              value={filters.fechaHasta}
              onChange={(e) =>
                set({
                  fechaHasta: e.target.value,
                  periodo: e.target.value ? null : filters.periodo,
                })
              }
              className={inputClass}
            />
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={loading || !filters.fechaDesde || !filters.fechaHasta}
            className="h-9 w-full cursor-pointer border-medical-border/80 sm:w-auto"
            onClick={() => onApply()}
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Aplicar rango"}
          </Button>
          {showCustomDates && !hasCustomRange ? (
            <button
              type="button"
              disabled={loading}
              className="text-xs font-medium text-medical-primary underline-offset-2 hover:underline sm:ml-1"
              onClick={() => onChange({ ...DEFAULT_PRESTADORES_PERIOD_FILTERS })}
            >
              Volver a período rápido
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
