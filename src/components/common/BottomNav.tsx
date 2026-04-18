"use client";

import { motion } from "framer-motion";
import { Map, Search, User, BarChart2, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUIStore } from "@/store/useUIStore";

const navItems = [
  { path: "/", icon: Map, label: "Map" },
  { path: "/search", icon: Search, label: "Search" },
  { path: "/stats", icon: BarChart2, label: "Stats" },
  { path: "/profile", icon: User, label: "Profile" },
];


export const BottomNav = () => {
  const pathname = usePathname();
  const toggleSearch = useUIStore((state) => state.toggleSearch);

  const navItems = [
    { id: "map", path: "/", icon: Map, label: "Map" },
    { id: "search", icon: Search, label: "Search", onClick: toggleSearch },
    { id: "stats", path: "/stats", icon: BarChart2, label: "Stats" },
    { id: "profile", path: "/profile", icon: User, label: "Profile" },
  ];


  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1001] w-[92%] max-w-lg">
      <div className="bg-white/90 backdrop-blur-xl px-4 py-3 rounded-[32px] flex items-center justify-around shadow-premium border border-white/40 shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.path ? pathname === item.path : false;

          const content = (
            <div className="relative group flex flex-col items-center cursor-pointer">
              {isActive && (
                <motion.div
                  layoutId="active-nav-bg"
                  className="absolute inset-0 bg-primary/10 rounded-2xl -z-10 blur-md"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}

              <div className={cn(
                "relative z-10 p-2.5 rounded-2xl transition-all duration-300",
                isActive 
                  ? "bg-slate-900 text-white shadow-lg scale-110" 
                  : "text-slate-600 hover:bg-muted hover:text-foreground"

              )}>
                <Icon size={20} className={cn(isActive ? "stroke-[3px]" : "stroke-[2.5px]")} />
              </div>

              {isActive && (
                <motion.span
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-900 mt-1"
                >
                  {item.label}
                </motion.span>
              )}
            </div>
          );

          if (item.path) {
            return (
              <Link key={item.id} href={item.path}>
                {content}
              </Link>
            );
          }

          return (
            <button key={item.id} onClick={item.onClick} className="outline-none">
              {content}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
