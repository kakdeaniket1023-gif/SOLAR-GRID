import {
  User,
  Profile,
  SolarPlan,
  SolarProject,
  SolarUnit,
  GenerationLog,
  EarningsLedgerEntry,
  WithdrawalRequest,
  UpgradeTransaction,
  PointRule,
  PointsLedgerEntry,
  LeadershipLevelConfig,
  LeadershipLevel,
  RewardItem,
  RewardRedemption,
  SupportTicket,
  BusinessRule,
  AuditLog,
  CommissionRule,
} from '@/types';

export const INITIAL_PLANS: SolarPlan[] = [
  {
    id: 'plan-p1-starter',
    code: 'P1',
    name: 'P1 Solar Panel',
    description: '1 KW Distributed Solar Generation Module',
    priceUsdt: 35,
    currency: 'USDT',
    validityDays: 60,
    workingDaysTotal: 43,
    dailyEarningUsdt: 0.80,
    grossEarningUsdt: 34.40,
    withdrawalFeePercent: 10,
    netAfterFeeUsdt: 30.96,
    capacityKw: 1.0,
    capacityDescription: '1.0 KW Monocrystalline Solar Panel Unit',
    imageUrl: '/images/panel-p1.jpg',
    features: [
      '1.0 KW High-Efficiency Photovoltaic Module',
      '0.80 USDT Daily Generation Revenue',
      'Daily 3-Hour Operation Window',
      'Direct Automated Daily Settlement',
    ],
    projectLocation: 'Sonoran Solar Basin, AZ',
    displayOrder: 1,
    status: 'ACTIVE',
    operationStartTime: '12:00 PM',
    operationEndTime: '3:00 PM',
    operatingWeekdays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
  },
  {
    id: 'plan-p2-growth',
    code: 'P2',
    name: 'P2 Solar Panel',
    description: '5 KW High-Yield Photovoltaic Module',
    priceUsdt: 150,
    currency: 'USDT',
    validityDays: 60,
    workingDaysTotal: 43,
    dailyEarningUsdt: 3.40,
    grossEarningUsdt: 146.20,
    withdrawalFeePercent: 10,
    netAfterFeeUsdt: 131.58,
    capacityKw: 5.0,
    capacityDescription: '5.0 KW Commercial Bifacial Solar Array',
    imageUrl: '/images/panel-p2.jpg',
    features: [
      '5.0 KW Commercial Bifacial Solar Array',
      '3.40 USDT Daily Generation Revenue',
      'Daily 3-Hour Operation Window',
      'Direct Automated Daily Settlement',
    ],
    projectLocation: 'Mojave Clean Energy Park, NV',
    displayOrder: 2,
    status: 'ACTIVE',
    operationStartTime: '12:00 PM',
    operationEndTime: '3:00 PM',
    operatingWeekdays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
  },
  {
    id: 'plan-p3-pro',
    code: 'P3',
    name: 'P3 Solar Panel',
    description: '10 KW Commercial Infrastructure Module',
    priceUsdt: 300,
    currency: 'USDT',
    validityDays: 60,
    workingDaysTotal: 43,
    dailyEarningUsdt: 7.20,
    grossEarningUsdt: 309.60,
    withdrawalFeePercent: 10,
    netAfterFeeUsdt: 278.64,
    capacityKw: 10.0,
    capacityDescription: '10.0 KW Industrial Solar Infrastructure Unit',
    imageUrl: '/images/panel-p3.jpg',
    features: [
      '10.0 KW Industrial Solar Infrastructure Unit',
      '7.20 USDT Daily Generation Revenue',
      'Daily 3-Hour Operation Window',
      'Direct Automated Daily Settlement',
    ],
    projectLocation: 'Atacama Horizon Solar Complex, Chile',
    displayOrder: 3,
    status: 'ACTIVE',
    operationStartTime: '12:00 PM',
    operationEndTime: '3:00 PM',
    operatingWeekdays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
  },
  {
    id: 'plan-p4-ultra',
    code: 'P4',
    name: 'P4 Solar Panel',
    description: '20 KW Industrial Clean Power Unit',
    priceUsdt: 600,
    currency: 'USDT',
    validityDays: 60,
    workingDaysTotal: 43,
    dailyEarningUsdt: 15.00,
    grossEarningUsdt: 645.00,
    withdrawalFeePercent: 10,
    netAfterFeeUsdt: 580.50,
    capacityKw: 20.0,
    capacityDescription: '20.0 KW High-Yield Industrial Solar Array',
    imageUrl: '/images/panel-p4.jpg',
    features: [
      '20.0 KW High-Yield Industrial Solar Array',
      '15.00 USDT Daily Generation Revenue',
      'Daily 3-Hour Operation Window',
      'Direct Automated Daily Settlement',
    ],
    projectLocation: 'Sahara Sun Hub Alpha, Morocco',
    displayOrder: 4,
    status: 'ACTIVE',
    operationStartTime: '12:00 PM',
    operationEndTime: '3:00 PM',
    operatingWeekdays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
  },
  {
    id: 'plan-p5-mega',
    code: 'P5',
    name: 'P5 Solar Panel',
    description: '50 KW Grid-Tier Solar Generation Array',
    priceUsdt: 1500,
    currency: 'USDT',
    validityDays: 60,
    workingDaysTotal: 43,
    dailyEarningUsdt: 40.00,
    grossEarningUsdt: 1720.00,
    withdrawalFeePercent: 10,
    netAfterFeeUsdt: 1548.00,
    capacityKw: 50.0,
    capacityDescription: '50.0 KW Utility-Scale Photovoltaic Fleet',
    imageUrl: '/images/panel-p5.jpg',
    features: [
      '50.0 KW Utility-Scale Photovoltaic Fleet',
      '40.00 USDT Daily Generation Revenue',
      'Daily 3-Hour Operation Window',
      'Direct Automated Daily Settlement',
    ],
    projectLocation: 'Andalusia Horizon Solar Center, Spain',
    displayOrder: 5,
    status: 'ACTIVE',
    operationStartTime: '12:00 PM',
    operationEndTime: '3:00 PM',
    operatingWeekdays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
  },
  {
    id: 'plan-p6-giga',
    code: 'P6',
    name: 'P6 Solar Panel',
    description: '100 KW National Interconnect Solar Array',
    priceUsdt: 3000,
    currency: 'USDT',
    validityDays: 60,
    workingDaysTotal: 43,
    dailyEarningUsdt: 85.00,
    grossEarningUsdt: 3655.00,
    withdrawalFeePercent: 10,
    netAfterFeeUsdt: 3289.50,
    capacityKw: 100.0,
    capacityDescription: '100.0 KW Enterprise Photovoltaic Infrastructure',
    imageUrl: '/images/panel-p6.jpg',
    features: [
      '100.0 KW Enterprise Photovoltaic Infrastructure',
      '85.00 USDT Daily Generation Revenue',
      'Daily 3-Hour Operation Window',
      'Direct Automated Daily Settlement',
    ],
    projectLocation: 'Texas Sunbelt Grid Hub, USA',
    displayOrder: 6,
    status: 'ACTIVE',
    operationStartTime: '12:00 PM',
    operationEndTime: '3:00 PM',
    operatingWeekdays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
  },
];

