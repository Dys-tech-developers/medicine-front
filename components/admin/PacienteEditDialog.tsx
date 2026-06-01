"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Building2, Loader2, Pencil, X } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { getApiErrorMessages } from "@/lib/api/format-api-error";
import { listObrasSocialesWithApi } from "@/lib/api/obras-sociales";
import { updatePacienteWithApi } from "@/lib/api/pacientes";
import type {
  CreatePacienteBody,
  ObraSocialListItemDto,
  PacienteListItemDto,
} from "@/lib/api/types";
import {
  DEFAULT_MIN_LOADING_MS,
  delayRemaining,
} from "@/lib/loading/minimum-duration";
import { getPacienteNombre } from "@/lib/pacientes-display";
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

type FormState = {
  nombre: string;
  apellido: string;
  numeroDocumento: string;
  fechaNacimiento: string;
  sexo: "" | CreatePacienteBody["sexo"];
  telefono: string;
  direccion: string;
  obraSocialId: string;
  numeroAfiliado: string;
};

function isoToDateInput(iso: string): string {
  if (!iso) return "";
  const d = iso.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : "";
}

function pacienteToForm(paciente: PacienteListItemDto): FormState {
  return {
    nombre: paciente.nombre,
    apellido: paciente.apellido,
    numeroDocumento: paciente.numeroDocumento,
    fechaNacimiento: isoToDateInput(paciente.fechaNacimiento),
    sexo: paciente.sexo,
    telefono: paciente.telefono,
    direccion: paciente.direccion,
    obraSocialId: paciente.obraSocialId != null ? String(paciente.obraSocialId) : "",
    numeroAfiliado: paciente.numeroAfiliado,
  };
}

function validateForm(values: FormState): string | null {
  if (!values.nombre.trim()) return "El nombre es obligatorio.";
  if (!values.apellido.trim()) return "El apellido es obligatorio.";
  if (!values.numeroDocumento.trim()) return "El número de documento es obligatorio.";
  if (!values.fechaNacimiento) return "La fecha de nacimiento es obligatoria.";
  const birth = new Date(`${values.fechaNacimiento}T12:00:00`);
  if (Number.isNaN(birth.getTime())) return "La fecha de nacimiento no es válida.";
  if (birth > new Date()) return "La fecha de nacimiento no puede ser futura.";
  if (!values.sexo) return "Seleccioná el sexo.";
  if (!values.telefono.trim()) return "El teléfono es obligatorio.";
  if (!values.direccion.trim()) return "La dirección es obligatoria.";
  if (!values.obraSocialId) return "Seleccioná la obra social.";
  if (!values.numeroAfiliado.trim()) return "El número de afiliado es obligatorio.";
  return null;
}

function toPayload(values: FormState): CreatePacienteBody {
  return {
    nombre: values.nombre.trim(),
    apellido: values.apellido.trim(),
    numeroDocumento: values.numeroDocumento.trim(),
    fechaNacimiento: values.fechaNacimiento,
    sexo: values.sexo as CreatePacienteBody["sexo"],
    telefono: values.telefono.trim(),
    direccion: values.direccion.trim(),
    obraSocialId: Number(values.obraSocialId),
    numeroAfiliado: values.numeroAfiliado.trim(),
  };
}

type PacienteEditDialogProps = {
  open: boolean;
  paciente: PacienteListItemDto | null;
  accessToken: string | null;
  onClose: () => void;
  onUpdated: (paciente: PacienteListItemDto) => void;
};

