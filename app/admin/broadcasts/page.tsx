'use client';

import React, { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { GlassCard } from '@/components/glass';

export default function AdminBroadcastsPage() {
  const [targetAudience, setTargetAudience] = useState('ALL_USERS');
  const [title, setTitle] = useState('Quarterly Clean Energy Grid Sustainability Briefing');
  const [message, setMessage] = useState('All Monday-Friday generation cycles have maintained 99.4% average efficiency. Leadership rewards for this cycle have settled.');
  const [dispatched, setDispatched] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetAudience,
          title,
          message,
        }),
      });

      const data = await res.json();
      if (data.success) {
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FFC83D', '#FF9F1C', '#3B82F6'],
        });

        setFeedback(data.message);
        setDispatched(true);
        setTimeout(() => setDispatched(false), 4000);
      }
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold font-display text-white">Broadcast Communications Hub</h1>
        <p className="text-xs text-slate-400">
          Transmit official administrative announcements, maintenance briefings, and leadership notices across all active contributor portals.
        </p>
      </div>

      {dispatched && (
        <div className="p-3.5 rounded-2xl bg-solar-gold/15 border border-solar-gold/40 text-solar-gold text-xs font-mono flex items-center gap-2 shadow-gold-glow">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback || 'Broadcast dispatched successfully.'}</span>
        </div>
      )}

      {/* Broadcast Form */}
      <GlassCard elevation={1} className="p-6 sm:p-8 rounded-3xl border-white/[0.08] space-y-6">
        <form onSubmit={handleSendBroadcast} className="space-y-4 text-xs font-mono">
          <div>
            <label className="block text-slate-300 mb-1">Target Audience</label>
            <select
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="w-full glass-input border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white"
            >
              <option value="ALL_USERS" className="bg-[#0B1426]">All Platform Users</option>
              <option value="ACTIVE_PLAN_HOLDERS" className="bg-[#0B1426]">Active Solar Unit Holders Only</option>
              <option value="LEADERS_ONLY" className="bg-[#0B1426]">Solar Leaders & Above (Tiers 4-6)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 mb-1">Broadcast Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full glass-input border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white"
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-1">Broadcast Message Body</label>
            <textarea
              rows={4}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full glass-input border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={sending}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-solar-gold to-solar-amber text-[#050B18] font-bold text-xs shadow-gold-glow flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            >
              <Send className="w-4 h-4" />
              {sending ? 'Dispatching...' : 'Dispatch Broadcast to Network'}
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
