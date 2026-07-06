"use client";

import { AlertTriangle, Loader2, Package, Plus, Trash2 } from "lucide-react";
import type { InsumoListItemDto } from "@/lib/api/types";
import type { PrestadorVisitaInsumoLine } from "@/lib/prestador-visita-insumos";
import { createPrestadorVisitaInsumoLine } from "@/lib/prestador-visita-insumos";

type Props = {
  lines: PrestadorVisitaInsumoLine[];
  onLinesChange: (lines: PrestadorVisitaInsumoLine[]) => void;
  catalog: InsumoListItemDto[];
  loadingCatalog: boolean;
  catalogError: string;
  disabled?: boolean;
};

function formatInsumoOption(insumo: InsumoListItemDto): string {
  const stock = insumo.cantidad ?? insumo.stockActual ?? 0;
  const unidad = insumo.unidad?.trim();
  const stockLabel = unidad ? `${stock} ${unidad}` : String(stock);
  return `${insumo.nombre} (${insumo.codigo}) · stock ${stockLabel}`;
}

export function PrestadorVisitaInsumosPicker({
  lines,
  onLinesChange,
  catalog,
  loadingCatalog,
  catalogError,
  disabled = false,
}: Props) {
  const updateLine = (id: string, patch: Partial<PrestadorVisitaInsumoLine>) => {
    onLinesChange(lines.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const removeLine = (id: string) => {
    onLinesChange(lines.filter((l) => l.id !== id));
  };

  const usedIds = new Set(
    lines.map((l) => l.insumoId).filter((id): id is number => id !== "")
  );

  return (
    <section className="rounded-2xl border border-medical-border bg-medical-card p-4 shadow-sm">
      <div className="mb-3 flex items-start gap-2">
        <Package className="mt-0.5 h-4 w-4 shrink-0 text-medical-primary" />
        <div>
          <h2 className="text-base font-semibold text-medical-text">Insumos utilizados</h2>
          <p className="text-xs text-medical-mutedText">
            Opcional. Se descuenta del stock al guardar la visita.
          </p>
        </div>
      </div>

      {loadingCatalog ? (
        <p className="flex items-center gap-2 text-sm text-medical-mutedText">
          <Loader2 className="h-4 w-4 animate-spin text-medical-primary" />
          Cargando insumos…
        </p>
      ) : null}

      {catalogError ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-medical-warning/35 bg-medical-warning/10 px-3 py-2 text-sm text-medical-text"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{catalogError}</p>
        </div>
      ) : null}

      {!loadingCatalog && !catalogError && catalog.length === 0 ? (
        <p className="rounded-xl border border-dashed border-medical-border px-3 py-3 text-sm text-medical-mutedText">
          No hay insumos activos en inventario.
        </p>
      ) : null}

      {!loadingCatalog && catalog.length > 0 ? (
        <div className="space-y-2">
          {lines.map((line) => {
            const selected = catalog.find((i) => i.id === line.insumoId);
            const maxStock = selected?.cantidad ?? selected?.stockActual;

            return (
              <div
                key={line.id}
                className="grid grid-cols-1 gap-2 rounded-xl border border-medical-border bg-medical-surface/50 p-3 sm:grid-cols-[1fr_7rem_auto]"
              >
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-medical-mutedText">
                    Insumo
                  </label>
                  <select
                    value={line.insumoId === "" ? "" : String(line.insumoId)}
                    onChange={(e) => {
                      const v = e.target.value;
                      updateLine(line.id, { insumoId: v === "" ? "" : Number(v) });
                    }}
                    disabled={disabled}
                    className="h-11 w-full rounded-xl border border-medical-border bg-white px-3 text-sm text-medical-text outline-none transition focus:border-medical-primary focus:ring-4 focus:ring-medical-primary/15 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <option value="">Seleccioná insumo</option>
                    {catalog.map((insumo) => {
                      const outOfStock = (insumo.cantidad ?? insumo.stockActual ?? 0) < 1;
                      const taken = usedIds.has(insumo.id) && line.insumoId !== insumo.id;
                      return (
                        <option
                          key={insumo.id}
                          value={insumo.id}
                          disabled={outOfStock || taken}
                        >
                          {formatInsumoOption(insumo)}
                          {outOfStock ? " — sin stock" : taken ? " — ya agregado" : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-medical-mutedText">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={maxStock != null ? maxStock : undefined}
                    step={1}
                    inputMode="numeric"
                    value={line.cantidad}
                    onChange={(e) => {
                      const raw = e.target.value;
                      updateLine(line.id, {
                        cantidad: raw === "" ? "" : Number.parseInt(raw, 10),
                      });
                    }}
                    disabled={disabled || line.insumoId === ""}
                    className="h-11 w-full rounded-xl border border-medical-border bg-white px-3 text-sm text-medical-text outline-none transition focus:border-medical-primary focus:ring-4 focus:ring-medical-primary/15 disabled:cursor-not-allowed disabled:bg-medical-secondary/40"
                  />
                </div>
                <div className="flex items-end sm:justify-end">
                  <button
                    type="button"
                    onClick={() => removeLine(line.id)}
                    disabled={disabled}
                    aria-label="Quitar insumo"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-medical-border text-medical-mutedText transition hover:border-medical-danger/40 hover:bg-medical-danger/10 hover:text-medical-danger disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}

          <button
            type="button"
            onClick={() => onLinesChange([...lines, createPrestadorVisitaInsumoLine()])}
            disabled={disabled || usedIds.size >= catalog.length}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-medical-primary/40 bg-medical-secondary/30 px-3 py-2.5 text-sm font-semibold text-medical-primary transition hover:bg-medical-secondary/60 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            Agregar insumo
          </button>
        </div>
      ) : null}
    </section>
  );
}
