"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  type UnidadItem,
  type MaterialCarga,
  emptyUnidad,
  emptyMaterial,
  materialesDeUnidad,
} from "@/components/transportista/agregar-unidad-modal";

// Material de carga al final del formulario (2610-1382, junta 16 oct):
// independiente de los remolques, con producto, lote, cantidad, peso y volumen. Opcionalmente se liga a una caja o contenedor; sin ligar
// vive en una unidad "Solo vehículo", que el backend clasifica como material
// del vehículo.

const SIN_LIGAR = "sin_ligar";

type CampoMaterial = "producto" | "lote" | "cantEsperada" | "peso" | "volumen";
const CAMPOS: { campo: CampoMaterial; label: string; placeholder: string }[] = [
  { campo: "producto", label: "Producto", placeholder: "Nombre del producto" },
  { campo: "lote", label: "Lote", placeholder: "L-4471" },
  { campo: "cantEsperada", label: "Cantidad", placeholder: "12 ton" },
  { campo: "peso", label: "Peso", placeholder: "2.5 ton" },
  { campo: "volumen", label: "Volumen", placeholder: "44.6 m³" },
];

interface Props {
  unidades: UnidadItem[];
  setUnidades: (fn: (prev: UnidadItem[]) => UnidadItem[]) => void;
}

// Reemplaza los materiales de la unidad en el lugar que les corresponde.
const conMateriales = (u: UnidadItem, materiales: MaterialCarga[]): UnidadItem =>
  u.config === "remolque_contenedor" ? { ...u, contenedor: { ...u.contenedor, materiales } }
  : u.config === "solo_vehiculo" ? { ...u, vehiculo: { ...u.vehiculo, materiales } }
  : { ...u, remolque: { ...u.remolque, materiales } };

// Agrega el material a la unidad destino; "sin ligar" usa (o crea) la unidad Solo vehículo.
const agregarA = (list: UnidadItem[], destino: string, m: MaterialCarga): UnidadItem[] => {
  if (destino === SIN_LIGAR) {
    const libre = list.find((u) => u.config === "solo_vehiculo");
    if (!libre) return [...list, { ...emptyUnidad(), config: "solo_vehiculo", vehiculo: { materiales: [m] } }];
    destino = libre.id;
  }
  return list.map((u) => u.id === destino ? conMateriales(u, [...materialesDeUnidad(u), m]) : u);
};

const quitarDe = (list: UnidadItem[], materialId: string): UnidadItem[] =>
  list.map((u) => {
    const mats = materialesDeUnidad(u);
    return mats.some((m) => m.id === materialId) ? conMateriales(u, mats.filter((m) => m.id !== materialId)) : u;
  });

export function MaterialesCarga({ unidades, setUnidades }: Props) {
  // Renglones recién agregados: se muestran aunque aún no tengan producto.
  const [nuevos, setNuevos] = useState<Set<string>>(new Set());

  const cajas = unidades.filter((u) => u.config !== "solo_vehiculo");
  const destinoDe = (u: UnidadItem) => (u.config === "solo_vehiculo" ? SIN_LIGAR : u.id);
  const etiquetaCaja = (u: UnidadItem) => {
    const n = cajas.indexOf(u) + 1;
    const ref = u.remolque.noCaja ? ` · ${u.remolque.noCaja}` : "";
    return u.config === "remolque_contenedor" ? `Contenedor de caja ${n}${ref}` : `Caja ${n}${ref}`;
  };

  // Sin cajas (p. ej. pickup) no hay a qué ligar: el material va al vehículo
  // y no se muestra la columna "Va en".
  const conCajas = cajas.length > 0;
  const cols = conCajas
    ? "grid-cols-[2fr_1fr_1fr_1fr_1fr_1.4fr_32px]"
    : "grid-cols-[2fr_1fr_1fr_1fr_1fr_32px]";

  const renglones = unidades.flatMap((u) =>
    materialesDeUnidad(u)
      .filter((m) => m.producto || nuevos.has(m.id))
      .map((m) => ({ unidad: u, material: m })),
  );

  const agregar = () => {
    const m = emptyMaterial();
    setNuevos((p) => new Set(p).add(m.id));
    setUnidades((p) => agregarA(p, SIN_LIGAR, m));
  };

  const setCampo = (materialId: string, campo: CampoMaterial, valor: string) =>
    setUnidades((p) => p.map((u) => {
      const mats = materialesDeUnidad(u);
      return mats.some((m) => m.id === materialId)
        ? conMateriales(u, mats.map((m) => m.id === materialId ? { ...m, [campo]: valor } : m))
        : u;
    }));

  const mover = (m: MaterialCarga, destino: string) =>
    setUnidades((p) => agregarA(quitarDe(p, m.id), destino, m));

  const quitar = (materialId: string) => {
    setNuevos((p) => { const n = new Set(p); n.delete(materialId); return n; });
    setUnidades((p) => quitarDe(p, materialId));
  };

  return (
    <div className="space-y-2">
      {renglones.length > 0 && (
        <div className={`grid ${cols} gap-2 px-1`}>
          {CAMPOS.map((c) => (
            <p key={c.campo} className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{c.label}</p>
          ))}
          {conCajas && <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Va en</p>}
        </div>
      )}
      {renglones.map(({ unidad, material }) => (
        <div key={material.id} className={`grid ${cols} gap-2 items-center`}>
          {CAMPOS.map((c) => (
            <Input
              key={c.campo}
              className="h-9 text-sm px-2"
              placeholder={c.placeholder}
              value={material[c.campo]}
              onChange={(e) => setCampo(material.id, c.campo, e.target.value)}
            />
          ))}
          {conCajas && <select
            value={destinoDe(unidad)}
            onChange={(e) => mover(material, e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:border-blue-400">
            <option value={SIN_LIGAR}>Sin ligar</option>
            {cajas.map((u) => <option key={u.id} value={u.id}>{etiquetaCaja(u)}</option>)}
          </select>}
          <button type="button" onClick={() => quitar(material.id)} aria-label="Quitar material" className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-500">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button type="button" onClick={agregar} className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 pt-1">
        <Plus className="w-3.5 h-3.5" /> Agregar material
      </button>
    </div>
  );
}
