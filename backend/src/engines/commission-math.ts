/**
 * Pure commission math + validation helpers for the compliant direct-selling engine.
 * NO database, network, or framework imports — fully unit-testable.
 *
 * Compliance invariants enforced here:
 *  - Maximum 2 levels of referral commission (Direct Selling Rules 2021 aligned).
 *  - Percentages must be positive and bounded (<= 25% per level).
 *  - All amounts rounded to 4 decimal places (platform convention).
 */

export const MAX_COMMISSION_LEVELS = 2;
export const MAX_LEVEL_PERCENT = 25;
export const DEFAULT_COMMISSION_RULES = [
  { level: 1 as const, percent: 10 },
  { level: 2 as const, percent: 5 },
];

/** Platform-wide 4dp rounding (matches Math.round(x*10000)/10000 convention). */
export function round4(amount: number): number {
  return Math.round(amount * 10000) / 10000;
}

/** Compute one commission amount, floored at zero and rounded to 4dp. */
export function computeCommission(baseAmount: number, percent: number): number {
  if (baseAmount <= 0 || percent <= 0) return 0;
  return round4(baseAmount * (percent / 100));
}

/**
 * Full commission breakdown for an order.
 * Levels are derived from the order total's commissionable value.
 * Guarantees: sum of breakdown <= commissionable base; levels <= 2.
 */
export function computeCommissionBreakdown(
  commissionableValue: number,
  rules: Array<{ level: number; percent: number }>
): Array<{ level: number; percent: number; amount: number }> {
  if (!isValidCommissionConfig(rules)) return [];
  return rules
    .slice(0, MAX_COMMISSION_LEVELS)
    .map((r) => ({
      level: r.level,
      percent: r.percent,
      amount: computeCommission(commissionableValue, r.percent),
    }))
    .filter((r) => r.amount > 0);
}

/** Idempotency key for a single (order, beneficiary, level) commission payout. */
export function buildCommissionIdempotencyKey(
  orderId: string,
  beneficiaryId: string,
  level: number
): string {
  return `COMM-${orderId}-${level}-${beneficiaryId}`;
}

/** Idempotency key for a clawback ledger reversal. */
export function buildClawbackIdempotencyKey(orderId: string, commissionId: string): string {
  return `CLAW-${orderId}-${commissionId}`;
}

/**
 * Validates a commission rule-set. Returns false (engine refuses to pay) when:
 *  - more than MAX_COMMISSION_LEVELS levels are configured
 *  - any percent is non-positive or exceeds MAX_LEVEL_PERCENT
 *  - levels are duplicated or not strictly ascending from 1
 */
export function isValidCommissionConfig(
  rules: Array<{ level: number; percent: number }>
): boolean {
  if (!Array.isArray(rules) || rules.length === 0) return false;
  if (rules.length > MAX_COMMISSION_LEVELS) return false;
  for (let i = 0; i < rules.length; i++) {
    const r = rules[i];
    if (r.level !== i + 1) return false; // must be 1..N in order, no gaps
    if (!Number.isFinite(r.percent) || r.percent <= 0 || r.percent > MAX_LEVEL_PERCENT) {
      return false;
    }
  }
  return true;
}

/** Sum of positive commissions pending clawback for an order. */
export function computeClawbackTotal(
  commissions: Array<{ amount: number; status: string }>
): number {
  return round4(
    commissions
      .filter((c) => c.status !== 'CLAWED_BACK')
      .reduce((sum, c) => sum + (c.amount > 0 ? c.amount : 0), 0)
  );
}

/**
 * Recoverable amount per beneficiary given their current balance.
 * Clawbacks must never push available_balance below zero (DB CHECK enforces it too).
 */
export function computeRecoverableAmount(
  commissionAmount: number,
  currentBalance: number
): number {
  if (commissionAmount <= 0) return 0;
  const balance = Math.max(currentBalance, 0);
  return round4(Math.min(commissionAmount, balance));
}

/** Risk score (0-100) for a withdrawal request — rule-based, explainable. */
export function computeWithdrawalRiskScore(features: {
  accountAgeDays: number;
  kycApproved: boolean;
  balanceVolatility: number; // stdev of ledger amounts / mean, 0..N
  referralVelocityPerDay: number;
  refundRate: number; // 0..1
}): number {
  let score = 0;
  if (!features.kycApproved) score += 35;
  if (features.accountAgeDays < 7) score += 20;
  else if (features.accountAgeDays < 30) score += 10;
  if (features.refundRate > 0.2) score += 25;
  else if (features.refundRate > 0.05) score += 10;
  if (features.referralVelocityPerDay > 10) score += 15;
  if (features.balanceVolatility > 2) score += 10;
  return Math.min(100, Math.max(0, score));
}
