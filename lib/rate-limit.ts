type Bucket = {
  count: number;
  resetAt: number;
};

type RateLimitStore = Map<string, Bucket>;

const globalStore = globalThis as typeof globalThis & {
  releaseRoomRateLimits?: RateLimitStore;
};

const store =
  globalStore.releaseRoomRateLimits ??
  (globalStore.releaseRoomRateLimits = new Map<string, Bucket>());

export function consumeRateLimit(
  key: string,
  options: { limit: number; windowMs: number },
  currentTime = Date.now(),
) {
  const existing = store.get(key);
  const bucket =
    !existing || existing.resetAt <= currentTime
      ? { count: 0, resetAt: currentTime + options.windowMs }
      : existing;

  bucket.count += 1;
  store.set(key, bucket);

  if (store.size > 5_000) {
    for (const [entryKey, entry] of store) {
      if (entry.resetAt <= currentTime) store.delete(entryKey);
    }
  }

  return {
    allowed: bucket.count <= options.limit,
    remaining: Math.max(0, options.limit - bucket.count),
    retryAfterSeconds: Math.max(
      1,
      Math.ceil((bucket.resetAt - currentTime) / 1000),
    ),
  };
}

export function clearRateLimit(key: string) {
  store.delete(key);
}
