"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  CheckCircle2, 
  TrendingUp, 
  Navigation, 
  Clock,
  AlertTriangle,
  Lock,
  ExternalLink,
  Edit3,
  Trash2,
  ShieldCheck,
  Loader2,
  AlertCircle,
  MessageCircle,
  ThumbsUp
} from "lucide-react";
import { Station } from "@/types";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { formatLastUpdated } from "@/lib/utils-date";
import { useAuthStore } from "@/store/authStore";
import { stationService } from "@/lib/services/stationService";
import { telemetryService } from "@/lib/services/telemetryService";
import { ScrollArea } from "@/components/ui/scroll-area";
import { isStale } from "@/lib/utils/time-utils";
import { ImageUpload } from "../common/ImageUpload";
import { Zap } from "lucide-react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { StationChat } from "./StationChat";




interface StationDetailProps {
  station: Station | null;
  onClose: () => void;
}

export const StationDetail = ({ station, onClose }: StationDetailProps) => {
  const [activeTab, setActiveTab] = useState<"info" | "chat" | "reviews">("info");
  const { user, isAdmin } = useAuthStore();
  const { settings } = useSettingsStore();
  const [isVerifying, setIsVerifying] = useState(false);
  const [liveVerifyCount, setLiveVerifyCount] = useState(0);
  const [updating, setUpdating] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  // Master Reactive Telemetry: Aggregate live signals across decentralized collection
  useEffect(() => {
    if (!station?.id) return;
    const unsubscribe = telemetryService.subscribeToStationSignals(station.id, (count) => {
      setLiveVerifyCount(count);
    });
    return () => unsubscribe();
  }, [station?.id]);

  if (!station) return null;

  // Master Logistics: Stale Data & Verification Protection
  const dataIsStale = isStale(station.last_updated);
  const effectiveStatus = dataIsStale ? 'unknown' : station.status;
  const alreadyVerifiedToday = !!(user && (station.user_verification_list?.includes(user.uid) || hasVoted));

  const handleStatusChange = async (newStatus: "active" | "inactive") => {
    if (!user) return;
    setUpdating(true);
    try {
      await stationService.updateStatus(station.id, newStatus, user.uid);
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating(false);
    }
  };

  const handleVerify = async () => {
    if (!user || !station) {
      window.location.href = "/login";
      return;
    }
    if (alreadyVerifiedToday) return;

    setIsVerifying(true);
    try {
      // Step 1: Send decentralized signal (Permission-Open Path)
      await telemetryService.sendVerificationSignal(station.id, user.uid);
      setHasVoted(true); // Immediate local feedback (Optimistic UI)
      
      // Step 2: Attempt background sync (Will succeed once rules are published)
      await stationService.verifyActive(station.id, user.uid);
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        console.warn("Verification signal recorded locally. Awaiting admin rule sync.");
      } else {
        console.error("Verification failed:", error);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const verifyCount = (station.social_verify_count || 0) + liveVerifyCount;
  const verifyProgress = Math.min((verifyCount / 20) * 100, 100);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed inset-x-0 bottom-0 z-[1002] max-w-lg mx-auto"
      >
        <div className="absolute inset-0 bg-background/80 backdrop-blur-3xl rounded-t-[40px] border-t border-white/20 shadow-[0_-20px_50px_rgba(0,0,0,0.3)]" />
        
        <div className="px-8 flex flex-col h-[75vh] overflow-hidden relative pt-6 pb-0">
          {/* Header */}
          <div className="flex justify-between items-start mb-4 gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xl font-black italic text-foreground uppercase tracking-tight truncate leading-none">
                  {station.name}
                </h2>
                {station.isVerified && (
                  <CheckCircle2 size={18} className="text-primary fill-primary/10 shrink-0" />
                )}
              </div>
              <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 truncate">
                <Navigation size={12} className="text-primary shrink-0" /> {station.area || "Dhaka Metropolitan"} <span className="text-slate-400">|</span> {station.category || "General Fuel"}
              </p>

            </div>
            
            <div className="flex flex-col items-end gap-3 shrink-0">
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <button className="bg-primary shadow-neon p-2.5 rounded-2xl text-slate-950 hover:scale-105 transition-all">
                    <Edit3 size={18} />
                  </button>
                )}
                <button 
                  onClick={onClose} 
                  className="bg-muted p-2.5 rounded-2xl hover:bg-border transition-colors text-foreground"
                >
                  <X size={22} />
                </button>
              </div>
              
              <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/50 rounded-xl border border-border/30">
                <Clock size={10} className="text-primary" />
                <span className="text-[8px] font-black uppercase text-slate-700 whitespace-nowrap">
                  আপডেট: {formatLastUpdated(station.last_updated)}
                </span>

              </div>
            </div>
          </div>


          {/* Tab Switcher (Minimalized) */}
          <div className="flex gap-1.5 mb-5 bg-muted/60 p-1 rounded-2xl border border-border/40 shadow-inner shrink-0">
            {["info", "chat", "reviews"].map((t) => (
              <button 
                key={t}
                onClick={() => setActiveTab(t as any)}
                className={cn(
                  "flex-1 py-1.5 rounded-[10px] text-[10px] font-black uppercase tracking-normal transition-all", 
                  activeTab === t 
                    ? "bg-white text-primary shadow-premium scale-[1.01]" 
                    : "text-slate-600 hover:text-foreground"

                )}
              >
                {t === "info" ? "তথ্য" : t === "chat" ? "চ্যাট" : "রিভিউ"}
              </button>
            ))}
          </div>

          <div className="flex-1 -mx-8 px-8 overflow-hidden flex flex-col">
            {activeTab === "info" ? (
              <ScrollArea className="flex-1 no-scrollbar">
                <div className="pb-8 flex flex-col gap-6">
                  {/* Status Intelligence Card */}
                  {settings.showIntelligenceAnalysis && (
                    <div className="relative overflow-hidden bg-white border border-border shadow-premium p-6 rounded-[32px]">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                      <h4 className="text-primary text-[10px] font-black uppercase mb-4 flex items-center gap-2 tracking-normal relative z-10">
                        <TrendingUp size={14} /> ইন্টেলিজেন্স রিপোর্ট
                      </h4>
                      <div className="flex items-center gap-5 relative z-10">
                        <div className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg",
                          effectiveStatus === 'active' ? "bg-emerald-500 text-white shadow-emerald-500/20" : 
                          effectiveStatus === 'inactive' ? "bg-rose-500 text-white shadow-rose-500/20" : "bg-slate-500 text-white shadow-slate-500/20"
                        )}>
                          <CheckCircle2 size={28} />
                        </div>
                         <div className="flex-1">
                           <div className={cn(
                             "text-sm font-black uppercase italic tracking-normal",
                             dataIsStale ? "text-amber-500" : "text-foreground"
                           )}>
                             অবস্থা: {dataIsStale ? "তথ্য নেই / পুরাতন" : (station.status === 'active' ? "চালু আছে" : "বন্ধ আছে")}
                           </div>
                           <p className="text-[11px] text-slate-600 font-bold flex items-center gap-1 uppercase tracking-normal">
                             {dataIsStale ? <AlertTriangle size={12} className="animate-pulse" /> : <ShieldCheck size={12} className="text-emerald-500" />} 
                             {dataIsStale ? "পুনরায় যাচাই করা প্রয়োজন" : "নির্ভরযোগ্য তথ্য পাওয়া গেছে"}
                           </p>
                         </div>
                         {station.latest_photo && (
                           <motion.div 
                             initial={{ opacity: 0, scale: 0.8 }}
                             animate={{ opacity: 1, scale: 1 }}
                             className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-primary/20 shadow-lg shrink-0 cursor-pointer"
                             onClick={() => window.open(station.latest_photo, '_blank')}
                           >
                             <img src={station.latest_photo} alt="Latest Evidence" className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
                           </motion.div>
                         )}

                      </div>
                    </div>
                  )}

                  {/* Fuel Types & Amenities */}
                  {(station.fuelTypes?.length || station.amenities?.length) ? (
                    <div className="p-6 bg-slate-50/80 rounded-[32px] border border-slate-100 flex flex-col gap-5">
                      {station.fuelTypes && station.fuelTypes.length > 0 && (
                        <div className="flex flex-col gap-3">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">জ্বালানির ধরন</span>
                          <div className="flex flex-wrap gap-2">
                            {station.fuelTypes.map((fuel) => (
                              <span key={fuel} className="px-3 py-1.5 bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/20 rounded-xl text-[11px] font-black tracking-wider uppercase shadow-sm">
                                {fuel}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {station.amenities && station.amenities.length > 0 && (
                        <div className="flex flex-col gap-3">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">সুবিধাসমূহ</span>
                          <div className="flex flex-wrap gap-2">
                            {station.amenities.map((amenity) => (
                              <span key={amenity} className="px-3 py-1.5 bg-white text-slate-600 border border-slate-200 shadow-sm rounded-xl text-[11px] font-bold tracking-wider uppercase flex items-center gap-1.5">
                                <CheckCircle2 size={12} className="text-emerald-500" /> {amenity}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null}
                  
                  {/* MASTER LOGIC: Human Verification - Professional Redesign */}
                  {(effectiveStatus === 'active' && station.last_updated_by !== user?.uid) && (
                     <div className="relative p-[1px] rounded-[34px] bg-gradient-to-b from-primary/30 to-border/10 shadow-premium overflow-hidden group">
                       <div className="absolute inset-0 bg-white rounded-[33px] -z-10" />
                       <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-primary/10 transition-all duration-700" />
                       
                       <div className="p-6">
                         <div className="flex items-center justify-between mb-6">
                           <div className="flex items-center gap-3">
                             <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-primary shadow-lg ring-1 ring-white/10">
                               <ShieldCheck size={24} className="animate-pulse" />
                             </div>
                             <div className="flex flex-col">
                               <h3 className="text-[14px] font-black uppercase italic text-slate-900 leading-none tracking-tight">সামাজিক নির্ভরযোগ্যতা</h3>
                               <p className="text-[9px] font-black text-slate-400 uppercase mt-1 tracking-widest italic flex items-center gap-1">
                                 <Zap size={10} className="text-primary" /> Protocol v2.5
                               </p>
                             </div>
                           </div>
                           <div className="flex flex-col items-end">
                             <div className={cn(
                               "text-xl font-black italic leading-none transition-all duration-500 tracking-tighter",
                               alreadyVerifiedToday ? "text-emerald-500 nexus-glow" : "text-primary"
                             )}>
                               {verifyCount}<span className="text-[10px] text-slate-300 ml-0.5">/20</span>
                             </div>
                             <span className="text-[8px] font-black text-slate-500 uppercase mt-1 tracking-[0.2em]">Live Signals</span>
                           </div>
                         </div>

                         <div className="space-y-6">
                           <div className="relative">
                             <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 shadow-inner">
                               <motion.div 
                                 initial={{ width: 0 }} 
                                 animate={{ width: `${verifyProgress}%` }} 
                                 className={cn(
                                   "h-full transition-all duration-1000 relative", 
                                   alreadyVerifiedToday ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" : "bg-primary shadow-neon"
                                 )}
                               >
                                 <div className="absolute inset-0 bg-white/20 animate-pulse" />
                               </motion.div>
                             </div>
                           </div>

                           <div className="flex flex-col gap-3">
                             <button 
                               onClick={handleVerify} 
                               disabled={isVerifying || alreadyVerifiedToday} 
                               className={cn(
                                 "w-full py-4.5 font-black uppercase tracking-widest text-[13px] rounded-2xl transition-all duration-500 flex items-center justify-center gap-3 relative overflow-hidden group/btn shadow-lg", 
                                 alreadyVerifiedToday 
                                   ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" 
                                   : "bg-primary text-black hover:scale-[1.01] active:scale-[0.97] border border-white/10"
                               )}
                             >
                               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                               {isVerifying ? (
                                 <Loader2 size={18} className="animate-spin text-black" />
                               ) : alreadyVerifiedToday ? (
                                 <><ShieldCheck size={18} className="text-emerald-500" /> সিগনাল নিশ্চিত করেছেন</>
                               ) : (
                                 <><CheckCircle2 size={18} className="text-black group-hover/btn:scale-110 transition-transform" /> তেল আছে নিশ্চিত করুন</>
                               )}
                             </button>

                             {user && !alreadyVerifiedToday && (
                               <ImageUpload 
                                 stationId={station.id} 
                                 userId={user.uid} 
                                 onSuccess={(url) => {
                                   // Logic handled in storageService
                                 }} 
                               />
                             )}
                           </div>

                         </div>
                       </div>
                       
                       <div className="px-6 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-center">
                         <span className="text-[7px] font-black text-slate-400 uppercase tracking-[0.4em]">Integrated Telemetry System</span>
                       </div>
                     </div>
                  )}

                  {/* Adaptive Control Center */}
                  <div className="flex flex-col gap-3">
                    {!user ? (
                      <div className="p-8 border border-dashed border-border/60 bg-muted/30 rounded-[32px] text-center flex flex-col items-center gap-4">
                        <Lock size={20} className="text-muted-foreground opacity-30" />
                        <p className="text-[10px] font-black uppercase tracking-normal text-slate-600">স্ট্যাটাস আপডেট করতে লগইন করুন</p>
                        <PrimaryButton className="w-[85%] mx-auto h-12 shadow-neon font-black text-[14px] uppercase tracking-normal text-slate-950" onClick={() => window.location.href='/login'}>
                          লগইন করুন
                        </PrimaryButton>

                      </div>
                    ) : (
                      <div className="space-y-3">
                        {effectiveStatus === 'active' ? (
                          <button disabled={updating} onClick={() => handleStatusChange("inactive")} className="w-[85%] mx-auto bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white font-black py-5 rounded-[24px] border border-rose-500/20 transition-all text-[14px] uppercase tracking-normal flex items-center justify-center gap-3 group">
                            <AlertCircle size={18} className="group-hover:animate-pulse" /> তেল নেই রিপোর্ট করুন
                          </button>

                        ) : (
                          <motion.button disabled={updating} onClick={() => handleStatusChange("active")} animate={{ scale: [1, 1.02, 1], boxShadow: ["0 0 0px rgba(16, 185, 129, 0)", "0 0 20px rgba(16, 185, 129, 0.4)", "0 0 0px rgba(16, 185, 129, 0)"] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="w-[85%] mx-auto bg-emerald-500 text-white font-black py-6 rounded-[24px] shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all text-[16px] uppercase tracking-normal flex items-center justify-center gap-3 relative overflow-hidden">
                            <TrendingUp size={20} className="animate-bounce" /> তেল পেলে এখানে চাপুন
                          </motion.button>

                        )}
                      </div>
                    )}
                    <PrimaryButton variant="secondary" className="w-[85%] mx-auto py-5 rounded-[24px] border-primary/20 text-primary bg-primary/5 font-black uppercase tracking-normal text-[13px] hover:bg-primary/10 shadow-sm" icon={<Navigation size={18} />} onClick={() => window.open(stationService.getGoogleMapsLink(station.latitude, station.longitude), '_blank')}>
                      ডিরেকশন পান (গুগল ম্যাপস)
                    </PrimaryButton>

                  </div>

                  {/* Admin Zone */}
                  {isAdmin && (
                    <div className="p-4 border border-rose-500/20 bg-rose-500/[0.02] rounded-[32px] flex items-center justify-between">
                      <div>
                        <h4 className="text-rose-600 font-bold text-xs uppercase tracking-widest">Admin Actions</h4>
                        <p className="text-[10px] text-rose-500/60 uppercase font-bold">Dangerous Zone</p>
                      </div>
                      <button className="bg-rose-500/10 p-3 rounded-2xl text-rose-600 hover:bg-rose-500/20 transition-all">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  )}
                </div>
              </ScrollArea>
            ) : activeTab === "chat" ? (
              <div className="flex-1 bg-white/50 rounded-t-3xl overflow-hidden">
                <StationChat stationId={station.id} />
              </div>
            ) : (
              <ScrollArea className="flex-1 no-scrollbar">
                <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-30">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 text-muted-foreground">
                    <MessageCircle size={32} />
                  </div>
                  <h4 className="font-bold text-foreground mb-1 uppercase text-xs tracking-widest">Reviews Coming Soon</h4>
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
