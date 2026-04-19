"use client";

import { useEffect, useState, useRef } from "react";
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

const createUserIcon = () => {
  return L.divIcon({
    className: "custom-div-icon user-location",
    html: `
      <div class="relative flex items-center justify-center w-8 h-8">
        <div class="absolute w-4 h-4 bg-blue-500 rounded-full border-[3px] border-white shadow-lg z-10"></div>
        <div class="absolute w-8 h-8 bg-blue-500 rounded-full animate-ping opacity-30"></div>
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
// Key: Uses native navigator.geolocation.getCurrentPosition() directly
// which is the ONLY reliable way to trigger Chrome's permission prompt,
// even when map.locate() silently fails due to cached browser state.
function LocationButton({ 
  map, 
  stations, 
  onLocationFound 
}: { 
  map: L.Map | null;
  stations: Station[];
  onLocationFound: (lat: number, lng: number) => void;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [showHelp, setShowHelp] = useState(false);

  const showToast = (msg: string, type: "success" | "error") => {
    setStatus(type);
    setMessage(msg);
    setTimeout(() => { setStatus("idle"); setMessage(""); }, 5000);
  };

  const handleLocate = () => {
    if (!map || status === "loading") return;

    if (!navigator.geolocation) {
      showToast("এই ব্রাউজারে লোকেশন সাপোর্ট নেই।", "error");
      return;
    }

    setStatus("loading");

    // Use native API directly — this is the ONLY call that forces
    // Chrome to show its permission dialog, even in auto-blocked state.
    // map.locate() is a wrapper that bypasses this trigger on some devices.
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Success: fly to user's location on the map
        const { latitude, longitude } = position.coords;
        onLocationFound(latitude, longitude);
        showToast("আপনার লোকেশন পাওয়া গেছে! ✓", "success");
      },
      (error) => {
        if (error.code === 1) {
          // PERMISSION_DENIED — show help modal with actionable instructions
          setStatus("error");
          setShowHelp(true);
        } else if (error.code === 2) {
          showToast("লোকেশন পাওয়া যাচ্ছে না। GPS চালু আছে কিনা দেখুন।", "error");
        } else if (error.code === 3) {
          showToast("লোকেশন খুঁজতে বেশি সময় লাগছে। আবার চেষ্টা করুন।", "error");
        } else {
          showToast("লোকেশন সনাক্ত করা যায়নি।", "error");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  return (
    <>
      {/* ── Permission Denied Help Modal ── */}
      {showHelp && (
        <div
          className="fixed inset-0 z-[2000] bg-black/40 backdrop-blur-sm flex items-end p-4"
          onClick={() => { setShowHelp(false); setStatus("idle"); }}
        >
          <div
            className="w-full max-w-sm mx-auto bg-white rounded-[32px] shadow-2xl p-6 border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                <Crosshair size={20} className="text-rose-500" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wide text-slate-900 leading-none">লোকেশন চালু করুন</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Location Permission Required</p>
              </div>
            </div>

            <p className="text-[12px] text-slate-600 mb-4 leading-relaxed">
              আপনার ব্রাউজারে এই সাইটের জন্য লোকেশন বন্ধ আছে। নিচের পদ্ধতিতে চালু করুন:
            </p>

            <div className="space-y-3 mb-5">
              {/* Android Chrome */}
              <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                <p className="text-[11px] font-black text-blue-700 uppercase mb-2 tracking-wide">📱 Android Chrome</p>
                <p className="text-[11px] text-slate-700 leading-relaxed">
                  <strong>Phone Settings</strong> → <strong>Apps</strong> → <strong>Chrome</strong> → <strong>Permissions</strong> → <strong>Location</strong> → <strong>Allow</strong>
                </p>
              </div>

              {/* Desktop / URL bar method */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="text-[11px] font-black text-slate-700 uppercase mb-2 tracking-wide">🖥️ Desktop Chrome</p>
                <p className="text-[11px] text-slate-700 leading-relaxed">
                  Address bar-এর <strong>🔒 icon</strong> → <strong>Site settings</strong> → <strong>Location</strong> → <strong>Allow</strong>
                </p>
              </div>

              {/* Universal fallback */}
              <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                <p className="text-[11px] font-black text-amber-700 uppercase mb-2 tracking-wide">⚡ যেকোনো ব্রাউজার</p>
                <p className="text-[11px] text-slate-700 leading-relaxed">
                  Chrome address bar-এ টাইপ করুন: <br />
                  <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-[10px] text-amber-800">chrome://settings/content/location</code>
                </p>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 text-center mb-4">
              অনুমতি দেওয়ার পর আবার বাটনে ট্যাপ করুন
            </p>

            <button
              onClick={() => { setShowHelp(false); setStatus("idle"); }}
              className="w-full py-3.5 bg-slate-900 text-white font-black text-[13px] uppercase tracking-wider rounded-2xl hover:bg-primary hover:text-black transition-all"
            >
              বুঝেছি
            </button>
          </div>
        </div>
      )}

      {/* ── Location Button + Toast ── */}
      <div className="absolute bottom-[280px] sm:bottom-[220px] right-3 z-[1000] pointer-events-auto flex flex-col items-end gap-2">
        {message && (
          <div className={cn(
            "max-w-[220px] px-4 py-2.5 rounded-2xl text-[11px] font-bold shadow-premium backdrop-blur-md border",
            status === "success"
              ? "bg-emerald-500/90 text-white border-emerald-400/30"
              : "bg-rose-500/90 text-white border-rose-400/30"
          )}>
            {message}
          </div>
        )}

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
    </>
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
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const markerRefs = useRef<{[key: string]: L.Marker}>({});
  const watchIdRef = useRef<number | null>(null);

  // Initialize and Auto-Track Location
  useEffect(() => {
    try {
      // 1. Recover last location so users don't have to press repeatedly
      const savedLoc = localStorage.getItem("fuelFinder_lastLocation");
      if (savedLoc) {
         const { lat, lng } = JSON.parse(savedLoc);
         setUserLocation([lat, lng]);
      }
      
      // 2. Auto-activate real-time tracking if permissions are already granted
      if (navigator.permissions && navigator.geolocation) {
         navigator.permissions.query({ name: 'geolocation' }).then((status) => {
            if (status.state === 'granted') {
                watchIdRef.current = navigator.geolocation.watchPosition(
                  (pos) => {
                     const lats = pos.coords.latitude;
                     const lngs = pos.coords.longitude;
                     setUserLocation([lats, lngs]);
                     localStorage.setItem("fuelFinder_lastLocation", JSON.stringify({lat: lats, lng: lngs}));
                  },
                  (err) => console.debug("Auto-track error:", err),
                  { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
                );
            }
         });
      }
    } catch(e) {}
    
    return () => {
       if (watchIdRef.current !== null && navigator.geolocation) {
          navigator.geolocation.clearWatch(watchIdRef.current);
       }
    }
  }, []);

  // Handle Event: Stop following if user manually moves the map
  useEffect(() => {
    if (!map) return;
    
    const onTouch = () => setIsFollowing(false);
    map.on('dragstart', onTouch);
    map.on('movestart', (e) => {
      // Only stop if it's a manual gesture (not flyTo)
      if ((e as any).originalEvent) setIsFollowing(false);
    });

    return () => {
      map.off('dragstart', onTouch);
    };
  }, [map]);


  const handleLocationFound = (lat: number, lng: number) => {
    setUserLocation([lat, lng]);
    localStorage.setItem("fuelFinder_lastLocation", JSON.stringify({lat, lng}));
    setIsFollowing(true); // Enable Follow Mode

    // Start background watch if not already started
    if (watchIdRef.current === null && navigator.geolocation) {
       watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
             const latitude = pos.coords.latitude;
             const longitude = pos.coords.longitude;
             setUserLocation([latitude, longitude]);
             localStorage.setItem("fuelFinder_lastLocation", JSON.stringify({lat: latitude, lng: longitude}));
          },
          () => {},
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
       );
    }

    if (map) {
      map.flyTo([lat, lng], 16, { animate: true, duration: 1.2 });
      
      const userLatLng = L.latLng(lat, lng);
      let closestStation: Station | null = null;
      let minDistance = Infinity;

      for (const station of stations) {
         const dist = map.distance(userLatLng, L.latLng(station.latitude, station.longitude));
         if (dist < minDistance) {
           minDistance = dist;
           closestStation = station;
         }
      }

      // If within 2km (2000 meters) to test, dynamically open the popup
      if (closestStation && minDistance <= 2000) {
        setTimeout(() => {
          const marker = markerRefs.current[closestStation!.id];
          if (marker) {
            marker.openPopup();
          }
        }, 1300); // Wait for map animation to mostly finish
      }
    }
  };

  // Selection Logic: Moves map only on explicit selection triggers
  useEffect(() => {
    if (isFollowing && map && userLocation) {
       map.panTo(userLocation, { animate: true, duration: 0.5 });
    }
  }, [userLocation, isFollowing, map]);



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
              ref={(r) => {
                if (r) markerRefs.current[station.id] = r;
              }}
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

        {userLocation && (
          <Marker position={userLocation} icon={createUserIcon()}>
            <Popup className="premium-popup">
              <div className="p-2 min-w-[120px] text-center">
                <div className="w-8 h-8 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-1">
                  <Crosshair size={16} className="text-blue-600" />
                </div>
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-tight">আপনার অবস্থান</h3>
              </div>
            </Popup>
          </Marker>
        )}

        <ZoomControl position="bottomright" />
        <MapSpy setMap={setMap} />
      </MapContainer>

      {/* Render custom controls outside MapContainer to avoid DOM/Portal issues */}
      <LocationButton map={map} stations={stations} onLocationFound={handleLocationFound} />

      
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
