"use client";

import type { ElementType, ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  CalendarDays,
  CircleDollarSign,
  CircleDot,
  ClipboardList,
  Clock,
  Eye,
  Layers,
  Package,
  RefreshCw,
  Search,
  Stethoscope,
  Users,
} from "lucide-react";
import { VisitaAdminActions } from "@/components/admin/VisitaAdminActions";
import { VisitaDetailDialog } from "@/components/admin/VisitaDetailDialog";
import { VisitaFinanzasTableActions } from "@/components/admin/VisitaFinanzasTableActions";
import { VisitasDirectoryTableSkeleton } from "@/components/skeletons/dashboard-skeletons";
import { Badge } from "@/components/ui/badge";
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
import type { ToastKind } from "@/components/ui/use-toast";
import type { VisitaDetailDto, VisitaListItemDto } from "@/lib/api/types";
import {
  formatVisitaDuracion,
  getPacienteInitials,
  getPacienteNombre,
  getVisitaInsumosCount,
} from "@/lib/visitas-display";
import {
  formatVisitaEstado,
  formatVisitaEstadoContextual,
  visitaEstadoBadgeClass,
  visitaEstadoBadgeClassContextual,
} from "@/lib/visita-estado-labels";
import { cn } from "@/lib/utils";
import { puedeCancelarVisita, puedeEliminarVisita } from "@/lib/visitas-access";

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

function VisitasTable({ children }: { children: ReactNode }) {
  return <Table className="min-w-[980px]">{children}</Table>;
}

export type VisitasDirectoryTableProps = {
  items: VisitaListItemDto[];
  filteredItems: VisitaListItemDto[];
  loading: boolean;
  error: string;
  accessToken: string | null;
  esAdmin?: boolean;
  onRetry: () => void;
  onVisitaUpdated?: (visita: VisitaDetailDto) => void;
  onVisitaDeleted?: (visitaId: number) => void;
  onVisitaCanceled?: (visita: VisitaDetailDto) => void;
  onNotify?: (message: string, kind: ToastKind, description?: string) => void;
};

const thClass =
  "h-11 px-4 text-xs font-medium text-muted-foreground first:pl-6 last:pr-6 sm:px-5";
const tdClass =
  "px-4 py-3 whitespace-normal first:pl-6 last:pr-6 sm:px-5";

function ColumnHeader({
  icon: Icon,
  label,
  className,
  align = "left",
}: {
  icon: ElementType;
  label: string;
  className?: string;
  align?: "left" | "right";
}) {
  return (
    <TableHead className={cn(thClass, className)}>
      <span
        className={cn(
          "inline-flex items-center gap-2",
          align === "right" && "w-full justify-end"
        )}
      >
        <Icon className="size-4 shrink-0 opacity-70" aria-hidden />
        {label}
      </span>
    </TableHead>
  );
}

