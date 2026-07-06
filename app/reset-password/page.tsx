"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import {
  AuthErrorAlert,
  AuthShell,
  AuthSuccessAlert,
  authFloatLabelClass,
  authInputClass,
  authPrimaryButtonClass,
  authPrimaryButtonStyle,
} from "@/components/auth/AuthShell";
import { ApiError } from "@/lib/api/client";
import { resetPasswordWithApi } from "@/lib/api/auth";
import { mapAuthApiError } from "@/lib/api/auth-errors";

function normalizeCode(value: string): string {
  return value.replace(/\D/g, "").slice(0, 6);
}

function ResetPasswordPageContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fromQuery = searchParams.get("email")?.trim();
    if (fromQuery) setEmail(fromQuery);
  }, [searchParams]);

  const validate = (): string | null => {
    if (!email.trim()) return "Ingresá tu correo electrónico.";
    if (code.length !== 6) return "El código debe tener 6 dígitos.";
    if (newPassword.length < 10) {
      return "La nueva contraseña debe tener al menos 10 caracteres.";
    }
    if (newPassword !== confirmPassword) {
      return "La confirmación no coincide con la nueva contraseña.";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const validationError = validate();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setLoading(true);
    try {
      const result = await resetPasswordWithApi({
        email: email.trim(),
        code,
        newPassword,
      });
      setSuccessMessage(
        result.message?.trim() || "Tu contraseña se actualizó correctamente. Ya podés iniciar sesión."
      );
    } catch (error) {
      const message =
        error instanceof ApiError
          ? mapAuthApiError(error, "reset")
          : "No se pudo restablecer la contraseña. Intentá de nuevo.";
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      footer={
        successMessage ? (
          <p className="mt-7 text-center text-sm text-medical-mutedText">
            <Link
              href="/login"
              className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold text-white no-underline shadow-lg shadow-medical-primary/30"
              style={authPrimaryButtonStyle}
            >
              Ir al inicio de sesión
              <ArrowRight className="h-4 w-4" />
            </Link>
          </p>
        ) : undefined
      }
    >
      <div className="mb-8 space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-medical-primary">
          Nueva contraseña
        </p>
        <h2 className="text-3xl font-black tracking-tight text-[#4c4c4c] sm:text-4xl">
          Restablecer acceso
        </h2>
        <p className="text-sm leading-relaxed text-medical-mutedText">
          Ingresá el código de 6 dígitos que recibiste y elegí una nueva contraseña.
        </p>
      </div>

      {successMessage ? (
        <AuthSuccessAlert message={successMessage} />
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4" noValidate>
          <div className="relative">
            <input
              id="email"
              type="email"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoComplete="email"
              placeholder=" "
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={authInputClass}
              required
            />
            <label htmlFor="email" className={authFloatLabelClass}>
              Correo electrónico
            </label>
          </div>

          <div className="relative">
            <input
              id="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder=" "
              value={code}
              onChange={(e) => setCode(normalizeCode(e.target.value))}
              className={`${authInputClass} tracking-[0.35em]`}
              maxLength={6}
              required
            />
            <label htmlFor="code" className={authFloatLabelClass}>
              Código de 6 dígitos
            </label>
          </div>

          <div className="relative">
            <input
              id="new-password"
              type={showNewPassword ? "text" : "password"}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoComplete="new-password"
              placeholder=" "
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={`${authInputClass} pr-12`}
              required
            />
            <label htmlFor="new-password" className={authFloatLabelClass}>
              Nueva contraseña
            </label>
            <button
              type="button"
              onClick={() => setShowNewPassword((prev) => !prev)}
              aria-label={showNewPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-xl text-medical-mutedText transition hover:bg-gray-100 hover:text-medical-text"
            >
              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <div className="relative">
            <input
              id="confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoComplete="new-password"
              placeholder=" "
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`${authInputClass} pr-12`}
              required
            />
            <label htmlFor="confirm-password" className={authFloatLabelClass}>
              Confirmar contraseña
            </label>
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-xl text-medical-mutedText transition hover:bg-gray-100 hover:text-medical-text"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <p className="text-xs text-medical-mutedText">Mínimo 10 caracteres.</p>

          {errorMessage ? <AuthErrorAlert message={errorMessage} /> : null}

          <button
            type="submit"
            disabled={loading}
            className={authPrimaryButtonClass}
            style={authPrimaryButtonStyle}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Actualizando contraseña…
              </>
            ) : (
              <>
                Restablecer contraseña
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>

          <p className="text-center text-sm text-medical-mutedText">
            ¿No recibiste el código?{" "}
            <Link
              href={email.trim() ? `/forgot-password?email=${encodeURIComponent(email.trim())}` : "/forgot-password"}
              className="font-semibold text-medical-primary transition hover:text-medical-primaryDark hover:underline"
            >
              Solicitar uno nuevo
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}

function ResetPasswordPageFallback() {
  return (
    <AuthShell>
      <div className="mb-8 space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-medical-primary">
          Nueva contraseña
        </p>
        <h2 className="text-3xl font-black tracking-tight text-[#4c4c4c] sm:text-4xl">
          Restablecer acceso
        </h2>
      </div>
      <div className="flex h-14 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-medical-primary" />
      </div>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordPageFallback />}>
      <ResetPasswordPageContent />
    </Suspense>
  );
}
