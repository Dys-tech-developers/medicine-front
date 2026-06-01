"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Eye,
  EyeOff,
  Loader2,
  MapPin,
  Phone,
  Stethoscope,
  UserPlus,
} from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { getApiErrorMessages } from "@/lib/api/format-api-error";
import { createPrestadorWithApi } from "@/lib/api/prestadores";
import type { CreatePrestadorBody, RegimenIva } from "@/lib/api/types";
import {
  DEFAULT_MIN_LOADING_MS,
  delayRemaining,
} from "@/lib/loading/minimum-duration";
import { REGIMENES_IVA, REGIMEN_IVA_LABELS } from "@/lib/prestadores-labels";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ToastStack } from "@/components/ui/toast-stack";
import { useToast } from "@/components/ui/use-toast";

const inputClass =
  "h-11 w-full rounded-xl border border-medical-border bg-medical-surface/80 px-3.5 text-sm text-medical-text outline-none transition placeholder:text-medical-mutedText/60 focus:border-medical-primary focus:bg-medical-card focus:ring-4 focus:ring-medical-primary/12 disabled:cursor-not-allowed disabled:opacity-60";

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

const INITIAL: FormState = {
  nombre: "",
  email: "",
  password: "",
  telefono: "",
  lugarResidencia: "",
  documento: "",
  matricula: "",
  cuit: "",
  cbu: "",
  regimenIva: "monotributo",
  estado: true,
};

function validateForm(values: FormState): string | null {
  if (!values.nombre.trim()) return "El nombre es obligatorio.";
  if (!values.email.trim()) return "El email es obligatorio.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    return "Ingresá un email válido.";
  }
  if (values.password.length < 10) {
    return "La contraseña debe tener al menos 10 caracteres.";
  }
  if (!values.telefono.trim()) return "El teléfono es obligatorio.";
  if (!values.lugarResidencia.trim()) return "El lugar de residencia es obligatorio.";
  if (!values.documento.trim()) return "El documento es obligatorio.";
  if (!values.matricula.trim()) return "La matrícula es obligatoria.";
  if (!values.cuit.trim()) return "El CUIT es obligatorio.";
  const cbuDigits = values.cbu.replace(/\D/g, "");
  if (cbuDigits.length !== 22) return "El CBU debe tener 22 dígitos.";
  if (!values.regimenIva) return "Seleccioná el régimen de IVA.";
  return null;
}

function toPayload(values: FormState): CreatePrestadorBody {
  return {
    nombre: values.nombre.trim(),
    email: values.email.trim().toLowerCase(),
    password: values.password,
    telefono: values.telefono.trim(),
    lugarResidencia: values.lugarResidencia.trim(),
    documento: values.documento.trim(),
    matricula: values.matricula.trim(),
    cuit: values.cuit.trim(),
    cbu: values.cbu.replace(/\D/g, ""),
    regimenIva: values.regimenIva as RegimenIva,
    estado: values.estado,
  };
}

type CreatePrestadorFormProps = {
  accessToken: string;
  onCreated?: () => void;
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
  className = "",
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`px-5 py-5 sm:px-6 sm:py-6 lg:px-7 lg:py-6 ${className}`.trim()}
    >
      <div className="mb-4 flex items-center gap-3 lg:mb-3">
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

