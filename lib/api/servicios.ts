import { apiFetch } from "@/lib/api/client";
import { fetchAllPaginatedItems } from "@/lib/api/list-pagination";
import type {
  CreateServicioBody,
  CreateServicioTarifaBody,
  ModalidadCobro,
  PacienteServicioEstado,
  PacienteServicioTarifaDto,
  PaginatedServiciosDto,
  ServicioConTarifasDto,
  ServicioPacienteAsignadoDto,
  ServicioTarifaDto,
  ServicioPatchResponseDto,
  UpdateServicioBody,
  UpdateServicioEstadoBody,
  UpdateServicioTarifaBody,
  FrecuenciaTipo,
} from "@/lib/api/types";

function normalizeTarifa(
  row: Partial<ServicioTarifaDto> & Record<string, unknown>
): ServicioTarifaDto {
  return {
    id: Number(row.id),
    servicioId: row.servicioId != null ? Number(row.servicioId) : undefined,
    modalidadCobro: (row.modalidadCobro ?? "por_hora") as ModalidadCobro,
    tipoJornada: (row.tipoJornada ?? "diurno") as ServicioTarifaDto["tipoJornada"],
    tipoDia: (row.tipoDia ?? "habil") as ServicioTarifaDto["tipoDia"],
    valor: String(row.valor ?? ""),
    createdAt: row.createdAt != null ? String(row.createdAt) : undefined,
  };
}

function normalizePacienteAsignado(
  row: Partial<ServicioPacienteAsignadoDto> & Record<string, unknown>
): ServicioPacienteAsignadoDto {
  const tarifasRaw = row.tarifas;
  const tarifas: PacienteServicioTarifaDto[] = Array.isArray(tarifasRaw)
    ? tarifasRaw.map((t) => {
        const item = t as Record<string, unknown>;
        const normalized = normalizeTarifa(item);
        return {
          id: normalized.id,
          modalidadCobro: normalized.modalidadCobro,
          tipoJornada: normalized.tipoJornada,
          tipoDia: normalized.tipoDia,
          valor: normalized.valor,
        };
      })
    : [];

  return {
    pacienteServicioId: Number(row.pacienteServicioId),
    pacienteId: Number(row.pacienteId),
    nombre: String(row.nombre ?? ""),
    apellido: String(row.apellido ?? ""),
    numeroDocumento:
      row.numeroDocumento != null ? String(row.numeroDocumento) : undefined,
    codigoQr: row.codigoQr != null ? String(row.codigoQr) : undefined,
    modalidadCobro: (row.modalidadCobro ?? "por_hora") as ModalidadCobro,
    frecuenciaTipo: (row.frecuenciaTipo ?? "semanal") as FrecuenciaTipo,
    frecuenciaValor: Number(row.frecuenciaValor ?? 1),
    estado: (row.estado ?? "activa") as PacienteServicioEstado,
    fechaInicio: row.fechaInicio != null ? String(row.fechaInicio) : undefined,
    fechaFin: row.fechaFin != null ? String(row.fechaFin) : null,
    tarifas,
  };
}

function normalizeServicioConTarifas(
  item: Partial<ServicioConTarifasDto> & Pick<ServicioConTarifasDto, "id" | "nombre">
): ServicioConTarifasDto {
  return {
    id: item.id,
    nombre: item.nombre,
    estado: item.estado ?? true,
    descripcion: item.descripcion ?? null,
    createdAt: item.createdAt ?? "",
    tarifas: (item.tarifas ?? []).map((t) =>
      normalizeTarifa(t as Partial<ServicioTarifaDto> & Record<string, unknown>)
    ),
    pacientes: (item.pacientes ?? []).map((p) =>
      normalizePacienteAsignado(p as Partial<ServicioPacienteAsignadoDto> & Record<string, unknown>)
    ),
  };
}

export type ListServiciosOptions = {
  page?: number;
  pageSize?: number;
  search?: string;
  /** Filtra por estado activo/inactivo del catálogo. */
  estado?: boolean;
};

