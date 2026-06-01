"use client";

import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Calendar,
  CreditCard,
  Loader2,
  MapPin,
  Phone,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { ApiError } from "@/lib/api/client";
import { getApiErrorMessages } from "@/lib/api/format-api-error";
import { listObrasSocialesWithApi } from "@/lib/api/obras-sociales";
import { createPacienteWithApi } from "@/lib/api/pacientes";
import type { CreatePacienteBody, ObraSocialListItemDto, PacienteDto } from "@/lib/api/types";
import {
  DEFAULT_MIN_LOADING_MS,
  delayRemaining,
} from "@/lib/loading/minimum-duration";
import { ToastStack } from "@/components/ui/toast-stack";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

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

const INITIAL: FormState = {
  nombre: "",
  apellido: "",
  numeroDocumento: "",
  fechaNacimiento: "",
  sexo: "",
  telefono: "",
  direccion: "",
  obraSocialId: "",
  numeroAfiliado: "",
};

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

type CreatePacienteFormProps = {
  accessToken: string;
  /** Tras crear correctamente; el padre muestra el toast y redirige. */
  onSuccess?: (paciente: PacienteDto) => void;
  onCancel?: () => void;
};

/** Bloque de campo alineado: etiqueta + control (h-11) + hint opcional debajo. */
function Field({
  label,
  htmlFor,
  required,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col", className)}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-medical-text">
        {label}
        {required ? <span className="text-medical-danger"> *</span> : null}
      </label>
      <div className="min-h-11 w-full [&_[data-slot=select-trigger]]:w-full">{children}</div>
      {hint ? (
        <p className="mt-1.5 min-h-[1.125rem] text-xs leading-snug text-medical-mutedText">{hint}</p>
      ) : (
        <span className="mt-1.5 block min-h-[1.125rem]" aria-hidden />
      )}
    </div>
  );
}

