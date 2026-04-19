"use client";

import { Search, History, Fuel, Zap, Flame, Droplets, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { Station } from "@/types";
import { cn } from "@/lib/utils";
import Fuse from "fuse.js";
import { useUIStore } from "@/store/useUIStore";

interface SearchOverlayProps {
  stations: Station[];
  onSelect: (station: Station) => void;
}

export const SearchOverlay = ({ stations, onSelect }: SearchOverlayProps) => {
  const { isSearchOpen, setSearchOpen } = useUIStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Station[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const fuse = new Fuse(stations, {
    keys: ["name", "source"],
    threshold: 0.4,
  });

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setResults([]);
      setActiveFilters([]);
    }
  }, [isSearchOpen]);

  useEffect(() => {
    let baseStations = stations;
    
    // Apply Fuel Type Filters
    if (activeFilters.length > 0) {
      baseStations = baseStations.filter(s => {
        // If station has no fuelTypes defined but filters are active, decide to hide or show. Let's hide for strict filtering
        if (!s.fuelTypes || s.fuelTypes.length === 0) return false;
        return activeFilters.some(filter => s.fuelTypes?.includes(filter));
      });
    }

    if (query.length > 1) {
      // Create a new Fuse instance with the filtered baseStations
      const activeFuse = new Fuse(baseStations, { keys: ["name", "source"], threshold: 0.4 });
      const searchResults = activeFuse.search(query).map(r => r.item).slice(0, 8);
      setResults(searchResults);
    } else {
      // If no query but filters exist, show all matching the filter up to 8
      if (activeFilters.length > 0) {
        setResults(baseStations.slice(0, 8));
      } else {
        setResults([]);
      }
    }
  }, [query, activeFilters, stations]);

  const toggleFilter = (fuel: string) => {
    setActiveFilters(prev => 
      prev.includes(fuel) ? prev.filter(f => f !== fuel) : [...prev, fuel]
    );
  };

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[2000] flex items-start justify-center pt-[15vh] px-6"
        >
          {/* Backdrop Blur */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSearchOpen(false)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-2xl"
          />

          {/* Command Palette Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-2xl bg-white/10 backdrop-blur-[40px] rounded-[40px] shadow-[0_32px_128px_rgba(0,0,0,0.5)] border border-white/20 overflow-hidden relative z-10"
          >
            {/* Search Input Section */}
            <div className="p-8 border-b border-white/10 flex items-center gap-6">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                <Search size={24} />
              </div>
              <input
                ref={inputRef}
                type="text"
                placeholder="Where are you refueling today? (e.g. Uttara, Gulshan...)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-2xl font-black italic tracking-tighter text-white placeholder:text-white/50 w-full"

              />
              <button 
                onClick={() => setSearchOpen(false)}
                className="w-12 h-12 hover:bg-white/10 rounded-2xl flex items-center justify-center text-white/40 hover:text-white transition-all"
              >
                <X size={24} />
              </button>
            </div>

            {/* Filter Section */}
            <div className="px-8 pb-4 border-b border-white/10 flex items-center gap-3 overflow-x-auto no-scrollbar pt-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-white/40 border-r border-white/10 pr-3 mr-1">Filter</span>
              {['Octane', 'Petrol', 'Diesel', 'CNG', 'LPG'].map(type => (
                <button
                  key={type}
                  onClick={() => toggleFilter(type)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap shadow-sm",
                    activeFilters.includes(type)
                      ? "bg-[#FF6B00] text-white border-[#FF6B00] shadow-[0_0_15px_rgba(255,107,0,0.5)] scale-105"
                      : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Results Section */}
            <div className="max-h-[50vh] overflow-y-auto no-scrollbar py-4 px-2">
              <AnimatePresence mode="popLayout">
                {results.length > 0 ? (
                  results.map((station, index) => (
                    <motion.button
                      key={station.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {
                        onSelect(station);
                        setSearchOpen(false);
                      }}
                      className="w-full px-8 py-5 text-left hover:bg-white/5 flex items-center justify-between group transition-all rounded-3xl mx-2"
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-lg font-black italic text-lg border border-primary/20">
                          {station.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-lg font-black text-white group-hover:text-primary transition-colors italic uppercase tracking-tighter leading-none mb-1">
                            {station.name}
                          </div>
                          <div className="text-[10px] text-white/70 font-bold uppercase tracking-[0.2em]">
                            {station.category || "Standard Station"} • Dhaka Logistics Engine
                          </div>

                        </div>
                      </div>
                      <div className={cn(
                        "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all",
                        station.status === "active" 
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30 group-hover:bg-emerald-500 group-hover:text-white" 
                          : "bg-slate-500/10 text-slate-400 border-slate-500/30"
                      )}>
                        {station.status}
                      </div>
                    </motion.button>
                  ))
                ) : query.length > 0 ? (
                  <div className="py-20 text-center">
                    <div className="text-white/30 text-4xl mb-4 font-black italic tracking-tighter">No Intel Found</div>
                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Try searching for a different area or station name</p>

                  </div>
                ) : (
                  <div className="p-8">
                     <div className="text-white/30 text-xs font-black uppercase tracking-[0.3em] mb-6">Recent Intelligence</div>

                     <div className="grid grid-cols-2 gap-4">
                        {stations.slice(0, 4).map(s => (
                           <button 
                             key={s.id}
                             onClick={() => { onSelect(s); setSearchOpen(false); }}
                             className="p-4 rounded-[24px] bg-white/5 border border-white/5 hover:border-primary/50 transition-all text-left group"
                           >
                              <div className="text-sm font-black text-white group-hover:text-primary transition-colors italic uppercase tracking-tighter truncate">{s.name}</div>
                              <div className="text-[8px] text-white/20 font-bold uppercase tracking-widest mt-1">Quick Navigate</div>
                           </button>
                        ))}
                     </div>
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* Hint Footer */}
            <div className="p-4 bg-black/20 text-center">
               <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white/40">Press <kbd className="bg-white/20 px-1.5 py-0.5 rounded text-white/60">ESC</kbd> to close command center</span>

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