export const INITIAL_PROJECTS: SolarProject[] = [
  {
    id: 'proj-sonoran',
    name: 'Sonoran Solar Basin Alpha',
    location: 'Maricopa County, Arizona',
    country: 'United States',
    coordinates: { lat: 33.4484, lng: -112.074 },
    totalCapacityMw: 45.8,
    activeUnitsCount: 1840,
    efficiencyRating: 99.2,
    weatherCondition: 'Clear Sun (940 W/m²)',
    temperatureC: 32.4,
    sunlightHours: 9.2,
    imageUrl: '/images/solar-desert-park.png',
    status: 'OPERATIONAL',
  },
  {
    id: 'proj-mojave',
    name: 'Mojave Bifacial Energy Park',
    location: 'Clark County, Nevada',
    country: 'United States',
    coordinates: { lat: 36.1716, lng: -115.1391 },
    totalCapacityMw: 88.5,
    activeUnitsCount: 3420,
    efficiencyRating: 98.7,
    weatherCondition: 'Optimal Irradiance (890 W/m²)',
    temperatureC: 29.8,
    sunlightHours: 8.8,
    imageUrl: '/images/solar-farm-hero.png',
    status: 'OPERATIONAL',
  },
  {
    id: 'proj-atacama',
    name: 'Atacama Horizon Solar Complex',
    location: 'Antofagasta Region',
    country: 'Chile',
    coordinates: { lat: -23.8634, lng: -69.1328 },
    totalCapacityMw: 120.0,
    activeUnitsCount: 5120,
    efficiencyRating: 99.6,
    weatherCondition: 'High UV Sky (1050 W/m²)',
    temperatureC: 24.1,
    sunlightHours: 10.1,
    imageUrl: '/images/solar-floating.png',
    status: 'OPERATIONAL',
  },
  {
    id: 'proj-bavaria',
    name: 'Bavarian Agrivoltaic Microgrid',
    location: 'Upper Bavaria',
    country: 'Germany',
    coordinates: { lat: 48.1351, lng: 11.582 },
    totalCapacityMw: 32.0,
    activeUnitsCount: 940,
    efficiencyRating: 97.4,
    weatherCondition: 'Scattered Cloud (720 W/m²)',
    temperatureC: 19.5,
    sunlightHours: 7.2,
    imageUrl: '/images/solar-rooftop.png',
    status: 'OPERATIONAL',
  },
];

export const INITIAL_COMMISSION_RULES: CommissionRule[] = [
  {
    level: 1,
    name: 'Level 1 Direct Sponsor Commission',
    percentage: 10.0,
    active: true,
    description: '10% recurring commission on all L1 direct downline daily solar energy generation earnings.',
  },
  {
    level: 2,
    name: 'Level 2 Secondary Team Commission',
    percentage: 5.0,
    active: true,
    description: '5% commission on all L2 secondary team daily solar energy generation earnings.',
  },
  {
    level: 3,
    name: 'Level 3 Tertiary Network Commission',
    percentage: 2.0,
    active: true,
    description: '2% commission on all L3 tertiary community daily solar energy generation earnings.',
  },
];

export const INITIAL_POINT_RULES: PointRule[] = [
  {
    id: 'pt-rew-recruit',
    code: 'RECRUIT_OFFICIAL_MEMBER',
    title: 'Recruit one official member',
    type: 'REWARD',
    points: 2,
    description: 'Awarded when a direct L1 referral activates their first solar panel unit.',
    active: true,
  },
  {
    id: 'pt-rew-train',
    code: 'SUPERVISE_L1_TRAINING',
    title: 'Remind/supervise L1 member to complete training',
    type: 'REWARD',
    points: 2,
    description: 'Awarded for mentoring an L1 member through platform onboarding and energy verification.',
    active: true,
  },
  {
    id: 'pt-rew-meet-small',
    code: 'MEETING_OFFLINE_5',
    title: 'Organize offline meeting with 5+ people',
    type: 'REWARD',
    points: 2,
    description: 'Awarded for community energy meetups and workshops with 5 or more attendees.',
    active: true,
  },
  {
    id: 'pt-rew-meet-large',
    code: 'MEETING_OFFLINE_20',
    title: 'Organize offline meeting with 20+ people',
    type: 'REWARD',
    points: 2,
    description: 'Awarded for large regional green-energy seminars and community expansion forums.',
    active: true,
  },
  {
    id: 'pt-rew-l1-manager',
    code: 'L1_REACH_LEVEL_1_MGR',
    title: 'Help an L1 member reach Level 1 Manager',
    type: 'REWARD',
    points: 2,
    description: 'Awarded when a direct team member promotes to Solar Builder or higher rank.',
    active: true,
  },
  {
    id: 'pt-rew-suggestion',
    code: 'ADOPTED_SUGGESTION',
    title: 'Provide an adopted suggestion that helps company development',
    type: 'REWARD',
    points: 10,
    description: 'Awarded for platform governance and strategic technological improvement submissions approved by executive leadership.',
    active: true,
  },
  // Deductions
  {
    id: 'pt-ded-mgr-reply',
    code: 'FAIL_REPLY_MANAGER_48H',
    title: 'Failure to reply to manager message within 48 hours',
    type: 'DEDUCTION',
    points: -2,
    description: 'Applied when an active leader fails to acknowledge regional manager operational requests.',
    active: true,
  },
  {
    id: 'pt-ded-meet-absence',
    code: 'MEETING_ABSENCE',
    title: 'Absence from company meeting',
    type: 'DEDUCTION',
    points: -2,
    description: 'Applied for unexcused absence from scheduled grid performance briefings.',
    active: true,
  },
  {
    id: 'pt-ded-no-act-2d',
    code: 'FAIL_ACTIVATE_2D',
    title: 'Failure to activate for 2 consecutive days',
    type: 'DEDUCTION',
    points: -2,
    description: 'Applied when daily solar panel operation is missed for 2 consecutive business days.',
    active: true,
  },
  {
    id: 'pt-ded-no-act-5d',
    code: 'FAIL_ACTIVATE_5D',
    title: 'Failure to activate for 5 consecutive days',
    type: 'DEDUCTION',
    points: -5,
    description: 'Applied when daily solar panel operation is missed for 5 consecutive business days.',
    active: true,
  },
  {
    id: 'pt-ded-rude',
    code: 'DISOBEDIENCE_RUDE',
    title: 'Disobedience / refusal to communicate / rude attitude',
    type: 'DEDUCTION',
    points: -5,
    description: 'Applied for code of conduct infractions and disruptive community behavior.',
    active: true,
  },
  {
    id: 'pt-ded-rumors',
    code: 'SPREAD_RUMORS',
    title: 'Spreading rumors / damaging company reputation',
    type: 'DEDUCTION',
    points: -10,
    description: 'Applied for deliberate disinformation or malicious reputational harm to the SolarGrid network.',
    active: true,
  },
];

