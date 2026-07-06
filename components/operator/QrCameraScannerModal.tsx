"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Camera, Loader2, X } from "lucide-react";

export type QrCameraScannerModalProps = {
  onClose: () => void;
  onDecoded: (text: string) => void;
};

let activeScanner: Html5Qrcode | null = null;

async function stopScanner(instance: Html5Qrcode | null) {
  if (!instance) return;
  try {
    if (instance.isScanning) {
      await instance.stop();
    }
  } catch {
    /* */
  }
  try {
    instance.clear();
  } catch {
    /* */
  }
}

/**
 * Solo debe montarse en el cliente (p. ej. vía next/dynamic ssr:false).
 * html5-qrcode modifica el DOM del contenedor; al desmontar, el cleanup detiene la cámara antes de borrar el nodo.
 */
export function QrCameraScannerModal({ onClose, onDecoded }: QrCameraScannerModalProps) {
  const reactScanId = useId();
  const regionId = `qr-region-${reactScanId.replace(/:/g, "")}`;
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const closingRef = useRef(false);
  const onDecodedRef = useRef(onDecoded);
  const onCloseRef = useRef(onClose);
  onDecodedRef.current = onDecoded;
  onCloseRef.current = onClose;

  useEffect(() => {
    let cancelled = false;
    let localScanner: Html5Qrcode | null = null;
    closingRef.current = false;

    const boxSize = Math.min(280, typeof window !== "undefined" ? window.innerWidth - 48 : 280);
    const scanConfig = {
      fps: 12,
      qrbox: { width: boxSize, height: boxSize },
      aspectRatio: 1,
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
    };

    const finish = async (text: string) => {
      if (closingRef.current) return;
      closingRef.current = true;
      await stopScanner(scannerRef.current);
      scannerRef.current = null;
      onDecodedRef.current(text);
      onCloseRef.current();
    };

    const onDecode = (decodedText: string) => {
      void finish(decodedText);
    };

    const noop = () => {};

    (async () => {
      try {
        await stopScanner(activeScanner);
        activeScanner = null;

        const html5 = new Html5Qrcode(regionId, { verbose: false });
        localScanner = html5;
        scannerRef.current = html5;
        activeScanner = html5;

        if (cancelled) return;

        const isMobile =
          typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches;
        const facingModes = isMobile
          ? (["environment", "user"] as const)
          : (["user", "environment"] as const);

        for (const facingMode of facingModes) {
          try {
            await html5.start({ facingMode }, scanConfig, onDecode, noop);
            return;
          } catch {
            await stopScanner(html5);
          }
        }

        const cameras = await Html5Qrcode.getCameras();
        if (cancelled) return;
        if (cameras.length === 0) {
          setError("No se detectó ninguna cámara en este dispositivo.");
          return;
        }

        const preferred =
          cameras.find((c) =>
            isMobile
              ? /back|rear|environment|trasera|posterior/i.test(c.label)
              : /user|front|integrated|facetime|built.?in|webcam|isight/i.test(c.label)
          ) ?? cameras[0];

        await html5.start(preferred.id, scanConfig, onDecode, noop);
      } catch (err) {
        if (!cancelled) {
          const name =
            err && typeof err === "object" && "name" in err && typeof err.name === "string"
              ? err.name
              : "";
          if (name === "NotFoundError") {
            setError(
              "El navegador no encuentra ninguna cámara. Probá abrir Photo Booth o FaceTime para verificar que funcione, y revisá Ajustes → Privacidad → Cámara."
            );
          } else if (name === "NotAllowedError") {
            setError(
              "Permiso de cámara denegado. En la barra de direcciones → candado → Cámara → Permitir."
            );
          } else if (!window.isSecureContext) {
            setError(
              "Usá http://localhost:3000 (no la IP de la red) o HTTPS para que el navegador permita la cámara."
            );
          } else {
            setError(
              "No pudimos usar la cámara. Cerrá otras apps que la usen (Zoom, Teams) y recargá la página."
            );
          }
        }
      } finally {
        if (!cancelled) setStarting(false);
      }
    })();

    return () => {
      cancelled = true;
      closingRef.current = true;
      void stopScanner(localScanner);
      if (activeScanner === localScanner) {
        activeScanner = null;
      }
      scannerRef.current = null;
    };
  }, [regionId]);

  const handleDismiss = () => {
    void (async () => {
      await stopScanner(scannerRef.current);
      scannerRef.current = null;
      onClose();
    })();
  };

  const modal = (
    <div
      className="fixed inset-0 z-100 flex flex-col bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-camera-title"
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          <h2 id="qr-camera-title" className="text-sm font-semibold">
            Escanear código QR
          </h2>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="flex h-10 w-10  cursor-pointer items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center overflow-auto px-4 py-6">
        <div className="relative w-full max-w-sm">
          <div
            id={regionId}
            className="min-h-[220px] w-full overflow-hidden rounded-2xl bg-black ring-2 ring-white/20"
          />
          {starting ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-black/80">
              <Loader2 className="h-10 w-10 animate-spin text-medical-secondary" />
              <p className="text-sm text-white/90">Iniciando cámara...</p>
            </div>
          ) : null}
        </div>

        {error ? (
          <p className="mt-4 max-w-sm text-center text-sm text-medical-danger">{error}</p>
        ) : (
          !starting && (
            <p className="mt-4 max-w-sm text-center text-xs text-white/70">
              Apuntá al QR del paciente hasta que se lea automáticamente.
            </p>
          )
        )}
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;

  return createPortal(modal, document.body);
}
