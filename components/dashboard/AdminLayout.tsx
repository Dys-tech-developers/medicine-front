"use client";

import { AdminNavbar } from "@/components/dashboard/AdminNavbar";
import { AdminPageBackground } from "@/components/dashboard/AdminPageBackground";
import { AdminSidebar } from "@/components/dashboard/AdminSidebar";
import { performLogout } from "@/lib/auth/logout";
import { getAdminSectionLabel } from "@/lib/admin/get-admin-section";
import { useAuthSession } from "@/lib/hooks/use-auth-session";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type AdminLayoutProps = {
  children: React.ReactNode;
};

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const { session, ready } = useAuthSession({ requiredRole: "admin" });
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const currentSection = getAdminSectionLabel(pathname);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileNavOpen]);

  if (!ready) {
    return null;
  }

  return (
    <div className="min-h-screen md:flex">
      {mobileNavOpen ? (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <AdminSidebar
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />

      <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
        <AdminPageBackground />

        <AdminNavbar
          currentSection={currentSection}
          session={
            session
              ? {
                  name: session.name,
                  email: session.email,
                  role: "Administrador",
                }
              : null
          }
          onLogout={() => void performLogout()}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />

        {children}
      </main>
    </div>
  );
}
