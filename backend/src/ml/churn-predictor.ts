import { DatabaseService } from '@/backend/db';
import { TreeEngine } from '@/backend/engines/tree-engine';

export interface ChurnPredictionResult {
  userId: string;
  churnProbability: number; // 0.0 to 1.0
  riskCategory: 'ACTIVE' | 'AT_RISK' | 'DORMANT' | 'CHURNED';
  daysSinceLastActivity: number;
  retentionScore: number; // 0 to 100
  recommendations: string[];
}

export class ChurnPredictor {
  /**
   * Predicts distributor retention and activity churn using behavioral recency and volume trajectory.
   */
  static async predictUserChurn(userId: string): Promise<ChurnPredictionResult> {
    const user = await DatabaseService.getUserById(userId);
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    const orders = await DatabaseService.getOrdersByUserId(userId);
    const directs = await DatabaseService.getUsersBySponsorIds([userId]);
    const commissions = await DatabaseService.getCommissionsByBeneficiaryId(userId);

    const now = Date.now();
    let latestActivityTimestamp = new Date(user.createdAt).getTime();

    for (const order of orders) {
      const t = new Date(order.createdAt).getTime();
      if (t > latestActivityTimestamp) latestActivityTimestamp = t;
    }

    for (const d of directs) {
      const t = new Date(d.createdAt).getTime();
      if (t > latestActivityTimestamp) latestActivityTimestamp = t;
    }

    for (const c of commissions) {
      const t = new Date(c.createdAt).getTime();
      if (t > latestActivityTimestamp) latestActivityTimestamp = t;
    }

    const daysSinceLastActivity = Math.max(0, Math.floor((now - latestActivityTimestamp) / (1000 * 60 * 60 * 24)));

    let riskWeight = 0;
    const recommendations: string[] = [];

    // Recency penalty
    if (daysSinceLastActivity > 60) {
      riskWeight += 0.55;
      recommendations.push('Send automated re-engagement promotion with new solar product releases.');
    } else if (daysSinceLastActivity > 30) {
      riskWeight += 0.35;
      recommendations.push('Trigger sponsor check-in push notification to review pending downline volume.');
    } else if (daysSinceLastActivity > 14) {
      riskWeight += 0.15;
    }

    // Commercial engagement
    if (orders.length === 0) {
      riskWeight += 0.25;
      recommendations.push('Highlight distributor starter product bundles with enhanced PV bonus.');
    }

    // Network building
    if (directs.length === 0) {
      riskWeight += 0.15;
      recommendations.push('Encourage sharing personalized referral link to unlock Level 1 (10%) commissions.');
    }

    // KYC verification factor
    if (user.kycStatus !== 'VERIFIED') {
      riskWeight += 0.1;
      recommendations.push('Remind user to complete KYC verification so they are eligible for instant commission withdrawals.');
    }

    const churnProbability = Math.min(0.99, Math.max(0.05, Math.round(riskWeight * 100) / 100));
    const retentionScore = Math.round((1 - churnProbability) * 100);

    let riskCategory: 'ACTIVE' | 'AT_RISK' | 'DORMANT' | 'CHURNED' = 'ACTIVE';
    if (churnProbability >= 0.75) {
      riskCategory = 'CHURNED';
    } else if (churnProbability >= 0.5) {
      riskCategory = 'DORMANT';
    } else if (churnProbability >= 0.25) {
      riskCategory = 'AT_RISK';
    } else {
      riskCategory = 'ACTIVE';
    }

    return {
      userId,
      churnProbability,
      riskCategory,
      daysSinceLastActivity,
      retentionScore,
      recommendations,
    };
  }
}
