'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sun, LogIn, UserPlus, Menu, X } from 'lucide-react';

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/plans', label: 'Solar Plans' },
    { href: '/how-it-works', label: 'How It Works' },
    { href: '/about', label: 'About' },
    { href: '/faq', label: 'FAQ' },
    { href: '/contact', label: 'Contact' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.07] bg-[#090A0F]/90 backdrop-blur-md">
      {/* Simple Status Ticker */}
      <div className="bg-[#10121A] border-b border-white/[0.05] py-1.5 px-4 text-xs flex items-center justify-between text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-amber-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Solar Operations Active
          </span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="hidden sm:inline">Monday – Friday</span>
          <span className="text-slate-600 hidden md:inline">•</span>
          <span className="hidden md:inline">Daily USDT Earnings</span>
        </div>
        <div className="text-[11px] text-emerald-400 font-medium">
          System Normal
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Sun className="w-4 h-4" />
          </div>
          <span className="text-base font-bold tracking-tight text-white">
            Solar<span className="text-amber-400">Grid</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors ${
                  isActive
                    ? 'text-amber-400 font-medium'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right CTA */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/login"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </Link>
          <Link
            href="/signup"
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 transition-colors shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Get Started</span>
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05]"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/[0.07] bg-[#0F111A] px-4 py-4 space-y-3">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                  pathname === link.href
                    ? 'bg-amber-500/10 text-amber-400 font-medium'
                    : 'text-slate-300 hover:bg-white/[0.04]'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="pt-3 border-t border-white/[0.06] grid grid-cols-2 gap-2">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 text-center text-xs font-medium rounded-lg text-slate-300 bg-white/[0.05] hover:bg-white/[0.08]"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 text-center text-xs font-semibold rounded-lg text-neutral-950 bg-amber-400 hover:bg-amber-300"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
