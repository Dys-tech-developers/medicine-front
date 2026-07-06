import { apiFetch } from "@/lib/api/client";
import {
  normalizeDisponibilidadFromRow,
  normalizePeriodoControlFromRow,
  resolveCantidadHorasFromRow,
  resolveCantidadPermitidaFromRow,
} from "@/lib/paciente-servicio-display";
import { normalizeReglasAsignacion } from "@/lib/reglas-asignacion";
import type {
  CreatePacienteServicioBody,
  PaginatedPacienteServiciosDto,
  PacienteServicioDisponibilidadDto,
  PacienteServicioDisponibilidadResponseDto,
  PacienteServicioDto,
  PacienteServicioEstado,
  PacienteServicioPrestadorResumenDto,
  PrestadorAsignadoResumenDto,
  UpdatePacienteServicioBody,
} from "@/lib/api/types";

/** ID de fila en `paciente_servicios` (el backend a veces usa `pacienteServicioId`). */
export function resolvePacienteServicioId(
  row: Pick<PacienteServicioDto, "id"> & {
    pacienteServicioId?: number;
    paciente_servicio_id?: number;
  }
): number {
  const id = Number(
    row.id ?? row.pacienteServicioId ?? row.paciente_servicio_id
  );
  return Number.isFinite(id) ? id : 0;
}

function normalizePrestadorResumen(
  raw: Record<string, unknown> | undefined,
  prestadorId: number
): PacienteServicioPrestadorResumenDto {
  return {
    id: Number(raw?.id ?? prestadorId ?? 0),
    nombre: String(raw?.nombre ?? ""),
    email: String(raw?.email ?? ""),
  };
}

function normalizePrestadoresAsignados(
  raw: unknown
): PrestadorAsignadoResumenDto[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const items = raw
    .map((p) => {
      const item = p as Record<string, unknown>;
      const id = Number(item.id);
      const nombre = String(item.nombre ?? "").trim();
      if (!Number.isFinite(id) || id <= 0 || !nombre) return null;
      return { id, nombre };
    })
    .filter((p): p is PrestadorAsignadoResumenDto => p != null);
  return items.length > 0 ? items : undefined;
}

export function normalizePacienteServicioDto(
  row: PacienteServicioDto & Record<string, unknown>
): PacienteServicioDto {
  const id = resolvePacienteServicioId(row);
  const pacienteRaw = row.paciente as Record<string, unknown> | undefined;
  const servicioRaw = row.servicio as Record<string, unknown> | undefined;
  const prestadorRaw = row.prestador as Record<string, unknown> | undefined;
  const prestadorIdRaw = row.prestadorId ?? row.prestador_id ?? prestadorRaw?.id;
  const prestadorId =
    prestadorIdRaw == null || prestadorIdRaw === ""
      ? null
      : Number.isFinite(Number(prestadorIdRaw)) && Number(prestadorIdRaw) > 0
        ? Number(prestadorIdRaw)
        : null;
  const modalidadCobro = String(
    row.modalidadCobro ?? row.modalidad_cobro ?? "por_servicio"
  ) as PacienteServicioDto["modalidadCobro"];
  const periodoControl = normalizePeriodoControlFromRow(row);
  const cantidadPermitida = resolveCantidadPermitidaFromRow(row);
  const cantidadHoras = resolveCantidadHorasFromRow(row, modalidadCobro);
  const prestadoresAsignados = normalizePrestadoresAsignados(
    row.prestadoresAsignados ?? row.prestadores_asignados
  );
  const prestadorIdsRaw = row.prestadorIds ?? row.prestador_ids;
  const prestadorIds = Array.isArray(prestadorIdsRaw)
    ? prestadorIdsRaw.map(Number).filter((id) => Number.isFinite(id) && id > 0)
    : prestadoresAsignados?.map((p) => p.id);

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

  const modoRelevo = Boolean(servicioRaw?.modoRelevo ?? servicioRaw?.modo_relevo ?? false);
  const controlHorario = Boolean(
    servicioRaw?.controlHorario ?? servicioRaw?.control_horario ?? false
  );
  const reglasAsignacion = normalizeReglasAsignacion(
    servicioRaw?.reglasAsignacion ?? servicioRaw?.reglas_asignacion,
    { modoRelevo, controlHorario }
  );

  return {
    ...row,
    id,
    pacienteId: Number(row.pacienteId ?? row.paciente_id ?? pacienteRaw?.id ?? 0),
    servicioId: Number(row.servicioId ?? row.servicio_id ?? servicioRaw?.id ?? 0),
    prestadorId,
    ...(prestadorIds && prestadorIds.length > 0 ? { prestadorIds } : {}),
    ...(prestadoresAsignados ? { prestadoresAsignados } : {}),
    coberturaDiariaInicio,
    coberturaDiariaFin,
    fechaInicio: String(row.fechaInicio ?? row.fecha_inicio ?? ""),
    fechaFin:
      row.fechaFin != null || row.fecha_fin != null
        ? String(row.fechaFin ?? row.fecha_fin)
        : null,
    periodoControl,
    cantidadPermitida,
    cantidadHoras,
    modalidadCobro,
    estado: String(row.estado ?? "activa") as PacienteServicioEstado,
    createdAt: String(row.createdAt ?? row.created_at ?? ""),
    updatedAt: String(row.updatedAt ?? row.updated_at ?? ""),
    paciente: {
      id: Number(pacienteRaw?.id ?? 0),
      nombre: String(pacienteRaw?.nombre ?? ""),
      apellido: String(pacienteRaw?.apellido ?? ""),
      numeroDocumento: String(
        pacienteRaw?.numeroDocumento ?? pacienteRaw?.numero_documento ?? ""
      ),
      codigoQr: String(pacienteRaw?.codigoQr ?? pacienteRaw?.codigo_qr ?? ""),
      direccion:
        pacienteRaw?.direccion != null ? String(pacienteRaw.direccion) : undefined,
      localidad:
        pacienteRaw?.localidad != null
          ? String(
              typeof pacienteRaw.localidad === "string"
                ? pacienteRaw.localidad
                : (pacienteRaw.localidad as Record<string, unknown>).nombre ?? ""
            ).trim() || undefined
          : undefined,
    },
    servicio: {
      id: Number(servicioRaw?.id ?? 0),
      nombre: String(servicioRaw?.nombre ?? ""),
      estado: Boolean(servicioRaw?.estado ?? servicioRaw?.activo ?? true),
      controlHorario,
      modoRelevo,
      reglasAsignacion,
    },
    prestador:
      prestadorId != null
        ? normalizePrestadorResumen(prestadorRaw, prestadorId)
        : null,
  };
}