export const INITIAL_LEADERSHIP_LEVELS: LeadershipLevelConfig[] = [
  {
    id: 'lead-1',
    level: 'SOLAR_MEMBER',
    order: 1,
    title: 'Solar Member',
    badge: 'Solar Tier 1',
    iconName: 'Sun',
    colorHex: '#10B981',
    minDirectTeam: 0,
    minQualifiedTeam: 0,
    requiredActivePlan: 'P1',
    requiredTeamDepth: 1,
    minPoints: 70,
    bonusUsdt: 0,
    dailyBonusUsdt: 0,
    benefits: [
      'Standard Daily Energy Generation Access',
      'L1 Referral Commission (10%)',
      'Baseline 70-Point Earning Ratio (100%)',
      'Community Ticket Support Access',
    ],
  },
  {
    id: 'lead-2',
    level: 'SOLAR_BUILDER',
    order: 2,
    title: 'Solar Builder',
    badge: 'Solar Tier 2',
    iconName: 'Zap',
    colorHex: '#34D399',
    minDirectTeam: 3,
    minQualifiedTeam: 5,
    requiredActivePlan: 'P1',
    requiredTeamDepth: 2,
    minPoints: 70,
    bonusUsdt: 20,
    dailyBonusUsdt: 0.5,
    benefits: [
      'One-time 20 USDT Advancement Bonus',
      '0.50 USDT/day Leadership Energy Allowance',
      'L1 (10%) + L2 (5%) Team Commission Unlock',
      'Access to Builder Regional Discussion Channels',
    ],
  },
  {
    id: 'lead-3',
    level: 'ENERGY_COORDINATOR',
    order: 3,
    title: 'Energy Coordinator',
    badge: 'Coordinator',
    iconName: 'Activity',
    colorHex: '#06B6D4',
    minDirectTeam: 8,
    minQualifiedTeam: 20,
    requiredActivePlan: 'P2',
    requiredTeamDepth: 3,
    minPoints: 70,
    bonusUsdt: 60,
    dailyBonusUsdt: 1.5,
    benefits: [
      'One-time 60 USDT Advancement Bonus',
      '1.50 USDT/day Leadership Energy Allowance',
      'Full L1 (10%), L2 (5%), L3 (2%) Commission Unlock',
      'Priority Support Queue Routing',
      'Specialized Regional Energy Seminars Access',
    ],
  },
  {
    id: 'lead-4',
    level: 'SOLAR_LEADER',
    order: 4,
    title: 'Solar Leader',
    badge: 'Leader Tier',
    iconName: 'Award',
    colorHex: '#F59E0B',
    minDirectTeam: 15,
    minQualifiedTeam: 50,
    requiredActivePlan: 'P2',
    requiredTeamDepth: 3,
    minPoints: 75,
    bonusUsdt: 180,
    dailyBonusUsdt: 4.0,
    benefits: [
      'One-time 180 USDT Advancement Bonus',
      '4.00 USDT/day Leadership Energy Allowance',
      'Exclusive Physical Marketplace Access',
      'Invitations to Annual SolarGrid Global Summits',
      'Direct WhatsApp/Telegram Grid Support Lead',
    ],
  },
  {
    id: 'lead-5',
    level: 'GRID_LEADER',
    order: 5,
    title: 'Grid Leader',
    badge: 'Executive Leader',
    iconName: 'ShieldCheck',
    colorHex: '#FBBF24',
    minDirectTeam: 30,
    minQualifiedTeam: 150,
    requiredActivePlan: 'P3',
    requiredTeamDepth: 3,
    minPoints: 80,
    bonusUsdt: 500,
    dailyBonusUsdt: 10.0,
    benefits: [
      'One-time 500 USDT Advancement Bonus',
      '10.00 USDT/day Leadership Energy Allowance',
      'Co-Hosting Rights for Official SolarGrid Hubs',
      'Subsidized Offline Meetup Budget Allocation',
      'VIP Fast-Track Withdrawal Processing',
    ],
  },
  {
    id: 'lead-6',
    level: 'ENERGY_AMBASSADOR',
    order: 6,
    title: 'Energy Ambassador',
    badge: 'Ambassador Master',
    iconName: 'Crown',
    colorHex: '#E5A93C',
    minDirectTeam: 60,
    minQualifiedTeam: 500,
    requiredActivePlan: 'P3',
    requiredTeamDepth: 3,
    minPoints: 90,
    bonusUsdt: 1500,
    dailyBonusUsdt: 30.0,
    benefits: [
      'One-time 1,500 USDT Global Leadership Bonus',
      '30.00 USDT/day Executive Energy Allowance',
      'Global Revenue Pool Share Allocation',
      'Dedicated Executive Concierge & Legal Advisory',
      'Luxury Vehicle & Real Estate Subsidy Eligibility',
    ],
  },
];

