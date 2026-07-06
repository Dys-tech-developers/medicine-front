"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PrestadorListItemDto } from "@/lib/api/types";
import { formatPrestadorSelectLabel } from "@/lib/prestadores-display";
import { cn } from "@/lib/utils";

const SIN_PRESTADOR_VALUE = "__sin_prestador__";

const inputClass =
  "h-11 w-full rounded-xl border border-medical-border bg-medical-surface/80 px-3.5 text-sm text-medical-text outline-none transition placeholder:text-medical-mutedText/60 focus:border-medical-primary focus:bg-medical-card focus:ring-4 focus:ring-medical-primary/12 disabled:cursor-not-allowed disabled:opacity-60";

type Props = {
  prestadores: PrestadorListItemDto[];
  multiple: boolean;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  loading?: boolean;
  id?: string;
};

export function PrestadoresAsignacionPicker({
  prestadores,
  multiple,
  selectedIds,
  onChange,
  disabled = false,
  loading = false,
  id = "asign-prestador",
}: Props) {
  if (loading) {
    return <p className="text-sm text-medical-mutedText">Cargando prestadores…</p>;
  }

  if (!multiple) {
    const value = selectedIds[0] ?? SIN_PRESTADOR_VALUE;
    return (
      <Select
        value={value}
        onValueChange={(v) => {
          onChange(v === SIN_PRESTADOR_VALUE ? [] : [v]);
        }}
        disabled={disabled}
      >
        <SelectTrigger id={id} className={inputClass}>
          <SelectValue placeholder="Sin prestador asignado" />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value={SIN_PRESTADOR_VALUE}>Sin prestador asignado</SelectItem>
          {prestadores.map((p) => (
            <SelectItem key={p.id} value={String(p.id)}>
              {formatPrestadorSelectLabel(p)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  const toggle = (prestadorId: string) => {
    onChange(
      selectedIds.includes(prestadorId)
        ? selectedIds.filter((id) => id !== prestadorId)
        : [...selectedIds, prestadorId]
    );
  };

  return (
    <div
      className={cn(
        "max-h-52 space-y-1 overflow-y-auto rounded-xl border border-medical-border bg-white p-2",
        disabled && "pointer-events-none opacity-60"
      )}
      role="group"
      aria-labelledby={`${id}-label`}
    >
      {prestadores.length === 0 ? (
        <p className="px-2 py-2 text-sm text-medical-mutedText">No hay prestadores disponibles.</p>
      ) : (
        prestadores.map((p) => {
          const pid = String(p.id);
          const checked = selectedIds.includes(pid);
          return (
            <label
              key={p.id}
              className={cn(
                "flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-2 transition hover:bg-medical-surface/80",
                checked && "bg-medical-secondary/40"
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(pid)}
                disabled={disabled}
                className="mt-0.5 h-4 w-4 shrink-0 accent-medical-primary"
              />
              <span className="min-w-0 text-sm text-medical-text">{formatPrestadorSelectLabel(p)}</span>
            </label>
          );
        })
      )}
      {selectedIds.length > 0 ? (
        <p className="border-t border-medical-border/60 px-2 pt-2 text-xs text-medical-mutedText">
          {selectedIds.length} prestador{selectedIds.length === 1 ? "" : "es"} seleccionado
          {selectedIds.length === 1 ? "" : "s"}
        </p>
      ) : null}
    </div>
  );
}

export function PrestadoresAsignacionField({
  prestadores,
  multiple,
  selectedIds,
  onChange,
  disabled,
  loading,
  id,
}: Props) {
  return (
    <div>
      <Label id={`${id ?? "asign-prestador"}-label`} className="mb-1.5 block text-sm font-medium">
        {multiple ? "Prestadores" : "Prestador"}
      </Label>
      <p className="mb-2 text-xs text-medical-mutedText">
        {multiple
          ? "Seleccioná dos o más prestadores habilitados para el relevamiento."
          : "Opcional. Sin prestador asignado, cualquier profesional habilitado para el servicio puede atender al paciente."}
      </p>
      <PrestadoresAsignacionPicker
        id={id}
        prestadores={prestadores}
        multiple={multiple}
        selectedIds={selectedIds}
        onChange={onChange}
        disabled={disabled}
        loading={loading}
      />
    </div>
  );
}
