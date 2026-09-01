"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  AUTH_SESSION_UPDATED_EVENT,
  dispatchAuthSessionUpdated,
  loadAuthSession,
  type AppRole,
} from "@/lib/auth-session";

type UseAuthSessionOptions = {
  requiredRole?: AppRole;
  redirectToLogin?: boolean;
};

function subscribeToSession(onChange: () => void): () => void {
  window.addEventListener(AUTH_SESSION_UPDATED_EVENT, onChange);
  // Sincroniza la sesión entre pestañas
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(AUTH_SESSION_UPDATED_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

const getServerSnapshot = () => null;
const subscribeNoop = () => () => {};
const getTrue = () => true;
const getFalse = () => false;

export function useAuthSession(options: UseAuthSessionOptions = {}) {
  const { requiredRole, redirectToLogin = true } = options;

  // loadAuthSession cachea por contenido, así el snapshot es estable
  const stored = useSyncExternalStore(
    subscribeToSession,
    loadAuthSession,
    getServerSnapshot
  );
  // true recién después de hidratar en el cliente (false en el HTML estático)
  const hydrated = useSyncExternalStore(subscribeNoop, getTrue, getFalse);

  const session =
    stored && (!requiredRole || stored.role === requiredRole) ? stored : null;

  // Si va a redirigir, ready queda false para que la UI no parpadee
  const ready = hydrated && (session != null || !redirectToLogin);

  useEffect(() => {
    if (!hydrated || session || !redirectToLogin) return;
    window.location.assign("/login");
  }, [hydrated, session, redirectToLogin]);

  const refresh = useCallback(() => {
    dispatchAuthSessionUpdated();
  }, []);

  return { session, ready, refresh };
}
