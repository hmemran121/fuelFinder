"use client";

import { useEffect, useState } from "react";
import { messaging, db } from "@/lib/firebase";
import { getToken, onMessage } from "firebase/messaging";
import { Bell, BellOff, X, ShieldCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { doc, getDoc, setDoc } from "firebase/firestore";

export const NotificationManager = () => {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [showPrompt, setShowPrompt] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    const checkEligibility = async () => {
      if (typeof window === "undefined" || !("Notification" in window)) return;
      
      setPermission(Notification.permission);
      
      // Smart Re-prompting Logic
      if (Notification.permission === "default") {
        
        // 1. Dynamic Check: Check Firestore Settings first
        if (user) {
          try {
            const docRef = doc(db, "users", user.uid, "settings", "notifications");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists() && docSnap.data().enabled === false) {
              console.log("NotificationManager: Alerts disabled in settings. Skipping prompt.");
              return;
            }
          } catch (error) {
            console.error("Settings check error:", error);
          }
        }

        // 2. Frequency Check: 48-hour logic
        const lastPrompt = localStorage.getItem("last_notif_prompt");
        const now = Date.now();
        const TWO_DAYS = 48 * 60 * 60 * 1000;

        if (!lastPrompt || (now - parseInt(lastPrompt)) > TWO_DAYS) {
          const timer = setTimeout(() => setShowPrompt(true), 5000); 
          return () => clearTimeout(timer);
        }
      }
    };

    checkEligibility();
  }, [user]);

  const handleNotNow = () => {
    localStorage.setItem("last_notif_prompt", Date.now().toString());
    setShowPrompt(false);
  };

  const requestPermission = async () => {
    setLoading(true);
    localStorage.setItem("last_notif_prompt", Date.now().toString());
    try {
      const messagingInstance = await messaging();
      if (!messagingInstance) return;

      const currentPermission = await Notification.requestPermission();
      setPermission(currentPermission);

      if (currentPermission === "granted") {
        const token = await getToken(messagingInstance, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
        });
        
        if (token && user) {
          console.log("FCM Token registered:", token);
          // NEW: Save token to user profile for server-side push
          await setDoc(doc(db, "users", user.uid), {
            fcmToken: token,
            last_token_update: new Date()
          }, { merge: true });
        }
      }
    } catch (error) {
      console.error("Notification permission error:", error);
    } finally {
      setLoading(false);
      setShowPrompt(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {showPrompt && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 left-4 right-4 z-[2000] max-w-sm mx-auto"
          >
            <div className="bg-slate-900 border border-white/10 shadow-2xl rounded-[32px] p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-16 -mt-16 blur-3xl" />
              
              <button 
                onClick={handleNotNow}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-lg ring-1 ring-white/10">
                  <Bell size={24} className="animate-bounce" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase italic tracking-tight">স্মার্ট এলার্ট চালু করুন</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Live Fuel Intelligence</p>
                </div>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed mb-6 font-bold uppercase tracking-tight">
                আপনার এলাকায় যখনই কোনো পাম্পে তেল আসবে, সাথে সাথে নোটিফিকেশন পেতে স্মার্ট এলার্ট চালু করে রাখুন।
              </p>

              <div className="flex flex-col gap-2">
                <button
                  onClick={requestPermission}
                  disabled={loading}
                  className={cn(
                    "w-full py-4.5 rounded-2xl font-black uppercase text-[12px] tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3 relative overflow-hidden group/btn",
                    "bg-black text-primary border border-primary/40 hover:border-primary hover:scale-[1.02] active:scale-95"
                  )}
                >
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                  {loading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck size={18} className="text-primary group-hover/btn:scale-110 transition-transform" />
                      এলার্ট চালু করুন
                    </>
                  )}
                </button>

                <button
                  onClick={handleNotNow}
                  className="w-full py-3 text-slate-400 hover:text-white font-black uppercase text-[9px] tracking-widest transition-colors"
                >
                  এখন না (৪টি ঘণ্টা পর আবার দেখান)
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </>
  );

};

