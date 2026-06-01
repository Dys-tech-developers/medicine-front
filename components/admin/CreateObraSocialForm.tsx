"use client";

import { useId, useState } from "react";
import { ArrowLeft, Building2, Loader2, Plus } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { getApiErrorMessages } from "@/lib/api/format-api-error";
import { createObraSocialWithApi } from "@/lib/api/obras-sociales";
import type { ObraSocialListItemDto } from "@/lib/api/types";
import {
  DEFAULT_MIN_LOADING_MS,
  delayRemaining,
} from "@/lib/loading/minimum-duration";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ToastStack } from "@/components/ui/toast-stack";
import { useToast } from "@/components/ui/use-toast";

const inputClass =
  "h-11 w-full rounded-xl border border-medical-border bg-medical-surface/80 px-3.5 text-sm text-medical-text outline-none transition placeholder:text-medical-mutedText/60 focus:border-medical-primary focus:bg-medical-card focus:ring-4 focus:ring-medical-primary/12 disabled:opacity-60";

type CreateObraSocialFormProps = {
  accessToken: string;
  onSuccess: (obra: ObraSocialListItemDto) => void;
  onCancel: () => void;
};

function validate(nombre: string, codigo: string): string | null {
  if (!nombre.trim()) return "El nombre es obligatorio.";
  if (!codigo.trim()) return "El código es obligatorio.";
  return null;
}

export function CreateObraSocialForm({
  accessToken,
  onSuccess,
  onCancel,
}: CreateObraSocialFormProps) {
  const estadoSwitchId = useId();
  const { toasts, showToast, dismiss } = useToast();
  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [estado, setEstado] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate(nombre, codigo);
    if (validationError) {
      setErrorMessages([validationError]);
      showToast(validationError, "error");
      return;
    }

    setLoading(true);
    setErrorMessages([]);
    const startedAt = Date.now();
    try {
      const result = await createObraSocialWithApi(accessToken, {
        nombre: nombre.trim(),
        codigo: codigo.trim(),
        estado,
      });
      await delayRemaining(DEFAULT_MIN_LOADING_MS, startedAt);
      onSuccess(result);
    } catch (error) {
      const messages =
        error instanceof ApiError
          ? getApiErrorMessages(error)
          : error instanceof Error
            ? [error.message]
            : ["No se pudo crear la obra social."];
      setErrorMessages(messages);
      showToast(messages[0] ?? "Error", "error");
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
            <p className="text-sm font-medium text-medical-text">Creando obra social…</p>
          </div>
        ) : null}
        <div className="border-b border-medical-border/60 bg-linear-to-r from-medical-secondary/40 via-white to-white px-5 py-4 sm:px-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-medical-primary/20 bg-white px-3 py-1 text-xs font-semibold text-medical-primary shadow-sm">
              <Building2 className="h-3.5 w-3.5" />
              Alta de obra social
            </span>
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="inline-flex items-center gap-1.5 cursor-pointer rounded-xl px-3 py-2 text-sm font-medium text-medical-mutedText transition hover:bg-medical-secondary hover:text-medical-text disabled:opacity-60"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al listado
            </button>
          </div>
        </div>
        <form onSubmit={(e) => void handleSubmit(e)} className="px-5 py-6 sm:px-7">
          {errorMessages.length > 0 ? (
            <ul className="mb-4 space-y-1 rounded-xl border border-medical-danger/30 bg-medical-danger/10 px-4 py-3 text-sm text-medical-danger">
              {errorMessages.map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
            </ul>
          ) : null}
          <div className="grid max-w-xl gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="obra-nombre" className="mb-1.5 block text-sm font-medium text-medical-text">
                Nombre <span className="text-medical-danger">*</span>
              </label>
              <input
                id="obra-nombre"
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value);
                  setErrorMessages([]);
                }}
                placeholder="OSDE"
                className={inputClass}
                disabled={loading}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="obra-codigo" className="mb-1.5 block text-sm font-medium text-medical-text">
                Código <span className="text-medical-danger">*</span>
              </label>
              <input
                id="obra-codigo"
                value={codigo}
                onChange={(e) => {
                  setCodigo(e.target.value);
                  setErrorMessages([]);
                }}
                placeholder="OSDE-001"
                className={inputClass}
                disabled={loading}
              />
            </div>
            <div className="flex items-center gap-3 sm:col-span-2">
              <Switch
                id={estadoSwitchId}
                checked={estado}
                onCheckedChange={setEstado}
                disabled={loading}
              />
              <Label htmlFor={estadoSwitchId} className="text-sm font-medium text-medical-text">
                Activa al crear
              </Label>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-11 items-center cursor-pointer justify-center gap-2 rounded-2xl bg-linear-to-r from-medical-primary to-medical-primaryDark px-8 text-sm font-semibold text-white shadow-lg shadow-medical-primary/25 disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creando…
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Crear obra social
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
