"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  History,
  Loader2,
  Package,
  RefreshCw,
  Search,
} from "lucide-react";
import { PrestadorVisitaDetailDialog } from "@/components/prestador/PrestadorVisitaDetailDialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ApiError } from "@/lib/api/client";
import { getVisitaByIdWithApi, listVisitasWithApi } from "@/lib/api/visitas";
import type { VisitaDetailDto, VisitaListItemDto } from "@/lib/api/types";
import { getPrestadorVisitaErrorMessage } from "@/lib/prestador-visitas";
import {
  formatVisitaDuracion,
  formatVisitaTimeOnly,
  getPacienteInitials,
  getPacienteNombre,
  getVisitaInsumosCount,
  getVisitaPacienteDocumento,
  getVisitaPeriodRange,
  groupVisitasByDate,
  matchesVisitaSearch,
  truncateVisitaObservaciones,
  type VisitaPeriodFilter,
} from "@/lib/visitas-display";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

const PERIOD_OPTIONS: { value: VisitaPeriodFilter; label: string }[] = [
  { value: "today", label: "Hoy" },
  { value: "7d", label: "7 días" },
  { value: "30d", label: "30 días" },
  { value: "all", label: "Todas" },
];

type Props = {
  accessToken: string | null;
  onRegistrarVisita: () => void;
};

function VisitaCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-medical-border bg-white p-3">
      <div className="h-4 w-40 rounded bg-medical-border" />
      <div className="mt-2 h-3 w-28 rounded bg-medical-border/70" />
      <div className="mt-2 h-3 w-24 rounded bg-medical-border/60" />
    </div>
  );
}

type VisitaCardProps = {
  visita: VisitaListItemDto;
  loadingDetail: boolean;
  onOpen: () => void;
};

function VisitaCard({ visita, loadingDetail, onOpen }: VisitaCardProps) {
  const documento = getVisitaPacienteDocumento(visita);
  const insumosCount = getVisitaInsumosCount(visita);
  const obsPreview = truncateVisitaObservaciones(visita.observaciones);
  const servicioNombre = visita.pacienteServicio?.servicio?.nombre ?? "Servicio";

  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        disabled={loadingDetail}
        className={cn(
          "flex w-full cursor-pointer items-start gap-3 rounded-xl border border-medical-border bg-white p-3 text-left transition",
          "hover:border-medical-primary/30 hover:bg-medical-secondary/30 active:scale-[0.99]",
          "disabled:cursor-wait disabled:opacity-70"
        )}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-medical-primary/10 text-xs font-bold text-medical-primary">
          {getPacienteInitials(visita)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <p className="font-semibold text-medical-text">{getPacienteNombre(visita)}</p>
            {documento ? (
              <span className="font-mono text-[11px] text-medical-mutedText">{documento}</span>
            ) : null}
          </div>
          <p className="text-sm text-medical-mutedText">{servicioNombre}</p>
          <p className="mt-1 text-xs text-medical-mutedText">
            <span className="font-semibold text-medical-text">
              {formatVisitaTimeOnly(visita.fecha)}
            </span>
            {" · "}
            {formatVisitaDuracion(visita.tiempoMinutos)}
          </p>
          {obsPreview ? (
            <p className="mt-1 line-clamp-1 text-xs text-medical-mutedText italic">
              {obsPreview}
            </p>
          ) : null}
          {insumosCount > 0 ? (
            <span className="mt-1.5 inline-flex items-center gap-1 rounded-md border border-medical-primary/15 bg-medical-secondary/50 px-1.5 py-0.5 text-[10px] font-semibold text-medical-primaryDark">
              <Package className="h-3 w-3" aria-hidden />
              {insumosCount} insumo{insumosCount !== 1 ? "s" : ""}
            </span>
          ) : null}
        </div>
        <span className="flex shrink-0 items-center self-center text-medical-mutedText">
          {loadingDetail ? (
            <Loader2 className="h-4 w-4 animate-spin text-medical-primary" aria-hidden />
          ) : (
            <ChevronRight className="h-5 w-5" aria-hidden />
          )}
        </span>
      </button>
    </li>
  );
}

