import { Router, Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { DatabaseService, db } from '@/backend/db';
import { signAuthToken, setAuthCookie, clearAuthCookie } from '@/backend/auth/jwt';
import { requireAuthenticatedUser, requireUser, AuthenticatedRequest } from '@/backend/auth/guards';
import { verifyUserTransactionPin, setUserTransactionPin } from '@/backend/auth/transaction-pin';
import { checkRateLimit, getClientIp, RATE_LIMIT_CONFIGS } from '@/backend/security/rate-limiter';

const router = Router();

const LoginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is strictly required'),
});

const SignupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  referralCode: z.string().optional(),
  phone: z.string().optional(),
  country: z.string().optional(),
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string({ required_error: 'Current password is required' }).min(1, 'Current password is required'),
  newPassword: z.string({ required_error: 'New password is required' }).min(6, 'New password must be at least 6 characters long'),
});

const PinSchema = z.object({
  action: z.enum(['VERIFY', 'SET', 'CHANGE']),
  transactionPassword: z.string().optional(),
  newTransactionPassword: z.string().regex(/^\d{4,8}$/, 'Transaction PIN must be 4 to 8 numeric digits').optional(),
  accountPassword: z.string().optional(),
});

/**
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const clientIp = getClientIp(req);
    if (checkRateLimit(clientIp, RATE_LIMIT_CONFIGS.login, res)) return;

    const parseResult = LoginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: parseResult.error.errors[0]?.message || 'Email and password are required',
      });
    }

    const { email, password } = parseResult.data;
    const cleanEmail = email.trim().toLowerCase();

    const dbUserWithHash = await DatabaseService.getUserWithPasswordByEmail(cleanEmail);
    if (dbUserWithHash && (dbUserWithHash as any).lockedUntil && new Date((dbUserWithHash as any).lockedUntil) > new Date()) {
      const remainingMin = Math.ceil((new Date((dbUserWithHash as any).lockedUntil).getTime() - Date.now()) / 60000);
      return res.status(423).json({
        success: false,
        error: 'ACCOUNT_LOCKED',
        message: `Account is temporarily locked due to consecutive failed attempts. Try again in ${remainingMin} minute(s).`,
      });
    }

    let user: any = null;

    if (dbUserWithHash && dbUserWithHash.passwordHash) {
      const isMatch = await bcrypt.compare(password, dbUserWithHash.passwordHash);
      if (isMatch) {
        user = dbUserWithHash;
      }
    }

    if (!user) {
      if (dbUserWithHash) {
        const { locked } = await DatabaseService.incrementFailedLoginAttempts(dbUserWithHash.id);
        if (locked) {
          return res.status(423).json({
            success: false,
            error: 'ACCOUNT_LOCKED',
            message: 'Too many consecutive failed login attempts. Account temporarily locked for 15 minutes.',
          });
        }
      }
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
      });
    }

    if ((dbUserWithHash as any).failedLoginAttempts > 0 || (dbUserWithHash as any).lockedUntil) {
      await DatabaseService.resetFailedLoginAttempts(user.id);
    }

    if (user.status === 'BANNED' || user.status === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Your account is suspended or deactivated. Contact support for assistance.',
      });
    }

    const profile = await DatabaseService.getProfile(user.id);

    await DatabaseService.addAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'USER_LOGIN',
      targetType: 'AUTH',
      targetId: user.id,
      details: { method: 'PASSWORD', email: user.email },
      ipAddress: clientIp,
    });

    const token = await signAuthToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    setAuthCookie(res, token);

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        leadershipLevel: user.leadershipLevel,
        points: user.points,
        availableBalance: user.availableBalance,
        totalEarned: user.totalEarned,
      },
      profile,
      message: 'Authentication successful',
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'An error occurred during authentication. Please try again.',
    });
  }
});

/**
 * POST /api/auth/signup
 */
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const clientIp = getClientIp(req);
    if (checkRateLimit(clientIp, RATE_LIMIT_CONFIGS.signup, res)) return;

    const parseResult = SignupSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: parseResult.error.errors[0]?.message || 'Invalid input data',
      });
    }

    const { name, email, password, referralCode, phone, country } = parseResult.data;
    const cleanEmail = email.trim().toLowerCase();

    const existing = await DatabaseService.getUserByEmail(cleanEmail);
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'EMAIL_IN_USE',
        message: 'An account with this email address already exists.',
      });
    }

    let sponsorId: string | null = null;
    if (referralCode && referralCode.trim() !== '') {
      const sponsorUser = await DatabaseService.getUserByReferralCode(referralCode.trim());
      if (sponsorUser) {
        sponsorId = sponsorUser.id;
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const baseCode = name.replace(/[^a-zA-Z]/g, '').toUpperCase().substring(0, 3) || 'SOL';
    const randSuffix = Math.floor(100 + Math.random() * 900);
    const newRefCode = `SG-${baseCode}-${randSuffix}`;
    const userId = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newUser = await DatabaseService.createUser({
      id: userId,
      name: name.trim(),
      email: cleanEmail,
      phone: phone || '+1 (555) 000-0000',
      country: country || 'United States',
      referralCode: newRefCode,
      sponsorId,
      role: 'USER',
      passwordHash,
    });

    if (!newUser) {
      throw new Error('Failed to create user record.');
    }

    await DatabaseService.addAuditLog({
      actorId: newUser.id,
      actorEmail: newUser.email,
      actorRole: 'USER',
      action: 'USER_SIGNUP',
      targetType: 'AUTH',
      targetId: newUser.id,
      details: { email: newUser.email, sponsorId },
      ipAddress: clientIp,
    });

    const token = await signAuthToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
    });

    setAuthCookie(res, token);

    return res.status(201).json({
      success: true,
      token,
      user: newUser,
      message: 'Account created successfully',
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'An error occurred during account creation. Please try again.',
    });
  }
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', (req: Request, res: Response) => {
  clearAuthCookie(res);
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * POST /api/auth/forgot-password
 */
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const clientIp = getClientIp(req);
    if (checkRateLimit(clientIp, RATE_LIMIT_CONFIGS.passwordReset, res)) return;

    const { email } = req.body || {};
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'A valid email address is required',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await DatabaseService.getUserByEmail(cleanEmail);

    if (user) {
      await DatabaseService.addAuditLog({
        actorId: user.id,
        actorEmail: user.email,
        actorRole: user.role,
        action: 'PASSWORD_RESET_REQUESTED',
        targetType: 'AUTH',
        targetId: user.id,
        details: { email: cleanEmail },
        ipAddress: clientIp,
      });

      await DatabaseService.createNotification({
        userId: user.id,
        title: 'Password Reset Requested',
        message: 'A request to reset your password was initiated. If this was not you, please secure your account immediately.',
        type: 'SECURITY',
        link: '/forgot-password',
      });
    }

    // Return constant success to prevent account enumeration
    return res.status(200).json({
      success: true,
      message: 'If an account exists for this email, password recovery instructions have been dispatched.',
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to process password recovery request.',
    });
  }
});

