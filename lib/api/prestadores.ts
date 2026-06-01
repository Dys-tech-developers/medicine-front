import { apiFetch } from "@/lib/api/client";
import { fetchAllPaginatedItems } from "@/lib/api/list-pagination";
import type {
  CreatePrestadorBody,
  PaginatedPrestadoresDto,
  PrestadorEstadoCuentaDto,
  PrestadorListItemDto,
  ReportePeriodo,
  ReportesMetaDto,
} from "@/lib/api/types";
import {
  formatVisitaFilterDesdeParam,
  formatVisitaFilterHastaParam,
} from "@/lib/api/visitas";
import { EMPTY_PRESTADOR_ESTADO_CUENTA } from "@/lib/prestadores-estado-cuenta";

export type ListPrestadoresOptions = {
  page?: number;
  pageSize?: number;
  fechaDesde?: Date;
  fechaHasta?: Date;
  periodo?: ReportePeriodo;
};

function buildPrestadoresSearchParams(options: ListPrestadoresOptions): URLSearchParams {
  const params = new URLSearchParams();
  params.set("page", String(options.page ?? 1));
  params.set("pageSize", String(options.pageSize ?? 10));

  if (options.fechaDesde) {
    params.set("fechaDesde", formatVisitaFilterDesdeParam(options.fechaDesde));
  }
  if (options.fechaHasta) {
    params.set("fechaHasta", formatVisitaFilterHastaParam(options.fechaHasta));
  }
  if (!options.fechaDesde && !options.fechaHasta && options.periodo) {
    params.set("periodo", options.periodo);
  }

  return params;
}

function normalizeEstadoCuenta(
  raw: Record<string, unknown> | undefined
): PrestadorEstadoCuentaDto | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const finanzasRaw =
    raw.finanzas && typeof raw.finanzas === "object"
      ? (raw.finanzas as Record<string, unknown>)
      : {};

  return {
    cantidadVisitas: Number(raw.cantidadVisitas ?? 0),
    horasTrabajadas: Number(raw.horasTrabajadas ?? 0),
    finanzas: {
      totalGenerado: String(finanzasRaw.totalGenerado ?? "0"),
      pagado: String(finanzasRaw.pagado ?? "0"),
      pendienteFacturacion: String(finanzasRaw.pendienteFacturacion ?? "0"),
      facturadoPendientePago: String(finanzasRaw.facturadoPendientePago ?? "0"),
      cantidadPagado: Number(finanzasRaw.cantidadPagado ?? 0),
    },
    montoPagado: String(raw.montoPagado ?? finanzasRaw.pagado ?? "0"),
    montoPendiente: String(raw.montoPendiente ?? "0"),
  };
}

function normalizeMeta(row: Record<string, unknown> | undefined): ReportesMetaDto | undefined {
  if (!row || typeof row !== "object") return undefined;
  return {
    fechaDesde: row.fechaDesde != null ? String(row.fechaDesde) : null,
    fechaHasta: row.fechaHasta != null ? String(row.fechaHasta) : null,
    periodo: row.periodo != null ? String(row.periodo) : null,
  };
}

export async function listPrestadoresWithApi(
  token: string,
  pageOrOptions: number | ListPrestadoresOptions = 1,
  pageSize = 10
): Promise<PaginatedPrestadoresDto> {
  const options: ListPrestadoresOptions =
    typeof pageOrOptions === "number"
      ? { page: pageOrOptions, pageSize }
      : { pageSize, ...pageOrOptions };

  const params = buildPrestadoresSearchParams(options);
  const data = await apiFetch<
    PaginatedPrestadoresDto & {
      items?: unknown[];
      meta?: unknown;
    }
  >(`/api/v1/prestadores?${params.toString()}`, {
    method: "GET",
    token,
  });

  const hasPeriod =
    Boolean(options.fechaDesde || options.fechaHasta || options.periodo);

  return {
    ...data,
    meta: normalizeMeta(data.meta as Record<string, unknown> | undefined),
    items: (data.items ?? []).map((row) =>
      normalizePrestador(row as PrestadorListItemDto & Record<string, unknown>, hasPeriod)
    ),
  };
}

/** Catálogo completo para selects (respeta `pageSize` máx. del backend). */
export async function listPrestadoresAllWithApi(
  token: string
): Promise<PrestadorListItemDto[]> {
  return fetchAllPaginatedItems((page, pageSize) =>
    listPrestadoresWithApi(token, page, pageSize)
  );
}

function normalizePrestador(
  row: PrestadorListItemDto & Record<string, unknown>,
  withEstadoCuenta = false
): PrestadorListItemDto {
  const estadoCuentaRaw = row.estadoCuenta as Record<string, unknown> | undefined;
  const estadoCuenta = withEstadoCuenta
    ? normalizeEstadoCuenta(estadoCuentaRaw) ?? EMPTY_PRESTADOR_ESTADO_CUENTA
    : normalizeEstadoCuenta(estadoCuentaRaw);

  return {
    ...row,
    cbu: row.cbu != null ? String(row.cbu) : undefined,
    regimenIva: row.regimenIva as PrestadorListItemDto["regimenIva"],
    ...(estadoCuenta ? { estadoCuenta } : {}),
  };
}

export async function getPrestadorMeWithApi(token: string): Promise<PrestadorListItemDto> {
  const data = await apiFetch<PrestadorListItemDto>("/api/v1/prestadores/me", {
    method: "GET",
    token,
  });
  return normalizePrestador(data as PrestadorListItemDto & Record<string, unknown>);
}

export async function createPrestadorWithApi(
  token: string,
  body: CreatePrestadorBody
): Promise<PrestadorListItemDto> {
  const data = await apiFetch<PrestadorListItemDto>("/api/v1/prestadores", {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
  return normalizePrestador(data as PrestadorListItemDto & Record<string, unknown>);
}
