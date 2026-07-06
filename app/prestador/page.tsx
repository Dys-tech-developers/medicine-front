"use client";

import dynamic from "next/dynamic";
import { LogoutLink } from "@/components/auth/LogoutLink";
import { SimecLogo } from "@/components/brand/SimecLogo";
import { PrestadorAccesoDenegadoDialog } from "@/components/prestador/PrestadorAccesoDenegadoDialog";
import { PrestadorPatientCard } from "@/components/prestador/PrestadorPatientCard";
import { PrestadorVisitaInsumosPicker } from "@/components/prestador/PrestadorVisitaInsumosPicker";
import { PrestadorVisitForm } from "@/components/prestador/PrestadorVisitForm";
import { PrestadorVisitSuccess } from "@/components/prestador/PrestadorVisitSuccess";
import { PrestadorPerfilTab } from "@/components/prestador/PrestadorPerfilTab";
import { PrestadorVisitasTab } from "@/components/prestador/PrestadorVisitasTab";
import { ToastStack } from "@/components/ui/toast-stack";
import { useToast } from "@/components/ui/use-toast";
import { ApiError } from "@/lib/api/client";
import {
  getPacienteServicioDisponibilidadWithApi,
  listPacienteServiciosWithApi,
} from "@/lib/api/paciente-servicios";
import { getPacienteByCodigoQrWithApi } from "@/lib/api/pacientes";
import { getPrestadorMeWithApi } from "@/lib/api/prestadores";
import {
  createVisitaWithApi,
  finalizarVisitaWithApi,
  getVisitaByIdWithApi,
  iniciarVisitaWithApi,
  relevarVisitaWithApi,
} from "@/lib/api/visitas";
import type {
  PacienteServicioAsignadoQrDto,
  PacienteServicioDisponibilidadDto,
  PrestadorListItemDto,
} from "@/lib/api/types";
import {
  isPacienteServicioCupoAgotado,
} from "@/lib/paciente-servicio-display";
import {
  buildRegisterVisitaInsumosBody,
  registerVisitaInsumosWithApi,
} from "@/lib/api/visita-insumos";
import type { VisitaDetailDto } from "@/lib/api/types";
import { loadAuthSession, type AuthSession } from "@/lib/auth-session";
import { useInsumosList } from "@/lib/hooks/use-insumos-list";
import {
  buildVisitaInsumoItemsFromLines,
  getPrestadorVisitaInsumoErrorMessage,
  validatePrestadorVisitaInsumoLines,
  type PrestadorVisitaInsumoLine,
} from "@/lib/prestador-visita-insumos";
import {
  buildCreateVisitaBodyFromRegistro,
  buildServiciosActivosParaPrestador,
  getPrestadorAccesoDenegadoRazon,
  getPrestadorQrErrorMessage,
  getPrestadorVisitaErrorMessage,
  getServiciosActivos,
  mapPacientePorQrToPrestadorPatient,
  prestadorTieneTramoActivo,
  servicioUsaControlHorario,
  servicioUsaModoRelevo,
  type PrestadorAccesoDenegadoRazon,
  type PrestadorScannedPatient,
  validatePrestadorVisitaFinalizarForm,
  validatePrestadorVisitaIniciarForm,
  validatePrestadorVisitaRegistroForm,
  validatePrestadorVisitaRelevoForm,
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
  const [prestadorPerfil, setPrestadorPerfil] = useState<PrestadorListItemDto | null>(null);

  useEffect(() => {
    const parsed = loadAuthSession();
    if (!parsed || parsed.role !== "prestador") {
      window.location.assign("/login");
      return;
    }
    setSession(parsed);
    void getPrestadorMeWithApi(parsed.accessToken)
      .then(setPrestadorPerfil)
      .catch(() => setPrestadorPerfil(null));
  }, []);

  const [scannedPatient, setScannedPatient] = useState<PrestadorScannedPatient | null>(null);
  const [isLoadingPatient, setIsLoadingPatient] = useState(false);
  const [scanError, setScanError] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [manualQr, setManualQr] = useState("");
  const [showManualQr, setShowManualQr] = useState(false);

  const [pacienteServicioId, setPacienteServicioId] = useState<number | "">("");
  /** Instantáneo en que el paciente quedó identificado por QR (inicio de la visita, modo sin control horario). */
  const [visitaInicioMs, setVisitaInicioMs] = useState<number | null>(null);
  /** Visita iniciada en backend (modo control horario). */
  const [visitaEnCursoId, setVisitaEnCursoId] = useState<number | null>(null);
  const [visitaEnCursoInicioMs, setVisitaEnCursoInicioMs] = useState<number | null>(null);
  const [observaciones, setObservaciones] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isIniciando, setIsIniciando] = useState(false);
  const [savedVisita, setSavedVisita] = useState<VisitaDetailDto | null>(null);
  const [savedVisitaEsRelevo, setSavedVisitaEsRelevo] = useState(false);
  const [insumoLines, setInsumoLines] = useState<PrestadorVisitaInsumoLine[]>([]);
  const [insumoWarning, setInsumoWarning] = useState("");
  const [accesoDenegadoRazon, setAccesoDenegadoRazon] =
    useState<PrestadorAccesoDenegadoRazon | null>(null);
  const [disponibilidadByPsId, setDisponibilidadByPsId] = useState<
    Record<number, PacienteServicioDisponibilidadDto>
  >({});
  const [loadingDisponibilidad, setLoadingDisponibilidad] = useState(false);

  const { toasts, showToast } = useToast(3500);

  const insumosCatalogEnabled = Boolean(session?.accessToken && scannedPatient && !savedVisita);
  const {
    items: insumosCatalog,
    loading: insumosCatalogLoading,
    error: insumosCatalogError,
  } = useInsumosList({
    accessToken: session?.accessToken ?? null,
    enabled: insumosCatalogEnabled,
    page: 1,
    pageSize: 100,
    estado: true,
  });

  const serviciosActivos = useMemo(
    () => (scannedPatient ? getServiciosActivos(scannedPatient.servicios) : []),
    [scannedPatient]
  );

  const serviciosConDisponibilidad = useMemo(
    () =>
      serviciosActivos.map((s) => ({
        ...s,
        disponibilidad: disponibilidadByPsId[s.pacienteServicioId] ?? s.disponibilidad,
      })),
    [serviciosActivos, disponibilidadByPsId]
  );

  const servicioSeleccionado =
    pacienteServicioId !== ""
      ? serviciosConDisponibilidad.find((s) => s.pacienteServicioId === pacienteServicioId)
      : undefined;

  const cupoAgotado = isPacienteServicioCupoAgotado(
    servicioSeleccionado?.modalidadCobro,
    servicioSeleccionado?.disponibilidad
  );

  const usaControlHorario = servicioUsaControlHorario(servicioSeleccionado);
  const usaModoRelevo = servicioUsaModoRelevo(servicioSeleccionado);
  const yaTieneTramoActivo = prestadorTieneTramoActivo(
    servicioSeleccionado,
    prestadorPerfil?.id ?? 0
  );

  const syncVisitaEnCursoFromServicio = useCallback(
    (servicio: PacienteServicioAsignadoQrDto | undefined) => {
      if (servicio?.modoRelevo) {
        setVisitaEnCursoId(null);
        setVisitaEnCursoInicioMs(null);
        return;
      }
      if (servicio?.controlHorario && servicio.visitaPendiente) {
        const inicioMs = new Date(servicio.visitaPendiente.fechaInicio).getTime();
        setVisitaEnCursoId(servicio.visitaPendiente.id);
        setVisitaEnCursoInicioMs(Number.isFinite(inicioMs) ? inicioMs : null);
        return;
      }
      setVisitaEnCursoId(null);
      setVisitaEnCursoInicioMs(null);
    },
    []
  );

  const clearPatientAndForm = useCallback(() => {
    setScannedPatient(null);
    setScanError("");
    setFormError("");
    setSavedVisita(null);
    setSavedVisitaEsRelevo(false);
    setPacienteServicioId("");
    setVisitaInicioMs(null);
    setVisitaEnCursoId(null);
    setVisitaEnCursoInicioMs(null);
    setObservaciones("");
    setManualQr("");
    setInsumoLines([]);
    setInsumoWarning("");
    setAccesoDenegadoRazon(null);
    setDisponibilidadByPsId({});
    setLoadingDisponibilidad(false);
    setIsIniciando(false);
  }, []);

  useEffect(() => {
    if (pacienteServicioId === "") {
      setVisitaEnCursoId(null);
      setVisitaEnCursoInicioMs(null);
      return;
    }
    const servicio = serviciosConDisponibilidad.find(
      (s) => s.pacienteServicioId === pacienteServicioId
    );
    syncVisitaEnCursoFromServicio(servicio);
  }, [pacienteServicioId, serviciosConDisponibilidad, syncVisitaEnCursoFromServicio]);

  useEffect(() => {
    const token = session?.accessToken;
    if (!token || pacienteServicioId === "" || !scannedPatient) return;

    const servicio = serviciosActivos.find((s) => s.pacienteServicioId === pacienteServicioId);
    if (!servicio || servicio.modoRelevo || servicio.modalidadCobro === "por_hora") return;

    let cancelled = false;
    setLoadingDisponibilidad(true);
    void getPacienteServicioDisponibilidadWithApi(token, pacienteServicioId)
      .then((d) => {
        if (!cancelled) {
          setDisponibilidadByPsId((prev) => ({ ...prev, [pacienteServicioId]: d }));
        }
      })
      .catch(() => {
        /* el backend validará al guardar */
      })
      .finally(() => {
        if (!cancelled) setLoadingDisponibilidad(false);
      });

    return () => {
      cancelled = true;
    };
  }, [pacienteServicioId, session?.accessToken, scannedPatient, serviciosActivos]);

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
      setSavedVisitaEsRelevo(false);
      setIsLoadingPatient(true);
      setScannedPatient(null);
      setPacienteServicioId("");
      setVisitaInicioMs(null);
      setVisitaEnCursoId(null);
      setVisitaEnCursoInicioMs(null);
      setInsumoLines([]);
      setInsumoWarning("");
      setAccesoDenegadoRazon(null);

      void (async () => {
        try {
          const paciente = await getPacienteByCodigoQrWithApi(token, codigoQr);
          const [asignacionesData, perfil] = await Promise.all([
            listPacienteServiciosWithApi(token, {
              pacienteId: paciente.id,
              page: 1,
              pageSize: 100,
            }).catch(() => ({ items: [], total: 0, page: 1, pageSize: 100 })),
            prestadorPerfil
              ? Promise.resolve(prestadorPerfil)
              : getPrestadorMeWithApi(token).catch(() => null),
          ]);

          if (perfil && !prestadorPerfil) setPrestadorPerfil(perfil);

          const prestadorId = perfil?.id;
          if (!prestadorId) {
            setScanError(
              "No se pudo cargar tu perfil de prestador. Volvé a iniciar sesión o contactá al administrador."
            );
            return;
          }

          const patientBase = mapPacientePorQrToPrestadorPatient(paciente);
          const razonDenegado = getPrestadorAccesoDenegadoRazon({
            asignaciones: asignacionesData.items,
            prestador: perfil,
          });

          if (razonDenegado) {
            setAccesoDenegadoRazon(razonDenegado);
            return;
          }

          const serviciosFiltrados = buildServiciosActivosParaPrestador({
            qrServicios: patientBase.servicios,
            asignaciones: asignacionesData.items,
            prestador: perfil,
          });

          const patient: PrestadorScannedPatient = {
            ...patientBase,
            servicios: serviciosFiltrados,
          };

          setScannedPatient(patient);
          const inicioMs = Date.now();
          if (serviciosFiltrados.length === 1) {
            const unico = serviciosFiltrados[0];
            setPacienteServicioId(unico.pacienteServicioId);
            if (unico.modoRelevo) {
              setVisitaInicioMs(null);
              syncVisitaEnCursoFromServicio(unico);
            } else if (unico.controlHorario) {
              setVisitaInicioMs(null);
              syncVisitaEnCursoFromServicio(unico);
            } else {
              setVisitaInicioMs(inicioMs);
            }
          } else {
            setVisitaInicioMs(inicioMs);
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
    [session?.accessToken, showToast, prestadorPerfil, syncVisitaEnCursoFromServicio]
  );

  const handlePacienteServicioIdChange = useCallback(
    (id: number | "") => {
      setPacienteServicioId(id);
      setFormError("");
      if (id === "") {
        setVisitaInicioMs(null);
        setVisitaEnCursoId(null);
        setVisitaEnCursoInicioMs(null);
        return;
      }
      const servicio = serviciosConDisponibilidad.find((s) => s.pacienteServicioId === id);
      if (servicioUsaModoRelevo(servicio)) {
        setVisitaInicioMs(null);
        setVisitaEnCursoId(null);
        setVisitaEnCursoInicioMs(null);
      } else if (servicioUsaControlHorario(servicio)) {
        setVisitaInicioMs(null);
        syncVisitaEnCursoFromServicio(servicio);
      } else {
        setVisitaEnCursoId(null);
        setVisitaEnCursoInicioMs(null);
        setVisitaInicioMs((prev) => prev ?? Date.now());
      }
    },
    [serviciosConDisponibilidad, syncVisitaEnCursoFromServicio]
  );

  const handleRelevar = async () => {
    if (!scannedPatient || savedVisita) return;

    const validationError = validatePrestadorVisitaRelevoForm({
      pacienteServicioId,
      tieneServiciosActivos: serviciosActivos.length > 0,
      yaTieneTramoActivo,
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

    setFormError("");
    setInsumoWarning("");
    setIsSubmitting(true);
    try {
      const resultado = await relevarVisitaWithApi(token, {
        pacienteServicioId: pacienteServicioId as number,
      });
      const visita = resultado.visita;

      let visitaFinal = visita;
      const consumoItems = buildVisitaInsumoItemsFromLines(insumoLines);
      const insumosBody = buildRegisterVisitaInsumosBody(consumoItems);
      let insumoWarningMsg = "";

      if (insumosBody) {
        try {
          const registrados = await registerVisitaInsumosWithApi(token, visita.id, insumosBody);
          visitaFinal = {
            ...visita,
            insumos: registrados.length > 0 ? registrados : visita.insumos,
          };
        } catch (insumoErr) {
          const msg =
            insumoErr instanceof ApiError
              ? getPrestadorVisitaInsumoErrorMessage(insumoErr)
              : "No se pudieron registrar los insumos.";
          insumoWarningMsg = `El relevamiento #${visita.id} se registró, pero los insumos no: ${msg}`;
          showToast("Relevamiento registrado; revisá los insumos", "error");
          try {
            visitaFinal = await getVisitaByIdWithApi(token, visita.id);
          } catch {
            /* mantener visita sin insumos en resumen */
          }
        }
      }

      setInsumoWarning(insumoWarningMsg);
      setSavedVisita(visitaFinal);
      setSavedVisitaEsRelevo(true);
      if (!insumoWarningMsg) {
        showToast(
          resultado.huboRelevo ? "Relevo registrado" : "Cobertura iniciada",
          "success"
        );
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? getPrestadorVisitaErrorMessage(err)
          : "No se pudo registrar el relevamiento.";
      setFormError(msg);
      showToast(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIniciarVisita = async () => {
    if (!scannedPatient || savedVisita) return;

    if (cupoAgotado) {
      setFormError("Cupo agotado en este período. No podés iniciar otra visita hasta el próximo período.");
      return;
    }

    const validationError = validatePrestadorVisitaIniciarForm({
      pacienteServicioId,
      tieneServiciosActivos: serviciosActivos.length > 0,
      visitaEnCursoId,
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

    setFormError("");
    setIsIniciando(true);
    try {
      const visita = await iniciarVisitaWithApi(token, {
        pacienteServicioId: pacienteServicioId as number,
      });
      const inicioMs = new Date(visita.fechaInicio ?? visita.fecha).getTime();
      setVisitaEnCursoId(visita.id);
      setVisitaEnCursoInicioMs(Number.isFinite(inicioMs) ? inicioMs : Date.now());
      showToast("Visita iniciada", "success");
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? getPrestadorVisitaErrorMessage(err)
          : "No se pudo iniciar la visita.";
      setFormError(msg);
      showToast(msg, "error");
    } finally {
      setIsIniciando(false);
    }
  };

  const handleManualQrSubmit = () => {
    if (!manualQr.trim()) {
      setScanError("Ingresá un código PAC-XXXXXX.");
      return;
    }
    applyQrPayload(manualQr);
  };

  const handleSubmitVisit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!scannedPatient || savedVisita || usaModoRelevo) return;

    if (cupoAgotado) {
      setFormError("Cupo agotado en este período. No podés registrar otra visita hasta el próximo período.");
      return;
    }

    const insumoValidationError = validatePrestadorVisitaInsumoLines(insumoLines, insumosCatalog);
    if (insumoValidationError) {
      setFormError(insumoValidationError);
      return;
    }

    const token = session?.accessToken;
    if (!token) {
      setFormError("Sesión no válida. Volvé a iniciar sesión.");
      return;
    }

    setFormError("");
    setInsumoWarning("");
    setIsSubmitting(true);
    try {
      let visita: VisitaDetailDto;

      if (usaControlHorario) {
        const validationError = validatePrestadorVisitaFinalizarForm({
          visitaEnCursoId,
          observaciones,
        });
        if (validationError) {
          setFormError(validationError);
          return;
        }

        const obs = observaciones.trim();
        visita = await finalizarVisitaWithApi(token, visitaEnCursoId as number, {
          observaciones: obs || null,
        });
      } else {
        const finMs = Date.now();
        const validationError = validatePrestadorVisitaRegistroForm({
          pacienteServicioId,
          visitaInicioMs,
          finMs,
          observaciones,
          tieneServiciosActivos: serviciosActivos.length > 0,
        });
        if (validationError) {
          setFormError(validationError);
          return;
        }

        const body = buildCreateVisitaBodyFromRegistro({
          pacienteServicioId: pacienteServicioId as number,
          visitaInicioMs: visitaInicioMs as number,
          finMs,
          observaciones,
        });
        if (!body) {
          setFormError("No se pudo calcular la duración de la visita.");
          return;
        }

        visita = await createVisitaWithApi(token, body);
      }
      const consumoItems = buildVisitaInsumoItemsFromLines(insumoLines);
      const insumosBody = buildRegisterVisitaInsumosBody(consumoItems);
      let insumoWarningMsg = "";

      if (insumosBody) {
        try {
          const registrados = await registerVisitaInsumosWithApi(token, visita.id, insumosBody);
          visita = {
            ...visita,
            insumos: registrados.length > 0 ? registrados : visita.insumos,
          };
        } catch (insumoErr) {
          const msg =
            insumoErr instanceof ApiError
              ? getPrestadorVisitaInsumoErrorMessage(insumoErr)
              : "No se pudieron registrar los insumos.";
          insumoWarningMsg = `La visita #${visita.id} se guardó, pero los insumos no: ${msg}`;
          showToast("Visita guardada; revisá los insumos", "error");
          try {
            visita = await getVisitaByIdWithApi(token, visita.id);
          } catch {
            /* mantener visita sin insumos en resumen */
          }
        }
      }

      setInsumoWarning(insumoWarningMsg);
      setSavedVisita(visita);
      setSavedVisitaEsRelevo(false);
      if (!insumoWarningMsg) {
        showToast("Visita registrada correctamente", "success");
      }
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

  const canRelevar =
    Boolean(scannedPatient) &&
    usaModoRelevo &&
    !savedVisita &&
    serviciosActivos.length > 0 &&
    pacienteServicioId !== "" &&
    !yaTieneTramoActivo;

  const canIniciar =
    Boolean(scannedPatient) &&
    usaControlHorario &&
    visitaEnCursoId == null &&
    !savedVisita &&
    serviciosActivos.length > 0 &&
    pacienteServicioId !== "" &&
    !cupoAgotado &&
    !loadingDisponibilidad;

  const canSubmit =
    Boolean(scannedPatient) &&
    !usaModoRelevo &&
    !savedVisita &&
    serviciosActivos.length > 0 &&
    pacienteServicioId !== "" &&
    !cupoAgotado &&
    !loadingDisponibilidad &&
    (usaControlHorario ? visitaEnCursoId != null : visitaInicioMs != null);

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

      <PrestadorAccesoDenegadoDialog
        open={accesoDenegadoRazon != null}
        razon={accesoDenegadoRazon}
        onEscanearOtro={() => {
          setAccesoDenegadoRazon(null);
          setCameraOpen(true);
        }}
        onCerrar={clearPatientAndForm}
      />

      <div className="mx-auto w-full max-w-5xl px-4 py-5 pb-28 sm:px-6 lg:px-8 sm:pb-28">
        <header className="mb-5 rounded-3xl bg-linear-to-br from-medical-primary to-medical-primaryDark p-5 text-white shadow-lg shadow-medical-primary/25">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-4">
              <SimecLogo size={48} variant="circle" />
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.2em] text-white/80">Prestador</p>
                <h1 className="mt-1 text-2xl font-semibold">Visitas médicas</h1>
                <p className="mt-1 text-sm text-white/90">
                  Escaneá el QR del paciente y registrá la visita.
                </p>
              </div>
            </div>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/30">
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
                insumoWarning={insumoWarning}
                variant={savedVisitaEsRelevo ? "relevo" : "visita"}
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
                    Acercá la cámara al QR de la credencial (código PAC-000001). Según el servicio,
                    la visita se registra en un paso, con inicio y fin separados (control horario),
                    o con relevamiento continuo.
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
                  <div className="mb-4">
                    <PrestadorVisitaInsumosPicker
                      lines={insumoLines}
                      onLinesChange={setInsumoLines}
                      catalog={insumosCatalog}
                      loadingCatalog={insumosCatalogLoading}
                      catalogError={insumosCatalogError}
                      disabled={isSubmitting}
                    />
                  </div>
                ) : null}

                {!isLoadingPatient && scannedPatient ? (
                  <PrestadorVisitForm
                    serviciosActivos={serviciosConDisponibilidad}
                    pacienteServicioId={pacienteServicioId}
                    onPacienteServicioIdChange={handlePacienteServicioIdChange}
                    visitaInicioMs={visitaInicioMs}
                    controlHorario={usaControlHorario}
                    modoRelevo={usaModoRelevo}
                    yaTieneTramoActivo={yaTieneTramoActivo}
                    visitaEnCursoInicioMs={visitaEnCursoInicioMs}
                    observaciones={observaciones}
                    onObservacionesChange={setObservaciones}
                    formError={formError}
                    isSubmitting={isSubmitting}
                    isIniciando={isIniciando}
                    canSubmit={canSubmit}
                    canIniciar={canIniciar}
                    canRelevar={canRelevar}
                    cupoAgotado={usaModoRelevo ? false : cupoAgotado}
                    loadingDisponibilidad={usaModoRelevo ? false : loadingDisponibilidad}
                    onSubmit={handleSubmitVisit}
                    onIniciar={() => void handleIniciarVisita()}
                    onRelevar={() => void handleRelevar()}
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
