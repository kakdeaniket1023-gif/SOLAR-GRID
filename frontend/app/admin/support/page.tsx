'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SupportTicket } from '@/types';
import { Send, CheckCircle2 } from 'lucide-react';

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [adminReply, setAdminReply] = useState('');

  const loadData = useCallback(async () => {
    try {
      const res = await fetch('/api/support/tickets');
      const data = await res.json();
      if (data.success && data.tickets) {
        setTickets(data.tickets);
        if (data.tickets.length > 0) {
          setSelectedTicket((prev) =>
            prev ? data.tickets.find((t: SupportTicket) => t.id === prev.id) || data.tickets[0] : data.tickets[0]
          );
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSendAdminReply = async () => {
    if (!selectedTicket || !adminReply.trim()) return;

    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          message: adminReply.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAdminReply('');
        loadData();
      }
    } catch {
      // ignore
    }
  };

  const handleResolveTicket = async (ticketId: string) => {
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId,
          status: 'RESOLVED',
        }),
      });

      const data = await res.json();
      if (data.success) {
        loadData();
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold font-display text-white">Operations Support Desk Dispatch</h1>
        <p className="text-xs text-slate-400">
          Review member tickets, provide technical inverter assistance, and manage inquiry resolutions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Ticket List */}
        <div className="lg:col-span-5 glass-1 rounded-3xl border-white/[0.08] p-4 space-y-3 shadow-xl">
          <div className="text-xs font-mono font-bold text-slate-400 uppercase px-2 py-1">
            Incoming Member Tickets ({tickets.length})
          </div>

          <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1 font-mono text-xs">
            {tickets.map((t) => {
              const isSelected = selectedTicket?.id === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'bg-[#111E38] border-solar-gold/60 text-white shadow-gold-glow'
                      : 'bg-[#050B18]/70 border-white/[0.06] text-slate-300 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{t.userName || t.userId}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                        t.status === 'RESOLVED'
                          ? 'bg-solar-gold/15 text-solar-gold border-solar-gold/30'
                          : t.status === 'IN_PROGRESS'
                          ? 'bg-solar-blue/15 text-solar-blue border-solar-blue/30'
                          : 'bg-solar-amber/20 text-solar-amber border-solar-amber/30'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200 truncate">{t.subject}</h4>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>{t.category}</span>
                    <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Conversation Thread */}
        <div className="lg:col-span-7 glass-1 rounded-3xl border-white/[0.08] p-6 flex flex-col h-[600px] justify-between shadow-xl">
          {selectedTicket ? (
            <>
              {/* Header */}
              <div className="border-b border-white/[0.08] pb-4 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono text-slate-400">
                    INQUIRY #{selectedTicket.id} • {selectedTicket.userName || selectedTicket.userId} ({selectedTicket.userEmail || ''})
                  </div>
                  <h3 className="text-base font-bold text-white">{selectedTicket.subject}</h3>
                </div>

                {selectedTicket.status !== 'RESOLVED' && (
                  <button
                    onClick={() => handleResolveTicket(selectedTicket.id)}
                    className="px-3 py-1.5 rounded-xl bg-solar-gold/20 hover:bg-solar-gold/30 border border-solar-gold/40 text-solar-gold font-mono font-bold text-xs flex items-center gap-1.5 shadow-gold-glow"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Mark Resolved
                  </button>
                )}
              </div>

              {/* Messages Thread */}
              <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 font-mono text-xs">
                {(selectedTicket.messages || []).map((msg) => {
                  const isAdmin = msg.senderRole === 'SUPER_ADMIN';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-1">
                        <span className="font-bold text-white">{msg.senderName}</span>
                        <span>•</span>
                        <span className={isAdmin ? 'text-solar-gold' : 'text-solar-blue'}>
                          {msg.senderRole}
                        </span>
                        <span>•</span>
                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div
                        className={`p-3.5 rounded-2xl max-w-md text-xs leading-relaxed ${
                          isAdmin
                            ? 'bg-solar-gold/15 border border-solar-gold/40 text-white rounded-br-none'
                            : 'bg-[#050B18] border border-white/[0.08] text-slate-200 rounded-bl-none'
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Dispatch */}
              <div className="pt-4 border-t border-white/[0.08] flex gap-2">
                <input
                  type="text"
                  value={adminReply}
                  onChange={(e) => setAdminReply(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendAdminReply()}
                  placeholder="Dispatch official operational response..."
                  className="flex-1 glass-input border-white/[0.08] rounded-xl px-4 py-2.5 text-xs text-white font-mono"
                />
                <button
                  onClick={handleSendAdminReply}
                  className="p-2.5 rounded-xl bg-solar-gold hover:bg-amber-400 text-[#050B18] font-bold shadow-gold-glow transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 font-mono text-xs">
              Select a ticket to inspect
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
