"use client";

import type { ReactNode, SyntheticEvent } from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Boxes,
  MoreHorizontal,
  Package,
  PackagePlus,
  Pencil,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { InsumoDeleteConfirmDialog } from "@/components/admin/InsumoDeleteConfirmDialog";
import { InsumoEditDialog } from "@/components/admin/InsumoEditDialog";
import {
  INSUMOS_BULK_DELETE_MAX,
  InsumosStockBulkBar,
} from "@/components/admin/InsumosStockBulkBar";
import { InsumosStockTableSkeleton } from "@/components/skeletons/dashboard-skeletons";
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
  deleteInsumoWithApi,
  deleteInsumosBulkWithApi,
} from "@/lib/api/insumos";
import type { InsumoListItemDto } from "@/lib/api/types";
import { getInsumoInitials } from "@/lib/insumos-display";
import {
  getStockLevel,
  stockLevelDotClass,
  stockLevelLabel,
} from "@/lib/insumos-stock";
import {
  formatInsumoFechaVencimiento,
  getInsumoDiasParaVencer,
  getInsumoVencimientoStatus,
  insumoVencimientoDotClass,
  insumoVencimientoStatusLabel,
} from "@/lib/insumos-vencimiento";
import { cn } from "@/lib/utils";

function InsumosTable({ children }: { children: ReactNode }) {
  return <Table className="min-w-[800px]">{children}</Table>;
}

const thClass =
  "h-11 px-4 text-xs font-medium text-muted-foreground first:pl-6 last:pr-6 sm:px-5";
const tdClass = "px-4 py-3 align-middle first:pl-6 last:pr-6 sm:px-5";

