import type { FrecuenciaTipo, ModalidadCobro, PacienteServicioEstado } from "@/lib/api/types";

export const FRECUENCIA_TIPOS: FrecuenciaTipo[] = ["diaria", "semanal", "mensual", "por_horas"];

export const ASIGNACION_ESTADOS: PacienteServicioEstado[] = ["activa", "suspendida", "finalizada"];

export const FRECUENCIA_TIPO_LABELS: Record<FrecuenciaTipo, string> = {
  diaria: "Diaria",
  semanal: "Semanal",
  mensual: "Mensual",
  por_horas: "Por horas",
};

export const ASIGNACION_ESTADO_LABELS: Record<PacienteServicioEstado, string> = {
  activa: "Activa",
  suspendida: "Suspendida",
  finalizada: "Finalizada",
};

export { MODALIDADES_COBRO, MODALIDAD_COBRO_LABELS } from "@/lib/servicios-tarifas-labels";