export function PacienteEditDialog({
  open,
  paciente,
  accessToken,
  onClose,
  onUpdated,
}: PacienteEditDialogProps) {
  const [values, setValues] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [obrasSociales, setObrasSociales] = useState<ObraSocialListItemDto[]>([]);
  const [obrasLoading, setObrasLoading] = useState(true);
  const [obrasError, setObrasError] = useState("");

  useEffect(() => {
    if (paciente) setValues(pacienteToForm(paciente));
    setError("");
  }, [paciente]);

  useEffect(() => {
    if (!open || !accessToken) return;
    let cancelled = false;
    setObrasLoading(true);
    setObrasError("");

    void listObrasSocialesWithApi(accessToken, { page: 1, pageSize: 100, estado: true })
      .then((data) => {
        if (cancelled) return;
        const activas = data.items.filter((o) => o.estado);
        setObrasSociales(activas);
        setValues((prev) => {
          if (!prev?.obraSocialId) return prev;
          if (activas.some((o) => String(o.id) === prev.obraSocialId)) return prev;
          return prev;
        });
      })
      .catch(() => {
        if (!cancelled) setObrasError("No se pudieron cargar las obras sociales.");
      })
      .finally(() => {
        if (!cancelled) setObrasLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, accessToken]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, loading, onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!paciente || !accessToken || !values) return;

    const validationError = validateForm(values);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");
    const startedAt = Date.now();

    try {
      const updated = await updatePacienteWithApi(accessToken, paciente.id, toPayload(values));
      await delayRemaining(DEFAULT_MIN_LOADING_MS, startedAt);
      onUpdated(updated);
      onClose();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? getApiErrorMessages(err).join(" ")
          : "No se pudo actualizar el paciente.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  if (!open || !paciente || !values || typeof document === "undefined") return null;

  const nombre = getPacienteNombre(paciente);

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="paciente-edit-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-pointer bg-medical-text/60 backdrop-blur-[2px]"
        aria-label="Cerrar"
        onClick={() => !loading && onClose()}
      />
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-medical-border bg-white shadow-2xl sm:rounded-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-medical-border bg-medical-primary px-5 py-4">
          <div className="flex min-w-0 items-center gap-2 text-white">
            <Pencil className="size-5 shrink-0" />
            <div className="min-w-0">
              <h2 id="paciente-edit-title" className="text-base font-semibold">
                Editar paciente
              </h2>
              <p className="truncate text-xs text-white/85">{nombre}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 cursor-pointer text-white hover:bg-white/15 hover:text-white"
            onClick={onClose}
            disabled={loading}
          >
            <X className="size-5" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="rounded-xl border border-medical-border/70 bg-medical-surface/40 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-medical-mutedText">
              Código QR
            </p>
            <p className="mt-1 font-mono text-sm font-medium text-medical-text">{paciente.codigoQr}</p>
            <p className="mt-1 text-xs text-medical-mutedText">
              El código QR no se puede modificar; se genera solo en el alta.
            </p>
          </div>

          {error ? (
            <p className="rounded-lg border border-medical-danger/30 bg-medical-danger/10 px-4 py-3 text-sm text-medical-danger">
              {error}
            </p>
          ) : null}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-1">
              <Label htmlFor="edit-paciente-nombre">Nombre</Label>
              <input
                id="edit-paciente-nombre"
                className={inputClass}
                value={values.nombre}
                onChange={(e) => setValues((v) => v && { ...v, nombre: e.target.value })}
                disabled={loading}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-paciente-apellido">Apellido</Label>
              <input
                id="edit-paciente-apellido"
                className={inputClass}
                value={values.apellido}
                onChange={(e) => setValues((v) => v && { ...v, apellido: e.target.value })}
                disabled={loading}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-paciente-documento">Documento</Label>
              <input
                id="edit-paciente-documento"
                className={inputClass}
                value={values.numeroDocumento}
                onChange={(e) => setValues((v) => v && { ...v, numeroDocumento: e.target.value })}
                disabled={loading}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-paciente-fecha">Fecha de nacimiento</Label>
              <input
                id="edit-paciente-fecha"
                type="date"
                className={inputClass}
                value={values.fechaNacimiento}
                onChange={(e) => setValues((v) => v && { ...v, fechaNacimiento: e.target.value })}
                disabled={loading}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-paciente-sexo">Sexo</Label>
              <Select
                value={values.sexo || undefined}
                onValueChange={(v) =>
                  setValues((prev) => prev && { ...prev, sexo: v as CreatePacienteBody["sexo"] })
                }
                disabled={loading}
              >
                <SelectTrigger id="edit-paciente-sexo" className={inputClass}>
                  <SelectValue placeholder="Seleccioná" />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[200]">
                  <SelectItem value="M">Masculino</SelectItem>
                  <SelectItem value="F">Femenino</SelectItem>
                  <SelectItem value="X">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-paciente-telefono">Teléfono</Label>
              <input
                id="edit-paciente-telefono"
                type="tel"
                className={inputClass}
                value={values.telefono}
                onChange={(e) => setValues((v) => v && { ...v, telefono: e.target.value })}
                disabled={loading}
                required
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="edit-paciente-direccion">Dirección</Label>
              <input
                id="edit-paciente-direccion"
                className={inputClass}
                value={values.direccion}
                onChange={(e) => setValues((v) => v && { ...v, direccion: e.target.value })}
                disabled={loading}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-paciente-obra">Obra social</Label>
              {obrasLoading ? (
                <p className="flex h-11 items-center text-sm text-medical-mutedText">Cargando…</p>
              ) : obrasError ? (
                <p className="text-sm text-medical-danger">{obrasError}</p>
              ) : obrasSociales.length === 0 ? (
                <p className="text-sm text-medical-mutedText">
                  <Building2 className="mr-1 inline size-3.5" />
                  No hay obras activas.{" "}
                  <Link href="/admin/obras-sociales" className="text-medical-primary underline">
                    Catálogo
                  </Link>
                </p>
              ) : (
                <Select
                  value={values.obraSocialId || undefined}
                  onValueChange={(v) => setValues((prev) => prev && { ...prev, obraSocialId: v })}
                  disabled={loading}
                >
                  <SelectTrigger id="edit-paciente-obra" className={inputClass}>
                    <SelectValue placeholder="Seleccioná" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="z-[200]">
                    {obrasSociales.map((obra) => (
                      <SelectItem key={obra.id} value={String(obra.id)}>
                        {obra.codigo ? `${obra.nombre} (${obra.codigo})` : obra.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-paciente-afiliado">Nº afiliado</Label>
              <input
                id="edit-paciente-afiliado"
                className={inputClass}
                value={values.numeroAfiliado}
                onChange={(e) => setValues((v) => v && { ...v, numeroAfiliado: e.target.value })}
                disabled={loading}
                required
              />
            </div>
          </div>
        </div>

        <div className="flex shrink-0 gap-2 border-t border-medical-border bg-medical-surface/80 px-5 py-4 sm:px-6">
          <Button
            type="button"
            variant="outline"
            className="flex-1 cursor-pointer"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" className="flex-1 cursor-pointer" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Guardando…
              </>
            ) : (
              "Guardar cambios"
            )}
          </Button>
        </div>
      </form>
    </div>,
    document.body
  );
}
