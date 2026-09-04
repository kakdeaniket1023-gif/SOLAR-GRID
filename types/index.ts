export type UserRole = 'USER' | 'SUPER_ADMIN';

export type UserStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'BANNED';

export type LeadershipTier =
  | 'SOLAR_MEMBER'
  | 'SOLAR_BUILDER'
  | 'ENERGY_COORDINATOR'
  | 'SOLAR_LEADER'
  | 'GRID_LEADER'
  | 'ENERGY_AMBASSADOR';

export type LeadershipLevel = LeadershipTier;

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  country?: string;
  avatarUrl?: string;
  role: UserRole;
  status: UserStatus;
  referralCode: string;
  sponsorId: string | null;
  leadershipLevel: LeadershipTier;
  points: number;
  availableBalance: number;
  totalEarned: number;
  transactionPasswordSet?: boolean;
  failedLoginAttempts?: number;
  lockedUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSession {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: UserRole;
  sessionToken?: string;
  loginTime: string;
  lastActivity: string;
  logoutTime?: string;
  ipAddress: string;
  deviceType: 'Desktop' | 'Mobile' | 'Tablet';
  operatingSystem: string;
  browser: string;
  userAgent: string;
  location: string;
  sessionStatus: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  riskScore: 'LOW' | 'MEDIUM' | 'HIGH';
  loginMethod: 'PASSWORD' | 'SESSION_RESTORE' | 'ADMIN_IMPERSONATION';
}

