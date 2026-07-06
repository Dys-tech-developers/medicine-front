import { apiFetch } from "@/lib/api/client";
import { fetchAllPaginatedItems } from "@/lib/api/list-pagination";
import { listObrasSocialesWithApi } from "@/lib/api/obras-sociales";
import {
  normalizeDisponibilidadFromRow,
  normalizePeriodoControlFromRow,
  resolveCantidadHorasFromRow,
  resolveCantidadPermitidaFromRow,
} from "@/lib/paciente-servicio-display";
import type {
  CreatePacienteBody,
  LocalidadDto,
  ModalidadCobro,
  ObraSocialResumenDto,
  PacienteDto,
  PacienteDetailDto,
  PacienteListItemDto,
  PacientePorQrDto,
  PacienteServicioAsignadoQrDto,
  PacienteServicioEstado,
  PaginatedPacientesDto,
  PacienteServicioTarifaDto,
  TipoJornada,
  UpdatePacienteBody,
} from "@/lib/api/types";
import { normalizeTipoDia } from "@/lib/servicios-tarifas-labels";
import { normalizeReglasAsignacion } from "@/lib/reglas-asignacion";

type PacienteRaw = Partial<PacienteListItemDto> &
  Record<string, unknown> & {
    obra_social?: Partial<ObraSocialResumenDto>;
    obra_social_id?: number;
    localidad_id?: string | number;
    localidad?: Partial<LocalidadDto> | string | null;
  };

function normalizeLocalidadResumen(
  raw: unknown,
  fallbackId?: string
): LocalidadDto | null {
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const id = String(o.id ?? o.codigo ?? fallbackId ?? "").trim();
    const nombre = String(o.nombre ?? o.descripcion ?? "").trim();
    if (id && nombre) return { id, nombre };
    if (id) return { id, nombre: nombre || id };
    return null;
  }
  if (typeof raw === "string" && raw.trim()) {
    return { id: fallbackId ?? raw.trim(), nombre: raw.trim() };
  }
  return null;
}

function normalizeObraSocialResumen(
  raw: unknown
): ObraSocialResumenDto | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = Number(o.id);
  if (!Number.isFinite(id) || id <= 0) return null;
  const nombre = String(o.nombre ?? "").trim();
  const codigo = String(o.codigo ?? "").trim();
  if (!nombre && !codigo) return null;
  const estadoRaw = o.estado ?? o.activo;
  const estado =
    estadoRaw === undefined || estadoRaw === null
      ? undefined
      : Boolean(estadoRaw);
  return { id, nombre, codigo, ...(estado !== undefined ? { estado } : {}) };
}

export function normalizePaciente(item: PacienteRaw): PacienteListItemDto {
  const obraSocial =
    normalizeObraSocialResumen(item.obraSocial) ??
    normalizeObraSocialResumen(item.obra_social);

  const obraSocialIdRaw = item.obraSocialId ?? item.obra_social_id ?? obraSocial?.id;
  const obraSocialId =
    obraSocialIdRaw != null && Number.isFinite(Number(obraSocialIdRaw))
      ? Number(obraSocialIdRaw)
      : undefined;

  const obraSocialResolved =
    obraSocial && obraSocialId != null && obraSocial.id !== obraSocialId
      ? { ...obraSocial, id: obraSocialId }
      : obraSocial;

  const localidad =
    typeof item.localidad === "string"
      ? item.localidad.trim()
      : normalizeLocalidadResumen(item.localidad)?.nombre?.trim() ?? "";

  return {
    id: Number(item.id),
    nombre: String(item.nombre ?? ""),
    apellido: String(item.apellido ?? ""),
    numeroDocumento: String(item.numeroDocumento ?? item.numero_documento ?? ""),
    codigoQr: String(item.codigoQr ?? item.codigo_qr ?? ""),
    fechaNacimiento: String(item.fechaNacimiento ?? item.fecha_nacimiento ?? ""),
    sexo: (item.sexo as PacienteListItemDto["sexo"]) ?? "X",
    telefono: String(item.telefono ?? ""),
    direccion: String(item.direccion ?? ""),
    localidad,
    obraSocialId: obraSocialId ?? obraSocialResolved?.id,
    obraSocial: obraSocialResolved ?? null,
    numeroAfiliado: String(item.numeroAfiliado ?? item.numero_afiliado ?? ""),
    createdAt: String(item.createdAt ?? item.created_at ?? ""),
  };
}

