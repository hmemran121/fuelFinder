"use client";

import { motion } from "framer-motion";
import { MapPin, ArrowRight } from "lucide-react";
import { Station } from "@/types";
import { isStale } from "@/lib/utils/time-utils";

interface AreaIntelligenceProps {
  stations: Station[];
}

export const AreaIntelligence = ({ stations }: AreaIntelligenceProps) => {
  // Extract unique areas from category or placeholder
  const areaData = stations.reduce((acc, s) => {
    // Basic area detection from category or assume central if missing
    const area = s.category || "Main City";
    if (!acc[area]) {
      acc[area] = { total: 0, active: 0 };
    }
    acc[area].total++;
    if (s.status === 'active' && !isStale(s.last_updated)) {
      acc[area].active++;
    }
    return acc;
  }, {} as Record<string, { total: number; active: number }>);

  const areas = Object.entries(areaData)
    .map(([name, stats]) => ({
      name,
      percentage: Math.round((stats.active / stats.total) * 100),
      count: stats.active,
      total: stats.total
    }))
    .sort((a, b) => b.percentage - a.percentage);

  return (
    <div className="glass-premium p-8 rounded-[40px] border-white/20 shadow-2xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-black italic text-foreground uppercase tracking-tight">Area-Wise Intel</h3>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">Operational Heatmap</p>
        </div>
        <div className="bg-primary/10 text-primary px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-primary/20">
          Global Coverage
        </div>
      </div>

      <div className="space-y-6">
        {areas.map((area, index) => (
          <motion.div
            key={area.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            className="group"
          >
            <div className="flex justify-between items-end mb-2">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-primary opacity-50" />
                <span className="text-sm font-black italic uppercase text-foreground leading-none">{area.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-500 uppercase">{area.count}/{area.total} ACTIVE</span>
                <span className={`text-lg font-black italic ${area.percentage > 50 ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {area.percentage}%
                </span>
              </div>
            </div>
            
            <div className="h-3 w-full bg-slate-900/10 rounded-full overflow-hidden border border-white/5 relative shadow-inner">
               <motion.div
                 initial={{ width: 0 }}
                 animate={{ width: `${area.percentage}%` }}
                 transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                 className={`h-full relative ${
                   area.percentage > 70 ? 'bg-emerald-500' : 
                   area.percentage > 30 ? 'bg-primary' : 'bg-rose-500'
                 }`}
               >
                 <div className="absolute inset-0 bg-white/20 animate-pulse" />
               </motion.div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
