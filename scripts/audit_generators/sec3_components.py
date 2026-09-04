def generate_section_3():
    return """# 3. EVERY REUSABLE COMPONENT (`components/*`)

This section documents all 15 reusable UI and layout components across `components/glass/`, `components/motion/`, and `components/ui/`.

---

## 3.1 Glass Design System Components (`components/glass/*`)

### 3.1.1 `GlassBadge` (`components/glass/glass-badge.tsx`)
- **Props Interface:**
  ```typescript
  interface GlassBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'gold' | 'amber' | 'blue' | 'emerald' | 'slate' | 'rose';
    size?: 'sm' | 'md' | 'lg';
    pulse?: boolean;
    children: React.ReactNode;
  }
  ```
- **Default Props:** `variant = 'gold'`, `size = 'md'`, `pulse = false`.
- **Variants:**
  - `gold`: `bg-solar-gold/10 text-solar-gold border-solar-gold/30`
  - `amber`: `bg-solar-amber/10 text-solar-amber border-solar-amber/30`
  - `blue`: `bg-solar-blue/10 text-solar-blue border-solar-blue/30`
  - `emerald`: `bg-emerald-500/10 text-emerald-400 border-emerald-500/30`
  - `slate`: `bg-slate-500/10 text-slate-400 border-slate-500/30`
  - `rose`: `bg-rose-500/10 text-rose-400 border-rose-500/30`
- **Consuming Locations:** Used across `app/admin/layout.tsx`, `app/admin/users/page.tsx`, `app/admin/recharges/page.tsx`, `app/admin/withdrawals/page.tsx`, `app/dashboard/page.tsx`, `app/dashboard/panels/page.tsx`, `app/dashboard/earnings/page.tsx`, `app/dashboard/records/page.tsx`.
- **Accessibility:** Missing explicit `role="status"` or `aria-label` when used as an icon-only pulse indicator.
- **Styling Approach:** Tailwind CSS classes with translucent backgrounds and border glow utility classes.

---

### 3.1.2 `GlassBottomBar` (`components/glass/glass-bottom-bar.tsx`)
- **Props Interface:** None (reads `usePathname()` internally).
- **Consuming Locations:** `app/dashboard/layout.tsx`.
- **Items Rendered:** 5 core navigation tabs:
  1. Home / Overview (`/dashboard`, icon: `LayoutDashboard`)
  2. Solar Fleet (`/dashboard/panels`, icon: `Sun`)
  3. Operation Cockpit (`/dashboard/panel-operation`, icon: `Zap` with gold pulse ring)
  4. Wallet / Records (`/dashboard/records`, icon: `FileText`)
  5. Profile (`/dashboard/profile`, icon: `User`)
- **Accessibility:** Includes `aria-label` on navigation items. High-contrast active tab state (`text-solar-gold font-bold`).
- **Styling Approach:** Fixed bottom dock (`fixed bottom-0 left-0 right-0 z-40`), `backdrop-filter: blur(24px)`, safe-area inset bottom padding (`pb-[env(safe-area-inset-bottom)]`).

---

### 3.1.3 `GlassButton` (`components/glass/glass-button.tsx`)
- **Props Interface:**
  ```typescript
  interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'gold' | 'blue' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
  }
  ```
- **Default Props:** `variant = 'primary'`, `size = 'md'`, `isLoading = false`.
- **Consuming Locations:** Consumed globally across all dashboard, admin, and marketing pages.
- **Accessibility:** Supports native button attributes (`disabled`, `type`, `aria-busy` when loading). Keyboard focusable with `focus:ring-2 focus:ring-solar-gold`.
- **Styling Approach:** Tactile gradients (`linear-gradient(135deg, #FFC83D, #FF9F1C)`), hover translateY transform (`-1px`), and active scale down (`scale-98`).

---

### 3.1.4 `GlassCard` (`components/glass/glass-card.tsx`)
- **Props Interface:**
  ```typescript
  interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'gold' | 'blue' | 'elevated' | 'sunken';
    hoverEffect?: boolean;
    glow?: boolean;
  }
  ```
- **Default Props:** `variant = 'default'`, `hoverEffect = false`, `glow = false`.
- **Consuming Locations:** Primary surface container for all cards, widgets, and stat boxes across the application.
- **Accessibility:** Semantic HTML container.
- **Styling Approach:** Multi-layer glass elevation system (`glass-1`, `glass-2`, `glass-3`) with backdrop blur (`16px` - `28px`).

---

### 3.1.5 `GlassChartContainer` (`components/glass/glass-chart-container.tsx`)
- **Props Interface:**
  ```typescript
  interface GlassChartContainerProps {
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
  }
  ```
- **Consuming Locations:** `app/dashboard/panels/[id]/page.tsx`, `app/admin/analytics/page.tsx`.
- **Accessibility:** Structured heading container (`<h3>` title, `<p>` subtitle).
- **Styling Approach:** `ResponsiveContainer` wrapper with translucent glass header and backdrop blur.

---

### 3.1.6 `GlassInput` (`components/glass/glass-input.tsx`)
- **Props Interface:**
  ```typescript
  interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hint?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
  }
  ```
- **Consuming Locations:** Used across all forms in `/login`, `/signup`, `/dashboard/recharge`, `/dashboard/withdrawal`, `/dashboard/profile`, `/admin/users`, `/admin/recharges`, `/admin/settings`.
- **Accessibility:** Associates `<label>` with `<input>` via generated ID. Renders `aria-invalid={Boolean(error)}` and error message with `role="alert"`.
- **Styling Approach:** Semi-translucent dark input field with golden focus ring (`focus:border-solar-gold focus:ring-1 focus:ring-solar-gold`).

---

### 3.1.7 `GlassNavbar` (`components/glass/glass-navbar.tsx`)
- **Props Interface:**
  ```typescript
  interface GlassNavbarProps {
    unreadCount?: number;
  }
  ```
- **Consuming Locations:** `app/dashboard/layout.tsx`.
- **UI Elements:** SolarGrid brand logo with link to `/dashboard`, Clean Energy Status Pill ("MON-FRI OPERATIONAL"), Notification Bell with unread counter badge (`/dashboard/notifications`), User Avatar initials with link to `/dashboard/profile`.
- **Accessibility:** Interactive elements are keyboard focusable with descriptive aria labels.
- **Styling Approach:** Floating pill navbar (`glass-2` elevation) with golden border accents.

---

### 3.1.8 `GlassSheet` (`components/glass/glass-sheet.tsx`)
- **Props Interface:**
  ```typescript
  interface GlassSheetProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
  }
  ```
- **Consuming Locations:** Upgrade Unit Modal (`/dashboard/panels`), Purchase Confirmation Modal (`/dashboard/plans`), Balance Adjustment Modal (`/admin/users`), Support Ticket Composer (`/dashboard/support`).
- **Accessibility:** Modal dialog trapping focus; renders `role="dialog"`, `aria-modal="true"`, and listens for Escape key press to dismiss.
- **Styling Approach:** Fixed overlay with dark blur backdrop (`bg-[#050B18]/80 backdrop-blur-xl`) and elevated center modal / bottom drawer on mobile.

---

### 3.1.9 `GlassTable` (`components/glass/glass-table.tsx`)
- **Props Interface:**
  ```typescript
  interface GlassTableProps {
    headers: string[];
    children: React.ReactNode;
    emptyMessage?: string;
    isLoading?: boolean;
    className?: string;
  }
  ```
- **Consuming Locations:** `app/dashboard/records/page.tsx`, `app/dashboard/earnings/page.tsx`, `app/admin/ledger/page.tsx`, `app/admin/users/page.tsx`, `app/admin/recharges/page.tsx`.
- **Accessibility:** Semantic HTML table structure (`<table>`, `<thead>`, `<th>`, `<tbody>`, `<td>`).
- **Styling Approach:** Sticky table headers with subtle bottom border, hover row highlighting, and custom dark scrollbars.

---

### 3.1.10 `GlassTabs` (`components/glass/glass-tabs.tsx`)
- **Props Interface:**
  ```typescript
  interface GlassTabsProps {
    tabs: { id: string; label: string; icon?: React.ReactNode; badge?: string | number }[];
    activeTab: string;
    onChange: (tabId: string) => void;
    className?: string;
  }
  ```
- **Consuming Locations:** `app/dashboard/records/page.tsx`, `app/dashboard/earnings/page.tsx`, `app/admin/users/[id]/page.tsx`, `app/admin/recharges/page.tsx`, `app/admin/withdrawals/page.tsx`.
- **Accessibility:** Uses `role="tablist"` and `role="tab"` with `aria-selected` attributes.
- **Styling Approach:** Segmented control container with smooth sliding active background pill.

---

### 3.1.11 `Barrel Export` (`components/glass/index.ts`)
- **Purpose:** Centralized barrel export exporting `GlassBadge`, `GlassButton`, `GlassCard`, `GlassInput`, `GlassNavbar`, `GlassBottomBar`, `GlassTable`, `GlassTabs`, `GlassSheet`, and `GlassChartContainer`.

---

## 3.2 Motion & Animation Components (`components/motion/*`)

### 3.2.1 `LenisProvider` (`components/motion/lenis-provider.tsx`)
- **Props Interface:** `{ children: React.ReactNode }`
- **Consuming Locations:** `app/layout.tsx` (wraps entire application).
- **Functionality:** Initializes the Lenis smooth-scrolling engine on client mount, setting up `requestAnimationFrame` ticker. Listens for user reduced-motion media query and disables smooth scrolling when `prefers-reduced-motion: reduce` is detected.

---

## 3.3 Public Layout & Navigation Components (`components/ui/*`)

### 3.3.1 `Navigation` (`components/ui/navigation.tsx`)
- **Consuming Locations:** Public marketing pages (`app/page.tsx`, `app/plans/page.tsx`, `app/about/page.tsx`, etc.).
- **UI Elements:** Top operational ticker bar (live schedule 12:00 PM – 3:00 PM Mon-Fri), SolarGrid brand logo, desktop navigation links, Login & Register action buttons, mobile hamburger menu with collapsible drawer.
- **Accessibility:** Responsive mobile drawer with toggle button and `aria-label`. Focusable links.

---

### 3.3.2 `Footer` (`components/ui/footer.tsx`)
- **Consuming Locations:** Public marketing pages.
- **UI Elements:** 4-column footer layout (Brand Summary, Solar Hardware links, Governance & Rules links, Legal links), live weekday generation status indicator, and copyright notice.

---

### 3.3.3 `RoleSwitcher` (`components/ui/role-switcher.tsx`)
- **Consuming Locations:** `app/layout.tsx`.
- **Status & Finding:** Obsolete mock role switcher disabled in production architecture. Returns `null` so that authentication is governed strictly by Supabase session tokens.

"""
