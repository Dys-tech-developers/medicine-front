import { ApiError } from "@/lib/api/client";
import { getApiErrorMessages } from "@/lib/api/format-api-error";
import type {
  CreateVisitaBody,
  PacientePorQrDto,
  PacienteServicioAsignadoQrDto,
  PacienteServicioDto,
  PrestadorListItemDto,
  UpdateVisitaBody,
} from "@/lib/api/types";
export {
  formatServicioAsignadoLabel,
  formatServicioAsignadoSelectLabel,
} from "@/lib/paciente-servicio-display";
import { prestadorTieneServicio } from "@/lib/prestador-servicios-filter";
import { calculateAgeFromBirthDate, type OperatorPatient } from "@/lib/patient-qr";
import {
  getReglasAsignacionFromServicio,
  modoEsControlHorario,
  modoEsRelevo,
  modoEsVisitaUnica,
} from "@/lib/reglas-asignacion";

export const VISITA_TIEMPO_MIN = 1;
export const VISITA_TIEMPO_MAX = 720;
export const VISITA_OBSERVACIONES_MAX = 5000;

export type PrestadorScannedPatient = OperatorPatient & {
  pacienteId: number;
  numeroAfiliado: string;
  sexo: string;
  servicios: PacienteServicioAsignadoQrDto[];
};

export function mapPacientePorQrToPrestadorPatient(dto: PacientePorQrDto): PrestadorScannedPatient {
  const obraNombre = dto.obraSocial?.nombre?.trim();
  const insurance = obraNombre
    ? `${obraNombre}${dto.numeroAfiliado ? ` · Af. ${dto.numeroAfiliado}` : ""}`
    : dto.numeroAfiliado || "Sin obra social";

  return {
    id: String(dto.id),
    pacienteId: dto.id,
    fullName: `${dto.nombre} ${dto.apellido}`.trim(),
    document: dto.numeroDocumento,
    age: calculateAgeFromBirthDate(dto.fechaNacimiento),
    insurance,
    codigoQr: dto.codigoQr,
    telefono: dto.telefono,
    direccion: dto.direccion,
    numeroAfiliado: dto.numeroAfiliado,
    sexo: dto.sexo,
    servicios: dto.servicios ?? [],
  };
}

export function getServiciosActivos(
  servicios: PacienteServicioAsignadoQrDto[]
): PacienteServicioAsignadoQrDto[] {
  return servicios.filter((s) => s.estado === "activa");
}

export type PrestadorAccesoDenegadoRazon =
  | "sin_servicios_activos"
  | "otro_prestador_asignado"
  | "servicio_no_habilitado"
  | "servicios_no_disponibles";

/** @deprecated Usar getPrestadorAccesoDenegadoContent */
export const PRESTADOR_SIN_ASIGNACION_MENSAJE =
  "No podés registrar una visita para este paciente con tu perfil actual.";

export function getPrestadorAccesoDenegadoRazon(input: {
  asignaciones: PacienteServicioDto[];
  prestador: PrestadorListItemDto;
}): PrestadorAccesoDenegadoRazon | null {
  const activas = input.asignaciones.filter((a) => a.estado === "activa");
  if (activas.length === 0) {
    return "sin_servicios_activos";
  }

  const atendibles = filterAsignacionesAtendiblesPorPrestador(activas, input.prestador);
  if (atendibles.length > 0) {
    return null;
  }

  let otroPrestador = false;
  let servicioNoHabilitado = false;

  for (const a of activas) {
    if (asignacionTienePrestadorFijo(a)) {
      if (a.prestadorId !== input.prestador.id) {
        otroPrestador = true;
      }
    } else if (!prestadorTieneServicio(input.prestador, a.servicioId)) {
      servicioNoHabilitado = true;
    }
  }

  if (otroPrestador && !servicioNoHabilitado) {
    return "otro_prestador_asignado";
  }
  if (servicioNoHabilitado && !otroPrestador) {
    return "servicio_no_habilitado";
  }
  return "servicios_no_disponibles";
}

export function getPrestadorAccesoDenegadoContent(razon: PrestadorAccesoDenegadoRazon): {
  title: string;
  description: string;
} {
  switch (razon) {
    case "sin_servicios_activos":
      return {
        title: "Sin prestaciones activas",
        description:
          "Este paciente no tiene servicios activos en este momento. Pedile al administrador que active o asigne una prestación antes de registrar la visita.",
      };
    case "otro_prestador_asignado":
      return {
        title: "Prestador no asignado",
        description:
          "Las prestaciones activas de este paciente están asignadas a otro profesional. Si creés que deberías atenderlo, contactá al administrador.",
      };
    case "servicio_no_habilitado":
      return {
        title: "Prestación no habilitada",
        description:
          "No tenés habilitada en tu perfil la prestación necesaria para atender a este paciente. Pedile al administrador que revise tus servicios asignados.",
      };
    default:
      return {
        title: "Visita no autorizada",
        description:
          "No podés registrar una visita para este paciente. La prestación puede estar asignada a otro profesional o no figurar en tu perfil. Contactá al administrador si necesitás ayuda.",
      };
  }
}

