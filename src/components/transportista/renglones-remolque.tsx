"use client";

import { Package, Plus, Trash2, Truck, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  type UnidadItem,
  type ContenedorData,
  emptyUnidad,
  emptyContenedorData,
  TIPOS_CONTENEDOR,
} from "@/components/transportista/agregar-unidad-modal";
import { SelectorTipoRemolque, remolquePermiteContenedor, remolqueLlevaSello } from "@/components/transportista/selector-tipo-remolque";

// Captura de remolques en renglones (2610-1382, junta 16 oct): cada caja en un
// renglón con tipo, placas, número y sello; "+" agrega otra caja, y las que
// admiten contenedor (plataforma, chasis) muestran "+ Contenedor". Reemplaza la caja rápida y el editor completo de unidad. Las
// unidades "Solo vehículo" (solo material) no se muestran aquí.

type ConId = ContenedorData & { id: string };

interface Props {
  unidades: UnidadItem[];
  setUnidades: (fn: (prev: UnidadItem[]) => UnidadItem[]) => void;
  // Contenedores que la IA no supo a qué caja ligar.
  sueltos: ConId[];
  onLigarSuelto: (unidadId: string, contenedorId: string) => void;
  // false = el tipo de vehículo no lleva caja (pickup, rígidos): sin renglón por default.
  requerido: boolean;
  showValidation: boolean;
  // Para ordenar primero los remolques sugeridos en la galería.
  tipoVehiculo?: string;
  // false en Recolección: la unidad llega vacía y el sello se pone a la salida.
  conSello?: boolean;
}

const celda = "h-9 text-sm";
const rojo = "border-red-300 bg-red-50";

