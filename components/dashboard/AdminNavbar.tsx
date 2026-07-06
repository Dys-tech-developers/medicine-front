"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronDown, LogOut, Menu, Settings, User } from "lucide-react";
import { Avatar, AvatarBadge, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

export type AdminNavbarSession = {
  name: string;
  email: string;
  role?: string;
};

export type AdminNavbarProps = {
  currentSection: string;
  session?: AdminNavbarSession | null;
  notificationCount?: number;
  onLogout?: () => void;
  onOpenMobileNav?: () => void;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AdminNavbar({
  currentSection,
  session,
  notificationCount = 0,
  onLogout,
  onOpenMobileNav,
}: AdminNavbarProps) {
  return (
    <header className="sticky top-0 z-50 isolate flex h-16 shrink-0 items-center border-b border-medical-border bg-white/95 px-4 shadow-sm backdrop-blur-md sm:h-[4.5rem] sm:px-6">
      
      {/* Sección activa */}
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Abrir menú"
          className="size-9 shrink-0 cursor-pointer text-medical-mutedText hover:bg-medical-surface hover:text-medical-text md:hidden"
          onClick={onOpenMobileNav}
        >
          <Menu className="size-5" />
        </Button>
        <span className="h-7 w-0.5 shrink-0 rounded-full bg-medical-primary" />
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-medical-mutedText/70">
            Sección
          </p>
          <p className="truncate text-sm font-semibold leading-tight text-medical-text sm:text-base">
            {currentSection}
          </p>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-1.5">

        {/* Campana */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={
            notificationCount > 0
              ? `${notificationCount} notificaciones sin leer`
              : "Notificaciones"
          }
          className="relative size-9 cursor-pointer text-medical-mutedText hover:bg-medical-surface hover:text-medical-text"
        >
          <Bell className="size-4" />
          {notificationCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-medical-primary opacity-30" />
              <Badge className="relative flex size-4 items-center justify-center rounded-full border-0 bg-medical-primary p-0 text-[9px] font-bold leading-none text-white shadow-none">
                {notificationCount > 9 ? "9+" : notificationCount}
              </Badge>
            </span>
          )}
        </Button>

        <Separator orientation="vertical" className="mx-0.5 h-5 bg-medical-border" />

        {/* Menú de usuario */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="group h-9 cursor-pointer gap-2 rounded-lg px-2 text-left hover:bg-medical-surface data-[state=open]:bg-medical-surface"
            >
              <Avatar size="sm" className="size-7">
                <AvatarFallback className="bg-medical-secondary text-xs font-bold text-medical-primary">
                  {session ? initials(session.name) : "—"}
                </AvatarFallback>
                <AvatarBadge className="size-2 border-[1.5px] border-white bg-medical-success ring-0" />
              </Avatar>

              <div className="hidden text-left sm:block">
                <p className="text-xs font-semibold leading-tight text-medical-text">
                  {session?.name ?? "Administrador"}
                </p>
                <p className="text-[10px] leading-tight text-medical-mutedText/70">
                  {session?.role ?? session?.email ?? ""}
                </p>
              </div>

              <ChevronDown
                size={13}
                className="hidden shrink-0 text-medical-mutedText/60 transition-transform duration-200 group-data-[state=open]:rotate-180 sm:block"
              />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="z-60 w-48 border-medical-border bg-white p-1 shadow-md ring-1 ring-black/[0.04]"
          >
            {/* Header con info del usuario */}
            <DropdownMenuLabel className="px-2 py-2.5 font-normal">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-medical-secondary text-xs font-bold text-medical-primary">
                  {session ? initials(session.name) : "—"}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-medical-text">
                    {session?.name ?? "Administrador"}
                  </p>
                  <p className="truncate text-[10px] text-medical-mutedText/70">
                    {session?.email ?? ""}
                  </p>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="bg-medical-border/60" />

            <DropdownMenuItem asChild>
              <Link
                href="/admin/configuracion?tab=cuenta"
                className="cursor-pointer gap-2.5 rounded-md px-2 py-2 text-xs text-medical-text focus:bg-medical-surface"
              >
                <User className="size-4 shrink-0 text-medical-mutedText" />
                Mi perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/admin/configuracion"
                className="cursor-pointer gap-2.5 rounded-md px-2 py-2 text-xs text-medical-text focus:bg-medical-surface"
              >
                <Settings className="size-4 shrink-0 text-medical-mutedText" />
                Configuración
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-medical-border/60" />

            <DropdownMenuItem
              className="cursor-pointer gap-2.5 rounded-md px-2 py-2 text-xs text-medical-danger focus:bg-medical-danger/10 focus:text-medical-danger"
              onSelect={() => onLogout?.()}
            >
              <LogOut className="size-4 shrink-0 text-medical-danger focus:text-medical-danger" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}