"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AdminNavbar } from "@/components/dashboard/AdminNavbar";
import { AdminPageBackground } from "@/components/dashboard/AdminPageBackground";
import { AdminSidebar } from "@/components/dashboard/AdminSidebar";
import { performLogout } from "@/lib/auth/logout";
import { getAdminSectionLabel } from "@/lib/admin/get-admin-section";
import { loadAuthSession, type AuthSession } from "@/lib/auth-session";

type AdminLayoutProps = {
  children: React.ReactNode;
};

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    const parsed = loadAuthSession();
    if (!parsed || parsed.role !== "admin") {
      window.location.assign("/login");
      return;
    }
    setSession(parsed);
  }, []);

  const currentSection = getAdminSectionLabel(pathname);

  return (
    <div className="min-h-screen md:flex">
      <AdminSidebar />

      <main className="relative flex min-h-0 flex-1 flex-col overflow-y-auto">
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
        />

        {children}
      </main>
    </div>
  );
}
