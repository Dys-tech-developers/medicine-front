"use client";

import type { ServicioConTarifasDto } from "@/lib/api/types";
import { cn } from "@/lib/utils";

type Props = {
  servicios: ServicioConTarifasDto[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  disabled?: boolean;
  loading?: boolean;
  emptyMessage?: string;
};

export function PrestadorServiciosPicker({
  servicios,
  selectedIds,
  onChange,
  disabled = false,
  loading = false,
  emptyMessage = "No hay servicios activos en el catálogo.",
}: Props) {
  const selectedSet = new Set(selectedIds);

  const toggle = (id: number) => {
    if (disabled || loading) return;
    if (selectedSet.has(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  if (loading) {
    return <p className="text-sm text-medical-mutedText">Cargando servicios…</p>;
  }

  if (servicios.length === 0) {
    return <p className="text-sm text-medical-mutedText">{emptyMessage}</p>;
  }

  return (
    <ul className="max-h-48 space-y-2 overflow-y-auto rounded-xl border border-medical-border bg-medical-surface/50 p-2">
      {servicios.map((s) => {
        const checked = selectedSet.has(s.id);
        return (
          <li key={s.id}>
            <label
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition",
                checked
                  ? "border-medical-primary/35 bg-medical-secondary/60 text-medical-text"
                  : "border-transparent bg-white text-medical-text hover:bg-medical-secondary/30",
                (disabled || loading) && "cursor-not-allowed opacity-60"
              )}
            >
              <input
                type="checkbox"
                className="size-4 shrink-0 rounded border-medical-border text-medical-primary focus:ring-medical-primary/30"
                checked={checked}
                disabled={disabled || loading}
                onChange={() => toggle(s.id)}
              />
              <span className="min-w-0 flex-1 font-medium">{s.nombre}</span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
