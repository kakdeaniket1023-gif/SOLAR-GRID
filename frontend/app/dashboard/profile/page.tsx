'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/frontend/contexts/auth-context';
import { useToast } from '@/frontend/glass/glass-toast';
import { Profile, EarningsLedgerEntry, SolarUnit } from '@/types';
import {
  User,
  Sparkles,
  Wallet,
  Lock,
  Key,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Save,
  Clock,
  Zap,
  TrendingUp,
  Shield,
  Layers,
} from 'lucide-react';

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
  const [phoneInput, setPhoneInput] = useState('');
  const [countryInput, setCountryInput] = useState('');
  const [savingSetup, setSavingSetup] = useState(false);
  const [setupSuccess, setSetupSuccess] = useState<string | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);

  // 2. Wallet Address Setup Form
  const [walletNetwork, setWalletNetwork] = useState<'USDT-TRC20' | 'USDT-BEP20' | 'USDT-ERC20'>('USDT-TRC20');
  const [walletAddressInput, setWalletAddressInput] = useState('');
  const [walletPinInput, setWalletPinInput] = useState('');
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
      setPhoneInput(user.phone || '');
      setCountryInput(user.country || '');

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
            setRevenueLedger(data.recentLedger || []);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 1. Handle Setup (Name, Phone, Country)
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
          phone: phoneInput.trim(),
          country: countryInput.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSetupSuccess('Profile information updated successfully.');
        success('Profile Saved', 'Your account details have been updated.');
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

    if (!walletPinInput || walletPinInput.trim().length < 4) {
      setWalletError('Please enter your transaction password to confirm this change.');
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
          transactionPin: walletPinInput.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setWalletSuccess('Withdrawal wallet address successfully updated.');
        success('Wallet Saved', 'Your payout address has been configured.');
        setWalletPinInput('');
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
      setPwError('New password and confirmation do not match.');
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
          action: 'SET',
          currentPassword: curTxPin,
          transactionPassword: newTxPin,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTxSuccess('Transaction password configured successfully.');
        success('Transaction Password Set', 'Your security password has been updated.');
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
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.07] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Account & Settings
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Manage your personal profile, payout wallet, passwords, and security preferences.
          </p>
        </div>

        <button
          onClick={() => logout()}
          className="px-4 py-2 rounded-xl bg-white/[0.03] hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 text-zinc-400 text-xs font-medium border border-white/[0.06] flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Member Overview Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#0D0E15] border border-white/[0.07]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400 font-bold text-xl font-mono">
              {user?.name ? user.name.substring(0, 2).toUpperCase() : 'SG'}
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white">{user?.name || 'Solar Member'}</h2>
              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                <span className="font-mono">{user?.email}</span>
                <span>·</span>
                <span>Code: <strong className="text-amber-400 font-mono">{user?.referralCode || 'N/A'}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] text-center min-w-[100px]">
              <span className="text-[10px] uppercase text-zinc-500 block">Balance</span>
              <strong className="text-white font-mono text-sm">${(user?.availableBalance || 0).toFixed(2)}</strong>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] text-center min-w-[100px]">
              <span className="text-[10px] uppercase text-zinc-500 block">Earned</span>
              <strong className="text-emerald-400 font-mono text-sm">${(user?.totalEarned || 0).toFixed(2)}</strong>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] text-center min-w-[100px]">
              <span className="text-[10px] uppercase text-zinc-500 block">Points</span>
              <strong className="text-amber-400 font-mono text-sm">{user?.points ?? 100}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Tabs & Forms */}
      <div className="space-y-4">
        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-x-auto">
          {[
            { id: 'SETUP', label: 'Personal Info', icon: User },
            { id: 'WALLET', label: 'Payout Wallet', icon: Wallet },
            { id: 'LOGIN_PASSWORD', label: 'Change Password', icon: Key },
            { id: 'TX_PASSWORD', label: 'Transaction PIN', icon: Lock },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSettingsTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                  activeSettingsTab === tab.id
                    ? 'bg-amber-400 text-black font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0D0E15] border border-white/[0.07]">
          {/* TAB 1: PERSONAL INFO */}
          {activeSettingsTab === 'SETUP' && (
            <form onSubmit={handleSaveSetup} className="space-y-5 max-w-lg text-xs">
              <h3 className="text-sm font-semibold text-white">Personal Information</h3>

              {setupError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{setupError}</span>
                </div>
              )}

              {setupSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{setupSuccess}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-zinc-300 font-medium">Full Name:</label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full rounded-xl bg-white/[0.03] border border-white/[0.08] px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-300 font-medium">Phone Number (Optional):</label>
                <input
                  type="text"
                  placeholder="+1 (555) 000-0000"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="w-full rounded-xl bg-white/[0.03] border border-white/[0.08] px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-300 font-medium">Country (Optional):</label>
                <input
                  type="text"
                  placeholder="e.g. United States"
                  value={countryInput}
                  onChange={(e) => setCountryInput(e.target.value)}
                  className="w-full rounded-xl bg-white/[0.03] border border-white/[0.08] px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                type="submit"
                disabled={savingSetup}
                className="py-2.5 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs transition-colors disabled:opacity-50"
              >
                {savingSetup ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          )}

          {/* TAB 2: PAYOUT WALLET */}
          {activeSettingsTab === 'WALLET' && (
            <form onSubmit={handleSaveWallet} className="space-y-5 max-w-lg text-xs">
              <div>
                <h3 className="text-sm font-semibold text-white">Payout Wallet Address</h3>
                <p className="text-zinc-400 mt-0.5">
                  The destination wallet address used when you request withdrawals.
                </p>
              </div>

              {walletError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{walletError}</span>
                </div>
              )}

              {walletSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{walletSuccess}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-zinc-300 font-medium">Network:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['USDT-TRC20', 'USDT-BEP20', 'USDT-ERC20'] as const).map((net) => (
                    <button
                      key={net}
                      type="button"
                      onClick={() => setWalletNetwork(net)}
                      className={`py-2 px-2 rounded-xl border text-center transition-colors ${
                        walletNetwork === net
                          ? 'bg-amber-400/10 border-amber-400 text-amber-400 font-semibold'
                          : 'bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-white'
                      }`}
                    >
                      {net.replace('USDT-', '')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-300 font-medium">Wallet Address:</label>
                <input
                  type="text"
                  required
                  placeholder="Paste TRC20 or BEP20 address"
                  value={walletAddressInput}
                  onChange={(e) => setWalletAddressInput(e.target.value)}
                  className="w-full rounded-xl bg-white/[0.03] border border-white/[0.08] px-3.5 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-300 font-medium flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Transaction Password:</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter transaction password to confirm"
                  value={walletPinInput}
                  onChange={(e) => setWalletPinInput(e.target.value)}
                  className="w-full rounded-xl bg-white/[0.03] border border-white/[0.08] px-3.5 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                />
                <span className="text-[11px] text-zinc-500 block">
                  Required to prevent unauthorized wallet changes.
                </span>
              </div>

              <button
                type="submit"
                disabled={savingWallet}
                className="py-2.5 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs transition-colors disabled:opacity-50"
              >
                {savingWallet ? 'Saving...' : 'Save Payout Wallet'}
              </button>
            </form>
          )}

          {/* TAB 3: LOGIN PASSWORD */}
          {activeSettingsTab === 'LOGIN_PASSWORD' && (
            <form onSubmit={handleChangeLoginPassword} className="space-y-5 max-w-lg text-xs">
              <h3 className="text-sm font-semibold text-white">Change Login Password</h3>

              {pwError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{pwError}</span>
                </div>
              )}

              {pwSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{pwSuccess}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-zinc-300 font-medium">Current Password:</label>
                <input
                  type="password"
                  required
                  value={curPassword}
                  onChange={(e) => setCurPassword(e.target.value)}
                  className="w-full rounded-xl bg-white/[0.03] border border-white/[0.08] px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-300 font-medium">New Password:</label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl bg-white/[0.03] border border-white/[0.08] px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-300 font-medium">Confirm New Password:</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl bg-white/[0.03] border border-white/[0.08] px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                type="submit"
                disabled={isChangingPw}
                className="py-2.5 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs transition-colors disabled:opacity-50"
              >
                {isChangingPw ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}

          {/* TAB 4: TRANSACTION PASSWORD */}
          {activeSettingsTab === 'TX_PASSWORD' && (
            <form onSubmit={handleChangeTxPassword} className="space-y-5 max-w-lg text-xs">
              <div>
                <h3 className="text-sm font-semibold text-white">Set / Update Transaction Password</h3>
                <p className="text-zinc-400 mt-0.5">
                  A numeric PIN used to authorize withdrawals and payout wallet modifications.
                </p>
              </div>

              {txError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{txError}</span>
                </div>
              )}

              {txSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{txSuccess}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-zinc-300 font-medium">Current Transaction Password (if already set):</label>
                <input
                  type="password"
                  placeholder="Leave blank if setting for the first time"
                  value={curTxPin}
                  onChange={(e) => setCurTxPin(e.target.value)}
                  className="w-full rounded-xl bg-white/[0.03] border border-white/[0.08] px-3.5 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-300 font-medium">New Transaction Password (4–8 Digits):</label>
                <input
                  type="password"
                  required
                  placeholder="e.g. 123456"
                  value={newTxPin}
                  onChange={(e) => setNewTxPin(e.target.value)}
                  className="w-full rounded-xl bg-white/[0.03] border border-white/[0.08] px-3.5 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-300 font-medium">Confirm New Transaction Password:</label>
                <input
                  type="password"
                  required
                  placeholder="Re-enter same digits"
                  value={confirmTxPin}
                  onChange={(e) => setConfirmTxPin(e.target.value)}
                  className="w-full rounded-xl bg-white/[0.03] border border-white/[0.08] px-3.5 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                type="submit"
                disabled={isChangingTx}
                className="py-2.5 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs transition-colors disabled:opacity-50"
              >
                {isChangingTx ? 'Saving...' : 'Set Transaction Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
