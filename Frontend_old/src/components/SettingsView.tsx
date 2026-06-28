import React from "react";
import { User, Shield, Key, Sliders, RefreshCw, Eye, Sparkles, Check } from "lucide-react";
import { RescuePlan } from "../types";

interface SettingsViewProps {
  userProfile: {
    name: string;
    plan: string;
    avatarUrl: string;
  };
  setUserProfile: (profile: any) => void;
  onResetToPreset: (presetType: "strategy" | "campus") => void;
  plan: RescuePlan;
}

export default function SettingsView({
  userProfile,
  setUserProfile,
  onResetToPreset,
  plan
}: SettingsViewProps) {
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserProfile({ ...userProfile, name: e.target.value });
  };

  const handlePlanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setUserProfile({ ...userProfile, plan: e.target.value });
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto w-full space-y-12 font-sans bg-[#0A0A0A] text-white">
      {/* Settings Title */}
      <div>
        <h1 className="text-4xl font-black font-display italic text-white leading-tight">Settings</h1>
        <p className="text-sm text-white/50 mt-2 font-sans font-light">
          Configure focus schedules, active architectural presets, and tactical rescue parameters.
        </p>
      </div>

      <div className="space-y-8">
        {/* Profile Settings */}
        <section className="bg-[#111111] border border-white/10 p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-2.5 text-primary font-mono font-bold text-xs uppercase tracking-widest">
            <User size={14} />
            <h3>Profile Identity</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest">
                Full Name
              </label>
              <input
                type="text"
                value={userProfile.name}
                onChange={handleNameChange}
                className="w-full bg-[#050505] border border-white/10 px-4 py-3 text-xs text-white uppercase tracking-wider focus:border-primary outline-none transition-all font-mono font-bold"
                placeholder="Alex Rivera"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest">
                Subscription Tier
              </label>
              <select
                value={userProfile.plan}
                onChange={handlePlanChange}
                className="w-full bg-[#050505] border border-white/10 px-4 py-3 text-xs text-white uppercase tracking-wider focus:border-primary outline-none transition-all font-mono font-bold cursor-pointer"
              >
                <option value="Pro Plan">Pro Plan</option>
                <option value="Executive Suite">Executive Suite</option>
                <option value="Enterprise Tier">Enterprise Tier</option>
              </select>
            </div>
          </div>
        </section>

        {/* Quick Presets / Screens Demo Selection */}
        <section className="bg-[#111111] border border-white/10 p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-2.5 text-primary font-mono font-bold text-xs uppercase tracking-widest">
            <Sliders size={14} />
            <h3>Layout Presets & Demo Context</h3>
          </div>
          <p className="text-xs text-white/60 leading-relaxed font-sans font-light">
            Instantly switch between the two distinct high-stakes productivity presets shown in the system layouts:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <button
              type="button"
              onClick={() => {
                onResetToPreset("strategy");
                alert("Preset switched to 'Strategy Presentation' style!");
              }}
              className="flex flex-col items-start p-5 text-left border border-white/10 bg-[#050505] hover:border-primary cursor-pointer group transition-all"
            >
              <span className="text-xs font-bold text-primary group-hover:underline font-mono uppercase tracking-widest">Preset A: Strategy Presentation</span>
              <span className="text-[10px] text-white/50 mt-2 font-sans font-light">Focus task: "Finalize Q4 Strategy Presentation" with 3 pipeline tasks.</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onResetToPreset("campus");
                alert("Preset switched to 'AI Campus Assistant' style!");
              }}
              className="flex flex-col items-start p-5 text-left border border-white/10 bg-[#050505] hover:border-primary cursor-pointer group transition-all"
            >
              <span className="text-xs font-bold text-primary group-hover:underline font-mono uppercase tracking-widest">Preset B: AI Campus Assistant</span>
              <span className="text-[10px] text-white/50 mt-2 font-sans font-light">Focus task: "Implement Vector Search Architecture" with 7 sequenced roadmap steps.</span>
            </button>
          </div>
        </section>

        {/* API Secrets Informational panel */}
        <section className="bg-[#111111] border border-white/10 p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-2.5 text-primary font-mono font-bold text-xs uppercase tracking-widest">
            <Key size={14} />
            <h3>Secrets & Gemini Integration</h3>
          </div>
          
          <div className="p-5 bg-white/5 border border-white/10 text-xs text-white/70 leading-relaxed space-y-3 font-sans font-light">
            <div className="flex items-center gap-2 text-primary font-mono font-bold uppercase tracking-widest text-[10px]">
              <Sparkles size={12} />
              <span>Recommended Approach Configured</span>
            </div>
            <p>
              Your app's Gemini API requests are optimized to route securely through server-side handlers using the recommended <strong>@google/genai</strong> client pattern.
            </p>
            <p>
              API Keys are isolated on the server to prevent leakage. You can supply or view secrets dynamically inside the workspace configuration dashboard.
            </p>
          </div>
        </section>

        {/* Security & Data Guidelines info */}
        <section className="bg-[#111111] border border-white/10 p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-2.5 text-primary font-mono font-bold text-xs uppercase tracking-widest">
            <Shield size={14} />
            <h3>Security Guidelines</h3>
          </div>
          <div className="flex items-start gap-3.5 text-xs text-white/60 leading-relaxed font-sans font-light">
            <div className="w-5 h-5 bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <Check size={12} />
            </div>
            <p>All focus session tracking, active metrics, custom roadmaps, and profile credentials are bound and saved securely client-side in standard localStorage container vectors.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
