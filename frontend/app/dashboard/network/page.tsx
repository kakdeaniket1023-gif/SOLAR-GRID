'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/frontend/contexts/auth-context';
import { TreeNode, TeamStats } from '@/types';
import {
  Users,
  Sun,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  ChevronDown,
  ChevronRight,
  UserCheck,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { GlassCard } from '@/frontend/glass';

export default function NetworkTreePage() {
  const { user } = useAuth();
  const [treeRoot, setTreeRoot] = useState<TreeNode | null>(null);
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedMember, setSelectedMember] = useState<any | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/network/tree?depth=2').then((res) => res.json()),
      fetch('/api/network/stats').then((res) => res.json()),
    ])
      .then(([treeRes, statsRes]) => {
        if (treeRes.success && treeRes.data?.root) {
          setTreeRoot(treeRes.data.root);
          // Expand root by default
          setExpandedNodes(new Set([treeRes.data.root.id]));
        }
        if (statsRes.success) {
          setStats(statsRes.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const inspectMember = async (memberId: string) => {
    try {
      const res = await fetch(`/api/network/genealogy/${memberId}`);
      const data = await res.json();
      if (data.success) {
        setSelectedMember(data.data);
      }
    } catch {}
  };

  const renderKycBadge = (status: string) => {
    if (status === 'VERIFIED') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">
          <CheckCircle2 className="w-2.5 h-2.5" />
          Verified
        </span>
      );
    }
    if (status === 'PENDING') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
          <Clock className="w-2.5 h-2.5" />
          Pending
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-400 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.08]">
        Unverified
      </span>
    );
  };

  // Filter children based on search query
  const matchesSearch = (node: TreeNode): boolean => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = node.name.toLowerCase().includes(q);
    const emailMatch = node.email.toLowerCase().includes(q);
    const childrenMatch = node.children ? node.children.some((c) => matchesSearch(c)) : false;
    return nameMatch || emailMatch || childrenMatch;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <GlassCard elevation={1} className="p-6 sm:p-8 rounded-3xl border-white/[0.07] bg-[#0D0E15]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-semibold">
              <Users className="w-3.5 h-3.5" />
              Direct Selling Organization
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Interactive <span className="text-amber-400">Network Tree</span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400">
              Explore your 2-tier distributor genealogy, team volume (PV), and KYC verification statuses.
            </p>
          </div>

          <div className="px-4 py-2 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-right">
            <span className="text-[11px] text-zinc-400">Maximum Commission Depth</span>
            <div className="text-sm font-bold text-amber-400 font-mono">2 Levels Strict</div>
          </div>
        </div>
      </GlassCard>

      {/* Network Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <GlassCard elevation={1} className="p-4 rounded-2xl border-white/[0.07]">
          <span className="text-[11px] text-zinc-400 font-medium">Level 1 (Directs)</span>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {stats?.level1Count || 0}
          </div>
          <span className="text-[10px] text-amber-400">10% Commission Overrides</span>
        </GlassCard>

        <GlassCard elevation={1} className="p-4 rounded-2xl border-white/[0.07]">
          <span className="text-[11px] text-zinc-400 font-medium">Level 2 (Indirects)</span>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {stats?.level2Count || 0}
          </div>
          <span className="text-[10px] text-sky-400">5% Commission Overrides</span>
        </GlassCard>

        <GlassCard elevation={1} className="p-4 rounded-2xl border-white/[0.07]">
          <span className="text-[11px] text-zinc-400 font-medium">Group Volume (GV)</span>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {stats?.groupPv.toLocaleString() || 0} <span className="text-xs text-zinc-400 font-normal">PV</span>
          </div>
          <span className="text-[10px] text-emerald-400">Combined Sales Volume</span>
        </GlassCard>

        <GlassCard elevation={1} className="p-4 rounded-2xl border-white/[0.07]">
          <span className="text-[11px] text-zinc-400 font-medium">Verified KYC Rate</span>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            {stats?.totalTeamCount ? `${Math.round((stats.verifiedKycCount / stats.totalTeamCount) * 100)}%` : '100%'}
          </div>
          <span className="text-[10px] text-zinc-400">Compliance Verification</span>
        </GlassCard>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search distributor name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0D0E15] border border-white/[0.08] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:border-amber-400/50 focus:outline-none"
          />
        </div>
      </div>

      {/* Tree Visualization */}
      {loading ? (
        <div className="p-12 text-center rounded-3xl bg-white/[0.02] border border-white/[0.05] animate-pulse">
          <p className="text-xs text-zinc-400">Loading network tree...</p>
        </div>
      ) : !treeRoot ? (
        <GlassCard elevation={1} className="p-12 text-center rounded-3xl border-white/[0.07]">
          <p className="text-xs text-zinc-400">Network tree is currently unavailable.</p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {/* Root Node (You) */}
          <GlassCard elevation={2} className="p-5 rounded-3xl border-amber-400/30 bg-[#0D0E15]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400 font-bold text-sm shrink-0">
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{treeRoot.name} (You)</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20">
                      Root Sponsor
                    </span>
                    {renderKycBadge(treeRoot.kycStatus)}
                  </div>
                  <div className="text-xs text-zinc-400">{treeRoot.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-left sm:text-right">
                  <div className="text-xs text-zinc-400">Personal PV</div>
                  <div className="text-sm font-bold font-mono text-white">{treeRoot.personalPv} PV</div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-xs text-zinc-400">Group PV</div>
                  <div className="text-sm font-bold font-mono text-amber-400">{treeRoot.groupPv} PV</div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-xs text-zinc-400">Direct Team</div>
                  <div className="text-sm font-bold font-mono text-white">{treeRoot.directCount}</div>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Level 1 Direct Children */}
          {treeRoot.children && treeRoot.children.length > 0 ? (
            <div className="pl-4 sm:pl-8 border-l-2 border-amber-400/20 space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <span>Level 1 Direct Team ({treeRoot.children.length} Members · 10% Override)</span>
              </div>

              {treeRoot.children.filter(matchesSearch).map((l1) => {
                const isExpanded = expandedNodes.has(l1.id);
                const hasL2 = l1.children && l1.children.length > 0;

                return (
                  <div key={l1.id} className="space-y-3">
                    <GlassCard
                      elevation={1}
                      className="p-4 rounded-2xl border-white/[0.07] bg-[#0D0E15] flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-white/[0.12] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {hasL2 ? (
                          <button
                            onClick={() => toggleExpand(l1.id)}
                            className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-amber-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        ) : (
                          <div className="w-4" />
                        )}

                        <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-xs font-bold text-white shrink-0">
                          {l1.name[0]?.toUpperCase()}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{l1.name}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-400">
                              L1
                            </span>
                            {renderKycBadge(l1.kycStatus)}
                          </div>
                          <div className="text-[11px] text-zinc-400">{l1.email}</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-5">
                        <div className="text-left sm:text-right">
                          <div className="text-[10px] text-zinc-400 uppercase">Sales PV</div>
                          <div className="text-xs font-bold font-mono text-white">{l1.personalPv} PV</div>
                        </div>

                        <div className="text-left sm:text-right">
                          <div className="text-[10px] text-zinc-400 uppercase">L2 Directs</div>
                          <div className="text-xs font-bold font-mono text-sky-400">{l1.directCount}</div>
                        </div>

                        <button
                          onClick={() => inspectMember(l1.id)}
                          className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-300 text-xs font-medium transition-colors"
                        >
                          View
                        </button>
                      </div>
                    </GlassCard>

                    {/* Level 2 Children */}
                    {hasL2 && isExpanded && (
                      <div className="pl-6 sm:pl-10 border-l-2 border-sky-400/20 space-y-2">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
                          Level 2 Downline ({l1.children!.length} Members · 5% Override)
                        </div>

                        {l1.children!.filter(matchesSearch).map((l2) => (
                          <GlassCard
                            key={l2.id}
                            elevation={1}
                            className="p-3.5 rounded-xl border-white/[0.05] bg-[#0A0B10] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-white/[0.1] transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-[11px] font-bold text-zinc-300 shrink-0">
                                {l2.name[0]?.toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-white">{l2.name}</span>
                                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-sky-400/10 text-sky-400">
                                    L2
                                  </span>
                                  {renderKycBadge(l2.kycStatus)}
                                </div>
                                <div className="text-[10px] text-zinc-400">{l2.email}</div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-4">
                              <div className="text-left sm:text-right">
                                <div className="text-[9px] text-zinc-400 uppercase">Sales PV</div>
                                <div className="text-xs font-bold font-mono text-white">{l2.personalPv} PV</div>
                              </div>

                              <button
                                onClick={() => inspectMember(l2.id)}
                                className="px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-zinc-300 text-[11px] transition-colors"
                              >
                                View
                              </button>
                            </div>
                          </GlassCard>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <GlassCard elevation={1} className="p-8 text-center rounded-3xl border-white/[0.07] space-y-2">
              <p className="text-xs text-zinc-400">No Level 1 direct distributors sponsored yet.</p>
              <p className="text-[11px] text-zinc-500">Share your free sponsor referral link to start building your organization.</p>
            </GlassCard>
          )}
        </div>
      )}

      {/* Member Details Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-[#0F1017] border border-white/[0.1] p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <h2 className="text-base font-bold text-white">{selectedMember.name}</h2>
                <div className="text-xs text-zinc-400">{selectedMember.email}</div>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="text-xs text-zinc-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">KYC Status:</span>
                {renderKycBadge(selectedMember.kycStatus)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Personal PV:</span>
                <span className="font-mono font-bold text-white">{selectedMember.personalPv} PV</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Group PV:</span>
                <span className="font-mono font-bold text-amber-400">{selectedMember.groupPv} PV</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Direct Team Count:</span>
                <span className="font-mono font-bold text-white">{selectedMember.directCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Member Since:</span>
                <span className="text-zinc-300">{new Date(selectedMember.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedMember(null)}
              className="w-full py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 font-medium text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
