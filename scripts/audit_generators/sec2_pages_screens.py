import os

def generate_section_2():
    return """# 2. EVERY PAGE / SCREEN (ALL 61 ROUTES UNDER `app/`)

This section contains an exhaustive, screen-by-screen audit of all 61 page routes in the SolarGrid platform. Every UI element, data-fetching hook, client/server classification, form submission flow, and dead UI / redirect behavior is documented in full detail.

---

## 2.1 Public Marketing & Educational Screens

### 2.1.1 Landing / Home Page
- **Route Path:** `/` | **File Location:** `app/page.tsx`
- **Purpose:** Primary brand landing page introducing the SolarGrid clean energy infrastructure model. Features live capacity telemetry counters, solar investment plan cards (P1, P2, P3), interactive yield calculators, an interactive technology grid, and conversion call-to-actions.
- **UI Elements:**
  - *Buttons:*
    - "Explore Solar Plans" (scrolls to `#plans` section or navigates to `/plans`).
    - "Connect / Get Started" (navigates to `/signup`).
    - "Calculate Yield" (interactive slider trigger updating gross return calculations).
    - "Login to Terminal" (navigates to `/login`).
  - *Text Inputs:* Interactive slider for simulated investment amount (Min: $30, Max: $5,000, Step: $10).
  - *Cards & Stat Widgets:* 4 live grid telemetry cards (Total Capacity: 286.3 MW, Active Contributors: 11,320+, Weekday Yield Disbursed: $1.42M+, CO₂ Offset: 48,200 Tonnes).
  - *Tabs / Accordions:* Technology project selector (Sonoran, Mojave, Atacama, Bavaria).
  - *Images / Icons:* Hero solar farm background (`/images/solar-farm-hero.png`), project thumbnails (`solar-desert-park.png`, `solar-floating.png`, `solar-rooftop.png`), Lucide icons (`Sun`, `Zap`, `ShieldCheck`, `TrendingUp`, `Globe`).
- **Data Fetched:** Fetches `/api/solar/plans` on mount via `fetch()` to populate live plan pricing, capacity ratings, and daily yield rates.
- **Component Classification:** Client Component (`'use client'`).
- **Form Submission Flow:** N/A (Marketing calculator operates client-side).
- **Responsive / Mobile Behavior:** Fully responsive; grids collapse from 3 columns on desktop to 1 column on mobile (`grid-cols-1 md:grid-cols-3`).
- **Dead UI / Gaps:** Yield calculator slider reflects static formula rather than dynamic database rules.

---

### 2.1.2 About SolarGrid
- **Route Path:** `/about` | **File Location:** `app/about/page.tsx`
- **Purpose:** Details SolarGrid's corporate mission, utility-scale photovoltaic infrastructure backing, executive team, and governance principles.
- **UI Elements:**
  - *Buttons:* "View Infrastructure Projects" (navigates to `/projects`), "Join Grid Ecosystem" (navigates to `/signup`).
  - *Cards / Widgets:* Mission statement card, 3 Pillar cards (Decentralized Access, Institutional Engineering, Automated Weekday Yields).
  - *Icons:* `Shield`, `Cpu`, `Award`, `Leaf`.
- **Data Fetched:** Static content; no runtime API calls.
- **Component Classification:** Client Component (`'use client'`).
- **Responsive Behavior:** 2-column layout stacks on screens smaller than 768px.
- **Dead UI:** None.

---

### 2.1.3 Solar Plans Catalog
- **Route Path:** `/plans` | **File Location:** `app/plans/page.tsx`
- **Purpose:** Public catalog of all available solar units (P1 Starter, P2 Growth, P3 Pro). Displays pricing, capacity in kW, daily earnings in USDT, 60-day cycle terms (~43 working days), and direct link to purchase upon authentication.
- **UI Elements:**
  - *Buttons:* "Activate Unit" / "Purchase Plan" on each card (redirects authenticated users to `/dashboard/plans` or unauthenticated visitors to `/login?redirect=/dashboard/plans`).
  - *Cards:* 3 tiered glass cards for P1 ($30, 0.5 kW, $1.20/day), P2 ($60, 1.2 kW, $3.50/day), and P3 ($160, 3.5 kW, $9.30/day).
  - *Badges:* "0% Fee" badge on P1; "Commercial Array" badge on P2; "Utility Pro" badge on P3.
- **Data Fetched:** Fetches `/api/solar/plans` on mount. Falls back to static `INITIAL_PLANS` if endpoint fails.
- **Component Classification:** Client Component (`'use client'`).
- **Responsive Behavior:** Responsive flex/grid container adjusting from 1 column on mobile to 3 columns on desktop.
- **Dead UI:** None.

---

### 2.1.4 Solar Technology & Projects Showcase
- **Route Path:** `/projects` | **File Location:** `app/projects/page.tsx`
- **Purpose:** Highlights utility-scale solar farms connected to the SolarGrid matrix (Sonoran Solar Basin Alpha, Mojave Bifacial Energy Park, Atacama Horizon Complex, Bavarian Agrivoltaic Microgrid).
- **UI Elements:**
  - *Cards:* 4 project showcase cards with location, capacity in MW, operational efficiency ratings (e.g., 99.2%), weather conditions, and live irradiance.
  - *Images:* Project facility photography (`solar-desert-park.png`, `solar-farm-hero.png`, `solar-floating.png`, `solar-rooftop.png`).
- **Data Fetched:** Static project specifications.
- **Component Classification:** Client Component (`'use client'`).
- **Responsive Behavior:** 2x2 grid collapses to single column on mobile.
- **Dead UI:** None.

---

### 2.1.5 How It Works
- **Route Path:** `/how-it-works` | **File Location:** `app/how-it-works/page.tsx`
- **Purpose:** Step-by-step visual guide outlining the 4-phase user journey: 1. Account Creation & Verification, 2. Solar Unit Activation, 3. Daily Weekday Generation Operations (12:00 PM – 3:00 PM), 4. USDT Withdrawals & Referral Multipliers.
- **UI Elements:**
  - *Buttons:* "Create Free Account" (`/signup`), "Explore Hardware Units" (`/plans`).
  - *Step Indicators:* Numbered glowing badges (01, 02, 03, 04) with connecting energy flow visual lines.
- **Data Fetched:** Static instructional copy.
- **Component Classification:** Client Component (`'use client'`).
- **Responsive Behavior:** Linear vertical timeline on mobile; horizontal step grid on desktop.
- **Dead UI:** None.

---

### 2.1.6 Operating Rules & Protocol
- **Route Path:** `/rules` | **File Location:** `app/rules/page.tsx`
- **Purpose:** Official operational rulebook explaining weekday working schedule (Mon-Fri), non-operating weekends, daily settlement window, withdrawal fee schedules (0% for P1, 20% for P2/P3), and anti-fraud rules.
- **UI Elements:**
  - *Cards:* 6 section containers (Schedule & Operations, Points & Efficiency Multipliers, Withdrawal Policies, Referral Governance, Account Security, Disciplinary Action).
  - *Tables:* Comparison table mapping points ranges (70+, 61-69, 31-60, 0-30) to efficiency multipliers (100%, 80%, 50%, 10%).
- **Data Fetched:** Static protocol rules.
- **Component Classification:** Client Component (`'use client'`).
- **Responsive Behavior:** Full width responsive readable layout.
- **Dead UI:** None.

---

### 2.1.7 Contact & Inquiries
- **Route Path:** `/contact` | **File Location:** `app/contact/page.tsx`
- **Purpose:** Public contact screen with customer inquiry submission form and corporate office details.
- **UI Elements:**
  - *Inputs:* Name (`text`, required), Email (`email`, required), Subject (`text`, required), Message (`textarea`, required).
  - *Buttons:* "Submit Inquiry" (triggers simulated submission with success toast banner).
  - *Contact Cards:* Support email (`support@solargrid.io`), Telegram desk link, corporate headquarters location.
- **Data Fetched:** None. Form submission triggers a local UI state toast (does not currently write to `support_tickets` DB table; public contact is unauthenticated).
- **Component Classification:** Client Component (`'use client'`).
- **Responsive Behavior:** Split 2-column layout (Form left, Contact Info right) collapsing to 1 column on mobile.
- **Dead UI / Finding:** Form does not call an API endpoint; it sets a local React `submitted = true` state.

---

### 2.1.8 Frequently Asked Questions (FAQ)
- **Route Path:** `/faq` | **File Location:** `app/faq/page.tsx`
- **Purpose:** Categorized accordion FAQ answering common questions regarding deposit networks (USDT TRC-20), daily operation button triggers, withdrawal processing timelines, and referral commissions.
- **UI Elements:**
  - *Accordion Items:* 12 collapsible FAQ questions with smooth animated expansion.
  - *Categories:* General, Hardware Operations, Earnings & Withdrawals, Referral Program.
- **Data Fetched:** Static FAQ dataset.
- **Component Classification:** Client Component (`'use client'`).
- **Responsive Behavior:** Accordion widths scale dynamically to screen width.
- **Dead UI:** None.

---

### 2.1.9 Privacy Policy & Terms of Service
- **Route Paths:** `/privacy`, `/terms` | **File Locations:** `app/privacy/page.tsx`, `app/terms/page.tsx`
- **Purpose:** Legal agreements governing data protection, AML/KYC standards, participant liabilities, and platform terms.
- **UI Elements:** Formatted markdown legal clauses with timestamp of last revision.
- **Data Fetched:** Static legal text.
- **Component Classification:** Client Component (`'use client'`).
- **Dead UI:** None.

---

### 2.1.10 Public Redirect Stubs
- **Route Paths:** `/community`, `/leadership`, `/rewards`
- **File Locations:** `app/community/page.tsx`, `app/leadership/page.tsx`, `app/rewards/page.tsx`
- **Purpose & Analysis:** These routes are 5-line Next.js server stubs that immediately call `redirect('/plans')`.
- **Finding:** Public visitors navigating to `/community`, `/leadership`, or `/rewards` are redirected to `/plans`.

---

## 2.2 Authentication & Account Recovery Screens

### 2.2.1 User Login Screen
- **Route Path:** `/login` | **File Location:** `app/login/page.tsx`
- **Purpose:** Secure portal entry point for existing members and administrators to authenticate with email and password. Includes quick-fill demo presets for testing.
- **UI Elements:**
  - *Inputs:* Email input (`type="email"`, required), Password input (`type="password"`, required).
  - *Buttons:*
    - "Sign In to Terminal" (submits login form, disabled while `loading === true`).
    - Demo Login Pill: "Marcus Vance (Super Admin)" (prefills `marcus.vance@solargrid.io` / `adminPass123`).
    - Demo Login Pill: "Sarah Jenkins (Member)" (prefills `sarah.jenkins@solargrid.io` / `password123`).
    - "Create Account" link (`/signup`).
    - "Forgot Password?" link (`/forgot-password`).
  - *Alerts / Toasts:* Error banner rendering API failure messages (e.g., "Invalid email or password", "Too many login attempts").
- **Data Fetched / API Called:** Calls `POST /api/auth/login` on submission. On success, calls `authContext.refreshUser()` and redirects to `/admin` (if role is `SUPER_ADMIN`) or `/dashboard`.
- **Component Classification:** Client Component (`'use client'`).
- **Form Submission Flow:**
  1. Client validates email format and password presence.
  2. Dispatches `POST /api/auth/login` with `{ email, password }`.
  3. Server validates credentials against Supabase Auth / Bcrypt hash.
  4. Server issues session cookies and records `user_sessions` entry.
  5. UI receives `{ success: true, user }`, redirects user to destination.
- **Responsive Behavior:** Centered glass card (`max-w-md`) with mobile-optimized touch inputs.
- **Dead UI:** None.

---

### 2.2.2 User Registration Screen
- **Route Path:** `/signup` | **File Location:** `app/signup/page.tsx`
- **Purpose:** Onboarding screen allowing new contributors to register an account, bind to an upline referral sponsor, receive initial 70 points, and set a password.
- **UI Elements:**
  - *Inputs:*
    - Full Name (`type="text"`, required).
    - Email Address (`type="email"`, required).
    - Password (`type="password"`, required, min 6 characters).
    - Confirm Password (`type="password"`, required).
    - Referral Sponsor Code (`type="text"`, optional, auto-populated if `?ref=CODE` query parameter is present).
  - *Checkboxes:* "I agree to the Operating Rules & Terms of Service" (required).
  - *Buttons:* "Create Account & Claim 70 Points" (submits form).
  - *Alerts:* Real-time password mismatch alert; API error banner.
- **Data Fetched / API Called:** Calls `POST /api/auth/signup`.
- **Component Classification:** Client Component (`'use client'`).
- **Form Submission Flow:**
  1. Client validates password equality and terms acceptance.
  2. Dispatches `POST /api/auth/signup` with `{ name, email, password, referralCode }`.
  3. Server verifies email uniqueness and validates sponsor code against `users` table.
  4. Server provisions user record with 70 starting points and default profile.
  5. Server auto-authenticates user and redirects to `/dashboard`.
- **Responsive Behavior:** Mobile-centered container with floating labels.
- **Dead UI:** None.

---

### 2.2.3 Password Recovery Screen
- **Route Path:** `/forgot-password` | **File Location:** `app/forgot-password/page.tsx`
- **Purpose:** Password reset initiation screen allowing users to submit their registered email to receive recovery instructions.
- **UI Elements:**
  - *Inputs:* Registered Email (`type="email"`, required).
  - *Buttons:* "Send Recovery Link" (triggers password reset dispatch), "Back to Sign In" (`/login`).
  - *Alerts:* Confirmation banner upon submission.
- **Data Fetched / API Called:** Client UI submission workflow with guidance.
- **Component Classification:** Client Component (`'use client'`).
- **Responsive Behavior:** Compact mobile-first card.
- **Dead UI:** None.

---

## 2.3 Member Dashboard Screens (`app/dashboard/*`)

### 2.3.1 Primary Member Dashboard
- **Route Path:** `/dashboard` | **File Location:** `app/dashboard/page.tsx`
- **Purpose:** Core hub for logged-in members. Displays available balance, total earnings, active units overview, daily operation widget with real-time countdown to the 12:00 PM – 3:00 PM operating window, generation logs, and quick action navigation.
- **UI Elements:**
  - *Stat Cards:* Available USDT Balance (with "Recharge" and "Withdraw" quick action buttons), Total Lifetime Yield, Active Solar Capacity (kW), Clean Energy Points (with Efficiency Multiplier badge: 100%, 80%, 50%, 10%).
  - *Daily Operation Action Card:*
    - Live operating clock and status indicator ("OPERATION ACTIVE", "UPCOMING", "WEEKEND / MAINTENANCE").
    - Two-phase interactive button: "START DAILY GENERATION" (in operating window) or "RECEIVE GENERATED YIELD" (when yield is receivable).
    - Energy generation progress bar (0% to 100%).
  - *Quick Action Grid:* 4 shortcuts ("Recharge Balance", "Request Withdrawal", "Solar Fleet", "Transaction Records").
  - *Tables / Lists:* Recent Generation Logs table (Date, Unit Plan, kWh Output, Earnings USDT, Status).
  - *Alerts / Banners:* Weekend non-operating notice; unread notification indicator.
- **Data Fetched:** Calls `GET /api/dashboard/overview` on mount and after operations to update balances and logs.
- **Component Classification:** Client Component (`'use client'`).
- **Operational Action Flow:**
  1. Member clicks "START GENERATION" or "RECEIVE YIELD".
  2. Dispatches `POST /api/solar/operate` with `{ unitId, action: 'START' | 'RECEIVE' }`.
  3. Server validates operating window, updates `solar_units` and `generation_logs`, credits `earnings_ledger` and `users.available_balance`.
  4. Triggers `canvas-confetti` celebration and refreshes dashboard state.
- **Responsive Behavior:** Mobile-first layout with safe-area padding and bottom navigation dock.
- **Dead UI:** None.

---

### 2.3.2 Solar Fleet & Units Management
- **Route Path:** `/dashboard/panels` | **File Location:** `app/dashboard/panels/page.tsx`
- **Purpose:** Comprehensive solar panel inventory management screen. Lists all user-owned hardware units (P1, P2, P3), operational efficiency, working days completed/remaining, and provides upgrade triggers.
- **UI Elements:**
  - *Cards:* Solar Unit Card per active panel rendering high-resolution asset image (`panel-p1.jpg`, `panel-p2.jpg`, `panel-p3.jpg`), capacity (kW), daily yield, and days progress (`X / 43 Days`).
  - *Buttons:* "View Telemetry" (navigates to `/dashboard/panels/[id]`), "Upgrade Unit" (opens upgrade modal), "Activate New Unit" (navigates to `/dashboard/plans`).
  - *Modals / Sheets:* Upgrade Solar Unit Modal (shows current plan credit, target plan price, required top-up calculation, and confirm upgrade button).
- **Data Fetched:** Calls `GET /api/dashboard/overview` and `GET /api/solar/plans`.
- **Component Classification:** Client Component (`'use client'`).
- **Responsive Behavior:** Grid scales from 1 card on mobile to 3 cards on desktop.
- **Dead UI:** None.

---

### 2.3.3 Single Solar Unit Telemetry Deep Dive
- **Route Path:** `/dashboard/panels/[id]` | **File Location:** `app/dashboard/panels/[id]/page.tsx`
- **Purpose:** In-depth technical telemetry screen for an individual solar panel. Renders interactive 7-day and 30-day generation curves, inverter efficiency, weather conditions, lifetime generation, and operational history.
- **UI Elements:**
  - *Charts:* Recharts Area Chart displaying daily generation output (kWh) and earnings (USDT) over time.
  - *Stat Badges:* Inverter Efficiency (99.2%), Operating Temperature (32°C), Peak Irradiance (940 W/m²), Lifetime Energy (kWh).
  - *Buttons:* "Operate Unit" (redirects to `/dashboard/panel-operation`), "Upgrade Capacity" (opens upgrade modal), "Back to Fleet" (`/dashboard/panels`).
  - *Tables:* Unit Specific Generation Log table (Date, Irradiance, kWh, Yield USDT, Status).
- **Data Fetched:** Calls `GET /api/dashboard/overview` and filters by unit `id`.
- **Component Classification:** Client Component (`'use client'`).
- **Responsive Behavior:** Chart container dynamically adjusts aspect ratio on mobile viewports.
- **Dead UI:** None.

---

### 2.3.4 Dedicated Solar Daily Operation Terminal
- **Route Path:** `/dashboard/panel-operation` | **File Location:** `app/dashboard/panel-operation/page.tsx`
- **Purpose:** Focused operational cockpit dedicated to executing the two-phase weekday solar generation cycle (START -> Animated Optimization -> RECEIVE Yield).
- **UI Elements:**
  - *State Machine UI:*
    - Phase 1: Ready to Start (Glowing "START GENERATION" button with schedule reminder).
    - Phase 2: In-Progress Animation (Rotating photovoltaic matrix animation, live wattage counter).
    - Phase 3: Yield Receivable (Golden "RECEIVE YIELD" button with exact USDT amount).
    - Phase 4: Settled / Completed for Today (Green checkmark, next cycle opening countdown).
  - *Stat Meters:* Grid Irradiance Meter, Inverter Temperature, Daily Yield Accumulator.
  - *Buttons:* "START GENERATION", "RECEIVE YIELD", "Return to Dashboard" (`/dashboard`).
- **Data Fetched:** Calls `GET /api/dashboard/overview`.
- **Component Classification:** Client Component (`'use client'`).
- **End-to-End Operation Flow:**
  - Client checks current server time against schedule (12:00 PM – 3:00 PM Mon-Fri).
  - Calls `POST /api/solar/operate` with `{ unitId, action: 'START' }` -> DB marks `is_receivable = true`.
  - Calls `POST /api/solar/operate` with `{ unitId, action: 'RECEIVE' }` -> DB atomic credit to `available_balance` and `earnings_ledger`.
- **Responsive Behavior:** Tactile mobile-optimized touch controls.
- **Dead UI:** None.

---

### 2.3.5 In-Dashboard Solar Plans Investment Catalog
- **Route Path:** `/dashboard/plans` | **File Location:** `app/dashboard/plans/page.tsx`
- **Purpose:** Member investment catalog allowing authenticated users to purchase additional solar capacity units (P1, P2, P3) directly using their available wallet balance.
- **UI Elements:**
  - *Cards:* P1 ($30), P2 ($60), P3 ($160) plan cards with image preview, capacity, daily earnings, and gross 60-day yield.
  - *Modals:* Purchase Confirmation Modal displaying unit cost, current available balance, post-purchase balance, and "Confirm Activation" button.
  - *Buttons:* "Purchase Plan", "Recharge Balance" (if balance is insufficient).
  - *Alerts:* Low balance warning with direct link to `/dashboard/recharge`.
- **Data Fetched:** Calls `GET /api/solar/plans` and `GET /api/dashboard/overview`.
- **Component Classification:** Client Component (`'use client'`).
- **Purchase Flow:**
  1. User selects plan and clicks "Purchase".
  2. Client confirms balance >= plan price.
  3. Dispatches `POST /api/solar/purchase` with `{ planCode: 'P1' | 'P2' | 'P3' }`.
  4. Server debits balance, inserts `solar_units` and `earnings_ledger` records.
  5. UI displays success toast and redirects to `/dashboard/panels`.
- **Responsive Behavior:** Grid adjusts from 1 to 3 columns.
- **Dead UI:** None.

---

### 2.3.6 Active Hardware Units List
- **Route Path:** `/dashboard/units` | **File Location:** `app/dashboard/units/page.tsx`
- **Purpose:** Alternative fleet view listing active, expired, and upgraded solar units with lifecycle progress bars and upgrade triggers.
- **UI Elements:**
  - *Cards / Rows:* Unit rows detailing Plan Name, Location, Purchase Date, Working Days Completed (`X / 43`), and Total Earned.
  - *Buttons:* "Operate Now", "Upgrade Plan", "Explore New Units" (`/dashboard/plans`).
- **Data Fetched:** Calls `GET /api/dashboard/overview`.
- **Component Classification:** Client Component (`'use client'`).
- **Responsive Behavior:** Responsive cards on mobile, table layout on desktop.
- **Dead UI:** None.

---

### 2.3.7 Financial Earnings Breakdown
- **Route Path:** `/dashboard/earnings` | **File Location:** `app/dashboard/earnings/page.tsx`
- **Purpose:** Detailed income analytics screen breaking down earnings across 4 revenue streams: 1. Daily Solar Generation, 2. Level 1 Direct Commissions (10%), 3. Level 2 Team Commissions (5%), 4. Level 3 Network Commissions (2%), and Leadership Rank Bonuses.
- **UI Elements:**
  - *Summary Cards:* Total Earned USDT, Generation Yield USDT, Total Referral Commissions USDT, Rank Bonus USDT.
  - *Category Tabs:* "All Transactions", "Daily Generation", "Referral Rewards", "Leadership Bonuses".
  - *Tables:* Income Ledger Table (Date, Transaction Type Badge, Source Member, Amount USDT, Running Balance).
  - *Buttons:* "Export CSV" (downloads filtered earnings records).
- **Data Fetched:** Calls `GET /api/dashboard/overview`.
- **Component Classification:** Client Component (`'use client'`).
- **Responsive Behavior:** Horizontal scrollable glass table on mobile.
- **Dead UI:** None.

---

### 2.3.8 Wallet Recharge & Crypto Deposit
- **Route Path:** `/dashboard/recharge` | **File Location:** `app/dashboard/recharge/page.tsx`
- **Purpose:** Deposit screen allowing members to recharge their USDT wallet balance via cryptocurrency transfer (USDT TRC-20, BEP-20, ERC-20). Generates deposit QR codes, instructions, and provides a proof-of-payment submission form.
- **UI Elements:**
  - *Network Selector Dropdown / Pills:* `USDT-TRC20` (Recommended, Fast), `USDT-BEP20`, `USDT-ERC20`.
  - *QR Code Widget:* `QRCodeSVG` rendering platform destination wallet address (`TYDzsYUbTmNuWw8m5Y3vX99Y8T7s1KLa2v`).
  - *Copy Buttons:* "Copy Address" with tactile copy-to-clipboard toast.
  - *Form Inputs:*
    - Deposit Amount (`type="number"`, min 10 USDT, required).
    - Blockchain Transaction Hash / Reference (`type="text"`, required, min 8 characters).
    - Screenshot Proof Image URL (`type="text"`, optional).
  - *Buttons:* "Submit Recharge for Verification" (submits form).
  - *Alerts:* Minimum deposit notice (10 USDT); unconfirmed transaction warning.
- **Data Fetched / API Called:** Calls `POST /api/recharge/submit` on submission; calls `GET /api/recharge/list` to show recent deposit requests below form.
- **Component Classification:** Client Component (`'use client'`).
- **Deposit Submission Flow:**
  1. User transfers USDT on chosen blockchain network to platform address.
  2. User inputs deposit amount and TX Hash.
  3. Client validates fields and calls `POST /api/recharge/submit`.
  4. Server validates payload with Zod, inserts `recharge_requests` record with `status: 'PENDING'`.
  5. UI renders confirmation banner and lists request in history table.
- **Responsive Behavior:** Stacked single-column on mobile.
- **Dead UI:** None.

---

### 2.3.9 Withdrawal Request Terminal
- **Route Path:** `/dashboard/withdrawal` (and legacy alias `/dashboard/withdrawals`)
- **File Locations:** `app/dashboard/withdrawal/page.tsx`, `app/dashboard/withdrawals/page.tsx`
- **Purpose:** Financial withdrawal screen allowing members to withdraw available USDT to their personal external crypto wallet. Enforces plan-specific fee calculations (0% for P1, 20% for P2/P3), minimum thresholds (10 USDT), and requires 6-digit transaction PIN verification.
- **UI Elements:**
  - *Fee & Payout Preview Card:* Gross Amount, Fee Percent (0% or 20%), Fee Deduction USDT, Net Payout Amount USDT.
  - *Form Inputs:*
    - Withdrawal Amount (`type="number"`, min 10 USDT, required).
    - Destination Wallet Address (`type="text"`, required, prefilled from profile if bound).
    - Network Selector (`USDT-TRC20`, `USDT-BEP20`, `USDT-ERC20`).
    - 6-Digit Transaction PIN (`type="password"`, required, 4-8 digits).
  - *Buttons:* "Submit Withdrawal Request" (disabled if insufficient balance or missing PIN).
  - *Alerts:* Low balance alert, Lockout warning if incorrect PIN entered repeatedly.
  - *History Table:* Recent withdrawal requests (Date, Gross USDT, Fee, Net USDT, Destination, Status Badge).
- **Data Fetched / API Called:** Calls `GET /api/dashboard/overview`, `GET /api/withdrawals/request`, and `POST /api/withdrawals/request`.
- **Component Classification:** Client Component (`'use client'`).
- **End-to-End Withdrawal Flow:**
  1. User specifies amount, destination wallet, and enters transaction PIN.
  2. Dispatches `POST /api/withdrawals/request` with `{ amountUsdt, walletAddress, network, transactionPin }`.
  3. Server rate limits IP, validates session, checks user balance >= amount.
  4. Server verifies PIN against bcrypt hash with 5-attempt lockout enforcement.
  5. Server debits `available_balance`, inserts `withdrawal_requests` (`status: 'PENDING'`), and writes debit entry to `earnings_ledger`.
  6. UI renders success notification and updates available balance.
- **Responsive Behavior:** Mobile-first vertical form.
- **Dead UI:** None.

---

### 2.3.10 Unified Transaction Records Center
- **Route Path:** `/dashboard/records` | **File Location:** `app/dashboard/records/page.tsx`
- **Purpose:** Comprehensive financial and operational audit center consolidating all user transactions across 10 category tabs, with real-time text search, date filtering, and CSV export.
- **UI Elements:**
  - *Category Tabs (10):* "All Records", "Solar Generation", "Recharges", "Withdrawals", "Plan Purchases", "Plan Upgrades", "L1 Commissions", "L2 Commissions", "L3 Commissions", "Points Ledger".
  - *Search Input:* Real-time filter query (`type="text"`).
  - *Buttons:* "Export CSV" (generates and triggers download of filtered dataset).
  - *Table:* Master Records Table (Timestamp, Category Badge, Reference ID, Amount / Delta, Balance After, Description).
- **Data Fetched:** Calls `GET /api/dashboard/overview` and parses aggregated records.
- **Component Classification:** Client Component (`'use client'`).
- **Responsive Behavior:** Horizontal scrollable table container.
- **Dead UI:** None.

---

### 2.3.11 Sub-Records Dedicated Pages
- **Route Paths & Files:**
  - `/dashboard/records/recharge` (`app/dashboard/records/recharge/page.tsx`) — Dedicated recharge history table with status badges and TX hash inspector.
  - `/dashboard/records/withdrawals` (`app/dashboard/records/withdrawals/page.tsx`) — Dedicated withdrawal history table with fee breakdown and status tracking.
  - `/dashboard/records/purchases` (`app/dashboard/records/purchases/page.tsx`) — Dedicated hardware purchase and upgrade history ledger.
- **Purpose:** Dedicated deep-linkable transaction logs for specific financial operations.
- **Data Fetched:** Calls `GET /api/recharge/list`, `GET /api/withdrawals/request`, and `GET /api/dashboard/overview`.
- **Component Classification:** Client Components (`'use client'`).
- **Dead UI:** None.

---

### 2.3.12 Notification Center
- **Route Path:** `/dashboard/notifications` | **File Location:** `app/dashboard/notifications/page.tsx`
- **Purpose:** In-app notification center displaying transactional alerts, daily yield credit confirmations, referral override notices, and administrative broadcasts.
- **UI Elements:**
  - *Category Filter Tabs:* "All", "Solar & Earnings", "Referrals & Team", "Security & System".
  - *Buttons:* "Mark All as Read", "Clear Notifications", individual notification action link ("View Details").
  - *List:* Interactive notification cards with unread glowing indicator and timestamps.
- **Data Fetched:** Calls `GET /api/dashboard/overview`.
- **Component Classification:** Client Component (`'use client'`).
- **Responsive Behavior:** Full-width mobile responsive list.
- **Dead UI:** None.

---

### 2.3.13 User Profile & Account Settings
- **Route Path:** `/dashboard/profile` | **File Location:** `app/dashboard/profile/page.tsx`
- **Purpose:** User account configuration center for updating personal details, managing 2FA preferences, viewing active sessions, and updating login passwords.
- **UI Elements:**
  - *Forms / Inputs:* Name (`text`), Phone (`text`), Country (`text`), Telegram Handle (`text`), Bio (`textarea`).
  - *Toggles:* Two-Factor Authentication toggle, Email Notifications toggle, Push Notifications toggle.
  - *Modals:* Change Password Modal (Current Password, New Password, Confirm New Password).
  - *Buttons:* "Save Profile Changes", "Change Password", "Configure Security Wallet" (navigates to `/dashboard/profile/wallet`).
  - *Active Sessions Table:* Lists current device, IP address, browser, login time, and "Revoke" button.
- **Data Fetched / API Called:** Calls `GET /api/auth/me`, `PATCH /api/auth/me`, `POST /api/auth/password`, and `GET /api/auth/sessions`.
- **Component Classification:** Client Component (`'use client'`).
- **Responsive Behavior:** Tabbed mobile interface.
- **Dead UI:** None.

---

### 2.3.14 Secure Wallet Configuration
- **Route Path:** `/dashboard/profile/wallet` | **File Location:** `app/dashboard/profile/wallet/page.tsx`
- **Purpose:** High-security wallet binding screen. Requires verification of the user's 6-digit transaction PIN before updating or locking the recipient USDT payout address.
- **UI Elements:**
  - *Inputs:*
    - USDT Destination Address (`type="text"`, required).
    - Network Selector (`USDT-TRC20`, `USDT-BEP20`, `USDT-ERC20`).
    - 6-Digit Transaction PIN (`type="password"`, required, 4-8 numeric digits).
  - *Buttons:* "Bind & Secure Wallet Address" (submits update).
  - *Alerts:* "Wallet address is locked for withdrawals once bound. Ensure TRC-20 address accuracy."
- **Data Fetched / API Called:** Calls `POST /api/auth/transaction-password` and `PATCH /api/auth/me`.
- **Component Classification:** Client Component (`'use client'`).
- **Security Flow:** Client submits address change alongside transaction PIN; server verifies PIN hash before modifying `profiles.wallet_address`.
- **Responsive Behavior:** Centered glass card.
- **Dead UI:** None.

---

### 2.3.15 Member Customer Support Desk
- **Route Path:** `/dashboard/support` | **File Location:** `app/dashboard/support/page.tsx`
- **Purpose:** Interactive customer support hub allowing members to open support tickets, select category/priority, and participate in message threads with support staff.
- **UI Elements:**
  - *Buttons:* "Open New Support Ticket", "Send Message" (inside active thread), "Refresh Tickets".
  - *Modals:* Create Ticket Modal (Subject input, Category dropdown: Billing, Solar Panel, Withdrawal, Recharge, MLM, Technical; Priority dropdown: Low, Medium, High, Urgent; Initial Message textarea).
  - *Thread View:* Real-time message bubbles differentiating User messages (right, gold) and Support Admin responses (left, slate).
- **Data Fetched / API Called:** Calls `GET /api/support/tickets` and `POST /api/support/tickets`.
- **Component Classification:** Client Component (`'use client'`).
- **Responsive Behavior:** Split-pane layout (Ticket List on left, Chat on right) transitioning to single pane on mobile.
- **Dead UI:** None.

---

### 2.3.16 Member Dashboard Redirect Stubs
- **Route Paths & Files:**
  - `/dashboard/invite` (`app/dashboard/invite/page.tsx`) -> `redirect('/dashboard')`
  - `/dashboard/network` (`app/dashboard/network/page.tsx`) -> `redirect('/dashboard')`
  - `/dashboard/team` (`app/dashboard/team/page.tsx`) -> `redirect('/dashboard')`
  - `/dashboard/referrals` (`app/dashboard/referrals/page.tsx`) -> `redirect('/dashboard')`
  - `/dashboard/points` (`app/dashboard/points/page.tsx`) -> `redirect('/dashboard')`
  - `/dashboard/rewards` (`app/dashboard/rewards/page.tsx`) -> `redirect('/dashboard')`
  - `/dashboard/leadership` (`app/dashboard/leadership/page.tsx`) -> `redirect('/dashboard')`
- **Finding:** In the current build, these 7 sub-routes are redirect stubs pointing back to `/dashboard`. Any navigation to these URLs automatically redirects to the main dashboard.

---

## 2.4 Super Admin Console Screens (`app/admin/*`)

### 2.4.1 Executive Admin Dashboard
- **Route Path:** `/admin` | **File Location:** `app/admin/page.tsx`
- **Purpose:** Primary administrative mission control. Displays platform-wide key performance indicators (Total Users, Total Solar Units, Total Revenue USDT, Pending Recharges, Pending Withdrawals, Total Energy Generated MWh), global cross-entity search bar, system health status, and quick action shortcuts.
- **UI Elements:**
  - *KPI Cards:* 6 glass stat cards with percentage growth indicators.
  - *Global Search Bar:* Universal search input triggering `GET /api/admin/search?q=...` across users, recharges, and withdrawals.
  - *Action Shortcuts:* "Review Recharges" (`/admin/recharges`), "Process Withdrawals" (`/admin/withdrawals`), "Manage Users" (`/admin/users`), "Broadcast Alert" (`/admin/broadcasts`).
  - *Recent Activity Feed:* Latest administrative audit logs and financial events.
- **Data Fetched:** Calls `GET /api/admin/stats` on mount.
- **Component Classification:** Client Component (`'use client'`).
- **Responsive Behavior:** 4-column KPI grid collapsing to 1 column on mobile.
- **Dead UI:** None.

---

### 2.4.2 Administrative Analytics & Financial Reports
- **Route Path:** `/admin/analytics` | **File Location:** `app/admin/analytics/page.tsx`
- **Purpose:** Business intelligence reporting interface visualizing platform revenue trends, weekday solar energy output curves, downline commission distribution, and user acquisition cohorts.
- **UI Elements:**
  - *Charts:* Recharts Bar and Line Charts (Monthly Revenue, Energy Generation MWh, Daily Operating Users).
  - *Summary Cards:* Platform Net Margin, Reserve Capital Ratio, Active Investor Retention Rate.
- **Data Fetched:** Calls `GET /api/admin/stats`.
- **Component Classification:** Client Component (`'use client'`).
- **Responsive Behavior:** Dynamically sizing responsive chart containers.
- **Dead UI:** None.

---

### 2.4.3 360° User Management Desk
- **Route Path:** `/admin/users` | **File Location:** `app/admin/users/page.tsx`
- **Purpose:** Administrative user management console. Lists all platform contributors, allows searching/filtering by status/role, toggling account statuses (ACTIVE, SUSPENDED, BANNED), promoting roles, adjusting wallet balances, and modifying clean energy points with mandatory audit reasons.
- **UI Elements:**
  - *Filter Controls:* Role filter dropdown (`ALL`, `USER`, `SUPER_ADMIN`), Status filter dropdown (`ALL`, `ACTIVE`, `SUSPENDED`, `BANNED`), Search input.
  - *Table Columns:* User Name & Email, Role Badge, Status Badge, Referral Code, Sponsor ID, Points, Available Balance USDT, Total Earned USDT, Joined Date, Actions.
  - *Modals:*
    - Modify Balance Modal (Amount delta input, Type: Credit/Debit, Mandatory Reason).
    - Modify Points Modal (Points delta input, Mandatory Reason).
    - Status Change Confirmation Dialog.
  - *Buttons:* "Edit User", "Adjust Points", "Adjust Balance", "View Deep Profile" (navigates to `/admin/users/[id]`).
- **Data Fetched / API Called:** Calls `GET /api/admin/users`, `POST /api/admin/users`, and `POST /api/points/adjust`.
- **Component Classification:** Client Component (`'use client'`).
- **Responsive Behavior:** Horizontal scrolling table with pinned action column.
- **Dead UI:** None.

---

### 2.4.4 User Deep Dive Profile Audit
- **Route Path:** `/admin/users/[id]` | **File Location:** `app/admin/users/[id]/page.tsx`
- **Purpose:** Comprehensive 360-degree audit screen for a single user account. Displays personal profile, direct referral tree, active solar units, full financial ledger history, security sessions, and support ticket history.
- **UI Elements:**
  - *Header Card:* Avatar, Name, Email, Role badge, Status badge, Join Date, Sponsor name.
  - *Tabs (5):* "Overview & Balances", "Solar Fleet Units", "Referral Downline", "Financial Ledger", "Active Sessions & Security".
  - *Action Buttons:* "Suspend Account", "Reset Password", "Adjust Balance", "Back to Users List" (`/admin/users`).
- **Data Fetched:** Calls `GET /api/admin/users?id=...`.
- **Component Classification:** Client Component (`'use client'`).
- **Responsive Behavior:** Tabbed mobile layout.
- **Dead UI:** None.

---

### 2.4.5 Solar Plan Management & Pricing Editor
- **Route Path:** `/admin/plans` | **File Location:** `app/admin/plans/page.tsx`
- **Purpose:** Administrative configuration screen for solar plans (P1, P2, P3). Allows editing plan price (USDT), daily yield (USDT), validity period (days), working days total, withdrawal fee percentage (0-100%), and status (ACTIVE/DISABLED).
- **UI Elements:**
  - *Plan Cards / Forms:* Interactive form per plan (P1 Starter, P2 Growth, P3 Pro) with editable inputs for Price, Daily Yield, Capacity kW, Withdrawal Fee %, Image URL, and Status selector.
  - *Buttons:* "Save Plan Changes", "Create New Plan", "Preview Plan Card".
  - *Alerts:* Success toast upon plan update.
- **Data Fetched / API Called:** Calls `GET /api/solar/plans` and `POST /api/solar/plans`.
- **Component Classification:** Client Component (`'use client'`).
- **Responsive Behavior:** 3-column card grid collapsing on mobile.
- **Dead UI:** None.

---

### 2.4.6 Global Solar Hardware Fleet Monitor
- **Route Path:** `/admin/units` | **File Location:** `app/admin/units/page.tsx`
- **Purpose:** Fleet monitoring desk displaying all user-owned solar units across the platform, operational statuses, working days completed, total energy generated, and project location breakdown.
- **UI Elements:**
  - *Table:* All Solar Units Table (Unit ID, Owner Name/Email, Plan Code, Capacity kW, Working Days `X/43`, Total Earned USDT, Status Badge, Activation Date).
  - *Filters:* Status filter (`ALL`, `ACTIVE`, `PAUSED`, `EXPIRED`, `UPGRADED`).
- **Data Fetched:** Calls `GET /api/admin/units`.
- **Component Classification:** Client Component (`'use client'`).
- **Responsive Behavior:** Responsive table.
- **Dead UI:** None.

---

### 2.4.7 Panel Visual Asset Manager
- **Route Path:** `/admin/panel-images` | **File Location:** `app/admin/panel-images/page.tsx`
- **Purpose:** Asset management desk allowing administrators to inspect, update, and preview marketing image URLs and captions assigned to each solar plan tier.
- **UI Elements:**
  - *Asset Cards:* Image preview card per plan code (`P1`, `P2`, `P3`) with Image URL input and Caption input.
  - *Buttons:* "Update Asset", "Reset to Default Image", "Test Image URL".
- **Data Fetched / API Called:** Calls `GET /api/admin/panel-images` and `POST /api/admin/panel-images`.
- **Component Classification:** Client Component (`'use client'`).
- **Responsive Behavior:** 3-column responsive card layout.
- **Dead UI:** None.

---

### 2.4.8 Financial Recharge Approval Desk
- **Route Path:** `/admin/recharges` | **File Location:** `app/admin/recharges/page.tsx`
- **Purpose:** Critical financial management desk where administrators inspect pending user crypto deposits, verify blockchain transaction hashes, inspect payment proofs, and approve (with automatic balance credit) or reject requests.
- **UI Elements:**
  - *Queue Filter Tabs:* "Pending Review" (with counter badge), "Approved", "Rejected", "All Recharges".
  - *Table Columns:* Recharge ID, User Name & Email, Amount USDT, Network (`USDT-TRC20`), TX Hash (with external explorer link), Submission Date, Status Badge, Actions.
  - *Modals:*
    - Approve Deposit Modal (displays amount, confirms balance credit, optional reviewer notes).
    - Reject Deposit Modal (mandatory rejection reason input).
    - Proof Image Viewer Modal (expands uploaded receipt screenshot).
  - *Buttons:* "Approve & Credit Balance" (green), "Reject Request" (red), "Copy TX Hash".
- **Data Fetched / API Called:** Calls `GET /api/admin/recharges` and `POST /api/admin/recharges`.
- **Component Classification:** Client Component (`'use client'`).
- **Approval Flow:**
  1. Admin verifies TX hash on blockchain explorer.
  2. Admin clicks "Approve".
  3. Dispatches `POST /api/admin/recharges` with `{ rechargeId, action: 'APPROVE', adminNotes }`.
  4. Server credits user's `available_balance`, writes CREDIT entry to `earnings_ledger`, updates recharge status to `APPROVED`.
  5. UI updates table and sends in-app notification to member.
- **Responsive Behavior:** Mobile-responsive table.
- **Dead UI:** None.

---

### 2.4.9 Financial Withdrawal Queue & Processing Desk
- **Route Path:** `/admin/withdrawals` | **File Location:** `app/admin/withdrawals/page.tsx`
- **Purpose:** Critical financial management desk for reviewing, approving, completing (recording blockchain TX hash), and rejecting user withdrawal requests.
- **UI Elements:**
  - *Queue Tabs:* "Pending Approvals", "In Processing", "Completed", "Rejected".
  - *Table Columns:* Withdrawal ID, User Name/Email, Gross Amount USDT, Fee USDT, Net Payout USDT, Destination Address, Network, Status Badge, Actions.
  - *Modals:*
    - Approve Modal (advances status from `PENDING` to `APPROVED`).
    - Complete Modal (prompts for Blockchain Payout TX Hash, advances status to `COMPLETED`).
    - Reject Modal (prompts for Rejection Reason, advances status to `REJECTED`, and automatically refunds gross amount to user balance).
  - *Buttons:* "Approve", "Process", "Complete", "Reject & Refund".
- **Data Fetched / API Called:** Calls `GET /api/admin/withdrawals` and `POST /api/withdrawals/process`.
- **Component Classification:** Client Component (`'use client'`).
- **Rejection & Refund Flow:**
  1. Admin selects "Reject" on pending withdrawal.
  2. Server verifies withdrawal has not already been rejected or completed.
  3. Server refunds gross amount to user's `available_balance`, writes CREDIT entry to `earnings_ledger` (`sourceEvent: 'WITHDRAWAL_REJECTED'`).
  4. Server updates status to `REJECTED` and records rejection reason.
- **Responsive Behavior:** Responsive table.
- **Dead UI:** None.

---

### 2.4.10 Global Financial Ledger Audit Desk
- **Route Path:** `/admin/ledger` | **File Location:** `app/admin/ledger/page.tsx`
- **Purpose:** Immutable platform-wide financial audit desk displaying every balance credit and debit across all users. Supports multi-type filtering, text search, date range selection, and CSV download.
- **UI Elements:**
  - *Filter Bar:* Type filter (`ALL`, `DAILY_SOLAR_EARNING`, `L1_REFERRAL_REWARD`, `L2_REFERRAL_REWARD`, `L3_REFERRAL_REWARD`, `RECHARGE`, `WITHDRAWAL`, `PLAN_PURCHASE`, `PLAN_UPGRADE`, `ADJUSTMENT`), Direction filter (`CREDIT`, `DEBIT`), Search input.
  - *Table Columns:* Transaction ID, Timestamp, User Name & Email, Transaction Type Badge, Direction (`+CREDIT` / `-DEBIT`), Amount USDT, Balance Before, Balance After, Reference ID, Description.
  - *Buttons:* "Export Master CSV" (generates complete ledger export).
- **Data Fetched:** Calls `GET /api/admin/ledger`.
- **Component Classification:** Client Component (`'use client'`).
- **Responsive Behavior:** Horizontal scrolling table.
- **Dead UI:** None.

---

### 2.4.11 Active Sessions & Device Security Center
- **Route Path:** `/admin/security/sessions` | **File Location:** `app/admin/security/sessions/page.tsx`
- **Purpose:** Device anomaly and session monitoring center. Displays active authenticated sessions, IP addresses, operating systems, browsers, risk scores (LOW, MEDIUM, HIGH), and enables forced session revocation.
- **UI Elements:**
  - *Summary Cards:* Total Active Sessions, High Risk Logins, Unique IP Count.
  - *Table:* Sessions Table (User Name/Email, IP Address, Device Type, OS & Browser, Login Time, Last Activity, Risk Badge, Status Badge, Actions).
  - *Buttons:* "Revoke Session" (terminates session), "Revoke All User Sessions", "Refresh Sessions".
- **Data Fetched / API Called:** Calls `GET /api/auth/sessions` and `POST /api/auth/sessions`.
- **Component Classification:** Client Component (`'use client'`).
- **Responsive Behavior:** Responsive table.
- **Dead UI:** None.

---

### 2.4.12 System Broadcast Dispatcher
- **Route Path:** `/admin/broadcasts` | **File Location:** `app/admin/broadcasts/page.tsx`
- **Purpose:** Communications center allowing administrators to compose and broadcast real-time announcements to all users or specific segments (e.g., Active Plan Holders, Leaders).
- **UI Elements:**
  - *Form Inputs:* Announcement Title (`type="text"`, required), Message Body (`textarea`, required), Target Audience selector (`ALL_USERS`, `ACTIVE_PLAN_HOLDERS`, `LEADERS_ONLY`).
  - *Buttons:* "Dispatch System Broadcast" (sends notification to matching users).
  - *History Table:* Past broadcast dispatches (Date, Title, Target Audience, Recipient Count, Dispatcher Admin).
- **Data Fetched / API Called:** Calls `POST /api/admin/broadcast`.
- **Component Classification:** Client Component (`'use client'`).
- **Responsive Behavior:** Stacked form and history table.
- **Dead UI:** None.

---

### 2.4.13 Administrative Support Ticketing Desk
- **Route Path:** `/admin/support` | **File Location:** `app/admin/support/page.tsx`
- **Purpose:** Central ticketing desk for reviewing and resolving customer support inquiries submitted by members.
- **UI Elements:**
  - *Queue Filters:* "Open Tickets", "In Progress", "Resolved", "All Tickets".
  - *Split-Pane View:* Ticket list on left; active conversation thread, user profile snippet, status dropdown, and response composer on right.
  - *Buttons:* "Reply to User", "Mark as Resolved", "Close Ticket".
- **Data Fetched / API Called:** Calls `GET /api/support/tickets` and `POST /api/support/tickets`.
- **Component Classification:** Client Component (`'use client'`).
- **Responsive Behavior:** Full split-pane responsive view.
- **Dead UI:** None.

---

### 2.4.14 Security Audit Trail
- **Route Path:** `/admin/audit` | **File Location:** `app/admin/audit/page.tsx`
- **Purpose:** Immutable audit trail logging all administrative actions, targets, old/new states, actor IP addresses, and timestamps.
- **UI Elements:**
  - *Table:* Audit Trail Table (Timestamp, Administrator Email, Action Type Badge, Target Entity, Target ID, Details JSON, IP Address).
  - *Search Input:* Filter by admin name, action, or target.
- **Data Fetched:** Calls `GET /api/admin/stats` and parses audit logs.
- **Component Classification:** Client Component (`'use client'`).
- **Responsive Behavior:** Responsive table.
- **Dead UI:** None.

---

### 2.4.15 System Dynamic Business Rules Editor
- **Route Path:** `/admin/settings` | **File Location:** `app/admin/settings/page.tsx`
- **Purpose:** System parameter configuration center for viewing and modifying business constants (Starting points, Working days per cycle, L1/L2/L3 commission percentages, Minimum withdrawal limit).
- **UI Elements:**
  - *Rule Cards / Inputs:* Numeric inputs for each system rule key (`STARTING_POINTS`, `MINIMUM_WITHDRAWAL_USDT`, `COMMISSION_L1_PERCENT`, `COMMISSION_L2_PERCENT`, `COMMISSION_L3_PERCENT`, `WORKING_DAYS_PER_CYCLE`).
  - *Buttons:* "Save Rule Changes" (triggers `POST /api/admin/rules`), "Reset to Defaults".
- **Data Fetched / API Called:** Calls `GET /api/admin/rules` and `POST /api/admin/rules`.
- **Component Classification:** Client Component (`'use client'`).
- **Responsive Behavior:** Responsive grid layout.
- **Dead UI:** None.

---

### 2.4.16 Super Admin Console Redirect Stubs
- **Route Paths & Files:**
  - `/admin/leadership` (`app/admin/leadership/page.tsx`) -> `redirect('/admin/plans')`
  - `/admin/mlm` (`app/admin/mlm/page.tsx`) -> `redirect('/admin/plans')`
  - `/admin/network` (`app/admin/network/page.tsx`) -> `redirect('/admin/users')`
  - `/admin/points` (`app/admin/points/page.tsx`) -> `redirect('/admin/settings')`
  - `/admin/rewards` (`app/admin/rewards/page.tsx`) -> `redirect('/admin/plans')`
- **Finding:** In the current build, these 5 administrative sub-routes are redirect stubs pointing to sibling admin pages.

"""
