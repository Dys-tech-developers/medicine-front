"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Layers, Loader2, X } from "lucide-react";
import { PrestadorServiciosPicker } from "@/components/admin/PrestadorServiciosPicker";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import { getApiErrorMessages } from "@/lib/api/format-api-error";
import {
  getPrestadorByIdWithApi,
  updatePrestadorServiciosWithApi,
} from "@/lib/api/prestadores";
import { listServiciosAllWithApi } from "@/lib/api/servicios";
import type { PrestadorListItemDto, ServicioConTarifasDto } from "@/lib/api/types";
import {
  DEFAULT_MIN_LOADING_MS,
  delayRemaining,
} from "@/lib/loading/minimum-duration";

type Props = {
  open: boolean;
  prestador: PrestadorListItemDto | null;
  accessToken: string | null;
  onClose: () => void;
  onUpdated: (prestador: PrestadorListItemDto) => void;
};

export function PrestadorServiciosEditDialog({
  open,
  prestador,
  accessToken,
  onClose,
  onUpdated,
}: Props) {
  const [servicioIds, setServicioIds] = useState<number[]>([]);
  const [catalog, setCatalog] = useState<ServicioConTarifasDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !prestador || !accessToken) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    setServicioIds(prestador.servicios?.map((s) => s.id) ?? []);

    void Promise.all([
      getPrestadorByIdWithApi(accessToken, prestador.id),
      listServiciosAllWithApi(accessToken, { estado: true }),
    ])
      .then(([detalle, servicios]) => {
        if (cancelled) return;
        setServicioIds(detalle.servicios?.map((s) => s.id) ?? []);
        setCatalog(servicios.filter((s) => s.estado));
      })
      .catch(() => {
        if (!cancelled) setError("No se pudieron cargar los servicios del prestador.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, prestador, accessToken]);

  useEffect(() => {
    if (!open || submitting) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, submitting, onClose]);

  if (!open || !prestador || !accessToken || typeof document === "undefined") return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const uniqueIds = [...new Set(servicioIds)];
    setSubmitting(true);
    setError("");
    const startedAt = Date.now();
    try {
      const updated = await updatePrestadorServiciosWithApi(accessToken, prestador.id, {
        servicioIds: uniqueIds,
      });
      await delayRemaining(DEFAULT_MIN_LOADING_MS, startedAt);
      onUpdated(updated);
      onClose();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? getApiErrorMessages(err).join(" ")
          : "No se pudieron actualizar los servicios.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[125] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="prestador-servicios-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-pointer bg-medical-text/55 backdrop-blur-sm"
        aria-label="Cerrar"
        disabled={submitting}
        onClick={onClose}
      />
      <form
        onSubmit={handleSubmit}
        className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-medical-border bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-medical-border bg-medical-primary px-5 py-4">
          <div className="flex min-w-0 items-center gap-2 text-white">
            <Layers className="size-5 shrink-0" />
            <div className="min-w-0">
              <h2 id="prestador-servicios-title" className="truncate text-base font-semibold">
                Servicios habilitados
              </h2>
              <p className="truncate text-xs text-white/80">{prestador.nombre}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="cursor-pointer text-white/80 hover:bg-white/15 hover:text-white"
            disabled={submitting}
            onClick={onClose}
          >
            <X className="size-5" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-5 sm:px-6">
          <p className="text-sm text-medical-mutedText">
            Elegí las prestaciones que este profesional puede realizar. La lista reemplaza las
            habilitaciones actuales.
          </p>
          <PrestadorServiciosPicker
            servicios={catalog}
            selectedIds={servicioIds}
            onChange={setServicioIds}
            loading={loading}
            disabled={submitting}
          />
          {servicioIds.length === 0 && !loading ? (
            <p className="text-xs text-medical-mutedText">
              Si no habilitás ninguna prestación, este profesional no podrá registrar visitas al
              escanear el QR de un paciente.
            </p>
          ) : null}
          {error ? (
            <p className="rounded-lg border border-medical-danger/30 bg-medical-danger/10 px-3 py-2 text-sm text-medical-danger">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-medical-border bg-medical-surface/80 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            disabled={submitting}
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="cursor-pointer bg-medical-primary text-white hover:bg-medical-primaryDark"
            disabled={submitting || loading}
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Guardando…
              </>
            ) : (
              "Guardar habilitaciones"
            )}
          </Button>
        </div>
      </form>
    </div>,
    document.body
  );
}
