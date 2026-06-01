"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowLeft,
  Boxes,
  Loader2,
  PackagePlus,
} from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { getApiErrorMessages } from "@/lib/api/format-api-error";
import { createInsumoWithApi } from "@/lib/api/insumos";
import type { CreateInsumoBody, InsumoDto } from "@/lib/api/types";
import {
  DEFAULT_MIN_LOADING_MS,
  delayRemaining,
} from "@/lib/loading/minimum-duration";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToastStack } from "@/components/ui/toast-stack";
import { useToast } from "@/components/ui/use-toast";
import {
  UNIDAD_MEDIDA_LABELS,
  UNIDADES_MEDIDA,
  type UnidadMedida,
} from "@/lib/insumos-unidades";

const inputClass =
  "h-11 w-full rounded-xl border border-medical-border bg-medical-surface/80 px-3.5 text-sm text-medical-text outline-none transition placeholder:text-medical-mutedText/60 focus:border-medical-primary focus:bg-medical-card focus:ring-4 focus:ring-medical-primary/12 disabled:cursor-not-allowed disabled:opacity-60";

type FormState = {
  nombre: string;
  descripcion: string;
  codigo: string;
  stockActual: string;
  stockMinimo: string;
  unidadMedida: UnidadMedida;
  requiereVencimiento: boolean;
  fechaVencimiento: string;
  estado: boolean;
};

const INITIAL: FormState = {
  nombre: "",
  descripcion: "",
  codigo: "",
  stockActual: "0",
  stockMinimo: "10",
  unidadMedida: "unidad",
  requiereVencimiento: false,
  fechaVencimiento: "",
  estado: true,
};

function parseNonNegativeInt(value: string, fieldLabel: string): number | null {
  const n = Number.parseInt(value, 10);
  if (Number.isNaN(n) || n < 0) return null;
  if (String(n) !== value.trim() && value.trim() !== String(n)) {
    return Number.isNaN(n) ? null : n;
  }
  return n;
}

function validateForm(values: FormState): string | null {
  if (!values.nombre.trim()) return "El nombre es obligatorio.";
  if (!values.codigo.trim()) return "El código es obligatorio.";
  if (parseNonNegativeInt(values.stockActual, "stock") === null) {
    return "El stock actual debe ser un número entero ≥ 0.";
  }
  if (parseNonNegativeInt(values.stockMinimo, "mínimo") === null) {
    return "El stock mínimo debe ser un número entero ≥ 0.";
  }
  if (values.requiereVencimiento && !values.fechaVencimiento) {
    return "Indicá la fecha de vencimiento o desmarcá «Requiere vencimiento».";
  }
  return null;
}

function toPayload(values: FormState): CreateInsumoBody {
  const body: CreateInsumoBody = {
    nombre: values.nombre.trim(),
    codigo: values.codigo.trim().toUpperCase(),
    unidadMedida: values.unidadMedida,
    stockActual: parseNonNegativeInt(values.stockActual, "stock") ?? 0,
    stockMinimo: parseNonNegativeInt(values.stockMinimo, "mínimo") ?? 0,
    requiereVencimiento: values.requiereVencimiento,
    estado: values.estado,
  };
  const desc = values.descripcion.trim();
  if (desc) body.descripcion = desc;
  if (values.requiereVencimiento && values.fechaVencimiento) {
    body.fechaVencimiento = values.fechaVencimiento;
  }
  return body;
}

type CreateInsumoFormProps = {
  accessToken: string;
  onSuccess?: (insumo: InsumoDto) => void;
  onCancel?: () => void;
};

function Field({
  label,
  htmlFor,
  required,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-medical-text">
        {label}
        {required ? <span className="text-medical-danger"> *</span> : null}
      </label>
      {children}
      {hint ? <p className="mt-1.5 text-xs text-medical-mutedText">{hint}</p> : null}
    </div>
  );
}

function FormSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="px-5 py-5 sm:px-6 sm:py-6 lg:px-7">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-medical-primary/15 to-medical-accent/10 ring-1 ring-medical-primary/10">
          <Icon className="h-5 w-5 text-medical-primary" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-medical-text sm:text-base">{title}</h2>
          <p className="text-xs text-medical-mutedText sm:text-sm">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function FormAlert({ messages }: { messages: string[] }) {
  if (messages.length === 0) return null;
  return (
    <div
      role="alert"
      className="mx-5 flex gap-3 rounded-xl border border-medical-danger/30 bg-medical-danger/10 px-4 py-3 sm:mx-7"
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-medical-danger" />
      <ul className="space-y-1 text-sm text-medical-danger">
        {messages.map((msg, i) => (
          <li key={i}>{msg}</li>
        ))}
      </ul>
    </div>
  );
}

