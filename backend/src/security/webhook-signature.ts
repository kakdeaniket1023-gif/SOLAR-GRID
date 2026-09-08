import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Payment gateway webhook signature utilities (HMAC-SHA256).
 * The gateway must send:  x-solar-signature: hex(HMAC_SHA256(rawBody, secret))
 * Raw body must be read BEFORE JSON parsing (stringify(JSON.parse(x)) may differ).
 */

export const WEBHOOK_SIGNATURE_HEADER = 'x-solar-signature';

export function signWebhookPayload(rawBody: string, secret: string): string {
  return createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
}

/** Constant-time comparison to prevent timing-based signature oracles. */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!signatureHeader || !secret || secret.length < 16) return false;
  try {
    const expected = Buffer.from(signWebhookPayload(rawBody, secret), 'utf8');
    const received = Buffer.from(signatureHeader.trim().toLowerCase(), 'utf8');
    if (expected.length !== received.length) return false;
    return timingSafeEqual(expected, received);
  } catch {
    return false;
  }
}
