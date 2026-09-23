import type { ModalidadCobro, TipoDia, TipoJornada } from "@/lib/api/types";

export const MODALIDADES_COBRO: ModalidadCobro[] = ["por_servicio", "por_hora", "por_dia"];

export const TIPOS_JORNADA: TipoJornada[] = ["cualquiera", "diurno", "nocturno"];

export const TIPOS_DIA: TipoDia[] = ["cualquiera", "habil", "no_habil", "feriado"];

export const MODALIDAD_COBRO_LABELS: Record<ModalidadCobro, string> = {
  por_servicio: "Por servicio",
  por_hora: "Por hora",
  por_dia: "Por día",
};

export const TIPO_JORNADA_LABELS: Record<TipoJornada, string> = {
  cualquiera: "Cualquiera",
  diurno: "Diurno",
  nocturno: "Nocturno",
};

export const TIPO_DIA_LABELS: Record<TipoDia, string> = {
  cualquiera: "Cualquiera",
  habil: "Hábil",
  no_habil: "No hábil",
  feriado: "Feriado",
};

export type TarifaJornadaKey = {
  modalidadCobro: ModalidadCobro;
  tipoJornada: TipoJornada;
  tipoDia: TipoDia;
};

function tarifaUniqueKey(t: TarifaJornadaKey): string {
  return `${t.modalidadCobro}|${t.tipoJornada}|${t.tipoDia}`;
}

/**
 * Unicidad de (modalidadCobro, tipoJornada, tipoDia).
 * Se permiten específicas + «cualquiera» como fallback (prioridad del backend).
 */
export function validateTarifasJornadaCompatibilidad(
  tarifas: TarifaJornadaKey[]
): string | null {
  const seen = new Set<string>();
  for (let i = 0; i < tarifas.length; i++) {
    const key = tarifaUniqueKey(tarifas[i]);
    if (seen.has(key)) {
      return `Tarifa ${i + 1}: ya existe otra con la misma modalidad, jornada y tipo de día.`;
    }
    seen.add(key);
  }
  return null;
}

/** Valores legacy de tipoDia que se mapean a no_habil. */
const LEGACY_TIPOS_DIA_NO_HABIL = new Set(["sabado", "domingo"]);

/** Normaliza valores legacy del backend o DB sin migrar. */
export function normalizeTipoDia(value: string | null | undefined): TipoDia {
  const raw = String(value ?? "habil").trim().toLowerCase();
  if (raw === "cualquiera") return "cualquiera";
  if (raw === "habil") return "habil";
  if (raw === "no_habil") return "no_habil";
  if (raw === "feriado") return "feriado";
  if (LEGACY_TIPOS_DIA_NO_HABIL.has(raw)) return "no_habil";
  return "habil";
}

export function labelTipoDia(tipoDia: string): string {
  if (tipoDia === "cualquiera") return "Cualquiera";
  if (tipoDia === "habil") return "Hábil";
  if (tipoDia === "no_habil") return "No hábil";
  if (tipoDia === "feriado") return "Feriado";
  if (LEGACY_TIPOS_DIA_NO_HABIL.has(tipoDia)) return "No hábil";
  return tipoDia;
}

/** Normaliza valores de jornada (tarifas o finanzas). */
export function normalizeTipoJornada(value: string | null | undefined): TipoJornada {
  const raw = String(value ?? "diurno").trim().toLowerCase();
  if (raw === "cualquiera") return "cualquiera";
  if (raw === "nocturno") return "nocturno";
  if (raw === "diurno") return "diurno";
  return "diurno";
}

export function labelTipoJornada(tipoJornada: string): string {
  if (tipoJornada === "cualquiera") return "Cualquiera";
  if (tipoJornada === "diurno") return "Diurno";
  if (tipoJornada === "nocturno") return "Nocturno";
  return tipoJornada;
}

/**
 * True si el set de tarifas cubre feriados vía tarifa feriado o día cualquiera
 * (con cualquier jornada), para la modalidad dada o en general.
 */
export function tarifasCubrenFeriado(
  tarifas: Pick<TarifaJornadaKey, "tipoDia">[]
): boolean {
  return tarifas.some((t) => t.tipoDia === "feriado" || t.tipoDia === "cualquiera");
}

/** Copy de ayuda sobre resolución de tarifa al cobrar. */
export const TARIFAS_COBRO_HELP =
  "Al liquidar: jornada según franjas configuradas (hora Argentina). Día: feriado activo → feriado; si no está en días hábiles → no hábil; si no → hábil. Prioridad de tarifa: exacta → día exacto + jornada cualquiera → jornada exacta + día cualquiera → ambos cualquiera. Si no hay cobertura, falla el cobro.";

export const TARIFAS_FERIADO_WARNING =
  "Si no hay tarifa con día «feriado» ni «cualquiera», las visitas en feriado van a fallar al liquidar.";

/**
 * Enriquece mensajes 409 del backend cuando falta cobertura de tarifa
 * (prestador o admin al registrar/cerrar visita o tramo).
 */
export function appendTarifaConflictHint(baseMessage: string): string {
  const base = baseMessage.trim();
  if (!base) {
    return "No hay tarifa compatible. Configurá jornada/día del servicio (incl. cualquiera o feriado) en el panel.";
  }
  if (/feriado/i.test(base)) {
    return `${base} Pedile al administrador que cargue una tarifa de feriado o día «cualquiera» para ese servicio.`;
  }
  if (/no_habil|no hábil|no habil/i.test(base)) {
    return `${base} Pedile al administrador que cargue la tarifa no hábil (o día «cualquiera») para ese servicio.`;
  }
  if (/\bhabil\b|hábil/i.test(base) && !/no_/i.test(base) && !/no hábil/i.test(base)) {
    return `${base} Pedile al administrador que cargue la tarifa hábil (o día «cualquiera») para ese servicio.`;
  }
  return `${base} Pedile al administrador que configure las tarifas del servicio (jornada/día, incl. cualquiera o feriado) en el panel.`;
}
