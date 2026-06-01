import { apiFetch } from "@/lib/api/client";
import { listObrasSocialesWithApi } from "@/lib/api/obras-sociales";
import type {
  CreatePacienteBody,
  ModalidadCobro,
  ObraSocialResumenDto,
  PacienteDto,
  PacienteDetailDto,
  PacienteListItemDto,
  PacientePorQrDto,
  PacienteServicioAsignadoQrDto,
  PacienteServicioEstado,
  PaginatedPacientesDto,
  FrecuenciaTipo,
  PacienteServicioTarifaDto,
  TipoDia,
  TipoJornada,
  UpdatePacienteBody,
} from "@/lib/api/types";

type PacienteRaw = Partial<PacienteListItemDto> &
  Record<string, unknown> & {
    obra_social?: Partial<ObraSocialResumenDto>;
    obra_social_id?: number;
  };

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
    const { items: obras } = await listObrasSocialesWithApi(token, {
      page: 1,
      pageSize: 500,
    });
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
  const frecuenciaTipoRaw = row.frecuenciaTipo ?? row.frecuencia_tipo;
  const estadoRaw = row.estado;
  const disponibilidadRaw = row.disponibilidad as Record<string, unknown> | undefined;
  const cantidadUtilizada = Number(disponibilidadRaw?.cantidadUtilizada ?? 0);
  const cantidadPermitida = Number(disponibilidadRaw?.cantidadPermitida ?? 0);
  const cantidadDisponibleRaw = disponibilidadRaw?.cantidadDisponible;
  const periodoControlRaw = disponibilidadRaw?.periodoControl;

  const normalizedFrecuenciaTipo = (() => {
    const direct = String(frecuenciaTipoRaw ?? "").trim();
    if (direct === "diaria" || direct === "semanal" || direct === "mensual" || direct === "por_horas") {
      return direct as FrecuenciaTipo;
    }
    const fromPeriodo = String(periodoControlRaw ?? "").trim();
    if (
      fromPeriodo === "diaria" ||
      fromPeriodo === "semanal" ||
      fromPeriodo === "mensual" ||
      fromPeriodo === "por_horas"
    ) {
      return fromPeriodo as FrecuenciaTipo;
    }
    return "diaria";
  })();

  if (process.env.NODE_ENV !== "production") {
    // Debug temporal para validar discrepancias entre frecuenciaTipo y periodoControl.
    console.log("[paciente-servicio] payload disponibilidad", {
      pacienteServicioId,
      servicioId,
      frecuenciaTipoRaw,
      frecuenciaTipoNormalizado: normalizedFrecuenciaTipo,
      periodoControlRaw,
      disponibilidadRaw,
      row,
    });
  }

  return {
    pacienteServicioId,
    servicioId,
    servicioNombre: servicioNombre || `Servicio #${servicioId}`,
    modalidadCobro: String(modalidadRaw ?? "por_servicio") as ModalidadCobro,
    frecuenciaTipo: normalizedFrecuenciaTipo,
    frecuenciaValor: Number(row.frecuenciaValor ?? row.frecuencia_valor ?? 1),
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
            tipoDia: String(t.tipoDia ?? t.tipo_dia) as TipoDia,
            valor: String(t.valor ?? ""),
          })
        )
      : undefined,
    disponibilidad: disponibilidadRaw
      ? {
          periodoControl:
            disponibilidadRaw.periodoControl != null
              ? String(disponibilidadRaw.periodoControl)
              : undefined,
          inicioVentana:
            disponibilidadRaw.inicioVentana != null
              ? String(disponibilidadRaw.inicioVentana)
              : undefined,
          finVentana:
            disponibilidadRaw.finVentana != null
              ? String(disponibilidadRaw.finVentana)
              : undefined,
          fechaReferencia:
            disponibilidadRaw.fechaReferencia != null
              ? String(disponibilidadRaw.fechaReferencia)
              : undefined,
          cantidadUtilizada: Number.isFinite(cantidadUtilizada) ? cantidadUtilizada : 0,
          cantidadPermitida: Number.isFinite(cantidadPermitida) ? cantidadPermitida : 0,
          cantidadDisponible:
            cantidadDisponibleRaw != null && Number.isFinite(Number(cantidadDisponibleRaw))
              ? Number(cantidadDisponibleRaw)
              : undefined,
          utilizadoYPermitido:
            disponibilidadRaw.utilizadoYPermitido != null
              ? String(disponibilidadRaw.utilizadoYPermitido)
              : undefined,
        }
      : undefined,
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
