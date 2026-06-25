import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "../lib/utils";
import { Activity, Users, Trophy, Settings, ClipboardList, Ticket, LogIn, LogOut } from "lucide-react";
import { useStore } from "../store";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const isLeaderboard = location.pathname === "/leaderboard";
  const { currentEventId, user } = useStore();

  if (isLeaderboard) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-[var(--color-ares-bg)] text-[var(--color-ares-white)] font-sans flex flex-col select-none">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-tech-grid opacity-30 pointer-events-none mix-blend-screen" />
        <div className="absolute -top-40 -right-40 w-96 h-96 glow-purple blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 glow-teal blur-[80px] pointer-events-none" />
        
        {/* Top Header */}
        <header className="h-16 border-b border-[rgba(45,35,79,0.5)] bg-[var(--color-ares-bg)]/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-8 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[var(--color-ares-teal)] flex items-center justify-center rounded-lg shadow-[0_0_15px_rgba(41,152,170,0.4)]">
              <span className="text-black font-black text-xl">A</span>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight uppercase leading-none">Ares Elite</h1>
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[var(--color-ares-teal)]">Sports Vision Lab</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-[var(--color-ares-muted)]">Active Event</p>
              <p className="text-sm font-semibold text-[var(--color-ares-teal)]">NEUROTRAINER GUST CHALLENGE</p>
            </div>
            <div className="h-8 w-px bg-[rgba(45,35,79,0.5)]"></div>
            <div className="flex items-center gap-2 bg-[var(--color-ares-charcoal)] px-3 py-1.5 rounded-full border border-[var(--color-ares-teal)]/30 shadow-[0_0_10px_rgba(41,152,170,0.2)]">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[11px] font-bold uppercase tracking-wider">Live Display</span>
            </div>
            <Link to="/" className="ml-4 text-xs font-bold uppercase tracking-widest text-[var(--color-ares-muted)] hover:text-white transition-colors">Exit</Link>
          </div>
        </header>
        
        <main className="flex-1 flex overflow-hidden z-10 p-6 sm:p-8">
          <div className="w-full h-full overflow-y-auto scrollbar-hide">
             {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[var(--color-ares-bg)] text-[var(--color-ares-white)] font-sans relative select-none">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-tech-grid opacity-30 pointer-events-none mix-blend-screen" />
      <div className="absolute -top-40 -right-40 w-96 h-96 glow-purple blur-[80px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 glow-teal blur-[80px] pointer-events-none" />

      {/* Top Header */}
      <header className="h-16 border-b border-ares bg-[var(--color-ares-bg)]/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-8 z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[var(--color-ares-teal)] flex items-center justify-center rounded-lg shadow-[0_0_15px_rgba(41,152,170,0.4)] hidden md:flex">
            <span className="text-black font-black text-xl">A</span>
          </div>
          <div>
             <h1 className="text-lg font-bold tracking-tight uppercase leading-none">Ares Elite</h1>
             <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[var(--color-ares-teal)]">Sports Vision Lab</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
           <div className="hidden md:block text-right">
              <p className="text-[10px] uppercase tracking-widest text-[var(--color-ares-muted)]">Active Event</p>
              <p className="text-sm font-semibold text-[var(--color-ares-teal)]">NEUROTRAINER GUST CHALLENGE</p>
           </div>
           <div className="hidden md:block h-8 w-px bg-[rgba(45,35,79,0.5)]"></div>
           <div className="flex items-center gap-2 bg-[var(--color-ares-charcoal)] px-3 py-1.5 rounded-full border border-[var(--color-ares-teal)]/30 shadow-[0_0_10px_rgba(41,152,170,0.2)]">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <span className="text-[11px] font-bold uppercase tracking-wider">Admin Mode</span>
           </div>
           <div className="h-8 w-px bg-[rgba(45,35,79,0.5)] hidden md:block"></div>
           <div className="hidden md:block">
             {user ? (
               <button
                 onClick={() => signOut(auth)}
                 className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider transition-all"
               >
                 <LogOut size={13} /> Sign Out
               </button>
             ) : (
               <Link
                 to="/auth"
                 className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-ares-teal)]/20 hover:bg-[var(--color-ares-teal)]/40 border border-[var(--color-ares-teal)]/50 text-[var(--color-ares-teal)] text-xs font-bold uppercase tracking-wider transition-all"
               >
                 <LogIn size={13} /> Sign In
               </Link>
             )}
           </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden z-10 mb-20 md:mb-0">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-[260px] lg:w-[320px] bg-[var(--color-ares-charcoal)]/80 border-r border-ares p-6 space-y-6 overflow-y-auto scrollbar-hide shrink-0 backdrop-blur-md">
           <nav className="flex-1 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-ares-teal)] mb-4">Event Control</h2>
              <NavItem to="/" icon={<Activity size={20} />} label="Dashboard" />
              <NavItem to="/register" icon={<Users size={20} />} label="Registration" />
              <NavItem to="/entry" icon={<ClipboardList size={20} />} label="Data Entry" />
              <div className="my-4 border-t border-ares"></div>
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-ares-teal)] mb-4 mt-6">Raffle</h2>
              <NavItem to="/raffle" icon={<Ticket size={20} />} label="Raffle Logger" />
              <div className="my-4 border-t border-ares"></div>
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-ares-teal)] mb-4 mt-6">Displays</h2>
              <NavItem to="/leaderboard" icon={<Trophy size={20} />} label="Live Leaderboard" />
              <div className="my-4 border-t border-ares"></div>
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-ares-teal)] mb-4 mt-6">System</h2>
              <NavItem to="/admin" icon={<Settings size={20} />} label="Admin & Exports" />
           </nav>

           {/* Sidebar Footer / User Account */}
           <div className="border-t border-ares pt-4 mt-auto">
             {user ? (
               <div className="space-y-3">
                 <div className="flex flex-col px-2">
                   <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--color-ares-muted)]">Signed In As</span>
                   <span className="text-xs text-white truncate font-semibold mt-0.5">{user.email}</span>
                 </div>
                 <button
                   onClick={() => signOut(auth)}
                   className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 hover:border-red-500/40 text-red-400 text-xs font-bold uppercase tracking-widest transition-all"
                 >
                   <LogOut size={16} />
                   <span>Sign Out</span>
                 </button>
               </div>
             ) : (
               <Link
                 to="/auth"
                 className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--color-ares-teal)]/10 hover:bg-[var(--color-ares-teal)]/20 border border-[var(--color-ares-teal)]/30 hover:border-[var(--color-ares-teal)]/50 text-[var(--color-ares-teal)] text-xs font-bold uppercase tracking-widest transition-all"
               >
                 <LogIn size={16} />
                 <span>Sign In</span>
               </Link>
             )}
           </div>
        </aside>

        {/* Dynamic Page Content */}
        <div className="flex-1 p-4 sm:p-8 overflow-y-auto scrollbar-hide flex flex-col items-center">
            <div className="w-full max-w-5xl">
                {children}
            </div>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-[var(--color-ares-bg)]/90 backdrop-blur-xl border-t border-ares z-50 flex items-center justify-around px-2 pb-safe">
        <MobileNavItem to="/" icon={<Activity size={20} />} label="Dash" />
        <MobileNavItem to="/register" icon={<Users size={20} />} label="Reg" />
        <MobileNavItem to="/entry" icon={<ClipboardList size={20} />} label="Entry" />
        <MobileNavItem to="/raffle" icon={<Ticket size={20} />} label="Raffle" />
        <MobileNavItem to="/leaderboard" icon={<Trophy size={20} />} label="Ranks" />
        <MobileNavItem to="/admin" icon={<Settings size={20} />} label="Admin" />
      </div>
    </div>
  );
}

function NavItem({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== "/" && location.pathname.startsWith(to));

  return (
    <Link
      to={to}
      className={cn(
        "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium uppercase tracking-wider text-xs",
        isActive
          ? "bg-[var(--color-ares-charcoal)] border border-[var(--color-ares-teal)]/50 text-[var(--color-ares-teal)] glow-shadow shadow-[0_0_15px_rgba(41,152,170,0.2)]"
          : "text-[var(--color-ares-muted)] hover:bg-[var(--color-ares-charcoal)]/50 hover:text-white"
      )}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

function MobileNavItem({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== "/" && location.pathname.startsWith(to));

  return (
    <Link
      to={to}
      className={cn(
        "flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300",
        isActive
          ? "text-[var(--color-ares-teal)] glow-shadow-strong"
          : "text-[var(--color-ares-muted)]"
      )}
    >
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-wider mt-1">{label}</span>
    </Link>
  );
}
