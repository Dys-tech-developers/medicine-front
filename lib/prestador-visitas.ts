import { ApiError } from "@/lib/api/client";
import { getApiErrorMessages } from "@/lib/api/format-api-error";
import type {
  CreateVisitaBody,
  PacientePorQrDto,
  PacienteServicioAsignadoQrDto,
  UpdateVisitaBody,
} from "@/lib/api/types";
import {
  FRECUENCIA_TIPO_LABELS,
  MODALIDAD_COBRO_LABELS,
} from "@/lib/paciente-servicios-labels";
import { calculateAgeFromBirthDate, type OperatorPatient } from "@/lib/patient-qr";

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

export function formatServicioAsignadoLabel(s: PacienteServicioAsignadoQrDto): string {
  const modalidad = MODALIDAD_COBRO_LABELS[s.modalidadCobro] ?? s.modalidadCobro;
  const frecuenciaTipo = FRECUENCIA_TIPO_LABELS[s.frecuenciaTipo] ?? s.frecuenciaTipo;
  const frecuencia =
    s.frecuenciaTipo === "por_horas"
      ? `${s.frecuenciaValor} h · ${frecuenciaTipo}`
      : `${s.frecuenciaValor}× ${frecuenciaTipo.toLowerCase()}`;
  return `${s.servicioNombre} · ${modalidad} · ${frecuencia}`;
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
    return (
      err.message?.trim() ||
      "No podés registrar la visita. Verificá que tu perfil de prestador esté activo."
    );
  }
  if (err.status === 404) {
    return err.message?.trim() || "La asignación de servicio ya no es válida.";
  }
  if (err.status === 409) {
    const base = err.message?.trim() || "Conflicto al registrar la visita.";
    if (/tarifa/i.test(base)) {
      return `${base} Pedile al administrador que configure las tarifas del servicio en el panel.`;
    }
    return base;
  }
  return getApiErrorMessages(err).join(" ");
}
