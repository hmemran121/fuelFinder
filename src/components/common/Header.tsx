"use client";

import { useState, useEffect } from "react";
import { Search, LogOut, User as UserIcon, ShieldAlert, X, Fuel } from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/lib/services/authService";
import { Station } from "@/types";
import { cn } from "@/lib/utils";
import { useStations } from "@/hooks/useStations";
import { isStale } from "@/lib/utils/time-utils";
import { useUIStore } from "@/store/useUIStore";
import Fuse from "fuse.js";

import { useRef } from "react";
import { AlertSettingsModal } from "./AlertSettingsModal";
import { Bell } from "lucide-react";



export const Header = () => {
  const { user, isAdmin, profile } = useAuthStore();
  const { stations } = useStations();
  const { setLiveListOpen, setAlertSettingsOpen } = useUIStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);


  const menuRef = useRef<HTMLDivElement>(null);

  const activeCount = stations.filter(s => s.status === "active" && !isStale(s.last_updated)).length;

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);



  return (
    <div className="absolute top-0 left-0 right-0 z-50 p-4 sm:p-8 pointer-events-none">
      <header className="max-w-6xl mx-auto flex items-center justify-between pointer-events-auto">
        
        {/* Logo Section */}
        <Link href="/" className="glass-premium rounded-[32px] p-2 pr-6 flex items-center gap-4 shadow-2xl transition-all border-white/20 group">
          <motion.div 
            whileHover={{ rotate: 0 }}
            initial={{ rotate: 12 }}
            className="w-10 h-10 bg-primary/90 backdrop-blur-md rounded-2xl flex items-center justify-center text-white shadow-[0_0_25px_rgba(37,99,235,0.4)] transition-transform group-hover:rotate-0 border border-white/30"
          >
            <Fuel size={22} className="fill-white/20" />
          </motion.div>

          <div className="flex flex-col">
            <h1 className="text-sm font-black italic tracking-tighter text-foreground leading-none">
              FUEL FINDER <span className="text-primary">DHAKA</span>
            </h1>
            <span className="text-[7px] font-black uppercase tracking-[0.3em] text-slate-500 mt-0.5">
              Logistics Engine • 2.0
            </span>

          </div>
        </Link>

        {/* Action Section */}
        <div className="flex items-center gap-2">
          {/* Live Engine Status Badge - Mobile & Desktop friendly */}
          <motion.button 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05, backgroundColor: "rgba(16, 185, 129, 0.1)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setLiveListOpen(true)}
            className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/10 px-3 py-1.5 rounded-2xl backdrop-blur-md shadow-sm pointer-events-auto cursor-pointer transition-colors"
          >
            <div className="relative">
              <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              <div className="absolute inset-0 w-2 h-2 bg-emerald-500 rounded-full animate-ping opacity-75"></div>
            </div>
            <div className="flex flex-col items-start">
              <div className="text-[7px] text-emerald-500 font-black uppercase tracking-[0.2em] leading-none mb-0.5">Live</div>
              <div className="text-[10px] font-black text-foreground uppercase tracking-tight">
                {activeCount} <span className="hidden sm:inline">Active</span>
              </div>
            </div>
          </motion.button>


          <div className="flex items-center gap-1 sm:gap-2 glass-premium p-1.5 rounded-[24px] border-white/20 shadow-2xl relative" ref={menuRef}>
            {user ? (
              <>
                {isAdmin && (
                  <Link href="/admin/settings" className="w-10 h-10 hover:bg-primary/10 rounded-2xl flex items-center justify-center text-primary transition-all group/icon" title="Admin">
                    <ShieldAlert size={18} className="group-hover/icon:scale-110 transition-transform" />
                  </Link>
                )}
                
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center transition-all border group/icon overflow-hidden relative",
                    isMenuOpen ? "bg-primary text-white border-primary shadow-neon" : "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                  )}
                >
                   <UserIcon size={18} className="group-hover/icon:scale-110 transition-transform" />
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {isMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className="absolute top-full right-0 mt-3 w-56 bg-white/90 backdrop-blur-2xl rounded-[28px] shadow-[0_20px_40px_rgba(0,0,0,0.2)] border border-white/40 p-2 z-[60] overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-slate-100 mb-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Intelligence Member</p>
                        <p className="text-sm font-black text-slate-900 truncate italic italic tracking-tighter uppercase">{profile?.name || "Refueler"}</p>
                      </div>

                      <div className="space-y-0.5">
                         <Link 
                           href="/profile" 
                           onClick={() => setIsMenuOpen(false)}
                           className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-2xl text-slate-600 hover:text-primary transition-all group/item"
                         >
                           <UserIcon size={16} className="group-hover/item:scale-110 transition-transform" />
                           <span className="text-[11px] font-black uppercase tracking-tight">View Profile</span>
                         </Link>

                         <button 
                           onClick={() => {
                             setAlertSettingsOpen(true);
                             setIsMenuOpen(false);
                           }}
                           className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-2xl text-slate-600 hover:text-primary transition-all group/item"
                         >
                           <Bell size={16} className="group-hover/item:scale-110 transition-transform" />
                           <span className="text-[11px] font-black uppercase tracking-tight">Manage Alerts</span>
                         </button>

                        
                        <button 
                          onClick={() => {
                            authService.signOut();
                            setIsMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-rose-50 rounded-2xl text-rose-500 transition-all group/item"
                        >
                          <LogOut size={16} className="group-hover/item:scale-110 transition-transform" />
                          <span className="text-[11px] font-black uppercase tracking-tight">Sign Out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <Link href="/login" className="px-5 py-2.5 bg-slate-900 text-white rounded-[20px] text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl mx-1 border border-white/10">
                Sign In
              </Link>
            )}
          </div>

         </div>
 
       </header>
     </div>

  );
};
