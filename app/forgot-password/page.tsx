'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sun, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { GlassCard, GlassButton, GlassInput } from '@/components/glass';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/dashboard/profile` : undefined,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSubmitted(true);
      }
    } catch {
      setErrorMsg('Failed to transmit password reset instructions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
          Reset Password
        </h2>
        <p className="text-xs text-slate-400 font-mono">
          Enter your registered email address to receive secure reset credentials.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <GlassCard elevation={2} className="py-8 px-6 sm:px-10 rounded-3xl border-white/[0.08] shadow-2xl space-y-6">
          {submitted ? (
            <div className="text-center py-6 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-solar-gold mx-auto" />
              <h4 className="text-base font-bold text-white">Reset Link Dispatched</h4>
              <p className="text-xs text-slate-400">
                If an account exists for {email}, a recovery link has been transmitted.
              </p>
              <div className="pt-4">
                <Link
                  href="/login"
                  className="inline-block py-2.5 px-6 rounded-xl bg-gradient-to-r from-solar-gold to-solar-amber text-[#050B18] font-bold text-xs shadow-gold-glow"
                >
                  Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <GlassInput
                label="Registered Email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@solargrid.io"
                leftIcon={Mail}
              />

              <GlassButton
                type="submit"
                variant="primary"
                size="lg"
                isLoading={loading}
                className="w-full font-bold text-[#050B18] shadow-gold-glow"
              >
                Send Password Reset Instructions
              </GlassButton>

              <div className="text-center pt-2">
                <Link href="/login" className="text-solar-gold font-semibold hover:underline text-xs font-mono">
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