export const INITIAL_REWARDS: RewardItem[] = [
  {
    id: 'rew-cash-50',
    title: '50 USDT Direct Capital Credit',
    category: 'CASH',
    description: 'Instant liquidity credited directly to your available balance. Configured point reset to baseline 70 applies upon redemption.',
    pointsCost: 150,
    estimatedUsdtValue: 50,
    imageUrl: '/images/reward-cash.png',
    stock: 999,
    status: 'AVAILABLE',
    resetsPointsToBaseline: true,
  },
  {
    id: 'rew-iphone',
    title: 'Apple iPhone 16 Pro Max (512GB)',
    category: 'ELECTRONICS',
    description: 'Brand new flagship device in Natural Titanium. Delivered insured worldwide or redeemable for USDT cash equivalent.',
    pointsCost: 300,
    estimatedUsdtValue: 1399,
    imageUrl: '/images/reward-iphone.png',
    stock: 50,
    requiredLeadershipLevel: 'SOLAR_BUILDER',
    status: 'AVAILABLE',
    resetsPointsToBaseline: true,
  },
  {
    id: 'rew-motorcycle',
    title: 'BMW R 1250 GS / Harley-Davidson Cruiser',
    category: 'VEHICLES',
    description: 'Premium adventure tourer or classic cruiser motorcycle funded directly by the SolarGrid Community Leadership Reserve.',
    pointsCost: 500,
    estimatedUsdtValue: 18500,
    imageUrl: '/images/reward-motorcycle.png',
    stock: 12,
    requiredLeadershipLevel: 'SOLAR_LEADER',
    status: 'AVAILABLE',
    resetsPointsToBaseline: true,
  },
  {
    id: 'rew-housing',
    title: 'Solar Villa Real Estate Subsidy Grant',
    category: 'LIFESTYLE',
    description: '100,000 USDT down-payment grant toward certified Net-Zero Solar residential properties or direct escrow deed transfer.',
    pointsCost: 1000,
    estimatedUsdtValue: 100000,
    imageUrl: '/images/reward-house.png',
    stock: 3,
    requiredLeadershipLevel: 'GRID_LEADER',
    status: 'AVAILABLE',
    resetsPointsToBaseline: true,
  },
  {
    id: 'rew-macbook',
    title: 'MacBook Pro 16" M4 Max',
    category: 'ELECTRONICS',
    description: 'Ultimate engineering workstation for grid leaders managing large regional clean-energy teams.',
    pointsCost: 400,
    estimatedUsdtValue: 3499,
    imageUrl: '/images/reward-laptop.png',
    stock: 25,
    requiredLeadershipLevel: 'ENERGY_COORDINATOR',
    status: 'AVAILABLE',
    resetsPointsToBaseline: true,
  },
  {
    id: 'rew-solar-summit',
    title: 'VIP SolarGrid Global Leadership Summit in Dubai',
    category: 'EXPERIENCES',
    description: 'All-inclusive 5-star travel, Burj Al Arab accommodation, and keynote VIP pass at the annual World Solar Congress.',
    pointsCost: 350,
    estimatedUsdtValue: 4500,
    imageUrl: '/images/reward-travel.png',
    stock: 30,
    requiredLeadershipLevel: 'SOLAR_LEADER',
    status: 'AVAILABLE',
    resetsPointsToBaseline: true,
  },
];

export const INITIAL_BUSINESS_RULES: BusinessRule[] = [
  {
    id: 'rule-working-days',
    key: 'WORKING_DAYS_PER_CYCLE',
    category: 'SOLAR',
    label: 'Standard Working Days per 60-Day Cycle',
    value: 43,
    description: 'Number of active Monday-Friday earning cycles per 60 calendar-day solar plan validity.',
    updatedAt: new Date().toISOString(),
    updatedBy: 'SUPER_ADMIN',
  },
  {
    id: 'rule-start-points',
    key: 'DEFAULT_STARTING_POINTS',
    category: 'POINTS',
    label: 'Default Starting Point Balance',
    value: 100,
    description: 'Default baseline credit score assigned to every newly verified SolarGrid user.',
    updatedAt: new Date().toISOString(),
    updatedBy: 'SUPER_ADMIN',
  },
  {
    id: 'rule-reset-baseline',
    key: 'RESET_POINTS_TO_BASELINE_ON_REDEMPTION',
    category: 'POINTS',
    label: 'Reset Points to 70 on Reward Redemption',
    value: true,
    description: 'When true, redeeming any point milestone resets the user balance to the 70-point baseline.',
    updatedAt: new Date().toISOString(),
    updatedBy: 'SUPER_ADMIN',
  },
  {
    id: 'rule-min-withdrawal',
    key: 'MINIMUM_WITHDRAWAL_USDT',
    category: 'WITHDRAWAL',
    label: 'Minimum Withdrawal Amount (USDT)',
    value: 10,
    description: 'Minimum balance required to submit a USDT on-chain withdrawal request.',
    updatedAt: new Date().toISOString(),
    updatedBy: 'SUPER_ADMIN',
  },
  {
    id: 'rule-upgrade-p1-p2',
    key: 'UPGRADE_COST_P1_TO_P2',
    category: 'SOLAR',
    label: 'P1 to P2 Upgrade Top-Up Cost (USDT)',
    value: 30,
    description: 'Exact price difference required to upgrade an active P1 unit to P2 capacity.',
    updatedAt: new Date().toISOString(),
    updatedBy: 'SUPER_ADMIN',
  },
  {
    id: 'rule-upgrade-p2-p3',
    key: 'UPGRADE_COST_P2_TO_P3',
    category: 'SOLAR',
    label: 'P2 to P3 Upgrade Top-Up Cost (USDT)',
    value: 100,
    description: 'Exact price difference required to upgrade an active P2 unit to P3 capacity.',
    updatedAt: new Date().toISOString(),
    updatedBy: 'SUPER_ADMIN',
  },
  {
    id: 'rule-l1-comm',
    key: 'COMMISSION_PERCENT_L1',
    category: 'MLM',
    label: 'L1 Direct Referral Commission (%)',
    value: 10.0,
    description: 'Percentage of downline daily solar earning distributed to direct sponsor.',
    updatedAt: new Date().toISOString(),
    updatedBy: 'SUPER_ADMIN',
  },
  {
    id: 'rule-l2-comm',
    key: 'COMMISSION_PERCENT_L2',
    category: 'MLM',
    label: 'L2 Secondary Referral Commission (%)',
    value: 5.0,
    description: 'Percentage of downline daily solar earning distributed to 2nd-generation upline.',
    updatedAt: new Date().toISOString(),
    updatedBy: 'SUPER_ADMIN',
  },
  {
    id: 'rule-l3-comm',
    key: 'COMMISSION_PERCENT_L3',
    category: 'MLM',
    label: 'L3 Tertiary Referral Commission (%)',
    value: 2.0,
    description: 'Percentage of downline daily solar earning distributed to 3rd-generation upline.',
    updatedAt: new Date().toISOString(),
    updatedBy: 'SUPER_ADMIN',
  },
];

