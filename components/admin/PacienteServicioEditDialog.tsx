"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Layers, Loader2, X } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { updatePacienteServicioWithApi } from "@/lib/api/paciente-servicios";
import { listPrestadoresPorServicioWithApi } from "@/lib/api/prestadores";
import { listServiciosWithApi } from "@/lib/api/servicios";
import type {
  ModalidadCobro,
  PacienteServicioDto,
  PacienteServicioEstado,
  PeriodoControl,
  PrestadorListItemDto,
  ServicioConTarifasDto,
  UpdatePacienteServicioBody,
} from "@/lib/api/types";
import { canListPrestadoresForAsignacion } from "@/lib/paciente-servicios-access";
import { getPacienteServicioApiErrorMessage } from "@/lib/paciente-servicios-errors";
import { formatPacienteServicioPrestadorLabel } from "@/lib/paciente-servicios-display";
import {
  DEFAULT_MIN_LOADING_MS,
  delayRemaining,
} from "@/lib/loading/minimum-duration";
import {
  ASIGNACION_ESTADO_LABELS,
  ASIGNACION_ESTADOS,
  MODALIDAD_COBRO_LABELS,
  MODALIDADES_COBRO,
  PERIODO_CONTROL_LABELS,
  PERIODOS_CONTROL,
} from "@/lib/paciente-servicios-labels";
import { prestadorTieneServicio } from "@/lib/prestador-servicios-filter";
import { dateInputToIso } from "@/lib/date-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PrestadoresAsignacionField } from "@/components/admin/PrestadoresAsignacionPicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const inputClass =
  "h-11 w-full rounded-xl border border-medical-border bg-medical-surface/80 px-3.5 text-sm text-medical-text outline-none transition placeholder:text-medical-mutedText/60 focus:border-medical-primary focus:bg-medical-card focus:ring-4 focus:ring-medical-primary/12 disabled:cursor-not-allowed disabled:opacity-60";

