"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getPrestadorAccesoDenegadoContent,
  type PrestadorAccesoDenegadoRazon,
} from "@/lib/prestador-visitas";

type Props = {
  open: boolean;
  razon: PrestadorAccesoDenegadoRazon | null;
  onEscanearOtro: () => void;
  onCerrar: () => void;
};

export function PrestadorAccesoDenegadoDialog({
  open,
  razon,
  onEscanearOtro,
  onCerrar,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onCerrar]);

  if (!open || !razon || typeof document === "undefined") return null;

  const { title, description } = getPrestadorAccesoDenegadoContent(razon);

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="prestador-acceso-denegado-title"
      aria-describedby="prestador-acceso-denegado-desc"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-pointer bg-medical-text/55 backdrop-blur-sm"
        aria-label="Cerrar"
        onClick={onCerrar}
      />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-medical-border bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-medical-warning/35 bg-medical-warning/10 px-5 py-4">
          <div className="flex items-center gap-2 text-medical-text">
            <AlertTriangle className="size-5 shrink-0 text-medical-warning" />
            <h2 id="prestador-acceso-denegado-title" className="text-base font-semibold">
              {title}
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="cursor-pointer text-medical-mutedText hover:bg-medical-warning/10"
            onClick={onCerrar}
          >
            <X className="size-5" />
          </Button>
        </div>

        <div className="px-5 py-6 sm:px-6">
          <p
            id="prestador-acceso-denegado-desc"
            className="text-sm leading-relaxed text-medical-text"
          >
            {description}
          </p>
          <p className="mt-3 text-xs leading-relaxed text-medical-mutedText">
            Por privacidad no se muestran los datos del paciente. Podés escanear otro QR o descartar
            este escaneo.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-medical-border bg-medical-surface/80 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer sm:min-w-[120px]"
            onClick={onCerrar}
          >
            Descartar escaneo
          </Button>
          <Button
            type="button"
            className="cursor-pointer bg-medical-primary text-white hover:bg-medical-primaryDark sm:min-w-[160px]"
            onClick={onEscanearOtro}
          >
            <Camera className="size-4" />
            Escanear otro QR
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
