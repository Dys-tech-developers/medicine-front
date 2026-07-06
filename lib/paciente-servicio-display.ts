import type {
  ModalidadCobro,
  PacienteServicioAsignadoQrDto,
  PacienteServicioDisponibilidadDto,
  PeriodoControl,
} from "@/lib/api/types";
import {
  MODALIDAD_COBRO_LABELS,
  PERIODO_CONTROL_LABELS,
} from "@/lib/paciente-servicios-labels";

export type PacienteServicioCupoSource = {
  periodoControl: PeriodoControl;
  cantidadPermitida: number;
  cantidadHoras: number | null;
  modalidadCobro?: ModalidadCobro;
  disponibilidad?: PacienteServicioDisponibilidadDto | null;
};

const LEGACY_PERIODO_MAP: Record<string, PeriodoControl> = {
  diario: "diario",
  diaria: "diario",
  semanal: "semanal",
  mensual: "mensual",
};

export function normalizePeriodoControlFromRow(row: Record<string, unknown>): PeriodoControl {
  const periodoControlRaw =
    row.periodoControl ??
    row.periodo_control ??
    row.frecuenciaTipo ??
    row.frecuencia_tipo ??
    (row.disponibilidad as Record<string, unknown> | undefined)?.periodoControl;

  const direct = String(periodoControlRaw ?? "").trim().toLowerCase();
  if (direct in LEGACY_PERIODO_MAP) {
    return LEGACY_PERIODO_MAP[direct];
  }

  return "diario";
}

export function resolveCantidadPermitidaFromRow(row: Record<string, unknown>): number {
  const cantidadPermitidaAsignacion = Number(row.cantidadPermitida ?? row.cantidad_permitida ?? 0);
  const legacy = Number(row.frecuenciaValor ?? row.frecuencia_valor ?? 0);
  const dispRaw = row.disponibilidad as Record<string, unknown> | undefined;
  const fromDisp = Number(dispRaw?.cantidadPermitida ?? 0);

  if (Number.isFinite(cantidadPermitidaAsignacion) && cantidadPermitidaAsignacion > 0) {
    return cantidadPermitidaAsignacion;
  }
  if (Number.isFinite(legacy) && legacy > 0) return legacy;
  if (fromDisp > 0) return fromDisp;
  return 1;
}

export function resolveCantidadHorasFromRow(
  row: Record<string, unknown>,
  modalidadCobro?: ModalidadCobro
): number | null {
  const raw = row.cantidadHoras ?? row.cantidad_horas;
  if (raw != null && raw !== "") {
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return n;
  }

  const modalidad = String(row.modalidadCobro ?? row.modalidad_cobro ?? modalidadCobro ?? "");
  const legacyTipo = String(row.frecuenciaTipo ?? row.frecuencia_tipo ?? "").trim();
  const legacyValor = Number(row.frecuenciaValor ?? row.frecuencia_valor ?? 0);

  if (
    (modalidad === "por_hora" || legacyTipo === "por_horas") &&
    Number.isFinite(legacyValor) &&
    legacyValor > 0
  ) {
    return legacyValor;
  }

  return modalidad === "por_hora" ? null : null;
}

