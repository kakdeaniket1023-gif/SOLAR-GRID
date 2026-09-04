'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { Sun, Lock, Mail, ArrowRight } from 'lucide-react';
import {
  GlassCard,
  GlassButton,
  GlassInput,
} from '@/components/glass';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const res = await login(email, password);
    setIsLoading(false);

    if (res.success) {
      if (email.includes('superadmin') || email.includes('admin')) {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#050B18] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative solar-grid-bg">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-solar-gold via-solar-amber to-amber-900 border border-solar-gold/40 flex items-center justify-center shadow-gold-glow group-hover:scale-105 transition-transform">
            <Sun className="w-5 h-5 text-[#050B18] fill-[#050B18]" />
          </div>
          <span className="text-2xl font-bold font-display text-white">
            Solar<span className="text-solar-gold text-glow-gold">Grid</span>
          </span>
        </Link>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-display">
          Authenticate to Infrastructure
        </h2>
        <p className="text-xs text-slate-400 font-mono">
          Access solar telemetry, earnings ledger, and community dashboard.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <GlassCard elevation={2} className="p-6 sm:p-8 space-y-5 border-white/[0.08]">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <GlassInput
              label="Email Address"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@solargrid.io"
              leftIcon={Mail}
            />

            <div>
              <div className="flex items-center justify-between mb-1 text-xs font-mono">
                <span className="text-slate-300 uppercase text-[10px]">Password</span>
                <Link href="/forgot-password" className="text-solar-gold hover:underline text-[11px]">
                  Forgot password?
                </Link>
              </div>
              <GlassInput
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                leftIcon={Lock}
              />
            </div>

            <GlassButton
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-bold text-[#050B18] shadow-gold-glow"
              isLoading={isLoading}
              rightIcon={ArrowRight}
            >
              Sign In to Infrastructure
            </GlassButton>
          </form>

          <div className="text-center pt-2 text-xs text-slate-400 font-mono">
            Don&apos;t have an active account?{' '}
            <Link href="/signup" className="text-solar-gold font-bold hover:underline">
              Register Here
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
