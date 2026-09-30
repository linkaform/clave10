"use client";

import * as React from "react";
import { Loader2, MapPin, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PuntoGeo } from "./MapaSelectorPunto";

export interface ResultadoDireccion {
  id: string;
  nombre: string;
  detalle: string;
  punto: PuntoGeo;
}

const PAISES = [
  { code: "mx", label: "México" },
  { code: "do", label: "República Dominicana" },
  { code: "us", label: "Estados Unidos" },
  { code: "todos", label: "Otro / cualquiera" },
];

interface CamposDireccion {
  calle: string;
  numero: string;
  colonia: string;
  cp: string;
  municipio: string;
  estado: string;
  pais: string;
}

const CAMPOS_VACIOS: CamposDireccion = {
  calle: "",
  numero: "",
  colonia: "",
  cp: "",
  municipio: "",
  estado: "",
  pais: "mx",
};

const aResultado = (feature: any): ResultadoDireccion => {
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

interface BuscarDireccionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiKey: string;
  cerca?: PuntoGeo | null;
  onSeleccionar: (resultado: ResultadoDireccion) => void;
}

export function BuscarDireccionModal({ open, onOpenChange, apiKey, cerca, onSeleccionar }: BuscarDireccionModalProps) {
  const [campos, setCampos] = React.useState<CamposDireccion>(CAMPOS_VACIOS);
  const [resultados, setResultados] = React.useState<ResultadoDireccion[] | null>(null);
  const [buscando, setBuscando] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setResultados(null);
  }, [open]);

  const set = (key: keyof CamposDireccion) => (value: string) => setCampos((prev) => ({ ...prev, [key]: value }));

  const calleConNumero = [campos.calle.trim(), campos.numero.trim()].filter(Boolean).join(" ");
  const cpMunicipio = [campos.cp.trim(), campos.municipio.trim()].filter(Boolean).join(" ");
  const consulta = [calleConNumero, campos.colonia.trim(), cpMunicipio, campos.estado.trim()]
    .filter(Boolean)
    .join(", ");
  const puedeBuscar = consulta.length >= 3 && !buscando;

  const buscar = async () => {
    if (!puedeBuscar) return;
    setBuscando(true);
    try {
      const pais = campos.pais !== "todos" ? `&country=${campos.pais}` : "";
      const proximity = cerca ? `&proximity=${cerca.longitude},${cerca.latitude}` : "";
      const tipos = campos.calle.trim()
        ? "&types=address,poi,road,neighbourhood,locality,place,municipality"
        : "";
      const res = await fetch(
        `https://api.maptiler.com/geocoding/${encodeURIComponent(consulta)}.json?key=${apiKey}&autocomplete=false&limit=8&language=es${pais}${tipos}${proximity}`,
      );
      const data = await res.json();
      setResultados((data?.features ?? []).map(aResultado));
    } catch {
      setResultados([]);
    } finally {
      setBuscando(false);
    }
  };

  const labelClass = "text-xs font-semibold text-gray-500 uppercase tracking-wide";
  const inputClass = "bg-white border-gray-200";
  const onEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      buscar();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="flex-shrink-0 bg-white px-6 py-5 border-b">
          <DialogTitle className="text-xl text-center font-bold text-gray-800">Buscar por dirección</DialogTitle>
          <p className="text-center text-sm text-gray-400">Llena lo que sepas; entre más datos, mejor resultado</p>
        </DialogHeader>

        <div className="flex-grow min-h-0 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label className={labelClass}>Calle</Label>
              <Input value={campos.calle} onChange={(e) => set("calle")(e.target.value)} onKeyDown={onEnter} placeholder="Ej. Avenida Metroplex" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className={labelClass}>Número</Label>
              <Input value={campos.numero} onChange={(e) => set("numero")(e.target.value)} onKeyDown={onEnter} placeholder="Ej. 316" className={inputClass} />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label className={labelClass}>Colonia</Label>
              <Input value={campos.colonia} onChange={(e) => set("colonia")(e.target.value)} onKeyDown={onEnter} placeholder="Ej. Parque Industrial Metroplex" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className={labelClass}>C.P.</Label>
              <Input value={campos.cp} onChange={(e) => set("cp")(e.target.value)} onKeyDown={onEnter} placeholder="Ej. 66612" inputMode="numeric" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className={labelClass}>Municipio / ciudad</Label>
              <Input value={campos.municipio} onChange={(e) => set("municipio")(e.target.value)} onKeyDown={onEnter} placeholder="Ej. Apodaca" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className={labelClass}>Estado</Label>
              <Input value={campos.estado} onChange={(e) => set("estado")(e.target.value)} onKeyDown={onEnter} placeholder="Ej. Nuevo León" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className={labelClass}>País</Label>
              <Select value={campos.pais} onValueChange={set("pais")}>
                <SelectTrigger className={`w-full ${inputClass}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAISES.map((p) => (
                    <SelectItem key={p.code} value={p.code}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={buscar} disabled={!puedeBuscar} className="bg-blue-500 hover:bg-blue-600 text-white font-medium">
            {buscando ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
            Buscar
          </Button>

          {resultados !== null && (
            <div className="flex flex-col gap-2">
              {resultados.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  No se encontró esa dirección. Prueba con menos datos (por ejemplo, solo calle y municipio).
                </p>
              ) : (
                <>
                  <ul className="border border-gray-200 rounded-md divide-y divide-gray-100 overflow-hidden">
                    {resultados.map((r) => (
                      <li key={r.id}>
                        <button
                          type="button"
                          onClick={() => {
                            onSeleccionar(r);
                            onOpenChange(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50"
                        >
                          <MapPin className="w-5 h-5 shrink-0 text-gray-700" />
                          <span className="min-w-0">
                            <span className="block text-sm text-gray-800 truncate">{r.nombre}</span>
                            {r.detalle && <span className="block text-xs text-gray-400 truncate">{r.detalle}</span>}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-gray-400">
                    El mapa no siempre tiene el número exacto: si solo aparece la calle, elígela y mueve el marcador
                    al punto exacto.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
