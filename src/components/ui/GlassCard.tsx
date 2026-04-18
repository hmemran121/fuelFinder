"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  interactive?: boolean;
  variant?: "default" | "premium" | "nexus";
}

export const GlassCard = ({ 
  children, 
  className, 
  delay = 0, 
  interactive = false,
  variant = "default"
}: GlassCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ 
        duration: 0.8, 
        delay,
        type: "spring",
        stiffness: 50,
        damping: 20
      }}
      whileHover={interactive ? { 
        y: -5,
        transition: { duration: 0.3, ease: "easeOut" } 
      } : {}}
      className={cn(
        "relative rounded-[32px] overflow-hidden transition-all duration-500",
        variant === "default" && "glass-card p-6",
        variant === "premium" && "glass-premium p-8",
        variant === "nexus" && "bg-nexus-card border border-nexus-border p-8 backdrop-blur-3xl",
        interactive && "cursor-pointer hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]",
        className
      )}
    >
      {/* Animated Border Beam for Nexus Variant */}
      {variant === "nexus" && (
        <div className="absolute inset-0 p-[2px] rounded-[32px] overflow-hidden pointer-events-none">
          <div className="absolute inset-[-100%] bg-[conic-gradient(from_0deg,transparent_0deg,transparent_300deg,var(--nexus-primary)_360deg)] animate-[rotate_10s_linear_infinite]" />
          <div className="absolute inset-0 bg-[#05070a] rounded-[30px]" />
        </div>
      )}

      {/* Shine & Noise Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      
      <div className="relative z-10 h-full w-full">{children}</div>
    </motion.div>
  );
};
