"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/lib/services/authService";
import { useRouter } from "next/navigation";
import { 
  User, 
  Phone, 
  Shield, 
  LogOut, 
  TrendingUp, 
  Award,
  Calendar,
  ChevronRight,
  Settings,
  Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { GlassCard } from "@/components/ui/GlassCard";

export default function ProfilePage() {
  const { user, profile, loading } = useAuthStore();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await authService.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoggingOut(false);
    }
  };

  if (loading || !user || !profile) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] pb-32">
      {/* Premium Header Decoration */}
      <div className="absolute top-0 left-0 w-full h-64 bg-primary-gradient opacity-20 blur-[100px]" />
      
      <div className="relative z-10 max-w-lg mx-auto px-6 pt-16">
        {/* Profile Header */}
        <div className="flex flex-col items-center mb-10">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 rounded-[32px] bg-primary/20 p-1 mb-4 border border-primary/30 shadow-neon"
          >
            <div className="w-full h-full rounded-[28px] bg-primary flex items-center justify-center text-white text-3xl font-black italic shadow-inner">
              {profile.name.charAt(0).toUpperCase()}
            </div>
          </motion.div>
          <h2 className="text-2xl font-black italic text-white uppercase tracking-tight leading-none mb-1">
            {profile.name}
          </h2>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
            <Shield size={12} /> {profile.role} Member
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <GlassCard className="p-5 border-emerald-500/20 bg-emerald-500/5">
            <div className="text-[9px] uppercase font-black text-emerald-500/60 mb-2 tracking-widest flex items-center gap-1">
              <TrendingUp size={12} /> Contributions
            </div>
            <div className="text-3xl font-black text-emerald-500 leading-none">
              {profile.contributionCount}
            </div>
          </GlassCard>
          <GlassCard className="p-5 border-primary/20 bg-primary/5">
            <div className="text-[9px] uppercase font-black text-primary/60 mb-2 tracking-widest flex items-center gap-1">
              <Award size={12} /> Level
            </div>
            <div className="text-3xl font-black text-primary leading-none">
              {profile.contributionCount > 100 ? "Elite" : profile.contributionCount > 50 ? "Gold" : "Active"}
            </div>
          </GlassCard>
        </div>

        {/* User Details */}
        <div className="space-y-3 mb-10">
          <h4 className="text-[10px] font-black uppercase text-white/30 tracking-[0.4em] px-2 mb-4">Identity Details</h4>
          
          <div className="bg-white/5 border border-white/10 p-5 rounded-[28px] flex items-center justify-between group hover:bg-white/10 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center text-white/60">
                <Phone size={18} />
              </div>
              <div>
                <div className="text-[9px] font-black uppercase text-white/30 tracking-widest">Mobile Number</div>
                <div className="text-sm font-bold text-white tracking-tight">{profile.phone}</div>
              </div>
            </div>
            <ChevronRight size={18} className="text-white/20 group-hover:text-primary transition-colors" />
          </div>

          <div className="bg-white/5 border border-white/10 p-5 rounded-[28px] flex items-center justify-between group hover:bg-white/10 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center text-white/60">
                <Calendar size={18} />
              </div>
              <div>
                <div className="text-[9px] font-black uppercase text-white/30 tracking-widest">Joined On</div>
                <div className="text-sm font-bold text-white tracking-tight">OSM Verified Legacy</div>
              </div>
            </div>
            <ChevronRight size={18} className="text-white/20 group-hover:text-primary transition-colors" />
          </div>
        </div>

        {/* Action Menu */}
        <div className="space-y-4">
          <button className="w-full bg-white/5 p-4 rounded-2xl flex items-center justify-between text-white/60 hover:bg-white/10 transition-all">
            <div className="flex items-center gap-3">
              <Bell size={18} />
              <span className="text-xs font-bold uppercase tracking-widest">Notifications</span>
            </div>
            <div className="bg-primary/20 text-primary text-[8px] px-2 py-0.5 rounded-full font-black">2 NEW</div>
          </button>
          
          <button className="w-full bg-white/5 p-4 rounded-2xl flex items-center justify-between text-white/60 hover:bg-white/10 transition-all">
            <div className="flex items-center gap-3">
              <Settings size={18} />
              <span className="text-xs font-bold uppercase tracking-widest">Preferences</span>
            </div>
          </button>

          <button 
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full mt-6 bg-rose-500/10 border border-rose-500/20 p-5 rounded-[28px] flex items-center justify-center gap-3 text-rose-500 hover:bg-rose-500/20 transition-all active:scale-95"
          >
            <LogOut size={20} />
            <span className="text-xs font-black uppercase tracking-[0.3em]">
              {loggingOut ? "Signing Out..." : "Interrupt Session"}
            </span>
          </button>
        </div>

        {/* Footer Design */}
        <div className="mt-16 text-center">
          <div className="w-8 h-8 mx-auto bg-white/5 rounded-xl flex items-center justify-center text-white/20 mb-4">
            <Shield size={16} />
          </div>
          <p className="text-[9px] font-black uppercase tracking-[0.6em] text-white/10">
            Fuel Finder Security Kernel
          </p>
        </div>
      </div>
    </div>
  );
}