function isoToDateInput(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function isPositiveInt(value: string): boolean {
  const n = Number(value.trim());
  return Number.isFinite(n) && n >= 1 && Number.isInteger(n);
}

type FormState = {
  servicioId: string;
  prestadorIds: string[];
  fechaInicio: string;
  fechaFin: string;
  periodoControl: PeriodoControl;
  cantidadPermitida: string;
  cantidadHoras: string;
  modalidadCobro: ModalidadCobro;
  estado: PacienteServicioEstado;
};

function prestadorIdsFromAsignacion(a: PacienteServicioDto): string[] {
  if (a.prestadoresAsignados && a.prestadoresAsignados.length > 0) {
    return a.prestadoresAsignados.map((p) => String(p.id));
  }
  if (a.prestadorId != null && a.prestadorId > 0) {
    return [String(a.prestadorId)];
  }
  return [];
}

function samePrestadorIds(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((id, i) => id === sortedB[i]);
}

function formFromAsignacion(a: PacienteServicioDto): FormState {
  return {
    servicioId: String(a.servicioId),
    prestadorIds: prestadorIdsFromAsignacion(a),
    fechaInicio: isoToDateInput(a.fechaInicio),
    fechaFin: a.fechaFin ? isoToDateInput(a.fechaFin) : "",
    periodoControl: a.periodoControl,
    cantidadPermitida: String(a.cantidadPermitida),
    cantidadHoras:
      a.modalidadCobro === "por_hora" && a.cantidadHoras != null
        ? String(a.cantidadHoras)
        : "",
    modalidadCobro: a.modalidadCobro,
    estado: a.estado,
  };
}

function validateForm(
  values: FormState,
  original: PacienteServicioDto,
  prestadores: PrestadorListItemDto[],
  servicioModoRelevo: boolean
): string | null {
  if (!values.servicioId) return "Seleccioná un servicio.";
  const servicioId = Number(values.servicioId);
  if (servicioModoRelevo && values.prestadorIds.length < 1) {
    return "Seleccioná al menos un prestador para servicios con relevamiento.";
  }
  const servicioCambio = servicioId !== original.servicioId;
  const prestadoresCambio = !samePrestadorIds(
    values.prestadorIds,
    prestadorIdsFromAsignacion(original)
  );
  if (servicioCambio || prestadoresCambio) {
    for (const pid of values.prestadorIds) {
      const prestador = prestadores.find((p) => String(p.id) === pid);
      if (prestador && !prestadorTieneServicio(prestador, servicioId)) {
        return "Uno de los prestadores elegidos no tiene asociado el servicio indicado.";
      }
    }
  }
  if (!values.fechaInicio.trim()) return "La fecha de inicio es obligatoria.";
  const cupoRaw = values.cantidadPermitida.trim();
  if (!cupoRaw) return "La cantidad permitida es obligatoria.";
  const cupo = Number(cupoRaw);
  if (!Number.isFinite(cupo) || cupo < 1 || !Number.isInteger(cupo)) {
    return "La cantidad permitida debe ser un número entero mayor a 0.";
  }
  if (values.modalidadCobro === "por_hora") {
    const horasRaw = values.cantidadHoras.trim();
    if (!horasRaw) return "La cantidad de horas es obligatoria para modalidad por hora.";
    const horas = Number(horasRaw);
    if (!Number.isFinite(horas) || horas < 1 || !Number.isInteger(horas)) {
      return "La cantidad de horas debe ser un número entero mayor a 0.";
    }
  }
  if (values.fechaFin && values.fechaFin < values.fechaInicio) {
    return "La fecha de fin no puede ser anterior al inicio.";
  }
  return null;
}

function canSubmitEditForm(values: FormState): boolean {
  if (!values.fechaInicio.trim()) return false;
  if (!isPositiveInt(values.cantidadPermitida)) return false;
  if (values.modalidadCobro === "por_hora" && !isPositiveInt(values.cantidadHoras)) {
    return false;
  }
  return true;
}

function toPatchPayload(
  original: PacienteServicioDto,
  values: FormState,
  servicioModoRelevo: boolean
): UpdatePacienteServicioBody {
  const body: UpdatePacienteServicioBody = {};
  const servicioId = Number(values.servicioId);
  const prestadorIds = values.prestadorIds.map(Number).filter((id) => id > 0);
  const originalPrestadorIds = prestadorIdsFromAsignacion(original);
  const cantidadPermitida = Number(values.cantidadPermitida);
  const cantidadHoras =
    values.modalidadCobro === "por_hora" ? Number(values.cantidadHoras) : null;
  const fin = values.fechaFin.trim();

  if (servicioId !== original.servicioId) body.servicioId = servicioId;

  if (!samePrestadorIds(values.prestadorIds, originalPrestadorIds)) {
    if (servicioModoRelevo) {
      body.prestadorIds = prestadorIds;
    } else {
      body.prestadorId = prestadorIds.length === 1 ? prestadorIds[0] : null;
      if ((original.prestadoresAsignados?.length ?? 0) > 0) {
        body.prestadorIds = prestadorIds.length > 0 ? [prestadorIds[0]] : [];
      }
    }
  }

  const fechaInicioIso = dateInputToIso(values.fechaInicio);
  if (fechaInicioIso !== original.fechaInicio) body.fechaInicio = fechaInicioIso;

  const fechaFinIso = fin ? dateInputToIso(fin) : null;
  if (fechaFinIso !== original.fechaFin) body.fechaFin = fechaFinIso;

  if (values.periodoControl !== original.periodoControl) {
    body.periodoControl = values.periodoControl;
  }
  if (cantidadPermitida !== original.cantidadPermitida) {
    body.cantidadPermitida = cantidadPermitida;
  }
  if (values.modalidadCobro !== original.modalidadCobro) {
    body.modalidadCobro = values.modalidadCobro;
  }
  if (cantidadHoras !== original.cantidadHoras) {
    body.cantidadHoras = cantidadHoras;
  }
  if (values.estado !== original.estado) body.estado = values.estado;

  return body;
}

type Props = {
  open: boolean;
  asignacion: PacienteServicioDto | null;
  accessToken: string | null;
  userRoles?: string[];
  onClose: () => void;
  onUpdated: (asignacion: PacienteServicioDto) => void;
};

export function PacienteServicioEditDialog({
  open,
  asignacion,
  accessToken,
  userRoles = [],
  onClose,
  onUpdated,
}: Props) {
  const [values, setValues] = useState<FormState | null>(null);
  const [servicios, setServicios] = useState<ServicioConTarifasDto[]>([]);
  const [prestadores, setPrestadores] = useState<PrestadorListItemDto[]>([]);
  const [loadingServicios, setLoadingServicios] = useState(false);
  const [loadingPrestadores, setLoadingPrestadores] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const puedeElegirPrestador = canListPrestadoresForAsignacion(userRoles);

  useEffect(() => {
    if (!open || !asignacion) return;
    setValues(formFromAsignacion(asignacion));
    setError("");
  }, [open, asignacion]);

  useEffect(() => {
    if (!open || !accessToken) return;
    let cancelled = false;
    setLoadingServicios(true);

    void listServiciosWithApi(accessToken, { page: 1, pageSize: 100, estado: true })
      .then((serviciosData) => {
        if (!cancelled) setServicios(serviciosData.items.filter((s) => s.estado));
      })
      .catch(() => {
        if (!cancelled) setError("No se pudieron cargar servicios.");
      })
      .finally(() => {
        if (!cancelled) setLoadingServicios(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, accessToken]);

  useEffect(() => {
    if (!open || !accessToken || !puedeElegirPrestador || !values?.servicioId) {
      setPrestadores([]);
      return;
    }
    const servicioId = Number(values.servicioId);
    if (!Number.isFinite(servicioId)) {
      setPrestadores([]);
      return;
    }

    let cancelled = false;
    setLoadingPrestadores(true);
    void listPrestadoresPorServicioWithApi(accessToken, servicioId)
      .then((items) => {
        if (!cancelled) setPrestadores(items);
      })
      .catch(() => {
        if (!cancelled) {
          setPrestadores([]);
          setError("No se pudieron cargar prestadores para este servicio.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingPrestadores(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, accessToken, puedeElegirPrestador, values?.servicioId]);

  const prestadorOptions = prestadores;
  const loadingOptions = loadingServicios || loadingPrestadores;
  const servicioSeleccionado = servicios.find((s) => String(s.id) === values?.servicioId);
  const servicioModoRelevo = servicioSeleccionado?.modoRelevo === true;

  if (!open || !asignacion || !values || !accessToken || typeof document === "undefined") {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm(values, asignacion, prestadores, servicioModoRelevo);
    if (validationError) {
      setError(validationError);
      return;
    }

    const body = toPatchPayload(asignacion, values, servicioModoRelevo);
    if (Object.keys(body).length === 0) {
      onClose();
      return;
    }

    setSubmitting(true);
    setError("");
    const startedAt = Date.now();
    try {
      const updated = await updatePacienteServicioWithApi(accessToken, asignacion.id, body);
      await delayRemaining(DEFAULT_MIN_LOADING_MS, startedAt);
      onUpdated(updated);
      onClose();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? getPacienteServicioApiErrorMessage(err)
          : "No se pudo actualizar la asignación.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const pacienteNombre = `${asignacion.paciente.nombre} ${asignacion.paciente.apellido}`.trim();
  const canSubmit = canSubmitEditForm(values) && !loadingOptions;

  return createPortal(
    <div
      className="fixed inset-0 z-[125] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-asignacion-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-pointer bg-medical-text/55 backdrop-blur-sm"
        aria-label="Cerrar"
        onClick={() => !submitting && onClose()}
      />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-medical-border bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-medical-border bg-medical-primary px-5 py-4">
          <div className="flex min-w-0 items-center gap-2 text-white">
            <Layers className="size-5 shrink-0" />
            <div className="min-w-0">
              <h2 id="edit-asignacion-title" className="truncate text-base font-semibold">
                Editar asignación
              </h2>
              <p className="truncate text-xs text-white/85">
                {pacienteNombre} · {asignacion.servicio.nombre}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 cursor-pointer text-white hover:bg-white/15 hover:text-white"
            onClick={onClose}
            disabled={submitting}
          >
            <X className="size-5" />
          </Button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {submitting ? (
            <div className="flex flex-col items-center gap-3 px-6 py-14">
              <Loader2 className="size-10 animate-spin text-medical-primary" />
              <p className="text-sm text-medical-mutedText">Guardando cambios…</p>
            </div>
          ) : (
            <div className="space-y-4 px-5 py-5 sm:px-6">
              <p className="rounded-lg border border-medical-border/70 bg-medical-surface/50 px-3 py-2.5 text-xs leading-relaxed text-medical-mutedText">
                Modificá los datos de la asignación. Si la modalidad es por hora, la cantidad de
                horas es obligatoria.
              </p>
              <div>
                <Label className="mb-1.5 block text-sm font-medium">
                  Servicio <span className="text-medical-danger">*</span>
                </Label>
                <Select
                  value={values.servicioId}
                  onValueChange={(v) => {
                    setValues((prev) =>
                      prev ? { ...prev, servicioId: v, prestadorIds: [] } : prev
                    );
                    setError("");
                  }}
                >
                  <SelectTrigger className={inputClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {servicios.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                {!puedeElegirPrestador ? (
                  <>
                    <Label className="mb-1.5 block text-sm font-medium">Prestador</Label>
                    <p className="rounded-lg border border-medical-border/80 bg-medical-surface/60 px-3 py-2 text-sm text-medical-mutedText">
                      {formatPacienteServicioPrestadorLabel(asignacion)} — solo un administrador
                      puede cambiarlo.
                    </p>
                  </>
                ) : (
                  <PrestadoresAsignacionField
                    id="edit-asign-prestador"
                    prestadores={prestadorOptions}
                    multiple={servicioModoRelevo}
                    selectedIds={values.prestadorIds}
                    onChange={(ids) => {
                      setValues((prev) => (prev ? { ...prev, prestadorIds: ids } : prev));
                      setError("");
                    }}
                    disabled={loadingOptions}
                    loading={loadingPrestadores}
                  />
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="edit-inicio" className="mb-1.5 block text-sm font-medium">
                    Fecha de inicio <span className="text-medical-danger">*</span>
                  </Label>
                  <input
                    id="edit-inicio"
                    type="date"
                    value={values.fechaInicio}
                    onChange={(e) => {
                      setValues((v) => (v ? { ...v, fechaInicio: e.target.value } : v));
                      setError("");
                    }}
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-fin" className="mb-1.5 block text-sm font-medium">
                    Fecha de fin
                  </Label>
                  <input
                    id="edit-fin"
                    type="date"
                    value={values.fechaFin}
                    min={values.fechaInicio || undefined}
                    onChange={(e) => {
                      setValues((v) => (v ? { ...v, fechaFin: e.target.value } : v));
                      setError("");
                    }}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="mb-1.5 block text-sm font-medium">
                    Período de control <span className="text-medical-danger">*</span>
                  </Label>
                  <Select
                    value={values.periodoControl}
                    onValueChange={(v) => {
                      setValues((prev) =>
                        prev ? { ...prev, periodoControl: v as PeriodoControl } : prev
                      );
                      setError("");
                    }}
                  >
                    <SelectTrigger className={inputClass}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {PERIODOS_CONTROL.map((p) => (
                        <SelectItem key={p} value={p}>
                          {PERIODO_CONTROL_LABELS[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-cupo" className="mb-1.5 block text-sm font-medium">
                    Cantidad permitida <span className="text-medical-danger">*</span>
                  </Label>
                  <input
                    id="edit-cupo"
                    type="number"
                    min={1}
                    step={1}
                    value={values.cantidadPermitida}
                    onChange={(e) => {
                      setValues((v) => (v ? { ...v, cantidadPermitida: e.target.value } : v));
                      setError("");
                    }}
                    className={inputClass}
                    placeholder="Ej. 3"
                  />
                </div>
              </div>

              {values.modalidadCobro === "por_hora" ? (
                <div>
                  <Label htmlFor="edit-horas" className="mb-1.5 block text-sm font-medium">
                    Cantidad de horas <span className="text-medical-danger">*</span>
                  </Label>
                  <input
                    id="edit-horas"
                    type="number"
                    min={1}
                    step={1}
                    value={values.cantidadHoras}
                    onChange={(e) => {
                      setValues((v) => (v ? { ...v, cantidadHoras: e.target.value } : v));
                      setError("");
                    }}
                    className={inputClass}
                    placeholder="Ej. 2"
                  />
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="mb-1.5 block text-sm font-medium">Modalidad de cobro</Label>
                  <Select
                    value={values.modalidadCobro}
                    onValueChange={(v) => {
                      const modalidad = v as ModalidadCobro;
                      setValues((prev) =>
                        prev
                          ? {
                              ...prev,
                              modalidadCobro: modalidad,
                              cantidadHoras: modalidad === "por_hora" ? prev.cantidadHoras : "",
                            }
                          : prev
                      );
                      setError("");
                    }}
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
                    onValueChange={(v) => {
                      setValues((prev) =>
                        prev ? { ...prev, estado: v as PacienteServicioEstado } : prev
                      );
                      setError("");
                    }}
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
            <div className="flex flex-col gap-2 border-t border-medical-border bg-medical-surface/80 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              <Button type="button" variant="outline" className="cursor-pointer" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!canSubmit}
                className="cursor-pointer bg-medical-primary text-white hover:bg-medical-primaryDark disabled:cursor-not-allowed disabled:opacity-60"
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
