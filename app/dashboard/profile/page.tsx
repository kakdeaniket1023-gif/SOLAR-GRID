'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from '@/components/glass/glass-toast';
import { Profile, EarningsLedgerEntry, SolarUnit } from '@/types';
import {
  User,
  Sparkles,
  DollarSign,
  TrendingUp,
  Wallet,
  Lock,
  Key,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Save,
  Clock,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  GlassCard,
  GlassButton,
  GlassBadge,
  GlassTable,
  GlassTableHeader,
  GlassTableRow,
  GlassTableCell,
} from '@/components/glass';

export default function ProfilePage() {
  const router = useRouter();
  const { user, refreshUser, logout } = useAuth();
  const { success, error } = useToast();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [revenueLedger, setRevenueLedger] = useState<EarningsLedgerEntry[]>([]);
  const [units, setUnits] = useState<SolarUnit[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Settings Tab
  const [activeSettingsTab, setActiveSettingsTab] = useState<'SETUP' | 'WALLET' | 'LOGIN_PASSWORD' | 'TX_PASSWORD'>('SETUP');

  // 1. Setup Form
  const [nameInput, setNameInput] = useState('');
  const [avatarInput, setAvatarInput] = useState('');
  const [savingSetup, setSavingSetup] = useState(false);
  const [setupSuccess, setSetupSuccess] = useState<string | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);

  // 2. Wallet Address Setup Form
  const [walletNetwork, setWalletNetwork] = useState<'USDT-TRC20' | 'USDT-BEP20' | 'USDT-ERC20'>('USDT-TRC20');
  const [walletAddressInput, setWalletAddressInput] = useState('');
  const [savingWallet, setSavingWallet] = useState(false);
  const [walletSuccess, setWalletSuccess] = useState<string | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);

  // 3. Set Login Password Form
  const [curPassword, setCurPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPw, setIsChangingPw] = useState(false);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);

  // 4. Set Transaction Password Form
  const [curTxPin, setCurTxPin] = useState('');
  const [newTxPin, setNewTxPin] = useState('');
  const [confirmTxPin, setConfirmTxPin] = useState('');
  const [isChangingTx, setIsChangingTx] = useState(false);
  const [txSuccess, setTxSuccess] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);

  const loadData = useCallback(() => {
    if (user) {
      setNameInput(user.name || '');
      setAvatarInput(user.avatarUrl || '');

      fetch('/api/auth/me')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.profile) {
            setProfile(data.profile);
            setWalletAddressInput(data.profile.walletAddress || '');
            if (data.profile.walletNetwork) {
              setWalletNetwork(data.profile.walletNetwork);
            }
          }
        })
        .catch(() => {});

      fetch('/api/dashboard/overview')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setUnits(data.units || []);
            // Filter revenue entries: credited ledger entries
            const allLedger: EarningsLedgerEntry[] = data.recentLedger || [];
            const creditsOnly = allLedger.filter(
              (l) => l.direction === 'CREDIT' || l.type.includes('EARNING') || l.type.includes('RECHARGE') || l.type.includes('COMMISSION')
            );
            setRevenueLedger(creditsOnly);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Today's earnings calculation
  const todayStr = new Date().toISOString().split('T')[0];
  const todayEarnings = units.reduce((acc, u) => {
    if (u.lastOperatedDate === todayStr) {
      return acc + (u.todayEarnedUsdt || 0);
    }
    return acc;
  }, 0);

  // 1. Handle Setup (Name & Picture)
  const handleSaveSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    setSavingSetup(true);
    setSetupSuccess(null);
    setSetupError(null);

    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameInput.trim(),
          avatarUrl: avatarInput.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSetupSuccess('Profile name and picture updated successfully.');
        success('Profile Updated', 'Your profile details have been saved.');
        refreshUser();
      } else {
        setSetupError(data.message || 'Failed to update profile.');
      }
    } catch {
      setSetupError('Network error while saving profile.');
    } finally {
      setSavingSetup(false);
    }
  };

  // 2. Handle Wallet Address Setup
  const handleSaveWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddressInput.trim() || walletAddressInput.trim().length < 10) {
      setWalletError('Please enter a valid wallet address (minimum 10 characters).');
      return;
    }

    setSavingWallet(true);
    setWalletSuccess(null);
    setWalletError(null);

    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: walletAddressInput.trim(),
          walletNetwork,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setWalletSuccess('Withdrawal wallet address successfully configured and ready for payouts.');
        success('Wallet Configured', 'This address is now available for withdrawals.');
        refreshUser();
        loadData();
      } else {
        setWalletError(data.message || 'Failed to save wallet address.');
      }
    } catch {
      setWalletError('Network error while saving wallet address.');
    } finally {
      setSavingWallet(false);
    }
  };

  // 3. Handle Set Login Password
  const handleChangeLoginPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPwError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwError('New password and confirmation password do not match.');
      return;
    }

    setIsChangingPw(true);
    setPwSuccess(null);
    setPwError(null);

    try {
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: curPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPwSuccess('Login password updated successfully.');
        success('Password Changed', 'Your login credentials have been updated.');
        setCurPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPwError(data.message || 'Failed to update login password.');
      }
    } catch {
      setPwError('Network error while updating login password.');
    } finally {
      setIsChangingPw(false);
    }
  };

  // 4. Handle Set Transaction Password
  const handleChangeTxPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4,8}$/.test(newTxPin)) {
      setTxError('Transaction password must be 4 to 8 numeric digits.');
      return;
    }

    if (newTxPin !== confirmTxPin) {
      setTxError('New transaction password and confirmation do not match.');
      return;
    }

    setIsChangingTx(true);
    setTxSuccess(null);
    setTxError(null);

    try {
      const res = await fetch('/api/auth/transaction-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: curTxPin ? 'CHANGE' : 'SET',
          transactionPassword: curTxPin || undefined,
          newTransactionPassword: newTxPin,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTxSuccess('Transaction password saved successfully. This password is required for withdrawals.');
        success('Transaction Password Set', 'Security credentials updated for withdrawals.');
        setCurTxPin('');
        setNewTxPin('');
        setConfirmTxPin('');
      } else {
        setTxError(data.message || 'Failed to set transaction password.');
      }
    } catch {
      setTxError('Network error while setting transaction password.');
    } finally {
      setIsChangingTx(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. TOP PROFILE HEADER */}
      <GlassCard elevation={2} className="p-6 sm:p-8 rounded-3xl border-solar-gold/40 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            {/* Profile Picture */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-solar-gold/20 border-2 border-solar-gold/50 flex items-center justify-center text-solar-gold font-extrabold text-2xl font-mono shadow-gold-glow shrink-0">
              {user?.avatarUrl ? (
                <Image src={user.avatarUrl} alt={user.name} fill className="object-cover" />
              ) : (
                <span>{user?.name ? user.name.substring(0, 2).toUpperCase() : 'SG'}</span>
              )}
            </div>

            <div className="space-y-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold font-display text-white truncate">
                {user?.name || 'Solar Member'}
              </h1>
              <p className="text-xs text-slate-400 font-mono truncate">
                {user?.email}
              </p>
              <div className="flex items-center gap-2 pt-0.5">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Referral Code:</span>
                <span className="px-2 py-0.5 rounded bg-white/[0.06] text-solar-gold text-xs font-mono font-bold">
                  {user?.referralCode}
                </span>
              </div>
            </div>
          </div>

          {/* Points Card */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#050B18]/90 border border-solar-gold/30 shadow-inner shrink-0">
            <div className="w-10 h-10 rounded-xl bg-solar-gold/15 border border-solar-gold/40 flex items-center justify-center text-solar-gold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                REWARD POINTS
              </span>
              <div className="text-2xl font-extrabold font-mono text-solar-gold text-glow-gold">
                {user?.points ?? 100}{' '}
                <span className="text-xs font-normal text-slate-400">pts</span>
              </div>
              <span className="text-[9px] text-slate-500 font-mono block">
                +2 pts per panel purchase & run
              </span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* 2. PROFILE DASHBOARD INFORMATION (Earning of the Day, Available Amount, Total Income) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Earning of the Day */}
        <GlassCard elevation={1} className="p-5 rounded-3xl border-white/[0.08] space-y-1.5 font-mono">
          <span className="text-[10px] uppercase text-slate-400 font-semibold block">
            EARNING OF THE DAY
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
            +${todayEarnings.toFixed(2)}{' '}
            <span className="text-xs font-normal text-slate-400 font-sans">USDT</span>
          </div>
          <p className="text-[10px] text-slate-500">Collected today from daily solar runs</p>
        </GlassCard>

        {/* Available Amount */}
        <GlassCard elevation={1} className="p-5 rounded-3xl border-white/[0.08] space-y-1.5 font-mono">
          <span className="text-[10px] uppercase text-slate-400 font-semibold block">
            AVAILABLE AMOUNT
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-solar-gold text-glow-gold">
            ${(user?.availableBalance || 0).toFixed(2)}{' '}
            <span className="text-xs font-normal text-slate-400 font-sans">USDT</span>
          </div>
          <p className="text-[10px] text-slate-500">Available for withdrawal or new panels</p>
        </GlassCard>

        {/* Total Income */}
        <GlassCard elevation={1} className="p-5 rounded-3xl border-white/[0.08] space-y-1.5 font-mono">
          <span className="text-[10px] uppercase text-slate-400 font-semibold block">
            TOTAL INCOME
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            ${(user?.totalEarned || 0).toFixed(2)}{' '}
            <span className="text-xs font-normal text-slate-400 font-sans">USDT</span>
          </div>
          <p className="text-[10px] text-slate-500">All-time lifetime clean energy yield</p>
        </GlassCard>
      </div>

      {/* 3. REVENUE DETAILS LIST */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h2 className="text-lg font-bold font-display text-white">
              Revenue Details
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {revenueLedger.length} Credited Transactions
          </span>
        </div>

        <GlassCard elevation={1} className="rounded-3xl border-white/[0.08] overflow-hidden">
          {revenueLedger.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 font-mono">
              No revenue transactions recorded yet. Completed solar operations and approved deposits will appear here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <GlassTable>
                <GlassTableHeader>
                  <GlassTableRow>
                    <GlassTableCell isHeader>TRANSACTION</GlassTableCell>
                    <GlassTableCell isHeader>AMOUNT</GlassTableCell>
                    <GlassTableCell isHeader>SOURCE / TYPE</GlassTableCell>
                    <GlassTableCell isHeader>DATE / TIME</GlassTableCell>
                    <GlassTableCell isHeader>STATUS</GlassTableCell>
                  </GlassTableRow>
                </GlassTableHeader>
                <tbody>
                  {revenueLedger.map((entry) => (
                    <GlassTableRow key={entry.id}>
                      <GlassTableCell>
                        <div className="space-y-0.5">
                          <span className="font-mono text-white text-xs font-bold block">
                            {entry.description || 'Account Credit'}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 block">
                            Ref: {entry.referenceId || entry.id.substring(0, 8)}
                          </span>
                        </div>
                      </GlassTableCell>
                      <GlassTableCell>
                        <strong className="font-mono text-emerald-400 text-xs font-bold">
                          +${(entry.amountUsdt || entry.amount || 0).toFixed(2)} USDT
                        </strong>
                      </GlassTableCell>
                      <GlassTableCell>
                        <span className="px-2 py-0.5 rounded bg-white/[0.06] text-solar-gold text-[10px] font-mono font-bold">
                          {entry.type.replace(/_/g, ' ')}
                        </span>
                      </GlassTableCell>
                      <GlassTableCell>
                        <span className="font-mono text-slate-400 text-[11px]">
                          {new Date(entry.createdAt).toLocaleString()}
                        </span>
                      </GlassTableCell>
                      <GlassTableCell>
                        <GlassBadge variant="emerald" size="sm">
                          {entry.direction || 'COMPLETED'}
                        </GlassBadge>
                      </GlassTableCell>
                    </GlassTableRow>
                  ))}
                </tbody>
              </GlassTable>
            </div>
          )}
        </GlassCard>
      </div>

      {/* 4. PROFILE SETTINGS */}
      <div className="space-y-4 pt-4 border-t border-white/[0.08]">
        <h2 className="text-lg font-bold font-display text-white">
          Profile Settings
        </h2>

        {/* Settings Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-white/[0.08] pb-3">
          {[
            { id: 'SETUP', label: 'Setup', icon: User },
            { id: 'WALLET', label: 'Wallet Address Setup', icon: Wallet },
            { id: 'LOGIN_PASSWORD', label: 'Set Login Password', icon: Key },
            { id: 'TX_PASSWORD', label: 'Set Transaction Password', icon: Lock },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeSettingsTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveSettingsTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                  isSelected
                    ? 'bg-solar-gold text-[#050B18] shadow-gold-glow'
                    : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: SETUP (Change Name & Profile Picture) */}
        {activeSettingsTab === 'SETUP' && (
          <GlassCard elevation={2} className="p-6 rounded-3xl border-white/[0.08] space-y-4 max-w-xl">
            <h3 className="text-sm font-bold text-white font-display">
              Setup Profile Details
            </h3>

            {setupSuccess && (
              <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{setupSuccess}</span>
              </div>
            )}

            {setupError && (
              <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{setupError}</span>
              </div>
            )}

            <form onSubmit={handleSaveSetup} className="space-y-4 font-mono text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold uppercase text-[10px]">Profile Name:</label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full glass-input border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold uppercase text-[10px]">
                  Profile Picture URL:
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  value={avatarInput}
                  onChange={(e) => setAvatarInput(e.target.value)}
                  className="w-full glass-input border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white"
                />
                <span className="text-[10px] text-slate-500 block">
                  Leave empty to use initial badge.
                </span>
              </div>

              <button
                type="submit"
                disabled={savingSetup}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-solar-gold to-solar-amber text-[#050B18] font-bold text-xs shadow-gold-glow flex items-center gap-1.5 hover:scale-105 transition-transform"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingSetup ? 'Saving...' : 'Save Profile'}</span>
              </button>
            </form>
          </GlassCard>
        )}

        {/* TAB 2: WALLET ADDRESS SETUP */}
        {activeSettingsTab === 'WALLET' && (
          <GlassCard elevation={2} className="p-6 rounded-3xl border-white/[0.08] space-y-4 max-w-xl">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white font-display">
                Wallet Address Setup
              </h3>
              <p className="text-[11px] text-slate-400 font-sans">
                Configure your destination wallet address. This address will be available for instant selection during withdrawals.
              </p>
            </div>

            {walletSuccess && (
              <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{walletSuccess}</span>
              </div>
            )}

            {walletError && (
              <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{walletError}</span>
              </div>
            )}

            <form onSubmit={handleSaveWallet} className="space-y-4 font-mono text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold uppercase text-[10px]">Select Network:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['USDT-TRC20', 'USDT-BEP20', 'USDT-ERC20'] as const).map((net) => (
                    <button
                      type="button"
                      key={net}
                      onClick={() => setWalletNetwork(net)}
                      className={`py-2 px-2 rounded-xl text-center font-bold border transition-all text-[11px] ${
                        walletNetwork === net
                          ? 'bg-solar-gold/20 border-solar-gold text-solar-gold shadow-gold-glow'
                          : 'bg-[#050B18] border-white/[0.08] text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      {net.replace('USDT-', '')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold uppercase text-[10px]">
                  USDT Destination Wallet Address:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter TRON or BSC USDT wallet address"
                  value={walletAddressInput}
                  onChange={(e) => setWalletAddressInput(e.target.value.trim())}
                  className="w-full glass-input border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white font-mono text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={savingWallet}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-solar-gold to-solar-amber text-[#050B18] font-bold text-xs shadow-gold-glow flex items-center gap-1.5 hover:scale-105 transition-transform"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingWallet ? 'Saving Wallet...' : 'Save Wallet Address'}</span>
              </button>
            </form>
          </GlassCard>
        )}

        {/* TAB 3: SET LOGIN PASSWORD */}
        {activeSettingsTab === 'LOGIN_PASSWORD' && (
          <GlassCard elevation={2} className="p-6 rounded-3xl border-white/[0.08] space-y-4 max-w-xl">
            <h3 className="text-sm font-bold text-white font-display">
              Set / Update Login Password
            </h3>

            {pwSuccess && (
              <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{pwSuccess}</span>
              </div>
            )}

            {pwError && (
              <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pwError}</span>
              </div>
            )}

            <form onSubmit={handleChangeLoginPassword} className="space-y-4 font-mono text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold uppercase text-[10px]">Current Password:</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={curPassword}
                  onChange={(e) => setCurPassword(e.target.value)}
                  className="w-full glass-input border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold uppercase text-[10px]">New Password:</label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full glass-input border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold uppercase text-[10px]">Confirm New Password:</label>
                <input
                  type="password"
                  required
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full glass-input border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white"
                />
              </div>

              <button
                type="submit"
                disabled={isChangingPw}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-solar-gold to-solar-amber text-[#050B18] font-bold text-xs shadow-gold-glow flex items-center gap-1.5 hover:scale-105 transition-transform"
              >
                <Key className="w-3.5 h-3.5" />
                <span>{isChangingPw ? 'Updating...' : 'Update Login Password'}</span>
              </button>
            </form>
          </GlassCard>
        )}

        {/* TAB 4: SET TRANSACTION PASSWORD */}
        {activeSettingsTab === 'TX_PASSWORD' && (
          <GlassCard elevation={2} className="p-6 rounded-3xl border-white/[0.08] space-y-4 max-w-xl">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white font-display">
                Set / Update Transaction Password
              </h3>
              <p className="text-[11px] text-slate-400 font-sans">
                This transaction password is required to authorize all future USDT withdrawals.
              </p>
            </div>

            {txSuccess && (
              <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{txSuccess}</span>
              </div>
            )}

            {txError && (
              <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{txError}</span>
              </div>
            )}

            <form onSubmit={handleChangeTxPassword} className="space-y-4 font-mono text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold uppercase text-[10px]">
                  Current Transaction Password (if previously set):
                </label>
                <input
                  type="password"
                  placeholder="Leave empty if setting for the first time"
                  value={curTxPin}
                  onChange={(e) => setCurTxPin(e.target.value)}
                  className="w-full glass-input border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white font-mono text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold uppercase text-[10px]">
                  New Transaction Password (4–8 numeric digits):
                </label>
                <input
                  type="password"
                  required
                  placeholder="e.g. 123456"
                  value={newTxPin}
                  onChange={(e) => setNewTxPin(e.target.value)}
                  className="w-full glass-input border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white font-mono text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold uppercase text-[10px]">
                  Confirm Transaction Password:
                </label>
                <input
                  type="password"
                  required
                  placeholder="Confirm 4–8 digit code"
                  value={confirmTxPin}
                  onChange={(e) => setConfirmTxPin(e.target.value)}
                  className="w-full glass-input border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white font-mono text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={isChangingTx}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-solar-gold to-solar-amber text-[#050B18] font-bold text-xs shadow-gold-glow flex items-center gap-1.5 hover:scale-105 transition-transform"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{isChangingTx ? 'Saving...' : 'Save Transaction Password'}</span>
              </button>
            </form>
          </GlassCard>
        )}

        {/* LOGOUT BUTTON */}
        <div className="pt-4">
          <button
            onClick={() => logout()}
            className="px-6 py-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-mono font-bold flex items-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out of Account</span>
          </button>
        </div>
      </div>
    </div>
  );
}
