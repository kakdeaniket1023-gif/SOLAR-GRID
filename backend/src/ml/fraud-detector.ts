import { DatabaseService } from '@/backend/db';
import { TreeEngine } from '@/backend/engines/tree-engine';
import { FraudSignal, FraudSeverity } from '@/types';

export class FraudDetector {
  /**
   * Scans entire referral network graph for circular loop dependencies.
   * A circular loop exists if User A -> User B -> ... -> User A.
   */
  static async scanCircularLoops(): Promise<FraudSignal[]> {
    const users = await DatabaseService.getAllUsers();
    const userMap = new Map(users.map((u) => [u.id, u]));
    const signals: FraudSignal[] = [];

    for (const user of users) {
      if (!user.sponsorId) continue;

      const visited = new Set<string>([user.id]);
      let curr = user.sponsorId;
      let path = [user.id];
      let depth = 0;

      while (curr && depth < 100) {
        path.push(curr);
        if (visited.has(curr)) {
          // Circular cycle found!
          const signal = await DatabaseService.createFraudSignal({
            userId: user.id,
            signalType: 'CIRCULAR_SPONSOR_LOOP',
            severity: 'CRITICAL',
            details: {
              detectedCyclePath: path,
              loopRootUser: curr,
              description: `User ${user.name} (${user.email}) is part of a circular referral loop: ${path.join(' -> ')}`,
            },
          });
          if (signal) signals.push(signal);
          break;
        }
        visited.add(curr);
        const parent = userMap.get(curr);
        curr = parent?.sponsorId || '';
        depth++;
      }
    }

    return signals;
  }

  /**
   * Detects rapid order-then-refund churning patterns designed to extract commission credit.
   */
  static async checkRapidRefundChurn(userId: string): Promise<FraudSignal | null> {
    const orders = await DatabaseService.getOrdersByUserId(userId);
    const refundedOrders = orders.filter((o) => o.status === 'REFUNDED' && o.refundedAt && o.paidAt);

    let rapidRefundsCount = 0;
    for (const order of refundedOrders) {
      const paidTime = new Date(order.paidAt!).getTime();
      const refundTime = new Date(order.refundedAt!).getTime();
      const diffMinutes = (refundTime - paidTime) / (1000 * 60);

      // Paid and refunded within 60 minutes
      if (diffMinutes < 60) {
        rapidRefundsCount++;
      }
    }

    if (rapidRefundsCount >= 2) {
      return DatabaseService.createFraudSignal({
        userId,
        signalType: 'COMMISSION_CHURNING_RAPID_REFUNDS',
        severity: 'HIGH',
        details: {
          rapidRefundsCount,
          totalRefundedOrders: refundedOrders.length,
          description: `User has ${rapidRefundsCount} orders paid and immediately refunded within 60 minutes.`,
        },
      });
    }

    return null;
  }

  /**
   * Scans for duplicate payout wallet addresses or bank details across different user accounts.
   */
  static async checkDuplicatePayoutMethods(): Promise<FraudSignal[]> {
    const methods = await DatabaseService.getAllPayoutMethods();
    const addressToUsers = new Map<string, string[]>();

    for (const m of methods) {
      const address = m.details?.walletAddress || m.details?.accountNumber || m.details?.address;
      if (!address || typeof address !== 'string' || address.trim().length < 5) continue;

      const normalized = address.trim().toLowerCase();
      const list = addressToUsers.get(normalized) || [];
      if (!list.includes(m.userId)) {
        list.push(m.userId);
      }
      addressToUsers.set(normalized, list);
    }

    const signals: FraudSignal[] = [];
    for (const [address, userIds] of addressToUsers.entries()) {
      if (userIds.length > 1) {
        // Multi-accounting syndicate suspicion
        for (const uid of userIds) {
          const sig = await DatabaseService.createFraudSignal({
            userId: uid,
            signalType: 'SHARED_PAYOUT_DESTINATION',
            severity: 'HIGH',
            details: {
              sharedAddress: address,
              linkedUserIds: userIds,
              description: `Payout destination ${address} is shared by ${userIds.length} different user accounts.`,
            },
          });
          if (sig) signals.push(sig);
        }
      }
    }

    return signals;
  }

  /**
   * Comprehensive background audit scan running all fraud heuristic models.
   */
  static async runFullNetworkScan(): Promise<{
    totalSignals: number;
    circularLoops: number;
    duplicatePayouts: number;
  }> {
    const loopSignals = await this.scanCircularLoops();
    const payoutSignals = await this.checkDuplicatePayoutMethods();

    return {
      totalSignals: loopSignals.length + payoutSignals.length,
      circularLoops: loopSignals.length,
      duplicatePayouts: payoutSignals.length,
    };
  }
}
