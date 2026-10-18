"use client";

import { useEffect, useRef, useState } from "react";
import {
  MapPin,
  Navigation,
  ExternalLink,
  RefreshCw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { siteConfig } from "@/lib/site";

interface LeafletContactMapProps {
  lat?: number;
  lng?: number;
  title?: string;
  address?: string;
  mapsUrl?: string;
  zoom?: number;
}

declare global {
  interface Window {
    L: {
      map: (
        element: HTMLElement,
        options?: Record<string, unknown>,
      ) => {
        remove: () => void;
        zoomIn: () => void;
        zoomOut: () => void;
        setView: (
          center: [number, number],
          zoom?: number,
          options?: { animate?: boolean },
        ) => void;
      };
      tileLayer: (
        url: string,
        options?: Record<string, unknown>,
      ) => {
        addTo: (map: unknown) => void;
      };
      divIcon: (options?: Record<string, unknown>) => unknown;
      marker: (
        latlng: [number, number],
        options?: Record<string, unknown>,
      ) => {
        addTo: (map: unknown) => {
          bindPopup: (content: HTMLElement | string) => {
            openPopup: () => void;
          };
        };
      };
    };
  }
}

export default function LeafletContactMap({
  lat = 9.8965,
  lng = 76.7185,
  title = "G-TEC EDUCATION",
  address = "G-TEC EDUCATION, Near DePaul Public School, East End, Thodupuzha",
  mapsUrl,
  zoom = 16,
}: LeafletContactMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<{
    remove: () => void;
    zoomIn: () => void;
    zoomOut: () => void;
    setView: (
      center: [number, number],
      zoom?: number,
      options?: { animate?: boolean },
    ) => void;
  } | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const targetMapsUrl =
    mapsUrl ||
    siteConfig.mapsUrl ||
    `https://maps.google.com/?q=${encodeURIComponent(title + ", " + address)}`;

  useEffect(() => {
    let isMounted = true;

    function loadLeafletResources(): Promise<typeof window.L> {
      return new Promise((resolve, reject) => {
        if (typeof window === "undefined") return;

        if (window.L) {
          resolve(window.L);
          return;
        }

        // 1. Inject Leaflet CSS if not already present
        const existingLink = document.querySelector('link[href*="leaflet"]');
        if (!existingLink) {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
          link.crossOrigin = "";
          document.head.appendChild(link);
        }

        // 2. Inject Leaflet JS if not already present
        const existingScript = document.querySelector('script[src*="leaflet"]');
        if (existingScript) {
          existingScript.addEventListener("load", () => {
            if (window.L) resolve(window.L);
            else reject(new Error("Leaflet failed to attach to window"));
          });
          return;
        }

        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.async = true;
        script.crossOrigin = "";

        script.onload = () => {
          if (window.L) {
            resolve(window.L);
          } else {
            reject(new Error("Leaflet failed to load"));
          }
        };

        script.onerror = () => {
          reject(new Error("Failed to load Leaflet script from CDN"));
        };

        document.body.appendChild(script);
      });
    }

    loadLeafletResources()
      .then((L) => {
        if (!isMounted || !mapContainerRef.current) return;

        // Destroy previous instance if any
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        // Initialize Leaflet map
        const map = L.map(mapContainerRef.current, {
          center: [lat, lng],
          zoom: zoom,
          zoomControl: false, // Custom controls provided
          scrollWheelZoom: false,
        });

        mapInstanceRef.current = map;

        // OpenStreetMap base tile layer
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        // Custom pulsing marker
        const customPinIcon = L.divIcon({
          className: "custom-leaflet-marker",
          html: `
            <div style="position: relative; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -100%);">
              <span style="position: absolute; bottom: -4px; width: 32px; height: 32px; border-radius: 9999px; background: rgba(239, 68, 68, 0.3); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
              <span style="position: absolute; bottom: -2px; width: 16px; height: 16px; border-radius: 9999px; background: rgba(220, 38, 38, 0.4);"></span>
              <div style="position: relative; display: flex; width: 38px; height: 38px; align-items: center; justify-content: center; border-radius: 14px; background: linear-gradient(135deg, #dc2626, #f43f5e); color: white; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3); border: 2px solid white;">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </div>
            </div>
          `,
          iconSize: [38, 38],
          iconAnchor: [19, 38],
          popupAnchor: [0, -40],
        });

        // Add marker
        const marker = L.marker([lat, lng], { icon: customPinIcon }).addTo(map);

        // Rich interactive popup
        const popupContent = document.createElement("div");
        popupContent.className = "leaflet-popup-card p-1 text-slate-900";
        popupContent.innerHTML = `
          <div style="min-width: 210px; font-family: inherit;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
              <span style="font-weight: 700; font-size: 13px; color: #004282;">${title}</span>
            </div>
            <p style="font-size: 11px; color: #475569; margin: 0 0 6px 0; line-height: 1.4;">
              ${address}
            </p>
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; border-top: 1px solid #e2e8f0; padding-top: 6px;">
              <span style="font-size: 10px; font-weight: 700; color: #d97706;">★ 4.9 (300+ Reviews)</span>
              <a href="${targetMapsUrl}" target="_blank" rel="noopener noreferrer" style="font-size: 10px; font-weight: 700; color: #004282; text-decoration: underline;">
                Directions &rarr;
              </a>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent).openPopup();

        setMapReady(true);
      })
      .catch((err) => {
        // Fallback gracefully without unhandled exception
        console.warn("Leaflet map initialization skipped:", err);
      });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lng, title, address, targetMapsUrl, zoom]);

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], zoom, { animate: true });
    }
  };

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border bg-slate-100 shadow-md group">
      {/* Map Container Element */}
      <div
        ref={mapContainerRef}
        className="size-full z-0"
        data-testid="leaflet-map-container"
      />

      {/* Fallback Skeleton while loading */}
      {!mapReady && (
        <div className="absolute inset-0 z-0 flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-6 text-center text-muted-foreground animate-pulse">
          <div className="flex flex-col items-center gap-2">
            <MapPin className="size-8 text-primary/60" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Loading Campus Map...
            </p>
            <p className="text-xs text-slate-500">
              OpenStreetMap Interactive View
            </p>
          </div>
        </div>
      )}

      {/* Modern Floating UI Controls Overlay */}
      {mapReady && (
        <>
          {/* Top Left: Location Badge */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2 rounded-xl bg-white/95 backdrop-blur-md px-3 py-1.5 shadow-md border border-slate-200/80 text-xs font-bold text-slate-800">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="truncate max-w-[180px] sm:max-w-[220px]">
              Live Campus Map
            </span>
          </div>

          {/* Top Right: Map Controls Stack */}
          <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
            <button
              type="button"
              onClick={handleRecenter}
              title="Recenter Map"
              aria-label="Recenter Map"
              className="flex size-8 items-center justify-center rounded-xl bg-white/95 hover:bg-white text-slate-700 shadow-md border border-slate-200/80 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <RefreshCw className="size-4" />
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              title="Zoom In"
              aria-label="Zoom In"
              className="flex size-8 items-center justify-center rounded-xl bg-white/95 hover:bg-white text-slate-700 shadow-md border border-slate-200/80 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <ZoomIn className="size-4" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              title="Zoom Out"
              aria-label="Zoom Out"
              className="flex size-8 items-center justify-center rounded-xl bg-white/95 hover:bg-white text-slate-700 shadow-md border border-slate-200/80 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <ZoomOut className="size-4" />
            </button>
          </div>

          {/* Bottom Banner: Direct Navigation CTA */}
          <div className="absolute bottom-3 inset-x-3 z-10 flex items-center justify-between gap-2 rounded-xl bg-white/95 backdrop-blur-md p-2.5 shadow-lg border border-slate-200/80">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-600">
                <MapPin className="size-4" />
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {title}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  Thodupuzha, Idukki District
                </p>
              </div>
            </div>

            <a
              href={targetMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#004282] hover:bg-[#003366] text-white px-3 py-1.5 text-xs font-bold shadow-xs transition-all active:scale-95"
            >
              <Navigation className="size-3.5" />
              <span>Navigate</span>
              <ExternalLink className="size-3 opacity-70" />
            </a>
          </div>
        </>
      )}
    </div>
  );
}
