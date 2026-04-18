"use client";

import { useState } from "react";
import { 
  X, 
  Search, 
  Edit2, 
  Trash2, 
  CheckCircle,
  AlertTriangle,
  Flame,
  Zap,
  Droplets
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Station } from "@/types";
import { cn } from "@/lib/utils";

interface StationsManagerProps {
  stations: Station[];
}

export const StationsManager = ({ stations }: StationsManagerProps) => {
  const [search, setSearch] = useState("");

  const filtered = stations.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center gap-4">
        <div className="glass flex-1 flex items-center gap-3 px-4 py-2 rounded-xl">
          <Search size={18} className="text-slate-500" />
          <input 
            type="text" 
            placeholder="Filter stations..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-white text-sm w-full"
          />
        </div>
        <button className="primary-gradient px-6 py-2 rounded-xl text-sm font-bold shadow-neon">
          Add Station
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filtered.map(station => (
          <GlassCard key={station.id} className="p-4 flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                station.status === "active" ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-800 text-slate-500"
              )}>
                {station.name.includes("CNG") ? <Zap size={20} /> : <Droplets size={20} />}
              </div>
              <div>
                <h4 className="font-bold text-white group-hover:text-primary transition-colors">{station.name}</h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-slate-500 uppercase font-black">{station.id}</span>
                  <div className="w-1 h-1 rounded-full bg-slate-700" />
                  <span className="text-[10px] text-slate-500">{station.latitude.toFixed(3)}, {station.longitude.toFixed(3)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className={cn(
                  "text-[10px] font-black uppercase mb-1",
                  station.status === "active" ? "text-emerald-400" : "text-slate-500"
                )}>
                  {station.status}
                </div>
                <div className="text-xs font-medium text-slate-400">Score: {station.confidence_score}</div>
              </div>
              
              <div className="flex items-center gap-2">
                <button className="bg-white/5 p-2 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
                  <Edit2 size={16} />
                </button>
                <button className="bg-rose-500/10 p-2 rounded-lg hover:bg-rose-500/20 transition-colors text-rose-500">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};
