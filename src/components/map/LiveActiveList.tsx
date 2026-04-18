"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Navigation, Fuel, ShieldCheck, MapPin } from "lucide-react";
import { Station } from "@/types";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/useUIStore";
import { isStale } from "@/lib/utils/time-utils";

interface LiveActiveListProps {
  stations: Station[];
  onSelect: (station: Station) => void;
}

export const LiveActiveList = ({ stations, onSelect }: LiveActiveListProps) => {
  const { isLiveListOpen, setLiveListOpen } = useUIStore();
  
  // Filter for active and non-stale stations
  const activeStations = stations.filter(s => s.status === 'active' && !isStale(s.last_updated));

  return (
    <AnimatePresence>
      {isLiveListOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[2000] flex items-center justify-center p-4 sm:p-6"
        >
          {/* Backdrop Blur */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLiveListOpen(false)}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl"
          />

          {/* List Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="w-full max-w-lg bg-white/95 backdrop-blur-3xl rounded-[40px] shadow-[0_32px_128px_rgba(0,0,0,0.5)] border border-white/20 overflow-hidden relative z-10 flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white/50">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                  <h2 className="text-xl font-black italic text-slate-900 uppercase tracking-tight">Active Intelligence</h2>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Direct Fleet Logistics • 2.5</p>
              </div>
              <button 
                onClick={() => setLiveListOpen(false)}
                className="w-12 h-12 hover:bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all"
              >
                <X size={24} />
              </button>
            </div>

            {/* List Body */}
            <div className="overflow-y-auto p-4 space-y-3 no-scrollbar">
              {activeStations.length > 0 ? (
                activeStations.map((station, index) => (
                  <motion.button
                    key={station.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => {
                      onSelect(station);
                      setLiveListOpen(false);
                    }}
                    className="w-full p-4 rounded-3xl bg-slate-50 border border-slate-100 hover:bg-primary/5 hover:border-primary/20 transition-all text-left flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-sm">
                        <Fuel size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 italic uppercase tracking-tight leading-none mb-1 group-hover:text-primary transition-colors">
                          {station.name}
                        </h4>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <MapPin size={8} className="text-primary" /> {station.category || "Main City"} • {station.social_verify_count || 0} Reports
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                       <div className="px-3 py-1 bg-emerald-500 text-white rounded-full text-[8px] font-black uppercase tracking-widest shadow-emerald-500/20 shadow-lg">
                          Active
                       </div>
                       <Navigation size={16} className="text-slate-300 group-hover:text-primary transition-colors" />
                    </div>
                  </motion.button>
                ))
              ) : (
                <div className="py-20 text-center flex flex-col items-center">
                   <ShieldCheck size={48} className="text-slate-200 mb-4" />
                   <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">No Active Signals Found</p>
                   <p className="text-[10px] font-medium text-slate-300 uppercase mt-1">Check back soon for latest reports</p>
                </div>
              )}
            </div>

            {/* Footer Summary */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
               <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Total Active Nodes: {activeStations.length}</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
