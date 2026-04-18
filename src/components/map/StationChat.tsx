"use client";

import { useState, useEffect, useRef } from "react";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  limit
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthStore } from "@/store/authStore";
import { Send, User as UserIcon, AlertCircle, Loader2, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  text: string;
  userId: string;
  userName: string;
  timestamp: any;
}

export const StationChat = ({ stationId }: { stationId: string }) => {
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [input, setInput] = useState("");
  const { user, profile } = useAuthStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, "pump_daily_chats", stationId, "messages"),
      orderBy("timestamp", "asc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Message[];
        setMessages(msgs);
      },
      (error) => {
        console.error("Firestore Chat Error:", error);
        if (error.code === 'permission-denied') {
          // This confirms the rules issue
        }
      }
    );

    return () => unsubscribe();
  }, [stationId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    const text = input;
    setInput("");

    try {
      console.log(`📡 Transmitting Signal to: pump_daily_chats/${stationId}/messages`);
      const docRef = await addDoc(collection(db, "pump_daily_chats", stationId, "messages"), {
        text,
        userId: user.uid,
        userName: profile?.name || "Member",
        timestamp: serverTimestamp()
      });
      console.log("✅ Signal Synced to Cloud:", docRef.id);
    } catch (e) {
      console.error("❌ Signal Transmission Error:", e);
      alert("Signal transmission failed. Check connection.");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar min-h-0">
        <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl mb-2">
          <AlertCircle size={14} className="text-amber-600" />
          <p className="text-[10px] text-amber-900 font-bold">
            Volatile session: Signals reset at Dhaka Midnight.
          </p>

        </div>

        {messages === null ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-30">
            <Loader2 size={32} className="mb-2 animate-spin text-primary" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Establishing Signal...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 opacity-30 text-center">
            <MessageCircle size={40} className="mb-2" />
            <p className="text-[10px] font-black uppercase tracking-widest text-foreground">No reports detected yet</p>
            <p className="text-[9px] font-medium uppercase mt-1 opacity-60">Be the first to update others</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id}
              className={cn(
                "flex flex-col max-w-[85%]",
                msg.userId === user?.uid ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              <span className="text-[8px] font-black text-slate-600 uppercase mb-1 mx-1 tracking-widest">
                {msg.userName || "Unknown Member"}
              </span>

              <div className={cn(
                "px-4 py-2.5 rounded-2xl text-[11px] font-bold leading-relaxed",
                msg.userId === user?.uid 
                  ? "bg-primary text-slate-950 rounded-tr-none shadow-premium" 
                  : "bg-muted text-slate-900 rounded-tl-none border border-border"
              )}>
                {msg.text}
              </div>
            </div>
          ))
        )}
        <div ref={scrollRef} />
      </div>

      <div className="p-4 pb-5 bg-white/30 backdrop-blur-md border-t border-border/20">
        <form onSubmit={handleSendMessage}>
          <div className="flex items-center gap-2 p-2 bg-white rounded-2xl border border-border shadow-sm">
            <input
              type="text"
               placeholder={user ? "Share latest status..." : "Login to chat"}
              disabled={!user}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none px-2 text-sm text-foreground placeholder:text-slate-500"

            />
            <button 
              type="submit"
              disabled={!user || !input.trim()}
              className="bg-slate-900 text-white p-2.5 rounded-xl disabled:opacity-20 transition-all hover:scale-105 active:scale-90 shadow-md flex items-center justify-center group"
            >
              <Send size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
