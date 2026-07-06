"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Save, UserCircle2 } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { mapAuthApiError } from "@/lib/api/auth-errors";
import { getProfileWithApi, updateProfileWithApi } from "@/lib/api/auth";
import type { UserPublicDto } from "@/lib/api/types";
import { updateAuthSessionFromUser } from "@/lib/auth-session";
import { formatUserRoles } from "@/lib/user-roles-display";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const inputClass =
  "h-11 w-full rounded-xl border border-medical-border bg-medical-surface/80 px-3.5 text-sm text-medical-text outline-none transition placeholder:text-medical-mutedText/60 focus:border-medical-primary focus:bg-medical-card focus:ring-4 focus:ring-medical-primary/12 disabled:cursor-not-allowed disabled:opacity-60";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

type Props = {
  accessToken: string;
  onSaved?: (profile: UserPublicDto) => void;
  onNotify?: (message: string, kind: "success" | "error") => void;
  compact?: boolean;
};

export function UserProfileForm({ accessToken, onSaved, onNotify, compact }: Props) {
  const [profile, setProfile] = useState<UserPublicDto | null>(null);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState("");

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getProfileWithApi(accessToken);
      setProfile(data);
      setNombre(data.nombre);
      setEmail(data.email);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? mapAuthApiError(err, "profile")
          : "No se pudo cargar tu perfil.";
      setError(message);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const hasChanges = useMemo(() => {
    if (!profile) return false;
    return (
      nombre.trim() !== profile.nombre.trim() ||
      email.trim().toLowerCase() !== profile.email.trim().toLowerCase()
    );
  }, [profile, nombre, email]);

  const validate = (): string | null => {
    if (!nombre.trim()) return "El nombre es obligatorio.";
    if (!email.trim()) return "El email es obligatorio.";
    if (!isValidEmail(email)) return "Ingresá un email válido.";
    if (!hasChanges) return "Modificá al menos un campo antes de guardar.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setFieldError(validationError);
      return;
    }
    setFieldError("");
    setSaving(true);
    try {
      const body: { nombre?: string; email?: string } = {};
      if (profile && nombre.trim() !== profile.nombre.trim()) {
        body.nombre = nombre.trim();
      }
      if (
        profile &&
        email.trim().toLowerCase() !== profile.email.trim().toLowerCase()
      ) {
        body.email = email.trim();
      }

      const updated = await updateProfileWithApi(accessToken, body);
      updateAuthSessionFromUser(updated);

      if (body.email) {
        const refreshed = await getProfileWithApi(accessToken);
        setProfile(refreshed);
        setNombre(refreshed.nombre);
        setEmail(refreshed.email);
        updateAuthSessionFromUser(refreshed);
        onSaved?.(refreshed);
      } else {
        setProfile(updated);
        setNombre(updated.nombre);
        setEmail(updated.email);
        onSaved?.(updated);
      }

      onNotify?.("Perfil actualizado", "success");
    } catch (err) {
      const message =
        err instanceof ApiError
          ? mapAuthApiError(err, "profile")
          : "No se pudo guardar el perfil.";
      setFieldError(message);
      onNotify?.(message, "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-medical-mutedText">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando perfil…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-medical-danger/30 bg-medical-danger/5 px-4 py-6 text-center">
        <p className="text-sm text-medical-danger">{error}</p>
        <button
          type="button"
          onClick={() => void loadProfile()}
          className="mt-3 text-sm font-semibold text-medical-primary underline-offset-2 hover:underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      {!compact ? (
        <div className="flex items-center gap-3 rounded-xl border border-medical-border bg-medical-surface px-4 py-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-medical-primary/10 text-medical-primary">
            <UserCircle2 className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-medical-text">{profile?.nombre}</p>
            <p className="text-xs text-medical-mutedText">
              Roles: {formatUserRoles(profile?.roles ?? [])}
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="profile-nombre">Nombre</Label>
          <input
            id="profile-nombre"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className={inputClass}
            autoComplete="name"
            disabled={saving}
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="profile-email">Email</Label>
          <input
            id="profile-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            autoComplete="email"
            disabled={saving}
          />
        </div>

        {compact ? (
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Roles</Label>
            <p className="rounded-xl border border-medical-border bg-white px-3.5 py-2.5 text-sm text-medical-text">
              {formatUserRoles(profile?.roles ?? [])}
            </p>
          </div>
        ) : null}
      </div>

      {fieldError ? (
        <p className="text-sm text-medical-danger" role="alert">
          {fieldError}
        </p>
      ) : null}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving || !hasChanges}
          className={cn(
            "inline-flex cursor-pointer items-center gap-2 rounded-xl bg-medical-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-medical-primaryDark disabled:cursor-not-allowed disabled:opacity-50"
          )}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar cambios
        </button>
      </div>
    </form>
  );
}
