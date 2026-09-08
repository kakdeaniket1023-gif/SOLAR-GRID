import { Router, Response } from 'express';
import { requireSuperAdmin, AuthenticatedRequest } from '@/backend/auth/guards';
import { DatabaseService } from '@/backend/db';
import { MLMService } from '@/backend/engines/mlm-engine';
import { WithdrawalService } from '@/backend/engines/withdrawal-engine';
import { FraudDetector } from '@/backend/ml/fraud-detector';

const router = Router();

// Protect ALL admin routes with requireSuperAdmin middleware
router.use(requireSuperAdmin);

/**
 * GET /api/admin/stats
 */
router.get('/stats', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const [users, units, ledger, recharges, withdrawals, commissions, auditLogs] = await Promise.all([
      DatabaseService.getAllUsers(),
      DatabaseService.getAllUnits(),
      DatabaseService.getAllLedger(),
      DatabaseService.getAllRecharges(),
      DatabaseService.getAllWithdrawals(),
      DatabaseService.getAllDirectCommissions(),
      DatabaseService.getAuditLogs(),
    ]);

    const activeUsers = users.filter((u) => u.status === 'ACTIVE').length;
    const activeUnits = units.filter((u) => u.status === 'ACTIVE').length;

    const totalNetworkInvestment = units.reduce((sum, u) => sum + (u.purchasePriceUsdt || 0), 0);

    const activeComms = commissions.filter((c) => c.status === 'APPROVED' || c.status === 'PAID');
    const totalCommissionsPaid = activeComms.reduce((sum, c) => sum + (c.amount || 0), 0);
    const l1CommissionsPaid = activeComms.filter((c) => c.level === 1).reduce((sum, c) => sum + (c.amount || 0), 0);
    const l2CommissionsPaid = activeComms.filter((c) => c.level === 2).reduce((sum, c) => sum + (c.amount || 0), 0);
    const l3CommissionsPaid = activeComms.filter((c) => c.level === 3).reduce((sum, c) => sum + (c.amount || 0), 0);

    const dailyEarningsDisbursed = ledger
      .filter((l) => l.type === 'DAILY_SOLAR_EARNING' || l.sourceEvent === 'DAILY_RECEIVE')
      .reduce((sum, l) => sum + (l.amountUsdt || l.amount || 0), 0);

    const pendingRecharges = recharges.filter((r) => r.status === 'PENDING').length;
    const pendingRechargeVolume = recharges
      .filter((r) => r.status === 'PENDING')
      .reduce((sum, r) => sum + (r.amountUsdt || 0), 0);
    const totalRechargeVolume = recharges
      .filter((r) => r.status === 'APPROVED')
      .reduce((sum, r) => sum + (r.amountUsdt || 0), 0);

    const pendingWithdrawals = withdrawals.filter((w) => w.status === 'PENDING').length;
    const pendingWithdrawalVolume = withdrawals
      .filter((w) => w.status === 'PENDING')
      .reduce((sum, w) => sum + (w.amountUsdt || w.amount || 0), 0);
    const totalDisbursedVolume = withdrawals
      .filter((w) => w.status === 'COMPLETED')
      .reduce((sum, w) => sum + (w.netAmountUsdt || w.amountUsdt || w.amount || 0), 0);

    const totalPointsInCirculation = users.reduce((sum, u) => sum + (u.points || 0), 0);

    const planDistribution = {
      P1: units.filter((u) => u.planCode === 'P1').length,
      P2: units.filter((u) => u.planCode === 'P2').length,
      P3: units.filter((u) => u.planCode === 'P3').length,
      P4: units.filter((u) => u.planCode === 'P4').length,
      P5: units.filter((u) => u.planCode === 'P5').length,
      P6: units.filter((u) => u.planCode === 'P6').length,
    };

    const directsCountMap = new Map<string, number>();
    for (const u of users) {
      if (u.sponsorId) {
        directsCountMap.set(u.sponsorId, (directsCountMap.get(u.sponsorId) || 0) + 1);
      }
    }

    const topLeaders = users
      .filter((u) => u.role !== 'SUPER_ADMIN')
      .map((u) => {
        const userUnits = units.filter((unit) => unit.userId === u.id);
        const personalVol = userUnits.reduce((s, unit) => s + (unit.purchasePriceUsdt || 0), 0);
        const userComms = activeComms.filter((c) => c.beneficiaryId === u.id).reduce((s, c) => s + c.amount, 0);

        return {
          id: u.id,
          name: u.name,
          email: u.email,
          referralCode: u.referralCode,
          leadershipLevel: u.leadershipLevel,
          directsCount: directsCountMap.get(u.id) || 0,
          personalVolume: personalVol,
          commissionsEarned: Math.round(userComms * 100) / 100,
          points: u.points,
        };
      })
      .sort((a, b) => b.directsCount - a.directsCount || b.commissionsEarned - a.commissionsEarned)
      .slice(0, 6);

    const recentComms = commissions.slice(0, 5).map((c) => ({
      id: c.id,
      type: 'COMMISSION',
      title: `L${c.level} Commission (+${c.amount} USDT)`,
      description: `${c.beneficiaryName || 'Beneficiary'} earned from ${c.buyerName || 'downline member'}`,
      timestamp: c.createdAt,
    }));

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers: users.length,
        activeUsers,
        activeUnits,
        totalNetworkInvestment: Math.round(totalNetworkInvestment * 100) / 100,
        totalCommissionsPaid: Math.round(totalCommissionsPaid * 100) / 100,
        l1CommissionsPaid: Math.round(l1CommissionsPaid * 100) / 100,
        l2CommissionsPaid: Math.round(l2CommissionsPaid * 100) / 100,
        l3CommissionsPaid: Math.round(l3CommissionsPaid * 100) / 100,
        dailyEarningsDisbursed: Math.round(dailyEarningsDisbursed * 100) / 100,
        pendingRecharges,
        pendingRechargeVolume: Math.round(pendingRechargeVolume * 100) / 100,
        totalRechargeVolume: Math.round(totalRechargeVolume * 100) / 100,
        pendingWithdrawals,
        pendingWithdrawalVolume: Math.round(pendingWithdrawalVolume * 100) / 100,
        totalDisbursedVolume: Math.round(totalDisbursedVolume * 100) / 100,
        totalPointsInCirculation,
        openTickets: 0,
        planDistribution,
        topLeaders,
        recentActivity: recentComms,
      },
      auditLogs: auditLogs.slice(0, 10),
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch admin stats' });
  }
});