/**
 * GET /api/auth/me
 */
router.get('/me', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { authUser, user } = await requireAuthenticatedUserContext(req);
    if (!authUser || !user) {
      return res.status(200).json({
        success: true,
        authenticated: false,
        user: null,
        profile: null,
      });
    }

    const profile = await DatabaseService.getProfile(user.id);

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        country: user.country,
        avatarUrl: user.avatarUrl,
        role: user.role,
        status: user.status,
        referralCode: user.referralCode,
        sponsorId: user.sponsorId,
        leadershipLevel: user.leadershipLevel,
        points: user.points,
        availableBalance: user.availableBalance,
        totalEarned: user.totalEarned,
        createdAt: user.createdAt,
      },
      profile,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve authenticated user profile.',
    });
  }
});

/**
 * PATCH /api/auth/me
 */
router.patch('/me', requireAuthenticatedUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const body = req.body || {};
    const {
      name,
      phone,
      country,
      avatarUrl,
      bio,
      walletAddress,
      walletNetwork,
      preferredCurrency,
      telegramHandle,
      transactionPin,
      transactionPassword,
    } = body;

    if (walletAddress !== undefined) {
      const pin = transactionPin || transactionPassword;
      if (!pin) {
        return res.status(400).json({
          success: false,
          error: 'PIN_REQUIRED',
          message: 'Your 6-digit transaction PIN is required to change your payout wallet address.',
        });
      }
      const pinResult = await verifyUserTransactionPin(user.id, String(pin).trim());
      if (!pinResult.success) {
        return res.status(pinResult.locked ? 423 : 403).json({
          success: false,
          error: pinResult.locked ? 'LOCKED' : 'INVALID_PIN',
          message: pinResult.message || 'Incorrect transaction PIN.',
        });
      }
    }

    if (name || phone || country || avatarUrl !== undefined) {
      await DatabaseService.updateUser(user.id, {
        ...(name ? { name: String(name).trim() } : {}),
        ...(phone ? { phone: String(phone).trim() } : {}),
        ...(country ? { country: String(country).trim() } : {}),
        ...(avatarUrl !== undefined ? { avatarUrl: String(avatarUrl).trim() } : {}),
      });
    }

    const updatedProfile = await DatabaseService.updateProfile(user.id, {
      ...(bio !== undefined ? { bio: String(bio) } : {}),
      ...(walletAddress !== undefined ? { walletAddress: String(walletAddress).trim() } : {}),
      ...(walletNetwork !== undefined ? { walletNetwork: String(walletNetwork).trim() as any } : {}),
      ...(preferredCurrency !== undefined ? { preferredCurrency: String(preferredCurrency).trim() } : {}),
      ...(telegramHandle !== undefined ? { telegramHandle: String(telegramHandle).trim() } : {}),
    });

    const updatedUser = await DatabaseService.getUserById(user.id);

    return res.status(200).json({
      success: true,
      user: updatedUser,
      profile: updatedProfile,
      message: 'Profile updated successfully',
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to update profile.',
    });
  }
});

