"use client";

import { useState, useEffect } from "react";
import { X, Bell, Check, MapPin, Loader2, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/useUIStore";
import { db } from "@/lib/firebase";

import { doc, getDoc, setDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";

const DHAKA_AREAS = [
  "Uttara", "Mirpur", "Gulshan", "Banani", "Dhanmondi", 
  "Mohammadpur", "Motijheel", "Badda", "Bashundhara", "Old Dhaka",
  "Jatrabari", "Shahbagh", "Rampura", "Khilgaon", "Pallabi",
  "Keraniganj", "Narayanganj", "Savar", "Purbachal", "Gazipur",
  "Hasnabad", "Kadamtali", "Demra", "Siddhirganj"
];

export const AlertSettingsModal = () => {
  const { user } = useAuthStore();
  const { isAlertSettingsOpen, setAlertSettingsOpen } = useUIStore();
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAlertSettingsOpen && user) {
      loadSettings();
    }
  }, [isAlertSettingsOpen, user]);

  const loadSettings = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const docRef = doc(db, "users", user.uid, "settings", "notifications");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSelectedAreas(data.areas || []);
        setAlertsEnabled(data.enabled !== false);
      } else {
        setSelectedAreas(DHAKA_AREAS);
        setAlertsEnabled(true);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleArea = (area: string) => {
    setSelectedAreas(prev => 
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const docRef = doc(db, "users", user.uid, "settings", "notifications");
      await setDoc(docRef, {
        areas: selectedAreas,
        updated_at: new Date(),
        enabled: alertsEnabled
      }, { merge: true });
      setAlertSettingsOpen(false);
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isAlertSettingsOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm pointer-events-auto">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-full max-w-md bg-white rounded-[40px] shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="bg-slate-900 p-8 text-white relative shrink-0">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-16 -mt-16 blur-2xl" />
              <button 
                onClick={() => setAlertSettingsOpen(false)}
                className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary border border-white/10">
                  <Bell size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase italic tracking-tight">এলার্ট সেটিংস</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Notification Preferences</p>
                </div>
              </div>
            </div>

            {/* Body - Scrollable */}
            <div className="p-8 overflow-y-auto no-scrollbar flex-1">
              {/* Master Toggle */}
              <div className={cn(
                "mb-8 p-6 rounded-[28px] border-2 transition-all flex items-center justify-between",
                alertsEnabled ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-100"
              )}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className={cn("w-2 h-2 rounded-full", alertsEnabled ? "bg-emerald-500 animate-pulse" : "bg-slate-300")} />
                    <h3 className={cn("text-xs font-black uppercase tracking-widest", alertsEnabled ? "text-emerald-600" : "text-slate-500")}>
                      {alertsEnabled ? "এলার্ট সক্রিয় আছে" : "এলার্ট বন্ধ করা আছে"}
                    </h3>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight italic">Global Notification Switch</p>
                </div>
                
                <button
                  onClick={() => setAlertsEnabled(!alertsEnabled)}
                  className={cn(
                    "w-14 h-8 rounded-full relative transition-all duration-500 border",
                    alertsEnabled ? "bg-emerald-500 border-emerald-400" : "bg-slate-200 border-slate-300"
                  )}
                >
                  <motion.div 
                    animate={{ x: alertsEnabled ? 24 : 4 }}
                    className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg" 
                  />
                </button>
              </div>

              <div className="mb-6 flex items-start gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                <Info size={16} className="text-primary shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-600 font-bold leading-relaxed uppercase italic">
                  যেসব এলাকায় পাম্প এক্টিভ হলে আপনি নোটিফিকেশন পেতে চান সেগুলো সিলেক্ট করুন।
                </p>
              </div>

              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-4">
                  <Loader2 size={32} className="animate-spin text-primary" />
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">সেটিংস লোড হচ্ছে...</span>
                </div>
              ) : (
                <div className={cn("grid grid-cols-2 gap-3 mb-8 transition-opacity duration-300", !alertsEnabled && "opacity-40 grayscale pointer-events-none")}>
                  {DHAKA_AREAS.map((area) => (
                    <button
                      key={area}
                      onClick={() => toggleArea(area)}
                      className={cn(
                        "flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all group",
                        selectedAreas.includes(area)
                          ? "bg-primary border-primary text-black shadow-lg scale-[1.02]"
                          : "bg-white border-slate-100 text-slate-600 hover:border-primary/30"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className={cn(
                          selectedAreas.includes(area) ? "text-black" : "text-slate-300"
                        )} />
                        <span className="text-[11px] font-black uppercase tracking-tight">{area}</span>
                      </div>
                      {selectedAreas.includes(area) && <Check size={14} className="text-black" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer - Shrink-0 */}
            <div className="p-8 pt-0 shrink-0">
              <button
                onClick={handleSave}
                disabled={saving || loading}
                className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black uppercase text-[13px] tracking-[0.2em] shadow-xl hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 size={18} className="animate-spin text-primary" />
                ) : (
                  <>সেটিংস সেভ করুন</>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};


