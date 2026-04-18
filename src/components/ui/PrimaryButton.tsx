"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, ReactNode } from "react";

interface PrimaryButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart"> {
  children: ReactNode;
  icon?: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "glass" | "nexus";
}

export const PrimaryButton = ({ 
  children, 
  icon, 
  variant = "primary", 
  className, 
  ...props 
}: PrimaryButtonProps) => {
  const variants = {
    primary: "primary-gradient text-white shadow-neon border border-white/10",
    secondary: "bg-slate-800 text-white border border-slate-700",
    danger: "bg-rose-600 text-white shadow-[0_0_15px_rgba(225,29,72,0.4)]",
    glass: "glass-card hover:bg-white/10 text-white",
    nexus: "bg-nexus-primary text-black shadow-[0_0_30px_rgba(0,242,255,0.4)] font-black uppercase tracking-[0.2em] border border-nexus-primary/50"
  };

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.05, boxShadow: variant === 'nexus' ? "0_0_50px_rgba(0,242,255,0.6)" : "" }}
      className={cn(
        "px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all duration-300",
        variants[variant],
        className
      )}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
};
