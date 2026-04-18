"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, 
  Activity, 
  Users, 
  Map as MapIcon, 
  MessageSquare, 
  Radio, 
  ChevronRight, 
  Trash2, 
  Plus, 
  Search,
  CheckCircle2,
  Clock,
  Loader2,
  ArrowUpRight,
  TrendingUp,
  ShieldAlert,
  Zap,
  Settings,
  User as UserIcon,
  MessageCircle,
  ThumbsUp,
  Brain,
  Bot,
  Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { adminService } from "@/lib/services/adminService";
import { useAdminStore } from "@/store/useAdminStore";
import { GlassCard } from "@/components/ui/GlassCard";
import { 
  query, 
  collectionGroup, 
  orderBy, 
  limit, 
  onSnapshot, 
  QuerySnapshot, 
  QueryDocumentSnapshot,
  collection,
  getDocs
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Station } from "@/types";
import { useSettingsStore } from "@/store/useSettingsStore";

type TabType = "intelligence" | "stations" | "moderation" | "community" | "control";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("intelligence");
  const { user, isAdmin, loading: authLoading } = useAuthStore();
  const { stats, logs, broadcasts, loading: dataLoading, fetchInitialData, subscribeToLiveData } = useAdminStore();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push("/");
    }
    if (isAdmin) {
      fetchInitialData();
      return subscribeToLiveData();
    }
  }, [user, isAdmin, authLoading, router, fetchInitialData, subscribeToLiveData]);

  if (authLoading || !isAdmin) {
    return (
      <div className="min-h-screen bg-nexus-bg flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-nexus-primary border-t-transparent rounded-full animate-spin shadow-neon" />
      </div>
    );
  }

  const tabs: { id: TabType; icon: any; label: string }[] = [
    { id: "intelligence", icon: Activity, label: "Intelligence" },
    { id: "stations", icon: MapIcon, label: "Stations" },
    { id: "moderation", icon: MessageSquare, label: "Moderation" },
    { id: "community", icon: Users, label: "Community" },
    { id: "control", icon: Radio, label: "Command Center" },
  ];

  return (
    <div className="min-h-screen mesh-gradient text-white flex pb-32 lg:pb-0 font-sans tracking-tight">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-80 h-screen flex-col border-r border-white/5 bg-black/40 backdrop-blur-3xl p-10 sticky top-0 z-50">
        <div className="flex items-center gap-4 mb-16 group cursor-default">
          <div className="w-12 h-12 bg-nexus-primary rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(0,242,255,0.4)] rotate-12 group-hover:rotate-0 transition-transform duration-500">
            <Shield size={28} className="text-black" />
          </div>
          <div>
            <h2 className="text-2xl font-black italic tracking-tighter uppercase leading-none nexus-glow">Admin <span className="text-nexus-primary">X</span></h2>
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40 mt-1">NEXUS CONTROL</p>
          </div>
        </div>

        <nav className="flex-1 space-y-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-5 px-8 py-5 rounded-[24px] transition-all duration-300 font-black uppercase text-[11px] tracking-[0.15em] relative group",
                  isActive 
                    ? "bg-gradient-to-r from-nexus-primary to-nexus-accent text-white shadow-[0_0_40px_rgba(0,242,255,0.3)]" 
                    : "text-white/40 hover:bg-white/5 hover:text-white"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute -left-10 w-2 h-10 bg-nexus-primary rounded-r-full shadow-neon" 
                  />
                )}
                <Icon size={20} className={cn("transition-transform", isActive ? "scale-110" : "group-hover:scale-110")} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto pt-10 border-t border-white/5">
          <button 
            onClick={() => router.push("/")}
            className="w-full py-5 rounded-2xl bg-white/5 text-[10px] font-black uppercase tracking-[0.4em] text-white/40 hover:text-nexus-primary hover:bg-white/10 transition-all flex items-center justify-center gap-3 border border-white/5"
          >
            Exit Terminal <ArrowUpRight size={14} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 lg:p-20 h-screen overflow-y-auto no-scrollbar relative">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between mb-12">
           <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-nexus-primary to-nexus-accent rounded-xl flex items-center justify-center shadow-neon rotate-12 transition-transform hover:rotate-0">
              <Shield size={20} className="text-white" />
            </div>
            <h2 className="text-xl font-black italic tracking-tighter uppercase leading-none">Admin <span className="text-nexus-primary italic">X</span></h2>
          </div>
          <div className="px-4 py-2 bg-nexus-primary/10 rounded-full border border-nexus-primary/30">
            <p className="text-[10px] font-black text-nexus-primary uppercase tracking-[0.2em]">Live Sync</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98, filter: "blur(20px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 1.02, filter: "blur(20px)" }}
            transition={{ type: "spring", damping: 30, stiffness: 150 }}
            className="w-full h-full"
          >
            {activeTab === "intelligence" && <IntelligenceTab stats={stats} logs={logs} />}
            {activeTab === "stations" && <StationsTab />}
            {activeTab === "moderation" && <ModerationTab />}
            {activeTab === "community" && <CommunityTab />}
            {activeTab === "control" && <ControlTab broadcasts={broadcasts} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Nav */}
      <nav className="lg:hidden fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] glass-premium rounded-[40px] p-3 flex justify-around items-center border border-white/10 z-50 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "p-5 rounded-[28px] transition-all duration-500",
                isActive ? "bg-gradient-to-br from-nexus-primary to-nexus-accent text-white shadow-neon scale-110" : "text-white/30 hover:text-white/60"
              )}
            >
              <Icon size={24} />
            </button>
          );
        })}
      </nav>
    </div>
  );
}

