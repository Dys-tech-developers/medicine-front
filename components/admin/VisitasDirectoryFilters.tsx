"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
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
import { usePacienteServiciosList } from "@/lib/hooks/use-paciente-servicios-list";
import type { PacienteListItemDto, PacienteServicioDto, PrestadorListItemDto } from "@/lib/api/types";
import { formatPacienteServicioAsignacionLabel } from "@/lib/paciente-servicios-display";
import {
  DEFAULT_VISITAS_DIRECTORY_FILTERS,
  hasActiveVisitasDirectoryFilters,
  QUICK_PERIODS,
  VISITA_PERIOD_FILTER_LABELS,
  type VisitasDirectoryFiltersState,
} from "@/lib/visitas-directory-filters";
import { cn } from "@/lib/utils";

const inputClass =
  "h-9 min-w-0 flex-1 rounded-md border border-medical-border/80 bg-background px-2.5 text-sm shadow-sm outline-none focus:border-medical-primary focus:ring-2 focus:ring-medical-primary/15";

const selectTriggerClass =
  "h-10 w-full border-medical-border/80 bg-background text-sm shadow-sm";

type Props = {
  filters: VisitasDirectoryFiltersState;
  onChange: (next: VisitasDirectoryFiltersState) => void;
  prestadores: PrestadorListItemDto[];
  pacientes: PacienteListItemDto[];
  accessToken: string | null;
  loadingOptions?: boolean;
  loadingList?: boolean;
  optionsError?: string;
  onApply: (next?: VisitasDirectoryFiltersState) => void;
};

function pacienteLabel(p: PacienteListItemDto): string {
  return `${p.nombre} ${p.apellido}`.trim();
}

function asignacionLabel(ps: PacienteServicioDto): string {
  return formatPacienteServicioAsignacionLabel(ps);
}

function prestadorLabel(filters: VisitasDirectoryFiltersState, prestadores: PrestadorListItemDto[]) {
  if (filters.prestadorId === "all") return "Todos los prestadores";
  return prestadores.find((p) => String(p.id) === filters.prestadorId)?.nombre ?? "Prestador";
}

function pacienteSelectLabel(filters: VisitasDirectoryFiltersState, pacientes: PacienteListItemDto[]) {
  if (filters.pacienteId === "all") return "Todos los pacientes";
  const p = pacientes.find((x) => String(x.id) === filters.pacienteId);
  if (!p) return "Paciente";
  const doc = p.numeroDocumento ? `DNI ${p.numeroDocumento} · ` : "";
  return `${doc}${pacienteLabel(p)}`;
}

function prestacionSelectLabel(
  filters: VisitasDirectoryFiltersState,
  asignaciones: PacienteServicioDto[],
  loadingAsignaciones: boolean
) {
  if (filters.pacienteId === "all") return "Elegí un paciente primero";
  if (loadingAsignaciones) return "Cargando prestaciones…";
  if (filters.pacienteServicioId === "all") return "Todas las prestaciones";
  const ps = asignaciones.find((a) => String(a.id) === filters.pacienteServicioId);
  return ps ? asignacionLabel(ps) : "Prestación";
}

