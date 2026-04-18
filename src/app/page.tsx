"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Station } from "@/types";
import { SearchOverlay } from "@/components/map/SearchOverlay";
import { StationDetail } from "@/components/map/StationDetail";
import { LiveActiveList } from "@/components/map/LiveActiveList";


import { useStations } from "@/hooks/useStations";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/lib/services/authService";
import { LogOut, User as UserIcon, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/common/Header";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { isStale } from "@/lib/utils/time-utils";



// Dynamic import for Leaflet (window check)
const FuelMap = dynamic(() => import("@/components/map/FuelMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-muted-foreground font-medium animate-pulse">Initializing Dhaka Map Engine...</p>
      </div>
    </div>
  ),
});

// Constants for Global Logistics Layout
const DHAKA_CENTER: [number, number] = [23.8103, 90.4125];

export default function Home() {
  const { stations, loading, error } = useStations();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapViewState, setMapViewState] = useState<{ center: [number, number], zoom: number }>({
    center: DHAKA_CENTER,
    zoom: 13
  });
  const { user, isAdmin } = useAuthStore();

  // Selection Logic: Moves map only on explicit selection triggers
  const handleSelectStation = (station: Station) => {
    setSelectedId(station.id);
    setMapViewState({
      center: [station.latitude, station.longitude],
      zoom: 16
    });
  };

  const selectedStation = stations.find(s => s.id === selectedId) || null;


  return (
    <div className="w-full h-screen relative bg-background text-foreground">
      {/* Loading & Error States */}
      {loading && (
        <div className="absolute inset-0 z-[2000] bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-bold text-primary animate-pulse uppercase tracking-widest">Live Sync...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[2000] glass px-6 py-4 rounded-3xl border-rose-500/20 text-rose-500 text-sm font-bold flex items-center gap-3 shadow-2xl">
          <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          Sync Error: {error}
        </div>
      )}

      {/* Unified Brand Header */}
      <Header />

      {/* Modern Search Command Center (Triggered by Bottom Nav) */}
      <SearchOverlay 
        stations={stations} 
        onSelect={handleSelectStation} 
      />

      {/* Interactive Live Feed List (Triggered by Header) */}
      <LiveActiveList 
        stations={stations}
        onSelect={handleSelectStation}
      />


      {/* Main Map */}

      <div className="absolute inset-0">
        <FuelMap 
          stations={stations} 
          center={mapViewState.center}
          zoom={mapViewState.zoom}
          onSelect={handleSelectStation}
        />
      </div>


      {/* Station Details (Bottom Sheet) */}
      <StationDetail 
        station={selectedStation} 
        onClose={() => setSelectedId(null)} 
      />
    </div>
  );
}