export function CreateInsumoForm({ accessToken, onSuccess, onCancel }: CreateInsumoFormProps) {
  const { toasts, showToast, dismiss } = useToast();
  const [values, setValues] = useState<FormState>(INITIAL);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const set =
    <K extends keyof FormState>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const v =
        e.target.type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : e.target.value;
      setValues((prev) => ({ ...prev, [key]: v }));
      setErrorMessages([]);
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessages([]);

    const validationError = validateForm(values);
    if (validationError) {
      setErrorMessages([validationError]);
      showToast(validationError, "error");
      return;
    }

    setLoading(true);
    const startedAt = Date.now();
    try {
      const result = await createInsumoWithApi(accessToken, toPayload(values));
      await delayRemaining(DEFAULT_MIN_LOADING_MS, startedAt);
      setValues(INITIAL);
      onSuccess?.(result);
    } catch (error) {
      const messages =
        error instanceof ApiError
          ? getApiErrorMessages(error)
          : error instanceof Error
            ? [error.message]
            : ["No se pudo crear el insumo. Intentá de nuevo."];
      setErrorMessages(messages);
      showToast(messages[0] ?? "Error al crear insumo", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastStack toasts={toasts} onDismiss={dismiss} />

      <div className="relative overflow-hidden rounded-3xl border border-medical-border/80 bg-white">
        {loading ? (
          <div
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-white/85 backdrop-blur-sm"
            aria-busy="true"
          >
            <Loader2 className="h-10 w-10 animate-spin text-medical-primary" />
            <p className="text-sm font-medium text-medical-text">Registrando insumo…</p>
          </div>
        ) : null}

        <div className="border-b border-medical-border/60 bg-linear-to-r from-medical-secondary/40 via-white to-white px-5 py-4 sm:px-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-medical-primary/20 bg-white px-3 py-1 text-xs font-semibold text-medical-primary shadow-sm">
              <PackagePlus className="h-3.5 w-3.5" />
              Alta de insumo
            </span>
            {onCancel ? (
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-medical-mutedText hover:bg-medical-secondary hover:text-medical-text disabled:opacity-60"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al inventario
              </button>
            ) : null}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="lg:grid lg:grid-cols-2 lg:divide-x lg:divide-medical-border/60">
            <FormSection icon={Boxes} title="Identificación" description="Nombre, código y descripción.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nombre" htmlFor="insumo-nombre" required>
                  <input
                    id="insumo-nombre"
                    value={values.nombre}
                    onChange={set("nombre")}
                    placeholder="Guantes M"
                    className={inputClass}
                    disabled={loading}
                  />
                </Field>
                <Field label="Código" htmlFor="insumo-codigo" required hint="Ej. INS-001">
                  <input
                    id="insumo-codigo"
                    value={values.codigo}
                    onChange={set("codigo")}
                    placeholder="INS-001"
                    className={`${inputClass} uppercase`}
                    disabled={loading}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Descripción" htmlFor="insumo-descripcion">
                    <textarea
                      id="insumo-descripcion"
                      value={values.descripcion}
                      onChange={set("descripcion")}
                      rows={2}
                      placeholder="Caja x 100 unidades"
                      className={`${inputClass} min-h-[88px] resize-y py-2.5`}
                      disabled={loading}
                    />
                  </Field>
                </div>
                <Field label="Unidad de medida" htmlFor="insumo-unidad" required>
                  <Select
                    value={values.unidadMedida}
                    onValueChange={(v) => {
                      setValues((prev) => ({
                        ...prev,
                        unidadMedida: v as UnidadMedida,
                      }));
                      setErrorMessages([]);
                    }}
                    disabled={loading}
                  >
                    <SelectTrigger id="insumo-unidad" className={inputClass}>
                      <SelectValue placeholder="Seleccioná una unidad" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {UNIDADES_MEDIDA.map((u) => (
                        <SelectItem key={u} value={u}>
                          {UNIDAD_MEDIDA_LABELS[u]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </FormSection>

            <FormSection icon={PackagePlus} title="Stock inicial" description="Cantidades y vencimiento.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Stock actual" htmlFor="insumo-stock-actual">
                  <input
                    id="insumo-stock-actual"
                    type="number"
                    min={0}
                    step={1}
                    value={values.stockActual}
                    onChange={set("stockActual")}
                    className={inputClass}
                    disabled={loading}
                  />
                </Field>
                <Field label="Stock mínimo" htmlFor="insumo-stock-minimo">
                  <input
                    id="insumo-stock-minimo"
                    type="number"
                    min={0}
                    step={1}
                    value={values.stockMinimo}
                    onChange={set("stockMinimo")}
                    className={inputClass}
                    disabled={loading}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-medical-border bg-medical-surface/60 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={values.requiereVencimiento}
                      onChange={set("requiereVencimiento")}
                      disabled={loading}
                      className="h-4 w-4 rounded border-medical-border text-medical-primary"
                    />
                    <span className="text-sm font-medium text-medical-text">Requiere vencimiento</span>
                  </label>
                </div>
                {values.requiereVencimiento ? (
                  <div className="sm:col-span-2">
                    <Field label="Fecha de vencimiento" htmlFor="insumo-vencimiento" required>
                      <input
                        id="insumo-vencimiento"
                        type="date"
                        value={values.fechaVencimiento}
                        onChange={set("fechaVencimiento")}
                        className={inputClass}
                        disabled={loading}
                      />
                    </Field>
                  </div>
                ) : null}
                <div className="sm:col-span-2">
                  <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-medical-border bg-medical-surface/60 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={values.estado}
                      onChange={set("estado")}
                      disabled={loading}
                      className="h-4 w-4 rounded border-medical-border text-medical-primary"
                    />
                    <span className="text-sm font-medium text-medical-text">Insumo activo</span>
                  </label>
                </div>
              </div>
            </FormSection>
          </div>

          <FormAlert messages={errorMessages} />

          <div className="flex flex-col gap-3 border-t border-medical-border/60 bg-medical-surface/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-7">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-medical-primary to-medical-primaryDark px-8 text-sm font-semibold text-white shadow-lg shadow-medical-primary/25 disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creando…
                </>
              ) : (
                <>
                  <PackagePlus className="h-4 w-4 " />
                  Crear insumo
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