function buildListQuery(options?: ListServiciosOptions): string {
  const params = new URLSearchParams();
  if (options?.page != null) params.set("page", String(options.page));
  if (options?.pageSize != null) params.set("pageSize", String(options.pageSize));
  const search = options?.search?.trim();
  if (search) params.set("search", search);
  if (options?.estado != null) params.set("estado", options.estado ? "true" : "false");
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function listServiciosWithApi(
  token: string,
  options?: ListServiciosOptions
): Promise<PaginatedServiciosDto> {
  const data = await apiFetch<PaginatedServiciosDto>(`/api/v1/servicios${buildListQuery(options)}`, {
    method: "GET",
    token,
  });
  return {
    ...data,
    items: data.items.map((row) => normalizeServicioConTarifas(row)),
  };
}

/** Catálogo completo para selects (respeta `pageSize` máx. del backend). */
export async function listServiciosAllWithApi(
  token: string,
  options?: Omit<ListServiciosOptions, "page" | "pageSize">
): Promise<ServicioConTarifasDto[]> {
  return fetchAllPaginatedItems((page, pageSize) =>
    listServiciosWithApi(token, { ...options, page, pageSize })
  );
}

export async function getServicioByIdWithApi(
  token: string,
  id: number
): Promise<ServicioConTarifasDto> {
  const data = await apiFetch<ServicioConTarifasDto>(`/api/v1/servicios/${id}`, {
    method: "GET",
    token,
  });
  return normalizeServicioConTarifas(data);
}

export async function createServicioWithApi(
  token: string,
  body: CreateServicioBody
): Promise<ServicioConTarifasDto> {
  const data = await apiFetch<ServicioConTarifasDto>("/api/v1/servicios", {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
  return normalizeServicioConTarifas(data);
}

/** PATCH devuelve solo el servicio; usar `refreshServicioWithApi` para tarifas y pacientes. */
export async function updateServicioWithApi(
  token: string,
  id: number,
  body: UpdateServicioBody
): Promise<ServicioPatchResponseDto> {
  const data = await apiFetch<ServicioPatchResponseDto>(`/api/v1/servicios/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(body),
  });
  return {
    id: data.id,
    nombre: data.nombre,
    estado: data.estado ?? true,
  };
}

export async function createServicioTarifaWithApi(
  token: string,
  servicioId: number,
  body: CreateServicioTarifaBody
): Promise<ServicioTarifaDto> {
  const data = await apiFetch<ServicioTarifaDto>(
    `/api/v1/servicios/${servicioId}/tarifas`,
    {
      method: "POST",
      token,
      body: JSON.stringify(body),
    }
  );
  return normalizeTarifa(data as Partial<ServicioTarifaDto> & Record<string, unknown>);
}

export async function updateServicioTarifaWithApi(
  token: string,
  servicioId: number,
  tarifaId: number,
  body: UpdateServicioTarifaBody
): Promise<ServicioTarifaDto> {
  const data = await apiFetch<ServicioTarifaDto>(
    `/api/v1/servicios/${servicioId}/tarifas/${tarifaId}`,
    {
      method: "PATCH",
      token,
      body: JSON.stringify(body),
    }
  );
  return normalizeTarifa(data as Partial<ServicioTarifaDto> & Record<string, unknown>);
}

export async function refreshServicioWithApi(
  token: string,
  id: number
): Promise<ServicioConTarifasDto> {
  return getServicioByIdWithApi(token, id);
}

export async function updateServicioEstadoWithApi(
  token: string,
  id: number,
  body: UpdateServicioEstadoBody
): Promise<ServicioPatchResponseDto> {
  const data = await apiFetch<ServicioPatchResponseDto>(`/api/v1/servicios/${id}/estado`, {
    method: "PATCH",
    token,
    body: JSON.stringify(body),
  });
  return {
    id: data.id,
    nombre: data.nombre,
    estado: data.estado ?? body.estado,
  };
}

export async function deleteServicioWithApi(token: string, id: number): Promise<void> {
  await apiFetch<unknown>(`/api/v1/servicios/${id}`, {
    method: "DELETE",
    token,
  });
}
