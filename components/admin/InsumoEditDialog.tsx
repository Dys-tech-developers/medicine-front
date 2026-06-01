"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, Package, X } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { getApiErrorMessages } from "@/lib/api/format-api-error";
import { updateInsumoWithApi } from "@/lib/api/insumos";
import type { InsumoListItemDto, UpdateInsumoBody } from "@/lib/api/types";
import {
  DEFAULT_MIN_LOADING_MS,
  delayRemaining,
} from "@/lib/loading/minimum-duration";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { unidadMedidaSelectOptions } from "@/lib/insumos-unidades";

const inputClass =
  "h-10 w-full rounded-xl border border-medical-border bg-medical-surface/80 px-3 text-sm text-medical-text outline-none focus:border-medical-primary focus:bg-medical-card focus:ring-4 focus:ring-medical-primary/12 disabled:opacity-60";

type InsumoEditDialogProps = {
  open: boolean;
  insumo: InsumoListItemDto | null;
  accessToken: string | null;
  onClose: () => void;
  onUpdated: (insumo: InsumoListItemDto) => void;
};

function insumoToForm(insumo: InsumoListItemDto) {
  const fecha = insumo.fechaVencimiento?.slice(0, 10) ?? "";
  return {
    nombre: insumo.nombre,
    codigo: insumo.codigo,
    descripcion: insumo.descripcion ?? "",
    unidadMedida: insumo.unidadMedida ?? insumo.unidad,
    stockActual: String(insumo.cantidad),
    stockMinimo: String(insumo.stockMinimo),
    requiereVencimiento: Boolean(insumo.requiereVencimiento),
    fechaVencimiento: fecha,
    estado: insumo.estado ?? insumo.activo ?? true,
  };
}

