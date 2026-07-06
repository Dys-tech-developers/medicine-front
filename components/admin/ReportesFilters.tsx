"use client";

import { useState } from "react";
import { FileSpreadsheet, Loader2, X } from "lucide-react";
import { CollapsibleFiltersBar } from "@/components/admin/CollapsibleFiltersBar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  "h-9 min-w-0 flex-1 rounded-md border border-medical-border/80 bg-background px-2.5 text-sm shadow-sm outline-none focus:border-medical-primary focus:ring-2 focus:ring-medical-primary/15";

const selectTriggerClass =
  "h-10 w-full border-medical-border/80 bg-background text-sm shadow-sm";

const selectContentClass =
  "z-[200] min-w-[var(--radix-select-trigger-width)] max-w-[min(20rem,92vw)]";

const selectItemClass = "whitespace-normal py-2 leading-snug";

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

export const DEFAULT_REPORTES_FILTERS_STATE: ReportesFiltersState = {
  periodo: "mensual",
  fechaDesde: "",
  fechaHasta: "",
  prestadorId: "all",
  servicioId: "all",
  facturado: "all",
  pagado: "all",
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
  exportingList?: boolean;
  onExport?: () => void;
  exportTitle?: string;
};

function prestadorLabel(filters: ReportesFiltersState, prestadores: PrestadorListItemDto[]) {
  if (filters.prestadorId === "all") return "Todos los prestadores";
  return prestadores.find((p) => String(p.id) === filters.prestadorId)?.nombre ?? "Prestador";
}

function servicioLabel(filters: ReportesFiltersState, servicios: ServicioConTarifasDto[]) {
  if (filters.servicioId === "all") return "Todos los servicios";
  return servicios.find((s) => String(s.id) === filters.servicioId)?.nombre ?? "Servicio";
}

function triStateLabel(
  value: TriStateFilter,
  block: (typeof VISITA_FINANZAS_UI)["facturado"] | (typeof VISITA_FINANZAS_UI)["pagado"]
) {
  if (value === "all") return block.filtroTodos;
  if (value === "true") return block.filtroSi;
  return block.filtroNo;
}

function hasActiveFilters(filters: ReportesFiltersState): boolean {
  return (
    filters.periodo !== DEFAULT_REPORTES_FILTERS_STATE.periodo ||
    Boolean(filters.fechaDesde || filters.fechaHasta) ||
    filters.prestadorId !== "all" ||
    filters.servicioId !== "all" ||
    filters.facturado !== "all" ||
    filters.pagado !== "all"
  );
}

