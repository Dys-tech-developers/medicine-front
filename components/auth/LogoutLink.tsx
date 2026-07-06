"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { performLogout } from "@/lib/auth/logout";

type LogoutLinkProps = {
  className?: string;
  title?: string;
  /** Solo spinner al cargar (p. ej. sidebar colapsado). */
  iconOnlyLoading?: boolean;
  children: React.ReactNode;
};

export function LogoutLink({
  className,
  title,
  iconOnlyLoading = false,
  children,
}: LogoutLinkProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    await performLogout();
  };

  return (
    <button
      type="button"
      title={loading ? "Cerrando sesión…" : title}
      disabled={loading}
      onClick={() => void handleClick()}
      className={className}
    >
      {loading ? (
        iconOnlyLoading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-label="Cerrando sesión…" />
        ) : (
          <>
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            <span>Cerrando sesión…</span>
          </>
        )
      ) : (
        children
      )}
    </button>
  );
}
