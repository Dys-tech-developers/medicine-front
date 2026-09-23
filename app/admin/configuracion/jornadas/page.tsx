"use client";

import { useCallback, useState } from "react";
import { CalendarClock, Clock, CalendarDays } from "lucide-react";
import { FeriadosPanel } from "@/components/admin/FeriadosPanel";
import { JornadaLaboralForm } from "@/components/admin/JornadaLaboralForm";
import { ToastStack } from "@/components/ui/toast-stack";
import { useToast } from "@/components/ui/use-toast";
import { canManageJornadasFeriados } from "@/lib/admin-permissions";
import { useAuthSession } from "@/lib/hooks/use-auth-session";
import { cn } from "@/lib/utils";

type SectionTab = "jornada" | "feriados";

export default function AdminJornadasFeriadosPage() {
  const { session, ready } = useAuthSession({ requiredRole: "admin" });
  const { toasts, showToast, dismiss } = useToast(4000);
  const [tab, setTab] = useState<SectionTab>("jornada");

  const canManage = canManageJornadasFeriados(session?.roles ?? []);

  const onNotify = useCallback(
    (message: string, kind: "success" | "error", detail?: string) => {
      showToast(message, kind, detail);
    },
    [showToast]
  );

  if (!ready || !session) {
    return null;
  }

  return (
    <>
      <ToastStack toasts={toasts} onDismiss={dismiss} />

      <div className="relative z-10 flex flex-1 flex-col gap-6 p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-medical-primary/10 text-medical-primary">
            <CalendarClock className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-medical-text">
              Jornadas y feriados
            </h1>
            <p className="text-sm text-medical-mutedText">
              Franjas diurno/nocturno, días hábiles/no hábiles y feriados que definen cómo se
              liquida cada visita.
              {!canManage
                ? " Estás en modo solo lectura."
                : null}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab("jornada")}
            className={cn(
              "inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition",
              tab === "jornada"
                ? "border-medical-primary bg-medical-secondary text-medical-primary"
                : "border-medical-border bg-white text-medical-mutedText hover:bg-medical-surface hover:text-medical-text"
            )}
          >
            <Clock className="h-4 w-4" />
            Jornada laboral
          </button>
          <button
            type="button"
            onClick={() => setTab("feriados")}
            className={cn(
              "inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition",
              tab === "feriados"
                ? "border-medical-primary bg-medical-secondary text-medical-primary"
                : "border-medical-border bg-white text-medical-mutedText hover:bg-medical-surface hover:text-medical-text"
            )}
          >
            <CalendarDays className="h-4 w-4" />
            Feriados
          </button>
        </div>

        {tab === "jornada" ? (
          <JornadaLaboralForm
            accessToken={session.accessToken}
            canManage={canManage}
            onNotify={onNotify}
          />
        ) : (
          <FeriadosPanel
            accessToken={session.accessToken}
            canManage={canManage}
            onNotify={onNotify}
          />
        )}
      </div>
    </>
  );
}