function formatDateChip(value: string): string {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function periodSummary(filters: ReportesFiltersState): string {
  if (filters.fechaDesde && filters.fechaHasta) {
    return `${formatDateChip(filters.fechaDesde)} — ${formatDateChip(filters.fechaHasta)}`;
  }
  if (filters.periodo) return REPORTE_PERIODO_LABELS[filters.periodo];
  if (filters.fechaDesde || filters.fechaHasta) return "Rango personalizado";
  return REPORTE_PERIODO_LABELS.mensual;
}

function buildFilterSummary(
  filters: ReportesFiltersState,
  prestadores: PrestadorListItemDto[],
  servicios: ServicioConTarifasDto[]
): string[] {
  const parts = [`Período: ${periodSummary(filters)}`];

  if (filters.prestadorId !== "all") {
    parts.push(`Prestador: ${prestadorLabel(filters, prestadores)}`);
  }
  if (filters.servicioId !== "all") {
    parts.push(`Servicio: ${servicioLabel(filters, servicios)}`);
  }
  if (filters.facturado !== "all") {
    parts.push(triStateLabel(filters.facturado, VISITA_FINANZAS_UI.facturado));
  }
  if (filters.pagado !== "all") {
    parts.push(triStateLabel(filters.pagado, VISITA_FINANZAS_UI.pagado));
  }

  return parts;
}

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
  exportingList,
  onExport,
  exportTitle,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const hasCustomRange = Boolean(filters.fechaDesde && filters.fechaHasta);
  const showCustomDates = hasCustomRange || filters.periodo === null;
  const activeFilters = hasActiveFilters(filters);
  const summaryParts = buildFilterSummary(filters, prestadores, servicios);

  const set = (patch: Partial<ReportesFiltersState>) => {
    onChange({ ...filters, ...patch });
  };

  const applyFilters = (next: ReportesFiltersState) => {
    onChange(next);
    onApply(next);
  };

  const selectPeriodo = (p: ReportePeriodo) => {
    const next = {
      ...filters,
      periodo: p,
      fechaDesde: "",
      fechaHasta: "",
    };
    applyFilters(next);
  };

  return (
    <section
      aria-label="Filtros de liquidación"
      className={cn(
        "border-b border-medical-border bg-background px-5 sm:px-7",
        expanded ? "py-5" : "py-3"
      )}
    >
      <CollapsibleFiltersBar
        expanded={expanded}
        onToggle={() => setExpanded((value) => !value)}
        panelId="reportes-filters-panel"
        sectionLabel="Filtros"
        activeFilters={activeFilters}
        description="Visitas, montos y estados de facturado y pagado por prestador."
        summaryParts={summaryParts}
        onClear={() => applyFilters({ ...DEFAULT_REPORTES_FILTERS_STATE })}
        clearDisabled={loadingReport}
      />

      {expanded ? (
        <div id="reportes-filters-panel" className="mt-4 space-y-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-medical-mutedText">
            Período
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {PERIODOS.map((p) => (
              <button
                key={p}
                type="button"
                disabled={loadingReport}
                onClick={() => selectPeriodo(p)}
                className={cn(
                  "min-h-9 cursor-pointer rounded-lg border px-3 py-2 text-xs font-semibold leading-none transition disabled:opacity-60",
                  !hasCustomRange && filters.periodo === p
                    ? "border-medical-primary bg-medical-primary text-white shadow-sm"
                    : "border-medical-border/80 bg-medical-card text-medical-text hover:border-medical-primary/40"
                )}
              >
                {REPORTE_PERIODO_LABELS[p]}
              </button>
            ))}
            <button
              type="button"
              disabled={loadingReport}
              onClick={() => onChange({ ...filters, periodo: null })}
              className={cn(
                "min-h-9 cursor-pointer rounded-lg border px-3 py-2 text-xs font-semibold leading-none transition disabled:opacity-60",
                showCustomDates && !filters.periodo
                  ? "border-medical-primary bg-medical-secondary text-medical-primaryDark"
                  : "border-medical-border/80 bg-medical-card text-medical-text hover:border-medical-primary/40"
              )}
            >
              Rango personalizado
            </button>
          </div>

          {showCustomDates ? (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-md">
                <input
                  id="reporte-desde"
                  type="date"
                  title="Desde"
                  aria-label="Fecha desde"
                  disabled={loadingReport}
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
                  id="reporte-hasta"
                  type="date"
                  title="Hasta"
                  aria-label="Fecha hasta"
                  disabled={loadingReport}
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
                disabled={loadingReport || !filters.fechaDesde || !filters.fechaHasta}
                className="h-9 w-full cursor-pointer border-medical-border/80 sm:w-auto"
                onClick={() => onApply(filters)}
              >
                Aplicar rango
              </Button>
              <button
                type="button"
                disabled={loadingReport}
                className="text-xs font-medium text-medical-primary underline-offset-2 hover:underline"
                onClick={() => {
                  applyFilters({
                    ...filters,
                    periodo: DEFAULT_REPORTES_FILTERS_STATE.periodo,
                    fechaDesde: "",
                    fechaHasta: "",
                  });
                }}
              >
                Quitar rango
              </button>
            </div>
          ) : null}
        </div>

        <div
          className={cn(
            "grid gap-4 sm:grid-cols-2",
            pageSize != null && onPageSizeChange ? "lg:grid-cols-3" : "lg:grid-cols-2"
          )}
        >
          <div className="space-y-1.5">
            <Label htmlFor="filtro-prestador-liquidacion" className="text-xs text-medical-mutedText">
              Prestador
            </Label>
            <Select
              value={filters.prestadorId}
              onValueChange={(v) => applyFilters({ ...filters, prestadorId: v })}
              disabled={loadingOptions}
            >
              <SelectTrigger id="filtro-prestador-liquidacion" className={selectTriggerClass}>
                {loadingOptions ? (
                  <Loader2 className="mr-1.5 size-3.5 shrink-0 animate-spin text-medical-mutedText" />
                ) : null}
                <SelectValue>{prestadorLabel(filters, prestadores)}</SelectValue>
              </SelectTrigger>
              <SelectContent position="popper" className={selectContentClass}>
                <SelectItem value="all" className={selectItemClass}>
                  Todos los prestadores
                </SelectItem>
                {prestadores.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)} className={selectItemClass}>
                    {p.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="filtro-servicio-liquidacion" className="text-xs text-medical-mutedText">
              Servicio
            </Label>
            <Select
              value={filters.servicioId}
              onValueChange={(v) => applyFilters({ ...filters, servicioId: v })}
              disabled={loadingOptions}
            >
              <SelectTrigger id="filtro-servicio-liquidacion" className={selectTriggerClass}>
                {loadingOptions ? (
                  <Loader2 className="mr-1.5 size-3.5 shrink-0 animate-spin text-medical-mutedText" />
                ) : null}
                <SelectValue>{servicioLabel(filters, servicios)}</SelectValue>
              </SelectTrigger>
              <SelectContent position="popper" className={selectContentClass}>
                <SelectItem value="all" className={selectItemClass}>
                  Todos los servicios
                </SelectItem>
                {servicios.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)} className={selectItemClass}>
                    {s.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="filtro-facturado-liquidacion" className="text-xs text-medical-mutedText">
              {VISITA_FINANZAS_UI.facturado.nombre}
            </Label>
            <Select
              value={filters.facturado}
              onValueChange={(v) => applyFilters({ ...filters, facturado: v as TriStateFilter })}
            >
              <SelectTrigger id="filtro-facturado-liquidacion" className={selectTriggerClass}>
                <SelectValue>
                  {triStateLabel(filters.facturado, VISITA_FINANZAS_UI.facturado)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent position="popper" className={selectContentClass}>
                <SelectItem value="all" className={selectItemClass}>
                  {VISITA_FINANZAS_UI.facturado.filtroTodos}
                </SelectItem>
                <SelectItem value="true" className={selectItemClass}>
                  {VISITA_FINANZAS_UI.facturado.filtroSi}
                </SelectItem>
                <SelectItem value="false" className={selectItemClass}>
                  {VISITA_FINANZAS_UI.facturado.filtroNo}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="filtro-pagado-liquidacion" className="text-xs text-medical-mutedText">
              {VISITA_FINANZAS_UI.pagado.nombre}
            </Label>
            <Select
              value={filters.pagado}
              onValueChange={(v) => applyFilters({ ...filters, pagado: v as TriStateFilter })}
            >
              <SelectTrigger id="filtro-pagado-liquidacion" className={selectTriggerClass}>
                <SelectValue>{triStateLabel(filters.pagado, VISITA_FINANZAS_UI.pagado)}</SelectValue>
              </SelectTrigger>
              <SelectContent position="popper" className={selectContentClass}>
                <SelectItem value="all" className={selectItemClass}>
                  {VISITA_FINANZAS_UI.pagado.filtroTodos}
                </SelectItem>
                <SelectItem value="true" className={selectItemClass}>
                  {VISITA_FINANZAS_UI.pagado.filtroSi}
                </SelectItem>
                <SelectItem value="false" className={selectItemClass}>
                  {VISITA_FINANZAS_UI.pagado.filtroNo}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {pageSize != null && onPageSizeChange ? (
            <div className="space-y-1.5">
              <Label htmlFor="filtro-page-size-liquidacion" className="text-xs text-medical-mutedText">
                Filas por página
              </Label>
              <Select
                value={String(pageSize)}
                onValueChange={onPageSizeChange}
                disabled={loadingReport}
              >
                <SelectTrigger id="filtro-page-size-liquidacion" className={selectTriggerClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" className={selectContentClass}>
                  {[10, 20, 50, 100].map((n) => (
                    <SelectItem key={n} value={String(n)} className={selectItemClass}>
                      {n} por página
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-medical-border/60 pt-3">
          <Button
            type="button"
            size="sm"
            onClick={() => onApply(filters)}
            disabled={loadingReport}
            className="h-9 cursor-pointer bg-medical-primary px-4 text-sm hover:bg-medical-primaryDark"
          >
            {loadingReport ? (
              <>
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                Aplicando…
              </>
            ) : (
              "Aplicar filtros"
            )}
          </Button>
          {onExport ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={loadingReport || exportingList}
              onClick={onExport}
              title={exportTitle}
              className="h-9 cursor-pointer border-medical-border/80 px-3 text-sm"
            >
              {exportingList ? (
                <span className="size-4 animate-spin rounded-full border-2 border-medical-primary/30 border-t-medical-primary" />
              ) : (
                <FileSpreadsheet className="size-4 text-medical-primary" />
              )}
              <span className="hidden sm:inline">Exportar Excel</span>
              <span className="sm:hidden">Exportar</span>
            </Button>
          ) : null}
          {activeFilters ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={loadingReport}
              className="h-9 cursor-pointer border-medical-border/80"
              onClick={() => applyFilters({ ...DEFAULT_REPORTES_FILTERS_STATE })}
            >
              <X className="mr-1 size-3.5" />
              Limpiar filtros
            </Button>
          ) : null}
          {loadingOptions ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-medical-mutedText">
              <Loader2 className="size-3.5 animate-spin" />
              Cargando listas…
            </span>
          ) : null}
        </div>
        </div>
      ) : null}
    </section>
  );
}
