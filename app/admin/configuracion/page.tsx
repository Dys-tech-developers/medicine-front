"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { KeyRound, Settings, UserCircle2, Users } from "lucide-react";
import { ChangePasswordForm } from "@/components/account/ChangePasswordForm";
import { UserProfileForm } from "@/components/account/UserProfileForm";
import { UsersDirectoryPanel } from "@/components/admin/UsersDirectoryPanel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ToastStack } from "@/components/ui/toast-stack";
import { useToast } from "@/components/ui/use-toast";
import { useAuthSession } from "@/lib/hooks/use-auth-session";
import { cn } from "@/lib/utils";

type ConfigTab = "cuenta" | "contrasena" | "usuarios";

const TABS: { id: ConfigTab; label: string; icon: typeof UserCircle2 }[] = [
  { id: "cuenta", label: "Mi perfil", icon: UserCircle2 },
  { id: "contrasena", label: "Contraseña", icon: KeyRound },
  { id: "usuarios", label: "Usuarios", icon: Users },
];

function parseTab(value: string | null): ConfigTab {
  if (value === "contrasena" || value === "usuarios") return value;
  return "cuenta";
}

export default function AdminConfiguracionPage() {
  const searchParams = useSearchParams();
  const { session, ready } = useAuthSession({ requiredRole: "admin" });
  const { toasts, showToast, dismiss } = useToast(4000);
  const [tab, setTab] = useState<ConfigTab>(() => parseTab(searchParams.get("tab")));

  useEffect(() => {
    setTab(parseTab(searchParams.get("tab")));
  }, [searchParams]);

  const handleTabChange = useCallback((next: ConfigTab) => {
    setTab(next);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", next);
    window.history.replaceState(null, "", url.toString());
  }, []);

  if (!ready || !session) {
    return null;
  }

  return (
    <>
      <ToastStack toasts={toasts} onDismiss={dismiss} />

      <div className="relative z-10 flex flex-1 flex-col gap-6 p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-medical-primary/10 text-medical-primary">
            <Settings className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-medical-text">Configuración</h1>
            <p className="text-sm text-medical-mutedText">
              Tu cuenta, contraseña y gestión de usuarios.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => handleTabChange(id)}
              className={cn(
                "inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition",
                tab === id
                  ? "border-medical-primary bg-medical-secondary text-medical-primary"
                  : "border-medical-border bg-white text-medical-mutedText hover:bg-medical-surface hover:text-medical-text"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {tab === "cuenta" ? (
          <Card className="border-medical-border bg-medical-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Mi perfil</CardTitle>
              <CardDescription>
                Nombre, email y roles de tu cuenta de administrador.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserProfileForm
                accessToken={session.accessToken}
                onNotify={(message, kind) => showToast(message, kind)}
              />
            </CardContent>
          </Card>
        ) : null}

        {tab === "contrasena" ? (
          <Card className="border-medical-border bg-medical-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Cambiar contraseña</CardTitle>
              <CardDescription>
                Ingresá tu contraseña actual y elegí una nueva de al menos 10 caracteres.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChangePasswordForm
                accessToken={session.accessToken}
                onNotify={(message, kind, description) =>
                  showToast(message, kind, description)
                }
              />
            </CardContent>
          </Card>
        ) : null}

        {tab === "usuarios" ? (
          <Card className="border-medical-border bg-medical-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Gestión de usuarios</CardTitle>
              <CardDescription>
                Editá datos de acceso y activá o desactivá cuentas del sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UsersDirectoryPanel
                accessToken={session.accessToken}
                onNotify={(title, type, detail) => showToast(title, type, detail)}
              />
            </CardContent>
          </Card>
        ) : null}
      </div>
    </>
  );
}
