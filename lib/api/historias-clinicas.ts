import { apiFetch } from "@/lib/api/client";
import type {
  CreateEvolucionClinicaBody,
  CreateHistoriaClinicaBody,
  HistoriaClinicaDto,
  HistoriaClinicaEvolucionDto,
  HistoriaClinicaPacienteResumenDto,
  PaginatedHistoriasClinicasDto,
} from "@/lib/api/types";

export type ListHistoriasClinicasOptions = {
  page?: number;
  pageSize?: number;
  pacienteId?: number;
};

function buildListQuery(options?: ListHistoriasClinicasOptions): string {
  const params = new URLSearchParams();
  if (options?.page != null) params.set("page", String(options.page));
  if (options?.pageSize != null) params.set("pageSize", String(options.pageSize));
  if (options?.pacienteId != null) params.set("pacienteId", String(options.pacienteId));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function normalizeEvolucion(raw: unknown): HistoriaClinicaEvolucionDto {
  const e = (raw ?? {}) as Record<string, unknown>;
  return {
    id: Number(e.id),
    historiaClinicaId: Number(e.historiaClinicaId),
    fecha: String(e.fecha ?? e.createdAt ?? ""),
    observaciones: e.observaciones != null ? String(e.observaciones) : null,
    medicacion: e.medicacion != null ? String(e.medicacion) : null,
    createdAt: String(e.createdAt ?? ""),
  };
}

function normalizePacienteResumen(raw: unknown): HistoriaClinicaPacienteResumenDto {
  const p = (raw ?? {}) as Record<string, unknown>;
  return {
    id: Number(p.id),
    nombre: String(p.nombre ?? ""),
    apellido: String(p.apellido ?? ""),
    numeroDocumento: String(p.numeroDocumento ?? p.numero_documento ?? ""),
    codigoQr: String(p.codigoQr ?? p.codigo_qr ?? ""),
  };
}

export function normalizeHistoria(raw: unknown): HistoriaClinicaDto {
  const h = (raw ?? {}) as Record<string, unknown>;
  const evolucionesRaw = h.evoluciones ?? h.evoluciones_clinicas;
  const evoluciones = Array.isArray(evolucionesRaw)
    ? evolucionesRaw.map(normalizeEvolucion)
    : [];

  return {
    id: Number(h.id),
    pacienteId: Number(h.pacienteId),
    fechaCreacion: String(h.fechaCreacion ?? h.fecha_creacion ?? ""),
    antecedentes: h.antecedentes != null ? String(h.antecedentes) : null,
    diagnosticoInicial:
      h.diagnosticoInicial != null
        ? String(h.diagnosticoInicial)
        : h.diagnostico_inicial != null
          ? String(h.diagnostico_inicial)
          : null,
    medicacion: h.medicacion != null ? String(h.medicacion) : null,
    alergias: h.alergias != null ? String(h.alergias) : null,
    observaciones: h.observaciones != null ? String(h.observaciones) : null,
    createdAt: String(h.createdAt ?? h.created_at ?? ""),
    updatedAt: String(h.updatedAt ?? h.updated_at ?? ""),
    paciente: normalizePacienteResumen(h.paciente),
    evoluciones,
  };
}

export async function listHistoriasClinicasWithApi(
  token: string,
  options?: ListHistoriasClinicasOptions
): Promise<PaginatedHistoriasClinicasDto> {
  const data = await apiFetch<PaginatedHistoriasClinicasDto>(
    `/api/v1/historias-clinicas${buildListQuery(options)}`,
    { method: "GET", token }
  );
  return {
    ...data,
    items: (data.items ?? []).map((row) => normalizeHistoria(row)),
  };
}

export async function getHistoriaClinicaByPacienteIdWithApi(
  token: string,
  pacienteId: number
): Promise<HistoriaClinicaDto> {
  const data = await apiFetch<unknown>(`/api/v1/historias-clinicas/paciente/${pacienteId}`, {
    method: "GET",
    token,
  });
  return normalizeHistoria(data);
}

export async function getHistoriaClinicaByIdWithApi(
  token: string,
  id: number
): Promise<HistoriaClinicaDto> {
  const data = await apiFetch<unknown>(`/api/v1/historias-clinicas/${id}`, {
    method: "GET",
    token,
  });
  return normalizeHistoria(data);
}

export async function createHistoriaClinicaWithApi(
  token: string,
  body: CreateHistoriaClinicaBody
): Promise<HistoriaClinicaDto> {
  const data = await apiFetch<unknown>("/api/v1/historias-clinicas", {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
  return normalizeHistoria(data);
}

/** POST /api/v1/evoluciones-clinicas */
export async function createEvolucionClinicaWithApi(
  token: string,
  body: CreateEvolucionClinicaBody
): Promise<HistoriaClinicaEvolucionDto> {
  const data = await apiFetch<unknown>("/api/v1/evoluciones-clinicas", {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
  return normalizeEvolucion(data);
}
