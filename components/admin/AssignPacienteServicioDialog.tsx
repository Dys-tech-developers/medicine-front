"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Layers, Loader2, Plus, X } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { getApiErrorMessages } from "@/lib/api/format-api-error";
import { createPacienteServicioWithApi } from "@/lib/api/paciente-servicios";
import { listServiciosWithApi } from "@/lib/api/servicios";
import type {
  CreatePacienteServicioBody,
  FrecuenciaTipo,
  ModalidadCobro,
  PacienteListItemDto,
  PacienteServicioDto,
  PacienteServicioEstado,
  ServicioConTarifasDto,
} from "@/lib/api/types";
import {
  DEFAULT_MIN_LOADING_MS,
  delayRemaining,
} from "@/lib/loading/minimum-duration";
import {
  ASIGNACION_ESTADO_LABELS,
  ASIGNACION_ESTADOS,
  FRECUENCIA_TIPO_LABELS,
  FRECUENCIA_TIPOS,
  MODALIDAD_COBRO_LABELS,
  MODALIDADES_COBRO,
} from "@/lib/paciente-servicios-labels";
import { getPacienteNombre } from "@/lib/pacientes-display";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { medicalSuccessBox } from "@/lib/medical-ui-classes";
import { cn } from "@/lib/utils";

const inputClass =
  "h-11 w-full rounded-xl border border-medical-border bg-medical-surface/80 px-3.5 text-sm text-medical-text outline-none transition placeholder:text-medical-mutedText/60 focus:border-medical-primary focus:bg-medical-card focus:ring-4 focus:ring-medical-primary/12 disabled:cursor-not-allowed disabled:opacity-60";

function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

function dateInputToIso(date: string): string {
  return new Date(`${date}T12:00:00.000Z`).toISOString();
}

type FormState = {
  servicioId: string;
  fechaInicio: string;
  fechaFin: string;
  frecuenciaTipo: FrecuenciaTipo;
  frecuenciaValor: string;
  modalidadCobro: ModalidadCobro;
  estado: PacienteServicioEstado;
};

function emptyForm(): FormState {
  return {
    servicioId: "",
    fechaInicio: todayInputValue(),
    fechaFin: "",
    frecuenciaTipo: "semanal",
    frecuenciaValor: "1",
    modalidadCobro: "por_hora",
    estado: "activa",
  };
}

function validateForm(values: FormState): string | null {
  if (!values.servicioId) return "Seleccioná un servicio.";
  if (!values.fechaInicio) return "La fecha de inicio es obligatoria.";
  const freq = Number(values.frecuenciaValor);
  if (!Number.isFinite(freq) || freq < 1 || !Number.isInteger(freq)) {
    return "La frecuencia debe ser un número entero mayor a 0.";
  }
  if (values.fechaFin && values.fechaFin < values.fechaInicio) {
    return "La fecha de fin no puede ser anterior al inicio.";
  }
  return null;
}

function toPayload(pacienteId: number, values: FormState): CreatePacienteServicioBody {
  const fin = values.fechaFin.trim();
  const frecuenciaValor = Number(values.frecuenciaValor);
  return {
    pacienteId,
    servicioId: Number(values.servicioId),
    fechaInicio: dateInputToIso(values.fechaInicio),
    fechaFin: fin ? dateInputToIso(fin) : null,
    periodoControl: values.frecuenciaTipo,
    cantidadPermitida: frecuenciaValor,
    // Compatibilidad con backends que todavía lean `frecuenciaTipo`.
    frecuenciaTipo: values.frecuenciaTipo,
    frecuenciaValor,
    modalidadCobro: values.modalidadCobro,
    estado: values.estado,
  };
}

type AssignPacienteServicioDialogProps = {
  open: boolean;
  paciente: PacienteListItemDto | null;
  accessToken: string | null;
  onFinish: () => void;
  onAssigned: (asignacion: PacienteServicioDto) => void;
  /** Texto del botón para cerrar sin más asignaciones (flujo post-alta de paciente). */
  dismissLabel?: string;
};

