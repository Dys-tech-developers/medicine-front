import { apiFetch } from "@/lib/api/client";
import type {
  CreateVisitaBody,
  ModalidadCobro,
  PaginatedVisitasDto,
  TipoDia,
  TipoJornada,
  UpdateVisitaBody,
  UpdateVisitaFinanzasBody,
  VisitaDetailDto,
  VisitaFinanzasDto,
  VisitaInsumoResumenDto,
  VisitaListItemDto,
  VisitaPacienteServicioResumenDto,
  VisitaPrestadorResumenDto,
} from "@/lib/api/types";

export type ListVisitasOptions = {
  page?: number;
  pageSize?: number;
  prestadorId?: number;
  pacienteServicioId?: number;
  fechaDesde?: Date;
  fechaHasta?: Date;
};

/**
 * Inicio del día calendario local en ISO (UTC).
 * El backend filtra por `fechaInicio`; con solo `YYYY-MM-DD` en `fechaHasta`
 * suele interpretarse como 00:00 y excluye visitas de ese día.
 */
export function formatVisitaFilterDesdeParam(d: Date): string {
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  return start.toISOString();
}

/** Fin del día calendario local en ISO (UTC), inclusive. */
export function formatVisitaFilterHastaParam(d: Date): string {
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  return end.toISOString();
}

function normalizeInsumo(row: Partial<VisitaInsumoResumenDto> & Record<string, unknown>): VisitaInsumoResumenDto {
  return {
    id: Number(row.id),
    insumoId: Number(row.insumoId),
    cantidad: Number(row.cantidad ?? 0),
    insumoNombre: String(row.insumoNombre ?? ""),
    insumoCodigo: String(row.insumoCodigo ?? ""),
  };
}

function normalizePacienteServicio(
  row: Partial<VisitaPacienteServicioResumenDto> & Record<string, unknown>
): VisitaPacienteServicioResumenDto | undefined {
  if (!row || row.id == null) return undefined;
  const paciente = row.paciente as Record<string, unknown> | undefined;
  const servicio = row.servicio as Record<string, unknown> | undefined;
  return {
    id: Number(row.id),
    estado: String(row.estado ?? ""),
    paciente: {
      id: Number(paciente?.id ?? 0),
      nombre: String(paciente?.nombre ?? ""),
      apellido: String(paciente?.apellido ?? ""),
      numeroDocumento: String(paciente?.numeroDocumento ?? ""),
    },
    servicio: {
      id: Number(servicio?.id ?? 0),
      nombre: String(servicio?.nombre ?? ""),
    },
  };
}

function normalizePrestador(
  row: Partial<VisitaPrestadorResumenDto> & Record<string, unknown>
): VisitaPrestadorResumenDto {
  return {
    id: Number(row.id ?? 0),
    nombre: String(row.nombre ?? "—"),
    email: String(row.email ?? ""),
  };
}

function normalizeFinanzas(
  row: Record<string, unknown> | null | undefined
): VisitaFinanzasDto | null {
  if (!row || typeof row !== "object") return null;
  const valorAplicado = row.valorAplicado ?? row.valor_aplicado;
  if (valorAplicado == null && row.modalidadCobro == null && row.modalidad_cobro == null) {
    return null;
  }
  return {
    modalidadCobro: String(row.modalidadCobro ?? row.modalidad_cobro ?? "por_servicio") as ModalidadCobro,
    tipoJornada: String(row.tipoJornada ?? row.tipo_jornada ?? "diurno") as TipoJornada,
    tipoDia: String(row.tipoDia ?? row.tipo_dia ?? "habil") as TipoDia,
    valorUnitario: String(row.valorUnitario ?? row.valor_unitario ?? "0"),
    valorAplicado: String(valorAplicado ?? "0"),
    facturado: Boolean(row.facturado),
    pagado: Boolean(row.pagado),
  };
}

