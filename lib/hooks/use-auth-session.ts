"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AUTH_SESSION_UPDATED_EVENT,
  loadAuthSession,
  type AppRole,
  type AuthSession,
} from "@/lib/auth-session";

type UseAuthSessionOptions = {
  requiredRole?: AppRole;
  redirectToLogin?: boolean;
};

export function useAuthSession(options: UseAuthSessionOptions = {}) {
  const { requiredRole, redirectToLogin = true } = options;
  const [session, setSession] = useState<AuthSession | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    setSession(loadAuthSession());
  }, []);

  useEffect(() => {
    const parsed = loadAuthSession();
    if (!parsed || (requiredRole && parsed.role !== requiredRole)) {
      if (redirectToLogin) {
        window.location.assign("/login");
        return;
      }
      setSession(null);
      setReady(true);
      return;
    }
    setSession(parsed);
    setReady(true);
  }, [requiredRole, redirectToLogin]);

  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener(AUTH_SESSION_UPDATED_EVENT, handler);
    return () => window.removeEventListener(AUTH_SESSION_UPDATED_EVENT, handler);
  }, [refresh]);

  return { session, ready, refresh };
}
