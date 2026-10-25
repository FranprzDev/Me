/**
 * Best-effort rate limit for the public MCP endpoint.
 *
 * The server is stateless and runs as serverless functions, so the counters
 * live in the memory of each warm instance: a single client is capped per
 * instance, not globally. That is enough to stop one noisy client from
 * hammering the function, but it is not a hard guarantee. A platform-level
 * rule (Vercel WAF rate limiting) is the stronger layer if it is ever needed.
 */

/** Requests allowed per client in each window. A normal MCP session needs a handful. */
export const MCP_RATE_LIMIT_MAX = 120;
/** Window length in milliseconds. */
export const MCP_RATE_LIMIT_WINDOW_MS = 60_000;
/** Upper bound on tracked clients, so the map cannot grow without limit. */
const MAX_TRACKED_CLIENTS = 5_000;

type Window = { count: number; resetAt: number };

const windows = new Map<string, Window>();

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterSeconds: number };

/** Client key: Vercel sets x-forwarded-for to the real client address. */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || "unknown";
}

export function checkRateLimit(key: string, now: number = Date.now()): RateLimitResult {
  const current = windows.get(key);
  if (!current || current.resetAt <= now) {
    if (windows.size >= MAX_TRACKED_CLIENTS) {
      for (const [name, entry] of windows) if (entry.resetAt <= now) windows.delete(name);
      // Still full of live windows: drop the oldest entries instead of growing.
      while (windows.size >= MAX_TRACKED_CLIENTS) {
        const oldest = windows.keys().next().value;
        if (oldest === undefined) break;
        windows.delete(oldest);
      }
    }
    windows.set(key, { count: 1, resetAt: now + MCP_RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }
  if (current.count >= MCP_RATE_LIMIT_MAX) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  }
  current.count += 1;
  return { allowed: true };
}

/** Test helper: forget all counters. */
export function resetRateLimit(): void {
  windows.clear();
}
