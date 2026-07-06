"use client";

import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ObraSocialListItemDto } from "@/lib/api/types";
import {
  DEFAULT_PACIENTES_DIRECTORY_FILTERS,
  hasActivePacientesDirectoryFilters,
  type PacientesDirectoryFiltersState,
} from "@/lib/pacientes-directory-filters";
import { formatPacienteSexo } from "@/lib/pacientes-display";
import { cn } from "@/lib/utils";

const selectTriggerClass =
  "h-10 min-h-10 border-medical-border/80 bg-background text-sm shadow-sm [&_[data-slot=select-value]]:line-clamp-none [&_[data-slot=select-value]]:whitespace-normal [&_[data-slot=select-value]]:text-left";

const selectContentClass =
  "z-[200] min-w-[var(--radix-select-trigger-width)] max-w-[min(20rem,92vw)]";

const selectItemClass = "whitespace-normal py-2 leading-snug";

const SEXO_OPTIONS: { value: PacientesDirectoryFiltersState["sexo"]; label: string }[] = [
  { value: "all", label: "Sexo: todos" },
  { value: "M", label: formatPacienteSexo("M") },
  { value: "F", label: formatPacienteSexo("F") },
  { value: "X", label: formatPacienteSexo("X") },
];

type Props = {
  filters: PacientesDirectoryFiltersState;
  onChange: (next: PacientesDirectoryFiltersState) => void;
  obrasSociales: ObraSocialListItemDto[];
  loadingOptions?: boolean;
  className?: string;
};

export function PacientesDirectoryFilters({
  filters,
  onChange,
  obrasSociales,
  loadingOptions,
  className,
}: Props) {
  const set = (patch: Partial<PacientesDirectoryFiltersState>) => {
    onChange({ ...filters, ...patch });
  };

  const hasActive = hasActivePacientesDirectoryFilters(filters);

  return (
    <div
      className={cn("flex flex-wrap items-center gap-2", className)}
      role="group"
      aria-label="Filtros de pacientes"
    >
      <Select
        value={filters.obraSocialId}
        onValueChange={(v) => set({ obraSocialId: v })}
        disabled={loadingOptions}
      >
        <SelectTrigger
          aria-label="Filtrar por obra social"
          className={cn(
            selectTriggerClass,
            "h-auto min-w-[9.5rem] max-w-[min(16rem,42vw)] w-auto shrink-0 py-2"
          )}
        >
          {loadingOptions ? (
            <Loader2 className="size-3.5 shrink-0 animate-spin text-medical-mutedText" />
          ) : null}
          <SelectValue placeholder="Obra social" />
        </SelectTrigger>
        <SelectContent position="popper" className={selectContentClass}>
          <SelectItem value="all" className={selectItemClass}>
            Todas las obras
          </SelectItem>
          <SelectItem value="none" className={selectItemClass}>
            Sin obra social
          </SelectItem>
          {obrasSociales.map((o) => (
            <SelectItem key={o.id} value={String(o.id)} className={selectItemClass}>
              {o.codigo ? `${o.nombre} (${o.codigo})` : o.nombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.sexo}
        onValueChange={(v) => set({ sexo: v as PacientesDirectoryFiltersState["sexo"] })}
      >
        <SelectTrigger
          aria-label="Filtrar por sexo"
          className={cn(
            selectTriggerClass,
            "h-auto min-w-[8rem] max-w-[12rem] w-auto shrink-0 py-2"
          )}
        >
          <SelectValue placeholder="Sexo" />
        </SelectTrigger>
        <SelectContent position="popper" className={selectContentClass}>
          {SEXO_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value} className={selectItemClass}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActive ? (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-9 cursor-pointer px-2 text-medical-mutedText hover:text-medical-text"
          onClick={() => onChange({ ...DEFAULT_PACIENTES_DIRECTORY_FILTERS })}
          aria-label="Limpiar filtros"
        >
          <X className="size-3.5" />
          <span className="hidden sm:inline">Limpiar</span>
        </Button>
      ) : null}
    </div>
  );
}
