"use client";

import { ChevronDown, Pencil, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ServicioTarifaDto } from "@/lib/api/types";
import {
  formatTarifaContexto,
  formatTarifaValor,
  formatTarifasResumenValores,
} from "@/lib/servicios-display";
import { cn } from "@/lib/utils";

const MOBILE_PREVIEW_MAX = 2;

type ServicioTarifasCellProps = {
  servicioNombre: string;
  tarifas: ServicioTarifaDto[];
  disabled?: boolean;
  /** Vista compacta para la columna del nombre en móvil. */
  variant?: "table" | "inline";
  onEditTarifa: (tarifaId: number) => void;
  onAddTarifa: () => void;
  onManageServicio?: () => void;
};

export function ServicioTarifasCell({
  servicioNombre,
  tarifas,
  disabled = false,
  variant = "table",
  onEditTarifa,
  onAddTarifa,
  onManageServicio,
}: ServicioTarifasCellProps) {
  const count = tarifas.length;
  const resumenValores = formatTarifasResumenValores(tarifas);

  if (count === 0) {
    return (
      <div
        className={cn(
          "flex flex-wrap items-center gap-2",
          variant === "inline" && "mt-2 md:hidden"
        )}
      >
        <span className="text-sm text-medical-mutedText">Sin tarifas</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className="h-8 cursor-pointer border-medical-primary/25 text-xs font-medium text-medical-primary hover:bg-medical-secondary"
          onClick={onAddTarifa}
        >
          <Plus className="size-3.5" />
          Agregar
        </Button>
      </div>
    );
  }

  const countLabel = count === 1 ? "1 tarifa" : `${count} tarifas`;

  if (variant === "inline") {
    const preview = tarifas.slice(0, MOBILE_PREVIEW_MAX);
    const rest = count - preview.length;
    return (
      <div className="mt-2 flex flex-wrap items-center gap-1.5 md:hidden">
        {preview.map((tarifa) => (
          <Badge
            key={tarifa.id}
            variant="outline"
            className="max-w-[9rem] truncate border-medical-primary/20 bg-medical-secondary/60 text-xs font-medium text-medical-primaryDark"
            title={formatTarifaContexto(tarifa)}
          >
            {formatTarifaValor(tarifa.valor)}
          </Badge>
        ))}
        {rest > 0 ? (
          <TarifasDropdown
            servicioNombre={servicioNombre}
            tarifas={tarifas}
            disabled={disabled}
            triggerLabel={`+${rest}`}
            onEditTarifa={onEditTarifa}
            onAddTarifa={onAddTarifa}
            onManageServicio={onManageServicio}
          />
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            className="h-7 cursor-pointer px-2 text-xs text-medical-primary"
            onClick={onAddTarifa}
            title="Agregar tarifa"
          >
            <Plus className="size-3.5" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex max-w-[220px] flex-col gap-1.5">
      <div className="flex min-w-0 items-center gap-1.5">
        <Badge
          variant="outline"
          className="shrink-0 border-medical-primary/25 bg-medical-secondary/70 text-[11px] font-semibold text-medical-primaryDark"
        >
          {countLabel}
        </Badge>
        <span
          className="min-w-0 truncate text-xs font-medium text-medical-text"
          title={resumenValores}
        >
          {resumenValores}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-1">
        <TarifasDropdown
          servicioNombre={servicioNombre}
          tarifas={tarifas}
          disabled={disabled}
          onEditTarifa={onEditTarifa}
          onAddTarifa={onAddTarifa}
          onManageServicio={onManageServicio}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className="h-8 cursor-pointer border-medical-primary/25 px-2 text-medical-primary hover:bg-medical-secondary"
          title="Agregar tarifa"
          onClick={onAddTarifa}
        >
          <Plus className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

function TarifasDropdown({
  servicioNombre,
  tarifas,
  disabled,
  triggerLabel,
  onEditTarifa,
  onAddTarifa,
  onManageServicio,
}: {
  servicioNombre: string;
  tarifas: ServicioTarifaDto[];
  disabled?: boolean;
  triggerLabel?: string;
  onEditTarifa: (tarifaId: number) => void;
  onAddTarifa: () => void;
  onManageServicio?: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className="h-8 cursor-pointer gap-1 border-medical-border px-2.5 text-xs font-medium text-medical-text hover:bg-medical-secondary"
        >
          {triggerLabel ?? "Ver tarifas"}
          <ChevronDown className="size-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="z-[120] w-[min(20rem,calc(100vw-2rem))] border-medical-border bg-white p-1 shadow-lg"
      >
        <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold text-medical-text">
          Tarifas · {servicioNombre}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-medical-border" />
        <div className="max-h-56 overflow-y-auto">
          {tarifas.map((tarifa) => (
            <DropdownMenuItem
              key={tarifa.id}
              disabled={disabled}
              className="cursor-pointer flex-col items-start gap-0.5 rounded-lg px-2 py-2 focus:bg-medical-secondary"
              onSelect={() => onEditTarifa(tarifa.id)}
            >
              <span className="flex w-full items-center justify-between gap-2">
                <span className="font-semibold text-medical-text">
                  {formatTarifaValor(tarifa.valor)}
                </span>
                <Pencil className="size-3.5 shrink-0 text-medical-primary" />
              </span>
              <span className="text-[11px] leading-snug text-medical-mutedText">
                {formatTarifaContexto(tarifa)}
              </span>
            </DropdownMenuItem>
          ))}
        </div>
        <DropdownMenuSeparator className="bg-medical-border" />
        <DropdownMenuItem
          disabled={disabled}
          className="cursor-pointer gap-2 text-medical-primary focus:bg-medical-secondary focus:text-medical-primary"
          onSelect={onAddTarifa}
        >
          <Plus className="size-3.5" />
          Agregar tarifa
        </DropdownMenuItem>
        {onManageServicio ? (
          <DropdownMenuItem
            disabled={disabled}
            className="cursor-pointer text-medical-mutedText focus:bg-medical-secondary"
            onSelect={onManageServicio}
          >
            Editar servicio completo
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
