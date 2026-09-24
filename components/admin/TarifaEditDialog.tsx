"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Banknote, Loader2, X } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { getApiErrorMessages } from "@/lib/api/format-api-error";
import {
  createServicioTarifaWithApi,
  updateServicioTarifaWithApi,
} from "@/lib/api/servicios";
import type {
  CreateServicioTarifaBody,
  ModalidadCobro,
  ServicioTarifaDto,
  TipoDia,
  TipoJornada,
  UpdateServicioTarifaBody,
} from "@/lib/api/types";
import {
  DEFAULT_MIN_LOADING_MS,
  delayRemaining,
} from "@/lib/loading/minimum-duration";
import { formatTarifaValor } from "@/lib/servicios-display";
import {
  MODALIDAD_COBRO_LABELS,
  MODALIDADES_COBRO,
  TIPO_DIA_LABELS,
  TIPO_JORNADA_LABELS,
  TIPOS_DIA,
  TIPOS_JORNADA,
  TARIFAS_COBRO_HELP,
  normalizeTipoDia,
  validateTarifasJornadaCompatibilidad,
} from "@/lib/servicios-tarifas-labels";
import type { TarifaListItem } from "@/lib/tarifas-list";
import { Button } from "@/components/ui/button";
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

type TarifaFormState = {
  modalidadCobro: ModalidadCobro;
  tipoJornada: TipoJornada;
  tipoDia: TipoDia;
  valor: string;
};

function defaultTarifaForm(): TarifaFormState {
  return {
    modalidadCobro: "por_hora",
    tipoJornada: "cualquiera",
    tipoDia: "cualquiera",
    valor: "",
  };
}

function tarifaToForm(tarifa: Pick<ServicioTarifaDto, "modalidadCobro" | "tipoJornada" | "tipoDia" | "valor">): TarifaFormState {
  return {
    modalidadCobro: tarifa.modalidadCobro,
    tipoJornada: tarifa.tipoJornada,
    tipoDia: normalizeTipoDia(tarifa.tipoDia),
    valor: String(tarifa.valor),
  };
}

type TarifaEditDialogProps = {
  open: boolean;
  mode: "edit" | "create";
  servicioId: number;
  servicioNombre: string;
  /** Tarifa a editar (solo mode=edit). */
  tarifa?: TarifaListItem | null;
  /** Otras tarifas del mismo servicio (para validar unicidad). */
  siblingTarifas: Pick<
    ServicioTarifaDto,
    "id" | "modalidadCobro" | "tipoJornada" | "tipoDia"
  >[];
  accessToken: string;
  onClose: () => void;
  onSaved: (tarifa: ServicioTarifaDto, servicioId: number) => void;
  onNotify: (title: string, type: "success" | "error", detail?: string) => void;
};

