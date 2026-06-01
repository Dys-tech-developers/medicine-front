"use client";

import type { ReactNode } from "react";
import { useCallback, useState } from "react";
import { Layers, Loader2, Pencil, Plus, RefreshCw, Search, Trash2, Users } from "lucide-react";
import { ServicioEditDialog } from "@/components/admin/ServicioEditDialog";
import { ServicioEstadoConfirmDialog } from "@/components/admin/ServicioEstadoConfirmDialog";
import { ServicioPacientesDialog } from "@/components/admin/ServicioPacientesDialog";
import { ServicioTarifasCell } from "@/components/admin/ServicioTarifasCell";
import { ServiciosDirectoryTableSkeleton } from "@/components/skeletons/dashboard-skeletons";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiError } from "@/lib/api/client";
import { getApiErrorMessages } from "@/lib/api/format-api-error";
import {
  deleteServicioWithApi,
  updateServicioEstadoWithApi,
} from "@/lib/api/servicios";
import type { ServicioConTarifasDto } from "@/lib/api/types";
import { getServicioPacientesCount } from "@/lib/servicios-display";
import {
  DEFAULT_MIN_LOADING_MS,
  delayRemaining,
} from "@/lib/loading/minimum-duration";
import { cn } from "@/lib/utils";

function TableScrollArea({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto px-4 py-4 sm:px-6 sm:py-5">{children}</div>
  );
}

export type ServiciosDirectoryTableProps = {
  items: ServicioConTarifasDto[];
  filteredItems: ServicioConTarifasDto[];
  loading: boolean;
  error: string;
  accessToken: string;
  onRetry: () => void;
  onServicioUpdated: (servicio: ServicioConTarifasDto) => void;
  onServicioRemoved: (id: number) => void;
  onNotify: (title: string, type: "success" | "error", detail?: string) => void;
  onCreate: () => void;
};