export function InsumoEditDialog({
  open,
  insumo,
  accessToken,
  onClose,
  onUpdated,
}: InsumoEditDialogProps) {
  const [form, setForm] = useState(() => (insumo ? insumoToForm(insumo) : null));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (insumo) setForm(insumoToForm(insumo));
    setError("");
  }, [insumo]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, loading, onClose]);

  if (!open || !insumo || !form || typeof document === "undefined") return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) {
      setError("Sesión no válida.");
      return;
    }

    const stockActual = Number.parseInt(form.stockActual, 10);
    const stockMinimo = Number.parseInt(form.stockMinimo, 10);
    if (Number.isNaN(stockActual) || stockActual < 0) {
      setError("Stock actual inválido.");
      return;
    }
    if (Number.isNaN(stockMinimo) || stockMinimo < 0) {
      setError("Stock mínimo inválido.");
      return;
    }
    if (form.requiereVencimiento && !form.fechaVencimiento) {
      setError("Indicá la fecha de vencimiento.");
      return;
    }

    const body: UpdateInsumoBody = {
      nombre: form.nombre.trim(),
      codigo: form.codigo.trim().toUpperCase(),
      descripcion: form.descripcion.trim() || null,
      unidadMedida: form.unidadMedida.trim(),
      stockActual,
      stockMinimo,
      requiereVencimiento: form.requiereVencimiento,
      estado: form.estado,
    };
    if (form.requiereVencimiento && form.fechaVencimiento) {
      body.fechaVencimiento = form.fechaVencimiento;
    } else if (!form.requiereVencimiento) {
      body.fechaVencimiento = null;
    }

    setLoading(true);
    setError("");
    const startedAt = Date.now();
    try {
      const updated = await updateInsumoWithApi(accessToken, insumo.id, body);
      await delayRemaining(DEFAULT_MIN_LOADING_MS, startedAt);
      onUpdated(updated);
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? getApiErrorMessages(err).join(" ")
          : "No se pudo actualizar el insumo."
      );
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="insumo-edit-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-pointer bg-medical-text/50 backdrop-blur-sm"
        aria-label="Cerrar"
        onClick={() => !loading && onClose()}
      />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-medical-border bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-medical-border bg-medical-primary px-5 py-4">
          <div className="flex items-center gap-2 text-white">
            <Package className="size-5" />
            <h2 id="insumo-edit-title" className="text-base font-semibold">
              Actualizar insumo
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-white cursor-pointer hover:bg-white/15 hover:text-white"
            onClick={onClose}
            disabled={loading}
          >
            <X className="size-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center gap-3 px-6 py-12">
              <Loader2 className="size-10 animate-spin text-medical-primary" />
              <p className="text-sm text-medical-mutedText">Guardando cambios…</p>
            </div>
          ) : (
            <div className="space-y-4 px-5 py-5 sm:px-6">
              <p className="text-sm text-medical-mutedText">
                Podés ajustar solo el stock o cualquier dato del insumo.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="edit-stock-actual" className="mb-1 block text-sm font-medium">
                    Stock actual <span className="text-medical-danger">*</span>
                  </label>
                  <input
                    id="edit-stock-actual"
                    type="number"
                    min={0}
                    value={form.stockActual}
                    onChange={(e) => setForm((f) => f && { ...f, stockActual: e.target.value })}
                    className={inputClass}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label htmlFor="edit-stock-minimo" className="mb-1 block text-sm font-medium">
                    Stock mínimo <span className="text-medical-danger">*</span>
                  </label>
                  <input
                    id="edit-stock-minimo"
                    type="number"
                    min={0}
                    value={form.stockMinimo}
                    onChange={(e) => setForm((f) => f && { ...f, stockMinimo: e.target.value })}
                    className={inputClass}
                    disabled={loading}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="edit-nombre" className="mb-1 block text-sm font-medium">
                  Nombre
                </label>
                <input
                  id="edit-nombre"
                  value={form.nombre}
                  onChange={(e) => setForm((f) => f && { ...f, nombre: e.target.value })}
                  className={inputClass}
                  disabled={loading}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="edit-codigo" className="mb-1 block text-sm font-medium">
                    Código
                  </label>
                  <input
                    id="edit-codigo"
                    value={form.codigo}
                    onChange={(e) => setForm((f) => f && { ...f, codigo: e.target.value })}
                    className={`${inputClass} uppercase`}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label htmlFor="edit-unidad" className="mb-1 block text-sm font-medium">
                    Unidad
                  </label>
                  <Select
                    value={form.unidadMedida || undefined}
                    onValueChange={(v) =>
                      setForm((f) => f && { ...f, unidadMedida: v })
                    }
                    disabled={loading}
                  >
                    <SelectTrigger id="edit-unidad" className={inputClass}>
                      <SelectValue placeholder="Seleccioná una unidad" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="z-[200]">
                      {unidadMedidaSelectOptions(form.unidadMedida).map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label htmlFor="edit-descripcion" className="mb-1 block text-sm font-medium">
                  Descripción
                </label>
                <textarea
                  id="edit-descripcion"
                  rows={2}
                  value={form.descripcion}
                  onChange={(e) => setForm((f) => f && { ...f, descripcion: e.target.value })}
                  className={`${inputClass} min-h-[72px] resize-y py-2`}
                  disabled={loading}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.estado}
                  onChange={(e) => setForm((f) => f && { ...f, estado: e.target.checked })}
                  disabled={loading}
                />
                Insumo activo
              </label>
              {error ? (
                <p className="rounded-lg border border-medical-danger/30 bg-medical-danger/10 px-3 py-2 text-sm text-medical-danger">
                  {error}
                </p>
              ) : null}
            </div>
          )}

          {!loading ? (
            <div className="flex gap-3 border-t border-medical-border bg-medical-surface/80 px-5 py-4 sm:px-6">
              <Button type="button" variant="outline" className="flex-1 cursor-pointer" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-medical-primary cursor-pointer text-white hover:bg-medical-primaryDark"
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
