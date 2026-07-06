"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Layers, Loader2, Plus, X } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { createPacienteServicioWithApi } from "@/lib/api/paciente-servicios";
import { listPrestadoresPorServicioWithApi } from "@/lib/api/prestadores";
import { listServiciosWithApi } from "@/lib/api/servicios";
import { canListPrestadoresForAsignacion } from "@/lib/paciente-servicios-access";
import { getPacienteServicioApiErrorMessage } from "@/lib/paciente-servicios-errors";
import type {
  ModalidadCobro,
  PacienteListItemDto,
  PacienteServicioDto,
  PacienteServicioEstado,
  PeriodoControl,
  PrestadorListItemDto,
  ServicioConTarifasDto,
} from "@/lib/api/types";
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
import { getPacienteNombre } from "@/lib/pacientes-display";
import {
  buildCreatePacienteServicioBody,
  getReglasFromServicioCatalogo,
  hasRequiredPacienteServicioAsignacionFields,
  prestadorFieldMultiple,
  validatePacienteServicioAsignacionForm,
  type PacienteServicioAsignacionFormState,
} from "@/lib/paciente-servicio-asignacion-form";
import {
  campoAsignacionVisible,
  formatModoAsignacion,
} from "@/lib/reglas-asignacion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PrestadoresAsignacionField } from "@/components/admin/PrestadoresAsignacionPicker";
import { medicalSuccessBox } from "@/lib/medical-ui-classes";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const inputClass =
  "h-11 w-full rounded-xl border border-medical-border bg-medical-surface/80 px-3.5 text-sm text-medical-text outline-none transition placeholder:text-medical-mutedText/60 focus:border-medical-primary focus:bg-medical-card focus:ring-4 focus:ring-medical-primary/12 disabled:cursor-not-allowed disabled:opacity-60";

const SIN_SERVICIO_VALUE = "__sin_servicio__";
const SIN_PERIODO_VALUE = "__sin_periodo__";

type FormState = Omit<PacienteServicioAsignacionFormState, "servicioId" | "periodoControl"> & {
  servicioId: string | typeof SIN_SERVICIO_VALUE;
  periodoControl: PeriodoControl | typeof SIN_PERIODO_VALUE;
};

function emptyForm(): FormState {
  return {
    servicioId: SIN_SERVICIO_VALUE,
    prestadorIds: [],
    fechaInicio: "",
    fechaFin: "",
    cobertura24Horas: true,
    coberturaDiariaInicio: "",
    coberturaDiariaFin: "",
    periodoControl: SIN_PERIODO_VALUE,
    cantidadPermitida: "",
    cantidadHoras: "",
    modalidadCobro: "por_servicio",
    estado: "activa",
  };
}

type AssignPacienteServicioDialogProps = {
  open: boolean;
  paciente: PacienteListItemDto | null;
  accessToken: string | null;
  userRoles?: string[];
  onFinish: () => void;
  onAssigned: (asignacion: PacienteServicioDto) => void;
  /** Texto del botón para cerrar sin más asignaciones (flujo post-alta de paciente). */
  dismissLabel?: string;
  /** Evita cerrar al hacer clic fuera (recomendado en wizard post-alta). */
  closeOnBackdrop?: boolean;
};

