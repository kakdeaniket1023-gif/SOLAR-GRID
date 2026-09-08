import { DatabaseService } from '@/backend/db';
import { UpgradeTransaction, SolarPlan } from '@/types';

export class SolarUpgradeService {
  static async calculateUpgradeCost(
    currentPlanCode: string,
    targetPlanCode: string
  ): Promise<{
    currentPlan?: SolarPlan;
    targetPlan?: SolarPlan;
    currentPriceUsdt: number;
    targetPriceUsdt: number;
    previousPlanCreditUsdt: number;
    requiredTopUpUsdt: number;
    isValidUpgrade: boolean;
    errorReason?: string;
  }> {
    const plans = await DatabaseService.getPlans();
    const currentPlan = plans.find((p) => p.code === currentPlanCode);
    const targetPlan = plans.find((p) => p.code === targetPlanCode);

    if (!currentPlan) {
      return {
        currentPriceUsdt: 0,
        targetPriceUsdt: targetPlan?.priceUsdt || 0,
        previousPlanCreditUsdt: 0,
        requiredTopUpUsdt: targetPlan?.priceUsdt || 0,
        isValidUpgrade: false,
        errorReason: 'Current plan not found',
      };
    }

    if (!targetPlan) {
      return {
        currentPriceUsdt: currentPlan.priceUsdt,
        targetPriceUsdt: 0,
        previousPlanCreditUsdt: currentPlan.priceUsdt,
        requiredTopUpUsdt: 0,
        isValidUpgrade: false,
        errorReason: 'Target plan not found',
      };
    }

    const currentPrice = currentPlan.priceUsdt;
    const targetPrice = targetPlan.priceUsdt;

    if (targetPrice <= currentPrice) {
      return {
        currentPlan,
        targetPlan,
        currentPriceUsdt: currentPrice,
        targetPriceUsdt: targetPrice,
        previousPlanCreditUsdt: currentPrice,
        requiredTopUpUsdt: 0,
        isValidUpgrade: false,
        errorReason: 'Target plan must be a higher tier than current plan',
      };
    }

    const requiredTopUp = Math.round((targetPrice - currentPrice) * 100) / 100;

    return {
      currentPlan,
      targetPlan,
      currentPriceUsdt: currentPrice,
      targetPriceUsdt: targetPrice,
      previousPlanCreditUsdt: currentPrice,
      requiredTopUpUsdt: requiredTopUp,
      isValidUpgrade: true,
    };
  }

  static async executeUpgrade(
    unitId: string,
    targetPlanCode: string
  ): Promise<{
    success: boolean;
    message: string;
    upgrade?: UpgradeTransaction;
  }> {
    const unit = await DatabaseService.getUnitById(unitId);
    if (!unit) return { success: false, message: 'Solar unit not found' };

    const user = await DatabaseService.getUserById(unit.userId);
    if (!user) return { success: false, message: 'User not found' };

    const calc = await this.calculateUpgradeCost(unit.planCode, targetPlanCode);
    if (!calc.isValidUpgrade || !calc.targetPlan) {
      return { success: false, message: calc.errorReason || 'Invalid plan upgrade path' };
    }

    const debitRes = await DatabaseService.atomicDebitBalance(user.id, calc.requiredTopUpUsdt);
    if (!debitRes.success) {
      return {
        success: false,
        message: debitRes.message || `Insufficient balance for top-up. Required: ${calc.requiredTopUpUsdt} USDT, Available: ${user.availableBalance.toFixed(2)} USDT`,
      };
    }

    // 1. Add Ledger Entry
    await DatabaseService.addLedgerEntry({
      userId: user.id,
      type: 'PLAN_UPGRADE',
      amount: calc.requiredTopUpUsdt,
      direction: 'DEBIT',
      balanceBefore: debitRes.balanceBefore,
      balanceAfter: debitRes.balanceAfter,
      sourceEvent: 'PLAN_UPGRADE',
      referenceId: unit.id,
      description: `Plan Upgrade: ${unit.planCode} ($${calc.currentPriceUsdt}) → ${targetPlanCode} ($${calc.targetPriceUsdt}) [Applied $${calc.previousPlanCreditUsdt} Credit]`,
      actor: user.name,
    });

    // 3. Update Solar Unit Specs
    await DatabaseService.updateUnit(unit.id, {
      planId: calc.targetPlan.id,
      planCode: calc.targetPlan.code,
      planName: calc.targetPlan.name,
      capacityKw: calc.targetPlan.capacityKw,
      purchasePriceUsdt: calc.targetPlan.priceUsdt,
    });

    // 4. Add Audit Log
    await DatabaseService.addAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'UPGRADE_SOLAR_PLAN',
      targetType: 'SOLAR_UNIT',
      targetId: unit.id,
      details: { fromPlan: unit.planCode, toPlan: targetPlanCode, cost: calc.requiredTopUpUsdt },
      ipAddress: '127.0.0.1',
    });

    // 5. Send Notification
    await DatabaseService.createNotification({
      userId: user.id,
      title: 'Solar Unit Upgraded!',
      message: `Your unit has been upgraded to ${calc.targetPlan.name} (${calc.targetPlan.capacityKw} kW).`,
      link: '/dashboard/units',
    });

    return {
      success: true,
      message: `Unit successfully upgraded to ${calc.targetPlan.name}!`,
    };
  }
}
