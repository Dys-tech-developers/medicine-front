import type { ReportePeriodo, ReportesMetaDto } from "@/lib/api/types";

export const REPORTE_PERIODO_LABELS: Record<ReportePeriodo, string> = {
  diario: "Hoy",
  semanal: "Esta semana",
  mensual: "Este mes",
};

export function formatReporteMonto(value: string | number | null | undefined): string {
  if (value == null || value === "") return "—";
  const n = typeof value === "string" ? Number.parseFloat(value) : value;
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

/** Monto más corto para cards y celdas angostas (sin decimales si es entero). */
export function formatReporteMontoCompact(value: string | number | null | undefined): string {
  if (value == null || value === "") return "—";
  const n = typeof value === "string" ? Number.parseFloat(value) : value;
  if (Number.isNaN(n)) return "—";
  const entero = Math.abs(n - Math.round(n)) < 0.005;
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: entero ? 0 : 2,
    maximumFractionDigits: entero ? 0 : 2,
  }).format(n);
}

export function formatReporteHoras(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return "0 h";
  if (hours < 1) {
    const min = Math.round(hours * 60);
    return `${min} min`;
  }
  const rounded = Math.round(hours * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded} h` : `${rounded.toFixed(1)} h`;
}

export function sumReporteMontos(values: (string | number)[]): number {
  return values.reduce<number>((acc, v) => {
    const n = typeof v === "string" ? Number.parseFloat(v) : v;
    return acc + (Number.isNaN(n) ? 0 : n);
  }, 0);
}

export function formatMetaRango(meta: ReportesMetaDto | null | undefined): string {
  if (!meta) return "Todas las visitas";

  if (meta.fechaDesde && meta.fechaHasta) {
    try {
      const desde = new Date(meta.fechaDesde).toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      const hasta = new Date(meta.fechaHasta).toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      return `${desde} — ${hasta}`;
    } catch {
      return `${meta.fechaDesde} — ${meta.fechaHasta}`;
    }
  }

  const periodo = meta.periodo as ReportePeriodo | undefined;
  if (periodo && periodo in REPORTE_PERIODO_LABELS) {
    return REPORTE_PERIODO_LABELS[periodo];
  }

  return "Todas las visitas";
}

/** Convierte `YYYY-MM-DD` del input date a Date inicio/fin de día local. */
export function dateInputToRange(desde: string, hasta: string): { fechaDesde?: Date; fechaHasta?: Date } {
  if (!desde.trim() || !hasta.trim()) return {};
  const [y1, m1, d1] = desde.split("-").map(Number);
  const [y2, m2, d2] = hasta.split("-").map(Number);
  if (!y1 || !m1 || !d1 || !y2 || !m2 || !d2) return {};
  return {
    fechaDesde: new Date(y1, m1 - 1, d1, 0, 0, 0, 0),
    fechaHasta: new Date(y2, m2 - 1, d2, 23, 59, 59, 999),
  };
}
