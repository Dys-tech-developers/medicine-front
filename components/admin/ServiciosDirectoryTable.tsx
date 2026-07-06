"use client";

import type { ReactNode, SyntheticEvent } from "react";
import { useCallback, useRef, useState } from "react";
import {
  Eye,
  Layers,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { ServicioDetailDialog } from "@/components/admin/ServicioDetailDialog";
import { ServicioEditDialog } from "@/components/admin/ServicioEditDialog";
import { ServicioDeleteConfirmDialog } from "@/components/admin/ServicioDeleteConfirmDialog";
import { ServicioEstadoConfirmDialog } from "@/components/admin/ServicioEstadoConfirmDialog";
import { ServicioPacientesDialog } from "@/components/admin/ServicioPacientesDialog";
import { ServiciosDirectoryTableSkeleton } from "@/components/skeletons/dashboard-skeletons";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  getServicioByIdWithApi,
  updateServicioEstadoWithApi,
} from "@/lib/api/servicios";
import type { ServicioConTarifasDto } from "@/lib/api/types";
import { canDeleteServicio, getServicioDeleteErrorMessage } from "@/lib/servicios-access";
import {
  formatServicioModoVisita,
  formatTarifasResumenValores,
  getPacienteAsignadoNombre,
  getServicioPacientesCount,
} from "@/lib/servicios-display";
import {
  DEFAULT_MIN_LOADING_MS,
  delayRemaining,
} from "@/lib/loading/minimum-duration";
import { cn } from "@/lib/utils";

function ServiciosTable({ children }: { children: ReactNode }) {
  return <Table className="min-w-[760px]">{children}</Table>;
}

export type ServiciosDirectoryTableProps = {
  items: ServicioConTarifasDto[];
  filteredItems: ServicioConTarifasDto[];
  loading: boolean;
  error: string;
  accessToken: string;
  userRoles: string[];
  onRetry: () => void;
  onServicioUpdated: (servicio: ServicioConTarifasDto) => void;
  onServicioRemoved: (id: number) => void;
  onNotify: (title: string, type: "success" | "error", detail?: string) => void;
  onCreate: () => void;
};

const thClass =
  "h-11 px-4 text-xs font-medium text-muted-foreground first:pl-6 last:pr-6 sm:px-5";
const tdClass = "px-4 py-3 align-middle first:pl-6 last:pr-6 sm:px-5";

type ServicioRowHandlers = {
  onViewDetail: (servicio: ServicioConTarifasDto) => void;
  onEdit: (servicio: ServicioConTarifasDto) => void;
  onViewPacientes: (servicio: ServicioConTarifasDto) => void;
  onDelete?: (servicio: ServicioConTarifasDto) => void;
};

function TarifasCell({ tarifas }: { tarifas: ServicioConTarifasDto["tarifas"] }) {
  const list = tarifas ?? [];
  const count = list.length;

  if (count === 0) {
    return <span className="text-xs text-medical-mutedText">Sin tarifas</span>;
  }

  const resumen = formatTarifasResumenValores(list);

  return (
    <div className="min-w-0 space-y-0.5">
      <p className="text-sm font-medium leading-snug text-medical-primaryDark">
        {count} tarifa{count === 1 ? "" : "s"}
      </p>
      <p className="max-w-52 truncate text-xs text-muted-foreground" title={resumen}>
        {resumen}
      </p>
    </div>
  );
}

function PacientesCell({ servicio }: { servicio: ServicioConTarifasDto }) {
  const count = getServicioPacientesCount(servicio);

  if (count === 0) {
    return <span className="text-xs text-medical-mutedText">Sin pacientes</span>;
  }

  const nombres = (servicio.pacientes ?? []).map(getPacienteAsignadoNombre).join(", ");

  return (
    <div className="min-w-0 space-y-0.5">
      <p className="text-sm font-medium leading-snug text-medical-primaryDark">
        {count} asignado{count === 1 ? "" : "s"}
      </p>
      <p className="max-w-52 truncate text-xs text-muted-foreground" title={nombres}>
        {nombres}
      </p>
    </div>
  );
}

