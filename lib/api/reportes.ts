import { apiFetch } from "@/lib/api/client";
import { fetchAllPaginatedItems } from "@/lib/api/list-pagination";
import {
  formatVisitaFilterDesdeParam,
  formatVisitaFilterHastaParam,
} from "@/lib/api/visitas";
import type {
  BulkUpdateReporteVisitasFinanzasBody,
  BulkUpdateReporteVisitasFinanzasResponseDto,
  ModalidadCobro,
  ReportePeriodo,
  ReportePrestadoresResponseDto,
  ReportePrestadorItemDto,
  ReporteServiciosResponseDto,
  ReporteServicioItemDto,
  ReporteVisitaItemDto,
  ReporteVisitasResponseDto,
  ReportesMetaDto,
  ResumenFinancieroDto,
} from "@/lib/api/types";

export type ReportesQueryOptions = {
  fechaDesde?: Date;
  fechaHasta?: Date;
  periodo?: ReportePeriodo;
  prestadorId?: number;
  servicioId?: number;
  facturado?: boolean;
  pagado?: boolean;
  page?: number;
  pageSize?: number;
};

function buildReportesSearchParams(options: ReportesQueryOptions): URLSearchParams {
  const params = new URLSearchParams();

  if (options.page != null) params.set("page", String(options.page));
  if (options.pageSize != null) params.set("pageSize", String(options.pageSize));

  if (options.fechaDesde) {
    params.set("fechaDesde", formatVisitaFilterDesdeParam(options.fechaDesde));
  }
  if (options.fechaHasta) {
    params.set("fechaHasta", formatVisitaFilterHastaParam(options.fechaHasta));
  }
  if (!options.fechaDesde && !options.fechaHasta && options.periodo) {
    params.set("periodo", options.periodo);
  }
  if (options.prestadorId != null) {
    params.set("prestadorId", String(options.prestadorId));
  }
  if (options.servicioId != null) {
    params.set("servicioId", String(options.servicioId));
  }
  if (options.facturado != null) {
    params.set("facturado", String(options.facturado));
  }
  if (options.pagado != null) {
    params.set("pagado", String(options.pagado));
  }

  return params;
}

function normalizeMeta(row: Record<string, unknown> | undefined): ReportesMetaDto {
  if (!row || typeof row !== "object") return {};
  return {
    ...row,
    fechaDesde: row.fechaDesde != null ? String(row.fechaDesde) : null,
    fechaHasta: row.fechaHasta != null ? String(row.fechaHasta) : null,
    periodo: row.periodo != null ? String(row.periodo) : null,
    prestadorId: row.prestadorId != null ? Number(row.prestadorId) : null,
    servicioId: row.servicioId != null ? Number(row.servicioId) : null,
    facturado: row.facturado != null ? Boolean(row.facturado) : null,
    pagado: row.pagado != null ? Boolean(row.pagado) : null,
    totalVisitas:
      row.totalVisitas != null
        ? Number(row.totalVisitas)
        : row.total_visitas != null
          ? Number(row.total_visitas)
          : undefined,
  };
}

function normalizePrestadorItem(
  row: ReportePrestadorItemDto & Record<string, unknown>
): ReportePrestadorItemDto {
  return {
    prestadorId: Number(row.prestadorId),
    nombre: row.nombre != null ? String(row.nombre) : undefined,
    cantidadVisitas: Number(row.cantidadVisitas ?? 0),
    horasTrabajadas: Number(row.horasTrabajadas ?? 0),
    totalGenerado: String(row.totalGenerado ?? "0"),
    totalFacturado: String(row.totalFacturado ?? "0"),
    totalPagado: String(row.totalPagado ?? "0"),
  };
}

function normalizeServicioItem(
  row: ReporteServicioItemDto & Record<string, unknown>
): ReporteServicioItemDto {
  return {
    servicioId: Number(row.servicioId),
    nombreServicio: String(row.nombreServicio ?? row.nombre ?? "—"),
    cantidadVisitas: Number(row.cantidadVisitas ?? 0),
    horasTotales: Number(row.horasTotales ?? row.horasTrabajadas ?? 0),
    totalGenerado: String(row.totalGenerado ?? "0"),
  };
}

export async function getReportePrestadoresWithApi(
  token: string,
  options: ReportesQueryOptions = {}
): Promise<ReportePrestadoresResponseDto> {
  const params = buildReportesSearchParams(options);
  const qs = params.toString();
  const path = `/api/v1/reportes/prestadores${qs ? `?${qs}` : ""}`;
  const data = await apiFetch<ReportePrestadoresResponseDto & { items?: unknown[]; meta?: unknown }>(
    path,
    { method: "GET", token }
  );

  const itemsRaw = Array.isArray(data.items) ? data.items : [];
  return {
    items: itemsRaw.map((row) =>
      normalizePrestadorItem(row as ReportePrestadorItemDto & Record<string, unknown>)
    ),
    meta: normalizeMeta(data.meta as Record<string, unknown> | undefined),
  };
}

