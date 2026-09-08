'use client';

import React, { useState } from 'react';
import {
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Search,
  Package,
  Shield,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';
import { GlassCard } from '@/frontend/glass';

export default function AdminClawbackDeskPage() {
  const [orderId, setOrderId] = useState('');
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [orderData, setOrderData] = useState<any | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [refundReason, setRefundReason] = useState('Customer returned equipment within 30-day satisfaction window');
  const [processingRefund, setProcessingRefund] = useState(false);
  const [refundResult, setRefundResult] = useState<any | null>(null);
  const [refundError, setRefundError] = useState<string | null>(null);

  const handleSearchOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;

    setLoadingOrder(true);
    setSearchError(null);
    setOrderData(null);
    setRefundResult(null);
    setRefundError(null);

    try {
      const res = await fetch(`/api/orders/${orderId.trim()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Order not found');
      }

      setOrderData(data.data);
    } catch (err: any) {
      setSearchError(err.message);
    } finally {
      setLoadingOrder(false);
    }
  };

  const handleExecuteClawback = async () => {
    if (!orderData) return;

    setProcessingRefund(true);
    setRefundError(null);
    setRefundResult(null);

    try {
      const res = await fetch(`/api/orders/${orderData.id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: refundReason }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Clawback execution failed');
      }

      setRefundResult(data);
      setOrderData({ ...orderData, status: 'REFUNDED' });
    } catch (err: any) {
      setRefundError(err.message);
    } finally {
      setProcessingRefund(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <GlassCard elevation={1} className="p-6 rounded-3xl border-white/[0.08] bg-[#0B1426]">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-400/10 border border-rose-400/25 text-rose-400 text-xs font-semibold">
            <RotateCcw className="w-3.5 h-3.5" />
            Compliance Enforcement
          </div>
          <h1 className="text-2xl font-bold font-display text-white mt-2">
            Refund & Commission Clawback Desk
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl">
            When a customer equipment order is refunded or cancelled, direct-selling regulations mandate the automated reversal and debit of all upline commissions generated from that order.
          </p>
        </div>
      </GlassCard>

      {/* Order Search Bar */}
      <GlassCard elevation={1} className="p-6 rounded-3xl border-white/[0.08] bg-[#0B1426]">
        <form onSubmit={handleSearchOrder} className="space-y-4">
          <label className="text-xs font-bold text-white uppercase tracking-wider">
            Lookup Order ID to Refund & Clawback
          </label>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="Enter order ID (e.g. ord-12345...)"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full bg-black/40 border border-white/[0.08] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 font-mono focus:border-solar-gold/50 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loadingOrder}
              className="px-5 py-2.5 rounded-2xl bg-solar-gold hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors shrink-0 disabled:opacity-50"
            >
              {loadingOrder ? 'Searching...' : 'Inspect Order'}
            </button>
          </div>
          {searchError && (
            <div className="text-xs text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{searchError}</span>
            </div>
          )}
        </form>
      </GlassCard>

      {/* Order & Commissions Inspection View */}
      {orderData && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Order Details */}
          <GlassCard elevation={1} className="lg:col-span-6 p-6 rounded-3xl border-white/[0.08] bg-[#0B1426] space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-solar-gold" />
                <h3 className="text-sm font-bold text-white">Order #{orderData.orderNo}</h3>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  orderData.status === 'PAID'
                    ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
                    : orderData.status === 'REFUNDED'
                    ? 'bg-rose-400/10 text-rose-400 border border-rose-400/20'
                    : 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                }`}
              >
                {orderData.status}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-slate-400">Order ID:</span>
                <span className="font-mono text-slate-300">{orderData.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-slate-400">Total Price:</span>
                <span className="font-mono font-bold text-white">${orderData.totalAmount.toFixed(2)} USDT</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-slate-400">Volume (PV):</span>
                <span className="font-mono text-solar-gold font-bold">{orderData.totalPv} PV</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-slate-400">Buyer ID:</span>
                <span className="font-mono text-slate-300">{orderData.userId.substring(0, 12)}...</span>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-1.5 pt-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Items</div>
              {orderData.items?.map((item: any) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl bg-black/40 border border-white/[0.04] flex items-center justify-between text-xs"
                >
                  <span className="text-slate-200">{item.productName || 'Solar Item'} (x{item.qty})</span>
                  <span className="font-mono text-slate-400">${item.unitPrice?.toFixed(2)} USDT</span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Commissions & Clawback Trigger */}
          <GlassCard elevation={1} className="lg:col-span-6 p-6 rounded-3xl border-white/[0.08] bg-[#0B1426] space-y-4">
            <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
              <TrendingDown className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-bold text-white">Commissions Subject to Clawback</h3>
            </div>

            {orderData.commissions && orderData.commissions.length > 0 ? (
              <div className="space-y-2">
                {orderData.commissions.map((comm: any) => (
                  <div
                    key={comm.id}
                    className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-white">Level {comm.level} Override ({comm.rate}%)</div>
                      <div className="text-[11px] text-slate-400">Beneficiary: {comm.beneficiaryName || comm.beneficiaryId.substring(0, 8)}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-solar-gold">${comm.amount.toFixed(2)} USDT</div>
                      <div className={`text-[10px] font-semibold ${comm.status === 'CLAWED_BACK' ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {comm.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No commissions active for this order.</p>
            )}

            {/* Clawback Action Form */}
            {orderData.status === 'PAID' ? (
              <div className="space-y-3 pt-3 border-t border-white/[0.06]">
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-medium">Clawback Reason</label>
                  <input
                    type="text"
                    required
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-400/50"
                  />
                </div>

                <button
                  onClick={handleExecuteClawback}
                  disabled={processingRefund}
                  className="w-full py-3 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{processingRefund ? 'Executing Clawback...' : 'Execute Order Refund & Commission Clawback'}</span>
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-xs text-slate-400">
                Order is already {orderData.status}. No active commissions to claw back.
              </div>
            )}

            {refundResult && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Clawback Executed Successfully</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  {refundResult.message}
                </p>
              </div>
            )}

            {refundError && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{refundError}</span>
              </div>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  );
}
