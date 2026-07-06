import type { ApiError } from "@/lib/api/client";
import { getApiErrorMessages } from "@/lib/api/format-api-error";

export type AuthErrorContext = "profile" | "password" | "admin" | "forgot" | "reset";

export function mapAuthApiError(error: ApiError, context: AuthErrorContext): string {
  if (error.status === 429) {
    return "Demasiados intentos. Probá de nuevo en unos minutos.";
  }

  if (error.status === 401) {
    if (context === "password") {
      return "La contraseña actual es incorrecta o tu sesión expiró.";
    }
    return "Tu sesión expiró. Volvé a iniciar sesión.";
  }

  if (error.status === 403) {
    return "No tenés permisos para realizar esta acción.";
  }

  if (error.status === 409) {
    return "Ese email ya está en uso.";
  }

  if (error.status === 400) {
    const messages = getApiErrorMessages(error);
    if (messages.length > 0) return messages.join(" ");
    if (context === "reset") {
      return "Código inválido o expirado.";
    }
  }

  const fallback = getApiErrorMessages(error);
  if (fallback.length > 0) return fallback.join(" ");
  return "Ocurrió un error. Intentá de nuevo.";
}
