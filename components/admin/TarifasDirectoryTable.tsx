"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Banknote,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { TarifaDeleteConfirmDialog } from "@/components/admin/TarifaDeleteConfirmDialog";
import { TarifaEditDialog } from "@/components/admin/TarifaEditDialog";
import { ServiciosDirectoryTableSkeleton } from "@/components/skeletons/dashboard-skeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
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
import { deleteServicioTarifaWithApi } from "@/lib/api/servicios";
import type { ServicioConTarifasDto, ServicioTarifaDto } from "@/lib/api/types";
import { canManageTarifas } from "@/lib/admin-permissions";
import {
  DEFAULT_MIN_LOADING_MS,
  delayRemaining,
} from "@/lib/loading/minimum-duration";
import { formatTarifaValor } from "@/lib/servicios-display";
import {
  MODALIDAD_COBRO_LABELS,
  TIPO_DIA_LABELS,
  TIPO_JORNADA_LABELS,
} from "@/lib/servicios-tarifas-labels";
import type { TarifaListItem } from "@/lib/tarifas-list";
import { cn } from "@/lib/utils";

const thClass =
  "h-11 px-4 text-xs font-medium text-muted-foreground first:pl-6 last:pr-6 sm:px-5";
const tdClass = "px-4 py-3 align-middle first:pl-6 last:pr-6 sm:px-5";

function TarifasTable({ children }: { children: ReactNode }) {
  return <Table className="min-w-[860px]">{children}</Table>;
}

export type TarifasDirectoryTableProps = {
  items: TarifaListItem[];
  servicios: ServicioConTarifasDto[];
  loading: boolean;
  error: string;
  accessToken: string;
  userRoles: string[];
  /** Incrementar para abrir el alta de tarifa (tras elegir servicio en la página). */
  createRequest?: { servicioId: number; nonce: number } | null;
  onRetry: () => void;
  onTarifaSaved: (tarifa: ServicioTarifaDto, servicioId: number) => void;
  onTarifaRemoved: (servicioId: number, tarifaId: number) => void;
  onNotify: (title: string, type: "success" | "error", detail?: string) => void;
};

