"use client";

import { useState } from "react";
import { Check, CircleDollarSign, Loader2, Receipt } from "lucide-react";
import {
  VisitaFinanzasConfirmDialog,
  type VisitaFinanzasConfirmAction,
} from "@/components/admin/VisitaFinanzasConfirmDialog";
import { ApiError } from "@/lib/api/client";
import { getApiErrorMessages } from "@/lib/api/format-api-error";
import { updateVisitaFinanzasWithApi } from "@/lib/api/visitas";
import type { UpdateVisitaFinanzasBody, VisitaDetailDto, VisitaFinanzasDto } from "@/lib/api/types";
import { VISITA_FINANZAS_UI } from "@/lib/visita-finanzas-labels";
import { medicalSuccessIconButton, medicalSuccessButtonOutline } from "@/lib/medical-ui-classes";
import { cn } from "@/lib/utils";

type Props = {
  visitaId: number;
  finanzas?: VisitaFinanzasDto | null;
  accessToken: string;
  onUpdated: (visita: VisitaDetailDto) => void;
};

type SavingKey = VisitaFinanzasConfirmAction | null;

const iconBtnClass =
  "inline-flex size-8 cursor-pointer items-center justify-center rounded-md border bg-white transition disabled:opacity-50";

export function VisitaFinanzasTableActions({
  visitaId,
  finanzas,
  accessToken,
  onUpdated,
}: Props) {
  const [saving, setSaving] = useState<SavingKey>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<VisitaFinanzasConfirmAction | null>(null);

  const facturado = finanzas?.facturado ?? false;
  const pagado = finanzas?.pagado ?? false;
  const isBusy = saving !== null;
  const allDone = facturado && pagado;
  const canMarkFacturado = !facturado;
  const canMarkPagado = !pagado;

  const fac = VISITA_FINANZAS_UI.facturado;
  const pag = VISITA_FINANZAS_UI.pagado;

  const patch = async (body: UpdateVisitaFinanzasBody, key: SavingKey) => {
    if (!key) return;
    setSaving(key);
    setError("");
    try {
      const updated = await updateVisitaFinanzasWithApi(accessToken, visitaId, body);
      onUpdated(updated);
      setPending(null);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? getApiErrorMessages(err).join(" ")
          : "No se pudo actualizar el seguimiento."
      );
    } finally {
      setSaving(null);
    }
  };

  const handleConfirm = () => {
    if (!pending) return;
    if (pending === "facturado") void patch({ facturado: true }, "facturado");
    if (pending === "pagado") void patch({ pagado: true }, "pagado");
  };

  if (allDone) {
    return (
      <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
        <span
          className={cn("size-8 shrink-0", medicalSuccessIconButton)}
          title={VISITA_FINANZAS_UI.cobroCompletado}
          aria-label={VISITA_FINANZAS_UI.ambosCompletos}
        >
          <Check className="size-4 shrink-0" aria-hidden />
        </span>
      </div>
    );
  }

  if (!canMarkFacturado && !canMarkPagado) {
    return null;
  }

  return (
    <>
      <div
        className="flex items-center justify-end gap-1.5"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {canMarkFacturado ? (
          <button
            type="button"
            disabled={isBusy}
            title={`Cambiar a ${fac.estadoSi.toLowerCase()}`}
            aria-label={`Cambiar a ${fac.estadoSi.toLowerCase()}`}
            onClick={() => setPending("facturado")}
            className={cn(
              iconBtnClass,
              "border-medical-primary/30 text-medical-primary hover:bg-medical-secondary"
            )}
          >
            {saving === "facturado" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Receipt className="size-4" />
            )}
          </button>
        ) : null}
        {canMarkPagado ? (
          <button
            type="button"
            disabled={isBusy}
            title={`Cambiar a ${pag.estadoSi.toLowerCase()}`}
            aria-label={`Cambiar a ${pag.estadoSi.toLowerCase()}`}
            onClick={() => setPending("pagado")}
            className={cn(
              iconBtnClass,
              medicalSuccessButtonOutline
            )}
          >
            {saving === "pagado" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CircleDollarSign className="size-4" />
            )}
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="mt-1 max-w-[120px] text-right text-xs leading-tight text-medical-danger">{error}</p>
      ) : null}

      <VisitaFinanzasConfirmDialog
        open={pending != null}
        action={pending}
        loading={isBusy}
        onConfirm={handleConfirm}
        onCancel={() => {
          if (!isBusy) {
            setPending(null);
            setError("");
          }
        }}
      />
    </>
  );
}