function TableHeaderRow({
  canSelect,
  allPageSelected,
  onToggleSelectAllPage,
}: {
  canSelect: boolean;
  allPageSelected: boolean;
  onToggleSelectAllPage: () => void;
}) {
  return (
    <TableHeader>
      <TableRow className="border-b bg-muted/40 hover:bg-muted/40">
        {canSelect ? (
          <TableHead className={cn(thClass, "w-11")}>
            <input
              type="checkbox"
              checked={allPageSelected}
              onChange={onToggleSelectAllPage}
              aria-label="Seleccionar todos en esta página"
              className="size-4 cursor-pointer rounded border-medical-border text-medical-primary"
            />
          </TableHead>
        ) : null}
        <TableHead className={thClass}>Insumo</TableHead>
        <TableHead className={cn(thClass, "hidden sm:table-cell")}>Stock</TableHead>
        <TableHead className={cn(thClass, "hidden md:table-cell")}>Vencimiento</TableHead>
        <TableHead className={cn(thClass, "hidden lg:table-cell")}>Estado</TableHead>
        <TableHead className={cn(thClass, "w-14 text-right")}>
          <span className="sr-only">Acciones</span>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}

function StockCell({ insumo }: { insumo: InsumoListItemDto }) {
  const qty = insumo.cantidad ?? insumo.stockActual ?? 0;
  const min = insumo.stockMinimo ?? 0;
  const level = getStockLevel(insumo);
  const unidad = insumo.unidad || insumo.unidadMedida || "unidades";
  const pct =
    min > 0 ? Math.min(100, Math.round((qty / min) * 100)) : qty > 0 ? 100 : 0;

  const barColor =
    level === "critical"
      ? "bg-medical-danger"
      : level === "low"
        ? "bg-medical-warning"
        : "bg-medical-primary";

  return (
    <div className="min-w-0 space-y-1.5">
      <p className="text-sm font-medium leading-snug text-foreground">
        {qty}{" "}
        <span className="font-normal text-muted-foreground">
          {unidad} · mín. {min}
        </span>
      </p>
      <div className="h-1 max-w-36 overflow-hidden rounded-full bg-medical-border/60">
        <div className={cn("h-full rounded-full transition-all", barColor)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function VencimientoCell({
  insumo,
  onEdit,
}: {
  insumo: InsumoListItemDto;
  onEdit: () => void;
}) {
  const status = getInsumoVencimientoStatus(insumo);
  const dias = getInsumoDiasParaVencer(insumo);

  if (status === "none") {
    return <span className="text-xs text-medical-mutedText">Sin vencimiento</span>;
  }

  const label = insumoVencimientoStatusLabel(status, dias);
  const fecha = formatInsumoFechaVencimiento(insumo.fechaVencimiento);
  const title =
    status === "vencido"
      ? `${fecha} — vencido, clic para editar`
      : status === "proximo"
        ? `${fecha} — próximo a vencer, clic para editar`
        : `${fecha} — vigente`;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onEdit();
      }}
      className={cn(
        "inline-flex cursor-pointer flex-col items-start gap-0.5 rounded-lg px-2 py-1 text-left transition hover:bg-medical-secondary/80",
        status === "vencido"
          ? "text-medical-danger"
          : status === "proximo"
            ? "text-medical-warning"
            : "text-foreground"
      )}
      title={title}
      aria-label={title}
    >
      <span className="inline-flex items-center gap-1.5 text-xs font-medium">
        <span
          className={cn("size-2 shrink-0 rounded-full", insumoVencimientoDotClass(status))}
          aria-hidden
        />
        {label}
      </span>
      <span className="text-[11px] text-muted-foreground">{fecha}</span>
    </button>
  );
}

function EstadoCell({ insumo }: { insumo: InsumoListItemDto }) {
  const stockLevel = getStockLevel(insumo);
  const activo = insumo.estado ?? insumo.activo ?? true;

  return (
    <div className="min-w-0 space-y-1">
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
        <span
          className={cn("size-2 shrink-0 rounded-full", stockLevelDotClass(stockLevel))}
          aria-hidden
        />
        {stockLevelLabel(stockLevel)}
      </span>
      <p className="text-[11px] text-muted-foreground">{activo ? "Activo" : "Inactivo"}</p>
    </div>
  );
}

function InsumoRowActionsMenu({
  insumo,
  onEdit,
  onDelete,
  runMenuAction,
}: {
  insumo: InsumoListItemDto;
  onEdit: () => void;
  onDelete: () => void;
  runMenuAction: (action: () => void) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="size-8 cursor-pointer p-0 text-medical-mutedText hover:bg-medical-secondary hover:text-medical-text"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Acciones de {insumo.nombre}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="z-120 w-52 border-medical-border bg-white p-1 shadow-lg"
      >
        <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold text-medical-text">
          {insumo.nombre}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-medical-border" />
        <DropdownMenuItem
          className="cursor-pointer gap-2 rounded-lg focus:bg-medical-secondary"
          onSelect={() => runMenuAction(onEdit)}
        >
          <Pencil className="size-4 text-medical-primary" />
          <span className="flex min-w-0 flex-col gap-0.5">
            <span>Editar insumo</span>
            <span className="text-[11px] font-normal text-medical-mutedText">
              Stock, vencimiento y datos
            </span>
          </span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-medical-border" />
        <DropdownMenuItem
          className="cursor-pointer gap-2 rounded-lg text-medical-danger focus:bg-medical-danger/10 focus:text-medical-danger"
          onSelect={() => runMenuAction(onDelete)}
        >
          <Trash2 className="size-4" />
          Eliminar insumo
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export type InsumosStockTableProps = {
  items: InsumoListItemDto[];
  filteredItems: InsumoListItemDto[];
  loading: boolean;
  error: string;
  onRetry: () => void;
  onCreate: () => void;
  accessToken: string | null;
  onUpdated: () => void;
  onDeleted?: (count: number, detail?: string) => void;
};

export function InsumosStockTable({
  items,
  filteredItems,
  loading,
  error,
  onRetry,
  onCreate,
  accessToken,
  onUpdated,
  onDeleted,
}: InsumosStockTableProps) {
  const blockNavigationRef = useRef(false);
  const [editTarget, setEditTarget] = useState<InsumoListItemDto | null>(null);
  const [deleteTargets, setDeleteTargets] = useState<InsumoListItemDto[]>([]);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());

  const canSelect = Boolean(accessToken);

  const allPageSelected = useMemo(
    () =>
      canSelect &&
      filteredItems.length > 0 &&
      filteredItems.every((row) => selectedIds.has(row.id)),
    [canSelect, filteredItems, selectedIds]
  );

  const selectedCount = selectedIds.size;

  const runMenuAction = useCallback((action: () => void) => {
    blockNavigationRef.current = true;
    action();
  }, []);

  const openEditFromRow = useCallback((insumo: InsumoListItemDto) => {
    if (blockNavigationRef.current) {
      blockNavigationRef.current = false;
      return;
    }
    setEditTarget(insumo);
  }, []);

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAllPage = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allSelected = filteredItems.every((row) => next.has(row.id));
      if (allSelected) {
        for (const row of filteredItems) next.delete(row.id);
      } else {
        for (const row of filteredItems) next.add(row.id);
      }
      return next;
    });
  }, [filteredItems]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const openDeleteConfirm = useCallback((targets: InsumoListItemDto[]) => {
    setDeleteError("");
    setDeleteTargets(targets);
  }, []);

  const closeDeleteConfirm = useCallback(() => {
    if (deleteLoading) return;
    setDeleteTargets([]);
    setDeleteError("");
  }, [deleteLoading]);

  const confirmDelete = useCallback(async () => {
    if (!accessToken || deleteTargets.length === 0) return;
    const targets = deleteTargets;
    setDeleteLoading(true);
    setDeleteError("");
    try {
      if (targets.length === 1) {
        await deleteInsumoWithApi(accessToken, targets[0].id);
      } else {
        await deleteInsumosBulkWithApi(accessToken, {
          ids: targets.map((row) => row.id),
        });
      }
      const count = targets.length;
      const detail =
        count === 1
          ? targets[0].nombre
          : targets
              .slice(0, 3)
              .map((row) => row.nombre)
              .join(", ") + (count > 3 ? ` y ${count - 3} más` : "");
      setDeleteTargets([]);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const row of targets) next.delete(row.id);
        return next;
      });
      onDeleted?.(count, detail);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? getApiErrorMessages(err).join(" ")
          : "No se pudo eliminar el insumo.";
      setDeleteError(msg);
    } finally {
      setDeleteLoading(false);
    }
  }, [accessToken, deleteTargets, onDeleted]);

  const openBulkDelete = useCallback(() => {
    const targets = filteredItems.filter((row) => selectedIds.has(row.id));
    if (targets.length === 0) return;
    if (targets.length > INSUMOS_BULK_DELETE_MAX) return;
    openDeleteConfirm(targets);
  }, [filteredItems, openDeleteConfirm, selectedIds]);

  if (loading) {
    return (
      <InsumosTable>
        <TableHeaderRow
          canSelect={canSelect}
          allPageSelected={false}
          onToggleSelectAllPage={toggleSelectAllPage}
        />
        <InsumosStockTableSkeleton rows={6} cellClassName={tdClass} canSelect={canSelect} />
      </InsumosTable>
    );
  }

  if (error) {
    return (
      <div className="px-5 py-8 sm:px-7">
        <EmptyState
          variant="error"
          icon={Package}
          title="No se pudo cargar el stock"
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
          icon={Boxes}
          title="No hay insumos registrados"
          description="Todavía no hay registros. Podés dar de alta el primero desde el formulario."
          action={
            <Button type="button" onClick={onCreate} className="bg-medical-primary hover:bg-medical-primaryDark">
              <PackagePlus className="size-4" />
              Dar de alta
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
          description="Probá con otro término o navegá a otra página del listado."
        />
      </div>
    );
  }

  return (
    <>
      <InsumoDeleteConfirmDialog
        open={deleteTargets.length > 0}
        insumos={deleteTargets}
        loading={deleteLoading}
        error={deleteError}
        onConfirm={() => void confirmDelete()}
        onCancel={closeDeleteConfirm}
      />

      <InsumosTable>
        <TableHeaderRow
          canSelect={canSelect}
          allPageSelected={allPageSelected}
          onToggleSelectAllPage={toggleSelectAllPage}
        />
        <TableBody>
          {filteredItems.map((insumo) => {
            const unidad = insumo.unidad || insumo.unidadMedida;
            const stockLevel = getStockLevel(insumo);
            const secondaryParts = [
              insumo.codigo ? `Cód. ${insumo.codigo}` : null,
              unidad || null,
              insumo.descripcion || null,
            ].filter(Boolean);
            const selected = selectedIds.has(insumo.id);

            return (
              <TableRow
                key={insumo.id}
                className={cn(
                  "group cursor-pointer transition-colors hover:bg-medical-secondary/30",
                  selected && "bg-medical-primary/5"
                )}
                onClick={() => openEditFromRow(insumo)}
              >
                {canSelect ? (
                  <TableCell
                    className={tdClass}
                    onClick={(e: SyntheticEvent) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleSelect(insumo.id)}
                      aria-label={`Seleccionar ${insumo.nombre}`}
                      className="size-4 cursor-pointer rounded border-medical-border text-medical-primary"
                    />
                  </TableCell>
                ) : null}

                <TableCell className={tdClass}>
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-1 transition group-hover:ring-medical-primary/40",
                        stockLevel === "critical"
                          ? "bg-medical-danger/10 text-medical-danger ring-medical-danger/25"
                          : stockLevel === "low"
                            ? "bg-medical-warning/10 text-medical-warning ring-medical-warning/25"
                            : "bg-medical-secondary text-medical-primary ring-medical-border"
                      )}
                    >
                      {getInsumoInitials(insumo.nombre)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold leading-snug text-foreground">
                        {insumo.nombre}
                      </p>
                      {secondaryParts.length > 0 ? (
                        <p
                          className="max-w-56 truncate text-xs text-muted-foreground"
                          title={secondaryParts.join(" · ")}
                        >
                          {secondaryParts.join(" · ")}
                        </p>
                      ) : null}
                      <div className="mt-1 flex flex-wrap items-center gap-2 sm:hidden">
                        <StockCell insumo={insumo} />
                      </div>
                    </div>
                  </div>
                </TableCell>

                <TableCell className={cn(tdClass, "hidden sm:table-cell")}>
                  <StockCell insumo={insumo} />
                </TableCell>

                <TableCell
                  className={cn(tdClass, "hidden md:table-cell")}
                  onClick={(e: SyntheticEvent) => e.stopPropagation()}
                >
                  <VencimientoCell insumo={insumo} onEdit={() => setEditTarget(insumo)} />
                </TableCell>

                <TableCell className={cn(tdClass, "hidden lg:table-cell")}>
                  <EstadoCell insumo={insumo} />
                </TableCell>

                <TableCell
                  className={cn(tdClass, "text-right")}
                  onClick={(e: SyntheticEvent) => e.stopPropagation()}
                  onPointerDown={(e: SyntheticEvent) => e.stopPropagation()}
                >
                  <div className="flex min-h-9 items-center justify-end">
                    {canSelect ? (
                      <InsumoRowActionsMenu
                        insumo={insumo}
                        runMenuAction={runMenuAction}
                        onEdit={() => setEditTarget(insumo)}
                        onDelete={() => openDeleteConfirm([insumo])}
                      />
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </InsumosTable>

      {canSelect ? (
        <InsumosStockBulkBar
          selectedCount={selectedCount}
          saving={deleteLoading}
          onDelete={openBulkDelete}
          onClear={clearSelection}
        />
      ) : null}

      <InsumoEditDialog
        open={editTarget != null}
        insumo={editTarget}
        accessToken={accessToken}
        onClose={() => setEditTarget(null)}
        onUpdated={() => {
          setEditTarget(null);
          onUpdated();
        }}
      />
    </>
  );
}
