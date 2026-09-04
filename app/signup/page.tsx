'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { Sun, User, Mail, Lock, Users, ArrowRight, CheckCircle2 } from 'lucide-react';
import { GlassCard, GlassButton, GlassInput } from '@/components/glass';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signup } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setReferralCode(ref.toUpperCase());
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    const res = await signup(name, email, referralCode || undefined, password);
    setIsLoading(false);

    if (res.success) {
      router.push('/dashboard');
    } else {
      setError(res.message);
    }
  };

  return (
    <GlassCard elevation={2} className="p-6 sm:p-8 rounded-3xl border-white/[0.08] shadow-2xl space-y-6">
      {error && (
        <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <GlassInput
          label="Full Legal Name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Julian Mercer"
          leftIcon={User}
        />

        <GlassInput
          label="Email Address"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="julian.mercer@gridmail.net"
          leftIcon={Mail}
        />

        <GlassInput
          label="Password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="•••••••• (min 6 chars)"
          leftIcon={Lock}
        />

        <GlassInput
          label="Confirm Password"
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          leftIcon={Lock}
        />

        <div>
          <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
            Sponsor Referral Code <span className="text-slate-500">(Optional)</span>
          </label>
          <div className="relative">
            <Users className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              className="w-full glass-input rounded-xl pl-9 pr-3.5 py-2.5 text-solar-gold font-bold text-sm focus:outline-none uppercase font-mono border-white/[0.08]"
              placeholder="e.g. SOLAR-SARAH-99"
            />
          </div>
          {referralCode && (
            <div className="text-[10px] text-solar-gold mt-1.5 flex items-center gap-1 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-solar-gold" /> Sponsor attribution linked to this account
            </div>
          )}
        </div>

        <div className="p-3.5 rounded-2xl bg-[#050B18]/70 border border-white/[0.06] text-xs text-slate-400">
          By creating an account, you agree to the 60-day (~43 working days) generation cycle and 70-point baseline governance rules.
        </div>

        <GlassButton
          type="submit"
          variant="primary"
          size="lg"
          className="w-full font-bold text-[#050B18] shadow-gold-glow"
          isLoading={isLoading}
          rightIcon={ArrowRight}
        >
          Complete Registration
        </GlassButton>
      </form>

      <div className="text-center pt-2 text-xs text-slate-400 font-mono">
        Already have an active account?{' '}
        <Link href="/login" className="text-solar-gold font-bold hover:underline">
          Sign In
        </Link>
      </div>
    </GlassCard>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-[#050B18] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative solar-grid-bg">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-solar-gold via-solar-amber to-amber-900 border border-solar-gold/40 flex items-center justify-center shadow-gold-glow group-hover:scale-105 transition-transform">
            <Sun className="w-5 h-5 text-[#050B18] fill-[#050B18]" />
          </div>
          <span className="text-2xl font-bold font-display text-white">
            Solar<span className="text-solar-gold text-glow-gold">Grid</span>
          </span>
        </Link>
        <h2 className="text-2xl font-bold text-white tracking-tight font-display">
          Create Contributor Account
        </h2>
        <p className="text-xs text-slate-400 font-mono">
          Get initialized with 70 Points (100% earning power) and activate clean-energy capacity.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Suspense fallback={<div className="glass-1 p-8 text-center text-xs font-mono text-slate-400">Loading signup portal...</div>}>
          <SignupForm />
        </Suspense>
      </div>
    </div>
  );
}
