'use client';

import React from 'react';
import Link from 'next/link';
import { Sun, CheckCircle2 } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-white/[0.07] bg-[#090A0F] pt-14 pb-12 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-white/[0.06]">
          {/* Brand & About */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Sun className="w-4 h-4" />
              </div>
              <span className="text-base font-bold text-white tracking-tight">
                Solar<span className="text-amber-400">Grid</span>
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Solar energy made simple. Buy a solar panel plan, turn it on each weekday, and collect daily returns directly in USDT to your account.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                Mon – Fri Daily Returns
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Fast USDT Withdrawals
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/plans" className="hover:text-amber-400 transition-colors">
                  Solar Plans
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-amber-400 transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-amber-400 transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/rules" className="hover:text-amber-400 transition-colors">
                  Operating Rules
                </Link>
              </li>
            </ul>
          </div>

          {/* Company & Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
              Company & Legal
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact Support
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} SolarGrid. All rights reserved.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-slate-400">Operating Days: Monday to Friday</span>
            <span>•</span>
            <span className="text-slate-400">Withdrawal Fee: 10%</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