export type ListPacienteServiciosOptions = {
  page?: number;
  pageSize?: number;
  pacienteId?: number;
  servicioId?: number;
  estado?: PacienteServicioEstado;
};

function buildListQuery(options?: ListPacienteServiciosOptions): string {
  const params = new URLSearchParams();
  if (options?.page != null) params.set("page", String(options.page));
  if (options?.pageSize != null) params.set("pageSize", String(options.pageSize));
  if (options?.pacienteId != null) params.set("pacienteId", String(options.pacienteId));
  if (options?.servicioId != null) params.set("servicioId", String(options.servicioId));
  if (options?.estado) params.set("estado", options.estado);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function listPacienteServiciosWithApi(
  token: string,
  options?: ListPacienteServiciosOptions
): Promise<PaginatedPacienteServiciosDto> {
  const data = await apiFetch<PaginatedPacienteServiciosDto>(
    `/api/v1/paciente-servicios${buildListQuery(options)}`,
    { method: "GET", token }
  );
  return {
    ...data,
    items: data.items.map((row) =>
      normalizePacienteServicioDto(row as PacienteServicioDto & Record<string, unknown>)
    ),
  };
}

export async function getPacienteServicioByIdWithApi(
  token: string,
  id: number
): Promise<PacienteServicioDto> {
  const data = await apiFetch<PacienteServicioDto>(`/api/v1/paciente-servicios/${id}`, {
    method: "GET",
    token,
  });
  return normalizePacienteServicioDto(data as PacienteServicioDto & Record<string, unknown>);
}

export async function createPacienteServicioWithApi(
  token: string,
  body: CreatePacienteServicioBody
): Promise<PacienteServicioDto> {
  const data = await apiFetch<PacienteServicioDto>("/api/v1/paciente-servicios", {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
  return normalizePacienteServicioDto(data as PacienteServicioDto & Record<string, unknown>);
}

export async function updatePacienteServicioWithApi(
  token: string,
  id: number,
  body: UpdatePacienteServicioBody
): Promise<PacienteServicioDto> {
  const data = await apiFetch<PacienteServicioDto>(`/api/v1/paciente-servicios/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(body),
  });
  return normalizePacienteServicioDto(data as PacienteServicioDto & Record<string, unknown>);
}

export async function deletePacienteServicioWithApi(token: string, id: number): Promise<void> {
  await apiFetch<unknown>(`/api/v1/paciente-servicios/${id}`, {
    method: "DELETE",
    token,
  });
}

function normalizeDisponibilidadResponse(
  data: PacienteServicioDisponibilidadResponseDto,
  pacienteServicioId: number
): PacienteServicioDisponibilidadDto {
  const raw =
    data && typeof data === "object" && "disponibilidad" in data && data.disponibilidad
      ? (data.disponibilidad as Record<string, unknown>)
      : (data as Record<string, unknown>);

  const normalized = normalizeDisponibilidadFromRow(
    raw,
    Number(raw.cantidadPermitida ?? 0),
    Number(raw.pacienteServicioId ?? pacienteServicioId)
  );

  if (normalized) return normalized;

  return {
    pacienteServicioId,
    periodoControl: "diario",
    cantidadPermitida: 0,
    cantidadUtilizada: 0,
    cantidadDisponible: 0,
    fechaInicioPeriodo: "",
    fechaFinPeriodo: "",
    utilizadoYPemitido: "0/0",
  };
}

export async function getPacienteServicioDisponibilidadWithApi(
  token: string,
  pacienteServicioId: number
): Promise<PacienteServicioDisponibilidadDto> {
  const data = await apiFetch<PacienteServicioDisponibilidadResponseDto>(
    `/api/v1/paciente-servicios/${pacienteServicioId}/disponibilidad`,
    {
      method: "GET",
      token,
    }
  );
  return normalizeDisponibilidadResponse(data, pacienteServicioId);
}
