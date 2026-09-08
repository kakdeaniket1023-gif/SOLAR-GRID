import { DatabaseService } from '@/backend/db';
import { User, DirectCommission, KycStatus } from '@/types';

export interface TreeNode {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'SUPER_ADMIN';
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'BANNED';
  kycStatus: KycStatus;
  personalPv: number;
  groupPv: number;
  level: number;
  sponsorId: string | null;
  directCount: number;
  createdAt: string;
  referralCode?: string;
  leadershipLevel?: string;
  points?: number;
  availableBalance?: number;
  personalInvestment?: number;
  teamVolume?: number;
  totalTeamCount?: number;
  activePlan?: string;
  children?: TreeNode[];
}

export interface TeamStats {
  userId: string;
  level1Count: number;
  level2Count: number;
  totalTeamCount: number;
  personalPv: number;
  groupPv: number;
  level1Pv: number;
  level2Pv: number;
  activeMembersCount: number;
  verifiedKycCount: number;
  totalDirectSellingCommissionUsdt: number;
  l1CommissionUsdt: number;
  l2CommissionUsdt: number;
}

export interface UplineEntry {
  user: User;
  level: 1 | 2 | 3;
}

export class TreeEngine {
  /**
   * Retrieves the upline beneficiaries up to maximum 3 levels depth (L1: 10%, L2: 3%, L3: 1%).
   */
  static async getUpline(userId: string, maxDepth: number = 3): Promise<UplineEntry[]> {
    const depth = Math.min(Math.max(1, maxDepth), 3);
    const upline: UplineEntry[] = [];
    const visited = new Set<string>([userId]);

    const user = await DatabaseService.getUserById(userId);
    if (!user || !user.sponsorId) {
      return upline;
    }

    // Level 1 Sponsor
    const l1 = await DatabaseService.getUserById(user.sponsorId);
    if (!l1 || visited.has(l1.id)) {
      return upline;
    }
    visited.add(l1.id);
    upline.push({ user: l1, level: 1 });

    if (depth < 2 || !l1.sponsorId) {
      return upline;
    }

    // Level 2 Sponsor
    const l2 = await DatabaseService.getUserById(l1.sponsorId);
    if (l2 && !visited.has(l2.id)) {
      visited.add(l2.id);
      upline.push({ user: l2, level: 2 });

      if (depth >= 3 && l2.sponsorId) {
        // Level 3 Sponsor
        const l3 = await DatabaseService.getUserById(l2.sponsorId);
        if (l3 && !visited.has(l3.id)) {
          visited.add(l3.id);
          upline.push({ user: l3, level: 3 });
        }
      }
    }

    return upline;
  }

  /**
   * Prevents circular sponsor loops in the referral graph.
   * Throws an error or returns false if setting proposedSponsorId would cause a cycle.
   */
  static async preventCycle(userId: string, proposedSponsorId: string): Promise<boolean> {
    if (!proposedSponsorId || userId === proposedSponsorId) {
      return false;
    }

    let currentSponsorId: string | null | undefined = proposedSponsorId;
    const visited = new Set<string>([userId]);
    let steps = 0;
    const MAX_STEPS = 100; // Safeguard against infinite loops

    while (currentSponsorId && steps < MAX_STEPS) {
      if (visited.has(currentSponsorId)) {
        // Cycle detected!
        return false;
      }
      visited.add(currentSponsorId);

      const sponsor = await DatabaseService.getUserById(currentSponsorId);
      if (!sponsor || !sponsor.sponsorId) {
        break;
      }
      currentSponsorId = sponsor.sponsorId;
      steps++;
    }

    return true;
  }

  /**
   * Validates and assigns a sponsor with cycle check.
   */
  static async assignSponsor(userId: string, proposedSponsorId: string): Promise<{ success: boolean; error?: string }> {
    const isValid = await this.preventCycle(userId, proposedSponsorId);
    if (!isValid) {
      return {
        success: false,
        error: `Circular referral cycle detected: sponsor ${proposedSponsorId} cannot be assigned to user ${userId}.`,
      };
    }

    const sponsor = await DatabaseService.getUserById(proposedSponsorId);
    if (!sponsor) {
      return { success: false, error: 'Sponsor user not found' };
    }

    // Update user's sponsor
    const updated = await DatabaseService.updateUser(userId, {
      sponsorId: proposedSponsorId,
    });

    if (!updated) {
      return { success: false, error: 'Failed to update sponsor' };
    }

    return { success: true };
  }

