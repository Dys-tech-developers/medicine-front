"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Banknote, Layers, Loader2, Pencil, Plus, X } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { getApiErrorMessages } from "@/lib/api/format-api-error";
import {
  createServicioTarifaWithApi,
  refreshServicioWithApi,
  updateServicioTarifaWithApi,
  updateServicioWithApi,
} from "@/lib/api/servicios";
import type {
  CreateServicioTarifaBody,
  ModalidadCobro,
  ServicioConTarifasDto,
  ServicioTarifaDto,
  TipoDia,
  TipoJornada,
  UpdateServicioTarifaBody,
} from "@/lib/api/types";
import {
  DEFAULT_MIN_LOADING_MS,
  delayRemaining,
} from "@/lib/loading/minimum-duration";
import {
  formatTarifaContexto,
  formatTarifaValor,
} from "@/lib/servicios-display";
import {
  MODALIDAD_COBRO_LABELS,
  MODALIDADES_COBRO,
  TIPO_DIA_LABELS,
  TIPO_JORNADA_LABELS,
  TIPOS_DIA,
  TIPOS_JORNADA,
} from "@/lib/servicios-tarifas-labels";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const inputClass =
  "h-11 w-full rounded-xl border border-medical-border bg-medical-surface/80 px-3.5 text-sm text-medical-text outline-none transition placeholder:text-medical-mutedText/60 focus:border-medical-primary focus:bg-medical-card focus:ring-4 focus:ring-medical-primary/12 disabled:cursor-not-allowed disabled:opacity-60";

const textareaClass =
  "min-h-[88px] w-full resize-y rounded-xl border border-medical-border bg-medical-surface/80 px-3.5 py-3 text-sm text-medical-text outline-none transition placeholder:text-medical-mutedText/60 focus:border-medical-primary focus:bg-medical-card focus:ring-4 focus:ring-medical-primary/12 disabled:cursor-not-allowed disabled:opacity-60";

type TarifaFormState = {
  modalidadCobro: ModalidadCobro;
  tipoJornada: TipoJornada;
  tipoDia: TipoDia;
  valor: string;
};

function defaultTarifaForm(): TarifaFormState {
  return {
    modalidadCobro: "por_hora",
    tipoJornada: "diurno",
    tipoDia: "habil",
    valor: "",
  };
}

function tarifaToForm(tarifa: ServicioTarifaDto): TarifaFormState {
  return {
    modalidadCobro: tarifa.modalidadCobro,
    tipoJornada: tarifa.tipoJornada,
    tipoDia: tarifa.tipoDia,
    valor: String(tarifa.valor),
  };
}

function appendTarifaInServicio(
  servicio: ServicioConTarifasDto,
  created: ServicioTarifaDto
): ServicioConTarifasDto {
  return {
    ...servicio,
    tarifas: [...servicio.tarifas, created],
  };
}

function mergeTarifaInServicio(
  servicio: ServicioConTarifasDto,
  updated: ServicioTarifaDto
): ServicioConTarifasDto {
  return {
    ...servicio,
    tarifas: servicio.tarifas.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)),
  };
}

type ServicioEditDialogProps = {
  open: boolean;
  servicio: ServicioConTarifasDto | null;
  /** Al abrir desde la tabla, enfocar la edición de esta tarifa. */
  focusTarifaId?: number | null;
  /** Abrir directamente el formulario de alta de tarifa. */
  focusAddTarifa?: boolean;
  accessToken: string;
  onClose: () => void;
  onUpdated: (servicio: ServicioConTarifasDto) => void;
  onNotify: (title: string, type: "success" | "error", detail?: string) => void;
};

