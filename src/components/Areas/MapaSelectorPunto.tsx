"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import debounce from "lodash.debounce";
import { Crosshair, Loader2, MapPin, TextSearch, X } from "lucide-react";
import osm from "@/app/map-config";
import { fixLeafletIcon } from "@/lib/fixLeafletIcon";
import {
  buscarDirecciones,
  direccionDePunto,
  textoResultado,
  type PuntoGeo,
  type ResultadoDireccion,
} from "@/lib/geocodificacion";
import useAuthStore from "@/store/useAuthStore";
import { BuscarDireccionModal } from "./BuscarDireccionModal";
import { EtiquetaPrecision } from "./EtiquetaPrecision";

export type { PuntoGeo };

interface MapaSelectorPuntoProps {
  value: PuntoGeo | null;
  onChange: (punto: PuntoGeo | null) => void;
  /** Dirección del punto elegido (búsqueda, clic o arrastre); null al quitarlo. */
  onDireccionChange?: (resultado: ResultadoDireccion | null) => void;
  /** Texto bajo la dirección; por defecto, el de áreas. */
  nota?: string;
}

const CENTRO_DEFAULT: [number, number] = [25.6866, -100.3161];

const keyDeUrl = (url: string) => url.match(/[?&]key=([^&]+)/)?.[1] ?? "";

const latValida = (n: number) => Number.isFinite(n) && n >= -90 && n <= 90;
const lngValida = (n: number) => Number.isFinite(n) && n >= -180 && n <= 180;