export function AssignPacienteServicioDialog({
  open,
  paciente,
  accessToken,
  userRoles = [],
  onFinish,
  onAssigned,
  dismissLabel = "Omitir por ahora",
  closeOnBackdrop = true,
}: AssignPacienteServicioDialogProps) {
  const [values, setValues] = useState<FormState>(emptyForm);
  const [servicios, setServicios] = useState<ServicioConTarifasDto[]>([]);
  const [prestadores, setPrestadores] = useState<PrestadorListItemDto[]>([]);
  const [loadingServicios, setLoadingServicios] = useState(false);
  const [loadingPrestadores, setLoadingPrestadores] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [assignedNames, setAssignedNames] = useState<string[]>([]);
  const puedeElegirPrestador = canListPrestadoresForAsignacion(userRoles);

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
    setPrestadores([]);

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
    if (!open || !accessToken || !puedeElegirPrestador) {
      setPrestadores([]);
      return;
    }
    const servicioId =
      values.servicioId !== SIN_SERVICIO_VALUE ? Number(values.servicioId) : null;
    if (!servicioId || !Number.isFinite(servicioId)) {
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
  }, [open, accessToken, puedeElegirPrestador, values.servicioId]);

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

  const prestadorOptions = prestadores;

  const servicioSeleccionado =
    values.servicioId !== SIN_SERVICIO_VALUE
      ? servicios.find((s) => String(s.id) === values.servicioId)
      : undefined;
  const reglas = getReglasFromServicioCatalogo(servicioSeleccionado);
  const servicioModoRelevo = reglas?.modo === "relevo";

  if (!open || !paciente || !accessToken || typeof document === "undefined") return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (values.servicioId === SIN_SERVICIO_VALUE || !reglas) {
      setError("Seleccioná un servicio.");
      return;
    }
    const servicioId = Number(values.servicioId);
    const validationError = validatePacienteServicioAsignacionForm({
      values: {
        ...values,
        servicioId: String(servicioId),
        periodoControl:
          values.periodoControl === SIN_PERIODO_VALUE ? "" : values.periodoControl,
      },
      reglas,
      prestadores,
      servicioId,
    });
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
        buildCreatePacienteServicioBody({
          pacienteId: paciente.id,
          values: {
            ...values,
            servicioId: String(servicioId),
            periodoControl:
              values.periodoControl === SIN_PERIODO_VALUE ? "" : values.periodoControl,
          },
          reglas,
        })
      );
      await delayRemaining(DEFAULT_MIN_LOADING_MS, startedAt);
      const label = created.servicio?.nombre ?? `Servicio #${created.servicioId}`;
      setAssignedNames((prev) => [...prev, `${label}#${created.id}`]);
      onAssigned(created);
      setValues(emptyForm());
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? getPacienteServicioApiErrorMessage(err)
          : "No se pudo asignar el servicio.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const nombre = getPacienteNombre(paciente);
  const canSubmit =
    values.servicioId !== SIN_SERVICIO_VALUE &&
    reglas != null &&
    hasRequiredPacienteServicioAsignacionFields(
      {
        ...values,
        servicioId: values.servicioId === SIN_SERVICIO_VALUE ? "" : values.servicioId,
        periodoControl:
          values.periodoControl === SIN_PERIODO_VALUE ? "" : values.periodoControl,
      },
      reglas
    ) &&
    !loadingServicios &&
    !loadingPrestadores &&
    servicioOptions.length > 0;

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
        onClick={() => {
          if (!submitting && closeOnBackdrop) onFinish();
        }}
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
              {reglas?.ayudaFormulario ? (
                <p className="rounded-lg border border-medical-primary/20 bg-medical-primary/5 px-3 py-2.5 text-xs leading-relaxed text-medical-text">
                  {reglas.ayudaFormulario}
                </p>
              ) : (
                <p className="rounded-lg border border-medical-border/70 bg-medical-surface/50 px-3 py-2.5 text-xs leading-relaxed text-medical-mutedText">
                  Completá servicio, fecha de inicio, período de control y cantidad permitida antes de
                  guardar. Si la modalidad es por hora, también indicá la cantidad de horas.
                </p>
              )}
              {reglas ? (
                <p className="text-xs font-medium text-medical-mutedText">
                  Modo:{" "}
                  <span className="rounded-full border border-medical-border bg-medical-surface px-2 py-0.5 text-medical-text">
                    {formatModoAsignacion(reglas.modo)}
                  </span>
                </p>
              ) : null}
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
                    value={values.servicioId}
                    onValueChange={(v) => {
                      setValues((prev) => ({
                        ...prev,
                        servicioId: v,
                        prestadorIds: [],
                      }));
                      setError("");
                    }}
                  >
                    <SelectTrigger id="asign-servicio" className={inputClass}>
                      <SelectValue placeholder="Seleccioná un servicio" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectItem
                        value={SIN_SERVICIO_VALUE}
                        disabled
                        className="text-medical-mutedText"
                      >
                        Seleccioná un servicio
                      </SelectItem>
                      {servicioOptions.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div>
                {!puedeElegirPrestador ? (
                  <>
                    <Label className="mb-1.5 block text-sm font-medium">Prestador</Label>
                    <p className="rounded-lg border border-medical-border/80 bg-medical-surface/60 px-3 py-2 text-sm text-medical-mutedText">
                      Tu rol no puede listar prestadores. La asignación quedará sin prestador fijo; un
                      administrador puede asignarlo después.
                    </p>
                  </>
                ) : values.servicioId === SIN_SERVICIO_VALUE ? (
                  <>
                    <Label className="mb-1.5 block text-sm font-medium">Prestador</Label>
                    <p className="text-sm text-medical-mutedText">
                      Elegí un servicio para ver prestadores activos.
                    </p>
                  </>
                ) : (
                  <PrestadoresAsignacionField
                    id="asign-prestador"
                    prestadores={prestadorOptions}
                    multiple={reglas ? prestadorFieldMultiple(reglas) : servicioModoRelevo}
                    selectedIds={values.prestadorIds}
                    onChange={(ids) => {
                      setValues((prev) => ({ ...prev, prestadorIds: ids }));
                      setError("");
                    }}
                    loading={loadingPrestadores}
                  />
                )}
                {puedeElegirPrestador &&
                values.servicioId !== SIN_SERVICIO_VALUE &&
                !loadingPrestadores &&
                prestadorOptions.length === 0 ? (
                  <p className="mt-1.5 text-xs text-medical-mutedText">
                    No hay prestadores activos; podés guardar sin asignar uno.
                  </p>
                ) : null}
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
                    onChange={(e) => {
                      setValues((v) => ({ ...v, fechaInicio: e.target.value }));
                      setError("");
                    }}
                    className={inputClass}
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
                    min={values.fechaInicio || undefined}
                    onChange={(e) => {
                      setValues((v) => ({ ...v, fechaFin: e.target.value }));
                      setError("");
                    }}
                    className={inputClass}
                  />
                </div>
              </div>

              {reglas && campoAsignacionVisible(reglas, "coberturaDiariaInicio") ? (
                <div className="space-y-3 rounded-xl border border-medical-border/80 bg-medical-surface/40 p-3.5">
                  <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-medical-text">
                    <input
                      type="checkbox"
                      checked={values.cobertura24Horas}
                      onChange={(e) => {
                        setValues((v) => ({
                          ...v,
                          cobertura24Horas: e.target.checked,
                          coberturaDiariaInicio: "",
                          coberturaDiariaFin: "",
                        }));
                        setError("");
                      }}
                      className="size-4 rounded border-medical-border text-medical-primary"
                    />
                    Cobertura las 24 horas
                  </label>
                  {!values.cobertura24Horas ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="asign-cob-inicio" className="mb-1.5 block text-sm font-medium">
                          {reglas.coberturaDiaria?.etiquetaInicio ?? "Inicio diario"}
                        </Label>
                        <input
                          id="asign-cob-inicio"
                          type="time"
                          value={values.coberturaDiariaInicio}
                          onChange={(e) => {
                            setValues((v) => ({ ...v, coberturaDiariaInicio: e.target.value }));
                            setError("");
                          }}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <Label htmlFor="asign-cob-fin" className="mb-1.5 block text-sm font-medium">
                          {reglas.coberturaDiaria?.etiquetaFin ?? "Fin diario"}
                        </Label>
                        <input
                          id="asign-cob-fin"
                          type="time"
                          value={values.coberturaDiariaFin}
                          onChange={(e) => {
                            setValues((v) => ({ ...v, coberturaDiariaFin: e.target.value }));
                            setError("");
                          }}
                          className={inputClass}
                        />
                      </div>
                    </div>
                  ) : null}
                  {reglas.coberturaDiaria?.ayuda ? (
                    <p className="text-xs text-medical-mutedText">{reglas.coberturaDiaria.ayuda}</p>
                  ) : null}
                </div>
              ) : null}

              {reglas == null ||
              campoAsignacionVisible(reglas, "periodoControl") ||
              campoAsignacionVisible(reglas, "cantidadPermitida") ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {reglas == null || campoAsignacionVisible(reglas, "periodoControl") ? (
                <div>
                  <Label className="mb-1.5 block text-sm font-medium">
                    Período de control <span className="text-medical-danger">*</span>
                  </Label>
                  <Select
                    value={values.periodoControl}
                    onValueChange={(v) => {
                      setValues((prev) => ({ ...prev, periodoControl: v as PeriodoControl }));
                      setError("");
                    }}
                  >
                    <SelectTrigger className={inputClass}>
                      <SelectValue placeholder="Seleccioná un período" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectItem
                        value={SIN_PERIODO_VALUE}
                        disabled
                        className="text-medical-mutedText"
                      >
                        Seleccioná un período
                      </SelectItem>
                      {PERIODOS_CONTROL.map((p) => (
                        <SelectItem key={p} value={p}>
                          {PERIODO_CONTROL_LABELS[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                ) : null}
                {reglas == null || campoAsignacionVisible(reglas, "cantidadPermitida") ? (
                <div>
                  <Label htmlFor="asign-cupo" className="mb-1.5 block text-sm font-medium">
                    Cantidad permitida <span className="text-medical-danger">*</span>
                  </Label>
                  <input
                    id="asign-cupo"
                    type="number"
                    min={1}
                    step={1}
                    value={values.cantidadPermitida}
                    onChange={(e) => {
                      setValues((v) => ({ ...v, cantidadPermitida: e.target.value }));
                      setError("");
                    }}
                    className={inputClass}
                    placeholder="Ej. 3"
                  />
                  <p className="mt-1 text-xs text-medical-mutedText">
                    Visitas autorizadas en el período (ej. 4 por mes).
                  </p>
                </div>
                ) : null}
              </div>
              ) : null}

              {reglas && campoAsignacionVisible(reglas, "cantidadHoras") &&
              values.modalidadCobro === "por_hora" ? (
                <div>
                  <Label htmlFor="asign-horas" className="mb-1.5 block text-sm font-medium">
                    Cantidad de horas <span className="text-medical-danger">*</span>
                  </Label>
                  <input
                    id="asign-horas"
                    type="number"
                    min={1}
                    step={1}
                    value={values.cantidadHoras}
                    onChange={(e) => {
                      setValues((v) => ({ ...v, cantidadHoras: e.target.value }));
                      setError("");
                    }}
                    className={inputClass}
                    placeholder="Ej. 2"
                  />
                  <p className="mt-1 text-xs text-medical-mutedText">
                    Horas autorizadas cuando la modalidad de cobro es por hora.
                  </p>
                </div>
              ) : null}

              {(reglas == null ||
                campoAsignacionVisible(reglas, "modalidadCobro") ||
                campoAsignacionVisible(reglas, "estado")) && (
              <div className="grid gap-4 sm:grid-cols-2">
                {reglas == null || campoAsignacionVisible(reglas, "modalidadCobro") ? (
                <div>
                  <Label className="mb-1.5 block text-sm font-medium">Modalidad de cobro</Label>
                  <Select
                    value={values.modalidadCobro}
                    onValueChange={(v) => {
                      setValues((prev) => ({ ...prev, modalidadCobro: v as ModalidadCobro }));
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
                ) : null}
                {reglas == null || campoAsignacionVisible(reglas, "estado") ? (
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
                ) : null}
              </div>
              )}

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
                disabled={!canSubmit}
                className="cursor-pointer bg-medical-primary text-white hover:bg-medical-primaryDark disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-[160px]"
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
