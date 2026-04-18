"use client";

import { useEffect, useState } from "react";
import { useAdminStore } from "@/store/useAdminStore";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, X, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export const BroadcastOverlay = () => {
  const { broadcasts, subscribeToLiveData } = useAdminStore();
  const [closedIds, setClosedIds] = useState<string[]>([]);

  useEffect(() => {
    return subscribeToLiveData();
  }, [subscribeToLiveData]);

  const activeBroadcasts = broadcasts.filter(b => !closedIds.includes(b.id));

  if (activeBroadcasts.length === 0) return null;

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[1500] w-[90%] max-w-lg space-y-3 pointer-events-none">
      <AnimatePresence>
        {activeBroadcasts.map((b) => (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className={cn(
              "glass p-4 rounded-2xl shadow-premium border-l-4 pointer-events-auto flex items-start gap-4",
              b.priority === 'critical' ? 'border-rose-500 bg-rose-500/10' : 
              b.priority === 'warning' ? 'border-amber-500 bg-amber-500/10' : 'border-primary bg-primary/10'
            )}
          >
            <div className={cn(
               "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
               b.priority === 'critical' ? 'bg-rose-500 text-white' : 
               b.priority === 'warning' ? 'bg-amber-500 text-white' : 'bg-primary text-white'
            )}>
              {b.priority === 'critical' ? <AlertTriangle size={20} /> : 
               b.priority === 'warning' ? <Radio size={20} className="animate-pulse" /> : <Info size={20} />}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">System Broadcast</span>
                <button onClick={() => setClosedIds([...closedIds, b.id])} className="text-white/20 hover:text-white transition-colors">
                  <X size={14} />
                </button>
              </div>
              <p className="text-sm font-bold text-foreground leading-tight tracking-tight">
                {b.text}
              </p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
