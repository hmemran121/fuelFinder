"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from "react-leaflet";
import { Crosshair, Navigation } from "lucide-react";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Station } from "@/types";
import { cn } from "@/lib/utils";
import { formatLastUpdated } from "@/lib/utils-date";
import { isStale } from "@/lib/utils/time-utils";


// Fix for default Leaflet icons in Next.js
const createPulseIcon = (status: string) => {
  return L.divIcon({
    className: "custom-div-icon",
    html: `
      <div class="marker-container marker-${status}">
        <div class="marker-pulse"></div>
        <div class="marker-icon">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 22L15 22" />
            <path d="M4 9L15 9" />
            <path d="M14 22V4a2 2 0 00-2-2H6a2 2 0 00-2 2v18" />
            <path d="M14 13h1.342a2 2 0 011.947 1.547l.711 2.842" />
            <path d="M15 5h3" />
            <path d="M21 7v5" />
            <path d="M9 9V5" />
          </svg>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};


interface FuelMapProps {
  stations: Station[];
  center?: [number, number];
  zoom?: number;
  onSelect?: (station: Station) => void;
}

// Master Logistics Map Controller: Handles smooth view transitions
function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    if (center && map) {
      try {
        const container = map.getContainer();
        if (container) {
          map.setView(center, zoom, {
            animate: true,
            duration: 0.5
          });
        }
      } catch (e) {
        console.debug("Map view update skipped: Container not ready.");
      }
    }
  }, [center, zoom, map]);
  
  return null;
}

// Production-Grade User Location Controller
// Works on: localhost (dev), HTTPS (production/Vercel)
// Handles: permission denied, unavailable, timeout — with proper in-app UI
function LocationButton({ map }: { map: L.Map | null }) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const showMessage = (msg: string, type: "success" | "error") => {
    setStatus(type);
    setMessage(msg);
    setTimeout(() => {
      setStatus("idle");
      setMessage("");
    }, 4000);
  };

  const handleLocate = async () => {
    if (!map || status === "loading") return;

    // 1. Check if Geolocation API is available in this browser/environment
    if (!navigator.geolocation) {
      showMessage("এই ব্রাউজারে লোকেশন সাপোর্ট নেই।", "error");
      return;
    }

    // 2. Proactively check permission state (avoids silent failures)
    if (navigator.permissions) {
      try {
        const permissionStatus = await navigator.permissions.query({ name: "geolocation" });
        if (permissionStatus.state === "denied") {
          showMessage("লোকেশন অ্যাক্সেস বন্ধ আছে। ব্রাউজার সেটিংস থেকে অনুমতি দিন।", "error");
          return;
        }
      } catch {
        // Some browsers don't support permissions.query — silently continue
      }
    }

    setStatus("loading");

    // 3. Use Leaflet's built-in locate() — auto-handles HTTPS vs HTTP
    map.locate({ setView: true, maxZoom: 16, enableHighAccuracy: true, timeout: 10000 });

    const onFound = () => {
      map.off("locationerror", onError);
      showMessage("আপনার লোকেশন পাওয়া গেছে!", "success");
    };

    // eslint-disable-next-line prefer-const
    let onError: (e: L.ErrorEvent) => void;
    onError = (e: L.ErrorEvent) => {
      map.off("locationfound", onFound);
      const errorMessages: Record<number, string> = {
        1: "লোকেশন অ্যাক্সেস বন্ধ আছে। ব্রাউজার সেটিংস থেকে অনুমতি দিন।",
        2: "লোকেশন এই মুহূর্তে পাওয়া যাচ্ছে না। GPS চালু আছে কিনা দেখুন।",
        3: "লোকেশন খুঁজতে বেশি সময় লাগছে। আবার চেষ্টা করুন।",
      };
      const msg = errorMessages[e.code] ?? "লোকেশন সনাক্ত করা যায়নি।";
      showMessage(msg, "error");
    };

    map.once("locationfound", onFound);
    map.once("locationerror", onError);
  };

  return (
    <div className="absolute bottom-[280px] sm:bottom-[220px] right-3 z-[1000] pointer-events-auto flex flex-col items-end gap-2">
      {/* In-app Toast — replaces native alert() which is blocked in production */}
      {message && (
        <div
          className={cn(
            "max-w-[220px] px-4 py-2.5 rounded-2xl text-[11px] font-bold shadow-premium backdrop-blur-md border",
            status === "success"
              ? "bg-emerald-500/90 text-white border-emerald-400/30"
              : "bg-rose-500/90 text-white border-rose-400/30"
          )}
        >
          {message}
        </div>
      )}

      {/* Location Button */}
      <button
        onClick={handleLocate}
        disabled={status === "loading" || !map}
        className={cn(
          "w-12 h-12 bg-white/95 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-premium border border-white/40 transition-all active:scale-90 disabled:opacity-60 disabled:cursor-not-allowed",
          status === "loading" ? "text-primary animate-pulse" :
          status === "success" ? "text-emerald-500" :
          status === "error" ? "text-rose-500" :
          "text-slate-900 hover:text-primary hover:scale-105"
        )}
        title="আমার অবস্থান খুঁজুন"
        aria-label="Find My Location"
      >
        <Crosshair size={24} className={status === "loading" ? "animate-spin" : ""} />
      </button>
    </div>
  );
}


// Map Reference Capture
function MapSpy({ setMap }: { setMap: (map: L.Map) => void }) {
  const map = useMap();
  useEffect(() => {
    setMap(map);
  }, [map, setMap]);
  return null;
}



export default function FuelMap({ 
  stations, 
  center = [23.8103, 90.4125], // Dhaka Center
  zoom = 13,
  onSelect
}: FuelMapProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [map, setMap] = useState<L.Map | null>(null);


  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return (
    <div className="w-full h-full bg-background/50 animate-pulse flex items-center justify-center p-8">
      <div className="text-xs font-black text-muted-foreground uppercase tracking-widest">Waking Map Engine...</div>
    </div>
  );

  return (
    <div className="w-full h-full relative overflow-hidden rounded-[40px]" id="map-parent">
      <MapContainer
        key="fuel-finder-map-v2"
        center={center}
        zoom={zoom}
        zoomControl={false}
        attributionControl={false}
        className="w-full h-full z-0 font-sans"
      >

        <ChangeView center={center} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        
        {stations.map((station) => {
          const dataIsStale = isStale(station.last_updated);
          const effectiveStatus = dataIsStale ? 'unknown' : station.status;
          
          return (
            <Marker
              key={station.id}
              position={[station.latitude, station.longitude]}
              icon={createPulseIcon(effectiveStatus)}
              eventHandlers={{
                click: () => onSelect?.(station)
              }}
            >
              <Popup className="premium-popup">
                <div className="p-2 min-w-[150px]">
                  <h3 className="font-bold text-slate-900 border-b pb-1 mb-1">{station.name}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] uppercase font-bold text-white",
                      effectiveStatus === "active" ? "bg-emerald-500" : 
                      effectiveStatus === "inactive" ? "bg-rose-500" : "bg-slate-400"
                    )}>
                      {effectiveStatus}
                    </span>
                    <span className="text-[10px] text-slate-700 font-medium whitespace-nowrap">
                      Updated: {formatLastUpdated(station.last_updated)}
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        <ZoomControl position="bottomright" />
        <MapSpy setMap={setMap} />
      </MapContainer>

      {/* Render custom controls outside MapContainer to avoid DOM/Portal issues */}
      <LocationButton map={map} />

      
      {/* Mobile-specific Zoom Overrides */}
      <style jsx global>{`
        .leaflet-bottom.leaflet-right {
          bottom: 120px !important;
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-right: 12px !important;
        }
        @media (max-width: 640px) {
          .leaflet-bottom.leaflet-right {
            bottom: 180px !important;
          }
        }

        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1) !important;
          border-radius: 16px !important;
          overflow: hidden;
        }
        .leaflet-control-zoom-in, .leaflet-control-zoom-out {
          background: rgba(255, 255, 255, 0.9) !important;
          color: #0f172a !important;
          border: 1px solid rgba(255, 255, 255, 0.4) !important;
          width: 40px !important;
          height: 40px !important;
          line-height: 40px !important;
          font-weight: bold !important;
        }
      `}</style>
    </div>

  );
}
