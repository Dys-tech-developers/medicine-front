import { logoutWithApi } from "@/lib/api/auth";
import { clearAuthSession, loadAuthSession } from "@/lib/auth-session";

/**
 * Cierra sesión en el servidor (revoca token) y limpia el almacenamiento local.
 */
export async function performLogout(): Promise<void> {
  const session = loadAuthSession();

  if (session?.accessToken) {
    try {
      await logoutWithApi(session.accessToken);
    } catch (error) {
      console.warn("[logout] no se pudo cerrar sesión en el servidor:", error);
    }
  }

  clearAuthSession();

  if (typeof window !== "undefined") {
    window.location.assign("/login");
  }
}