export function RenglonesRemolque({ unidades, setUnidades, sueltos, onLigarSuelto, requerido, showValidation, tipoVehiculo, conSello = true }: Props) {
  // minmax(0, …): sin él, un tipo largo ("Chasis portacontenedor") ensancha
  // la columna solo en su renglón y descuadra los encabezados.
  const cols = conSello
    ? "grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_32px]"
    : "grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_32px]";
  const cajas = unidades.filter((u) => u.config !== "solo_vehiculo");

  // Si el nuevo tipo no admite contenedor, se le quita (su material pasa al remolque).
  const setRemolque = (id: string, campo: "tipo" | "placas" | "noCaja" | "noSello", valor: string) =>
    setUnidades((p) => p.map((u) => {
      if (u.id !== id) return u;
      const remolque = { ...u.remolque, [campo]: valor };
      // La plataforma no lleva sello (junta 19 oct).
      if (campo === "tipo" && !remolqueLlevaSello(valor)) remolque.noSello = "";
      if (campo === "tipo" && u.config === "remolque_contenedor" && !remolquePermiteContenedor(valor)) {
        const mats = u.contenedor.materiales.filter((m) => m.producto);
        return {
          ...u,
          config: "solo_remolque",
          contenedor: emptyContenedorData(),
          remolque: mats.length ? { ...remolque, materiales: [...remolque.materiales.filter((m) => m.producto), ...mats] } : remolque,
        };
      }
      return { ...u, remolque };
    }));

  const setContenedor = (id: string, campo: "tipo" | "noContenedor" | "noSello", valor: string) =>
    setUnidades((p) => p.map((u) => u.id === id ? { ...u, contenedor: { ...u.contenedor, [campo]: valor } } : u));

  // Renglón vacío cuando el vehículo pide caja y aún no hay ninguna: al
  // escribir en él se crea la unidad.
  const editarFantasma = (campo: "tipo" | "placas" | "noCaja" | "noSello", valor: string) => {
    const u = emptyUnidad();
    setUnidades((p) => [...p, { ...u, remolque: { ...u.remolque, [campo]: valor } }]);
  };

  // Si se está mostrando el renglón vacío por default, ese también se vuelve
  // unidad: si no, el clic solo "materializa" el vacío y parece no agregar.
  const agregarRemolque = () => setUnidades((p) => {
    const sinCajas = !p.some((u) => u.config !== "solo_vehiculo");
    return sinCajas && requerido ? [...p, emptyUnidad(), emptyUnidad()] : [...p, emptyUnidad()];
  });

  const agregarContenedor = (id: string) =>
    setUnidades((p) => p.map((u) => u.id === id ? { ...u, config: "remolque_contenedor", contenedor: emptyContenedorData() } : u));

  const quitarContenedor = (id: string) =>
    setUnidades((p) => p.map((u) => u.id === id ? { ...u, config: "solo_remolque", contenedor: emptyContenedorData() } : u));

  const quitar = (id: string) => setUnidades((p) => p.filter((u) => u.id !== id));

  const renglones: (UnidadItem | null)[] = cajas.length ? cajas : requerido ? [null] : [];

  return (
    <div className="space-y-2">
      {renglones.length > 0 && (
        <div className={cn("grid gap-2 px-1", cols)}>
          {["Tipo de remolque", "Placas", "No. de caja", ...(conSello ? ["No. de sello"] : [])].map((h) => (
            <p key={h} className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{h}</p>
          ))}
        </div>
      )}

      {renglones.map((u, i) => {
        const r = u?.remolque;
        const editar = (campo: "tipo" | "placas" | "noCaja" | "noSello", v: string) =>
          u ? setRemolque(u.id, campo, v) : editarFantasma(campo, v);
        return (
          <div key={u?.id ?? "nuevo"} className="space-y-2">
            <div className={cn("grid gap-2 items-center", cols)}>
              <SelectorTipoRemolque
                value={r?.tipo ?? ""}
                onChange={(t) => editar("tipo", t)}
                tipoVehiculo={tipoVehiculo}
              />
              <Input
                className={cn(celda, "font-mono uppercase placeholder:normal-case placeholder:font-sans", showValidation && !r?.placas.trim() && rojo)}
                placeholder="123-AB-4"
                value={r?.placas ?? ""}
                onChange={(e) => editar("placas", e.target.value)}
              />
              <Input
                className={cn(celda, showValidation && !r?.noCaja.trim() && rojo)}
                placeholder="CAJA-001"
                value={r?.noCaja ?? ""}
                onChange={(e) => editar("noCaja", e.target.value)}
              />
              {conSello && !remolqueLlevaSello(r?.tipo) && (
                <span className="text-[11px] text-gray-300 italic px-1">Sin sello</span>
              )}
              {conSello && remolqueLlevaSello(r?.tipo) && (
                <Input
                  className={celda}
                  placeholder="Si aplica"
                  value={r?.noSello ?? ""}
                  onChange={(e) => editar("noSello", e.target.value)}
                />
              )}
              {/* El primer renglón no se quita cuando el vehículo pide caja. */}
              {u && !(requerido && i === 0) ? (
                <button type="button" onClick={() => quitar(u.id)} aria-label="Quitar remolque" className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              ) : <span />}
            </div>

            {u?.config === "remolque_contenedor" && (
              // Línea de "árbol" (como la indentación de un editor de código)
              // que cuelga el contenedor de su remolque.
              // Misma grid que el remolque (sin sangría) para que las columnas
              // coincidan; solo el tipo de contenedor se recorre a la derecha.
              <div className="relative">
              <span aria-hidden className="absolute left-3 -top-2 h-[calc(50%+0.5rem)] w-3.5 border-l-2 border-b-2 border-violet-300 rounded-bl-md" />
              <div className={cn("grid gap-2 items-center", cols)}>
                <div className="relative ml-7">
                  <Package className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-violet-500 pointer-events-none" />
                  <select
                    value={u.contenedor.tipo}
                    onChange={(e) => setContenedor(u.id, "tipo", e.target.value)}
                    className="w-full h-9 rounded-md border border-violet-200 bg-violet-50/40 pl-7 pr-2 text-sm text-gray-700 focus:outline-none focus:border-violet-400">
                    <option value="">Tipo de contenedor</option>
                    {TIPOS_CONTENEDOR.map((t) => <option key={t} value={t}>{t}</option>)}
                    {u.contenedor.tipo && !TIPOS_CONTENEDOR.includes(u.contenedor.tipo) && <option value={u.contenedor.tipo}>{u.contenedor.tipo}</option>}
                  </select>
                </div>
                <Input
                  className={cn(celda, "col-span-2")}
                  placeholder="No. de contenedor"
                  value={u.contenedor.noContenedor}
                  onChange={(e) => setContenedor(u.id, "noContenedor", e.target.value)}
                />
                {conSello && (
                  <Input
                    className={celda}
                    placeholder="Sello"
                    value={u.contenedor.noSello}
                    onChange={(e) => setContenedor(u.id, "noSello", e.target.value)}
                  />
                )}
                <button type="button" onClick={() => quitarContenedor(u.id)} aria-label="Quitar contenedor" className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
              </div>
            )}

            {u?.config === "solo_remolque" && remolquePermiteContenedor(u.remolque.tipo) && (
              <button
                type="button"
                onClick={() => agregarContenedor(u.id)}
                className="ml-7 flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-700">
                <Plus className="w-3.5 h-3.5" /> Contenedor
              </button>
            )}
          </div>
        );
      })}

      {sueltos.length > 0 && (
        <div className="rounded-lg border border-violet-200 bg-violet-50/50 p-3 space-y-2">
          <p className="text-[11px] font-semibold text-violet-700">
            La IA detectó contenedores y no supo en qué caja van. Elige la caja de cada uno:
          </p>
          {sueltos.map((c) => (
            <div key={c.id} className="flex items-center gap-2">
              <Package className="w-3.5 h-3.5 text-violet-500 shrink-0" />
              <span className="text-xs text-gray-700 flex-1 truncate">{c.noContenedor || c.tipo || "Contenedor"}{c.noSello ? ` · Sello ${c.noSello}` : ""}</span>
              <select
                defaultValue=""
                onChange={(e) => e.target.value && onLigarSuelto(e.target.value, c.id)}
                className="h-8 rounded-md border border-violet-200 bg-white px-2 text-xs">
                <option value="">Va en…</option>
                {/* Solo remolques que admiten contenedor (o sin tipo aún). */}
                {cajas.filter((u) => u.config === "solo_remolque" && (!u.remolque.tipo || remolquePermiteContenedor(u.remolque.tipo))).map((u) => (
                  <option key={u.id} value={u.id}>Caja {cajas.indexOf(u) + 1}{u.remolque.noCaja ? ` · ${u.remolque.noCaja}` : ""}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 pt-1">
        {renglones.length === 0 && (
          <span className="flex items-center gap-1.5 text-xs text-gray-400">
            <Truck className="w-3.5 h-3.5" /> Sin remolque
          </span>
        )}
        <button type="button" onClick={agregarRemolque} className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
          <Plus className="w-3.5 h-3.5" /> Agregar remolque
        </button>
      </div>
    </div>
  );
}
