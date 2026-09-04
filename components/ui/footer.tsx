'use client';

import React from 'react';
import Link from 'next/link';
import { Sun, Shield, CheckCircle2 } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#050B18] pt-16 pb-12 relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-solar-gold/5 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-white/[0.08]">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-solar-gold via-solar-amber to-amber-900 border border-solar-gold/40 flex items-center justify-center shadow-gold-glow">
                <Sun className="w-5 h-5 text-[#050B18] fill-[#050B18]" />
              </div>
              <span className="text-xl font-bold font-display text-white">
                Solar<span className="text-solar-gold text-glow-gold">Grid</span>
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Digital Solar Infrastructure. Enabling direct activation of distributed photovoltaic solar units with weekday energy generation and automated daily settlements.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-solar-gold/10 border border-solar-gold/30 text-solar-gold text-[11px] font-mono font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Direct Daily Settlement
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-solar-blue/10 border border-solar-blue/30 text-solar-blue text-[11px] font-mono font-medium">
                <Shield className="w-3.5 h-3.5" /> High-Efficiency PV Tech
              </span>
            </div>
          </div>

          {/* Infrastructure Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Infrastructure</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link href="/plans" className="hover:text-solar-gold transition-colors">Solar Plans</Link></li>
              <li><Link href="/how-it-works" className="hover:text-solar-gold transition-colors">How SolarGrid Works</Link></li>
              <li><Link href="/projects" className="hover:text-solar-gold transition-colors">Solar Technology</Link></li>
              <li><Link href="/rules" className="hover:text-solar-gold transition-colors">Operating Rules</Link></li>
            </ul>
          </div>

          {/* Platform & Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Platform</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link href="/about" className="hover:text-slate-200 transition-colors">About SolarGrid</Link></li>
              <li><Link href="/faq" className="hover:text-slate-200 transition-colors">Frequently Asked Questions</Link></li>
              <li><Link href="/contact" className="hover:text-slate-200 transition-colors">Support & Inquiries</Link></li>
              <li><Link href="/terms" className="hover:text-slate-200 transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-slate-200 transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} SolarGrid Energy Systems Inc. All rights reserved.</p>
          <div className="flex items-center gap-6 font-mono text-[11px]">
            <span className="flex items-center gap-1.5 text-solar-gold">
              <span className="w-2 h-2 rounded-full bg-solar-gold animate-pulse" /> Weekday Generation Active
            </span>
            <span className="text-solar-blue">Mon – Fri Cycle</span>
            <span>Auditable Ledger</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
