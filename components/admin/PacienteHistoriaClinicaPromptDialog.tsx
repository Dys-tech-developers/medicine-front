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
  onDecline: () => void;
};

export function PacienteHistoriaClinicaPromptDialog({
  open,
  paciente,
  onConfirm,
  onDecline,
}: PacienteHistoriaClinicaPromptDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDecline();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onDecline]);

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
        className="absolute cursor-pointer inset-0 bg-medical-text/55 backdrop-blur-sm"
        aria-label="Cerrar"
        onClick={onDecline}
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
            className="text-white cursor-pointer hover:bg-white/15 hover:text-white"
            onClick={onDecline}
          >
            <X className="size-5" />
          </Button>
        </div>

        <div className="space-y-4 px-5 py-6 sm:px-6">
          <p id="historia-prompt-desc" className="text-sm leading-relaxed text-medical-text">
            El paciente fue registrado correctamente. ¿Desea crear una historia clínica para{" "}
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
            Cada paciente puede tener una única historia clínica asociada. Podrá completarla ahora
            o hacerlo más tarde desde el sistema.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-medical-border bg-medical-surface/80 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <Button type="button" variant="outline" className="sm:min-w-[120px] cursor-pointer" onClick={onDecline}>
            No, más tarde
          </Button>
          <Button
            type="button"
            className="bg-medical-primary text-white cursor-pointer hover:bg-medical-primaryDark sm:min-w-[140px]"
            onClick={onConfirm}
          >
            Sí, crear historia
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
