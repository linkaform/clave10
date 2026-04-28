"use client";

import React, { useEffect, useRef, useMemo, useId } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
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
import { MapItem } from "./table/rondines/table";

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

// MyComponent ahora recibe el prefijo de instancia para evitar colisiones de ID
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

const MapView = ({ map_data, areas }: MapaRutasProps) => {
  const user = useAuthStore();
  const instanceId = useId().replace(/:/g, "_"); // ID único, safe para usar en class/id
  const mapKey = useMemo(
    () => instanceId + "_" + JSON.stringify(map_data?.map(i => i.id)),
    [instanceId, map_data]
  );


  const areasPhotoMap = useMemo(() => {
    const map: Record<string, string> = {};
  
    (areas || []).forEach((area: any) => {
      const id = area?.area_tag_id?.[0];
      const foto = area?.foto_area?.[0]?.file_url;
  
      if (id && foto) {
        map[id] = foto;
      }
    });
  
    return map;
  }, [areas]);
  
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
        foto:
          item.foto_area?.[0]?.file_url ||
          areasPhotoMap[item.id] ||
          "",
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [map_data]
  );

  const DEFAULT_ZOOM = 15;
  const mapRef = useRef<Map | null>(null);

  // Limpiar instancia de Leaflet al desmontar — evita "already initialized" en HMR
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
  console.log("DENTRO DEL MAPA", records)

  const getIcon = (foto?: string) => {
    if (foto) {
      return L.divIcon({
        className: "",
        html: `<div style="
        width:48px;
        height:48px;
        border-radius:12px;
        overflow:hidden;
        border:3px solid white;
        box-shadow:0 4px 10px rgba(0,0,0,0.3);
        background:#e2e8f0;
        display:flex;
        align-items:center;
        justify-content:center;
        ">
          <img 
            src="${foto}" 
            style="
              width:100%;
              height:100%;
              object-fit:cover;
            " 
          />
        </div>`,
        iconSize: [44, 44],
        iconAnchor: [22, 44],
        popupAnchor: [0, -44],
      });
    }
    return L.icon({
      iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
      iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
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
          <Marker key={`${instanceId}_${obj.id}`} position={obj.geolocation!} icon={getIcon(obj.foto)}>
            <Popup>
              <div>{obj.form_name} — {obj.folio}</div>
            </Popup>
            <Tooltip
              permanent
              className={`myTooltip myTooltip-${instanceId}`}
            >
              <div className="tooltip-div" id={`${instanceId}_tooltip-${obj.id}`}>
                <p className="toltip-data" id={`${instanceId}_toltip-record-${obj.id}`}>
                <span style={{ pointerEvents: "none", cursor: "default" }}>{obj.folio}</span>
                  {" "}| {obj.duration}
                </p>
                <p
                  className="toltip-group"
                  id={`${instanceId}_toltip-group-${obj.id}`}
                  style={{ display: "none" }}
                >
                  0
                </p>
              </div>
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>
    </article>
  );
};

export default MapView;