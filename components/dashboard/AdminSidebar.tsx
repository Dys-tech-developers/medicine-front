"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogoutLink } from "@/components/auth/LogoutLink";
import { SimecLogo } from "@/components/brand/SimecLogo";
import {
  AUTH_SESSION_UPDATED_EVENT,
  loadAuthSession,
  type AuthSession,
} from "@/lib/auth-session";
import { usePathname } from "next/navigation";
import {
  Boxes,
  DollarSign,
  Building2,
  ClipboardList,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutDashboard,
  LogOut,
  Settings,
  Stethoscope,
  User,
  X,
} from "lucide-react";

const SIDEBAR_ITEMS = [
  { label: "Resumen", href: "/admin", icon: LayoutDashboard },
  { label: "Prestadores", href: "/admin/prestadores", icon: Stethoscope },
  { label: "Visitas", href: "/admin/visitas", icon: ClipboardList },
  { label: "Pacientes", href: "/admin/pacientes", icon: User },
  { label: "Obras sociales", href: "/admin/obras-sociales", icon: Building2 },
  { label: "Servicios", href: "/admin/servicios", icon: Layers },
  { label: "Stock", href: "/admin/stock", icon: Boxes },
  { label: "Liquidación", href: "/admin/reportes/finanzas", icon: DollarSign },
  { label: "Configuración", href: "/admin/configuracion", icon: Settings },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

type AdminSidebarProps = {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};

export function AdminSidebar({ mobileOpen = false, onMobileClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);

  const closeSidebar = () => {
    setCollapsed(true);
    onMobileClose?.();
  };

  useEffect(() => {
    const refresh = () => setSession(loadAuthSession());
    refresh();
    window.addEventListener(AUTH_SESSION_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(AUTH_SESSION_UPDATED_EVENT, refresh);
  }, []);

  return (
    <aside
      className={[
        "fixed inset-y-0 left-0 z-50 flex w-[min(18rem,85vw)] flex-col border-r border-medical-border bg-medical-card shadow-xl md:static md:z-auto md:shadow-none",
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        "md:sticky md:top-0 md:h-screen md:shrink-0",
        collapsed ? "md:w-16" : "md:w-64",
      ].join(" ")}
    >
      <div className={["flex h-full flex-col", collapsed ? "px-2 pb-2" : "px-5 pb-5"].join(" ")}>
        {/* Branding */}
        <div
          className={[
            "flex items-center border-b border-medical-border",
            collapsed
              ? "mb-4 gap-2 py-4 md:flex-col md:items-center md:gap-3.5"
              : "mb-6 h-20 gap-2",
          ].join(" ")}
        >
          {collapsed ? (
            <>
              <SimecLogo size={36} className="hidden px-0.5 md:block" />
              <div className="flex min-w-0 flex-1 items-center gap-3 md:hidden">
                <SimecLogo size={36} />
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-medical-mutedText">
                    SIMEC
                  </p>
                  <h2 className="truncate text-xl font-bold text-medical-text">Panel Admin</h2>
                </div>
              </div>
            </>
          ) : (
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <SimecLogo size={36} />
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-medical-mutedText">
                  SIMEC
                </p>
                <h2 className="truncate text-xl font-bold text-medical-text">Panel Admin</h2>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={closeSidebar}
            title="Cerrar menú"
            aria-label="Cerrar menú"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-medical-border bg-medical-surface text-medical-mutedText hover:bg-medical-secondary hover:text-medical-text md:hidden"
          >
            <X className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            title={collapsed ? "Abrir sidebar" : "Cerrar sidebar"}
            className="hidden h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-medical-border bg-medical-surface text-medical-mutedText hover:bg-medical-secondary hover:text-medical-text md:flex"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Nav */}
        <nav className={["min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain", collapsed ? "px-0" : ""].join(" ")}>
          {SIDEBAR_ITEMS.map(({ label, href, icon: Icon }) => {
            const isActive =
              href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(href);
            return (
              <Link
                key={label}
                href={href}
                title={collapsed ? label : undefined}
                onClick={closeSidebar}
                onNavigate={closeSidebar}
                className={[
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  collapsed ? "md:justify-center md:px-0" : "",
                  isActive
                    ? "bg-medical-secondary text-medical-primary"
                    : "text-medical-mutedText hover:bg-medical-surface hover:text-medical-text",
                ].join(" ")}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className={collapsed ? "md:hidden" : undefined}>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="mt-auto hidden md:block">
          <div
            className={[
              "rounded-xl border border-medical-border bg-medical-surface shadow-sm",
              collapsed ? "p-2" : "p-3",
            ].join(" ")}
          >
            {/* Avatar + info */}
            <div
              className={[
                "flex items-center",
                collapsed ? "justify-center" : "gap-3",
              ].join(" ")}
            >
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-medical-secondary text-xs font-bold text-medical-primary ring-2 ring-medical-border ring-offset-1">
                {session ? initials(session.name) : "AD"}
              </div>

              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold leading-tight text-medical-text">
                    {session?.name ?? "Administrador"}
                  </p>
                  <p className="truncate text-xs leading-snug text-medical-mutedText/70">
                    {session?.email ?? ""}
                  </p>
                </div>
              )}
            </div>

            {/* Logout */}
            <LogoutLink
              title="Cerrar sesión"
              iconOnlyLoading={collapsed}
              className={[
                "mt-2 flex cursor-pointer items-center rounded-lg border border-medical-border bg-medical-card text-xs font-medium text-medical-mutedText",
                "hover:border-medical-danger/30 hover:bg-medical-danger/10 hover:text-medical-danger",
                collapsed
                  ? "mx-auto h-8 w-8 justify-center"
                  : "w-full justify-center gap-2 px-3 py-2",
              ].join(" ")}
            >
              <LogOut className="h-3.5 w-3.5 shrink-0" />
              {!collapsed && <span>Cerrar sesión</span>}
            </LogoutLink>
          </div>
        </div>
      </div>
    </aside>
  );
}
