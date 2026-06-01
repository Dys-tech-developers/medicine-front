"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "@/lib/leaflet";
import L from "leaflet";
// @ts-ignore
import "leaflet-routing-machine";

/* ─────────────────────────────────
   TOKENS
───────────────────────────────── */
const T = {
  white:      "#FFFFFF",
  ink:        "#0F1C17",
  inkMid:     "#2F4A3D",
  inkMuted:   "#6B8377",
  line:       "#E3EFE8",
  lineSoft:   "#EEF6F1",
  green50:    "#ECFDF5",
  green100:   "#D1FAE5",
  green200:   "#A7F3D0",
  green300:   "#6EE7B7",
  green400:   "#34D399",
  green500:   "#10B981",
  green600:   "#059669",
  green700:   "#047857",
  green800:   "#065F46",
  red:        "#EF4444",
  redLight:   "#FEF2F2",
  amber:      "#B45309",
  amberLight: "#FFFBEB",
  glass:      "rgba(255,255,255,0.82)",
  glassDark:  "rgba(15,28,23,0.55)",
  shadow:     "0 10px 30px rgba(5,85,55,0.12), 0 2px 6px rgba(5,85,55,0.06)",
  shadowLg:   "0 20px 50px rgba(5,85,55,0.18), 0 4px 12px rgba(5,85,55,0.08)",
};

