"use client";

import { useEffect, useRef, useState } from "react";
import { DEFAULT_MIN_LOADING_MS } from "@/lib/loading/minimum-duration";

/**
 * Mantiene `true` al menos `minMs` desde que `isLoading` pasó a true,
 * aunque la petición termine antes (evita parpadeo de skeletons).
 */
export function useMinimumLoadingDisplay(
  isLoading: boolean,
  minMs = DEFAULT_MIN_LOADING_MS
): boolean {
  const [displayLoading, setDisplayLoading] = useState(isLoading);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (isLoading) {
      startedAtRef.current = Date.now();
      // Programado (no sincrónico) para cumplir react-hooks/set-state-in-effect
      const timer = setTimeout(() => setDisplayLoading(true), 0);
      return () => clearTimeout(timer);
    }

    const remaining =
      startedAtRef.current == null
        ? 0
        : minMs - (Date.now() - startedAtRef.current);

    const timer = setTimeout(() => {
      startedAtRef.current = null;
      setDisplayLoading(false);
    }, Math.max(0, remaining));

    return () => clearTimeout(timer);
  }, [isLoading, minMs]);

  return displayLoading;
}
