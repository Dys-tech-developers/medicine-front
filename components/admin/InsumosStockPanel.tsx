"use client";

import Link from "next/link";
import { Boxes, Package, RefreshCw } from "lucide-react";
import { StockListSkeleton } from "@/components/skeletons/dashboard-skeletons";
import { EmptyState } from "@/components/ui/empty-state";
import type { InsumoListItemDto } from "@/lib/api/types";
import {
  getStockLevel,
  type StockLevel,
  stockLevelBadgeClass,
  stockLevelDotClass,
  stockLevelLabel,
} from "@/lib/insumos-stock";
import { cn } from "@/lib/utils";

type InsumosStockPanelProps = {
  items: InsumoListItemDto[];
  loading: boolean;
  error: string;
  onRetry: () => void;
  limit?: number;
  showViewAllLink?: boolean;
  /** Estira el panel para igualar altura con la tarjeta vecina en el grid. */
  fillHeight?: boolean;
};

const leftBorderClass: Record<StockLevel, string> = {
  critical: "border-l-medical-danger",
  low: "border-l-medical-warning",
  ok: "border-l-medical-primary/30",
};

const qtyColorClass: Record<StockLevel, string> = {
  critical: "text-medical-danger",
  low: "text-medical-warning",
  ok: "text-medical-primary",
};

function StockListItem({ insumo, index }: { insumo: InsumoListItemDto; index: number }) {
  const level = getStockLevel(insumo);
  const qty = insumo.cantidad ?? insumo.stockActual ?? 0;

  return (
    <li
      className={cn(
        "flex items-center gap-4 border-l-2 px-5 py-3.5 transition-colors hover:bg-medical-secondary/40",
        leftBorderClass[level],
        index % 2 === 1 && "bg-medical-secondary/10"
      )}
    >
      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-medical-text">{insumo.nombre}</p>
        {insumo.unidad ? (
          <p className="mt-0.5 text-xs text-medical-mutedText">{insumo.unidad}</p>
        ) : null}
      </div>

      {/* Cantidad + badge */}
      <div className="shrink-0 text-right">
        <p className={cn("text-lg font-bold leading-none", qtyColorClass[level])}>
          {qty}
        </p>
        {insumo.stockMinimo != null ? (
          <p className="mt-0.5 text-[10px] text-medical-mutedText">mín. {insumo.stockMinimo}</p>
        ) : null}
      </div>

      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold",
          stockLevelBadgeClass(level)
        )}
      >
        <span className={cn("size-1.5 rounded-full", stockLevelDotClass(level))} />
        {stockLevelLabel(level)}
      </span>
    </li>
  );
}

export function InsumosStockPanel({
  items,
  loading,
  error,
  onRetry,
  limit = 5,
  showViewAllLink = false,
  fillHeight = false,
}: InsumosStockPanelProps) {
  const visible = items.slice(0, limit);
  const hasMore = items.length > limit;
  const shellCls = fillHeight ? "flex min-h-0 flex-1 flex-col" : "";

  if (loading) {
    return (
      <div className={shellCls}>
        <StockListSkeleton rows={Math.min(limit, 5)} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={shellCls}>
        <EmptyState
          compact
          variant="error"
          icon={Package}
          title="No se pudo cargar el stock"
          description={error}
          className={fillHeight ? "flex-1" : undefined}
          action={
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-2 cursor-pointer rounded-xl bg-medical-primary px-4 py-2 text-sm font-semibold text-white hover:bg-medical-primaryDark"
            >
              <RefreshCw className="size-4" />
              Reintentar
            </button>
          }
        />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={shellCls}>
        <EmptyState
          compact
          icon={Boxes}
          title="Sin insumos registrados"
          description="Cuando haya insumos en el sistema, el inventario aparecerá acá."
          className={fillHeight ? "flex-1" : undefined}
        />
      </div>
    );
  }

  return (
    <div className={shellCls}>
      <ul className="divide-y divide-medical-border/60 bg-medical-surface/20">
        {visible.map((insumo, index) => (
          <StockListItem key={insumo.id} insumo={insumo} index={index} />
        ))}
      </ul>
      {(hasMore || showViewAllLink) && (
        <div
          className={cn(
            "border-t border-medical-border/60 bg-medical-secondary/25 px-5 py-3 text-center",
            fillHeight && "mt-auto shrink-0"
          )}
        >
          {hasMore ? (
            <p className="text-xs text-medical-mutedText">
              +{items.length - limit} insumo{items.length - limit === 1 ? "" : "s"} más
              {showViewAllLink ? (
                <>
                  {" · "}
                  <Link
                    href="/admin/stock"
                    className="font-semibold text-medical-primary hover:underline"
                  >
                    Ver inventario
                  </Link>
                </>
              ) : null}
            </p>
          ) : showViewAllLink ? (
            <Link
              href="/admin/stock"
              className="text-xs font-semibold text-medical-primary hover:underline"
            >
              Ver inventario completo →
            </Link>
          ) : null}
        </div>
      )}
    </div>
  );
}