/** true si la asignación tiene prestador fijo (no null/0). */
export function asignacionTienePrestadorFijo(
  asignacion: Pick<PacienteServicioDto, "prestadorId">
): boolean {
  return asignacion.prestadorId != null && asignacion.prestadorId > 0;
}

/** Si hay prestador asignado, solo él; si no, cualquier prestador con el servicio habilitado. */
export function asignacionAtendiblePorPrestador(
  asignacion: PacienteServicioDto,
  prestador: PrestadorListItemDto
): boolean {
  if (asignacion.estado !== "activa") return false;
  const asignados = asignacion.prestadoresAsignados;
  if (asignados && asignados.length > 0) {
    return asignados.some((p) => p.id === prestador.id);
  }
  if (asignacionTienePrestadorFijo(asignacion)) {
    return asignacion.prestadorId === prestador.id;
  }
  return prestadorTieneServicio(prestador, asignacion.servicioId);
}

export function filterAsignacionesAtendiblesPorPrestador(
  asignaciones: PacienteServicioDto[],
  prestador: PrestadorListItemDto
): PacienteServicioDto[] {
  return asignaciones.filter((a) => asignacionAtendiblePorPrestador(a, prestador));
}

function mapAsignacionDtoToQrServicio(
  asignacion: PacienteServicioDto,
  qrServicio?: PacienteServicioAsignadoQrDto
): PacienteServicioAsignadoQrDto {
  const reglas = getReglasAsignacionFromServicio({
    ...asignacion.servicio,
    reglasAsignacion: qrServicio?.reglasAsignacion ?? asignacion.servicio.reglasAsignacion,
  });
  if (qrServicio) {
    return {
      ...qrServicio,
      controlHorario: qrServicio.controlHorario ?? asignacion.servicio.controlHorario === true,
      modoRelevo: qrServicio.modoRelevo ?? asignacion.servicio.modoRelevo === true,
      reglasAsignacion: qrServicio.reglasAsignacion ?? reglas,
      prestadoresAsignados:
        qrServicio.prestadoresAsignados ?? asignacion.prestadoresAsignados,
      coberturaDiariaInicio:
        qrServicio.coberturaDiariaInicio ?? asignacion.coberturaDiariaInicio ?? null,
      coberturaDiariaFin:
        qrServicio.coberturaDiariaFin ?? asignacion.coberturaDiariaFin ?? null,
      prestadorId: asignacion.prestadorId ?? undefined,
      prestador: asignacion.prestador ?? undefined,
    };
  }
  return {
    pacienteServicioId: asignacion.id,
    servicioId: asignacion.servicioId,
    servicioNombre: asignacion.servicio.nombre,
    controlHorario: asignacion.servicio.controlHorario === true,
    modoRelevo: asignacion.servicio.modoRelevo === true,
    reglasAsignacion: reglas,
    coberturaDiariaInicio: asignacion.coberturaDiariaInicio ?? null,
    coberturaDiariaFin: asignacion.coberturaDiariaFin ?? null,
    ...(asignacion.prestadoresAsignados
      ? { prestadoresAsignados: asignacion.prestadoresAsignados }
      : {}),
    prestadorId: asignacion.prestadorId ?? undefined,
    prestador: asignacion.prestador ?? undefined,
    modalidadCobro: asignacion.modalidadCobro,
    periodoControl: asignacion.periodoControl,
    cantidadPermitida: asignacion.cantidadPermitida,
    cantidadHoras: asignacion.cantidadHoras,
    estado: asignacion.estado,
    fechaInicio: asignacion.fechaInicio,
    fechaFin: asignacion.fechaFin,
  };
}

function qrServicioAtendiblePorPrestador(
  servicio: PacienteServicioAsignadoQrDto,
  prestador: PrestadorListItemDto
): boolean {
  const asignados = servicio.prestadoresAsignados;
  if (asignados && asignados.length > 0) {
    return asignados.some((p) => p.id === prestador.id);
  }
  return true;
}

