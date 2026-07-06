import type { ModalidadCobro, TipoDia, TipoJornada } from "@/lib/api/types";

export const MODALIDADES_COBRO: ModalidadCobro[] = ["por_servicio", "por_hora", "por_dia"];

export const TIPOS_JORNADA: TipoJornada[] = ["diurno", "nocturno"];

export const TIPOS_DIA = ["habil", "no_habil"] as const;

export const MODALIDAD_COBRO_LABELS: Record<ModalidadCobro, string> = {
  por_servicio: "Por servicio",
  por_hora: "Por hora",
  por_dia: "Por día",
};

export const TIPO_JORNADA_LABELS: Record<TipoJornada, string> = {
  diurno: "Diurno",
  nocturno: "Nocturno",
};

export const TIPO_DIA_LABELS: Record<TipoDia, string> = {
  habil: "Hábil",
  no_habil: "No hábil",
};

const LEGACY_TIPOS_DIA_NO_HABIL = new Set(["sabado", "domingo", "feriado"]);

/** Normaliza valores legacy del backend o DB sin migrar. */
export function normalizeTipoDia(value: string | null | undefined): TipoDia {
  const raw = String(value ?? "habil").trim().toLowerCase();
  if (raw === "habil") return "habil";
  if (raw === "no_habil") return "no_habil";
  if (LEGACY_TIPOS_DIA_NO_HABIL.has(raw)) return "no_habil";
  return "habil";
}

export function labelTipoDia(tipoDia: string): string {
  if (tipoDia === "habil") return "Hábil";
  if (tipoDia === "no_habil") return "No hábil";
  if (LEGACY_TIPOS_DIA_NO_HABIL.has(tipoDia)) return "No hábil";
  return tipoDia;
}
