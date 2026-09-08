'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/frontend/contexts/auth-context';
import { Order } from '@/types';
import {
  Package,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { GlassCard } from '@/frontend/glass';

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  useEffect(() => {
    fetch('/api/orders')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setOrders(data.data || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const viewOrderDetails = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();
      if (data.success) {
        setSelectedOrder(data.data);
      }
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <GlassCard elevation={1} className="p-6 sm:p-8 rounded-3xl border-white/[0.07] bg-[#0D0E15]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-semibold">
              <Package className="w-3.5 h-3.5" />
              Order Management
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              My Equipment <span className="text-amber-400">Orders</span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400">
              Track your clean energy product purchases, PV accumulation, and commission distribution history.
            </p>
          </div>

          <Link
            href="/dashboard/shop"
            className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs inline-flex items-center gap-2 transition-all self-start sm:self-center"
          >
            <ShoppingBag className="w-4 h-4 fill-black" />
            <span>Order Equipment</span>
          </Link>
        </div>
      </GlassCard>

      {/* Orders List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-white/[0.02] border border-white/[0.05] animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <GlassCard elevation={1} className="p-12 text-center rounded-3xl border-white/[0.07] space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mx-auto text-amber-400">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No Orders Placed Yet</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Browse our certified hardware catalog and place your first solar equipment order to earn Personal Volume (PV).
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard/shop"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs transition-colors"
            >
              <ShoppingBag className="w-4 h-4 fill-black" />
              <span>Browse Solar Shop</span>
            </Link>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <GlassCard
              key={order.id}
              elevation={1}
              className="p-5 rounded-2xl border-white/[0.07] bg-[#0D0E15] flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-white/[0.12] transition-colors"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-bold text-white">#{order.orderNo}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      order.status === 'PAID'
                        ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
                        : order.status === 'REFUNDED'
                        ? 'bg-rose-400/10 text-rose-400 border border-rose-400/20'
                        : 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
                <div className="text-xs text-zinc-400">
                  Date: {new Date(order.createdAt).toLocaleString()} · {order.items?.length || 1} product(s)
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6">
                <div className="text-left sm:text-right">
                  <div className="text-base font-bold font-mono text-white">
                    ${order.totalAmount.toFixed(2)} USDT
                  </div>
                  <div className="text-xs text-amber-400 font-mono font-medium">
                    +{order.totalPv} PV
                  </div>
                </div>

                <button
                  onClick={() => viewOrderDetails(order.id)}
                  className="px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-300 text-xs font-medium inline-flex items-center gap-1 transition-colors"
                >
                  <span>Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl bg-[#0F1017] border border-white/[0.1] p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div>
                <h2 className="text-base font-bold text-white">Order #{selectedOrder.orderNo}</h2>
                <div className="text-xs text-zinc-400">Placed on {new Date(selectedOrder.createdAt).toLocaleString()}</div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-xs text-zinc-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {/* Status & Totals */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Status</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    selectedOrder.status === 'PAID'
                      ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
                      : selectedOrder.status === 'REFUNDED'
                      ? 'bg-rose-400/10 text-rose-400 border border-rose-400/20'
                      : 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                  }`}
                >
                  {selectedOrder.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Total Price</span>
                <span className="text-sm font-bold font-mono text-white">${selectedOrder.totalAmount.toFixed(2)} USDT</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Total PV</span>
                <span className="text-xs font-mono font-bold text-amber-400">+{selectedOrder.totalPv} PV</span>
              </div>
              {selectedOrder.paymentGatewayRef && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">Gateway Ref</span>
                  <span className="text-[11px] font-mono text-zinc-300 truncate max-w-[200px]">
                    {selectedOrder.paymentGatewayRef}
                  </span>
                </div>
              )}
            </div>

            {/* Line Items */}
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">Ordered Equipment</div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {selectedOrder.items?.map((item: any) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-black/40 border border-white/[0.05] flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white">{item.productName || 'Solar Equipment'}</div>
                      <div className="text-[10px] text-zinc-400">Qty: {item.qty} × ${item.unitPrice?.toFixed(2)} USDT</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold font-mono text-white">
                        ${((item.unitPrice || 0) * (item.qty || 1)).toFixed(2)}
                      </div>
                      <div className="text-[10px] text-amber-400 font-mono">
                        +{item.pvAmount} PV
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Commissions Generated */}
            {selectedOrder.commissions && selectedOrder.commissions.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-white/[0.08]">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Direct Commissions Triggered ({selectedOrder.commissions.length})</span>
                </div>
                <div className="space-y-1.5">
                  {selectedOrder.commissions.map((comm: any) => (
                    <div
                      key={comm.id}
                      className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-white">Level {comm.level} Override ({comm.rate}%)</span>
                        <div className="text-[10px] text-zinc-400">Beneficiary: {comm.beneficiaryName || comm.beneficiaryId.substring(0, 8)}</div>
                      </div>
                      <div className="text-right font-mono font-bold text-emerald-400">
                        +${comm.amount.toFixed(2)} USDT
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setSelectedOrder(null)}
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
