"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api/client";
import {
  buildAdminListCacheKey,
  readAdminListCache,
  writeAdminListCache,
} from "@/lib/cache/admin-list-cache";
import { getApiErrorMessages } from "@/lib/api/format-api-error";
import {
  DEFAULT_MIN_LOADING_MS,
  delayRemaining,
} from "@/lib/loading/minimum-duration";

export type CachedListResult<T> = {
  items: T[];
  total: number;
};

type UseCachedListOptions<T> = {
  resource: string;
  accessToken: string | null;
  enabled?: boolean;
  queryParams?: Record<string, unknown>;
  fetcher: () => Promise<CachedListResult<T>>;
  defaultErrorMessage: string;
  minLoadingMs?: number;
};

/**
 * Lista admin con caché en memoria (sesión actual).
 * - Primera visita o consulta nueva: skeleton + mínimo de carga.
 * - Volver al mismo ítem del sidebar: datos cacheados al instante y revalidación en segundo plano.
 */
export function useCachedList<T>({
  resource,
  accessToken,
  enabled = true,
  queryParams = {},
  fetcher,
  defaultErrorMessage,
  minLoadingMs = DEFAULT_MIN_LOADING_MS,
}: UseCachedListOptions<T>) {
  const cacheKey = buildAdminListCacheKey(resource, accessToken, queryParams);
  const initialCache = readAdminListCache<T>(cacheKey);

  const [items, setItems] = useState<T[]>(() => initialCache?.items ?? []);
  const [total, setTotal] = useState(() => initialCache?.total ?? 0);
  const [loading, setLoading] = useState(() => enabled && Boolean(accessToken) && !initialCache);
  const [error, setError] = useState("");
  const [refreshNonce, setRefreshNonce] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const refresh = useCallback(() => setRefreshNonce((n) => n + 1), []);

  const setListData = useCallback(
    (next: CachedListResult<T>) => {
      setItems(next.items);
      setTotal(next.total);
      writeAdminListCache(cacheKey, next);
    },
    [cacheKey]
  );

  useEffect(() => {
    if (!enabled || !accessToken) return;

    const cached = readAdminListCache<T>(cacheKey);
    const showSkeleton = !cached;

    if (cached) {
      setItems(cached.items);
      setTotal(cached.total);
      setLoading(false);
      setError("");
    }

    let cancelled = false;

    void (async () => {
      const startedAt = Date.now();
      if (showSkeleton) {
        setLoading(true);
        setError("");
      }

      try {
        const data = await fetcherRef.current();
        if (!cancelled) {
          setListData(data);
        }
      } catch (err) {
        const msg =
          err instanceof ApiError
            ? getApiErrorMessages(err).join(" ")
            : err instanceof Error
              ? err.message
              : defaultErrorMessage;
        if (!cancelled) {
          setError(msg);
          if (showSkeleton) {
            setItems([]);
            setTotal(0);
          }
        }
      } finally {
        if (!cancelled) {
          if (showSkeleton) {
            await delayRemaining(minLoadingMs, startedAt);
          }
          if (!cancelled) setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    accessToken,
    cacheKey,
    defaultErrorMessage,
    enabled,
    minLoadingMs,
    refreshNonce,
    setListData,
  ]);

  return {
    items,
    total,
    loading,
    error,
    refresh,
    cacheKey,
    setListData,
  };
}