/**
 * GET /api/admin/users
 */
router.get('/users', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.query.id as string | undefined;

    if (id) {
      const user = await DatabaseService.getUserById(id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const [units, recharges, withdrawals, ledger, auditLogs, networkStats] = await Promise.all([
        DatabaseService.getUnits(id),
        DatabaseService.getRecharges(id),
        DatabaseService.getWithdrawals(id),
        DatabaseService.getLedger(id),
        DatabaseService.getAuditLogs().then((logs) => logs.filter((a) => a.targetId === id || a.actorId === id)),
        MLMService.getNetworkStats(id),
      ]);

      return res.status(200).json({
        success: true,
        user,
        units,
        recharges,
        withdrawals,
        ledger,
        auditLogs,
        networkStats,
      });
    }

    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt((req.query.limit as string) || '50', 10)));
    const offset = (page - 1) * limit;

    const allUsers = await DatabaseService.getAllUsers();
    const total = allUsers.length;

    const directsMap = new Map<string, number>();
    for (const u of allUsers) {
      if (u.sponsorId) {
        directsMap.set(u.sponsorId, (directsMap.get(u.sponsorId) || 0) + 1);
      }
    }

    const userMap = new Map<string, typeof allUsers[0]>();
    for (const u of allUsers) {
      userMap.set(u.id, u);
    }

    const enrichedUsers = allUsers.map((u) => {
      const sponsor = u.sponsorId ? userMap.get(u.sponsorId) : null;
      return {
        ...u,
        directsCount: directsMap.get(u.id) || 0,
        sponsorName: sponsor ? sponsor.name : 'Genesis (None)',
        sponsorCode: sponsor ? sponsor.referralCode : null,
      };
    });

    const paginatedUsers = enrichedUsers.slice(offset, offset + limit);

    return res.status(200).json({
      success: true,
      users: paginatedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

/**
 * POST /api/admin/users (Update status)
 */
router.post('/users', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const admin = req.user!;
    const { userId, status, reason } = req.body || {};
    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }

    const ALLOWED_STATUSES = ['ACTIVE', 'PENDING', 'SUSPENDED', 'BANNED'];
    if (status && !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: ${ALLOWED_STATUSES.join(', ')}`,
      });
    }

    const user = await DatabaseService.getUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const updated = await DatabaseService.updateUser(userId, {
      status: status || user.status,
    });

    await DatabaseService.addAuditLog({
      actorId: admin.id,
      actorEmail: admin.email,
      actorRole: 'SUPER_ADMIN',
      action: 'UPDATE_USER_ACCOUNT',
      targetType: 'USER_ACCOUNT',
      targetId: userId,
      details: {
        oldStatus: user.status,
        newStatus: status || user.status,
        reason: reason || 'Super Admin user modification',
      },
    });

    return res.status(200).json({ success: true, user: updated, message: 'User updated successfully' });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to update user' });
  }
});

/**
 * GET /api/admin/recharges
 */
router.get('/recharges', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const recharges = await DatabaseService.getAllRecharges();
    return res.status(200).json({ success: true, recharges });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch recharges' });
  }
});

/**
 * POST /api/admin/recharges (Approve/Reject)
 */
router.post('/recharges', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const admin = req.user!;
    const { rechargeId, action, adminNotes } = req.body || {};

    if (!rechargeId || !action) {
      return res.status(400).json({ success: false, message: 'rechargeId and action are required' });
    }

    const recharge = await DatabaseService.getRechargeById(rechargeId);
    if (!recharge) {
      return res.status(404).json({ success: false, message: 'Recharge record not found' });
    }

    if (recharge.status === 'APPROVED' || recharge.status === 'COMPLETED') {
      return res.status(400).json({ success: false, message: 'Recharge is already approved and credited.' });
    }
    if (recharge.status === 'REJECTED') {
      return res.status(400).json({ success: false, message: 'Recharge is already rejected.' });
    }

    if (action === 'APPROVE') {
      const updated = await DatabaseService.transitionRechargeStatus(recharge.id, 'PENDING', 'APPROVED', {
        reviewerId: admin.id,
        reviewerName: admin.name,
        reviewedAt: new Date().toISOString(),
        adminNotes: adminNotes || 'Approved by administrator',
      });

      if (!updated) {
        return res.status(409).json({
          success: false,
          message: 'Recharge request was already processed or is no longer pending.',
        });
      }

      const creditRes = await DatabaseService.atomicCreditBalance(recharge.userId, recharge.amountUsdt);

      if (!creditRes.success) {
        await DatabaseService.updateRecharge(recharge.id, {
          status: 'PENDING',
          adminNotes: `Approval balance credit failed: ${creditRes.message}`,
        });
        return res.status(500).json({
          success: false,
          message: creditRes.message || 'Failed to credit user balance.',
        });
      }

      await DatabaseService.addLedgerEntry({
        userId: recharge.userId,
        type: 'RECHARGE',
        amount: recharge.amountUsdt,
        direction: 'CREDIT',
        balanceBefore: creditRes.balanceBefore,
        balanceAfter: creditRes.balanceAfter,
        sourceEvent: 'RECHARGE_APPROVED',
        referenceId: recharge.id,
        description: `Deposit Approval: +${recharge.amountUsdt.toFixed(2)} USDT via ${recharge.currency || 'USDT-TRC20'}`,
        actor: admin.name,
      });

      await DatabaseService.createNotification({
        userId: recharge.userId,
        title: 'Recharge Approved',
        message: `Your recharge deposit of ${recharge.amountUsdt.toFixed(2)} USDT has been approved and credited to your balance.`,
        type: 'SUCCESS',
        link: '/dashboard',
      });

      return res.status(200).json({
        success: true,
        message: `Recharge #${recharge.id} approved and ${recharge.amountUsdt.toFixed(2)} USDT credited.`,
        record: updated,
      });
    }

    if (action === 'REJECT') {
      const updated = await DatabaseService.transitionRechargeStatus(recharge.id, 'PENDING', 'REJECTED', {
        reviewerId: admin.id,
        reviewerName: admin.name,
        reviewedAt: new Date().toISOString(),
        adminNotes: adminNotes || 'Rejected by administrator',
      });

      if (!updated) {
        return res.status(409).json({
          success: false,
          message: 'Recharge request was already processed or is no longer pending.',
        });
      }

      await DatabaseService.createNotification({
        userId: recharge.userId,
        title: 'Recharge Rejected',
        message: `Your recharge deposit of ${recharge.amountUsdt.toFixed(2)} USDT was rejected: ${adminNotes || 'Invalid transaction reference'}.`,
        type: 'ALERT',
        link: '/dashboard/recharge',
      });

      return res.status(200).json({
        success: true,
        message: `Recharge #${recharge.id} rejected.`,
        record: updated,
      });
    }

    return res.status(400).json({ success: false, message: 'Invalid action' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to process recharge' });
  }
});

