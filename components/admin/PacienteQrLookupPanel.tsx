"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { Camera, Loader2, QrCode, Search, X } from "lucide-react";
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
};

export function PacienteQrLookupPanel({
  accessToken,
  onPatientFound,
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

      <div className="border-b border-medical-border/80 bg-medical-secondary/25 px-5 py-4 sm:px-7 sm:py-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-medical-primaryDark">
          Búsqueda por código QR
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <QrCode className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-medical-mutedText" />
            <Input
              type="text"
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value.toUpperCase())}
              placeholder="PAC-000001"
              disabled={loading || !accessToken}
              className="h-10 border-medical-border/80 bg-background pl-9 font-mono text-sm uppercase shadow-sm"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              disabled={loading || !accessToken || !qrInput.trim()}
              className="bg-medical-primary cursor-pointer hover:bg-medical-primaryDark"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
              Buscar
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-medical-border/80 cursor-pointer"
              disabled={loading || !accessToken}
              onClick={() => setCameraOpen(true)}
            >
              <Camera className="size-4" />
              Escanear
            </Button>
            {result ? (
              <Button
                type="button"
                variant="outline"
                className="border-medical-border/80 cursor-pointer"
                onClick={clearResult}
              >
                <X className="size-4" />
                Limpiar
              </Button>
            ) : null}
          </div>
        </form>

        {error ? (
          <p className="mt-3 rounded-lg border border-medical-danger/30 bg-medical-danger/10 px-3 py-2 text-sm text-medical-danger">
            {error}
          </p>
        ) : null}

        {result ? (
          <div className="mt-4 overflow-hidden rounded-xl border border-medical-primary/30 bg-white shadow-sm">
            <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:gap-6">
              <div className="flex shrink-0 flex-col items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={result.qrDataUrl}
                  alt={`QR ${result.codigoQr}`}
                  className="size-28 rounded-lg border border-medical-border bg-white p-1"
                />
                <span className="font-mono text-xs font-semibold text-medical-primary">
                  {result.codigoQr}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-medical-secondary text-sm font-bold text-medical-primary">
                    {getPacienteInitials(result)}
                  </div>
                  <div>
                    <p className="font-semibold text-medical-text">{getPacienteNombre(result)}</p>
                    <p className="text-sm text-medical-mutedText">
                      DNI {result.numeroDocumento} · Afiliado {result.numeroAfiliado}
                    </p>
                  </div>
                </div>
                <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                  <div className="rounded-lg border border-medical-border bg-medical-surface/50 px-3 py-2">
                    <dt className="text-[10px] font-medium uppercase tracking-wide text-medical-mutedText">
                      Edad
                    </dt>
                    <dd className="font-medium text-medical-text">
                      {getPacienteEdad(result.fechaNacimiento)} años
                    </dd>
                  </div>
                  <div className="rounded-lg border border-medical-border bg-medical-surface/50 px-3 py-2">
                    <dt className="text-[10px] font-medium uppercase tracking-wide text-medical-mutedText">
                      Sexo
                    </dt>
                    <dd className="font-medium text-medical-text">
                      {formatPacienteSexo(result.sexo)}
                    </dd>
                  </div>
                  <div className="rounded-lg border border-medical-border bg-medical-surface/50 px-3 py-2">
                    <dt className="text-[10px] font-medium uppercase tracking-wide text-medical-mutedText">
                      Teléfono
                    </dt>
                    <dd className="font-medium text-medical-text">{result.telefono}</dd>
                  </div>
                  <div className="rounded-lg border border-medical-border bg-medical-surface/50 px-3 py-2">
                    <dt className="text-[10px] font-medium uppercase tracking-wide text-medical-mutedText">
                      Nacimiento
                    </dt>
                    <dd className="font-medium text-medical-text">
                      {formatPacienteFechaNacimiento(result.fechaNacimiento)}
                    </dd>
                  </div>
                  <div className="col-span-full rounded-lg border border-medical-border bg-medical-surface/50 px-3 py-2">
                    <dt className="text-[10px] font-medium uppercase tracking-wide text-medical-mutedText">
                      Dirección
                    </dt>
                    <dd className="font-medium text-medical-text">{result.direccion}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
