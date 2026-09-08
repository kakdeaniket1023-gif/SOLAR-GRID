import { Request, Response, NextFunction } from 'express';
import { DatabaseService } from '@/backend/db';
import { verifyAuthToken, getTokenFromRequest } from '@/backend/auth/jwt';
import { User, Profile } from '@/types';

export type AuthUser = User;

export interface AuthContextResult {
  authUser: AuthUser | null;
  user: User | null;
  profile: Profile | null;
}

// Extend Express Request type with authenticated user and profile
export interface AuthenticatedRequest extends Request {
  user?: User;
  authUser?: AuthUser;
  profile?: Profile | null;
}

/**
 * Server-only helper to obtain the current authenticated user context.
 * Validates cryptographically signed JWT from HttpOnly cookie or Authorization header.
 */
export async function getAuthenticatedUser(req?: any): Promise<AuthContextResult> {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return { authUser: null, user: null, profile: null };
    }

    const payload = await verifyAuthToken(token);
    if (!payload?.userId) {
      return { authUser: null, user: null, profile: null };
    }

    const userId = payload.userId;

    const [userRecord, profileRecord] = await Promise.all([
      DatabaseService.getUserById(userId),
      DatabaseService.getProfile(userId),
    ]);

    if (!userRecord) {
      return { authUser: null, user: null, profile: null };
    }

    return {
      authUser: userRecord,
      user: userRecord,
      profile: profileRecord,
    };
  } catch (err) {
    return { authUser: null, user: null, profile: null };
  }
}

/**
 * Express Middleware: Requires any authenticated user (USER or SUPER_ADMIN).
 */
export async function requireAuthenticatedUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { authUser, user, profile } = await getAuthenticatedUser(req);

  if (!authUser || !user) {
    res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: '401 Unauthorized: Valid session required.',
    });
    return;
  }

  if (user.status === 'BANNED' || user.status === 'SUSPENDED') {
    res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: 'Account is suspended or deactivated. Access revoked.',
    });
    return;
  }

  req.user = user;
  req.authUser = authUser;
  req.profile = profile;
  next();
}

/**
 * Express Middleware: Requires SUPER_ADMIN role specifically.
 */
export async function requireSuperAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { authUser, user, profile } = await getAuthenticatedUser(req);

  if (!authUser || !user) {
    res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: '401 Unauthorized: Super Admin privileges required.',
    });
    return;
  }

  if (user.role !== 'SUPER_ADMIN') {
    res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: 'Access denied: Super Admin role required.',
    });
    return;
  }

  if (user.status === 'BANNED' || user.status === 'SUSPENDED') {
    res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: 'Account is suspended or deactivated. Access revoked.',
    });
    return;
  }

  req.user = user;
  req.authUser = authUser;
  req.profile = profile;
  next();
}

/**
 * Express Middleware: Requires standard USER role specifically.
 */
export async function requireUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { authUser, user, profile } = await getAuthenticatedUser(req);

  if (!authUser || !user) {
    res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: '401 Unauthorized: Active member session required.',
    });
    return;
  }

  if (user.status === 'BANNED' || user.status === 'SUSPENDED') {
    res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: 'Account is suspended or deactivated. Access revoked.',
    });
    return;
  }

  req.user = user;
  req.authUser = authUser;
  req.profile = profile;
  next();
}
