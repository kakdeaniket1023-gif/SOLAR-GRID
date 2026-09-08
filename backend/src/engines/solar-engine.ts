import { DatabaseService } from '@/backend/db';
import { PointsService } from '@/backend/engines/points-engine';
import { MLMService } from '@/backend/engines/mlm-engine';
import { SolarUnit, GenerationLog, SolarOperationSchedule } from '@/types';

export class SolarGenerationService {
  /**
   * Helper to parse time strings into minutes from midnight.
   */
  static parseTimeToMinutes(timeStr: string): number {
    if (!timeStr) return 12 * 60; // default 12:00 PM
    const clean = timeStr.trim().toUpperCase();
    const isPM = clean.includes('PM');
    const isAM = clean.includes('AM');
    const parts = clean.replace(/[APM\s]/g, '').split(':');
    let hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1] || '0', 10) || 0;

    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;

    return hours * 60 + minutes;
  }

  private static cachedSchedule: SolarOperationSchedule = {
    startTime: '12:00 PM',
    endTime: '3:00 PM',
    operatingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
    durationHours: 3,
  };
  private static lastScheduleFetch: number = 0;

  static getSolarOperationSchedule(): SolarOperationSchedule {
    return this.cachedSchedule;
  }

  static async loadDynamicSchedule(): Promise<SolarOperationSchedule> {
    try {
      if (Date.now() - this.lastScheduleFetch < 30000) {
        return this.cachedSchedule;
      }
      const rules = await DatabaseService.getBusinessRules();
      const startRule = rules.find((r) => r.key === 'SOLAR_OPERATION_START_TIME');
      const endRule = rules.find((r) => r.key === 'SOLAR_OPERATION_END_TIME');
      const daysRule = rules.find((r) => r.key === 'SOLAR_OPERATING_DAYS');
      const durationRule = rules.find((r) => r.key === 'SOLAR_OPERATION_DURATION_HOURS');

      const startTime = startRule?.value ? String(startRule.value) : this.cachedSchedule.startTime;
      const endTime = endRule?.value ? String(endRule.value) : this.cachedSchedule.endTime;
      let operatingDays = this.cachedSchedule.operatingDays;
      if (daysRule?.value) {
        if (Array.isArray(daysRule.value)) {
          operatingDays = daysRule.value;
        } else if (typeof daysRule.value === 'string') {
          try {
            const parsed = JSON.parse(daysRule.value);
            if (Array.isArray(parsed)) operatingDays = parsed;
          } catch {
            operatingDays = daysRule.value.split(',').map((s: string) => s.trim().toUpperCase());
          }
        }
      }
      const durationHours = durationRule?.value ? Number(durationRule.value) : 3;

      this.cachedSchedule = {
        startTime,
        endTime,
        operatingDays,
        durationHours,
      };
      this.lastScheduleFetch = Date.now();
      return this.cachedSchedule;
    } catch {
      return this.cachedSchedule;
    }
  }

  /**
   * Evaluates the dynamic solar operation state for any given moment.
   */
  static getSolarOperationStatus(date: Date = new Date()): {
    isOperatingDay: boolean;
    status: 'WEEKEND' | 'BEFORE_OPERATION' | 'OPERATION_ACTIVE' | 'OPERATION_COMPLETED';
    statusLabel: string;
    dayLabel: string;
    timeWindowString: string;
    schedule: SolarOperationSchedule;
    progressPercent: number;
    currentTimeMinutes: number;
    startMinutes: number;
    endMinutes: number;
  } {
    const schedule = this.getSolarOperationSchedule();
    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const currentDayName = dayNames[date.getDay()];

    const isOperatingDay = schedule.operatingDays.map((d) => d.toUpperCase()).includes(currentDayName);

    const startMinutes = this.parseTimeToMinutes(schedule.startTime);
    const endMinutes = this.parseTimeToMinutes(schedule.endTime);
    const currentMinutes = date.getHours() * 60 + date.getMinutes();

    const timeWindowString = `${schedule.startTime} → ${schedule.endTime}`;

    if (!isOperatingDay) {
      return {
        isOperatingDay: false,
        status: 'WEEKEND',
        statusLabel: 'Weekend / Maintenance',
        dayLabel: `${currentDayName} — NON-OPERATING DAY`,
        timeWindowString,
        schedule,
        progressPercent: 0,
        currentTimeMinutes: currentMinutes,
        startMinutes,
        endMinutes,
      };
    }

    const dayLabel = `${currentDayName} — WORKING DAY`;

    if (currentMinutes < startMinutes) {
      return {
        isOperatingDay: true,
        status: 'BEFORE_OPERATION',
        statusLabel: 'UPCOMING OPERATION',
        dayLabel,
        timeWindowString,
        schedule,
        progressPercent: 0,
        currentTimeMinutes: currentMinutes,
        startMinutes,
        endMinutes,
      };
    } else if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
      const totalDuration = Math.max(1, endMinutes - startMinutes);
      const elapsed = currentMinutes - startMinutes;
      const progressPercent = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));

      return {
        isOperatingDay: true,
        status: 'OPERATION_ACTIVE',
        statusLabel: 'SOLAR UNIT ACTIVE',
        dayLabel,
        timeWindowString,
        schedule,
        progressPercent,
        currentTimeMinutes: currentMinutes,
        startMinutes,
        endMinutes,
      };
    } else {
      return {
        isOperatingDay: true,
        status: 'OPERATION_COMPLETED',
        statusLabel: 'OPERATION COMPLETE',
        dayLabel,
        timeWindowString,
        schedule,
        progressPercent: 100,
        currentTimeMinutes: currentMinutes,
        startMinutes,
        endMinutes,
      };
    }
  }

  static isWorkingDay(date: Date = new Date()): boolean {
    const opStatus = this.getSolarOperationStatus(date);
    return opStatus.isOperatingDay;
  }

  /**
   * Server-side Idempotent Daily Settlement against Neon PostgreSQL.
   */
  static async settleDailyOperation(
    unitId: string,
    userId: string
  ): Promise<{
    success: boolean;
    alreadySettled?: boolean;
    message: string;
    creditedAmount?: number;
    balanceAfter?: number;
    log?: GenerationLog;
    unit?: SolarUnit;
  }> {
    const today = new Date();
    if (!this.isWorkingDay(today)) {
      return { success: false, message: 'Solar operations are active Monday to Friday only.' };
    }

    const todayStr = today.toISOString().split('T')[0];

    const unit = await DatabaseService.getUnitById(unitId);
    if (!unit) {
      return { success: false, message: 'Solar unit not found' };
    }

    if (unit.userId !== userId) {
      const user = await DatabaseService.getUserById(userId);
      if (user?.role !== 'SUPER_ADMIN') {
        return { success: false, message: 'Unauthorized: You do not own this solar unit' };
      }
    }

    if (unit.status !== 'ACTIVE') {
      return { success: false, message: `Solar unit is currently ${unit.status.toLowerCase()}` };
    }

    const remaining = Math.max(0, unit.workingDaysTotal - unit.workingDaysCompleted);
    if (remaining <= 0) {
      await DatabaseService.updateUnit(unit.id, { status: 'EXPIRED' });
      return { success: false, message: 'This solar unit has completed its working days lifecycle.' };
    }

    // Check idempotency
    const existingLogs = await DatabaseService.getGenerationLogs(unit.userId);
    const alreadySettledLog = existingLogs.find(
      (l) => l.unitId === unitId && l.generationDate === todayStr && l.status === 'RECEIVED'
    );

    const idempotencyKey = `DAILY-SETTLE-${unit.id}-${todayStr}`;
    const existingLedger = (await DatabaseService.getLedger(unit.userId)).find(
      (l) => l.referenceId === idempotencyKey
    );

    if (alreadySettledLog || existingLedger || (unit.lastOperatedDate === todayStr && !unit.isReceivable && (unit.todayEarnedUsdt || 0) > 0)) {
      return {
        success: true,
        alreadySettled: true,
        message: 'Daily generation already settled for today. Next generation cycle opens next working day.',
        creditedAmount: unit.todayEarnedUsdt || 1.2,
      };
    }

    // Enforce mandatory 3-hour generation cycle hold
    const todayLog = existingLogs.find((l) => l.unitId === unitId && l.generationDate === todayStr);
    if (!todayLog || !todayLog.operatedAt) {
      return {
        success: false,
        message: 'Generation cycle has not been started for today. Please click "Start Panel" to initiate the 3-hour cycle.',
      };
    }

    const startedAtTime = new Date(todayLog.operatedAt).getTime();
    const elapsedSeconds = Math.floor((Date.now() - startedAtTime) / 1000);
    const REQUIRED_CYCLE_SECONDS = 3 * 3600; // 3 hours

    if (elapsedSeconds < REQUIRED_CYCLE_SECONDS) {
      const remainingMinutes = Math.ceil((REQUIRED_CYCLE_SECONDS - elapsedSeconds) / 60);
      return {
        success: false,
        message: `Generation cycle in progress. Please allow ${remainingMinutes} more minute(s) before collecting earnings.`,
      };
    }

    const user = await DatabaseService.getUserById(unit.userId);
    if (!user) {
      return { success: false, message: 'User account not found' };
    }

    const plan = await DatabaseService.getPlanByCode(unit.planCode);
    const dailyYield = plan?.dailyEarningUsdt || 1.2;

    // Apply advertised points performance ratio (70-100 pts = 1.0, 61-69 = 0.8, 31-60 = 0.5, <=30 = 0.1)
    const pointsMultiplier = PointsService.getEfficiencyMultiplier(user.points);
    const creditedAmount = Math.round(dailyYield * pointsMultiplier * 100) / 100;
    const kwhGenerated = Math.round(unit.capacityKw * (5.5 + Math.random() * 1.5) * 10) / 10;

    // Atomically credit user balance & total earned
    const creditRes = await DatabaseService.atomicCreditBalance(
      user.id,
      creditedAmount,
      creditedAmount
    );

    if (!creditRes.success) {
      return { success: false, message: 'Failed to credit earnings to account.' };
    }

    const newCompleted = unit.workingDaysCompleted + 1;
    const newTotalEarned = Math.round(((unit.lifetimeEarnedUsdt || 0) + creditedAmount) * 100) / 100;

    // 1. Create or update Generation Log
    let log = existingLogs.find((l) => l.unitId === unitId && l.generationDate === todayStr);
    if (log) {
      const updatedLog = await DatabaseService.updateGenerationLog(log.id, {
        status: 'RECEIVED',
        receivedAt: new Date().toISOString(),
        actualEarningUsdt: creditedAmount,
      });
      if (updatedLog) log = updatedLog;
    } else {
      log = await DatabaseService.createGenerationLog({
        unitId: unit.id,
        userId: unit.userId,
        planCode: unit.planCode,
        generationDate: todayStr,
        kwhGenerated,
        efficiency: 99.1,
        weatherCondition: 'OPTIMAL',
        pointsMultiplier,
        baseEarningUsdt: dailyYield,
        actualEarningUsdt: creditedAmount,
        operatedAt: new Date().toISOString(),
        status: 'RECEIVED',
      });
    }

    // 2. Add Ledger Credit Entry
    await DatabaseService.addLedgerEntry({
      userId: user.id,
      type: 'DAILY_SOLAR_EARNING',
      amount: creditedAmount,
      direction: 'CREDIT',
      balanceBefore: creditRes.balanceBefore,
      balanceAfter: creditRes.balanceAfter,
      sourceEvent: 'DAILY_SOLAR_SETTLEMENT',
      referenceId: idempotencyKey,
      description: `Daily Solar Energy Generation: ${unit.planName} (+${creditedAmount.toFixed(2)} USDT, Points Eff: ${(pointsMultiplier * 100).toFixed(0)}%)`,
      actor: 'SYSTEM',
    });

    // 3. Update Unit Snapshot
    const updatedUnit = await DatabaseService.updateUnit(unit.id, {
      workingDaysCompleted: newCompleted,
      todayEarnedUsdt: creditedAmount,
      lifetimeEarnedUsdt: newTotalEarned,
      lastOperatedDate: todayStr,
      isReceivable: false,
      receivableAmountUsdt: 0,
      status: newCompleted >= (unit.workingDaysTotal || 43) ? 'EXPIRED' : 'ACTIVE',
    });

    // 4. Distribute 3-Tier MLM Community Referral Commissions to Uplines
    try {
      await MLMService.distributeCommissions(user.id, creditedAmount, unit.id);
    } catch {
      // commission distribution failure should not abort settled generation log
    }

    return {
      success: true,
      alreadySettled: false,
      message: `Daily operation complete! +${creditedAmount.toFixed(2)} USDT energy credit added to balance.`,
      creditedAmount,
      balanceAfter: creditRes.balanceAfter,
      log,
      unit: updatedUnit || undefined,
    };
  }

  static async startDailyOperation(
    unitId: string,
    userId: string,
    startCode?: string
  ): Promise<{
    success: boolean;
    message: string;
    receivableAmount?: number;
    kwhGenerated?: number;
    startedAt?: string;
    log?: GenerationLog;
  }> {
    const unit = await DatabaseService.getUnitById(unitId);
    if (!unit) {
      return { success: false, message: 'Solar unit not found' };
    }

    if (unit.userId !== userId) {
      return { success: false, message: 'Unauthorized: You do not own this solar unit' };
    }

    if (unit.status !== 'ACTIVE') {
      return { success: false, message: `Solar unit is currently ${unit.status.toLowerCase()}` };
    }

    // Validate Start Code
    const trimmedCode = (startCode || '').trim().toUpperCase();
    if (!trimmedCode) {
      return { success: false, message: 'Panel start code is required.' };
    }
    const validCodes = ['SOLAR888', 'START2026', 'START888', 'SOLAR2026', unit.planCode.toUpperCase()];
    const isValidCode = validCodes.includes(trimmedCode) || trimmedCode.length >= 4;
    if (!isValidCode) {
      return { success: false, message: 'Invalid start code. Please enter a valid panel start code.' };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (unit.lastOperatedDate === todayStr && !unit.isReceivable) {
      return { success: false, message: 'This panel has already completed its daily generation cycle for today.' };
    }

    const plan = await DatabaseService.getPlanByCode(unit.planCode);
    const dailyYield = plan?.dailyEarningUsdt || 0.80;
    const receivableAmount = Math.round(dailyYield * 100) / 100;
    const kwhGenerated = Math.round(unit.capacityKw * (5.5 + Math.random() * 1.5) * 10) / 10;
    const nowIso = new Date().toISOString();

    const existingLogs = await DatabaseService.getGenerationLogs(unit.userId);
    let log = existingLogs.find((l) => l.unitId === unitId && l.generationDate === todayStr);

    if (!log) {
      log = await DatabaseService.createGenerationLog({
        unitId: unit.id,
        userId: unit.userId,
        planCode: unit.planCode,
        generationDate: todayStr,
        kwhGenerated,
        performanceRatio: 99.2,
        baseEarningUsdt: dailyYield,
        pointsMultiplier: 1.0,
        actualEarningUsdt: receivableAmount,
        operationalStatus: 'GENERATING',
        status: 'PENDING',
      });
    }

    await DatabaseService.updateUnit(unit.id, {
      isReceivable: false,
      receivableAmountUsdt: receivableAmount,
      lastOperatedDate: todayStr,
    });

    // Award +2 points on panel operation start
    try {
      const user = await DatabaseService.getUserById(userId);
      if (user) {
        const newPoints = user.points + 2;
        await DatabaseService.updateUser(user.id, { points: newPoints });
        await DatabaseService.addPointsLedgerEntry({
          userId: user.id,
          type: 'PANEL_START',
          pointsChange: 2,
          balanceBefore: user.points,
          balanceAfter: newPoints,
          reason: `Panel Start Bonus: ${unit.planName} (+2 Points)`,
          referenceId: unit.id,
        });
      }
    } catch {}

    return {
      success: true,
      message: `Solar unit started successfully! Generating for 3 hours. Estimated yield: ${receivableAmount.toFixed(2)} USDT.`,
      receivableAmount,
      kwhGenerated,
      startedAt: nowIso,
      log,
    };
  }

  static async receiveDailyEarning(
    unitId: string,
    userId: string
  ): Promise<{
    success: boolean;
    alreadySettled?: boolean;
    message: string;
    creditedAmount?: number;
    balanceAfter?: number;
  }> {
    const result = await this.settleDailyOperation(unitId, userId);
    return {
      success: result.success,
      alreadySettled: result.alreadySettled,
      message: result.message,
      creditedAmount: result.creditedAmount,
      balanceAfter: result.balanceAfter,
    };
  }

  static async purchasePlan(
    userId: string,
    planCode: string
  ): Promise<{ success: boolean; message: string; unit?: SolarUnit }> {
    const user = await DatabaseService.getUserById(userId);
    if (!user) return { success: false, message: 'User not found' };

    const plan = await DatabaseService.getPlanByCode(planCode);
    if (!plan || plan.status !== 'ACTIVE') {
      return { success: false, message: 'Selected plan is not available for purchase.' };
    }

    // Atomically debit purchase price
    const debitRes = await DatabaseService.atomicDebitBalance(user.id, plan.priceUsdt);
    if (!debitRes.success) {
      return {
        success: false,
        message: debitRes.message || `Insufficient balance. Required: ${plan.priceUsdt.toFixed(2)} USDT, Available: ${user.availableBalance.toFixed(2)} USDT. Please recharge first.`,
      };
    }

    const projects = await DatabaseService.getProjects();
    const project = projects[0] || {
      id: 'proj-sonoran',
      name: 'Sonoran Clean Solar Park',
      location: 'Sonoran Basin, Arizona, USA',
    };

    const newUnit = await DatabaseService.createUnit({
      userId: user.id,
      planId: plan.id,
      planCode: plan.code,
      planName: plan.name,
      projectId: project.id,
      projectName: project.name,
      location: plan.projectLocation || project.location,
      capacityKw: plan.capacityKw,
      purchasePriceUsdt: plan.priceUsdt,
    });

    await DatabaseService.addLedgerEntry({
      userId: user.id,
      type: 'PLAN_PURCHASE',
      amount: plan.priceUsdt,
      direction: 'DEBIT',
      balanceBefore: debitRes.balanceBefore,
      balanceAfter: debitRes.balanceAfter,
      sourceEvent: 'PLAN_PURCHASE',
      referenceId: newUnit.id,
      description: `Activated Solar Unit: ${plan.name} (${plan.capacityKw} kW)`,
      actor: user.name,
    });

    // Award +2 points on panel purchase
    try {
      const newPoints = user.points + 2;
      await DatabaseService.updateUser(user.id, { points: newPoints });
      await DatabaseService.addPointsLedgerEntry({
        userId: user.id,
        type: 'PANEL_PURCHASE',
        pointsChange: 2,
        balanceBefore: user.points,
        balanceAfter: newPoints,
        reason: `Panel Purchase Bonus: ${plan.name} (+2 Points)`,
        referenceId: newUnit.id,
      });
    } catch {}

    return {
      success: true,
      message: `Successfully activated ${plan.name}! Solar unit is now ready for weekday operations.`,
      unit: newUnit,
    };
  }

  static async upgradeUnit(
    userId: string,
    unitId: string,
    targetPlanCode: string
  ): Promise<{ success: boolean; message: string; unit?: SolarUnit; topUpCostUsdt?: number }> {
    const unit = await DatabaseService.getUnitById(unitId);
    if (!unit) return { success: false, message: 'Solar unit not found' };
    if (unit.userId !== userId) return { success: false, message: 'Unauthorized: Not owner of this unit' };

    const currentPlan = await DatabaseService.getPlanByCode(unit.planCode);
    const targetPlan = await DatabaseService.getPlanByCode(targetPlanCode);

    if (!currentPlan || !targetPlan) {
      return { success: false, message: 'Invalid plan specification' };
    }

    if (targetPlan.priceUsdt <= (unit.purchasePriceUsdt || currentPlan.priceUsdt)) {
      return { success: false, message: 'Target plan must be a higher tier than current unit' };
    }

    const currentBasePrice = unit.purchasePriceUsdt || currentPlan.priceUsdt;
    const upgradeCost = Math.round((targetPlan.priceUsdt - currentBasePrice) * 10000) / 10000;
    const user = await DatabaseService.getUserById(userId);
    if (!user) return { success: false, message: 'User not found' };

    // Atomically debit upgrade cost
    const debitRes = await DatabaseService.atomicDebitBalance(user.id, upgradeCost);
    if (!debitRes.success) {
      return {
        success: false,
        message: debitRes.message || `Insufficient balance for upgrade. Required top-up: ${upgradeCost.toFixed(2)} USDT, Available: ${user.availableBalance.toFixed(2)} USDT.`,
      };
    }

    const updatedUnit = await DatabaseService.updateUnit(unit.id, {
      planId: targetPlan.id,
      planCode: targetPlan.code,
      planName: targetPlan.name,
      capacityKw: targetPlan.capacityKw,
      purchasePriceUsdt: targetPlan.priceUsdt,
      status: 'ACTIVE',
    });

    await DatabaseService.addLedgerEntry({
      userId: user.id,
      type: 'PLAN_UPGRADE',
      amount: upgradeCost,
      direction: 'DEBIT',
      balanceBefore: debitRes.balanceBefore,
      balanceAfter: debitRes.balanceAfter,
      sourceEvent: 'PLAN_UPGRADE',
      referenceId: unit.id,
      description: `Upgraded solar unit from ${unit.planName} to ${targetPlan.name}`,
      actor: user.name,
    });

    return {
      success: true,
      message: `Successfully upgraded to ${targetPlan.name}! Solar capacity increased to ${targetPlan.capacityKw} kW.`,
      unit: updatedUnit || undefined,
      topUpCostUsdt: upgradeCost,
    };
  }
}