/**
 * GET /api/admin/withdrawals
 */
router.get('/withdrawals', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const all = await DatabaseService.getAllWithdrawals();
    const filtered = status && status !== 'ALL' ? all.filter((w) => w.status === status) : all;
    return res.status(200).json({ success: true, withdrawals: filtered });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch admin withdrawals' });
  }
});

/**
 * POST /api/admin/withdrawals
 */
router.post('/withdrawals', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const admin = req.user!;
    const { withdrawalId, action, txHash, adminNotes } = req.body || {};

    if (!withdrawalId || !action) {
      return res.status(400).json({ success: false, message: 'withdrawalId and action are required' });
    }

    const result = await WithdrawalService.processAdminAction(
      withdrawalId,
      action,
      admin.id,
      admin.name,
      txHash,
      adminNotes
    );

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    await DatabaseService.addAuditLog({
      actorId: admin.id,
      actorEmail: admin.email,
      actorRole: 'SUPER_ADMIN',
      action: `ADMIN_WITHDRAWAL_${action}`,
      targetType: 'WITHDRAWAL',
      targetId: withdrawalId,
      details: { action, txHash, adminNotes },
    });

    return res.status(200).json({
      success: true,
      message: result.message,
      withdrawal: result.request,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to process withdrawal action' });
  }
});

