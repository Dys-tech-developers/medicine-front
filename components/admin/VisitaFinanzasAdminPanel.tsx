"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import { getApiErrorMessages } from "@/lib/api/format-api-error";
import { updateVisitaFinanzasWithApi } from "@/lib/api/visitas";
import type { UpdateVisitaFinanzasBody, VisitaDetailDto, VisitaFinanzasDto } from "@/lib/api/types";
import { formatReporteMonto } from "@/lib/reportes-display";
import { MODALIDAD_COBRO_LABELS } from "@/lib/servicios-tarifas-labels";
import { getVisitaFinanzasEstadoLabel, VISITA_FINANZAS_UI } from "@/lib/visita-finanzas-labels";
import {
  finanzasSiNoBadgeClass,
  medicalSuccessBox,
  medicalSuccessButtonOutline,
} from "@/lib/medical-ui-classes";
import { cn } from "@/lib/utils";

type Props = {
  visitaId: number;
  finanzas: VisitaFinanzasDto | null | undefined;
  accessToken: string;
  onUpdated: (visita: VisitaDetailDto) => void;
};

type SavingKey = "facturado" | "pagado" | "both" | null;

export function VisitaFinanzasAdminPanel({
  visitaId,
  finanzas,
  accessToken,
  onUpdated,
}: Props) {
  const [saving, setSaving] = useState<SavingKey>(null);
  const [error, setError] = useState("");

  const patch = async (body: UpdateVisitaFinanzasBody, key: SavingKey) => {
    setSaving(key);
    setError("");
    try {
      const updated = await updateVisitaFinanzasWithApi(accessToken, visitaId, body);
      onUpdated(updated);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? getApiErrorMessages(err).join(" ")
          : "No se pudo actualizar el seguimiento.";
      setError(message);
    } finally {
      setSaving(null);
    }
  };

  if (!finanzas) {
    return (
      <p className="rounded-xl border border-dashed border-medical-border px-3.5 py-3 text-sm text-medical-mutedText">
        Esta visita no tiene datos de liquidación.
      </p>
    );
  }

  const isBusy = saving !== null;
  const allDone = finanzas.facturado && finanzas.pagado;
  const canMarkFacturado = !finanzas.facturado;
  const canMarkPagado = !finanzas.pagado;
  const fac = VISITA_FINANZAS_UI.facturado;
  const pag = VISITA_FINANZAS_UI.pagado;

  return (
    <div className="space-y-3">
      <p className="text-[11px] leading-snug text-medical-mutedText">{VISITA_FINANZAS_UI.disclaimer}</p>

      <div className="divide-y divide-medical-border/50 rounded-xl border border-medical-border/70 bg-medical-surface/40">
        <div className="flex flex-col gap-1 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <span className="text-xs font-medium text-medical-mutedText">Modalidad</span>
          <span className="text-sm font-medium text-medical-text">
            {MODALIDAD_COBRO_LABELS[finanzas.modalidadCobro] ?? finanzas.modalidadCobro}
          </span>
        </div>
        <div className="flex flex-col gap-1 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <span className="text-xs font-medium text-medical-mutedText">Valor aplicado</span>
          <span className="font-mono text-sm font-semibold text-medical-text">
            {formatReporteMonto(finanzas.valorAplicado)}
          </span>
        </div>
        <div className="flex flex-col gap-2 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <span className="text-xs font-medium text-medical-mutedText">
            {VISITA_FINANZAS_UI.facturado.nombre}
          </span>
          <span
            className={cn(
              "inline-flex w-fit rounded-md border px-2 py-0.5 text-xs font-semibold",
              finanzasSiNoBadgeClass(finanzas.facturado)
            )}
          >
            {getVisitaFinanzasEstadoLabel("facturado", finanzas.facturado)}
          </span>
        </div>
        <div className="flex flex-col gap-2 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <span className="text-xs font-medium text-medical-mutedText">
            {VISITA_FINANZAS_UI.pagado.nombre}
          </span>
          <span
            className={cn(
              "inline-flex w-fit rounded-md border px-2 py-0.5 text-xs font-semibold",
              finanzasSiNoBadgeClass(finanzas.pagado)
            )}
          >
            {getVisitaFinanzasEstadoLabel("pagado", finanzas.pagado)}
          </span>
        </div>
      </div>

      {allDone ? (
        <p
          className={cn(
            "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-medical-success",
            medicalSuccessBox
          )}
        >
          <Check className="h-4 w-4 shrink-0" />
          {VISITA_FINANZAS_UI.cobroCompletado}
        </p>
      ) : canMarkFacturado || canMarkPagado ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {canMarkFacturado ? (
            <Button
              type="button"
              variant="outline"
              disabled={isBusy}
              className="h-10 flex-1 cursor-pointer border-medical-primary/30 text-medical-primary hover:bg-medical-secondary"
              onClick={() => void patch({ facturado: true }, "facturado")}
            >
              {saving === "facturado" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Cambiar a {fac.estadoSi.toLowerCase()}
            </Button>
          ) : null}
          {canMarkPagado ? (
            <Button
              type="button"
              variant="outline"
              disabled={isBusy}
              className={cn("h-10 flex-1 cursor-pointer", medicalSuccessButtonOutline)}
              onClick={() => void patch({ pagado: true }, "pagado")}
            >
              {saving === "pagado" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Cambiar a {pag.estadoSi.toLowerCase()}
            </Button>
          ) : null}
          {canMarkFacturado && canMarkPagado ? (
            <Button
              type="button"
              disabled={isBusy}
              className="h-10 flex-1 cursor-pointer bg-medical-primary text-white hover:bg-medical-primaryDark"
              onClick={() => void patch({ facturado: true, pagado: true }, "both")}
            >
              {saving === "both" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {VISITA_FINANZAS_UI.accionAmbos}
            </Button>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-medical-danger/30 bg-medical-danger/10 px-3 py-2 text-sm text-medical-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