function normalizeVisita(row: Partial<VisitaListItemDto> & Record<string, unknown>): VisitaListItemDto {
  const insumosRaw = row.insumos;
  const insumos = Array.isArray(insumosRaw)
    ? insumosRaw.map((i) => normalizeInsumo(i as VisitaInsumoResumenDto & Record<string, unknown>))
    : [];

  const ps = normalizePacienteServicio(
    row.pacienteServicio as VisitaPacienteServicioResumenDto & Record<string, unknown>
  );

  const fechaInicio = String(row.fechaInicio ?? row.fecha_inicio ?? row.fecha ?? "");
  const finanzasRaw = row.finanzas ?? row.visita_finanzas;

  return {
    id: Number(row.id),
    pacienteServicioId: Number(row.pacienteServicioId ?? ps?.id ?? 0),
    prestadorId: Number(row.prestadorId ?? 0),
    fecha: fechaInicio,
    tiempoMinutos: Number(row.tiempoMinutos ?? 0),
    observaciones: row.observaciones != null ? String(row.observaciones) : null,
    createdAt: String(row.createdAt ?? ""),
    updatedAt: String(row.updatedAt ?? ""),
    pacienteServicio: ps ?? {
      id: Number(row.pacienteServicioId ?? 0),
      estado: "",
      paciente: { id: 0, nombre: "", apellido: "", numeroDocumento: "" },
      servicio: { id: 0, nombre: "" },
    },
    prestador: normalizePrestador(
      (row.prestador ?? {}) as VisitaPrestadorResumenDto & Record<string, unknown>
    ),
    insumos,
    finanzas: normalizeFinanzas(finanzasRaw as Record<string, unknown> | undefined),
  };
}

function normalizeVisitaDetail(
  row: Partial<VisitaDetailDto> & Record<string, unknown>
): VisitaDetailDto {
  const base = normalizeVisita(row);
  const fechaInicio = String(row.fechaInicio ?? row.fecha_inicio ?? base.fecha);
  const fechaFinRaw = row.fechaFin ?? row.fecha_fin;
  const finanzasRaw = row.finanzas ?? row.visita_finanzas;

  return {
    ...base,
    fecha: fechaInicio,
    fechaInicio,
    fechaFin: fechaFinRaw != null ? String(fechaFinRaw) : null,
    finanzas: normalizeFinanzas(finanzasRaw as Record<string, unknown> | undefined),
  };
}

export async function createVisitaWithApi(
  token: string,
  body: CreateVisitaBody
): Promise<VisitaDetailDto> {
  const data = await apiFetch<unknown>("/api/v1/visitas", {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
  return normalizeVisitaDetail(data as VisitaDetailDto & Record<string, unknown>);
}

export async function getVisitaByIdWithApi(
  token: string,
  id: number
): Promise<VisitaDetailDto> {
  const data = await apiFetch<unknown>(`/api/v1/visitas/${id}`, {
    method: "GET",
    token,
  });
  return normalizeVisitaDetail(data as VisitaDetailDto & Record<string, unknown>);
}

export async function updateVisitaWithApi(
  token: string,
  id: number,
  body: UpdateVisitaBody
): Promise<VisitaDetailDto> {
  const data = await apiFetch<unknown>(`/api/v1/visitas/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(body),
  });
  return normalizeVisitaDetail(data as VisitaDetailDto & Record<string, unknown>);
}

export async function updateVisitaFinanzasWithApi(
  token: string,
  visitaId: number,
  body: UpdateVisitaFinanzasBody
): Promise<VisitaDetailDto> {
  const data = await apiFetch<unknown>(`/api/v1/visitas/${visitaId}/finanzas`, {
    method: "PATCH",
    token,
    body: JSON.stringify(body),
  });
  return normalizeVisitaDetail(data as VisitaDetailDto & Record<string, unknown>);
}

export async function listVisitasWithApi(
  token: string,
  options: ListVisitasOptions = {}
): Promise<PaginatedVisitasDto> {
  const params = new URLSearchParams();
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 20;
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));

  if (options.prestadorId != null) {
    params.set("prestadorId", String(options.prestadorId));
  }
  if (options.pacienteServicioId != null) {
    params.set("pacienteServicioId", String(options.pacienteServicioId));
  }
  if (options.fechaDesde) {
    params.set("fechaDesde", formatVisitaFilterDesdeParam(options.fechaDesde));
  }
  if (options.fechaHasta) {
    params.set("fechaHasta", formatVisitaFilterHastaParam(options.fechaHasta));
  }

  const data = await apiFetch<PaginatedVisitasDto>(`/api/v1/visitas?${params.toString()}`, {
    method: "GET",
    token,
  });

  return {
    ...data,
    items: data.items.map((row) =>
      normalizeVisita(row as VisitaListItemDto & Record<string, unknown>)
    ),
  };
}