export function ServicioEditDialog({
  open,
  servicio,
  focusTarifaId,
  focusAddTarifa = false,
  accessToken,
  onClose,
  onUpdated,
  onNotify,
}: ServicioEditDialogProps) {
  const [draft, setDraft] = useState<ServicioConTarifasDto | null>(null);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [editingTarifaId, setEditingTarifaId] = useState<number | null>(null);
  const [addingTarifa, setAddingTarifa] = useState(false);
  const [tarifaForm, setTarifaForm] = useState<TarifaFormState | null>(null);
  const [savingServicio, setSavingServicio] = useState(false);
  const [savingTarifa, setSavingTarifa] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!servicio) return;
    setDraft(servicio);
    setNombre(servicio.nombre);
    setDescripcion(servicio.descripcion ?? "");
    setError("");
    if (focusAddTarifa) {
      setAddingTarifa(true);
      setEditingTarifaId(null);
      setTarifaForm(defaultTarifaForm());
      return;
    }
    if (focusTarifaId != null) {
      const tarifa = servicio.tarifas?.find((t) => t.id === focusTarifaId);
      if (tarifa) {
        setAddingTarifa(false);
        setEditingTarifaId(tarifa.id);
        setTarifaForm(tarifaToForm(tarifa));
        return;
      }
    }
    setAddingTarifa(false);
    setEditingTarifaId(null);
    setTarifaForm(null);
  }, [servicio, focusTarifaId, focusAddTarifa]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !savingServicio && !savingTarifa) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, savingServicio, savingTarifa, onClose]);

  if (!open || !servicio || !draft || typeof document === "undefined") return null;

  const busy = savingServicio || savingTarifa;
  const tarifas = draft.tarifas ?? [];

  const handleSaveServicio = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nombre.trim();
    if (!trimmed) {
      setError("El nombre es obligatorio.");
      return;
    }
    if (trimmed.length > 150) {
      setError("El nombre no puede superar 150 caracteres.");
      return;
    }
    const desc = descripcion.trim();
    if (desc.length > 5000) {
      setError("La descripción no puede superar 5000 caracteres.");
      return;
    }

    setSavingServicio(true);
    setError("");
    const startedAt = Date.now();
    try {
      await updateServicioWithApi(accessToken, servicio.id, {
        nombre: trimmed,
        descripcion: desc || null,
      });
      const refreshed = await refreshServicioWithApi(accessToken, servicio.id);
      await delayRemaining(DEFAULT_MIN_LOADING_MS, startedAt);
      setDraft(refreshed);
      setNombre(refreshed.nombre);
      setDescripcion(refreshed.descripcion ?? "");
      onUpdated(refreshed);
      onNotify("Servicio actualizado", "success", refreshed.nombre);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? getApiErrorMessages(err).join(" ")
          : "No se pudo actualizar el servicio."
      );
    } finally {
      setSavingServicio(false);
    }
  };

  const startAddTarifa = () => {
    setAddingTarifa(true);
    setEditingTarifaId(null);
    setTarifaForm(defaultTarifaForm());
    setError("");
  };

  const startEditTarifa = (tarifa: ServicioTarifaDto) => {
    setAddingTarifa(false);
    setEditingTarifaId(tarifa.id);
    setTarifaForm(tarifaToForm(tarifa));
    setError("");
  };

  const cancelTarifaForm = () => {
    setAddingTarifa(false);
    setEditingTarifaId(null);
    setTarifaForm(null);
    setError("");
  };

  const parseTarifaBody = (): CreateServicioTarifaBody | null => {
    if (!tarifaForm) return null;
    const valor = Number(tarifaForm.valor.replace(",", "."));
    if (!Number.isFinite(valor) || valor <= 0) {
      setError("Ingresá un valor mayor a 0.");
      return null;
    }
    return {
      modalidadCobro: tarifaForm.modalidadCobro,
      tipoJornada: tarifaForm.tipoJornada,
      tipoDia: tarifaForm.tipoDia,
      valor,
    };
  };

  const handleCreateTarifa = async () => {
    const body = parseTarifaBody();
    if (!body) return;

    setSavingTarifa(true);
    setError("");
    const startedAt = Date.now();
    try {
      const created = await createServicioTarifaWithApi(accessToken, servicio.id, body);
      await delayRemaining(DEFAULT_MIN_LOADING_MS, startedAt);
      const next = appendTarifaInServicio(draft, created);
      setDraft(next);
      onUpdated(next);
      cancelTarifaForm();
      onNotify("Tarifa agregada", "success", formatTarifaValor(created.valor));
    } catch (err) {
      setError(
        err instanceof ApiError
          ? getApiErrorMessages(err).join(" ")
          : "No se pudo agregar la tarifa."
      );
    } finally {
      setSavingTarifa(false);
    }
  };

  const handleSaveTarifa = async () => {
    if (!tarifaForm || editingTarifaId == null) return;

    const parsed = parseTarifaBody();
    if (!parsed) return;

    const body: UpdateServicioTarifaBody = parsed;

    setSavingTarifa(true);
    setError("");
    const startedAt = Date.now();
    try {
      const updated = await updateServicioTarifaWithApi(
        accessToken,
        servicio.id,
        editingTarifaId,
        body
      );
      await delayRemaining(DEFAULT_MIN_LOADING_MS, startedAt);
      const next = mergeTarifaInServicio(draft, updated);
      setDraft(next);
      onUpdated(next);
      cancelTarifaForm();
      onNotify("Tarifa actualizada", "success", formatTarifaValor(updated.valor));
    } catch (err) {
      setError(
        err instanceof ApiError
          ? getApiErrorMessages(err).join(" ")
          : "No se pudo actualizar la tarifa."
      );
    } finally {
      setSavingTarifa(false);
    }
  };

  const tarifaFormActive = tarifaForm != null && (addingTarifa || editingTarifaId != null);

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="servicio-edit-dialog-title"
    >
      <button
        type="button"
        className="absolute cursor-pointer inset-0 bg-medical-text/55 backdrop-blur-sm"
        aria-label="Cerrar"
        disabled={busy}
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[min(90vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-medical-border bg-white shadow-xl">
        <div className="flex shrink-0 items-center justify-between border-b border-medical-border bg-medical-primary px-5 py-4">
          <div className="flex min-w-0 items-center gap-2 text-white">
            <Layers className="size-5 shrink-0" />
            <h2 id="servicio-edit-dialog-title" className="truncate text-base font-semibold">
              Editar servicio
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 cursor-pointer text-white hover:bg-white/15 hover:text-white"
            disabled={busy}
            onClick={onClose}
          >
            <X className="size-5" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {error ? (
            <p className="mb-4 rounded-lg border border-medical-danger/30 bg-medical-danger/10 px-3 py-2 text-sm text-medical-danger">
              {error}
            </p>
          ) : null}

          <form onSubmit={(e) => void handleSaveServicio(e)} className="space-y-4">
            <div>
              <Label htmlFor="edit-servicio-nombre" className="mb-1.5 block text-sm font-medium">
                Nombre <span className="text-medical-danger">*</span>
              </Label>
              <input
                id="edit-servicio-nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className={inputClass}
                disabled={busy}
              />
            </div>
            <div>
              <Label htmlFor="edit-servicio-desc" className="mb-1.5 block text-sm font-medium">
                Descripción
              </Label>
              <textarea
                id="edit-servicio-desc"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className={textareaClass}
                disabled={busy}
                placeholder="Opcional"
              />
            </div>
            <Button
              type="submit"
              disabled={busy}
              className="w-full cursor-pointer bg-medical-primary text-white hover:bg-medical-primaryDark sm:w-auto"
            >
              {savingServicio ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Guardando servicio…
                </>
              ) : (
                "Guardar datos del servicio"
              )}
            </Button>
          </form>

          <div className="mt-8 border-t border-medical-border pt-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-sm font-semibold text-medical-text">
                <Banknote className="size-4 text-medical-primary" />
                Tarifas del catálogo
              </p>
              {!tarifaFormActive ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  className="cursor-pointer border-medical-primary/25 text-medical-primary hover:bg-medical-secondary"
                  onClick={startAddTarifa}
                >
                  <Plus className="size-3.5" />
                  Agregar tarifa
                </Button>
              ) : null}
            </div>
            {tarifas.length === 0 && !addingTarifa ? (
              <p className="text-sm text-medical-mutedText">
                Este servicio no tiene tarifas. Agregá al menos una para liquidar visitas.
              </p>
            ) : null}
            {tarifas.length > 0 ? (
              <ul className="space-y-3">
                {tarifas.map((tarifa) => {
                  const isEditing = editingTarifaId === tarifa.id && tarifaForm && !addingTarifa;
                  return (
                    <li
                      key={tarifa.id}
                      className="rounded-xl border border-medical-border/80 bg-medical-surface/50 p-4"
                    >
                      {isEditing ? (
                        <div className="space-y-3">
                          <p className="text-sm font-semibold text-medical-text">Editar tarifa</p>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                              <Label className="mb-1.5 block text-xs font-medium">
                                Modalidad de cobro
                              </Label>
                              <Select
                                value={tarifaForm.modalidadCobro}
                                onValueChange={(v) =>
                                  setTarifaForm((f) =>
                                    f ? { ...f, modalidadCobro: v as ModalidadCobro } : f
                                  )
                                }
                                disabled={busy}
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
                              <Label className="mb-1.5 block text-xs font-medium">Valor</Label>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={tarifaForm.valor}
                                onChange={(e) =>
                                  setTarifaForm((f) => (f ? { ...f, valor: e.target.value } : f))
                                }
                                className={inputClass}
                                disabled={busy}
                              />
                            </div>
                            <div>
                              <Label className="mb-1.5 block text-xs font-medium">Jornada</Label>
                              <Select
                                value={tarifaForm.tipoJornada}
                                onValueChange={(v) =>
                                  setTarifaForm((f) =>
                                    f ? { ...f, tipoJornada: v as TipoJornada } : f
                                  )
                                }
                                disabled={busy}
                              >
                                <SelectTrigger className={inputClass}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent position="popper">
                                  {TIPOS_JORNADA.map((j) => (
                                    <SelectItem key={j} value={j}>
                                      {TIPO_JORNADA_LABELS[j]}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="mb-1.5 block text-xs font-medium">Tipo de día</Label>
                              <Select
                                value={tarifaForm.tipoDia}
                                onValueChange={(v) =>
                                  setTarifaForm((f) => (f ? { ...f, tipoDia: v as TipoDia } : f))
                                }
                                disabled={busy}
                              >
                                <SelectTrigger className={inputClass}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent position="popper">
                                  {TIPOS_DIA.map((d) => (
                                    <SelectItem key={d} value={d}>
                                      {TIPO_DIA_LABELS[d]}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="sm"
                              disabled={busy}
                              className="cursor-pointer bg-medical-primary text-white hover:bg-medical-primaryDark"
                              onClick={() => void handleSaveTarifa()}
                            >
                              {savingTarifa ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : null}
                              Guardar cambios
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="cursor-pointer"
                              disabled={busy}
                              onClick={cancelTarifaForm}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-medical-text">
                              {formatTarifaValor(tarifa.valor)}
                            </p>
                            <p className="mt-0.5 text-xs text-medical-mutedText">
                              {formatTarifaContexto(tarifa)}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={busy || tarifaFormActive}
                            className="shrink-0 cursor-pointer border-medical-primary/25 text-medical-primary"
                            onClick={() => startEditTarifa(tarifa)}
                          >
                            <Pencil className="size-3.5" />
                            Editar
                          </Button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : null}
            {addingTarifa && tarifaForm ? (
              <div
                className={cn(
                  "space-y-3 rounded-xl border border-dashed border-medical-primary/35 bg-medical-primary/5 p-4",
                  tarifas.length > 0 && "mt-3"
                )}
              >
                <p className="text-sm font-semibold text-medical-text">Nueva tarifa</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label className="mb-1.5 block text-xs font-medium">Modalidad de cobro</Label>
                    <Select
                      value={tarifaForm.modalidadCobro}
                      onValueChange={(v) =>
                        setTarifaForm((f) =>
                          f ? { ...f, modalidadCobro: v as ModalidadCobro } : f
                        )
                      }
                      disabled={busy}
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
                    <Label className="mb-1.5 block text-xs font-medium">Valor</Label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={tarifaForm.valor}
                      onChange={(e) =>
                        setTarifaForm((f) => (f ? { ...f, valor: e.target.value } : f))
                      }
                      className={inputClass}
                      disabled={busy}
                      placeholder="Ej. 1500"
                    />
                  </div>
                  <div>
                    <Label className="mb-1.5 block text-xs font-medium">Jornada</Label>
                    <Select
                      value={tarifaForm.tipoJornada}
                      onValueChange={(v) =>
                        setTarifaForm((f) => (f ? { ...f, tipoJornada: v as TipoJornada } : f))
                      }
                      disabled={busy}
                    >
                      <SelectTrigger className={inputClass}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {TIPOS_JORNADA.map((j) => (
                          <SelectItem key={j} value={j}>
                            {TIPO_JORNADA_LABELS[j]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-1.5 block text-xs font-medium">Tipo de día</Label>
                    <Select
                      value={tarifaForm.tipoDia}
                      onValueChange={(v) =>
                        setTarifaForm((f) => (f ? { ...f, tipoDia: v as TipoDia } : f))
                      }
                      disabled={busy}
                    >
                      <SelectTrigger className={inputClass}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {TIPOS_DIA.map((d) => (
                          <SelectItem key={d} value={d}>
                            {TIPO_DIA_LABELS[d]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={busy}
                    className="cursor-pointer bg-medical-primary text-white hover:bg-medical-primaryDark"
                    onClick={() => void handleCreateTarifa()}
                  >
                    {savingTarifa ? <Loader2 className="size-3.5 animate-spin" /> : null}
                    Guardar tarifa
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="cursor-pointer"
                    disabled={busy}
                    onClick={cancelTarifaForm}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="shrink-0 border-t border-medical-border bg-medical-surface/80 px-5 py-4 sm:px-6">
          <Button
            type="button"
            variant="outline"
            className="w-full cursor-pointer sm:w-auto"
            disabled={busy}
            onClick={onClose}
          >
            Cerrar
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
