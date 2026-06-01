import type { ModalidadCobro, TipoDia, TipoJornada } from "@/lib/api/types";

export const MODALIDADES_COBRO: ModalidadCobro[] = ["por_servicio", "por_hora", "por_dia"];

export const TIPOS_JORNADA: TipoJornada[] = ["diurno", "nocturno"];

export const TIPOS_DIA: TipoDia[] = ["habil", "sabado", "domingo", "feriado"];

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
  sabado: "Sábado",
  domingo: "Domingo",
  feriado: "Feriado",
};
