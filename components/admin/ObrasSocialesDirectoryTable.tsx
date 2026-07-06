"use client";

import type { ReactNode, SyntheticEvent } from "react";
import { useCallback, useRef, useState } from "react";
import {
  Building2,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { ObraSocialDeleteConfirmDialog } from "@/components/admin/ObraSocialDeleteConfirmDialog";
import { ObraSocialEditDialog } from "@/components/admin/ObraSocialEditDialog";
import { ObraSocialEstadoConfirmDialog } from "@/components/admin/ObraSocialEstadoConfirmDialog";
import { ObrasSocialesDirectoryTableSkeleton } from "@/components/skeletons/dashboard-skeletons";
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
import { deleteObraSocialWithApi, updateObraSocialWithApi } from "@/lib/api/obras-sociales";
import type { ObraSocialListItemDto } from "@/lib/api/types";
import {
  DEFAULT_MIN_LOADING_MS,
  delayRemaining,
} from "@/lib/loading/minimum-duration";
import { cn } from "@/lib/utils";

function getObraSocialInitials(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function ObrasSocialesTable({ children }: { children: ReactNode }) {
  return <Table className="min-w-[640px]">{children}</Table>;
}

export type ObrasSocialesDirectoryTableProps = {
  items: ObraSocialListItemDto[];
  filteredItems: ObraSocialListItemDto[];
  loading: boolean;
  error: string;
  accessToken: string;
  onRetry: () => void;
  onObraUpdated: (obra: ObraSocialListItemDto) => void;
  onObraRemoved: (id: number) => void;
  onNotify: (title: string, type: "success" | "error", detail?: string) => void;
  onCreate: () => void;
};

const thClass =
  "h-11 px-4 text-xs font-medium text-muted-foreground first:pl-6 last:pr-6 sm:px-5";
const tdClass = "px-4 py-3 align-middle first:pl-6 last:pr-6 sm:px-5";

type ObraRowHandlers = {
  onEdit: (obra: ObraSocialListItemDto) => void;
  onDelete: (obra: ObraSocialListItemDto) => void;
};

function ObraSocialRowActionsMenu({
  obra,
  runMenuAction,
  onEdit,
  onDelete,
  busy,
}: {
  obra: ObraSocialListItemDto;
  runMenuAction: (action: () => void) => void;
  busy: boolean;
} & ObraRowHandlers) {
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
          <span className="sr-only">Acciones de {obra.nombre}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="z-120 w-56 border-medical-border bg-white p-1 shadow-lg"
      >
        <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold text-medical-text">
          {obra.nombre}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-medical-border" />
        <DropdownMenuItem
          className="cursor-pointer gap-2 rounded-lg focus:bg-medical-secondary"
          onSelect={() => runMenuAction(() => onEdit(obra))}
        >
          <Pencil className="size-4 text-medical-primary" />
          Editar obra social
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-medical-border" />
        <DropdownMenuItem
          className="cursor-pointer gap-2 rounded-lg text-medical-danger focus:bg-medical-danger/10 focus:text-medical-danger"
          onSelect={() => runMenuAction(() => onDelete(obra))}
        >
          <Trash2 className="size-4" />
          Eliminar obra social
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TableHeaderRow() {
  return (
    <TableHeader>
      <TableRow className="border-b bg-muted/40 hover:bg-muted/40">
        <TableHead className={thClass}>Obra social</TableHead>
        <TableHead className={cn(thClass, "hidden sm:table-cell")}>Código</TableHead>
        <TableHead className={cn(thClass, "hidden sm:table-cell")}>Estado</TableHead>
        <TableHead className={cn(thClass, "w-14 text-right")}>
          <span className="sr-only">Acciones</span>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}

export function ObrasSocialesDirectoryTable({
  items,
  filteredItems,
  loading,
  error,
  accessToken,
  onRetry,
  onObraUpdated,
  onObraRemoved,
  onNotify,
  onCreate,
}: ObrasSocialesDirectoryTableProps) {
  const blockNavigationRef = useRef(false);
  const [deleteTarget, setDeleteTarget] = useState<ObraSocialListItemDto | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [editTarget, setEditTarget] = useState<ObraSocialListItemDto | null>(null);
  const [estadoConfirm, setEstadoConfirm] = useState<{
    obra: ObraSocialListItemDto;
    nextEstado: boolean;
  } | null>(null);
  const [estadoConfirmLoading, setEstadoConfirmLoading] = useState(false);

  const runMenuAction = useCallback((action: () => void) => {
    blockNavigationRef.current = true;
    action();
  }, []);

  const openEditFromRow = useCallback((obra: ObraSocialListItemDto) => {
    if (blockNavigationRef.current) {
      blockNavigationRef.current = false;
      return;
    }
    setEditTarget(obra);
  }, []);

  const closeEstadoConfirm = useCallback(() => {
    if (estadoConfirmLoading) return;
    setEstadoConfirm(null);
  }, [estadoConfirmLoading]);

  const confirmEstadoChange = useCallback(async () => {
    if (!estadoConfirm) return;
    const { obra, nextEstado } = estadoConfirm;
    setEstadoConfirmLoading(true);
    const startedAt = Date.now();
    try {
      const updated = await updateObraSocialWithApi(accessToken, obra.id, {
        estado: nextEstado,
      });
      await delayRemaining(DEFAULT_MIN_LOADING_MS, startedAt);
      onObraUpdated({ ...obra, ...updated });
      onNotify(
        nextEstado ? "Obra social activada" : "Obra social desactivada",
        "success",
        obra.nombre
      );
      setEstadoConfirm(null);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? getApiErrorMessages(err).join(" ")
          : "No se pudo actualizar el estado.";
      onNotify(msg, "error", obra.nombre);
    } finally {
      setEstadoConfirmLoading(false);
    }
  }, [accessToken, estadoConfirm, onNotify, onObraUpdated]);

  const closeDeleteConfirm = useCallback(() => {
    if (deleteLoading) return;
    setDeleteTarget(null);
    setDeleteError("");
  }, [deleteLoading]);

  const confirmDeleteObraSocial = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError("");
    try {
      await deleteObraSocialWithApi(accessToken, deleteTarget.id);
      onNotify("Obra social eliminada", "success", deleteTarget.nombre);
      onObraRemoved(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? getApiErrorMessages(err).join(" ")
          : "No se pudo eliminar la obra social.";
      setDeleteError(msg);
    } finally {
      setDeleteLoading(false);
    }
  }, [accessToken, deleteTarget, onNotify, onObraRemoved]);

  if (loading) {
    return (
      <ObrasSocialesTable>
        <TableHeaderRow />
        <ObrasSocialesDirectoryTableSkeleton rows={6} cellClassName={tdClass} />
      </ObrasSocialesTable>
    );
  }

  if (error) {
    return (
      <div className="px-5 py-8 sm:px-7">
        <EmptyState
          variant="error"
          icon={Building2}
          title="No se pudieron cargar las obras sociales"
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
          icon={Building2}
          title="Sin obras sociales registradas"
          description="Registrá las obras sociales para asignarlas al alta de pacientes."
          action={
            <Button type="button" onClick={onCreate} className="bg-medical-primary hover:bg-medical-primaryDark">
              <Plus className="size-4" />
              Nueva obra social
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
          description="Probá con otro término de búsqueda o filtro de estado."
        />
      </div>
    );
  }

  const rowHandlers: ObraRowHandlers = {
    onEdit: setEditTarget,
    onDelete: (obra) => {
      setDeleteError("");
      setDeleteTarget(obra);
    },
  };

  return (
    <>
      <ObraSocialEstadoConfirmDialog
        open={estadoConfirm != null}
        obra={estadoConfirm?.obra ?? null}
        nextEstado={estadoConfirm?.nextEstado ?? false}
        loading={estadoConfirmLoading}
        onConfirm={() => void confirmEstadoChange()}
        onCancel={closeEstadoConfirm}
      />
      <ObraSocialDeleteConfirmDialog
        open={deleteTarget != null}
        obra={deleteTarget}
        loading={deleteLoading}
        error={deleteError}
        onConfirm={() => void confirmDeleteObraSocial()}
        onCancel={closeDeleteConfirm}
      />
      <ObraSocialEditDialog
        open={editTarget != null}
        obra={editTarget}
        accessToken={accessToken}
        onClose={() => setEditTarget(null)}
        onUpdated={onObraUpdated}
      />

      <ObrasSocialesTable>
        <TableHeaderRow />
        <TableBody>
          {filteredItems.map((obra) => {
            const activo = obra.estado;
            const isPendingEstado =
              estadoConfirm?.obra.id === obra.id && estadoConfirmLoading;
            const isDeleting = deleteTarget?.id === obra.id && deleteLoading;
            const modalOpen = estadoConfirm != null || deleteTarget != null || editTarget != null;
            const busy = isPendingEstado || isDeleting || modalOpen;

            return (
              <TableRow
                key={obra.id}
                className="group transition-colors hover:bg-medical-secondary/30"
              >
                <TableCell
                  className={cn(tdClass, "cursor-pointer")}
                  onClick={() => !busy && openEditFromRow(obra)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-medical-secondary text-xs font-semibold text-medical-primary ring-1 ring-medical-border transition group-hover:ring-medical-primary/40">
                      {getObraSocialInitials(obra.nombre)}
                    </div>
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "truncate text-sm font-semibold leading-snug text-foreground",
                          !activo && "text-muted-foreground"
                        )}
                      >
                        {obra.nombre}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground sm:hidden">
                        {obra.codigo}
                      </p>
                    </div>
                  </div>
                </TableCell>

                <TableCell
                  className={cn(tdClass, "hidden cursor-pointer sm:table-cell")}
                  onClick={() => !busy && openEditFromRow(obra)}
                >
                  <span className="font-mono text-sm font-medium text-foreground">
                    {obra.codigo}
                  </span>
                </TableCell>

                <TableCell
                  className={cn(tdClass, "hidden sm:table-cell")}
                  onClick={(e: SyntheticEvent) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-2.5">
                    <Switch
                      id={`obra-estado-${obra.id}`}
                      checked={activo}
                      disabled={busy}
                      onCheckedChange={(checked) =>
                        setEstadoConfirm({ obra, nextEstado: checked })
                      }
                      aria-labelledby={`obra-estado-label-${obra.id}`}
                    />
                    <Label
                      id={`obra-estado-label-${obra.id}`}
                      htmlFor={`obra-estado-${obra.id}`}
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
                        "Activa"
                      ) : (
                        "Inactiva"
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
                    <ObraSocialRowActionsMenu
                      obra={obra}
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
      </ObrasSocialesTable>
    </>
  );
}