function formatDateChip(value: string): string {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function periodSummary(filters: VisitasDirectoryFiltersState): string {
  if (filters.useCustomRange && filters.fechaDesde && filters.fechaHasta) {
    return `${formatDateChip(filters.fechaDesde)} — ${formatDateChip(filters.fechaHasta)}`;
  }
  if (filters.useCustomRange) return "Rango personalizado";
  return VISITA_PERIOD_FILTER_LABELS[filters.period];
}

function buildFilterSummary(
  filters: VisitasDirectoryFiltersState,
  prestadores: PrestadorListItemDto[],
  pacientes: PacienteListItemDto[],
  asignaciones: PacienteServicioDto[]
): string[] {
  const parts = [`Fecha: ${periodSummary(filters)}`];

  if (filters.prestadorId !== "all") {
    parts.push(`Prestador: ${prestadorLabel(filters, prestadores)}`);
  }
  if (filters.pacienteId !== "all") {
    parts.push(`Paciente: ${pacienteSelectLabel(filters, pacientes).replace(/^DNI \d+ · /, "")}`);
  }
  if (filters.pacienteServicioId !== "all") {
    const ps = asignaciones.find((a) => String(a.id) === filters.pacienteServicioId);
    parts.push(`Prestación: ${ps ? asignacionLabel(ps) : "Seleccionada"}`);
  }

  return parts;
}

export function VisitasDirectoryFilters({
  filters,
  onChange,
  prestadores,
  pacientes,
  accessToken,
  loadingOptions,
  loadingList,
  optionsError,
  onApply,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const pacienteIdNum =
    filters.pacienteId !== "all" ? Number(filters.pacienteId) : undefined;

  const { items: asignaciones, loading: loadingAsignaciones } = usePacienteServiciosList({
    accessToken,
    enabled: Boolean(accessToken && pacienteIdNum),
    pacienteId: pacienteIdNum,
    pageSize: 100,
  });

  const set = (patch: Partial<VisitasDirectoryFiltersState>) => {
    onChange({ ...filters, ...patch });
  };

  const selectPeriod = (period: VisitasDirectoryFiltersState["period"]) => {
    const next: VisitasDirectoryFiltersState = {
      ...filters,
      period,
      useCustomRange: false,
      fechaDesde: "",
      fechaHasta: "",
    };
    onChange(next);
    onApply(next);
  };

  const applyFilters = (next: VisitasDirectoryFiltersState) => {
    onChange(next);
    onApply(next);
  };

  const handlePacienteChange = (pacienteId: string) => {
    applyFilters({
      ...filters,
      pacienteId,
      pacienteServicioId: "all",
    });
  };

  const handlePrestacionChange = (pacienteServicioId: string) => {
    applyFilters({
      ...filters,
      pacienteServicioId,
    });
  };

  const activeFilters = hasActiveVisitasDirectoryFilters(filters);
  const summaryParts = buildFilterSummary(filters, prestadores, pacientes, asignaciones);

  return (
    <section
      aria-label="Filtros de visitas"
      className={cn(
        "border-b border-medical-border bg-background px-5 sm:px-7",
        expanded ? "py-5" : "py-3"
      )}
    >
      <CollapsibleFiltersBar
        expanded={expanded}
        onToggle={() => setExpanded((value) => !value)}
        panelId="visitas-filters-panel"
        sectionLabel="Filtros"
        activeFilters={activeFilters}
        description="Se aplican al listado del servidor (paginación incluida)."
        summaryParts={summaryParts}
        onClear={() => applyFilters({ ...DEFAULT_VISITAS_DIRECTORY_FILTERS })}
        clearDisabled={loadingList}
      />

      {optionsError ? (
        <p
          className={cn(
            "rounded-md border border-medical-danger/30 bg-medical-danger/10 px-3 py-2 text-xs text-medical-danger",
            expanded ? "mt-4" : "mt-3"
          )}
        >
          {optionsError}
        </p>
      ) : null}

      {expanded ? (
        <div id="visitas-filters-panel" className="mt-4 space-y-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-medical-mutedText">
            Fecha de la visita
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {QUICK_PERIODS.map((p) => (
              <button
                key={p}
                type="button"
                disabled={loadingList}
                onClick={() => selectPeriod(p)}
                className={cn(
                  "min-h-9 cursor-pointer rounded-lg border px-3 py-2 text-xs font-semibold leading-none transition disabled:opacity-60",
                  !filters.useCustomRange && filters.period === p
                    ? "border-medical-primary bg-medical-primary text-white shadow-sm"
                    : "border-medical-border/80 bg-medical-card text-medical-text hover:border-medical-primary/40"
                )}
              >
                {VISITA_PERIOD_FILTER_LABELS[p]}
              </button>
            ))}
            <button
              type="button"
              disabled={loadingList}
              onClick={() => onChange({ ...filters, useCustomRange: true })}
              className={cn(
                "min-h-9 cursor-pointer rounded-lg border px-3 py-2 text-xs font-semibold leading-none transition disabled:opacity-60",
                filters.useCustomRange
                  ? "border-medical-primary bg-medical-secondary text-medical-primaryDark"
                  : "border-medical-border/80 bg-medical-card text-medical-text hover:border-medical-primary/40"
              )}
            >
              Rango personalizado
            </button>
          </div>

          {filters.useCustomRange ? (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-md">
                <input
                  type="date"
                  title="Desde"
                  aria-label="Fecha desde"
                  disabled={loadingList}
                  value={filters.fechaDesde}
                  onChange={(e) => set({ fechaDesde: e.target.value })}
                  className={inputClass}
                />
                <span className="shrink-0 text-xs text-medical-mutedText">—</span>
                <input
                  type="date"
                  title="Hasta"
                  aria-label="Fecha hasta"
                  disabled={loadingList}
                  value={filters.fechaHasta}
                  onChange={(e) => set({ fechaHasta: e.target.value })}
                  className={inputClass}
                />
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={loadingList || !filters.fechaDesde || !filters.fechaHasta}
                className="h-9 w-full cursor-pointer border-medical-border/80 sm:w-auto"
                onClick={() => onApply(filters)}
              >
                Aplicar rango
              </Button>
              <button
                type="button"
                disabled={loadingList}
                className="text-xs font-medium text-medical-primary underline-offset-2 hover:underline"
                onClick={() => {
                  applyFilters({
                    ...filters,
                    useCustomRange: false,
                    fechaDesde: "",
                    fechaHasta: "",
                    period: DEFAULT_VISITAS_DIRECTORY_FILTERS.period,
                  });
                }}
              >
                Quitar rango
              </button>
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="filtro-prestador" className="text-xs text-medical-mutedText">
              Prestador
            </Label>
            <Select
              value={filters.prestadorId}
              onValueChange={(v) => applyFilters({ ...filters, prestadorId: v })}
              disabled={loadingOptions}
            >
              <SelectTrigger id="filtro-prestador" className={selectTriggerClass}>
                <SelectValue>{prestadorLabel(filters, prestadores)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los prestadores</SelectItem>
                {prestadores.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="filtro-paciente" className="text-xs text-medical-mutedText">
              Paciente
            </Label>
            <Select
              value={filters.pacienteId}
              onValueChange={handlePacienteChange}
              disabled={loadingOptions}
            >
              <SelectTrigger id="filtro-paciente" className={selectTriggerClass}>
                <SelectValue>{pacienteSelectLabel(filters, pacientes)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los pacientes</SelectItem>
                {pacientes.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.numeroDocumento ? `DNI ${p.numeroDocumento} · ` : ""}
                    {pacienteLabel(p)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
            <Label htmlFor="filtro-prestacion" className="text-xs text-medical-mutedText">
              Prestación asignada
            </Label>
            <Select
              value={filters.pacienteServicioId}
              onValueChange={handlePrestacionChange}
              disabled={
                loadingOptions ||
                filters.pacienteId === "all" ||
                loadingAsignaciones ||
                asignaciones.length === 0
              }
            >
              <SelectTrigger id="filtro-prestacion" className={selectTriggerClass}>
                <SelectValue>
                  {prestacionSelectLabel(filters, asignaciones, loadingAsignaciones)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las prestaciones</SelectItem>
                {asignaciones.map((ps) => (
                  <SelectItem key={ps.id} value={String(ps.id)}>
                    {asignacionLabel(ps)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-medical-border/60 pt-3">
          <Button
            type="button"
            size="sm"
            onClick={() => onApply(filters)}
            disabled={loadingList}
            className="h-9 cursor-pointer bg-medical-primary px-4 text-sm hover:bg-medical-primaryDark"
          >
            {loadingList ? (
              <>
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                Aplicando…
              </>
            ) : (
              "Aplicar filtros"
            )}
          </Button>
          {activeFilters ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={loadingList}
              className="h-9 cursor-pointer border-medical-border/80"
              onClick={() => applyFilters({ ...DEFAULT_VISITAS_DIRECTORY_FILTERS })}
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
