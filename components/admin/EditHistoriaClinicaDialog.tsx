"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FileText, Loader2, Pencil, X } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { getApiErrorMessages } from "@/lib/api/format-api-error";
import { updateHistoriaClinicaWithApi } from "@/lib/api/historias-clinicas";
import type { HistoriaClinicaDto, UpdateHistoriaClinicaBody } from "@/lib/api/types";
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

function isoToDateInput(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function formFromHistoria(historia: HistoriaClinicaDto): FormState {
  return {
    fechaCreacion: isoToDateInput(historia.fechaCreacion),
    antecedentes: historia.antecedentes ?? "",
    diagnosticoInicial: historia.diagnosticoInicial ?? "",
    medicacion: historia.medicacion ?? "",
    alergias: historia.alergias ?? "",
    observaciones: historia.observaciones ?? "",
  };
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

function fieldValue(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function toPatchPayload(
  original: HistoriaClinicaDto,
  values: FormState
): UpdateHistoriaClinicaBody {
  const body: UpdateHistoriaClinicaBody = {};
  const fechaIso = dateInputToIso(values.fechaCreacion);
  if (fechaIso !== original.fechaCreacion) body.fechaCreacion = fechaIso;

  const antecedentes = values.antecedentes.trim();
  if (antecedentes !== fieldValue(original.antecedentes)) {
    body.antecedentes = antecedentes || null;
  }
  const diagnosticoInicial = values.diagnosticoInicial.trim();
  if (diagnosticoInicial !== fieldValue(original.diagnosticoInicial)) {
    body.diagnosticoInicial = diagnosticoInicial || null;
  }
  const medicacion = values.medicacion.trim();
  if (medicacion !== fieldValue(original.medicacion)) {
    body.medicacion = medicacion || null;
  }
  const alergias = values.alergias.trim();
  if (alergias !== fieldValue(original.alergias)) {
    body.alergias = alergias || null;
  }
  const observaciones = values.observaciones.trim();
  if (observaciones !== fieldValue(original.observaciones)) {
    body.observaciones = observaciones || null;
  }

  return body;
}

type EditHistoriaClinicaDialogProps = {
  open: boolean;
  historia: HistoriaClinicaDto | null;
  accessToken: string | null;
  onClose: () => void;
  onUpdated: (historia: HistoriaClinicaDto) => void;
};

export function EditHistoriaClinicaDialog({
  open,
  historia,
  accessToken,
  onClose,
  onUpdated,
}: EditHistoriaClinicaDialogProps) {
  const [values, setValues] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !historia) return;
    setValues(formFromHistoria(historia));
    setError("");
  }, [open, historia]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, loading, onClose]);

  if (!open || !historia || !values || !accessToken || typeof document === "undefined") {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateHistoriaForm(values);
    if (validationError) {
      setError(validationError);
      return;
    }

    const body = toPatchPayload(historia, values);
    if (Object.keys(body).length === 0) {
      onClose();
      return;
    }

    setLoading(true);
    setError("");
    const startedAt = Date.now();
    try {
      const updated = await updateHistoriaClinicaWithApi(accessToken, historia.id, body);
      await delayRemaining(DEFAULT_MIN_LOADING_MS, startedAt);
      onUpdated(updated);
      onClose();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? getApiErrorMessages(err).join(" ")
          : "No se pudo actualizar la historia clínica.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const nombre = getPacienteNombre(historia.paciente);
  const canSubmit = canSubmitHistoriaForm(values);
  const maxFechaCreacion = todayLocalDateInput();

  return createPortal(
    <div
      className="fixed inset-0 z-[125] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-historia-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-pointer bg-medical-text/55 backdrop-blur-sm"
        aria-label="Cerrar"
        onClick={() => !loading && onClose()}
      />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-medical-border bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-medical-border bg-medical-primary px-5 py-4">
          <div className="flex min-w-0 items-center gap-2 text-white">
            <Pencil className="size-5 shrink-0" />
            <div className="min-w-0">
              <h2 id="edit-historia-title" className="truncate text-base font-semibold">
                Editar historia clínica
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

        <form onSubmit={(e) => void handleSubmit(e)} className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center gap-3 px-6 py-14">
              <Loader2 className="size-10 animate-spin text-medical-primary" />
              <p className="text-sm text-medical-mutedText">Guardando cambios…</p>
            </div>
          ) : (
            <div className="space-y-4 px-5 py-5 sm:px-6">
              <p className="rounded-lg border border-medical-border/70 bg-medical-surface/50 px-3 py-2.5 text-xs leading-relaxed text-medical-mutedText">
                Modificá los datos iniciales de la historia. Debe quedar al menos un campo clínico
                completado.
              </p>
              <div>
                <Label htmlFor="edit-historia-fecha" className="mb-1.5 block text-sm font-medium">
                  Fecha de creación <span className="text-medical-danger">*</span>
                </Label>
                <input
                  id="edit-historia-fecha"
                  type="date"
                  value={values.fechaCreacion}
                  max={maxFechaCreacion}
                  onChange={(e) => {
                    setValues((v) => (v ? { ...v, fechaCreacion: e.target.value } : v));
                    setError("");
                  }}
                  className={inputClass}
                />
              </div>
              <div>
                <Label htmlFor="edit-historia-antecedentes" className="mb-1.5 block text-sm font-medium">
                  Antecedentes
                </Label>
                <textarea
                  id="edit-historia-antecedentes"
                  rows={2}
                  value={values.antecedentes}
                  onChange={(e) => {
                    setValues((v) => (v ? { ...v, antecedentes: e.target.value } : v));
                    setError("");
                  }}
                  placeholder="Hipertensión, cirugías previas…"
                  className={textareaClass}
                />
              </div>
              <div>
                <Label htmlFor="edit-historia-diagnostico" className="mb-1.5 block text-sm font-medium">
                  Diagnóstico inicial
                </Label>
                <textarea
                  id="edit-historia-diagnostico"
                  rows={2}
                  value={values.diagnosticoInicial}
                  onChange={(e) => {
                    setValues((v) => (v ? { ...v, diagnosticoInicial: e.target.value } : v));
                    setError("");
                  }}
                  placeholder="Control domiciliario…"
                  className={textareaClass}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="edit-historia-medicacion" className="mb-1.5 block text-sm font-medium">
                    Medicación
                  </Label>
                  <textarea
                    id="edit-historia-medicacion"
                    rows={2}
                    value={values.medicacion}
                    onChange={(e) => {
                      setValues((v) => (v ? { ...v, medicacion: e.target.value } : v));
                      setError("");
                    }}
                    placeholder="Enalapril 10mg…"
                    className={textareaClass}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-historia-alergias" className="mb-1.5 block text-sm font-medium">
                    Alergias
                  </Label>
                  <textarea
                    id="edit-historia-alergias"
                    rows={2}
                    value={values.alergias}
                    onChange={(e) => {
                      setValues((v) => (v ? { ...v, alergias: e.target.value } : v));
                      setError("");
                    }}
                    placeholder="Penicilina…"
                    className={textareaClass}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-historia-obs" className="mb-1.5 block text-sm font-medium">
                  Observaciones
                </Label>
                <textarea
                  id="edit-historia-obs"
                  rows={2}
                  value={values.observaciones}
                  onChange={(e) => {
                    setValues((v) => (v ? { ...v, observaciones: e.target.value } : v));
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
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!canSubmit}
                className="bg-medical-primary cursor-pointer text-white hover:bg-medical-primaryDark disabled:cursor-not-allowed disabled:opacity-50"
              >
                Guardar cambios
              </Button>
            </div>
          ) : null}
        </form>
      </div>
    </div>,
    document.body
  );
}
