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

/** Evita que html2canvas copie colores lab/oklch de estilos computados (Tailwind v4). */
function syncInlineStylesOnly(source: Element, target: Element): void {
  if (target instanceof HTMLElement && source instanceof HTMLElement) {
    target.removeAttribute("class");
    target.style.cssText = "";
    const inline = source.getAttribute("style");
    if (inline) target.setAttribute("style", inline);
  }

  const sourceKids = Array.from(source.children);
  const targetKids = Array.from(target.children);
  sourceKids.forEach((child, index) => {
    const targetChild = targetKids[index];
    if (targetChild) syncInlineStylesOnly(child, targetChild);
  });
}

async function captureCardToPdf(card: HTMLElement, codigoQr: string): Promise<void> {
  await waitForImages(card);

  const { default: html2canvas } = await import("html2canvas");
  const { default: jsPDF } = await import("jspdf");

  const canvas = await html2canvas(card, {
    scale: 3,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    logging: false,
    onclone: (clonedDoc, clonedRoot) => {
      clonedDoc
        .querySelectorAll('link[rel="stylesheet"], style')
        .forEach((node) => node.remove());

      const clonedCard =
        clonedRoot.querySelector<HTMLElement>("[data-credencial-card]") ?? clonedRoot;
      syncInlineStylesOnly(card, clonedCard);
    },
  });

  if (canvas.width < 20 || canvas.height < 20) {
    throw new Error(
      "La captura de la credencial salió vacía. Probá de nuevo o recargá la página."
    );
  }

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const cardW = 90;
  const cardH = (canvas.height * cardW) / canvas.width;
  const x = (pageW - cardW) / 2;
  const y = (pageH - cardH) / 2;

  pdf.addImage(imgData, "PNG", x, y, cardW, cardH);
  pdf.save(`credencial-${codigoQr}.pdf`);
}

/**
 * Genera un PDF con la credencial del paciente.
 * Renderiza en un iframe aislado (sin Tailwind) para evitar errores lab/oklch en html2canvas.
 */
export async function downloadPacienteCredencialPdf(
  paciente: PacienteDto
): Promise<void> {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  // No usar visibility:hidden: html2canvas no pinta el contenido completo.
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

    await captureCardToPdf(card, paciente.codigoQr);
  } finally {
    root.unmount();
    document.body.removeChild(iframe);
  }
}
