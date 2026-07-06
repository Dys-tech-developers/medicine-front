import type { ModalidadCobro, PacienteServicioEstado, PeriodoControl } from "@/lib/api/types";

export const PERIODOS_CONTROL: PeriodoControl[] = ["diario", "semanal", "mensual"];

export const ASIGNACION_ESTADOS: PacienteServicioEstado[] = ["activa", "suspendida", "finalizada"];

export const PERIODO_CONTROL_LABELS: Record<PeriodoControl, string> = {
  diario: "Diario",
  semanal: "Semanal",
  mensual: "Mensual",
};

export const ASIGNACION_ESTADO_LABELS: Record<PacienteServicioEstado, string> = {
  activa: "Activa",
  suspendida: "Suspendida",
  finalizada: "Finalizada",
};

export { MODALIDADES_COBRO, MODALIDAD_COBRO_LABELS } from "@/lib/servicios-tarifas-labels";
