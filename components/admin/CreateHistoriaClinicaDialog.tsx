"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FileText, Loader2, X } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { getApiErrorMessages } from "@/lib/api/format-api-error";
import { createHistoriaClinicaWithApi } from "@/lib/api/historias-clinicas";
import type {
  CreateHistoriaClinicaBody,
  HistoriaClinicaDto,
  PacienteListItemDto,
} from "@/lib/api/types";
import {
  DEFAULT_MIN_LOADING_MS,
  delayRemaining,
} from "@/lib/loading/minimum-duration";
import { dateInputToIso, todayLocalDateInput } from "@/lib/date-input";
import { getPacienteNombre } from "@/lib/pacientes-display";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const inputClass =
  "h-11 w-full rounded-xl border border-medical-border bg-medical-surface/80 px-3.5 text-sm text-medical-text outline-none transition placeholder:text-medical-mutedText/60 focus:border-medical-primary focus:bg-medical-card focus:ring-4 focus:ring-medical-primary/12 disabled:cursor-not-allowed disabled:opacity-60";

const textareaClass =
  "w-full rounded-xl border border-medical-border bg-medical-surface/80 px-3.5 py-2.5 text-sm text-medical-text outline-none transition placeholder:text-medical-mutedText/60 focus:border-medical-primary focus:bg-medical-card focus:ring-4 focus:ring-medical-primary/12 disabled:cursor-not-allowed disabled:opacity-60";

type FormState = {
  fechaCreacion: string;
  antecedentes: string;
  diagnosticoInicial: string;
  medicacion: string;
  alergias: string;
  observaciones: string;
};

function emptyForm(): FormState {
  return {
    fechaCreacion: "",
    antecedentes: "",
    diagnosticoInicial: "",
    medicacion: "",
    alergias: "",
    observaciones: "",
  };
}

function toPayload(pacienteId: number, values: FormState): CreateHistoriaClinicaBody {
  const body: CreateHistoriaClinicaBody = {
    pacienteId,
    fechaCreacion: dateInputToIso(values.fechaCreacion),
  };
  const antecedentes = values.antecedentes.trim();
  const diagnosticoInicial = values.diagnosticoInicial.trim();
  const medicacion = values.medicacion.trim();
  const alergias = values.alergias.trim();
  const observaciones = values.observaciones.trim();
  if (antecedentes) body.antecedentes = antecedentes;
  if (diagnosticoInicial) body.diagnosticoInicial = diagnosticoInicial;
  if (medicacion) body.medicacion = medicacion;
  if (alergias) body.alergias = alergias;
  if (observaciones) body.observaciones = observaciones;
  return body;
}

function hasClinicalContent(values: FormState): boolean {
  return [
    values.antecedentes,
    values.diagnosticoInicial,
    values.medicacion,
    values.alergias,
    values.observaciones,
  ].some((field) => field.trim().length > 0);
}

function validateHistoriaForm(values: FormState): string | null {
  if (!values.fechaCreacion.trim()) return "La fecha de creación es obligatoria.";
  const hoy = todayLocalDateInput();
  if (values.fechaCreacion > hoy) {
    return "La fecha de creación no puede ser posterior a hoy.";
  }
  if (!hasClinicalContent(values)) {
    return "Completá al menos un dato clínico: antecedentes, diagnóstico, medicación, alergias u observaciones.";
  }
  return null;
}

function canSubmitHistoriaForm(values: FormState): boolean {
  if (!values.fechaCreacion.trim()) return false;
  if (values.fechaCreacion > todayLocalDateInput()) return false;
  return hasClinicalContent(values);
}

type CreateHistoriaClinicaDialogProps = {
  open: boolean;
  paciente: PacienteListItemDto | null;
  accessToken: string | null;
  onClose: () => void;
  onSuccess: (historia: HistoriaClinicaDto) => void;
  /** Etiqueta del botón secundario (ej. wizard post-alta). */
  cancelLabel?: string;
  /** Evita cerrar al hacer clic fuera (recomendado en wizard post-alta). */
  closeOnBackdrop?: boolean;
};

