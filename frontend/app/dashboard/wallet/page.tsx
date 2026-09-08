'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/frontend/contexts/auth-context';
import { KycSubmission, PayoutMethod, KycStatus } from '@/types';
import {
  Wallet,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowDownToLine,
  Plus,
  ExternalLink,
  Lock,
  DollarSign,
  FileCheck,
  Building,
} from 'lucide-react';
import { GlassCard } from '@/frontend/glass';

export default function WalletAndKycPage() {
  const { user } = useAuth();
  const [kycStatus, setKycStatus] = useState<KycStatus>(user?.kycStatus || 'UNVERIFIED');
  const [submission, setSubmission] = useState<KycSubmission | null>(null);
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>([]);
  const [loading, setLoading] = useState(true);

  // KYC Form State
  const [docType, setDocType] = useState('PASSPORT');
  const [docNumber, setDocNumber] = useState('');
  const [frontUrl, setFrontUrl] = useState('');
  const [backUrl, setBackUrl] = useState('');
  const [submittingKyc, setSubmittingKyc] = useState(false);
  const [kycMessage, setKycMessage] = useState<string | null>(null);

  // Payout Method Form State
  const [payoutType, setPayoutType] = useState<'USDT_TRC20' | 'USDT_BEP20' | 'BANK_WIRE'>('USDT_TRC20');
  const [walletAddress, setWalletAddress] = useState('');
  const [bankDetails, setBankDetails] = useState({ bankName: '', accountNumber: '', swiftCode: '' });
  const [submittingMethod, setSubmittingMethod] = useState(false);
  const [methodMessage, setMethodMessage] = useState<string | null>(null);

  // Withdrawal Form State
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedMethodId, setSelectedMethodId] = useState('');
  const [transactionPin, setTransactionPin] = useState('');
  const [submittingWithdrawal, setSubmittingWithdrawal] = useState(false);
  const [withdrawalMessage, setWithdrawalMessage] = useState<string | null>(null);
  const [withdrawalError, setWithdrawalError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/kyc')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setKycStatus(data.data.kycStatus);
          setSubmission(data.data.submission);
          setPayoutMethods(data.data.payoutMethods || []);
          if (data.data.payoutMethods?.length > 0) {
            setSelectedMethodId(data.data.payoutMethods[0].id);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingKyc(true);
    setKycMessage(null);

    try {
      const res = await fetch('/api/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docType,
          docNumber,
          frontUrl,
          backUrl: backUrl || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to submit KYC');
      }

      setKycStatus('PENDING');
      setSubmission(data.data);
      setKycMessage('KYC documents submitted successfully. Verification takes 1–24 hours.');
    } catch (err: any) {
      setKycMessage(`Error: ${err.message}`);
    } finally {
      setSubmittingKyc(false);
    }
  };

  const handleAddPayoutMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingMethod(true);
    setMethodMessage(null);

    const details =
      payoutType === 'BANK_WIRE'
        ? bankDetails
        : { walletAddress };

    try {
      const res = await fetch('/api/kyc/methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: payoutType,
          details,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to add payout method');
      }

      setPayoutMethods([...payoutMethods, data.data]);
      setSelectedMethodId(data.data.id);
      setMethodMessage('Payout destination saved successfully.');
      setWalletAddress('');
    } catch (err: any) {
      setMethodMessage(`Error: ${err.message}`);
    } finally {
      setSubmittingMethod(false);
    }
  };

  const handleWithdrawalRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingWithdrawal(true);
    setWithdrawalError(null);
    setWithdrawalMessage(null);

    const chosenMethod = payoutMethods.find((m) => m.id === selectedMethodId);
    const dest = chosenMethod?.details?.walletAddress || chosenMethod?.details?.accountNumber || '';

    try {
      const res = await fetch('/api/withdrawals/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountUsdt: parseFloat(withdrawAmount),
          walletAddress: dest,
          network: chosenMethod?.type === 'USDT_BEP20' ? 'USDT-BEP20' : 'USDT-TRC20',
          pin: transactionPin,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Withdrawal failed');
      }

      setWithdrawalMessage(data.message || 'Withdrawal request submitted for compliance review');
      setWithdrawAmount('');
      setTransactionPin('');
    } catch (err: any) {
      setWithdrawalError(err.message || 'Withdrawal submission failed');
    } finally {
      setSubmittingWithdrawal(false);
    }
  };

  const isKycVerified = kycStatus === 'VERIFIED';

  return (
    <div className="space-y-6">
      {/* Header */}
      <GlassCard elevation={1} className="p-6 sm:p-8 rounded-3xl border-white/[0.07] bg-[#0D0E15]">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            Financial Compliance & Payout Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Wallet & <span className="text-amber-400">KYC Verification</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl">
            In compliance with international direct-selling anti-money laundering (AML) and financial regulations, all commission withdrawals require identity verification (KYC) and a verified payout destination.
          </p>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: KYC Verification Section */}
        <div className="lg:col-span-6 space-y-6">
          <GlassCard elevation={1} className="p-6 rounded-3xl border-white/[0.07] bg-[#0D0E15] space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-amber-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Identity Verification (KYC)
                </h2>
              </div>

              {kycStatus === 'VERIFIED' ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full border border-emerald-400/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verified
                </span>
              ) : kycStatus === 'PENDING' ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
                  <Clock className="w-3.5 h-3.5" />
                  Under Review
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-400 bg-rose-400/10 px-2.5 py-1 rounded-full border border-rose-400/20">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Action Required
                </span>
              )}
            </div>

            {isKycVerified ? (
              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Account Verified</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Your identity verification has been approved by compliance. You are authorized to request instant commission withdrawals.
                </p>
              </div>
            ) : kycStatus === 'PENDING' ? (
              <div className="p-5 rounded-2xl bg-amber-400/10 border border-amber-400/20 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <Clock className="w-4 h-4" />
                  <span>KYC Application Pending Review</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Your documents ({submission?.docType || 'ID'} #{submission?.docNumber || '***'}) are currently being reviewed by our compliance officer. You will be notified once verified.
                </p>
              </div>
            ) : (
              <form onSubmit={handleKycSubmit} className="space-y-4">
                {kycMessage && (
                  <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-amber-400">
                    {kycMessage}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-300 font-medium">Document Type</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-amber-400/50 focus:outline-none"
                  >
                    <option value="PASSPORT">International Passport</option>
                    <option value="NATIONAL_ID">National ID Card</option>
                    <option value="DRIVERS_LICENSE">Driver&apos;s License</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-300 font-medium">Document Identification Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. A12345678"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-amber-400/50 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-300 font-medium">Front Document Photo / Scan URL</label>
                  <input
                    type="url"
                    required
                    placeholder="https://... / id-front.jpg"
                    value={frontUrl}
                    onChange={(e) => setFrontUrl(e.target.value)}
                    className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-amber-400/50 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-300 font-medium">Back Photo URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://... / id-back.jpg"
                    value={backUrl}
                    onChange={(e) => setBackUrl(e.target.value)}
                    className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-amber-400/50 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingKyc}
                  className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs transition-colors disabled:opacity-50"
                >
                  {submittingKyc ? 'Submitting Documents...' : 'Submit KYC for Review'}
                </button>
              </form>
            )}
          </GlassCard>

          {/* Payout Destinations */}
          <GlassCard elevation={1} className="p-6 rounded-3xl border-white/[0.07] bg-[#0D0E15] space-y-4">
            <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
              <Building className="w-5 h-5 text-amber-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Payout Destinations
              </h2>
            </div>

            {payoutMethods.length > 0 ? (
              <div className="space-y-2">
                {payoutMethods.map((m) => (
                  <div
                    key={m.id}
                    className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{m.type}</span>
                        {m.isVerified ? (
                          <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-400/20">
                            Verified
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-400 font-semibold bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                            Pending Verification
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-zinc-400 truncate max-w-[240px] mt-0.5">
                        {m.details?.walletAddress || m.details?.accountNumber || 'Configured'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-400">No payout method added yet.</p>
            )}

            {/* Add Method Form */}
            <form onSubmit={handleAddPayoutMethod} className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={payoutType}
                  onChange={(e) => setPayoutType(e.target.value as any)}
                  className="bg-black/40 border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400/50 focus:outline-none"
                >
                  <option value="USDT_TRC20">USDT (TRC-20)</option>
                  <option value="USDT_BEP20">USDT (BEP-20)</option>
                </select>

                <input
                  type="text"
                  required
                  placeholder="Wallet Address..."
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="bg-black/40 border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-amber-400/50 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submittingMethod}
                className="w-full py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-200 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Payout Destination</span>
              </button>
            </form>
          </GlassCard>
        </div>

        {/* Right Column: Commission Payout & Withdrawal Form */}
        <div className="lg:col-span-6 space-y-6">
          <GlassCard elevation={1} className="p-6 rounded-3xl border-white/[0.07] bg-[#0D0E15] space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-amber-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Request Commission Payout
                </h2>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-zinc-400 uppercase">Available</div>
                <div className="text-lg font-bold font-mono text-white">
                  ${(user?.availableBalance || 0).toFixed(2)} USDT
                </div>
              </div>
            </div>

            {/* Compliance Gate Warning if KYC is not verified */}
            {!isKycVerified ? (
              <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-3">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                  <Lock className="w-4 h-4" />
                  <span>Withdrawals Gated by KYC Compliance</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Direct selling regulations strictly prohibit payout distributions to unverified accounts. Please complete the identity verification form to unlock withdrawal requests.
                </p>
              </div>
            ) : (
              <form onSubmit={handleWithdrawalRequest} className="space-y-4">
                {withdrawalError && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{withdrawalError}</span>
                  </div>
                )}

                {withdrawalMessage && (
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{withdrawalMessage}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-300 font-medium">Select Payout Destination</label>
                  <select
                    value={selectedMethodId}
                    onChange={(e) => setSelectedMethodId(e.target.value)}
                    className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-amber-400/50 focus:outline-none"
                  >
                    {payoutMethods.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.type} - {m.details?.walletAddress || 'Verified Destination'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-300 font-medium">Withdrawal Amount (USDT)</label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      required
                      min="10"
                      step="0.01"
                      placeholder="Minimum 10.00"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full bg-black/40 border border-white/[0.08] rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white font-mono focus:border-amber-400/50 focus:outline-none"
                    />
                  </div>
                  <div className="text-[10px] text-zinc-500 flex justify-between">
                    <span>Min: 10 USDT</span>
                    <span>Max Available: ${(user?.availableBalance || 0).toFixed(2)} USDT</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-300 font-medium">Transaction Security PIN</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter 6-digit PIN"
                    value={transactionPin}
                    onChange={(e) => setTransactionPin(e.target.value)}
                    className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:border-amber-400/50 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingWithdrawal || payoutMethods.length === 0}
                  className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  <span>{submittingWithdrawal ? 'Submitting Request...' : 'Submit Withdrawal Request'}</span>
                </button>
              </form>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