// Generate 100+ Believable Synthetic Users with Multi-tier Sponsor Trees
export function generateSyntheticSeedUsers(): {
  users: User[];
  profiles: Profile[];
  units: SolarUnit[];
  logs: GenerationLog[];
  ledger: EarningsLedgerEntry[];
  pointsLedger: PointsLedgerEntry[];
  withdrawals: WithdrawalRequest[];
  upgrades: UpgradeTransaction[];
  tickets: SupportTicket[];
  audits: AuditLog[];
} {
  const users: User[] = [];
  const profiles: Profile[] = [];
  const units: SolarUnit[] = [];
  const logs: GenerationLog[] = [];
  const ledger: EarningsLedgerEntry[] = [];
  const pointsLedger: PointsLedgerEntry[] = [];
  const withdrawals: WithdrawalRequest[] = [];
  const upgrades: UpgradeTransaction[] = [];
  const tickets: SupportTicket[] = [];
  const audits: AuditLog[] = [];

  // Core Demo Accounts
  const coreAccounts = [
    {
      id: 'usr-superadmin',
      name: 'Alexander Sterling',
      email: 'superadmin@solargrid.io',
      role: 'SUPER_ADMIN' as const,
      status: 'ACTIVE' as const,
      referralCode: 'SOLAR-SUPREME-01',
      leadershipLevel: 'ENERGY_AMBASSADOR' as const,
      points: 98,
      balance: 14520.5,
      plan: 'P3',
    },
    {
      id: 'usr-admin',
      name: 'Marcus Vance',
      email: 'admin@solargrid.io',
      role: 'SUPER_ADMIN' as const,
      status: 'ACTIVE' as const,
      referralCode: 'GRID-ADMIN-01',
      leadershipLevel: 'GRID_LEADER' as const,
      points: 92,
      balance: 8430.0,
      plan: 'P3',
    },
    {
      id: 'usr-manager',
      name: 'Elena Rostova',
      email: 'manager@solargrid.io',
      role: 'USER' as const,
      status: 'ACTIVE' as const,
      referralCode: 'SOLAR-MGR-01',
      leadershipLevel: 'SOLAR_LEADER' as const,
      points: 85,
      balance: 4210.8,
      plan: 'P2',
    },
    {
      id: 'usr-support',
      name: 'David Chen',
      email: 'support@solargrid.io',
      role: 'USER' as const,
      status: 'ACTIVE' as const,
      referralCode: 'SOLAR-SUPP-01',
      leadershipLevel: 'ENERGY_COORDINATOR' as const,
      points: 75,
      balance: 1840.2,
      plan: 'P2',
    },
    {
      id: 'usr-demo-user',
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@solargrid.io',
      role: 'USER' as const,
      status: 'ACTIVE' as const,
      referralCode: 'SOLAR-SARAH-99',
      leadershipLevel: 'SOLAR_BUILDER' as const,
      points: 74,
      balance: 385.4,
      plan: 'P2',
    },
  ];

  // Add Core Accounts
  for (const acc of coreAccounts) {
    const user: User = {
      id: acc.id,
      name: acc.name,
      email: acc.email,
      phone: '+1 (555) 234-8901',
      country: 'United States',
      avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      role: acc.role,
      status: acc.status,
      referralCode: acc.referralCode,
      sponsorId: acc.id === 'usr-superadmin' ? null : 'usr-superadmin',
      leadershipLevel: acc.leadershipLevel,
      points: acc.points,
      availableBalance: acc.balance,
      totalEarned: acc.balance * 2.8,
      createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    };
    users.push(user);

    profiles.push({
      id: `prof-${user.id}`,
      userId: user.id,
      bio: 'Clean Energy Infrastructure Ambassador & Grid Contributor',
      walletAddress: `0x71C${Math.random().toString(16).substring(2, 10)}b892F1c37E`,
      preferredCurrency: 'USDT',
      twoFactorEnabled: true,
      emailNotifications: true,
      pushNotifications: true,
      telegramHandle: `@${acc.name.toLowerCase().replace(/\s+/g, '')}_sg`,
    });
  }

  // Realistic Synthetic Names for remaining 100+ community members
  const firstNames = [
    'Julian', 'Sophia', 'Liam', 'Emma', 'Noah', 'Olivia', 'Ethan', 'Ava', 'Mason', 'Isabella',
    'Lucas', 'Mia', 'Oliver', 'Harper', 'Aiden', 'Evelyn', 'Elijah', 'Abigail', 'James', 'Emily',
    'Benjamin', 'Ella', 'Sebastian', 'Scarlett', 'Jack', 'Grace', 'Henry', 'Chloe', 'Matthew', 'Camila',
    'Wyatt', 'Penelope', 'Leo', 'Riley', 'Daniel', 'Layla', 'Gabriel', 'Lillian', 'Owen', 'Nora',
    'Carter', 'Zoey', 'Jayden', 'Mila', 'John', 'Aubrey', 'Luke', 'Hannah', 'Anthony', 'Stella',
    'Isaac', 'Addison', 'Dylan', 'Leah', 'Lincoln', 'Natalie', 'Thomas', 'Zoe', 'Maverick', 'Violet',
    'Josiah', 'Victoria', 'Isaiah', 'Elena', 'Andrew', 'Paisley', 'Elias', 'Audrey', 'Joshua', 'Skylar',
    'Nathan', 'Bella', 'Caleb', 'Claire', 'Ryan', 'Savannah', 'Adrian', 'Lucy', 'Miles', 'Anna',
    'Eli', 'Caroline', 'Nolan', 'Nova', 'Christian', 'Genesis', 'Aaron', 'Emilia', 'Cameron', 'Kennedy',
    'Ezekiel', 'Samantha', 'Colton', 'Maya', 'Luca', 'Willow', 'Landon', 'Kinsley', 'Hunter', 'Naomi',
  ];

  const lastNames = [
    'Mercer', 'Haywood', 'Sterling', 'Sinclair', 'Vanguard', 'Castillo', 'Lindqvist', 'Dupont',
    'Takahashi', 'Novak', 'Al-Mansoor', 'Kowalski', 'O\'Connor', 'Thornton', 'Dubois', 'Santoro',
    'Abernathy', 'Khatri', 'Bergstrom', 'Fontaine', 'Vargas', 'Rasmussen', 'Blackwood', 'Montague',
    'Kensington', 'Donovan', 'Sinclair', 'Nakamura', 'Moretti', 'Solomon', 'Gallagher', 'Hawthorne',
  ];

  const countries = ['United States', 'United Kingdom', 'Germany', 'Australia', 'Canada', 'Singapore', 'United Arab Emirates', 'Japan', 'Switzerland', 'Netherlands'];

  // Seed remaining 100 users forming multi-tiered sponsor trees under core users
  for (let i = 1; i <= 100; i++) {
    const fn = firstNames[(i * 7) % firstNames.length];
    const ln = lastNames[(i * 5) % lastNames.length];
    const name = `${fn} ${ln}`;
    const email = `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@gridmail.net`;
    const userId = `usr-gen-${i.toString().padStart(3, '0')}`;

    // Sponsor assignments:
    // 1-15 direct under Sarah Jenkins (L1 for Sarah, L2 for Superadmin)
    // 16-45 under user 1-15 (L2 for Sarah, L3 for Superadmin)
    // 46-100 under user 16-45 (L3 for Sarah)
    let sponsorId = 'usr-demo-user';
    let leadershipLevel: LeadershipLevel = 'SOLAR_MEMBER';
    let points = 70 + (i % 25) - (i % 6 === 0 ? 12 : 0); // some high, some normal, a few low to test ratios

    if (i <= 15) {
      sponsorId = 'usr-demo-user';
      leadershipLevel = i <= 3 ? 'SOLAR_BUILDER' : 'SOLAR_MEMBER';
    } else if (i <= 45) {
      const parentIdx = 1 + (i % 15);
      sponsorId = `usr-gen-${parentIdx.toString().padStart(3, '0')}`;
      leadershipLevel = 'SOLAR_MEMBER';
    } else {
      const parentIdx = 16 + (i % 30);
      sponsorId = `usr-gen-${parentIdx.toString().padStart(3, '0')}`;
      leadershipLevel = 'SOLAR_MEMBER';
    }

    const planCode = i % 4 === 0 ? 'P3' : i % 2 === 0 ? 'P2' : 'P1';
    const balance = Math.round(((i * 12.5) % 280 + 15.2) * 100) / 100;

    const user: User = {
      id: userId,
      name,
      email,
      phone: `+1 (${200 + (i % 700)}) ${100 + (i % 800)}-${1000 + i}`,
      country: countries[i % countries.length],
      avatarUrl: `https://images.unsplash.com/photo-${1500000000000 + (i * 123456) % 999999}?w=150&auto=format&fit=crop&q=80`,
      role: 'USER',
      status: i === 88 ? 'SUSPENDED' : 'ACTIVE',
      referralCode: `SG-${fn.toUpperCase().substring(0, 3)}-${100 + i}`,
      sponsorId,
      leadershipLevel,
      points: Math.max(15, Math.min(100, points)),
      availableBalance: balance,
      totalEarned: balance * 2.2,
      createdAt: new Date(Date.now() - (60 - (i % 55)) * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    };
    users.push(user);

    profiles.push({
      id: `prof-${userId}`,
      userId,
      bio: `Renewable solar microgrid participant in ${user.country}`,
      walletAddress: `0x${i.toString(16).padStart(4, '0')}7A9${Math.random().toString(16).substring(2, 10)}8F1`,
      preferredCurrency: 'USDT',
      twoFactorEnabled: i % 3 === 0,
      emailNotifications: true,
      pushNotifications: true,
      telegramHandle: `@${fn.toLowerCase()}_sg`,
    });

    // Create active Solar Unit for each user
    const planObj = INITIAL_PLANS.find(p => p.code === planCode) || INITIAL_PLANS[0];
    const projectObj = INITIAL_PROJECTS[i % INITIAL_PROJECTS.length];
    const activatedDaysAgo = Math.min(50, 5 + (i % 45));

    const unit: SolarUnit = {
      id: `unit-${userId}-01`,
      userId,
      planId: planObj.id,
      planCode: planObj.code,
      planName: planObj.name,
      projectId: projectObj.id,
      projectName: projectObj.name,
      location: projectObj.location,
      capacityKw: planObj.capacityKw,
      activatedAt: new Date(Date.now() - activatedDaysAgo * 86400000).toISOString(),
      expiresAt: new Date(Date.now() + (60 - activatedDaysAgo) * 86400000).toISOString(),
      purchasePriceUsdt: planObj.priceUsdt,
      dailyEarningUsdt: planObj.dailyEarningUsdt,
      workingDaysTotal: planObj.workingDaysTotal || 43,
      validityDays: planObj.validityDays || 60,
      withdrawalFeePercent: planObj.withdrawalFeePercent !== undefined ? planObj.withdrawalFeePercent : 10,
      workingDaysCompleted: Math.min(43, Math.floor((activatedDaysAgo * 43) / 60)),
      workingDaysRemaining: Math.max(0, 43 - Math.floor((activatedDaysAgo * 43) / 60)),
      status: 'ACTIVE',
      todayGeneratedKwh: Math.round(planObj.capacityKw * 6.8 * 100) / 100,
      lifetimeGeneratedKwh: Math.round(planObj.capacityKw * 6.8 * Math.floor((activatedDaysAgo * 43) / 60) * 100) / 100,
      todayEarnedUsdt: planObj.dailyEarningUsdt,
      lifetimeEarnedUsdt: Math.round(planObj.dailyEarningUsdt * Math.floor((activatedDaysAgo * 43) / 60) * 100) / 100,
      performanceRatio: user.points >= 70 ? 1.0 : user.points >= 61 ? 0.8 : user.points >= 31 ? 0.5 : 0.1,
      lastOperatedDate: new Date().toISOString().split('T')[0],
    };
    units.push(unit);
  }

  // Create Solar Units for Core Accounts
  for (const acc of coreAccounts) {
    const planObj = INITIAL_PLANS.find(p => p.code === acc.plan) || INITIAL_PLANS[1];
    const projectObj = INITIAL_PROJECTS[0];
    units.push({
      id: `unit-${acc.id}-01`,
      userId: acc.id,
      planId: planObj.id,
      planCode: planObj.code,
      planName: planObj.name,
      projectId: projectObj.id,
      projectName: projectObj.name,
      location: projectObj.location,
      capacityKw: planObj.capacityKw,
      activatedAt: new Date(Date.now() - 35 * 86400000).toISOString(),
      expiresAt: new Date(Date.now() + 25 * 86400000).toISOString(),
      purchasePriceUsdt: planObj.priceUsdt,
      dailyEarningUsdt: planObj.dailyEarningUsdt,
      workingDaysTotal: planObj.workingDaysTotal || 43,
      validityDays: planObj.validityDays || 60,
      withdrawalFeePercent: planObj.withdrawalFeePercent !== undefined ? planObj.withdrawalFeePercent : 10,
      workingDaysCompleted: 25,
      workingDaysRemaining: 18,
      status: 'ACTIVE',
      todayGeneratedKwh: Math.round(planObj.capacityKw * 7.2 * 100) / 100,
      lifetimeGeneratedKwh: Math.round(planObj.capacityKw * 7.2 * 25 * 100) / 100,
      todayEarnedUsdt: planObj.dailyEarningUsdt,
      lifetimeEarnedUsdt: planObj.dailyEarningUsdt * 25,
      performanceRatio: 1.0,
      lastOperatedDate: new Date().toISOString().split('T')[0],
    });
  }

  // Generate 60 Days of Historical Generation Logs for Sarah Jenkins (Demo User)
  const sarahUnit = units.find(u => u.userId === 'usr-demo-user')!;
  const today = new Date();
  for (let d = 30; d >= 0; d--) {
    const logDate = new Date(today.getTime() - d * 86400000);
    const dayOfWeek = logDate.getDay();
    // Monday(1) to Friday(5)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      const dateStr = logDate.toISOString().split('T')[0];
      const baseEarning = 3.50; // P2
      const efficiency = 98.2 + (Math.sin(d) * 1.5);
      const pointsMult = 1.0;
      const actualEarning = baseEarning * pointsMult;

      logs.push({
        id: `gen-log-sarah-${dateStr}`,
        unitId: sarahUnit.id,
        userId: 'usr-demo-user',
        planCode: 'P2',
        generationDate: dateStr,
        kwhGenerated: Math.round(1.2 * 7.1 * 100) / 100,
        efficiency: Math.round(efficiency * 10) / 10,
        pointsMultiplier: pointsMult,
        baseEarningUsdt: baseEarning,
        actualEarningUsdt: actualEarning,
        weatherCondition: d % 3 === 0 ? 'Clear Sun (950 W/m²)' : 'Optimal Solar Sky (910 W/m²)',
        status: 'RECEIVED',
        operatedAt: `${dateStr}T10:15:00.000Z`,
      });


      // Add Ledger Entry for Sarah
      ledger.push({
        id: `led-gen-${dateStr}-sarah`,
        userId: 'usr-demo-user',
        type: 'DAILY_SOLAR_EARNING',
        amountUsdt: actualEarning,
        balanceBefore: Math.max(0, 385.4 - (30 - d) * actualEarning),
        balanceAfter: Math.max(0, 385.4 - (30 - d) * actualEarning + actualEarning),
        description: `Solar Energy Output Credit: P2 Unit #unit-usr-demo-user-01 [${dateStr}]`,
        referenceId: sarahUnit.id,
        createdAt: `${dateStr}T10:15:00.000Z`,
      });

      // L1 Sponsor Commission to Alexander Sterling (Super Admin)
      ledger.push({
        id: `led-l1-comm-${dateStr}-alex`,
        userId: 'usr-superadmin',
        type: 'L1_REFERRAL_REWARD',
        amountUsdt: Math.round(actualEarning * 0.10 * 100) / 100,
        balanceBefore: 14500.0,
        balanceAfter: 14500.0 + (actualEarning * 0.10),
        description: `10% L1 Direct Commission from Sarah Jenkins (P2 generation)`,
        sourceUserId: 'usr-demo-user',
        sourceUserName: 'Sarah Jenkins',
        createdAt: `${dateStr}T10:15:05.000Z`,
      });
    }
  }

  // Add Sample Point Ledger History for Sarah
  pointsLedger.push(
    {
      id: 'pt-led-01',
      userId: 'usr-demo-user',
      type: 'INITIAL_BASELINE',
      pointsChange: 70,
      balanceBefore: 0,
      balanceAfter: 70,
      reason: 'Standard Account Verification Initial 70-Point Allocation',
      createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    },
    {
      id: 'pt-led-02',
      userId: 'usr-demo-user',
      type: 'REWARD',
      pointsChange: 2,
      balanceBefore: 70,
      balanceAfter: 72,
      reason: 'Recruited official verified member (Julian Mercer P1 Activation)',
      createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
    },
    {
      id: 'pt-led-03',
      userId: 'usr-demo-user',
      type: 'REWARD',
      pointsChange: 2,
      balanceBefore: 72,
      balanceAfter: 74,
      reason: 'Supervised L1 member onboarding & technical verification',
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    }
  );

  // Add Sample Upgrades
  upgrades.push({
    id: 'upg-sarah-01',
    userId: 'usr-demo-user',
    fromPlanCode: 'P1',
    toPlanCode: 'P2',
    fromPriceUsdt: 30,
    toPriceUsdt: 60,
    creditAppliedUsdt: 30,
    topUpAmountUsdt: 30,
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    status: 'COMPLETED',
  });

  // Add Sample Withdrawals
  withdrawals.push(
    {
      id: 'wdr-101',
      userId: 'usr-demo-user',
      userName: 'Sarah Jenkins',
      userEmail: 'sarah.jenkins@solargrid.io',
      planCode: 'P2',
      amountUsdt: 120.0,
      feePercent: 20,
      feeAmountUsdt: 24.0,
      netAmountUsdt: 96.0,
      walletAddress: '0x71C824b23892F1c37E1928419b48f98c',
      network: 'USDT-TRC20',
      status: 'COMPLETED',
      txHash: '0x8f2a74c19d4b8e2193b01859c24098ea1203498102391209381029381',
      adminNotes: 'Automated fast-track batch disbursement completed.',
      reviewerName: 'Marcus Vance',
      requestedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      reviewedAt: new Date(Date.now() - 13 * 86400000).toISOString(),
    },
    {
      id: 'wdr-102',
      userId: 'usr-demo-user',
      userName: 'Sarah Jenkins',
      userEmail: 'sarah.jenkins@solargrid.io',
      planCode: 'P2',
      amountUsdt: 80.0,
      feePercent: 20,
      feeAmountUsdt: 16.0,
      netAmountUsdt: 64.0,
      walletAddress: '0x71C824b23892F1c37E1928419b48f98c',
      network: 'USDT-TRC20',
      status: 'PENDING',
      requestedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      id: 'wdr-103',
      userId: 'usr-gen-001',
      userName: 'Julian Mercer',
      userEmail: 'julian.mercer1@gridmail.net',
      planCode: 'P1',
      amountUsdt: 50.0,
      feePercent: 0,
      feeAmountUsdt: 0.0,
      netAmountUsdt: 50.0,
      walletAddress: '0x00017A9bc298192f',
      network: 'USDT-TRC20',
      status: 'PENDING',
      requestedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    },
    {
      id: 'wdr-104',
      userId: 'usr-gen-002',
      userName: 'Sophia Haywood',
      userEmail: 'sophia.haywood2@gridmail.net',
      planCode: 'P3',
      amountUsdt: 200.0,
      feePercent: 20,
      feeAmountUsdt: 40.0,
      netAmountUsdt: 160.0,
      walletAddress: '0x00027A9f0183192a',
      network: 'USDT-TRC20',
      status: 'PROCESSING',
      reviewerName: 'Marcus Vance',
      requestedAt: new Date(Date.now() - 10 * 3600000).toISOString(),
    }
  );

  // Add Support Tickets
  tickets.push(
    {
      id: 'tkt-201',
      userId: 'usr-demo-user',
      userName: 'Sarah Jenkins',
      userEmail: 'sarah.jenkins@solargrid.io',
      category: 'SOLAR_PANEL',
      priority: 'MEDIUM',
      subject: 'Inquiry regarding P2 Bifacial solar telemetry updates in overcast weather',
      status: 'RESOLVED',
      createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      messages: [
        {
          id: 'msg-1',
          ticketId: 'tkt-201',
          senderId: 'usr-demo-user',
          senderName: 'Sarah Jenkins',
          senderRole: 'USER',
          message: 'Hello SolarGrid Ops team, my Mojave array recorded 97.5% efficiency during cloud cover yesterday. How does the irradiance compensation factor work?',
          createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
        },
        {
          id: 'msg-2',
          ticketId: 'tkt-201',
          senderId: 'usr-superadmin',
          senderName: 'Alexander Sterling',
          senderRole: 'SUPER_ADMIN',
          message: 'Hi Sarah! Our bifacial tracking inverters capture albedo reflections from desert ground sand, maintaining full baseline yield even during diffuse cloud cover. Your generation rewards remain 100% safeguarded!',
          createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
        },
      ],
    },
    {
      id: 'tkt-202',
      userId: 'usr-gen-004',
      userName: 'Olivia Sterling',
      userEmail: 'olivia.sterling4@gridmail.net',
      category: 'MLM_COMMISSION',
      priority: 'HIGH',
      subject: 'Confirmation on L2 Team Commission calculation timestamp',
      status: 'OPEN',
      createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      messages: [
        {
          id: 'msg-3',
          ticketId: 'tkt-202',
          senderId: 'usr-gen-004',
          senderName: 'Olivia Sterling',
          senderRole: 'USER',
          message: 'Greetings, my direct referral Julian Mercer just added 2 new members under his network. When do the 5% L2 overrides settle?',
          createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
        },
      ],
    }
  );

  // Add Audit Logs
  audits.push(
    {
      id: 'aud-001',
      actorId: 'usr-superadmin',
      actorName: 'Alexander Sterling',
      actorRole: 'SUPER_ADMIN',
      action: 'SYSTEM_INITIALIZATION',
      target: 'PLATFORM_CORE',
      targetId: 'SYS_ROOT',
      reason: 'Platform launch and initial business rule validation',
      createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
    },
    {
      id: 'aud-002',
      actorId: 'usr-superadmin',
      actorName: 'Alexander Sterling',
      actorRole: 'SUPER_ADMIN',
      action: 'APPROVE_WITHDRAWAL',
      target: 'WITHDRAWAL_REQUEST',
      targetId: 'wdr-101',
      oldState: 'PENDING',
      newState: 'COMPLETED',
      reason: 'On-chain transaction hash verified: 0x8f2a74c19d4b8e2193b01859c24098ea',
      createdAt: new Date(Date.now() - 13 * 86400000).toISOString(),
    },
    {
      id: 'aud-003',
      actorId: 'usr-superadmin',
      actorName: 'Alexander Sterling',
      actorRole: 'SUPER_ADMIN',
      action: 'UPDATE_COMMISSION_RULES',
      target: 'COMMISSION_CONFIG',
      targetId: 'L1-L2-L3',
      oldState: 'L1: 10%, L2: 5%, L3: 2%',
      newState: 'L1: 10%, L2: 5%, L3: 2%',
      reason: 'Confirmed quarterly community sustainability ratio review',
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    }
  );

  return {
    users,
    profiles,
    units,
    logs,
    ledger,
    pointsLedger,
    withdrawals,
    upgrades,
    tickets,
    audits,
  };
}
