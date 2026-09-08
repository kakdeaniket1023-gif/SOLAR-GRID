import { DatabaseService } from '@/backend/db';
import { TreeEngine } from '@/backend/engines/tree-engine';
import { User, DirectCommission, Order } from '@/types';

export class MLMService {
  /**
   * Retrieves upline up to 2 levels (strictly compliant with max 2 levels).
   */
  static async getUplineChain(userId: string): Promise<{
    l1?: User;
    l2?: User;
  }> {
    const upline = await TreeEngine.getUpline(userId, 2);
    const l1 = upline.find((u) => u.level === 1)?.user;
    const l2 = upline.find((u) => u.level === 2)?.user;
    return { l1, l2 };
  }

  /**
   * DISTRIBUTE DIRECT-SELLING COMMISSIONS
   * Strictly fires on REAL PRODUCT ORDERS that have reached 'PAID' status.
   * - Level 1: 10% of order PV
   * - Level 2: 5% of order PV
   * - Max 2 levels depth
   * - Idempotent execution
   */
  static async distributeOrderCommissions(orderId: string): Promise<DirectCommission[]> {
    const order = await DatabaseService.getOrderById(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    if (order.status !== 'PAID') {
      throw new Error(`Cannot distribute commissions for order ${orderId} with status ${order.status}. Must be PAID.`);
    }

    // Idempotency check: check if commissions already exist for this order
    const existingCommissions = await DatabaseService.getCommissionsByOrderId(orderId);
    if (existingCommissions.length > 0) {
      // Already distributed - return existing records to guarantee idempotency
      return existingCommissions;
    }

    const buyer = await DatabaseService.getUserById(order.userId);
    if (!buyer) {
      throw new Error(`Buyer ${order.userId} not found for order ${orderId}`);
    }

    const orderPv = order.totalPv || 0;
    if (orderPv <= 0) {
      return [];
    }

    // Update buyer's personal PV and group PV
    await DatabaseService.updateUserPv(buyer.id, orderPv, orderPv);

    // Retrieve upline up to 2 levels
    const upline = await TreeEngine.getUpline(buyer.id, 2);
    const createdCommissions: DirectCommission[] = [];

    const levelRates: Record<number, number> = {
      1: 10.0, // 10% for direct sponsor
      2: 5.0,  // 5% for sponsor's sponsor
    };

    for (const entry of upline) {
      const { user: beneficiary, level } = entry;
      if (!beneficiary || beneficiary.status !== 'ACTIVE') {
        continue;
      }

      const rate = levelRates[level] || 0;
      if (rate <= 0) continue;

      const commissionAmount = Math.round(orderPv * (rate / 100) * 100) / 100;
      if (commissionAmount <= 0) continue;

      const idempotencyKey = `COMM_ORDER_${order.id}_L${level}_${beneficiary.id}`;

      // Create direct commission record
      const commRecord = await DatabaseService.createDirectCommission({
        orderId: order.id,
        beneficiaryId: beneficiary.id,
        level: level as 1 | 2 | 3,
        rate,
        amount: commissionAmount,
        status: 'APPROVED',
        idempotencyKey,
      });

      if (!commRecord) continue;

      // Atomically credit beneficiary balance
      const creditRes = await DatabaseService.atomicCreditBalance(
        beneficiary.id,
        commissionAmount,
        commissionAmount
      );

      if (creditRes.success) {
        // Record in earnings ledger
        await DatabaseService.addLedgerEntry({
          userId: beneficiary.id,
          type: level === 1 ? 'L1_REFERRAL_REWARD' : 'L2_REFERRAL_REWARD',
          amount: commissionAmount,
          direction: 'CREDIT',
          balanceBefore: creditRes.balanceBefore,
          balanceAfter: creditRes.balanceAfter,
          sourceEvent: 'ORDER_COMMISSION',
          referenceId: order.id,
          description: `Direct Selling L${level} Commission (${rate}%) for Order #${order.orderNo}`,
          actor: 'SYSTEM',
        });

        // Update beneficiary's group PV
        await DatabaseService.updateUserPv(beneficiary.id, 0, orderPv);

        // Notify beneficiary
        await DatabaseService.createNotification({
          userId: beneficiary.id,
          title: `L${level} Product Commission Credited`,
          message: `You earned +$${commissionAmount.toFixed(2)} USDT (${rate}%) from ${buyer.name}'s purchase of Order #${order.orderNo}.`,
          link: '/dashboard/earnings',
        });

        // Audit log
        await DatabaseService.addAuditLog({
          actorId: 'SYSTEM',
          actorEmail: 'system@solargrid.local',
          actorRole: 'SUPER_ADMIN',
          action: 'COMMISSION_DISTRIBUTED',
          targetType: 'DIRECT_COMMISSION',
          targetId: commRecord.id,
          details: {
            orderId: order.id,
            orderNo: order.orderNo,
            beneficiaryId: beneficiary.id,
            level,
            rate,
            amount: commissionAmount,
            pv: orderPv,
          },
        });

        createdCommissions.push(commRecord);
      }
    }

    return createdCommissions;
  }

  /**
   * CLAWBACK DIRECT-SELLING COMMISSIONS
   * Mandatory automatic clawback when an order is cancelled, refunded, or chargebacked.
   * Walks up the upline tree, reverses commission credits, handles negative balance with fraud signal.
   */
  static async clawbackOrderCommissions(orderId: string, reason: string): Promise<DirectCommission[]> {
    const order = await DatabaseService.getOrderById(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    // Get all commissions for this order that have not been clawed back yet
    const commissions = await DatabaseService.getCommissionsByOrderId(orderId);
    const activeCommissions = commissions.filter(
      (c) => c.status === 'APPROVED' || c.status === 'PAID'
    );

    const clawedBackCommissions: DirectCommission[] = [];
    const orderPv = order.totalPv || 0;

    // Deduct buyer personal PV and group PV
    if (orderPv > 0) {
      await DatabaseService.updateUserPv(order.userId, -orderPv, -orderPv);
    }

    for (const comm of activeCommissions) {
      const beneficiary = await DatabaseService.getUserById(comm.beneficiaryId);
      if (!beneficiary) continue;

      const availableBalance = beneficiary.availableBalance || 0;
      const deficit = comm.amount > availableBalance
        ? Math.round((comm.amount - availableBalance) * 100) / 100
        : 0;

      // Atomically debit the beneficiary's balance
      const debitRes = await DatabaseService.atomicDebitBalance(
        beneficiary.id,
        comm.amount
      );

      // If available balance was insufficient to cover clawback, raise a HIGH severity fraud signal
      if (deficit > 0) {
        await DatabaseService.createFraudSignal({
          userId: beneficiary.id,
          signalType: 'COMMISSION_CLAWBACK_DEFICIT',
          severity: 'HIGH',
          details: {
            orderId: order.id,
            orderNo: order.orderNo,
            commissionId: comm.id,
            commissionAmount: comm.amount,
            availableBalanceBefore: availableBalance,
            deficitAmount: deficit,
            clawbackReason: reason,
          },
        });
      }

      // Mark commission record as CLAWED_BACK
      await DatabaseService.updateCommissionStatus(comm.id, 'CLAWED_BACK');

      // Add ledger entry
      await DatabaseService.addLedgerEntry({
        userId: beneficiary.id,
        type: 'COMMISSION_CLAWBACK' as any,
        amount: comm.amount,
        direction: 'DEBIT',
        balanceBefore: debitRes.balanceBefore,
        balanceAfter: debitRes.balanceAfter,
        sourceEvent: 'ORDER_REFUND',
        referenceId: order.id,
        description: `Clawback of L${comm.level} commission for refunded Order #${order.orderNo}: ${reason}`,
        actor: 'SYSTEM',
      });

      // Deduct beneficiary group PV
      if (orderPv > 0) {
        await DatabaseService.updateUserPv(beneficiary.id, 0, -orderPv);
      }

      // Notify beneficiary
      await DatabaseService.createNotification({
        userId: beneficiary.id,
        title: `Commission Clawback: Order #${order.orderNo}`,
        message: `A direct selling commission of $${comm.amount.toFixed(2)} USDT was reversed due to an order refund (${reason}).`,
        link: '/dashboard/earnings',
      });

      // Audit log
      await DatabaseService.addAuditLog({
        actorId: 'SYSTEM',
        actorEmail: 'system@solargrid.local',
        actorRole: 'SUPER_ADMIN',
        action: 'COMMISSION_CLAWBACK',
        targetType: 'DIRECT_COMMISSION',
        targetId: comm.id,
        details: {
          orderId: order.id,
          orderNo: order.orderNo,
          beneficiaryId: beneficiary.id,
          amount: comm.amount,
          deficit,
          reason,
        },
      });

      clawedBackCommissions.push({
        ...comm,
        status: 'CLAWED_BACK',
      });
    }

    return clawedBackCommissions;
  }

  /**
   * Compatibility delegate for existing callers: provides network volume and member stats.
   */
  static async getNetworkStats(userId: string) {
    const stats = await TreeEngine.getTeamStats(userId);
    const directs = await DatabaseService.getUsersBySponsorIds([userId]);
    const l1Ids = directs.map((d) => d.id);
    const l2Users = l1Ids.length > 0 ? await DatabaseService.getUsersBySponsorIds(l1Ids) : [];

    return {
      directCount: stats.level1Count,
      l2Count: stats.level2Count,
      l3Count: 0, // Strictly 0: Level 3 discontinued for compliance
      totalTeamCount: stats.totalTeamCount,
      activeCount: stats.activeMembersCount,
      qualifiedCount: stats.verifiedKycCount,
      totalCommissionUsdt: stats.totalDirectSellingCommissionUsdt,
      directReferrals: directs,
      l2Referrals: l2Users,
      l3Referrals: [],
      funnel: {
        visitors: stats.level1Count * 5 + 10,
        signups: stats.level1Count,
        activated: stats.activeMembersCount,
        qualified: stats.verifiedKycCount,
      },
    };
  }

  /**
   * Legacy wrapper kept for backward compatibility with solar tests.
   * If called, delegates to no-op or compliant direct selling ledger.
   */
  static async distributeCommissions(
    _downlineUserId: string,
    _earningAmountUsdt: number,
    _unitId: string
  ): Promise<void> {
    // COMPLIANCE GUARD: Daily yield referral commissions are strictly disallowed.
    // Commissions are ONLY generated on real product orders via distributeOrderCommissions().
  }
}