function normalizeVisitaItem(
  row: ReporteVisitaItemDto & Record<string, unknown>
): ReporteVisitaItemDto {
  const paciente = row.paciente as Record<string, unknown> | undefined;
  const prestador = row.prestador as Record<string, unknown> | undefined;
  const servicio = row.servicio as Record<string, unknown> | undefined;
  const finanzas = row.finanzas as Record<string, unknown> | undefined;

  return {
    visitaId: Number(row.visitaId ?? row.id),
    fechaInicio: String(row.fechaInicio ?? row.fecha ?? ""),
    tiempoMinutos: Number(row.tiempoMinutos ?? 0),
    prestadorId: Number(row.prestadorId ?? prestador?.id ?? 0),
    prestadorNombre: String(
      row.prestadorNombre ?? prestador?.nombre ?? row.prestador_nombre ?? "—"
    ),
    pacienteNombre: String(row.pacienteNombre ?? paciente?.nombre ?? ""),
    pacienteApellido: String(row.pacienteApellido ?? paciente?.apellido ?? ""),
    numeroDocumento: String(row.numeroDocumento ?? paciente?.numeroDocumento ?? ""),
    servicioId: Number(row.servicioId ?? servicio?.id ?? 0),
    servicioNombre: String(row.servicioNombre ?? servicio?.nombre ?? "—"),
    modalidadCobro: String(
      row.modalidadCobro ?? finanzas?.modalidadCobro ?? "por_servicio"
    ) as ModalidadCobro,
    valorAplicado: String(row.valorAplicado ?? finanzas?.valorAplicado ?? "0"),
    facturado: Boolean(row.facturado ?? finanzas?.facturado ?? false),
    pagado: Boolean(row.pagado ?? finanzas?.pagado ?? false),
  };
}

function normalizeResumen(row: Record<string, unknown> | undefined): ResumenFinancieroDto {
  if (!row || typeof row !== "object") {
    return {
      cantidadVisitas: 0,
      totalGenerado: "0",
      totalFacturado: "0",
      totalPagado: "0",
      pendienteFacturar: "0",
      pendientePago: "0",
    };
  }
  return {
    cantidadVisitas: Number(row.cantidadVisitas ?? row.totalVisitas ?? 0),
    totalGenerado: String(row.totalGenerado ?? "0"),
    totalFacturado: String(row.totalFacturado ?? "0"),
    totalPagado: String(row.totalPagado ?? "0"),
    pendienteFacturar: String(row.pendienteFacturar ?? row.totalPendienteFacturar ?? "0"),
    pendientePago: String(row.pendientePago ?? row.totalPendientePago ?? "0"),
  };
}

export async function getReporteVisitasWithApi(
  token: string,
  options: ReportesQueryOptions = {}
): Promise<ReporteVisitasResponseDto> {
  const params = buildReportesSearchParams(options);
  const qs = params.toString();
  const path = `/api/v1/reportes/visitas${qs ? `?${qs}` : ""}`;
  const data = await apiFetch<
    ReporteVisitasResponseDto & {
      items?: unknown[];
      meta?: unknown;
      resumen?: unknown;
    }
  >(path, { method: "GET", token });

  const itemsRaw = Array.isArray(data.items) ? data.items : [];
  return {
    items: itemsRaw.map((row) =>
      normalizeVisitaItem(row as ReporteVisitaItemDto & Record<string, unknown>)
    ),
    total: Number(data.total ?? 0),
    page: Number(data.page ?? options.page ?? 1),
    pageSize: Number(data.pageSize ?? options.pageSize ?? 20),
    meta: normalizeMeta(data.meta as Record<string, unknown> | undefined),
    resumen: normalizeResumen(data.resumen as Record<string, unknown> | undefined),
  };
}

/** Listado completo de liquidación para exportación (respeta filtros del reporte). */
export async function listReporteVisitasAllWithApi(
  token: string,
  options: ReportesQueryOptions = {}
): Promise<ReporteVisitaItemDto[]> {
  return fetchAllPaginatedItems((page, pageSize) =>
    getReporteVisitasWithApi(token, { ...options, page, pageSize }).then((data) => ({
      items: data.items,
      total: data.total,
    }))
  );
}

export async function bulkUpdateReporteVisitasFinanzasWithApi(
  token: string,
  body: BulkUpdateReporteVisitasFinanzasBody
): Promise<BulkUpdateReporteVisitasFinanzasResponseDto> {
  const data = await apiFetch<
    BulkUpdateReporteVisitasFinanzasResponseDto & { items?: unknown[] }
  >("/api/v1/reportes/visitas/finanzas", {
    method: "PATCH",
    token,
    body: JSON.stringify(body),
  });

  const itemsRaw = Array.isArray(data.items) ? data.items : [];
  return {
    actualizadas: Number(data.actualizadas ?? itemsRaw.length),
    items: itemsRaw.map((row) =>
      normalizeVisitaItem(row as ReporteVisitaItemDto & Record<string, unknown>)
    ),
  };
}

export async function getReporteServiciosWithApi(
  token: string,
  options: ReportesQueryOptions = {}
): Promise<ReporteServiciosResponseDto> {
  const params = buildReportesSearchParams(options);
  const qs = params.toString();
  const path = `/api/v1/reportes/servicios${qs ? `?${qs}` : ""}`;
  const data = await apiFetch<ReporteServiciosResponseDto & { items?: unknown[]; meta?: unknown }>(
    path,
    { method: "GET", token }
  );

  const itemsRaw = Array.isArray(data.items) ? data.items : [];
  return {
    items: itemsRaw.map((row) =>
      normalizeServicioItem(row as ReporteServicioItemDto & Record<string, unknown>)
    ),
    meta: normalizeMeta(data.meta as Record<string, unknown> | undefined),
  };
}
