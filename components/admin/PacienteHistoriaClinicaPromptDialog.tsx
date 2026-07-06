"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { FileText, X } from "lucide-react";
import type { PacienteDto } from "@/lib/api/types";
import { getPacienteNombre } from "@/lib/pacientes-display";
import { Button } from "@/components/ui/button";

type PacienteHistoriaClinicaPromptDialogProps = {
  open: boolean;
  paciente: PacienteDto | null;
  onConfirm: () => void;
  /** Siguiente paso opcional: asignar servicio sin crear historia ahora. */
  onContinueWithoutHistoria: () => void;
  /** Cierra el wizard completo (historia y servicios para más tarde). */
  onFinish: () => void;
};

export function PacienteHistoriaClinicaPromptDialog({
  open,
  paciente,
  onConfirm,
  onContinueWithoutHistoria,
  onFinish,
}: PacienteHistoriaClinicaPromptDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFinish();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onFinish]);

  if (!open || !paciente || typeof document === "undefined") return null;

  const nombre = getPacienteNombre(paciente);

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="historia-prompt-title"
      aria-describedby="historia-prompt-desc"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-pointer bg-medical-text/55 backdrop-blur-sm"
        aria-label="Cerrar"
        onClick={onFinish}
      />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-medical-border bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-medical-border bg-medical-primary px-5 py-4">
          <div className="flex items-center gap-2 text-white">
            <FileText className="size-5 shrink-0" />
            <h2 id="historia-prompt-title" className="text-base font-semibold">
              Historia clínica
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="cursor-pointer text-white hover:bg-white/15 hover:text-white"
            onClick={onFinish}
          >
            <X className="size-5" />
          </Button>
        </div>

        <div className="space-y-4 px-5 py-6 sm:px-6">
          <p id="historia-prompt-desc" className="text-sm leading-relaxed text-medical-text">
            El paciente fue registrado correctamente. ¿Querés crear la historia clínica de{" "}
            <span className="font-semibold text-medical-primary">{nombre}</span>
            {paciente.codigoQr ? (
              <>
                {" "}
                (<span className="font-mono text-xs">{paciente.codigoQr}</span>)
              </>
            ) : null}
            ?
          </p>
          <p className="text-xs text-medical-mutedText">
            Podés crearla ahora, pasar a asignar un servicio, o terminar y completar ambos pasos
            más tarde desde la ficha del paciente.
          </p>
        </div>

        <div className="flex flex-col gap-2 border-t border-medical-border bg-medical-surface/80 px-5 py-4 sm:px-6">
          <Button
            type="button"
            className="w-full cursor-pointer bg-medical-primary text-white hover:bg-medical-primaryDark"
            onClick={onConfirm}
          >
            Sí, crear historia
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full cursor-pointer"
            onClick={onContinueWithoutHistoria}
          >
            Continuar sin historia
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full cursor-pointer text-medical-mutedText"
            onClick={onFinish}
          >
            Terminar por ahora
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
