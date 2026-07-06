"use client";

import { useState } from "react";
import Link from "next/link";
import { SimecLogo } from "@/components/brand/SimecLogo";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
} from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { getApiErrorMessages } from "@/lib/api/format-api-error";
import { loginWithApi } from "@/lib/api/auth";
import {
  buildAuthSessionFromLogin,
  getRedirectPathForRole,
  saveAuthSession,
} from "@/lib/auth-session";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);
    try {
      const auth = await loginWithApi(email.trim(), password);
      console.log("[login] respuesta del backend:", auth);
      const session = buildAuthSessionFromLogin(auth);
      saveAuthSession(session);
      window.location.assign(getRedirectPathForRole(session.role));
    } catch (error) {
      console.error("Login failed:", error);
      if (error instanceof ApiError) {
        setErrorMessage(getApiErrorMessages(error).join(" "));
        return;
      }
      if (error instanceof Error) {
        setErrorMessage(error.message);
        return;
      }
      setErrorMessage("Ocurrió un error al iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .shimmer-btn { position: relative; overflow: hidden; }
        .shimmer-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%);
          transform: translateX(-100%);
          transition: transform 0.55s ease;
        }
        .shimmer-btn:not(:disabled):hover::after { transform: translateX(100%); }

        .input-float-label {
          top: 50%;
          transform: translateY(-50%);
          font-size: 0.875rem;
          color: #64748b;
          transition: top 0.18s ease, transform 0.18s ease, font-size 0.18s ease, color 0.18s ease;
        }
        .peer:focus ~ .input-float-label,
        .peer:not(:placeholder-shown) ~ .input-float-label {
          top: 12px;
          transform: translateY(0);
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.03em;
        }
        .peer:focus ~ .input-float-label { color: #454c92; }
        .peer:not(:placeholder-shown):not(:focus) ~ .input-float-label { color: #64748b; }

        .peer:focus {
          border-color: #454c92 !important;
          box-shadow: 0 0 0 4px rgba(69, 76, 146, 0.10);
          background: #fff !important;
        }
      `}</style>

      <div className="flex min-h-dvh w-full overflow-hidden">

        {/* ── LEFT PANEL ─────────────────────────────────────────────── */}
        <aside className="relative hidden overflow-hidden lg:block lg:w-[56%] xl:w-[32%]">
          {/* Foto de salud a pantalla completa */}
          <div
            className="absolute inset-0 bg-cover bg-no-repeat"
            style={{
              backgroundImage:
                "url('./portadasalud.png')",
            }}
          />

        </aside>

        {/* ── RIGHT PANEL ────────────────────────────────────────────── */}
        <main className="relative flex flex-1 items-center justify-center overflow-hidden bg-white px-6 py-10 sm:px-10">

          {/* ── Iconos decorativos de fondo ── */}
          <i className="icon-[tabler--stethoscope]    pointer-events-none absolute -top-5 -left-5   text-[130px] text-medical-mutedText/25  rotate-12" aria-hidden="true" />
          <i className="icon-[tabler--pill]            pointer-events-none absolute top-28  left-10   text-[64px]  text-medical-accent/20 -rotate-20" aria-hidden="true" />
          <i className="icon-[tabler--heart]           pointer-events-none absolute top-10  right-6   text-[72px]  text-medical-primary/12 rotate-6" aria-hidden="true" />
          <i className="icon-[tabler--microscope]      pointer-events-none absolute top-1/3 -right-6  text-[96px]  text-medical-mutedText/20  rotate-45" aria-hidden="true" />
          <i className="icon-[tabler--activity-heartbeat] pointer-events-none absolute top-1/2 left-4 text-[58px]  text-medical-accent/15 -rotate-6" aria-hidden="true" />
          <i className="icon-[tabler--first-aid-kit]   pointer-events-none absolute bottom-28 right-8 text-[68px]  text-medical-primary/10 rotate-12" aria-hidden="true" />
          <i className="icon-[tabler--dna-2]           pointer-events-none absolute -bottom-6 left-10 text-[110px] text-medical-mutedText/20 -rotate-12" aria-hidden="true" />
          <i className="icon-[tabler--vaccine]         pointer-events-none absolute -bottom-4 -right-4 text-[88px] text-medical-accent/15 rotate-25" aria-hidden="true" />

          <div className="relative z-10 w-full max-w-[400px]">

            <div className="mb-8">
              <SimecLogo size={132} />
              <p className="mt-1 text-sm font-medium text-medical-mutedText">
                Plataforma de gestión médica
              </p>
            </div>

            {/* Header */}
            <div className="mb-8 space-y-2">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-medical-primary">
                Acceso seguro
              </p>
              <h2 className="text-3xl font-black tracking-tight text-[#4c4c4c] sm:text-4xl">
                Bienvenido de vuelta
              </h2>
              <p className="text-sm leading-relaxed text-medical-mutedText">
                Iniciá sesión para continuar con tu espacio de trabajo.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>

              {/* Email */}
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
                  className="peer h-[58px] w-full rounded-2xl border-2 border-gray-100 bg-gray-50/60 px-4 pb-2 pt-6 text-sm font-medium text-medical-text outline-none transition-all"
                  required
                />
                <label
                  htmlFor="email"
                  className="input-float-label pointer-events-none absolute left-4"
                >
                  Correo electrónico
                </label>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    autoComplete="current-password"
                    placeholder=" "
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="peer h-[58px] w-full rounded-2xl border-2 border-gray-100 bg-gray-50/60 px-4 pb-2 pt-6 pr-12 text-sm font-medium text-medical-text outline-none transition-all"
                    required
                  />
                  <label
                    htmlFor="password"
                    className="input-float-label pointer-events-none absolute left-4"
                  >
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    className="absolute right-3 top-1/2 flex cursor-pointer h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl text-medical-mutedText transition hover:bg-gray-100 hover:text-medical-text"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="flex justify-end">
                  <Link
                    href="/forgot-password"
                    className="text-xs font-semibold text-medical-primary transition hover:text-medical-primaryDark hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
              </div>

              {/* Error */}
              {errorMessage && (
                <div
                  role="alert"
                  className="flex items-center gap-3 rounded-2xl border border-medical-danger/20 bg-medical-danger/10 px-4 py-3"
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-medical-danger/15">
                    <span className="h-1.5 w-1.5 rounded-full bg-medical-danger" />
                  </div>
                  <p className="text-sm font-medium text-medical-danger">{errorMessage}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="shimmer-btn group mt-2 cursor-pointer flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold text-white shadow-lg shadow-medical-primary/30 transition-all hover:shadow-xl hover:shadow-medical-primary/40 hover:scale-[1.015] focus:outline-none focus:ring-4 focus:ring-medical-primary/30 disabled:cursor-not-allowed disabled:opacity-65 disabled:scale-100 active:scale-[0.99]"
                style={{
                  background: "linear-gradient(135deg, #454c92 0%, #4b6a87 100%)",
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Iniciando sesión…
                  </>
                ) : (
                  <>
                    Iniciar sesión
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            {/* Footer */}
            <p className="mt-7 text-center text-sm text-medical-mutedText">
              ¿No tenés cuenta?{" "}
              <Link
                href="/register"
                className="font-bold text-medical-primary transition hover:text-medical-primaryDark hover:underline"
              >
                Creá una aquí
              </Link>
            </p>

            {/* Security badge */}
            <div className="mt-5 flex items-center justify-center gap-1.5">
              <Lock className="h-3 w-3 text-gray-300" />
              <span className="text-[11px] font-medium text-gray-300">
                Conexión encriptada · SSL/TLS · HIPAA Ready
              </span>
            </div>
          </div>{/* end z-10 wrapper */}
        </main>
      </div>
    </>
  );
}
