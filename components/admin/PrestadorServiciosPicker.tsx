"use client";

import type { ServicioConTarifasDto } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  servicios: ServicioConTarifasDto[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  disabled?: boolean;
  loading?: boolean;
  emptyMessage?: string;
};

function PrestadorServiciosPickerSkeleton() {
  return (
    <ul
      className="space-y-2 rounded-xl border border-medical-border bg-medical-surface/50 p-2"
      aria-busy="true"
      aria-label="Cargando servicios"
    >
      {["w-2/5", "w-3/5", "w-1/2", "w-7/12", "w-1/3"].map((widthClass, i) => (
        <li
          key={i}
          className="flex items-center gap-3 rounded-lg border border-transparent bg-white px-3 py-2.5"
        >
          <Skeleton className="size-4 shrink-0 rounded" />
          <Skeleton className={cn("h-4 rounded-md", widthClass)} />
        </li>
      ))}
    </ul>
  );
}

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
    return <PrestadorServiciosPickerSkeleton />;
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
