import { describe, it, expect } from 'vitest';
import { SolarGenerationService } from '@/lib/solar-engine';
import { SolarUpgradeService } from '@/lib/solar-engine/upgrade';
import { WithdrawalService } from '@/lib/withdrawal-engine';
import { PointsService } from '@/lib/points-engine';

describe('SolarGrid Business Logic & Calculation Engines', () => {
  it('validates working day evaluation and points performance ratios', () => {
    // Points efficiency ratios
    expect(PointsService.getEfficiencyMultiplier(75)).toBe(1.0);
    expect(PointsService.getEfficiencyMultiplier(70)).toBe(1.0);
    expect(PointsService.getEfficiencyMultiplier(69)).toBe(0.8);
    expect(PointsService.getEfficiencyMultiplier(61)).toBe(0.8);
    expect(PointsService.getEfficiencyMultiplier(60)).toBe(0.5);
    expect(PointsService.getEfficiencyMultiplier(31)).toBe(0.5);
    expect(PointsService.getEfficiencyMultiplier(30)).toBe(0.1);
    expect(PointsService.getEfficiencyMultiplier(10)).toBe(0.1);

    // Monday to Friday working day check
    const wednesday = new Date('2026-08-26T12:00:00Z'); // Wednesday
    const sunday = new Date('2026-08-23T12:00:00Z'); // Sunday
    expect(SolarGenerationService.isWorkingDay(wednesday)).toBe(true);
    expect(SolarGenerationService.isWorkingDay(sunday)).toBe(false);
  });

  it('validates straight price-difference plan upgrade calculation', async () => {
    // P1 (35) -> P2 (150) = 115 USDT top-up
    const p1ToP2 = await SolarUpgradeService.calculateUpgradeCost('P1', 'P2');
    expect(p1ToP2.isValidUpgrade).toBe(true);
    expect(p1ToP2.currentPriceUsdt).toBe(35);
    expect(p1ToP2.targetPriceUsdt).toBe(150);
    expect(p1ToP2.previousPlanCreditUsdt).toBe(35);
    expect(p1ToP2.requiredTopUpUsdt).toBe(115);

    // P2 (150) -> P3 (300) = 150 USDT top-up
    const p2ToP3 = await SolarUpgradeService.calculateUpgradeCost('P2', 'P3');
    expect(p2ToP3.isValidUpgrade).toBe(true);
    expect(p2ToP3.currentPriceUsdt).toBe(150);
    expect(p2ToP3.targetPriceUsdt).toBe(300);
    expect(p2ToP3.previousPlanCreditUsdt).toBe(150);
    expect(p2ToP3.requiredTopUpUsdt).toBe(150);

    // Invalid downgrade P3 -> P1
    const p3ToP1 = await SolarUpgradeService.calculateUpgradeCost('P3', 'P1');
    expect(p3ToP1.isValidUpgrade).toBe(false);
  });

  it('validates withdrawal fees dynamically based on plan configuration', async () => {
    // P1 = 10% default fee
    const p1Withdrawal = await WithdrawalService.calculateFee('usr-test', 100, 'P1');
    expect(p1Withdrawal.feePercent).toBe(10);
    expect(p1Withdrawal.feeAmountUsdt).toBe(10);
    expect(p1Withdrawal.netAmountUsdt).toBe(90);

    // P2 = 10% fee
    const p2Withdrawal = await WithdrawalService.calculateFee('usr-test', 100, 'P2');
    expect(p2Withdrawal.feePercent).toBe(10);
    expect(p2Withdrawal.feeAmountUsdt).toBe(10);
    expect(p2Withdrawal.netAmountUsdt).toBe(90);

    // P3 = 10% fee
    const p3Withdrawal = await WithdrawalService.calculateFee('usr-test', 250, 'P3');
    expect(p3Withdrawal.feePercent).toBe(10);
    expect(p3Withdrawal.feeAmountUsdt).toBe(25);
    expect(p3Withdrawal.netAmountUsdt).toBe(225);
  });

  it('validates operating window calculation', () => {
    const status = SolarGenerationService.getSolarOperationStatus(new Date());
    expect(status).toHaveProperty('isOperatingDay');
    expect(status).toHaveProperty('status');

    const schedule = SolarGenerationService.getSolarOperationSchedule();
    expect(schedule.operatingDays).toContain('MONDAY');
    expect(schedule.durationHours).toBe(3);
  });
});