// Un par "lat, lng" pegado tal cual, o dentro de un link de Google Maps
// (".../@25.78,-100.25,17z" o "...?q=25.78,-100.25"). Se exigen decimales
// para no confundir direcciones como "Calle 5, 10" con coordenadas.
const parsearPar = (texto: string): PuntoGeo | null => {
  const m = texto.match(/(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/);
  if (!m) return null;
  const a = parseFloat(m[1]);
  const b = parseFloat(m[2]);
  if (latValida(a) && lngValida(b)) return { latitude: a, longitude: b };
  // Pegado al revés ("-100.25, 25.78"): el primero no puede ser latitud.
  if (latValida(b) && lngValida(a)) return { latitude: b, longitude: a };
  return null;
};

const aTexto = (n: number) => String(Number(n.toFixed(6)));

//
// Usa Leaflet directo en vez de <MapContainer> de react-leaflet 4: su ref
// callback memoiza `context === null` y, con React 19 en dev (StrictMode
// re-adjunta los refs), crea un segundo mapa sobre el mismo div y truena con
// "Map container is already initialized". Aquí el mapa vive en un efecto con
// cleanup (map.remove() libera el div), así que el doble montaje es seguro.
// Se carga con dynamic(..., { ssr: false }) porque Leaflet usa `window`.
export default function MapaSelectorPunto({
  value,
  onChange,
  onDireccionChange,
  nota = "Si no tiene dirección, se utiliza la dirección de la ubicación.",
}: MapaSelectorPuntoProps) {
  const user = useAuthStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [busqueda, setBusqueda] = useState("");
  const [sugerencias, setSugerencias] = useState<ResultadoDireccion[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [direccion, setDireccion] = useState<ResultadoDireccion | null>(null);
  const [latTexto, setLatTexto] = useState(value ? aTexto(value.latitude) : "");
  const [lngTexto, setLngTexto] = useState(value ? aTexto(value.longitude) : "");
  const [buscarDireccionOpen, setBuscarDireccionOpen] = useState(false);
  const [ubicandome, setUbicandome] = useState(false);
  const [errorUbicacion, setErrorUbicacion] = useState("");
  const [avisoCtrl, setAvisoCtrl] = useState(false);

  const tileUrl = user?.userIdSoter === 126 ? osm.maptiler.url_126 : osm.maptiler.url;
  const apiKey = keyDeUrl(tileUrl);

  // Los handlers de Leaflet se registran una sola vez; con refs siempre usan
  // las props más recientes.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onDireccionChangeRef = useRef(onDireccionChange);
  onDireccionChangeRef.current = onDireccionChange;

  const actualizarDireccion = (resultado: ResultadoDireccion | null) => {
    setDireccion(resultado);
    onDireccionChangeRef.current?.(resultado);
  };

  // Dirección del punto elegido con clic o arrastre. Si mientras responde se
  // eligió otro punto, la respuesta vieja se descarta.
  const ultimoPuntoRef = useRef<PuntoGeo | null>(null);
  const reverseGeocode = async (punto: PuntoGeo) => {
    ultimoPuntoRef.current = punto;
    const resultado = await direccionDePunto(punto, apiKey);
    if (ultimoPuntoRef.current === punto) actualizarDireccion(resultado);
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

    const container = containerRef.current;
    const map = L.map(container, { dragging: false, scrollWheelZoom: false }).setView(
      value ? [value.latitude, value.longitude] : CENTRO_DEFAULT,
      value ? 16 : 12,
    );
    L.tileLayer(tileUrl, { attribution: osm.maptiler.attribution }).addTo(map);
    map.on("click", (e: L.LeafletMouseEvent) => elegirPunto({ latitude: e.latlng.lat, longitude: e.latlng.lng }));
    mapRef.current = map;

    // Arrastrar y hacer zoom con la rueda solo con Ctrl presionado: dentro de
    // un modal con scroll, la rueda y el arrastre no se quedan atrapados en el
    // mapa. Clic para elegir punto y arrastrar el marcador siguen sin Ctrl.
    const permitirMovimiento = (activo: boolean) => {
      if (activo) {
        map.dragging.enable();
        map.scrollWheelZoom.enable();
      } else {
        map.dragging.disable();
        map.scrollWheelZoom.disable();
      }
    };
    const onTecla = (e: KeyboardEvent) => {
      if (e.key === "Control" || e.key === "Meta") permitirMovimiento(e.type === "keydown");
    };
    const onBlur = () => permitirMovimiento(false);
    let avisoTimer: ReturnType<typeof setTimeout> | undefined;
    const onRueda = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) return;
      setAvisoCtrl(true);
      clearTimeout(avisoTimer);
      avisoTimer = setTimeout(() => setAvisoCtrl(false), 1500);
    };
    window.addEventListener("keydown", onTecla);
    window.addEventListener("keyup", onTecla);
    window.addEventListener("blur", onBlur);
    container.addEventListener("wheel", onRueda);

    // Dentro de un Dialog el mapa se monta mientras el modal todavía anima y
    // Leaflet calcula mal su tamaño (tiles grises); se recalcula al abrir.
    const timer = setTimeout(() => map.invalidateSize(), 250);

    return () => {
      clearTimeout(timer);
      clearTimeout(avisoTimer);
      window.removeEventListener("keydown", onTecla);
      window.removeEventListener("keyup", onTecla);
      window.removeEventListener("blur", onBlur);
      container.removeEventListener("wheel", onRueda);
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
      setDireccion(null);
      setLatTexto("");
      setLngTexto("");
      return;
    }

    // Solo si cambió por otro lado (marcador, búsqueda): lo que se está
    // escribiendo ya coincide con value y no se reformatea.
    setLatTexto((t) => (parseFloat(t) === value.latitude ? t : aTexto(value.latitude)));
    setLngTexto((t) => (parseFloat(t) === value.longitude ? t : aTexto(value.longitude)));

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
        const centro = mapRef.current?.getCenter();
        const resultados = await buscarDirecciones(texto, {
          apiKey,
          cerca: centro ? { latitude: centro.lat, longitude: centro.lng } : null,
          autocomplete: true,
          // Sin postal_code: con autocomplete, un número al final ("... 316")
          // se toma como prefijo de CP y los 316xx tapan las direcciones.
          tipos: "&types=address,poi,road,neighbourhood,locality,place,municipality",
        });
        setSugerencias(resultados);
        setBuscando(false);
      }, 350),
    [apiKey],
  );

  useEffect(() => () => buscar.cancel(), [buscar]);

  // Mueve el marcador a un punto escrito o pegado y centra el mapa ahí.
  const irAPunto = (punto: PuntoGeo) => {
    elegirPunto(punto);
    mapRef.current?.setView([punto.latitude, punto.longitude], Math.max(mapRef.current.getZoom(), 17));
  };
  const irAPuntoRef = useRef(irAPunto);
  irAPuntoRef.current = irAPunto;
  const irAPuntoDebounced = useMemo(() => debounce((punto: PuntoGeo) => irAPuntoRef.current(punto), 500), []);
  useEffect(() => () => irAPuntoDebounced.cancel(), [irAPuntoDebounced]);

  const handleBusquedaChange = (texto: string) => {
    setBusqueda(texto);
    // Coordenadas o link de Google Maps pegados: se usa ese punto sin buscar.
    const par = parsearPar(texto);
    if (par) {
      buscar.cancel();
      setBuscando(false);
      setSugerencias([]);
      setMostrarSugerencias(false);
      irAPunto(par);
      return;
    }
    setMostrarSugerencias(true);
    setBuscando(texto.trim().length >= 3);
    buscar(texto);
  };

  const handleCoordenadaChange = (campo: "lat" | "lng", texto: string) => {
    // "25.78, -100.25" pegado en cualquiera de los dos llena ambos.
    const par = parsearPar(texto);
    if (par) {
      setLatTexto(aTexto(par.latitude));
      setLngTexto(aTexto(par.longitude));
      irAPuntoDebounced.cancel();
      irAPunto(par);
      return;
    }
    const lat = campo === "lat" ? texto : latTexto;
    const lng = campo === "lng" ? texto : lngTexto;
    if (campo === "lat") setLatTexto(texto);
    else setLngTexto(texto);
    const punto = { latitude: parseFloat(lat), longitude: parseFloat(lng) };
    if (latValida(punto.latitude) && lngValida(punto.longitude)) irAPuntoDebounced(punto);
  };

  // GPS del navegador: lo más exacto si se está físicamente en el área.
  const usarMiUbicacion = () => {
    if (!navigator.geolocation) {
      setErrorUbicacion("Este navegador no permite obtener la ubicación.");
      return;
    }
    setErrorUbicacion("");
    setUbicandome(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUbicandome(false);
        irAPunto({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      },
      (err) => {
        setUbicandome(false);
        setErrorUbicacion(
          err.code === err.PERMISSION_DENIED
            ? "Permite el acceso a tu ubicación en el navegador para usar esta opción."
            : "No se pudo obtener tu ubicación. Intenta de nuevo.",
        );
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const latNum = parseFloat(latTexto);
  const lngNum = parseFloat(lngTexto);
  const errorLat = latTexto.trim() !== "" && !latValida(latNum);
  const errorLng = lngTexto.trim() !== "" && !lngValida(lngNum);
  // Error típico: pegar longitud en latitud (en México la longitud es ~-100).
  const pareceInvertido = errorLat && latValida(lngNum) && lngValida(latNum);

  const handleSeleccionar = (sugerencia: ResultadoDireccion) => {
    ultimoPuntoRef.current = sugerencia.punto;
    setBusqueda(textoResultado(sugerencia));
    setMostrarSugerencias(false);
    setSugerencias([]);
    onChangeRef.current(sugerencia.punto);
    actualizarDireccion(sugerencia);
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
          placeholder="Escribe una dirección o pega coordenadas / link de Google Maps..."
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
                  {sugerencia.componentes.calle && (
                    <span className="ml-auto">
                      <EtiquetaPrecision exacto={sugerencia.exacto} />
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-xs text-gray-400">
        También puedes pegar coordenadas (<span className="font-mono">25.7897, -100.2521</span>) o un link de Google
        Maps: en Google Maps haz clic derecho sobre el punto y copia las coordenadas, o usa &quot;Compartir → Copiar
        vínculo&quot;.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setBuscarDireccionOpen(true)}
          className="flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
        >
          <TextSearch className="w-3.5 h-3.5" />
          Buscar por dirección
        </button>
        <button
          type="button"
          onClick={usarMiUbicacion}
          disabled={ubicandome}
          className="flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
        >
          {ubicandome ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Crosshair className="w-3.5 h-3.5" />}
          Usar mi ubicación
        </button>
        {errorUbicacion && <span className="text-xs text-red-500">{errorUbicacion}</span>}
      </div>

      <div className="relative">
        <div ref={containerRef} className="h-64 w-full rounded-lg border border-gray-200 z-0" />
        {avisoCtrl && (
          // z-[1000]: por encima de los panes de Leaflet (z-index 400-800).
          <div className="pointer-events-none absolute inset-0 z-[1000] flex items-center justify-center rounded-lg bg-black/40">
            <span className="text-sm font-semibold text-white">Mantén presionada Ctrl para mover el mapa</span>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-400">
        Mantén presionada <span className="font-semibold">Ctrl</span> para arrastrar el mapa o hacer zoom con la
        rueda. Haz clic para colocar el punto.
      </p>

      <div className="grid grid-cols-2 gap-4 text-sm">
        {(
          [
            { campo: "lat", label: "Latitud", texto: latTexto, error: errorLat, rango: "-90 a 90", ej: "25.789731" },
            { campo: "lng", label: "Longitud", texto: lngTexto, error: errorLng, rango: "-180 a 180", ej: "-100.252110" },
          ] as const
        ).map(({ campo, label, texto, error, rango, ej }) => (
          <label key={campo} className="flex flex-col gap-1">
            <span className="text-gray-500">{label}</span>
            <input
              type="text"
              inputMode="decimal"
              value={texto}
              onChange={(e) => handleCoordenadaChange(campo, e.target.value)}
              placeholder={`Ej. ${ej}`}
              className={`h-9 rounded-md border bg-white px-3 text-sm outline-none focus:ring-1 ${
                error
                  ? "border-red-300 focus:border-red-400 focus:ring-red-400"
                  : "border-gray-200 focus:border-blue-400 focus:ring-blue-400"
              }`}
            />
            {error && <span className="text-xs text-red-500">Debe estar entre {rango}.</span>}
          </label>
        ))}
      </div>
      {pareceInvertido && (
        <button
          type="button"
          className="self-start text-xs font-semibold text-amber-600 hover:underline"
          onClick={() => handleCoordenadaChange("lat", `${lngTexto}, ${latTexto}`)}
        >
          Parece que latitud y longitud están invertidas — intercambiarlas
        </button>
      )}
      <div className="text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Dirección</span>
          {value && (
            <button
              type="button"
              className="text-xs text-red-500 hover:underline"
              onClick={() => {
                ultimoPuntoRef.current = null;
                onChangeRef.current(null);
                actualizarDireccion(null);
                limpiarBusqueda();
              }}
            >
              Quitar punto
            </button>
          )}
        </div>
        {direccion && (
          <span className="flex items-center gap-2 text-gray-800">
            {textoResultado(direccion)}
            {direccion.componentes.calle && <EtiquetaPrecision exacto={direccion.exacto} />}
          </span>
        )}
        {nota && <span className="block text-xs text-gray-400">{nota}</span>}
      </div>

      <BuscarDireccionModal
        open={buscarDireccionOpen}
        onOpenChange={setBuscarDireccionOpen}
        apiKey={apiKey}
        cerca={value}
        onSeleccionar={handleSeleccionar}
      />
    </div>
  );
}
