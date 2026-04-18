"use client";

import { useStations } from "@/hooks/useStations";
import { StatsOverview } from "@/components/stats/StatsOverview";
import { AreaIntelligence } from "@/components/stats/AreaIntelligence";
import { ResetCountdown } from "@/components/stats/ResetCountdown";
import { Header } from "@/components/common/Header";
import { motion } from "framer-motion";
import { BarChart3, ShieldCheck, Info } from "lucide-react";

export default function StatsPage() {
  const { stations, loading } = useStations();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 gap-4 overflow-hidden relative">
        <div className="absolute inset-0 bg-primary/5 blur-[100px] rounded-full scale-150 animate-pulse" />
        <div className="w-12 h-12 border-t-2 border-primary rounded-full animate-spin relative z-10" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary animate-pulse relative z-10">Syncing Intelligence...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background pb-32">
      {/* Dynamic Background */}
      <div className="fixed inset-0 -z-10 bg-grid-white/5" />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] -z-10" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] -z-10" />

      <Header />

      <div className="max-w-6xl mx-auto px-6 sm:px-8 pt-32 sm:pt-40 space-y-8">
        {/* Hero Section */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 size={20} className="text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Logistics Dashboard</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black italic tracking-tighter text-foreground leading-none">
              FUEL INTEL <span className="text-primary">STATS</span>
            </h1>
            <p className="text-muted-foreground font-medium text-sm mt-4 max-w-lg leading-relaxed">
              Real-time synchronization of decentralized fuel data across Dhaka city. 
              Powered by citizen telemetry and verified logistics.
            </p>
          </motion.div>

          {/* Verification Status Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-4 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-3xl"
          >
            <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Secure Node</p>
              <p className="text-sm font-black italic text-foreground uppercase">Data Verified Live</p>
            </div>
          </motion.div>
        </section>

        {/* Real-time Overview */}
        <StatsOverview stations={stations} />

        {/* Global Reset Monitor */}
        <ResetCountdown />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Main Area Chart */}
          <div className="md:col-span-12">
            <AreaIntelligence stations={stations} />
          </div>

          {/* System Information */}
          <div className="md:col-span-12">
            <div className="glass-premium p-6 rounded-[32px] border-white/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-primary border border-white/5">
                    <Info size={20} />
                  </div>
                  <div>
                    <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-0.5">Note on Accuracy</h5>
                    <p className="text-xs font-bold text-muted-foreground max-w-md">
                      Data is crowd-sourced and verified by automated logistics rules. Availability can change rapidly during high demand.
                    </p>
                  </div>
               </div>
               <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Dhaka • Bangladesh • EST 2026
               </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