function TableHeaderRow({ showActions }: { showActions: boolean }) {
  return (
    <TableHeader>
      <TableRow className="border-b bg-muted/40 hover:bg-muted/40">
        <ColumnHeader icon={Users} label="Paciente" />
        <ColumnHeader icon={Stethoscope} label="Prestador" className="hidden md:table-cell" />
        <ColumnHeader icon={CalendarDays} label="Fecha" className="hidden sm:table-cell" />
        <ColumnHeader icon={Clock} label="Duración" />
        <ColumnHeader icon={CircleDot} label="Estado" />
        <ColumnHeader icon={Layers} label="Prestación" className="hidden lg:table-cell" />
        <ColumnHeader
          icon={CircleDollarSign}
          label="Cobro"
          className="text-right"
          align="right"
        />
        <ColumnHeader icon={Eye} label="Detalle" className="w-12 text-right" align="right" />
        {showActions ? (
          <TableHead className={cn(thClass, "w-12 text-right")}>
            <span className="sr-only">Acciones</span>
          </TableHead>
        ) : null}
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
  esAdmin = false,
  onRetry,
  onVisitaUpdated,
  onVisitaDeleted,
  onVisitaCanceled,
  onNotify,
}: VisitasDirectoryTableProps) {
  const [detailTarget, setDetailTarget] = useState<VisitaListItemDto | null>(null);
  const [rows, setRows] = useState<VisitaListItemDto[]>(filteredItems);
  const showActions = esAdmin && Boolean(accessToken);

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
        prev ? { ...prev, ...updated, finanzas: updated.finanzas ?? prev.finanzas } : prev
      );
    }
    onVisitaUpdated?.(updated);
  };

  const handleVisitaDeleted = (visitaId: number) => {
    setRows((prev) => prev.filter((row) => row.id !== visitaId));
    if (detailTarget?.id === visitaId) {
      setDetailTarget(null);
    }
    onVisitaDeleted?.(visitaId);
  };

  const handleVisitaCanceled = (updated: VisitaDetailDto) => {
    setRows((prev) =>
      prev.map((row) => (row.id === updated.id ? { ...row, ...updated } : row))
    );
    if (detailTarget?.id === updated.id) {
      setDetailTarget((prev) => (prev ? { ...prev, ...updated } : prev));
    }
    onVisitaCanceled?.(updated);
  };

  const handleVisitaNotFound = () => {
    if (detailTarget) {
      setRows((prev) => prev.filter((row) => row.id !== detailTarget.id));
      setDetailTarget(null);
      onVisitaDeleted?.(detailTarget.id);
    }
  };

  if (loading) {
    return (
      <VisitasTable>
        <TableHeaderRow showActions={showActions} />
        <VisitasDirectoryTableSkeleton rows={6} cellClassName={tdClass} />
      </VisitasTable>
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
      <VisitasTable>
        <TableHeaderRow showActions={showActions} />
        <TableBody>
          {rows.map((visita) => {
            const doc = visita.pacienteServicio?.paciente?.numeroDocumento;
            const servicioNombre = visita.pacienteServicio?.servicio?.nombre;
            const insumoCount = getVisitaInsumosCount(visita);

            return (
              <TableRow key={visita.id}>
                {/* Paciente */}
                <TableCell className={tdClass}>
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                      {getPacienteInitials(visita)}
                    </div>
                    <div className="min-w-0 space-y-1">
                      <p className="font-medium leading-none text-foreground">
                        {getPacienteNombre(visita)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {doc ? `DNI ${doc}` : "Sin documento"}
                      </p>
                      {insumoCount > 0 ? (
                        <Badge variant="outline" className="gap-1 font-normal text-muted-foreground">
                          <Package className="size-3" />
                          {insumoCount} insumo{insumoCount === 1 ? "" : "s"}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                </TableCell>

                {/* Prestador */}
                <TableCell className={cn(tdClass, "hidden md:table-cell")}>
                  <div className="space-y-1">
                    <p className="font-medium leading-none text-foreground">
                      {visita.prestador?.nombre ?? "—"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {visita.prestador?.email ?? ""}
                    </p>
                  </div>
                </TableCell>

                {/* Fecha */}
                <TableCell className={cn(tdClass, "hidden sm:table-cell")}>
                  <div className="space-y-1">
                    <p className="font-medium leading-none text-foreground">
                      {formatDate(visita.fecha)}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatTime(visita.fecha)}</p>
                  </div>
                </TableCell>

                {/* Duración */}
                <TableCell className={tdClass}>
                  <div className="flex items-center">
                    <Badge variant="secondary" className="gap-1 font-normal">
                      <Clock className="size-3" />
                      {formatVisitaDuracion(visita.tiempoMinutos)}
                    </Badge>
                  </div>
                </TableCell>

                {/* Estado */}
                <TableCell className={tdClass}>
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-normal",
                      visitaEstadoBadgeClassContextual({
                        estado: visita.estado,
                        cierreAutomatico: visita.cierreAutomatico,
                        cierrePorRelevo: visita.cierrePorRelevo,
                      })
                    )}
                  >
                    {formatVisitaEstadoContextual({
                      estado: visita.estado,
                      cierreAutomatico: visita.cierreAutomatico,
                      cierrePorRelevo: visita.cierrePorRelevo,
                    })}
                  </Badge>
                </TableCell>

                {/* Prestación */}
                <TableCell className={cn(tdClass, "hidden lg:table-cell")}>
                  <div className="space-y-1.5">
                    {servicioNombre ? (
                      <p className="font-medium leading-none text-foreground">{servicioNombre}</p>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                </TableCell>

                {/* Seguimiento */}
                <TableCell className={cn(tdClass, "text-right")}>
                  <div className="flex min-h-8 items-center justify-end">
                    {accessToken ? (
                      <VisitaFinanzasTableActions
                        visitaId={visita.id}
                        finanzas={visita.finanzas}
                        accessToken={accessToken}
                        onUpdated={handleFinanzasUpdated}
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>
                </TableCell>

                {/* Detalle */}
                <TableCell className={cn(tdClass, "text-right")}>
                  <div className="flex min-h-8 items-center justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Ver detalles de la visita"
                      className="size-8 shrink-0 text-muted-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailTarget(visita);
                      }}
                    >
                      <Eye className="size-4" />
                    </Button>
                  </div>
                </TableCell>

                {showActions && accessToken ? (
                  <TableCell className={cn(tdClass, "text-right")}>
                    {puedeEliminarVisita(visita, esAdmin) ||
                    puedeCancelarVisita(visita, esAdmin) ? (
                      <VisitaAdminActions
                        visita={visita}
                        accessToken={accessToken}
                        esAdmin={esAdmin}
                        onDeleted={handleVisitaDeleted}
                        onCanceled={handleVisitaCanceled}
                        onNotFound={handleVisitaNotFound}
                        onNotify={onNotify}
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                ) : null}
              </TableRow>
            );
          })}
        </TableBody>
      </VisitasTable>
    </>
  );
}
