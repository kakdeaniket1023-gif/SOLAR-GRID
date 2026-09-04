import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max number of allowed requests in the window
  message?: string;
}

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const ipStore = new Map<string, RateLimitRecord>();

/**
 * SolarGrid In-Memory Sliding Window Rate Limiter
 * 
 * ARCHITECTURE & PRODUCTION SCALING NOTE:
 * - Single-instance / Node.js runtime: The current Map-backed in-memory store provides low-latency,
 *   zero-dependency sliding window rate limiting.
 * - Multi-instance / Serverless edge deployment (e.g. Vercel, AWS Lambda, Kubernetes cluster):
 *   In-memory stores do not share state across worker processes or serverless isolates.
 *   To scale horizontally in production, replace `ipStore` with Upstash Redis (`@upstash/ratelimit`
 *   and `@upstash/redis`) or Redis Cluster (`ioredis`) using token bucket or sliding window logs.
 */

// Predefined rate limiting configurations
export const RATE_LIMIT_CONFIGS = {
  login: { windowMs: 60 * 1000, maxRequests: 10, message: 'Too many login attempts. Please try again later.' },
  signup: { windowMs: 10 * 60 * 1000, maxRequests: 5, message: 'Too many signup attempts. Please try again later.' },
  passwordReset: { windowMs: 15 * 60 * 1000, maxRequests: 5, message: 'Too many password reset requests.' },
  transactionPin: { windowMs: 15 * 60 * 1000, maxRequests: 5, message: 'Too many PIN verification attempts. Temporary lockout engaged.' },
  withdrawal: { windowMs: 60 * 1000, maxRequests: 5, message: 'Withdrawal rate limit exceeded. Please wait a moment.' },
  recharge: { windowMs: 60 * 1000, maxRequests: 5, message: 'Recharge submission rate limit exceeded.' },
  adminMutation: { windowMs: 60 * 1000, maxRequests: 30, message: 'Administrative rate limit exceeded.' },
  general: { windowMs: 60 * 1000, maxRequests: 100, message: 'Too many requests. Please slow down.' },
};

/**
 * Extracts client IP address from NextRequest
 */
export function getClientIp(request: NextRequest): string {
  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  const xRealIp = request.headers.get('x-real-ip');
  if (xRealIp) {
    return xRealIp.trim();
  }
  return '127.0.0.1';
}

/**
 * Checks if a request exceeds rate limits.
 * Returns null if allowed, or a 429 NextResponse if limited.
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig = RATE_LIMIT_CONFIGS.general
): NextResponse | null {
  const now = Date.now();
  const record = ipStore.get(key);

  if (!record || now > record.resetAt) {
    ipStore.set(key, { count: 1, resetAt: now + config.windowMs });
    return null;
  }

  if (record.count >= config.maxRequests) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return NextResponse.json(
      {
        success: false,
        error: 'RATE_LIMITED',
        message: config.message || 'Rate limit exceeded. Please try again later.',
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(config.maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(record.resetAt / 1000)),
        },
      }
    );
  }

  record.count += 1;
  return null;
}

// Cleanup stale records periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    ipStore.forEach((record, key) => {
      if (now > record.resetAt) {
        ipStore.delete(key);
      }
    });
  }, 5 * 60 * 1000);
}
