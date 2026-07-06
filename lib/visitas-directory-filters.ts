import type { ListVisitasOptions } from "@/lib/api/visitas";
import { dateInputToRange } from "@/lib/reportes-display";
import { getVisitaPeriodRange, type VisitaPeriodFilter } from "@/lib/visitas-display";

export type VisitasDirectoryFiltersState = {
  period: VisitaPeriodFilter;
  useCustomRange: boolean;
  fechaDesde: string;
  fechaHasta: string;
  prestadorId: string;
  pacienteId: string;
  pacienteServicioId: string;
};

export const DEFAULT_VISITAS_DIRECTORY_FILTERS: VisitasDirectoryFiltersState = {
  period: "all",
  useCustomRange: false,
  fechaDesde: "",
  fechaHasta: "",
  prestadorId: "all",
  pacienteId: "all",
  pacienteServicioId: "all",
};

export const VISITA_PERIOD_FILTER_LABELS: Record<VisitaPeriodFilter, string> = {
  all: "Todas",
  today: "Hoy",
  "7d": "7 días",
  "30d": "30 días",
};

const QUICK_PERIODS: VisitaPeriodFilter[] = ["all", "today", "7d", "30d"];

export { QUICK_PERIODS };

export type VisitasDirectoryApiFilters = Pick<
  ListVisitasOptions,
  "prestadorId" | "pacienteServicioId" | "pacienteId" | "fechaDesde" | "fechaHasta"
>;

export function visitasDirectoryFiltersToApi(
  filters: VisitasDirectoryFiltersState
): VisitasDirectoryApiFilters {
  const query: VisitasDirectoryApiFilters = {};

  if (filters.prestadorId !== "all") {
    const id = Number(filters.prestadorId);
    if (Number.isFinite(id)) query.prestadorId = id;
  }

  if (filters.pacienteServicioId !== "all") {
    const id = Number(filters.pacienteServicioId);
    if (Number.isFinite(id)) query.pacienteServicioId = id;
  } else if (filters.pacienteId !== "all") {
    const id = Number(filters.pacienteId);
    if (Number.isFinite(id)) query.pacienteId = id;
  }

  if (filters.useCustomRange) {
    const range = dateInputToRange(filters.fechaDesde, filters.fechaHasta);
    if (range.fechaDesde) query.fechaDesde = range.fechaDesde;
    if (range.fechaHasta) query.fechaHasta = range.fechaHasta;
  } else if (filters.period !== "all") {
    Object.assign(query, getVisitaPeriodRange(filters.period));
  }

  return query;
}

export function hasActiveVisitasDirectoryFilters(
  filters: VisitasDirectoryFiltersState
): boolean {
  return (
    filters.prestadorId !== "all" ||
    filters.pacienteId !== "all" ||
    filters.pacienteServicioId !== "all" ||
    filters.period !== "all" ||
    (filters.useCustomRange && Boolean(filters.fechaDesde && filters.fechaHasta))
  );
}
