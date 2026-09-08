import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Sun, ArrowLeft, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';

export const metadata = {
  title: 'Income Disclosure Statement | SolarGrid Clean Energy',
  description: 'Official Direct Selling Income Disclosure Statement for SolarGrid Independent Clean Energy Distributors.',
};

export default function IncomeDisclosurePage() {
  return (
    <div className="min-h-screen bg-[#07080C] text-zinc-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to SolarGrid</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Sun className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-white">
              Solar<span className="text-amber-400">Grid</span>
            </span>
          </div>
        </div>

        {/* Hero Banner */}
        <div className="p-8 rounded-3xl bg-[#0D0E15] border border-white/[0.08] space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/25 text-amber-400 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            FTC & DSA Compliant Disclosure · Effective September 2026
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
            Independent Distributor <span className="text-amber-400">Income Disclosure Statement</span>
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-3xl">
            SolarGrid is committed to the highest standards of transparency, commercial ethics, and compliance with direct-selling laws worldwide. The earnings of SolarGrid Independent Distributors are generated exclusively from genuine sales of clean energy equipment (photovoltaic panels, micro-inverters, battery energy storage systems) to consumers and businesses.
          </p>
        </div>

        {/* Mandatory Hard Compliance Principles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" />
              <span>Free Account Creation</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Account registration as a distributor is 100% free. SolarGrid does not charge joining fees, enrollment packages, or mandatory starter inventory purchases.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" />
              <span>Zero Recruitment Commissions</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              No bonuses or commissions are ever paid for the mere recruitment, sponsorship, or enrollment of other distributors. Commissions only trigger upon confirmed payment of real equipment orders.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" />
              <span>Strict 2-Tier Depth Limit</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Referral commission override depth is strictly capped at maximum 2 levels (Level 1: 10% on Order PV; Level 2: 5% on Order PV), preventing multi-level pyramiding or unsustainable debt spirals.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4" />
              <span>No Investment Contracts or Guaranteed Yields</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              SolarGrid does NOT sell high-yield investment programs (HYIP), deposit plans, fixed daily ROI, or guaranteed passive income. All earnings depend strictly on verifiable sales volume and personal diligence.
            </p>
          </div>
        </div>

        {/* Distributor Earnings Summary Table */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0D0E15] border border-white/[0.08] space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white">Representative Annual Earnings by Distributor Tier</h2>
            <p className="text-xs text-zinc-400">
              Data based on active independent distributors participating in the SolarGrid platform in the trailing 12-month audit window.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] text-zinc-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Distributor Rank</th>
                  <th className="py-3 px-4">% of Active Field</th>
                  <th className="py-3 px-4">Avg Annual Commissions</th>
                  <th className="py-3 px-4">Median Annual Volume</th>
                  <th className="py-3 px-4">Avg Monthly Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] font-mono">
                <tr className="hover:bg-white/[0.02] text-zinc-300">
                  <td className="py-3.5 px-4 font-sans font-semibold text-white">Associate Distributor</td>
                  <td className="py-3.5 px-4">64.2%</td>
                  <td className="py-3.5 px-4 text-amber-400 font-bold">$420 - $1,850 USDT</td>
                  <td className="py-3.5 px-4">3,500 PV</td>
                  <td className="py-3.5 px-4">5 - 10 hrs</td>
                </tr>
                <tr className="hover:bg-white/[0.02] text-zinc-300">
                  <td className="py-3.5 px-4 font-sans font-semibold text-white">Solar Consultant</td>
                  <td className="py-3.5 px-4">22.8%</td>
                  <td className="py-3.5 px-4 text-amber-400 font-bold">$2,400 - $7,900 USDT</td>
                  <td className="py-3.5 px-4">18,000 PV</td>
                  <td className="py-3.5 px-4">12 - 20 hrs</td>
                </tr>
                <tr className="hover:bg-white/[0.02] text-zinc-300">
                  <td className="py-3.5 px-4 font-sans font-semibold text-white">Clean Energy Leader</td>
                  <td className="py-3.5 px-4">9.5%</td>
                  <td className="py-3.5 px-4 text-amber-400 font-bold">$9,500 - $24,800 USDT</td>
                  <td className="py-3.5 px-4">65,000 PV</td>
                  <td className="py-3.5 px-4">25 - 35 hrs</td>
                </tr>
                <tr className="hover:bg-white/[0.02] text-zinc-300">
                  <td className="py-3.5 px-4 font-sans font-semibold text-white">Regional Director</td>
                  <td className="py-3.5 px-4">3.5%</td>
                  <td className="py-3.5 px-4 text-amber-400 font-bold">$32,000 - $78,500 USDT</td>
                  <td className="py-3.5 px-4">210,000 PV</td>
                  <td className="py-3.5 px-4">35+ hrs</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] text-[11px] text-zinc-400 leading-relaxed">
            Note: Figures reflect gross commissions before business operating expenses (such as marketing, travel, and mobile phone). A typical participant earns between $300 and $2,000 annually. Earnings require substantial dedication, customer acquisition, and technical education regarding solar systems.
          </div>
        </div>

        {/* Refund & Clawback Policy */}
        <div className="p-6 rounded-3xl bg-[#0D0E15] border border-white/[0.08] space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Mandatory Refund & Commission Clawback Policy
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            In compliance with consumer protection legislation, any customer order that is cancelled, returned, or refunded initiates an automatic, system-enforced clawback of all commissions distributed up the 2-tier upline. If a distributor has already withdrawn clawed-back funds, a debit balance is recorded, and the account is placed under compliance review until reconciled.
          </p>
        </div>

        {/* Footer Navigation */}
        <div className="pt-6 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div>© 2026 SolarGrid Inc. All rights reserved. Registered Direct Selling Clean Energy Enterprise.</div>
          <div className="flex items-center gap-4 text-zinc-400">
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">Distributor Portal</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
