import { apiFetch } from "@/lib/api/client";
import { fetchAllPaginatedItems } from "@/lib/api/list-pagination";
import type {
  CreatePrestadorBody,
  PaginatedPrestadoresDto,
  PrestadorEstadoCuentaDto,
  PrestadorListItemDto,
  ReportePeriodo,
  ReportesMetaDto,
  UpdatePrestadorServiciosBody,
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
  /** Filtra prestadores habilitados para el servicio (ADMIN, OPERADOR). */
  servicioId?: number;
  /** Filtra por estado del prestador (`true` = activos). */
  estado?: boolean;
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
  if (options.servicioId != null && Number.isFinite(options.servicioId)) {
    params.set("servicioId", String(options.servicioId));
  }
  if (options.estado != null) {
    params.set("estado", String(options.estado));
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
  token: string,
  options?: Omit<ListPrestadoresOptions, "page" | "pageSize">
): Promise<PrestadorListItemDto[]> {
  return fetchAllPaginatedItems((page, pageSize) =>
    listPrestadoresWithApi(token, { ...options, page, pageSize })
  );
}

/** Prestadores activos habilitados para un servicio (combo paciente-servicio). */
export async function listPrestadoresPorServicioWithApi(
  token: string,
  servicioId: number
): Promise<PrestadorListItemDto[]> {
  return listPrestadoresAllWithApi(token, { servicioId, estado: true });
}

function normalizePrestadorServicios(
  raw: unknown
): PrestadorListItemDto["servicios"] {
  if (!Array.isArray(raw)) return undefined;
  const items = raw
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const row = entry as Record<string, unknown>;
      const id = Number(row.id ?? row.servicioId ?? row.servicio_id);
      if (!Number.isFinite(id) || id <= 0) return null;
      const nombre = row.nombre != null ? String(row.nombre) : undefined;
      const estado = row.estado != null ? Boolean(row.estado) : undefined;
      return {
        id,
        ...(nombre ? { nombre } : {}),
        ...(estado !== undefined ? { estado } : {}),
      };
    })
    .filter((s): s is NonNullable<typeof s> => s != null);
  return items;
}

function normalizePrestador(
  row: PrestadorListItemDto & Record<string, unknown>,
  withEstadoCuenta = false
): PrestadorListItemDto {
  const estadoCuentaRaw = row.estadoCuenta as Record<string, unknown> | undefined;
  const estadoCuenta = withEstadoCuenta
    ? normalizeEstadoCuenta(estadoCuentaRaw) ?? EMPTY_PRESTADOR_ESTADO_CUENTA
    : normalizeEstadoCuenta(estadoCuentaRaw);
  const servicios = normalizePrestadorServicios(row.servicios);

  return {
    ...row,
    cbu: row.cbu != null ? String(row.cbu) : undefined,
    regimenIva: row.regimenIva as PrestadorListItemDto["regimenIva"],
    ...(servicios !== undefined ? { servicios } : {}),
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

export async function getPrestadorByIdWithApi(
  token: string,
  id: number
): Promise<PrestadorListItemDto> {
  const data = await apiFetch<PrestadorListItemDto>(`/api/v1/prestadores/${id}`, {
    method: "GET",
    token,
  });
  return normalizePrestador(data as PrestadorListItemDto & Record<string, unknown>);
}

export async function updatePrestadorServiciosWithApi(
  token: string,
  id: number,
  body: UpdatePrestadorServiciosBody
): Promise<PrestadorListItemDto> {
  const data = await apiFetch<PrestadorListItemDto>(`/api/v1/prestadores/${id}/servicios`, {
    method: "PUT",
    token,
    body: JSON.stringify(body),
  });
  return normalizePrestador(data as PrestadorListItemDto & Record<string, unknown>);
}
