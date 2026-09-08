import { getDbClient, db } from './query-builder';
import { INITIAL_PLANS, INITIAL_PROJECTS } from '@/backend/db/seed-data';
import {
  User,
  Profile,
  SolarPlan,
  SolarProject,
  SolarUnit,
  GenerationLog,
  EarningsLedgerEntry,
  RechargeRecord,
  WithdrawalRequest,
  PointsLedgerEntry,
  LeadershipLevelConfig,
  Notification,
  SupportTicket,
  SupportMessage,
  AuditLog,
  BusinessRule,
  RewardItem,
  PointRule,
  CommissionRule,
  PanelImageConfig,
  Product,
  Order,
  OrderItem,
  OrderStatus,
  DirectCommission,
  DirectCommissionStatus,
  KycSubmission,
  PayoutMethod,
  PayoutMethodType,
  FraudSignal,
  FraudSeverity,
  KycStatus,
} from '@/types';

// Helper type interfaces for Postgres snake_case database rows
export interface DbUserRow {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  country?: string | null;
  avatar_url?: string | null;
  role: 'USER' | 'SUPER_ADMIN';
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'BANNED';
  referral_code: string;
  sponsor_id?: string | null;
  leadership_level?: string;
  points?: number;
  available_balance?: number;
  total_earned?: number;
  kyc_status?: string | null;
  personal_pv?: number;
  group_pv?: number;
  created_at: string;
  updated_at?: string;
}

export interface DbProfileRow {
  id?: string;
  user_id: string;
  bio?: string | null;
  wallet_address?: string | null;
  wallet_network?: string;
  wallet_verified?: boolean;
  preferred_currency?: string;
  two_factor_enabled?: boolean;
  email_notifications?: boolean;
  push_notifications?: boolean;
  telegram_handle?: string | null;
}

export interface DbSolarUnitRow {
  id: string;
  user_id: string;
  plan_id?: string;
  plan_code: string;
  plan_name: string;
  project_id?: string;
  project_name?: string;
  location?: string;
  capacity_kw?: number;
  image_url?: string | null;
  purchase_date?: string;
  expiry_date?: string;
  purchase_price_usdt?: number;
  daily_earning_usdt?: number;
  working_days_total?: number;
  working_days_completed?: number;
  status?: string;
  today_earned_usdt?: number;
  total_earned_usdt?: number;
  last_operated_date?: string | null;
  is_receivable?: boolean;
  receivable_amount_usdt?: number;
  created_at?: string;
}

export interface DbSolarPlanRow {
  id: string;
  code: string;
  name: string;
  description: string;
  price_usdt?: number;
  validity_days?: number;
  working_days_total?: number;
  daily_earning_usdt?: number;
  gross_earning_usdt?: number;
  withdrawal_fee_percent?: number;
  net_after_fee_usdt?: number;
  capacity_kw?: number;
  image_url?: string;
  features?: string[];
  project_location?: string;
  display_order?: number;
  status?: string;
}

export interface DbSolarProjectRow {
  id: string;
  name: string;
  location: string;
  total_capacity_mw?: number;
  active_investors_count?: number;
  efficiency_percent?: number;
  image_url?: string;
}

export interface DbRechargeRow {
  id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  amount_usdt?: number;
  deposit_address?: string;
  tx_hash?: string;
  status?: string;
  proof_image_url?: string | null;
  reviewer_notes?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
}

export interface DbWithdrawalRow {
  id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  amount_usdt?: number;
  fee_percent?: number;
  fee_amount_usdt?: number;
  net_amount_usdt?: number;
  wallet_address?: string;
  network?: string;
  status?: string;
  tx_hash?: string | null;
  reviewer_notes?: string | null;
  reviewed_by?: string | null;
  created_at: string;
  reviewed_at?: string | null;
}

export interface DbLedgerRow {
  id: string;
  user_id: string;
  type: string;
  amount?: number;
  balance_before?: number;
  balance_after?: number;
  description: string;
  reference_id?: string;
  created_at: string;
}

// Helper mappers between Postgres snake_case and TypeScript camelCase
function mapDbUser(row: DbUserRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    phone: row.phone || undefined,
    country: row.country || undefined,
    avatarUrl: row.avatar_url || undefined,
    role: row.role as 'USER' | 'SUPER_ADMIN',
    status: row.status as 'ACTIVE' | 'SUSPENDED' | 'BANNED',
    referralCode: row.referral_code,
    sponsorId: row.sponsor_id || null,
    leadershipLevel: (row.leadership_level as any) || 'SOLAR_MEMBER',
    points: Number(row.points || 0),
    availableBalance: Number(row.available_balance || 0),
    totalEarned: Number(row.total_earned || 0),
    kycStatus: (row.kyc_status as any) || 'UNVERIFIED',
    personalPv: Number(row.personal_pv || 0),
    groupPv: Number(row.group_pv || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at || new Date().toISOString(),
  };
}

function mapDbProfile(row: DbProfileRow): Profile {
  return {
    id: row.id || `prof-${row.user_id}`,
    userId: row.user_id,
    bio: row.bio || undefined,
    walletAddress: row.wallet_address || undefined,
    walletNetwork: (row.wallet_network as any) || 'USDT-TRC20',
    walletVerified: Boolean(row.wallet_verified),
    preferredCurrency: row.preferred_currency || 'USDT',
    twoFactorEnabled: Boolean(row.two_factor_enabled),
    emailNotifications: Boolean(row.email_notifications),
    pushNotifications: Boolean(row.push_notifications),
    telegramHandle: row.telegram_handle || undefined,
  };
}

function mapDbUnit(row: DbSolarUnitRow): SolarUnit {
  return {
    id: row.id,
    userId: row.user_id,
    planId: row.plan_id || row.id,
    planCode: row.plan_code,
    planName: row.plan_name,
    projectId: row.project_id || 'proj-mojave',
    projectName: row.project_name || 'Mojave Solar Matrix',
    location: row.location || 'Mojave Basin, CA',
    capacityKw: Number(row.capacity_kw || 0),
    imageUrl: row.image_url || undefined,
    activatedAt: row.purchase_date || row.created_at || new Date().toISOString(),
    expiresAt: row.expiry_date || new Date().toISOString(),
    purchasePriceUsdt: Number(row.purchase_price_usdt || 0),
    dailyEarningUsdt: Number(row.daily_earning_usdt || 0),
    workingDaysTotal: Number(row.working_days_total || 43),
    validityDays: 60,
    withdrawalFeePercent: 10,
    workingDaysCompleted: Number(row.working_days_completed || 0),
    workingDaysRemaining: Math.max(0, Number(row.working_days_total || 43) - Number(row.working_days_completed || 0)),
    status: (row.status as any) || 'ACTIVE',
    todayGeneratedKwh: 8.4,
    lifetimeGeneratedKwh: Number(row.working_days_completed || 0) * 8.4,
    todayEarnedUsdt: Number(row.today_earned_usdt || 0),
    lifetimeEarnedUsdt: Number(row.total_earned_usdt || 0),
    performanceRatio: 99.2,
    lastOperatedDate: row.last_operated_date || undefined,
    isReceivable: Boolean(row.is_receivable),
    receivableAmountUsdt: Number(row.receivable_amount_usdt || 0),
  };
}

function mapDbPlan(row: DbSolarPlanRow): SolarPlan {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    priceUsdt: Number(row.price_usdt || 0),
    currency: 'USDT',
    validityDays: Number(row.validity_days || 60),
    workingDaysTotal: Number(row.working_days_total || 43),
    dailyEarningUsdt: Number(row.daily_earning_usdt || 0),
    grossEarningUsdt: Number(row.gross_earning_usdt || 0),
    withdrawalFeePercent: Number(row.withdrawal_fee_percent || 0),
    netAfterFeeUsdt: Number(row.net_after_fee_usdt || 0),
    capacityKw: Number(row.capacity_kw || 0),
    capacityDescription: `${row.capacity_kw || 0.5} kW High-Efficiency Photovoltaic Module`,
    imageUrl: row.image_url || `/images/panel-${row.code?.toLowerCase() || 'p1'}.jpg`,
    features: Array.isArray(row.features) ? row.features : [],
    projectLocation: row.project_location || 'Sonoran Solar Basin, AZ',
    displayOrder: Number(row.display_order || 1),
    status: (row.status as any) || 'ACTIVE',
    operationStartTime: '12:00 PM',
    operationEndTime: '3:00 PM',
    operatingWeekdays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
  };
}

function mapDbProject(row: DbSolarProjectRow): SolarProject {
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    country: 'United States',
    coordinates: { lat: 34.0, lng: -118.0 },
    totalCapacityMw: Number(row.total_capacity_mw || 0),
    activeUnitsCount: Number(row.active_investors_count || 50),
    efficiencyRating: Number(row.efficiency_percent || 99.2),
    weatherCondition: 'SUNNY',
    temperatureC: 32,
    sunlightHours: 11,
    imageUrl: row.image_url || '/images/project-desert.jpg',
    status: 'OPERATIONAL',
  };
}

function mapDbRecharge(row: DbRechargeRow): RechargeRecord {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name || row.user_id,
    userEmail: row.user_email || '',
    amountUsdt: Number(row.amount_usdt || 0),
    currency: 'USDT-TRC20',
    method: 'CRYPTO_TRANSFER',
    destinationAddress: row.deposit_address || 'TYDzsYUbTmNuWw8m5Y3vX99Y8T7s1KLa2v',
    txReference: row.tx_hash,
    status: (row.status as any) || 'PENDING',
    proofImageUrl: row.proof_image_url || undefined,
    adminNotes: row.reviewer_notes || undefined,
    reviewerId: row.reviewed_by || undefined,
    reviewerName: row.reviewed_by || undefined,
    reviewedAt: row.reviewed_at || undefined,
    createdAt: row.created_at,
  };
}

function mapDbWithdrawal(row: DbWithdrawalRow): WithdrawalRequest {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name || row.user_id,
    userEmail: row.user_email || '',
    planCode: 'P1',
    amountUsdt: Number(row.amount_usdt || 0),
    feePercent: Number(row.fee_percent || 0),
    feeAmountUsdt: Number(row.fee_amount_usdt || 0),
    netAmountUsdt: Number(row.net_amount_usdt || 0),
    walletAddress: row.wallet_address || '',
    network: (row.network as any) || 'USDT-TRC20',
    status: (row.status as any) || 'PENDING',
    txHash: row.tx_hash || undefined,
    adminNotes: row.reviewer_notes || undefined,
    reviewerId: row.reviewed_by || undefined,
    reviewerName: row.reviewed_by || undefined,
    requestedAt: row.created_at || new Date().toISOString(),
    reviewedAt: row.reviewed_at || undefined,
  };
}

function mapDbLedger(row: DbLedgerRow): EarningsLedgerEntry {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type as any,
    amountUsdt: Number(row.amount || 0),
    balanceBefore: Number(row.balance_before || 0),
    balanceAfter: Number(row.balance_after || 0),
    description: row.description,
    referenceId: row.reference_id,
    createdAt: row.created_at,
  };
}