/**
 * GET /api/admin/commissions
 */
router.get('/commissions', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orderId = req.query.orderId as string | undefined;
    const beneficiaryId = req.query.beneficiaryId as string | undefined;

    if (orderId) {
      const commissions = await DatabaseService.getCommissionsByOrderId(orderId);
      return res.status(200).json({ success: true, data: commissions });
    }

    if (beneficiaryId) {
      const commissions = await DatabaseService.getCommissionsByBeneficiaryId(beneficiaryId);
      return res.status(200).json({ success: true, data: commissions });
    }

    const commissions = await DatabaseService.getAllDirectCommissions();
    return res.status(200).json({ success: true, data: commissions });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: error.message || 'Failed to fetch commissions',
    });
  }
});

/**
 * GET /api/admin/rules
 */
router.get('/rules', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const rules = await DatabaseService.getBusinessRules();
    return res.status(200).json({ success: true, rules });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch rules' });
  }
});

/**
 * POST /api/admin/rules
 */
router.post('/rules', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const admin = req.user!;
    const { key, value } = req.body || {};
    if (!key || value === undefined) {
      return res.status(400).json({ success: false, message: 'key and value are required' });
    }

    const updated = await DatabaseService.updateBusinessRule(key, value);
    if (!updated) {
      return res.status(400).json({ success: false, message: 'Failed to update rule' });
    }

    await DatabaseService.addAuditLog({
      actorId: admin.id,
      actorEmail: admin.email,
      actorRole: 'SUPER_ADMIN',
      action: 'UPDATE_BUSINESS_RULE',
      targetType: 'SYSTEM_SETTINGS',
      targetId: key,
      details: { key, newValue: value },
    });

    return res.status(200).json({ success: true, message: `Rule ${key} updated successfully` });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to update rule' });
  }
});