function ServicioRowActionsMenu({
  servicio,
  runMenuAction,
  onViewDetail,
  onEdit,
  onViewPacientes,
  onDelete,
  busy,
}: {
  servicio: ServicioConTarifasDto;
  runMenuAction: (action: () => void) => void;
  busy: boolean;
} & ServicioRowHandlers) {
  const count = getServicioPacientesCount(servicio);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={busy}
          className="size-8 cursor-pointer p-0 text-medical-mutedText hover:bg-medical-secondary hover:text-medical-text"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Acciones de {servicio.nombre}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="z-120 w-56 border-medical-border bg-white p-1 shadow-lg"
      >
        <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold text-medical-text">
          {servicio.nombre}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-medical-border" />
        <DropdownMenuItem
          className="cursor-pointer gap-2 rounded-lg focus:bg-medical-secondary"
          onSelect={() => runMenuAction(() => onViewDetail(servicio))}
        >
          <Eye className="size-4 text-medical-primary" />
          <span className="flex min-w-0 flex-col gap-0.5">
            <span>Ver detalle</span>
            <span className="text-[11px] font-normal text-medical-mutedText">
              Tarifas, pacientes y configuración
            </span>
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer gap-2 rounded-lg focus:bg-medical-secondary"
          onSelect={() => runMenuAction(() => onEdit(servicio))}
        >
          <Pencil className="size-4 text-medical-primary" />
          Editar servicio y tarifas
        </DropdownMenuItem>
        {count > 0 ? (
          <DropdownMenuItem
            className="cursor-pointer gap-2 rounded-lg focus:bg-medical-secondary"
            onSelect={() => runMenuAction(() => onViewPacientes(servicio))}
          >
            <Users className="size-4 text-medical-primary" />
            Ver pacientes ({count})
          </DropdownMenuItem>
        ) : null}
        {onDelete ? (
          <>
            <DropdownMenuSeparator className="bg-medical-border" />
            <DropdownMenuItem
              className="cursor-pointer gap-2 rounded-lg text-medical-danger focus:bg-medical-danger/10 focus:text-medical-danger"
              onSelect={() => runMenuAction(() => onDelete(servicio))}
            >
              <Trash2 className="size-4" />
              Eliminar servicio
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TableHeaderRow() {
  return (
    <TableHeader>
      <TableRow className="border-b bg-muted/40 hover:bg-muted/40">
        <TableHead className={thClass}>Servicio</TableHead>
        <TableHead className={cn(thClass, "hidden md:table-cell")}>Tarifas</TableHead>
        <TableHead className={cn(thClass, "hidden lg:table-cell")}>Pacientes</TableHead>
        <TableHead className={cn(thClass, "hidden sm:table-cell")}>Estado</TableHead>
        <TableHead className={cn(thClass, "w-14 text-right")}>
          <span className="sr-only">Acciones</span>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}

export function ServiciosDirectoryTable({
  items,
  filteredItems,
  loading,
  error,
  accessToken,
  userRoles,
  onRetry,
  onServicioUpdated,
  onServicioRemoved,
  onNotify,
  onCreate,
}: ServiciosDirectoryTableProps) {
  const blockNavigationRef = useRef(false);
  const [deleteTarget, setDeleteTarget] = useState<ServicioConTarifasDto | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteRefreshing, setDeleteRefreshing] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const canDelete = canDeleteServicio(userRoles);
  const [detailTarget, setDetailTarget] = useState<ServicioConTarifasDto | null>(null);
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

  const openDetail = useCallback((servicio: ServicioConTarifasDto) => {
    setDetailTarget(servicio);
  }, []);

  const openEdit = useCallback((servicio: ServicioConTarifasDto) => {
    setEditFocusTarifaId(null);
    setEditAddTarifa(false);
    setEditTarget(servicio);
  }, []);

  const openDetailFromRow = useCallback(
    (servicio: ServicioConTarifasDto) => {
      if (blockNavigationRef.current) {
        blockNavigationRef.current = false;
        return;
      }
      openDetail(servicio);
    },
    [openDetail]
  );

  const runMenuAction = useCallback((action: () => void) => {
    blockNavigationRef.current = true;
    action();
  }, []);

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
      const next = { ...servicio, estado: updated.estado };
      onServicioUpdated(next);
      if (detailTarget?.id === servicio.id) setDetailTarget(next);
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
  }, [accessToken, detailTarget?.id, estadoConfirm, onNotify, onServicioUpdated]);

  const closeDeleteConfirm = useCallback(() => {
    if (deleteLoading) return;
    setDeleteTarget(null);
    setDeleteRefreshing(false);
    setDeleteError("");
  }, [deleteLoading]);

  const openDeleteConfirm = useCallback(
    (servicio: ServicioConTarifasDto) => {
      setDeleteTarget(servicio);
      setDeleteError("");
      setDeleteRefreshing(true);
      void getServicioByIdWithApi(accessToken, servicio.id)
        .then((fresh) => {
          onServicioUpdated(fresh);
          setDeleteTarget(fresh);
        })
        .catch(() => {
          // Si falla la revalidación, usamos el ítem de la lista.
        })
        .finally(() => {
          setDeleteRefreshing(false);
        });
    },
    [accessToken, onServicioUpdated]
  );

  const confirmDeleteServicio = useCallback(async () => {
    if (!deleteTarget || getServicioPacientesCount(deleteTarget) > 0) return;

    setDeleteLoading(true);
    setDeleteError("");
    try {
      await deleteServicioWithApi(accessToken, deleteTarget.id);
      onNotify("Servicio eliminado", "success", deleteTarget.nombre);
      onServicioRemoved(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? getServicioDeleteErrorMessage(err)
          : "No se pudo eliminar el servicio.";
      setDeleteError(msg);
      onNotify(msg, "error", deleteTarget.nombre);
    } finally {
      setDeleteLoading(false);
    }
  }, [accessToken, deleteTarget, onNotify, onServicioRemoved]);

  if (loading) {
    return (
      <ServiciosTable>
        <TableHeaderRow />
        <ServiciosDirectoryTableSkeleton rows={5} cellClassName={tdClass} />
      </ServiciosTable>
    );
  }

  if (error) {
    return (
      <div className="px-5 py-8 sm:px-7">
        <EmptyState
          variant="error"
          icon={Layers}
          title="No se pudieron cargar los servicios"
          description={error}
          action={
            <Button
              type="button"
              onClick={onRetry}
              className="bg-medical-primary hover:bg-medical-primaryDark"
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
          icon={Layers}
          title="Sin servicios registrados"
          description="Los servicios definen qué tipos de atención pueden asignarse a los pacientes."
          action={
            <Button
              type="button"
              onClick={onCreate}
              className="bg-medical-primary hover:bg-medical-primaryDark"
            >
              <Plus className="size-4" />
              Nuevo servicio
            </Button>
          }
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
          description="Probá con otro término de búsqueda."
        />
      </div>
    );
  }

  const rowHandlers: ServicioRowHandlers = {
    onViewDetail: openDetail,
    onEdit: openEdit,
    onViewPacientes: setPacientesDialogServicio,
    onDelete: canDelete ? openDeleteConfirm : undefined,
  };

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
      <ServicioDeleteConfirmDialog
        open={deleteTarget != null}
        servicio={deleteTarget}
        loading={deleteLoading}
        refreshing={deleteRefreshing}
        error={deleteError}
        onConfirm={() => void confirmDeleteServicio()}
        onCancel={closeDeleteConfirm}
      />
      <ServicioDetailDialog
        open={detailTarget != null}
        servicio={detailTarget}
        onClose={() => setDetailTarget(null)}
        onEdit={(s) => {
          setDetailTarget(null);
          openEdit(s);
        }}
        onVerPacientes={(s) => {
          setDetailTarget(null);
          setPacientesDialogServicio(s);
        }}
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
          if (detailTarget?.id === updated.id) setDetailTarget(updated);
        }}
        onNotify={onNotify}
      />
      <ServicioPacientesDialog
        open={pacientesDialogServicio != null}
        servicio={pacientesDialogServicio}
        onClose={() => setPacientesDialogServicio(null)}
      />

      <ServiciosTable>
        <TableHeaderRow />
        <TableBody>
          {filteredItems.map((servicio) => {
            const tarifas = servicio.tarifas ?? [];
            const activo = servicio.estado;
            const isPendingEstado =
              estadoConfirm?.servicio.id === servicio.id && estadoConfirmLoading;
            const isDeleting = deleteTarget?.id === servicio.id && deleteLoading;
            const modalOpen =
              estadoConfirm != null ||
              editTarget != null ||
              detailTarget != null ||
              deleteTarget != null;
            const busy = isPendingEstado || isDeleting || modalOpen;
            const modoVisita = formatServicioModoVisita(servicio);
            const subtitulo =
              servicio.descripcion?.trim() ||
              modoVisita;

            return (
              <TableRow
                key={servicio.id}
                className="group transition-colors hover:bg-medical-secondary/30"
              >
                <TableCell
                  className={cn(tdClass, "cursor-pointer")}
                  onClick={() => openDetailFromRow(servicio)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-medical-secondary text-medical-primary ring-1 ring-medical-border transition group-hover:ring-medical-primary/40">
                      <Layers className="size-4" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "truncate text-sm font-semibold leading-snug text-foreground",
                          !activo && "text-muted-foreground"
                        )}
                      >
                        {servicio.nombre}
                      </p>
                      <p
                        className="max-w-52 truncate text-xs text-muted-foreground"
                        title={subtitulo}
                      >
                        {subtitulo}
                      </p>
                    </div>
                  </div>
                </TableCell>

                <TableCell
                  className={cn(tdClass, "hidden cursor-pointer md:table-cell")}
                  onClick={() => openDetailFromRow(servicio)}
                >
                  <TarifasCell tarifas={tarifas} />
                </TableCell>

                <TableCell
                  className={cn(tdClass, "hidden cursor-pointer lg:table-cell")}
                  onClick={() => {
                    if (getServicioPacientesCount(servicio) > 0) {
                      blockNavigationRef.current = true;
                      setPacientesDialogServicio(servicio);
                    } else {
                      openDetailFromRow(servicio);
                    }
                  }}
                >
                  <PacientesCell servicio={servicio} />
                </TableCell>

                <TableCell
                  className={cn(tdClass, "hidden sm:table-cell")}
                  onClick={(e: SyntheticEvent) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-2.5">
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
                        "text-xs font-medium",
                        busy ? "cursor-not-allowed opacity-70" : "cursor-pointer",
                        activo ? "text-medical-success" : "text-medical-mutedText"
                      )}
                    >
                      {isPendingEstado ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Loader2 className="size-3 animate-spin" />
                          …
                        </span>
                      ) : activo ? (
                        "Activo"
                      ) : (
                        "Inactivo"
                      )}
                    </Label>
                  </div>
                </TableCell>

                <TableCell
                  className={cn(tdClass, "text-right")}
                  onClick={(e: SyntheticEvent) => e.stopPropagation()}
                  onPointerDown={(e: SyntheticEvent) => e.stopPropagation()}
                >
                  <div className="flex min-h-9 items-center justify-end">
                    <ServicioRowActionsMenu
                      servicio={servicio}
                      runMenuAction={runMenuAction}
                      busy={busy}
                      {...rowHandlers}
                    />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </ServiciosTable>
    </>
  );
}
