import type {
  PacienteServicioEstado,
  VisitaListItemDto,
  VisitaPacienteResumenDto,
} from "@/lib/api/types";
import { ASIGNACION_ESTADO_LABELS } from "@/lib/paciente-servicios-labels";

export function getVisitaPaciente(visita: VisitaListItemDto): VisitaPacienteResumenDto | null {
  return visita.pacienteServicio?.paciente ?? null;
}

export function getPacienteNombre(visita: VisitaListItemDto): string {
  const paciente = getVisitaPaciente(visita);
  if (!paciente) return "Paciente no disponible";
  return `${paciente.nombre} ${paciente.apellido}`.trim();
}

export function getPacienteInitials(visita: VisitaListItemDto): string {
  const paciente = getVisitaPaciente(visita);
  if (!paciente) return "—";
  const parts = [paciente.nombre, paciente.apellido].filter(Boolean);
  return parts
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function formatVisitaFecha(iso: string): string {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatVisitaDateOnly(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export function formatVisitaTimeOnly(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export function formatVisitaDuracion(minutos: number): string {
  if (minutos < 60) return `${minutos} min`;
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

export function formatPacienteServicioEstado(estado: string): string {
  const key = estado as PacienteServicioEstado;
  if (key in ASIGNACION_ESTADO_LABELS) {
    return ASIGNACION_ESTADO_LABELS[key];
  }
  return estado
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatVisitaDateTime(iso: string): string {
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

export function getVisitaInsumosCount(visita: VisitaListItemDto): number {
  return visita.insumos?.length ?? 0;
}

export function matchesVisitaSearch(visita: VisitaListItemDto, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const p = getVisitaPaciente(visita);
  const ps = visita.pacienteServicio;
  const haystack = [
    p?.nombre,
    p?.apellido,
    p?.numeroDocumento,
    ps?.servicio?.nombre,
    ps?.estado,
    visita.prestador?.nombre,
    visita.prestador?.email,
    visita.observaciones,
    ...visita.insumos.map((i) => i.insumoNombre),
    ...visita.insumos.map((i) => i.insumoCodigo),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

/** Fecha calendario local `YYYY-MM-DD` a partir de un `Date`. */
export function toLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parte calendario de la visita (`fecha` / `fechaInicio`, o `createdAt` como respaldo). */
export function visitaFechaKey(visita: { fecha?: string; createdAt?: string }): string {
  const raw = visita.fecha?.trim() || visita.createdAt?.trim();
  if (!raw) return "";
  return raw.slice(0, 10);
}

export function isVisitaInDateRange(
  visita: { fecha?: string },
  desde: Date,
  hasta: Date
): boolean {
  const key = visitaFechaKey(visita);
  if (!key) return false;
  return key >= toLocalDateKey(desde) && key <= toLocalDateKey(hasta);
}

export type VisitaPeriodFilter = "all" | "today" | "7d" | "30d";

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function endOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

/** Rango de fechas para filtros del listado de visitas (calendario local). */
export function getVisitaPeriodRange(
  period: VisitaPeriodFilter
): { fechaDesde?: Date; fechaHasta?: Date } {
  if (period === "all") return {};

  const now = new Date();
  const hasta = endOfLocalDay(now);

  if (period === "today") {
    return { fechaDesde: startOfLocalDay(now), fechaHasta: hasta };
  }

  const desde = new Date(now);
  if (period === "7d") {
    desde.setDate(desde.getDate() - 6);
  } else {
    desde.setDate(desde.getDate() - 29);
  }
  return { fechaDesde: startOfLocalDay(desde), fechaHasta: hasta };
}

export type VisitaDateGroup = "today" | "yesterday" | "this_week" | "earlier";

export const VISITA_DATE_GROUP_LABELS: Record<VisitaDateGroup, string> = {
  today: "Hoy",
  yesterday: "Ayer",
  this_week: "Esta semana",
  earlier: "Anteriores",
};

const VISITA_DATE_GROUP_ORDER: VisitaDateGroup[] = [
  "today",
  "yesterday",
  "this_week",
  "earlier",
];

function startOfWeekLocalKey(reference: Date): string {
  const d = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate());
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return toLocalDateKey(d);
}

export function getVisitaDateGroupKey(visita: { fecha?: string; createdAt?: string }): VisitaDateGroup {
  const key = visitaFechaKey(visita);
  if (!key) return "earlier";

  const today = toLocalDateKey(new Date());
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = toLocalDateKey(yesterdayDate);
  const weekStart = startOfWeekLocalKey(new Date());

  if (key === today) return "today";
  if (key === yesterday) return "yesterday";
  if (key >= weekStart && key < today) return "this_week";
  return "earlier";
}

export function groupVisitasByDate<T extends { fecha?: string; createdAt?: string }>(
  items: T[]
): { group: VisitaDateGroup; label: string; items: T[] }[] {
  const buckets = new Map<VisitaDateGroup, T[]>();
  for (const item of items) {
    const g = getVisitaDateGroupKey(item);
    const list = buckets.get(g) ?? [];
    list.push(item);
    buckets.set(g, list);
  }
  return VISITA_DATE_GROUP_ORDER.filter((g) => (buckets.get(g)?.length ?? 0) > 0).map((g) => ({
    group: g,
    label: VISITA_DATE_GROUP_LABELS[g],
    items: buckets.get(g)!,
  }));
}

export function getVisitaPacienteDocumento(visita: VisitaListItemDto): string {
  return visita.pacienteServicio?.paciente?.numeroDocumento?.trim() ?? "";
}

export function truncateVisitaObservaciones(text: string | null | undefined, max = 72): string {
  const t = text?.trim();
  if (!t) return "";
  if (t.length <= max) return t;
  return `${t.slice(0, max).trimEnd()}…`;
}