function normalizeList(data: PaginatedPacientesDto): PaginatedPacientesDto {
  return {
    ...data,
    items: (data.items ?? []).map((row) =>
      normalizePaciente(row as PacienteRaw)
    ),
  };
}

/** Completa nombre/código si el listado solo trae obraSocialId (común en GET paginado). */
async function enrichPacientesObraSocial(
  token: string,
  items: PacienteListItemDto[]
): Promise<PacienteListItemDto[]> {
  const needsEnrich = items.some(
    (p) => p.obraSocialId != null && !p.obraSocial?.nombre?.trim()
  );
  if (!needsEnrich) return items;

  try {
    const obras = await fetchAllPaginatedItems((page, pageSize) =>
      listObrasSocialesWithApi(token, { page, pageSize }).then((data) => ({
        items: data.items,
        total: data.total,
      }))
    );
    const byId = new Map(
      obras.map((o) => [
        o.id,
        {
          id: o.id,
          nombre: o.nombre,
          codigo: o.codigo,
          estado: o.estado,
        } satisfies ObraSocialResumenDto,
      ])
    );

    return items.map((p) => {
      if (!p.obraSocialId) return p;
      if (p.obraSocial?.nombre?.trim()) return p;
      const obra = byId.get(p.obraSocialId);
      if (!obra) return p;
      return { ...p, obraSocial: obra };
    });
  } catch {
    return items;
  }
}

export async function listPacientesWithApi(
  token: string,
  page = 1,
  pageSize = 20
): Promise<PaginatedPacientesDto> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  const data = await apiFetch<PaginatedPacientesDto>(
    `/api/v1/pacientes?${params.toString()}`,
    {
      method: "GET",
      token,
    }
  );
  const normalized = normalizeList(data);
  const items = await enrichPacientesObraSocial(token, normalized.items);
  return { ...normalized, items };
}

/** Listado completo para exportación (enriquece obra social si hace falta). */
export async function listPacientesAllWithApi(
  token: string
): Promise<PacienteListItemDto[]> {
  return fetchAllPaginatedItems((page, pageSize) =>
    listPacientesWithApi(token, page, pageSize).then((data) => ({
      items: data.items,
      total: data.total,
    }))
  );
}

function normalizePacienteDto(data: unknown): PacienteDto {
  const raw = (data ?? {}) as Record<string, unknown>;
  const normalized = normalizePaciente(raw as PacienteRaw);
  return {
    ...normalized,
    updatedAt: String(raw.updatedAt ?? raw.updated_at ?? ""),
    qrDataUrl: String(raw.qrDataUrl ?? raw.qr_data_url ?? ""),
  };
}

async function enrichPacienteDto(token: string, dto: PacienteDto): Promise<PacienteDto> {
  const [enriched] = await enrichPacientesObraSocial(token, [dto]);
  return { ...dto, ...enriched };
}

function normalizePacienteDetail(data: unknown): PacienteDetailDto {
  const raw = (data ?? {}) as Record<string, unknown>;
  const base = normalizePacienteDto(data);
  const serviciosRaw = raw.servicios ?? raw.asignaciones;
  const servicios = Array.isArray(serviciosRaw)
    ? serviciosRaw
        .map((s) => normalizePacienteServicioAsignadoQr(s as Record<string, unknown>))
        .filter((s): s is PacienteServicioAsignadoQrDto => s != null)
    : [];
  return { ...base, servicios };
}

export async function getPacienteByIdWithApi(
  token: string,
  id: number
): Promise<PacienteDetailDto> {
  const data = await apiFetch<unknown>(`/api/v1/pacientes/${id}`, {
    method: "GET",
    token,
  });
  const dto = normalizePacienteDetail(data);
  const enriched = await enrichPacienteDto(token, dto);
  return { ...dto, ...enriched };
}

