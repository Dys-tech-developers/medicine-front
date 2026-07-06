"use client";

import Link from "next/link";
import { ClipboardList, Clock, RefreshCw } from "lucide-react";
import { VisitFeedSkeleton } from "@/components/skeletons/dashboard-skeletons";
import { EmptyState } from "@/components/ui/empty-state";
import type { VisitaListItemDto } from "@/lib/api/types";
import {
  formatVisitaDuracion,
  getPacienteInitials,
  getPacienteNombre,
} from "@/lib/visitas-display";
import { cn } from "@/lib/utils";

function formatVisitaDate(iso: string): string {
  try {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const sameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();

    if (sameDay(d, today)) return "Hoy";
    if (sameDay(d, yesterday)) return "Ayer";

    const diffDays = Math.floor((today.getTime() - d.getTime()) / 86_400_000);
    if (diffDays < 7) return `Hace ${diffDays} días`;

    return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
  } catch {
    return "—";
  }
}

function formatVisitaTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

type VisitasRecentPanelProps = {
  items: VisitaListItemDto[];
  total: number;
  loading: boolean;
  error: string;
  onRetry: () => void;
  limit?: number;
  showViewAllLink?: boolean;
  /** Estira el panel para igualar altura con la tarjeta vecina en el grid. */
  fillHeight?: boolean;
};

function VisitaListItem({ visita, index }: { visita: VisitaListItemDto; index: number }) {
  const paciente = getPacienteNombre(visita);
  const prestador = visita.prestador?.nombre ?? null;
  const servicio = visita.pacienteServicio?.servicio?.nombre ?? null;
  const fechaLabel = formatVisitaDate(visita.fecha);
  const horaLabel = formatVisitaTime(visita.fecha);

  return (
    <li
      className={cn(
        "flex flex-col gap-2 px-4 py-3.5 transition-colors hover:bg-medical-secondary/40 sm:flex-row sm:items-center sm:gap-3.5 sm:px-5",
        index % 2 === 1 && "bg-medical-secondary/20"
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-medical-secondary text-xs font-bold text-medical-primary ring-1 ring-medical-primary/10">
          {getPacienteInitials(visita)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-medical-text">{paciente}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            {prestador ? (
              <span className="truncate text-xs text-medical-mutedText">{prestador}</span>
            ) : null}
            {servicio ? (
              <span className="inline-flex max-w-full items-center truncate rounded-md border border-medical-border bg-white px-1.5 py-0.5 text-xs font-medium text-medical-text sm:max-w-[12rem]">
                {servicio}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-2 pl-12 sm:block sm:pl-0 sm:text-right">
        <span className="inline-flex items-center gap-1 rounded-lg border border-medical-primary/20 bg-medical-secondary px-2 py-0.5 text-xs font-semibold text-medical-primaryDark">
          <Clock className="size-3 shrink-0" />
          {formatVisitaDuracion(visita.tiempoMinutos)}
        </span>
        <p className="text-xs font-medium text-medical-mutedText sm:mt-1">
          {fechaLabel}
          {horaLabel ? ` · ${horaLabel}` : ""}
        </p>
      </div>
    </li>
  );
}

export function VisitasRecentPanel({
  items,
  total,
  loading,
  error,
  onRetry,
  limit = 5,
  showViewAllLink = false,
  fillHeight = false,
}: VisitasRecentPanelProps) {
  const visible = items.slice(0, limit);
  const hasMore = total > limit;
  const shellCls = fillHeight ? "flex min-h-0 flex-1 flex-col" : "";

  if (loading) {
    return (
      <div className={shellCls}>
        <VisitFeedSkeleton rows={Math.min(limit, 5)} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={shellCls}>
        <EmptyState
          compact
          variant="error"
          icon={ClipboardList}
          title="No se pudieron cargar las visitas"
          description={error}
          className={fillHeight ? "flex-1" : undefined}
          action={
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-medical-primary px-4 py-2 text-sm font-semibold text-white hover:bg-medical-primaryDark"
            >
              <RefreshCw className="size-4" />
              Reintentar
            </button>
          }
        />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={shellCls}>
        <EmptyState
          compact
          icon={ClipboardList}
          title="No hay visitas registradas"
          description="Cuando los prestadores registren visitas, vas a verlas acá."
          className={fillHeight ? "flex-1" : undefined}
        />
      </div>
    );
  }

  return (
    <div className={shellCls}>
      <ul className="divide-y divide-medical-border/60 bg-medical-surface/20">
        {visible.map((visita, index) => (
          <VisitaListItem key={visita.id} visita={visita} index={index} />
        ))}
      </ul>
      {(hasMore || showViewAllLink) && (
        <div
          className={cn(
            "border-t border-medical-border/60 bg-medical-secondary/25 px-5 py-3 text-center",
            fillHeight && "mt-auto shrink-0"
          )}
        >
          {hasMore ? (
            <p className="text-xs text-medical-mutedText">
              +{total - limit} visita{total - limit === 1 ? "" : "s"} más
              {showViewAllLink ? (
                <>
                  {" · "}
                  <Link
                    href="/admin/visitas"
                    className="font-semibold text-medical-primary hover:underline"
                  >
                    Ver todas
                  </Link>
                </>
              ) : null}
            </p>
          ) : showViewAllLink ? (
            <Link
              href="/admin/visitas"
              className="text-xs font-semibold text-medical-primary hover:underline"
            >
              Ver todas las visitas →
            </Link>
          ) : null}
        </div>
      )}
    </div>
  );
}
