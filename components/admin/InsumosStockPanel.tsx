"use client";

import Link from "next/link";
import { Boxes, CalendarClock, Package, RefreshCw } from "lucide-react";
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
import {
  formatInsumoFechaVencimiento,
  getInsumoDiasParaVencer,
  getInsumoVencimientoStatus,
  insumoVencimientoStatusLabel,
} from "@/lib/insumos-vencimiento";
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
  const vencStatus = getInsumoVencimientoStatus(insumo);
  const diasVenc = getInsumoDiasParaVencer(insumo);

  return (
    <li
      className={cn(
        "flex items-center gap-3 border-l-2 px-4 py-3.5 transition-colors hover:bg-medical-secondary/40 sm:gap-4 sm:px-5",
        leftBorderClass[level],
        index % 2 === 1 && "bg-medical-secondary/10"
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-medical-text">{insumo.nombre}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          {insumo.unidad ? (
            <p className="text-xs text-medical-mutedText">{insumo.unidad}</p>
          ) : null}
          {vencStatus === "proximo" || vencStatus === "vencido" ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs font-semibold",
                vencStatus === "vencido" ? "text-medical-danger" : "text-medical-warning"
              )}
            >
              <CalendarClock className="size-3" />
              {insumoVencimientoStatusLabel(vencStatus, diasVenc)}
            </span>
          ) : vencStatus === "ok" && insumo.fechaVencimiento ? (
            <span className="text-xs text-medical-mutedText">
              Vence {formatInsumoFechaVencimiento(insumo.fechaVencimiento)}
            </span>
          ) : null}
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs font-semibold sm:hidden",
              qtyColorClass[level]
            )}
          >
            <span className={cn("size-1.5 rounded-full", stockLevelDotClass(level))} />
            {stockLevelLabel(level)}
          </span>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p className={cn("text-base font-bold tabular-nums leading-none sm:text-lg", qtyColorClass[level])}>
          {qty}
        </p>
        {insumo.stockMinimo != null ? (
          <p className="mt-0.5 text-xs text-medical-mutedText">mín. {insumo.stockMinimo}</p>
        ) : null}
      </div>

      <span
        className={cn(
          "hidden shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold sm:inline-flex",
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
