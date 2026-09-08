'use client';
import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  GitFork,
  Search,
  Users,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Award,
  Layers,
  DollarSign,
  Maximize2,
  Minimize2,
  RefreshCw,
  ExternalLink,
  Shield,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { GlassCard, GlassBadge } from '@/frontend/glass';
import { TreeNode } from '@/types';

function AdminMlmTreeContent() {
  const searchParams = useSearchParams();
  const initialUserId = searchParams.get('userId');

  const [treeData, setTreeData] = useState<TreeNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [currentRootId, setCurrentRootId] = useState<string | null>(initialUserId || null);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [maxDepthFilter, setMaxDepthFilter] = useState<number>(4);

  const loadTree = useCallback(async (userId?: string | null, query?: string) => {
    setLoading(true);
    setSearchError(null);
    try {
      let url = `/api/mlm/tree?depth=${maxDepthFilter}`;
      if (query) {
        url += `&search=${encodeURIComponent(query)}`;
      } else if (userId) {
        url += `&userId=${encodeURIComponent(userId)}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.tree) {
        setTreeData(data.tree);
        setCurrentRootId(data.tree.id);
      } else {
        setSearchError(data.message || 'Failed to load network tree');
      }
    } catch {
      setSearchError('Network error loading tree');
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }, [maxDepthFilter]);

  useEffect(() => {
    loadTree(currentRootId);
  }, [loadTree, currentRootId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    loadTree(null, searchQuery.trim());
  };

  const handleResetToMaster = () => {
    setSearchQuery('');
    setCurrentRootId(null);
    loadTree(null);
  };

  const toggleNode = (nodeId: string) => {
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const expandAll = () => {
    setCollapsedNodes(new Set());
  };

  const collapseAll = () => {
    if (!treeData) return;
    const allIds = new Set<string>();
    const collectIds = (node: TreeNode) => {
      allIds.add(node.id);
      if (node.children) {
        node.children.forEach(collectIds);
      }
    };
    collectIds(treeData);
    setCollapsedNodes(allIds);
  };

  // Recursive Tree Node Renderer
  const renderTreeNode = (node: TreeNode, depth: number = 0) => {
    const isCollapsed = collapsedNodes.has(node.id);
    const hasChildren = Boolean(node.children && node.children.length > 0);
    const isRoot = depth === 0;

    return (
      <div key={node.id} className="flex flex-col items-center">
        {/* Node Card */}
        <div
          className={`w-72 sm:w-80 rounded-2xl p-4 transition-all relative z-10 border ${
            isRoot
              ? 'bg-gradient-to-b from-[#111C35] to-[#0A1224] border-solar-gold/40 shadow-gold-glow'
              : 'bg-[#0B1426]/95 hover:bg-[#111C35] border-white/[0.08] hover:border-white/[0.2] shadow-xl'
          }`}
        >
          {/* Top Bar: Role/Rank & Status */}
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-slate-300">
                L{depth} • {node.leadershipLevel?.replace('_', ' ') || 'MEMBER'}
              </span>
            </div>
            <GlassBadge
              variant={node.status === 'ACTIVE' ? 'gold' : 'neutral'}
              size="sm"
            >
              {node.status}
            </GlassBadge>
          </div>

          {/* Member Name & Email */}
          <div className="space-y-0.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs sm:text-sm font-bold text-white font-display truncate">
                {node.name}
              </h4>
              {node.activePlan && node.activePlan !== 'None' && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-400 font-extrabold border border-amber-400/25">
                  {node.activePlan}
                </span>
              )}
            </div>
            <p className="text-[11px] font-mono text-slate-400 truncate">{node.email}</p>
          </div>

          {/* Referral Code & Points */}
          <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono">
            <div>
              <span className="text-slate-500 text-[9px] block">REF CODE</span>
              <span className="text-solar-gold font-bold">{node.referralCode || 'N/A'}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 text-[9px] block">POINTS</span>
              <span className="text-white font-bold">{node.points || 100} PTS</span>
            </div>
          </div>

          {/* MLM Team Metrics Grid */}
          <div className="mt-2.5 p-2 rounded-xl bg-black/40 border border-white/[0.04] grid grid-cols-3 gap-1.5 text-center font-mono">
            <div>
              <span className="text-[9px] text-slate-400 block">DIRECTS</span>
              <span className="text-xs font-bold text-solar-gold font-mono-num">
                {node.directCount}
              </span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 block">TEAM</span>
              <span className="text-xs font-bold text-white font-mono-num">
                {node.totalTeamCount || node.directCount}
              </span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 block">TURNOVER</span>
              <span className="text-xs font-bold text-emerald-400 font-mono-num truncate block">
                ${node.teamVolume || 0}
              </span>
            </div>
          </div>

          {/* Actions on Node */}
          <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono">
            <Link
              href={`/admin/users/${node.id}`}
              className="text-slate-400 hover:text-solar-gold transition-colors flex items-center gap-1"
            >
              <span>360° Profile</span>
              <ExternalLink className="w-3 h-3" />
            </Link>

            {!isRoot && (
              <button
                onClick={() => {
                  setCurrentRootId(node.id);
                  loadTree(node.id);
                }}
                className="text-solar-gold hover:underline font-bold"
              >
                Focus Tree Here
              </button>
            )}

            {hasChildren && (
              <button
                onClick={() => toggleNode(node.id)}
                className="flex items-center gap-1 px-2 py-1 rounded bg-white/[0.05] hover:bg-white/[0.1] text-slate-200"
              >
                {isCollapsed ? (
                  <>
                    <ChevronRight className="w-3 h-3 text-solar-gold" />
                    <span>Expand ({node.children?.length})</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                    <span>Collapse</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Downline Children Branch */}
        {hasChildren && !isCollapsed && (
          <div className="flex flex-col items-center w-full">
            {/* Vertical connector line downwards */}
            <div className="w-0.5 h-8 bg-solar-gold/40" />

            {/* Horizontal branch bar across siblings */}
            <div className="flex justify-center relative pt-2">
              <div className="flex gap-8 relative">
                {node.children!.map((child) => renderTreeNode(child, depth + 1))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-solar-gold/10 border border-solar-gold/25 text-solar-gold text-xs font-semibold">
            <GitFork className="w-3.5 h-3.5" />
            Genealogy Tree Visualizer
          </div>
          <h1 className="text-2xl font-bold font-display text-white mt-1">
            MLM Network Genealogy Tree
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Inspect downline sponsorship structures, network depth levels, and team turnover volumes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-white text-xs font-mono flex items-center gap-1.5 transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5 text-solar-gold" />
            <span>Expand All</span>
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-white text-xs font-mono flex items-center gap-1.5 transition-colors"
          >
            <Minimize2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Collapse All</span>
          </button>
          <button
            onClick={handleResetToMaster}
            className="px-3.5 py-1.5 rounded-xl bg-solar-gold hover:bg-amber-400 text-[#050B18] text-xs font-mono font-bold flex items-center gap-1.5 shadow-gold-glow transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Master Root</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <GlassCard elevation={1} className="p-4 rounded-2xl border-white/[0.08]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search member to set as tree root (Name, Email, or Referral Code)..."
                className="w-full pl-10 pr-4 py-2 rounded-xl glass-input border-white/[0.08] text-white text-xs font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-solar-gold to-solar-amber text-[#050B18] font-bold text-xs font-mono shadow-gold-glow transition-all"
            >
              {searching ? 'Finding...' : 'Jump to Member'}
            </button>
          </form>

          <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
            <span>Visual Depth:</span>
            {[2, 3, 4, 6].map((depth) => (
              <button
                key={depth}
                onClick={() => setMaxDepthFilter(depth)}
                className={`px-2.5 py-1 rounded-lg border transition-colors ${
                  maxDepthFilter === depth
                    ? 'bg-solar-gold/20 text-solar-gold border-solar-gold/40 font-bold'
                    : 'bg-white/[0.03] text-slate-400 border-white/[0.06] hover:text-white'
                }`}
              >
                {depth} Levels
              </button>
            ))}
          </div>
        </div>

        {searchError && (
          <div className="mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono flex items-center justify-between">
            <span>{searchError}</span>
            <button onClick={handleResetToMaster} className="text-solar-gold hover:underline font-bold">
              Reset to Top Sponsor
            </button>
          </div>
        )}
      </GlassCard>

      {/* Tree Canvas / Visualizer */}
      <div className="rounded-3xl border border-white/[0.08] bg-[#050B18]/90 p-6 sm:p-10 min-h-[500px] overflow-x-auto relative">
        {loading ? (
          <div className="h-80 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-solar-gold animate-spin" />
            <p className="text-xs font-mono text-slate-400">Rendering multi-level genealogy hierarchy...</p>
          </div>
        ) : treeData ? (
          <div className="min-w-max flex justify-center py-4">
            {renderTreeNode(treeData)}
          </div>
        ) : (
          <div className="h-80 flex flex-col items-center justify-center space-y-3">
            <GitFork className="w-8 h-8 text-slate-500" />
            <p className="text-xs font-mono text-slate-400">No genealogy tree found.</p>
            <button
              onClick={handleResetToMaster}
              className="px-4 py-2 rounded-xl bg-solar-gold text-[#050B18] text-xs font-mono font-bold"
            >
              Reset to Master Sponsor
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminMlmTreePage() {
  return (
    <Suspense
      fallback={
        <div className="h-96 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 text-solar-gold animate-spin" />
          <p className="text-xs font-mono text-slate-400">Loading genealogy tree console...</p>
        </div>
      }
    >
      <AdminMlmTreeContent />
    </Suspense>
  );
}

