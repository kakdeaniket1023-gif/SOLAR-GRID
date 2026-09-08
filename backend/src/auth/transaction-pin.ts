import bcrypt from 'bcryptjs';
import { db, DatabaseService } from '@/backend/db';

const MAX_PIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export interface PinVerificationResult {
  success: boolean;
  message: string;
  locked?: boolean;
  lockedUntil?: string;
  remainingAttempts?: number;
}

/**
 * Validates a user's transaction PIN against their stored hash in the database.
 * Enforces lockout after 5 consecutive failures.
 */
export async function verifyUserTransactionPin(
  userId: string,
  pinAttempt: string,
  ipAddress?: string
): Promise<PinVerificationResult> {
  // Fetch current user PIN security fields
  const { data: user, error } = await db
    .from('users')
    .select('id, email, transaction_password_hash, failed_login_attempts, locked_until')
    .eq('id', userId)
    .single();

  if (error || !user) {
    return { success: false, message: 'User not found.' };
  }

  const now = new Date();

  // Check if locked
  if (user.locked_until && new Date(user.locked_until) > now) {
    const remainingMs = new Date(user.locked_until).getTime() - now.getTime();
    const remainingMins = Math.ceil(remainingMs / 60000);
    return {
      success: false,
      locked: true,
      lockedUntil: user.locked_until,
      message: `Account is temporarily locked due to repeated invalid PIN attempts. Try again in ${remainingMins} minute(s).`,
    };
  }

  // Check if PIN hash is configured
  if (!user.transaction_password_hash) {
    return {
      success: false,
      message: 'Transaction PIN has not been set up. Please configure your PIN in profile settings.',
    };
  }

  // Verify PIN with bcrypt
  const isMatch = await bcrypt.compare(pinAttempt, user.transaction_password_hash);

  if (!isMatch) {
    const currentAttempts = (user.failed_login_attempts || 0) + 1;
    const remaining = MAX_PIN_ATTEMPTS - currentAttempts;

    if (currentAttempts >= MAX_PIN_ATTEMPTS) {
      const lockDate = new Date(now.getTime() + LOCKOUT_MINUTES * 60000).toISOString();
      await db
        .from('users')
        .update({ failed_login_attempts: currentAttempts, locked_until: lockDate })
        .eq('id', userId);

      await DatabaseService.addAuditLog({
        actorId: userId,
        actorEmail: user.email,
        actorRole: 'USER',
        action: 'TRANSACTION_PIN_LOCKOUT',
        targetType: 'USER_SECURITY',
        targetId: userId,
        details: { attempts: currentAttempts, lockedUntil: lockDate },
        ipAddress: ipAddress || '127.0.0.1',
      });

      return {
        success: false,
        locked: true,
        lockedUntil: lockDate,
        message: `Too many invalid attempts. Your transaction functions are locked for ${LOCKOUT_MINUTES} minutes.`,
      };
    }

    await db
      .from('users')
      .update({ failed_login_attempts: currentAttempts })
      .eq('id', userId);

    return {
      success: false,
      remainingAttempts: remaining,
      message: `Invalid transaction PIN. ${remaining} attempt(s) remaining before temporary lockout.`,
    };
  }

  // Reset failed attempts upon successful PIN verification
  if (user.failed_login_attempts > 0 || user.locked_until) {
    await db
      .from('users')
      .update({ failed_login_attempts: 0, locked_until: null })
      .eq('id', userId);
  }

  return { success: true, message: 'Transaction PIN verified successfully.' };
}

/**
 * Updates or sets a user's transaction PIN securely.
 */
export async function setUserTransactionPin(
  userId: string,
  newPin: string,
  ipAddress?: string
): Promise<{ success: boolean; message: string }> {
  if (!newPin || newPin.length < 4 || newPin.length > 8 || !/^\d+$/.test(newPin)) {
    return { success: false, message: 'Transaction PIN must be 4 to 8 numeric digits.' };
  }

  const pinHash = await bcrypt.hash(newPin, 10);

  const { data: user } = await db.from('users').select('email').eq('id', userId).single();

  const { error } = await db
    .from('users')
    .update({
      transaction_password_hash: pinHash,
      failed_login_attempts: 0,
      locked_until: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    return { success: false, message: 'Failed to update transaction PIN.' };
  }

  if (user) {
    await DatabaseService.addAuditLog({
      actorId: userId,
      actorEmail: user.email,
      actorRole: 'USER',
      action: 'TRANSACTION_PIN_CHANGED',
      targetType: 'USER_SECURITY',
      targetId: userId,
      details: { updated: true },
      ipAddress: ipAddress || '127.0.0.1',
    });
  }

  return { success: true, message: 'Transaction PIN updated successfully.' };
}
