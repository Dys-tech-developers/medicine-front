import type {
  PacienteServicioEstado,
  PacienteServicioTarifaDto,
  ServicioConTarifasDto,
  ServicioPacienteAsignadoDto,
  ServicioTarifaDto,
} from "@/lib/api/types";
import { formatPacienteServicioFrecuencia } from "@/lib/paciente-servicio-display";
import { asignacionEstadoBadgeClass as asignacionEstadoBadgeClassUi } from "@/lib/medical-ui-classes";
import {
  labelTipoDia,
  MODALIDAD_COBRO_LABELS,
  TIPO_JORNADA_LABELS,
} from "@/lib/servicios-tarifas-labels";

export function getServicioPacientesCount(servicio: ServicioConTarifasDto): number {
  return servicio.pacientes?.length ?? 0;
}

export function getPacienteAsignadoNombre(p: ServicioPacienteAsignadoDto): string {
  return `${p.nombre} ${p.apellido}`.trim();
}

export function formatAsignacionFecha(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatAsignacionVigencia(p: ServicioPacienteAsignadoDto): string {
  if (!p.fechaInicio) return "—";
  const inicio = formatAsignacionFecha(p.fechaInicio);
  if (!p.fechaFin) return `Desde ${inicio}`;
  return `${inicio} – ${formatAsignacionFecha(p.fechaFin)}`;
}

export function formatAsignacionFrecuencia(p: ServicioPacienteAsignadoDto): string {
  return formatPacienteServicioFrecuencia(p);
}

export function formatAsignacionModalidad(p: ServicioPacienteAsignadoDto): string {
  return MODALIDAD_COBRO_LABELS[p.modalidadCobro] ?? p.modalidadCobro;
}

const ASIGNACION_ESTADO_LABELS: Record<PacienteServicioEstado, string> = {
  activa: "Activa",
  suspendida: "Suspendida",
  finalizada: "Finalizada",
};

export function asignacionEstadoLabel(estado: PacienteServicioEstado): string {
  return ASIGNACION_ESTADO_LABELS[estado] ?? estado;
}

export function asignacionEstadoBadgeClass(estado: PacienteServicioEstado): string {
  return asignacionEstadoBadgeClassUi(estado);
}

export function formatTarifaValor(valor: string): string {
  const n = Number(valor);
  if (!Number.isFinite(n)) return valor;
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatTarifaContexto(
  tarifa: Pick<ServicioTarifaDto, "tipoJornada" | "tipoDia" | "modalidadCobro">
): string {
  return `${TIPO_JORNADA_LABELS[tarifa.tipoJornada]} · ${labelTipoDia(tarifa.tipoDia)} · ${MODALIDAD_COBRO_LABELS[tarifa.modalidadCobro]}`;
}

/** Una línea para la celda compacta de la tabla (rango de valores si hay varias). */
export function formatTarifasResumenValores(tarifas: ServicioTarifaDto[]): string {
  if (tarifas.length === 0) return "";
  const valores = tarifas
    .map((t) => Number(t.valor))
    .filter((n) => Number.isFinite(n));
  if (valores.length === 0) return tarifas.length === 1 ? formatTarifaValor(tarifas[0].valor) : `${tarifas.length} tarifas`;
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  if (min === max) return formatTarifaValor(String(min));
  return `${formatTarifaValor(String(min))} – ${formatTarifaValor(String(max))}`;
}

export function hasPacienteAsignadoTarifas(
  p: ServicioPacienteAsignadoDto
): p is ServicioPacienteAsignadoDto & { tarifas: PacienteServicioTarifaDto[] } {
  return (p.tarifas?.length ?? 0) > 0;
}

export function formatServicioFecha(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export function formatServicioControlHorario(controlHorario?: boolean): string {
  return controlHorario ? "Sí — inicio y fin separados" : "No — registro en un paso";
}

export function formatServicioModoVisita(servicio: {
  modoRelevo?: boolean;
  controlHorario?: boolean;
}): string {
  if (servicio.modoRelevo) return "Relevamiento — cobertura continua por QR";
  if (servicio.controlHorario) return "Control horario — inicio y fin separados";
  return "Registro en un paso";
}

export type ServicioModoVisitaFormValue = "registro_unico" | "control_horario" | "relevamiento";

export function servicioModoVisitaFromFlags(servicio: {
  modoRelevo?: boolean;
  controlHorario?: boolean;
}): ServicioModoVisitaFormValue {
  if (servicio.modoRelevo) return "relevamiento";
  if (servicio.controlHorario) return "control_horario";
  return "registro_unico";
}

export function servicioModoVisitaToFlags(modo: ServicioModoVisitaFormValue): {
  controlHorario: boolean;
  modoRelevo: boolean;
} {
  return {
    controlHorario: modo === "control_horario",
    modoRelevo: modo === "relevamiento",
  };
}