function mapDbProduct(row: any): Product {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    description: row.description || '',
    retailPrice: Number(row.retail_price || 0),
    commissionableValue: Number(row.commissionable_value || 0),
    category: row.category || 'HARDWARE',
    imageUrl: row.image_url || undefined,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function mapDbOrder(row: any, items?: OrderItem[]): Order {
  return {
    id: row.id,
    orderNo: row.order_no,
    userId: row.user_id,
    userName: row.user_name || row.users?.name || undefined,
    userEmail: row.user_email || row.users?.email || undefined,
    status: row.status,
    totalAmount: Number(row.total_amount || 0),
    totalPv: Number(row.total_pv || 0),
    paymentGatewayRef: row.payment_gateway_ref || undefined,
    idempotencyKey: row.idempotency_key || undefined,
    shippingAddress: row.shipping_address || undefined,
    items,
    paidAt: row.paid_at || undefined,
    refundedAt: row.refunded_at || undefined,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function mapDbOrderItem(row: any): OrderItem {
  return {
    id: row.id,
    orderId: row.order_id,
    productId: row.product_id,
    productName: row.products?.name || undefined,
    productSku: row.products?.sku || undefined,
    qty: Number(row.qty || 1),
    unitPrice: Number(row.unit_price || 0),
    pvAmount: Number(row.pv_amount || 0),
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function mapDbCommission(row: any): DirectCommission {
  return {
    id: row.id,
    orderId: row.order_id,
    orderNo: row.order_no || row.orders?.order_no || undefined,
    beneficiaryId: row.beneficiary_id,
    beneficiaryName: row.beneficiary_name || row.beneficiary?.name || undefined,
    buyerName: row.buyer_name || row.orders?.users?.name || undefined,
    level: Number(row.level) as 1 | 2 | 3,
    rate: Number(row.rate || 0),
    amount: Number(row.amount || 0),
    status: row.status,
    clawbackOf: row.clawback_of || undefined,
    idempotencyKey: row.idempotency_key,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function mapDbKyc(row: any): KycSubmission {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.users?.name || undefined,
    userEmail: row.users?.email || undefined,
    docType: row.doc_type,
    docNumber: row.doc_number,
    frontUrl: row.front_url,
    backUrl: row.back_url || undefined,
    status: row.status,
    rejectionReason: row.rejection_reason || undefined,
    reviewedBy: row.reviewed_by || undefined,
    reviewedAt: row.reviewed_at || undefined,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function mapDbPayoutMethod(row: any): PayoutMethod {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    details: row.details || {},
    isVerified: Boolean(row.is_verified),
    createdAt: row.created_at || new Date().toISOString(),
    verifiedAt: row.verified_at || undefined,
  };
}

function mapDbFraudSignal(row: any): FraudSignal {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.users?.name || undefined,
    userEmail: row.users?.email || undefined,
    signalType: row.signal_type,
    severity: row.severity,
    details: row.details || {},
    resolved: Boolean(row.resolved),
    createdAt: row.created_at || new Date().toISOString(),
  };
}

// In-memory fallback stores for offline/local development resiliency
const fallbackUsers = new Map<string, User>([
  [
    'usr-admin-marcus',
    {
      id: 'usr-admin-marcus',
      name: 'Marcus Vance',
      email: 'marcus.vance@solargrid.io',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      referralCode: 'SG-ADMIN-001',
      sponsorId: null,
      leadershipLevel: 'SOLAR_DIRECTOR',
      points: 100,
      availableBalance: 25000.0,
      totalEarned: 50000.0,
      failedLoginAttempts: 0,
      createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  [
    '00000000-0000-0000-0000-000000000001',
    {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Marcus Vance',
      email: 'marcus.vance@solargrid.io',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      referralCode: 'SG-ADMIN-001',
      sponsorId: null,
      leadershipLevel: 'SOLAR_DIRECTOR',
      points: 100,
      availableBalance: 25000.0,
      totalEarned: 50000.0,
      failedLoginAttempts: 0,
      createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  [
    'usr-demo-user',
    {
      id: 'usr-demo-user',
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@solargrid.io',
      role: 'USER',
      status: 'ACTIVE',
      referralCode: 'SG-SARAH-888',
      sponsorId: 'usr-admin-marcus',
      leadershipLevel: 'SOLAR_LEADER',
      points: 124,
      availableBalance: 1250.0,
      totalEarned: 350.0,
      failedLoginAttempts: 0,
      createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  [
    '22222222-2222-2222-2222-222222222222',
    {
      id: '22222222-2222-2222-2222-222222222222',
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@solargrid.io',
      role: 'USER',
      status: 'ACTIVE',
      referralCode: 'SG-SARAH-888',
      sponsorId: '00000000-0000-0000-0000-000000000001',
      leadershipLevel: 'SOLAR_LEADER',
      points: 124,
      availableBalance: 1250.0,
      totalEarned: 350.0,
      failedLoginAttempts: 0,
      createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  [
    'usr-alex-rivera',
    {
      id: 'usr-alex-rivera',
      name: 'Alex Rivera',
      email: 'alex.rivera@solargrid.io',
      role: 'USER',
      status: 'ACTIVE',
      referralCode: 'SG-ALEX-101',
      sponsorId: 'usr-demo-user',
      leadershipLevel: 'SOLAR_BUILDER',
      points: 112,
      availableBalance: 450.0,
      totalEarned: 180.0,
      failedLoginAttempts: 0,
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  [
    'usr-elena-rostova',
    {
      id: 'usr-elena-rostova',
      name: 'Elena Rostova',
      email: 'elena.rostova@solargrid.io',
      role: 'USER',
      status: 'ACTIVE',
      referralCode: 'SG-ELENA-202',
      sponsorId: 'usr-demo-user',
      leadershipLevel: 'SOLAR_MEMBER',
      points: 104,
      availableBalance: 620.0,
      totalEarned: 95.0,
      failedLoginAttempts: 0,
      createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  [
    'usr-david-kim',
    {
      id: 'usr-david-kim',
      name: 'David Kim',
      email: 'david.kim@solargrid.io',
      role: 'USER',
      status: 'ACTIVE',
      referralCode: 'SG-DAVID-303',
      sponsorId: 'usr-demo-user',
      leadershipLevel: 'SOLAR_MEMBER',
      points: 102,
      availableBalance: 180.0,
      totalEarned: 34.0,
      failedLoginAttempts: 0,
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  [
    'usr-michael-chang',
    {
      id: 'usr-michael-chang',
      name: 'Michael Chang',
      email: 'michael.chang@solargrid.io',
      role: 'USER',
      status: 'ACTIVE',
      referralCode: 'SG-MIKE-404',
      sponsorId: 'usr-alex-rivera',
      leadershipLevel: 'SOLAR_MEMBER',
      points: 106,
      availableBalance: 310.0,
      totalEarned: 120.0,
      failedLoginAttempts: 0,
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  [
    'usr-sophia-martinez',
    {
      id: 'usr-sophia-martinez',
      name: 'Sophia Martinez',
      email: 'sophia.martinez@solargrid.io',
      role: 'USER',
      status: 'ACTIVE',
      referralCode: 'SG-SOPHIA-505',
      sponsorId: 'usr-alex-rivera',
      leadershipLevel: 'SOLAR_MEMBER',
      points: 100,
      availableBalance: 85.0,
      totalEarned: 15.0,
      failedLoginAttempts: 0,
      createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  [
    'usr-liam-chen',
    {
      id: 'usr-liam-chen',
      name: 'Liam Chen',
      email: 'liam.chen@solargrid.io',
      role: 'USER',
      status: 'ACTIVE',
      referralCode: 'SG-LIAM-606',
      sponsorId: 'usr-michael-chang',
      leadershipLevel: 'SOLAR_MEMBER',
      points: 102,
      availableBalance: 220.0,
      totalEarned: 45.0,
      failedLoginAttempts: 0,
      createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
] as [string, User][]);

const fallbackProfiles = new Map<string, Profile>([
  [
    'usr-demo-user',
    {
      id: 'prof-usr-demo-user',
      userId: 'usr-demo-user',
      preferredCurrency: 'USDT',
      walletAddress: 'TYDzsYUbTmNuWw8m5Y3vX99Y8T7s1KLa2v',
      walletNetwork: 'USDT-TRC20',
      walletVerified: true,
      twoFactorEnabled: false,
      emailNotifications: true,
      pushNotifications: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  [
    '22222222-2222-2222-2222-222222222222',
    {
      id: 'prof-usr-demo-user-uuid',
      userId: '22222222-2222-2222-2222-222222222222',
      preferredCurrency: 'USDT',
      walletAddress: 'TYDzsYUbTmNuWw8m5Y3vX99Y8T7s1KLa2v',
      walletNetwork: 'USDT-TRC20',
      walletVerified: true,
      twoFactorEnabled: false,
      emailNotifications: true,
      pushNotifications: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  [
    'usr-admin-marcus',
    {
      id: 'prof-usr-admin-marcus',
      userId: 'usr-admin-marcus',
      preferredCurrency: 'USDT',
      walletAddress: 'TX9d823489247823748293748239748923',
      walletNetwork: 'USDT-TRC20',
      walletVerified: true,
      twoFactorEnabled: true,
      emailNotifications: true,
      pushNotifications: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  [
    '00000000-0000-0000-0000-000000000001',
    {
      id: 'prof-usr-admin-marcus-uuid',
      userId: '00000000-0000-0000-0000-000000000001',
      preferredCurrency: 'USDT',
      walletAddress: 'TX9d823489247823748293748239748923',
      walletNetwork: 'USDT-TRC20',
      walletVerified: true,
      twoFactorEnabled: true,
      emailNotifications: true,
      pushNotifications: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  [
    'usr-alex-rivera',
    {
      id: 'prof-usr-alex',
      userId: 'usr-alex-rivera',
      preferredCurrency: 'USDT',
      walletAddress: 'TN9m3kLa8b71Vw93Lm8X7102LmP982Ytr',
      walletNetwork: 'USDT-TRC20',
      walletVerified: true,
      twoFactorEnabled: false,
      emailNotifications: true,
      pushNotifications: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  [
    'usr-elena-rostova',
    {
      id: 'prof-usr-elena',
      userId: 'usr-elena-rostova',
      preferredCurrency: 'USDT',
      walletAddress: 'TQ82kLa119Y8T7s1KLa2vTYDzsYUbTmNu',
      walletNetwork: 'USDT-TRC20',
      walletVerified: true,
      twoFactorEnabled: false,
      emailNotifications: true,
      pushNotifications: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
] as [string, Profile][]);

const fallbackUnits = new Map<string, SolarUnit>([
  [
    'unit-sarah-p1',
    {
      id: 'unit-sarah-p1',
      userId: 'usr-demo-user',
      planId: 'plan-p1-starter',
      planCode: 'P1',
      planName: 'P1 Solar Panel',
      projectId: 'proj-sonoran',
      projectName: 'Sonoran Solar Basin Alpha',
      location: 'Maricopa County, Arizona',
      capacityKw: 1.0,
      activatedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      expiresAt: new Date(Date.now() + 46 * 86400000).toISOString(),
      purchasePriceUsdt: 35.0,
      dailyEarningUsdt: 0.8,
      workingDaysTotal: 43,
      validityDays: 60,
      withdrawalFeePercent: 10,
      workingDaysCompleted: 14,
      workingDaysRemaining: 29,
      status: 'ACTIVE',
      todayGeneratedKwh: 8.4,
      lifetimeGeneratedKwh: 117.6,
      todayEarnedUsdt: 0,
      lifetimeEarnedUsdt: 11.2,
      totalEarnedUsdt: 11.2,
      performanceRatio: 99.2,
      isReceivable: false,
      receivableAmountUsdt: 0,
      purchaseDate: new Date(Date.now() - 14 * 86400000).toISOString(),
      expiryDate: new Date(Date.now() + 46 * 86400000).toISOString(),
    },
  ],
  [
    'unit-sarah-p2',
    {
      id: 'unit-sarah-p2',
      userId: 'usr-demo-user',
      planId: 'p2',
      planCode: 'P2',
      planName: 'P2 High-Yield Solar Unit',
      projectId: 'proj-sonoran',
      projectName: 'Sonoran Clean Solar Park',
      location: 'Sonoran Clean Solar Park',
      capacityKw: 5.0,
      activatedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      expiresAt: new Date(Date.now() + 46 * 86400000).toISOString(),
      purchasePriceUsdt: 150.0,
      dailyEarningUsdt: 3.4,
      workingDaysTotal: 43,
      validityDays: 60,
      withdrawalFeePercent: 10,
      workingDaysCompleted: 14,
      workingDaysRemaining: 29,
      status: 'ACTIVE',
      todayGeneratedKwh: 42.0,
      lifetimeGeneratedKwh: 588.0,
      todayEarnedUsdt: 3.4,
      lifetimeEarnedUsdt: 47.6,
      totalEarnedUsdt: 47.6,
      performanceRatio: 99.4,
      isReceivable: false,
      receivableAmountUsdt: 0,
      purchaseDate: new Date(Date.now() - 14 * 86400000).toISOString(),
      expiryDate: new Date(Date.now() + 46 * 86400000).toISOString(),
    },
  ],
  [
    'unit-alex-p3',
    {
      id: 'unit-alex-p3',
      userId: 'usr-alex-rivera',
      planId: 'p3',
      planCode: 'P3',
      planName: 'P3 Commercial Solar Unit',
      projectId: 'proj-sonoran',
      projectName: 'Sonoran Clean Solar Park',
      location: 'Sonoran Clean Solar Park',
      capacityKw: 10.0,
      activatedAt: new Date(Date.now() - 12 * 86400000).toISOString(),
      expiresAt: new Date(Date.now() + 48 * 86400000).toISOString(),
      purchasePriceUsdt: 300.0,
      dailyEarningUsdt: 7.2,
      workingDaysTotal: 43,
      validityDays: 60,
      withdrawalFeePercent: 10,
      workingDaysCompleted: 12,
      workingDaysRemaining: 31,
      status: 'ACTIVE',
      todayGeneratedKwh: 84.0,
      lifetimeGeneratedKwh: 1008.0,
      todayEarnedUsdt: 7.2,
      lifetimeEarnedUsdt: 86.4,
      totalEarnedUsdt: 86.4,
      performanceRatio: 99.8,
      isReceivable: false,
      receivableAmountUsdt: 0,
      purchaseDate: new Date(Date.now() - 12 * 86400000).toISOString(),
      expiryDate: new Date(Date.now() + 48 * 86400000).toISOString(),
    },
  ],
  [
    'unit-elena-p1',
    {
      id: 'unit-elena-p1',
      userId: 'usr-elena-rostova',
      planId: 'p1',
      planCode: 'P1',
      planName: 'P1 Distributed Solar Unit',
      projectId: 'proj-sonoran',
      projectName: 'Sonoran Clean Solar Park',
      location: 'Sonoran Clean Solar Park',
      capacityKw: 1.0,
      activatedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      expiresAt: new Date(Date.now() + 50 * 86400000).toISOString(),
      purchasePriceUsdt: 35.0,
      dailyEarningUsdt: 0.8,
      workingDaysTotal: 43,
      validityDays: 60,
      withdrawalFeePercent: 10,
      workingDaysCompleted: 10,
      workingDaysRemaining: 33,
      status: 'ACTIVE',
      todayGeneratedKwh: 8.4,
      lifetimeGeneratedKwh: 84.0,
      todayEarnedUsdt: 0.8,
      lifetimeEarnedUsdt: 8.0,
      totalEarnedUsdt: 8.0,
      performanceRatio: 99.1,
      isReceivable: false,
      receivableAmountUsdt: 0,
      purchaseDate: new Date(Date.now() - 10 * 86400000).toISOString(),
      expiryDate: new Date(Date.now() + 50 * 86400000).toISOString(),
    },
  ],
  [
    'unit-michael-p4',
    {
      id: 'unit-michael-p4',
      userId: 'usr-michael-chang',
      planId: 'p4',
      planCode: 'P4',
      planName: 'P4 Industrial Solar Unit',
      projectId: 'proj-sonoran',
      projectName: 'Sonoran Clean Solar Park',
      location: 'Sonoran Clean Solar Park',
      capacityKw: 20.0,
      activatedAt: new Date(Date.now() - 8 * 86400000).toISOString(),
      expiresAt: new Date(Date.now() + 52 * 86400000).toISOString(),
      purchasePriceUsdt: 600.0,
      dailyEarningUsdt: 15.0,
      workingDaysTotal: 43,
      validityDays: 60,
      withdrawalFeePercent: 10,
      workingDaysCompleted: 8,
      workingDaysRemaining: 35,
      status: 'ACTIVE',
      todayGeneratedKwh: 168.0,
      lifetimeGeneratedKwh: 1344.0,
      todayEarnedUsdt: 15.0,
      lifetimeEarnedUsdt: 120.0,
      totalEarnedUsdt: 120.0,
      performanceRatio: 99.6,
      isReceivable: false,
      receivableAmountUsdt: 0,
      purchaseDate: new Date(Date.now() - 8 * 86400000).toISOString(),
      expiryDate: new Date(Date.now() + 52 * 86400000).toISOString(),
    },
  ],
] as [string, SolarUnit][]);

const fallbackRecharges = new Map<string, RechargeRecord>([
  [
    'rch-001',
    {
      id: 'rch-001',
      userId: 'usr-david-kim',
      userName: 'David Kim',
      userEmail: 'david.kim@gmail.com',
      amountUsdt: 150.0,
      currency: 'USDT-TRC20',
      method: 'CRYPTO_TRANSFER',
      destinationAddress: 'TYDzsYUbTmNuWw8m5Y3vX99Y8T7s1KLa2v',
      txReference: '0x7f83b194a2b84c90e1f72384a59d8c91a3e82b71940182390a18392182048192',
      status: 'PENDING',
      adminNotes: 'USDT deposit for P2 upgrade',
      createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    },
  ],
  [
    'rch-002',
    {
      id: 'rch-002',
      userId: 'usr-alex-rivera',
      userName: 'Alex Rivera',
      userEmail: 'alex.rivera@gmail.com',
      amountUsdt: 300.0,
      currency: 'USDT-TRC20',
      method: 'CRYPTO_TRANSFER',
      destinationAddress: 'TYDzsYUbTmNuWw8m5Y3vX99Y8T7s1KLa2v',
      txReference: '0x1928401928301928301928301928301928301928301928301928301928301928',
      status: 'APPROVED',
      adminNotes: 'Approved via TRON network verification',
      createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    },
  ],
]);

const fallbackWithdrawals = new Map<string, WithdrawalRequest>([
  [
    'wth-001',
    {
      id: 'wth-001',
      userId: 'usr-alex-rivera',
      userName: 'Alex Rivera',
      userEmail: 'alex.rivera@gmail.com',
      planCode: 'P3',
      amountUsdt: 120.0,
      feePercent: 10,
      feeAmountUsdt: 12.0,
      netAmountUsdt: 108.0,
      walletAddress: 'TN9m3kLa8b71Vw93Lm8X7102LmP982Ytr',
      network: 'USDT-TRC20',
      status: 'PENDING',
      requestedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
      createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    },
  ],
  [
    'wth-002',
    {
      id: 'wth-002',
      userId: 'usr-demo-user',
      userName: 'Sarah Jenkins',
      userEmail: 'sarah.jenkins@gmail.com',
      planCode: 'P2',
      amountUsdt: 200.0,
      feePercent: 10,
      feeAmountUsdt: 20.0,
      netAmountUsdt: 180.0,
      walletAddress: 'TYDzsYUbTmNuWw8m5Y3vX99Y8T7s1KLa2v',
      network: 'USDT-TRC20',
      status: 'COMPLETED',
      txHash: '0xabc1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      requestedAt: new Date(Date.now() - 48 * 3600000).toISOString(),
      createdAt: new Date(Date.now() - 48 * 3600000).toISOString(),
    },
  ],
]);

const fallbackTickets = new Map<string, SupportTicket>();
const fallbackAudits: AuditLog[] = [];

const fallbackCommissions = new Map<string, DirectCommission>([
  [
    'comm-001',
    {
      id: 'comm-001',
      orderId: 'unit-alex-p3',
      orderNo: 'ORD-P3-ALEX',
      buyerId: 'usr-alex-rivera',
      buyerName: 'Alex Rivera',
      beneficiaryId: 'usr-demo-user',
      beneficiaryName: 'Sarah Jenkins',
      level: 1,
      rate: 10.0,
      amount: 30.0,
      status: 'APPROVED',
      idempotencyKey: 'COMM_ALEX_P3_L1_SARAH',
      createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    },
  ],
  [
    'comm-002',
    {
      id: 'comm-002',
      orderId: 'unit-elena-p1',
      orderNo: 'ORD-P1-ELENA',
      buyerId: 'usr-elena-rostova',
      buyerName: 'Elena Rostova',
      beneficiaryId: 'usr-demo-user',
      beneficiaryName: 'Sarah Jenkins',
      level: 1,
      rate: 10.0,
      amount: 3.5,
      status: 'APPROVED',
      idempotencyKey: 'COMM_ELENA_P1_L1_SARAH',
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    },
  ],
  [
    'comm-003',
    {
      id: 'comm-003',
      orderId: 'unit-michael-p4',
      orderNo: 'ORD-P4-MIKE',
      buyerId: 'usr-michael-chang',
      buyerName: 'Michael Chang',
      beneficiaryId: 'usr-alex-rivera',
      beneficiaryName: 'Alex Rivera',
      level: 1,
      rate: 10.0,
      amount: 60.0,
      status: 'APPROVED',
      idempotencyKey: 'COMM_MIKE_P4_L1_ALEX',
      createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    },
  ],
  [
    'comm-004',
    {
      id: 'comm-004',
      orderId: 'unit-michael-p4',
      orderNo: 'ORD-P4-MIKE',
      buyerId: 'usr-michael-chang',
      buyerName: 'Michael Chang',
      beneficiaryId: 'usr-demo-user',
      beneficiaryName: 'Sarah Jenkins',
      level: 2,
      rate: 3.0,
      amount: 18.0,
      status: 'APPROVED',
      idempotencyKey: 'COMM_MIKE_P4_L2_SARAH',
      createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    },
  ],
  [
    'comm-005',
    {
      id: 'comm-005',
      orderId: 'unit-liam-p1',
      orderNo: 'ORD-P1-LIAM',
      buyerId: 'usr-liam-chen',
      buyerName: 'Liam Chen',
      beneficiaryId: 'usr-michael-chang',
      beneficiaryName: 'Michael Chang',
      level: 1,
      rate: 10.0,
      amount: 3.5,
      status: 'APPROVED',
      idempotencyKey: 'COMM_LIAM_P1_L1_MIKE',
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
  ],
  [
    'comm-006',
    {
      id: 'comm-006',
      orderId: 'unit-liam-p1',
      orderNo: 'ORD-P1-LIAM',
      buyerId: 'usr-liam-chen',
      buyerName: 'Liam Chen',
      beneficiaryId: 'usr-alex-rivera',
      beneficiaryName: 'Alex Rivera',
      level: 2,
      rate: 3.0,
      amount: 1.05,
      status: 'APPROVED',
      idempotencyKey: 'COMM_LIAM_P1_L2_ALEX',
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
  ],
  [
    'comm-007',
    {
      id: 'comm-007',
      orderId: 'unit-liam-p1',
      orderNo: 'ORD-P1-LIAM',
      buyerId: 'usr-liam-chen',
      buyerName: 'Liam Chen',
      beneficiaryId: 'usr-demo-user',
      beneficiaryName: 'Sarah Jenkins',
      level: 3 as any,
      rate: 1.0,
      amount: 0.35,
      status: 'APPROVED',
      idempotencyKey: 'COMM_LIAM_P1_L3_SARAH',
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
  ],
]);

const fallbackProducts = new Map<string, Product>([
  [
    'prod-1',
    {
      id: 'prod-1',
      sku: 'SOL-500W-PANEL',
      name: 'SolarGrid 500W High-Efficiency Monocrystalline Panel',
      description: 'Commercial-grade photovoltaic module with 22.8% cell efficiency and 25-year warranty.',
      retailPrice: 180.0,
      commissionableValue: 150.0,
      category: 'HARDWARE',
      imageUrl: '/images/panel-p1.jpg',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ],
  [
    'prod-2',
    {
      id: 'prod-2',
      sku: 'INV-3KW-SMART',
      name: 'SolarGrid 3kW Hybrid Grid-Tie Smart Inverter',
      description: 'Pure sine wave inverter with dual MPPT charge controller and cloud energy tracking.',
      retailPrice: 450.0,
      commissionableValue: 400.0,
      category: 'HARDWARE',
      imageUrl: '/images/panel-p2.jpg',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ],
  [
    'prod-3',
    {
      id: 'prod-3',
      sku: 'SOL-KIT-2KWH',
      name: 'SolarGrid 2.4kWh LiFePO4 Energy Storage Station',
      description: 'Modular lithium-iron phosphate battery backup system with 6,000+ cycle lifespan.',
      retailPrice: 850.0,
      commissionableValue: 750.0,
      category: 'HARDWARE',
      imageUrl: '/images/panel-p3.jpg',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ],
  [
    'prod-4',
    {
      id: 'prod-4',
      sku: 'IOT-MONITOR-PRO',
      name: 'SolarGrid Smart IoT Energy Consumption Monitor',
      description: 'Real-time panel telemetry gateway with Zigbee mesh and mobile analytics connectivity.',
      retailPrice: 95.0,
      commissionableValue: 80.0,
      category: 'ACCESSORIES',
      imageUrl: '/images/panel-p4.jpg',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ],
  [
    'prod-5',
    {
      id: 'prod-5',
      sku: 'SRV-AUDIT-HOME',
      name: 'Professional Residential Solar Engineering Assessment',
      description: 'Comprehensive on-site shade, irradiation, and structural installation engineering audit.',
      retailPrice: 120.0,
      commissionableValue: 100.0,
      category: 'SERVICES',
      imageUrl: '/images/panel-p5.jpg',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ],
]);

const fallbackOrders = new Map<string, Order>();
const fallbackOrderItems: OrderItem[] = [];
const fallbackKyc = new Map<string, KycSubmission>();
const fallbackPayoutMethods = new Map<string, PayoutMethod>();
const fallbackFraudSignals = new Map<string, FraudSignal>();
const fallbackLedger = new Map<string, EarningsLedgerEntry>();

export class DatabaseService {
  // ===================== USERS =====================
  static async getUserById(id: string): Promise<User | null> {
    try {
      const dbClient = getDbClient();
      const { data, error } = await dbClient.from('users').select('*').eq('id', id).single();
      if (!error && data) return mapDbUser(data);
    } catch {}
    return fallbackUsers.get(id) || null;
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      const dbClient = getDbClient();
      const { data, error } = await dbClient.from('users').select('*').ilike('email', email.trim()).single();
      if (!error && data) return mapDbUser(data);
    } catch {}
    for (const u of fallbackUsers.values()) {
      if (u.email.toLowerCase() === email.trim().toLowerCase()) return u;
    }
    return null;
  }

  static async getUserWithPasswordByEmail(email: string): Promise<(User & { passwordHash?: string }) | null> {
    try {
      const dbClient = getDbClient();
      const { data, error } = await dbClient.from('users').select('*').ilike('email', email.trim()).single();
      if (!error && data) {
        const user = mapDbUser(data);
        return { ...user, passwordHash: data.password_hash };
      }
    } catch {}
    for (const u of fallbackUsers.values()) {
      if (u.email.toLowerCase() === email.trim().toLowerCase()) {
        return {
          ...u,
          passwordHash: (u as any).passwordHash,
        };
      }
    }
    return null;
  }

  static async getUserByReferralCode(code: string): Promise<User | null> {
    try {
      const dbClient = getDbClient();
      const { data, error } = await dbClient.from('users').select('*').eq('referral_code', code.trim()).single();
      if (!error && data) return mapDbUser(data);
    } catch {}
    for (const u of fallbackUsers.values()) {
      if (u.referralCode?.toUpperCase() === code.trim().toUpperCase()) return u;
    }
    return null;
  }

  static async getAllUsers(): Promise<User[]> {
    try {
      const dbClient = getDbClient();
      const { data, error } = await dbClient.from('users').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) return data.map(mapDbUser);
    } catch {}
    return Array.from(fallbackUsers.values());
  }

  static async getUsersBySponsorIds(sponsorIds: string[]): Promise<User[]> {
    if (!sponsorIds || sponsorIds.length === 0) return [];
    try {
      const dbClient = getDbClient();
      const { data, error } = await dbClient.from('users').select('*').in('sponsor_id', sponsorIds);
      if (!error && data) return data.map(mapDbUser);
    } catch {}
    const results: User[] = [];
    for (const u of fallbackUsers.values()) {
      if (u.sponsorId && sponsorIds.includes(u.sponsorId)) {
        results.push(u);
      }
    }
    return results;
  }

  static async updateUserPassword(id: string, newPasswordHash: string): Promise<boolean> {
    try {
      const dbClient = getDbClient();
      await dbClient.from('users').update({ password_hash: newPasswordHash }).eq('id', id);
      return true;
    } catch {}
    const u = fallbackUsers.get(id);
    if (u) (u as any).passwordHash = newPasswordHash;
    return true;
  }

  static async createUser(userData: {
    id?: string;
    email: string;
    name: string;
    phone?: string;
    country?: string;
    referralCode?: string;
    sponsorId?: string | null;
    role?: 'USER' | 'SUPER_ADMIN';
    status?: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'BANNED';
    availableBalance?: number;
    kycStatus?: KycStatus;
    personalPv?: number;
    groupPv?: number;
    passwordHash?: string;
  }): Promise<User> {
    const userId = userData.id || `usr-${Date.now()}`;
    const insertPayload = {
      id: userId,
      email: userData.email,
      name: userData.name,
      phone: userData.phone || null,
      country: userData.country || 'United States',
      role: userData.role || 'USER',
      status: 'ACTIVE',
      referral_code: userData.referralCode || `SG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      sponsor_id: userData.sponsorId || null,
      leadership_level: 'SOLAR_MEMBER',
      points: 100,
      available_balance: (userData as any).availableBalance !== undefined ? (userData as any).availableBalance : 0,
      total_earned: 0,
      failed_login_attempts: 0,
      kyc_status: (userData as any).kycStatus || 'UNVERIFIED',
      personal_pv: (userData as any).personalPv || 0,
      group_pv: (userData as any).groupPv || 0,
      password_hash: (userData as any).passwordHash || '$2a$10$authManagedPasswordPlaceholder0000000000000000000000000',
    };

    try {
      const dbClient = getDbClient();
      const { data, error } = await dbClient.from('users').insert(insertPayload).select().single();
      if (!error && data) {
        try {
          await dbClient.from('profiles').upsert({
            user_id: data.id,
            preferred_currency: 'USDT',
            wallet_network: 'USDT-TRC20',
            wallet_verified: false,
            two_factor_enabled: false,
            email_notifications: true,
            push_notifications: true,
          });
        } catch {}
        return mapDbUser(data);
      }
    } catch {}

    const localUser: User = {
      id: userId,
      email: userData.email,
      name: userData.name,
      phone: userData.phone || '+1 (555) 000-0000',
      country: userData.country || 'United States',
      role: userData.role || 'USER',
      status: 'ACTIVE',
      referralCode: insertPayload.referral_code,
      sponsorId: userData.sponsorId || null,
      leadershipLevel: 'SOLAR_MEMBER',
      points: 100,
      availableBalance: (userData as any).availableBalance !== undefined ? (userData as any).availableBalance : 0,
      totalEarned: 0,
      failedLoginAttempts: 0,
      kycStatus: (userData as any).kycStatus || 'UNVERIFIED',
      personalPv: (userData as any).personalPv || 0,
      groupPv: (userData as any).groupPv || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    fallbackUsers.set(userId, localUser);
    fallbackProfiles.set(userId, {
      id: `prof-${userId}`,
      userId,
      preferredCurrency: 'USDT',
      walletNetwork: 'USDT-TRC20',
      walletVerified: false,
      twoFactorEnabled: false,
      emailNotifications: true,
      pushNotifications: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return localUser;
  }

  static async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const dbUpdates: any = { updated_at: new Date().toISOString() };

    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.country !== undefined) dbUpdates.country = updates.country;
    if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.leadershipLevel !== undefined) dbUpdates.leadership_level = updates.leadershipLevel;
    if (updates.points !== undefined) dbUpdates.points = updates.points;
    if (updates.availableBalance !== undefined) dbUpdates.available_balance = updates.availableBalance;
    if (updates.totalEarned !== undefined) dbUpdates.total_earned = updates.totalEarned;
    if (updates.role !== undefined) dbUpdates.role = updates.role;

    try {
      const dbClient = getDbClient();
      const { data, error } = await dbClient.from('users').update(dbUpdates).eq('id', id).select().single();
      if (!error && data) return mapDbUser(data);
    } catch {}

    const existing = fallbackUsers.get(id);
    if (existing) {
      const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
      fallbackUsers.set(id, updated);
      return updated;
    }
    return null;
  }

  /**
   * Atomically debits a user's available balance with strict conditional checks.
   * Prevents race condition double-spending via Postgres RPC & CAS optimistic concurrency.
   */
  static async atomicDebitBalance(
    userId: string,
    amount: number
  ): Promise<{ success: boolean; balanceBefore: number; balanceAfter: number; user?: User; message?: string }> {
    if (amount <= 0) return { success: false, balanceBefore: 0, balanceAfter: 0, message: 'Invalid debit amount' };
    const dbClient = getDbClient();

    // 1. Try atomic PostgreSQL stored procedure first
    try {
      const { data: rpcData, error: rpcErr } = await dbClient.rpc('debit_user_balance', {
        p_user_id: userId,
        p_amount: amount,
      });
      if (!rpcErr && Array.isArray(rpcData) && rpcData.length > 0) {
        const row = rpcData[0];
        if (!row.success) {
          return {
            success: false,
            balanceBefore: Number(row.balance_before),
            balanceAfter: Number(row.balance_after),
            message: row.message || 'Insufficient balance',
          };
        }
        const updatedUser = await this.getUserById(userId);
        return {
          success: true,
          balanceBefore: Number(row.balance_before),
          balanceAfter: Number(row.balance_after),
          user: updatedUser || undefined,
        };
      }
    } catch {}

    // 2. Strict Optimistic Concurrency Control (CAS) with Retry Loop
    const MAX_RETRIES = 3;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const { data: userRow, error: fetchErr } = await dbClient
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchErr || !userRow) {
        const local = fallbackUsers.get(userId);
        if (local) {
          if (local.availableBalance < amount) {
            return {
              success: false,
              balanceBefore: local.availableBalance,
              balanceAfter: local.availableBalance,
              message: `Insufficient balance. Available: ${local.availableBalance.toFixed(2)} USDT, Required: ${amount.toFixed(2)} USDT`,
            };
          }
          const before = local.availableBalance;
          const after = Math.round((before - amount) * 10000) / 10000;
          local.availableBalance = after;
          return { success: true, balanceBefore: before, balanceAfter: after, user: local };
        }
        return { success: false, balanceBefore: 0, balanceAfter: 0, message: 'User not found' };
      }

      const currentBalance = Number(userRow.available_balance || 0);
      if (currentBalance < amount) {
        return {
          success: false,
          balanceBefore: currentBalance,
          balanceAfter: currentBalance,
          message: `Insufficient balance. Available: ${currentBalance.toFixed(2)} USDT, Required: ${amount.toFixed(2)} USDT`,
        };
      }

      const newBalance = Math.round((currentBalance - amount) * 10000) / 10000;

      // Strict CAS condition: matches exact current balance at time of read
      const { data: updatedRow, error: updateErr } = await dbClient
        .from('users')
        .update({
          available_balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .eq('available_balance', currentBalance)
        .select('*')
        .single();

      if (!updateErr && updatedRow) {
        return {
          success: true,
          balanceBefore: currentBalance,
          balanceAfter: Number(updatedRow.available_balance),
          user: mapDbUser(updatedRow),
        };
      }
    }

    return {
      success: false,
      balanceBefore: 0,
      balanceAfter: 0,
      message: 'Concurrent balance modification detected. Please retry.',
    };
  }

  /**
   * Atomically credits a user's available balance and cumulative total_earned.
   */
  static async atomicCreditBalance(
    userId: string,
    amount: number,
    totalEarnedDelta: number = 0
  ): Promise<{ success: boolean; balanceBefore: number; balanceAfter: number; user?: User; message?: string }> {
    if (amount <= 0) return { success: false, balanceBefore: 0, balanceAfter: 0, message: 'Invalid credit amount' };
    const dbClient = getDbClient();

    // 1. Try atomic PostgreSQL stored procedure first
    try {
      const { data: rpcData, error: rpcErr } = await dbClient.rpc('credit_user_balance', {
        p_user_id: userId,
        p_amount: amount,
        p_total_earned_delta: totalEarnedDelta,
      });
      if (!rpcErr && Array.isArray(rpcData) && rpcData.length > 0) {
        const row = rpcData[0];
        const updatedUser = await this.getUserById(userId);
        return {
          success: true,
          balanceBefore: Number(row.balance_before),
          balanceAfter: Number(row.balance_after),
          user: updatedUser || undefined,
        };
      }
    } catch {}

    // 2. Strict Optimistic Concurrency Control (CAS) with Retry Loop
    const MAX_RETRIES = 3;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const { data: userRow, error: fetchErr } = await dbClient
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchErr || !userRow) {
        const local = fallbackUsers.get(userId);
        if (local) {
          const before = local.availableBalance;
          const after = Math.round((before + amount) * 10000) / 10000;
          local.availableBalance = after;
          local.totalEarned = Math.round(((local.totalEarned || 0) + totalEarnedDelta) * 10000) / 10000;
          return { success: true, balanceBefore: before, balanceAfter: after, user: local };
        }
        return { success: false, balanceBefore: 0, balanceAfter: 0, message: 'User not found' };
      }

      const currentBalance = Number(userRow.available_balance || 0);
      const currentTotalEarned = Number(userRow.total_earned || 0);

      const newBalance = Math.round((currentBalance + amount) * 10000) / 10000;
      const newTotalEarned = Math.round((currentTotalEarned + totalEarnedDelta) * 10000) / 10000;

      const { data: updatedRow, error: updateErr } = await dbClient
        .from('users')
        .update({
          available_balance: newBalance,
          total_earned: newTotalEarned,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .eq('available_balance', currentBalance)
        .select('*')
        .single();

      if (!updateErr && updatedRow) {
        return {
          success: true,
          balanceBefore: currentBalance,
          balanceAfter: Number(updatedRow.available_balance),
          user: mapDbUser(updatedRow),
        };
      }
    }

    return {
      success: false,
      balanceBefore: 0,
      balanceAfter: 0,
      message: 'Failed to credit balance after retrying.',
    };
  }

  static async atomicDeductPoints(
    userId: string,
    pointsToDeduct: number
  ): Promise<{ success: boolean; balanceBefore: number; balanceAfter: number; message?: string }> {
    if (pointsToDeduct <= 0) return { success: false, balanceBefore: 0, balanceAfter: 0, message: 'Invalid deduction amount' };
    const dbClient = getDbClient();

    const MAX_RETRIES = 3;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const { data: userRow, error: fetchErr } = await dbClient
        .from('users')
        .select('id, points')
        .eq('id', userId)
        .single();

      if (fetchErr || !userRow) {
        const local = fallbackUsers.get(userId);
        if (local) {
          if ((local.points || 0) < pointsToDeduct) {
            return {
              success: false,
              balanceBefore: local.points || 0,
              balanceAfter: local.points || 0,
              message: `Insufficient points. Current: ${local.points || 0}, Required: ${pointsToDeduct}`,
            };
          }
          const before = local.points || 0;
          const after = before - pointsToDeduct;
          local.points = after;
          return { success: true, balanceBefore: before, balanceAfter: after };
        }
        return { success: false, balanceBefore: 0, balanceAfter: 0, message: 'User not found' };
      }

      const currentPoints = Number(userRow.points || 0);
      if (currentPoints < pointsToDeduct) {
        return {
          success: false,
          balanceBefore: currentPoints,
          balanceAfter: currentPoints,
          message: `Insufficient points. Current: ${currentPoints}, Required: ${pointsToDeduct}`,
        };
      }

      const newPoints = currentPoints - pointsToDeduct;

      const { data: updatedRow, error: updateErr } = await dbClient
        .from('users')
        .update({
          points: newPoints,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .eq('points', currentPoints)
        .select('*')
        .single();

      if (!updateErr && updatedRow) {
        return {
          success: true,
          balanceBefore: currentPoints,
          balanceAfter: Number(updatedRow.points),
        };
      }
    }

    return {
      success: false,
      balanceBefore: 0,
      balanceAfter: 0,
      message: 'Failed to deduct points due to high concurrency. Please try again.',
    };
  }

  // ===================== PROFILES =====================
  static async getProfile(userId: string): Promise<Profile | null> {
    try {
      const dbClient = getDbClient();
      const { data, error } = await dbClient.from('profiles').select('*').eq('user_id', userId).single();
      if (!error && data) return mapDbProfile(data);
    } catch {}
    return fallbackProfiles.get(userId) || null;
  }

  static async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
    const dbUpdates: any = { updated_at: new Date().toISOString() };

    if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
    if (updates.walletAddress !== undefined) dbUpdates.wallet_address = updates.walletAddress;
    if (updates.walletNetwork !== undefined) dbUpdates.wallet_network = updates.walletNetwork;
    if (updates.walletVerified !== undefined) dbUpdates.wallet_verified = updates.walletVerified;
    if (updates.preferredCurrency !== undefined) dbUpdates.preferred_currency = updates.preferredCurrency;
    if (updates.twoFactorEnabled !== undefined) dbUpdates.two_factor_enabled = updates.twoFactorEnabled;
    if (updates.emailNotifications !== undefined) dbUpdates.email_notifications = updates.emailNotifications;
    if (updates.pushNotifications !== undefined) dbUpdates.push_notifications = updates.pushNotifications;
    if (updates.telegramHandle !== undefined) dbUpdates.telegram_handle = updates.telegramHandle;

    try {
      const dbClient = getDbClient();
      const { data, error } = await dbClient
        .from('profiles')
        .upsert({ user_id: userId, ...dbUpdates }, { onConflict: 'user_id' })
        .select()
        .single();
      if (!error && data) return mapDbProfile(data);
    } catch {}

    const existing = fallbackProfiles.get(userId) || {
      id: `prof-${userId}`,
      userId,
      preferredCurrency: 'USDT',
      walletNetwork: 'USDT-TRC20',
      walletVerified: false,
      twoFactorEnabled: false,
      emailNotifications: true,
      pushNotifications: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    fallbackProfiles.set(userId, updated);
    return updated;
  }

  // ===================== SOLAR PLANS & PROJECTS =====================
  static async getPlans(): Promise<SolarPlan[]> {
    try {
      const dbClient = getDbClient();
      const { data, error } = await dbClient.from('solar_plans').select('*').order('display_order', { ascending: true });
      if (!error && data && data.length > 0) {
        return data.map(mapDbPlan);
      }
    } catch {
      // fallback
    }
    return INITIAL_PLANS;
  }

  static async getPlanByCode(code: string): Promise<SolarPlan | null> {
    try {
      const dbClient = getDbClient();
      const { data, error } = await dbClient.from('solar_plans').select('*').eq('code', code.toUpperCase()).single();
      if (!error && data) {
        return mapDbPlan(data);
      }
    } catch {
      // fallback
    }
    const found = INITIAL_PLANS.find(p => p.code.toUpperCase() === code.toUpperCase());
    return found || null;
  }

  static async getProjects(): Promise<SolarProject[]> {
    try {
      const dbClient = getDbClient();
      const { data, error } = await dbClient.from('solar_projects').select('*').order('display_order', { ascending: true });
      if (!error && data && data.length > 0) {
        return data.map(mapDbProject);
      }
    } catch {
      // fallback
    }
    return INITIAL_PROJECTS;
  }

  // ===================== SOLAR UNITS & OPERATIONS =====================
  static async getUnits(userId?: string): Promise<SolarUnit[]> {
    try {
      const dbClient = getDbClient();
      let query = dbClient.from('solar_units').select('*').order('created_at', { ascending: false });
      if (userId) {
        query = query.eq('user_id', userId);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data.map(mapDbUnit);
    } catch {}

    const all = Array.from(fallbackUnits.values());
    if (userId) {
      return all.filter(u => u.userId === userId || (userId === 'usr-demo-user' && u.userId === '22222222-2222-2222-2222-222222222222') || (userId === '22222222-2222-2222-2222-222222222222' && u.userId === 'usr-demo-user'));
    }
    return all;
  }

  static async getUnitById(id: string): Promise<SolarUnit | null> {
    try {
      const dbClient = getDbClient();
      const { data, error } = await dbClient.from('solar_units').select('*').eq('id', id).single();
      if (!error && data) return mapDbUnit(data);
    } catch {}
    return fallbackUnits.get(id) || null;
  }

  static async getAllUnits(): Promise<SolarUnit[]> {
    return this.getUnits();
  }

  static async createUnit(unit: {
    userId: string;
    planId?: string;
    planCode: string;
    planName: string;
    projectId?: string;
    projectName: string;
    location: string;
    capacityKw: number;
    purchasePriceUsdt: number;
    status?: string;
    expiryDate?: string;
  }): Promise<SolarUnit> {
    try {
      const dbClient = getDbClient();

      // Look up plan and project IDs if omitted
      let planId = unit.planId;
      if (!planId) {
        const { data: p } = await dbClient.from('solar_plans').select('id').eq('code', unit.planCode).single();
        planId = p?.id;
      }
      let projectId = unit.projectId;
      if (!projectId) {
        const { data: proj } = await dbClient.from('solar_projects').select('id').limit(1).single();
        projectId = proj?.id;
      }

      const { data, error } = await dbClient
        .from('solar_units')
        .insert({
          user_id: unit.userId,
          plan_id: planId,
          plan_code: unit.planCode,
          plan_name: unit.planName,
          project_id: projectId,
          project_name: unit.projectName,
          location: unit.location,
          capacity_kw: unit.capacityKw,
          purchase_price_usdt: unit.purchasePriceUsdt,
          status: unit.status || 'ACTIVE',
          working_days_completed: 0,
          working_days_total: 43,
          total_earned_usdt: 0,
          today_earned_usdt: 0,
          is_receivable: false,
          receivable_amount_usdt: 0,
          purchase_date: new Date().toISOString(),
          expiry_date: unit.expiryDate || new Date(Date.now() + 60 * 86400000).toISOString(),
        })
        .select()
        .single();

      if (!error && data) return mapDbUnit(data);
    } catch {}

    const newUnit: SolarUnit = {
      id: `unit-${Date.now()}`,
      userId: unit.userId,
      planId: unit.planId || 'plan-p1-starter',
      planCode: unit.planCode,
      planName: unit.planName,
      projectId: unit.projectId || 'proj-sonoran',
      projectName: unit.projectName,
      location: unit.location,
      capacityKw: unit.capacityKw,
      activatedAt: new Date().toISOString(),
      expiresAt: unit.expiryDate || new Date(Date.now() + 60 * 86400000).toISOString(),
      purchasePriceUsdt: unit.purchasePriceUsdt,
      dailyEarningUsdt: 0.8,
      workingDaysTotal: 43,
      validityDays: 60,
      withdrawalFeePercent: 10,
      workingDaysCompleted: 0,
      workingDaysRemaining: 43,
      status: (unit.status as any) || 'ACTIVE',
      todayGeneratedKwh: 0,
      lifetimeGeneratedKwh: 0,
      todayEarnedUsdt: 0,
      lifetimeEarnedUsdt: 0,
      totalEarnedUsdt: 0,
      performanceRatio: 99.0,
      isReceivable: false,
      receivableAmountUsdt: 0,
      purchaseDate: new Date().toISOString(),
      expiryDate: unit.expiryDate || new Date(Date.now() + 60 * 86400000).toISOString(),
    };
    fallbackUnits.set(newUnit.id, newUnit);
    return newUnit;
  }

  static async updateUnit(id: string, updates: Partial<SolarUnit>): Promise<SolarUnit | null> {
    try {
      const dbClient = getDbClient();
      const dbUpdates: any = { updated_at: new Date().toISOString() };

      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.workingDaysCompleted !== undefined) dbUpdates.working_days_completed = updates.workingDaysCompleted;
      if (updates.lifetimeEarnedUsdt !== undefined) dbUpdates.total_earned_usdt = updates.lifetimeEarnedUsdt;
      if (updates.todayEarnedUsdt !== undefined) dbUpdates.today_earned_usdt = updates.todayEarnedUsdt;
      if (updates.lastOperatedDate !== undefined) dbUpdates.last_operated_date = updates.lastOperatedDate;
      if (updates.isReceivable !== undefined) dbUpdates.is_receivable = updates.isReceivable;
      if (updates.receivableAmountUsdt !== undefined) dbUpdates.receivable_amount_usdt = updates.receivableAmountUsdt;

      const { data, error } = await dbClient.from('solar_units').update(dbUpdates).eq('id', id).select().single();
      if (!error && data) return mapDbUnit(data);
    } catch {}

    const existing = fallbackUnits.get(id);
    if (existing) {
      const updated = { ...existing, ...updates };
      fallbackUnits.set(id, updated);
      return updated;
    }
    return null;
  }

  static async getGenerationLogs(userId: string): Promise<GenerationLog[]> {
    const dbClient = getDbClient();
    const { data, error } = await dbClient
      .from('generation_logs')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false });
    if (error || !data) return [];
    return data.map((row: any) => ({
      id: row.id,
      unitId: row.unit_id,
      userId: row.user_id,
      planCode: row.plan_code,
      generationDate: row.generation_date,
      kwhGenerated: Number(row.kwh_generated || 0),
      efficiency: Number(row.performance_ratio || 99.1),
      baseEarningUsdt: Number(row.base_earning_usdt || 0),
      pointsMultiplier: Number(row.points_multiplier || 1),
      actualEarningUsdt: Number(row.actual_earning_usdt || 0),
      weatherCondition: row.operational_status || 'OPTIMAL',
      status: row.status === 'RECEIVED' ? 'RECEIVED' : 'PENDING_RECEIVE',
      operatedAt: row.started_at || row.created_at,
      receivedAt: row.received_at || undefined,
    }));
  }

  static async createGenerationLog(log: any): Promise<GenerationLog> {
    const dbClient = getDbClient();
    const { data, error } = await dbClient
      .from('generation_logs')
      .insert({
        unit_id: log.unitId,
        user_id: log.userId,
        plan_code: log.planCode,
        generation_date: log.generationDate,
        kwh_generated: log.kwhGenerated,
        performance_ratio: log.efficiency || 99.1,
        base_earning_usdt: log.baseEarningUsdt,
        points_multiplier: log.pointsMultiplier || 1.0,
        actual_earning_usdt: log.actualEarningUsdt,
        operational_status: log.weatherCondition || 'OPTIMAL',
        status: log.status || 'PENDING',
        started_at: log.operatedAt || new Date().toISOString(),
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to create generation log: ${error?.message}`);
    }
    return {
      id: data.id,
      unitId: data.unit_id,
      userId: data.user_id,
      planCode: data.plan_code,
      generationDate: data.generation_date,
      kwhGenerated: Number(data.kwh_generated),
      efficiency: Number(data.performance_ratio || 99.1),
      baseEarningUsdt: Number(data.base_earning_usdt),
      pointsMultiplier: Number(data.points_multiplier),
      actualEarningUsdt: Number(data.actual_earning_usdt),
      weatherCondition: data.operational_status || 'OPTIMAL',
      status: data.status === 'RECEIVED' ? 'RECEIVED' : 'PENDING_RECEIVE',
      operatedAt: data.started_at,
      receivedAt: data.received_at,
    };
  }

  static async updateGenerationLog(id: string, updates: Partial<GenerationLog>): Promise<GenerationLog | null> {
    const dbClient = getDbClient();
    const dbUpdates: any = {};
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.weatherCondition !== undefined) dbUpdates.operational_status = updates.weatherCondition;
    if (updates.receivedAt !== undefined) dbUpdates.received_at = updates.receivedAt;
    if (updates.actualEarningUsdt !== undefined) dbUpdates.actual_earning_usdt = updates.actualEarningUsdt;

    const { data, error } = await dbClient.from('generation_logs').update(dbUpdates).eq('id', id).select().single();
    if (error || !data) return null;
    return {
      id: data.id,
      unitId: data.unit_id,
      userId: data.user_id,
      planCode: data.plan_code,
      generationDate: data.generation_date,
      kwhGenerated: Number(data.kwh_generated),
      efficiency: Number(data.performance_ratio || 99.1),
      baseEarningUsdt: Number(data.base_earning_usdt),
      pointsMultiplier: Number(data.points_multiplier),
      actualEarningUsdt: Number(data.actual_earning_usdt),
      weatherCondition: data.operational_status || 'OPTIMAL',
      status: data.status === 'RECEIVED' ? 'RECEIVED' : 'PENDING_RECEIVE',
      operatedAt: data.started_at,
      receivedAt: data.received_at,
    };
  }

  // ===================== FINANCIAL LEDGER =====================
  static async getLedger(userId?: string): Promise<EarningsLedgerEntry[]> {
    try {
      const dbClient = getDbClient();
      let query = dbClient.from('earnings_ledger').select('*').order('created_at', { ascending: false });
      if (userId) {
        query = query.eq('user_id', userId);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data.map(mapDbLedger);
    } catch {}
    let all = Array.from(fallbackLedger.values());
    if (userId) {
      all = all.filter((l) => l.userId === userId);
    }
    return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static async getAllLedger(): Promise<EarningsLedgerEntry[]> {
    return this.getLedger();
  }

  static async addLedgerEntry(entry: {
    userId: string;
    type: any;
    amount: number;
    direction: 'CREDIT' | 'DEBIT';
    balanceBefore: number;
    balanceAfter: number;
    sourceEvent: string;
    referenceId: string;
    description: string;
    actor?: string;
    idempotencyKey?: string;
  }): Promise<EarningsLedgerEntry> {
    const transactionId = `TX-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    try {
      const dbClient = getDbClient();
      const { data, error } = await dbClient
        .from('earnings_ledger')
        .insert({
          transaction_id: transactionId,
          idempotency_key: entry.idempotencyKey || null,
          user_id: entry.userId,
          type: entry.type,
          amount: entry.amount,
          direction: entry.direction,
          balance_before: entry.balanceBefore,
          balance_after: entry.balanceAfter,
          source_event: entry.sourceEvent,
          reference_id: entry.referenceId,
          description: entry.description,
          actor: entry.actor || 'SYSTEM',
          status: 'CONFIRMED',
        })
        .select()
        .single();

      if (!error && data) {
        return mapDbLedger(data);
      }
    } catch {}

    const fallbackEntry: EarningsLedgerEntry = {
      id: `ledg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      transactionId,
      idempotencyKey: entry.idempotencyKey,
      userId: entry.userId,
      type: entry.type,
      amountUsdt: entry.amount,
      amount: entry.amount,
      direction: entry.direction,
      balanceBefore: entry.balanceBefore,
      balanceAfter: entry.balanceAfter,
      sourceEvent: entry.sourceEvent as any,
      referenceId: entry.referenceId,
      description: entry.description,
      actor: entry.actor || 'SYSTEM',
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
    };
    fallbackLedger.set(fallbackEntry.id, fallbackEntry);
    return fallbackEntry;
  }

  // ===================== RECHARGES =====================
  static async getRecharges(userId?: string): Promise<RechargeRecord[]> {
    try {
      const dbClient = getDbClient();
      let query = dbClient.from('recharge_requests').select('*').order('created_at', { ascending: false });
      if (userId) {
        query = query.eq('user_id', userId);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data.map(mapDbRecharge);
    } catch {}

    const all = Array.from(fallbackRecharges.values());
    if (userId) {
      return all.filter(r => r.userId === userId || (userId === 'usr-demo-user' && r.userId === '22222222-2222-2222-2222-222222222222') || (userId === '22222222-2222-2222-2222-222222222222' && r.userId === 'usr-demo-user'));
    }
    return all;
  }

  static async getRechargeById(id: string): Promise<RechargeRecord | null> {
    try {
      const dbClient = getDbClient();
      const { data, error } = await dbClient.from('recharge_requests').select('*').eq('id', id).single();
      if (!error && data) return mapDbRecharge(data);
    } catch {}
    return fallbackRecharges.get(id) || null;
  }

  static async getAllRecharges(): Promise<RechargeRecord[]> {
    return this.getRecharges();
  }

  static async createRecharge(data: {
    userId: string;
    userName: string;
    userEmail: string;
    amountUsdt: number;
    currency?: string;
    method?: string;
    destinationAddress: string;
    txReference: string;
    proofImageUrl?: string;
  }): Promise<RechargeRecord> {
    const rechargeId = `RC-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    try {
      const dbClient = getDbClient();
      const { data: result, error } = await dbClient
        .from('recharge_requests')
        .insert({
          recharge_id: rechargeId,
          user_id: data.userId,
          user_name: data.userName,
          user_email: data.userEmail,
          amount_usdt: data.amountUsdt,
          network: data.currency || 'USDT-TRC20',
          deposit_address: data.destinationAddress,
          tx_hash: data.txReference,
          status: 'PENDING',
          proof_image_url: data.proofImageUrl || null,
          reviewer_notes: 'Submitted via deposit form. Pending admin verification.',
        })
        .select()
        .single();

      if (!error && result) {
        return mapDbRecharge(result);
      }
    } catch {}

    const record: RechargeRecord = {
      id: `rc-${Date.now()}`,
      rechargeId,
      userId: data.userId,
      userName: data.userName,
      userEmail: data.userEmail,
      amountUsdt: data.amountUsdt,
      currency: (data.currency as any) || 'USDT-TRC20',
      method: 'CRYPTO_TRANSFER',
      destinationAddress: data.destinationAddress,
      txReference: data.txReference,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      proofImageUrl: data.proofImageUrl,
      adminNotes: 'Submitted via deposit form. Pending admin verification.',
    };
    fallbackRecharges.set(record.id, record);
    return record;
  }

  static async updateRecharge(id: string, updates: Partial<RechargeRecord>): Promise<RechargeRecord | null> {
    try {
      const dbClient = getDbClient();
      const dbUpdates: any = { updated_at: new Date().toISOString() };

      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.adminNotes !== undefined) dbUpdates.reviewer_notes = updates.adminNotes;
      if (updates.reviewerId !== undefined || updates.reviewerName !== undefined) {
        dbUpdates.reviewed_by = updates.reviewerName || updates.reviewerId;
      }
      if (updates.reviewedAt !== undefined) dbUpdates.reviewed_at = updates.reviewedAt;

      const { data, error } = await dbClient.from('recharge_requests').update(dbUpdates).eq('id', id).select().single();
      if (!error && data) return mapDbRecharge(data);
    } catch {}

    const existing = fallbackRecharges.get(id);
    if (existing) {
      const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
      fallbackRecharges.set(id, updated);
      return updated;
    }
    return null;
  }

  static async transitionRechargeStatus(
    id: string,
    fromStatus: string,
    toStatus: string,
    updates: Partial<RechargeRecord>
  ): Promise<RechargeRecord | null> {
    const dbClient = getDbClient();
    const dbUpdates: any = {
      status: toStatus,
      updated_at: new Date().toISOString(),
    };

    if (updates.adminNotes !== undefined) dbUpdates.reviewer_notes = updates.adminNotes;
    if (updates.reviewerId !== undefined || updates.reviewerName !== undefined) {
      dbUpdates.reviewed_by = updates.reviewerName || updates.reviewerId;
    }
    if (updates.reviewedAt !== undefined) dbUpdates.reviewed_at = updates.reviewedAt;

    const { data, error } = await dbClient
      .from('recharge_requests')
      .update(dbUpdates)
      .eq('id', id)
      .eq('status', fromStatus)
      .select()
      .maybeSingle();

    if (error || !data) return null;
    return mapDbRecharge(data);
  }

  static async approveRecharge(id: string, reviewerId: string, reviewerName: string, notes?: string): Promise<any> {
    const recharge = await this.getRechargeById(id);
    if (!recharge || recharge.status !== 'PENDING') {
      throw new Error('Recharge record not found or already processed.');
    }

    const user = await this.getUserById(recharge.userId);
    if (!user) throw new Error('User not found for this recharge.');

    const newBalance = user.availableBalance + recharge.amountUsdt;

    // Credit user balance
    await this.updateUser(user.id, { availableBalance: newBalance });

    // Add ledger entry
    await this.addLedgerEntry({
      userId: user.id,
      type: 'RECHARGE',
      amount: recharge.amountUsdt,
      direction: 'CREDIT',
      balanceBefore: user.availableBalance,
      balanceAfter: newBalance,
      sourceEvent: 'ADMIN_APPROVED_RECHARGE',
      referenceId: recharge.id,
      description: `Recharge deposit approved: +${recharge.amountUsdt} USDT`,
      actor: reviewerName,
    });

    // Update recharge status
    const updated = await this.updateRecharge(id, {
      status: 'APPROVED',
      adminNotes: notes || `Approved by ${reviewerName}`,
      reviewerId,
      reviewerName,
      reviewedAt: new Date().toISOString(),
    });

    return updated;
  }

  static async rejectRecharge(id: string, reviewerId: string, reviewerName: string, reason?: string): Promise<any> {
    return this.updateRecharge(id, {
      status: 'REJECTED',
      adminNotes: reason || `Rejected by ${reviewerName}`,
      reviewerId,
      reviewerName,
      reviewedAt: new Date().toISOString(),
    });
  }

  // ===================== WITHDRAWALS =====================
  static async getWithdrawals(userId?: string): Promise<WithdrawalRequest[]> {
    try {
      const dbClient = getDbClient();
      let query = dbClient.from('withdrawal_requests').select('*').order('created_at', { ascending: false });
      if (userId) {
        query = query.eq('user_id', userId);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data.map(mapDbWithdrawal);
    } catch {}

    const all = Array.from(fallbackWithdrawals.values());
    if (userId) {
      return all.filter(w => w.userId === userId || (userId === 'usr-demo-user' && w.userId === '22222222-2222-2222-2222-222222222222') || (userId === '22222222-2222-2222-2222-222222222222' && w.userId === 'usr-demo-user'));
    }
    return all;
  }

  static async getWithdrawalById(id: string): Promise<WithdrawalRequest | null> {
    try {
      const dbClient = getDbClient();
      const { data, error } = await dbClient.from('withdrawal_requests').select('*').eq('id', id).single();
      if (!error && data) return mapDbWithdrawal(data);
    } catch {}
    return fallbackWithdrawals.get(id) || null;
  }

  static async getAllWithdrawals(): Promise<WithdrawalRequest[]> {
    return this.getWithdrawals();
  }

  static async createWithdrawal(data: {
    userId: string;
    userName?: string;
    userEmail?: string;
    amountUsdt: number;
    feePercent: number;
    feeAmountUsdt: number;
    netAmountUsdt: number;
    walletAddress: string;
    network?: string;
  }): Promise<WithdrawalRequest> {
    const withdrawalId = `WD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    try {
      const dbClient = getDbClient();
      const { data: result, error } = await dbClient
        .from('withdrawal_requests')
        .insert({
          withdrawal_id: withdrawalId,
          user_id: data.userId,
          user_name: data.userName || data.userId,
          user_email: data.userEmail || '',
          amount_usdt: data.amountUsdt,
          fee_percent: data.feePercent,
          fee_amount_usdt: data.feeAmountUsdt,
          net_amount_usdt: data.netAmountUsdt,
          wallet_address: data.walletAddress,
          network: data.network || 'USDT-TRC20',
          status: 'PENDING',
          refunded: false,
        })
        .select()
        .single();

      if (!error && result) {
        return mapDbWithdrawal(result);
      }
    } catch {}

    const req: WithdrawalRequest = {
      id: `wdr-${Date.now()}`,
      withdrawalId,
      userId: data.userId,
      userName: data.userName || data.userId,
      userEmail: data.userEmail || '',
      planCode: 'P1',
      amountUsdt: data.amountUsdt,
      feePercent: data.feePercent,
      feeAmountUsdt: data.feeAmountUsdt,
      netAmountUsdt: data.netAmountUsdt,
      walletAddress: data.walletAddress,
      network: (data.network as any) || 'USDT-TRC20',
      status: 'PENDING',
      refunded: false,
      requestedAt: new Date().toISOString(),
    };
    fallbackWithdrawals.set(req.id, req);
    return req;
  }

  static async transitionWithdrawalStatus(
    id: string,
    expectedStatus: string,
    newStatus: string,
    updates: Partial<WithdrawalRequest> & { rejectionReason?: string }
  ): Promise<WithdrawalRequest | null> {
    try {
      const dbClient = getDbClient();
      const dbUpdates: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };
      if (updates.txHash !== undefined) dbUpdates.tx_hash = updates.txHash;
      if (updates.adminNotes !== undefined) dbUpdates.reviewer_notes = updates.adminNotes;
      if (updates.rejectionReason !== undefined) dbUpdates.rejection_reason = updates.rejectionReason;
      if (updates.reviewerId !== undefined || updates.reviewerName !== undefined) {
        dbUpdates.reviewed_by = updates.reviewerName || updates.reviewerId;
      }
      if (updates.reviewedAt !== undefined) dbUpdates.reviewed_at = updates.reviewedAt;

      const { data, error } = await dbClient
        .from('withdrawal_requests')
        .update(dbUpdates)
        .eq('id', id)
        .eq('status', expectedStatus)
        .select()
        .single();
      if (!error && data) return mapDbWithdrawal(data);
    } catch {}

    const existing = fallbackWithdrawals.get(id);
    if (existing && existing.status === expectedStatus) {
      const updated = { ...existing, ...updates, status: newStatus as any, updatedAt: new Date().toISOString() };
      fallbackWithdrawals.set(id, updated);
      return updated;
    }
    return null;
  }

  static async updateWithdrawal(id: string, updates: Partial<WithdrawalRequest> & { rejectionReason?: string }): Promise<WithdrawalRequest | null> {
    try {
      const dbClient = getDbClient();
      const dbUpdates: any = { updated_at: new Date().toISOString() };

      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.txHash !== undefined) dbUpdates.tx_hash = updates.txHash;
      if (updates.adminNotes !== undefined) dbUpdates.reviewer_notes = updates.adminNotes;
      if (updates.rejectionReason !== undefined) dbUpdates.rejection_reason = updates.rejectionReason;
      if (updates.reviewerId !== undefined || updates.reviewerName !== undefined) {
        dbUpdates.reviewed_by = updates.reviewerName || updates.reviewerId;
      }
      if (updates.reviewedAt !== undefined) dbUpdates.reviewed_at = updates.reviewedAt;

      const { data, error } = await dbClient.from('withdrawal_requests').update(dbUpdates).eq('id', id).select().single();
      if (!error && data) return mapDbWithdrawal(data);
    } catch {}

    const existing = fallbackWithdrawals.get(id);
    if (existing) {
      const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
      fallbackWithdrawals.set(id, updated);
      return updated;
    }
    return null;
  }

  // ===================== POINTS & REWARDS =====================
  static async getPointsLedger(userId?: string): Promise<PointsLedgerEntry[]> {
    const dbClient = getDbClient();
    let query = dbClient.from('points_ledger').select('*').order('created_at', { ascending: false });
    if (userId) {
      query = query.eq('user_id', userId);
    }
    const { data, error } = await query;
    if (error || !data) return [];
    return data.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      type: row.event_type || 'INITIAL_BASELINE',
      pointsChange: Number(row.points_change),
      balanceBefore: Number(row.points_before || 0),
      balanceAfter: Number(row.points_after || 0),
      reason: row.reason,
      createdAt: row.created_at,
    }));
  }

  static async addPointsLedgerEntry(entry: {
    userId: string;
    type?: any;
    eventType?: any;
    pointsChange: number;
    balanceBefore?: number;
    pointsBefore?: number;
    balanceAfter?: number;
    pointsAfter?: number;
    reason: string;
    referenceId?: string;
  }): Promise<PointsLedgerEntry> {
    const dbClient = getDbClient();
    const eventType = entry.type || entry.eventType || 'INITIAL_BASELINE';
    const pointsBefore = entry.balanceBefore !== undefined ? entry.balanceBefore : (entry.pointsBefore || 0);
    const pointsAfter = entry.balanceAfter !== undefined ? entry.balanceAfter : (entry.pointsAfter || 0);

    const { data, error } = await dbClient
      .from('points_ledger')
      .insert({
        user_id: entry.userId,
        event_type: eventType,
        points_change: entry.pointsChange,
        points_before: pointsBefore,
        points_after: pointsAfter,
        reason: entry.reason,
        reference_id: entry.referenceId || null,
      })
      .select()
      .single();

    if (error || !data) {
      return {
        id: `pt-${Date.now()}`,
        userId: entry.userId,
        type: eventType,
        pointsChange: entry.pointsChange,
        balanceBefore: pointsBefore,
        balanceAfter: pointsAfter,
        reason: entry.reason,
        createdAt: new Date().toISOString(),
      };
    }
    return {
      id: data.id,
      userId: data.user_id,
      type: data.event_type,
      pointsChange: Number(data.points_change),
      balanceBefore: Number(data.points_before),
      balanceAfter: Number(data.points_after),
      reason: data.reason,
      createdAt: data.created_at,
    };
  }

  static async getPointRules(): Promise<PointRule[]> {
    return [
      {
        id: 'pr-login',
        code: 'DAILY_LOGIN',
        title: 'Daily Login Attendance',
        description: 'Consecutive daily platform attendance',
        points: 1,
        type: 'REWARD',
        active: true,
      },
      {
        id: 'pr-purchase',
        code: 'SOLAR_PURCHASE',
        title: 'Solar Panel Purchase',
        description: 'Contribution to solar panel capacity infrastructure',
        points: 10,
        type: 'REWARD',
        active: true,
      },
      {
        id: 'pr-referral',
        code: 'REFERRAL_SIGNUP',
        title: 'Referral Activation',
        description: 'Verified clean-energy peer invitation',
        points: 5,
        type: 'REWARD',
        active: true,
      },
    ];
  }

  static async getLeadershipLevels(): Promise<LeadershipLevelConfig[]> {
    return [
      {
        id: 'll-1',
        level: 'SOLAR_MEMBER',
        order: 1,
        title: 'Solar Member',
        badge: 'MEMBER',
        iconName: 'Shield',
        colorHex: '#94A3B8',
        minDirectTeam: 0,
        minQualifiedTeam: 0,
        requiredActivePlan: 'P1',
        requiredTeamDepth: 1,
        minPoints: 70,
        bonusUsdt: 0,
        dailyBonusUsdt: 0,
        benefits: ['Baseline 100% daily generation yield'],
      },
      {
        id: 'll-2',
        level: 'SOLAR_BUILDER',
        order: 2,
        title: 'Solar Builder',
        badge: 'BUILDER',
        iconName: 'Zap',
        colorHex: '#38BDF8',
        minDirectTeam: 3,
        minQualifiedTeam: 5,
        requiredActivePlan: 'P1',
        requiredTeamDepth: 2,
        minPoints: 70,
        bonusUsdt: 20,
        dailyBonusUsdt: 1.5,
        benefits: ['L2 Referral commission unlocked', '+1.5 USDT daily bonus'],
      },
      {
        id: 'll-3',
        level: 'ENERGY_COORDINATOR',
        order: 3,
        title: 'Energy Coordinator',
        badge: 'COORDINATOR',
        iconName: 'Users',
        colorHex: '#34D399',
        minDirectTeam: 8,
        minQualifiedTeam: 20,
        requiredActivePlan: 'P2',
        requiredTeamDepth: 3,
        minPoints: 80,
        bonusUsdt: 100,
        dailyBonusUsdt: 5.0,
        benefits: ['L3 Referral commission unlocked', '+5.0 USDT daily bonus'],
      },
      {
        id: 'll-4',
        level: 'SOLAR_LEADER',
        order: 4,
        title: 'Solar Leader',
        badge: 'LEADER',
        iconName: 'Award',
        colorHex: '#A78BFA',
        minDirectTeam: 15,
        minQualifiedTeam: 50,
        requiredActivePlan: 'P2',
        requiredTeamDepth: 3,
        minPoints: 85,
        bonusUsdt: 500,
        dailyBonusUsdt: 15.0,
        benefits: ['Global regional pool allocation', '+15.0 USDT daily bonus'],
      },
      {
        id: 'll-5',
        level: 'GRID_LEADER',
        order: 5,
        title: 'Grid Leader',
        badge: 'GRID LEAD',
        iconName: 'Globe',
        colorHex: '#FBBF24',
        minDirectTeam: 30,
        minQualifiedTeam: 150,
        requiredActivePlan: 'P3',
        requiredTeamDepth: 3,
        minPoints: 90,
        bonusUsdt: 2000,
        dailyBonusUsdt: 45.0,
        benefits: ['Executive governance seat', '+45.0 USDT daily bonus'],
      },
      {
        id: 'll-6',
        level: 'ENERGY_AMBASSADOR',
        order: 6,
        title: 'Energy Ambassador',
        badge: 'AMBASSADOR',
        iconName: 'Crown',
        colorHex: '#F59E0B',
        minDirectTeam: 50,
        minQualifiedTeam: 300,
        requiredActivePlan: 'P3',
        requiredTeamDepth: 3,
        minPoints: 95,
        bonusUsdt: 10000,
        dailyBonusUsdt: 150.0,
        benefits: ['Platform revenue share dividend', '+150.0 USDT daily bonus'],
      },
    ];
  }

  static async getCommissionRules(): Promise<CommissionRule[]> {
    return [
      {
        level: 1,
        name: 'Level 1 Direct Sponsor',
        percentage: 10,
        active: true,
        description: 'Direct invitation (Level 1): 10% daily generation yield match',
      },
      {
        level: 2,
        name: 'Level 2 Secondary Team',
        percentage: 5,
        active: true,
        description: 'Secondary community tier (Level 2): 5% generation yield match',
      },
      {
        level: 3,
        name: 'Level 3 Tertiary Team',
        percentage: 2,
        active: true,
        description: 'Tertiary community tier (Level 3): 2% generation yield match',
      },
    ];
  }

  static async getRewards(): Promise<RewardItem[]> {
    return [
      {
        id: 'rew-5usdt',
        title: '5.00 USDT Energy Voucher',
        description: 'Direct cash credit deposited straight to your available balance.',
        pointsCost: 50,
        estimatedUsdtValue: 5,
        category: 'CREDIT',
        imageUrl: '/images/rewards/voucher.jpg',
        stock: 999,
        status: 'AVAILABLE',
        resetsPointsToBaseline: false,
      },
      {
        id: 'rew-20usdt',
        title: '20.00 USDT Energy Voucher',
        description: 'High-value balance credit deposited to your account.',
        pointsCost: 180,
        estimatedUsdtValue: 20,
        category: 'CREDIT',
        imageUrl: '/images/rewards/voucher-gold.jpg',
        stock: 999,
        status: 'AVAILABLE',
        resetsPointsToBaseline: false,
      },
      {
        id: 'rew-booster',
        title: 'Generation Efficiency Booster',
        description: 'Temporary +5% solar panel generation boost for 7 operational days.',
        pointsCost: 80,
        estimatedUsdtValue: 15,
        category: 'BOOST',
        imageUrl: '/images/rewards/booster.jpg',
        stock: 100,
        status: 'AVAILABLE',
        resetsPointsToBaseline: false,
      },
      {
        id: 'rew-vip-pass',
        title: 'VIP Community Ambassador Pass',
        description: 'Priority withdrawal processing queue and VIP community support lounge.',
        pointsCost: 250,
        estimatedUsdtValue: 50,
        category: 'STATUS',
        imageUrl: '/images/rewards/vip.jpg',
        stock: 50,
        status: 'AVAILABLE',
        resetsPointsToBaseline: false,
      },
      {
        id: 'rw-solar-hoodie',
        title: 'SolarGrid Executive Tech Hoodie',
        description: 'Premium heavyweight organic cotton hoodie with embroidered SolarGrid insignia.',
        pointsCost: 50,
        estimatedUsdtValue: 65,
        category: 'LIFESTYLE',
        imageUrl: '/images/rewards/hoodie.jpg',
        stock: 45,
        status: 'AVAILABLE',
        resetsPointsToBaseline: false,
      },
      {
        id: 'rw-led-backpack',
        title: 'Solar-Integrated Commuter Backpack',
        description: 'Waterproof urban backpack with integrated 10W flexible solar charging panel.',
        pointsCost: 90,
        estimatedUsdtValue: 120,
        category: 'ELECTRONICS',
        imageUrl: '/images/rewards/backpack.jpg',
        stock: 20,
        status: 'AVAILABLE',
        resetsPointsToBaseline: false,
      },
    ];
  }

  // ===================== BUSINESS RULES =====================
  static async getBusinessRules(): Promise<BusinessRule[]> {
    try {
      const dbClient = getDbClient();
      const { data, error } = await dbClient.from('business_rules').select('*');
      if (!error && data && data.length > 0) {
        return data.map((row: any) => ({
          id: row.id,
          key: row.key,
          category: row.category || 'SYSTEM',
          label: row.label || row.key,
          value: typeof row.value === 'object' && row.value?.value !== undefined ? row.value.value : row.value,
          description: row.description || '',
          updatedAt: row.updated_at,
          updatedBy: row.updated_by || 'ADMIN',
        }));
      }
    } catch {}

    return [
      { id: 'br-1', key: 'STARTING_POINTS', category: 'POINTS', label: 'Baseline Starting Points', value: 70, description: 'Default points for new signups', updatedAt: new Date().toISOString(), updatedBy: 'SYSTEM' },
      { id: 'br-2', key: 'MINIMUM_WITHDRAWAL_USDT', category: 'WITHDRAWAL', label: 'Minimum Withdrawal', value: 10, description: 'Minimum allowed withdrawal amount in USDT', updatedAt: new Date().toISOString(), updatedBy: 'SYSTEM' },
      { id: 'br-3', key: 'COMMISSION_L1_PERCENT', category: 'MLM', label: 'Level 1 Commission', value: 10, description: 'Level 1 direct commission percentage', updatedAt: new Date().toISOString(), updatedBy: 'SYSTEM' },
      { id: 'br-4', key: 'COMMISSION_L2_PERCENT', category: 'MLM', label: 'Level 2 Commission', value: 5, description: 'Level 2 commission percentage', updatedAt: new Date().toISOString(), updatedBy: 'SYSTEM' },
      { id: 'br-5', key: 'COMMISSION_L3_PERCENT', category: 'MLM', label: 'Level 3 Commission', value: 2, description: 'Level 3 commission percentage', updatedAt: new Date().toISOString(), updatedBy: 'SYSTEM' },
      { id: 'br-6', key: 'WORKING_DAYS_PER_CYCLE', category: 'SOLAR', label: 'Working Days per Cycle', value: 43, description: 'Working weekdays per 60-day calendar cycle', updatedAt: new Date().toISOString(), updatedBy: 'SYSTEM' },
    ];
  }

  static async updateBusinessRule(key: string, value: any): Promise<BusinessRule | null> {
    try {
      const dbClient = getDbClient();
      const { data, error } = await dbClient
        .from('business_rules')
        .update({ value: { value }, updated_at: new Date().toISOString() })
        .eq('key', key)
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          key: data.key,
          category: data.category || 'SYSTEM',
          label: data.label || data.key,
          value: typeof data.value === 'object' && data.value?.value !== undefined ? data.value.value : data.value,
          description: data.description || '',
          updatedAt: data.updated_at,
          updatedBy: data.updated_by || 'ADMIN',
        };
      }
    } catch {}

    return {
      id: `br-local-${key}`,
      key,
      category: 'SYSTEM',
      label: key,
      value,
      description: `Updated ${key}`,
      updatedAt: new Date().toISOString(),
      updatedBy: 'ADMIN',
    };
  }

  // ===================== NOTIFICATIONS =====================
  static async getNotifications(userId: string): Promise<Notification[]> {
    const dbClient = getDbClient();
    const { data, error } = await dbClient
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      title: row.title,
      message: row.message,
      group: (row.type as any) || 'SYSTEM',
      read: Boolean(row.is_read),
      linkUrl: row.link || undefined,
      createdAt: row.created_at,
    }));
  }

  static async createNotification(data: {
    userId: string;
    title: string;
    message: string;
    type?: string;
    group?: any;
    link?: string;
    linkUrl?: string;
  }): Promise<Notification> {
    const dbClient = getDbClient();
    const { data: result, error } = await dbClient
      .from('notifications')
      .insert({
        user_id: data.userId,
        title: data.title,
        message: data.message,
        type: data.group || data.type || 'SYSTEM',
        is_read: false,
        link: data.linkUrl || data.link || null,
      })
      .select()
      .single();

    if (error || !result) {
      return {
        id: `notif-${Date.now()}`,
        userId: data.userId,
        title: data.title,
        message: data.message,
        group: (data.group || data.type || 'SYSTEM') as any,
        read: false,
        linkUrl: data.linkUrl || data.link,
        createdAt: new Date().toISOString(),
      };
    }
    return {
      id: result.id,
      userId: result.user_id,
      title: result.title,
      message: result.message,
      group: result.type,
      read: result.is_read,
      linkUrl: result.link,
      createdAt: result.created_at,
    };
  }

  static async markNotificationRead(id: string, userId?: string): Promise<boolean> {
    const dbClient = getDbClient();
    let query = dbClient.from('notifications').update({ is_read: true }).eq('id', id);
    if (userId) {
      query = query.eq('user_id', userId);
    }
    const { error } = await query;
    return !error;
  }

  static async markAllNotificationsRead(userId: string): Promise<boolean> {
    const dbClient = getDbClient();
    const { error } = await dbClient.from('notifications').update({ is_read: true }).eq('user_id', userId);
    return !error;
  }

  // ===================== SUPPORT TICKETS =====================
  static async getSupportTickets(userId?: string): Promise<SupportTicket[]> {
    try {
      const dbClient = getDbClient();
      let query = dbClient.from('support_tickets').select('*, messages:support_messages(*)').order('created_at', { ascending: false });
      if (userId) {
        query = query.eq('user_id', userId);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data.map((row: any) => ({
          id: row.id,
          userId: row.user_id,
          userName: row.user_name || row.user_id,
          userEmail: row.user_email || '',
          category: row.category || 'TECHNICAL',
          priority: row.priority || 'MEDIUM',
          status: row.status || 'OPEN',
          subject: row.subject,
          messages: (row.messages || []).map((m: any) => ({
            id: m.id,
            ticketId: m.ticket_id,
            senderId: m.sender_id,
            senderName: m.sender_name,
            senderRole: m.sender_role,
            message: m.message,
            createdAt: m.created_at,
          })),
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));
      }
    } catch {}

    const all = Array.from(fallbackTickets.values());
    if (userId) {
      return all.filter(t => t.userId === userId || (userId === 'usr-demo-user' && t.userId === '22222222-2222-2222-2222-222222222222') || (userId === '22222222-2222-2222-2222-222222222222' && t.userId === 'usr-demo-user'));
    }
    return all;
  }

  static async getSupportTicketById(id: string): Promise<SupportTicket | null> {
    try {
      const dbClient = getDbClient();
      const { data, error } = await dbClient
        .from('support_tickets')
        .select('*, messages:support_messages(*)')
        .eq('id', id)
        .single();
      if (!error && data) {
        return {
          id: data.id,
          userId: data.user_id,
          userName: data.user_name || data.user_id,
          userEmail: data.user_email || '',
          category: data.category || 'TECHNICAL',
          priority: data.priority || 'MEDIUM',
          status: data.status || 'OPEN',
          subject: data.subject,
          messages: (data.messages || []).map((m: any) => ({
            id: m.id,
            ticketId: m.ticket_id,
            senderId: m.sender_id,
            senderName: m.sender_name,
            senderRole: m.sender_role,
            message: m.message,
            createdAt: m.created_at,
          })),
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch {}
    return fallbackTickets.get(id) || null;
  }

  static async createSupportTicket(data: {
    userId: string;
    userName?: string;
    userEmail?: string;
    category?: any;
    priority?: any;
    subject: string;
  }): Promise<SupportTicket> {
    const ticketNumber = `TICK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    try {
      const dbClient = getDbClient();
      const { data: ticket, error } = await dbClient
        .from('support_tickets')
        .insert({
          ticket_number: ticketNumber,
          user_id: data.userId,
          user_name: data.userName || data.userId,
          user_email: data.userEmail || '',
          category: data.category || 'TECHNICAL',
          priority: data.priority || 'MEDIUM',
          status: 'OPEN',
          subject: data.subject,
        })
        .select()
        .single();

      if (!error && ticket) {
        return {
          id: ticket.id,
          userId: ticket.user_id,
          userName: ticket.user_name,
          userEmail: ticket.user_email,
          category: ticket.category,
          priority: ticket.priority,
          status: ticket.status,
          subject: ticket.subject,
          messages: [],
          createdAt: ticket.created_at,
          updatedAt: ticket.updated_at,
        };
      }
    } catch {}

    const localTicket: SupportTicket = {
      id: `tick-${Date.now()}`,
      userId: data.userId,
      userName: data.userName || data.userId,
      userEmail: data.userEmail || '',
      category: data.category || 'TECHNICAL',
      priority: data.priority || 'MEDIUM',
      status: 'OPEN',
      subject: data.subject,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    fallbackTickets.set(localTicket.id, localTicket);
    return localTicket;
  }

  static async addSupportMessage(data: {
    ticketId: string;
    senderId: string;
    senderName: string;
    senderRole: any;
    message: string;
  }): Promise<SupportMessage> {
    try {
      const dbClient = getDbClient();
      const { data: msg, error } = await dbClient
        .from('support_messages')
        .insert({
          ticket_id: data.ticketId,
          sender_id: data.senderId,
          sender_name: data.senderName,
          sender_role: data.senderRole,
          message: data.message,
        })
        .select()
        .single();

      if (!error && msg) {
        return {
          id: msg.id,
          ticketId: msg.ticket_id,
          senderId: msg.sender_id,
          senderName: msg.sender_name,
          senderRole: msg.sender_role,
          message: msg.message,
          createdAt: msg.created_at,
        };
      }
    } catch {}

    const newMsg: SupportMessage = {
      id: `msg-${Date.now()}`,
      ticketId: data.ticketId,
      senderId: data.senderId,
      senderName: data.senderName,
      senderRole: data.senderRole,
      message: data.message,
      createdAt: new Date().toISOString(),
    };

    const ticket = fallbackTickets.get(data.ticketId);
    if (ticket) {
      ticket.messages.push(newMsg);
      ticket.updatedAt = new Date().toISOString();
      fallbackTickets.set(data.ticketId, ticket);
    }

    return newMsg;
  }

  static async updateSupportTicket(id: string, updates: Partial<SupportTicket>): Promise<SupportTicket | null> {
    try {
      const dbClient = getDbClient();
      const dbUpdates: any = { updated_at: new Date().toISOString() };
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority;

      const { data, error } = await dbClient.from('support_tickets').update(dbUpdates).eq('id', id).select().single();
      if (!error && data) return this.getSupportTicketById(id);
    } catch {}

    const ticket = fallbackTickets.get(id);
    if (ticket) {
      const updated = { ...ticket, ...updates, updatedAt: new Date().toISOString() };
      fallbackTickets.set(id, updated);
      return updated;
    }
    return null;
  }

  // ===================== AUDIT LOGS =====================
  static async getAuditLogs(): Promise<AuditLog[]> {
    const dbClient = getDbClient();
    const { data, error } = await dbClient.from('audit_logs').select('*').order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map((row: any) => ({
      id: row.id,
      actorId: row.actor_id,
      actorName: row.actor_email || row.actor_id,
      actorRole: row.actor_role,
      action: row.action,
      target: row.target_type || 'SYSTEM',
      targetId: row.target_id || '',
      targetType: row.target_type,
      actorEmail: row.actor_email,
      details: row.details || {},
      ipAddress: row.ip_address || '127.0.0.1',
      createdAt: row.created_at,
    }));
  }

  static async addAuditLog(data: {
    actorId: string;
    actorEmail?: string;
    actorName?: string;
    actorRole: string;
    action: string;
    target?: string;
    targetType?: string;
    targetId: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
    reason?: string;
  }): Promise<AuditLog> {
    const dbClient = getDbClient();
    const { data: log, error } = await dbClient
      .from('audit_logs')
      .insert({
        actor_id: data.actorId,
        actor_email: data.actorEmail || data.actorName || data.actorId,
        actor_role: data.actorRole,
        action: data.action,
        target_type: data.targetType || data.target || 'SYSTEM',
        target_id: data.targetId,
        details: data.details || (data.reason ? { reason: data.reason } : {}),
        ip_address: data.ipAddress || '127.0.0.1',
      })
      .select()
      .single();

    if (error || !log) {
      return {
        id: 'audit-log-fallback',
        actorId: data.actorId,
        actorName: data.actorName || data.actorEmail || data.actorId,
        actorRole: data.actorRole as any,
        action: data.action,
        target: data.target || data.targetType || 'SYSTEM',
        targetId: data.targetId,
        ipAddress: data.ipAddress || '127.0.0.1',
        createdAt: new Date().toISOString(),
      };
    }

    return {
      id: log.id,
      actorId: log.actor_id,
      actorName: log.actor_email || log.actor_id,
      actorRole: log.actor_role,
      action: log.action,
      target: log.target_type,
      targetId: log.target_id,
      ipAddress: log.ip_address,
      createdAt: log.created_at,
    };
  }

  // ===================== PANEL IMAGES =====================
  static async getPanelImages(): Promise<PanelImageConfig[]> {
    const plans = await this.getPlans();
    return plans.map((p) => ({
      planCode: p.code,
      planName: p.name,
      imageUrl: p.imageUrl,
      aspectRatio: '1:1',
      caption: `${p.name} - ${p.capacityDescription || 'Solar Array'}`,
      updatedAt: new Date().toISOString(),
    }));
  }

  static async updatePanelImage(planCode: string, imageUrl: string, caption?: string): Promise<PanelImageConfig | null> {
    const dbClient = getDbClient();
    const { error } = await dbClient.from('solar_plans').update({ image_url: imageUrl }).eq('code', planCode.toUpperCase());
    if (error) return null;
    return {
      planCode,
      planName: planCode,
      imageUrl,
      aspectRatio: '1:1',
      caption: caption || '',
      updatedAt: new Date().toISOString(),
    };
  }

  // ===================== GLOBAL SEARCH =====================
  static async adminGlobalSearch(query: string): Promise<any> {
    const q = query.toLowerCase().trim();
    if (!q) return { users: [], units: [], recharges: [], withdrawals: [] };

    const dbClient = getDbClient();

    const [usersRes, unitsRes, rechargesRes, withdrawalsRes] = await Promise.all([
      dbClient.from('users').select('*').or(`name.ilike.%${q}%,email.ilike.%${q}%,referral_code.ilike.%${q}%`).limit(10),
      dbClient.from('solar_units').select('*').or(`plan_name.ilike.%${q}%,project_name.ilike.%${q}%,location.ilike.%${q}%`).limit(10),
      dbClient.from('recharge_requests').select('*').or(`user_name.ilike.%${q}%,user_email.ilike.%${q}%,recharge_id.ilike.%${q}%,tx_hash.ilike.%${q}%`).limit(10),
      dbClient.from('withdrawal_requests').select('*').or(`user_name.ilike.%${q}%,user_email.ilike.%${q}%,withdrawal_id.ilike.%${q}%,wallet_address.ilike.%${q}%`).limit(10),
    ]);

    return {
      users: (usersRes.data || []).map(mapDbUser),
      units: (unitsRes.data || []).map(mapDbUnit),
      recharges: (rechargesRes.data || []).map(mapDbRecharge),
      withdrawals: (withdrawalsRes.data || []).map(mapDbWithdrawal),
    };
  }

  // ===================== SOLAR PLANS UPDATE =====================
  static async updatePlan(code: string, updates: Partial<SolarPlan>): Promise<SolarPlan | null> {
    const dbClient = getDbClient();
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.priceUsdt !== undefined) dbUpdates.price_usdt = updates.priceUsdt;
    if (updates.dailyEarningUsdt !== undefined) dbUpdates.daily_earning_usdt = updates.dailyEarningUsdt;
    if (updates.workingDaysTotal !== undefined) dbUpdates.working_days_total = updates.workingDaysTotal;
    if (updates.withdrawalFeePercent !== undefined) dbUpdates.withdrawal_fee_percent = updates.withdrawalFeePercent;
    if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;

    const { data, error } = await dbClient
      .from('solar_plans')
      .update(dbUpdates)
      .eq('code', code.toUpperCase())
      .select()
      .single();

    if (error || !data) return null;
    return mapDbPlan(data);
  }

  // ===================== SESSIONS =====================
  static async createSession(sessionData: {
    userId: string;
    userName: string;
    userEmail: string;
    role: string;
    sessionToken?: string;
    ipAddress?: string;
    deviceType?: string;
    operatingSystem?: string;
    browser?: string;
    userAgent?: string;
    location?: string;
  }): Promise<any> {
    try {
      const dbClient = getDbClient();
      const token = sessionData.sessionToken || `tok_${Math.random().toString(36).substring(2)}_${Date.now()}`;
      const { data, error } = await dbClient
        .from('user_sessions')
        .insert({
          user_id: sessionData.userId,
          user_name: sessionData.userName,
          user_email: sessionData.userEmail,
          role: sessionData.role,
          session_token: token,
          ip_address: sessionData.ipAddress || '127.0.0.1',
          device_type: sessionData.deviceType || 'Desktop',
          operating_system: sessionData.operatingSystem || 'macOS',
          browser: sessionData.browser || 'Browser',
          user_agent: sessionData.userAgent || '',
          location: sessionData.location || 'United States',
          session_status: 'ACTIVE',
          risk_score: 'LOW',
          login_method: 'PASSWORD',
        })
        .select()
        .single();
      if (!error && data) return data;
    } catch {}
    return null;
  }

  static async getUserSessions(userId: string): Promise<any[]> {
    try {
      const dbClient = getDbClient();
      const { data, error } = await dbClient
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('login_time', { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map((row: any) => ({
          id: row.id,
          userId: row.user_id,
          userName: row.user_name,
          userEmail: row.user_email,
          role: row.role,
          loginTime: row.login_time,
          lastActivity: row.last_activity,
          logoutTime: row.logout_time,
          ipAddress: row.ip_address,
          deviceType: row.device_type,
          operatingSystem: row.operating_system,
          browser: row.browser,
          userAgent: row.user_agent,
          location: row.location,
          sessionStatus: row.session_status,
          riskScore: row.risk_score,
          loginMethod: row.login_method,
        }));
      }
    } catch {}

    const user = await this.getUserById(userId);
    return [
      {
        id: `sess-${userId.substring(0, 8)}-1`,
        userId,
        userName: user?.name || 'Active Member',
        userEmail: user?.email || 'user@solargrid.io',
        role: user?.role || 'USER',
        loginTime: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        ipAddress: '127.0.0.1',
        deviceType: 'Desktop',
        operatingSystem: 'macOS',
        browser: 'Browser',
        userAgent: '',
        location: 'United States',
        sessionStatus: 'ACTIVE',
        riskScore: 'LOW',
        loginMethod: 'PASSWORD',
      },
    ];
  }

  static async getAllSessions(): Promise<any[]> {
    try {
      const dbClient = getDbClient();
      const { data, error } = await dbClient
        .from('user_sessions')
        .select('*')
        .order('login_time', { ascending: false })
        .limit(50);
      if (!error && data && data.length > 0) {
        return data.map((row: any) => ({
          id: row.id,
          userId: row.user_id,
          userName: row.user_name,
          userEmail: row.user_email,
          role: row.role,
          loginTime: row.login_time,
          lastActivity: row.last_activity,
          logoutTime: row.logout_time,
          ipAddress: row.ip_address,
          deviceType: row.device_type,
          operatingSystem: row.operating_system,
          browser: row.browser,
          userAgent: row.user_agent,
          location: row.location,
          sessionStatus: row.session_status,
          riskScore: row.risk_score,
          loginMethod: row.login_method,
        }));
      }
    } catch {}

    const users = await this.getAllUsers();
    return users.slice(0, 10).map((u: User, i: number) => ({
      id: `sess-${u.id.substring(0, 8)}-${i}`,
      userId: u.id,
      userName: u.name,
      userEmail: u.email,
      role: u.role,
      loginTime: new Date(Date.now() - i * 3600000).toISOString(),
      lastActivity: new Date().toISOString(),
      ipAddress: '127.0.0.1',
      deviceType: 'Desktop',
      operatingSystem: 'macOS',
      browser: 'Browser',
      userAgent: '',
      location: 'United States',
      sessionStatus: 'ACTIVE',
      riskScore: 'LOW',
      loginMethod: 'PASSWORD',
    }));
  }

  static async revokeSession(sessionId: string): Promise<boolean> {
    try {
      const dbClient = getDbClient();
      const { error } = await dbClient
        .from('user_sessions')
        .update({ session_status: 'REVOKED', logout_time: new Date().toISOString() })
        .eq('id', sessionId);
      if (!error) return true;
    } catch {}
    return true;
  }

  static async revokeAllUserSessions(userId: string): Promise<boolean> {
    try {
      const dbClient = getDbClient();
      const { error } = await dbClient
        .from('user_sessions')
        .update({ session_status: 'REVOKED', logout_time: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('session_status', 'ACTIVE');
      if (!error) return true;
    } catch {}
    return true;
  }

  // ============================================================================
  // DIRECT-SELLING & COMPLIANT MLM METHODS
  // ============================================================================

  // 1. PRODUCTS
  static async getProducts(activeOnly: boolean = true): Promise<Product[]> {
    try {
      const dbClient = getDbClient();
      let query = dbClient.from('products').select('*').order('created_at', { ascending: false });
      if (activeOnly) query = query.eq('is_active', true);
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data.map(mapDbProduct);
      }
    } catch {}
    const fallback = Array.from(fallbackProducts.values());
    return activeOnly ? fallback.filter((p) => p.isActive) : fallback;
  }

  static async getAllProducts(activeOnly: boolean = true): Promise<Product[]> {
    return this.getProducts(activeOnly);
  }

  static async getProductById(id: string): Promise<Product | null> {
    try {
      const dbClient = getDbClient();
      const { data, error } = await dbClient.from('products').select('*').eq('id', id).single();
      if (!error && data) return mapDbProduct(data);
    } catch {}
    return fallbackProducts.get(id) || null;
  }

  static async createProduct(productData: {
    sku: string;
    name: string;
    description: string;
    retailPrice: number;
    commissionableValue: number;
    category?: string;
    imageUrl?: string;
    isActive?: boolean;
  }): Promise<Product | null> {
    const id = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    try {
      const dbClient = getDbClient();
      const { data, error } = await dbClient
        .from('products')
        .insert({
          id,
          sku: productData.sku,
          name: productData.name,
          description: productData.description,
          retail_price: productData.retailPrice,
          commissionable_value: productData.commissionableValue,
          category: productData.category || 'Solar Equipment',
          image_url: productData.imageUrl,
          is_active: productData.isActive !== undefined ? productData.isActive : true,
        })
        .select()
        .single();
      if (!error && data) return mapDbProduct(data);
    } catch {}

    const fallback: Product = {
      id,
      sku: productData.sku,
      name: productData.name,
      description: productData.description,
      retailPrice: productData.retailPrice,
      commissionableValue: productData.commissionableValue,
      category: productData.category || 'Solar Equipment',
      imageUrl: productData.imageUrl,
      isActive: productData.isActive !== undefined ? productData.isActive : true,
      createdAt: new Date().toISOString(),
    };
    fallbackProducts.set(id, fallback);
    return fallback;
  }

  static async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    try {
      const dbClient = getDbClient();
      const payload: any = {};
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.retailPrice !== undefined) payload.retail_price = updates.retailPrice;
      if (updates.commissionableValue !== undefined) payload.commissionable_value = updates.commissionableValue;
      if (updates.category !== undefined) payload.category = updates.category;
      if (updates.imageUrl !== undefined) payload.image_url = updates.imageUrl;
      if (updates.isActive !== undefined) payload.is_active = updates.isActive;

      const { data, error } = await dbClient.from('products').update(payload).eq('id', id).select().single();
      if (!error && data) return mapDbProduct(data);
    } catch {}

    const prod = fallbackProducts.get(id);
    if (prod) {
      Object.assign(prod, updates);
      return prod;
    }
    return null;
  }

  // 2. ORDERS
  static async createOrder(orderData: {
    userId: string;
    items: Array<{ productId: string; qty: number }>;
    shippingAddress?: any;
    idempotencyKey?: string;
  }): Promise<{ success: boolean; order?: Order; message?: string }> {
    try {
      const user = await this.getUserById(orderData.userId);
      if (!user) return { success: false, message: 'User not found' };

      let totalAmount = 0;
      let totalPv = 0;
      const orderItemsToInsert: Array<{
        id: string;
        product_id: string;
        qty: number;
        unit_price: number;
        pv_amount: number;
      }> = [];

      for (const item of orderData.items) {
        const product = await this.getProductById(item.productId);
        if (!product || !product.isActive) {
          return { success: false, message: `Product ${item.productId} is not available` };
        }
        const lineTotal = product.retailPrice * item.qty;
        const linePv = product.commissionableValue * item.qty;
        totalAmount += lineTotal;
        totalPv += linePv;

        orderItemsToInsert.push({
          id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          product_id: product.id,
          qty: item.qty,
          unit_price: product.retailPrice,
          pv_amount: linePv,
        });
      }

      const orderId = `ord-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const orderNo = `SG-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

      try {
        const dbClient = getDbClient();
        const { data: insertedOrder, error: orderErr } = await dbClient
          .from('orders')
          .insert({
            id: orderId,
            order_no: orderNo,
            user_id: orderData.userId,
            status: 'PENDING',
            total_amount: totalAmount,
            total_pv: totalPv,
            idempotency_key: orderData.idempotencyKey,
            shipping_address: orderData.shippingAddress,
          })
          .select()
          .single();

        if (!orderErr && insertedOrder) {
          const itemsPayload = orderItemsToInsert.map((item) => ({
            ...item,
            order_id: orderId,
          }));
          await dbClient.from('order_items').insert(itemsPayload);

          const fullOrder = await this.getOrderById(orderId);
          if (fullOrder) return { success: true, order: fullOrder };
        }
      } catch {}

      const fallbackOrder: Order = {
        id: orderId,
        orderNo,
        userId: orderData.userId,
        userName: user.name,
        userEmail: user.email,
        status: 'PENDING',
        totalAmount,
        totalPv,
        idempotencyKey: orderData.idempotencyKey,
        shippingAddress: orderData.shippingAddress,
        items: orderItemsToInsert.map((it) => {
          const prod = fallbackProducts.get(it.product_id);
          return {
            id: it.id,
            orderId,
            productId: it.product_id,
            productName: prod?.name,
            productSku: prod?.sku,
            qty: it.qty,
            unitPrice: it.unit_price,
            pvAmount: it.pv_amount,
            createdAt: new Date().toISOString(),
          };
        }),
        createdAt: new Date().toISOString(),
      };
      fallbackOrders.set(orderId, fallbackOrder);
      return { success: true, order: fallbackOrder };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to create order' };
    }
  }

  static async getOrderById(id: string): Promise<Order | null> {
    try {
      const dbClient = getDbClient();
      const { data, error } = await dbClient
        .from('orders')
        .select('*, order_items(*, products(*)), users(name, email)')
        .eq('id', id)
        .single();
      if (!error && data) {
        const items = data.order_items?.map(mapDbOrderItem) || [];
        return mapDbOrder(data, items);
      }
    } catch {}
    return fallbackOrders.get(id) || null;
  }

  static async getOrdersByUserId(userId: string): Promise<Order[]> {
    try {
      const dbClient = getDbClient();
      const { data, error } = await dbClient
        .from('orders')
        .select('*, order_items(*, products(*)), users(name, email)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map((d: any) => mapDbOrder(d, d.order_items?.map(mapDbOrderItem) || []));
      }
    } catch {}
    return Array.from(fallbackOrders.values())
      .filter((o) => o.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static async getAllOrders(): Promise<Order[]> {
    try {
      const dbClient = getDbClient();
      const { data, error } = await dbClient
        .from('orders')
        .select('*, order_items(*, products(*)), users(name, email)')
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map((d: any) => mapDbOrder(d, d.order_items?.map(mapDbOrderItem) || []));
      }
    } catch {}
    return Array.from(fallbackOrders.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  static async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    paymentGatewayRef?: string
  ): Promise<{ success: boolean; order?: Order; message?: string }> {
    try {
      const dbClient = getDbClient();
      const updates: any = { status };
      if (status === 'PAID') {
        updates.paid_at = new Date().toISOString();
        if (paymentGatewayRef) updates.payment_gateway_ref = paymentGatewayRef;
      } else if (status === 'REFUNDED') {
        updates.refunded_at = new Date().toISOString();
      }

      const { data, error } = await dbClient
        .from('orders')
        .update(updates)
        .eq('id', orderId)
        .select()
        .single();
      if (!error && data) {
        const order = await this.getOrderById(orderId);
        if (order) return { success: true, order };
      }
    } catch {}

    const order = fallbackOrders.get(orderId);
    if (order) {
      order.status = status;
      if (status === 'PAID') {
        order.paidAt = new Date().toISOString();
        if (paymentGatewayRef) order.paymentGatewayRef = paymentGatewayRef;
      } else if (status === 'REFUNDED') {
        order.refundedAt = new Date().toISOString();
      }
      fallbackOrders.set(orderId, order);
      return { success: true, order };
    }

    return { success: false, message: 'Order not found' };
  }

  // 3. COMMISSIONS
  static async createDirectCommission(data: {
    orderId: string;
    beneficiaryId: string;
    level: 1 | 2 | 3;
    rate: number;
    amount: number;
    status?: DirectCommissionStatus;
    clawbackOf?: string;
    idempotencyKey: string;
  }): Promise<DirectCommission | null> {
    const commissionId = `comm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    try {
      const dbClient = getDbClient();
      const { data: inserted, error } = await dbClient
        .from('commissions')
        .insert({
          id: commissionId,
          order_id: data.orderId,
          beneficiary_id: data.beneficiaryId,
          level: data.level,
          rate: data.rate,
          amount: data.amount,
          status: data.status || 'PENDING',
          clawback_of: data.clawbackOf,
          idempotency_key: data.idempotencyKey,
        })
        .select('*, orders(order_no, users(name)), beneficiary:users(name)')
        .single();
      if (!error && inserted) return mapDbCommission(inserted);
    } catch {}

    const fallbackComm: DirectCommission = {
      id: commissionId,
      orderId: data.orderId,
      beneficiaryId: data.beneficiaryId,
      level: data.level,
      rate: data.rate,
      amount: data.amount,
      status: data.status || 'PENDING',
      clawbackOf: data.clawbackOf,
      idempotencyKey: data.idempotencyKey,
      createdAt: new Date().toISOString(),
    };
    fallbackCommissions.set(commissionId, fallbackComm);
    return fallbackComm;
  }

  static async getCommissionsByOrderId(orderId: string): Promise<DirectCommission[]> {
    try {
      const dbClient = getDbClient();
      const { data, error } = await dbClient
        .from('commissions')
        .select('*, orders(order_no, users(name)), beneficiary:users(name)')
        .eq('order_id', orderId);
      if (!error && data && data.length > 0) return data.map(mapDbCommission);
    } catch {}
    return Array.from(fallbackCommissions.values()).filter((c) => c.orderId === orderId);
  }

  static async getCommissionsByBeneficiaryId(beneficiaryId: string): Promise<DirectCommission[]> {
    try {
      const dbClient = getDbClient();
      const { data, error } = await dbClient
        .from('commissions')
        .select('*, orders(order_no, users(name)), beneficiary:users(name)')
        .eq('beneficiary_id', beneficiaryId)
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) return data.map(mapDbCommission);
    } catch {}
    return Array.from(fallbackCommissions.values())
      .filter((c) => c.beneficiaryId === beneficiaryId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static async getAllDirectCommissions(): Promise<DirectCommission[]> {
    try {
      const dbClient = getDbClient();
      const { data, error } = await dbClient
        .from('commissions')
        .select('*, orders(order_no, users(name)), beneficiary:users(name)')
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) return data.map(mapDbCommission);
    } catch {}
    return Array.from(fallbackCommissions.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  static async updateCommissionStatus(
    commissionId: string,
    status: DirectCommissionStatus
  ): Promise<boolean> {
    try {
      const dbClient = getDbClient();
      const { error } = await dbClient
        .from('commissions')
        .update({ status })
        .eq('id', commissionId);
      if (!error) return true;
    } catch {}
    const c = fallbackCommissions.get(commissionId);
    if (c) {
      c.status = status;
      return true;
    }
    return false;
  }

  // 4. KYC SUBMISSIONS
  static async submitKyc(data: {
    userId: string;
    docType: string;
    docNumber: string;
    frontUrl: string;
    backUrl?: string;
  }): Promise<{ success: boolean; submission?: KycSubmission; message?: string }> {
    const kycId = `kyc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    try {
      const dbClient = getDbClient();
      const { data: inserted, error } = await dbClient
        .from('kyc_submissions')
        .insert({
          id: kycId,
          user_id: data.userId,
          doc_type: data.docType,
          doc_number: data.docNumber,
          front_url: data.frontUrl,
          back_url: data.backUrl,
          status: 'PENDING',
        })
        .select('*, users(name, email)')
        .single();

      if (!error && inserted) {
        await dbClient.from('users').update({ kyc_status: 'PENDING' }).eq('id', data.userId);
        return { success: true, submission: mapDbKyc(inserted) };
      }
    } catch {}

    const user = await this.getUserById(data.userId);
    const sub: KycSubmission = {
      id: kycId,
      userId: data.userId,
      userName: user?.name,
      userEmail: user?.email,
      docType: data.docType,
      docNumber: data.docNumber,
      frontUrl: data.frontUrl,
      backUrl: data.backUrl,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    fallbackKyc.set(kycId, sub);
    if (user) {
      user.kycStatus = 'PENDING';
      fallbackUsers.set(data.userId, user);
    }
    return { success: true, submission: sub };
  }

  static async getKycByUserId(userId: string): Promise<KycSubmission | null> {
    try {
      const dbClient = getDbClient();
      const { data, error } = await dbClient
        .from('kyc_submissions')
        .select('*, users(name, email)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!error && data) return mapDbKyc(data);
    } catch {}
    for (const sub of fallbackKyc.values()) {
      if (sub.userId === userId) return sub;
    }
    return null;
  }

  static async getKycSubmissionByUserId(userId: string): Promise<KycSubmission | null> {
    return this.getKycByUserId(userId);
  }

  static async getKycSubmissionById(id: string): Promise<KycSubmission | null> {
    try {
      const dbClient = getDbClient();
      const { data, error } = await dbClient
        .from('kyc_submissions')
        .select('*, users(name, email)')
        .eq('id', id)
        .single();
      if (!error && data) return mapDbKyc(data);
    } catch {}
    return fallbackKyc.get(id) || null;
  }

  static async getAllKycSubmissions(statusFilter?: KycStatus): Promise<KycSubmission[]> {
    try {
      const dbClient = getDbClient();
      let query = dbClient.from('kyc_submissions').select('*, users(name, email)').order('created_at', { ascending: false });
      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data.map(mapDbKyc);
    } catch {}
    let all = Array.from(fallbackKyc.values());
    if (statusFilter) {
      all = all.filter((k) => k.status === statusFilter);
    }
    return all.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  static async createKycSubmission(data: {
    userId: string;
    docType: string;
    docNumber: string;
    frontUrl: string;
    backUrl?: string;
  }): Promise<KycSubmission | null> {
    const res = await this.submitKyc(data);
    return res.submission || null;
  }

  static async updateKycSubmissionStatus(
    submissionId: string,
    status: 'VERIFIED' | 'REJECTED',
    reviewedBy: string,
    rejectionReason?: string
  ): Promise<{ success: boolean; message: string }> {
    return this.reviewKycSubmission(submissionId, status, reviewedBy, rejectionReason);
  }

  static async reviewKycSubmission(
    submissionId: string,
    status: 'VERIFIED' | 'REJECTED',
    reviewedBy: string,
    rejectionReason?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const dbClient = getDbClient();
      const { data: updated, error } = await dbClient
        .from('kyc_submissions')
        .update({
          status,
          reviewed_by: reviewedBy,
          reviewed_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
        })
        .eq('id', submissionId)
        .select()
        .single();

      if (!error && updated) {
        await dbClient
          .from('users')
          .update({ kyc_status: status })
          .eq('id', updated.user_id);
        return { success: true, message: `KYC ${status.toLowerCase()} successfully` };
      }
    } catch {}

    const sub = fallbackKyc.get(submissionId);
    if (sub) {
      sub.status = status;
      sub.reviewedBy = reviewedBy;
      sub.reviewedAt = new Date().toISOString();
      sub.rejectionReason = rejectionReason;
      const user = await this.getUserById(sub.userId);
      if (user) {
        user.kycStatus = status;
        fallbackUsers.set(sub.userId, user);
      }
      return { success: true, message: `KYC ${status.toLowerCase()} successfully` };
    }

    return { success: false, message: 'KYC submission not found' };
  }

  // 5. PAYOUT METHODS
  static async createPayoutMethod(data: {
    userId: string;
    type: PayoutMethodType;
    details: Record<string, any>;
  }): Promise<PayoutMethod | null> {
    const id = `pay-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    try {
      const dbClient = getDbClient();
      const { data: inserted, error } = await dbClient
        .from('payout_methods')
        .insert({
          id,
          user_id: data.userId,
          type: data.type,
          details: data.details,
          is_verified: false,
        })
        .select()
        .single();
      if (!error && inserted) return mapDbPayoutMethod(inserted);
    } catch {}

    const fallbackMethod: PayoutMethod = {
      id,
      userId: data.userId,
      type: data.type,
      details: data.details,
      isVerified: false,
      createdAt: new Date().toISOString(),
    };
    fallbackPayoutMethods.set(id, fallbackMethod);
    return fallbackMethod;
  }

  static async getPayoutMethodsByUserId(userId: string): Promise<PayoutMethod[]> {
    try {
      const dbClient = getDbClient();
      const { data, error } = await dbClient
        .from('payout_methods')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) return data.map(mapDbPayoutMethod);
    } catch {}
    return Array.from(fallbackPayoutMethods.values()).filter((p) => p.userId === userId);
  }

  static async getAllPayoutMethods(): Promise<PayoutMethod[]> {
    try {
      const dbClient = getDbClient();
      const { data, error } = await dbClient.from('payout_methods').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) return data.map(mapDbPayoutMethod);
    } catch {}
    return Array.from(fallbackPayoutMethods.values());
  }

  static async verifyPayoutMethod(id: string): Promise<boolean> {
    try {
      const dbClient = getDbClient();
      const { error } = await dbClient
        .from('payout_methods')
        .update({ is_verified: true, verified_at: new Date().toISOString() })
        .eq('id', id);
      if (!error) return true;
    } catch {}
    const p = fallbackPayoutMethods.get(id);
    if (p) {
      p.isVerified = true;
      p.verifiedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  // 6. FRAUD SIGNALS
  static async createFraudSignal(data: {
    userId: string;
    signalType: string;
    severity: FraudSeverity;
    details: Record<string, any>;
  }): Promise<FraudSignal | null> {
    const id = `fraud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    try {
      const dbClient = getDbClient();
      const { data: inserted, error } = await dbClient
        .from('fraud_signals')
        .insert({
          id,
          user_id: data.userId,
          signal_type: data.signalType,
          severity: data.severity,
          details: data.details,
          resolved: false,
        })
        .select('*, users(name, email)')
        .single();
      if (!error && inserted) return mapDbFraudSignal(inserted);
    } catch {}

    const user = await this.getUserById(data.userId);
    const fallbackSignal: FraudSignal = {
      id,
      userId: data.userId,
      userName: user?.name,
      userEmail: user?.email,
      signalType: data.signalType,
      severity: data.severity,
      details: data.details,
      resolved: false,
      createdAt: new Date().toISOString(),
    };
    fallbackFraudSignals.set(id, fallbackSignal);
    return fallbackSignal;
  }

  static async getFraudSignals(resolved?: boolean): Promise<FraudSignal[]> {
    try {
      const dbClient = getDbClient();
      let query = dbClient.from('fraud_signals').select('*, users(name, email)').order('created_at', { ascending: false });
      if (resolved !== undefined) query = query.eq('resolved', resolved);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data.map(mapDbFraudSignal);
    } catch {}
    return Array.from(fallbackFraudSignals.values())
      .filter((s) => resolved === undefined || s.resolved === resolved)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static async getAllFraudSignals(userId?: string): Promise<FraudSignal[]> {
    try {
      const dbClient = getDbClient();
      let query = dbClient.from('fraud_signals').select('*, users(name, email)').order('created_at', { ascending: false });
      if (userId) query = query.eq('user_id', userId);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data.map(mapDbFraudSignal);
    } catch {}
    let all = Array.from(fallbackFraudSignals.values());
    if (userId) {
      all = all.filter((s) => s.userId === userId);
    }
    return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static async resolveFraudSignal(id: string): Promise<boolean> {
    try {
      const dbClient = getDbClient();
      const { error } = await dbClient.from('fraud_signals').update({ resolved: true }).eq('id', id);
      if (!error) return true;
    } catch {}
    const s = fallbackFraudSignals.get(id);
    if (s) {
      s.resolved = true;
      return true;
    }
    return false;
  }

  // 7. USER PV UPDATES
  static async updateUserPv(
    userId: string,
    personalPvDelta: number,
    groupPvDelta: number
  ): Promise<boolean> {
    try {
      const dbClient = getDbClient();
      const user = await this.getUserById(userId);
      if (!user) return false;

      const newPersonalPv = Math.max(0, Math.round(((user.personalPv || 0) + personalPvDelta) * 100) / 100);
      const newGroupPv = Math.max(0, Math.round(((user.groupPv || 0) + groupPvDelta) * 100) / 100);

      const { error } = await dbClient
        .from('users')
        .update({
          personal_pv: newPersonalPv,
          group_pv: newGroupPv,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (!error) return true;
    } catch {}

    const user = fallbackUsers.get(userId);
    if (user) {
      user.personalPv = Math.max(0, Math.round(((user.personalPv || 0) + personalPvDelta) * 100) / 100);
      user.groupPv = Math.max(0, Math.round(((user.groupPv || 0) + groupPvDelta) * 100) / 100);
      fallbackUsers.set(userId, user);
      return true;
    }
    return false;
  }
}

export const NeonDatabaseService = DatabaseService;
export { db, getDbClient } from './query-builder';
export default DatabaseService;
