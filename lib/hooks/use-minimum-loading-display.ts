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
      setDisplayLoading(true);
      return;
    }

    if (startedAtRef.current == null) {
      setDisplayLoading(false);
      return;
    }

    const remaining = minMs - (Date.now() - startedAtRef.current);
    if (remaining <= 0) {
      startedAtRef.current = null;
      setDisplayLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      startedAtRef.current = null;
      setDisplayLoading(false);
    }, remaining);

    return () => clearTimeout(timer);
  }, [isLoading, minMs]);

  return displayLoading;
}