export function TarifaEditDialog({
  open,
  mode,
  servicioId,
  servicioNombre,
  tarifa,
  siblingTarifas,
  accessToken,
  onClose,
  onSaved,
  onNotify,
}: TarifaEditDialogProps) {
  const [form, setForm] = useState<TarifaFormState>(defaultTarifaForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && tarifa) {
      setForm(tarifaToForm(tarifa));
    } else {
      setForm(defaultTarifaForm());
    }
    setError("");
  }, [open, mode, tarifa]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, saving, onClose]);

  if (!open || typeof document === "undefined") return null;
  if (mode === "edit" && !tarifa) return null;

  const parseBody = (): CreateServicioTarifaBody | null => {
    const valor = Number(form.valor.replace(",", "."));
    if (!Number.isFinite(valor) || valor <= 0) {
      setError("Ingresá un valor mayor a 0.");
      return null;
    }
    const candidate = {
      modalidadCobro: form.modalidadCobro,
      tipoJornada: form.tipoJornada,
      tipoDia: form.tipoDia,
      valor,
    };
    const otras = siblingTarifas
      .filter((t) => (mode === "edit" && tarifa ? t.id !== tarifa.id : true))
      .map((t) => ({
        modalidadCobro: t.modalidadCobro,
        tipoJornada: t.tipoJornada,
        tipoDia: normalizeTipoDia(t.tipoDia),
      }));
    const compatError = validateTarifasJornadaCompatibilidad([...otras, candidate]);
    if (compatError) {
      setError(compatError);
      return null;
    }
    return candidate;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = parseBody();
    if (!body) return;

    setSaving(true);
    setError("");
    const startedAt = Date.now();
    try {
      const saved =
        mode === "edit" && tarifa
          ? await updateServicioTarifaWithApi(
              accessToken,
              servicioId,
              tarifa.id,
              body as UpdateServicioTarifaBody
            )
          : await createServicioTarifaWithApi(accessToken, servicioId, body);
      await delayRemaining(DEFAULT_MIN_LOADING_MS, startedAt);
      onSaved(saved, servicioId);
      onNotify(
        mode === "edit" ? "Tarifa actualizada" : "Tarifa creada",
        "success",
        `${servicioNombre} · ${formatTarifaValor(saved.valor)}`
      );
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? getApiErrorMessages(err).join(" ")
          : mode === "edit"
            ? "No se pudo actualizar la tarifa."
            : "No se pudo crear la tarifa."
      );
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tarifa-edit-dialog-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-pointer bg-medical-text/55 backdrop-blur-sm"
        aria-label="Cerrar"
        disabled={saving}
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[min(90vh,640px)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-medical-border bg-white shadow-xl">
        <div className="flex shrink-0 items-center justify-between border-b border-medical-border bg-medical-primary px-5 py-4">
          <div className="flex min-w-0 items-center gap-2 text-white">
            <Banknote className="size-5 shrink-0" />
            <div className="min-w-0">
              <h2 id="tarifa-edit-dialog-title" className="truncate text-base font-semibold">
                {mode === "edit" ? "Editar tarifa" : "Nueva tarifa"}
              </h2>
              <p className="truncate text-xs text-white/80">{servicioNombre}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 cursor-pointer text-white hover:bg-white/15 hover:text-white"
            disabled={saving}
            onClick={onClose}
          >
            <X className="size-5" />
          </Button>
        </div>

        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6"
        >
          {error ? (
            <p className="mb-4 rounded-lg border border-medical-danger/30 bg-medical-danger/10 px-3 py-2 text-sm text-medical-danger">
              {error}
            </p>
          ) : null}

          <p className="mb-4 text-xs text-medical-mutedText">{TARIFAS_COBRO_HELP}</p>

          <div className="space-y-4">
            <div>
              <Label className="mb-1.5 block text-sm font-medium">Modalidad de cobro</Label>
              <Select
                value={form.modalidadCobro}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, modalidadCobro: v as ModalidadCobro }))
                }
                disabled={saving}
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
              <Label htmlFor="tarifa-valor" className="mb-1.5 block text-sm font-medium">
                Valor unitario <span className="text-medical-danger">*</span>
              </Label>
              <input
                id="tarifa-valor"
                type="text"
                inputMode="decimal"
                value={form.valor}
                onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))}
                className={inputClass}
                disabled={saving}
                placeholder="Ej. 1500"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="mb-1.5 block text-sm font-medium">Jornada</Label>
                <Select
                  value={form.tipoJornada}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, tipoJornada: v as TipoJornada }))
                  }
                  disabled={saving}
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
                <Label className="mb-1.5 block text-sm font-medium">Tipo de día</Label>
                <Select
                  value={form.tipoDia}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, tipoDia: v as TipoDia }))
                  }
                  disabled={saving}
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
          </div>

          <div className="mt-6 flex flex-wrap gap-2 border-t border-medical-border pt-4">
            <Button
              type="submit"
              disabled={saving}
              className="cursor-pointer bg-medical-primary text-white hover:bg-medical-primaryDark"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              {mode === "edit" ? "Guardar cambios" : "Crear tarifa"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              disabled={saving}
              onClick={onClose}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
