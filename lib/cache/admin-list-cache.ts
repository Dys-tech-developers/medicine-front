export type AdminListCachePayload<T> = {
  items: T[];
  total: number;
  fetchedAt: number;
};

const store = new Map<string, AdminListCachePayload<unknown>>();

function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableSerialize(entry)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`).join(",")}}`;
}

/** Clave estable por recurso, token y parámetros de consulta. */
export function buildAdminListCacheKey(
  resource: string,
  accessToken: string | null,
  params: Record<string, unknown> = {}
): string {
  const tokenPart = accessToken ? accessToken.slice(-16) : "anon";
  return `${resource}:${tokenPart}:${stableSerialize(params)}`;
}

export function readAdminListCache<T>(
  cacheKey: string
): AdminListCachePayload<T> | null {
  const entry = store.get(cacheKey) as AdminListCachePayload<T> | undefined;
  return entry ?? null;
}

export function writeAdminListCache<T>(
  cacheKey: string,
  data: { items: T[]; total: number }
): void {
  store.set(cacheKey, {
    items: data.items,
    total: data.total,
    fetchedAt: Date.now(),
  });
}

export function patchAdminListCache<T>(
  cacheKey: string,
  updater: (current: AdminListCachePayload<T> | null) => AdminListCachePayload<T> | null
): void {
  const next = updater(readAdminListCache<T>(cacheKey));
  if (next) {
    store.set(cacheKey, next);
  } else {
    store.delete(cacheKey);
  }
}

export function invalidateAdminListCache(resourcePrefix?: string): void {
  if (!resourcePrefix) {
    store.clear();
    return;
  }
  for (const key of store.keys()) {
    if (key.startsWith(`${resourcePrefix}:`)) {
      store.delete(key);
    }
  }
}
