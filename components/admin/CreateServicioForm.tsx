"use client";

import { useCallback, useId, useState } from "react";
import { ArrowLeft, Layers, Loader2, Plus, Trash2 } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { getApiErrorMessages } from "@/lib/api/format-api-error";
import { createServicioWithApi } from "@/lib/api/servicios";
import type {
  CreateServicioBody,
  CreateServicioTarifaBody,
  ModalidadCobro,
  ServicioConTarifasDto,
  TipoDia,
  TipoJornada,
} from "@/lib/api/types";
import {
  DEFAULT_MIN_LOADING_MS,
  delayRemaining,
} from "@/lib/loading/minimum-duration";
import {
  MODALIDAD_COBRO_LABELS,
  MODALIDADES_COBRO,
  TIPO_DIA_LABELS,
  TIPO_JORNADA_LABELS,
  TIPOS_DIA,
  TIPOS_JORNADA,
} from "@/lib/servicios-tarifas-labels";
import {
  servicioModoVisitaToFlags,
  type ServicioModoVisitaFormValue,
} from "@/lib/servicios-display";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ServicioModoVisitaSelector } from "@/components/admin/ServicioModoVisitaSelector";
import { ToastStack } from "@/components/ui/toast-stack";
import { useToast } from "@/components/ui/use-toast";

const inputClass =
  "h-11 w-full rounded-xl border border-medical-border bg-medical-surface/80 px-3.5 text-sm text-medical-text outline-none transition placeholder:text-medical-mutedText/60 focus:border-medical-primary focus:bg-medical-card focus:ring-4 focus:ring-medical-primary/12 disabled:opacity-60";

const textareaClass =
  "min-h-[88px] w-full resize-y rounded-xl border border-medical-border bg-medical-surface/80 px-3.5 py-3 text-sm text-medical-text outline-none transition placeholder:text-medical-mutedText/60 focus:border-medical-primary focus:bg-medical-card focus:ring-4 focus:ring-medical-primary/12 disabled:opacity-60";

type TarifaFormRow = {
  key: string;
  modalidadCobro: ModalidadCobro;
  tipoJornada: TipoJornada;
  tipoDia: TipoDia;
  valor: string;
};

function newTarifaRow(): TarifaFormRow {
  return {
    key: crypto.randomUUID(),
    modalidadCobro: "por_hora",
    tipoJornada: "diurno",
    tipoDia: "habil",
    valor: "",
  };
}

function validateForm(
  nombre: string,
  descripcion: string,
  tarifas: TarifaFormRow[]
): string | null {
  const trimmed = nombre.trim();
  if (!trimmed) return "El nombre del servicio es obligatorio.";
  if (trimmed.length > 150) return "El nombre no puede superar 150 caracteres.";
  if (descripcion.trim().length > 5000) {
    return "La descripción no puede superar 5000 caracteres.";
  }
  if (tarifas.length === 0) return "Debés incluir al menos una tarifa.";
  for (let i = 0; i < tarifas.length; i++) {
    const valor = Number(tarifas[i].valor.replace(",", "."));
    if (!Number.isFinite(valor) || valor <= 0) {
      return `Tarifa ${i + 1}: ingresá un valor mayor a 0.`;
    }
  }
  return null;
}

function toPayload(
  nombre: string,
  descripcion: string,
  estado: boolean,
  modoVisita: ServicioModoVisitaFormValue,
  tarifas: TarifaFormRow[]
): CreateServicioBody {
  const desc = descripcion.trim();
  const { controlHorario, modoRelevo } = servicioModoVisitaToFlags(modoVisita);
  return {
    nombre: nombre.trim(),
    ...(desc ? { descripcion: desc } : {}),
    estado,
    ...(controlHorario ? { controlHorario: true } : {}),
    ...(modoRelevo ? { modoRelevo: true } : {}),
    tarifas: tarifas.map(
      (t): CreateServicioTarifaBody => ({
        modalidadCobro: t.modalidadCobro,
        tipoJornada: t.tipoJornada,
        tipoDia: t.tipoDia,
        valor: Number(t.valor.replace(",", ".")),
      })
    ),
  };
}

type CreateServicioFormProps = {
  accessToken: string;
  onSuccess: (servicio: ServicioConTarifasDto) => void;
  onCancel: () => void;
};

