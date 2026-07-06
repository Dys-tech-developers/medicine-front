"use client";

import {
  Activity,
  AlertTriangle,
  BarChart2,
  Building2,
  CalendarClock,
  ClipboardList,
  Clock,
  Layers,
  Package,
  Stethoscope,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { PrestadoresListSkeleton } from "@/components/skeletons/dashboard-skeletons";

const DASHBOARD_PANEL_BODY_MIN = "min-h-[220px]";
import { InsumosStockPanel } from "@/components/admin/InsumosStockPanel";
import { VisitasRecentPanel } from "@/components/admin/VisitasRecentPanel";
import { listUsersWithApi } from "@/lib/api/users";
import type { UserListItemDto } from "@/lib/api/types";
import { loadAuthSession, type AuthSession } from "@/lib/auth-session";
import { useInsumosList } from "@/lib/hooks/use-insumos-list";
import { useMinimumLoadingDisplay } from "@/lib/hooks/use-minimum-loading-display";
import { useVisitasList } from "@/lib/hooks/use-visitas-list";
import { usePacientesList } from "@/lib/hooks/use-pacientes-list";
import { DEFAULT_MIN_LOADING_MS } from "@/lib/loading/minimum-duration";
import { getStockLevel } from "@/lib/insumos-stock";
import {
  countInsumosConAlertaVencimiento,
  formatInsumosVencimientoKpiSub,
  type InsumosVencimientoResumen,
} from "@/lib/insumos-vencimiento";
import { cn } from "@/lib/utils";
import {
  formatVisitaDuracion,
  isVisitaInDateRange,
  toLocalDateKey,
  visitaFechaKey,
} from "@/lib/visitas-display";

/* ─── Utils ──────────────────────────────────────────────────────── */
function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function greetingLabel(name: string): string {
  const hour = new Date().getHours();
  const first = name.split(" ")[0] ?? name;
  if (hour < 12) return `Buenos días, ${first}`;
  if (hour < 19) return `Buenas tardes, ${first}`;
  return `Buenas noches, ${first}`;
}

function todayLabel(): string {
  return new Date().toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function currentMonthLabel(): string {
  const now = new Date();
  return now.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
}

/* ─── Accesos rápidos ────────────────────────────────────────────── */
const QUICK_ACTIONS = [
  { label: "Pacientes", href: "/admin/pacientes", icon: Users },
  { label: "Visitas", href: "/admin/visitas", icon: ClipboardList },
  { label: "Prestadores", href: "/admin/prestadores", icon: Stethoscope },
  { label: "Obras sociales", href: "/admin/obras-sociales", icon: Building2 },
  { label: "Servicios", href: "/admin/servicios", icon: Layers },
  { label: "Stock", href: "/admin/stock", icon: Package },
];

/* ─── Hero KPI ───────────────────────────────────────────────────── */
function HeroKpi({
  icon: Icon,
  label,
  value,
  sub,
  href,
  loading,
  stock = false,
  expiry = false,
  danger = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  href?: string;
  loading?: boolean;
  stock?: boolean;
  expiry?: boolean;
  danger?: boolean;
}) {
  const isAlert = stock || expiry;
  const wrapCls = cn(
    "rounded-xl border p-3.5 shadow-sm transition-colors sm:p-4",
    danger
      ? "border-medical-danger/50 bg-white hover:border-medical-danger hover:bg-medical-danger/10"
      : isAlert
        ? "border-medical-warning/50 bg-white hover:border-medical-warning hover:bg-medical-warning/10"
        : "border-medical-border bg-white hover:border-medical-primary/35"
  );

  const inner = (
    <>
      <div
        className={cn(
          "mb-2.5 flex size-8 items-center justify-center rounded-lg sm:size-7",
          danger
            ? "bg-medical-danger/20 text-medical-danger"
            : isAlert
              ? "bg-medical-warning/20 text-medical-warning"
              : "bg-medical-secondary text-medical-primaryDark"
        )}
      >
        <Icon className="size-4 sm:size-3.5" />
      </div>
      <p
        className={cn(
          "mb-1.5 truncate text-xs font-bold uppercase tracking-wide leading-none",
          danger
            ? "text-medical-danger"
            : isAlert
              ? "text-medical-warning"
              : "text-medical-mutedText"
        )}
      >
        {label}
      </p>
      {loading ? (
        <div
          className={cn(
            "h-7 w-14 animate-pulse rounded-md",
            isAlert ? (danger ? "bg-medical-danger/30" : "bg-medical-warning/30") : "bg-medical-border/60"
          )}
        />
      ) : (
        <p className="text-2xl font-extrabold tabular-nums leading-none text-medical-text sm:text-[1.65rem]">
          {value}
        </p>
      )}
      {sub && !loading && (
        <p
          className={cn(
            "mt-1.5 truncate text-xs font-medium leading-snug",
            danger
              ? "text-medical-danger"
              : isAlert
                ? "text-medical-warning"
                : "text-medical-mutedText"
          )}
        >
          {sub}
        </p>
      )}
    </>
  );

  if (href) return <Link href={href} className={wrapCls}>{inner}</Link>;
  return <div className={wrapCls}>{inner}</div>;
}

/* ─── Hero Section ───────────────────────────────────────────────── */
type HeroSectionProps = {
  session: AuthSession | null;
  visitasEsteMes: number;
  horasEsteMes: number;
  mesLabel: string;
  statsLoading: boolean;
  prestadoresActivos: number;
  prestadoresTotal: number;
  prestadoresLoading: boolean;
  pacientesTotal: number;
  pacientesLoading: boolean;
  insumosConAlerta: number;
  insumosVencimientoAlerta: InsumosVencimientoResumen;
  insumosLoading: boolean;
};

function HeroSection({
  session,
  visitasEsteMes,
  horasEsteMes,
  mesLabel,
  statsLoading,
  prestadoresActivos,
  prestadoresTotal,
  prestadoresLoading,
  pacientesTotal,
  pacientesLoading,
  insumosConAlerta,
  insumosVencimientoAlerta,
  insumosLoading,
}: HeroSectionProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-medical-primaryDark via-medical-primary to-medical-accent p-5 shadow-lg sm:p-7 lg:p-8">
      {/* Background decorations */}
      <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-white/6" />
      <div className="pointer-events-none absolute -bottom-12 -left-12 size-56 rounded-full bg-white/4" />
      <div className="pointer-events-none absolute right-40 bottom-4 size-36 rounded-full bg-white/3" />

      <div className="relative flex flex-col gap-5 sm:gap-6">
        {/* Top row: greeting + quick actions */}
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          {/* Greeting */}
          <div className="min-w-0 xl:pt-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
              Panel de administración · SIMEC
            </p>
            <h1 className="mt-1.5 text-xl font-bold text-white sm:text-2xl lg:text-3xl">
              {session ? greetingLabel(session.name) : "Bienvenido"}
            </h1>
            <p className="mt-1 text-sm capitalize text-white/70">{todayLabel()}</p>
          </div>

          {/* Accesos rápidos — scroll horizontal en móvil, grilla en desktop */}
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 xl:mx-0 xl:grid xl:max-w-none xl:shrink-0 xl:grid-cols-6 xl:gap-2 xl:overflow-visible xl:pb-0">
            {QUICK_ACTIONS.map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex min-w-[5.25rem] shrink-0 flex-col items-center gap-1.5 rounded-xl bg-white/10 px-2.5 py-3 text-center ring-1 ring-white/15 transition-colors hover:bg-white/18 xl:min-w-0"
              >
                <div className="flex size-8 items-center justify-center rounded-lg bg-white/15 sm:size-7">
                  <Icon className="size-4 text-white sm:size-3.5" />
                </div>
                <span className="text-xs font-semibold leading-tight text-white/90">
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Separador con etiqueta */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <p className="shrink-0 text-xs font-bold uppercase tracking-wide text-white/40">
            Resumen del mes
          </p>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 xl:grid-cols-6">
          <HeroKpi
            icon={ClipboardList}
            label="Visitas este mes"
            value={visitasEsteMes}
            sub={mesLabel}
            href="/admin/visitas"
            loading={statsLoading}
          />
          <HeroKpi
            icon={Clock}
            label="Horas trabajadas"
            value={statsLoading ? "—" : `${horasEsteMes.toFixed(1)}h`}
            sub="este mes"
            loading={statsLoading}
          />
          <HeroKpi
            icon={Stethoscope}
            label="Prestadores activos"
            value={prestadoresActivos}
            sub={!prestadoresLoading && prestadoresTotal > 0 ? `de ${prestadoresTotal} total` : undefined}
            href="/admin/prestadores"
            loading={prestadoresLoading}
          />
          <HeroKpi
            icon={Users}
            label="Pacientes"
            value={pacientesTotal}
            sub="en el sistema"
            href="/admin/pacientes"
            loading={pacientesLoading}
          />
          <HeroKpi
            stock
            icon={insumosConAlerta > 0 ? AlertTriangle : Package}
            label="Stock bajo"
            value={insumosConAlerta}
            sub={insumosConAlerta > 0 ? "con alerta" : "todo en orden"}
            href="/admin/stock"
            loading={insumosLoading}
          />
          <HeroKpi
            expiry
            danger={insumosVencimientoAlerta.vencidos > 0}
            icon={
              insumosVencimientoAlerta.vencidos > 0
                ? AlertTriangle
                : insumosVencimientoAlerta.proximos > 0
                  ? CalendarClock
                  : CalendarClock
            }
            label="Próx. a vencer"
            value={insumosVencimientoAlerta.total}
            sub={formatInsumosVencimientoKpiSub(insumosVencimientoAlerta)}
            href="/admin/stock"
            loading={insumosLoading}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── KPI Card ───────────────────────────────────────────────────── */
/* ─── Activity Chart ─────────────────────────────────────────────── */
type DayActivity = {
  label: string;
  count: number;
  isToday: boolean;
};

/* ─── Panel del dashboard (altura igual por fila en el grid) ─────── */
function DashboardPanel({
  icon: Icon,
  title,
  meta,
  children,
  footer,
  className,
}: {
  icon: React.ElementType;
  title: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-medical-border bg-white shadow-sm",
        className
      )}
    >
      <div className="flex shrink-0 items-center gap-3 border-b border-medical-primaryDark/20 bg-medical-primary px-4 py-3 sm:px-5 sm:py-3.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20">
          <Icon className="size-4 text-white" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold text-white">{title}</h2>
          {meta ? <div className="mt-0.5">{meta}</div> : null}
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      {footer}
    </div>
  );
}

function DashboardPanelBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col",
        DASHBOARD_PANEL_BODY_MIN,
        className
      )}
    >
      {children}
    </div>
  );
}

function DashboardPanelFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-auto shrink-0 border-t border-medical-border/60 bg-medical-secondary/25 px-5 py-2.5">
      {children}
    </div>
  );
}

const ACTIVITY_CHART_BAR_AREA_PX = 88;
const ACTIVITY_CHART_BAR_WIDTH_CLASS = "w-6"; // ~10px

function ActivityChart({
  days,
  loading,
  className,
}: {
  days: DayActivity[];
  loading: boolean;
  className?: string;
}) {
  const max = Math.max(...days.map((d) => d.count), 1);
  const hasData = days.some((d) => d.count > 0);
  const isEmpty = !loading && !hasData;

  return (
    <DashboardPanel
      className={className}
      icon={BarChart2}
      title="Actividad reciente"
      meta={<p className="text-xs text-white/70">Visitas por día · últimos 7 días</p>}
    >
      <DashboardPanelBody className="justify-center overflow-x-auto px-3 py-5 sm:px-5">
        {loading ? (
          <div
            className="flex min-w-[280px] items-end justify-between gap-1.5 sm:min-w-0 sm:gap-2"
            style={{ height: ACTIVITY_CHART_BAR_AREA_PX + 40 }}
            aria-hidden
          >
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
                <div
                  className={cn(
                    ACTIVITY_CHART_BAR_WIDTH_CLASS,
                    "animate-pulse rounded-t-md bg-medical-border/50"
                  )}
                  style={{
                    height: `${Math.round(ACTIVITY_CHART_BAR_AREA_PX * (0.25 + (i % 3) * 0.2))}px`,
                  }}
                />
                <div className="h-3 w-8 animate-pulse rounded bg-medical-border/40" />
              </div>
            ))}
          </div>
        ) : isEmpty ? (
          <EmptyState
            compact
            icon={BarChart2}
            title="Sin actividad reciente"
            description="Cuando se registren visitas en los últimos 7 días, vas a ver el gráfico acá."
            className="flex-1"
          />
        ) : (
          <div
            className="flex min-w-[280px] items-end justify-between gap-1.5 sm:min-w-0 sm:gap-2"
            role="img"
            aria-label="Gráfico de visitas por día en los últimos 7 días"
          >
            {days.map((day) => {
              const barHeightPx =
                day.count === 0
                  ? 3
                  : Math.max(10, Math.round((day.count / max) * ACTIVITY_CHART_BAR_AREA_PX));

              return (
                <div
                  key={day.label}
                  className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-1.5"
                >
                  <span
                    className={cn(
                      "h-3 text-xs font-semibold tabular-nums leading-none",
                      day.count > 0
                        ? day.isToday
                          ? "text-medical-primary"
                          : "text-medical-mutedText"
                        : "text-transparent"
                    )}
                  >
                    {day.count > 0 ? day.count : "·"}
                  </span>
                  <div
                    className="flex items-end justify-center"
                    style={{ height: ACTIVITY_CHART_BAR_AREA_PX }}
                  >
                    <div
                      className={cn(
                        ACTIVITY_CHART_BAR_WIDTH_CLASS,
                        "rounded-t-md transition-all",
                        day.count > 0
                          ? day.isToday
                            ? "bg-medical-primary shadow-sm shadow-medical-primary/25"
                            : "bg-medical-secondary group-hover:bg-medical-primary/30"
                          : "bg-medical-border/40"
                      )}
                      style={{ height: barHeightPx }}
                      title={`${day.count} visita${day.count === 1 ? "" : "s"}`}
                    />
                  </div>
                  <span
                    className={cn(
                      "w-full truncate text-center text-xs font-medium capitalize leading-tight",
                      day.isToday
                        ? "font-bold text-medical-primary"
                        : "text-medical-mutedText"
                    )}
                  >
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </DashboardPanelBody>
    </DashboardPanel>
  );
}

/* ─── Services Breakdown ─────────────────────────────────────────── */
type ServiceStat = {
  nombre: string;
  count: number;
  minutos: number;
};

function ServicesBreakdownCard({
  stats,
  loading,
  mesLabel,
  className,
}: {
  stats: ServiceStat[];
  loading: boolean;
  mesLabel: string;
  className?: string;
}) {
  const max = Math.max(...stats.map((s) => s.count), 1);
  const isEmpty = !loading && stats.length === 0;

  return (
    <DashboardPanel
      className={className}
      icon={TrendingUp}
      title="Servicios más activos"
      meta={<p className="text-xs capitalize text-white/70">{mesLabel}</p>}
      footer={
        !loading && stats.length > 0 ? (
          <DashboardPanelFooter>
            <Link
              href="/admin/servicios"
              className="text-xs font-semibold text-medical-primary hover:underline"
            >
              Ver todos los servicios →
            </Link>
          </DashboardPanelFooter>
        ) : undefined
      }
    >
      <DashboardPanelBody className="justify-center">
        {loading ? (
          <div className="divide-y divide-medical-border/60">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                <div className="h-3.5 w-32 animate-pulse rounded bg-medical-border/60" />
                <div className="h-1.5 flex-1 animate-pulse rounded-full bg-medical-border/40" />
                <div className="h-3.5 w-8 animate-pulse rounded bg-medical-border/60" />
              </div>
            ))}
          </div>
        ) : isEmpty ? (
          <EmptyState
            compact
            icon={TrendingUp}
            title="Sin datos este mes"
            description="Cuando haya visitas asociadas a servicios, vas a ver el ranking acá."
            className="flex-1"
          />
        ) : (
          <div className="flex flex-1 flex-col divide-y divide-medical-border/60">
            {stats.map((stat, i) => (
              <div
                key={stat.nombre}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 sm:px-5",
                  i % 2 === 1 && "bg-medical-secondary/20"
                )}
              >
                <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-medical-secondary text-xs font-bold text-medical-primaryDark">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-semibold text-medical-text sm:text-sm">
                      {stat.nombre}
                    </p>
                    <span className="shrink-0 text-xs font-bold text-medical-primary">
                      {stat.count} vis.
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-medical-secondary">
                    <div
                      className="h-full rounded-full bg-medical-primary transition-all"
                      style={{ width: `${(stat.count / max) * 100}%` }}
                    />
                  </div>
                  <p className="mt-0.5 text-xs text-medical-mutedText">
                    {formatVisitaDuracion(stat.minutos)} acumuladas
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardPanelBody>
    </DashboardPanel>
  );
}

/* ─── Section Card (misma altura que su pareja en la fila del grid) ─ */
function SectionCard({
  icon,
  title,
  meta,
  children,
  className,
}: {
  icon: React.ElementType;
  title: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <DashboardPanel icon={icon} title={title} meta={meta} className={className}>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </DashboardPanel>
  );
}

/* ─── Quick Actions ──────────────────────────────────────────────── */
/* ─── Prestador Item ─────────────────────────────────────────────── */
function PrestadorItem({
  item,
  index,
}: {
  item: UserListItemDto;
  index: number;
}) {
  const active = item.estado;
  return (
    <li
      className={cn(
        "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-medical-secondary/40 sm:px-5 sm:py-3",
        index % 2 === 1 && "bg-medical-secondary/20"
      )}
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-medical-secondary text-xs font-bold text-medical-primary">
        {initials(item.nombre)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-medical-text">{item.nombre}</p>
        <p className="hidden truncate text-xs text-medical-mutedText sm:block">{item.email}</p>
      </div>
      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
          active
            ? "border-medical-primary/25 bg-medical-secondary text-medical-primaryDark"
            : "border-medical-border bg-medical-secondary text-medical-mutedText"
        )}
      >
        <span
          className={cn(
            "size-1.5 rounded-full",
            active ? "bg-medical-primary" : "bg-medical-mutedText/40"
          )}
        />
        {active ? "Activo" : "Inactivo"}
      </span>
    </li>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────── */
export default function AdminDashboardPage() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [prestadores, setPrestadores] = useState<UserListItemDto[]>([]);
  const [prestadoresLoading, setPrestadoresLoading] = useState(true);
  const [prestadoresError, setPrestadoresError] = useState("");

  // Stable month bounds
  const [mesStart] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [mesEnd] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  });

  // Panel: últimas visitas (sin filtro de mes)
  const {
    items: recentVisitas,
    total: visitasTotal,
    loading: recentVisitasLoading,
    error: recentVisitasError,
    refresh: refreshRecentVisitas,
  } = useVisitasList({
    accessToken: session?.accessToken ?? null,
    enabled: Boolean(session),
    page: 1,
    pageSize: 5,
    minLoadingMs: DEFAULT_MIN_LOADING_MS,
  });

  // KPIs y gráficos: filtro de mes en cliente (el filtro por query del API es inconsistente)
  const {
    items: visitasParaStats,
    loading: mesVisitasLoading,
  } = useVisitasList({
    accessToken: session?.accessToken ?? null,
    enabled: Boolean(session),
    page: 1,
    pageSize: 100,
    minLoadingMs: DEFAULT_MIN_LOADING_MS,
  });

  const mesVisitas = useMemo(
    () => visitasParaStats.filter((v) => isVisitaInDateRange(v, mesStart, mesEnd)),
    [visitasParaStats, mesStart, mesEnd]
  );

  // Insumos
  const {
    items: insumos,
    loading: insumosLoading,
    error: insumosError,
    refresh: refreshInsumos,
  } = useInsumosList({
    accessToken: session?.accessToken ?? null,
    enabled: Boolean(session),
    minLoadingMs: DEFAULT_MIN_LOADING_MS,
  });

  // Pacientes count
  const { total: pacientesTotal, loading: pacientesLoading } = usePacientesList({
    accessToken: session?.accessToken ?? null,
    enabled: Boolean(session),
    page: 1,
    pageSize: 1,
    minLoadingMs: DEFAULT_MIN_LOADING_MS,
  });

  const showPrestadoresLoading = useMinimumLoadingDisplay(
    prestadoresLoading,
    DEFAULT_MIN_LOADING_MS
  );

  useEffect(() => {
    const parsed = loadAuthSession();
    if (!parsed || parsed.role !== "admin") {
      window.location.assign("/login");
      return;
    }
    setSession(parsed);

    void (async () => {
      setPrestadoresLoading(true);
      setPrestadoresError("");
      try {
        const data = await listUsersWithApi(parsed.accessToken, 1, 100);
        setPrestadores(data.items.filter((u) => u.roles.includes("PRESTADOR")));
      } catch {
        setPrestadoresError("No se pudieron cargar los prestadores.");
        setPrestadores([]);
      } finally {
        setPrestadoresLoading(false);
      }
    })();
  }, []);

  /* ── Computed stats ─────────────────────────────────────────── */
  const prestadoresActivos = useMemo(
    () => prestadores.filter((p) => p.estado).length,
    [prestadores]
  );

  const insumosConAlerta = useMemo(
    () => insumos.filter((i) => getStockLevel(i) !== "ok").length,
    [insumos]
  );

  const insumosVencimientoAlerta = useMemo(
    () => countInsumosConAlertaVencimiento(insumos),
    [insumos]
  );

  const horasEsteMes = useMemo(
    () => mesVisitas.reduce((sum, v) => sum + (v.tiempoMinutos ?? 0), 0) / 60,
    [mesVisitas]
  );

  const visitasEsteMes = mesVisitas.length;

  // Top services this month
  const serviceStats = useMemo((): ServiceStat[] => {
    const map = new Map<string, { count: number; minutos: number }>();
    for (const v of mesVisitas) {
      const nombre = v.pacienteServicio?.servicio?.nombre ?? "Sin servicio";
      const prev = map.get(nombre) ?? { count: 0, minutos: 0 };
      map.set(nombre, {
        count: prev.count + 1,
        minutos: prev.minutos + (v.tiempoMinutos ?? 0),
      });
    }
    return Array.from(map.entries())
      .map(([nombre, s]) => ({ nombre, ...s }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [mesVisitas]);

  // Últimos 7 días (todas las visitas cargadas, no solo las del mes calendario)
  const weeklyActivity = useMemo((): DayActivity[] => {
    const result: DayActivity[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dayKey = toLocalDateKey(d);
      const count = visitasParaStats.filter((v) => visitaFechaKey(v) === dayKey).length;
      result.push({
        label:
          i === 0
            ? "Hoy"
            : d.toLocaleDateString("es-AR", { weekday: "short" }),
        count,
        isToday: i === 0,
      });
    }
    return result;
  }, [visitasParaStats]);

  const mesLabel = currentMonthLabel();
  const isStatsLoading = mesVisitasLoading;

  return (
    <div className="relative z-0 flex-1 px-4 py-5 sm:px-6 sm:py-7 lg:px-8 xl:px-10">

      {/* ── Hero con KPIs integrados ─────────────────────────────── */}
      <div className="mb-5 sm:mb-6">
        <HeroSection
          session={session}
          visitasEsteMes={visitasEsteMes}
          horasEsteMes={horasEsteMes}
          mesLabel={mesLabel}
          statsLoading={isStatsLoading}
          prestadoresActivos={prestadoresActivos}
          prestadoresTotal={prestadores.length}
          prestadoresLoading={showPrestadoresLoading}
          pacientesTotal={pacientesTotal}
          pacientesLoading={pacientesLoading}
          insumosConAlerta={insumosConAlerta}
          insumosVencimientoAlerta={insumosVencimientoAlerta}
          insumosLoading={insumosLoading}
        />
      </div>

      {/* ── Main grid: fila 1 = actividad | servicios, fila 2 = visitas | stock ─ */}
      <div className="mb-5 grid grid-cols-1 gap-4 sm:mb-6 lg:grid-cols-5 lg:items-stretch lg:gap-6">
        <ActivityChart
          className="lg:col-span-3"
          days={weeklyActivity}
          loading={isStatsLoading}
        />

        <ServicesBreakdownCard
          className="lg:col-span-2"
          stats={serviceStats}
          loading={isStatsLoading}
          mesLabel={mesLabel}
        />

        <SectionCard
          className="lg:col-span-3"
          icon={ClipboardList}
          title="Últimas visitas"
          meta={
            !recentVisitasLoading && visitasTotal > 0 ? (
              <p className="text-xs text-white/75">{visitasTotal} en total</p>
            ) : null
          }
        >
          <VisitasRecentPanel
            items={recentVisitas}
            total={visitasTotal}
            loading={recentVisitasLoading}
            error={recentVisitasError}
            onRetry={refreshRecentVisitas}
            limit={5}
            showViewAllLink
            fillHeight
          />
        </SectionCard>

        <SectionCard
          className="lg:col-span-2"
          icon={Package}
          title="Stock de insumos"
          meta={
            !insumosLoading && insumos.length > 0 ? (
              <p className="text-xs text-white/75">
                {insumos.length} ítem{insumos.length === 1 ? "" : "s"}
                {insumosConAlerta > 0 ? (
                  <>
                    {" · "}
                    <span className="font-semibold text-medical-accent">
                      {insumosConAlerta} stock bajo
                    </span>
                  </>
                ) : null}
                {insumosVencimientoAlerta.total > 0 ? (
                  <>
                    {" · "}
                    <span className="font-semibold text-medical-accent">
                      {insumosVencimientoAlerta.total} vencim.
                    </span>
                  </>
                ) : null}
              </p>
            ) : null
          }
        >
          <InsumosStockPanel
            items={insumos}
            loading={insumosLoading}
            error={insumosError}
            onRetry={refreshInsumos}
            limit={5}
            showViewAllLink
            fillHeight
          />
        </SectionCard>
      </div>

      {/* ── Bottom row: Prestadores ───────────────────────────────── */}
      <div className="mt-5 sm:mt-6">
        <SectionCard
          icon={Users}
          title="Prestadores"
          meta={
            !showPrestadoresLoading && prestadores.length > 0 ? (
              <p className="text-xs text-white/75">
                {prestadoresActivos} activo{prestadoresActivos === 1 ? "" : "s"} de{" "}
                {prestadores.length}
              </p>
            ) : null
          }
        >
          {showPrestadoresLoading ? (
            <PrestadoresListSkeleton rows={4} />
          ) : prestadoresError ? (
            <EmptyState
              icon={Activity}
              variant="error"
              title="No se pudieron cargar los prestadores"
              description={prestadoresError}
            />
          ) : prestadores.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No hay prestadores"
              description="Todavía no hay usuarios con rol prestador en el sistema."
            />
          ) : (
            <>
              <ul className="divide-y divide-medical-border/60 bg-medical-surface/20">
                {prestadores.map((item, index) => (
                  <PrestadorItem key={item.id} item={item} index={index} />
                ))}
              </ul>
              <div className="border-t border-medical-border/60 bg-medical-secondary/25 px-4 py-2.5 text-center sm:px-5">
                <Link
                  href="/admin/prestadores"
                  className="text-xs font-semibold text-medical-primary hover:underline"
                >
                  Ver directorio de prestadores →
                </Link>
              </div>
            </>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
