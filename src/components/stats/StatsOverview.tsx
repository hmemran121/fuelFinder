"use client";

import { motion } from "framer-motion";
import { Zap, Activity, ShieldCheck, TrendingUp } from "lucide-react";
import { Station } from "@/types";
import { isStale } from "@/lib/utils/time-utils";

interface StatsOverviewProps {
  stations: Station[];
}

export const StatsOverview = ({ stations }: StatsOverviewProps) => {
  const activeStations = stations.filter(s => s.status === 'active' && !isStale(s.last_updated));
  const totalVerifications = stations.reduce((acc, s) => acc + (s.social_verify_count || 0), 0);
  const verifiedRate = stations.length > 0 
    ? Math.round((stations.filter(s => s.isVerified).length / stations.length) * 100) 
    : 0;

  const stats = [
    {
      label: "Live Active Pumps",
      value: activeStations.length,
      icon: Zap,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      glow: "shadow-[0_0_20px_rgba(16,185,129,0.2)]",
    },
    {
      label: "Intel Signals Today",
      value: totalVerifications,
      icon: Activity,
      color: "text-primary",
      bg: "bg-primary/10",
      glow: "shadow-[0_0_20px_rgba(37,99,235,0.2)]",
    },
    {
      label: "Verification Trust",
      value: `${verifiedRate}%`,
      icon: ShieldCheck,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      glow: "shadow-[0_0_20px_rgba(245,158,11,0.2)]",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="glass-premium p-6 rounded-[32px] border-white/20 relative overflow-hidden group"
        >
          <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} rounded-full -mr-12 -mt-12 blur-3xl group-hover:scale-150 transition-transform duration-700`} />
          
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center ${stat.glow}`}>
              <stat.icon size={24} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              {stat.label}
            </span>
          </div>

          <div className="flex items-baseline gap-2 relative z-10">
            <h3 className="text-4xl font-black italic tracking-tighter text-foreground">
              {stat.value}
            </h3>
            <TrendingUp size={16} className={`${stat.color} opacity-50`} />
          </div>
        </motion.div>
      ))}
    </div>
  );
};
