'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  Sparkles,
  CheckCircle2,
  Eye,
} from 'lucide-react';
import { PanelImageConfig } from '@/types';
import { GlassCard } from '@/frontend/glass';

export default function AdminPanelImagesManagerPage() {
  const [images, setImages] = useState<PanelImageConfig[]>([]);
  const [editingPlan, setEditingPlan] = useState<PanelImageConfig | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [captionInput, setCaptionInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/panel-images');
      const data = await res.json();
      if (data.success && data.images) {
        setImages(data.images);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEdit = (config: PanelImageConfig) => {
    setEditingPlan(config);
    setImageUrlInput(config.imageUrl);
    setCaptionInput(config.caption);
    setSuccessMsg(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    setIsSaving(true);

    try {
      const res = await fetch('/api/admin/panel-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planCode: editingPlan.planCode,
          imageUrl: imageUrlInput,
          caption: captionInput,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Image configuration for ${editingPlan.planCode} saved successfully.`);
        loadData();
        setTimeout(() => {
          setEditingPlan(null);
          setSuccessMsg(null);
        }, 1800);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <GlassCard elevation={2} className="p-6 rounded-3xl border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-solar-gold/15 text-solar-gold border border-solar-gold/30 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            AI ASSETS & VISUAL REGISTRY
          </div>
          <h1 className="text-2xl font-bold font-display text-white">Solar Panel Image Asset Manager</h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Manage high-resolution 3D renders for P1, P2, and P3 solar arrays across user dashboards and operations.
          </p>
        </div>

        <span className="text-xs font-mono text-solar-gold bg-solar-gold/10 border border-solar-gold/30 px-3 py-1.5 rounded-2xl shadow-gold-glow">
          3 Active Production Assets
        </span>
      </GlassCard>

      {/* 3 Panel Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {images.map((img) => (
          <GlassCard
            key={img.planCode}
            elevation={1}
            className="rounded-3xl border-white/[0.08] overflow-hidden flex flex-col justify-between shadow-2xl p-0"
          >
            {/* Image Box */}
            <div className="relative aspect-square w-full bg-black border-b border-white/[0.08]">
              <Image
                src={img.imageUrl}
                alt={img.planCode}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute top-3 left-3 px-3 py-1 rounded-xl bg-[#050B18]/85 backdrop-blur-md border border-solar-gold/60 text-xs font-mono font-extrabold text-solar-gold shadow-gold-glow">
                {img.planCode} ARRAY
              </div>
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-xl bg-[#050B18]/85 backdrop-blur-md border border-solar-blue/60 text-xs font-mono font-bold text-solar-blue">
                {img.aspectRatio}
              </div>
            </div>

            {/* Info */}
            <div className="p-5 space-y-4 font-mono text-xs flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-white font-display mb-1">{img.planCode} Photovoltaic Asset</h3>
                <p className="text-xs text-slate-400">{img.caption}</p>
                <div className="p-2.5 rounded-xl bg-[#050B18]/90 border border-white/[0.08] text-[11px] text-slate-300 truncate mt-3 select-all">
                  {img.imageUrl}
                </div>
              </div>

              <button
                onClick={() => handleEdit(img)}
                className="w-full py-2.5 rounded-2xl bg-[#050B18] hover:bg-[#0B1426] border border-white/[0.08] text-white font-bold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4 text-solar-gold" />
                Configure Asset
              </button>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Edit Modal */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 bg-[#050B18]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl glass-1 border border-solar-gold/50 p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h3 className="text-base font-bold text-white font-display">Configure {editingPlan.planCode} Asset</h3>
              <button onClick={() => setEditingPlan(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-slate-400 uppercase text-[10px] block mb-1">Image Asset Path / Public URL</label>
                <input
                  type="text"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl glass-input border-white/[0.08] text-white outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 uppercase text-[10px] block mb-1">Caption / Visual Descriptor</label>
                <textarea
                  value={captionInput}
                  onChange={(e) => setCaptionInput(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-xl glass-input border-white/[0.08] text-white outline-none"
                />
              </div>

              {successMsg && (
                <div className="p-2.5 rounded-2xl bg-solar-gold/15 border border-solar-gold/40 text-solar-gold text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="flex-1 py-2.5 rounded-2xl bg-[#0B1426] border border-white/[0.08] text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-solar-gold to-solar-amber text-[#050B18] font-extrabold text-xs shadow-gold-glow transition-all"
                >
                  {isSaving ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
