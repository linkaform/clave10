"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import debounce from "lodash.debounce";
import { Loader2, MapPin, X } from "lucide-react";
import osm from "@/app/map-config";
import { fixLeafletIcon } from "@/lib/fixLeafletIcon";
import useAuthStore from "@/store/useAuthStore";

export interface PuntoGeo {
  latitude: number;
  longitude: number;
}

interface MapaSelectorPuntoProps {
  value: PuntoGeo | null;
  onChange: (punto: PuntoGeo | null) => void;
  onDireccionChange?: (direccion: string) => void;
}

interface Sugerencia {
  id: string;
  nombre: string;
  detalle: string;
  punto: PuntoGeo;
}

const CENTRO_DEFAULT: [number, number] = [25.6866, -100.3161];

const keyDeUrl = (url: string) => url.match(/[?&]key=([^&]+)/)?.[1] ?? "";

const aSugerencia = (feature: any): Sugerencia => {
  const [lng, lat] = feature.center ?? [0, 0];
  const nombre: string = feature.text || feature.place_name || "";
  const completo: string = feature.place_name || nombre;
  return {
    id: feature.id ?? completo,
    nombre,
    detalle: completo.startsWith(nombre) ? completo.slice(nombre.length).replace(/^,\s*/, "") : completo,
    punto: { latitude: lat, longitude: lng },
  };
};

