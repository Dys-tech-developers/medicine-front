/** Duración mínima visible de skeletons / estados de carga en el dashboard. */
export const DEFAULT_MIN_LOADING_MS = 2000;

/** Espera el tiempo restante para completar `minMs` desde `startedAt`. */
export async function delayRemaining(minMs: number, startedAt: number): Promise<void> {
  const remaining = minMs - (Date.now() - startedAt);
  if (remaining > 0) {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, remaining);
    });
  }
}

/** Ejecuta `task` y garantiza al menos `minMs` de duración total. */
export async function withMinimumDuration<T>(
  task: () => Promise<T>,
  minMs = DEFAULT_MIN_LOADING_MS
): Promise<T> {
  const startedAt = Date.now();
  const result = await task();
  await delayRemaining(minMs, startedAt);
  return result;
}
