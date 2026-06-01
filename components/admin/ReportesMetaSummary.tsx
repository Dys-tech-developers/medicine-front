"use client";

import type { ReportesMetaDto } from "@/lib/api/types";
import { formatMetaRango, formatReporteHoras, formatReporteMonto } from "@/lib/reportes-display";

type Props = {
  meta: ReportesMetaDto | null;
  totalVisitasItems: number;
  totalHoras: number;
  totalGenerado: number;
};

export function ReportesMetaSummary({
  meta,
  totalVisitasItems,
  totalHoras,
  totalGenerado,
}: Props) {
  const visitasMeta =
    meta?.totalVisitas != null && !Number.isNaN(meta.totalVisitas)
      ? meta.totalVisitas
      : totalVisitasItems;

  const stats = [
    { label: "Período", value: formatMetaRango(meta), wide: true },
    { label: "Visitas", value: String(visitasMeta) },
    { label: "Horas", value: formatReporteHoras(totalHoras) },
    { label: "Generado", value: formatReporteMonto(totalGenerado), emphasize: true },
  ];

  return (
    <div
      className="flex flex-wrap items-baseline gap-x-4 gap-y-2 border-b border-medical-border/50 bg-medical-secondary/25 px-4 py-2.5 text-sm sm:px-5"
      role="region"
      aria-label="Resumen del período"
    >
      {stats.map((stat, index) => (
        <span
          key={stat.label}
          className={stat.wide ? "inline-flex min-w-0 max-w-full basis-full items-baseline gap-1 sm:basis-auto" : "inline-flex items-baseline gap-1 whitespace-nowrap"}
        >
          {index > 0 && !stat.wide ? (
            <span className="mr-1 hidden text-medical-border sm:inline" aria-hidden>
              ·
            </span>
          ) : null}
          <span className="shrink-0 text-medical-mutedText">{stat.label}</span>
          <span
            className={
              stat.emphasize
                ? "truncate font-bold tabular-nums text-medical-text"
                : "truncate font-semibold tabular-nums text-medical-text/90"
            }
          >
            {stat.value}
          </span>
        </span>
      ))}
    </div>
  );
}
