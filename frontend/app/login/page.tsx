'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/frontend/contexts/auth-context';
import { Sun, Lock, Mail, ArrowRight } from 'lucide-react';
import { GlassCard } from '@/frontend/glass';

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
      if (res.user?.role === 'SUPER_ADMIN') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } else {
      setError(res.message || 'Invalid email or password.');
    }
  };

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
          Welcome back
        </h2>
        <p className="text-xs text-slate-400">
          Enter your email and password to access your dashboard.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <GlassCard className="p-6 sm:p-8 space-y-5 bg-[#11131C] border-white/[0.07]">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full glass-input rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-300">Password</label>
                <Link href="/forgot-password" className="text-xs text-amber-400 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full glass-input rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="text-center pt-2 text-xs text-slate-400">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-amber-400 font-semibold hover:underline">
              Create an account
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
