"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { loadAuthSession } from "@/lib/auth-session";
import { canViewReportes } from "@/lib/reportes/access";

export default function ReportesLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const parsed = loadAuthSession();
    if (!parsed || !canViewReportes(parsed.roles)) {
      window.location.assign("/login");
      return;
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (pathname === "/admin/reportes") {
      router.replace("/admin/reportes/finanzas");
    }
  }, [ready, pathname, router]);

  if (!ready) return null;

  return (
    <div className="relative z-0 flex-1 px-4 pt-6 pb-4 sm:px-6 sm:pt-8 lg:px-8 xl:px-10">
      {children}
    </div>
  );
}