/** Cruza asignaciones del listado con datos del QR (disponibilidad/tarifas). */
export function buildServiciosActivosParaPrestador(input: {
  qrServicios: PacienteServicioAsignadoQrDto[];
  asignaciones: PacienteServicioDto[];
  prestador: PrestadorListItemDto;
}): PacienteServicioAsignadoQrDto[] {
  const atendibles = filterAsignacionesAtendiblesPorPrestador(
    input.asignaciones,
    input.prestador
  );
  const qrById = new Map(
    input.qrServicios.map((s) => [s.pacienteServicioId, s] as const)
  );
  return atendibles
    .map((a) => mapAsignacionDtoToQrServicio(a, qrById.get(a.id)))
    .filter((s) => qrServicioAtendiblePorPrestador(s, input.prestador));
}

export type PrestadorVisitaFlujo = "relevo" | "control_horario" | "registro_unico";

/** Prioridad según reglasAsignacion.modo (fallback a flags). */
export function getPrestadorVisitaFlujo(
  servicio:
    | Pick<
        PacienteServicioAsignadoQrDto,
        "modoRelevo" | "controlHorario" | "reglasAsignacion"
      >
    | null
    | undefined
): PrestadorVisitaFlujo {
  if (!servicio) return "registro_unico";
  const reglas = getReglasAsignacionFromServicio(servicio);
  if (modoEsRelevo(reglas.modo)) return "relevo";
  if (modoEsControlHorario(reglas.modo)) return "control_horario";
  if (modoEsVisitaUnica(reglas.modo)) return "registro_unico";
  return "registro_unico";
}

export function servicioUsaModoRelevo(
  servicio:
    | Pick<
        PacienteServicioAsignadoQrDto,
        "modoRelevo" | "controlHorario" | "reglasAsignacion"
      >
    | null
    | undefined
): boolean {
  if (!servicio) return false;
  return modoEsRelevo(getReglasAsignacionFromServicio(servicio).modo);
}

export function prestadorTieneTramoActivo(
  servicio: Pick<PacienteServicioAsignadoQrDto, "coberturaActiva"> | null | undefined,
  prestadorId: number
): boolean {
  return servicio?.coberturaActiva?.prestadorId === prestadorId;
}
export function servicioUsaControlHorario(
  servicio:
    | Pick<
        PacienteServicioAsignadoQrDto,
        "modoRelevo" | "controlHorario" | "reglasAsignacion"
      >
    | null
    | undefined
): boolean {
  if (!servicio) return false;
  return modoEsControlHorario(getReglasAsignacionFromServicio(servicio).modo);
}

export function pacienteTieneServiciosActivosSinAsignacionPrestador(input: {
  qrServicios: PacienteServicioAsignadoQrDto[];
  serviciosPrestador: PacienteServicioAsignadoQrDto[];
}): boolean {
  return getServiciosActivos(input.qrServicios).length > 0 && input.serviciosPrestador.length === 0;
}