export function CreatePrestadorForm({
  accessToken,
  onCreated,
  onCancel,
}: CreatePrestadorFormProps) {
  const { toasts, showToast, dismiss } = useToast();
  const [values, setValues] = useState<FormState>(INITIAL);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const set =
    <K extends keyof FormState>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.type === "checkbox" ? e.target.checked : e.target.value;
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
      const result = await createPrestadorWithApi(accessToken, toPayload(values));
      await delayRemaining(DEFAULT_MIN_LOADING_MS, startedAt);
      setValues(INITIAL);
      setShowPassword(false);
      showToast("Prestador creado correctamente", "success", `${result.nombre} · ${result.matricula}`);
      onCreated?.();
    } catch (error) {
      const messages =
        error instanceof ApiError
          ? getApiErrorMessages(error)
          : error instanceof Error
            ? [error.message]
            : ["No se pudo crear el prestador. Intentá de nuevo."];
      setErrorMessages(messages);
      showToast(messages[0] ?? "Error al crear prestador", "error", messages.length > 1 ? `y ${messages.length - 1} más` : undefined);
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
            <p className="text-sm font-medium text-medical-text">Creando prestador…</p>
          </div>
        ) : null}
        <div className="border-b border-medical-border/60 bg-linear-to-r from-medical-secondary/40 via-white to-white px-5 py-4 sm:px-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-medical-primary/20 bg-white px-3 py-1 text-xs font-semibold text-medical-primary shadow-sm">
                <Stethoscope className="h-3.5 w-3.5" />
                Alta de prestador
              </span>
              <span className="text-xs font-medium text-medical-mutedText">
                Solo administradores · rol PRESTADOR
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
          {/* Desktop: 2 columnas — izq. cuenta+contacto, der. datos profesionales */}
          <div className="lg:grid lg:grid-cols-2 lg:divide-x lg:divide-medical-border/60">
            <div>
              <FormSection
                icon={UserPlus}
                title="Cuenta de acceso"
                description="Credenciales del usuario."
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Nombre completo" htmlFor="nombre" required>
                    <input
                      id="nombre"
                      name="nombre"
                      value={values.nombre}
                      onChange={set("nombre")}
                      autoComplete="name"
                      placeholder="Juan Pérez"
                      className={inputClass}
                      disabled={loading}
                    />
                  </Field>
                  <Field label="Email" htmlFor="email" required>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={values.email}
                      onChange={set("email")}
                      autoComplete="email"
                      placeholder="juan.perez@ejemplo.com"
                      className={inputClass}
                      disabled={loading}
                    />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field
                      label="Contraseña"
                      htmlFor="password"
                      required
                      hint="Mín. 10 caracteres."
                    >
                      <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={values.password}
                        onChange={set("password")}
                        autoComplete="new-password"
                        placeholder="MiClaveSegura1"
                        className={`${inputClass} pr-11`}
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute cursor-pointer right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-medical-mutedText transition hover:bg-medical-secondary hover:text-medical-text"
                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      </div>
                    </Field>
                  </div>
                </div>
              </FormSection>

              <FormSection
                icon={Phone}
                title="Contacto"
                description="Teléfono y ubicación."
                className="border-t border-medical-border/60"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Teléfono" htmlFor="telefono" required>
                    <input
                      id="telefono"
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
                  <Field label="Lugar de residencia" htmlFor="lugarResidencia" required>
                    <div className="relative">
                      <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-medical-mutedText" />
                      <input
                        id="lugarResidencia"
                        name="lugarResidencia"
                        value={values.lugarResidencia}
                        onChange={set("lugarResidencia")}
                        placeholder="Rosario, Santa Fe"
                        className={`${inputClass} pl-10`}
                        disabled={loading}
                      />
                    </div>
                  </Field>
                </div>
              </FormSection>
            </div>

            <FormSection icon={Stethoscope} title="Datos profesionales" description="Documentación y estado.">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Documento" htmlFor="documento" required>
                  <input
                    id="documento"
                    name="documento"
                    value={values.documento}
                    onChange={set("documento")}
                    placeholder="30123456"
                    className={inputClass}
                    disabled={loading}
                  />
                </Field>
                <Field label="Matrícula" htmlFor="matricula" required>
                  <input
                    id="matricula"
                    name="matricula"
                    value={values.matricula}
                    onChange={set("matricula")}
                    placeholder="MP-12345"
                    className={inputClass}
                    disabled={loading}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="CUIT" htmlFor="cuit" required>
                    <input
                      id="cuit"
                      name="cuit"
                      value={values.cuit}
                      onChange={set("cuit")}
                      placeholder="20-30123456-9"
                      className={inputClass}
                      disabled={loading}
                    />
                  </Field>
                </div>
              </div>
            </FormSection>

            <FormSection
              icon={Building2}
              title="Datos fiscales"
              description="CBU y régimen de IVA para liquidaciones."
              className="border-t border-medical-border/60 lg:border-t-0"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field label="CBU" htmlFor="cbu" required hint="22 dígitos, sin espacios.">
                    <input
                      id="cbu"
                      name="cbu"
                      inputMode="numeric"
                      value={values.cbu}
                      onChange={set("cbu")}
                      placeholder="0000003100012345678901"
                      className={inputClass}
                      disabled={loading}
                      maxLength={22}
                    />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Label
                    htmlFor="regimen-iva"
                    className="mb-1.5 block text-sm font-medium text-medical-text"
                  >
                    Régimen de IVA <span className="text-medical-danger">*</span>
                  </Label>
                  <Select
                    value={values.regimenIva || undefined}
                    onValueChange={(v) => {
                      setValues((prev) => ({ ...prev, regimenIva: v as RegimenIva }));
                      setErrorMessages([]);
                    }}
                    disabled={loading}
                  >
                    <SelectTrigger id="regimen-iva" className={inputClass}>
                      <SelectValue placeholder="Seleccioná un régimen" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {REGIMENES_IVA.map((r) => (
                        <SelectItem key={r} value={r}>
                          {REGIMEN_IVA_LABELS[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-medical-border bg-medical-surface/60 px-4 py-3 lg:mt-5">
                <Switch
                  id="prestador-estado"
                  checked={values.estado}
                  onCheckedChange={(checked) =>
                    setValues((prev) => ({ ...prev, estado: checked }))
                  }
                  disabled={loading}
                />
                <Label htmlFor="prestador-estado" className="cursor-pointer text-sm font-medium">
                  Prestador activo al crear
                </Label>
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
              className="inline-flex cursor-pointer h-11 w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-medical-primary to-medical-primaryDark px-8 text-sm font-semibold text-white shadow-lg shadow-medical-primary/25 transition hover:shadow-xl hover:shadow-medical-primary/30 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto sm:min-w-[220px]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creando prestador…
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Crear prestador
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
