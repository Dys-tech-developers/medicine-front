"use client";

import { BarChart3, RefreshCw, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PrestadorListItemDto, ReportePrestadorItemDto } from "@/lib/api/types";
import { formatReporteHoras, formatReporteMonto } from "@/lib/reportes-display";
import { VISITA_FINANZAS_UI } from "@/lib/visita-finanzas-labels";

const thClass =
  "px-4 py-3 text-xs font-bold uppercase tracking-wide text-medical-primaryDark first:pl-6 last:pr-5";
const tdClass = "px-4 py-3 align-middle first:pl-6 last:pr-5 text-sm";

type Props = {
  items: ReportePrestadorItemDto[];
  prestadoresById: Map<number, PrestadorListItemDto>;
  loading: boolean;
  error: string;
  onRetry: () => void;
};

export function ReportesPrestadoresTable({
  items,
  prestadoresById,
  loading,
  error,
  onRetry,
}: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 px-6 py-16 text-sm text-medical-mutedText">
        <RefreshCw className="h-5 w-5 animate-spin text-medical-primary" />
        Generando reporte por prestador…
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-5 py-8 sm:px-7">
        <EmptyState
          variant="error"
          icon={BarChart3}
          title="No se pudo generar el reporte"
          description={error}
          action={
            <Button
              type="button"
              onClick={onRetry}
              className="cursor-pointer bg-medical-primary hover:bg-medical-primaryDark"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Reintentar
            </Button>
          }
        />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="px-5 py-8 sm:px-7">
        <EmptyState
          icon={Stethoscope}
          title="Sin datos en este período"
          description="No hay visitas que coincidan con los filtros seleccionados."
        />
      </div>
    );
  }

  const totals = items.reduce(
    (acc, row) => ({
      visitas: acc.visitas + row.cantidadVisitas,
      horas: acc.horas + row.horasTrabajadas,
      generado: acc.generado + Number.parseFloat(row.totalGenerado || "0"),
      facturado: acc.facturado + Number.parseFloat(row.totalFacturado || "0"),
      pagado: acc.pagado + Number.parseFloat(row.totalPagado || "0"),
    }),
    { visitas: 0, horas: 0, generado: 0, facturado: 0, pagado: 0 }
  );

  return (
    <div className="overflow-x-auto">
      <Table className="min-w-[720px]">
        <TableHeader>
          <TableRow className="bg-medical-secondary/90 hover:bg-medical-secondary/90">
            <TableHead className={thClass}>Prestador</TableHead>
            <TableHead className={`${thClass} text-right`}>Visitas</TableHead>
            <TableHead className={`${thClass} text-right`}>Horas</TableHead>
            <TableHead className={`${thClass} text-right`}>Generado</TableHead>
            <TableHead className={`${thClass} text-right`}>
              {VISITA_FINANZAS_UI.facturado.reporteColumna}
            </TableHead>
            <TableHead className={`${thClass} text-right`}>
              {VISITA_FINANZAS_UI.pagado.reporteColumna}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((row) => {
            const prestador = prestadoresById.get(row.prestadorId);
            const label = row.nombre ?? prestador?.nombre ?? `Prestador #${row.prestadorId}`;
            return (
              <TableRow key={row.prestadorId} className="hover:bg-medical-surface/60">
                <TableCell className={`${tdClass} font-medium text-medical-text`}>
                  {label}
                </TableCell>
                <TableCell className={`${tdClass} text-right tabular-nums`}>
                  {row.cantidadVisitas}
                </TableCell>
                <TableCell className={`${tdClass} text-right tabular-nums`}>
                  {formatReporteHoras(row.horasTrabajadas)}
                </TableCell>
                <TableCell className={`${tdClass} text-right tabular-nums font-medium`}>
                  {formatReporteMonto(row.totalGenerado)}
                </TableCell>
                <TableCell className={`${tdClass} text-right tabular-nums`}>
                  {formatReporteMonto(row.totalFacturado)}
                </TableCell>
                <TableCell className={`${tdClass} text-right tabular-nums`}>
                  {formatReporteMonto(row.totalPagado)}
                </TableCell>
              </TableRow>
            );
          })}
          <TableRow className="bg-medical-secondary/40 font-semibold hover:bg-medical-secondary/40">
            <TableCell className={tdClass}>Total</TableCell>
            <TableCell className={`${tdClass} text-right tabular-nums`}>{totals.visitas}</TableCell>
            <TableCell className={`${tdClass} text-right tabular-nums`}>
              {formatReporteHoras(totals.horas)}
            </TableCell>
            <TableCell className={`${tdClass} text-right tabular-nums`}>
              {formatReporteMonto(totals.generado)}
            </TableCell>
            <TableCell className={`${tdClass} text-right tabular-nums`}>
              {formatReporteMonto(totals.facturado)}
            </TableCell>
            <TableCell className={`${tdClass} text-right tabular-nums`}>
              {formatReporteMonto(totals.pagado)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
