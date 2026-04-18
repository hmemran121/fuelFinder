"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const ScrollArea = ({ children, className, ...props }: ScrollAreaProps) => {
  return (
    <div 
      className={cn(
        "relative overflow-y-auto no-scrollbar",
        // Custom scrollbar for webkit browsers
        "scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent hover:scrollbar-thumb-primary/40 transition-colors",
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
};