/** Valor para `<input type="datetime-local" />` en hora local. */
export function defaultDatetimeLocalValue(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function localDatetimeToIso(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/** Minutos entre inicio (ms) y fin (ms), redondeo hacia arriba. */
export function calcularDuracionVisitaMinutos(inicioMs: number, finMs: number): number {
  const diffMs = Math.max(0, finMs - inicioMs);
  const minutos = Math.ceil(diffMs / 60_000);
  return Math.min(VISITA_TIEMPO_MAX, Math.max(VISITA_TIEMPO_MIN, minutos));
}

export function calcularDuracionVisitaDesdeMs(
  inicioMs: number,
  finMs: number
): { minutos: number; excedeMaximo: boolean } {
  const diffMs = Math.max(0, finMs - inicioMs);
  const minutos = Math.ceil(diffMs / 60_000);
  if (minutos > VISITA_TIEMPO_MAX) {
    return { minutos, excedeMaximo: true };
  }
  return { minutos: Math.max(VISITA_TIEMPO_MIN, minutos), excedeMaximo: false };
}

/** Texto en vivo para el cronómetro de la visita (ej. «12 min 8 s»). */
export function formatDuracionVisitaEnCurso(inicioMs: number, ahoraMs = Date.now()): string {
  const totalSec = Math.max(0, Math.floor((ahoraMs - inicioMs) / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h} h ${m} min ${s} s`;
  if (m > 0) return `${m} min ${s} s`;
  return `${s} s`;
}

export function validatePrestadorVisitaRelevoForm(input: {
  pacienteServicioId: number | "";
  tieneServiciosActivos: boolean;
  yaTieneTramoActivo: boolean;
}): string | null {
  if (!input.tieneServiciosActivos) {
    return "El paciente no tiene servicios activos. No podés tomar el relevamiento hasta que un administrador active una asignación.";
  }
  if (input.pacienteServicioId === "" || !Number.isFinite(input.pacienteServicioId)) {
    return "Seleccioná el servicio de cobertura.";
  }
  if (input.yaTieneTramoActivo) {
    return "Ya tenés el tramo activo.";
  }
  return null;
}

export function validatePrestadorVisitaIniciarForm(input: {
  pacienteServicioId: number | "";
  tieneServiciosActivos: boolean;
  visitaEnCursoId: number | null;
}): string | null {
  if (!input.tieneServiciosActivos) {
    return "El paciente no tiene servicios activos. No podés iniciar la visita hasta que un administrador active una asignación.";
  }
  if (input.pacienteServicioId === "" || !Number.isFinite(input.pacienteServicioId)) {
    return "Seleccioná el servicio que vas a realizar.";
  }
  if (input.visitaEnCursoId != null) {
    return "Ya hay una visita en curso para este servicio. Finalizala antes de iniciar otra.";
  }
  return null;
}

export function validatePrestadorVisitaFinalizarForm(input: {
  visitaEnCursoId: number | null;
  observaciones: string;
}): string | null {
  if (input.visitaEnCursoId == null) {
    return "Iniciá la visita antes de finalizarla.";
  }
  if (input.observaciones.length > VISITA_OBSERVACIONES_MAX) {
    return `Las observaciones no pueden superar ${VISITA_OBSERVACIONES_MAX} caracteres.`;
  }
  return null;
}

export function validatePrestadorVisitaRegistroForm(input: {
  pacienteServicioId: number | "";
  visitaInicioMs: number | null;
  finMs: number;
  observaciones: string;
  tieneServiciosActivos: boolean;
}): string | null {
  if (!input.tieneServiciosActivos) {
    return "El paciente no tiene servicios activos. No podés registrar la visita hasta que un administrador active una asignación.";
  }
  if (input.pacienteServicioId === "" || !Number.isFinite(input.pacienteServicioId)) {
    return "Seleccioná el servicio que realizaste.";
  }
  if (input.visitaInicioMs == null || !Number.isFinite(input.visitaInicioMs)) {
    return "Volvé a escanear el QR del paciente para iniciar el registro.";
  }
  const { excedeMaximo } = calcularDuracionVisitaDesdeMs(input.visitaInicioMs, input.finMs);
  if (excedeMaximo) {
    return `La visita supera el máximo de ${VISITA_TIEMPO_MAX} minutos (${Math.floor(VISITA_TIEMPO_MAX / 60)} h). Registrá antes o contactá al administrador.`;
  }
  if (input.observaciones.length > VISITA_OBSERVACIONES_MAX) {
    return `Las observaciones no pueden superar ${VISITA_OBSERVACIONES_MAX} caracteres.`;
  }
  return null;
}

export function buildCreateVisitaBodyFromRegistro(input: {
  pacienteServicioId: number;
  visitaInicioMs: number;
  finMs: number;
  observaciones: string;
}): CreateVisitaBody | null {
  const { minutos, excedeMaximo } = calcularDuracionVisitaDesdeMs(
    input.visitaInicioMs,
    input.finMs
  );
  if (excedeMaximo) return null;
  const body: CreateVisitaBody = {
    pacienteServicioId: input.pacienteServicioId,
    fechaInicio: new Date(input.visitaInicioMs).toISOString(),
    tiempoMinutos: minutos,
  };
  const obs = input.observaciones.trim();
  if (obs) body.observaciones = obs;
  return body;
}

/** Validación con fecha y duración manuales (edición de visitas). */
export function validatePrestadorVisitaForm(input: {
  pacienteServicioId: number | "";
  fechaInicioLocal: string;
  tiempoMinutos: number | "";
  observaciones: string;
  tieneServiciosActivos: boolean;
}): string | null {
  if (!input.tieneServiciosActivos) {
    return "El paciente no tiene servicios activos. No podés registrar la visita hasta que un administrador active una asignación.";
  }
  if (input.pacienteServicioId === "" || !Number.isFinite(input.pacienteServicioId)) {
    return "Seleccioná el servicio que realizaste.";
  }
  const iso = localDatetimeToIso(input.fechaInicioLocal);
  if (!iso) {
    return "Indicá una fecha y hora de inicio válidas.";
  }
  if (input.tiempoMinutos === "" || !Number.isInteger(input.tiempoMinutos)) {
    return "La duración debe ser un número entero de minutos.";
  }
  if (input.tiempoMinutos < VISITA_TIEMPO_MIN || input.tiempoMinutos > VISITA_TIEMPO_MAX) {
    return `La duración debe estar entre ${VISITA_TIEMPO_MIN} y ${VISITA_TIEMPO_MAX} minutos.`;
  }
  if (input.observaciones.length > VISITA_OBSERVACIONES_MAX) {
    return `Las observaciones no pueden superar ${VISITA_OBSERVACIONES_MAX} caracteres.`;
  }
  return null;
}

export function buildCreateVisitaBody(input: {
  pacienteServicioId: number;
  fechaInicioLocal: string;
  tiempoMinutos: number;
  observaciones: string;
}): CreateVisitaBody | null {
  const fechaInicio = localDatetimeToIso(input.fechaInicioLocal);
  if (!fechaInicio) return null;
  const body: CreateVisitaBody = {
    pacienteServicioId: input.pacienteServicioId,
    fechaInicio,
    tiempoMinutos: input.tiempoMinutos,
  };
  const obs = input.observaciones.trim();
  if (obs) body.observaciones = obs;
  return body;
}

/** Convierte ISO del backend a valor para `<input type="datetime-local" />`. */
export function isoToDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return defaultDatetimeLocalValue();
  return defaultDatetimeLocalValue(d);
}

export function validatePrestadorVisitaEditForm(input: {
  fechaInicioLocal: string;
  tiempoMinutos: number | "";
  observaciones: string;
}): string | null {
  const iso = localDatetimeToIso(input.fechaInicioLocal);
  if (!iso) {
    return "Indicá una fecha y hora de inicio válidas.";
  }
  if (input.tiempoMinutos === "" || !Number.isInteger(input.tiempoMinutos)) {
    return "La duración debe ser un número entero de minutos.";
  }
  if (input.tiempoMinutos < VISITA_TIEMPO_MIN || input.tiempoMinutos > VISITA_TIEMPO_MAX) {
    return `La duración debe estar entre ${VISITA_TIEMPO_MIN} y ${VISITA_TIEMPO_MAX} minutos.`;
  }
  if (input.observaciones.length > VISITA_OBSERVACIONES_MAX) {
    return `Las observaciones no pueden superar ${VISITA_OBSERVACIONES_MAX} caracteres.`;
  }
  return null;
}

export function buildUpdateVisitaBody(input: {
  fechaInicioLocal: string;
  tiempoMinutos: number;
  observaciones: string;
}): UpdateVisitaBody | null {
  const fechaInicio = localDatetimeToIso(input.fechaInicioLocal);
  if (!fechaInicio) return null;
  const body: UpdateVisitaBody = {
    fechaInicio,
    tiempoMinutos: input.tiempoMinutos,
  };
  const obs = input.observaciones.trim();
  body.observaciones = obs || null;
  return body;
}

export function getPrestadorQrErrorMessage(err: ApiError): string {
  if (err.status === 401) {
    return "Tu sesión expiró. Volvé a iniciar sesión.";
  }
  if (err.status === 403) {
    return err.message?.trim() || "No tenés permisos para consultar este paciente.";
  }
  if (err.status === 404) {
    return err.message?.trim() || "No se encontró un paciente con ese código QR.";
  }
  if (err.status === 400) {
    return err.message?.trim() || "El código QR no tiene un formato válido (ej. PAC-000001).";
  }
  return getApiErrorMessages(err).join(" ");
}

export function getPrestadorVisitaErrorMessage(err: ApiError): string {
  if (err.status === 401) {
    return "Tu sesión expiró. Volvé a iniciar sesión.";
  }
  if (err.status === 403) {
    const msg = err.message?.trim();
    if (msg) return msg;
    return "No podés registrar esta visita con tu perfil actual. Contactá al administrador si creés que deberías poder atender a este paciente.";
  }
  if (err.status === 404) {
    return err.message?.trim() || "La asignación de servicio ya no es válida.";
  }
  if (err.status === 409) {
    const base = err.message?.trim() || "Conflicto al registrar la visita.";
    if (/suspendida|finalizada|no está activa/i.test(base)) {
      return base;
    }
    if (/cupo|agotado|período/i.test(base)) {
      return base;
    }
    if (/vigencia|fecha.*asignación|anterior|posterior/i.test(base)) {
      return base;
    }
    if (/tarifa/i.test(base)) {
      if (/no_habil|no hábil|no habil/i.test(base)) {
        return `${base} Pedile al administrador que cargue la tarifa no hábil para ese servicio.`;
      }
      return `${base} Pedile al administrador que configure las tarifas del servicio en el panel.`;
    }
    return base;
  }
  return getApiErrorMessages(err).join(" ");
}
