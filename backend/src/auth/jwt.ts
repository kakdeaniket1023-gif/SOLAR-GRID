import { SignJWT, jwtVerify } from 'jose';

export const AUTH_COOKIE_NAME = 'solargrid_token';
const rawSecret = process.env.JWT_SECRET;
if (!rawSecret && process.env.NODE_ENV === 'production') {
  throw new Error('FATAL SECURITY ERROR: JWT_SECRET environment variable is missing in production!');
}
const JWT_SECRET = rawSecret || 'solargrid-neon-jwt-crypto-secret-key-2026-secure-production';
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET);

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: string;
  name?: string;
  [key: string]: any;
}

/**
 * Sign a secure cryptographic JWT token with user identity and role.
 */
export async function signAuthToken(payload: AuthTokenPayload, expiresIn = '7d'): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(SECRET_KEY);
}

/**
 * Verify and decode an authentication JWT token.
 */
export async function verifyAuthToken(token: string): Promise<AuthTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as string,
      name: payload.name as string | undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Extract auth token from incoming Express or standard Request
 */
export function getTokenFromRequest(req: any): string | null {
  if (!req) return null;

  // 1. Check cookies (cookie-parser populates req.cookies)
  if (req.cookies && req.cookies[AUTH_COOKIE_NAME]) {
    return req.cookies[AUTH_COOKIE_NAME];
  }

  // 2. Check Authorization header: Bearer <token>
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  return null;
}

/**
 * Attach secure HttpOnly JWT authentication cookie to Express response.
 */
export function setAuthCookie(res: any, token: string): void {
  const isProd = process.env.NODE_ENV === 'production';
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

  if (res && typeof res.cookie === 'function') {
    res.cookie(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
      maxAge,
    });
  }
}

/**
 * Expire and delete the JWT authentication cookie in Express response.
 */
export function clearAuthCookie(res: any): void {
  const isProd = process.env.NODE_ENV === 'production';
  if (res && typeof res.clearCookie === 'function') {
    res.clearCookie(AUTH_COOKIE_NAME, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
    });
  }
}
