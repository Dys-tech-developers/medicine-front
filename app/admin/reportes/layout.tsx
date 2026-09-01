"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthSession } from "@/lib/hooks/use-auth-session";

export default function ReportesLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  // Reportes es para ADMIN y OPERADOR: exactamente el rol de app "admin"
  const { ready } = useAuthSession({ requiredRole: "admin" });

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
