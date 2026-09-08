import { describe, it, expect } from 'vitest';
import {
  MAX_COMMISSION_LEVELS,
  MAX_LEVEL_PERCENT,
  buildClawbackIdempotencyKey,
  buildCommissionIdempotencyKey,
  computeClawbackTotal,
  computeCommission,
  computeCommissionBreakdown,
  computeRecoverableAmount,
  computeWithdrawalRiskScore,
  isValidCommissionConfig,
  round4,
} from '@/backend/engines/commission-math';
import { signWebhookPayload, verifyWebhookSignature } from '@/backend/security/webhook-signature';

const DEFAULT_RULES = [
  { level: 1, percent: 10 },
  { level: 2, percent: 5 },
];

describe('Compliant commission engine — pure math', () => {
  it('rounds to 4dp and computes single commissions', () => {
    expect(round4(10 / 3)).toBeCloseTo(3.3333, 4);
    expect(computeCommission(100, 10)).toBe(10);
    expect(computeCommission(123.4567, 5)).toBe(6.1728);
    expect(computeCommission(0, 10)).toBe(0);
    expect(computeCommission(100, 0)).toBe(0);
    expect(computeCommission(-5, 10)).toBe(0);
  });

  it('produces a max-2-level breakdown from the commissionable value', () => {
    const breakdown = computeCommissionBreakdown(1000, DEFAULT_RULES);
    expect(breakdown).toHaveLength(2);
    expect(breakdown[0]).toEqual({ level: 1, percent: 10, amount: 100 });
    expect(breakdown[1]).toEqual({ level: 2, percent: 5, amount: 50 });
  });

  it('rejects illegal commission configurations', () => {
    expect(MAX_COMMISSION_LEVELS).toBe(2);
    expect(isValidCommissionConfig(DEFAULT_RULES)).toBe(true);
    // 3-level pyramid-style config must be rejected
    expect(isValidCommissionConfig([...DEFAULT_RULES, { level: 3, percent: 2 }])).toBe(false);
    // recruitment-only / zero / negative / oversized percents rejected
    expect(isValidCommissionConfig([{ level: 1, percent: 0 }])).toBe(false);
    expect(isValidCommissionConfig([{ level: 1, percent: -5 }])).toBe(false);
    expect(isValidCommissionConfig([{ level: 1, percent: MAX_LEVEL_PERCENT + 1 }])).toBe(false);
    // gaps/duplicates rejected
    expect(isValidCommissionConfig([{ level: 1, percent: 10 }, { level: 3, percent: 5 }])).toBe(false);
    expect(isValidCommissionConfig([])).toBe(false);
    // breakdown on an invalid config pays NOTHING (fail-closed)
    expect(computeCommissionBreakdown(1000, [{ level: 3, percent: 2 }])).toHaveLength(0);
  });

  it('builds stable idempotency keys', () => {
    expect(buildCommissionIdempotencyKey('ord-1', 'usr-9', 2)).toBe('COMM-ord-1-2-usr-9');
    expect(buildCommissionIdempotencyKey('ord-1', 'usr-9', 2)).toBe(
      buildCommissionIdempotencyKey('ord-1', 'usr-9', 2)
    );
    expect(buildClawbackIdempotencyKey('ord-1', 'comm-7')).toBe('CLAW-ord-1-comm-7');
  });

  it('computes clawback totals and capped recoverable amounts', () => {
    const commissions = [
      { amount: 100, status: 'PAID' },
      { amount: 50, status: 'PAID' },
      { amount: 30, status: 'CLAWED_BACK' },
    ];
    expect(computeClawbackTotal(commissions)).toBe(150);
    // Never recovers more than the beneficiary's current balance
    expect(computeRecoverableAmount(100, 40)).toBe(40);
    expect(computeRecoverableAmount(100, 250)).toBe(100);
    expect(computeRecoverableAmount(100, -10)).toBe(0); // balance floor
    expect(computeRecoverableAmount(0, 500)).toBe(0);
  });

  it('scores withdrawal risk explainably (0-100)', () => {
    const lowRisk = computeWithdrawalRiskScore({
      accountAgeDays: 365,
      kycApproved: true,
      balanceVolatility: 0.5,
      referralVelocityPerDay: 1,
      refundRate: 0,
    });
    expect(lowRisk).toBe(0);

    const highRisk = computeWithdrawalRiskScore({
      accountAgeDays: 1,
      kycApproved: false,
      balanceVolatility: 3,
      referralVelocityPerDay: 50,
      refundRate: 0.9,
    });
    expect(highRisk).toBe(100);
  });
});

describe('Payment webhook signature (HMAC-SHA256)', () => {
  const secret = 'test-webhook-secret-0123456789abcdef';
  const body = JSON.stringify({ orderId: '550e8400-e29b-41d4-a716-446655440000', gatewayRef: 'gw_ref_123456', idempotencyKey: 'idem-12345678' });

  it('verifies a correctly signed payload', () => {
    const sig = signWebhookPayload(body, secret);
    expect(verifyWebhookSignature(body, sig, secret)).toBe(true);
  });

  it('rejects tampered bodies, wrong secrets, and missing headers', () => {
    const sig = signWebhookPayload(body, secret);
    expect(verifyWebhookSignature(body + ' ', sig, secret)).toBe(false);
    expect(verifyWebhookSignature(body, sig, 'another-secret-0123456789')).toBe(false);
    expect(verifyWebhookSignature(body, null, secret)).toBe(false);
    expect(verifyWebhookSignature(body, '', secret)).toBe(false);
  });

  it('rejects malformed signatures without throwing', () => {
    expect(verifyWebhookSignature(body, 'not-hex-at-all', secret)).toBe(false);
    expect(verifyWebhookSignature(body, 'deadbeef', secret)).toBe(false);
  });
});