//
// Usa Leaflet directo en vez de <MapContainer> de react-leaflet 4: su ref
// callback memoiza `context === null` y, con React 19 en dev (StrictMode
// re-adjunta los refs), crea un segundo mapa sobre el mismo div y truena con
// "Map container is already initialized". Aquí el mapa vive en un efecto con
// cleanup (map.remove() libera el div), así que el doble montaje es seguro.
// Se carga con dynamic(..., { ssr: false }) porque Leaflet usa `window`.
export default function MapaSelectorPunto({ value, onChange, onDireccionChange }: MapaSelectorPuntoProps) {
  const user = useAuthStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [busqueda, setBusqueda] = useState("");
  const [sugerencias, setSugerencias] = useState<Sugerencia[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [direccion, setDireccion] = useState("");

  const tileUrl = user?.userIdSoter === 126 ? osm.maptiler.url_126 : osm.maptiler.url;
  const apiKey = keyDeUrl(tileUrl);

  // Los handlers de Leaflet se registran una sola vez; con refs siempre usan
  // las props más recientes.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onDireccionChangeRef = useRef(onDireccionChange);
  onDireccionChangeRef.current = onDireccionChange;

  const actualizarDireccion = (texto: string) => {
    setDireccion(texto);
    onDireccionChangeRef.current?.(texto);
  };

  // Dirección del punto elegido con clic o arrastre.
  const reverseGeocode = async (punto: PuntoGeo) => {
    try {
      const res = await fetch(
        `https://api.maptiler.com/geocoding/${punto.longitude},${punto.latitude}.json?key=${apiKey}&language=es&limit=1`,
      );
      const data = await res.json();
      actualizarDireccion(data?.features?.[0]?.place_name ?? "");
    } catch {
      actualizarDireccion("");
    }
  };
  const reverseGeocodeRef = useRef(reverseGeocode);
  reverseGeocodeRef.current = reverseGeocode;

  const elegirPunto = (punto: PuntoGeo) => {
    onChangeRef.current(punto);
    reverseGeocodeRef.current(punto);
  };

  useEffect(() => {
    if (!containerRef.current) return;
    fixLeafletIcon();

    const map = L.map(containerRef.current).setView(
      value ? [value.latitude, value.longitude] : CENTRO_DEFAULT,
      value ? 16 : 12,
    );
    L.tileLayer(tileUrl, { attribution: osm.maptiler.attribution }).addTo(map);
    map.on("click", (e: L.LeafletMouseEvent) => elegirPunto({ latitude: e.latlng.lat, longitude: e.latlng.lng }));
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
      setDireccion("");
      return;
    }

    const posicion: [number, number] = [value.latitude, value.longitude];
    if (markerRef.current) {
      markerRef.current.setLatLng(posicion);
    } else {
      const marker = L.marker(posicion, { draggable: true }).addTo(map);
      marker.on("dragend", () => {
        const { lat, lng } = marker.getLatLng();
        elegirPunto({ latitude: lat, longitude: lng });
      });
      markerRef.current = marker;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const buscar = useMemo(
    () =>
      debounce(async (texto: string) => {
        if (texto.trim().length < 3) {
          setSugerencias([]);
          setBuscando(false);
          return;
        }
        try {
          const centro = mapRef.current?.getCenter();
          const proximity = centro ? `&proximity=${centro.lng},${centro.lat}` : "";
          const res = await fetch(
            `https://api.maptiler.com/geocoding/${encodeURIComponent(texto)}.json?key=${apiKey}&autocomplete=true&limit=5&language=es${proximity}`,
          );
          const data = await res.json();
          setSugerencias((data?.features ?? []).map(aSugerencia));
        } catch {
          setSugerencias([]);
        } finally {
          setBuscando(false);
        }
      }, 350),
    [apiKey],
  );

  useEffect(() => () => buscar.cancel(), [buscar]);

  const handleBusquedaChange = (texto: string) => {
    setBusqueda(texto);
    setMostrarSugerencias(true);
    setBuscando(texto.trim().length >= 3);
    buscar(texto);
  };

  const handleSeleccionar = (sugerencia: Sugerencia) => {
    setBusqueda([sugerencia.nombre, sugerencia.detalle].filter(Boolean).join(", "));
    setMostrarSugerencias(false);
    setSugerencias([]);
    onChangeRef.current(sugerencia.punto);
    actualizarDireccion([sugerencia.nombre, sugerencia.detalle].filter(Boolean).join(", "));
    mapRef.current?.setView([sugerencia.punto.latitude, sugerencia.punto.longitude], 17);
  };

  const limpiarBusqueda = () => {
    setBusqueda("");
    setSugerencias([]);
    setMostrarSugerencias(false);
    buscar.cancel();
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => handleBusquedaChange(e.target.value)}
          onFocus={() => setMostrarSugerencias(true)}
          onBlur={() => setTimeout(() => setMostrarSugerencias(false), 150)}
          placeholder="Escribe una dirección..."
          className="w-full h-10 rounded-md border border-gray-200 bg-white pl-3 pr-9 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
        />
        {buscando ? (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
        ) : busqueda ? (
          <button
            type="button"
            onClick={limpiarBusqueda}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            title="Limpiar"
          >
            <X className="w-4 h-4" />
          </button>
        ) : null}

        {mostrarSugerencias && sugerencias.length > 0 && (
          // z-[1000]: por encima de los panes de Leaflet (z-index 400-800).
          <ul className="absolute left-0 right-0 top-full mt-1 z-[1000] bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden">
            {sugerencias.map((sugerencia) => (
              <li key={sugerencia.id}>
                <button
                  type="button"
                  // onMouseDown para ganarle al onBlur del input.
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSeleccionar(sugerencia);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-100"
                >
                  <MapPin className="w-5 h-5 shrink-0 text-gray-700" />
                  <span className="text-sm text-gray-800 truncate">{sugerencia.nombre}</span>
                  {sugerencia.detalle && (
                    <span className="text-xs text-gray-400 truncate">{sugerencia.detalle}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div ref={containerRef} className="h-64 w-full rounded-lg border border-gray-200 z-0" />

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="block text-gray-500">Latitud:</span>
          <span className="text-gray-800">{value ? value.latitude.toFixed(5) : "-"}</span>
        </div>
        <div>
          <span className="block text-gray-500">Longitud:</span>
          <span className="text-gray-800">{value ? value.longitude.toFixed(5) : "-"}</span>
        </div>
      </div>
      <div className="text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Dirección</span>
          {value && (
            <button
              type="button"
              className="text-xs text-red-500 hover:underline"
              onClick={() => {
                onChangeRef.current(null);
                actualizarDireccion("");
                limpiarBusqueda();
              }}
            >
              Quitar punto
            </button>
          )}
        </div>
        {direccion && <span className="block text-gray-800">{direccion}</span>}
        <span className="block text-xs text-gray-400">
          Si no tiene dirección, se utiliza la dirección de la ubicación.
        </span>
      </div>
    </div>
  );
}
