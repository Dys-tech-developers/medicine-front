"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Banknote, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  SearchableSelect,
  type SearchableSelectOption,
} from "@/components/ui/searchable-select";

type TarifaServicioPickerDialogProps = {
  open: boolean;
  options: SearchableSelectOption[];
  onClose: () => void;
  onContinue: (servicioId: number) => void;
};

export function TarifaServicioPickerDialog({
  open,
  options,
  onClose,
  onContinue,
}: TarifaServicioPickerDialogProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setValue("");
    setError("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const handleContinue = () => {
    const id = Number(value);
    if (!Number.isFinite(id) || id <= 0) {
      setError("Seleccioná un servicio.");
      return;
    }
    onContinue(id);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tarifa-servicio-picker-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-pointer bg-medical-text/55 backdrop-blur-sm"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-medical-border bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-medical-border bg-medical-primary px-5 py-4">
          <div className="flex items-center gap-2 text-white">
            <Banknote className="size-5 shrink-0" />
            <h2 id="tarifa-servicio-picker-title" className="text-base font-semibold">
              Nueva tarifa
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="cursor-pointer text-white hover:bg-white/15 hover:text-white"
            onClick={onClose}
          >
            <X className="size-5" />
          </Button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <p className="text-sm text-medical-mutedText">
            Elegí el servicio al que querés agregar la tarifa.
          </p>

          <div>
            <Label className="mb-1.5 block text-sm font-medium">Servicio</Label>
            <SearchableSelect
              options={options}
              value={value}
              onChange={(v) => {
                setValue(v);
                setError("");
              }}
              placeholder="Buscar servicio…"
              searchPlaceholder="Nombre del servicio…"
              emptyMessage="No hay servicios"
            />
          </div>

          {error ? (
            <p className="text-sm text-medical-danger">{error}</p>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              type="button"
              className="cursor-pointer bg-medical-primary text-white hover:bg-medical-primaryDark"
              onClick={handleContinue}
            >
              Continuar
            </Button>
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={onClose}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
