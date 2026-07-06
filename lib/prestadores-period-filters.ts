import type { ListPrestadoresOptions } from "@/lib/api/prestadores";
import type { ReportePeriodo } from "@/lib/api/types";
import { dateInputToRange } from "@/lib/reportes-display";

export type PrestadoresPeriodFiltersState = {
  periodo: ReportePeriodo | null;
  fechaDesde: string;
  fechaHasta: string;
};

export const DEFAULT_PRESTADORES_PERIOD_FILTERS: PrestadoresPeriodFiltersState = {
  periodo: "mensual",
  fechaDesde: "",
  fechaHasta: "",
};

export function prestadoresPeriodFiltersToApi(
  filters: PrestadoresPeriodFiltersState
): Pick<ListPrestadoresOptions, "periodo" | "fechaDesde" | "fechaHasta"> {
  const customRange = dateInputToRange(filters.fechaDesde, filters.fechaHasta);
  if (customRange.fechaDesde && customRange.fechaHasta) {
    return { fechaDesde: customRange.fechaDesde, fechaHasta: customRange.fechaHasta };
  }
  if (filters.periodo) {
    return { periodo: filters.periodo };
  }
  return { periodo: "mensual" };
}

export function hasActivePrestadoresPeriodFilters(
  filters: PrestadoresPeriodFiltersState
): boolean {
  if (filters.fechaDesde.trim() && filters.fechaHasta.trim()) return true;
  return filters.periodo !== DEFAULT_PRESTADORES_PERIOD_FILTERS.periodo;
}