export function TarifasDirectoryTable({
  items,
  servicios,
  loading,
  error,
  accessToken,
  userRoles,
  createRequest = null,
  onRetry,
  onTarifaSaved,
  onTarifaRemoved,
  onNotify,
}: TarifasDirectoryTableProps) {
  const canManage = canManageTarifas(userRoles);
  const [editing, setEditing] = useState<TarifaListItem | null>(null);
  const [creatingForServicioId, setCreatingForServicioId] = useState<number | null>(
    null
  );
  const [deleting, setDeleting] = useState<TarifaListItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (createRequest == null) return;
    setCreatingForServicioId(createRequest.servicioId);
  }, [createRequest]);

  const createServicio = useMemo(
    () => servicios.find((s) => s.id === creatingForServicioId) ?? null,
    [servicios, creatingForServicioId]
  );

  const siblingTarifas = useMemo(() => {
    const servicioId = editing?.servicioId ?? creatingForServicioId;
    if (servicioId == null) return [];
    const servicio = servicios.find((s) => s.id === servicioId);
    return servicio?.tarifas ?? [];
  }, [servicios, editing, creatingForServicioId]);

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    setDeleteError("");
    const startedAt = Date.now();
    try {
      await deleteServicioTarifaWithApi(
        accessToken,
        deleting.servicioId,
        deleting.id
      );
      await delayRemaining(DEFAULT_MIN_LOADING_MS, startedAt);
      onTarifaRemoved(deleting.servicioId, deleting.id);
      onNotify(
        "Tarifa eliminada",
        "success",
        `${deleting.servicioNombre} · ${formatTarifaValor(deleting.valor)}`
      );
      setDeleting(null);
    } catch (err) {
      setDeleteError(
        err instanceof ApiError
          ? getApiErrorMessages(err).join(" ")
          : "No se pudo eliminar la tarifa."
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const createDialog =
    createServicio && canManage ? (
      <TarifaEditDialog
        open
        mode="create"
        servicioId={createServicio.id}
        servicioNombre={createServicio.nombre}
        siblingTarifas={siblingTarifas}
        accessToken={accessToken}
        onClose={() => setCreatingForServicioId(null)}
        onSaved={onTarifaSaved}
        onNotify={onNotify}
      />
    ) : null;

  if (loading) {
    return (
      <div className="overflow-x-auto">
        <TarifasTable>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className={thClass}>Servicio</TableHead>
              <TableHead className={cn(thClass, "hidden md:table-cell")}>
                Modalidad
              </TableHead>
              <TableHead className={cn(thClass, "hidden lg:table-cell")}>
                Jornada / Día
              </TableHead>
              <TableHead className={thClass}>Valor</TableHead>
              <TableHead className={cn(thClass, "text-right")}>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <ServiciosDirectoryTableSkeleton rows={6} />
        </TarifasTable>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={Banknote}
        variant="error"
        title="No se pudieron cargar las tarifas"
        description={error}
        action={
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            onClick={onRetry}
          >
            <RefreshCw className="size-4" />
            Reintentar
          </Button>
        }
      />
    );
  }

  if (items.length === 0) {
    return (
      <>
        <EmptyState
          icon={Search}
          title="Sin tarifas"
          description={
            canManage
              ? "No hay tarifas cargadas. Creá una con el botón Nueva tarifa."
              : "No hay tarifas cargadas en el catálogo de servicios."
          }
        />
        {createDialog}
      </>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <TarifasTable>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className={thClass}>Servicio</TableHead>
              <TableHead className={cn(thClass, "hidden md:table-cell")}>
                Modalidad
              </TableHead>
              <TableHead className={cn(thClass, "hidden lg:table-cell")}>
                Jornada / Día
              </TableHead>
              <TableHead className={thClass}>Valor</TableHead>
              <TableHead className={cn(thClass, "text-right")}>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={`${item.servicioId}-${item.id}`}>
                <TableCell className={tdClass}>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-medical-text">
                      {item.servicioNombre}
                    </p>
                    <p className="mt-0.5 text-xs text-medical-mutedText md:hidden">
                      {MODALIDAD_COBRO_LABELS[item.modalidadCobro]} ·{" "}
                      {TIPO_JORNADA_LABELS[item.tipoJornada]} ·{" "}
                      {TIPO_DIA_LABELS[item.tipoDia]}
                    </p>
                    {!item.servicioEstado ? (
                      <Badge
                        variant="outline"
                        className="mt-1 border-medical-mutedText/30 text-[10px] text-medical-mutedText"
                      >
                        Servicio inactivo
                      </Badge>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className={cn(tdClass, "hidden md:table-cell")}>
                  <span className="text-sm text-medical-text">
                    {MODALIDAD_COBRO_LABELS[item.modalidadCobro]}
                  </span>
                </TableCell>
                <TableCell className={cn(tdClass, "hidden lg:table-cell")}>
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-sm text-medical-text">
                      {TIPO_JORNADA_LABELS[item.tipoJornada]}
                    </p>
                    <p className="text-xs text-medical-mutedText">
                      {TIPO_DIA_LABELS[item.tipoDia]}
                    </p>
                  </div>
                </TableCell>
                <TableCell className={tdClass}>
                  <p className="text-sm font-semibold text-medical-primaryDark">
                    {formatTarifaValor(item.valor)}
                  </p>
                </TableCell>
                <TableCell className={cn(tdClass, "text-right")}>
                  {canManage ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 cursor-pointer"
                          aria-label={`Acciones de tarifa ${item.id}`}
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onSelect={() => setEditing(item)}
                        >
                          <Pencil className="size-3.5" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onSelect={() =>
                            setCreatingForServicioId(item.servicioId)
                          }
                        >
                          <Plus className="size-3.5" />
                          Agregar al servicio
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="cursor-pointer text-medical-danger focus:text-medical-danger"
                          onSelect={() => {
                            setDeleteError("");
                            setDeleting(item);
                          }}
                        >
                          <Trash2 className="size-3.5" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <span className="text-xs text-medical-mutedText">Solo lectura</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TarifasTable>
      </div>

      <TarifaEditDialog
        open={editing != null}
        mode="edit"
        servicioId={editing?.servicioId ?? 0}
        servicioNombre={editing?.servicioNombre ?? ""}
        tarifa={editing}
        siblingTarifas={siblingTarifas}
        accessToken={accessToken}
        onClose={() => setEditing(null)}
        onSaved={onTarifaSaved}
        onNotify={onNotify}
      />

      {createDialog}

      <TarifaDeleteConfirmDialog
        open={deleting != null}
        tarifa={deleting}
        loading={deleteLoading}
        error={deleteError}
        onConfirm={() => void handleDelete()}
        onCancel={() => {
          if (deleteLoading) return;
          setDeleting(null);
          setDeleteError("");
        }}
      />
    </>
  );
}
