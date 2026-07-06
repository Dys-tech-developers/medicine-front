"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import {
  CARGA_MASIVA_STOCK_MAX_FILAS,
  downloadStockCargaMasivaPlantillaWithApi,
  formatCargaMasivaStockError,
  triggerBrowserFileDownload,
  uploadStockCargaMasivaWithApi,
  validateStockCargaMasivaFile,
  type CargaMasivaStockResultDto,
} from "@/lib/api/carga-masiva-stock";
import { getApiErrorMessages } from "@/lib/api/format-api-error";
import { cn } from "@/lib/utils";

const ACCEPT = ".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

type Props = {
  open: boolean;
  accessToken: string | null;
  onClose: () => void;
  onSuccess?: (result: CargaMasivaStockResultDto) => void;
};

function isExcelFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".xlsx") ||
    file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
}

export function InsumoCargaMasivaDialog({
  open,
  accessToken,
  onClose,
  onSuccess,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CargaMasivaStockResultDto | null>(null);

  const reset = useCallback(() => {
    setFile(null);
    setDragOver(false);
    setError("");
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }
    reset();
  }, [open, reset]);

  useEffect(() => {
    if (!open || uploading) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, uploading, onClose]);

  const pickFile = (next: File | null) => {
    if (!next) return;
    if (!isExcelFile(next)) {
      setError("El archivo debe ser Excel (.xlsx) generado por la planilla del sistema.");
      setFile(null);
      return;
    }
    const validationError = validateStockCargaMasivaFile(next);
    if (validationError) {
      setError(validationError);
      setFile(null);
      return;
    }
    setFile(next);
    setError("");
    setResult(null);
  };

  const handleDownloadPlantilla = async () => {
    if (!accessToken) {
      setError("Sesión no válida. Volvé a iniciar sesión.");
      return;
    }
    setDownloading(true);
    setError("");
    try {
      const { blob, filename } = await downloadStockCargaMasivaPlantillaWithApi(accessToken);
      triggerBrowserFileDownload(blob, filename);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? getApiErrorMessages(err).join(" ")
          : "No se pudo descargar la planilla.";
      setError(msg);
    } finally {
      setDownloading(false);
    }
  };

  const handleUpload = async () => {
    if (!accessToken) {
      setError("Sesión no válida. Volvé a iniciar sesión.");
      return;
    }
    if (!file) {
      setError("Seleccioná o arrastrá la planilla completada.");
      return;
    }

    setUploading(true);
    setError("");
    try {
      const data = await uploadStockCargaMasivaWithApi(accessToken, file);
      setResult(data);
      onSuccess?.(data);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? getApiErrorMessages(err).join(" ")
          : "No se pudo procesar la carga masiva.";
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[125] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="insumo-carga-masiva-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-pointer bg-medical-text/55 backdrop-blur-sm"
        aria-label="Cerrar"
        disabled={uploading}
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-medical-border bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-medical-border bg-medical-primary px-5 py-4">
          <div className="flex min-w-0 items-center gap-2 text-white">
            <FileSpreadsheet className="size-5 shrink-0" />
            <div className="min-w-0">
              <h2 id="insumo-carga-masiva-title" className="text-base font-semibold">
                Carga masiva de stock
              </h2>
              <p className="text-xs text-white/80">
                Descargá la planilla, completala y subila acá.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="cursor-pointer text-white/80 hover:bg-white/15 hover:text-white"
            disabled={uploading}
            onClick={onClose}
          >
            <X className="size-5" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="rounded-xl border border-medical-border bg-medical-surface/50 px-4 py-3">
            <p className="text-sm text-medical-text">
              Usá la planilla descargada desde el sistema (hoja «Stock»). Una fila = un insumo. El{" "}
              <span className="font-medium">código</span> debe ser único. Si{" "}
              <span className="font-medium">requiere_vencimiento</span> es sí, completá{" "}
              <span className="font-medium">fecha_vencimiento</span> (AAAA-MM-DD). Unidades
              admitidas: unidad, caja, frasco, bolsa, par, metro, litro, kg, ml. Máximo{" "}
              {CARGA_MASIVA_STOCK_MAX_FILAS} filas y 5 MB por archivo.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 cursor-pointer border-medical-primary/30 text-medical-primary hover:bg-medical-secondary"
              disabled={downloading || uploading}
              onClick={() => void handleDownloadPlantilla()}
            >
              {downloading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              Descargar planilla Excel
            </Button>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-medical-text">Planilla completada</p>
            <div
              role="button"
              tabIndex={0}
              onDragOver={(e) => {
                e.preventDefault();
                if (!uploading) setDragOver(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setDragOver(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (uploading) return;
                pickFile(e.dataTransfer.files?.[0] ?? null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  inputRef.current?.click();
                }
              }}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-8 text-center transition",
                dragOver
                  ? "border-medical-primary bg-medical-secondary/60"
                  : "border-medical-border bg-medical-surface/40 hover:border-medical-primary/40 hover:bg-medical-secondary/30",
                uploading && "pointer-events-none opacity-60"
              )}
              onClick={() => !uploading && inputRef.current?.click()}
            >
              <Upload className="mb-2 size-8 text-medical-primary" aria-hidden />
              <p className="text-sm font-medium text-medical-text">
                Arrastrá el archivo acá o tocá para elegirlo
              </p>
              <p className="mt-1 text-xs text-medical-mutedText">
                Solo .xlsx · hasta 5 MB · máx. {CARGA_MASIVA_STOCK_MAX_FILAS} filas con datos
              </p>
              {file ? (
                <p className="mt-3 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-medical-primaryDark ring-1 ring-medical-border">
                  {file.name}
                </p>
              ) : null}
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPT}
                className="sr-only"
                disabled={uploading}
                onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>

          {result ? (
            <div
              className={cn(
                "rounded-xl border px-4 py-3 text-sm text-medical-text",
                result.errores.length > 0 && result.creados > 0
                  ? "border-medical-warning/35 bg-medical-warning/10"
                  : result.creados > 0
                    ? "border-medical-success/30 bg-medical-success/10"
                    : "border-medical-danger/30 bg-medical-danger/10"
              )}
            >
              <p
                className={cn(
                  "font-semibold",
                  result.errores.length > 0 && result.creados > 0
                    ? "text-medical-warning"
                    : result.creados > 0
                      ? "text-medical-success"
                      : "text-medical-danger"
                )}
              >
                {result.creados > 0
                  ? `Se crearon ${result.creados} insumo${result.creados === 1 ? "" : "s"} de ${result.totalFilas} fila${result.totalFilas === 1 ? "" : "s"} procesada${result.totalFilas === 1 ? "" : "s"}.`
                  : result.totalFilas > 0
                    ? "No se pudo crear ningún insumo."
                    : "No se encontraron filas con datos en la planilla."}
              </p>
              {result.errores.length > 0 ? (
                <>
                  <p className="mt-1 text-xs text-medical-mutedText">
                    Los insumos válidos se guardaron; corregí las filas con error y volvé a subir
                    la planilla.
                  </p>
                  <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-medical-danger">
                    {result.errores.map((item) => (
                      <li key={`${item.fila}-${item.campo ?? ""}-${item.mensaje}`}>
                        <span className="font-semibold">Fila {item.fila}:</span>{" "}
                        {formatCargaMasivaStockError(item)}
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </div>
          ) : null}

          {error ? (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-medical-danger/30 bg-medical-danger/10 px-3 py-2 text-sm text-medical-danger"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <p>{error}</p>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-medical-border bg-medical-surface/80 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            disabled={uploading}
            onClick={onClose}
          >
            {result ? "Cerrar" : "Cancelar"}
          </Button>
          {!result ? (
            <Button
              type="button"
              className="cursor-pointer bg-medical-primary text-white hover:bg-medical-primaryDark"
              disabled={uploading || !file}
              onClick={() => void handleUpload()}
            >
              {uploading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Procesando planilla…
                </>
              ) : (
                <>
                  <Upload className="size-4" />
                  Subir y procesar
                </>
              )}
            </Button>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
}
