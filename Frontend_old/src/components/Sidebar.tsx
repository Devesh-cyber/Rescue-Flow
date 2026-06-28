import { LayoutDashboard, CheckSquare, Settings as SettingsIcon, Zap, HelpCircle } from "lucide-react";
import { ViewType } from "../types";

interface SidebarProps {
  currentView: ViewType;
  setView: (view: ViewType) => void;
  onRescueClick: () => void;
  userProfile: {
    name: string;
    plan: string;
    avatarUrl: string;
  };
}

export default function Sidebar({ currentView, setView, onRescueClick, userProfile }: SidebarProps) {
  return (
    <aside className="hidden md:flex flex-col h-screen w-64 border-r border-outline-variant bg-[#0A0A0A] flex-shrink-0">
      <div className="flex flex-col h-full py-8 px-5">
        {/* Branding Logo - Inspired by the rotating-45 square icon in white circle */}
        <div className="mb-10 px-1">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center flex-shrink-0">
              <div className="w-4 h-4 bg-black rotate-45"></div>
            </div>
            <div>
              <span className="text-xl font-black italic tracking-tight text-white font-display">
                Monolith /
              </span>
              <p className="text-[10px] font-mono tracking-[0.3em] text-primary uppercase font-bold">
                RESCUE FLOW
              </p>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 space-y-2">
          <button
            onClick={() => setView("dashboard")}
            className={`w-full flex items-center justify-between px-4 py-3.5 transition-all duration-200 text-left font-sans ${
              currentView === "dashboard"
                ? "text-black font-bold bg-primary"
                : "text-on-surface-variant hover:text-white hover:bg-white/5"
            }`}
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard size={18} className={currentView === "dashboard" ? "text-black" : "text-white/40"} />
              <span className="text-xs uppercase tracking-widest font-semibold">Dashboard</span>
            </div>
            {currentView === "dashboard" && <span className="w-1.5 h-1.5 bg-black rounded-full"></span>}
          </button>

          <button
            onClick={() => setView("tasks")}
            className={`w-full flex items-center justify-between px-4 py-3.5 transition-all duration-200 text-left font-sans ${
              currentView === "tasks" || currentView === "analyzing"
                ? "text-black font-bold bg-primary"
                : "text-on-surface-variant hover:text-white hover:bg-white/5"
            }`}
          >
            <div className="flex items-center gap-3">
              <CheckSquare size={18} className={currentView === "tasks" || currentView === "analyzing" ? "text-black" : "text-white/40"} />
              <span className="text-xs uppercase tracking-widest font-semibold">Tasks</span>
            </div>
            {(currentView === "tasks" || currentView === "analyzing") && <span className="w-1.5 h-1.5 bg-black rounded-full"></span>}
          </button>

          <button
            onClick={() => setView("settings")}
            className={`w-full flex items-center justify-between px-4 py-3.5 transition-all duration-200 text-left font-sans ${
              currentView === "settings"
                ? "text-black font-bold bg-primary"
                : "text-on-surface-variant hover:text-white hover:bg-white/5"
            }`}
          >
            <div className="flex items-center gap-3">
              <SettingsIcon size={18} className={currentView === "settings" ? "text-black" : "text-white/40"} />
              <span className="text-xs uppercase tracking-widest font-semibold">Settings</span>
            </div>
            {currentView === "settings" && <span className="w-1.5 h-1.5 bg-black rounded-full"></span>}
          </button>
        </nav>

        {/* Pro Tips Sidebar Section (Custom Artistic Styling) */}
        <div className="mb-6 p-4 bg-[#111111] border border-outline-variant">
          <div className="flex items-center gap-2 mb-3 text-primary font-mono font-bold text-[10px] tracking-widest uppercase">
            <HelpCircle size={14} />
            <span>EXECUTIVE GUIDES</span>
          </div>
          <ul className="space-y-2 text-[11px] text-white/60 font-sans">
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>Clear PDF scans yield 40% faster analysis.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>Include grading rubrics for priority scaling.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>Zip large asset folders before uploading.</span>
            </li>
          </ul>
        </div>

        {/* Profile Card & Rescue Button */}
        <div className="mt-auto border-t border-outline-variant pt-5">
          <button
            onClick={onRescueClick}
            className="w-full bg-transparent hover:bg-primary border border-white/20 hover:border-primary hover:text-black text-white py-3 px-4 font-mono font-bold text-xs uppercase tracking-widest active:scale-95 transition-all duration-200 cursor-pointer mb-5"
          >
            <span>[ Rescue Mode ]</span>
          </button>

          <div className="flex items-center gap-3 px-1">
            <div className="w-10 h-10 rounded-full border border-white/20 overflow-hidden flex-shrink-0">
              <img
                className="w-full h-full object-cover"
                src={userProfile.avatarUrl}
                alt={userProfile.name}
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate font-sans">
                {userProfile.name}
              </p>
              <p className="text-[9px] text-white/40 font-mono uppercase tracking-wider">
                {userProfile.plan}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
