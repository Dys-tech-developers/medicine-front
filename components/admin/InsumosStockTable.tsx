"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { AlertTriangle, Boxes, Package, PackagePlus, Pencil, RefreshCw, Search } from "lucide-react";
import { InsumoEditDialog } from "@/components/admin/InsumoEditDialog";
import { InsumosStockTableSkeleton } from "@/components/skeletons/dashboard-skeletons";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { InsumoListItemDto } from "@/lib/api/types";
import {
  getStockLevel,
  stockLevelBadgeClass,
  stockLevelDotClass,
  stockLevelLabel,
} from "@/lib/insumos-stock";
import { cn } from "@/lib/utils";

function TableScrollArea({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto px-4 py-4 sm:px-6 sm:py-5">{children}</div>
  );
}

function StockStatusBadge({ insumo }: { insumo: InsumoListItemDto }) {
  const level = getStockLevel(insumo);
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 font-semibold", stockLevelBadgeClass(level))}
    >
      <span className={cn("size-1.5 rounded-full", stockLevelDotClass(level))} />
      {stockLevelLabel(level)}
    </Badge>
  );
}

function StockAlertBanner({ items }: { items: InsumoListItemDto[] }) {
  const lowCount = items.filter((i) => getStockLevel(i) === "low").length;
  const criticalCount = items.filter((i) => getStockLevel(i) === "critical").length;

  if (lowCount === 0 && criticalCount === 0) return null;

  return (
    <div className="mx-4 mb-1 flex items-start gap-3 rounded-xl border border-medical-warning/35 bg-medical-warning/10 px-4 py-3.5 text-sm text-medical-text sm:mx-6">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-medical-warning" />
      <p className="leading-relaxed">
        {criticalCount > 0 ? (
          <>
            <span className="font-semibold">{criticalCount}</span> sin stock
            {lowCount > 0 ? " y " : "."}
          </>
        ) : null}
        {lowCount > 0 ? (
          <>
            <span className="font-semibold">{lowCount}</span> con stock bajo.
          </>
        ) : null}
      </p>
    </div>
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
}: InsumosStockTableProps) {
  const [editTarget, setEditTarget] = useState<InsumoListItemDto | null>(null);
  const tableHeadClass =
    "px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-medical-primaryDark first:pl-6 last:pr-6 sm:px-6";
  const tableCellClass =
    "px-5 py-5 align-top whitespace-normal first:pl-6 last:pr-6 sm:px-6";

  const tableHeader = (
    <TableHeader>
      <TableRow className="bg-medical-secondary/90 hover:bg-medical-secondary/90">
        <TableHead className={tableHeadClass}>Insumo</TableHead>
        <TableHead className={cn(tableHeadClass, "hidden sm:table-cell")}>Código</TableHead>
        <TableHead className={cn(tableHeadClass, "hidden md:table-cell")}>Unidad</TableHead>
        <TableHead className={cn(tableHeadClass, "hidden lg:table-cell")}>Stock</TableHead>
        <TableHead className={tableHeadClass}>Estado</TableHead>
        <TableHead className={cn(tableHeadClass, "w-[100px]")}> </TableHead>
      </TableRow>
    </TableHeader>
  );

  if (loading) {
    return (
      <TableScrollArea>
        <Table className="min-w-[640px]">
          {tableHeader}
          <InsumosStockTableSkeleton rows={6} cellClassName={tableCellClass} />
        </Table>
      </TableScrollArea>
    );
  }

  if (error) {
    return (
      <TableScrollArea>
        <EmptyState
          variant="error"
          icon={Package}
          title="No se pudo cargar el stock"
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
          icon={Boxes}
          title="Sin insumos registrados"
          description="Podés dar de alta el primero desde el formulario."
          action={
            <Button
              type="button"
              onClick={onCreate}
              className="bg-medical-primary cursor-pointer hover:bg-medical-primaryDark"
            >
              <PackagePlus className="size-4" />
              Dar de alta
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
          description="Probá con otro término o navegá a otra página del listado."
        />
      </TableScrollArea>
    );
  }

  return (
    <>
      <StockAlertBanner items={items} />
      <TableScrollArea>
        <Table className="min-w-[760px]">
          {tableHeader}
          <TableBody>
            {filteredItems.map((insumo, index) => (
              <TableRow
                key={insumo.id}
                className={cn(
                  "hover:bg-medical-secondary/40",
                  index % 2 === 1 && "bg-medical-secondary/20"
                )}
              >
                <TableCell className={tableCellClass}>
                  <div className="flex items-start gap-4">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-medical-secondary to-white text-medical-primary ring-1 ring-medical-primary/12">
                      <Package className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-medical-text">{insumo.nombre}</p>
                      {insumo.descripcion ? (
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-medical-mutedText">
                          {insumo.descripcion}
                        </p>
                      ) : null}
                      <p className="mt-1.5 text-xs text-medical-mutedText sm:hidden">
                        <span className="font-mono text-medical-primary">{insumo.codigo}</span>
                        {" · "}
                        {insumo.cantidad} {insumo.unidad}
                        {` / mín. ${insumo.stockMinimo}`}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className={cn(tableCellClass, "hidden sm:table-cell")}>
                  <span className="font-mono text-sm font-semibold text-medical-primary">
                    {insumo.codigo}
                  </span>
                </TableCell>
                <TableCell className={cn(tableCellClass, "hidden text-medical-mutedText md:table-cell")}>
                  {insumo.unidad || "—"}
                </TableCell>
                <TableCell className={cn(tableCellClass, "hidden lg:table-cell")}>
                  <span className="text-base font-semibold text-medical-text">{insumo.cantidad}</span>
                  <span className="mt-0.5 block text-xs text-medical-mutedText">
                    mín. {insumo.stockMinimo}
                  </span>
                </TableCell>
                <TableCell className={tableCellClass}>
                  <StockStatusBadge insumo={insumo} />
                </TableCell>
                <TableCell className={tableCellClass}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-medical-border/80 cursor-pointer"
                    onClick={() => setEditTarget(insumo)}
                  >
                    <Pencil className="size-3.5" />
                    Editar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableScrollArea>

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
