"use client";

import { useState } from "react";
import { 
  LayoutDashboard, 
  MapPin, 
  MessageSquare, 
  Trophy, 
  Settings,
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";

const TABS = [
  { id: "summary", label: "Summary", icon: LayoutDashboard },
  { id: "stations", label: "Stations", icon: MapPin },
  { id: "moderation", label: "Moderation", icon: MessageSquare },
  { id: "leaderboard", label: "Leaderboard", icon: Trophy },
  { id: "config", label: "Config", icon: Settings },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("summary");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        "glass border-r border-white/5 transition-all duration-300 z-50",
        sidebarOpen ? "w-64" : "w-20"
      )}>
        <div className="p-6 flex items-center justify-between">
          {sidebarOpen && <h2 className="font-black italic text-xl">ADMIN <span className="text-primary">CP</span></h2>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-white/5 rounded-lg">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="px-3 mt-6 flex flex-col gap-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-xl transition-all",
                  isActive ? "bg-primary text-white shadow-neon" : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon size={20} />
                {sidebarOpen && <span className="font-medium">{tab.label}</span>}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-slate-950 to-slate-950">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold capitalize">{activeTab}</h1>
            <p className="text-slate-400 text-sm">Manage your Fuel Finder Dhaka instance</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="glass px-4 py-2 rounded-xl text-sm font-medium border-emerald-500/20 text-emerald-400">
              System Live
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <GlassCard interactive>
            <div className="text-slate-400 text-xs font-bold uppercase mb-1">Total Users</div>
            <div className="text-3xl font-black">12,482</div>
            <div className="text-emerald-400 text-[10px] mt-2 font-bold">+12% this week</div>
          </GlassCard>
          <GlassCard interactive>
            <div className="text-slate-400 text-xs font-bold uppercase mb-1">Active Now</div>
            <div className="text-3xl font-black text-emerald-400">842</div>
            <div className="text-slate-500 text-[10px] mt-2 font-bold">Stations updated 5m ago</div>
          </GlassCard>
          <GlassCard interactive>
            <div className="text-slate-400 text-xs font-bold uppercase mb-1">Reports</div>
            <div className="text-3xl font-black text-rose-500">14</div>
            <div className="text-rose-400/50 text-[10px] mt-2 font-bold">Needs attention</div>
          </GlassCard>
          <GlassCard interactive>
            <div className="text-slate-400 text-xs font-bold uppercase mb-1">Broadcasts</div>
            <div className="text-3xl font-black">2</div>
            <div className="text-slate-500 text-[10px] mt-2 font-bold">Active globally</div>
          </GlassCard>
        </div>

        {/* Tab-specific Content Placeholder */}
        <GlassCard className="min-h-[400px] flex items-center justify-center border-dashed border-2 border-white/5">
          <div className="text-center">
            <div className="text-slate-600 mb-4 flex justify-center"><LayoutDashboard size={48} /></div>
            <h3 className="text-xl font-bold text-slate-400">Section {activeTab} in Development</h3>
            <p className="text-slate-600 text-sm max-w-xs mx-auto mt-2">
              The {activeTab} panel is being connected to the real-time Firebase backend.
            </p>
          </div>
        </GlassCard>
      </main>
    </div>
  );
}
