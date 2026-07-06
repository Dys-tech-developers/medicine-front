"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  Loader2,
  PlayCircle,
  ShieldCheck,
  StopCircle,
  UserCheck,
  X,
  XCircle,
} from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { getApiErrorMessages } from "@/lib/api/format-api-error";
import { gestionarTramoAdminWithApi } from "@/lib/api/visitas";
import type {
  GestionarTramoAdminAccion,
  PacienteServicioAsignadoQrDto,
} from "@/lib/api/types";
import {
  getReglasAsignacionFromServicio,
  modoEsRelevo,
} from "@/lib/reglas-asignacion";
import { VISITA_OBSERVACIONES_MAX } from "@/lib/prestador-visitas";
import { formatVisitaDateTime } from "@/lib/visitas-display";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  medicalRelevoCoberturaBanner,
  medicalRelevoCoberturaIcon,
  medicalRelevoModalHeader,
  medicalRelevoPanel,
  medicalRelevoPanelTitle,
} from "@/lib/medical-ui-classes";

const inputClass =
  "h-11 w-full rounded-xl border border-medical-border bg-medical-surface/80 px-3.5 text-sm text-medical-text outline-none transition placeholder:text-medical-mutedText/60 focus:border-medical-primary focus:bg-medical-card focus:ring-4 focus:ring-medical-primary/12 disabled:cursor-not-allowed disabled:opacity-60";

type Props = {
  servicio: PacienteServicioAsignadoQrDto;
  accessToken: string | null;
  /** Solo administradores pueden gestionar tramos manualmente. */
  canManage: boolean;
  onSuccess: (accion: GestionarTramoAdminAccion) => void;
};

function getTramoErrorMessage(err: ApiError): string {
  if (err.message?.trim()) return err.message.trim();
  return getApiErrorMessages(err).join(" ");
}