export function CreateServicioForm({
  accessToken,
  onSuccess,
  onCancel,
}: CreateServicioFormProps) {
  const estadoSwitchId = useId();
  const modoVisitaFieldName = useId();
  const { toasts, showToast, dismiss } = useToast();
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [estado, setEstado] = useState(true);
  const [modoVisita, setModoVisita] = useState<ServicioModoVisitaFormValue>("registro_unico");
  const [tarifas, setTarifas] = useState<TarifaFormRow[]>(() => [newTarifaRow()]);
  const [loading, setLoading] = useState(false);

  const updateTarifa = useCallback(
    (key: string, patch: Partial<Omit<TarifaFormRow, "key">>) => {
      setTarifas((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
    },
    []
  );

  const addTarifa = useCallback(() => {
    setTarifas((rows) => [...rows, newTarifaRow()]);
  }, []);

  const removeTarifa = useCallback((key: string) => {
    setTarifas((rows) => {
      if (rows.length <= 1) return rows;
      return rows.filter((r) => r.key !== key);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm(nombre, descripcion, tarifas);
    if (validationError) {
      showToast(validationError, "error");
      return;
    }

    setLoading(true);
    const startedAt = Date.now();
    try {
      const created = await createServicioWithApi(
        accessToken,
        toPayload(nombre, descripcion, estado, modoVisita, tarifas)
      );
      await delayRemaining(DEFAULT_MIN_LOADING_MS, startedAt);
      onSuccess(created);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? getApiErrorMessages(err).join(" ")
          : err instanceof Error
            ? err.message
            : "No se pudo crear el servicio.";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastStack toasts={toasts} onDismiss={dismiss} />
      <div className="overflow-hidden rounded-3xl border border-medical-border/80 bg-white">
        <div className="border-b border-medical-border/60 bg-linear-to-r from-medical-secondary/40 via-white to-white px-5 py-4 sm:px-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-medical-primary/20 bg-white px-3 py-1 text-xs font-semibold text-medical-primary shadow-sm">
              <Layers className="h-3.5 w-3.5" />
              Nuevo servicio
            </span>
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-medical-mutedText hover:bg-medical-secondary hover:text-medical-text"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </button>
          </div>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-8 px-5 py-6 sm:px-7">
          <fieldset className="space-y-5" disabled={loading}>
            <legend className="text-sm font-semibold text-medical-text">Datos del servicio</legend>

            <div>
              <label
                htmlFor="servicio-nombre"
                className="mb-1.5 block text-sm font-medium text-medical-text"
              >
                Nombre <span className="text-medical-danger">*</span>
              </label>
              <input
                id="servicio-nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Enfermería domiciliaria"
                className={inputClass}
                maxLength={150}
              />
            </div>

            <div>
              <label
                htmlFor="servicio-descripcion"
                className="mb-1.5 block text-sm font-medium text-medical-text"
              >
                Descripción
              </label>
              <textarea
                id="servicio-descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Detalle opcional del servicio"
                className={textareaClass}
                maxLength={5000}
                rows={3}
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id={estadoSwitchId}
                checked={estado}
                onCheckedChange={setEstado}
                disabled={loading}
              />
              <Label htmlFor={estadoSwitchId} className="text-sm font-medium text-medical-text">
                Servicio activo al crear
              </Label>
            </div>

            <ServicioModoVisitaSelector
              name={modoVisitaFieldName}
              value={modoVisita}
              onChange={setModoVisita}
              disabled={loading}
            />
          </fieldset>

          <fieldset className="space-y-4" disabled={loading}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <legend className="text-sm font-semibold text-medical-text">
                Tarifas <span className="text-medical-danger">*</span>
              </legend>
              <button
                type="button"
                onClick={addTarifa}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-medical-primary/25 bg-medical-secondary/50 px-3 py-2 text-sm font-medium text-medical-primary hover:bg-medical-secondary"
              >
                <Plus className="h-4 w-4" />
                Agregar tarifa
              </button>
            </div>
            <p className="text-xs text-medical-mutedText">
              Incluí al menos una tarifa. Podés combinar jornada, tipo de día y modalidad de cobro.
            </p>

            <div className="space-y-4">
              {tarifas.map((tarifa, index) => (
                <div
                  key={tarifa.key}
                  className="rounded-2xl border border-medical-border/80 bg-medical-surface/50 p-4 sm:p-5"
                >
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-medical-text">Tarifa {index + 1}</p>
                    {tarifas.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeTarifa(tarifa.key)}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-medical-danger hover:bg-medical-danger/10"
                        aria-label={`Quitar tarifa ${index + 1}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Quitar
                      </button>
                    ) : null}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="mb-1.5 block text-sm font-medium">Modalidad de cobro</Label>
                      <Select
                        value={tarifa.modalidadCobro}
                        onValueChange={(v) =>
                          updateTarifa(tarifa.key, { modalidadCobro: v as ModalidadCobro })
                        }
                      >
                        <SelectTrigger className={inputClass}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MODALIDADES_COBRO.map((m) => (
                            <SelectItem key={m} value={m}>
                              {MODALIDAD_COBRO_LABELS[m]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="mb-1.5 block text-sm font-medium">Valor</Label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={tarifa.valor}
                        onChange={(e) => updateTarifa(tarifa.key, { valor: e.target.value })}
                        placeholder="Ej. 8500.50"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <Label className="mb-1.5 block text-sm font-medium">Jornada</Label>
                      <Select
                        value={tarifa.tipoJornada}
                        onValueChange={(v) =>
                          updateTarifa(tarifa.key, { tipoJornada: v as TipoJornada })
                        }
                      >
                        <SelectTrigger className={inputClass}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIPOS_JORNADA.map((j) => (
                            <SelectItem key={j} value={j}>
                              {TIPO_JORNADA_LABELS[j]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="mb-1.5 block text-sm font-medium">Tipo de día</Label>
                      <Select
                        value={tarifa.tipoDia}
                        onValueChange={(v) => updateTarifa(tarifa.key, { tipoDia: v as TipoDia })}
                      >
                        <SelectTrigger className={inputClass}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIPOS_DIA.map((d) => (
                            <SelectItem key={d} value={d}>
                              {TIPO_DIA_LABELS[d]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </fieldset>

          <div className="flex justify-end border-t border-medical-border/60 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-2xl bg-linear-to-r from-medical-primary to-medical-primaryDark px-8 text-sm font-semibold text-white shadow-lg shadow-medical-primary/25 disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando…
                </>
              ) : (
                "Crear servicio"
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