  /**
   * Lazily loads multi-level tree hierarchy for visualization.
   * Recursively builds downline nodes with rich MLM metadata.
   */
  static async getTree(
    userId: string,
    options?: { depth?: number; cursor?: string; limit?: number }
  ): Promise<{
    root: TreeNode;
    totalDirects: number;
    nextCursor?: string;
  }> {
    const maxDepth = options?.depth !== undefined ? Math.min(Math.max(1, options.depth), 6) : 4;
    const rootUser = await DatabaseService.getUserById(userId);
    if (!rootUser) {
      throw new Error(`User not found: ${userId}`);
    }

    const allUsers = await DatabaseService.getAllUsers();
    const allUnits = await DatabaseService.getAllUnits();

    // Map units by user
    const unitsByUser = new Map<string, typeof allUnits>();
    for (const u of allUnits) {
      const list = unitsByUser.get(u.userId) || [];
      list.push(u);
      unitsByUser.set(u.userId, list);
    }

    // Map direct downlines by sponsorId
    const downlinesBySponsor = new Map<string, User[]>();
    for (const u of allUsers) {
      if (u.sponsorId) {
        const list = downlinesBySponsor.get(u.sponsorId) || [];
        list.push(u);
        downlinesBySponsor.set(u.sponsorId, list);
      }
    }

    // Recursive helper to compute downline stats and build tree
    const buildSubtree = (user: User, currentLevel: number): TreeNode => {
      const directs = downlinesBySponsor.get(user.id) || [];
      const userUnits = unitsByUser.get(user.id) || [];
      const personalInvestment = userUnits.reduce((sum, u) => sum + (u.purchasePriceUsdt || 0), 0);
      const activePlan = userUnits.find((u) => u.status === 'ACTIVE')?.planCode || (userUnits[0]?.planCode || 'None');

      let children: TreeNode[] | undefined = undefined;
      let totalDownlineCount = directs.length;
      let totalTeamVolume = 0;

      if (currentLevel < maxDepth && directs.length > 0) {
        children = directs.map((child) => {
          const childNode = buildSubtree(child, currentLevel + 1);
          totalTeamVolume += (childNode.personalInvestment || 0) + (childNode.teamVolume || 0);
          totalDownlineCount += (childNode.totalTeamCount || 0);
          return childNode;
        });
      } else {
        // Even if not recursing further into children, calculate approximate volume
        for (const child of directs) {
          const childUnits = unitsByUser.get(child.id) || [];
          totalTeamVolume += childUnits.reduce((sum, u) => sum + (u.purchasePriceUsdt || 0), 0);
        }
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        kycStatus: user.kycStatus || 'UNVERIFIED',
        personalPv: user.personalPv || 0,
        groupPv: user.groupPv || 0,
        level: currentLevel,
        sponsorId: user.sponsorId || null,
        directCount: directs.length,
        createdAt: user.createdAt,
        referralCode: user.referralCode,
        leadershipLevel: user.leadershipLevel || 'SOLAR_MEMBER',
        points: user.points || 100,
        availableBalance: user.availableBalance || 0,
        personalInvestment,
        teamVolume: Math.round(totalTeamVolume * 100) / 100,
        totalTeamCount: totalDownlineCount,
        activePlan,
        children,
      };
    };

    const rootNode = buildSubtree(rootUser, 0);
    const directCount = (downlinesBySponsor.get(rootUser.id) || []).length;

    return {
      root: rootNode,
      totalDirects: directCount,
    };
  }

  /**
   * Calculates team volume and direct selling metrics for a user.
   */
  static async getTeamStats(userId: string): Promise<TeamStats> {
    const user = await DatabaseService.getUserById(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    const directs = await DatabaseService.getUsersBySponsorIds([userId]);
    const l1Ids = directs.map((d) => d.id);
    const l2Users = l1Ids.length > 0 ? await DatabaseService.getUsersBySponsorIds(l1Ids) : [];

    const level1Count = directs.length;
    const level2Count = l2Users.length;
    const totalTeamCount = level1Count + level2Count;

    const level1Pv = directs.reduce((sum, u) => sum + (u.personalPv || 0), 0);
    const level2Pv = l2Users.reduce((sum, u) => sum + (u.personalPv || 0), 0);

    const allTeamUsers = [...directs, ...l2Users];
    const activeMembersCount = allTeamUsers.filter(
      (u) => u.status === 'ACTIVE' && ((u.personalPv || 0) > 0 || (u.totalEarned || 0) > 0)
    ).length;

    const verifiedKycCount = allTeamUsers.filter((u) => u.kycStatus === 'VERIFIED').length;

    // Retrieve direct commissions earned on real product sales
    const commissions = await DatabaseService.getCommissionsByBeneficiaryId(userId);
    const paidOrApproved = commissions.filter(
      (c: DirectCommission) => c.status === 'APPROVED' || c.status === 'PAID'
    );

    const l1Commissions = paidOrApproved.filter((c: DirectCommission) => c.level === 1);
    const l2Commissions = paidOrApproved.filter((c: DirectCommission) => c.level === 2);

    const l1CommissionUsdt = Math.round(l1Commissions.reduce((sum: number, c: DirectCommission) => sum + c.amount, 0) * 100) / 100;
    const l2CommissionUsdt = Math.round(l2Commissions.reduce((sum: number, c: DirectCommission) => sum + c.amount, 0) * 100) / 100;
    const totalDirectSellingCommissionUsdt = Math.round((l1CommissionUsdt + l2CommissionUsdt) * 100) / 100;

    return {
      userId,
      level1Count,
      level2Count,
      totalTeamCount,
      personalPv: user.personalPv || 0,
      groupPv: user.groupPv || (user.personalPv || 0) + level1Pv + level2Pv,
      level1Pv,
      level2Pv,
      activeMembersCount,
      verifiedKycCount,
      totalDirectSellingCommissionUsdt,
      l1CommissionUsdt,
      l2CommissionUsdt,
    };
  }

  /**
   * Checks if targetId is within the downline (level 1 or level 2) of uplineId.
   */
  static async isDownline(uplineId: string, targetId: string): Promise<boolean> {
    if (uplineId === targetId) return true;

    const directs = await DatabaseService.getUsersBySponsorIds([uplineId]);
    if (directs.some((d) => d.id === targetId)) return true;

    const l1Ids = directs.map((d) => d.id);
    if (l1Ids.length === 0) return false;

    const l2Users = await DatabaseService.getUsersBySponsorIds(l1Ids);
    return l2Users.some((u) => u.id === targetId);
  }
}
