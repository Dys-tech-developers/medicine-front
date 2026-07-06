import { apiFetch } from "@/lib/api/client";
import { fetchAllPaginatedItems } from "@/lib/api/list-pagination";
import {
  listPacienteServiciosWithApi,
  resolvePacienteServicioId,
} from "@/lib/api/paciente-servicios";
import type {
  CreateVisitaBody,
  FinalizarVisitaBody,
  IniciarVisitaBody,
  RelevarVisitaBody,
  RelevarVisitaDto,
  GestionarTramoAdminBody,
  GestionarTramoAdminResultDto,
  ModalidadCobro,
  PaginatedVisitasDto,
  TipoJornada,
  UpdateVisitaBody,
  UpdateVisitaFinanzasBody,
  VisitaDetailDto,
  VisitaFinanzasDto,
  VisitaInsumoResumenDto,
  VisitaListItemDto,
  VisitaPacienteServicioResumenDto,
  VisitaPendienteCoberturaActivaDto,
  VisitaPendienteDto,
  VisitaPrestadorResumenDto,
  VisitaEstado,
} from "@/lib/api/types";
import { normalizeTipoDia } from "@/lib/servicios-tarifas-labels";
import { parseVisitaEstado } from "@/lib/visita-estado-labels";

export type ListVisitasOptions = {
  page?: number;
  pageSize?: number;
  prestadorId?: number;
  /** Filtro directo del listado (`GET /api/v1/visitas`). */
  pacienteServicioId?: number;
  /**
   * No es query del backend: el front resuelve las asignaciones del paciente
   * y consulta visitas por cada `pacienteServicioId` (o una sola si hay una).
   */
  pacienteId?: number;
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
    tipoDia: normalizeTipoDia(String(row.tipoDia ?? row.tipo_dia ?? "habil")),
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
  const cierreAutomatico = Boolean(
    row.cierreAutomatico ?? row.cierre_automatico ?? false
  );
  const cierrePorRelevo = Boolean(row.cierrePorRelevo ?? row.cierre_por_relevo ?? false);
  const prestadorRelevoIdRaw = row.prestadorRelevoId ?? row.prestador_relevo_id;
  const prestadorRelevoId =
    prestadorRelevoIdRaw != null && Number.isFinite(Number(prestadorRelevoIdRaw))
      ? Number(prestadorRelevoIdRaw)
      : null;

  return {
    id: Number(row.id),
    pacienteServicioId: Number(row.pacienteServicioId ?? ps?.id ?? 0),
    prestadorId: Number(row.prestadorId ?? 0),
    estado: parseVisitaEstado(row.estado),
    fecha: fechaInicio,
    tiempoMinutos:
      row.tiempoMinutos != null || row.tiempo_minutos != null
        ? Number(row.tiempoMinutos ?? row.tiempo_minutos)
        : null,
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
    ...(cierreAutomatico ? { cierreAutomatico: true } : {}),
    ...(cierrePorRelevo ? { cierrePorRelevo: true } : {}),
    ...(prestadorRelevoId != null ? { prestadorRelevoId } : {}),
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

export async function iniciarVisitaWithApi(
  token: string,
  body: IniciarVisitaBody
): Promise<VisitaDetailDto> {
  const data = await apiFetch<unknown>("/api/v1/visitas/iniciar", {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
  return normalizeVisitaDetail(data as VisitaDetailDto & Record<string, unknown>);
}

export async function finalizarVisitaWithApi(
  token: string,
  id: number,
  body: FinalizarVisitaBody = {}
): Promise<VisitaDetailDto> {
  const data = await apiFetch<unknown>(`/api/v1/visitas/${id}/finalizar`, {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
  return normalizeVisitaDetail(data as VisitaDetailDto & Record<string, unknown>);
}

export async function relevarVisitaWithApi(
  token: string,
  body: RelevarVisitaBody
): Promise<RelevarVisitaDto> {
  const data = await apiFetch<unknown>("/api/v1/visitas/relevar", {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
  const row = data as Record<string, unknown>;
  if (row.visita != null) {
    return {
      huboRelevo: Boolean(row.huboRelevo ?? row.hubo_relevo ?? false),
      visitaAnterior: row.visitaAnterior ?? row.visita_anterior
        ? normalizeVisitaDetail(
            (row.visitaAnterior ?? row.visita_anterior) as VisitaDetailDto &
              Record<string, unknown>
          )
        : null,
      visita: normalizeVisitaDetail(row.visita as VisitaDetailDto & Record<string, unknown>),
    };
  }
  return {
    huboRelevo: false,
    visitaAnterior: null,
    visita: normalizeVisitaDetail(data as VisitaDetailDto & Record<string, unknown>),
  };
}

/** POST /api/v1/visitas/admin/tramo — gestión manual de tramos relevo (admin). */
export async function gestionarTramoAdminWithApi(
  token: string,
  body: GestionarTramoAdminBody
): Promise<GestionarTramoAdminResultDto> {
  const data = await apiFetch<unknown>("/api/v1/visitas/admin/tramo", {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
  const row = data as Record<string, unknown>;
  const accionRaw = String(row.accion ?? body.accion);
  const accion =
    accionRaw === "iniciar" || accionRaw === "finalizar" || accionRaw === "cancelar"
      ? accionRaw
      : body.accion;
  const visitaRaw = row.visita ?? row;
  return {
    accion,
    visita: normalizeVisitaDetail(visitaRaw as VisitaDetailDto & Record<string, unknown>),
  };
}

export async function getVisitaPendienteWithApi(
  token: string,
  pacienteServicioId: number
): Promise<VisitaPendienteDto> {
  const params = new URLSearchParams({
    pacienteServicioId: String(pacienteServicioId),
  });
  const data = await apiFetch<Record<string, unknown>>(
    `/api/v1/visitas/pendiente?${params.toString()}`,
    {
      method: "GET",
      token,
    }
  );
  const visitaRaw = data.visita as Record<string, unknown> | null | undefined;
  const visita =
    visitaRaw != null
      ? {
          id: Number(visitaRaw.id),
          fechaInicio: String(visitaRaw.fechaInicio ?? visitaRaw.fecha_inicio ?? ""),
          estado: visitaRaw.estado != null ? parseVisitaEstado(visitaRaw.estado) : undefined,
          fechaLimite: (() => {
            const fl = visitaRaw.fechaLimite ?? visitaRaw.fecha_limite;
            return fl != null ? String(fl) : null;
          })(),
        }
      : null;

  const coberturaRaw = data.coberturaActiva ?? data.cobertura_activa;
  let coberturaActiva: VisitaPendienteCoberturaActivaDto | null | undefined;
  if (coberturaRaw === null) {
    coberturaActiva = null;
  } else if (coberturaRaw && typeof coberturaRaw === "object") {
    const c = coberturaRaw as Record<string, unknown>;
    coberturaActiva = {
      visitaId: Number(c.visitaId ?? c.visita_id),
      prestadorId: Number(c.prestadorId ?? c.prestador_id),
      fechaInicio: String(c.fechaInicio ?? c.fecha_inicio ?? ""),
    };
  }

  return {
    tieneVisitaPendiente: Boolean(data.tieneVisitaPendiente ?? data.tiene_visita_pendiente),
    visita,
    visitasCerradasAutomaticamente: Number(
      data.visitasCerradasAutomaticamente ?? data.visitas_cerradas_automaticamente ?? 0
    ),
    ...(data.modoRelevo != null || data.modo_relevo != null
      ? { modoRelevo: Boolean(data.modoRelevo ?? data.modo_relevo) }
      : {}),
    ...(coberturaActiva !== undefined ? { coberturaActiva } : {}),
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

/** DELETE /api/v1/visitas/:id — solo ADMIN; respuesta 204 sin body. */
export async function deleteVisitaWithApi(token: string, id: number): Promise<void> {
  await apiFetch<void>(`/api/v1/visitas/${id}`, {
    method: "DELETE",
    token,
  });
}

/** PATCH /api/v1/visitas/:id/cancelar — solo ADMIN; anula visita iniciada sin finanzas. */
export async function cancelarVisitaWithApi(
  token: string,
  id: number
): Promise<VisitaDetailDto> {
  const data = await apiFetch<unknown>(`/api/v1/visitas/${id}/cancelar`, {
    method: "PATCH",
    token,
  });
  return normalizeVisitaDetail(data as VisitaDetailDto & Record<string, unknown>);
}

function sortVisitasByFechaDesc(items: VisitaListItemDto[]): VisitaListItemDto[] {
  return [...items].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );
}

function dedupeVisitasById(items: VisitaListItemDto[]): VisitaListItemDto[] {
  const seen = new Set<number>();
  return items.filter((row) => {
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });
}

/** Visitas de un paciente (todas sus asignaciones paciente-servicio). */
export async function listVisitasByPacienteWithApi(
  token: string,
  pacienteId: number,
  options: Omit<ListVisitasOptions, "pacienteId" | "pacienteServicioId"> = {}
): Promise<PaginatedVisitasDto> {
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 20;
  const baseQuery: Omit<ListVisitasOptions, "pacienteId" | "pacienteServicioId" | "page" | "pageSize"> = {
    prestadorId: options.prestadorId,
    fechaDesde: options.fechaDesde,
    fechaHasta: options.fechaHasta,
  };

  const asignaciones = await fetchAllPaginatedItems((p, ps) =>
    listPacienteServiciosWithApi(token, { pacienteId, page: p, pageSize: ps }).then((data) => ({
      items: data.items,
      total: data.total,
    }))
  );

  if (asignaciones.length === 0) {
    return { items: [], total: 0, page, pageSize };
  }

  const asignacionIds = asignaciones
    .map(resolvePacienteServicioId)
    .filter((id) => id > 0);

  if (asignacionIds.length === 0) {
    return { items: [], total: 0, page, pageSize };
  }

  if (asignacionIds.length === 1) {
    return listVisitasWithApi(token, {
      ...baseQuery,
      page,
      pageSize,
      pacienteServicioId: asignacionIds[0],
    });
  }

  const porAsignacion = await Promise.all(
    asignacionIds.map((asignacionId) =>
      fetchAllPaginatedItems((p, ps) =>
        listVisitasWithApi(token, {
          ...baseQuery,
          pacienteServicioId: asignacionId,
          page: p,
          pageSize: ps,
        }).then((data) => ({
          items: data.items,
          total: data.total,
        }))
      )
    )
  );

  const merged = sortVisitasByFechaDesc(dedupeVisitasById(porAsignacion.flat()));
  const start = (page - 1) * pageSize;

  return {
    items: merged.slice(start, start + pageSize),
    total: merged.length,
    page,
    pageSize,
  };
}

export async function listVisitasWithApi(
  token: string,
  options: ListVisitasOptions = {}
): Promise<PaginatedVisitasDto> {
  if (options.pacienteId != null && options.pacienteServicioId == null) {
    const { pacienteId, page, pageSize, prestadorId, fechaDesde, fechaHasta } = options;
    return listVisitasByPacienteWithApi(token, pacienteId, {
      page,
      pageSize,
      prestadorId,
      fechaDesde,
      fechaHasta,
    });
  }

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

/** Listado completo para exportación (respeta filtros de listado). */
export async function listVisitasAllWithApi(
  token: string,
  options?: Omit<ListVisitasOptions, "page" | "pageSize">
): Promise<VisitaListItemDto[]> {
  return fetchAllPaginatedItems((page, pageSize) =>
    listVisitasWithApi(token, { ...options, page, pageSize }).then((data) => ({
      items: data.items,
      total: data.total,
    }))
  );
}
