"use client";

import { BarChart3, Layers, RefreshCw } from "lucide-react";
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
import type { ReporteServicioItemDto } from "@/lib/api/types";
import { formatReporteHoras, formatReporteMonto } from "@/lib/reportes-display";

const thClass =
  "px-4 py-3 text-xs font-bold uppercase tracking-wide text-medical-primaryDark first:pl-6 last:pr-5";
const tdClass = "px-4 py-3 align-middle first:pl-6 last:pr-5 text-sm";

type Props = {
  items: ReporteServicioItemDto[];
  loading: boolean;
  error: string;
  onRetry: () => void;
};

export function ReportesServiciosTable({ items, loading, error, onRetry }: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 px-6 py-16 text-sm text-medical-mutedText">
        <RefreshCw className="h-5 w-5 animate-spin text-medical-primary" />
        Generando reporte por servicio…
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
          icon={Layers}
          title="Sin datos en este período"
          description="No hay visitas que coincidan con los filtros seleccionados."
        />
      </div>
    );
  }

  const totals = items.reduce(
    (acc, row) => ({
      visitas: acc.visitas + row.cantidadVisitas,
      horas: acc.horas + row.horasTotales,
      generado: acc.generado + Number.parseFloat(row.totalGenerado || "0"),
    }),
    { visitas: 0, horas: 0, generado: 0 }
  );

  return (
    <div className="overflow-x-auto">
      <Table className="min-w-[640px]">
        <TableHeader>
          <TableRow className="bg-medical-secondary/90 hover:bg-medical-secondary/90">
            <TableHead className={thClass}>Servicio</TableHead>
            <TableHead className={`${thClass} text-right`}>Visitas</TableHead>
            <TableHead className={`${thClass} text-right`}>Horas</TableHead>
            <TableHead className={`${thClass} text-right`}>Total generado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((row) => (
            <TableRow key={row.servicioId} className="hover:bg-medical-surface/60">
              <TableCell className={`${tdClass} font-medium text-medical-text`}>
                {row.nombreServicio}
              </TableCell>
              <TableCell className={`${tdClass} text-right tabular-nums`}>
                {row.cantidadVisitas}
              </TableCell>
              <TableCell className={`${tdClass} text-right tabular-nums`}>
                {formatReporteHoras(row.horasTotales)}
              </TableCell>
              <TableCell className={`${tdClass} text-right tabular-nums font-medium`}>
                {formatReporteMonto(row.totalGenerado)}
              </TableCell>
            </TableRow>
          ))}
          <TableRow className="bg-medical-secondary/40 font-semibold hover:bg-medical-secondary/40">
            <TableCell className={tdClass}>Total</TableCell>
            <TableCell className={`${tdClass} text-right tabular-nums`}>{totals.visitas}</TableCell>
            <TableCell className={`${tdClass} text-right tabular-nums`}>
              {formatReporteHoras(totals.horas)}
            </TableCell>
            <TableCell className={`${tdClass} text-right tabular-nums`}>
              {formatReporteMonto(totals.generado)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
