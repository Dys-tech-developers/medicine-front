"use client";

import { useEffect, useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
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
  bg:         "#F4FAF7",
  white:      "#FFFFFF",
  green50:    "#ECFDF5",
  green100:   "#D1FAE5",
  green200:   "#A7F3D0",
  green400:   "#34D399",
  green500:   "#10B981",
  green600:   "#059669",
  green700:   "#047857",
  green800:   "#065F46",
  text:       "#0F2B1E",
  textMid:    "#3D6B52",
  textMuted:  "#7FA891",
  border:     "#C8E8D8",
  borderMid:  "#A3D4BC",
  red:        "#EF4444",
  redLight:   "#FEF2F2",
  amber:      "#D97706",
  amberLight: "#FFFBEB",
  shadow:     "rgba(5,150,105,0.08)",
  shadowMd:   "rgba(5,150,105,0.12)",
};

/* ─────────────────────────────────
   GLOBAL STYLES
───────────────────────────────── */
function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

      .meddash * { box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; }

      @keyframes shimmer {
        0%   { background-position: -600px 0; }
        100% { background-position:  600px 0; }
      }
      @keyframes fadeUp {
        from { opacity: 0; transform: translateY(12px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
      @keyframes pulse {
        0%,100% { opacity: 1; transform: scale(1); }
        50%     { opacity: .6; transform: scale(.9); }
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      @keyframes ripple {
        0%   { transform: scale(1); opacity: .5; }
        100% { transform: scale(2.8); opacity: 0; }
      }
      @keyframes progressAnim {
        0%   { width: 10%; }
        60%  { width: 85%; }
        100% { width: 100%; }
      }
      @keyframes countUp {
        from { opacity: 0; transform: translateY(5px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      .meddash .leaflet-container { background: ${T.green50} !important; font-family: 'Plus Jakarta Sans', sans-serif !important; }
      .meddash .leaflet-routing-container { display: none !important; }
      .meddash .leaflet-popup-content-wrapper {
        background: ${T.white} !important;
        border: 1.5px solid ${T.border} !important;
        border-radius: 10px !important;
        box-shadow: 0 4px 16px ${T.shadowMd} !important;
        color: ${T.text} !important;
        font-family: 'Plus Jakarta Sans', sans-serif !important;
        font-size: 13px !important;
        padding: 8px 12px !important;
      }
      .meddash .leaflet-popup-content { margin: 0 !important; }
      .meddash .leaflet-popup-tip { background: ${T.white} !important; }
      .meddash .leaflet-control-zoom {
        border: 1.5px solid ${T.border} !important;
        border-radius: 10px !important;
        overflow: hidden;
        box-shadow: 0 2px 8px ${T.shadow} !important;
      }
      .meddash .leaflet-control-zoom a {
        background: ${T.white} !important;
        color: ${T.green600} !important;
        border-bottom: 1px solid ${T.border} !important;
        font-size: 16px !important;
        width: 30px !important; height: 30px !important;
        line-height: 30px !important;
        transition: background 0.15s !important;
      }
      .meddash .leaflet-control-zoom a:hover { background: ${T.green50} !important; }
      .meddash .leaflet-tile { filter: saturate(0.9) brightness(1.02); }
    `}</style>
  );
}

/* ─────────────────────────────────
   SKELETON
───────────────────────────────── */
function Skel({ w = "100%", h = "14px", r = "6px", style = {} }: {
  w?: string; h?: string; r?: string; style?: React.CSSProperties;
}) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: `linear-gradient(90deg, ${T.green50} 0%, ${T.green100} 50%, ${T.green50} 100%)`,
      backgroundSize: "600px 100%",
      animation: "shimmer 1.8s infinite linear",
      ...style,
    }} />
  );
}

/* ─────────────────────────────────
   STAT CARD
───────────────────────────────── */
function StatCard({ icon, label, value, loading = false, badge }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  loading?: boolean;
  badge?: string;
}) {
  return (
    <div style={{
      flex: 1, minWidth: 0,
      background: T.white,
      border: `1.5px solid ${T.border}`,
      borderRadius: "14px", padding: "16px",
      boxShadow: `0 2px 8px ${T.shadow}`,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "10px" }}>
        <div style={{
          width: "34px", height: "34px", borderRadius: "10px",
          background: T.green50, border: `1px solid ${T.green100}`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          {icon}
        </div>
        {badge && (
          <span style={{
            fontSize: "10px", background: T.green50, color: T.green700,
            border: `1px solid ${T.green100}`, borderRadius: "20px",
            padding: "2px 8px", fontWeight: 600,
          }}>{badge}</span>
        )}
      </div>
      <p style={{ margin: "0 0 3px", fontSize: "11px", color: T.textMuted, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.07em" }}>
        {label}
      </p>
      {loading
        ? <Skel h="24px" w="55%" style={{ marginTop: "4px" }} />
        : <p style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: T.text, fontFamily: "'JetBrains Mono', monospace", animation: "countUp 0.4s ease" }}>
            {value}
          </p>
      }
    </div>
  );
}

/* ─────────────────────────────────
   SIDEBAR
───────────────────────────────── */
function Sidebar({
  position, address, onAddressChange, onSearch, searching,
  selectMode, onSelectMode, destination, notFound, onClear,
}: {
  position: { lat: number; lng: number } | null;
  address: string;
  onAddressChange: (v: string) => void;
  onSearch: () => void;
  searching: boolean;
  selectMode: boolean;
  onSelectMode: () => void;
  destination: { lat: number; lng: number } | null;
  notFound: boolean;
  onClear: () => void;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{
      width: "272px", flexShrink: 0,
      background: T.white,
      borderRight: `1.5px solid ${T.border}`,
      display: "flex", flexDirection: "column",
      height: "100%", overflowY: "auto",
    }}>

      {/* Header */}
      <div style={{ padding: "18px 18px 14px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "11px", flexShrink: 0,
            background: `linear-gradient(135deg, ${T.green500}, ${T.green700})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 4px 12px ${T.shadowMd}`,
          }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
              <path d="M12 21s-9-5.5-9-11.5A6 6 0 0112 5.5a6 6 0 019 4c0 6-9 11.5-9 11.5z" fill="white"/>
              <path d="M9 10.5h6M12 7.5v6" stroke={T.green400} strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: T.text, letterSpacing: "-0.02em" }}>
              Med<span style={{ color: T.green600 }}>Route</span>
            </h1>
            <p style={{ margin: 0, fontSize: "10px", color: T.textMuted }}>Navegación médica</p>
          </div>
        </div>
      </div>

      {/* Mi ubicación */}
      <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}` }}>
        <p style={{ margin: "0 0 8px", fontSize: "10px", fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Mi ubicación
        </p>
        {position ? (
          <div style={{
            display: "flex", alignItems: "center", gap: "10px",
            background: T.green50, border: `1px solid ${T.green100}`,
            borderRadius: "10px", padding: "10px 12px",
          }}>
            <div style={{ position: "relative", flexShrink: 0, width: "12px", height: "12px" }}>
              <div style={{
                position: "absolute", inset: "-5px", borderRadius: "50%",
                background: T.green400, opacity: 0.3,
                animation: "ripple 2s infinite ease-out",
              }} />
              <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: T.green500, border: `2px solid white`, boxShadow: `0 0 0 1px ${T.green300}` }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "12px", fontWeight: 600, color: T.green700 }}>GPS activo</p>
              <p style={{ margin: 0, fontSize: "10px", color: T.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>
                {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
              </p>
            </div>
          </div>
        ) : (
          <Skel h="44px" r="10px" />
        )}
      </div>

      {/* Buscar destino */}
      <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}` }}>
        <p style={{ margin: "0 0 8px", fontSize: "10px", fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Buscar destino
        </p>

        {/* Input */}
        <div style={{
          display: "flex", alignItems: "center", gap: "8px",
          border: `1.5px solid ${focused ? T.green500 : T.border}`,
          borderRadius: "10px", padding: "0 10px 0 12px",
          background: T.white, transition: "all 0.2s",
          boxShadow: focused ? `0 0 0 3px ${T.green100}` : "none",
          marginBottom: "8px",
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, color: T.textMuted }}>
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
            <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            value={address}
            onChange={e => onAddressChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={e => e.key === "Enter" && onSearch()}
            placeholder="Hospital, clínica, dirección..."
            style={{
              flex: 1, border: "none", outline: "none", background: "transparent",
              fontSize: "13px", color: T.text, padding: "11px 0",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          />
          {address && (
            <button onClick={() => { onAddressChange(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted, fontSize: "16px", padding: "0 2px", lineHeight: 1 }}>×</button>
          )}
        </div>

        {notFound && (
          <div style={{
            background: T.redLight, border: `1px solid #FECACA`, borderRadius: "8px",
            padding: "7px 10px", display: "flex", alignItems: "center", gap: "6px",
            fontSize: "12px", color: T.red, marginBottom: "8px", animation: "fadeIn 0.3s ease",
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><path d="M12 8v5M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            Dirección no encontrada
          </div>
        )}

        <div style={{ display: "flex", gap: "7px" }}>
          <button
            onClick={onSearch}
            disabled={searching || !address}
            style={{
              flex: 1,
              background: !address ? T.green50 : `linear-gradient(135deg, ${T.green500}, ${T.green700})`,
              color: !address ? T.textMuted : "white",
              border: `1.5px solid ${!address ? T.border : "transparent"}`,
              borderRadius: "10px", padding: "10px",
              fontSize: "13px", fontWeight: 600, cursor: !address ? "default" : "pointer",
              transition: "all 0.2s", fontFamily: "'Plus Jakarta Sans', sans-serif",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
              boxShadow: address ? `0 4px 12px ${T.shadowMd}` : "none",
            }}
          >
            {searching
              ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 1s linear infinite" }}><circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2" strokeDasharray="28 8"/></svg>Buscando</>
              : "Buscar"
            }
          </button>
          <button
            onClick={onSelectMode}
            title="Elegir en el mapa"
            style={{
              width: "40px", height: "40px", borderRadius: "10px", flexShrink: 0,
              background: selectMode ? T.green50 : T.white,
              border: `1.5px solid ${selectMode ? T.green500 : T.border}`,
              color: selectMode ? T.green600 : T.textMuted,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" fill="currentColor"/>
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {selectMode && (
          <div style={{
            marginTop: "8px", background: T.amberLight,
            border: `1px solid #FDE68A`, borderRadius: "8px",
            padding: "7px 10px", display: "flex", alignItems: "center", gap: "6px",
            fontSize: "11px", color: T.amber, animation: "fadeIn 0.3s ease",
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            Tocá el mapa para seleccionar
          </div>
        )}
      </div>

      {/* Destino seleccionado */}
      {destination && (
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}`, animation: "fadeUp 0.3s ease" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <p style={{ margin: 0, fontSize: "10px", fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Destino activo
            </p>
            <button onClick={onClear} style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: "11px", color: T.red, fontFamily: "'Plus Jakarta Sans', sans-serif",
              padding: "2px 6px", borderRadius: "5px", fontWeight: 500,
            }}
              onMouseEnter={e => (e.target as HTMLElement).style.background = T.redLight}
              onMouseLeave={e => (e.target as HTMLElement).style.background = "none"}
            >
              Limpiar
            </button>
          </div>
          <div style={{
            background: T.green50, border: `1px solid ${T.green100}`,
            borderRadius: "10px", padding: "10px 12px",
            display: "flex", alignItems: "center", gap: "9px",
          }}>
            <div style={{
              width: "28px", height: "28px", borderRadius: "8px", flexShrink: 0,
              background: T.green500,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="white"/>
                <circle cx="12" cy="9" r="2.5" fill={T.green400}/>
              </svg>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "10px", color: T.textMuted }}>Coordenadas</p>
              <p style={{ margin: 0, fontSize: "11px", fontWeight: 500, color: T.text, fontFamily: "'JetBrains Mono', monospace" }}>
                {destination.lat.toFixed(4)}, {destination.lng.toFixed(4)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Accesos rápidos */}
      <div style={{ padding: "14px 18px", flex: 1 }}>
        <p style={{ margin: "0 0 8px", fontSize: "10px", fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Acceso rápido
        </p>
        {[
          { label: "Hospitales cercanos", emoji: "🏥" },
          { label: "Farmacias",            emoji: "💊" },
          { label: "Guardia 24hs",         emoji: "🚑" },
          { label: "Laboratorios",         emoji: "🔬" },
        ].map(item => (
          <button
            key={item.label}
            onClick={() => onAddressChange(item.label)}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: "9px",
              background: "none", border: `1px solid ${T.border}`, borderRadius: "9px",
              padding: "9px 11px", cursor: "pointer", marginBottom: "5px",
              textAlign: "left", transition: "all 0.15s",
              color: T.textMid, fontSize: "13px", fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = T.green50;
              (e.currentTarget as HTMLElement).style.borderColor = T.green200;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = "none";
              (e.currentTarget as HTMLElement).style.borderColor = T.border;
            }}
          >
            <span style={{ fontSize: "14px" }}>{item.emoji}</span>
            <span style={{ fontWeight: 500 }}>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────
   MAP CLICK HANDLER
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

/* ─────────────────────────────────
   CUSTOM MARKERS
───────────────────────────────── */
function makeMarker(color: string, label: string, pulse = false) {
  return L.divIcon({
    className: "",
    html: `
      <div style="display:flex;flex-direction:column;align-items:center">
        ${pulse ? `<div style="position:absolute;width:22px;height:22px;top:-4px;left:-4px;border-radius:50%;background:${color};opacity:.25;animation:ripple 2s infinite ease-out"></div>` : ""}
        <div style="width:14px;height:14px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.18);position:relative;z-index:1"></div>
        <div style="width:2px;height:10px;background:${color};opacity:.5"></div>
        <div style="background:white;border:1.5px solid ${color}25;border-radius:5px;padding:2px 7px;font-size:10px;color:#0F2B1E;font-family:'Plus Jakarta Sans',sans-serif;font-weight:600;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.1)">${label}</div>
      </div>
    `,
    iconSize: [80, 50],
    iconAnchor: [7, 14],
    popupAnchor: [33, -14],
  });
}

/* ─────────────────────────────────
   MAP PLACEHOLDER
───────────────────────────────── */
function MapPlaceholder({ onRequest, loading }: { onRequest: () => void; loading: boolean }) {
  return (
    <div style={{
      height: "100%", background: T.green50,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: "16px",
    }}>
      {loading ? (
        <>
          <div style={{ position: "relative", width: "64px", height: "64px" }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                position: "absolute", inset: `${i * -14}px`, borderRadius: "50%",
                border: `1.5px solid ${T.green400}`, opacity: 0.5,
                animation: `ripple 2s infinite ease-out ${i * 0.45}s`,
              }} />
            ))}
            <div style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              background: T.green500,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" fill="white"/>
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 600, color: T.text }}>Obteniendo ubicación...</p>
            <p style={{ margin: "0 0 12px", fontSize: "12px", color: T.textMuted }}>Verificando señal GPS</p>
            <div style={{ width: "140px", height: "3px", background: T.green100, borderRadius: "3px", overflow: "hidden", margin: "0 auto" }}>
              <div style={{ height: "100%", background: `linear-gradient(90deg, ${T.green400}, ${T.green600})`, borderRadius: "3px", animation: "progressAnim 2s ease-in-out infinite" }} />
            </div>
          </div>
        </>
      ) : (
        <>
          <div style={{ width: "60px", height: "60px", borderRadius: "18px", background: T.green100, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill={T.green500}/>
              <circle cx="12" cy="9" r="2.5" fill="white"/>
            </svg>
          </div>
          <div style={{ textAlign: "center", maxWidth: "220px" }}>
            <p style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: 600, color: T.text }}>Activá tu ubicación</p>
            <p style={{ margin: "0 0 16px", fontSize: "12px", color: T.textMuted, lineHeight: 1.5 }}>
              Necesitamos tu posición para calcular rutas
            </p>
            <button onClick={onRequest} style={{
              background: `linear-gradient(135deg, ${T.green500}, ${T.green700})`,
              color: "white", border: "none", borderRadius: "12px",
              padding: "11px 24px", fontSize: "13px", fontWeight: 600,
              cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
              boxShadow: `0 4px 16px ${T.shadowMd}`, transition: "transform 0.15s",
            }}
              onMouseEnter={e => (e.target as HTMLElement).style.transform = "scale(1.04)"}
              onMouseLeave={e => (e.target as HTMLElement).style.transform = "scale(1)"}
            >
              Permitir ubicación
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────
   MAIN
───────────────────────────────── */
export default function UserLocationMap() {
  const [position,    setPosition]    = useState<{ lat: number; lng: number } | null>(null);
  const [destination, setDestination] = useState<{ lat: number; lng: number } | null>(null);
  const [address,     setAddress]     = useState("");
  const [searching,   setSearching]   = useState(false);
  const [notFound,    setNotFound]    = useState(false);
  const [selectMode,  setSelectMode]  = useState(false);
  const [distance,    setDistance]    = useState<number | null>(null);
  const [duration,    setDuration]    = useState<number | null>(null);
  const [locating,    setLocating]    = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const mapRef     = useRef<L.Map | null>(null);
  const routingRef = useRef<any>(null);

  const originIcon = makeMarker(T.green500, "Mi ubicación", true);
  const destIcon   = makeMarker(T.green700, "Destino");

  const handleGetLocation = () => {
    setLocating(true); setError(null);
    if (!navigator.geolocation) { setError("Geolocalización no soportada"); setLocating(false); return; }
    navigator.geolocation.getCurrentPosition(
      pos => { setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false); },
      ()  => { setError("No se pudo obtener la ubicación"); setLocating(false); }
    );
  };

  const searchAddress = async () => {
    setNotFound(false);
    if (!address) return;
    setSearching(true);
    try {
      const res  = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
      const data = await res.json();
      if (data.length > 0) {
        const dest = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        setDestination(dest); setDistance(null); setDuration(null);
        mapRef.current?.setView([dest.lat, dest.lng], 13);
      } else { setDestination(null); setNotFound(true); }
    } catch { setDestination(null); setNotFound(true); }
    finally  { setSearching(false); }
  };

  const clearAll = () => {
    setDestination(null); setDistance(null); setDuration(null);
    setAddress(""); setNotFound(false);
    if (routingRef.current && mapRef.current) {
      mapRef.current.removeControl(routingRef.current);
      routingRef.current = null;
    }
  };

  useEffect(() => {
    if (!position || !destination || !mapRef.current) return;
    if (routingRef.current) { mapRef.current.removeControl(routingRef.current); routingRef.current = null; }
    // @ts-ignore
    const routing = L.Routing.control({
      waypoints: [L.latLng(position.lat, position.lng), L.latLng(destination.lat, destination.lng)],
      addWaypoints: false, routeWhileDragging: false, show: false, draggableWaypoints: false,
      lineOptions: {
        styles: [
          { color: T.green200, weight: 8, opacity: 0.5 },
          { color: T.green600, weight: 3.5, opacity: 0.95 },
        ],
      },
    }).addTo(mapRef.current);
    routing.on("routesfound", (e: any) => {
      setDistance(e.routes[0].summary.totalDistance);
      setDuration(e.routes[0].summary.totalTime);
    });
    routingRef.current = routing;
  }, [position, destination]);

  const fmtDist = (m: number) => m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
  const fmtTime = (s: number) => { const m = Math.floor(s / 60); return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m} min`; };

  const hasRoute = distance !== null && duration !== null;
  const calcRoute = !hasRoute && !!destination && !!position;

  return (
    <div className="meddash" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: T.bg, minHeight: "100vh", padding: "24px" }}>
      <GlobalStyles />

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px", animation: "fadeUp 0.3s ease" }}>
        <div>
          <h2 style={{ margin: "0 0 2px", fontSize: "20px", fontWeight: 700, color: T.text, letterSpacing: "-0.02em" }}>
            Panel de Navegación Médica
          </h2>
          <p style={{ margin: 0, fontSize: "13px", color: T.textMuted }}>
            Rutas en tiempo real hacia centros de salud
          </p>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: "6px",
          background: T.white, border: `1.5px solid ${T.border}`,
          borderRadius: "20px", padding: "6px 14px",
          fontSize: "12px", fontWeight: 500, boxShadow: `0 1px 4px ${T.shadow}`,
        }}>
          <div style={{
            width: "7px", height: "7px", borderRadius: "50%",
            background: position ? T.green500 : T.amber,
            animation: "pulse 2s infinite",
          }} />
          <span style={{ color: position ? T.green700 : T.amber }}>
            {position ? "GPS activo" : "Esperando GPS"}
          </span>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{
          background: T.redLight, border: `1.5px solid #FECACA`, borderRadius: "12px",
          padding: "11px 16px", display: "flex", alignItems: "center", gap: "10px",
          marginBottom: "16px", fontSize: "13px", color: T.red, animation: "fadeUp 0.3s ease",
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><path d="M12 8v5M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          {error}
          <button onClick={handleGetLocation} style={{ color: T.red, background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "13px", fontFamily: "'Plus Jakarta Sans', sans-serif", textDecoration: "underline", marginLeft: "4px" }}>
            Reintentar
          </button>
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "18px", animation: "fadeUp 0.35s ease" }}>
        <StatCard
          icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M3 12h18M15 6l6 6-6 6" stroke={T.green600} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          label="Distancia"
          value={hasRoute ? fmtDist(distance!) : "—"}
          loading={calcRoute}
          badge={hasRoute ? "OK" : undefined}
        />
        <StatCard
          icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={T.green600} strokeWidth="1.8"/><path d="M12 7v5l3 3" stroke={T.green600} strokeWidth="2" strokeLinecap="round"/></svg>}
          label="Tiempo estimado"
          value={hasRoute ? fmtTime(duration!) : "—"}
          loading={calcRoute}
          badge={hasRoute ? "En auto" : undefined}
        />
        <StatCard
          icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke={T.green600} strokeWidth="1.8" fill={T.green100}/><circle cx="12" cy="9" r="2.5" fill={T.green600}/></svg>}
          label="Estado de ruta"
          value={hasRoute ? "Lista ✓" : destination ? "Calculando..." : "Sin destino"}
          loading={calcRoute}
        />
      </div>

      {/* Main dashboard card */}
      <div style={{
        display: "flex", gap: "0",
        height: "510px",
        background: T.white,
        border: `1.5px solid ${T.border}`,
        borderRadius: "18px",
        overflow: "hidden",
        boxShadow: `0 4px 24px ${T.shadow}`,
        animation: "fadeUp 0.4s ease",
      }}>
        <Sidebar
          position={position}
          address={address}
          onAddressChange={v => { setAddress(v); setNotFound(false); }}
          onSearch={searchAddress}
          searching={searching}
          selectMode={selectMode}
          onSelectMode={() => setSelectMode(p => !p)}
          destination={destination}
          notFound={notFound}
          onClear={clearAll}
        />

        {/* Map */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          {position ? (
            <MapContainer
              center={[position.lat, position.lng]}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
              whenReady={({ target }) => { mapRef.current = target as L.Map; }}
            >
              <TileLayer
                attribution="&copy; OpenStreetMap &copy; CartoDB"
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              />
              <ClickHandler
                enabled={selectMode}
                onSelect={(lat, lng) => {
                  setDestination({ lat, lng });
                  setDistance(null); setDuration(null);
                  setSelectMode(false);
                }}
              />
              <Marker position={[position.lat, position.lng]} icon={originIcon}>
                <Popup>📍 Estás acá</Popup>
              </Marker>
              {destination && (
                <Marker position={[destination.lat, destination.lng]} icon={destIcon}>
                  <Popup>🏥 Destino seleccionado</Popup>
                </Marker>
              )}
            </MapContainer>
          ) : (
            <MapPlaceholder onRequest={handleGetLocation} loading={locating} />
          )}

          {/* Select mode tooltip */}
          {selectMode && (
            <div style={{
              position: "absolute", bottom: "14px", left: "50%",
              transform: "translateX(-50%)", zIndex: 999, pointerEvents: "none",
              background: T.white, border: `1.5px solid ${T.green400}`,
              borderRadius: "20px", padding: "7px 14px",
              fontSize: "12px", fontWeight: 600, color: T.green700,
              boxShadow: `0 4px 16px ${T.shadowMd}`,
              display: "flex", alignItems: "center", gap: "7px",
              animation: "fadeUp 0.3s ease",
            }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: T.green500, animation: "pulse 1.2s infinite" }} />
              Tocá cualquier punto del mapa
            </div>
          )}

          {/* Calculating badge */}
          {calcRoute && (
            <div style={{
              position: "absolute", top: "12px", right: "12px", zIndex: 999,
              background: T.white, border: `1.5px solid ${T.border}`,
              borderRadius: "10px", padding: "7px 12px",
              fontSize: "12px", color: T.green700, fontWeight: 500,
              display: "flex", alignItems: "center", gap: "7px",
              boxShadow: `0 2px 8px ${T.shadow}`, animation: "fadeIn 0.3s ease",
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 1s linear infinite" }}>
                <circle cx="12" cy="12" r="9" stroke={T.green500} strokeWidth="2" strokeDasharray="28 8"/>
              </svg>
              Calculando ruta...
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: "12px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11px", color: T.textMuted }}>
        <span>Datos © OpenStreetMap · Ruteo © OSRM · Tiles © CartoDB</span>
        {hasRoute && (
          <button onClick={clearAll} style={{
            background: "none", border: `1px solid ${T.border}`, borderRadius: "8px",
            padding: "5px 12px", fontSize: "12px", color: T.textMid, cursor: "pointer",
            fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all 0.15s",
          }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = T.green500;
              (e.currentTarget as HTMLElement).style.color = T.green700;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = T.border;
              (e.currentTarget as HTMLElement).style.color = T.textMid;
            }}
          >
            Nueva búsqueda
          </button>
        )}
      </div>
    </div>
  );
}