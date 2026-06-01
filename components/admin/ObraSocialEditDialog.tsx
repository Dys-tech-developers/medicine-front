"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Building2, Loader2, X } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { getApiErrorMessages } from "@/lib/api/format-api-error";
import { updateObraSocialWithApi } from "@/lib/api/obras-sociales";
import type { ObraSocialListItemDto, UpdateObraSocialBody } from "@/lib/api/types";
import {
  DEFAULT_MIN_LOADING_MS,
  delayRemaining,
} from "@/lib/loading/minimum-duration";
import { Button } from "@/components/ui/button";

const inputClass =
  "h-10 w-full rounded-xl border border-medical-border bg-medical-surface/80 px-3 text-sm text-medical-text outline-none focus:border-medical-primary focus:bg-medical-card focus:ring-4 focus:ring-medical-primary/12 disabled:opacity-60";

type ObraSocialEditDialogProps = {
  open: boolean;
  obra: ObraSocialListItemDto | null;
  accessToken: string;
  onClose: () => void;
  onUpdated: (obra: ObraSocialListItemDto) => void;
};

export function ObraSocialEditDialog({
  open,
  obra,
  accessToken,
  onClose,
  onUpdated,
}: ObraSocialEditDialogProps) {
  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (obra) {
      setNombre(obra.nombre);
      setCodigo(obra.codigo);
    }
    setError("");
  }, [obra]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, loading, onClose]);

  if (!open || !obra || typeof document === "undefined") return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedNombre = nombre.trim();
    const trimmedCodigo = codigo.trim();
    if (!trimmedNombre) {
      setError("El nombre es obligatorio.");
      return;
    }
    if (!trimmedCodigo) {
      setError("El código es obligatorio.");
      return;
    }

    const body: UpdateObraSocialBody = {
      nombre: trimmedNombre,
      codigo: trimmedCodigo,
    };

    setLoading(true);
    setError("");
    const startedAt = Date.now();
    try {
      const updated = await updateObraSocialWithApi(accessToken, obra.id, body);
      await delayRemaining(DEFAULT_MIN_LOADING_MS, startedAt);
      onUpdated(updated);
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? getApiErrorMessages(err).join(" ")
          : "No se pudo actualizar la obra social."
      );
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute cursor-pointer inset-0 bg-medical-text/55 backdrop-blur-sm"
        aria-label="Cerrar"
        disabled={loading}
        onClick={onClose}
      />
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-medical-border bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-medical-border bg-medical-primary px-5 py-4">
          <div className="flex items-center gap-2 text-white">
            <Building2 className="size-5" />
            <h2 className="text-base font-semibold">Editar obra social</h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-white cursor-pointer hover:bg-white/15"
            disabled={loading}
            onClick={onClose}
          >
            <X className="size-5" />
          </Button>
        </div>
        <div className="space-y-4 px-5 py-5 sm:px-6">
          {error ? (
            <p className="rounded-lg border border-medical-danger/30 bg-medical-danger/10 px-3 py-2 text-sm text-medical-danger">
              {error}
            </p>
          ) : null}
          <div>
            <label htmlFor="obra-edit-nombre" className="mb-1.5 block text-sm font-medium text-medical-text">
              Nombre
            </label>
            <input
              id="obra-edit-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className={inputClass}
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="obra-edit-codigo" className="mb-1.5 block text-sm font-medium text-medical-text">
              Código
            </label>
            <input
              id="obra-edit-codigo"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              className={inputClass}
              disabled={loading}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-medical-border bg-medical-surface/80 px-5 py-4 sm:px-6">
          <Button className="cursor-pointer" type="button" variant="outline" disabled={loading} onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            className="bg-medical-primary cursor-pointer text-white hover:bg-medical-primaryDark"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Guardando…
              </>
            ) : (
              "Guardar"
            )}
          </Button>
        </div>
      </form>
    </div>,
    document.body
  );
}
