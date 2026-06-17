"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import type { GatheringPlace, Match } from "@/lib/types";
import type { MapPulse } from "@/lib/live-map";
import { teamColor } from "@/lib/live-map";
import {
  CROWD_PIN_COLORS,
  ROUTE_ORIGIN,
  SOURCE_COLORS,
} from "@/lib/map-styles";
import { MATCH_ROUTE, type MatchTransitPlan } from "@/lib/match-route";

import "leaflet/dist/leaflet.css";

function venueIcon(color: string, selected: boolean) {
  const size = selected ? 36 : 28;
  const ring = selected ? "#ffd02f" : "#ffffff";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + 4}" viewBox="0 0 24 28">
      <path fill="${color}" stroke="${ring}" stroke-width="2"
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      <circle cx="12" cy="9" r="2.5" fill="#fff"/>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [size, size + 4],
    iconAnchor: [size / 2, size + 4],
    popupAnchor: [0, -size],
  });
}

function stadiumIcon(active: boolean) {
  const svg = `
    <div class="stadium-pin ${active ? "stadium-pin-active" : ""}">
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="16" fill="#ffd02f" stroke="#050038" stroke-width="2"/>
        <text x="18" y="22" text-anchor="middle" font-size="14">⚽</text>
      </svg>
    </div>`;
  return L.divIcon({
    html: svg,
    className: "stadium-pin-wrap",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
}

function pulseIcon(heat: number, color: string, surge: boolean) {
  const size = 56 + heat * 0.65;
  const svg = `
    <div class="map-heat-pulse ${surge ? "map-heat-surge" : ""}" style="
      width:${size}px;height:${size}px;
      --pulse-color:${color};
    "></div>`;
  return L.divIcon({
    html: svg,
    className: "heat-pulse-wrap",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function FlyTo({
  lat,
  lng,
  zoom,
}: {
  lat: number;
  lng: number;
  zoom: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], zoom, { duration: 0.75 });
  }, [lat, lng, zoom, map]);
  return null;
}

interface MapViewProps {
  places: GatheringPlace[];
  match: Match | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  center: [number, number];
  pulses?: MapPulse[];
  routeMode?: boolean;
  matchTransit?: MatchTransitPlan | null;
  heatTick?: number;
}

export default function MapView({
  places,
  match,
  selectedId,
  onSelect,
  center,
  pulses = [],
  routeMode = false,
  matchTransit,
}: MapViewProps) {
  const flyCenter = routeMode && match ? [match.lat, match.lng] as [number, number] : center;
  const flyZoom = routeMode ? 11 : selectedId ? 13 : 11;

  return (
    <MapContainer
      center={flyCenter}
      zoom={flyZoom}
      className="h-full w-full z-0"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <FlyTo lat={flyCenter[0]} lng={flyCenter[1]} zoom={flyZoom} />

      {pulses.map((p) => (
        <Marker
          key={`heat-${p.id}`}
          position={[p.lat, p.lng]}
          icon={pulseIcon(p.heat, teamColor(p.dominantTeam), p.trend === "surge")}
          interactive={false}
          zIndexOffset={-200}
        />
      ))}

      {pulses.map((p) => (
        <Circle
          key={`circle-${p.id}`}
          center={[p.lat, p.lng]}
          radius={500 + p.heat * 14}
          pathOptions={{
            color: teamColor(p.dominantTeam),
            fillColor: teamColor(p.dominantTeam),
            fillOpacity: 0.08 + p.heat * 0.003,
            weight: 1.5,
            opacity: 0.35,
          }}
        />
      ))}

      {routeMode && (
        <>
          <Polyline
            positions={MATCH_ROUTE}
            pathOptions={{
              color: "#ffd02f",
              weight: 4,
              opacity: 0.9,
              dashArray: "12 8",
            }}
          />
          <Marker position={ROUTE_ORIGIN} icon={venueIcon("#6554ff", false)}>
            <Popup>
              <strong>You · Chelsea</strong>
              <br />
              <span className="text-xs">Start here</span>
            </Popup>
          </Marker>
        </>
      )}

      {match && (
        <Marker
          position={[match.lat, match.lng]}
          icon={stadiumIcon(routeMode)}
          zIndexOffset={700}
        >
          <Popup>
            <div className="min-w-[200px]">
              <p className="font-semibold text-miro-ink">{match.venueName}</p>
              <p className="text-xs text-miro-ink-muted mt-1">Match venue</p>
              {routeMode && matchTransit && (
                <div className="mt-2 pt-2 border-t border-miro-border">
                  <p className="text-[10px] font-bold uppercase text-miro-purple">
                    Route
                  </p>
                  <p className="text-xs mt-1">
                    Leave <strong>{matchTransit.leaveBy}</strong> · {matchTransit.durationMin} min
                  </p>
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      )}

      {places.map((place) => (
        <Marker
          key={place.id}
          position={[place.lat, place.lng]}
          icon={venueIcon(
            CROWD_PIN_COLORS[place.crowdLevel],
            place.id === selectedId
          )}
          eventHandlers={{ click: () => onSelect(place.id) }}
          zIndexOffset={place.id === selectedId ? 600 : 300}
        >
          <Popup>
            <div className="min-w-[200px]">
              <p className="font-semibold text-sm text-white">{place.name}</p>
              <p className="text-xs text-white/50">{place.neighborhood}</p>
              <p
                className="text-[10px] font-bold uppercase mt-1.5"
                style={{
                  color: SOURCE_COLORS[place.source as keyof typeof SOURCE_COLORS],
                }}
              >
                {place.source}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