/**
 * POST /api/auth/password
 */
router.post('/password', requireAuthenticatedUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const clientIp = getClientIp(req);
    if (checkRateLimit(clientIp, RATE_LIMIT_CONFIGS.passwordReset, res)) return;

    const user = req.user!;
    const parseResult = ChangePasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: parseResult.error.errors[0]?.message || 'Invalid input data',
      });
    }

    const { currentPassword, newPassword } = parseResult.data;

    const userWithHash = await DatabaseService.getUserWithPasswordByEmail(user.email);
    if (userWithHash && userWithHash.passwordHash) {
      const isMatch = await bcrypt.compare(currentPassword, userWithHash.passwordHash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: 'INVALID_CURRENT_PASSWORD',
          message: 'The current password provided is incorrect.',
        });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);
    await DatabaseService.updateUserPassword(user.id, newHash);

    await DatabaseService.addAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'PASSWORD_CHANGED',
      targetType: 'AUTH',
      targetId: user.id,
      details: { updated: true },
      ipAddress: clientIp,
    });

    return res.status(200).json({
      success: true,
      message: 'Login password updated successfully. Your account is secured.',
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'An error occurred while updating your password.',
    });
  }
});

/**
 * GET /api/auth/sessions
 */
router.get('/sessions', requireUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const requestedUserId = req.query.userId as string | undefined;

    let sessions;
    if (user.role === 'SUPER_ADMIN') {
      if (requestedUserId) {
        sessions = await DatabaseService.getUserSessions(requestedUserId);
      } else {
        sessions = await DatabaseService.getAllSessions();
      }
    } else {
      sessions = await DatabaseService.getUserSessions(user.id);
    }

    return res.status(200).json({ success: true, sessions });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve sessions',
    });
  }
});

/**
 * POST /api/auth/sessions
 */
