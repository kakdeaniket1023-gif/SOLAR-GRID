def generate_section_8():
    return """# 8. APP-WIDE FLOWS & ARCHITECTURAL WORKFLOWS

This section provides comprehensive Mermaid sequence and flow diagrams modeling the 5 critical end-to-end user and system journeys.

---

## 8.1 New User Journey: Registration to First Solar Plan Purchase

```mermaid
sequenceDiagram
    autonumber
    actor User as New User
    participant Web as Next.js Web App
    participant AuthAPI as /api/auth/signup
    participant Auth as Supabase Auth
    participant DB as PostgreSQL DB
    participant Dash as /dashboard/plans
    participant PurchaseAPI as /api/solar/purchase

    User->>Web: Visits /signup (optional ?ref=SPONSOR_CODE)
    User->>Web: Enters Name, Email, Password, Accepts Terms
    Web->>AuthAPI: POST /api/auth/signup
    AuthAPI->>DB: Check if email exists
    AuthAPI->>DB: Resolve sponsor ID from referral code
    AuthAPI->>Auth: createUser({ email, password })
    Auth-->>AuthAPI: Auth User ID
    AuthAPI->>DB: Insert into users (points=70, available_balance=0)
    AuthAPI->>DB: Insert into profiles (default preferences)
    AuthAPI->>DB: Insert points_ledger ('INITIAL_BASELINE', +70 pts)
    AuthAPI-->>Web: 200 OK (User authenticated session)
    Web->>Dash: Redirects to /dashboard/plans
    User->>Dash: Recharges balance via /dashboard/recharge (credits $30+)
    User->>Dash: Clicks "Purchase Plan" on P1 ($30 USDT)
    Dash->>PurchaseAPI: POST /api/solar/purchase { planCode: 'P1' }
    PurchaseAPI->>DB: Verify user.available_balance >= 30.00
    PurchaseAPI->>DB: Debit available_balance (30.00 -> 0.00)
    PurchaseAPI->>DB: Insert earnings_ledger ('PLAN_PURCHASE', -$30, DEBIT)
    PurchaseAPI->>DB: Insert solar_units (planCode: 'P1', 43 days total)
    PurchaseAPI-->>Dash: 200 OK (Unit Activated)
    Dash-->>User: Renders success modal & redirects to /dashboard/panels
```

---

## 8.2 Referral Network & MLM 3-Tier Commission Distribution Flow

```mermaid
sequenceDiagram
    autonumber
    actor Downline as Downline Member
    participant Cron as Daily Operation (/api/solar/operate)
    participant SolarEngine as SolarGenerationService
    participant MLMEngine as MLMService
    participant DB as PostgreSQL DB
    actor L1 as L1 Sponsor (10%)
    actor L2 as L2 Sponsor (5%)
    actor L3 as L3 Sponsor (2%)

    Downline->>Cron: Operates P3 unit (yields $9.30 USDT)
    Cron->>SolarEngine: settleDailyOperation(unitId, downlineUserId)
    SolarEngine->>DB: Credit Downline balance +$9.30 & update generation_logs
    SolarEngine->>MLMEngine: distributeCommissions(downlineId, $9.30, unitId)
    MLMEngine->>DB: getUplineChain(downlineId)
    DB-->>MLMEngine: Returns L1, L2, L3 user records

    rect rgb(20, 35, 60)
        note over MLMEngine,L1: Level 1 Commission (10% = +$0.9300 USDT)
        MLMEngine->>DB: Credit L1 available_balance +$0.9300
        MLMEngine->>DB: Insert earnings_ledger (L1_REFERRAL_REWARD)
        MLMEngine->>DB: Send Notification to L1
    end

    rect rgb(20, 35, 60)
        note over MLMEngine,L2: Level 2 Commission (5% = +$0.4650 USDT)
        MLMEngine->>DB: Credit L2 available_balance +$0.4650
        MLMEngine->>DB: Insert earnings_ledger (L2_REFERRAL_REWARD)
        MLMEngine->>DB: Send Notification to L2
    end

    rect rgb(20, 35, 60)
        note over MLMEngine,L3: Level 3 Commission (2% = +$0.1860 USDT)
        MLMEngine->>DB: Credit L3 available_balance +$0.1860
        MLMEngine->>DB: Insert earnings_ledger (L3_REFERRAL_REWARD)
        MLMEngine->>DB: Send Notification to L3
    end
```

---

## 8.3 Complete Financial Lifecycle: Deposit to Payout

```mermaid
flowchart TD
    A([User Initiates Deposit]) --> B[Transfer USDT to TRC-20 Address]
    B --> C[Submit TX Hash on /dashboard/recharge]
    C --> D[(recharge_requests: PENDING)]
    D --> E{Admin Review on /admin/recharges}
    E -- Rejected --> F[(recharge_requests: REJECTED)]
    E -- Approved --> G[(recharge_requests: APPROVED)]
    G --> H[Atomic Credit: available_balance += Amount]
    H --> I[(earnings_ledger: RECHARGE)]
    I --> J[User Purchases Solar Unit P1/P2/P3]
    J --> K[Debit available_balance]
    K --> L[Weekday Generation: 12:00 PM - 3:00 PM]
    L --> M[Daily Yield Credited + Multi-Tier Overrides]
    M --> N[User Requests Withdrawal on /dashboard/withdrawal]
    N --> O{Verify Transaction PIN & Balance >= 10}
    O -- Invalid PIN --> P[Increment Failed Attempts / Lockout]
    O -- Valid PIN --> Q[Immediate Debit from available_balance]
    Q --> R[(withdrawal_requests: PENDING)]
    R --> S{Admin Processing on /admin/withdrawals}
    S -- Reject --> T[Refund available_balance & earnings_ledger CREDIT]
    S -- Complete --> U[Submit Blockchain TX Hash & Mark COMPLETED]
    U --> V([Payout Finalized to External Wallet])
```

---

## 8.4 Super Admin Moderation & Operations Workflow

```mermaid
flowchart LR
    Admin([Super Admin]) --> Console[/admin]
    Console --> Recharges[Recharge Desk: Review TX & Credit Balance]
    Console --> Withdrawals[Withdrawal Queue: Approve, Complete with TX, or Refund]
    Console --> Users[User 360: Status Toggle, Balance/Points Adjustment with Audit Reason]
    Console --> Settings[Dynamic Rules: Modify Operating Hours & Commission %]
    Console --> Broadcast[Communications: Dispatch Real-Time Push to All / Leaders]
    Console --> Support[Support Desk: Resolve Member Tickets in Live Thread]

    Recharges --> AuditTrail[(audit_logs & earnings_ledger)]
    Withdrawals --> AuditTrail
    Users --> AuditTrail
    Settings --> AuditTrail
    Broadcast --> AuditTrail
    Support --> AuditTrail
```

---

## 8.5 Leadership Rank Promotion & Advancement Flow

```mermaid
sequenceDiagram
    autonumber
    actor Member as Member
    participant LeadAPI as /api/leadership/progress
    participant PromoteAPI as /api/leadership/promote
    participant Engine as LeadershipService
    participant DB as PostgreSQL DB

    Member->>LeadAPI: GET /api/leadership/progress
    LeadAPI->>Engine: evaluateProgress(userId)
    Engine->>DB: Query Direct Team Count (sponsorId = userId)
    Engine->>DB: Query Qualified Team Count (points >= 70 & totalEarned > 0)
    Engine->>DB: Query User Active Solar Plan & Clean Energy Points
    Engine->>Engine: Compare against next level requirements (Directs, Team, Points, Plan)
    Engine-->>LeadAPI: { isEligibleForPromotion: true, nextLevel: 'SOLAR_BUILDER', ... }
    LeadAPI-->>Member: Enables "Claim Promotion & Bonus" Button
    Member->>PromoteAPI: POST /api/leadership/promote
    PromoteAPI->>Engine: promoteUser(userId)
    Engine->>DB: Update users.leadership_level = 'SOLAR_BUILDER'
    Engine->>DB: Calculate Rank Bonus ($20.00 USDT)
    Engine->>DB: Credit users.available_balance +$20.00
    Engine->>DB: Insert earnings_ledger (LEADERSHIP_REWARD, +$20.00)
    Engine->>DB: Insert audit_logs (LEADERSHIP_PROMOTION)
    Engine->>DB: Send in-app Celebration Notification
    PromoteAPI-->>Member: 200 OK (Promoted! Bonus credited to wallet)
```

"""
