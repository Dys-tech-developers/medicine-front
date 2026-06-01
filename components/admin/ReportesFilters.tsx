"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PrestadorListItemDto, ReportePeriodo, ServicioConTarifasDto } from "@/lib/api/types";
import { REPORTE_PERIODO_LABELS } from "@/lib/reportes-display";
import { VISITA_FINANZAS_UI } from "@/lib/visita-finanzas-labels";
import { cn } from "@/lib/utils";

const PERIODOS: ReportePeriodo[] = ["diario", "semanal", "mensual"];

const inputClass =
  "h-9 rounded-md border border-medical-border/80 bg-background px-2.5 text-sm shadow-sm outline-none focus:border-medical-primary focus:ring-2 focus:ring-medical-primary/15";

const selectTriggerClass =
  "h-9 min-w-0 border-medical-border/80 bg-background text-sm shadow-sm";

export type TriStateFilter = "all" | "true" | "false";

export type ReportesFiltersState = {
  periodo: ReportePeriodo | null;
  fechaDesde: string;
  fechaHasta: string;
  prestadorId: string;
  servicioId: string;
  facturado: TriStateFilter;
  pagado: TriStateFilter;
};

type Props = {
  filters: ReportesFiltersState;
  onChange: (next: ReportesFiltersState) => void;
  prestadores: PrestadorListItemDto[];
  servicios: ServicioConTarifasDto[];
  loadingOptions?: boolean;
  loadingReport?: boolean;
  onApply: (nextFilters?: ReportesFiltersState) => void;
  pageSize?: number;
  onPageSizeChange?: (value: string) => void;
};

export function ReportesFilters({
  filters,
  onChange,
  prestadores,
  servicios,
  loadingOptions,
  loadingReport,
  onApply,
  pageSize,
  onPageSizeChange,
}: Props) {
  const hasCustomRange = Boolean(filters.fechaDesde && filters.fechaHasta);
  const showCustomDates = hasCustomRange || filters.periodo === null;

  const set = (patch: Partial<ReportesFiltersState>) => {
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
    <div className="border-b border-medical-border/60 bg-medical-surface/30 px-4 py-3 sm:px-5">
      <div className="flex flex-wrap items-center gap-2">
        {PERIODOS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => selectPeriodo(p)}
            className={cn(
              "cursor-pointer rounded-md border px-2.5 py-1.5 text-xs font-semibold leading-none transition",
              !hasCustomRange && filters.periodo === p
                ? "border-medical-primary bg-medical-primary text-white"
                : "border-medical-border/80 bg-white text-medical-mutedText hover:border-medical-primary/40"
            )}
          >
            {REPORTE_PERIODO_LABELS[p]}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange({ ...filters, periodo: null })}
          className={cn(
            "cursor-pointer rounded-md border px-2.5 py-1.5 text-xs font-semibold leading-none transition",
            showCustomDates && !filters.periodo
              ? "border-medical-primary bg-medical-secondary text-medical-primaryDark"
              : "border-medical-border/80 bg-white text-medical-mutedText hover:border-medical-primary/40"
          )}
        >
          Rango
        </button>

        {showCustomDates ? (
          <>
            <input
              id="reporte-desde"
              type="date"
              title="Desde"
              aria-label="Fecha desde"
              value={filters.fechaDesde}
              onChange={(e) =>
                set({
                  fechaDesde: e.target.value,
                  periodo: e.target.value ? null : filters.periodo,
                })
              }
              className={cn(inputClass, "w-[128px]")}
            />
            <span className="text-xs text-medical-mutedText">—</span>
            <input
              id="reporte-hasta"
              type="date"
              title="Hasta"
              aria-label="Fecha hasta"
              value={filters.fechaHasta}
              onChange={(e) =>
                set({
                  fechaHasta: e.target.value,
                  periodo: e.target.value ? null : filters.periodo,
                })
              }
              className={cn(inputClass, "w-[128px]")}
            />
          </>
        ) : null}

        <div className="hidden h-5 w-px bg-medical-border/80 sm:block" aria-hidden />

        <Select
          value={filters.prestadorId}
          onValueChange={(v) => set({ prestadorId: v })}
          disabled={loadingOptions}
        >
          <SelectTrigger size="sm" className={cn(selectTriggerClass, "w-[min(160px,42vw)] sm:w-[140px]")}>
            <SelectValue placeholder="Prestador" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Prestador: todos</SelectItem>
            {prestadores.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.servicioId}
          onValueChange={(v) => set({ servicioId: v })}
          disabled={loadingOptions}
        >
          <SelectTrigger size="sm" className={cn(selectTriggerClass, "w-[min(160px,42vw)] sm:w-[140px]")}>
            <SelectValue placeholder="Servicio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Servicio: todos</SelectItem>
            {servicios.map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>
                {s.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.facturado}
          onValueChange={(v) => set({ facturado: v as TriStateFilter })}
        >
          <SelectTrigger size="sm" className={cn(selectTriggerClass, "w-[108px]")}>
            <SelectValue placeholder={VISITA_FINANZAS_UI.facturado.nombre} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{VISITA_FINANZAS_UI.facturado.filtroTodos}</SelectItem>
            <SelectItem value="true">{VISITA_FINANZAS_UI.facturado.filtroSi}</SelectItem>
            <SelectItem value="false">{VISITA_FINANZAS_UI.facturado.filtroNo}</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.pagado}
          onValueChange={(v) => set({ pagado: v as TriStateFilter })}
        >
          <SelectTrigger size="sm" className={cn(selectTriggerClass, "w-[100px]")}>
            <SelectValue placeholder={VISITA_FINANZAS_UI.pagado.nombre} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{VISITA_FINANZAS_UI.pagado.filtroTodos}</SelectItem>
            <SelectItem value="true">{VISITA_FINANZAS_UI.pagado.filtroSi}</SelectItem>
            <SelectItem value="false">{VISITA_FINANZAS_UI.pagado.filtroNo}</SelectItem>
          </SelectContent>
        </Select>

        {pageSize != null && onPageSizeChange ? (
          <Select value={String(pageSize)} onValueChange={onPageSizeChange} disabled={loadingReport}>
            <SelectTrigger
              size="sm"
              className={cn(selectTriggerClass, "w-[72px]")}
              aria-label="Filas por página"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50, 100].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} / pág.
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}

        <Button
          type="button"
          size="sm"
          onClick={() => onApply()}
          disabled={loadingReport}
          className="ml-auto h-9 shrink-0 cursor-pointer bg-medical-primary px-4 text-sm hover:bg-medical-primaryDark"
        >
          {loadingReport ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              …
            </>
          ) : (
            "Aplicar"
          )}
        </Button>
      </div>
    </div>
  );
}