// --- TAB COMPONENTS ---

function IntelligenceTab({ stats, logs }: { stats: any; logs: any[] }) {
  return (
    <div className="space-y-12 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard label="Live Stations" value={stats?.activeStations || 0} color="emerald" icon={CheckCircle2} delay={0.1} />
        <StatCard label="Total Nodes" value={stats?.totalStations || 0} color="primary" icon={MapIcon} delay={0.2} />
        <StatCard label="Global Users" value={stats?.totalUsers || 0} color="azure" icon={Users} delay={0.3} />
        <StatCard label="Verified Logs" value={stats?.verifiedCount || 0} color="amber" icon={Activity} delay={0.4} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <GlassCard variant="nexus" className="lg:col-span-2 p-10" delay={0.5}>
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-sm font-black uppercase tracking-[0.5em] text-nexus-primary nexus-glow mb-2">System Activity Nexus</h3>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Real-time Stream Surveillance</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-nexus-primary/5 rounded-full border border-nexus-primary/20">
              <div className="w-2 h-2 bg-nexus-primary rounded-full animate-pulse shadow-neon" />
              <span className="text-[8px] font-black uppercase text-nexus-primary tracking-widest">Active Flow</span>
            </div>
          </div>
          
          <div className="space-y-6">
            {logs.length === 0 ? (
              <div className="py-20 text-center opacity-20 italic">No signals detected in the current buffer.</div>
            ) : logs.slice(0, 10).map((log) => (
              <div key={log.id} className="flex items-center gap-8 p-5 rounded-[24px] bg-white/[0.02] border border-white/5 group hover:bg-white/[0.05] hover:border-nexus-primary/20 transition-all duration-500">
                <div className="w-14 h-14 rounded-2xl bg-nexus-primary/10 flex items-center justify-center text-nexus-primary shadow-[inset_0_0_20px_rgba(0,242,255,0.1)] group-hover:scale-110 transition-transform">
                  <Activity size={24} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-white uppercase tracking-tight italic">
                    <span className="text-nexus-primary font-black underline decoration-nexus-primary/30 underline-offset-4">{log.userName || 'System'}</span> 
                    <span className="mx-2 text-white/40">triggered update on</span>
                    <span className="text-white font-black">STATION {log.stationId}</span>
                  </p>
                  <p className="text-[9px] text-white/40 font-black uppercase tracking-[0.3em] mt-2 flex items-center gap-3">
                    <Clock size={10} className="text-nexus-primary" /> Just Realized • {log.type}
                  </p>
                </div>
                <ChevronRight size={20} className="text-white/10 group-hover:text-nexus-primary group-hover:translate-x-1 transition-all" />
              </div>
            ))}
          </div>
        </GlassCard>

        <div className="space-y-10">
          <GlassCard variant="nexus" className="p-10 border-nexus-primary/20 bg-nexus-primary/5">
            <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-nexus-primary mb-6 flex items-center gap-3">
              <Shield size={16} className="nexus-glow" /> Security Status
            </h3>
            <p className="text-xs font-bold text-white leading-relaxed mb-8 uppercase tracking-tighter italic opacity-60">
              All encryption layers are operational. High-integrity data streams detected across the Dhaka grid.
            </p>
            <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/5 p-[1px]">
              <motion.div 
                animate={{ x: [-200, 400] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="w-1/2 h-full bg-nexus-primary shadow-[0_0_20px_rgba(0,242,255,0.8)] rounded-full" 
              />
            </div>
            <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
              <div>
                <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Grid Load</p>
                <p className="text-lg font-black text-white italic">42.8%</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Latency</p>
                <p className="text-lg font-black text-emerald-500 italic">14ms</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard variant="nexus" className="p-10">
             <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-white/40 mb-6 flex items-center gap-3">
              <Radio size={16} /> Signal Strength
            </h3>
            <div className="flex gap-1 items-end h-12">
              {[40, 70, 50, 90, 60, 80, 45, 75].map((h, i) => (
                <motion.div 
                  key={i}
                  animate={{ height: [`${h}%`, `${h+10}%`, `${h}%`] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                  className="flex-1 bg-gradient-to-t from-nexus-primary/10 to-nexus-primary rounded-t-sm"
                />
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color, icon: Icon, delay }: any) {
  const colors = {
    primary: "bg-gradient-to-br from-nexus-primary to-nexus-accent text-white shadow-[0_0_30px_rgba(0,242,255,0.3)]",
    emerald: "bg-[#10b981] text-white shadow-[0_0_30px_rgba(16,185,129,0.3)]",
    azure: "bg-[#3b82f6] text-white shadow-[0_0_30px_rgba(59,130,246,0.3)]",
    amber: "bg-[#f59e0b] text-white shadow-[0_0_30px_rgba(245,158,11,0.3)]"
  };
  
  return (
    <GlassCard variant="nexus" className="p-10 group hover:border-nexus-primary/40 transition-all" delay={delay} interactive>
      <div className="flex flex-col gap-6">
        <div className={cn("w-16 h-16 rounded-[22px] flex items-center justify-center group-hover:rotate-12 transition-transform duration-500", colors[color as keyof typeof colors])}>
          <Icon size={32} />
        </div>
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.4em] text-white/40 mb-2 group-hover:text-nexus-primary transition-colors">{label}</p>
          <div className="text-5xl font-black italic tracking-tighter text-white nexus-glow">{value}</div>
        </div>
      </div>
    </GlassCard>
  );
}

function StationsTab() {
  const { stations } = useAdminStore();
  const [search, setSearch] = useState("");
  
  const filteredStations = stations.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.category?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to PERMANENTLY delete ${name}?`)) {
      try {
        await adminService.deleteStation(id);
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
        <div>
          <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter mb-2 nexus-glow">Station Registry</h3>
          <p className="text-[11px] font-black uppercase text-white/30 tracking-[0.4em]">Manage Node Data & Lifecycle</p>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-nexus-primary transition-colors" size={20} />
            <input 
              type="text"
              placeholder="Filter Dhaka Grid..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-[22px] py-4 pl-14 pr-8 text-sm text-white focus:outline-none focus:ring-2 focus:ring-nexus-primary/50 transition-all w-full md:w-80 backdrop-blur-xl"
            />
          </div>
          <button className="bg-nexus-primary shadow-[0_0_30px_rgba(0,242,255,0.4)] p-4 rounded-[22px] text-black hover:scale-110 active:scale-95 transition-all duration-300">
            <Plus size={24} />
          </button>
        </div>
      </div>

      <GlassCard variant="nexus" className="p-0 overflow-hidden border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.03] border-b border-white/5">
                <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.3em] text-white/40">Node Identity</th>
                <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.3em] text-white/40">Category</th>
                <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.3em] text-white/40">Power State</th>
                <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.3em] text-white/40">Confidence</th>
                <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.3em] text-white/40 text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredStations.map((s) => (
                <tr key={s.id} className="hover:bg-nexus-primary/5 transition-all duration-500 group">
                  <td className="px-10 py-8">
                    <div className="text-base font-black text-white italic tracking-tight group-hover:text-nexus-primary transition-colors">{s.name}</div>
                    <div className="text-[10px] font-black uppercase text-white/30 tracking-widest mt-2 flex items-center gap-2">
                       <MapIcon size={12} className={cn(s.area ? "text-nexus-primary" : "text-rose-500")} /> 
                       {s.area || "Area Not Linked"}
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <span className="px-4 py-2 bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/60 border border-white/5">
                      {s.category || "General"}
                    </span>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-3">
                       <div className={cn(
                        "w-3 h-3 rounded-full relative",
                        s.status === 'active' ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.7)]' : 
                        s.status === 'inactive' ? 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.7)]' : 'bg-slate-500'
                      )}>
                        {s.status === 'active' && <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-40" />}
                      </div>
                      <span className={cn(
                        "text-[11px] font-black uppercase tracking-widest",
                        s.status === 'active' ? 'text-emerald-500' : 
                        s.status === 'inactive' ? 'text-rose-500' : 'text-slate-500'
                      )}>{s.status}</span>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-4">
                      <div className="text-sm font-black text-white">{s.confidence_score}%</div>
                      <div className="flex-1 w-24 h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${s.confidence_score}%` }}
                          className="h-full bg-nexus-primary shadow-neon" 
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                      <button className="p-3 bg-white/5 rounded-2xl text-white/40 hover:text-nexus-primary hover:bg-nexus-primary/10 hover:border-nexus-primary/30 border border-transparent transition-all">
                        <CheckCircle2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(s.id, s.name)}
                        className="p-3 bg-rose-500/10 rounded-2xl text-rose-500/40 hover:text-rose-500 hover:bg-rose-500/20 hover:border-rose-500/30 border border-transparent transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredStations.length === 0 && (
          <div className="py-32 text-center">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search size={32} className="text-white/20" />
            </div>
            <p className="text-sm font-black uppercase tracking-[0.5em] text-white/20 italic">No matching nodes found in the grid.</p>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

function ModerationTab() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collectionGroup(db, "messages"), orderBy("timestamp", "desc"), limit(100));
    const unsubscribe = onSnapshot(q, (snap: QuerySnapshot) => {
      const msgs = snap.docs.map((doc: QueryDocumentSnapshot) => ({ 
        id: doc.id, 
        path: doc.ref.path, 
        ...doc.data() 
      }));
      setMessages(msgs);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async (path: string) => {
    if (confirm("Nuke this message from the grid?")) {
      try {
        await adminService.deleteChatMessage(path);
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="space-y-12 max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter mb-2 nexus-glow">Global Signal Feed</h3>
          <p className="text-[11px] font-black uppercase text-white/30 tracking-[0.4em]">Sub-level Observation Port</p>
        </div>
        {loading ? <Loader2 className="text-nexus-primary animate-spin" size={28} /> : (
           <div className="flex items-center gap-3 px-5 py-2.5 bg-nexus-primary/5 rounded-full border border-nexus-primary/20">
            <span className="text-[10px] font-black uppercase text-nexus-primary tracking-widest">{messages.length} ACTIVE SIGNALS</span>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {messages.map((msg) => (
          <GlassCard key={msg.id} variant="nexus" className="p-8 group hover:border-nexus-primary/30 transition-all duration-500">
            <div className="flex items-start gap-8">
              <div className="w-16 h-16 rounded-[24px] bg-white/[0.03] flex items-center justify-center text-white/30 shrink-0 border border-white/5 group-hover:bg-nexus-primary/10 group-hover:text-nexus-primary group-hover:border-nexus-primary/30 transition-all duration-500">
                <UserIcon size={28} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-black text-nexus-primary uppercase tracking-[0.2em]">{msg.userName || 'Unknown Signal'}</span>
                    <div className="w-1 h-1 bg-white/20 rounded-full" />
                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{msg.timestamp?.toDate().toLocaleTimeString()}</span>
                  </div>
                  <button 
                    onClick={() => handleDelete(msg.path)}
                    className="opacity-0 group-hover:opacity-100 flex items-center gap-2 px-4 py-2 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 transition-all hover:text-white border border-rose-500/20"
                  >
                    <Trash2 size={14} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Nuke Signal</span>
                  </button>
                </div>
                <p className="text-base font-bold text-white leading-relaxed italic pr-10 group-hover:text-white transition-colors">
                  "{msg.text}"
                </p>
                <div className="mt-5 pt-5 border-t border-white/5 flex items-center gap-4">
                   <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] bg-white/5 px-2.5 py-1 rounded-lg">ID: {msg.id.slice(0, 12)}</span>
                   <span className="text-[8px] font-black text-nexus-primary/40 uppercase tracking-[0.3em]">Channel: /pump_daily_chats</span>
                </div>
              </div>
            </div>
          </GlassCard>
        ))}

        {messages.length === 0 && !loading && (
          <div className="py-48 text-center bg-white/[0.01] rounded-[48px] border-2 border-dashed border-white/5">
            <MessageSquare size={100} className="mx-auto mb-8 text-white/10" />
            <p className="text-sm font-black uppercase tracking-[0.5em] text-white/20">Buffer Empty. No signals detected on the global grid.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CommunityTab() {
  const [contributors, setContributors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContributors = async () => {
      const q = query(collection(db, "users"), orderBy("contributionCount", "desc"), limit(50));
      const snap = await getDocs(q);
      const docs = snap.docs.map((doc: QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() }));
      setContributors(docs);
      setLoading(false);
    };
    fetchContributors();
  }, []);

  const getLevel = (count: number) => {
    if (count >= 100) return { label: "PLATINUM ELITE", color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20 shadow-[0_0_15px_rgba(34,211,238,0.2)]" };
    if (count >= 50) return { label: "GOLD MASTER", color: "text-amber-400 bg-amber-400/10 border-amber-400/20 shadow-[0_0_15px_rgba(251,191,36,0.2)]" };
    if (count >= 20) return { label: "SILVER PRO", color: "text-slate-300 bg-slate-300/10 border-slate-300/20" };
    return { label: "BRONZE STARTER", color: "text-orange-500 bg-orange-500/10 border-orange-500/20" };
  };

  return (
    <div className="space-y-12 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter mb-2 nexus-glow">Human Logistics Grid</h3>
          <p className="text-[11px] font-black uppercase text-white/30 tracking-[0.4em]">Global Contributor Rankings</p>
        </div>
        <div className="flex -space-x-3 scale-110">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="w-10 h-10 rounded-full border-2 border-nexus-bg bg-white/5 backdrop-blur-md flex items-center justify-center overflow-hidden">
               <UserIcon size={16} className="text-white/20" />
            </div>
          ))}
          <div className="w-10 h-10 rounded-full border-2 border-nexus-bg bg-nexus-primary flex items-center justify-center text-black font-black text-[10px] shadow-neon">
            +50
          </div>
        </div>
      </div>

      <GlassCard variant="nexus" className="p-0 overflow-hidden border-white/5">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/[0.03] border-b border-white/5">
              <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.3em] text-white/40">Nexus Rank</th>
              <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.3em] text-white/40">Human Identity</th>
              <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.3em] text-white/40 text-center">Class Level</th>
              <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.3em] text-white/40 text-right">Impact Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {contributors.map((user, index) => {
               const level = getLevel(user.contributionCount || 0);
               return (
                <tr key={user.id} className="hover:bg-nexus-primary/5 transition-all duration-500 group">
                  <td className="px-10 py-8">
                    <span className={cn(
                      "text-xl font-black italic nexus-glow",
                      index === 0 ? "text-nexus-primary scale-125 inline-block" : 
                      index === 1 ? "text-cyan-300" :
                      index === 2 ? "text-amber-300" : "text-white/20"
                    )}># {index + 1}</span>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 group-hover:bg-nexus-primary/10 group-hover:text-nexus-primary transition-all duration-500 border border-white/5">
                        <UserIcon size={24} />
                      </div>
                      <div>
                        <div className="text-base font-black text-white italic tracking-tight group-hover:text-nexus-primary transition-colors">{user.name}</div>
                        <div className="text-[10px] font-black uppercase text-white/30 tracking-[0.2em] mt-1">{user.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-center">
                    <span className={cn("px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border", level.color)}>
                      {level.label}
                    </span>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex items-center justify-end gap-8">
                      <div className="text-right">
                        <div className="text-2xl font-black text-white italic tracking-tighter leading-none group-hover:text-nexus-primary transition-colors">{user.contributionCount || 0}</div>
                        <div className="text-[9px] font-black uppercase text-nexus-primary tracking-[0.3em] mt-2 opacity-50">Updates</div>
                      </div>
                      
                      {user.role !== 'admin' && (
                        <button 
                          onClick={() => {
                            if(confirm(`Promote human identity ${user.name} to Admin status?`)) {
                              adminService.promoteToAdmin(user.id).then(() => alert("Identity Promoted to Nexus Admin."));
                            }
                          }}
                          className="w-12 h-12 bg-white/5 rounded-2xl text-white/20 hover:bg-nexus-primary hover:text-black hover:shadow-neon transition-all duration-500 border border-white/5 flex items-center justify-center"
                          title="Authorize as Admin"
                        >
                          <Shield size={20} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {loading && (
          <div className="py-40 flex items-center justify-center bg-white/[0.01]">
            <Loader2 className="text-nexus-primary animate-spin" size={40} />
          </div>
        )}
      </GlassCard>
    </div>
  );
}

function ControlTab({ broadcasts }: { broadcasts: any[] }) {
  const [text, setText] = useState("");
  const [priority, setPriority] = useState<any>("regular");
  const [expiry, setExpiry] = useState(6);
  const [sending, setSending] = useState(false);
  const [isAlertSettingsOpen, setAlertSettingsOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<string | null>(null);
  const [liveLogs, setLiveLogs] = useState<string>("");
  const [isPollingLogs, setIsPollingLogs] = useState(false);
  const { settings, updateSetting } = useSettingsStore();

  useEffect(() => {
    let interval: any;
    if (isPollingLogs) {
      interval = setInterval(async () => {
        try {
          const res = await fetch('/api/admin/logs');
          const data = await res.json();
          if (data.logs) setLiveLogs(data.logs);
        } catch (e) {
          console.error("Log fetch failed", e);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isPollingLogs]);

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await adminService.sendBroadcast(text, priority, expiry);
      setText("");
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };
  
  const handleRepairGrid = async () => {
    if (!confirm("GEOSPATIAL OVERRIDE: This will automatically assign every pump to its nearest neighborhood. Proceed?")) return;
    setSending(true);
    try {
      const result = await adminService.syncAllStationsToAreas();
      alert(`Optimization Complete: ${result.count} nodes synchronized.`);
    } catch (e: any) {
      alert(`Repair Failed: ${e.message}`);
    } finally {
      setSending(false);
    }
  };

  const handleDeepSync = async () => {
    if (!confirm("AI DEEP SYNC: This will launch a headless browser to verify every station on Google Maps. This process runs in the background. Continue?")) return;
    setSending(true);
    try {
      const resp = await fetch('/api/admin/deep-sync', { method: 'POST' });
      const data = await resp.json();
      if (data.success) {
        setIsPollingLogs(true);
        alert("Deep Sync Engine Started! The live log viewer is now active.");
      } else {
        alert(`Sync Failed to Start: ${data.error}`);
      }
    } catch (e: any) {
      alert(`System Error: ${e.message}`);
    } finally {
      setSending(false);
    }
  };

  const handleToggle = async (key: string) => {
    await updateSetting(key as any, !settings[key as keyof typeof settings]);
  };

  const resetSystem = async () => {
    if (!confirm("CRITICAL OVERRIDE: Are you sure? This will physically update stale statuses and nuke daily chats!")) return;
    
    setSending(true);
    try {
      // 1. Get the current user's ID token for server-side verification
      const idToken = await auth.currentUser?.getIdToken(true);
      if (!idToken) throw new Error("Session expired. Please re-authenticate.");

      // 2. Call the secure server-side API
      const response = await fetch("/api/admin/system/cleanup", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${idToken}`,
          "Content-Type": "application/json"
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Protocol Failure.");
      }

      alert(`Nexus Grid Cleanup Complete. Affected Signals: ${result.details.count}`);
    } catch (e: any) {
      console.error(e);
      alert(`Nexus Protocol Failure: ${e.message}`);
    } finally {
      setSending(true); // Keep sending state or reset as needed
      // Actually, after alert, we want the UI to reflect changes. 
      // AdminStore will handle live sync if it's subscribed.
      setSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pb-20">
      <div className="space-y-12">
        <section>
          <h3 className="text-sm font-black uppercase text-nexus-primary tracking-[0.5em] mb-8 nexus-glow px-2 flex items-center gap-3">
             <Settings size={18} /> Global System Configuration
          </h3>
          <GlassCard variant="nexus" className="p-10 space-y-8">
            <div className="flex items-center justify-between p-6 bg-white/[0.03] rounded-[28px] border border-white/5 group hover:border-nexus-primary/40 transition-all shadow-inner">
              <div className="flex items-center gap-6">
                <div className={cn(
                  "w-14 h-14 rounded-[20px] flex items-center justify-center transition-all duration-500",
                  settings.showIntelligenceAnalysis ? "bg-nexus-primary text-black shadow-neon" : "bg-white/10 text-white/20"
                )}>
                  <TrendingUp size={28} />
                </div>
                <div>
                  <p className="text-xs font-black text-white uppercase tracking-tight italic nexus-glow">Intelligence Analysis</p>
                  <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] mt-2 italic">Stream real-time insights</p>
                </div>
              </div>
              <button 
                onClick={() => handleToggle("showIntelligenceAnalysis")}
                className={cn(
                  "w-14 h-7 rounded-full relative transition-all duration-500 border border-white/10",
                  settings.showIntelligenceAnalysis ? "bg-nexus-primary shadow-neon" : "bg-white/5"
                )}
              >
                <div className={cn("absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-500 shadow-xl", settings.showIntelligenceAnalysis ? "left-8" : "left-1")} />
              </button>
            </div>

            <div className="flex items-center justify-between p-6 bg-white/[0.03] rounded-[28px] border border-white/5 group hover:border-rose-500/40 transition-all shadow-inner">
              <div className="flex items-center gap-6">
                <div className={cn(
                  "w-14 h-14 rounded-[20px] flex items-center justify-center transition-all duration-500",
                  settings.maintenanceMode ? "bg-rose-500 text-white shadow-[0_0_25px_rgba(244,63,94,0.6)]" : "bg-white/10 text-white/20"
                )}>
                  <ShieldAlert size={28} />
                </div>
                <div>
                  <p className="text-xs font-black text-white uppercase tracking-tight italic">Global Lockdown Mode</p>
                  <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] mt-2 italic">Suspend all ingress</p>
                </div>
              </div>
              <button 
                onClick={() => handleToggle("maintenanceMode")}
                className={cn(
                  "w-14 h-7 rounded-full relative transition-all duration-500 border border-rose-500/20",
                  settings.maintenanceMode ? "bg-rose-500 shadow-neon-rose" : "bg-white/5"
                )}
              >
                <div className={cn("absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-500 shadow-xl", settings.maintenanceMode ? "left-8" : "left-1")} />
              </button>
            </div>
          </GlassCard>
        </section>

        <section>
          <h3 className="text-sm font-black uppercase text-white/40 tracking-[0.5em] mb-8 px-2 flex items-center gap-3">
             <Activity size={18} /> Emergency Protocol
          </h3>
          <GlassCard variant="nexus" className="p-10 border-rose-500/20 bg-rose-500/[0.02]">
            <p className="text-xs font-bold text-white/60 mb-8 uppercase tracking-widest leading-relaxed italic">
              Wipe all verified pump statuses across the network. This action is irreversible and affects the entire Dhaka grid.
            </p>
            <button 
              onClick={resetSystem}
              className="w-full py-6 rounded-[24px] bg-rose-500/10 text-rose-500 border border-rose-500/20 font-black uppercase tracking-[0.4em] text-[11px] hover:bg-rose-500 hover:text-white hover:shadow-neon-rose transition-all duration-500 group mb-4"
            >
              <div className="flex items-center justify-center gap-3">
                <Zap size={20} className="group-hover:animate-pulse" /> Perform Auto Cleanup
              </div>
            </button>

            <button 
              onClick={handleRepairGrid}
              disabled={sending}
              className="w-full py-6 rounded-[24px] bg-nexus-primary/10 text-nexus-primary border border-nexus-primary/20 font-black uppercase tracking-[0.4em] text-[11px] hover:bg-nexus-primary hover:text-white hover:shadow-neon transition-all duration-500 group mb-4"
            >
              <div className="flex items-center justify-center gap-3">
                <MapIcon size={20} className="group-hover:rotate-12 transition-transform" /> Repair Grid: Sync Areas
              </div>
            </button>

            <button 
              onClick={handleDeepSync}
              disabled={sending}
              className="w-full py-6 rounded-[24px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-black uppercase tracking-[0.4em] text-[11px] hover:bg-indigo-500 hover:text-white hover:shadow-neon-indigo transition-all duration-500 group"
            >
              <div className="flex items-center justify-center gap-3">
                <Brain size={20} className="group-hover:scale-110 transition-transform" /> AI Deep Sync (Headless)
              </div>
            </button>
            
            {/* Live Log Viewer Section */}
            {(liveLogs || isPollingLogs) && (
              <GlassCard className="mt-6 border-slate-800 bg-black/40 p-0 overflow-hidden rounded-[24px]">
                <div className="bg-slate-900 px-6 py-3 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal size={14} className="text-indigo-400" />
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Live Sync Telemetry</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[8px] font-bold text-slate-500 uppercase">Real-time Stream</span>
                  </div>
                </div>
                <div className="p-4 h-64 overflow-y-auto no-scrollbar font-mono text-[10px] leading-relaxed">
                  <pre className="text-indigo-100/70 whitespace-pre-wrap">
                    {liveLogs || "Initializing log stream..."}
                  </pre>
                </div>
                <div className="bg-slate-900/50 px-6 py-2 border-t border-slate-800 flex justify-between items-center">
                  <button 
                    onClick={() => setIsPollingLogs(!isPollingLogs)}
                    className="text-[8px] font-bold text-slate-500 hover:text-white uppercase transition-colors"
                  >
                    {isPollingLogs ? "[ PAUSE STREAM ]" : "[ RESUME STREAM ]"}
                  </button>
                  <button 
                    onClick={() => setLiveLogs("")}
                    className="text-[8px] font-bold text-slate-500 hover:text-white uppercase transition-colors"
                  >
                    [ CLEAR CONSOLE ]
                  </button>
                </div>
              </GlassCard>
            )}
          </GlassCard>
        </section>
      </div>

      <div className="space-y-12">
        <section>
          <h3 className="text-sm font-black uppercase text-nexus-primary tracking-[0.5em] mb-8 nexus-glow px-2 flex items-center gap-3">
             <Radio size={18} className="animate-pulse" /> Signal Broadcasting Center
          </h3>
          <GlassCard variant="nexus" className="p-10">
            <div className="space-y-8">
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-3 block px-1">Broadcast Signal</label>
                <textarea 
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter mission-critical transmission..."
                  className="w-full h-40 bg-white/5 border border-white/10 rounded-[28px] p-6 text-sm text-white focus:outline-none focus:ring-2 focus:ring-nexus-primary/40 transition-all backdrop-blur-xl no-scrollbar italic"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-3 block px-1">Signal Priority</label>
                  <select 
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-xs text-white uppercase font-black tracking-widest focus:outline-none focus:ring-2 focus:ring-nexus-primary/40"
                  >
                    <option value="regular">REGULAR SIGNAL</option>
                    <option value="urgent">URGENT TRANMISSION</option>
                    <option value="emergency">EMERGENCY OVERRIDE</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-3 block px-1">Persistence (HRS)</label>
                  <input 
                    type="number"
                    value={expiry}
                    onChange={(e) => setExpiry(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-xs text-white uppercase font-black tracking-widest focus:outline-none focus:ring-2 focus:ring-nexus-primary/40"
                  />
                </div>
              </div>

              <button 
                onClick={handleSend}
                disabled={sending}
                className={cn(
                  "w-full py-6 rounded-[28px] font-black uppercase tracking-[0.5em] text-[11px] transition-all duration-500 flex items-center justify-center gap-4 border",
                  sending ? "bg-white/5 text-white/20 border-white/5" : "bg-nexus-primary text-black shadow-neon border-nexus-primary/20 hover:scale-[1.02] active:scale-95"
                )}
              >
                {sending ? <Loader2 className="animate-spin" size={20} /> : <><Radio size={20} /> Initiate Broadcast</>}
              </button>
            </div>
          </GlassCard>
        </section>

        <section>
          <h3 className="text-sm font-black uppercase text-white/40 tracking-[0.5em] mb-8 px-2">Recent Transmissions</h3>
          <div className="space-y-4">
            {broadcasts.length === 0 ? (
              <div className="py-20 text-center text-white/10 font-black uppercase tracking-widest border border-dashed border-white/5 rounded-[40px] italic">No active signals in buffer</div>
            ) : broadcasts.map((b) => (
              <GlassCard key={b.id} variant="nexus" className="p-6 border-white/5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-white italic">"{b.text}"</p>
                    <div className="flex items-center gap-4 mt-3">
                       <span className={cn(
                        "text-[8px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-lg",
                        b.priority === 'emergency' ? 'bg-rose-500 text-white' : 
                        b.priority === 'urgent' ? 'bg-amber-500 text-black' : 'bg-nexus-primary/20 text-nexus-primary'
                      )}>
                        {b.priority}
                      </span>
                      <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Expires in {b.expiryHours}h</span>
                    </div>
                  </div>
                  <button className="p-2 text-white/20 hover:text-rose-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
