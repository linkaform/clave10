"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import osm from "@/app/map-config";
import { fixLeafletIcon } from "@/lib/fixLeafletIcon";
import useAuthStore from "@/store/useAuthStore";

export interface PuntoGeo {
  latitude: number;
  longitude: number;
}

interface MapaSelectorPuntoProps {
  value: PuntoGeo | null;
  onChange: (punto: PuntoGeo) => void;
}

// Centro por defecto mientras no haya punto: Monterrey.
const CENTRO_DEFAULT: [number, number] = [25.6866, -100.3161];

// Mapa para elegir un punto: clic para colocar el marcador, o arrastrarlo.
//
// Usa Leaflet directo en vez de <MapContainer> de react-leaflet 4: su ref
// callback memoiza `context === null` y, con React 19 en dev (StrictMode
// re-adjunta los refs), crea un segundo mapa sobre el mismo div y truena con
// "Map container is already initialized". Aquí el mapa vive en un efecto con
// cleanup (map.remove() libera el div), así que el doble montaje es seguro.
// Se carga con dynamic(..., { ssr: false }) porque Leaflet usa `window`.
export default function MapaSelectorPunto({ value, onChange }: MapaSelectorPuntoProps) {
  const user = useAuthStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  // El handler de clic se registra una sola vez; con el ref siempre llama al
  // onChange más reciente.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const tileUrl = user?.userIdSoter === 126 ? osm.maptiler.url_126 : osm.maptiler.url;

  useEffect(() => {
    if (!containerRef.current) return;
    fixLeafletIcon();

    const map = L.map(containerRef.current).setView(
      value ? [value.latitude, value.longitude] : CENTRO_DEFAULT,
      value ? 16 : 12,
    );
    L.tileLayer(tileUrl, { attribution: osm.maptiler.attribution }).addTo(map);
    map.on("click", (e: L.LeafletMouseEvent) =>
      onChangeRef.current({ latitude: e.latlng.lat, longitude: e.latlng.lng }),
    );
    mapRef.current = map;

    // Dentro de un Dialog el mapa se monta mientras el modal todavía anima y
    // Leaflet calcula mal su tamaño (tiles grises); se recalcula al abrir.
    const timer = setTimeout(() => map.invalidateSize(), 250);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Solo al montar: value inicial y tiles no deben recrear el mapa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mantiene el marcador en sincronía con `value`.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!value) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }

    const posicion: [number, number] = [value.latitude, value.longitude];
    if (markerRef.current) {
      markerRef.current.setLatLng(posicion);
    } else {
      const marker = L.marker(posicion, { draggable: true }).addTo(map);
      marker.on("dragend", () => {
        const { lat, lng } = marker.getLatLng();
        onChangeRef.current({ latitude: lat, longitude: lng });
      });
      markerRef.current = marker;
    }
  }, [value]);

  return <div ref={containerRef} className="h-64 w-full rounded-lg border border-gray-200 z-0" />;
}
