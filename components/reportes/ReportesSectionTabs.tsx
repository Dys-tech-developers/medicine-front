"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { BarChart3, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin/reportes/finanzas", label: "Por visita", icon: DollarSign },
  { href: "/admin/reportes/finanzas/resumen", label: "Resumen", icon: BarChart3 },
] as const;

type Props = {
  variant?: "header" | "standalone";
  className?: string;
};

function isLinkActive(pathname: string, href: string): boolean {
  if (href === "/admin/reportes/finanzas") {
    return pathname === href || pathname === "/admin/reportes";
  }
  return pathname.startsWith(href);
}

export function ReportesSectionTabs({ variant = "header", className }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const isHeader = variant === "header";

  return (
    <nav
      className={cn(
        "inline-flex items-center gap-0.5 rounded-lg p-0.5",
        isHeader ? "border border-white/20 bg-white/10" : "border border-medical-border bg-white",
        className
      )}
      aria-label="Secciones de liquidación"
    >
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = isLinkActive(pathname, href);
        const hrefWithQuery = query ? `${href}?${query}` : href;
        return (
          <Link
            key={href}
            href={hrefWithQuery}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors sm:px-3",
              isHeader
                ? active
                  ? "bg-white text-medical-primary shadow-sm"
                  : "text-white/90 hover:bg-white/15"
                : active
                  ? "bg-medical-primary text-white"
                  : "text-medical-text hover:bg-medical-secondary/50"
            )}
          >
            <Icon className="size-3.5 shrink-0" aria-hidden />
            <span className="hidden sm:inline">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
