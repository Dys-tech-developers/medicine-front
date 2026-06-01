"use client";

import dynamic from "next/dynamic";
import { LogoutLink } from "@/components/auth/LogoutLink";
import { PrestadorPatientCard } from "@/components/prestador/PrestadorPatientCard";
import { PrestadorVisitForm } from "@/components/prestador/PrestadorVisitForm";
import { PrestadorVisitSuccess } from "@/components/prestador/PrestadorVisitSuccess";
import { PrestadorPerfilTab } from "@/components/prestador/PrestadorPerfilTab";
import { PrestadorVisitasTab } from "@/components/prestador/PrestadorVisitasTab";
import { ToastStack } from "@/components/ui/toast-stack";
import { useToast } from "@/components/ui/use-toast";
import { ApiError } from "@/lib/api/client";
import { getPacienteByCodigoQrWithApi } from "@/lib/api/pacientes";
import { createVisitaWithApi } from "@/lib/api/visitas";
import type { VisitaDetailDto } from "@/lib/api/types";
import { loadAuthSession, type AuthSession } from "@/lib/auth-session";
import {
  buildCreateVisitaBody,
  defaultDatetimeLocalValue,
  getPrestadorQrErrorMessage,
  getPrestadorVisitaErrorMessage,
  getServiciosActivos,
  mapPacientePorQrToPrestadorPatient,
  type PrestadorScannedPatient,
  validatePrestadorVisitaForm,
} from "@/lib/prestador-visitas";
import { extractCodigoQrFromScan } from "@/lib/patient-qr";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Camera,
  ClipboardList,
  History,
  Loader2,
  QrCode,
  ScanLine,
  UserCircle2,
} from "lucide-react";

const QrCameraScannerModal = dynamic(
  () =>
    import("@/components/operator/QrCameraScannerModal").then((mod) => ({
      default: mod.QrCameraScannerModal,
    })),
  { ssr: false, loading: () => null }
);

type PrestadorTab = "nueva" | "visitas" | "perfil";

