"use client";

import { Loader2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const MAX_BULK = 200;

type Props = {
  selectedCount: number;
  saving: boolean;
  onDelete: () => void;
  onClear: () => void;
};

export function InsumosStockBulkBar({ selectedCount, saving, onDelete, onClear }: Props) {
  if (selectedCount === 0) return null;

  const overLimit = selectedCount > MAX_BULK;

  return (
    <div className="sticky bottom-0 z-20 border-t border-medical-primary/20 bg-medical-primary px-4 py-3 shadow-[0_-8px_30px_-12px_rgba(69,76,146,0.35)] sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-white">
          <span className="font-bold">{selectedCount}</span> insumo
          {selectedCount !== 1 ? "s" : ""} seleccionado
          {selectedCount !== 1 ? "s" : ""}
          {overLimit ? (
            <span className="mt-1 block text-medical-warning/70">
              Máximo {MAX_BULK} por operación masiva
            </span>
          ) : (
            <span className="mt-0.5 block text-[11px] font-normal text-white/75">
              Se eliminarán del catálogo de insumos.
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            disabled={saving || overLimit}
            className="cursor-pointer bg-white text-medical-danger hover:bg-white/90"
            onClick={onDelete}
          >
            {saving ? (
              <Loader2 className="mr-1 size-3.5 animate-spin" />
            ) : (
              <Trash2 className="mr-1 size-3.5" />
            )}
            Eliminar seleccionados
          </Button>
          <button
            type="button"
            onClick={onClear}
            disabled={saving}
            className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-white/90 hover:bg-white/10"
          >
            <X className="size-4" />
            Limpiar
          </button>
        </div>
      </div>
    </div>
  );
}

export const INSUMOS_BULK_DELETE_MAX = MAX_BULK;