export function PrestadorVisitasTab({ accessToken, onRegistrarVisita }: Props) {
  const [period, setPeriod] = useState<VisitaPeriodFilter>("30d");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<VisitaListItemDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const [detailVisita, setDetailVisita] = useState<VisitaDetailDto | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [loadingDetailId, setLoadingDetailId] = useState<number | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  const periodRange = useMemo(() => getVisitaPeriodRange(period), [period]);

  const fetchPage = useCallback(
    async (pageToLoad: number, append: boolean) => {
      if (!accessToken) {
        setError("Sesión no válida. Volvé a iniciar sesión.");
        return;
      }

      if (append) setLoadingMore(true);
      else setLoading(true);
      setError("");

      try {
        const data = await listVisitasWithApi(accessToken, {
          page: pageToLoad,
          pageSize: PAGE_SIZE,
          ...periodRange,
        });
        setTotal(data.total);
        setPage(pageToLoad);
        setItems((prev) => (append ? [...prev, ...data.items] : data.items));
      } catch (err) {
        if (!append) {
          setItems([]);
          setTotal(0);
        }
        const message =
          err instanceof ApiError
            ? getPrestadorVisitaErrorMessage(err)
            : "No se pudieron cargar las visitas.";
        setError(message);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [accessToken, periodRange]
  );

  useEffect(() => {
    if (!accessToken) return;
    void fetchPage(1, false);
  }, [accessToken, fetchPage]);

  const refresh = useCallback(() => {
    void fetchPage(1, false);
  }, [fetchPage]);

  const filteredItems = useMemo(() => {
    const q = search.trim();
    if (!q) return items;
    return items.filter((v) => matchesVisitaSearch(v, q));
  }, [items, search]);

  const grouped = useMemo(() => groupVisitasByDate(filteredItems), [filteredItems]);

  const hasMore = items.length < total;
  const isSearching = search.trim().length > 0;

  const headerSubtitle = useMemo(() => {
    if (loading && items.length === 0) return "Cargando visitas…";
    if (isSearching) {
      return `${filteredItems.length} encontrada${filteredItems.length !== 1 ? "s" : ""} · ${total} en el período`;
    }
    if (items.length === 0) return "Sin visitas en este período";
    return `${items.length} de ${total} visita${total !== 1 ? "s" : ""}`;
  }, [loading, items.length, isSearching, filteredItems.length, total]);

  const handleOpenDetail = useCallback(
    async (visitaId: number) => {
      if (!accessToken) return;
      setDetailError(null);
      setLoadingDetailId(visitaId);
      try {
        const visita = await getVisitaByIdWithApi(accessToken, visitaId);
        setDetailVisita(visita);
        setDetailOpen(true);
      } catch (err) {
        const message =
          err instanceof ApiError
            ? getPrestadorVisitaErrorMessage(err)
            : "No se pudo cargar el detalle de la visita.";
        setDetailError(message);
      } finally {
        setLoadingDetailId(null);
      }
    },
    [accessToken]
  );

  const handleVisitaUpdated = useCallback((updated: VisitaDetailDto) => {
    setDetailVisita(updated);
    setItems((prev) =>
      prev.map((v) => (v.id === updated.id ? { ...v, ...updated, insumos: updated.insumos } : v))
    );
  }, []);

  const closeDetail = useCallback(() => {
    setDetailOpen(false);
    setDetailVisita(null);
  }, []);

  return (
    <section className="mb-5 overflow-hidden rounded-2xl border border-medical-border bg-medical-card shadow-sm">
      <div className="border-b border-medical-border px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-medical-text">Mis visitas</h2>
            <p className="text-xs text-medical-mutedText">{headerSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-medical-border text-medical-mutedText transition hover:bg-medical-secondary disabled:opacity-50"
            aria-label="Actualizar listado"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPeriod(opt.value)}
              className={cn(
                "cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold transition",
                period === opt.value
                  ? "border-medical-primary bg-medical-primary text-white"
                  : "border-medical-border bg-white text-medical-mutedText hover:border-medical-primary/40 hover:text-medical-text"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-medical-mutedText" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por paciente, DNI o servicio…"
            className="h-10 w-full rounded-xl border border-medical-border bg-white py-2 pr-3 pl-9 text-sm text-medical-text outline-none focus:border-medical-primary focus:ring-4 focus:ring-medical-primary/15"
          />
        </div>
      </div>

      {loading && items.length === 0 ? (
        <ul className="space-y-2 px-4 py-4">
          {[1, 2, 3, 4].map((i) => (
            <VisitaCardSkeleton key={i} />
          ))}
        </ul>
      ) : null}

      {error && !loading ? (
        <div className="px-4 py-6 text-center">
          <p className="text-sm text-medical-danger">{error}</p>
          <button
            type="button"
            onClick={refresh}
            className="mt-2 text-sm font-semibold text-medical-primary underline-offset-2 hover:underline"
          >
            Reintentar
          </button>
        </div>
      ) : null}

      {detailError ? (
        <div className="mx-4 mt-3 rounded-lg border border-medical-danger/30 bg-medical-danger/10 px-3 py-2 text-sm text-medical-danger">
          {detailError}
        </div>
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <EmptyState
          icon={History}
          title="No hay visitas registradas"
          description="Cuando registres una visita médica, aparecerá en tu historial."
          action={
            <button
              type="button"
              onClick={onRegistrarVisita}
              className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-medical-primary px-4 py-2 text-sm font-semibold text-white hover:bg-medical-primaryDark"
            >
              Registrar primera visita
            </button>
          }
        />
      ) : null}

      {!loading && !error && items.length > 0 && filteredItems.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-medical-mutedText">
          Ninguna visita coincide con &quot;{search.trim()}&quot;.
        </div>
      ) : null}

      {filteredItems.length > 0 ? (
        <div className="space-y-4 px-4 py-4">
          {grouped.map((section) => (
            <div key={section.group}>
              <h3 className="mb-2 px-0.5 text-xs font-bold uppercase tracking-wider text-medical-mutedText">
                {section.label}
              </h3>
              <ul className="grid grid-cols-1 gap-2 lg:grid-cols-2 lg:gap-3">
                {section.items.map((v) => (
                  <VisitaCard
                    key={v.id}
                    visita={v}
                    loadingDetail={loadingDetailId === v.id}
                    onOpen={() => void handleOpenDetail(v.id)}
                  />
                ))}
              </ul>
            </div>
          ))}

          {hasMore && !isSearching ? (
            <button
              type="button"
              onClick={() => void fetchPage(page + 1, true)}
              disabled={loadingMore}
              className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-medical-border bg-white text-sm font-semibold text-medical-primary transition hover:bg-medical-secondary disabled:opacity-60"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando…
                </>
              ) : (
                `Cargar más (${items.length} de ${total})`
              )}
            </button>
          ) : null}

          {isSearching && hasMore ? (
            <p className="text-center text-xs text-medical-mutedText">
              La búsqueda aplica sobre las visitas ya cargadas. Usá &quot;Cargar más&quot; para ampliar el listado.
            </p>
          ) : null}
        </div>
      ) : null}

      <PrestadorVisitaDetailDialog
        open={detailOpen}
        visita={detailVisita}
        accessToken={accessToken}
        onClose={closeDetail}
        onUpdated={handleVisitaUpdated}
      />
    </section>
  );
}
