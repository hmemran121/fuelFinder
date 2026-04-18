"use client";

import { useState, useEffect } from "react";
import { Clock, RefreshCcw } from "lucide-react";

export const ResetCountdown = () => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      
      // Target: Next Dhaka Midnight
      // Dhaka is UTC+6
      const dhakaTime = new Date(now.getTime() + (6 * 60 * 60 * 1000));
      const nextMidnightDhaka = new Date(dhakaTime);
      nextMidnightDhaka.setUTCHours(24, 0, 0, 0);
      
      const diff = nextMidnightDhaka.getTime() - dhakaTime.getTime();
      
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft(
        `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="glass-premium p-6 rounded-[32px] border-white/20 flex items-center justify-between shadow-neon-soft">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-primary shadow-lg ring-1 ring-white/10">
          <Clock size={20} className="animate-pulse" />
        </div>
        <div>
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-0.5">Intel Refresh Cycle</h4>
          <p className="text-2xl font-black italic tracking-tighter text-foreground tabular-nums">
            {timeLeft || "CALCULATING..."}
          </p>
        </div>
      </div>
      
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
          <RefreshCcw size={10} className="text-primary animate-spin-[3s]" />
          <span className="text-[8px] font-black uppercase text-primary tracking-widest">Midnight Auto-Reset</span>
        </div>
        <span className="text-[7px] font-bold text-slate-400 uppercase tracking-tight">Dhaka Time (UTC+6)</span>
      </div>
    </div>
  );
};
