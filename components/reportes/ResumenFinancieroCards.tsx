"use client";

import type { ResumenFinancieroDto } from "@/lib/api/types";
import { formatReporteMonto } from "@/lib/reportes-display";
import { VISITA_FINANZAS_UI } from "@/lib/visita-finanzas-labels";

type Props = {
  resumen: ResumenFinancieroDto;
};

const STATS = (resumen: ResumenFinancieroDto) =>
  [
    { label: "Visitas", value: String(resumen.cantidadVisitas), emphasize: false },
    { label: "Generado", value: formatReporteMonto(resumen.totalGenerado), emphasize: true },
    {
      label: VISITA_FINANZAS_UI.facturado.resumenMonto,
      value: formatReporteMonto(resumen.totalFacturado),
      emphasize: false,
    },
    {
      label: VISITA_FINANZAS_UI.pagado.resumenMonto,
      value: formatReporteMonto(resumen.totalPagado),
      emphasize: false,
    },
    {
      label: VISITA_FINANZAS_UI.facturado.resumenPendiente,
      value: formatReporteMonto(resumen.pendienteFacturar),
      emphasize: false,
    },
    {
      label: VISITA_FINANZAS_UI.pagado.resumenPendiente,
      value: formatReporteMonto(resumen.pendientePago),
      emphasize: false,
    },
  ] as const;

export function ResumenFinancieroCards({ resumen }: Props) {
  const stats = STATS(resumen);

  return (
    <div
      className="flex flex-wrap items-baseline gap-x-4 gap-y-2 border-b border-medical-border/50 bg-medical-secondary/25 px-4 py-2.5 text-sm sm:px-5"
      role="region"
      aria-label="Resumen financiero del período"
    >
      {stats.map((stat, index) => (
        <span key={stat.label} className="inline-flex items-baseline gap-1 whitespace-nowrap">
          {index > 0 ? (
            <span className="mr-1 hidden text-medical-border sm:inline" aria-hidden>
              ·
            </span>
          ) : null}
          <span className="text-medical-mutedText">{stat.label}</span>
          <span
            className={
              stat.emphasize
                ? "font-bold tabular-nums text-medical-text"
                : "font-semibold tabular-nums text-medical-text/90"
            }
          >
            {stat.value}
          </span>
        </span>
      ))}
    </div>
  );
}
