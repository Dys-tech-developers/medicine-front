"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogoutLink } from "@/components/auth/LogoutLink";
import { loadAuthSession, type AuthSession } from "@/lib/auth-session";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
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
} from "lucide-react";

const SIDEBAR_ITEMS = [
  { label: "Resumen", href: "/admin", icon: LayoutDashboard },
  { label: "Prestadores", href: "/admin/prestadores", icon: Stethoscope },
  { label: "Visitas", href: "/admin/visitas", icon: ClipboardList },
  { label: "Pacientes", href: "/admin/pacientes", icon: User },
  { label: "Obras sociales", href: "/admin/obras-sociales", icon: Building2 },
  { label: "Servicios", href: "/admin/servicios", icon: Layers },
  { label: "Stock", href: "/admin/stock", icon: Boxes },
  { label: "Reportes", href: "/admin/reportes/finanzas", icon: BarChart3 },
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

export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    setSession(loadAuthSession());
  }, []);

  return (
    <aside
      className={[
        "w-full border-b border-medical-border bg-medical-card md:sticky md:top-0 md:h-screen md:shrink-0 md:border-b-0 md:border-r",
        "md:transition-[width] md:duration-300 md:ease-in-out",
        collapsed ? "md:w-16" : "md:w-64",
      ].join(" ")}
    >
      <div className={["flex h-full flex-col", collapsed ? "px-2 pb-2" : "px-5 pb-5"].join(" ")}>
        {/* Branding */}
        <div
          className={[
            "flex h-20 items-center border-b border-medical-border",
            collapsed ? "mb-4 justify-center" : "mb-6",
          ].join(" ")}
        >
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-medical-mutedText">
                SIMEC
              </p>
              <h2 className="truncate text-xl font-bold text-medical-text">Panel Admin</h2>
            </div>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            title={collapsed ? "Abrir sidebar" : "Cerrar sidebar"}
            className="flex cursor-pointer h-8 w-8 items-center justify-center rounded-md border border-medical-border bg-medical-surface text-medical-mutedText hover:bg-medical-secondary hover:text-medical-text"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Nav */}
        <nav className={["space-y-1", collapsed ? "px-0" : ""].join(" ")}>
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
                className={[
                  "flex items-center rounded-lg py-2.5 text-sm font-medium transition-colors",
                  collapsed ? "justify-center px-0" : "gap-3 px-3",
                  isActive
                    ? "bg-medical-secondary text-medical-primary"
                    : "text-medical-mutedText hover:bg-medical-surface hover:text-medical-text",
                ].join(" ")}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="mt-auto hidden md:block">
          <div
            className={[
              "rounded-xl border border-medical-border bg-medical-surface shadow-sm transition-all duration-200",
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
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-medical-secondary text-xs font-bold text-medical-primary ring-2 ring-medical-border ring-offset-1 transition-transform duration-150 hover:scale-105">
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
              className={[
                "mt-2 flex cursor-pointer items-center rounded-lg border border-medical-border bg-medical-card text-xs font-medium text-medical-mutedText",
                "transition-all duration-150 hover:border-medical-danger/30 hover:bg-medical-danger/10 hover:text-medical-danger",
                "active:scale-95",
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
