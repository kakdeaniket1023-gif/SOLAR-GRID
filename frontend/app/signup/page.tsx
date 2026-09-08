'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/frontend/contexts/auth-context';
import { Sun, User, Mail, Lock, Users, ArrowRight, CheckCircle2 } from 'lucide-react';
import { GlassCard } from '@/frontend/glass';

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
      setError(res.message || 'Signup failed. Please try again.');
    }
  };

  return (
    <GlassCard className="p-6 sm:p-8 rounded-2xl border-white/[0.07] bg-[#11131C] space-y-5">
      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block text-slate-300 font-medium mb-1">Your Full Name</label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sarah Jenkins"
              className="w-full glass-input rounded-xl pl-9 pr-3.5 py-2.5 text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-300 font-medium mb-1">Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full glass-input rounded-xl pl-9 pr-3.5 py-2.5 text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-300 font-medium mb-1">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="•••••••• (minimum 6 characters)"
              className="w-full glass-input rounded-xl pl-9 pr-3.5 py-2.5 text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-300 font-medium mb-1">Confirm Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full glass-input rounded-xl pl-9 pr-3.5 py-2.5 text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-300 font-medium mb-1">
            Referral Code <span className="text-slate-500 font-normal">(Optional)</span>
          </label>
          <div className="relative">
            <Users className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              className="w-full glass-input rounded-xl pl-9 pr-3.5 py-2.5 text-amber-400 font-semibold uppercase"
              placeholder="e.g. SG-SARAH-888"
            />
          </div>
          {referralCode && (
            <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Referral code applied
            </div>
          )}
        </div>

        <div className="p-3 rounded-xl bg-[#090A0F] border border-white/[0.05] text-[11px] text-slate-400 leading-relaxed">
          By signing up, you agree to our terms of service. You will receive 100 bonus points upon registration.
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          <span>{isLoading ? 'Creating Account...' : 'Create Account'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </form>

      <div className="text-center pt-2 text-xs text-slate-400">
        Already have an account?{' '}
        <Link href="/login" className="text-amber-400 font-semibold hover:underline">
          Sign In
        </Link>
      </div>
    </GlassCard>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-[#090A0F] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Sun className="w-4 h-4" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">
            Solar<span className="text-amber-400">Grid</span>
          </span>
        </Link>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Create Your Account
        </h2>
        <p className="text-xs text-slate-400">
          Start earning daily returns from solar energy in minutes.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading signup...</div>}>
          <SignupForm />
        </Suspense>
      </div>
    </div>
  );
}
