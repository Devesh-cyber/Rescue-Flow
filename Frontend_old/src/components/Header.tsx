import { Search, Bell, HelpCircle, User, Zap, Menu, ShieldAlert } from "lucide-react";
import { ViewType } from "../types";

interface HeaderProps {
  currentView: ViewType;
  setView: (view: ViewType) => void;
  onRescueClick: () => void;
  userProfile: {
    name: string;
    plan: string;
    avatarUrl: string;
  };
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onMobileMenuToggle?: () => void;
}

export default function Header({
  currentView,
  setView,
  onRescueClick,
  userProfile,
  searchTerm,
  setSearchTerm,
  onMobileMenuToggle
}: HeaderProps) {
  return (
    <header className="w-full h-20 border-b border-outline-variant bg-[#0A0A0A] sticky top-0 z-40 flex items-center">
      <div className="flex justify-between items-center w-full px-6 max-w-7xl mx-auto h-full">
        {/* Mobile menu trigger */}
        <div className="flex items-center gap-3 md:hidden">
          <button
            onClick={onMobileMenuToggle}
            className="p-2 text-on-surface-variant hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10"
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center flex-shrink-0">
              <div className="w-2.5 h-2.5 bg-black rotate-45"></div>
            </div>
            <span className="text-sm font-black italic tracking-tight text-white font-display">
              Monolith
            </span>
          </div>
        </div>

        {/* Search input (Desktop) */}
        <div className="hidden md:flex items-center gap-4 flex-1 max-w-md">
          <div className="relative w-full">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40">
              <Search size={16} />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#111111] border border-white/10 focus:border-primary py-2 pl-10 pr-4 text-xs tracking-widest text-white uppercase placeholder:text-white/30 focus:ring-0 focus:outline-none transition-all font-mono"
              placeholder="SEARCH THE VOID..."
            />
          </div>
        </div>

        {/* Right Nav Options */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1">
            <button className="p-2 text-white/60 hover:text-primary transition-all relative hover:bg-white/5">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full"></span>
            </button>
            <button 
              onClick={() => setView("settings")}
              className="p-2 text-white/60 hover:text-primary transition-all hover:bg-white/5"
            >
              <HelpCircle size={18} />
            </button>
          </div>

          <div className="h-6 w-[1px] bg-white/10 hidden sm:block"></div>

          {/* Quick Active Trigger */}
          <button
            onClick={onRescueClick}
            className="hidden sm:flex bg-primary hover:brightness-110 text-black font-mono font-bold text-xs uppercase tracking-widest px-4 py-2 transition-all duration-150 active:scale-95 items-center gap-1.5 cursor-pointer"
          >
            <Zap size={12} fill="currentColor" />
            <span>[ Rescue ]</span>
          </button>

          {/* User Profile display (sm+) */}
          <div className="flex items-center gap-3 pl-1">
            <span className="text-right hidden sm:block">
              <p className="font-bold text-xs text-white font-sans leading-none">
                {userProfile.name}
              </p>
              <p className="text-[9px] text-white/40 font-mono uppercase tracking-wider mt-1">
                {userProfile.plan}
              </p>
            </span>
            <div className="w-10 h-10 rounded-full border border-white/20 overflow-hidden flex-shrink-0">
              <img
                className="w-full h-full object-cover"
                src={userProfile.avatarUrl}
                alt={userProfile.name}
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
