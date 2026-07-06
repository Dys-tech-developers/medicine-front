import type { VisitaEstado, VisitaListItemDto } from "@/lib/api/types";

export const VISITA_ESTADOS: VisitaEstado[] = ["iniciada", "finalizada", "cancelada"];

export const VISITA_ESTADO_LABELS: Record<VisitaEstado, string> = {
  iniciada: "Iniciada",
  finalizada: "Finalizada",
  cancelada: "Cancelada",
};

/** Badges pastel por estado de la visita (no confundir con estado de la asignación). */
export const VISITA_ESTADO_BADGE_CLASS: Record<VisitaEstado, string> = {
  iniciada: "border-sky-200/90 bg-sky-50 text-sky-700",
  finalizada: "border-emerald-200/90 bg-emerald-50 text-emerald-700",
  cancelada: "border-rose-200/90 bg-rose-50 text-rose-700",
};

export function formatVisitaEstadoContextual(
  visita: Pick<
    VisitaListItemDto,
    "estado" | "cierreAutomatico" | "cierrePorRelevo"
  > & {
    servicioModoRelevo?: boolean;
  }
): string {
  if (visita.estado === "iniciada" && visita.servicioModoRelevo) {
    return "En cobertura";
  }
  if (visita.cierreAutomatico) return "Cierre automático";
  if (visita.cierrePorRelevo) return "Cierre por relevo";
  return formatVisitaEstado(visita.estado);
}

export function visitaEstadoBadgeClassContextual(
  visita: Pick<
    VisitaListItemDto,
    "estado" | "cierreAutomatico" | "cierrePorRelevo"
  > & {
    servicioModoRelevo?: boolean;
  }
): string {
  if (visita.estado === "iniciada" && visita.servicioModoRelevo) {
    return "border-medical-primary/30 bg-medical-secondary text-medical-primary";
  }
  if (visita.cierreAutomatico) {
    return "border-medical-warning/35 bg-medical-warning/10 text-[#B45309]";
  }
  if (visita.cierrePorRelevo) {
    return "border-medical-primary/25 bg-medical-secondary/80 text-medical-primaryDark";
  }
  return visitaEstadoBadgeClass(visita.estado);
}

export function parseVisitaEstado(value: unknown): VisitaEstado {
  const raw = String(value ?? "").toLowerCase();
  if (raw === "iniciada" || raw === "cancelada" || raw === "finalizada") {
    return raw;
  }
  return "finalizada";
}

export function formatVisitaEstado(estado: VisitaEstado | string | null | undefined): string {
  if (!estado) return "—";
  const key = estado as VisitaEstado;
  if (key in VISITA_ESTADO_LABELS) return VISITA_ESTADO_LABELS[key];
  return estado
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function visitaEstadoBadgeClass(estado: VisitaEstado | string | null | undefined): string {
  const key = parseVisitaEstado(estado);
  return VISITA_ESTADO_BADGE_CLASS[key];
}
