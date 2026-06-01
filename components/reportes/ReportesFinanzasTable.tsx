"use client";

import { useMemo } from "react";
import { CalendarOff, ChevronLeft, ChevronRight, ClipboardList, Loader2, RefreshCw } from "lucide-react";
import { VisitaFinanzasTableActions } from "@/components/admin/VisitaFinanzasTableActions";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ReporteVisitaItemDto, VisitaDetailDto } from "@/lib/api/types";
import { formatReporteMonto } from "@/lib/reportes-display";
import {
  getVisitaFinanzasEstadoLabel,
  VISITA_FINANZAS_UI,
} from "@/lib/visita-finanzas-labels";
import { MODALIDAD_COBRO_LABELS } from "@/lib/servicios-tarifas-labels";
import { finanzasSiNoBadgeClass } from "@/lib/medical-ui-classes";
import { cn } from "@/lib/utils";

const thClass =
  "px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-medical-primaryDark first:pl-4 last:pr-4 sm:px-4";
const tdClass = "px-3 py-3 align-middle text-sm first:pl-4 last:pr-4 sm:px-4";

function formatFecha(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-AR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

type Props = {
  items: ReporteVisitaItemDto[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  error: string;
  accessToken: string | null;
  canEdit: boolean;
  selectedIds: Set<number>;
  onToggleSelect: (visitaId: number) => void;
  onToggleSelectAllPage: () => void;
  onPageChange: (page: number) => void;
  onItemsChange: (items: ReporteVisitaItemDto[]) => void;
  onRetry: () => void;
};

export function ReportesFinanzasTable({
  items,
  total,
  page,
  pageSize,
  loading,
  error,
  accessToken,
  canEdit,
  selectedIds,
  onToggleSelect,
  onToggleSelectAllPage,
  onPageChange,
  onItemsChange,
  onRetry,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const allPageSelected = useMemo(
    () => items.length > 0 && items.every((v) => selectedIds.has(v.visitaId)),
    [items, selectedIds]
  );

  const handleRowUpdated = (visitaId: number, updated: VisitaDetailDto) => {
    const fin = updated.finanzas;
    if (!fin) return;
    onItemsChange(
      items.map((row) =>
        row.visitaId === visitaId
          ? { ...row, facturado: fin.facturado, pagado: fin.pagado }
          : row
      )
    );
  };

  if (loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-medical-mutedText">
        <Loader2 className="h-5 w-5 animate-spin text-medical-primary" />
        Cargando visitas…
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-5 py-8">
        <EmptyState
          variant="error"
          icon={ClipboardList}
          title="No se pudo cargar el reporte"
          description={error}
          action={
            <Button type="button" onClick={onRetry} className="cursor-pointer bg-medical-primary">
              <RefreshCw className="mr-2 h-4 w-4" />
              Reintentar
            </Button>
          }
        />
      </div>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <div className="px-5 py-8">
        <EmptyState
          icon={CalendarOff}
          title="Sin visitas en este período"
          description="Probá ampliar el rango de fechas o quitar filtros de facturado y pagado."
        />
      </div>
    );
  }

  return (
    <div className="space-y-0">
      <div className="overflow-x-auto">
        <Table className="min-w-[1020px]">
          <TableHeader>
            <TableRow className="bg-medical-secondary/90 hover:bg-medical-secondary/90">
              {canEdit ? (
                <TableHead className={cn(thClass, "w-11")}>
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={onToggleSelectAllPage}
                    aria-label="Seleccionar todas en esta página"
                    className="size-[1.125rem] rounded border-medical-border text-medical-primary"
                  />
                </TableHead>
              ) : null}
              <TableHead className={thClass}>Fecha</TableHead>
              <TableHead className={thClass}>Paciente</TableHead>
              <TableHead className={cn(thClass, "hidden md:table-cell")}>Prestador</TableHead>
              <TableHead className={cn(thClass, "hidden lg:table-cell")}>Servicio</TableHead>
              <TableHead className={cn(thClass, "text-right")}>Monto</TableHead>
              <TableHead className={cn(thClass, "text-center")}>
                {VISITA_FINANZAS_UI.facturado.columna}
              </TableHead>
              <TableHead className={cn(thClass, "text-center")}>
                {VISITA_FINANZAS_UI.pagado.columna}
              </TableHead>
              {canEdit ? (
                <TableHead className={cn(thClass, "w-[4.5rem] text-right")}>Acciones</TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((row, index) => {
              const nombre = `${row.pacienteNombre} ${row.pacienteApellido}`.trim();
              const selected = selectedIds.has(row.visitaId);

              return (
                <TableRow
                  key={row.visitaId}
                  className={cn(
                    index % 2 === 1 && "bg-medical-secondary/15",
                    selected && "bg-medical-primary/5"
                  )}
                >
                  {canEdit ? (
                    <TableCell className={tdClass}>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => onToggleSelect(row.visitaId)}
                        className="size-[1.125rem] rounded border-medical-border text-medical-primary"
                      />
                    </TableCell>
                  ) : null}
                  <TableCell className={cn(tdClass, "whitespace-nowrap")}>
                    {formatFecha(row.fechaInicio)}
                  </TableCell>
                  <TableCell className={tdClass}>
                    <p className="font-medium text-medical-text">{nombre}</p>
                    {row.numeroDocumento ? (
                      <p className="mt-0.5 font-mono text-xs text-medical-mutedText">{row.numeroDocumento}</p>
                    ) : null}
                  </TableCell>
                  <TableCell className={cn(tdClass, "hidden md:table-cell")}>
                    {row.prestadorNombre}
                  </TableCell>
                  <TableCell className={cn(tdClass, "hidden lg:table-cell")}>
                    <p>{row.servicioNombre}</p>
                    <p className="text-xs text-medical-mutedText">
                      {MODALIDAD_COBRO_LABELS[row.modalidadCobro] ?? row.modalidadCobro}
                    </p>
                  </TableCell>
                  <TableCell className={cn(tdClass, "text-right font-semibold tabular-nums")}>
                    {formatReporteMonto(row.valorAplicado)}
                  </TableCell>
                  <TableCell className={cn(tdClass, "text-center")}>
                    <span
                      className={cn(
                        "inline-block rounded-md border px-2 py-0.5 text-xs font-semibold whitespace-nowrap",
                        row.facturado
                          ? finanzasSiNoBadgeClass(true)
                          : finanzasSiNoBadgeClass(false)
                      )}
                    >
                      {getVisitaFinanzasEstadoLabel("facturado", row.facturado)}
                    </span>
                  </TableCell>
                  <TableCell className={cn(tdClass, "text-center")}>
                    <span
                      className={cn(
                        "inline-block rounded-md border px-2 py-0.5 text-xs font-semibold whitespace-nowrap",
                        row.pagado
                          ? finanzasSiNoBadgeClass(true)
                          : "border-orange-200 bg-orange-50 text-orange-900"
                      )}
                    >
                      {getVisitaFinanzasEstadoLabel("pagado", row.pagado)}
                    </span>
                  </TableCell>
                  {canEdit && accessToken ? (
                    <TableCell className={cn(tdClass, "w-[4.5rem] text-right")}>
                      <VisitaFinanzasTableActions
                        visitaId={row.visitaId}
                        finanzas={{
                          modalidadCobro: row.modalidadCobro,
                          tipoJornada: "diurno",
                          tipoDia: "habil",
                          valorUnitario: row.valorAplicado,
                          valorAplicado: row.valorAplicado,
                          facturado: row.facturado,
                          pagado: row.pagado,
                        }}
                        accessToken={accessToken}
                        onUpdated={(updated) => handleRowUpdated(row.visitaId, updated)}
                      />
                    </TableCell>
                  ) : null}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="sticky bottom-0 flex flex-col gap-2 border-t border-medical-border/80 bg-medical-surface/95 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p className="text-sm text-medical-mutedText">
          Página {page} de {totalPages} · {total} visita{total !== 1 ? "s" : ""}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            className="cursor-pointer"
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages || loading}
            className="cursor-pointer"
            onClick={() => onPageChange(page + 1)}
          >
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
