"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Eye, EyeOff, Loader2, Pencil, X } from "lucide-react";
import { PrestadorServiciosPicker } from "@/components/admin/PrestadorServiciosPicker";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ApiError } from "@/lib/api/client";
import { getApiErrorMessages } from "@/lib/api/format-api-error";
import { getPrestadorByIdWithApi, updatePrestadorWithApi } from "@/lib/api/prestadores";
import { listServiciosAllWithApi } from "@/lib/api/servicios";
import type {
  PrestadorListItemDto,
  RegimenIva,
  ServicioConTarifasDto,
  UpdatePrestadorBody,
} from "@/lib/api/types";
import {
  DEFAULT_MIN_LOADING_MS,
  delayRemaining,
} from "@/lib/loading/minimum-duration";
import { MEDICAL_UI } from "@/lib/medical-ui-classes";
import { REGIMENES_IVA, REGIMEN_IVA_LABELS } from "@/lib/prestadores-labels";
import { cn } from "@/lib/utils";

const inputClass = MEDICAL_UI.formInput;
const MAX_SERVICIO_IDS = 50;

function InputSkeleton() {
  return <Skeleton className="h-11 w-full rounded-xl" />;
}

function EditPrestadorFormSkeleton() {
  return (
    <div
      className="space-y-4"
      aria-busy="true"
      aria-live="polite"
      aria-label="Cargando datos del prestador"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Nombre completo</Label>
          <InputSkeleton />
        </div>
        <div className="space-y-1.5">
          <Label>Email</Label>
          <InputSkeleton />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Contraseña</Label>
          <InputSkeleton />
          <Skeleton className="mt-1.5 h-3 w-64 max-w-full" />
        </div>
        <div className="space-y-1.5">
          <Label>Teléfono</Label>
          <InputSkeleton />
        </div>
        <div className="space-y-1.5">
          <Label>Lugar de residencia</Label>
          <InputSkeleton />
        </div>
        <div className="space-y-1.5">
          <Label>Documento</Label>
          <InputSkeleton />
        </div>
        <div className="space-y-1.5">
          <Label>Matrícula</Label>
          <InputSkeleton />
        </div>
        <div className="space-y-1.5">
          <Label>CUIT</Label>
          <InputSkeleton />
        </div>
        <div className="space-y-1.5">
          <Label>CBU</Label>
          <InputSkeleton />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Régimen de IVA</Label>
          <InputSkeleton />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Servicios habilitados</Label>
        <ul className="space-y-2 rounded-xl border border-medical-border bg-medical-surface/50 p-2">
          {["w-2/5", "w-3/5", "w-1/2", "w-7/12", "w-1/3"].map((widthClass, i) => (
            <li
              key={i}
              className="flex items-center gap-3 rounded-lg border border-transparent bg-white px-3 py-2.5"
            >
              <Skeleton className="size-4 shrink-0 rounded" />
              <Skeleton className={cn("h-4 rounded-md", widthClass)} />
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-medical-border bg-medical-surface/60 px-4 py-3">
        <Skeleton className="h-6 w-11 shrink-0 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
}

type FormState = {
  nombre: string;
  email: string;
  password: string;
  telefono: string;
  lugarResidencia: string;
  documento: string;
  matricula: string;
  cuit: string;
  cbu: string;
  regimenIva: RegimenIva | "";
  estado: boolean;
};

function prestadorToForm(prestador: PrestadorListItemDto): FormState {
  return {
    nombre: prestador.nombre ?? "",
    email: prestador.email ?? "",
    password: "",
    telefono: prestador.telefono ?? "",
    lugarResidencia: prestador.lugarResidencia ?? "",
    documento: prestador.documento ?? "",
    matricula: prestador.matricula ?? "",
    cuit: prestador.cuit ?? "",
    cbu: (prestador.cbu ?? "").replace(/\D/g, ""),
    regimenIva: prestador.regimenIva ?? "",
    estado: Boolean(prestador.estado),
  };
}

function lengthError(label: string, value: string, max: number): string | null {
  const trimmed = value.trim();
  if (!trimmed) return `${label} es obligatorio.`;
  if (trimmed.length > max) return `${label} no puede superar ${max} caracteres.`;
  return null;
}

function validateForm(values: FormState, servicioIds: number[]): string | null {
  const checks: Array<[string, string, number]> = [
    ["El nombre", values.nombre, 100],
    ["El teléfono", values.telefono, 50],
    ["El lugar de residencia", values.lugarResidencia, 255],
    ["El documento", values.documento, 20],
    ["La matrícula", values.matricula, 50],
    ["El CUIT", values.cuit, 20],
  ];
  for (const [label, value, max] of checks) {
    const err = lengthError(label, value, max);
    if (err) return err;
  }

  const email = values.email.trim();
  if (!email) return "El email es obligatorio.";
  if (email.length > 150) return "El email no puede superar 150 caracteres.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Ingresá un email válido.";

  const password = values.password.trim();
  if (password) {
    if (password.length < 10) return "La contraseña debe tener al menos 10 caracteres.";
    if (password.length > 72) return "La contraseña no puede superar 72 caracteres.";
  }

  const cbuDigits = values.cbu.replace(/\D/g, "");
  if (cbuDigits.length !== 22) return "El CBU debe tener 22 dígitos.";
  if (!values.regimenIva) return "Seleccioná el régimen de IVA.";

  const uniqueIds = [...new Set(servicioIds)];
  if (uniqueIds.length > MAX_SERVICIO_IDS) {
    return `Podés habilitar hasta ${MAX_SERVICIO_IDS} servicios.`;
  }
  return null;
}

function toPayload(values: FormState, servicioIds: number[]): UpdatePrestadorBody {
  const uniqueIds = [...new Set(servicioIds)];
  const password = values.password.trim();
  return {
    nombre: values.nombre.trim(),
    email: values.email.trim().toLowerCase(),
    telefono: values.telefono.trim(),
    lugarResidencia: values.lugarResidencia.trim(),
    documento: values.documento.trim(),
    matricula: values.matricula.trim(),
    cuit: values.cuit.trim(),
    cbu: values.cbu.replace(/\D/g, ""),
    regimenIva: values.regimenIva as RegimenIva,
    estado: values.estado,
    servicioIds: uniqueIds,
    ...(password ? { password } : {}),
  };
}

type EditPrestadorDialogProps = {
  open: boolean;
  prestador: PrestadorListItemDto | null;
  accessToken: string | null;
  onClose: () => void;
  onUpdated: (prestador: PrestadorListItemDto) => void;
};

export function EditPrestadorDialog({
  open,
  prestador,
  accessToken,
  onClose,
  onUpdated,
}: EditPrestadorDialogProps) {
  const [values, setValues] = useState<FormState | null>(null);
  const [servicioIds, setServicioIds] = useState<number[]>([]);
  const [catalog, setCatalog] = useState<ServicioConTarifasDto[]>([]);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !prestador || !accessToken) return;
    let cancelled = false;
    setError("");
    setShowPassword(false);
    setValues(prestadorToForm(prestador));
    setServicioIds(prestador.servicios?.map((s) => s.id) ?? []);
    setLoadingDetalle(true);

    const applyServicios = (servicios: ServicioConTarifasDto[] | null, currentIds: number[]) => {
      if (servicios == null) {
        setServicioIds(currentIds);
        return;
      }
      const activos = servicios.filter((s) => s.estado);
      const activeIds = new Set(activos.map((s) => s.id));
      setCatalog(activos);
      setServicioIds(currentIds.filter((id) => activeIds.has(id)));
    };

    void Promise.allSettled([
      getPrestadorByIdWithApi(accessToken, prestador.id),
      listServiciosAllWithApi(accessToken, { estado: true }),
    ])
      .then(([detalleResult, serviciosResult]) => {
        if (cancelled) return;

        const catalogItems =
          serviciosResult.status === "fulfilled" ? serviciosResult.value : null;
        if (serviciosResult.status === "rejected") {
          setError("No se pudieron cargar los servicios del catálogo.");
        }

        if (detalleResult.status === "fulfilled") {
          const detalle = detalleResult.value;
          setValues(prestadorToForm(detalle));
          applyServicios(catalogItems, detalle.servicios?.map((s) => s.id) ?? []);
        } else {
          applyServicios(catalogItems, prestador.servicios?.map((s) => s.id) ?? []);
          setError((prev) =>
            prev || "No se pudo cargar el detalle del prestador. Se muestran los datos del listado."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingDetalle(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, prestador, accessToken]);

  useEffect(() => {
    if (!open || submitting) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (document.querySelector("[data-radix-popper-content-wrapper]")) return;
      onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, submitting, onClose]);

  if (!open || !prestador || !values || !accessToken || typeof document === "undefined") {
    return null;
  }

  const busy = submitting || loadingDetalle;

  const setField =
    <K extends keyof FormState>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.type === "checkbox" ? e.target.checked : e.target.value;
      setValues((prev) => (prev ? { ...prev, [key]: v } : prev));
      setError("");
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm(values, servicioIds);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError("");
    const startedAt = Date.now();
    try {
      const updated = await updatePrestadorWithApi(
        accessToken,
        prestador.id,
        toPayload(values, servicioIds)
      );
      await delayRemaining(DEFAULT_MIN_LOADING_MS, startedAt);
      onUpdated(updated);
      onClose();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? getApiErrorMessages(err).join(" ")
          : "No se pudo actualizar el prestador.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[125] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="prestador-edit-title"
    >
      <button
        type="button"
        className={cn("absolute inset-0 cursor-pointer", MEDICAL_UI.overlay)}
        aria-label="Cerrar"
        disabled={submitting}
        onClick={() => !submitting && onClose()}
      />
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="relative z-10 flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-medical-border bg-white shadow-2xl sm:max-w-xl sm:rounded-2xl sm:max-h-[88vh]"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-medical-border bg-medical-primary px-5 py-4">
          <div className="flex min-w-0 items-center gap-2 text-white">
            <Pencil className="size-5 shrink-0" />
            <div className="min-w-0">
              <h2 id="prestador-edit-title" className="text-base font-semibold">
                Editar prestador
              </h2>
              <p className="truncate text-xs text-white/85">{prestador.nombre}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 cursor-pointer text-white hover:bg-white/15 hover:text-white"
            onClick={onClose}
            disabled={submitting}
          >
            <X className="size-5" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
          {error ? (
            <p className="rounded-lg border border-medical-danger/30 bg-medical-danger/10 px-4 py-3 text-sm text-medical-danger">
              {error}
            </p>
          ) : null}

          {loadingDetalle ? (
            <EditPrestadorFormSkeleton />
          ) : (
            <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-prestador-nombre">Nombre completo</Label>
              <input
                id="edit-prestador-nombre"
                className={inputClass}
                value={values.nombre}
                onChange={setField("nombre")}
                disabled={busy}
                maxLength={100}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-prestador-email">Email</Label>
              <input
                id="edit-prestador-email"
                type="email"
                className={inputClass}
                value={values.email}
                onChange={setField("email")}
                disabled={busy}
                maxLength={150}
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="edit-prestador-password">Contraseña</Label>
              <div className="relative">
                <input
                  id="edit-prestador-password"
                  type={showPassword ? "text" : "password"}
                  className={`${inputClass} pr-11`}
                  value={values.password}
                  onChange={setField("password")}
                  disabled={busy}
                  maxLength={72}
                  autoComplete="new-password"
                  placeholder="Dejar vacío para no cambiar"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded-lg p-1 text-medical-mutedText transition hover:bg-medical-secondary hover:text-medical-text"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-medical-mutedText">
                Vacío = no se modifica. Si la completás, mínimo 10 caracteres.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-prestador-telefono">Teléfono</Label>
              <input
                id="edit-prestador-telefono"
                type="tel"
                className={inputClass}
                value={values.telefono}
                onChange={setField("telefono")}
                disabled={busy}
                maxLength={50}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-prestador-residencia">Lugar de residencia</Label>
              <input
                id="edit-prestador-residencia"
                className={inputClass}
                value={values.lugarResidencia}
                onChange={setField("lugarResidencia")}
                disabled={busy}
                maxLength={255}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-prestador-documento">Documento</Label>
              <input
                id="edit-prestador-documento"
                className={inputClass}
                value={values.documento}
                onChange={setField("documento")}
                disabled={busy}
                maxLength={20}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-prestador-matricula">Matrícula</Label>
              <input
                id="edit-prestador-matricula"
                className={inputClass}
                value={values.matricula}
                onChange={setField("matricula")}
                disabled={busy}
                maxLength={50}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-prestador-cuit">CUIT</Label>
              <input
                id="edit-prestador-cuit"
                className={inputClass}
                value={values.cuit}
                onChange={setField("cuit")}
                disabled={busy}
                maxLength={20}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-prestador-cbu">CBU</Label>
              <input
                id="edit-prestador-cbu"
                inputMode="numeric"
                className={inputClass}
                value={values.cbu}
                onChange={setField("cbu")}
                disabled={busy}
                maxLength={22}
                required
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="edit-prestador-iva">Régimen de IVA</Label>
              <Select
                value={values.regimenIva || undefined}
                onValueChange={(v) => {
                  setValues((prev) => (prev ? { ...prev, regimenIva: v as RegimenIva } : prev));
                  setError("");
                }}
                disabled={busy}
              >
                <SelectTrigger id="edit-prestador-iva" className={inputClass}>
                  <SelectValue placeholder="Seleccioná un régimen" />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[200]">
                  {REGIMENES_IVA.map((r) => (
                    <SelectItem key={r} value={r}>
                      {REGIMEN_IVA_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Servicios habilitados</Label>
            <PrestadorServiciosPicker
              servicios={catalog}
              selectedIds={servicioIds}
              onChange={(ids) => {
                setServicioIds(ids);
                setError("");
              }}
              loading={loadingDetalle}
              disabled={busy}
            />
            <p className="text-xs text-medical-mutedText">
              La lista reemplaza las habilitaciones actuales. Vacío deja al prestador sin servicios.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-medical-border bg-medical-surface/60 px-4 py-3">
            <Switch
              id="edit-prestador-estado"
              checked={values.estado}
              onCheckedChange={(checked) =>
                setValues((prev) => (prev ? { ...prev, estado: checked } : prev))
              }
              disabled={busy}
            />
            <Label htmlFor="edit-prestador-estado" className="cursor-pointer text-sm font-medium">
              Prestador activo
            </Label>
          </div>
          <p className="text-xs text-medical-mutedText">
            El estado del usuario de acceso no se edita desde acá.
          </p>
            </>
          )}
        </div>

        <div className={cn("flex shrink-0 gap-2 px-5 py-4 sm:px-6", MEDICAL_UI.dialogFooter)}>
          <Button
            type="button"
            variant="outline"
            className="flex-1 cursor-pointer"
            onClick={onClose}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button type="submit" className="flex-1 cursor-pointer" disabled={busy}>
            {submitting ? (
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
