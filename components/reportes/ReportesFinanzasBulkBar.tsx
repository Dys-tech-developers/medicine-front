"use client";

import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VISITA_FINANZAS_UI } from "@/lib/visita-finanzas-labels";

const MAX_BULK = 200;

type Props = {
  selectedCount: number;
  canEdit: boolean;
  saving: boolean;
  onClear: () => void;
  onMarcarFacturado: () => void;
  onMarcarPagado: () => void;
  onMarcarAmbos: () => void;
};

export function ReportesFinanzasBulkBar({
  selectedCount,
  canEdit,
  saving,
  onClear,
  onMarcarFacturado,
  onMarcarPagado,
  onMarcarAmbos,
}: Props) {
  if (selectedCount === 0) return null;

  const overLimit = selectedCount > MAX_BULK;
  const fac = VISITA_FINANZAS_UI.facturado;
  const pag = VISITA_FINANZAS_UI.pagado;

  return (
    <div className="sticky bottom-0 z-20 border-t border-medical-primary/20 bg-medical-primary px-4 py-3 shadow-[0_-8px_30px_-12px_rgba(69,76,146,0.35)] sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-white">
          <span className="font-bold">{selectedCount}</span> visita
          {selectedCount !== 1 ? "s" : ""} seleccionada
          {selectedCount !== 1 ? "s" : ""}
          {overLimit ? (
            <span className="mt-1 block text-medical-warning/70">
              Máximo {MAX_BULK} por operación masiva
            </span>
          ) : (
            <span className="mt-0.5 block text-[11px] font-normal text-white/75">
              {VISITA_FINANZAS_UI.disclaimer}
            </span>
          )}
        </div>

        {canEdit ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={saving || overLimit}
              className="cursor-pointer"
              onClick={onMarcarFacturado}
            >
              {saving ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
              Cambiar a {fac.estadoSi.toLowerCase()}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={saving || overLimit}
              className="cursor-pointer"
              onClick={onMarcarPagado}
            >
              {saving ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
              Cambiar a {pag.estadoSi.toLowerCase()}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={saving || overLimit}
              className="cursor-pointer bg-white text-medical-primary hover:bg-white/90"
              onClick={onMarcarAmbos}
            >
              {VISITA_FINANZAS_UI.accionAmbos}
            </Button>
            <button
              type="button"
              onClick={onClear}
              disabled={saving}
              className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-white/90 hover:bg-white/10"
            >
              <X className="h-4 w-4" />
              Limpiar
            </button>
          </div>
        ) : (
          <p className="text-xs text-white/80">Solo administradores pueden cambiar el seguimiento.</p>
        )}
      </div>
    </div>
  );
}
