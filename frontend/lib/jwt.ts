import { jwtVerify } from 'jose';

export const AUTH_COOKIE_NAME = 'solargrid_token';
const JWT_SECRET = process.env.JWT_SECRET || 'solargrid_production_sec_key_9f8b2c4e1a7d3f5b8e0c2a4d6f8a1b3c5e7d9f0a2b4c6e8d';
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
