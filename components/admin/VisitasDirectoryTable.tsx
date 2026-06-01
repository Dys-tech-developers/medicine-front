"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  ClipboardList,
  Clock,
  Eye,
  Package,
  RefreshCw,
  Search,
} from "lucide-react";
import { VisitaDetailDialog } from "@/components/admin/VisitaDetailDialog";
import { VisitaFinanzasTableActions } from "@/components/admin/VisitaFinanzasTableActions";
import { VisitasDirectoryTableSkeleton } from "@/components/skeletons/dashboard-skeletons";
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
import type { VisitaDetailDto, VisitaListItemDto } from "@/lib/api/types";
import {
  formatPacienteServicioEstado,
  formatVisitaDuracion,
  getPacienteInitials,
  getPacienteNombre,
  getVisitaInsumosCount,
} from "@/lib/visitas-display";
import { visitaEstadoBadgeClass } from "@/lib/medical-ui-classes";
import { cn } from "@/lib/utils";

/** Formatea solo la fecha (sin hora) */
function formatDate(iso: string): string {
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

/** Formatea solo la hora */
function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function TableScrollArea({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">{children}</div>
  );
}

export type VisitasDirectoryTableProps = {
  items: VisitaListItemDto[];
  filteredItems: VisitaListItemDto[];
  loading: boolean;
  error: string;
  accessToken: string | null;
  onRetry: () => void;
  onVisitaUpdated?: (visita: VisitaDetailDto) => void;
};

const thClass =
  "px-4 py-3 text-xs font-bold uppercase tracking-wide text-medical-primaryDark first:pl-6 last:pr-5 sm:px-5";
const tdClass =
  "px-4 py-4 align-middle first:pl-6 last:pr-5 sm:px-5";

function TableHeaderRow() {
  return (
    <TableHeader>
      <TableRow className="bg-medical-secondary/90 hover:bg-medical-secondary/90">
        <TableHead className={thClass}>Paciente</TableHead>
        <TableHead className={cn(thClass, "hidden md:table-cell")}>Prestador</TableHead>
        <TableHead className={cn(thClass, "hidden sm:table-cell")}>Fecha</TableHead>
        <TableHead className={thClass}>Duración</TableHead>
        <TableHead className={cn(thClass, "hidden lg:table-cell")}>Prestación</TableHead>
        <TableHead className={cn(thClass, "text-right")}>Seguimiento</TableHead>
        <TableHead className={cn(thClass, "w-10 text-right")}>
          <span className="sr-only">Detalle</span>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}

export function VisitasDirectoryTable({
  items,
  filteredItems,
  loading,
  error,
  accessToken,
  onRetry,
  onVisitaUpdated,
}: VisitasDirectoryTableProps) {
  const [detailTarget, setDetailTarget] = useState<VisitaListItemDto | null>(null);
  const [rows, setRows] = useState<VisitaListItemDto[]>(filteredItems);

  useEffect(() => {
    setRows(filteredItems);
  }, [filteredItems]);

  const handleFinanzasUpdated = (updated: VisitaDetailDto) => {
    setRows((prev) =>
      prev.map((row) =>
        row.id === updated.id
          ? {
              ...row,
              ...updated,
              finanzas: updated.finanzas ?? row.finanzas,
            }
          : row
      )
    );
    if (detailTarget?.id === updated.id) {
      setDetailTarget((prev) =>
        prev ? { ...prev, finanzas: updated.finanzas ?? prev.finanzas } : prev
      );
    }
    onVisitaUpdated?.(updated);
  };

  if (loading) {
    return (
      <TableScrollArea>
        <Table className="min-w-[920px]">
          <TableHeaderRow />
          <VisitasDirectoryTableSkeleton rows={6} cellClassName={tdClass} />
        </Table>
      </TableScrollArea>
    );
  }

  if (error) {
    return (
      <div className="px-5 py-8 sm:px-7">
        <EmptyState
          variant="error"
          icon={ClipboardList}
          title="No se pudieron cargar las visitas"
          description={error}
          action={
            <Button
              type="button"
              onClick={onRetry}
              className="bg-medical-primary cursor-pointer hover:bg-medical-primaryDark"
            >
              <RefreshCw className="size-4" />
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
          icon={ClipboardList}
          title="No hay visitas registradas"
          description="Cuando los prestadores registren visitas médicas, aparecerán en este listado."
        />
      </div>
    );
  }

  if (filteredItems.length === 0) {
    return (
      <div className="px-5 py-8 sm:px-7">
        <EmptyState
          icon={Search}
          title="Sin coincidencias"
          description="Probá con otro término o navegá a otra página del listado."
        />
      </div>
    );
  }

  return (
    <>
      <VisitaDetailDialog
        open={detailTarget != null}
        visita={detailTarget}
        onClose={() => setDetailTarget(null)}
      />
      <TableScrollArea>
        <Table className="min-w-[920px]">
          <TableHeaderRow />
          <TableBody>
            {rows.map((visita, index) => {
              const doc = visita.pacienteServicio?.paciente?.numeroDocumento;
              const servicioNombre = visita.pacienteServicio?.servicio?.nombre;
              const estado = visita.pacienteServicio?.estado;
              const insumoCount = getVisitaInsumosCount(visita);

              return (
                <TableRow
                  key={visita.id}
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-medical-secondary/50",
                    index % 2 === 1 && "bg-medical-secondary/20"
                  )}
                  onClick={() => setDetailTarget(visita)}
                >
                  {/* Paciente */}
                  <TableCell className={tdClass}>
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-medical-secondary to-white text-xs font-bold text-medical-primary ring-1 ring-medical-primary/12">
                        {getPacienteInitials(visita)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-medical-text leading-snug">
                          {getPacienteNombre(visita)}
                        </p>
                        <p className="text-xs text-medical-mutedText">
                          {doc ? `DNI ${doc}` : "Sin documento"}
                        </p>
                        {/* Insumos pill — visible en todos los tamaños */}
                        {insumoCount > 0 ? (
                          <span className="mt-1.5 inline-flex items-center gap-1 text-xs text-medical-mutedText">
                            <Package className="size-3 shrink-0" />
                            {insumoCount} insumo{insumoCount === 1 ? "" : "s"}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </TableCell>

                  {/* Prestador */}
                  <TableCell className={cn(tdClass, "hidden md:table-cell")}>
                    <p className="font-medium text-medical-text leading-snug">
                      {visita.prestador?.nombre ?? "—"}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-medical-mutedText">
                      {visita.prestador?.email ?? ""}
                    </p>
                  </TableCell>

                  {/* Fecha */}
                  <TableCell className={cn(tdClass, "hidden sm:table-cell")}>
                    <p className="text-sm font-medium text-medical-text">
                      {formatDate(visita.fecha)}
                    </p>
                    <p className="mt-0.5 text-xs text-medical-mutedText">
                      {formatTime(visita.fecha)}
                    </p>
                  </TableCell>

                  {/* Duración */}
                  <TableCell className={tdClass}>
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-medical-primary/20 bg-medical-secondary px-2.5 py-1 text-xs font-semibold text-medical-primaryDark">
                      <Clock className="size-3.5 shrink-0" />
                      {formatVisitaDuracion(visita.tiempoMinutos)}
                    </span>
                  </TableCell>

                  {/* Prestación */}
                  <TableCell className={cn(tdClass, "hidden lg:table-cell")}>
                    {servicioNombre ? (
                      <p className="text-sm font-medium text-medical-text">{servicioNombre}</p>
                    ) : (
                      <span className="text-sm text-medical-mutedText">—</span>
                    )}
                    {estado ? (
                      <span
                        className={cn(
                          "mt-1.5 inline-block rounded-md border px-2 py-0.5 text-xs font-semibold",
                          visitaEstadoBadgeClass(estado)
                        )}
                      >
                        {formatPacienteServicioEstado(estado)}
                      </span>
                    ) : null}
                  </TableCell>

                  {/* Cobro */}
                  <TableCell className={cn(tdClass, "text-right align-top")}>
                    {accessToken ? (
                      <VisitaFinanzasTableActions
                        visitaId={visita.id}
                        finanzas={visita.finanzas}
                        accessToken={accessToken}
                        onUpdated={handleFinanzasUpdated}
                      />
                    ) : (
                      <span className="text-xs text-medical-mutedText">—</span>
                    )}
                  </TableCell>

                  {/* Detalle */}
                  <TableCell className={cn(tdClass, "text-right")}>
                    <button
                      type="button"
                      aria-label="Ver detalles de la visita"
                      className="rounded-lg p-1.5 cursor-pointer text-medical-mutedText transition-colors hover:bg-medical-primary/10 hover:text-medical-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailTarget(visita);
                      }}
                    >
                      <Eye className="size-4" />
                    </button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableScrollArea>
    </>
  );
}
