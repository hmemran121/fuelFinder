"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { authService } from "@/lib/services/authService";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { 
  Phone, 
  Lock, 
  User, 
  ArrowRight, 
  Loader2, 
  ShieldCheck,
  Fuel
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (phone.length < 10) {
      setError("সঠিক মোবাইল নম্বর দিন (১০ ডিজিট+)");
      return;
    }
    if (pin.length < 4) {
      setError("পিন নম্বর অন্তত ৪ ডিজিটের হতে হবে");
      return;
    }
    if (mode === "signup" && !name) {
      setError("অনুগ্রহ করে আপনার নাম দিন");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        await authService.signUp(name, phone, pin);
      } else {
        await authService.signIn(phone, pin);
      }
      // Success is handled by AuthProvider observer
    } catch (err: any) {
      setError(authService.getBengaliError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-6 overflow-hidden bg-[#0a0f1e]">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-primary rounded-[24px] flex items-center justify-center text-white rotate-12 shadow-premium mb-4">
            <Fuel size={32} />
          </div>
          <h1 className="text-3xl font-black italic tracking-tighter text-white uppercase">
            Fuel Finder <span className="text-primary">Dhaka</span>
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 mt-2">
            Secure Logistics Identity
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white/10 backdrop-blur-3xl p-8 rounded-[40px] border border-white/20 shadow-premium">
          <div className="flex gap-4 mb-8">
            <button 
              onClick={() => setMode("login")}
              className={cn(
                "flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
                mode === "login" ? "bg-primary text-white shadow-neon" : "text-white/40 hover:text-white"
              )}
            >
              Sign In
            </button>
            <button 
              onClick={() => setMode("signup")}
              className={cn(
                "flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
                mode === "signup" ? "bg-primary text-white shadow-neon" : "text-white/40 hover:text-white"
              )}
            >
              Join Us
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {mode === "signup" && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 group-focus-within:text-primary transition-colors" size={20} />
                    <input 
                      type="text"
                      placeholder="Your Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-bold tracking-tight"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative group">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 group-focus-within:text-primary transition-colors" size={20} />
              <input 
                type="tel"
                placeholder="Phone (017...)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-bold tracking-tight"
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 group-focus-within:text-primary transition-colors" size={20} />
              <input 
                type="password"
                placeholder="4-Digit PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-bold tracking-tight"
              />
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-rose-500/20 border border-rose-500/40 p-4 rounded-2xl text-rose-500 text-xs font-bold text-center"
              >
                {error}
              </motion.div>
            )}

            <PrimaryButton 
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl shadow-neon font-black uppercase tracking-[0.2em] text-[10px]"
            >
              {loading ? <Loader2 className="animate-spin" /> : (
                <span className="flex items-center gap-2">
                  {mode === "login" ? "Unlock Access" : "Get Fuel Card"} <ArrowRight size={16} />
                </span>
              )}
            </PrimaryButton>
          </form>

          <div className="mt-8 flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest text-white/30">
            <ShieldCheck size={14} className="text-emerald-500" /> Web3-Grade PIN Encryption
          </div>
        </div>
      </motion.div>

      {/* Footer Notice */}
      <div className="absolute bottom-8 text-[9px] font-black uppercase tracking-[0.6em] text-white/20 text-center w-full">
        Fuel Finder Dhaka Auth Engine
      </div>
    </div>
  );
}
