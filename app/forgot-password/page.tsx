"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
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
import { forgotPasswordWithApi } from "@/lib/api/auth";
import { mapAuthApiError } from "@/lib/api/auth-errors";

const DEFAULT_SUCCESS_MESSAGE =
  "Si el correo está registrado, recibirás un código de 6 dígitos para restablecer tu contraseña.";

function ForgotPasswordPageContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fromQuery = searchParams.get("email")?.trim();
    if (fromQuery) setEmail(fromQuery);
  }, [searchParams]);

  const requestCode = async () => {
    setErrorMessage("");
    setSuccessMessage("");
    setLoading(true);

    try {
      const result = await forgotPasswordWithApi({ email: email.trim() });
      setSuccessMessage(result.message?.trim() || DEFAULT_SUCCESS_MESSAGE);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? mapAuthApiError(error, "forgot")
          : "No se pudo procesar la solicitud. Intentá de nuevo.";
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await requestCode();
  };

  const resetHref = email.trim()
    ? `/reset-password?email=${encodeURIComponent(email.trim())}`
    : "/reset-password";

  return (
    <AuthShell>
      <div className="mb-8 space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-medical-primary">
          Recuperar acceso
        </p>
        <h2 className="text-3xl font-black tracking-tight text-[#4c4c4c] sm:text-4xl">
          ¿Olvidaste tu contraseña?
        </h2>
        <p className="text-sm leading-relaxed text-medical-mutedText">
          Ingresá tu correo y te enviaremos un código de verificación válido por 30 minutos.
        </p>
      </div>

      {successMessage ? (
        <div className="space-y-4">
          <AuthSuccessAlert message={successMessage} />
          <p className="text-sm text-medical-mutedText">
            Revisá tu bandeja de entrada y spam. Cuando tengas el código, continuá para elegir una
            nueva contraseña.
          </p>
          <Link
            href={resetHref}
            className={`${authPrimaryButtonClass} no-underline`}
            style={authPrimaryButtonStyle}
          >
            Ingresar código
            <ArrowRight className="h-4 w-4" />
          </Link>
          <button
            type="button"
            disabled={loading}
            onClick={() => void requestCode()}
            className="w-full text-center text-sm font-semibold text-medical-primary transition hover:text-medical-primaryDark hover:underline disabled:opacity-50"
          >
            {loading ? "Reenviando…" : "Reenviar código"}
          </button>
        </div>
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
                Enviando código…
              </>
            ) : (
              <>
                Enviar código
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>
      )}
    </AuthShell>
  );
}

function ForgotPasswordPageFallback() {
  return (
    <AuthShell>
      <div className="mb-8 space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-medical-primary">
          Recuperar acceso
        </p>
        <h2 className="text-3xl font-black tracking-tight text-[#4c4c4c] sm:text-4xl">
          ¿Olvidaste tu contraseña?
        </h2>
      </div>
      <div className="flex h-14 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-medical-primary" />
      </div>
    </AuthShell>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<ForgotPasswordPageFallback />}>
      <ForgotPasswordPageContent />
    </Suspense>
  );
}