export function CreateHistoriaClinicaDialog({
  open,
  paciente,
  accessToken,
  onClose,
  onSuccess,
  cancelLabel = "Cancelar",
  closeOnBackdrop = true,
}: CreateHistoriaClinicaDialogProps) {
  const [values, setValues] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setValues(emptyForm());
      setError("");
    }
  }, [open, paciente?.id]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, loading, onClose]);

  if (!open || !paciente || !accessToken || typeof document === "undefined") return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateHistoriaForm(values);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");
    const startedAt = Date.now();
    try {
      const historia = await createHistoriaClinicaWithApi(
        accessToken,
        toPayload(paciente.id, values)
      );
      await delayRemaining(DEFAULT_MIN_LOADING_MS, startedAt);
      onSuccess(historia);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.status === 409
            ? "Este paciente ya tiene una historia clínica registrada."
            : getApiErrorMessages(err).join(" ")
          : "No se pudo crear la historia clínica.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const nombre = getPacienteNombre(paciente);
  const canSubmit = canSubmitHistoriaForm(values);
  const maxFechaCreacion = todayLocalDateInput();

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-historia-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-pointer bg-medical-text/55 backdrop-blur-sm"
        aria-label="Cerrar"
        onClick={() => {
          if (!loading && closeOnBackdrop) onClose();
        }}
      />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-medical-border bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-medical-border bg-medical-primary px-5 py-4">
          <div className="flex min-w-0 items-center gap-2 text-white">
            <FileText className="size-5 shrink-0" />
            <div className="min-w-0">
              <h2 id="create-historia-title" className="truncate text-base font-semibold">
                Nueva historia clínica
              </h2>
              <p className="truncate text-xs text-white/85">{nombre}</p>
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

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center gap-3 px-6 py-14">
              <Loader2 className="size-10 animate-spin text-medical-primary" />
              <p className="text-sm text-medical-mutedText">Registrando historia clínica…</p>
            </div>
          ) : (
            <div className="space-y-4 px-5 py-5 sm:px-6">
              <p className="rounded-lg border border-medical-border/70 bg-medical-surface/50 px-3 py-2.5 text-xs leading-relaxed text-medical-mutedText">
                La fecha de creación es obligatoria. Además, completá al menos uno de los campos
                clínicos para registrar la historia.
              </p>
              <div>
                <Label htmlFor="historia-fecha" className="mb-1.5 block text-sm font-medium">
                  Fecha de creación <span className="text-medical-danger">*</span>
                </Label>
                <input
                  id="historia-fecha"
                  type="date"
                  value={values.fechaCreacion}
                  max={maxFechaCreacion}
                  onChange={(e) => {
                    setValues((v) => ({ ...v, fechaCreacion: e.target.value }));
                    setError("");
                  }}
                  className={inputClass}
                />
              </div>
              <div>
                <Label htmlFor="historia-antecedentes" className="mb-1.5 block text-sm font-medium">
                  Antecedentes
                </Label>
                <textarea
                  id="historia-antecedentes"
                  rows={2}
                  value={values.antecedentes}
                  onChange={(e) => {
                    setValues((v) => ({ ...v, antecedentes: e.target.value }));
                    setError("");
                  }}
                  placeholder="Hipertensión, cirugías previas…"
                  className={textareaClass}
                />
              </div>
              <div>
                <Label htmlFor="historia-diagnostico" className="mb-1.5 block text-sm font-medium">
                  Diagnóstico inicial
                </Label>
                <textarea
                  id="historia-diagnostico"
                  rows={2}
                  value={values.diagnosticoInicial}
                  onChange={(e) => {
                    setValues((v) => ({ ...v, diagnosticoInicial: e.target.value }));
                    setError("");
                  }}
                  placeholder="Control domiciliario…"
                  className={textareaClass}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="historia-medicacion" className="mb-1.5 block text-sm font-medium">
                    Medicación
                  </Label>
                  <textarea
                    id="historia-medicacion"
                    rows={2}
                    value={values.medicacion}
                    onChange={(e) => {
                      setValues((v) => ({ ...v, medicacion: e.target.value }));
                      setError("");
                    }}
                    placeholder="Enalapril 10mg…"
                    className={textareaClass}
                  />
                </div>
                <div>
                  <Label htmlFor="historia-alergias" className="mb-1.5 block text-sm font-medium">
                    Alergias
                  </Label>
                  <textarea
                    id="historia-alergias"
                    rows={2}
                    value={values.alergias}
                    onChange={(e) => {
                      setValues((v) => ({ ...v, alergias: e.target.value }));
                      setError("");
                    }}
                    placeholder="Penicilina…"
                    className={textareaClass}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="historia-obs" className="mb-1.5 block text-sm font-medium">
                  Observaciones
                </Label>
                <textarea
                  id="historia-obs"
                  rows={2}
                  value={values.observaciones}
                  onChange={(e) => {
                    setValues((v) => ({ ...v, observaciones: e.target.value }));
                    setError("");
                  }}
                  className={textareaClass}
                />
              </div>
              {error ? (
                <p className="rounded-lg border border-medical-danger/30 bg-medical-danger/10 px-3 py-2 text-sm text-medical-danger">
                  {error}
                </p>
              ) : null}
            </div>
          )}

          {!loading ? (
            <div className="flex flex-col-reverse gap-2 border-t border-medical-border bg-medical-surface/80 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              <Button type="button" variant="outline" onClick={onClose} className="cursor-pointer">
                {cancelLabel}
              </Button>
              <Button
                type="submit"
                disabled={!canSubmit}
                className="bg-medical-primary cursor-pointer text-white hover:bg-medical-primaryDark disabled:cursor-not-allowed disabled:opacity-50"
              >
                Guardar historia
              </Button>
            </div>
          ) : null}
        </form>
      </div>
    </div>,
    document.body
  );
}
