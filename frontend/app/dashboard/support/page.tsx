'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/frontend/contexts/auth-context';
import {
  Headphones,
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  MessageSquare,
  Clock,
  ChevronDown,
} from 'lucide-react';

const SUPPORT_FAQS = [
  {
    q: 'How do daily panel operations work?',
    a: 'Once you own a solar panel (P1 to P6), navigate to Daily Power and click Start Cycle. The panel runs for a 3-hour generation cycle. Once finished, click Collect to credit your daily returns directly to your available balance.',
  },
  {
    q: 'What is the withdrawal fee and minimum amount?',
    a: 'The minimum withdrawal is 10.00 USDT, and a standard flat 10% platform fee applies to all withdrawals. Payouts are sent directly to your verified payout wallet.',
  },
  {
    q: 'How do referral commissions work?',
    a: 'When you invite others using your referral code, you earn commissions across 3 community tiers: 10% on direct referrals (Level 1), 3% on Level 2, and 1% on Level 3 whenever they purchase solar panels.',
  },
  {
    q: 'Why do I need a Transaction Password / PIN?',
    a: 'Your transaction password is a security measure required to authorize withdrawals and protect your payout wallet address from unauthorized modifications.',
  },
];

export default function SupportPage() {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user?.name || 'Member',
          email: user?.email || 'user@solargrid.io',
          subject: `[${category}] ${subject || 'Support Request'}`,
          message,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Your support ticket has been received. Our team typically responds within 2 hours.');
        setSubject('');
        setMessage('');
      } else {
        setErrorMsg(data.message || 'Failed to submit ticket. Please try again.');
      }
    } catch {
      setErrorMsg('Network error while transmitting ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.07] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Help & Support
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Need assistance with your account, panels, or withdrawals? We are here to help.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 text-xs font-medium">
          <Clock className="w-3.5 h-3.5" />
          <span>Average Response: &lt; 2 hours</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Support Ticket Form */}
        <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-[#0D0E15] border border-white/[0.07] space-y-5">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <h2 className="text-base font-semibold text-white">Open Support Ticket</h2>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmitTicket} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-zinc-300 font-medium">Topic / Category:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl bg-white/[0.03] border border-white/[0.08] px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-amber-400"
              >
                <option value="GENERAL" className="bg-[#0D0E15]">General Inquiry</option>
                <option value="DEPOSIT" className="bg-[#0D0E15]">Deposit / Add Funds</option>
                <option value="WITHDRAWAL" className="bg-[#0D0E15]">Withdrawal Issue</option>
                <option value="PANELS" className="bg-[#0D0E15]">Panel Operations & Power</option>
                <option value="SECURITY" className="bg-[#0D0E15]">Account Security & PIN</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-300 font-medium">Subject:</label>
              <input
                type="text"
                required
                placeholder="Brief summary of your question"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-xl bg-white/[0.03] border border-white/[0.08] px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-300 font-medium">Message:</label>
              <textarea
                rows={4}
                required
                placeholder="Describe your issue with as much detail as possible..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-xl bg-white/[0.03] border border-white/[0.08] px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-amber-400 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <span>Sending...</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Ticket</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* FAQs & Contact Channels */}
        <div className="lg:col-span-5 space-y-5">
          {/* Quick Contact */}
          <div className="p-6 rounded-3xl bg-[#0D0E15] border border-white/[0.07] space-y-3">
            <h3 className="text-sm font-semibold text-white">Direct Channels</h3>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-zinc-300">
                  <Mail className="w-4 h-4 text-amber-400" />
                  <span>Email Support</span>
                </div>
                <span className="font-mono text-zinc-400">support@solargrid.io</span>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-zinc-300">
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                  <span>Telegram Community</span>
                </div>
                <span className="font-mono text-zinc-400">@SolarGridOfficial</span>
              </div>
            </div>
          </div>

          {/* FAQ Accordion */}
          <div className="p-6 rounded-3xl bg-[#0D0E15] border border-white/[0.07] space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06]">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-white">Frequently Asked</h3>
            </div>

            <div className="space-y-2">
              {SUPPORT_FAQS.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-xl bg-white/[0.02] border border-white/[0.05] overflow-hidden text-xs"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full p-3 text-left font-medium text-white flex items-center justify-between gap-2 hover:bg-white/[0.02] transition-colors"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-3 pb-3 text-zinc-400 text-[11px] leading-relaxed border-t border-white/[0.03] pt-2">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