export function normalizeDisponibilidadFromRow(
  disponibilidadRaw: Record<string, unknown> | undefined,
  cantidadPermitidaFallback: number,
  pacienteServicioId?: number
): PacienteServicioDisponibilidadDto | undefined {
  if (!disponibilidadRaw) return undefined;

  const cantidadUtilizada = Number(disponibilidadRaw.cantidadUtilizada ?? 0);
  const cantidadPermitida = Number(
    disponibilidadRaw.cantidadPermitida ?? cantidadPermitidaFallback ?? 0
  );
  const cantidadDisponibleRaw = disponibilidadRaw.cantidadDisponible;
  const utilizadoRaw =
    disponibilidadRaw.utilizadoYPemitido ??
    disponibilidadRaw.utilizadoYPermitido;
  const periodoControl = normalizePeriodoControlFromRow({
    periodoControl: disponibilidadRaw.periodoControl,
  });
  const fechaInicioPeriodo = String(
    disponibilidadRaw.fechaInicioPeriodo ??
      disponibilidadRaw.inicioVentana ??
      ""
  );
  const fechaFinPeriodo = String(
    disponibilidadRaw.fechaFinPeriodo ?? disponibilidadRaw.finVentana ?? ""
  );
  const cantidadDisponible =
    cantidadDisponibleRaw != null && Number.isFinite(Number(cantidadDisponibleRaw))
      ? Number(cantidadDisponibleRaw)
      : Math.max(0, cantidadPermitida - cantidadUtilizada);
  const utilizadoYPemitido =
    utilizadoRaw != null
      ? String(utilizadoRaw)
      : cantidadPermitida > 0
        ? `${cantidadUtilizada}/${cantidadPermitida}`
        : "0/0";

  return {
    ...(pacienteServicioId != null ? { pacienteServicioId } : {}),
    periodoControl,
    cantidadPermitida: Number.isFinite(cantidadPermitida) ? cantidadPermitida : 0,
    cantidadUtilizada: Number.isFinite(cantidadUtilizada) ? cantidadUtilizada : 0,
    cantidadDisponible,
    fechaInicioPeriodo,
    fechaFinPeriodo,
    utilizadoYPemitido,
  };
}

export function isPacienteServicioCupoAgotado(
  modalidadCobro: ModalidadCobro | undefined,
  disponibilidad?: PacienteServicioDisponibilidadDto | null
): boolean {
  if (modalidadCobro === "por_hora" || !disponibilidad) return false;
  return disponibilidad.cantidadDisponible <= 0;
}

function formatCupoPorPeriodo(periodoControl: PeriodoControl, valor: number): string {
  switch (periodoControl) {
    case "diario":
      return valor === 1 ? "1 vez por día" : `${valor} veces por día`;
    case "semanal":
      return valor === 1 ? "1 vez por semana" : `${valor} veces por semana`;
    case "mensual":
      return valor === 1 ? "1 vez al mes" : `${valor} veces al mes`;
  }
}

/** Cupo autorizado del servicio (ej. «4 veces al mes» o «2 horas»). */
export function formatPacienteServicioFrecuencia(s: PacienteServicioCupoSource): string {
  if (s.modalidadCobro === "por_hora") {
    const horas = s.cantidadHoras ?? 0;
    if (horas > 0) {
      return horas === 1 ? "1 hora" : `${horas} horas`;
    }
  }

  const valor =
    s.disponibilidad?.cantidadPermitida && s.disponibilidad.cantidadPermitida > 0
      ? s.disponibilidad.cantidadPermitida
      : s.cantidadPermitida;

  return formatCupoPorPeriodo(s.periodoControl, valor);
}

/** Cupo consumido en el período actual, ej. `3/5`. */
export function formatPacienteServicioUsoEnPeriodo(
  s: PacienteServicioCupoSource
): string | null {
  if (s.modalidadCobro === "por_hora") return null;
  const d = s.disponibilidad;
  if (!d) return null;

  const texto = d.utilizadoYPemitido?.trim();
  if (texto) return texto;
  if (d.cantidadPermitida > 0) {
    return `${d.cantidadUtilizada}/${d.cantidadPermitida}`;
  }
  return null;
}

/** Texto compacto para `<select>` (sin repetir el uso del período). */
export function formatServicioAsignadoSelectLabel(s: PacienteServicioAsignadoQrDto): string {
  const modalidad = MODALIDAD_COBRO_LABELS[s.modalidadCobro] ?? s.modalidadCobro;
  const cupo = formatPacienteServicioFrecuencia(s);
  return `${s.servicioNombre} · ${modalidad} · ${cupo}`;
}

export function formatServicioAsignadoLabel(s: PacienteServicioAsignadoQrDto): string {
  const uso = formatPacienteServicioUsoEnPeriodo(s);
  const base = formatServicioAsignadoSelectLabel(s);
  return uso ? `${base} · ${uso}` : base;
}
