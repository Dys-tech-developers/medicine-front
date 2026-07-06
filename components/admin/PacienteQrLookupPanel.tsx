"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { Camera, ChevronDown, Loader2, QrCode, Search, X } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { getPacienteByCodigoQrWithApi } from "@/lib/api/pacientes";
import { getApiErrorMessages } from "@/lib/api/format-api-error";
import type { PacienteDto } from "@/lib/api/types";
import {
  formatPacienteFechaNacimiento,
  formatPacienteSexo,
  getPacienteEdad,
  getPacienteInitials,
  getPacienteNombre,
} from "@/lib/pacientes-display";
import { extractCodigoQrFromScan } from "@/lib/patient-qr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const QrCameraScannerModal = dynamic(
  () =>
    import("@/components/operator/QrCameraScannerModal").then((mod) => ({
      default: mod.QrCameraScannerModal,
    })),
  { ssr: false, loading: () => null }
);

type PacienteQrLookupPanelProps = {
  accessToken: string | null;
  onPatientFound?: (paciente: PacienteDto) => void;
  /** Barra compacta colapsable (por defecto cerrada). */
  compact?: boolean;
};

export function PacienteQrLookupPanel({
  accessToken,
  onPatientFound,
  compact = false,
}: PacienteQrLookupPanelProps) {
  const [qrInput, setQrInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<PacienteDto | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  const lookup = useCallback(
    async (raw: string) => {
      if (!accessToken) {
        setError("Sesión no válida.");
        return;
      }

      const codigoQr = extractCodigoQrFromScan(raw);
      if (!codigoQr) {
        setResult(null);
        setError("Código inválido. Usá el formato PAC-000001 o escaneá el QR del paciente.");
        return;
      }

      setQrInput(codigoQr);
      setError("");
      setLoading(true);
      setResult(null);

      try {
        const paciente = await getPacienteByCodigoQrWithApi(accessToken, codigoQr);
        setResult(paciente);
        onPatientFound?.(paciente);
      } catch (err) {
        const msg =
          err instanceof ApiError
            ? getApiErrorMessages(err).join(" ")
            : "No se encontró el paciente para ese código QR.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [accessToken, onPatientFound]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void lookup(qrInput);
  };

  const clearResult = () => {
    setResult(null);
    setError("");
    setQrInput("");
  };

  const qrFormAndResult = (
    <>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-2 sm:flex-row sm:items-center"
      >
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <QrCode className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-medical-mutedText" />
          <Input
            type="text"
            value={qrInput}
            onChange={(e) => setQrInput(e.target.value.toUpperCase())}
            placeholder="PAC-000001"
            disabled={loading || !accessToken}
            className="h-9 border-medical-border/80 bg-background pl-8 font-mono text-sm uppercase shadow-sm"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button
            type="submit"
            size="sm"
            disabled={loading || !accessToken || !qrInput.trim()}
            className="h-9 cursor-pointer bg-medical-primary hover:bg-medical-primaryDark"
          >
            {loading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Search className="size-3.5" />
            )}
            Buscar
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-9 cursor-pointer border-medical-border/80"
            disabled={loading || !accessToken}
            onClick={() => setCameraOpen(true)}
          >
            <Camera className="size-3.5" />
            Escanear
          </Button>
          {result ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-9 cursor-pointer border-medical-border/80"
              onClick={clearResult}
            >
              <X className="size-3.5" />
              Limpiar
            </Button>
          ) : null}
        </div>
      </form>

      {error ? (
        <p className="mt-2 rounded-md border border-medical-danger/30 bg-medical-danger/10 px-2.5 py-1.5 text-xs text-medical-danger">
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="mt-2 overflow-hidden rounded-lg border border-medical-primary/25 bg-white shadow-sm">
          <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-start sm:gap-4">
            <div className="flex shrink-0 flex-col items-center gap-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.qrDataUrl}
                alt={`QR ${result.codigoQr}`}
                className="size-20 rounded-md border border-medical-border bg-white p-0.5"
              />
              <span className="font-mono text-[10px] font-semibold text-medical-primary">
                {result.codigoQr}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-lg bg-medical-secondary text-xs font-bold text-medical-primary">
                  {getPacienteInitials(result)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-medical-text">
                    {getPacienteNombre(result)}
                  </p>
                  <p className="truncate text-xs text-medical-mutedText">
                    DNI {result.numeroDocumento}
                    {result.numeroAfiliado ? ` · Af. ${result.numeroAfiliado}` : ""}
                  </p>
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-1.5 text-xs sm:grid-cols-4">
                <div className="rounded-md border border-medical-border/80 bg-medical-surface/40 px-2 py-1">
                  <dt className="text-[9px] uppercase text-medical-mutedText">Edad</dt>
                  <dd className="font-medium text-medical-text">
                    {getPacienteEdad(result.fechaNacimiento)} a.
                  </dd>
                </div>
                <div className="rounded-md border border-medical-border/80 bg-medical-surface/40 px-2 py-1">
                  <dt className="text-[9px] uppercase text-medical-mutedText">Sexo</dt>
                  <dd className="font-medium text-medical-text">
                    {formatPacienteSexo(result.sexo)}
                  </dd>
                </div>
                <div className="rounded-md border border-medical-border/80 bg-medical-surface/40 px-2 py-1">
                  <dt className="text-[9px] uppercase text-medical-mutedText">Tel.</dt>
                  <dd className="truncate font-medium text-medical-text">{result.telefono}</dd>
                </div>
                <div className="rounded-md border border-medical-border/80 bg-medical-surface/40 px-2 py-1">
                  <dt className="text-[9px] uppercase text-medical-mutedText">Nac.</dt>
                  <dd className="font-medium text-medical-text">
                    {formatPacienteFechaNacimiento(result.fechaNacimiento)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );

  return (
    <>
      {cameraOpen ? (
        <QrCameraScannerModal
          onClose={() => setCameraOpen(false)}
          onDecoded={(text) => {
            setCameraOpen(false);
            void lookup(text);
          }}
        />
      ) : null}

      <div
        className={
          compact
            ? "border-t border-medical-border/60 pt-2"
            : "border-b border-medical-border/80 bg-medical-secondary/25 px-5 py-4 sm:px-7 sm:py-5"
        }
      >
        {compact ? (
          <details className="group" open={Boolean(result || error)}>
            <summary className="flex cursor-pointer list-none items-center gap-1.5 text-xs font-medium text-medical-primary hover:text-medical-primaryDark [&::-webkit-details-marker]:hidden">
              <QrCode className="size-3.5 shrink-0" aria-hidden />
              Buscar por código QR
              <ChevronDown className="size-3.5 shrink-0 transition group-open:rotate-180" aria-hidden />
            </summary>
            <div className="pt-2">{qrFormAndResult}</div>
          </details>
        ) : (
          <>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-medical-primaryDark">
              Búsqueda por código QR
            </p>
            {qrFormAndResult}
          </>
        )}
      </div>
    </>
  );
}
