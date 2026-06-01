/**
 * Textos de UI para `facturado` / `pagado` en visitas.
 * Marcadores internos de seguimiento (no facturación electrónica AFIP).
 */

export const VISITA_FINANZAS_UI = {
  disclaimer:
    "Marcadores internos de seguimiento. No generan comprobantes ni se conectan con AFIP.",

  /** Campo API `facturado` */
  facturado: {
    nombre: "Facturado",
    columna: "Facturado",
    estadoSi: "Facturado",
    estadoNo: "Pendiente",
    filtroTodos: "Facturado: todos",
    filtroSi: "Facturado: sí",
    filtroNo: "Facturado: no",
    resumenMonto: "Monto facturado",
    resumenPendiente: "Pte. facturar",
    reporteColumna: "Facturado",
    shortSi: "Fact.",
    shortNo: "Pend.",
  },

  /** Campo API `pagado` */
  pagado: {
    nombre: "Pagado",
    columna: "Pagado",
    estadoSi: "Pagado",
    estadoNo: "Pendiente",
    filtroTodos: "Pagado: todos",
    filtroSi: "Pagado: sí",
    filtroNo: "Pagado: no",
    resumenMonto: "Monto pagado",
    resumenPendiente: "Pte. pago",
    reporteColumna: "Pagado",
    shortSi: "Pag.",
    shortNo: "Pend.",
  },

  ambosCompletos: "Facturado y pagado",
  accionAmbos: "Cambiar a facturado y pagado",
  cobroCompletado: "Seguimiento completo (facturado y pagado).",
} as const;

export type VisitaFinanzasFlag = "facturado" | "pagado";

function blockFor(flag: VisitaFinanzasFlag) {
  return flag === "facturado" ? VISITA_FINANZAS_UI.facturado : VISITA_FINANZAS_UI.pagado;
}

export function getVisitaFinanzasEstadoLabel(flag: VisitaFinanzasFlag, value: boolean): string {
  const block = blockFor(flag);
  return value ? block.estadoSi : block.estadoNo;
}

export function getVisitaFinanzasActionLabel(flag: VisitaFinanzasFlag, targetValue: boolean): string {
  const block = blockFor(flag);
  return targetValue ? `Cambiar a ${block.estadoSi.toLowerCase()}` : `Cambiar a ${block.estadoNo.toLowerCase()}`;
}

export function getVisitaFinanzasShortLabel(flag: VisitaFinanzasFlag, value: boolean): string {
  const block = blockFor(flag);
  return value ? block.shortSi : block.shortNo;
}
