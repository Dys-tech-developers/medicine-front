"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, User, X } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { mapAuthApiError } from "@/lib/api/auth-errors";
import { updateUserWithApi } from "@/lib/api/users";
import type { UserListItemDto } from "@/lib/api/types";
import {
  DEFAULT_MIN_LOADING_MS,
  delayRemaining,
} from "@/lib/loading/minimum-duration";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const inputClass =
  "h-10 w-full rounded-xl border border-medical-border bg-medical-surface/80 px-3 text-sm text-medical-text outline-none focus:border-medical-primary focus:bg-medical-card focus:ring-4 focus:ring-medical-primary/12 disabled:opacity-60";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

type UserEditDialogProps = {
  open: boolean;
  user: UserListItemDto | null;
  accessToken: string;
  onClose: () => void;
  onUpdated: (user: UserListItemDto) => void;
};

export function UserEditDialog({
  open,
  user,
  accessToken,
  onClose,
  onUpdated,
}: UserEditDialogProps) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setNombre(user.nombre);
      setEmail(user.email);
    }
    setError("");
  }, [user]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, loading, onClose]);

  const hasChanges = useMemo(() => {
    if (!user) return false;
    return (
      nombre.trim() !== user.nombre.trim() ||
      email.trim().toLowerCase() !== user.email.trim().toLowerCase()
    );
  }, [user, nombre, email]);

  if (!open || !user || typeof document === "undefined") return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    if (!email.trim()) {
      setError("El email es obligatorio.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Ingresá un email válido.");
      return;
    }
    if (!hasChanges) {
      setError("Modificá al menos un campo antes de guardar.");
      return;
    }

    const body: { nombre?: string; email?: string } = {};
    if (nombre.trim() !== user.nombre.trim()) body.nombre = nombre.trim();
    if (email.trim().toLowerCase() !== user.email.trim().toLowerCase()) {
      body.email = email.trim();
    }

    setLoading(true);
    setError("");
    const startedAt = Date.now();
    try {
      const updated = await updateUserWithApi(accessToken, user.id, body);
      await delayRemaining(DEFAULT_MIN_LOADING_MS, startedAt);
      onUpdated(updated);
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? mapAuthApiError(err, "admin")
          : "No se pudo actualizar el usuario."
      );
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 cursor-pointer bg-medical-text/55 backdrop-blur-sm"
        aria-label="Cerrar"
        disabled={loading}
        onClick={onClose}
      />
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-medical-border bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-medical-border bg-medical-primary px-5 py-4">
          <div className="flex items-center gap-2 text-white">
            <User className="size-5" />
            <h2 className="text-base font-semibold">Editar usuario</h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="cursor-pointer text-white hover:bg-white/15"
            disabled={loading}
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className="space-y-1.5">
            <Label htmlFor="user-edit-nombre">Nombre</Label>
            <input
              id="user-edit-nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className={inputClass}
              disabled={loading}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="user-edit-email">Email</Label>
            <input
              id="user-edit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              disabled={loading}
            />
          </div>
          {error ? (
            <p className="text-sm text-medical-danger" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex justify-end gap-2 border-t border-medical-border bg-medical-surface/50 px-5 py-4">
          <Button type="button" variant="outline" disabled={loading} onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading || !hasChanges}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            Guardar
          </Button>
        </div>
      </form>
    </div>,
    document.body
  );
}