export interface Profile {
  id: string;
  userId: string;
  bio?: string;
  walletAddress?: string;
  walletNetwork?: 'USDT-TRC20' | 'USDT-ERC20' | 'USDT-BEP20';
  walletVerified?: boolean;
  preferredCurrency: string;
  twoFactorEnabled: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  telegramHandle?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SolarOperationSchedule {
  operatingDays: string[]; // e.g. ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
  startTime: string; // e.g. '12:00' or '12:00 PM'
  endTime: string; // e.g. '15:00' or '3:00 PM'
  durationHours: number;
}

export interface SolarPlan {
  id: string;
  code: 'P1' | 'P2' | 'P3' | string;
  name: string;
  description: string;
  priceUsdt: number;
  currency?: string;
  validityDays: number;
  workingDaysTotal: number;
  dailyEarningUsdt: number;
  grossEarningUsdt: number;
  withdrawalFeePercent: number;
  netAfterFeeUsdt: number;
  capacityKw: number;
  capacityDescription?: string;
  imageUrl: string;
  features: string[];
  status: 'ACTIVE' | 'DISABLED' | 'COMING_SOON';
  projectLocation: string;
  displayOrder: number;
  operationStartTime?: string;
  operationEndTime?: string;
  operatingWeekdays?: string[];
}

export interface SolarUnit {
  id: string;
  userId: string;
  planId: string;
  planCode: string;
  planName: string;
  projectId: string;
  projectName: string;
  location: string;
  capacityKw: number;
  imageUrl?: string;
  activatedAt: string;
  expiresAt: string;
  purchaseDate?: string;
  expiryDate?: string;
  purchasePriceUsdt: number;
  dailyEarningUsdt: number;
  workingDaysTotal: number;
  validityDays: number;
  withdrawalFeePercent: number;
  workingDaysCompleted: number;
  workingDaysRemaining: number;
  status: 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'UPGRADED' | 'MAINTENANCE';
  todayGeneratedKwh: number;
  lifetimeGeneratedKwh: number;
  todayEarnedUsdt: number;
  lifetimeEarnedUsdt: number;
  totalEarnedUsdt?: number;
  performanceRatio: number;
  lastOperatedDate?: string;
  isReceivable?: boolean;
  receivableAmountUsdt?: number;
  todayOperatedAt?: string;
  todayReceivedAt?: string;
  operationStartTime?: string;
  operationEndTime?: string;
}

export interface SolarProject {
  id: string;
  name: string;
  location: string;
  country: string;
  coordinates: { lat: number; lng: number };
  totalCapacityMw: number;
  activeUnitsCount: number;
  efficiencyRating: number;
  weatherCondition: string;
  temperatureC: number;
  sunlightHours: number;
  imageUrl: string;
  status: 'OPERATIONAL' | 'EXPANDING' | 'MAINTENANCE';
}

export interface GenerationLog {
  id: string;
  unitId: string;
  userId: string;
  planCode: string;
  generationDate: string; // YYYY-MM-DD
  kwhGenerated: number;
  efficiency: number;
  pointsMultiplier: number; // 1.0, 0.8, 0.5, 0.1
  baseEarningUsdt: number;
  actualEarningUsdt: number;
  weatherCondition: string;
  operatedAt: string;
  receivedAt?: string;
  status: 'PENDING_RECEIVE' | 'RECEIVED';
}

export type TransactionType =
  | 'DAILY_SOLAR_EARNING'
  | 'L1_REFERRAL_REWARD'
  | 'L2_REFERRAL_REWARD'
  | 'L3_REFERRAL_REWARD'
  | 'LEADERSHIP_REWARD'
  | 'BONUS'
  | 'ADJUSTMENT'
  | 'REDEMPTION'
  | 'WITHDRAWAL'
  | 'RECHARGE'
  | 'PLAN_PURCHASE'
  | 'PLAN_UPGRADE';

export interface EarningsLedgerEntry {
  id: string;
  userId: string;
  type: TransactionType;
  amountUsdt: number;
  amount?: number;
  direction?: 'CREDIT' | 'DEBIT';
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  referenceId?: string; // unitId, referralId, withdrawalId, rechargeId, etc.
  sourceUserId?: string; // downline member who triggered the commission
  sourceUserName?: string;
  createdAt: string;
  timestamp?: string;
}

export type RechargeStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';

export interface RechargeRecord {
  id: string;
  rechargeId?: string;
  userId: string;
  userName: string;
  userEmail: string;
  amountUsdt: number;
  currency: 'USDT-TRC20' | 'USDT-BEP20' | 'USDT-ERC20' | 'BTC' | 'ETH';
  method: 'CRYPTO_TRANSFER' | 'CREDIT_CARD' | 'MANUAL_DEPOSIT';
  destinationAddress: string;
  txReference?: string;
  proofImageUrl?: string;
  status: RechargeStatus;
  reviewerId?: string;
  reviewerName?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  adminNotes?: string;
  createdAt: string;
}

export type WithdrawalStatus = 'PENDING' | 'PROCESSING' | 'APPROVED' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';

export interface WithdrawalRequest {
  id: string;
  withdrawalId?: string;
  userId: string;
  userName: string;
  userEmail: string;
  planCode: string;
  amountUsdt: number;
  amount?: number;
  feePercent: number;
  feeAmountUsdt: number;
  feeAmount?: number;
  netAmountUsdt: number;
  netAmount?: number;
  walletAddress: string;
  network: 'USDT-TRC20' | 'USDT-ERC20' | 'USDT-BEP20';
  status: WithdrawalStatus;
  txHash?: string;
  adminNotes?: string;
  reviewerId?: string;
  reviewerName?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  refunded?: boolean;
  requestedAt: string;
  reviewedAt?: string;
}

export interface UpgradeTransaction {
  id: string;
  userId: string;
  fromPlanCode: string;
  toPlanCode: string;
  fromPriceUsdt: number;
  toPriceUsdt: number;
  creditAppliedUsdt: number;
  topUpAmountUsdt: number;
  createdAt: string;
  status: 'COMPLETED' | 'FAILED';
}

export interface MLMNode {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  leadershipLevel: LeadershipTier;
  activePlan?: string;
  points: number;
  status: UserStatus;
  sponsorId: string | null;
  directReferralsCount: number;
  totalTeamCount: number;
  lifetimeGenerationUsdt: number;
  level: number; // 0 for root/self, 1 for L1, 2 for L2, 3 for L3
  joinedAt: string;
  children?: MLMNode[];
}

export interface CommissionRule {
  level: 1 | 2 | 3;
  name: string;
  percentage: number; // e.g. 10%, 5%, 2%
  minimumRequiredActivePlan?: string;
  active: boolean;
  description: string;
}

export interface ReferralRelationship {
  id: string;
  sponsorId: string;
  downlineId: string;
  level: 1 | 2 | 3;
  createdAt: string;
}

export interface PointRule {
  id: string;
  code: string;
  title: string;
  type: 'REWARD' | 'DEDUCTION';
  points: number; // positive for reward, negative for deduction
  description: string;
  active: boolean;
}

export interface PointsLedgerEntry {
  id: string;
  userId: string;
  type: 'REWARD' | 'DEDUCTION' | 'REDEMPTION' | 'ADMIN_ADJUSTMENT' | 'INITIAL_BASELINE';
  pointsChange: number;
  balanceBefore: number;
  balanceAfter: number;
  reason: string;
  actorId?: string;
  actorName?: string;
  createdAt: string;
}

export interface LeadershipLevelConfig {
  id: string;
  level: LeadershipTier;
  order: number;
  title: string;
  badge: string;
  iconName: string;
  colorHex: string;
  minDirectTeam: number;
  minQualifiedTeam: number;
  requiredActivePlan: string;
  requiredTeamDepth: number;
  minPoints: number;
  bonusUsdt: number;
  dailyBonusUsdt: number;
  benefits: string[];
}

export interface UserLeadershipProgress {
  currentLevel: LeadershipTier;
  nextLevel: LeadershipTier | null;
  directTeamCount: number;
  directTeamTarget: number;
  qualifiedTeamCount: number;
  qualifiedTeamTarget: number;
  activePlan: string;
  requiredPlan: string;
  currentPoints: number;
  requiredPoints: number;
  progressPercentage: number;
  isEligibleForPromotion: boolean;
}

export interface RewardItem {
  id: string;
  title: string;
  category: 'CASH' | 'ELECTRONICS' | 'LIFESTYLE' | 'VEHICLES' | 'EXPERIENCES' | 'CREDIT' | 'BOOST' | 'STATUS';
  description: string;
  pointsCost: number;
  estimatedUsdtValue: number;
  imageUrl: string;
  stock: number;
  requiredLeadershipLevel?: LeadershipTier;
  status: 'AVAILABLE' | 'LIMITED' | 'OUT_OF_STOCK' | 'COMING_SOON';
  resetsPointsToBaseline: boolean;
}

export interface RewardRedemption {
  id: string;
  userId: string;
  userName: string;
  rewardId: string;
  rewardTitle: string;
  category: string;
  pointsSpent: number;
  status: 'PENDING' | 'APPROVED' | 'DISPATCHED' | 'DELIVERED' | 'REJECTED';
  shippingAddress?: string;
  trackingNumber?: string;
  requestedAt: string;
  completedAt?: string;
  adminNotes?: string;
}

export type NotificationGroup =
  | 'ACCOUNT'
  | 'SOLAR'
  | 'EARNINGS'
  | 'REFERRAL'
  | 'TEAM'
  | 'LEADERSHIP'
  | 'POINTS'
  | 'REWARDS'
  | 'WITHDRAWALS'
  | 'RECHARGES'
  | 'SECURITY'
  | 'SYSTEM'
  | 'SUPPORT';

export interface Notification {
  id: string;
  userId: string;
  group: NotificationGroup;
  title: string;
  message: string;
  linkUrl?: string;
  read: boolean;
  createdAt: string;
}

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_FOR_USER' | 'RESOLVED' | 'CLOSED';

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  category: 'BILLING' | 'SOLAR_PANEL' | 'WITHDRAWAL' | 'RECHARGE' | 'MLM_COMMISSION' | 'POINTS_REWARD' | 'TECHNICAL' | 'OTHER';
  priority: TicketPriority;
  subject: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  messages: SupportMessage[];
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  message: string;
  attachmentUrl?: string;
  createdAt: string;
}

export interface BusinessRule {
  id: string;
  key: string;
  category: 'SOLAR' | 'MLM' | 'POINTS' | 'WITHDRAWAL' | 'RECHARGE' | 'SECURITY' | 'LEADERSHIP' | 'SYSTEM';
  label: string;
  value: string | number | boolean | object;
  description: string;
  updatedAt: string;
  updatedBy: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorEmail?: string;
  actorRole: UserRole;
  action: string;
  target: string;
  targetType?: string;
  targetId: string;
  oldState?: string;
  newState?: string;
  reason?: string;
  details?: Record<string, any>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface PanelImageConfig {
  planCode: string;
  planName: string;
  imageUrl: string;
  aspectRatio: string;
  caption: string;
  updatedAt: string;
}
