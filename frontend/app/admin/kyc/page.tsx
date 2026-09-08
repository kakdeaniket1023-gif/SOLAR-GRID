'use client';

import React, { useState, useEffect } from 'react';
import { KycSubmission, KycStatus } from '@/types';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Search,
  ExternalLink,
  X,
  UserCheck,
} from 'lucide-react';
import { GlassCard } from '@/frontend/glass';

export default function AdminKycReviewPage() {
  const [submissions, setSubmissions] = useState<KycSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeReviewModal, setActiveReviewModal] = useState<KycSubmission | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadSubmissions = () => {
    fetch('/api/admin/kyc')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setSubmissions(data.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSubmissions();
  }, []);

  const handleReviewAction = async (action: 'APPROVE' | 'REJECT') => {
    if (!activeReviewModal) return;
    setProcessing(true);
    setActionSuccess(null);

    try {
      const res = await fetch('/api/admin/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: activeReviewModal.id,
          action,
          rejectionReason: action === 'REJECT' ? rejectionReason : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Review action failed');
      }

      setActionSuccess(`Application ${action === 'APPROVE' ? 'approved' : 'rejected'} successfully.`);
      setActiveReviewModal(null);
      setRejectionReason('');
      loadSubmissions();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const filtered = submissions.filter((s) => {
    if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const userMatch = (s.userName || '').toLowerCase().includes(q);
      const emailMatch = (s.userEmail || '').toLowerCase().includes(q);
      const docMatch = (s.docNumber || '').toLowerCase().includes(q);
      return userMatch || emailMatch || docMatch;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <GlassCard elevation={1} className="p-6 rounded-3xl border-white/[0.08] bg-[#0B1426]">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-solar-gold/10 border border-solar-gold/25 text-solar-gold text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            Compliance Desk
          </div>
          <h1 className="text-2xl font-bold font-display text-white mt-2">
            KYC Identity Verification Queue
          </h1>
          <p className="text-xs text-slate-400">
            Review government-issued identification documents to approve or reject distributor payout eligibility.
          </p>
        </div>
      </GlassCard>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {['ALL', 'PENDING', 'VERIFIED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === st
                  ? 'bg-solar-gold text-slate-950 shadow-sm'
                  : 'bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-slate-300'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search distributor name, email, doc #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0B1426] border border-white/[0.08] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-solar-gold/50"
          />
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Submissions List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 animate-pulse">Loading KYC queue...</div>
      ) : filtered.length === 0 ? (
        <GlassCard elevation={1} className="p-12 text-center rounded-3xl border-white/[0.08]">
          <p className="text-xs text-slate-400">No KYC submissions found matching this filter.</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {filtered.map((sub) => (
            <GlassCard
              key={sub.id}
              elevation={1}
              className="p-5 rounded-2xl border-white/[0.08] bg-[#0B1426] flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-white/[0.12] transition-colors"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">{sub.userName || 'Distributor'}</span>
                  <span className="text-xs text-slate-400">({sub.userEmail})</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      sub.status === 'VERIFIED'
                        ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
                        : sub.status === 'REJECTED'
                        ? 'bg-rose-400/10 text-rose-400 border border-rose-400/20'
                        : 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                    }`}
                  >
                    {sub.status}
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  {sub.docType}: {sub.docNumber} · Submitted {new Date(sub.createdAt).toLocaleString()}
                </div>
                {sub.rejectionReason && (
                  <div className="text-[11px] text-rose-400">
                    Rejection note: {sub.rejectionReason}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={sub.frontUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-slate-300 inline-flex items-center gap-1.5 transition-colors"
                >
                  <span>Doc Photo</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                {sub.status === 'PENDING' && (
                  <button
                    onClick={() => {
                      setActiveReviewModal(sub);
                      setRejectionReason('');
                    }}
                    className="px-4 py-1.5 rounded-xl bg-solar-gold hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors"
                  >
                    Review
                  </button>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {activeReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-[#0B1426] border border-white/[0.1] p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h2 className="text-base font-bold text-white">Review KYC Application</h2>
              <button
                onClick={() => setActiveReviewModal(null)}
                className="text-xs text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Applicant:</span>
                <span className="font-semibold text-white">{activeReviewModal.userName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Email:</span>
                <span className="text-slate-300">{activeReviewModal.userEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Document Type:</span>
                <span className="font-mono text-solar-gold font-bold">{activeReviewModal.docType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">ID Number:</span>
                <span className="font-mono text-white">{activeReviewModal.docNumber}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-medium">Rejection Reason (If rejecting)</label>
              <input
                type="text"
                placeholder="e.g. Expired ID, blurry image, document name mismatch..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-400/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleReviewAction('REJECT')}
                disabled={processing}
                className="py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-semibold text-xs transition-colors disabled:opacity-50"
              >
                Reject KYC
              </button>
              <button
                onClick={() => handleReviewAction('APPROVE')}
                disabled={processing}
                className="py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-colors disabled:opacity-50"
              >
                Approve KYC
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
