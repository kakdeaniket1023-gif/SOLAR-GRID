import { Request, Response, NextFunction } from 'express';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max number of allowed requests in the window
  message?: string;
}

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const ipStore = new Map<string, RateLimitRecord>();

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
 * Extracts client IP address from Express Request
 */
export function getClientIp(req: Request | any): string {
  if (!req) return '127.0.0.1';

  // Cloudflare Connecting IP
  const cfConnectingIp = req.headers?.['cf-connecting-ip'];
  if (typeof cfConnectingIp === 'string') {
    return cfConnectingIp.trim();
  }

  // Standard reverse-proxy
  const xRealIp = req.headers?.['x-real-ip'];
  if (typeof xRealIp === 'string') {
    return xRealIp.trim();
  }

  // Forwarded for
  const xForwardedFor = req.headers?.['x-forwarded-for'];
  if (typeof xForwardedFor === 'string') {
    const parts = xForwardedFor.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0) {
      return parts[parts.length - 1];
    }
  }

  return req.ip || req.socket?.remoteAddress || '127.0.0.1';
}

/**
 * Checks if a request exceeds rate limits.
 * Returns null if allowed, or sends 429 response if res is provided.
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig = RATE_LIMIT_CONFIGS.general,
  res?: Response
): boolean {
  const now = Date.now();
  const record = ipStore.get(key);

  if (!record || now > record.resetAt) {
    ipStore.set(key, { count: 1, resetAt: now + config.windowMs });
    return false; // Not limited
  }

  if (record.count >= config.maxRequests) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    if (res && !res.headersSent) {
      res.setHeader('Retry-After', String(retryAfter));
      res.setHeader('X-RateLimit-Limit', String(config.maxRequests));
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', String(Math.ceil(record.resetAt / 1000)));
      res.status(429).json({
        success: false,
        error: 'RATE_LIMITED',
        message: config.message || 'Rate limit exceeded. Please try again later.',
        retryAfter,
      });
    }
    return true; // Limited
  }

  record.count += 1;
  return false;
}

/**
 * Express Middleware factory for rate limiting
 */
export function rateLimiter(config: RateLimitConfig = RATE_LIMIT_CONFIGS.general) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = getClientIp(req);
    const isLimited = checkRateLimit(ip, config, res);
    if (isLimited) return;
    next();
  };
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