router.post('/sessions', requireUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { action, sessionId } = req.body || {};

    if (action === 'REVOKE_ONE') {
      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Session ID is required',
        });
      }

      if (user.role !== 'SUPER_ADMIN') {
        const userSessions = await DatabaseService.getUserSessions(user.id);
        const ownsSession = userSessions.some((s) => s.id === sessionId || s.sessionToken === sessionId);
        if (!ownsSession) {
          return res.status(403).json({
            success: false,
            error: 'FORBIDDEN',
            message: 'You cannot revoke a session that does not belong to you',
          });
        }
      }

      const success = await DatabaseService.revokeSession(sessionId);
      return res.status(200).json({
        success,
        message: success ? 'Session revoked successfully' : 'Session not found',
      });
    }

    if (action === 'REVOKE_ALL') {
      await DatabaseService.revokeAllUserSessions(user.id);
      return res.status(200).json({
        success: true,
        message: 'Terminated active sessions across all devices',
      });
    }

    return res.status(400).json({
      success: false,
      error: 'INVALID_ACTION',
      message: 'Invalid session management action',
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to process session revocation',
    });
  }
});

/**
 * POST /api/auth/transaction-password
 */
router.post('/transaction-password', requireAuthenticatedUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const clientIp = getClientIp(req);
    if (checkRateLimit(clientIp, RATE_LIMIT_CONFIGS.transactionPin, res)) return;

    const user = req.user!;
    const parseResult = PinSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: parseResult.error.errors[0]?.message || 'Invalid parameters',
      });
    }

    const { action, transactionPassword, newTransactionPassword } = parseResult.data;

    if (action === 'VERIFY') {
      if (!transactionPassword) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Transaction PIN is required',
        });
      }

      const verifyResult = await verifyUserTransactionPin(user.id, transactionPassword, clientIp);
      if (!verifyResult.success) {
        return res.status(verifyResult.locked ? 423 : 401).json({
          success: false,
          error: verifyResult.locked ? 'LOCKED' : 'INVALID_PIN',
          message: verifyResult.message,
          locked: verifyResult.locked,
          remainingAttempts: verifyResult.remainingAttempts,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Transaction PIN verified successfully',
      });
    }

    if (action === 'SET' || action === 'CHANGE') {
      if (!newTransactionPassword) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'New transaction PIN is required',
        });
      }

      // Check if user already has a PIN configured in DB
      const userWithHash = await DatabaseService.getUserWithPasswordByEmail(user.email);
      const { data: userPinRecord } = await db
        .from('users')
        .select('transaction_password_hash')
        .eq('id', user.id)
        .single();

      const hasExistingPin = Boolean(userPinRecord?.transaction_password_hash);

      if (hasExistingPin) {
        // If a PIN already exists, the current PIN is strictly required to authorize changes
        if (!transactionPassword) {
          return res.status(400).json({
            success: false,
            error: 'VALIDATION_ERROR',
            message: 'Current transaction PIN is required to authorize PIN changes',
          });
        }

        const verifyResult = await verifyUserTransactionPin(user.id, transactionPassword, clientIp);
        if (!verifyResult.success) {
          return res.status(verifyResult.locked ? 423 : 401).json({
            success: false,
            error: verifyResult.locked ? 'LOCKED' : 'INVALID_PIN',
            message: verifyResult.message,
          });
        }
      } else {
        // First-time setting: require account login password to prevent CSRF hijacking
        const accountPwd = parseResult.data.accountPassword || transactionPassword;
        if (!accountPwd) {
          return res.status(400).json({
            success: false,
            error: 'VALIDATION_ERROR',
            message: 'Account login password confirmation is required to initialize your transaction PIN',
          });
        }

        if (userWithHash?.passwordHash) {
          const isPasswordValid = await bcrypt.compare(accountPwd, userWithHash.passwordHash);
          if (!isPasswordValid) {
            return res.status(401).json({
              success: false,
              error: 'INVALID_CREDENTIALS',
              message: 'Invalid account password confirmation',
            });
          }
        }
      }

      const setResult = await setUserTransactionPin(user.id, newTransactionPassword, clientIp);
      if (!setResult.success) {
        return res.status(400).json({
          success: false,
          error: 'UPDATE_FAILED',
          message: setResult.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Transaction PIN configured successfully. Financial operations are secured.',
      });
    }

    return res.status(400).json({ success: false, message: 'Invalid action' });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to process transaction PIN operation',
    });
  }
});

async function requireAuthenticatedUserContext(req: Request) {
  const { getAuthenticatedUser } = await import('@/backend/auth/guards');
  return getAuthenticatedUser(req);
}

export default router;