/**
 * GET /api/admin/fraud
 */
router.get('/fraud', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const resolvedParam = req.query.resolved as string | undefined;
    const resolved = resolvedParam !== undefined ? resolvedParam === 'true' : undefined;

    const signals = await DatabaseService.getFraudSignals(resolved);
    return res.status(200).json({ success: true, data: signals });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: error.message || 'Failed to fetch fraud signals',
    });
  }
});

/**
 * POST /api/admin/fraud
 */
router.post('/fraud', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { action, signalId } = req.body || {};

    if (action === 'SCAN') {
      const scanResult = await FraudDetector.runFullNetworkScan();
      return res.status(200).json({
        success: true,
        message: 'Full network graph fraud heuristic scan complete',
        data: scanResult,
      });
    }

    if (action === 'RESOLVE' && signalId) {
      const resolved = await DatabaseService.resolveFraudSignal(signalId);
      if (!resolved) {
        return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Fraud signal not found' });
      }
      return res.status(200).json({ success: true, message: 'Fraud signal marked as resolved' });
    }

    return res.status(400).json({ success: false, error: 'BAD_REQUEST', message: 'Invalid action. Supported: SCAN, RESOLVE' });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: error.message || 'Failed to process fraud action',
    });
  }
});

/**
 * GET /api/admin/kyc
 */
router.get('/kyc', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const status = req.query.status as any;
    const submissions = await DatabaseService.getAllKycSubmissions(status);
    return res.status(200).json({ success: true, data: submissions });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: error.message || 'Failed to fetch KYC submissions',
    });
  }
});

/**
 * POST /api/admin/kyc
 */
router.post('/kyc', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const admin = req.user!;
    const { submissionId, action, rejectionReason } = req.body || {};

    if (!submissionId || !['APPROVE', 'REJECT'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'BAD_REQUEST',
        message: 'submissionId and valid action (APPROVE or REJECT) are required',
      });
    }

    const submission = await DatabaseService.getKycSubmissionById(submissionId);
    if (!submission) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'KYC submission not found' });
    }

    const newStatus = action === 'APPROVE' ? 'VERIFIED' : 'REJECTED';
    await DatabaseService.updateKycSubmissionStatus(submissionId, newStatus, admin.id, rejectionReason);

    if (action === 'APPROVE') {
      const userPayoutMethods = await DatabaseService.getPayoutMethodsByUserId(submission.userId);
      for (const method of userPayoutMethods) {
        await DatabaseService.verifyPayoutMethod(method.id);
      }
    }

    await DatabaseService.createNotification({
      userId: submission.userId,
      title: action === 'APPROVE' ? 'KYC Verified' : 'KYC Review Update',
      message:
        action === 'APPROVE'
          ? 'Your identity verification (KYC) has been successfully verified! You may now request commission withdrawals.'
          : `Your identity verification was rejected: ${rejectionReason || 'Please resubmit valid government photo ID.'}`,
      link: '/dashboard/wallet',
    });

    await DatabaseService.addAuditLog({
      actorId: admin.id,
      actorEmail: admin.email,
      actorRole: admin.role,
      action: action === 'APPROVE' ? 'KYC_APPROVED' : 'KYC_REJECTED',
      targetType: 'KYC_SUBMISSION',
      targetId: submissionId,
      details: { userId: submission.userId, action, rejectionReason },
    });

    return res.status(200).json({
      success: true,
      message: `KYC submission ${action === 'APPROVE' ? 'approved' : 'rejected'} successfully`,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: error.message || 'Failed to review KYC submission',
    });
  }
});

/**
 * GET /api/admin/ledger
 */
