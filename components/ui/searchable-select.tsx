"use client";

import * as React from "react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { Check, ChevronsUpDown, Loader2, Search, X } from "lucide-react";

import { cn } from "@/lib/utils";

export type SearchableSelectOption = {
  value: string;
  label: string;
  /** Texto secundario opcional; también se incluye en la búsqueda. */
  description?: string;
};

/** Normaliza para búsquedas sin acentos ni mayúsculas (ej. "Á" -> "a"). */
function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const triggerBaseClass =
  "flex h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-medical-border bg-medical-surface/80 px-3.5 text-sm text-medical-text outline-none transition focus-visible:border-medical-primary focus-visible:bg-medical-card focus-visible:ring-4 focus-visible:ring-medical-primary/12 data-[state=open]:border-medical-primary data-[state=open]:bg-medical-card data-[state=open]:ring-4 data-[state=open]:ring-medical-primary/12 disabled:cursor-not-allowed disabled:opacity-60";

type SearchableSelectProps = {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  loading?: boolean;
  /** Permite limpiar la selección desde el listado. */
  clearable?: boolean;
  triggerClassName?: string;
};

export function SearchableSelect({
  options,
  value,
  onChange,
  id,
  placeholder = "Seleccioná una opción",
  searchPlaceholder = "Buscar…",
  emptyMessage = "Sin resultados",
  disabled = false,
  loading = false,
  clearable = false,
  triggerClassName,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const listRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value) ?? null;

  const filtered = React.useMemo(() => {
    const q = normalizeText(query);
    if (!q) return options;
    return options.filter((o) =>
      normalizeText(`${o.label} ${o.description ?? ""}`).includes(q)
    );
  }, [options, query]);

  React.useEffect(() => {
    if (open) setActiveIndex(0);
  }, [query, open]);

  React.useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const node = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${activeIndex}"]`
    );
    node?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  function commit(optionValue: string) {
    onChange(optionValue);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = filtered[activeIndex];
      if (opt) commit(opt.value);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveIndex(filtered.length - 1);
    }
  }

  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (disabled || loading) return;
        setOpen(next);
      }}
    >
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled || loading}
          aria-haspopup="listbox"
          className={cn(triggerBaseClass, triggerClassName)}
        >
          <span
            className={cn(
              "min-w-0 flex-1 truncate text-left",
              !selected && "text-medical-mutedText/70"
            )}
          >
            {loading ? "Cargando…" : selected ? selected.label : placeholder}
          </span>
          {loading ? (
            <Loader2 className="size-4 shrink-0 animate-spin text-medical-mutedText" />
          ) : (
            <ChevronsUpDown className="size-4 shrink-0 text-medical-mutedText" />
          )}
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={6}
          className="z-[300] w-(--radix-popover-trigger-width) overflow-hidden rounded-xl border border-medical-border bg-white shadow-xl shadow-medical-text/10 outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
        >
          <div className="flex items-center gap-2 border-b border-medical-border/70 px-3">
            <Search className="size-4 shrink-0 text-medical-mutedText" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="h-11 w-full bg-transparent text-sm text-medical-text outline-none placeholder:text-medical-mutedText/60"
            />
            {query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                aria-label="Limpiar búsqueda"
                className="shrink-0 cursor-pointer rounded-md p-1 text-medical-mutedText transition hover:bg-medical-secondary hover:text-medical-text"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>

          <div
            ref={listRef}
            role="listbox"
            className="max-h-64 overflow-y-auto overscroll-contain p-1"
          >
            {filtered.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-medical-mutedText">
                {emptyMessage}
              </p>
            ) : (
              <>
                {clearable && selected ? (
                  <button
                    type="button"
                    onClick={() => commit("")}
                    className="mb-1 flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-medical-mutedText transition hover:bg-medical-secondary"
                  >
                    <X className="size-4 shrink-0" />
                    Quitar selección
                  </button>
                ) : null}
                {filtered.map((opt, index) => {
                  const isSelected = opt.value === value;
                  const isActive = index === activeIndex;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      data-index={index}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => commit(opt.value)}
                      onMouseMove={() => setActiveIndex(index)}
                      className={cn(
                        "flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition",
                        isActive
                          ? "bg-medical-primary/10 text-medical-text"
                          : "text-medical-text"
                      )}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{opt.label}</span>
                        {opt.description ? (
                          <span className="block truncate text-xs text-medical-mutedText">
                            {opt.description}
                          </span>
                        ) : null}
                      </span>
                      {isSelected ? (
                        <Check className="size-4 shrink-0 text-medical-primary" />
                      ) : null}
                    </button>
                  );
                })}
              </>
            )}
          </div>

          {filtered.length > 0 ? (
            <div className="border-t border-medical-border/60 px-3 py-1.5 text-right text-[11px] text-medical-mutedText">
              {filtered.length}
              {filtered.length === 1 ? " resultado" : " resultados"}
            </div>
          ) : null}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
