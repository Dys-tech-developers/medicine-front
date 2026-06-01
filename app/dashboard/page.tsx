"use client";

import { BarChart3 } from "lucide-react";
import { AdminSidebar } from "@/components/dashboard/AdminSidebar";
import { LogoutLink } from "@/components/auth/LogoutLink";
import { EmptyState } from "@/components/ui/empty-state";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-medical-surface md:flex">
      <AdminSidebar />

      <main className="flex-1">
        <div className="border-b border-medical-border bg-medical-card px-6 py-4">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-medical-text">Dashboard</h1>
              <LogoutLink className="rounded-md bg-medical-primary px-4 py-2 font-medium text-white hover:bg-medical-primaryDark disabled:opacity-70">
                Cerrar Sesión
              </LogoutLink>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="overflow-hidden rounded-xl border border-medical-border bg-medical-card shadow-sm">
            <EmptyState
              icon={BarChart3}
              title="Sin métricas disponibles"
              description="Los indicadores y gráficos del panel se mostrarán acá cuando el backend exponga los datos."
            />
          </div>
        </div>
      </main>
    </div>
  );
}