export function PacienteServicioRelevoTramoPanel({
  servicio,
  accessToken,
  canManage,
  onSuccess,
}: Props) {
  const esRelevo = modoEsRelevo(getReglasAsignacionFromServicio(servicio).modo);
  const activa = servicio.estado === "activa";
  const cobertura = servicio.coberturaActiva ?? null;
  const prestadores = servicio.prestadoresAsignados ?? [];

  const [iniciarOpen, setIniciarOpen] = useState(false);
  const [confirmAccion, setConfirmAccion] = useState<GestionarTramoAdminAccion | null>(null);
  const [prestadorId, setPrestadorId] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!iniciarOpen) {
      setPrestadorId("");
      setObservaciones("");
      setError("");
    }
  }, [iniciarOpen]);

  useEffect(() => {
    if (!confirmAccion) {
      setObservaciones("");
      setError("");
    }
  }, [confirmAccion]);

  if (!canManage || !esRelevo || !activa) return null;

  const closeAll = () => {
    setIniciarOpen(false);
    setConfirmAccion(null);
    setError("");
  };

  const runAction = async () => {
    if (!accessToken) {
      setError("Sesión no válida.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      let accionEjecutada: GestionarTramoAdminAccion = "iniciar";
      if (iniciarOpen) {
        const pid = Number(prestadorId);
        if (!Number.isFinite(pid) || pid <= 0) {
          setError("Seleccioná la cuidadora que tomará la cobertura.");
          setLoading(false);
          return;
        }
        await gestionarTramoAdminWithApi(accessToken, {
          accion: "iniciar",
          pacienteServicioId: servicio.pacienteServicioId,
          prestadorId: pid,
          observaciones: observaciones.trim() || null,
        });
        accionEjecutada = "iniciar";
      } else if (confirmAccion === "finalizar" || confirmAccion === "cancelar") {
        if (!cobertura?.visitaId) {
          setError("No hay tramo activo para cerrar.");
          setLoading(false);
          return;
        }
        await gestionarTramoAdminWithApi(accessToken, {
          accion: confirmAccion,
          visitaId: cobertura.visitaId,
          observaciones: observaciones.trim() || null,
        });
        accionEjecutada = confirmAccion;
      }
      closeAll();
      onSuccess(accionEjecutada);
    } catch (err) {
      setError(
        err instanceof ApiError ? getTramoErrorMessage(err) : "No se pudo completar la acción."
      );
    } finally {
      setLoading(false);
    }
  };

  const modalOpen = iniciarOpen || confirmAccion != null;
  const confirmMeta =
    confirmAccion === "finalizar"
      ? {
          title: "Finalizar cobertura",
          icon: StopCircle,
          confirmLabel: "Sí, finalizar y facturar",
          tone: "primary" as const,
          description: (
            <>
              Se cerrará el tramo de{" "}
              <span className="font-semibold">{cobertura?.prestadorNombre ?? "la cuidadora"}</span>{" "}
              y se generarán finanzas por el tiempo desde{" "}
              {cobertura?.fechaInicio
                ? formatVisitaDateTime(cobertura.fechaInicio)
                : "el inicio del tramo"}
              . Usá esta opción cuando la cobertura fue real y debe facturarse o pagarse.
            </>
          ),
        }
      : confirmAccion === "cancelar"
        ? {
            title: "Cancelar tramo",
            icon: XCircle,
            confirmLabel: "Sí, cancelar sin finanzas",
            tone: "danger" as const,
            description: (
              <>
                Se anulará el tramo abierto de{" "}
                <span className="font-semibold">
                  {cobertura?.prestadorNombre ?? "la cuidadora"}
                </span>{" "}
                <strong>sin generar finanzas</strong>. Usá esta opción ante errores (tramo abierto
                por mistake, prestador equivocado, etc.).
              </>
            ),
          }
        : null;

  return (
    <>
      <div className={cn("px-3.5 py-3", medicalRelevoPanel)}>
        <div
          className={cn(
            "mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide",
            medicalRelevoPanelTitle
          )}
        >
          <ShieldCheck className="size-3.5 shrink-0 text-medical-primary" aria-hidden />
          Cobertura relevo (admin)
        </div>

        {cobertura ? (
          <div className="space-y-2.5">
            <div className={cn("flex items-start gap-2", medicalRelevoCoberturaBanner)}>
              <UserCheck
                className={cn("mt-0.5 size-4 shrink-0", medicalRelevoCoberturaIcon)}
                aria-hidden
              />
              <p className="text-sm text-medical-text">
                <span className="font-semibold">{cobertura.prestadorNombre}</span>
                <span className="text-medical-mutedText">
                  {" "}
                  cubriendo desde {formatVisitaDateTime(cobertura.fechaInicio)}
                </span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                className="h-8 cursor-pointer bg-medical-primary text-xs hover:bg-medical-primaryDark"
                onClick={() => setConfirmAccion("finalizar")}
              >
                <StopCircle className="size-3.5" />
                Finalizar cobertura
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 cursor-pointer border-medical-danger/35 text-xs text-medical-danger hover:bg-medical-danger/10"
                onClick={() => setConfirmAccion("cancelar")}
              >
                <XCircle className="size-3.5" />
                Cancelar tramo
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-medical-mutedText">
              No hay cobertura activa. Podés abrir un tramo manualmente si hace falta.
            </p>
            <Button
              type="button"
              size="sm"
              className="h-8 cursor-pointer bg-medical-primary text-xs hover:bg-medical-primaryDark"
              onClick={() => setIniciarOpen(true)}
              disabled={prestadores.length === 0}
            >
              <PlayCircle className="size-3.5" />
              Iniciar cobertura
            </Button>
            {prestadores.length === 0 ? (
              <p className="text-xs text-medical-warning">
                Asigná al menos una cuidadora en la prestación para poder iniciar cobertura.
              </p>
            ) : null}
          </div>
        )}
      </div>

      {modalOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[130] flex items-center justify-center p-4"
              role="dialog"
              aria-modal="true"
            >
              <button
                type="button"
                className="absolute inset-0 cursor-pointer bg-medical-text/55 backdrop-blur-sm"
                aria-label="Cerrar"
                disabled={loading}
                onClick={() => {
                  if (!loading) closeAll();
                }}
              />
              <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-medical-border bg-white shadow-xl">
                <div
                  className={cn(
                    "flex items-center justify-between border-b px-5 py-4",
                    iniciarOpen
                      ? medicalRelevoModalHeader
                      : confirmMeta?.tone === "danger"
                        ? "border-medical-danger/30 bg-medical-danger text-white"
                        : "border-medical-primary/30 bg-medical-primary text-white"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {iniciarOpen ? (
                      <PlayCircle className="size-5 shrink-0" />
                    ) : confirmMeta ? (
                      <confirmMeta.icon className="size-5 shrink-0" />
                    ) : null}
                    <h2 className="text-base font-semibold">
                      {iniciarOpen ? "Iniciar cobertura" : confirmMeta?.title}
                    </h2>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 cursor-pointer text-white hover:bg-white/15"
                    onClick={closeAll}
                    disabled={loading}
                  >
                    <X className="size-5" />
                  </Button>
                </div>

                <div className="space-y-4 px-5 py-5">
                  {iniciarOpen ? (
                    <>
                      <p className="text-sm leading-relaxed text-medical-mutedText">
                        Abrí la cobertura manualmente para{" "}
                        <span className="font-semibold text-medical-text">
                          {servicio.servicioNombre}
                        </span>
                        . Elegí una cuidadora de las asignadas a esta prestación.
                      </p>
                      <div>
                        <Label htmlFor="tramo-prestador" className="mb-1.5 block text-sm font-medium">
                          Cuidadora <span className="text-medical-danger">*</span>
                        </Label>
                        <select
                          id="tramo-prestador"
                          value={prestadorId}
                          onChange={(e) => {
                            setPrestadorId(e.target.value);
                            setError("");
                          }}
                          disabled={loading}
                          className={inputClass}
                        >
                          <option value="">Seleccioná una cuidadora</option>
                          {prestadores.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  ) : confirmMeta ? (
                    <p className="text-sm leading-relaxed text-medical-mutedText">
                      {confirmMeta.description}
                    </p>
                  ) : null}

                  <div>
                    <Label htmlFor="tramo-obs" className="mb-1.5 block text-sm font-medium">
                      Observaciones{" "}
                      <span className="font-normal text-medical-mutedText">(opcional)</span>
                    </Label>
                    <textarea
                      id="tramo-obs"
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      maxLength={VISITA_OBSERVACIONES_MAX}
                      disabled={loading}
                      rows={3}
                      placeholder="Motivo o detalle para el registro…"
                      className="w-full rounded-xl border border-medical-border bg-medical-surface/80 px-3 py-2 text-sm outline-none focus:border-medical-primary focus:ring-4 focus:ring-medical-primary/12 disabled:opacity-60"
                    />
                  </div>

                  {error ? (
                    <div className="flex items-start gap-2 rounded-lg border border-medical-danger/30 bg-medical-danger/10 px-3 py-2 text-sm text-medical-danger">
                      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                      <p>{error}</p>
                    </div>
                  ) : null}
                </div>

                <div className="flex justify-end gap-2 border-t border-medical-border bg-medical-surface/80 px-5 py-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="cursor-pointer"
                    onClick={closeAll}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    className={cn(
                      "cursor-pointer text-white",
                      confirmMeta?.tone === "danger"
                        ? "bg-medical-danger hover:bg-medical-danger/90"
                        : "bg-medical-primary hover:bg-medical-primaryDark"
                    )}
                    disabled={loading}
                    onClick={() => void runAction()}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Procesando…
                      </>
                    ) : iniciarOpen ? (
                      "Iniciar cobertura"
                    ) : (
                      confirmMeta?.confirmLabel ?? "Confirmar"
                    )}
                  </Button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
