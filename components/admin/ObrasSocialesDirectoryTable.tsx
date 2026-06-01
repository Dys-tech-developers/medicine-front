"use client";

import type { ReactNode } from "react";
import { useCallback, useState } from "react";
import {
  Building2,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { ObraSocialEditDialog } from "@/components/admin/ObraSocialEditDialog";
import { ObraSocialEstadoConfirmDialog } from "@/components/admin/ObraSocialEstadoConfirmDialog";
import { ObrasSocialesDirectoryTableSkeleton } from "@/components/skeletons/dashboard-skeletons";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
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
import { estadoActivoBadgeClass } from "@/lib/medical-ui-classes";
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

function TableScrollArea({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto">{children}</div>;
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
  "px-4 py-3 text-xs font-bold uppercase tracking-wide text-medical-primaryDark first:pl-6 last:pr-5 sm:px-5";
const tdClass =
  "px-4 py-4 align-middle first:pl-6 last:pr-5 sm:px-5";

function TableHeaderRow() {
  return (
    <TableHeader>
      <TableRow className="bg-medical-secondary/90 hover:bg-medical-secondary/90">
        <TableHead className={thClass}>Obra social</TableHead>
        <TableHead className={cn(thClass, "hidden sm:table-cell")}>Código</TableHead>
        <TableHead className={thClass}>Estado</TableHead>
        <TableHead className={cn(thClass, "w-[100px] text-right")}>
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
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editTarget, setEditTarget] = useState<ObraSocialListItemDto | null>(null);
  const [estadoConfirm, setEstadoConfirm] = useState<{
    obra: ObraSocialListItemDto;
    nextEstado: boolean;
  } | null>(null);
  const [estadoConfirmLoading, setEstadoConfirmLoading] = useState(false);

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

  const handleDelete = useCallback(
    async (obra: ObraSocialListItemDto) => {
      const confirmed = window.confirm(
        `¿Eliminar la obra social «${obra.nombre}»? Esta acción no se puede deshacer.`
      );
      if (!confirmed) return;

      setDeletingId(obra.id);
      try {
        await deleteObraSocialWithApi(accessToken, obra.id);
        onNotify("Obra social eliminada", "success", obra.nombre);
        onObraRemoved(obra.id);
      } catch (err) {
        const msg =
          err instanceof ApiError
            ? getApiErrorMessages(err).join(" ")
            : "No se pudo eliminar la obra social.";
        onNotify(msg, "error", obra.nombre);
      } finally {
        setDeletingId(null);
      }
    },
    [accessToken, onNotify, onObraRemoved]
  );

  if (loading) {
    return (
      <TableScrollArea>
        <Table className="min-w-[640px]">
          <TableHeaderRow />
          <ObrasSocialesDirectoryTableSkeleton rows={6} cellClassName={tdClass} />
        </Table>
      </TableScrollArea>
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
      <ObraSocialEditDialog
        open={editTarget != null}
        obra={editTarget}
        accessToken={accessToken}
        onClose={() => setEditTarget(null)}
        onUpdated={onObraUpdated}
      />
      <TableScrollArea>
        <Table className="min-w-[640px]">
          <TableHeaderRow />
          <TableBody>
            {filteredItems.map((obra, index) => {
              const activo = obra.estado;
              const isPendingEstado =
                estadoConfirm?.obra.id === obra.id && estadoConfirmLoading;
              const isDeleting = deletingId === obra.id;
              const modalOpen = estadoConfirm != null;
              const busy = isPendingEstado || isDeleting || modalOpen;

              return (
                <TableRow
                  key={obra.id}
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-medical-secondary/50",
                    index % 2 === 1 && "bg-medical-secondary/20",
                    !activo && "opacity-90"
                  )}
                  onClick={() => !busy && setEditTarget(obra)}
                >
                  {/* Obra social */}
                  <TableCell className={tdClass}>
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-medical-secondary to-white text-xs font-bold text-medical-primary ring-1 ring-medical-primary/12">
                        {getObraSocialInitials(obra.nombre)}
                      </div>
                      <div className="min-w-0">
                        <p
                          className={cn(
                            "font-semibold leading-snug text-medical-text",
                            !activo && "text-medical-mutedText"
                          )}
                        >
                          {obra.nombre}
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-medical-mutedText sm:hidden">
                          {obra.codigo}
                        </p>
                        <span
                          className={cn(
                            "mt-1.5 inline-flex rounded-md border px-2 py-0.5 text-xs font-semibold sm:hidden",
                            estadoActivoBadgeClass(activo)
                          )}
                        >
                          {activo ? "Activa" : "Inactiva"}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Código */}
                  <TableCell className={cn(tdClass, "hidden sm:table-cell")}>
                    <span className="font-mono text-sm font-medium text-medical-text">
                      {obra.codigo}
                    </span>
                  </TableCell>

                  {/* Estado */}
                  <TableCell
                    className={tdClass}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-2.5">
                      <Switch
                        id={`obra-estado-${obra.id}`}
                        checked={activo}
                        disabled={busy}
                        onCheckedChange={(checked) =>
                          setEstadoConfirm({ obra, nextEstado: checked })
                        }
                      />
                      {isPendingEstado ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-medical-mutedText">
                          <Loader2 className="size-3.5 animate-spin" />
                          …
                        </span>
                      ) : (
                        <span
                          className={cn(
                            "hidden rounded-md border px-2 py-0.5 text-xs font-semibold sm:inline-flex",
                            estadoActivoBadgeClass(activo)
                          )}
                        >
                          {activo ? "Activa" : "Inactiva"}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Acciones */}
                  <TableCell
                    className={cn(tdClass, "text-right")}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-0.5">
                      <button
                        type="button"
                        aria-label="Editar obra social"
                        title="Editar"
                        disabled={busy}
                        className="rounded-lg p-1.5 text-medical-mutedText transition-colors hover:bg-medical-primary/10 hover:text-medical-primary disabled:opacity-50"
                        onClick={() => setEditTarget(obra)}
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Eliminar obra social"
                        title="Eliminar"
                        disabled={busy}
                        className="rounded-lg p-1.5 text-medical-mutedText transition-colors hover:bg-medical-danger/10 hover:text-medical-danger disabled:opacity-50"
                        onClick={() => void handleDelete(obra)}
                      >
                        {isDeleting ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Trash2 className="size-4" />
                        )}
                      </button>
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
