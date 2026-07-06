"use client";

import { ChevronDown, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  expanded: boolean;
  onToggle: () => void;
  panelId: string;
  sectionLabel: string;
  activeFilters?: boolean;
  description?: string;
  summaryParts: string[];
  onClear?: () => void;
  clearDisabled?: boolean;
};

export function CollapsibleFiltersBar({
  expanded,
  onToggle,
  panelId,
  sectionLabel,
  activeFilters,
  description,
  summaryParts,
  onClear,
  clearDisabled,
}: Props) {
  const toggleLabel = expanded ? "Ocultar filtros" : "Mostrar filtros";

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        !expanded &&
          "rounded-xl border border-dashed border-medical-primary/25 bg-medical-secondary/25 px-3 py-3 transition-colors hover:border-medical-primary/40 hover:bg-medical-secondary/40"
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={panelId}
        aria-label={toggleLabel}
        className={cn(
          "flex min-w-0 cursor-pointer items-start gap-3 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-medical-primary/30",
          expanded ? "flex-1" : "w-full sm:flex-1"
        )}
      >
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-medical-secondary text-medical-primary ring-1 ring-medical-primary/10">
          <Filter className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-medical-text">{sectionLabel}</h2>
            {activeFilters ? (
              <span className="rounded-full bg-medical-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-medical-primary">
                Activos
              </span>
            ) : null}
          </div>
          {expanded ? (
            description ? (
              <p className="text-xs text-medical-mutedText">{description}</p>
            ) : null
          ) : (
            <>
              <p className="text-xs text-medical-mutedText">
                Tocá <span className="font-medium text-medical-primary">Mostrar filtros</span> para
                ajustar el listado.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {summaryParts.map((part) => (
                  <span
                    key={part}
                    className="inline-flex max-w-full items-center rounded-md border border-medical-border/70 bg-white/80 px-2 py-0.5 text-[11px] font-medium text-medical-text"
                  >
                    <span className="truncate">{part}</span>
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </button>

      <div className="flex shrink-0 items-center gap-2 self-end sm:self-start">
        {!expanded && activeFilters && onClear ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={clearDisabled}
            className="h-9 cursor-pointer border-medical-border/80 bg-white/80 px-3 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
          >
            <X className="mr-1 size-3.5" />
            Limpiar
          </Button>
        ) : null}
        <Button
          type="button"
          size="sm"
          variant={expanded ? "outline" : "default"}
          disabled={clearDisabled}
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={panelId}
          className={cn(
            "h-9 shrink-0 cursor-pointer gap-1.5 px-3.5 text-xs font-semibold shadow-sm",
            expanded
              ? "border-medical-border/80 bg-white text-medical-text hover:bg-medical-secondary/50"
              : "bg-medical-primary text-white hover:bg-medical-primaryDark"
          )}
        >
          {toggleLabel}
          <ChevronDown
            className={cn("size-3.5 transition-transform", expanded && "rotate-180")}
            aria-hidden
          />
        </Button>
      </div>
    </div>
  );
}
