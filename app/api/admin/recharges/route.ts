import { NextRequest, NextResponse } from 'next/server';
import { SupabaseDatabaseService } from '@/lib/supabase/db';
import { requireSuperAdmin } from '@/lib/auth/guards';

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (!auth.authorized || !auth.user) {
    return auth.errorResponse || NextResponse.json(
      { success: false, error: 'FORBIDDEN', message: '403 Forbidden: Super Administrator access required' },
      { status: 403 }
    );
  }

  try {
    const recharges = await SupabaseDatabaseService.getAllRecharges();
    return NextResponse.json({ success: true, recharges });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: 'Failed to fetch recharges' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (!auth.authorized || !auth.user) {
    return auth.errorResponse || NextResponse.json(
      { success: false, error: 'FORBIDDEN', message: '403 Forbidden: Super Administrator access required' },
      { status: 403 }
    );
  }

  try {
    const { rechargeId, action, adminNotes } = await request.json().catch(() => ({}));

    if (!rechargeId || !action) {
      return NextResponse.json({ success: false, message: 'rechargeId and action are required' }, { status: 400 });
    }

    const recharge = await SupabaseDatabaseService.getRechargeById(rechargeId);
    if (!recharge) {
      return NextResponse.json({ success: false, message: 'Recharge record not found' }, { status: 404 });
    }

    if (recharge.status === 'APPROVED' || recharge.status === 'COMPLETED') {
      return NextResponse.json({ success: false, message: 'Recharge is already approved and credited.' }, { status: 400 });
    }
    if (recharge.status === 'REJECTED') {
      return NextResponse.json({ success: false, message: 'Recharge is already rejected.' }, { status: 400 });
    }

    if (action === 'APPROVE') {
      // Atomic status transition from PENDING -> APPROVED to prevent race conditions
      const updated = await SupabaseDatabaseService.transitionRechargeStatus(
        recharge.id,
        'PENDING',
        'APPROVED',
        {
          reviewerId: auth.user.id,
          reviewerName: auth.user.name,
          reviewedAt: new Date().toISOString(),
          adminNotes: adminNotes || 'Approved by administrator',
        }
      );

      if (!updated) {
        return NextResponse.json(
          { success: false, message: 'Recharge request was already processed or is no longer pending.' },
          { status: 409 }
        );
      }

      const creditRes = await SupabaseDatabaseService.atomicCreditBalance(
        recharge.userId,
        recharge.amountUsdt
      );

      if (!creditRes.success) {
        // Rollback status to PENDING if balance credit fails
        await SupabaseDatabaseService.updateRecharge(recharge.id, {
          status: 'PENDING',
          adminNotes: `Approval balance credit failed: ${creditRes.message}`,
        });
        return NextResponse.json(
          { success: false, message: creditRes.message || 'Failed to credit user balance.' },
          { status: 500 }
        );
      }

      await SupabaseDatabaseService.addLedgerEntry({
        userId: recharge.userId,
        type: 'RECHARGE',
        amount: recharge.amountUsdt,
        direction: 'CREDIT',
        balanceBefore: creditRes.balanceBefore,
        balanceAfter: creditRes.balanceAfter,
        sourceEvent: 'RECHARGE_APPROVED',
        referenceId: recharge.id,
        description: `Deposit Approval: +${recharge.amountUsdt.toFixed(2)} USDT via ${recharge.currency || 'USDT-TRC20'}`,
        actor: auth.user.name,
      });

      await SupabaseDatabaseService.createNotification({
        userId: recharge.userId,
        title: 'Recharge Approved',
        message: `Your recharge deposit of ${recharge.amountUsdt.toFixed(2)} USDT has been approved and credited to your balance.`,
        type: 'SUCCESS',
        link: '/dashboard',
      });

      return NextResponse.json({
        success: true,
        message: `Recharge #${recharge.id} approved and ${recharge.amountUsdt.toFixed(2)} USDT credited.`,
        record: updated,
      });
    }

    if (action === 'REJECT') {
      // Atomic status transition from PENDING -> REJECTED
      const updated = await SupabaseDatabaseService.transitionRechargeStatus(
        recharge.id,
        'PENDING',
        'REJECTED',
        {
          reviewerId: auth.user.id,
          reviewerName: auth.user.name,
          reviewedAt: new Date().toISOString(),
          adminNotes: adminNotes || 'Rejected by administrator',
        }
      );

      if (!updated) {
        return NextResponse.json(
          { success: false, message: 'Recharge request was already processed or is no longer pending.' },
          { status: 409 }
        );
      }

      await SupabaseDatabaseService.createNotification({
        userId: recharge.userId,
        title: 'Recharge Rejected',
        message: `Your recharge deposit of ${recharge.amountUsdt.toFixed(2)} USDT was rejected: ${adminNotes || 'Invalid transaction reference'}.`,
        type: 'ALERT',
        link: '/dashboard/recharge',
      });

      return NextResponse.json({
        success: true,
        message: `Recharge #${recharge.id} rejected.`,
        record: updated,
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: 'Failed to process recharge' }, { status: 500 });
  }
}