/* ─────────────────────────────────
   GLOBAL STYLES + RESPONSIVE LAYOUT
───────────────────────────────── */
function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

      .mrx, .mrx * { box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; }

      @keyframes mrxFadeUp   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
      @keyframes mrxFadeDown { from{opacity:0;transform:translateY(-14px)} to{opacity:1;transform:translateY(0)} }
      @keyframes mrxFade     { from{opacity:0} to{opacity:1} }
      @keyframes mrxSpin     { to{transform:rotate(360deg)} }
      @keyframes mrxRipple   { 0%{transform:scale(1);opacity:.55} 100%{transform:scale(3);opacity:0} }
      @keyframes mrxPulse    { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.55;transform:scale(.92)} }
      @keyframes mrxSlideUp  { from{opacity:0;transform:translate(-50%,100%)} to{opacity:1;transform:translate(-50%,0)} }
      @keyframes mrxShimmer  { 0%{background-position:-600px 0} 100%{background-position:600px 0} }

      /* Leaflet overrides */
      .mrx .leaflet-container { background:${T.lineSoft}!important; font-family:'Plus Jakarta Sans',sans-serif!important; }
      .mrx .leaflet-routing-container { display:none!important; }
      .mrx .leaflet-popup-content-wrapper {
        background:${T.white}!important; border:1.5px solid ${T.line}!important; border-radius:12px!important;
        box-shadow:${T.shadow}!important; color:${T.ink}!important;
        font-family:'Plus Jakarta Sans',sans-serif!important; font-size:13px!important; padding:9px 13px!important;
      }
      .mrx .leaflet-popup-content { margin:0!important; }
      .mrx .leaflet-popup-tip { background:${T.white}!important; }
      .mrx .leaflet-control-zoom {
        border:1px solid ${T.line}!important; border-radius:14px!important; overflow:hidden!important;
        box-shadow:${T.shadow}!important; margin:0!important;
      }
      .mrx .leaflet-control-zoom a {
        background:${T.white}!important; color:${T.green700}!important;
        border-bottom:1px solid ${T.line}!important; font-size:17px!important;
        width:38px!important; height:38px!important; line-height:38px!important;
        transition:background .15s!important;
      }
      .mrx .leaflet-control-zoom a:hover { background:${T.green50}!important; }
      .mrx .leaflet-top.leaflet-right {
        top:auto!important; right:16px!important; bottom:calc(var(--mrx-bottomsheet-h, 180px) + 16px)!important;
      }
      .mrx .leaflet-tile { filter: saturate(0.88) brightness(1.02) contrast(0.98); }

      /* ROOT: mapa como fondo full-bleed */
      .mrx-root {
        position: relative;
        height: 100dvh;
        width: 100%;
        overflow: hidden;
        background: ${T.lineSoft};
        color: ${T.ink};
      }
      .mrx-mapLayer { position:absolute; inset:0; z-index:1; }

      /* TOPBAR glass */
      .mrx-topbar {
        position: absolute;
        top: 14px; left: 14px; right: 14px;
        z-index: 500;
        display: flex; flex-direction: column; gap: 10px;
        animation: mrxFadeDown .35s ease both;
        pointer-events: none;
      }
      .mrx-topbar > * { pointer-events: auto; }

      .mrx-topbarRow {
        display: flex; align-items: center; gap: 10px;
        background: ${T.glass};
        backdrop-filter: blur(18px) saturate(1.2);
        -webkit-backdrop-filter: blur(18px) saturate(1.2);
        border: 1px solid rgba(255,255,255,0.6);
        border-radius: 18px;
        padding: 8px;
        box-shadow: ${T.shadow};
      }

      .mrx-brand {
        display: inline-flex; align-items: center; gap: 10px;
        padding: 4px 8px 4px 4px; flex-shrink: 0;
      }
      .mrx-brandBadge {
        width: 36px; height: 36px; border-radius: 12px; flex-shrink: 0;
        background: linear-gradient(135deg, ${T.green500}, ${T.green700});
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 6px 14px rgba(5,150,105,.28);
      }
      .mrx-brandText { display: none; min-width: 0; }
      @media (min-width: 900px) { .mrx-brandText { display: block; } }

      .mrx-search {
        flex: 1; min-width: 0;
        display: flex; align-items: center; gap: 8px;
        background: ${T.white};
        border: 1.5px solid ${T.line};
        border-radius: 14px;
        padding: 0 12px;
        transition: border-color .2s, box-shadow .2s;
      }
      .mrx-search[data-focus="true"] {
        border-color: ${T.green500};
        box-shadow: 0 0 0 4px ${T.green100};
      }
      .mrx-search input {
        flex: 1; min-width: 0; border: none; outline: none; background: transparent;
        font-size: 14px; color: ${T.ink}; padding: 12px 0;
        font-family: 'Plus Jakarta Sans', sans-serif;
      }
      .mrx-search input::placeholder { color: ${T.inkMuted}; }

      .mrx-searchIconBtn {
        flex-shrink: 0; border: none; background: transparent;
        cursor: pointer; color: ${T.inkMuted};
        width: 30px; height: 30px; border-radius: 8px;
        display: inline-flex; align-items: center; justify-content: center;
        transition: background .15s, color .15s;
      }
      .mrx-searchIconBtn:hover { background: ${T.green50}; color: ${T.green700}; }
      .mrx-searchIconBtn[data-active="true"] {
        background: ${T.green50}; color: ${T.green700};
        box-shadow: 0 0 0 1.5px ${T.green300} inset;
      }

      .mrx-cta {
        flex-shrink: 0; border: none; cursor: pointer;
        background: linear-gradient(135deg, ${T.green500}, ${T.green700});
        color: ${T.white}; font-weight: 700; font-size: 13px;
        height: 42px; padding: 0 16px; border-radius: 12px;
        display: inline-flex; align-items: center; gap: 6px;
        box-shadow: 0 6px 18px rgba(5,150,105,.3);
        transition: transform .15s, box-shadow .15s, opacity .15s;
      }
      .mrx-cta:hover { transform: translateY(-1px); box-shadow: 0 8px 22px rgba(5,150,105,.35); }
      .mrx-cta:active { transform: scale(.97); }
      .mrx-cta:disabled { opacity: .55; cursor: not-allowed; transform: none; box-shadow: none; }
      .mrx-cta__label { display: none; }
      @media (min-width: 540px) { .mrx-cta__label { display: inline; } }

      .mrx-gps {
        flex-shrink: 0;
        display: inline-flex; align-items: center; gap: 7px;
        background: ${T.white};
        border: 1px solid ${T.line};
        border-radius: 999px;
        padding: 6px 10px 6px 9px;
        font-size: 12px; font-weight: 600;
        white-space: nowrap;
      }
      .mrx-gpsDot {
        width: 8px; height: 8px; border-radius: 50%;
        animation: mrxPulse 2s infinite;
      }
      .mrx-gpsLabel { display: none; }
      @media (min-width: 640px) { .mrx-gpsLabel { display: inline; } }

      /* CHIPS row (accesos rápidos) */
      .mrx-chips {
        display: flex; gap: 8px; overflow-x: auto;
        padding: 2px 2px 6px;
        scrollbar-width: none;
      }
      .mrx-chips::-webkit-scrollbar { display: none; }
      .mrx-chip {
        flex-shrink: 0;
        background: ${T.glass};
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(255,255,255,0.7);
        border-radius: 999px;
        padding: 8px 14px;
        font-size: 13px; font-weight: 600; color: ${T.inkMid};
        cursor: pointer; transition: all .15s;
        display: inline-flex; align-items: center; gap: 7px;
        box-shadow: 0 4px 12px rgba(5,85,55,.08);
        white-space: nowrap;
      }
      .mrx-chip:hover {
        background: ${T.white}; border-color: ${T.green300}; color: ${T.green700};
        transform: translateY(-1px);
      }

      /* BOTTOM SHEET */
      .mrx-sheet {
        position: absolute;
        left: 14px; right: 14px; bottom: 14px;
        z-index: 500;
        background: ${T.white};
        border: 1px solid ${T.line};
        border-radius: 24px;
        box-shadow: ${T.shadowLg};
        overflow: hidden;
        animation: mrxFadeUp .35s ease both;
      }
      @media (min-width: 1024px) {
        .mrx-sheet { left: auto; right: 16px; width: 400px; }
      }

      .mrx-sheet__handle {
        width: 40px; height: 4px; border-radius: 999px;
        background: ${T.line};
        margin: 10px auto 0;
      }
      @media (min-width: 1024px) { .mrx-sheet__handle { display: none; } }

      .mrx-sheet__head {
        display: flex; align-items: center; justify-content: space-between;
        gap: 10px; padding: 14px 18px 10px;
        cursor: pointer; user-select: none;
      }
      @media (min-width: 1024px) { .mrx-sheet__head { cursor: default; } }

      .mrx-sheet__body { padding: 6px 18px 18px; }
      .mrx-sheet[data-collapsed="true"] .mrx-sheet__body { display: none; }
      @media (min-width: 1024px) {
        .mrx-sheet[data-collapsed="true"] .mrx-sheet__body { display: block; }
      }

      .mrx-route {
        display: grid; grid-template-columns: 20px 1fr; gap: 10px 12px;
        align-items: center;
      }
      .mrx-routeDot {
        width: 10px; height: 10px; border-radius: 50%;
        justify-self: center;
        box-shadow: 0 0 0 3px ${T.white}, 0 0 0 4px currentColor;
      }
      .mrx-routeLine {
        width: 2px; height: 22px; justify-self: center;
        background: repeating-linear-gradient(to bottom, ${T.green300} 0 3px, transparent 3px 7px);
      }
      .mrx-routeText { min-width: 0; }
      .mrx-routeLabel { font-size: 10px; font-weight: 700; color: ${T.inkMuted}; text-transform: uppercase; letter-spacing: .08em; }
      .mrx-routeValue { margin: 1px 0 0; font-size: 13px; font-weight: 600; color: ${T.ink}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .mrx-routeValue--muted { color: ${T.inkMuted}; font-weight: 500; }
      .mrx-routeValue--mono { font-family: 'JetBrains Mono', monospace; font-size: 11.5px; }

      .mrx-stats {
        display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
        margin: 14px 0 12px;
      }
      .mrx-stat {
        background: ${T.lineSoft};
        border: 1px solid ${T.line};
        border-radius: 14px;
        padding: 10px 12px;
      }
      .mrx-statLabel { font-size: 10px; font-weight: 700; color: ${T.inkMuted}; text-transform: uppercase; letter-spacing: .08em; }
      .mrx-statValue { margin: 2px 0 0; font-size: 18px; font-weight: 800; color: ${T.ink}; font-family: 'JetBrains Mono', monospace; }

      .mrx-sheet__actions { display: flex; gap: 8px; }
      .mrx-btn {
        flex: 1; cursor: pointer; border: none;
        height: 44px; border-radius: 12px; padding: 0 14px;
        font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 13px;
        display: inline-flex; align-items: center; justify-content: center; gap: 6px;
        transition: transform .15s, background .15s, border-color .15s;
      }
      .mrx-btn--primary {
        color: ${T.white};
        background: linear-gradient(135deg, ${T.green500}, ${T.green700});
        box-shadow: 0 6px 16px rgba(5,150,105,.28);
      }
      .mrx-btn--primary:hover { transform: translateY(-1px); }
      .mrx-btn--ghost {
        background: transparent; color: ${T.inkMid};
        border: 1.5px solid ${T.line};
      }
      .mrx-btn--ghost:hover { border-color: ${T.green400}; color: ${T.green700}; background: ${T.green50}; }

      /* FAB stack lateral */
      .mrx-fabs {
        position: absolute; right: 14px; z-index: 450;
        display: flex; flex-direction: column; gap: 10px;
        bottom: calc(var(--mrx-bottomsheet-h, 180px) + 14px);
        transition: bottom .2s ease;
      }
      .mrx-fab {
        width: 44px; height: 44px; border-radius: 14px;
        background: ${T.white}; border: 1px solid ${T.line};
        color: ${T.green700};
        display: inline-flex; align-items: center; justify-content: center;
        cursor: pointer; box-shadow: ${T.shadow};
        transition: transform .15s, background .15s, border-color .15s;
      }
      .mrx-fab:hover { background: ${T.green50}; border-color: ${T.green300}; transform: translateY(-1px); }
      .mrx-fab:active { transform: scale(.94); }
      .mrx-fab[data-active="true"] {
        background: linear-gradient(135deg, ${T.green500}, ${T.green700});
        color: ${T.white}; border-color: transparent;
        box-shadow: 0 6px 18px rgba(5,150,105,.35);
      }
      .mrx-fab__dot {
        position: absolute; top: 6px; right: 6px;
        width: 8px; height: 8px; border-radius: 50%;
        background: ${T.amber}; box-shadow: 0 0 0 2px ${T.white};
        animation: mrxPulse 1.4s infinite;
      }

      /* Floating toasts */
      .mrx-toast {
        position: absolute; left: 50%; transform: translateX(-50%);
        z-index: 600; top: calc(var(--mrx-topbar-h, 72px) + 24px);
        background: ${T.glass};
        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);
        border: 1px solid rgba(255,255,255,0.7);
        padding: 8px 14px; border-radius: 999px;
        font-size: 12px; font-weight: 600;
        display: inline-flex; align-items: center; gap: 8px;
        box-shadow: ${T.shadow};
        max-width: calc(100% - 40px);
        animation: mrxSlideUp .35s ease both;
      }

      .mrx-toast--error { color: ${T.red}; }
      .mrx-toast--warn  { color: ${T.amber}; }
      .mrx-toast--info  { color: ${T.green700}; }

      /* Full-screen placeholder overlay */
      .mrx-hero {
        position: absolute; inset: 0; z-index: 50;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        gap: 18px; padding: 32px; text-align: center;
        background: radial-gradient(1200px 600px at 50% 40%, ${T.green100}, ${T.lineSoft});
      }
    `}</style>
  );
}

/* ─────────────────────────────────
   MAP HELPERS
───────────────────────────────── */
function ClickHandler({ enabled, onSelect }: {
  enabled: boolean;
  onSelect: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (!enabled) return;
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapRefSync({ onMapReady }: { onMapReady: (map: L.Map) => void }) {
  const map = useMap();
  useEffect(() => {
    onMapReady(map);
    const t = setTimeout(() => map.invalidateSize(), 120);
    return () => clearTimeout(t);
  }, [map, onMapReady]);
  return null;
}

function MapAutoResize({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  const map = useMap();
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(el);
    const onWinResize = () => map.invalidateSize();
    window.addEventListener("resize", onWinResize);
    window.addEventListener("orientationchange", onWinResize);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onWinResize);
      window.removeEventListener("orientationchange", onWinResize);
    };
  }, [containerRef, map]);
  return null;
}

/* Pin con centro exacto en el punto real */
function makeMarker(color: string, label: string, pulse = false) {
  const W = 120;
  const H = 58;
  const DOT = 18;
  const DOT_CENTER_Y = DOT / 2;

  return L.divIcon({
    className: "mrx-pin",
    html: `
      <div style="width:${W}px;height:${H}px;display:flex;flex-direction:column;align-items:center;pointer-events:none">
        <div style="position:relative;width:${DOT}px;height:${DOT}px">
          ${pulse ? `<div style="position:absolute;inset:-7px;border-radius:50%;background:${color};opacity:.22;animation:mrxRipple 2s infinite ease-out"></div>` : ""}
          <div style="width:${DOT}px;height:${DOT}px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,.25);position:relative;z-index:1"></div>
        </div>
        <div style="width:2px;height:12px;background:${color};opacity:.6"></div>
        <div style="background:white;border:1px solid ${color}55;border-radius:7px;padding:3px 8px;font-size:10.5px;color:#0F1C17;font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;white-space:nowrap;box-shadow:0 4px 10px rgba(0,0,0,.12)">${label}</div>
      </div>
    `,
    iconSize: [W, H],
    iconAnchor: [W / 2, DOT_CENTER_Y],
    popupAnchor: [0, -DOT_CENTER_Y - 6],
  });
}

/* ─────────────────────────────────
   HERO (sin GPS)
───────────────────────────────── */
function Hero({ onRequest, loading, error }: { onRequest: () => void; loading: boolean; error: string | null }) {
  return (
    <div className="mrx-hero">
      <div style={{
        width: 78, height: 78, borderRadius: 26,
        background: `linear-gradient(135deg, ${T.green500}, ${T.green700})`,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 18px 36px rgba(5,150,105,.35)`, position: "relative",
      }}>
        {loading && [0,1,2].map(i => (
          <div key={i} style={{
            position: "absolute", inset: 0, borderRadius: 26,
            border: `2px solid ${T.green400}`, opacity: .55,
            animation: `mrxRipple 2s infinite ease-out ${i * 0.45}s`,
          }}/>
        ))}
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="white"/>
          <circle cx="12" cy="9" r="3" fill={T.green600}/>
        </svg>
      </div>
      <div style={{ maxWidth: 380 }}>
        <h2 style={{ margin: "0 0 8px", fontSize: "clamp(20px, 3vw, 26px)", fontWeight: 800, color: T.ink, letterSpacing: "-0.02em" }}>
          {loading ? "Obteniendo ubicación..." : "Navegación médica, simple"}
        </h2>
        <p style={{ margin: 0, fontSize: 14, color: T.inkMuted, lineHeight: 1.55 }}>
          {loading
            ? "Estamos verificando la señal GPS. Esto toma un segundo."
            : "Activá tu ubicación y calculamos la ruta al centro de salud más cercano en tiempo real."}
        </p>
      </div>
      {error && (
        <div style={{
          background: T.redLight, border: `1px solid #FECACA`,
          padding: "8px 14px", borderRadius: 12, color: T.red,
          fontSize: 12, fontWeight: 600,
        }}>{error}</div>
      )}
      {!loading && (
        <button
          onClick={onRequest}
          style={{
            marginTop: 6,
            background: `linear-gradient(135deg, ${T.green500}, ${T.green700})`,
            color: "white", border: "none", borderRadius: 14,
            padding: "14px 28px", fontSize: 14, fontWeight: 700,
            cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
            boxShadow: `0 14px 30px rgba(5,150,105,.32)`,
            display: "inline-flex", alignItems: "center", gap: 10,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" fill="white"/>
            <circle cx="12" cy="12" r="7" stroke="white" strokeWidth="1.8"/>
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          Activar ubicación
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────────────
   MAIN
───────────────────────────────── */
const QUICK_ITEMS = [
  { label: "Hospitales cercanos", query: "hospital cerca", emoji: "🏥" },
  { label: "Farmacias",           query: "farmacia",       emoji: "💊" },
  { label: "Guardia 24hs",        query: "guardia 24 hs",  emoji: "🚑" },
  { label: "Laboratorios",        query: "laboratorio",    emoji: "🔬" },
  { label: "Odontología",         query: "dentista",       emoji: "🦷" },
];

export default function UserLocationMap() {
  const [position,    setPosition]    = useState<{ lat: number; lng: number } | null>(null);
  const [destination, setDestination] = useState<{ lat: number; lng: number } | null>(null);
  const [destLabel,   setDestLabel]   = useState<string>("");
  const [address,     setAddress]     = useState("");
  const [searching,   setSearching]   = useState(false);
  const [notFound,    setNotFound]    = useState(false);
  const [selectMode,  setSelectMode]  = useState(false);
  const [distance,    setDistance]    = useState<number | null>(null);
  const [duration,    setDuration]    = useState<number | null>(null);
  const [locating,    setLocating]    = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [focused,     setFocused]     = useState(false);
  const [sheetCollapsed, setSheetCollapsed] = useState(false);

  const mapRef     = useRef<L.Map | null>(null);
  const routingRef = useRef<any>(null);
  const mapBoxRef  = useRef<HTMLDivElement | null>(null);
  const rootRef    = useRef<HTMLDivElement | null>(null);
  const sheetRef   = useRef<HTMLDivElement | null>(null);

  const handleMapReady = useCallback((map: L.Map) => { mapRef.current = map; }, []);

  const handleGetLocation = useCallback(() => {
    setLocating(true); setError(null);
    if (!navigator.geolocation) {
      setError("Geolocalización no soportada en este navegador");
      setLocating(false); return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setError("No pudimos obtener tu ubicación. Revisá los permisos.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }, []);

  const searchAddress = useCallback(async (q?: string) => {
    const query = (q ?? address).trim();
    setNotFound(false);
    if (!query) return;
    setSearching(true);
    try {
      const res  = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.length > 0) {
        const dest = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        setDestination(dest);
        setDestLabel(data[0].display_name?.split(",").slice(0, 2).join(",") || query);
        setDistance(null); setDuration(null);
        setSelectMode(false);
        if (mapRef.current) mapRef.current.flyTo([dest.lat, dest.lng], 14, { duration: 0.8 });
      } else {
        setDestination(null);
        setNotFound(true);
      }
    } catch {
      setDestination(null);
      setNotFound(true);
    } finally {
      setSearching(false);
    }
  }, [address]);

  const clearAll = useCallback(() => {
    setDestination(null); setDestLabel("");
    setDistance(null); setDuration(null);
    setAddress(""); setNotFound(false);
    if (routingRef.current && mapRef.current) {
      try { mapRef.current.removeControl(routingRef.current); } catch {}
      routingRef.current = null;
    }
    if (position && mapRef.current) {
      mapRef.current.flyTo([position.lat, position.lng], 14, { duration: 0.6 });
    }
  }, [position]);

  const recenterOnMe = useCallback(() => {
    if (position && mapRef.current) {
      mapRef.current.flyTo([position.lat, position.lng], 15, { duration: 0.6 });
    } else {
      handleGetLocation();
    }
  }, [position, handleGetLocation]);

  const fitRoute = useCallback(() => {
    if (!mapRef.current || !position || !destination) return;
    const bounds = L.latLngBounds(
      L.latLng(position.lat, position.lng),
      L.latLng(destination.lat, destination.lng)
    );
    mapRef.current.fitBounds(bounds, { padding: [80, 80], maxZoom: 15, animate: true });
  }, [position, destination]);

  const onMapSelect = useCallback((lat: number, lng: number) => {
    setDestination({ lat, lng });
    setDestLabel(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    setDistance(null); setDuration(null);
    setSelectMode(false);
  }, []);

  /* Ruteo OSRM */
  useEffect(() => {
    if (!position || !destination || !mapRef.current) return;
    if (routingRef.current) {
      try { mapRef.current.removeControl(routingRef.current); } catch {}
      routingRef.current = null;
    }
    // @ts-ignore
    const routing = L.Routing.control({
      waypoints: [
        L.latLng(position.lat, position.lng),
        L.latLng(destination.lat, destination.lng),
      ],
      addWaypoints: false, routeWhileDragging: false,
      show: false, draggableWaypoints: false,
      createMarker: () => null,
      lineOptions: {
        styles: [
          { color: T.white,     weight: 10, opacity: 0.95 },
          { color: T.green200,  weight: 8,  opacity: 0.65 },
          { color: T.green600,  weight: 4,  opacity: 1    },
        ],
      },
    }).addTo(mapRef.current);

    routing.on("routesfound", (e: any) => {
      setDistance(e.routes[0].summary.totalDistance);
      setDuration(e.routes[0].summary.totalTime);
      fitRoute();
    });

    routingRef.current = routing;
    return () => {
      if (routingRef.current && mapRef.current) {
        try { mapRef.current.removeControl(routingRef.current); } catch {}
        routingRef.current = null;
      }
    };
  }, [position, destination, fitRoute]);

  /* Sync de altura del bottom sheet hacia CSS var (para que los FABs y el zoom control no lo tapen) */
  useEffect(() => {
    if (!rootRef.current) return;
    const root = rootRef.current;
    const setVar = () => {
      const sheet = sheetRef.current;
      if (!sheet) return;
      const h = sheetCollapsed ? 64 : sheet.offsetHeight;
      root.style.setProperty("--mrx-bottomsheet-h", `${h}px`);
    };
    setVar();
    const ro = new ResizeObserver(setVar);
    if (sheetRef.current) ro.observe(sheetRef.current);
    window.addEventListener("resize", setVar);
    return () => { ro.disconnect(); window.removeEventListener("resize", setVar); };
  }, [sheetCollapsed, destination, error, position]);

  const fmtDist = (m: number) => (m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`);
  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60);
    return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m} min`;
  };

  const hasRoute  = distance !== null && duration !== null;
  const calcRoute = !hasRoute && !!destination && !!position;
  const showSheet = !!position;

  return (
    <div className="mrx mrx-root" ref={rootRef} style={{ ["--mrx-bottomsheet-h" as any]: showSheet ? "200px" : "0px", ["--mrx-topbar-h" as any]: "72px" }}>
      <GlobalStyles />

      {/* MAPA DE FONDO */}
      <div className="mrx-mapLayer" ref={mapBoxRef}>
        {position ? (
          <MapContainer
            center={[position.lat, position.lng]}
            zoom={14}
            style={{ height: "100%", width: "100%" }}
            zoomControl={true}
            scrollWheelZoom={true}
            attributionControl={false}
          >
            <MapRefSync onMapReady={handleMapReady} />
            <MapAutoResize containerRef={mapBoxRef} />
            <TileLayer
              attribution="&copy; OpenStreetMap &copy; CartoDB"
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            <ClickHandler enabled={selectMode} onSelect={onMapSelect} />
            <Marker position={[position.lat, position.lng]} icon={makeMarker(T.green500, "Estás acá", true)}>
              <Popup>📍 Estás acá</Popup>
            </Marker>
            {destination && (
              <Marker position={[destination.lat, destination.lng]} icon={makeMarker(T.green700, destLabel || "Destino")}>
                <Popup>🏥 {destLabel || "Destino seleccionado"}</Popup>
              </Marker>
            )}
          </MapContainer>
        ) : (
          <Hero onRequest={handleGetLocation} loading={locating} error={error} />
        )}
      </div>

      {/* TOP BAR GLASS */}
      <div className="mrx-topbar">
        <div className="mrx-topbarRow">
          <div className="mrx-brand">
            <div className="mrx-brandBadge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 21s-9-5.5-9-11.5A6 6 0 0112 5.5a6 6 0 019 4c0 6-9 11.5-9 11.5z" fill="white"/>
                <path d="M9 10.5h6M12 7.5v6" stroke={T.green400} strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="mrx-brandText">
              <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: T.ink, letterSpacing: "-0.02em", lineHeight: 1 }}>
                Med<span style={{ color: T.green600 }}>Route</span>
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 10, color: T.inkMuted, fontWeight: 500 }}>Navegación médica</p>
            </div>
          </div>

          <div className="mrx-search" data-focus={focused}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, color: T.inkMuted }}>
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
              <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              value={address}
              onChange={(e) => { setAddress(e.target.value); setNotFound(false); }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={(e) => e.key === "Enter" && searchAddress()}
              placeholder="Buscar hospital, clínica, dirección..."
              disabled={!position}
            />
            {address && (
              <button
                type="button"
                className="mrx-searchIconBtn"
                onClick={() => { setAddress(""); setNotFound(false); }}
                aria-label="Borrar"
                title="Borrar"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            )}
            <button
              type="button"
              className="mrx-searchIconBtn"
              data-active={selectMode}
              onClick={() => setSelectMode((p) => !p)}
              aria-label="Elegir en el mapa"
              title="Elegir en el mapa"
              disabled={!position}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" fill="currentColor"/>
                <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.8"/>
              </svg>
            </button>
          </div>

          <button
            className="mrx-cta"
            disabled={!address || searching || !position}
            onClick={() => searchAddress()}
          >
            {searching ? (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ animation: "mrxSpin 1s linear infinite" }}>
                  <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2" strokeDasharray="28 8"/>
                </svg>
                <span className="mrx-cta__label">Buscando</span>
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="7" stroke="white" strokeWidth="2"/>
                  <path d="M16.5 16.5L21 21" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span className="mrx-cta__label">Buscar</span>
              </>
            )}
          </button>

          <div
            className="mrx-gps"
            style={{ color: position ? T.green700 : T.amber }}
            title={position ? "GPS activo" : "Esperando GPS"}
          >
            <span className="mrx-gpsDot" style={{ background: position ? T.green500 : T.amber }} />
            <span className="mrx-gpsLabel">{position ? "GPS activo" : "Esperando GPS"}</span>
          </div>
        </div>

        {/* Chips de accesos rápidos */}
        {position && (
          <div className="mrx-chips">
            {QUICK_ITEMS.map((it) => (
              <button
                key={it.label}
                className="mrx-chip"
                onClick={() => { setAddress(it.query); searchAddress(it.query); }}
              >
                <span>{it.emoji}</span>
                {it.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* TOASTS flotantes */}
      {selectMode && (
        <div className="mrx-toast mrx-toast--info">
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.green500, animation: "mrxPulse 1.2s infinite" }} />
          Tocá cualquier punto del mapa
        </div>
      )}
      {notFound && (
        <div className="mrx-toast mrx-toast--error">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><path d="M12 8v5M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          Dirección no encontrada
        </div>
      )}
      {calcRoute && (
        <div className="mrx-toast mrx-toast--info">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ animation: "mrxSpin 1s linear infinite" }}>
            <circle cx="12" cy="12" r="9" stroke={T.green600} strokeWidth="2" strokeDasharray="28 8"/>
          </svg>
          Calculando mejor ruta...
        </div>
      )}

      {/* FAB stack */}
      {position && (
        <div className="mrx-fabs">
          <button
            className="mrx-fab"
            onClick={recenterOnMe}
            aria-label="Centrar en mi ubicación"
            title="Centrar en mi ubicación"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" fill="currentColor"/>
              <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>

          <button
            className="mrx-fab"
            data-active={selectMode}
            onClick={() => setSelectMode((p) => !p)}
            aria-label="Elegir destino en el mapa"
            title="Elegir destino en el mapa"
            style={{ position: "relative" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.8"/>
              <circle cx="12" cy="9" r="2.5" fill="currentColor"/>
            </svg>
            {selectMode && <span className="mrx-fab__dot" />}
          </button>

          {hasRoute && (
            <button
              className="mrx-fab"
              onClick={fitRoute}
              aria-label="Ver ruta completa"
              title="Ver ruta completa"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M4 4h6v6H4zM14 14h6v6h-6z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                <path d="M10 7h4a4 4 0 014 4v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
      )}

      {/* BOTTOM SHEET */}
      {showSheet && (
        <div className="mrx-sheet" ref={sheetRef} data-collapsed={sheetCollapsed}>
          <div className="mrx-sheet__handle" />
          <div className="mrx-sheet__head" onClick={() => setSheetCollapsed((c) => !c)}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 11, flexShrink: 0,
                background: destination ? `linear-gradient(135deg, ${T.green500}, ${T.green700})` : T.green100,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {destination ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M3 12h13M11 6l6 6-6 6" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="3" fill={T.green700}/>
                    <circle cx="12" cy="12" r="7" stroke={T.green700} strokeWidth="1.8"/>
                  </svg>
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: T.inkMuted, textTransform: "uppercase", letterSpacing: ".08em" }}>
                  {destination ? (hasRoute ? "Ruta lista" : "Calculando...") : "Próximo destino"}
                </p>
                <p style={{
                  margin: "2px 0 0", fontSize: 15, fontWeight: 700, color: T.ink,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "58vw",
                }}>
                  {destination ? (destLabel || "Destino seleccionado") : "Buscá o elegí un punto"}
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label={sheetCollapsed ? "Expandir" : "Colapsar"}
              style={{
                background: "transparent", border: "none", cursor: "pointer",
                padding: 6, borderRadius: 8, color: T.inkMuted,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ transform: sheetCollapsed ? "rotate(180deg)" : "none", transition: "transform .2s" }}>
                <path d="M6 15l6-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <div className="mrx-sheet__body">
            {/* Lista origen → destino */}
            <div className="mrx-route">
              <span className="mrx-routeDot" style={{ color: T.green500 }} />
              <div className="mrx-routeText">
                <p className="mrx-routeLabel">Origen</p>
                <p className="mrx-routeValue mrx-routeValue--mono">
                  {position!.lat.toFixed(5)}, {position!.lng.toFixed(5)}
                </p>
              </div>
              {destination ? (
                <>
                  <span className="mrx-routeLine" />
                  <span />
                  <span className="mrx-routeDot" style={{ color: T.green700 }} />
                  <div className="mrx-routeText">
                    <p className="mrx-routeLabel">Destino</p>
                    <p className="mrx-routeValue">{destLabel || "Destino seleccionado"}</p>
                  </div>
                </>
              ) : (
                <>
                  <span className="mrx-routeLine" />
                  <span />
                  <span className="mrx-routeDot" style={{ color: T.inkMuted, boxShadow: `0 0 0 3px ${T.white}, 0 0 0 4px ${T.inkMuted}` }} />
                  <div className="mrx-routeText">
                    <p className="mrx-routeLabel">Destino</p>
                    <p className="mrx-routeValue mrx-routeValue--muted">Sin seleccionar</p>
                  </div>
                </>
              )}
            </div>

            {/* Stats distancia / tiempo */}
            {destination && (
              <div className="mrx-stats">
                <div className="mrx-stat">
                  <p className="mrx-statLabel">Distancia</p>
                  <p className="mrx-statValue">
                    {hasRoute ? fmtDist(distance!) :
                      <span style={{ display: "inline-block", width: "60%", height: 18, borderRadius: 6,
                        background: `linear-gradient(90deg, ${T.green50} 0%, ${T.green100} 50%, ${T.green50} 100%)`,
                        backgroundSize: "600px 100%", animation: "mrxShimmer 1.6s infinite linear" }} />
                    }
                  </p>
                </div>
                <div className="mrx-stat">
                  <p className="mrx-statLabel">Tiempo est.</p>
                  <p className="mrx-statValue">
                    {hasRoute ? fmtTime(duration!) :
                      <span style={{ display: "inline-block", width: "60%", height: 18, borderRadius: 6,
                        background: `linear-gradient(90deg, ${T.green50} 0%, ${T.green100} 50%, ${T.green50} 100%)`,
                        backgroundSize: "600px 100%", animation: "mrxShimmer 1.6s infinite linear" }} />
                    }
                  </p>
                </div>
              </div>
            )}

            {/* Acciones */}
            <div className="mrx-sheet__actions">
              {destination ? (
                <>
                  <button className="mrx-btn mrx-btn--ghost" onClick={clearAll}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                    Limpiar
                  </button>
                  <button
                    className="mrx-btn mrx-btn--primary"
                    onClick={fitRoute}
                    disabled={!hasRoute}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <path d="M3 12h13M11 6l6 6-6 6" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {hasRoute ? "Ver ruta" : "Calculando..."}
                  </button>
                </>
              ) : (
                <button
                  className="mrx-btn mrx-btn--primary"
                  onClick={() => setSelectMode(true)}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="white"/>
                    <circle cx="12" cy="9" r="2.5" fill={T.green600}/>
                  </svg>
                  Elegir destino en el mapa
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
