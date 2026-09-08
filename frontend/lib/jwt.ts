import { jwtVerify } from 'jose';

export const AUTH_COOKIE_NAME = 'solargrid_token';
const JWT_SECRET = process.env.JWT_SECRET || 'solargrid-neon-jwt-crypto-secret-key-2026-secure-production';
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET);

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: string;
  name?: string;
  [key: string]: any;
}

/**
 * Verify and decode an authentication JWT token on Edge / Client / SSR.
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
