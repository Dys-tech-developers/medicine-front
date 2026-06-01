"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ClipboardPlus, Loader2, X } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { getApiErrorMessages } from "@/lib/api/format-api-error";
import { createEvolucionClinicaWithApi } from "@/lib/api/historias-clinicas";
import type { HistoriaClinicaEvolucionDto } from "@/lib/api/types";
import {
  DEFAULT_MIN_LOADING_MS,
  delayRemaining,
} from "@/lib/loading/minimum-duration";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const inputClass =
  "h-11 w-full rounded-xl border border-medical-border bg-medical-surface/80 px-3.5 text-sm text-medical-text outline-none transition placeholder:text-medical-mutedText/60 focus:border-medical-primary focus:bg-medical-card focus:ring-4 focus:ring-medical-primary/12 disabled:cursor-not-allowed disabled:opacity-60";

const textareaClass =
  "w-full rounded-xl border border-medical-border bg-medical-surface/80 px-3.5 py-2.5 text-sm text-medical-text outline-none transition placeholder:text-medical-mutedText/60 focus:border-medical-primary focus:bg-medical-card focus:ring-4 focus:ring-medical-primary/12 disabled:cursor-not-allowed disabled:opacity-60";

function nowDatetimeLocalValue(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function datetimeLocalToIso(value: string): string {
  if (!value.trim()) return new Date().toISOString();
  return new Date(value).toISOString();
}

type FormState = {
  fecha: string;
  observaciones: string;
  medicacion: string;
};

function emptyForm(): FormState {
  return {
    fecha: nowDatetimeLocalValue(),
    observaciones: "",
    medicacion: "",
  };
}

type CreateEvolucionClinicaDialogProps = {
  open: boolean;
  historiaClinicaId: number | null;
  pacienteLabel: string;
  accessToken: string | null;
  onClose: () => void;
  onSuccess: (evolucion: HistoriaClinicaEvolucionDto) => void;
};

export function CreateEvolucionClinicaDialog({
  open,
  historiaClinicaId,
  pacienteLabel,
  accessToken,
  onClose,
  onSuccess,
}: CreateEvolucionClinicaDialogProps) {
  const [values, setValues] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setValues(emptyForm());
      setError("");
    }
  }, [open, historiaClinicaId]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, loading, onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken || historiaClinicaId == null) return;

    const observaciones = values.observaciones.trim();
    const medicacion = values.medicacion.trim();
    if (!observaciones && !medicacion) {
      setError("Completá al menos observaciones o medicación.");
      return;
    }

    setLoading(true);
    setError("");
    const started = Date.now();

    try {
      const evolucion = await createEvolucionClinicaWithApi(accessToken, {
        historiaClinicaId,
        fecha: datetimeLocalToIso(values.fecha),
        ...(observaciones ? { observaciones } : {}),
        ...(medicacion ? { medicacion } : {}),
      });
      await delayRemaining(started, DEFAULT_MIN_LOADING_MS);
      onSuccess(evolucion);
      onClose();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? getApiErrorMessages(err).join(" ")
          : "No se pudo registrar la evolución.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  if (!open || historiaClinicaId == null || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="evolucion-create-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-pointer bg-medical-text/60 backdrop-blur-[2px]"
        aria-label="Cerrar"
        onClick={() => !loading && onClose()}
      />
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="relative z-10 flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-medical-border bg-white shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-medical-border bg-medical-primary px-5 py-4">
          <div className="flex min-w-0 items-center gap-2 text-white">
            <ClipboardPlus className="size-5 shrink-0" />
            <div className="min-w-0">
              <h2 id="evolucion-create-title" className="text-base font-semibold">
                Agregar evolución clínica
              </h2>
              <p className="truncate text-xs text-white/85">{pacienteLabel}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 cursor-pointer text-white hover:bg-white/15 hover:text-white"
            onClick={onClose}
            disabled={loading}
          >
            <X className="size-5" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
          {error ? (
            <p className="rounded-lg border border-medical-danger/30 bg-medical-danger/10 px-4 py-3 text-sm text-medical-danger">
              {error}
            </p>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="evolucion-fecha">Fecha y hora</Label>
            <input
              id="evolucion-fecha"
              type="datetime-local"
              className={inputClass}
              value={values.fecha}
              onChange={(e) => setValues((v) => ({ ...v, fecha: e.target.value }))}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="evolucion-observaciones">Observaciones</Label>
            <textarea
              id="evolucion-observaciones"
              rows={4}
              className={textareaClass}
              placeholder="Evolución del cuadro, signos vitales, indicaciones…"
              value={values.observaciones}
              onChange={(e) => setValues((v) => ({ ...v, observaciones: e.target.value }))}
              disabled={loading}
            />
            <p className="text-xs text-medical-mutedText">
              Al menos observaciones o medicación deben completarse.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="evolucion-medicacion">Medicación (opcional)</Label>
            <textarea
              id="evolucion-medicacion"
              rows={2}
              className={textareaClass}
              placeholder="Cambios o continuidad del tratamiento"
              value={values.medicacion}
              onChange={(e) => setValues((v) => ({ ...v, medicacion: e.target.value }))}
              disabled={loading}
            />
          </div>
        </div>

        <div className="flex gap-2 border-t border-medical-border bg-medical-surface/80 px-5 py-4 sm:px-6">
          <Button
            type="button"
            variant="outline"
            className="flex-1 cursor-pointer"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" className="flex-1 cursor-pointer" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Guardando…
              </>
            ) : (
              "Registrar evolución"
            )}
          </Button>
        </div>
      </form>
    </div>,
    document.body
  );
}
