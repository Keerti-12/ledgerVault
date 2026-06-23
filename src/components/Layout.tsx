import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, FileText, PieChart, Settings } from 'lucide-react';
import { cn } from './Button';

export const Layout: React.FC = () => {
  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-slate-50 shadow-xl overflow-hidden relative">
      
      {/* Header */}
      <header className="bg-white px-5 py-4 flex items-center justify-between border-b border-slate-100 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="GharCash Logo" className="w-8 h-8 object-contain" />
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">GharCash</h1>
            <span className="text-xs text-slate-500 font-medium tracking-wide">EVERY RUPEE. EVERY ENTRY. EVERY TIME.</span>
          </div>
        </div>
        
        </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-20 p-5 scroll-smooth">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="absolute bottom-0 w-full bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center z-10 pb-safe">
        <NavItem to="/dashboard" icon={<Home size={22} />} label="Home" />
        <NavItem to="/history" icon={<FileText size={22} />} label="History" />
        <NavItem to="/reports" icon={<PieChart size={22} />} label="Reports" />
        <NavItem to="/settings" icon={<Settings size={22} />} label="Settings" />
      </nav>
    </div>
  );
};

const NavItem = ({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all duration-200",
          isActive 
            ? "text-emerald-600 bg-emerald-50 scale-105" 
            : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
        )
      }
    >
      {icon}
      <span className="text-[10px] font-semibold mt-1">{label}</span>
    </NavLink>
  );
};