function ObraSocialSelect({
  loading,
  error,
  obras,
  value,
  disabled,
  onChange,
}: {
  loading: boolean;
  error: string;
  obras: ObraSocialListItemDto[];
  value: string;
  disabled: boolean;
  onChange: (id: string) => void;
}) {
  if (loading) {
    return (
      <p className="flex h-11 items-center text-sm text-medical-mutedText">Cargando obras sociales…</p>
    );
  }
  if (error) {
    return <p className="flex min-h-11 items-center text-sm text-medical-danger">{error}</p>;
  }
  if (obras.length === 0) {
    return (
      <p className="flex min-h-11 items-center text-sm text-medical-mutedText">
        <Building2 className="mr-1.5 inline size-3.5 shrink-0" />
        <span>
          No hay obras activas.{" "}
          <Link
            href="/admin/obras-sociales"
            className="font-medium text-medical-primary underline-offset-2 hover:underline"
          >
            Crear en el catálogo
          </Link>
        </span>
      </p>
    );
  }
  return (
    <Select
      value={value || undefined}
      onValueChange={onChange}
      disabled={disabled}
     
    >
      <SelectTrigger id="paciente-obra-social" className={inputClass}>
        <SelectValue placeholder="Seleccioná una obra social" />
      </SelectTrigger>
      <SelectContent position="popper" className="z-[200]">
        {obras.map((obra) => (
          <SelectItem key={obra.id} value={String(obra.id)}>
            {obra.codigo ? `${obra.nombre} (${obra.codigo})` : obra.nombre}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function FormSection({
  icon: Icon,
  title,
  description,
  children,
  className = "",
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`px-5 py-4 sm:px-6 sm:py-5 lg:px-7 ${className}`.trim()}>
      <div className="mb-3 flex items-center gap-3 sm:mb-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-medical-primary/15 to-medical-accent/10 ring-1 ring-medical-primary/10">
          <Icon className="h-5 w-5 text-medical-primary" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-tight text-medical-text sm:text-base">
            {title}
          </h2>
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
      className="mx-5 mb-1 flex gap-3 rounded-xl border border-medical-danger/30 bg-medical-danger/10 px-4 py-3 sm:mx-6 lg:mx-7"
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

export function CreatePacienteForm({
  accessToken,
  onSuccess,
  onCancel,
}: CreatePacienteFormProps) {
  const { toasts, showToast, dismiss } = useToast();
  const [values, setValues] = useState<FormState>(INITIAL);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [obrasSociales, setObrasSociales] = useState<ObraSocialListItemDto[]>([]);
  const [obrasLoading, setObrasLoading] = useState(true);
  const [obrasError, setObrasError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setObrasLoading(true);
    setObrasError("");

    void listObrasSocialesWithApi(accessToken, {
      page: 1,
      pageSize: 100,
      estado: true,
    })
      .then((data) => {
        if (cancelled) return;
        // Solo activas: no mostramos inactivas en el alta (evita asignaciones inválidas).
        const activas = data.items.filter((obra) => obra.estado);
        setObrasSociales(activas);
        setValues((prev) => {
          if (!prev.obraSocialId) return prev;
          if (activas.some((o) => String(o.id) === prev.obraSocialId)) return prev;
          return { ...prev, obraSocialId: "" };
        });
      })
      .catch(() => {
        if (cancelled) return;
        setObrasSociales([]);
        setObrasError("No se pudieron cargar las obras sociales.");
      })
      .finally(() => {
        if (!cancelled) setObrasLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const set =
    <K extends keyof FormState>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({ ...prev, [key]: e.target.value }));
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
      const result = await createPacienteWithApi(accessToken, toPayload(values));
      await delayRemaining(DEFAULT_MIN_LOADING_MS, startedAt);
      setValues(INITIAL);
      onSuccess?.(result);
    } catch (error) {
      const messages =
        error instanceof ApiError
          ? getApiErrorMessages(error)
          : error instanceof Error
            ? [error.message]
            : ["No se pudo crear el paciente. Intentá de nuevo."];
      setErrorMessages(messages);
      showToast(
        messages[0] ?? "Error al crear paciente",
        "error",
        messages.length > 1 ? `y ${messages.length - 1} más` : undefined
      );
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
            aria-live="polite"
          >
            <Loader2 className="h-10 w-10 animate-spin text-medical-primary" />
            <p className="text-sm font-medium text-medical-text">Creando paciente…</p>
            <p className="text-xs text-medical-mutedText">
              Guardando datos y generando credencial QR
            </p>
          </div>
        ) : null}
        <div className="border-b border-medical-border/60 bg-linear-to-r from-medical-secondary/40 via-white to-white px-5 py-4 sm:px-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-medical-primary/20 bg-white px-3 py-1 text-xs font-semibold text-medical-primary shadow-sm">
                <UserPlus className="h-3.5 w-3.5" />
                Alta de paciente
              </span>
              <span className="text-xs font-medium text-medical-mutedText">
                Se genera el código QR automáticamente
              </span>
            </div>
            {onCancel ? (
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-medical-mutedText transition hover:bg-medical-secondary hover:text-medical-text disabled:opacity-60"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al directorio
              </button>
            ) : null}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="divide-y divide-medical-border/60">
            <FormSection
              icon={Calendar}
              title="Datos personales"
              description="Identidad y fecha de nacimiento."
            >
              <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2 lg:grid-cols-5 sm:items-start">
                <Field label="Nombre" htmlFor="paciente-nombre" required>
                  <input
                    id="paciente-nombre"
                    name="nombre"
                    value={values.nombre}
                    onChange={set("nombre")}
                    autoComplete="given-name"
                    placeholder="María"
                    className={inputClass}
                    disabled={loading}
                  />
                </Field>
                <Field label="Apellido" htmlFor="paciente-apellido" required>
                  <input
                    id="paciente-apellido"
                    name="apellido"
                    value={values.apellido}
                    onChange={set("apellido")}
                    autoComplete="family-name"
                    placeholder="González"
                    className={inputClass}
                    disabled={loading}
                  />
                </Field>
                <Field label="Número de documento" htmlFor="paciente-documento" required>
                  <input
                    id="paciente-documento"
                    name="numeroDocumento"
                    value={values.numeroDocumento}
                    onChange={set("numeroDocumento")}
                    placeholder="30123456"
                    className={inputClass}
                    disabled={loading}
                  />
                </Field>
                <Field
                  label="Fecha de nacimiento"
                  htmlFor="paciente-fecha-nacimiento"
                  required
                
                >
                  <input
                    id="paciente-fecha-nacimiento"
                    name="fechaNacimiento"
                    type="date"
                    value={values.fechaNacimiento}
                    onChange={set("fechaNacimiento")}
                    className={inputClass}
                    disabled={loading}
                  />
                </Field>
                <Field label="Sexo" htmlFor="paciente-sexo" required className="lg:max-w-xs">
                  <Select
                    value={values.sexo || undefined}
                    onValueChange={(v) => {
                      setValues((prev) => ({ ...prev, sexo: v as CreatePacienteBody["sexo"] }));
                      setErrorMessages([]);
                    }}
                    disabled={loading}
                  >
                    <SelectTrigger id="paciente-sexo" className={inputClass}>
                      <SelectValue placeholder="Seleccioná una opción" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="z-[200]">
                      <SelectItem value="M">Masculino</SelectItem>
                      <SelectItem value="F">Femenino</SelectItem>
                      <SelectItem value="X">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </FormSection>

            <FormSection
              icon={Phone}
              title="Contacto y afiliación"
              description="Teléfono, domicilio y obra social."
            >
              <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2 lg:grid-cols-4 sm:items-start">
                <Field label="Teléfono" htmlFor="paciente-telefono" required>
                  <input
                    id="paciente-telefono"
                    name="telefono"
                    type="tel"
                    value={values.telefono}
                    onChange={set("telefono")}
                    autoComplete="tel"
                    placeholder="1122334455"
                    className={inputClass}
                    disabled={loading}
                  />
                </Field>
                <Field
                  label="Obra social"
                  htmlFor="paciente-obra-social"
                  required
                
                >
                  <ObraSocialSelect
                    loading={obrasLoading}
                    error={obrasError}
                    obras={obrasSociales}
                    value={values.obraSocialId}
                    disabled={loading}
                    onChange={(v) => {
                      setValues((prev) => ({ ...prev, obraSocialId: v }));
                      setErrorMessages([]);
                    }}
                  />
                </Field>
                <Field label="Número de afiliado" htmlFor="paciente-afiliado" required>
                  <div className="relative">
                    <CreditCard className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-medical-mutedText" />
                    <input
                      id="paciente-afiliado"
                      name="numeroAfiliado"
                      value={values.numeroAfiliado}
                      onChange={set("numeroAfiliado")}
                      placeholder="AF-123456"
                      className={`${inputClass} pl-10`}
                      disabled={loading}
                    />
                  </div>
                </Field>
                <Field
                  label="Dirección"
                  htmlFor="paciente-direccion"
                  required
                  className=""
                >
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-medical-mutedText" />
                    <input
                      id="paciente-direccion"
                      name="direccion"
                      value={values.direccion}
                      onChange={set("direccion")}
                      placeholder="Av. Pellegrini 1200, Rosario"
                      className={`${inputClass} pl-10`}
                      disabled={loading}
                    />
                  </div>
                </Field>
              </div>
            </FormSection>
          </div>

          <FormAlert messages={errorMessages} />

          <div className="flex flex-col gap-3 border-t border-medical-border/60 bg-medical-surface/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <p className="hidden text-xs text-medical-mutedText sm:block">
              Los campos con <span className="text-medical-danger">*</span> son obligatorios.
            </p>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-11 cursor-pointer w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-medical-primary to-medical-primaryDark px-8 text-sm font-semibold text-white shadow-lg shadow-medical-primary/25 transition hover:shadow-xl hover:shadow-medical-primary/30 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto sm:min-w-[220px]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creando paciente…
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Crear paciente
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
