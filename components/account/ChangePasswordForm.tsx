"use client";

import { useState } from "react";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { mapAuthApiError } from "@/lib/api/auth-errors";
import { changePasswordWithApi } from "@/lib/api/auth";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const inputClass =
  "h-11 w-full rounded-xl border border-medical-border bg-medical-surface/80 px-3.5 text-sm text-medical-text outline-none transition placeholder:text-medical-mutedText/60 focus:border-medical-primary focus:bg-medical-card focus:ring-4 focus:ring-medical-primary/12 disabled:cursor-not-allowed disabled:opacity-60";

type Props = {
  accessToken: string;
  onNotify?: (message: string, kind: "success" | "error", description?: string) => void;
};

export function ChangePasswordForm({ accessToken, onNotify }: Props) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const validate = (): string | null => {
    if (!currentPassword) return "Ingresá tu contraseña actual.";
    if (newPassword.length < 10) {
      return "La nueva contraseña debe tener al menos 10 caracteres.";
    }
    if (newPassword !== confirmPassword) {
      return "La confirmación no coincide con la nueva contraseña.";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setSaving(true);
    try {
      await changePasswordWithApi(accessToken, {
        currentPassword,
        newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onNotify?.(
        "Contraseña actualizada",
        "success",
        "Tu contraseña se cambió correctamente."
      );
    } catch (err) {
      const message =
        err instanceof ApiError
          ? mapAuthApiError(err, "password")
          : "No se pudo cambiar la contraseña.";
      setError(message);
      onNotify?.(message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <PasswordField
        id="current-password"
        label="Contraseña actual"
        value={currentPassword}
        onChange={setCurrentPassword}
        show={showCurrent}
        onToggleShow={() => setShowCurrent((v) => !v)}
        disabled={saving}
        autoComplete="current-password"
      />
      <PasswordField
        id="new-password"
        label="Nueva contraseña"
        value={newPassword}
        onChange={setNewPassword}
        show={showNew}
        onToggleShow={() => setShowNew((v) => !v)}
        disabled={saving}
        autoComplete="new-password"
        hint="Mínimo 10 caracteres."
      />
      <PasswordField
        id="confirm-password"
        label="Confirmar nueva contraseña"
        value={confirmPassword}
        onChange={setConfirmPassword}
        show={showConfirm}
        onToggleShow={() => setShowConfirm((v) => !v)}
        disabled={saving}
        autoComplete="new-password"
      />

      {error ? (
        <p className="text-sm text-medical-danger" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className={cn(
            "inline-flex cursor-pointer items-center gap-2 rounded-xl bg-medical-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-medical-primaryDark disabled:cursor-not-allowed disabled:opacity-50"
          )}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          Cambiar contraseña
        </button>
      </div>
    </form>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  onToggleShow,
  disabled,
  autoComplete,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggleShow: () => void;
  disabled: boolean;
  autoComplete: string;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(inputClass, "pr-11")}
          autoComplete={autoComplete}
          disabled={disabled}
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-medical-mutedText hover:bg-medical-secondary hover:text-medical-text"
          aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
          tabIndex={-1}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {hint ? <p className="text-xs text-medical-mutedText">{hint}</p> : null}
    </div>
  );
}
