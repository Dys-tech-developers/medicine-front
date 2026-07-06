/**
 * Clases Tailwind alineadas a la paleta `medical.*` (docs/paleta-colores.md, globals.css).
 * Usar en lugar de `emerald-*`, `amber-*`, `slate-*` y `red-*` genéricos para estados UI.
 */

import { visitaEstadoBadgeClass as visitaEstadoBadgeClassFromLabels } from "@/lib/visita-estado-labels";

export const MEDICAL_UI = {
  overlay: "bg-medical-text/60 backdrop-blur-[2px]",
  overlaySm: "bg-medical-text/55 backdrop-blur-sm",
  overlayLight: "bg-medical-text/50 backdrop-blur-sm",
  dialogFooter: "border-t border-medical-border bg-medical-surface/80",
  formCard: "overflow-hidden rounded-3xl border border-medical-border/80 bg-medical-card",
  formHeader:
    "border-b border-medical-border/60 bg-linear-to-r from-medical-secondary/40 via-white to-white",
  formInput:
    "h-11 w-full rounded-xl border border-medical-border bg-medical-surface/80 px-3.5 text-sm text-medical-text outline-none transition placeholder:text-medical-mutedText/60 focus:border-medical-primary focus:bg-medical-card focus:ring-4 focus:ring-medical-primary/12 disabled:cursor-not-allowed disabled:opacity-60",
  formInputSm:
    "h-10 w-full rounded-xl border border-medical-border bg-medical-surface/80 px-3 text-sm text-medical-text outline-none focus:border-medical-primary focus:bg-medical-card focus:ring-4 focus:ring-medical-primary/12 disabled:opacity-60",
  formTextarea:
    "w-full rounded-xl border border-medical-border bg-medical-surface/80 px-3.5 py-2.5 text-sm text-medical-text outline-none transition placeholder:text-medical-mutedText/60 focus:border-medical-primary focus:bg-medical-card focus:ring-4 focus:ring-medical-primary/12 disabled:cursor-not-allowed disabled:opacity-60",
  formTextareaLg:
    "min-h-[88px] w-full resize-y rounded-xl border border-medical-border bg-medical-surface/80 px-3.5 py-3 text-sm text-medical-text outline-none transition placeholder:text-medical-mutedText/60 focus:border-medical-primary focus:bg-medical-card focus:ring-4 focus:ring-medical-primary/12 disabled:opacity-60",
  formFooter: "border-t border-medical-border/60 bg-medical-surface/50",
  formDivider: "divide-medical-border/60",
  formGridDivider: "lg:divide-medical-border/60",
  cancelButton:
    "inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-medical-mutedText transition hover:bg-medical-secondary hover:text-medical-text disabled:opacity-60",
  checkboxRow: "flex cursor-pointer items-center gap-3 rounded-2xl border border-medical-border bg-medical-surface/60 px-4 py-3",
} as const;

/** Badge / chip: éxito, activo, pagado, facturado sí */
export const medicalSuccessBadge =
  "border-medical-success/30 bg-medical-success/10 text-medical-success";

/** Badge / chip: advertencia, pendiente, suspendido */
export const medicalWarningBadge =
  "border-medical-warning/35 bg-medical-warning/10 text-medical-warning";

/** Badge / chip: inactivo, finalizado, neutro */
export const medicalNeutralBadge =
  "border-medical-border bg-medical-secondary text-medical-mutedText";

/** Badge / chip: error, crítico */
export const medicalDangerBadge =
  "border-medical-danger/30 bg-medical-danger/10 text-medical-danger";

export const medicalDangerBox = "border-medical-danger/30 bg-medical-danger/10";

export const medicalDangerAlert =
  "rounded-lg border border-medical-danger/30 bg-medical-danger/10 text-sm text-medical-danger";

export const medicalDangerBanner =
  "border border-medical-danger/30 bg-medical-danger/10 text-medical-text";

export const medicalSuccessBox = "border-medical-success/30 bg-medical-success/10";

export const medicalWarningBox = "border-medical-warning/35 bg-medical-warning/10";

/** Banner informativo (disclaimer, avisos suaves) */
export const medicalWarningBanner =
  "border-medical-warning/35 bg-medical-warning/10 text-medical-text";

export const medicalSuccessButtonOutline =
  "border-medical-success/40 text-medical-success hover:bg-medical-success/10";

export const medicalSuccessIconButton =
  "inline-flex shrink-0 items-center justify-center rounded-md border border-medical-success/30 bg-medical-success/10 text-medical-success";

export const medicalWarningButtonSolid =
  "bg-medical-warning cursor-pointer text-white hover:bg-medical-warning/90";

export const medicalDangerButtonSolid =
  "bg-medical-danger cursor-pointer text-white hover:bg-medical-danger/90";

/** Modo relevo / cobertura continua — badge y bloques informativos */
export const medicalRelevoBadge =
  "border-medical-primary/30 bg-medical-secondary text-medical-primary";

/** Panel admin de tramos relevo (ficha paciente) */
export const medicalRelevoPanel =
  "border-t border-medical-border/50 bg-medical-secondary/70";

export const medicalRelevoPanelTitle = "text-medical-primaryDark";

/** Banner de cuidadora activa en cobertura */
export const medicalRelevoCoberturaBanner =
  "rounded-lg border border-medical-border bg-medical-card px-3 py-2.5";

export const medicalRelevoCoberturaIcon = "text-medical-primary";

/** Header de modal relevo (misma marca que CTAs principales) */
export const medicalRelevoModalHeader =
  "border-medical-primary/30 bg-medical-primary text-white";

/** Asterisco o etiqueta de campo obligatorio */
export const medicalRequiredMark = "text-medical-danger";

export function finanzasSiNoBadgeClass(ok: boolean): string {
  return ok ? medicalSuccessBadge : medicalWarningBadge;
}

export function estadoActivoBadgeClass(active: boolean): string {
  return active ? medicalSuccessBadge : medicalNeutralBadge;
}

export function asignacionEstadoBadgeClass(estado: string): string {
  switch (estado) {
    case "activa":
      return medicalSuccessBadge;
    case "suspendida":
      return medicalWarningBadge;
    case "finalizada":
      return medicalNeutralBadge;
    default:
      return "border-medical-border bg-medical-surface text-medical-text";
  }
}

export function visitaEstadoBadgeClass(estado: string): string {
  return visitaEstadoBadgeClassFromLabels(estado);
}
