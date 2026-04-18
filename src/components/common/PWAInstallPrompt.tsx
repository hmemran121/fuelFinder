"use client";

import { useEffect, useState } from "react";
import { Download, X, ShieldCheck, Smartphone, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is already installed/running in standalone mode
    const checkStandalone = () => {
      if (typeof window !== "undefined") {
        const isStandaloneMode = window.matchMedia("(display-mode: standalone)").matches 
          || (window.navigator as any).standalone 
          || document.referrer.includes("android-app://");
        setIsStandalone(isStandaloneMode);
        return isStandaloneMode;
      }
      return false;
    };

    if (checkStandalone()) return;

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Delay prompt for 4 seconds to not overwhelm the user immediately
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 4000);
      
      return () => clearTimeout(timer);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // iOS Detection: iOS doesn't support beforeinstallprompt
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIOS && !checkStandalone()) {
       const timer = setTimeout(() => setShowPrompt(true), 6000);
       return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // If no prompt event (likely iOS or already rejected), we can't force native dialog
      // For iOS, users have to manually add to home screen
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // User requested "per visit", but maybe we should still respect the session
    sessionStorage.setItem("pwa_prompt_dismissed_session", "true");
  };

  // Check session storage to avoid annoying user in the same session after dismissal
  useEffect(() => {
    if (sessionStorage.getItem("pwa_prompt_dismissed_session") === "true") {
      setShowPrompt(false);
    }
  }, []);

  if (isStandalone) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 200, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 200, opacity: 0 }}
          className="fixed bottom-24 sm:bottom-8 left-4 right-4 z-[3000] max-w-sm mx-auto pointer-events-auto"
        >
          <div className="glass-premium border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-[32px] overflow-hidden relative">
            {/* Vibrant Background Glow */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-violet-500/10 rounded-full blur-3xl" />

            {/* Header / Dismiss */}
            <div className="p-6 relative z-10">
              <button 
                onClick={handleDismiss}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 transition-colors bg-slate-100/50 p-1.5 rounded-full"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-4 mb-5">
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg relative overflow-hidden shrink-0"
                  style={{ background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #f59e0b 100%)" }}
                >
                  <Download size={28} className="drop-shadow-md" />
                  <div className="absolute inset-0 bg-white/10" />
                </div>
                <div>
                  <h3 className="text-[15px] font-black italic tracking-tighter text-slate-900 leading-tight">
                    FUEL FINDER <span className="text-primary">DHAKA</span>
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-0.5">অফিসিয়াল অ্যাপ ইনস্টল করুন</p>
                </div>
              </div>

              {/* Benefits Section */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 bg-white/40 p-3 rounded-2xl border border-white/40">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                    <Zap size={16} />
                  </div>
                  <p className="text-[11px] font-bold text-slate-700 leading-tight">দ্রুত অ্যাক্সেস (ব্রাউজার ছাড়াই সরাসরি ফোন থেকে)</p>
                </div>
                <div className="flex items-center gap-3 bg-white/40 p-3 rounded-2xl border border-white/40">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <ShieldCheck size={16} />
                  </div>
                  <p className="text-[11px] font-bold text-slate-700 leading-tight">রিয়েল-টাইম ইন্টেলিজেন্স অ্যালার্ট সুবিধা</p>
                </div>
                <div className="flex items-center gap-3 bg-white/40 p-3 rounded-2xl border border-white/40">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                    <Smartphone size={16} />
                  </div>
                  <p className="text-[11px] font-bold text-slate-700 leading-tight">ফুল স্ক্রিন এবং প্রিমিয়াম ইউজার ইন্টারফেস</p>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleInstallClick}
                className={cn(
                  "w-full py-4.5 rounded-2xl font-black uppercase text-[12px] tracking-[0.25em] shadow-xl transition-all relative overflow-hidden group mb-3",
                  "bg-slate-900 text-white hover:scale-[1.02] active:scale-95"
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                ইনস্টল করুন (৩ সেকেন্ড লাগবে)
              </button>

              {deferredPrompt === null && (
                <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-widest bg-slate-50 py-2 rounded-xl border border-slate-100">
                  iOS ইউজাররা নিচের <span className="inline-block transform rotate-0 scale-110">⏍</span> আইকনে ট্যাপ করে "Add to Home Screen" দিন
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
