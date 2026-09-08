import { DatabaseService } from '@/backend/db';
import { WithdrawalRequest, User, FraudSignal } from '@/types';

export interface WithdrawalRiskAssessment {
  withdrawalId: string;
  userId: string;
  score: number; // 0 - 100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  factors: string[];
  recommendedAction: 'AUTO_APPROVE' | 'MANUAL_REVIEW' | 'STRICT_HOLD';
  assessedAt: string;
}

export class RiskScorer {
  /**
   * Evaluates withdrawal financial risk using multi-factor compliance and behavioral signals.
   */
  static async assessWithdrawal(withdrawalId: string): Promise<WithdrawalRiskAssessment> {
    const withdrawal = await DatabaseService.getWithdrawalById(withdrawalId);
    if (!withdrawal) {
      throw new Error(`Withdrawal ${withdrawalId} not found`);
    }

    const user = await DatabaseService.getUserById(withdrawal.userId);
    if (!user) {
      throw new Error(`User ${withdrawal.userId} not found`);
    }

    const factors: string[] = [];
    let score = 0;

    // 1. KYC Compliance Gate Factor
    if (user.kycStatus !== 'VERIFIED') {
      score += 50;
      factors.push('Identity verification (KYC) is unverified or rejected (+50)');
    }

    // 2. Account Age Velocity
    const accountCreatedAt = new Date(user.createdAt).getTime();
    const now = Date.now();
    const ageDays = (now - accountCreatedAt) / (1000 * 60 * 60 * 24);

    if (ageDays < 2) {
      score += 25;
      factors.push(`Brand new account: created ${Math.round(ageDays * 24)}h ago (+25)`);
    } else if (ageDays < 7) {
      score += 15;
      factors.push(`Recent account: created ${Math.round(ageDays)} days ago (+15)`);
    }

    // 3. Genuine Commercial Activity / Product PV
    const orders = await DatabaseService.getOrdersByUserId(user.id);
    const paidOrders = orders.filter((o) => o.status === 'PAID');
    const personalPv = user.personalPv || 0;

    if (paidOrders.length === 0 && personalPv <= 0) {
      score += 20;
      factors.push('Zero personal product orders or PV generated (+20)');
    }

    // 4. Fraud Signals Check
    const fraudSignals: FraudSignal[] = await DatabaseService.getAllFraudSignals(user.id);
    const activeSignals = fraudSignals.filter((f: FraudSignal) => !f.resolved);
    if (activeSignals.length > 0) {
      score += 35;
      factors.push(`${activeSignals.length} unresolved fraud compliance signal(s) active on account (+35)`);
    }

    // 5. High-Value Concentration
    const amount = withdrawal.amountUsdt || withdrawal.amount || 0;
    if (amount >= 1000) {
      score += 15;
      factors.push(`High-value withdrawal request: $${amount.toFixed(2)} USDT (+15)`);
    }

    // Final score clamping
    const finalScore = Math.min(100, Math.max(0, score));

    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    let recommendedAction: 'AUTO_APPROVE' | 'MANUAL_REVIEW' | 'STRICT_HOLD' = 'AUTO_APPROVE';

    if (finalScore >= 70) {
      riskLevel = 'HIGH';
      recommendedAction = 'STRICT_HOLD';
    } else if (finalScore >= 35) {
      riskLevel = 'MEDIUM';
      recommendedAction = 'MANUAL_REVIEW';
    } else {
      riskLevel = 'LOW';
      recommendedAction = 'AUTO_APPROVE';
    }

    return {
      withdrawalId,
      userId: user.id,
      score: finalScore,
      riskLevel,
      factors,
      recommendedAction,
      assessedAt: new Date().toISOString(),
    };
  }
}
