"use client";

import { useCallback, useState } from "react";
import { Loader2, Trash2, XCircle } from "lucide-react";
import { VisitaCancelConfirmDialog } from "@/components/admin/VisitaCancelConfirmDialog";
import { VisitaDeleteConfirmDialog } from "@/components/admin/VisitaDeleteConfirmDialog";
import { Button } from "@/components/ui/button";
import type { ToastKind } from "@/components/ui/use-toast";
import { ApiError } from "@/lib/api/client";
import { cancelarVisitaWithApi, deleteVisitaWithApi } from "@/lib/api/visitas";
import type { VisitaDetailDto, VisitaListItemDto } from "@/lib/api/types";
import { withMinimumDuration } from "@/lib/loading/minimum-duration";
import {
  getVisitaCancelErrorMessage,
  getVisitaDeleteErrorMessage,
  puedeCancelarVisita,
  puedeEliminarVisita,
} from "@/lib/visitas-access";
import { getPacienteNombre } from "@/lib/visitas-display";
import { cn } from "@/lib/utils";

/** Duración mínima del estado "Procesando…" tras confirmar. */
const VISITA_ACTION_MIN_MS = 3000;

type VisitaAdminActionsProps = {
  visita: VisitaListItemDto;
  accessToken: string;
  esAdmin: boolean;
  onDeleted: (visitaId: number) => void;
  onCanceled?: (visita: VisitaDetailDto) => void;
  onNotFound?: () => void;
  onNotify?: (message: string, kind: ToastKind, description?: string) => void;
  className?: string;
};

/** Un solo botón visible + un modal de confirmación (máx. 2 clics). */
export function VisitaAdminActions({
  visita,
  accessToken,
  esAdmin,
  onDeleted,
  onCanceled,
  onNotFound,
  onNotify,
  className,
}: VisitaAdminActionsProps) {
  const canDelete = puedeEliminarVisita(visita, esAdmin);
  const canCancel = puedeCancelarVisita(visita, esAdmin);
  const pacienteLabel = getPacienteNombre(visita);

  const [confirmKind, setConfirmKind] = useState<"delete" | "cancel" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isBusy = loading;

  const notify = useCallback(
    (message: string, kind: ToastKind, description?: string) => {
      onNotify?.(message, kind, description);
    },
    [onNotify]
  );

  const handleDelete = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await withMinimumDuration(
        () => deleteVisitaWithApi(accessToken, visita.id),
        VISITA_ACTION_MIN_MS
      );
      setConfirmKind(null);
      onDeleted(visita.id);
      notify("Visita eliminada", "success", `${pacienteLabel} · #${visita.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setConfirmKind(null);
        onNotFound?.();
        notify("La visita ya no existe", "error", `Visita #${visita.id}`);
        return;
      }
      const msg =
        err instanceof ApiError ? getVisitaDeleteErrorMessage(err) : "No se pudo eliminar la visita.";
      setError(msg);
      notify("No se pudo eliminar la visita", "error", msg);
    } finally {
      setLoading(false);
    }
  }, [accessToken, visita.id, onDeleted, onNotFound, notify, pacienteLabel]);

  const handleCancel = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const updated = await withMinimumDuration(
        () => cancelarVisitaWithApi(accessToken, visita.id),
        VISITA_ACTION_MIN_MS
      );
      setConfirmKind(null);
      onCanceled?.(updated);
      notify("Visita cancelada", "success", `${pacienteLabel} · #${visita.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setConfirmKind(null);
        onNotFound?.();
        notify("La visita ya no existe", "error", `Visita #${visita.id}`);
        return;
      }
      const msg =
        err instanceof ApiError ? getVisitaCancelErrorMessage(err) : "No se pudo cancelar la visita.";
      setError(msg);
      notify("No se pudo cancelar la visita", "error", msg);
    } finally {
      setLoading(false);
    }
  }, [accessToken, visita.id, onCanceled, onNotFound, notify, pacienteLabel]);

  if (!canDelete && !canCancel) return null;

  const closeConfirm = () => {
    if (!loading) {
      setConfirmKind(null);
      setError("");
    }
  };

  return (
    <>
      <div
        className={cn("flex min-h-8 items-center justify-end", className)}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {canCancel ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 cursor-pointer text-medical-warning hover:bg-medical-warning/10 hover:text-medical-warning"
            disabled={isBusy}
            aria-label="Cancelar visita iniciada"
            title="Cancelar visita"
            onClick={() => {
              setError("");
              setConfirmKind("cancel");
            }}
          >
            {loading && confirmKind === "cancel" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <XCircle className="size-4" />
            )}
          </Button>
        ) : canDelete ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 cursor-pointer text-medical-danger hover:bg-medical-danger/10 hover:text-medical-danger"
            disabled={isBusy}
            aria-label="Eliminar visita"
            title="Eliminar visita"
            onClick={() => {
              setError("");
              setConfirmKind("delete");
            }}
          >
            {loading && confirmKind === "delete" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
          </Button>
        ) : null}
      </div>

      <VisitaDeleteConfirmDialog
        open={confirmKind === "delete"}
        visita={visita}
        loading={loading}
        error={error}
        onConfirm={() => void handleDelete()}
        onCancel={closeConfirm}
      />

      <VisitaCancelConfirmDialog
        open={confirmKind === "cancel"}
        visita={visita}
        loading={loading}
        error={error}
        onConfirm={() => void handleCancel()}
        onCancel={closeConfirm}
      />
    </>
  );
}
