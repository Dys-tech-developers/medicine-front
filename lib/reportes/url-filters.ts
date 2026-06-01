import type { ReportePeriodo } from "@/lib/api/types";
import type { ReportesQueryOptions } from "@/lib/api/reportes";
import { dateInputToRange } from "@/lib/reportes-display";

export type TriStateFilter = "all" | "true" | "false";

export type ReportesFinanzasFilters = {
  periodo: ReportePeriodo | null;
  fechaDesde: string;
  fechaHasta: string;
  prestadorId: string;
  servicioId: string;
  facturado: TriStateFilter;
  pagado: TriStateFilter;
  page: number;
  pageSize: number;
};

export const DEFAULT_REPORTES_FINANZAS_FILTERS: ReportesFinanzasFilters = {
  periodo: "mensual",
  fechaDesde: "",
  fechaHasta: "",
  prestadorId: "all",
  servicioId: "all",
  facturado: "all",
  pagado: "all",
  page: 1,
  pageSize: 20,
};

function triStateToBool(value: TriStateFilter): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function parsePeriodo(raw: string | null): ReportePeriodo | null {
  if (raw === "diario" || raw === "semanal" || raw === "mensual") return raw;
  return null;
}

export function filtersFromSearchParams(params: URLSearchParams): ReportesFinanzasFilters {
  const periodo = parsePeriodo(params.get("periodo"));
  const fechaDesde = params.get("fechaDesde") ?? "";
  const fechaHasta = params.get("fechaHasta") ?? "";
  const hasCustomRange = Boolean(fechaDesde && fechaHasta);

  const page = Math.max(1, Number(params.get("page")) || 1);
  const pageSizeRaw = Number(params.get("pageSize")) || 20;
  const pageSize = Math.min(100, Math.max(1, pageSizeRaw));

  return {
    periodo: hasCustomRange ? null : periodo ?? DEFAULT_REPORTES_FINANZAS_FILTERS.periodo,
    fechaDesde,
    fechaHasta,
    prestadorId: params.get("prestadorId") ?? "all",
    servicioId: params.get("servicioId") ?? "all",
    facturado: (params.get("facturado") as TriStateFilter) || "all",
    pagado: (params.get("pagado") as TriStateFilter) || "all",
    page,
    pageSize,
  };
}

export function filtersToSearchParams(filters: ReportesFinanzasFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.fechaDesde && filters.fechaHasta) {
    params.set("fechaDesde", filters.fechaDesde);
    params.set("fechaHasta", filters.fechaHasta);
  } else if (filters.periodo) {
    params.set("periodo", filters.periodo);
  }

  if (filters.prestadorId !== "all") params.set("prestadorId", filters.prestadorId);
  if (filters.servicioId !== "all") params.set("servicioId", filters.servicioId);
  if (filters.facturado !== "all") params.set("facturado", filters.facturado);
  if (filters.pagado !== "all") params.set("pagado", filters.pagado);
  if (filters.page > 1) params.set("page", String(filters.page));
  if (filters.pageSize !== 20) params.set("pageSize", String(filters.pageSize));

  return params;
}

export function filtersToApiQuery(filters: ReportesFinanzasFilters): ReportesQueryOptions & {
  page: number;
  pageSize: number;
} {
  const query: ReportesQueryOptions & { page: number; pageSize: number } = {
    page: filters.page,
    pageSize: filters.pageSize,
  };

  const customRange = dateInputToRange(filters.fechaDesde, filters.fechaHasta);
  if (customRange.fechaDesde && customRange.fechaHasta) {
    query.fechaDesde = customRange.fechaDesde;
    query.fechaHasta = customRange.fechaHasta;
  } else if (filters.periodo) {
    query.periodo = filters.periodo;
  }

  if (filters.prestadorId !== "all") query.prestadorId = Number(filters.prestadorId);
  if (filters.servicioId !== "all") query.servicioId = Number(filters.servicioId);

  const facturado = triStateToBool(filters.facturado);
  const pagado = triStateToBool(filters.pagado);
  if (facturado != null) query.facturado = facturado;
  if (pagado != null) query.pagado = pagado;

  return query;
}
