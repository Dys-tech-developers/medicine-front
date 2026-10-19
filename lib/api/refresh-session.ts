import { buildApiUrl, isNgrokBackend } from "@/lib/api/config";
import type { ApiResponse, AuthResponseDto } from "@/lib/api/types";
import { loadAuthSession, updateAuthSessionTokens } from "@/lib/auth-session";

let inFlightRefresh: Promise<string | null> | null = null;

/**
 * Renueva access + refresh token vía POST /auth/refresh.
 * Deduplica llamadas concurrentes (el backend rota el refresh token).
 * Devuelve el nuevo accessToken o null si no se pudo renovar.
 */
export async function refreshAuthSession(): Promise<string | null> {
  if (inFlightRefresh) return inFlightRefresh;

  inFlightRefresh = (async () => {
    const session = loadAuthSession();
    if (!session?.refreshToken) return null;

    const url = buildApiUrl("/api/v1/auth/refresh");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (isNgrokBackend()) {
      headers["ngrok-skip-browser-warning"] = "true";
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      });

      if (!response.ok) return null;

      const payload = (await response.json()) as ApiResponse<AuthResponseDto>;
      if (!payload?.success || !payload.data?.accessToken || !payload.data?.refreshToken) {
        return null;
      }

      updateAuthSessionTokens(payload.data.accessToken, payload.data.refreshToken);
      return payload.data.accessToken;
    } catch {
      return null;
    }
  })().finally(() => {
    inFlightRefresh = null;
  });

  return inFlightRefresh;
}
