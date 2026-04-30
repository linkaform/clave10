"use client";

import React, { useEffect, useRef, useMemo, useId } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip,
  useMapEvents,
} from "react-leaflet";
import L, { latLngBounds } from "leaflet";
import "leaflet/dist/leaflet.css";
import "../app/map.css";
import osm from "@/app/map-config";
import useAuthStore from "@/store/useAuthStore";
import { Map } from "leaflet";
import { MapItem } from "./table/rondines/recorridos/table";

interface RecordData {
  id: number;
  folio: string;
  form_name: string;
  user_name: string;
  duration: string;
  geolocation?: [number, number];
  bubble_color?: string;
  [key: string]: any;
}

type Punto = { lat: number; lng: number; nombre?: string; foto?: string };
type MapaRutasProps = { map_data: MapItem[] ,areas?: any[];};

const overlap = (rect1: DOMRect, rect2: DOMRect): boolean =>
  !(rect1.right < rect2.left || rect1.left > rect2.right ||
    rect1.bottom < rect2.top || rect1.top > rect2.bottom);

const MyComponent: React.FC<{ prefix: string }> = ({ prefix }) => {
  const hideOverlappingTooltips = () => {
    const selector = `.myTooltip-${prefix}`;
    const tooltips = document.querySelectorAll<HTMLElement>(selector);
    const rects: DOMRect[] = [];
    const idListData: string[] = [];
    const idListGroup: string[] = [];
    const idListTooltip: string[] = [];

    tooltips.forEach((tip, i) => {
      const attrData = tip.querySelector(".toltip-data") as HTMLElement;
      const attrGroup = tip.querySelector(".toltip-group") as HTMLElement;
      const attrDiv = tip.querySelector(".tooltip-div") as HTMLElement;

      tip.style.visibility = "";
      attrData?.style.setProperty("display", "");
      attrGroup?.style.setProperty("display", "none");
      if (attrDiv?.getAttribute("singlecolor")) {
        tip.style.background = attrDiv.getAttribute("singlecolor")!;
      }
      rects[i] = tip.getBoundingClientRect();
      idListData[i] = attrData?.id;
      idListGroup[i] = attrGroup?.id;
      idListTooltip[i] = tip?.id;
    });

    tooltips.forEach((tip, i) => {
      let countRecords = 1;
      if (tip.style.visibility !== "hidden") {
        tooltips.forEach((_, j) => {
          if (j > i && overlap(rects[i], rects[j])) {
            countRecords += 1;
            tooltips[j].style.visibility = "hidden";
            const dEl = document.getElementById(idListData[i]);
            const gEl = document.getElementById(idListGroup[i]);
            const tEl = document.getElementById(idListTooltip[i]);
            if (dEl) dEl.style.display = "none";
            if (gEl) { gEl.style.display = "block"; gEl.textContent = `Records: ${countRecords}`; }
            if (tEl) tEl.style.background = "#99a3a4";
          }
        });
      }
    });
  };

  useMapEvents({ zoomend: hideOverlappingTooltips });
  return null;
};

const MapView = ({ map_data }: MapaRutasProps) => {
  const user = useAuthStore();
  const instanceId = useId().replace(/:/g, "_");
  const mapKey = useMemo(
    () => instanceId + "_" + JSON.stringify(map_data?.map(i => i.id)),
    [instanceId, map_data]
  );


const puntos = useMemo<Punto[]>(() =>
  (map_data ?? [])
    .filter(item =>
      item.geolocation_area?.latitude &&
      item.geolocation_area?.longitude &&
      item.geolocation_area.latitude !== 0 &&
      item.geolocation_area.longitude !== 0
    )
    .map(item => ({
      nombre: item.nombre_area,
      lat: item.geolocation_area!.latitude,
      lng: item.geolocation_area!.longitude,
      foto: (item.foto_area as any)?.[0]?.file_url || "", 
    })),
  [map_data]
);

  const DEFAULT_ZOOM = 15;
  const mapRef = useRef<Map | null>(null);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const center = puntos.length
    ? { lat: puntos[0].lat, lng: puntos[0].lng }
    : { lat: 19.4326, lng: -99.1332 };

  const records: RecordData[] = puntos.map((p, index) => ({
    id: index + 1,
    folio: p.nombre ?? `Área ${index + 1}`,
    form_name: p.nombre ?? "",
    user_name: "",
    duration: "",
    geolocation: [p.lat, p.lng],
    foto: p.foto || "",
  }));

  const setZoom = (map: any) => {
    const bounds = latLngBounds([]);
    records.forEach(r => { if (r.geolocation) bounds.extend(r.geolocation); });
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [20, 20] });
  };

  const getIcon = (foto?: string) => {
    if (foto) {
      return L.divIcon({
        className: "",
        html: `<div style="
          width: 44px;
          height: 44px;
          border-radius: 10px;
          overflow: hidden;
          border: 2.5px solid white;
          box-shadow: 0 3px 8px rgba(0,0,0,0.25);
          pointer-events: none;
        ">
          <img 
            src="${foto}" 
            style="width:100%; height:100%; object-fit:cover; pointer-events:none;"
            draggable="false"
          />
        </div>`,
        iconSize: [44, 44],
        iconAnchor: [22, 44],
        popupAnchor: [0, -44],
      });
    }
    return L.divIcon({
      className: "",
      html: `<div style="
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: #3b82f6;
        border: 2.5px solid white;
        box-shadow: 0 3px 8px rgba(0,0,0,0.25);
        pointer-events: none;
      "></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  };

  const linePositions: [number, number][] = puntos.map(p => [p.lat, p.lng]);

  if (!puntos.length) return (
    <div className="flex items-center justify-center h-full text-xs text-gray-400">
      Sin coordenadas disponibles
    </div>
  );

  return (
    <article key={mapKey} style={{ height: "100%", width: "100%" }}>
      <MapContainer
        center={center}
        zoom={DEFAULT_ZOOM}
        ref={mapRef}
        whenReady={() => { if (mapRef.current) setZoom(mapRef.current); }}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url={user?.userIdSoter === 126 ? osm?.maptiler.url_126 : osm.maptiler.url}
          attribution={osm.maptiler.attribution}
        />
        <Polyline positions={linePositions} color="green" />
        <MyComponent prefix={instanceId} />
        {records.map((obj) => (
          <Marker
            key={`${instanceId}_${obj.id}`}
            position={obj.geolocation!}
            icon={getIcon(obj.foto)}
            eventHandlers={{
              click: (e) => { e.originalEvent.stopPropagation(); },
            }}>
            <Tooltip
              permanent
              direction="top"
              className={`myTooltip myTooltip-${instanceId}`}
              interactive={false} 
            >
              <div className="tooltip-div" style={{ pointerEvents: "none" }}>
                <span className="toltip-data text-xs font-medium">
                  {obj.folio}
                </span>
              </div>
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>
    </article>
  );
};

export default MapView;