export function AssignPacienteServicioDialog({
  open,
  paciente,
  accessToken,
  onFinish,
  onAssigned,
  dismissLabel = "Omitir por ahora",
}: AssignPacienteServicioDialogProps) {
  const [values, setValues] = useState<FormState>(emptyForm);
  const [servicios, setServicios] = useState<ServicioConTarifasDto[]>([]);
  const [loadingServicios, setLoadingServicios] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [assignedNames, setAssignedNames] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setValues(emptyForm());
    setError("");
    setAssignedNames([]);
  }, [open, paciente?.id]);

  useEffect(() => {
    if (!open || !accessToken) return;
    let cancelled = false;
    setLoadingServicios(true);
    listServiciosWithApi(accessToken, { page: 1, pageSize: 100, estado: true })
      .then((data) => {
        if (!cancelled) setServicios(data.items.filter((s) => s.estado));
      })
      .catch(() => {
        if (!cancelled) setError("No se pudieron cargar los servicios activos.");
      })
      .finally(() => {
        if (!cancelled) setLoadingServicios(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, accessToken]);

  useEffect(() => {
    if (!open || submitting) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFinish();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, submitting, onFinish]);

  const servicioOptions = useMemo(
    () => servicios.map((s) => ({ id: s.id, nombre: s.nombre })),
    [servicios]
  );

  if (!open || !paciente || !accessToken || typeof document === "undefined") return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm(values);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError("");
    const startedAt = Date.now();
    try {
      const created = await createPacienteServicioWithApi(
        accessToken,
        toPayload(paciente.id, values)
      );
      await delayRemaining(DEFAULT_MIN_LOADING_MS, startedAt);
      const label = created.servicio?.nombre ?? `Servicio #${created.servicioId}`;
      setAssignedNames((prev) => [...prev, `${label}#${created.id}`]);
      onAssigned(created);
      setValues(emptyForm());
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? getApiErrorMessages(err).join(" ")
          : "No se pudo asignar el servicio.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const nombre = getPacienteNombre(paciente);

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="assign-servicio-title"
    >
      <button
        type="button"
        className="absolute cursor-pointer inset-0 bg-medical-text/55 backdrop-blur-sm"
        aria-label="Cerrar"
        onClick={() => !submitting && onFinish()}
      />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-medical-border bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-medical-border bg-medical-primary px-5 py-4">
          <div className="flex min-w-0 items-center gap-2 text-white">
            <Layers className="size-5 shrink-0" />
            <div className="min-w-0">
              <h2 id="assign-servicio-title" className="truncate text-base font-semibold">
                Asignar servicio
              </h2>
              <p className="truncate text-xs text-white/85">{nombre}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 cursor-pointer text-white hover:bg-white/15 hover:text-white"
            onClick={onFinish}
            disabled={submitting}
          >
            <X className="size-5" />
          </Button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {submitting ? (
            <div className="flex flex-col items-center gap-3 px-6 py-14">
              <Loader2 className="size-10 animate-spin text-medical-primary" />
              <p className="text-sm text-medical-mutedText">Guardando asignación…</p>
            </div>
          ) : (
            <div className="space-y-4 px-5 py-5 sm:px-6">
              <p className="text-sm leading-relaxed text-medical-mutedText">
                Asociá uno o más servicios del catálogo. Cada combinación paciente + servicio requiere
                un registro. Podés agregar varios antes de finalizar.
              </p>

              {assignedNames.length > 0 ? (
                <div className={cn("rounded-xl border px-3 py-2.5", medicalSuccessBox)}>
                  <p className="text-xs font-semibold text-medical-success">Asignados en esta sesión</p>
                  <ul className="mt-1 list-inside list-disc text-xs text-medical-success">
                    {assignedNames.map((entry) => (
                      <li key={entry}>{entry.replace(/#\d+$/, "")}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div>
                <Label htmlFor="asign-servicio" className="mb-1.5 block text-sm font-medium">
                  Servicio <span className="text-medical-danger">*</span>
                </Label>
                {loadingServicios ? (
                  <p className="text-sm text-medical-mutedText">Cargando servicios…</p>
                ) : servicioOptions.length === 0 ? (
                  <p className="text-sm text-medical-warning">
                    No hay servicios activos. Creá uno en el catálogo antes de asignar.
                  </p>
                ) : (
                  <Select
                    value={values.servicioId || undefined}
                    onValueChange={(v) => setValues((prev) => ({ ...prev, servicioId: v }))}
                  >
                    <SelectTrigger id="asign-servicio" className={inputClass}>
                      <SelectValue placeholder="Elegir servicio" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {servicioOptions.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="asign-inicio" className="mb-1.5 block text-sm font-medium">
                    Fecha de inicio <span className="text-medical-danger">*</span>
                  </Label>
                  <input
                    id="asign-inicio"
                    type="date"
                    value={values.fechaInicio}
                    onChange={(e) => setValues((v) => ({ ...v, fechaInicio: e.target.value }))}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="asign-fin" className="mb-1.5 block text-sm font-medium">
                    Fecha de fin
                  </Label>
                  <input
                    id="asign-fin"
                    type="date"
                    value={values.fechaFin}
                    onChange={(e) => setValues((v) => ({ ...v, fechaFin: e.target.value }))}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="mb-1.5 block text-sm font-medium">Frecuencia</Label>
                  <Select
                    value={values.frecuenciaTipo}
                    onValueChange={(v) =>
                      setValues((prev) => ({ ...prev, frecuenciaTipo: v as FrecuenciaTipo }))
                    }
                  >
                    <SelectTrigger className={inputClass}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {FRECUENCIA_TIPOS.map((f) => (
                        <SelectItem key={f} value={f}>
                          {FRECUENCIA_TIPO_LABELS[f]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="asign-freq-val" className="mb-1.5 block text-sm font-medium">
                    Valor de frecuencia <span className="text-medical-danger">*</span>
                  </Label>
                  <input
                    id="asign-freq-val"
                    type="number"
                    min={1}
                    step={1}
                    value={values.frecuenciaValor}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, frecuenciaValor: e.target.value }))
                    }
                    className={inputClass}
                    placeholder="Ej. 3"
                  />
                  <p className="mt-1 text-xs text-medical-mutedText">
                    Ej. 3 veces por semana si la frecuencia es semanal.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="mb-1.5 block text-sm font-medium">Modalidad de cobro</Label>
                  <Select
                    value={values.modalidadCobro}
                    onValueChange={(v) =>
                      setValues((prev) => ({ ...prev, modalidadCobro: v as ModalidadCobro }))
                    }
                  >
                    <SelectTrigger className={inputClass}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {MODALIDADES_COBRO.map((m) => (
                        <SelectItem key={m} value={m}>
                          {MODALIDAD_COBRO_LABELS[m]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-1.5 block text-sm font-medium">Estado</Label>
                  <Select
                    value={values.estado}
                    onValueChange={(v) =>
                      setValues((prev) => ({ ...prev, estado: v as PacienteServicioEstado }))
                    }
                  >
                    <SelectTrigger className={inputClass}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {ASIGNACION_ESTADOS.map((e) => (
                        <SelectItem key={e} value={e}>
                          {ASIGNACION_ESTADO_LABELS[e]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {error ? (
                <p className="rounded-lg border border-medical-danger/30 bg-medical-danger/10 px-3 py-2 text-sm text-medical-danger">
                  {error}
                </p>
              ) : null}
            </div>
          )}

          {!submitting ? (
            <div className="flex flex-col gap-2 border-t border-medical-border bg-medical-surface/80 px-5 py-4 sm:flex-row sm:flex-wrap sm:justify-end sm:px-6">
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer sm:min-w-[120px]"
                onClick={onFinish}
              >
                {assignedNames.length > 0 ? "Finalizar" : dismissLabel}
              </Button>
              <Button
                type="submit"
                disabled={loadingServicios || servicioOptions.length === 0}
                className="cursor-pointer bg-medical-primary text-white hover:bg-medical-primaryDark sm:min-w-[160px]"
              >
                <Plus className="size-4" />
                {assignedNames.length > 0 ? "Agregar otro servicio" : "Asignar servicio"}
              </Button>
            </div>
          ) : null}
        </form>
      </div>
    </div>,
    document.body
  );
}
