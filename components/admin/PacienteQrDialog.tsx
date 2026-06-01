"use client";

import { useEffect, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, QrCode, X, Download } from "lucide-react";
import type { PacienteDto } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { PacienteCredencialCard } from "@/components/admin/PacienteCredencialCard";
import { downloadPacienteCredencialPdf } from "@/lib/paciente-credencial-pdf";

type PacienteQrDialogProps = {
  open: boolean;
  onClose: () => void;
  paciente: PacienteDto | null;
  loading: boolean;
  error: string;
};

export function PacienteQrDialog({
  open,
  onClose,
  paciente,
  loading,
  error,
}: PacienteQrDialogProps) {
  const [downloading, setDownloading] = useState(false);
  const [pdfError, setPdfError] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const handleDownloadPdf = useCallback(async () => {
    if (!paciente || downloading) return;
    setDownloading(true);
    setPdfError("");
    try {
      await downloadPacienteCredencialPdf(paciente);
    } catch (err) {
      setPdfError(
        err instanceof Error ? err.message : "No se pudo generar el PDF."
      );
    } finally {
      setDownloading(false);
    }
  }, [paciente, downloading]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="paciente-qr-dialog-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-pointer bg-medical-text/50 backdrop-blur-sm"
        aria-label="Cerrar"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-medical-border bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-linear-to-r from-medical-primary to-medical-primaryDark px-5 py-4">
          <div className="flex items-center gap-2 text-white">
            <QrCode className="size-5" />
            <h2
              id="paciente-qr-dialog-title"
              className="text-base font-semibold tracking-wide"
            >
              Credencial del Paciente
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

        <div className="px-6 py-6">
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-10 text-medical-mutedText">
              <Loader2 className="size-10 animate-spin text-medical-primary" />
              <p className="text-sm">Cargando credencial…</p>
            </div>
          ) : error ? (
            <p className="rounded-lg border border-medical-danger/30 bg-medical-danger/10 px-4 py-3 text-center text-sm text-medical-danger">
              {error}
            </p>
          ) : paciente ? (
            <div className="flex flex-col items-center gap-5">
              <PacienteCredencialCard paciente={paciente} />

              {pdfError ? (
                <p className="w-full rounded-lg border border-medical-danger/30 bg-medical-danger/10 px-3 py-2 text-center text-sm text-medical-danger">
                  {pdfError}
                </p>
              ) : null}

              <Button
                type="button"
                className="w-full gap-2 bg-medical-primary hover:bg-medical-primaryDark"
                onClick={handleDownloadPdf}
                disabled={downloading}
              >
                {downloading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}
                {downloading ? "Generando PDF…" : "Descargar PDF"}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
}