router.get('/ledger', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt((req.query.limit as string) || '50', 10)));
    const offset = (page - 1) * limit;

    const allLedger = await DatabaseService.getAllLedger();
    const total = allLedger.length;
    const paginatedLedger = allLedger.slice(offset, offset + limit);

    return res.status(200).json({
      success: true,
      ledger: paginatedLedger,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch ledger' });
  }
});

/**
 * GET /api/admin/units
 */
router.get('/units', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const units = await DatabaseService.getAllUnits();
    return res.status(200).json({ success: true, units });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch units' });
  }
});

/**
 * GET /api/admin/panel-images
 */
router.get('/panel-images', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const images = await DatabaseService.getPanelImages();
    return res.status(200).json({ success: true, images });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/admin/panel-images
 */
router.post('/panel-images', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { planCode, imageUrl, caption } = req.body || {};
    if (!planCode || !imageUrl) {
      return res.status(400).json({ success: false, message: 'planCode and imageUrl are required' });
    }

    const updated = await DatabaseService.updatePanelImage(planCode, imageUrl, caption);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Panel image configuration not found' });
    }

    return res.status(200).json({ success: true, message: `Panel image for ${planCode} updated`, image: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/admin/broadcast
 */
router.post('/broadcast', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const admin = req.user!;
    const { title, message, targetAudience } = req.body || {};
    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required' });
    }

    const users = await DatabaseService.getAllUsers();
    let targetUsers = users;

    if (targetAudience === 'ACTIVE_PLAN_HOLDERS') {
      const units = await DatabaseService.getAllUnits();
      const activeUserIds = new Set(units.filter((u) => u.status === 'ACTIVE').map((u) => u.userId));
      targetUsers = users.filter((u) => activeUserIds.has(u.id));
    } else if (targetAudience === 'LEADERS_ONLY') {
      targetUsers = users.filter((u) =>
        ['SOLAR_LEADER', 'GRID_LEADER', 'ENERGY_AMBASSADOR'].includes(u.leadershipLevel)
      );
    }

    await Promise.all(
      targetUsers.map((u) =>
        DatabaseService.createNotification({
          userId: u.id,
          title,
          message,
          type: 'INFO',
          link: '/dashboard',
        })
      )
    );

    await DatabaseService.addAuditLog({
      actorId: admin.id,
      actorEmail: admin.email,
      actorRole: 'SUPER_ADMIN',
      action: 'SYSTEM_BROADCAST_DISPATCH',
      targetType: 'COMMUNICATION_HUB',
      targetId: targetAudience || 'ALL_USERS',
      details: { title, message, recipientCount: targetUsers.length },
    });

    return res.status(200).json({
      success: true,
      message: `Broadcast dispatched successfully to ${targetUsers.length} active contributor accounts.`,
      count: targetUsers.length,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to dispatch broadcast' });
  }
});

/**
 * GET /api/admin/search
 */
router.get('/search', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const q = ((req.query.q as string) || '').trim().toLowerCase();

    const [users, withdrawals, recharges] = await Promise.all([
      DatabaseService.getAllUsers(),
      DatabaseService.getAllWithdrawals(),
      DatabaseService.getAllRecharges(),
    ]);

    const filteredUsers = users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.referralCode.toLowerCase().includes(q)
    );

    const filteredWithdrawals = withdrawals.filter(
      (w) =>
        w.id.toLowerCase().includes(q) ||
        w.userName.toLowerCase().includes(q) ||
        w.walletAddress.toLowerCase().includes(q)
    );

    const filteredRecharges = recharges.filter(
      (r) =>
        r.id.toLowerCase().includes(q) ||
        r.userName.toLowerCase().includes(q) ||
        (r.txReference && r.txReference.toLowerCase().includes(q))
    );

    return res.status(200).json({
      success: true,
      results: {
        users: filteredUsers,
        withdrawals: filteredWithdrawals,
        recharges: filteredRecharges,
      },
      users: filteredUsers,
      withdrawals: filteredWithdrawals,
      recharges: filteredRecharges,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Search failed' });
  }
});

export default router;
