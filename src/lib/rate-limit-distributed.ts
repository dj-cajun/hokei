import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import {
  RATE_LIMIT_PRESETS,
  type RateLimitPreset,
} from "@/lib/rate-limit";

const limiters = new Map<RateLimitPreset, Ratelimit>();

let redisClient: Redis | null = null;

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  if (!redisClient) {
    redisClient = new Redis({ url, token });
  }
  return redisClient;
}

export function isUpstashRateLimitEnabled(): boolean {
  return getRedis() !== null;
}

function windowToDuration(
  windowMs: number
): `${number} s` | `${number} m` | `${number} h` | `${number} ms` {
  if (windowMs >= 3_600_000 && windowMs % 3_600_000 === 0) {
    return `${windowMs / 3_600_000} h`;
  }
  if (windowMs >= 60_000 && windowMs % 60_000 === 0) {
    return `${windowMs / 60_000} m`;
  }
  if (windowMs >= 1_000 && windowMs % 1_000 === 0) {
    return `${windowMs / 1_000} s`;
  }
  return `${windowMs} ms`;
}

function getLimiter(preset: RateLimitPreset): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;

  let limiter = limiters.get(preset);
  if (!limiter) {
    const { maxRequests, windowMs } = RATE_LIMIT_PRESETS[preset];
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        maxRequests,
        windowToDuration(windowMs)
      ),
      prefix: `hokei:${preset}`,
    });
    limiters.set(preset, limiter);
  }
  return limiter;
}

/** Upstash 활성 시에만 호출. true = 허용 */
export async function checkDistributedRateLimit(
  key: string,
  preset: RateLimitPreset
): Promise<boolean> {
  const limiter = getLimiter(preset);
  if (!limiter) return true;
  const { success } = await limiter.limit(key);
  return success;
}
