import { createElement } from "react";
import { createRoot } from "react-dom/client";
import type { PacienteDto } from "@/lib/api/types";
import { PacienteCredencialCard } from "@/components/admin/PacienteCredencialCard";

function waitForImages(container: HTMLElement): Promise<void> {
  const imgs = Array.from(container.querySelectorAll("img"));
  if (imgs.length === 0) return Promise.resolve();

  return Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          img.onload = () => resolve();
          img.onerror = () => resolve();
        })
    )
  ).then(() => undefined);
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

function findCredencialCard(root: HTMLElement): HTMLElement | null {
  return root.querySelector<HTMLElement>("[data-credencial-card]");
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo cargar la imagen de la credencial."));
    img.src = src;
  });
}

/**
 * Captura la credencial a PNG con html-to-image (SVG foreignObject), que respeta
 * el layout/tipografía del navegador y evita el corrimiento de texto de html2canvas.
 */
async function captureCardToPdf(card: HTMLElement, codigoQr: string): Promise<void> {
  await waitForImages(card);

  const { toPng } = await import("html-to-image");
  const { default: jsPDF } = await import("jspdf");

  const width = card.offsetWidth;
  const height = card.offsetHeight;

  const dataUrl = await toPng(card, {
    pixelRatio: 3,
    width,
    height,
    backgroundColor: "#ffffff",
    cacheBust: true,
    style: {
      margin: "0",
    },
  });

  const img = await loadImage(dataUrl);
  if (img.naturalWidth < 20 || img.naturalHeight < 20) {
    throw new Error(
      "La captura de la credencial salió vacía. Probá de nuevo o recargá la página."
    );
  }

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const cardW = 90;
  const cardH = (img.naturalHeight * cardW) / img.naturalWidth;
  const x = (pageW - cardW) / 2;
  const y = (pageH - cardH) / 2;

  pdf.addImage(dataUrl, "PNG", x, y, cardW, cardH);
  pdf.save(`credencial-${codigoQr}.pdf`);
}

/**
 * Genera un PDF con la credencial del paciente.
 * Renderiza en un iframe aislado (sin Tailwind) para evitar errores lab/oklch al capturar.
 */
export async function downloadPacienteCredencialPdf(
  paciente: PacienteDto
): Promise<void> {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  // No usar visibility:hidden: la captura no pinta el contenido completo.
  iframe.style.cssText =
    "position:fixed;left:-10000px;top:0;width:420px;height:820px;border:none;opacity:0;pointer-events:none;z-index:-1;";

  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  const iframeWindow = iframe.contentWindow;
  if (!doc || !iframeWindow) {
    document.body.removeChild(iframe);
    throw new Error("No se pudo preparar la vista para el PDF.");
  }

  doc.open();
  doc.write(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><base href="${origin}/"></head><body style="margin:0;padding:16px;background:#ffffff;color:#0f172a;font-family:system-ui,-apple-system,sans-serif;"></body></html>`
  );
  doc.close();

  const mount = doc.body;
  const root = createRoot(mount);

  try {
    root.render(createElement(PacienteCredencialCard, { paciente }));
    await nextFrame();
    await waitForImages(mount);

    const card = findCredencialCard(mount);
    if (!card) {
      throw new Error("No se pudo generar la credencial.");
    }

    // Pequeña espera extra para asegurar fuentes/layout estables.
    await nextFrame();

    await captureCardToPdf(card, paciente.codigoQr);
  } finally {
    root.unmount();
    document.body.removeChild(iframe);
  }
}