function PatientSkeleton() {
  return (
    <section className="mb-5 animate-pulse rounded-2xl border border-medical-border bg-medical-card p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="h-4 w-4 rounded-full bg-medical-border" />
        <div className="h-4 w-32 rounded bg-medical-border" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-1">
            <div className="h-3 w-16 rounded bg-medical-border/70" />
            <div className="h-4 w-28 rounded bg-medical-border" />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function PrestadorDashboardPage() {
  const [tab, setTab] = useState<PrestadorTab>("nueva");
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    const parsed = loadAuthSession();
    if (!parsed || parsed.role !== "prestador") {
      window.location.assign("/login");
      return;
    }
    setSession(parsed);
  }, []);

  const [scannedPatient, setScannedPatient] = useState<PrestadorScannedPatient | null>(null);
  const [isLoadingPatient, setIsLoadingPatient] = useState(false);
  const [scanError, setScanError] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [manualQr, setManualQr] = useState("");
  const [showManualQr, setShowManualQr] = useState(false);

  const [pacienteServicioId, setPacienteServicioId] = useState<number | "">("");
  const [fechaInicioLocal, setFechaInicioLocal] = useState(defaultDatetimeLocalValue());
  const [tiempoMinutos, setTiempoMinutos] = useState<number | "">(45);
  const [observaciones, setObservaciones] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedVisita, setSavedVisita] = useState<VisitaDetailDto | null>(null);

  const { toasts, showToast } = useToast(3500);

  const serviciosActivos = useMemo(
    () => (scannedPatient ? getServiciosActivos(scannedPatient.servicios) : []),
    [scannedPatient]
  );

  const clearPatientAndForm = useCallback(() => {
    setScannedPatient(null);
    setScanError("");
    setFormError("");
    setSavedVisita(null);
    setPacienteServicioId("");
    setFechaInicioLocal(defaultDatetimeLocalValue());
    setTiempoMinutos(45);
    setObservaciones("");
    setManualQr("");
  }, []);

  const applyQrPayload = useCallback(
    (raw: string) => {
      const token = session?.accessToken;
      if (!token) {
        setScanError("Sesión no válida. Volvé a iniciar sesión.");
        return;
      }

      const codigoQr = extractCodigoQrFromScan(raw);
      if (!codigoQr) {
        setScannedPatient(null);
        setScanError("No se pudo leer el QR. Formato esperado: PAC-000001.");
        showToast("QR inválido — no se reconoció el código", "error");
        return;
      }

      setScanError("");
      setFormError("");
      setSavedVisita(null);
      setIsLoadingPatient(true);
      setScannedPatient(null);
      setPacienteServicioId("");
      setFechaInicioLocal(defaultDatetimeLocalValue());

      void (async () => {
        try {
          const paciente = await getPacienteByCodigoQrWithApi(token, codigoQr);
          const patient = mapPacientePorQrToPrestadorPatient(paciente);
          setScannedPatient(patient);
          const activos = getServiciosActivos(patient.servicios);
          if (activos.length === 1) {
            setPacienteServicioId(activos[0].pacienteServicioId);
          }
          showToast(`Paciente identificado · ${patient.fullName}`, "success");
        } catch (err) {
          const msg =
            err instanceof ApiError
              ? getPrestadorQrErrorMessage(err)
              : "No se pudo buscar al paciente.";
          setScanError(msg);
          showToast(msg, "error");
        } finally {
          setIsLoadingPatient(false);
        }
      })();
    },
    [session?.accessToken, showToast]
  );

  const handleManualQrSubmit = () => {
    if (!manualQr.trim()) {
      setScanError("Ingresá un código PAC-XXXXXX.");
      return;
    }
    applyQrPayload(manualQr);
  };

  const handleSubmitVisit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!scannedPatient || savedVisita) return;

    const validationError = validatePrestadorVisitaForm({
      pacienteServicioId,
      fechaInicioLocal,
      tiempoMinutos,
      observaciones,
      tieneServiciosActivos: serviciosActivos.length > 0,
    });
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const token = session?.accessToken;
    if (!token) {
      setFormError("Sesión no válida. Volvé a iniciar sesión.");
      return;
    }

    const body = buildCreateVisitaBody({
      pacienteServicioId: pacienteServicioId as number,
      fechaInicioLocal,
      tiempoMinutos: tiempoMinutos as number,
      observaciones,
    });
    if (!body) {
      setFormError("Revisá la fecha y hora de inicio.");
      return;
    }

    setFormError("");
    setIsSubmitting(true);
    try {
      const visita = await createVisitaWithApi(token, body);
      setSavedVisita(visita);
      showToast("Visita registrada correctamente", "success");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? getPrestadorVisitaErrorMessage(err)
          : "No se pudo guardar la visita.";
      setFormError(msg);
      showToast(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit =
    Boolean(scannedPatient) &&
    !savedVisita &&
    serviciosActivos.length > 0 &&
    pacienteServicioId !== "" &&
    fechaInicioLocal.trim() !== "" &&
    tiempoMinutos !== "";

  return (
    <div className="min-h-screen bg-medical-surface">
      <ToastStack toasts={toasts} />

      {cameraOpen ? (
        <QrCameraScannerModal
          onClose={() => setCameraOpen(false)}
          onDecoded={(text) => {
            setCameraOpen(false);
            applyQrPayload(text);
          }}
        />
      ) : null}

      <div className="mx-auto w-full max-w-5xl px-4 py-5 pb-28 sm:px-6 lg:px-8 sm:pb-28">
        <header className="mb-5 rounded-3xl bg-linear-to-br from-medical-primary to-medical-primaryDark p-5 text-white shadow-lg shadow-medical-primary/25">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/80">Prestador</p>
              <h1 className="mt-1 text-2xl font-semibold">Visitas médicas</h1>
              <p className="mt-1 text-sm text-white/90">Escaneá el QR del paciente y registrá la visita.</p>
            </div>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/30">
              <QrCode className="h-6 w-6" />
            </span>
          </div>
        </header>

        {tab === "visitas" ? (
          <PrestadorVisitasTab
            accessToken={session?.accessToken ?? null}
            onRegistrarVisita={() => setTab("nueva")}
          />
        ) : null}

        {tab === "nueva" ? (
          <>
            {savedVisita ? (
              <PrestadorVisitSuccess
                visita={savedVisita}
                onNuevaVisita={clearPatientAndForm}
              />
            ) : (
              <>
                <section className="mb-5 rounded-2xl border border-medical-border bg-medical-card p-4 shadow-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <ScanLine className="h-4 w-4 text-medical-primary" />
                    <h2 className="text-sm font-semibold text-medical-text">Escanear QR del paciente</h2>
                  </div>

                  <p className="rounded-xl border border-medical-border bg-medical-secondary/30 px-3 py-2 text-xs text-medical-mutedText">
                    Acercá la cámara al QR de la credencial (código PAC-000001). Los datos y servicios
                    activos se cargan automáticamente.
                  </p>

                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => setCameraOpen(true)}
                      disabled={isLoadingPatient}
                      className="inline-flex flex-1 items-center cursor-pointer justify-center gap-2 rounded-xl bg-medical-primary px-4 py-3 text-sm font-semibold text-white shadow-md shadow-medical-primary/20 transition hover:bg-medical-primaryDark disabled:opacity-70"
                    >
                      <Camera className="h-5 w-5" />
                      Escanear con cámara
                    </button>
                    {scannedPatient ? (
                      <button
                        type="button"
                        onClick={clearPatientAndForm}
                        disabled={isLoadingPatient || isSubmitting}
                        className="inline-flex items-center cursor-pointer justify-center rounded-xl border border-medical-border bg-white px-4 py-2.5 text-sm font-medium text-medical-text transition hover:bg-medical-secondary disabled:opacity-70"
                      >
                        Limpiar
                      </button>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowManualQr((v) => !v)}
                    className="mt-2 text-xs font-medium text-medical-primary underline-offset-2 hover:underline"
                  >
                    {showManualQr ? "Ocultar ingreso manual" : "Ingresar código manualmente (prueba)"}
                  </button>

                  {showManualQr ? (
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                      <input
                        type="text"
                        value={manualQr}
                        onChange={(e) => setManualQr(e.target.value)}
                        placeholder="PAC-000001"
                        className="h-11 flex-1 rounded-xl border border-medical-border bg-white px-3 text-sm uppercase tracking-wide text-medical-text outline-none focus:border-medical-primary focus:ring-4 focus:ring-medical-primary/15"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleManualQrSubmit();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleManualQrSubmit}
                        disabled={isLoadingPatient}
                        className="inline-flex h-11 items-center cursor-pointer justify-center rounded-xl border border-medical-primary bg-white px-4 text-sm font-semibold text-medical-primary transition hover:bg-medical-secondary disabled:opacity-70"
                      >
                        Buscar
                      </button>
                    </div>
                  ) : null}

                  {scanError && !scannedPatient && !isLoadingPatient ? (
                    <p className="mt-2 text-sm text-medical-danger">{scanError}</p>
                  ) : null}

                  {isLoadingPatient ? (
                    <p className="mt-2 flex items-center gap-2 text-sm text-medical-mutedText">
                      <Loader2 className="h-4 w-4 animate-spin text-medical-primary" />
                      Buscando paciente…
                    </p>
                  ) : null}
                </section>

                {isLoadingPatient ? <PatientSkeleton /> : null}

                {!isLoadingPatient && scannedPatient ? (
                  <PrestadorPatientCard patient={scannedPatient} />
                ) : null}

                {!isLoadingPatient && scannedPatient ? (
                  <PrestadorVisitForm
                    serviciosActivos={serviciosActivos}
                    pacienteServicioId={pacienteServicioId}
                    onPacienteServicioIdChange={setPacienteServicioId}
                    fechaInicioLocal={fechaInicioLocal}
                    onFechaInicioLocalChange={setFechaInicioLocal}
                    tiempoMinutos={tiempoMinutos}
                    onTiempoMinutosChange={setTiempoMinutos}
                    observaciones={observaciones}
                    onObservacionesChange={setObservaciones}
                    formError={formError}
                    isSubmitting={isSubmitting}
                    canSubmit={canSubmit}
                    onSubmit={handleSubmitVisit}
                  />
                ) : null}

                {!scannedPatient && !isLoadingPatient ? (
                  <p className="text-center text-sm text-medical-mutedText">
                    Escaneá un QR para ver la ficha del paciente y el formulario de visita.
                  </p>
                ) : null}
              </>
            )}
          </>
        ) : null}

        {tab === "perfil" ? (
          <PrestadorPerfilTab
            accessToken={session?.accessToken ?? null}
            loggedAt={session?.loggedAt}
          />
        ) : null}

        <div className="mt-5">
          <LogoutLink className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-medical-border bg-medical-card px-4 py-3 text-sm font-semibold text-medical-text transition hover:bg-medical-secondary">
            Cerrar sesión
          </LogoutLink>
        </div>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-medical-border bg-medical-card/95 px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_30px_-12px_rgba(20,83,45,0.12)] backdrop-blur-md sm:px-4"
        aria-label="Navegación principal"
      >
        <div className="mx-auto grid w-full max-w-5xl grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setTab("nueva")}
            className={`flex flex-col items-center cursor-pointer justify-center gap-0.5 rounded-2xl px-3 py-2.5 transition active:scale-[0.98] ${
              tab === "nueva"
                ? "bg-medical-secondary text-medical-primary shadow-inner"
                : "text-medical-mutedText hover:bg-medical-secondary/50"
            }`}
          >
            <ClipboardList className="h-6 w-6" strokeWidth={tab === "nueva" ? 2.25 : 2} />
            <span className={`text-[11px] leading-tight ${tab === "nueva" ? "font-bold" : "font-medium"}`}>
              Nueva visita
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTab("visitas")}
            className={`relative flex flex-col items-center cursor-pointer justify-center gap-0.5 rounded-2xl px-3 py-2.5 transition active:scale-[0.98] ${
              tab === "visitas"
                ? "bg-medical-secondary text-medical-primary shadow-inner"
                : "text-medical-mutedText hover:bg-medical-secondary/50"
            }`}
          >
            <History className="h-6 w-6" strokeWidth={tab === "visitas" ? 2.25 : 2} />
            <span className={`text-[11px] leading-tight ${tab === "visitas" ? "font-bold" : "font-medium"}`}>
              Mis visitas
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTab("perfil")}
            className={`flex flex-col items-center justify-center cursor-pointer gap-0.5 rounded-2xl px-3 py-2.5 transition active:scale-[0.98] ${
              tab === "perfil"
                ? "bg-medical-secondary text-medical-primary shadow-inner"
                : "text-medical-mutedText hover:bg-medical-secondary/50"
            }`}
          >
            <UserCircle2 className="h-6 w-6" strokeWidth={tab === "perfil" ? 2.25 : 2} />
            <span className={`text-[11px] leading-tight ${tab === "perfil" ? "font-bold" : "font-medium"}`}>
              Perfil
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
}