export function ServiciosDirectoryTable({
  items,
  filteredItems,
  loading,
  error,
  accessToken,
  onRetry,
  onServicioUpdated,
  onServicioRemoved,
  onNotify,
  onCreate,
}: ServiciosDirectoryTableProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editTarget, setEditTarget] = useState<ServicioConTarifasDto | null>(null);
  const [editFocusTarifaId, setEditFocusTarifaId] = useState<number | null>(null);
  const [editAddTarifa, setEditAddTarifa] = useState(false);
  const [pacientesDialogServicio, setPacientesDialogServicio] =
    useState<ServicioConTarifasDto | null>(null);
  const [estadoConfirm, setEstadoConfirm] = useState<{
    servicio: ServicioConTarifasDto;
    nextEstado: boolean;
  } | null>(null);
  const [estadoConfirmLoading, setEstadoConfirmLoading] = useState(false);

  const openEstadoConfirm = useCallback((servicio: ServicioConTarifasDto, nextEstado: boolean) => {
    setEstadoConfirm({ servicio, nextEstado });
  }, []);

  const closeEstadoConfirm = useCallback(() => {
    if (estadoConfirmLoading) return;
    setEstadoConfirm(null);
  }, [estadoConfirmLoading]);

  const confirmEstadoChange = useCallback(async () => {
    if (!estadoConfirm) return;

    const { servicio, nextEstado } = estadoConfirm;
    setEstadoConfirmLoading(true);
    const startedAt = Date.now();

    try {
      const updated = await updateServicioEstadoWithApi(accessToken, servicio.id, {
        estado: nextEstado,
      });
      await delayRemaining(DEFAULT_MIN_LOADING_MS, startedAt);
      onServicioUpdated({
        ...servicio,
        estado: updated.estado,
      });
      onNotify(
        nextEstado ? "Servicio activado" : "Servicio desactivado",
        "success",
        servicio.nombre
      );
      setEstadoConfirm(null);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? getApiErrorMessages(err).join(" ")
          : "No se pudo actualizar el estado.";
      onNotify(msg, "error", servicio.nombre);
    } finally {
      setEstadoConfirmLoading(false);
    }
  }, [accessToken, estadoConfirm, onNotify, onServicioUpdated]);

  const handleDelete = useCallback(
    async (servicio: ServicioConTarifasDto) => {
      const count = getServicioPacientesCount(servicio);
      if (count > 0) {
        onNotify(
          "No se puede eliminar: el servicio está asignado a uno o más pacientes.",
          "error",
          servicio.nombre
        );
        return;
      }

      const confirmed = window.confirm(
        `¿Eliminar el servicio «${servicio.nombre}»? Esta acción no se puede deshacer.`
      );
      if (!confirmed) return;

      setDeletingId(servicio.id);
      try {
        await deleteServicioWithApi(accessToken, servicio.id);
        onNotify("Servicio eliminado", "success", servicio.nombre);
        onServicioRemoved(servicio.id);
      } catch (err) {
        const msg =
          err instanceof ApiError
            ? getApiErrorMessages(err).join(" ")
            : "No se pudo eliminar el servicio.";
        onNotify(msg, "error", servicio.nombre);
      } finally {
        setDeletingId(null);
      }
    },
    [accessToken, onNotify, onServicioRemoved]
  );

  const tableHeadClass =
    "px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-medical-primaryDark first:pl-6 last:pr-6 sm:px-6";
  const tableCellClass =
    "px-5 py-5 align-top whitespace-normal first:pl-6 last:pr-6 sm:px-6";

  const tableHeader = (
    <TableHeader>
      <TableRow className="bg-medical-secondary/90 hover:bg-medical-secondary/90">
        <TableHead className={tableHeadClass}>Servicio</TableHead>
        <TableHead className={cn(tableHeadClass, "hidden md:table-cell w-[200px]")}>
          Tarifas
        </TableHead>
        <TableHead className={cn(tableHeadClass, "hidden lg:table-cell")}>
          Pacientes
        </TableHead>
        <TableHead className={tableHeadClass}>Estado</TableHead>
        <TableHead className={cn(tableHeadClass, "w-[140px]")}> </TableHead>
      </TableRow>
    </TableHeader>
  );

  if (loading) {
    return (
      <TableScrollArea>
        <Table className="min-w-[880px]">
          {tableHeader}
          <ServiciosDirectoryTableSkeleton rows={6} cellClassName={tableCellClass} />
        </Table>
      </TableScrollArea>
    );
  }

  if (error) {
    return (
      <TableScrollArea>
        <EmptyState
          variant="error"
          icon={Layers}
          title="No se pudieron cargar los servicios"
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
      </TableScrollArea>
    );
  }

  if (items.length === 0) {
    return (
      <TableScrollArea>
        <EmptyState
          icon={Layers}
          title="Sin servicios registrados"
          description="Los servicios definen qué tipos de atención pueden asignarse a los pacientes."
          action={
            <Button
              type="button"
              onClick={onCreate}
              className="bg-medical-primary hover:cursor-pointer hover:bg-medical-primaryDark"
            >
              <Plus className="size-4" />
              Nuevo servicio
            </Button>
          }
        />
      </TableScrollArea>
    );
  }

  if (filteredItems.length === 0) {
    return (
      <TableScrollArea>
        <EmptyState
          icon={Search}
          title="Sin coincidencias"
          description="Probá con otro término de búsqueda."
        />
      </TableScrollArea>
    );
  }

  return (
    <>
      <ServicioEstadoConfirmDialog
        open={estadoConfirm != null}
        servicio={estadoConfirm?.servicio ?? null}
        nextEstado={estadoConfirm?.nextEstado ?? false}
        loading={estadoConfirmLoading}
        onConfirm={() => void confirmEstadoChange()}
        onCancel={closeEstadoConfirm}
      />
      <ServicioEditDialog
        open={editTarget != null}
        servicio={editTarget}
        focusTarifaId={editFocusTarifaId}
        focusAddTarifa={editAddTarifa}
        accessToken={accessToken}
        onClose={() => {
          setEditTarget(null);
          setEditFocusTarifaId(null);
          setEditAddTarifa(false);
        }}
        onUpdated={(updated) => {
          onServicioUpdated(updated);
          setEditTarget(updated);
        }}
        onNotify={onNotify}
      />
      <ServicioPacientesDialog
        open={pacientesDialogServicio != null}
        servicio={pacientesDialogServicio}
        onClose={() => setPacientesDialogServicio(null)}
      />
      <TableScrollArea>
      <Table className="min-w-[880px]">
        {tableHeader}
        <TableBody>
          {filteredItems.map((servicio, index) => {
            const count = getServicioPacientesCount(servicio);
            const tarifas = servicio.tarifas ?? [];
            const activo = servicio.estado;
            const isPendingEstado =
              estadoConfirm?.servicio.id === servicio.id && estadoConfirmLoading;
            const isDeleting = deletingId === servicio.id;
            const modalOpen = estadoConfirm != null || editTarget != null;
            const busy = isPendingEstado || isDeleting || modalOpen;

            return (
              <TableRow
                key={servicio.id}
                className={cn(
                  "hover:bg-medical-secondary/40",
                  index % 2 === 1 && "bg-medical-secondary/20",
                  !activo && "opacity-80"
                )}
              >
                <TableCell className={tableCellClass}>
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-medical-secondary to-white text-medical-primary ring-1 ring-medical-primary/12">
                      <Layers className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "font-semibold text-medical-text",
                          !activo && "text-medical-mutedText"
                        )}
                      >
                        {servicio.nombre}
                      </p>
                      {servicio.descripcion ? (
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-medical-mutedText">
                          {servicio.descripcion}
                        </p>
                      ) : null}
                      <ServicioTarifasCell
                        variant="inline"
                        servicioNombre={servicio.nombre}
                        tarifas={tarifas}
                        disabled={busy}
                        onEditTarifa={(tarifaId) => {
                          setEditAddTarifa(false);
                          setEditFocusTarifaId(tarifaId);
                          setEditTarget(servicio);
                        }}
                        onAddTarifa={() => {
                          setEditFocusTarifaId(null);
                          setEditAddTarifa(true);
                          setEditTarget(servicio);
                        }}
                        onManageServicio={() => {
                          setEditFocusTarifaId(null);
                          setEditAddTarifa(false);
                          setEditTarget(servicio);
                        }}
                      />
                      {count > 0 ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2 h-8 border-medical-primary/25 text-xs font-medium text-medical-primary cursor-pointer lg:hidden"
                          onClick={() => setPacientesDialogServicio(servicio)}
                        >
                          <Users className="size-3.5" />
                          Ver {count} paciente{count === 1 ? "" : "s"}
                        </Button>
                      ) : (
                        <p className="mt-1.5 text-xs text-medical-mutedText lg:hidden">
                          Sin pacientes asignados
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className={cn(tableCellClass, "hidden py-4 md:table-cell")}>
                  <ServicioTarifasCell
                    servicioNombre={servicio.nombre}
                    tarifas={tarifas}
                    disabled={busy}
                    onEditTarifa={(tarifaId) => {
                      setEditAddTarifa(false);
                      setEditFocusTarifaId(tarifaId);
                      setEditTarget(servicio);
                    }}
                    onAddTarifa={() => {
                      setEditFocusTarifaId(null);
                      setEditAddTarifa(true);
                      setEditTarget(servicio);
                    }}
                    onManageServicio={() => {
                      setEditFocusTarifaId(null);
                      setEditAddTarifa(false);
                      setEditTarget(servicio);
                    }}
                  />
                </TableCell>
                <TableCell className={cn(tableCellClass, "hidden lg:table-cell")}>
                  {count === 0 ? (
                    <span className="text-sm text-medical-mutedText">Ninguno</span>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      className="border-medical-primary/25 cursor-pointer font-semibold text-medical-primary hover:bg-medical-secondary"
                      onClick={() => setPacientesDialogServicio(servicio)}
                    >
                      <Users className="size-3.5" />
                      Ver pacientes ({count})
                    </Button>
                  )}
                </TableCell>
                <TableCell className={tableCellClass}>
                  <div className="flex items-center gap-3">
                    <Switch
                      id={`servicio-estado-${servicio.id}`}
                      checked={activo}
                      disabled={busy}
                      onCheckedChange={(checked) => openEstadoConfirm(servicio, checked)}
                      aria-labelledby={`servicio-estado-label-${servicio.id}`}
                    />
                    <Label
                      id={`servicio-estado-label-${servicio.id}`}
                      htmlFor={`servicio-estado-${servicio.id}`}
                      className={cn(
                        "text-sm font-medium text-medical-text",
                        busy ? "cursor-not-allowed opacity-70" : "cursor-pointer"
                      )}
                    >
                      {isPendingEstado ? (
                        <span className="inline-flex items-center gap-1.5 text-medical-mutedText">
                          <Loader2 className="size-3.5 animate-spin" />
                          Actualizando…
                        </span>
                      ) : activo ? (
                        "Activo"
                      ) : (
                        "Inactivo"
                      )}
                    </Label>
                  </div>
                </TableCell>
                <TableCell className={tableCellClass}>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      title="Editar servicio y tarifas"
                      className="cursor-pointer border-medical-primary/25 text-medical-primary hover:bg-medical-secondary"
                      onClick={() => {
                        setEditFocusTarifaId(null);
                        setEditAddTarifa(false);
                        setEditTarget(servicio);
                      }}
                    >
                      <Pencil className="size-3.5" />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={busy || count > 0}
                      title={
                        count > 0
                          ? "No se puede eliminar: está asignado a pacientes"
                          : "Eliminar servicio"
                      }
                      className="border-medical-danger/30 text-medical-danger cursor-pointer hover:bg-medical-danger/10 hover:text-medical-danger"
                      onClick={() => void handleDelete(servicio)}
                    >
                      {isDeleting ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                      <span className="sr-only">Eliminar</span>
                    </Button>
                  </div>
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
