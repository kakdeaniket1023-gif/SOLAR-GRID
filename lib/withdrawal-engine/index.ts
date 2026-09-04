import { SupabaseDatabaseService } from '@/lib/supabase/db';
import { WithdrawalRequest } from '@/types';

export class WithdrawalService {
  static async calculateFee(
    userId: string,
    amountUsdt: number,
    planCode: string = 'P1'
  ): Promise<{ feePercent: number; feeAmountUsdt: number; netAmountUsdt: number }> {
    const plan = await SupabaseDatabaseService.getPlanByCode(planCode);
    const feePercent = plan?.withdrawalFeePercent !== undefined ? plan.withdrawalFeePercent : 10;
    const feeAmountUsdt = Math.round(((amountUsdt * feePercent) / 100) * 10000) / 10000;
    const netAmountUsdt = Math.round((amountUsdt - feeAmountUsdt) * 10000) / 10000;

    return {
      feePercent,
      feeAmountUsdt,
      netAmountUsdt,
    };
  }

  static async requestWithdrawal(
    userId: string,
    amountUsdt: number,
    walletAddress: string,
    network: string = 'USDT-TRC20'
  ): Promise<{ success: boolean; message: string; request?: WithdrawalRequest }> {
    const user = await SupabaseDatabaseService.getUserById(userId);
    if (!user) {
      return { success: false, message: 'User account not found' };
    }

    if (amountUsdt < 10) {
      return { success: false, message: 'Minimum withdrawal amount is 10 USDT' };
    }

    if (user.availableBalance < amountUsdt) {
      return {
        success: false,
        message: `Insufficient balance. Available: $${user.availableBalance.toFixed(2)} USDT, Requested: $${amountUsdt.toFixed(2)} USDT`,
      };
    }

    if (!walletAddress || walletAddress.trim().length < 10) {
      return { success: false, message: 'Valid recipient wallet address is required' };
    }

    const userUnits = await SupabaseDatabaseService.getUnits(user.id);
    const activeUnit = userUnits.find((u) => u.status === 'ACTIVE');
    const planCode = activeUnit?.planCode || 'P1';

    const { feePercent, feeAmountUsdt, netAmountUsdt } = await this.calculateFee(
      user.id,
      amountUsdt,
      planCode
    );

    // Atomically debit balance
    const debitRes = await SupabaseDatabaseService.atomicDebitBalance(user.id, amountUsdt);
    if (!debitRes.success) {
      return {
        success: false,
        message: debitRes.message || 'Insufficient available balance.',
      };
    }

    const withdrawalId = `wdr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const request = await SupabaseDatabaseService.createWithdrawal({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      amountUsdt,
      feePercent,
      feeAmountUsdt,
      netAmountUsdt,
      walletAddress,
      network,
    });

    // Write ledger entry with exact pre/post balances from atomic debit
    await SupabaseDatabaseService.addLedgerEntry({
      userId: user.id,
      idempotencyKey: `WDR-REQ-${request.id}`,
      type: 'WITHDRAWAL',
      amount: amountUsdt,
      direction: 'DEBIT',
      balanceBefore: debitRes.balanceBefore,
      balanceAfter: debitRes.balanceAfter,
      sourceEvent: 'WITHDRAWAL_REQUEST',
      referenceId: request.id,
      description: `Withdrawal Request #${withdrawalId.substring(0, 8)} to ${walletAddress.substring(0, 8)}... (${network}) [Fee: ${feePercent}%]`,
      actor: user.name,
    });

    await SupabaseDatabaseService.createNotification({
      userId: user.id,
      title: 'Withdrawal Submitted',
      message: `Your withdrawal request for ${amountUsdt.toFixed(2)} USDT (${netAmountUsdt.toFixed(2)} USDT net) is pending admin approval.`,
      link: '/dashboard/records/withdrawals',
    });

    return {
      success: true,
      message: `Withdrawal request for ${amountUsdt.toFixed(2)} USDT submitted successfully.`,
      request,
    };
  }

  static async processAdminAction(
    withdrawalId: string,
    action: 'APPROVE' | 'PROCESS' | 'COMPLETE' | 'REJECT',
    reviewerId: string,
    reviewerName: string,
    txHash?: string,
    adminNotes?: string
  ): Promise<{ success: boolean; message: string; request?: WithdrawalRequest }> {
    const request = await SupabaseDatabaseService.getWithdrawalById(withdrawalId);
    if (!request) return { success: false, message: 'Withdrawal request not found' };

    const previousStatus = request.status;

    // Strict State Machine Verification
    if (action === 'REJECT') {
      if (previousStatus === 'REJECTED' || previousStatus === 'COMPLETED') {
        return {
          success: false,
          message: `Illegal transition: Cannot reject withdrawal with status ${previousStatus}.`,
        };
      }

      // Refund balance ONCE atomically
      const creditRes = await SupabaseDatabaseService.atomicCreditBalance(request.userId, request.amountUsdt);
      if (creditRes.success) {
        await SupabaseDatabaseService.addLedgerEntry({
          userId: request.userId,
          idempotencyKey: `REFUND-${request.id}`,
          type: 'ADJUSTMENT',
          amount: request.amountUsdt,
          direction: 'CREDIT',
          balanceBefore: creditRes.balanceBefore,
          balanceAfter: creditRes.balanceAfter,
          sourceEvent: 'WITHDRAWAL_REJECTED',
          referenceId: request.id,
          description: `Withdrawal Refund #${request.id}: Rejected by Admin (${adminNotes || 'No notes provided'})`,
          actor: reviewerName,
        });
      }

      const updated = await SupabaseDatabaseService.updateWithdrawal(withdrawalId, {
        status: 'REJECTED',
        reviewerId,
        reviewerName,
        reviewedAt: new Date().toISOString(),
        adminNotes,
        rejectionReason: adminNotes,
      });

      return { success: true, message: 'Withdrawal rejected and funds refunded to user.', request: updated || undefined };
    }

    if (action === 'COMPLETE') {
      if (previousStatus === 'REJECTED') {
        return { success: false, message: 'Cannot complete a rejected withdrawal.' };
      }
      if (!txHash && !request.txHash) {
        return { success: false, message: 'Blockchain transaction hash is required to complete withdrawal.' };
      }
      const updated = await SupabaseDatabaseService.updateWithdrawal(withdrawalId, {
        status: 'COMPLETED',
        txHash: txHash || request.txHash,
        reviewerId,
        reviewerName,
        reviewedAt: new Date().toISOString(),
        adminNotes,
      });
      return { success: true, message: 'Withdrawal completed successfully.', request: updated || undefined };
    }

    if (action === 'APPROVE') {
      if (previousStatus === 'REJECTED' || previousStatus === 'COMPLETED') {
        return { success: false, message: `Cannot approve withdrawal with status ${previousStatus}.` };
      }
      const updated = await SupabaseDatabaseService.updateWithdrawal(withdrawalId, {
        status: 'APPROVED',
        reviewerId,
        reviewerName,
        reviewedAt: new Date().toISOString(),
        adminNotes,
      });
      return { success: true, message: 'Withdrawal approved.', request: updated || undefined };
    }

    if (action === 'PROCESS') {
      const updated = await SupabaseDatabaseService.updateWithdrawal(withdrawalId, {
        status: 'PROCESSING',
        reviewerId,
        reviewerName,
        reviewedAt: new Date().toISOString(),
        adminNotes,
      });
      return { success: true, message: 'Withdrawal set to processing.', request: updated || undefined };
    }

    return { success: false, message: 'Unknown action' };
  }
}
