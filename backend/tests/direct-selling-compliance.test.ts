import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseService } from '@/backend/db';
import { TreeEngine } from '@/backend/engines/tree-engine';
import { MLMService } from '@/backend/engines/mlm-engine';
import { WithdrawalService } from '@/backend/engines/withdrawal-engine';
import { RiskScorer } from '@/backend/ml/risk-scorer';
import { FraudDetector } from '@/backend/ml/fraud-detector';
import { ChurnPredictor } from '@/backend/ml/churn-predictor';

describe('SolarGrid Direct-Selling & Regulatory Compliance Test Suite', () => {
  const rootSponsorId = '11111111-0000-4000-a000-000000000001';
  const l1SponsorId = '11111111-0000-4000-a000-000000000002';
  const l2SponsorId = '11111111-0000-4000-a000-000000000003';
  const buyerId = '11111111-0000-4000-a000-000000000004';
  const l3AncestorId = '11111111-0000-4000-a000-000000000005';

  beforeEach(async () => {
    // Setup test users in chain:
    // l3Ancestor -> rootSponsor -> l1Sponsor -> buyer
    await DatabaseService.createUser({
      id: l3AncestorId,
      name: 'Ancestor Great-Grand-Sponsor',
      email: 'ancestor@solargrid.test',
      role: 'USER',
      status: 'ACTIVE',
      referralCode: 'ANCESTOR01',
      availableBalance: 100,
      kycStatus: 'VERIFIED',
    });

    await DatabaseService.createUser({
      id: rootSponsorId,
      name: 'Grand-Sponsor Level 2',
      email: 'grandsponsor@solargrid.test',
      role: 'USER',
      status: 'ACTIVE',
      referralCode: 'ROOTSPONSOR01',
      sponsorId: l3AncestorId,
      availableBalance: 200,
      kycStatus: 'VERIFIED',
    });

    await DatabaseService.createUser({
      id: l1SponsorId,
      name: 'Direct Sponsor Level 1',
      email: 'directsponsor@solargrid.test',
      role: 'USER',
      status: 'ACTIVE',
      referralCode: 'L1SPONSOR01',
      sponsorId: rootSponsorId,
      availableBalance: 100,
      kycStatus: 'VERIFIED',
    });

    await DatabaseService.createUser({
      id: buyerId,
      name: 'Retail Customer & Distributor',
      email: 'buyer@solargrid.test',
      role: 'USER',
      status: 'ACTIVE',
      referralCode: 'BUYER01',
      sponsorId: l1SponsorId,
      availableBalance: 50,
      kycStatus: 'UNVERIFIED',
    });
  });

  describe('Tree Engine & Cycle Prevention', () => {
    it('traverses upline strictly up to maximum 2 levels depth', async () => {
      const upline = await TreeEngine.getUpline(buyerId, 2);

      expect(upline).toHaveLength(2);
      expect(upline[0].level).toBe(1);
      expect(upline[0].user.id).toBe(l1SponsorId);
      expect(upline[1].level).toBe(2);
      expect(upline[1].user.id).toBe(rootSponsorId);

      // Verify level 3 ancestor is NEVER returned in the upline payout chain
      const hasAncestor = upline.some((u) => u.user.id === l3AncestorId);
      expect(hasAncestor).toBe(false);
    });

    it('detects and prevents circular referral sponsor loops', async () => {
      // Trying to make buyer sponsor their direct sponsor l1 should be blocked!
      const canMakeL1ChildOfBuyer = await TreeEngine.preventCycle(l1SponsorId, buyerId);
      expect(canMakeL1ChildOfBuyer).toBe(false);

      // Trying to make rootSponsor child of buyer should also be blocked (multi-hop cycle)
      const canMakeRootChildOfBuyer = await TreeEngine.preventCycle(rootSponsorId, buyerId);
      expect(canMakeRootChildOfBuyer).toBe(false);

      // Self-sponsoring should be blocked
      const canSponsorSelf = await TreeEngine.preventCycle(buyerId, buyerId);
      expect(canSponsorSelf).toBe(false);

      // Valid new sponsor outside branch should be allowed
      const validNew = await TreeEngine.preventCycle('user-new-unrelated', rootSponsorId);
      expect(validNew).toBe(true);
    });
  });

  describe('Real Product Commissions & Mandatory Clawback Engine', () => {
    it('distributes commissions strictly on PAID real product orders up to 2 levels', async () => {
      // 1. Create a real solar hardware product
      const product = await DatabaseService.createProduct({
        sku: 'PANEL-500W-BI',
        name: '500W Bifacial Monocrystalline Solar Panel',
        description: 'High-efficiency bifacial panel for residential installations',
        retailPrice: 250.0,
        commissionableValue: 200.0, // 200 PV
        category: 'Solar Equipment',
      });
      expect(product).not.toBeNull();

      // 2. Create customer order for 2 panels (Total: $500, Total PV: 400)
      const orderRes = await DatabaseService.createOrder({
        userId: buyerId,
        items: [{ productId: product!.id, qty: 2 }],
      });
      expect(orderRes.success).toBe(true);
      const order = orderRes.order!;
      expect(order.totalAmount).toBe(500);
      expect(order.totalPv).toBe(400);

      // Order initially PENDING
      expect(order.status).toBe('PENDING');

      // Attempting commission distribution before payment should throw error
      await expect(MLMService.distributeOrderCommissions(order.id)).rejects.toThrow();

      // Mark order PAID via gateway
      await DatabaseService.updateOrderStatus(order.id, 'PAID', 'tx_test_gateway_9988');

      // Record baseline balances
      const l1Before = (await DatabaseService.getUserById(l1SponsorId))?.availableBalance || 0;
      const rootBefore = (await DatabaseService.getUserById(rootSponsorId))?.availableBalance || 0;
      const ancestorBefore = (await DatabaseService.getUserById(l3AncestorId))?.availableBalance || 0;

      // Distribute commissions
      const commissions = await MLMService.distributeOrderCommissions(order.id);

      // Exactly 2 commissions distributed
      expect(commissions).toHaveLength(2);

      // Level 1: 10% of 400 PV = 40 USDT
      const l1Comm = commissions.find((c) => c.level === 1);
      expect(l1Comm).toBeDefined();
      expect(l1Comm!.beneficiaryId).toBe(l1SponsorId);
      expect(l1Comm!.rate).toBe(10.0);
      expect(l1Comm!.amount).toBe(40.0);

      // Level 2: 5% of 400 PV = 20 USDT
      const l2Comm = commissions.find((c) => c.level === 2);
      expect(l2Comm).toBeDefined();
      expect(l2Comm!.beneficiaryId).toBe(rootSponsorId);
      expect(l2Comm!.rate).toBe(5.0);
      expect(l2Comm!.amount).toBe(20.0);

      // Verify balances were credited atomically
      const l1After = (await DatabaseService.getUserById(l1SponsorId))?.availableBalance || 0;
      const rootAfter = (await DatabaseService.getUserById(rootSponsorId))?.availableBalance || 0;
      const ancestorAfter = (await DatabaseService.getUserById(l3AncestorId))?.availableBalance || 0;

      expect(l1After).toBe(l1Before + 40.0);
      expect(rootAfter).toBe(rootBefore + 20.0);
      expect(ancestorAfter).toBe(ancestorBefore); // Level 3 received 0 USDT

      // Verify buyer personal PV was updated
      const updatedBuyer = await DatabaseService.getUserById(buyerId);
      expect(updatedBuyer?.personalPv).toBe(400);

      // Idempotency test: calling distribute again on same order returns existing commissions without double-crediting
      const idempotencyComms = await MLMService.distributeOrderCommissions(order.id);
      expect(idempotencyComms).toHaveLength(2);
      const l1AfterIdempotency = (await DatabaseService.getUserById(l1SponsorId))?.availableBalance || 0;
      expect(l1AfterIdempotency).toBe(l1After); // No double-credit!
    });

    it('executes mandatory commission clawback on order refund and raises fraud signal on deficit', async () => {
      // 1. Create product and order
      const prod = await DatabaseService.createProduct({
        sku: 'INV-MICRO-1000',
        name: '1000W Smart Micro-Inverter',
        description: 'Direct grid-tie inverter',
        retailPrice: 200,
        commissionableValue: 200,
      });

      const orderRes = await DatabaseService.createOrder({
        userId: buyerId,
        items: [{ productId: prod!.id, qty: 1 }],
      });
      const order = orderRes.order!;
      await DatabaseService.updateOrderStatus(order.id, 'PAID', 'tx_gw_test_1234');

      // Distribute: L1 gets 10% ($20), Root gets 5% ($10)
      await MLMService.distributeOrderCommissions(order.id);

      const l1UserBefore = await DatabaseService.getUserById(l1SponsorId);
      expect(l1UserBefore?.availableBalance).toBeGreaterThanOrEqual(20);

      // Set l1Sponsor available balance to 5 USDT (simulating user already withdrew part of commission)
      await DatabaseService.updateUser(l1SponsorId, { availableBalance: 5 });

      // Execute Clawback due to order cancellation
      const clawbacks = await MLMService.clawbackOrderCommissions(order.id, 'Customer returned inverter');

      expect(clawbacks).toHaveLength(2);
      expect(clawbacks.every((c) => c.status === 'CLAWED_BACK')).toBe(true);

      // L1 had only $5 available but owed $20 -> deficit of $15
      // Verify a HIGH severity fraud signal was generated for compliance tracking
      const fraudSignals = await DatabaseService.getAllFraudSignals(l1SponsorId);
      const deficitSignal = fraudSignals.find((f) => f.signalType === 'COMMISSION_CLAWBACK_DEFICIT');

      expect(deficitSignal).toBeDefined();
      expect(deficitSignal?.severity).toBe('HIGH');
      expect(deficitSignal?.details.deficitAmount).toBe(15);
    });
  });

  describe('Financial KYC & Payout Gate', () => {
    it('blocks withdrawal requests if user KYC is unverified', async () => {
      // Buyer has UNVERIFIED KYC
      const unverifiedBuyer = await DatabaseService.getUserById(buyerId);
      expect(unverifiedBuyer?.kycStatus).toBe('UNVERIFIED');

      const wdrResult = await WithdrawalService.requestWithdrawal(
        buyerId,
        25,
        'TRX_DESTINATION_ADDRESS_1234567890'
      );

      expect(wdrResult.success).toBe(false);
      expect(wdrResult.message).toContain('KYC_REQUIRED');
    });

    it('allows withdrawal requests once user KYC is VERIFIED with a verified payout destination', async () => {
      // Setup verified user
      const verifiedUserId = '11111111-0000-4000-a000-000000000007';
      await DatabaseService.createUser({
        id: verifiedUserId,
        name: 'Compliant Distributor',
        email: 'compliant@solargrid.test',
        role: 'USER',
        status: 'ACTIVE',
        referralCode: 'COMPLIANT01',
        availableBalance: 250,
        kycStatus: 'VERIFIED',
      });

      // Add verified payout method
      const method = await DatabaseService.createPayoutMethod({
        userId: verifiedUserId,
        type: 'USDT_TRC20',
        details: { walletAddress: 'TRX_VERIFIED_WALLET_123456789' },
      });
      await DatabaseService.verifyPayoutMethod(method!.id);

      const wdrResult = await WithdrawalService.requestWithdrawal(
        verifiedUserId,
        50,
        'TRX_VERIFIED_WALLET_123456789'
      );

      expect(wdrResult.success).toBe(true);
      expect(wdrResult.request).toBeDefined();
      expect(wdrResult.request?.amountUsdt).toBe(50);
    });
  });

  describe('ML Risk Scoring & Fraud Heuristics', () => {
    it('calculates elevated risk score for unverified/new accounts', async () => {
      // Create a test withdrawal request for unverified buyer
      const wdr = await DatabaseService.createWithdrawal({
        userId: buyerId,
        userName: 'Buyer',
        userEmail: 'buyer@solargrid.test',
        amountUsdt: 1200,
        feePercent: 10,
        feeAmountUsdt: 120,
        netAmountUsdt: 1080,
        walletAddress: 'TRX_WALLET_TEST',
        network: 'USDT-TRC20',
      });

      const assessment = await RiskScorer.assessWithdrawal(wdr.id);

      expect(assessment.score).toBeGreaterThanOrEqual(50); // KYC factor adds 50
      expect(assessment.riskLevel).not.toBe('LOW');
      expect(assessment.factors.some((f) => f.includes('KYC'))).toBe(true);
    });

    it('predicts distributor churn based on activity recency', async () => {
      const churn = await ChurnPredictor.predictUserChurn(buyerId);

      expect(churn.userId).toBe(buyerId);
      expect(churn.churnProbability).toBeGreaterThan(0);
      expect(churn.recommendations.length).toBeGreaterThan(0);
    });
  });
});