export async function createPacienteWithApi(
  token: string,
  body: CreatePacienteBody
): Promise<PacienteDto> {
  const data = await apiFetch<unknown>("/api/v1/pacientes", {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
  const dto = normalizePacienteDto(data);
  return enrichPacienteDto(token, dto);
}

export async function updatePacienteWithApi(
  token: string,
  id: number,
  body: UpdatePacienteBody
): Promise<PacienteDto> {
  const data = await apiFetch<unknown>(`/api/v1/pacientes/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(body),
  });
  const dto = normalizePacienteDto(data);
  return enrichPacienteDto(token, dto);
}

export async function deletePacienteWithApi(token: string, id: number): Promise<void> {
  await apiFetch<unknown>(`/api/v1/pacientes/${id}`, {
    method: "DELETE",
    token,
  });
}

function normalizePacienteServicioAsignadoQr(
  row: Record<string, unknown>
): PacienteServicioAsignadoQrDto | null {
  const pacienteServicioId = Number(
    row.pacienteServicioId ?? row.paciente_servicio_id ?? row.id
  );
  const servicioId = Number(row.servicioId ?? row.servicio_id);
  if (!Number.isFinite(pacienteServicioId) || pacienteServicioId <= 0) return null;
  if (!Number.isFinite(servicioId) || servicioId <= 0) return null;

  const servicioNombre = String(
    row.servicioNombre ?? row.servicio_nombre ?? row.nombre ?? ""
  ).trim();
  const modalidadRaw = row.modalidadCobro ?? row.modalidad_cobro;
  const estadoRaw = row.estado;
  const disponibilidadRaw = row.disponibilidad as Record<string, unknown> | undefined;
  const modalidadCobro = String(modalidadRaw ?? "por_servicio") as ModalidadCobro;
  const periodoControl = normalizePeriodoControlFromRow(row);
  const cantidadPermitida = resolveCantidadPermitidaFromRow(row);
  const cantidadHoras = resolveCantidadHorasFromRow(row, modalidadCobro);
  const disponibilidad = normalizeDisponibilidadFromRow(
    disponibilidadRaw,
    cantidadPermitida,
    pacienteServicioId
  );

  const prestadorRaw = row.prestador as Record<string, unknown> | undefined;
  const prestadorIdRaw = row.prestadorId ?? row.prestador_id ?? prestadorRaw?.id;
  const prestadorId =
    prestadorIdRaw != null && Number.isFinite(Number(prestadorIdRaw))
      ? Number(prestadorIdRaw)
      : undefined;

  const controlHorario = Boolean(row.controlHorario ?? row.control_horario ?? false);
  const modoRelevo = Boolean(row.modoRelevo ?? row.modo_relevo ?? false);
  const reglasAsignacion = normalizeReglasAsignacion(
    row.reglasAsignacion ?? row.reglas_asignacion,
    { modoRelevo, controlHorario }
  );

  const coberturaDiariaInicioRaw = row.coberturaDiariaInicio ?? row.cobertura_diaria_inicio;
  const coberturaDiariaFinRaw = row.coberturaDiariaFin ?? row.cobertura_diaria_fin;
  const coberturaDiariaInicio =
    coberturaDiariaInicioRaw != null && String(coberturaDiariaInicioRaw).trim()
      ? String(coberturaDiariaInicioRaw)
      : null;
  const coberturaDiariaFin =
    coberturaDiariaFinRaw != null && String(coberturaDiariaFinRaw).trim()
      ? String(coberturaDiariaFinRaw)
      : null;

  const prestadoresAsignadosRaw = row.prestadoresAsignados ?? row.prestadores_asignados;
  const prestadoresAsignados = Array.isArray(prestadoresAsignadosRaw)
    ? prestadoresAsignadosRaw
        .map((p) => {
          const item = p as Record<string, unknown>;
          const id = Number(item.id);
          const nombre = String(item.nombre ?? "").trim();
          if (!Number.isFinite(id) || id <= 0 || !nombre) return null;
          return { id, nombre };
        })
        .filter((p): p is { id: number; nombre: string } => p != null)
    : undefined;

  const coberturaActivaRaw = row.coberturaActiva ?? row.cobertura_activa;
  const coberturaActiva =
    coberturaActivaRaw && typeof coberturaActivaRaw === "object"
      ? (() => {
          const c = coberturaActivaRaw as Record<string, unknown>;
          const visitaId = Number(c.visitaId ?? c.visita_id);
          const prestadorId = Number(c.prestadorId ?? c.prestador_id);
          const prestadorNombre = String(c.prestadorNombre ?? c.prestador_nombre ?? "").trim();
          const fechaInicio = String(c.fechaInicio ?? c.fecha_inicio ?? "");
          if (
            !Number.isFinite(visitaId) ||
            visitaId <= 0 ||
            !Number.isFinite(prestadorId) ||
            prestadorId <= 0 ||
            !fechaInicio
          ) {
            return null;
          }
          return { visitaId, prestadorId, prestadorNombre, fechaInicio };
        })()
      : coberturaActivaRaw === null
        ? null
        : undefined;

  const visitaPendienteRaw = row.visitaPendiente ?? row.visita_pendiente;
  const visitaPendiente =
    visitaPendienteRaw && typeof visitaPendienteRaw === "object"
      ? {
          id: Number((visitaPendienteRaw as Record<string, unknown>).id),
          fechaInicio: String(
            (visitaPendienteRaw as Record<string, unknown>).fechaInicio ??
              (visitaPendienteRaw as Record<string, unknown>).fecha_inicio ??
              ""
          ),
          fechaLimite: (() => {
            const fl =
              (visitaPendienteRaw as Record<string, unknown>).fechaLimite ??
              (visitaPendienteRaw as Record<string, unknown>).fecha_limite;
            return fl != null ? String(fl) : null;
          })(),
        }
      : undefined;

  return {
    pacienteServicioId,
    servicioId,
    servicioNombre: servicioNombre || `Servicio #${servicioId}`,
    controlHorario,
    ...(modoRelevo ? { modoRelevo: true } : {}),
    reglasAsignacion,
    ...(coberturaDiariaInicio != null || coberturaDiariaFin != null
      ? { coberturaDiariaInicio, coberturaDiariaFin }
      : {}),
    ...(prestadoresAsignados && prestadoresAsignados.length > 0
      ? { prestadoresAsignados }
      : {}),
    ...(coberturaActiva !== undefined ? { coberturaActiva } : {}),
    ...(visitaPendiente != null &&
    !modoRelevo &&
    Number.isFinite(visitaPendiente.id) &&
    visitaPendiente.id > 0 &&
    visitaPendiente.fechaInicio
      ? { visitaPendiente }
      : {}),
    ...(prestadorId != null
      ? {
          prestadorId,
          prestador: prestadorRaw
            ? {
                id: Number(prestadorRaw.id ?? prestadorId),
                nombre: String(prestadorRaw.nombre ?? ""),
                email: String(prestadorRaw.email ?? ""),
              }
            : undefined,
        }
      : {}),
    modalidadCobro,
    periodoControl,
    cantidadPermitida,
    cantidadHoras,
    estado: String(estadoRaw ?? "activa") as PacienteServicioEstado,
    fechaInicio:
      row.fechaInicio != null || row.fecha_inicio != null
        ? String(row.fechaInicio ?? row.fecha_inicio)
        : undefined,
    fechaFin:
      row.fechaFin != null || row.fecha_fin != null
        ? String(row.fechaFin ?? row.fecha_fin)
        : row.fechaFin === null || row.fecha_fin === null
          ? null
          : undefined,
    tarifas: Array.isArray(row.tarifas)
      ? (row.tarifas as Record<string, unknown>[]).map(
          (t): PacienteServicioTarifaDto => ({
            id: Number(t.id),
            modalidadCobro: String(t.modalidadCobro ?? t.modalidad_cobro) as ModalidadCobro,
            tipoJornada: String(t.tipoJornada ?? t.tipo_jornada) as TipoJornada,
            tipoDia: normalizeTipoDia(String(t.tipoDia ?? t.tipo_dia)),
            valor: String(t.valor ?? ""),
          })
        )
      : undefined,
    disponibilidad,
  };
}

function normalizePacientePorQr(data: unknown): PacientePorQrDto {
  const raw = (data ?? {}) as Record<string, unknown>;
  const base = normalizePacienteDto(data);
  const serviciosRaw = raw.servicios ?? raw.asignaciones;
  const servicios = Array.isArray(serviciosRaw)
    ? serviciosRaw
        .map((s) =>
          normalizePacienteServicioAsignadoQr(s as Record<string, unknown>)
        )
        .filter((s): s is PacienteServicioAsignadoQrDto => s != null)
    : [];
  return { ...base, servicios };
}

/** GET /api/v1/pacientes/qr/:codigoQr — búsqueda por escaneo (ej. PAC-000001). */
export async function getPacienteByCodigoQrWithApi(
  token: string,
  codigoQr: string
): Promise<PacientePorQrDto> {
  const encoded = encodeURIComponent(codigoQr.trim().toUpperCase());
  const data = await apiFetch<unknown>(`/api/v1/pacientes/qr/${encoded}`, {
    method: "GET",
    token,
  });
  const dto = normalizePacientePorQr(data);
  const enriched = await enrichPacienteDto(token, dto);
  return { ...dto, ...enriched };
}
