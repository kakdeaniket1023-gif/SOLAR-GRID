'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/frontend/contexts/auth-context';
import { Product, Order } from '@/types';
import {
  ShoppingBag,
  Sun,
  Layers,
  BatteryCharging,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Plus,
  Minus,
  ArrowRight,
  Sparkles,
  Zap,
} from 'lucide-react';
import { GlassCard } from '@/frontend/glass';

export default function SolarShopPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [orderQty, setOrderQty] = useState(1);
  const [shippingAddress, setShippingAddress] = useState({
    street: '124 Clean Energy Way',
    city: 'Phoenix',
    state: 'AZ',
    postalCode: '85001',
    country: 'United States',
  });
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProducts(data.data || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categories = ['ALL', 'Solar Equipment', 'Panels', 'Inverters', 'Storage'];

  const filteredProducts = products.filter((p) => {
    if (selectedCategory === 'ALL') return true;
    return p.category.toLowerCase().includes(selectedCategory.toLowerCase());
  });

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setSubmittingOrder(true);
    setError(null);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ productId: selectedProduct.id, qty: orderQty }],
          shippingAddress,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to place order');
      }

      setCreatedOrder(data.data);
    } catch (err: any) {
      setError(err.message || 'Failed to submit order');
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!createdOrder) return;
    setPaymentProcessing(true);
    setError(null);

    try {
      const res = await fetch(`/api/orders/${createdOrder.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'PAY' }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Payment simulation failed');
      }

      setPaymentSuccessMessage(data.message);
      setCreatedOrder({ ...createdOrder, status: 'PAID' });
    } catch (err: any) {
      setError(err.message || 'Payment simulation error');
    } finally {
      setPaymentProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <GlassCard elevation={1} className="p-6 sm:p-8 rounded-3xl border-white/[0.07] bg-[#0D0E15] relative overflow-hidden">
        <div className="space-y-3 relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-semibold">
            <ShoppingBag className="w-3.5 h-3.5" />
            Certified Clean Energy Hardware
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Solar Equipment <span className="text-amber-400">Direct Shop</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Order certified tier-1 solar photovoltaic panels, smart micro-inverters, and home battery storage. Every order generates Personal Volume (PV) and triggers instant 2-tier direct-selling commissions for your sponsor upline.
          </p>
        </div>
      </GlassCard>

      {/* Category Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              selectedCategory === cat
                ? 'bg-amber-400 text-black shadow-sm'
                : 'bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-zinc-300'
            }`}
          >
            {cat === 'ALL' ? 'All Products' : cat}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-80 rounded-3xl bg-white/[0.02] border border-white/[0.05] animate-pulse" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <GlassCard elevation={1} className="p-12 text-center rounded-3xl border-white/[0.07] space-y-3">
          <p className="text-sm text-zinc-400">No solar equipment found in this category.</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <GlassCard
              key={product.id}
              elevation={1}
              className="rounded-3xl border-white/[0.07] p-5 flex flex-col justify-between group hover:border-amber-400/30 transition-all bg-[#0D0E15]"
            >
              <div className="space-y-4">
                <div className="h-44 rounded-2xl bg-black/50 border border-white/[0.05] flex items-center justify-center relative overflow-hidden group-hover:bg-amber-400/5 transition-colors">
                  {product.category.includes('Storage') ? (
                    <BatteryCharging className="w-16 h-16 text-amber-400/80" />
                  ) : product.category.includes('Inverter') ? (
                    <Cpu className="w-16 h-16 text-sky-400/80" />
                  ) : (
                    <Sun className="w-16 h-16 text-amber-400/80" />
                  )}
                  <div className="absolute top-3 left-3 px-2 py-0.5 rounded-lg bg-black/70 border border-white/10 text-[10px] font-mono text-zinc-300">
                    SKU: {product.sku}
                  </div>
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-lg bg-amber-400/10 border border-amber-400/25 text-[10px] font-mono font-bold text-amber-400">
                    {product.commissionableValue} PV
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                    {product.category}
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>
                </div>
              </div>

              <div className="pt-5 border-t border-white/[0.06] mt-4 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Retail Price</div>
                  <div className="text-xl font-bold font-mono text-white">
                    ${product.retailPrice.toFixed(2)} <span className="text-xs text-zinc-400 font-sans font-normal">USDT</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedProduct(product);
                    setOrderQty(1);
                    setCreatedOrder(null);
                    setPaymentSuccessMessage(null);
                    setError(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <ShoppingBag className="w-3.5 h-3.5 fill-black" />
                  <span>Order Now</span>
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Order Checkout Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl bg-[#0F1017] border border-white/[0.1] p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold text-white">Checkout Equipment Order</h2>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-xs text-zinc-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!createdOrder ? (
              <form onSubmit={handlePlaceOrder} className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-white">{selectedProduct.name}</div>
                    <div className="text-xs text-zinc-400">Unit Price: ${selectedProduct.retailPrice.toFixed(2)} USDT · {selectedProduct.commissionableValue} PV</div>
                  </div>

                  {/* Quantity selector */}
                  <div className="flex items-center gap-2 bg-black/50 border border-white/10 rounded-xl p-1">
                    <button
                      type="button"
                      onClick={() => setOrderQty(Math.max(1, orderQty - 1))}
                      className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center font-mono text-xs font-bold text-white">
                      {orderQty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setOrderQty(orderQty + 1)}
                      className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-zinc-300 font-medium">Shipping Street Address</label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.street}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                    className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-amber-400/50 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-zinc-300 font-medium">City</label>
                    <input
                      type="text"
                      required
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                      className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-amber-400/50 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-zinc-300 font-medium">Postal / ZIP Code</label>
                    <input
                      type="text"
                      required
                      value={shippingAddress.postalCode}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
                      className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-amber-400/50 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-400/5 border border-amber-400/15 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-zinc-400">Total Order Amount</div>
                    <div className="text-lg font-bold font-mono text-white">
                      ${(selectedProduct.retailPrice * orderQty).toFixed(2)} USDT
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-amber-400 font-medium">Volume Credit</div>
                    <div className="text-sm font-bold font-mono text-amber-400">
                      +{selectedProduct.commissionableValue * orderQty} PV
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submittingOrder}
                  className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {submittingOrder ? 'Submitting Order...' : 'Confirm & Place Order'}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400">Order Number:</span>
                    <span className="text-xs font-mono font-bold text-amber-400">#{createdOrder.orderNo}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400">Status:</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20">
                      {createdOrder.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400">Total Amount:</span>
                    <span className="text-sm font-bold font-mono text-white">${createdOrder.totalAmount.toFixed(2)} USDT</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400">Commissionable PV:</span>
                    <span className="text-xs font-mono text-amber-400 font-bold">+{createdOrder.totalPv} PV</span>
                  </div>
                </div>

                {paymentSuccessMessage ? (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs space-y-2">
                    <div className="flex items-center gap-2 font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Order Paid & Commissions Distributed!</span>
                    </div>
                    <p className="text-[11px] text-zinc-300 leading-relaxed">
                      {paymentSuccessMessage}. Your personal PV has been credited and Level 1 (10%) and Level 2 (5%) direct selling overrides have been distributed to your upline.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      In production, payment is routed to our verified payment gateway via USDT (TRC-20) or card. Click below to simulate gateway payment completion and commission distribution.
                    </p>

                    <button
                      onClick={handleSimulatePayment}
                      disabled={paymentProcessing}
                      className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                      <Zap className="w-4 h-4 fill-black" />
                      <span>{paymentProcessing ? 'Processing Gateway Webhook...' : 'Simulate Payment (Gateway Webhook)'}</span>
                    </button>
                  </div>
                )}

                <button
                  onClick={() => setSelectedProduct(null)}
                  className="w-full py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 font-medium text-xs transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
