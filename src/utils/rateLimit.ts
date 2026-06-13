import { safeGetItem, safeSetItem } from "./localStorageHelper";

/**
 * Client-side Rate Limiter (Sliding Window)
 * Max requests in a given window duration (milliseconds)
 */
export function checkRateLimit(key: string, limit = 4, windowMs = 30000): { allowed: boolean; waitTimeMs: number } {
  if (typeof window === "undefined") {
    return { allowed: true, waitTimeMs: 0 };
  }
  
  const now = Date.now();
  const storageKey = `saathi_ratelimit_${key}`;
  
  let timestamps: number[] = [];
  try {
    const stored = safeGetItem(storageKey);
    if (stored) {
      timestamps = JSON.parse(stored);
    }
  } catch (e) {
    timestamps = [];
  }
  
  // Filter out timestamps outside the window
  timestamps = timestamps.filter(t => now - t < windowMs);
  
  if (timestamps.length >= limit) {
    // Calculate how long to wait before the oldest request falls out of the window
    const oldest = timestamps[0];
    const waitTime = oldest + windowMs - now;
    return { allowed: false, waitTimeMs: Math.max(0, waitTime) };
  }
  
  // Add current timestamp
  timestamps.push(now);
  safeSetItem(storageKey, JSON.stringify(timestamps));
  
  return { allowed: true, waitTimeMs: 0 };
}
