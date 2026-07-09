"use client";

import { useState } from "react";
import { Truck, Package, Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Unidades types & helpers ────────────────────────────────────────────────
// Compartido entre el modal de "Nuevo acceso" y el detalle de transportista,
// para que ambos flujos capturen remolques/contenedores y su material de
// carga exactamente de la misma forma.

export type UnidadConfig = "solo_remolque" | "remolque_contenedor";

export interface MaterialCarga {
  id: string;
  apiIndex: number | null; // null = nuevo, 0+ = existente
  producto: string;
  lote: string;
  cantEsperada: string;
  cantFisica: string;
  peso: string;
  volumen: string;
}

export interface RemolqueData {
  tipo: string;
  noSello: string;
  noCaja: string;
  placas: string;
  color: string;
  comentarios: string;
  materiales: MaterialCarga[];
}

export interface ContenedorData {
  tipo: string;
  noSello: string;
  noContenedor: string;
  noCaja: string;
  color: string;
  comentarios: string;
  materiales: MaterialCarga[];
}

export interface UnidadItem {
  id: string;
  config: UnidadConfig;
  remolqueApiIndex: number | null;   // null = nuevo, 0+ = posición real en grupo combinado
  contenedorApiIndex: number | null; // null = nuevo, 0+ = posición real en grupo combinado
  remolque: RemolqueData;
  contenedor: ContenedorData;
}

export const emptyMaterial = (): MaterialCarga => ({
  id: Math.random().toString(36).slice(2),
  apiIndex: null,
  producto: "", lote: "", cantEsperada: "", cantFisica: "", peso: "", volumen: "",
});

export const emptyRemolqueData = (): RemolqueData => ({
  tipo: "", noSello: "", noCaja: "", placas: "", color: "", comentarios: "", materiales: [emptyMaterial()],
});

export const emptyContenedorData = (): ContenedorData => ({
  tipo: "", noSello: "", noContenedor: "", noCaja: "", color: "", comentarios: "", materiales: [emptyMaterial()],
});

export const emptyUnidad = (): UnidadItem => ({
  id: Math.random().toString(36).slice(2),
  config: "solo_remolque",
  remolqueApiIndex: null,
  contenedorApiIndex: null,
  remolque: emptyRemolqueData(),
  contenedor: emptyContenedorData(),
});

// ─── Serialización para el servicio de guardado ──────────────────────────────

export const serializeMaterial = (m: MaterialCarga) => ({
  producto:      m.producto,
  lote:          m.lote,
  cant_esperada: m.cantEsperada,
  cant_fisica:   m.cantFisica,
  peso:          m.peso,
  volumen:       m.volumen,
});

export const serializeUnidades = (list: UnidadItem[]) => {
  let remolqueIdx = 0;
  let contenedorIdx = 0;

  const remolques: object[] = [];
  const contenedores: object[] = [];
  const materiales: object[] = [];

  list.forEach((u) => {
    remolqueIdx++;
    const remolqueRef = `remolque_${remolqueIdx}`;

    remolques.push({
      index:       u.remolqueApiIndex ?? null,
      ref:         remolqueRef,
      tipo:        u.remolque.tipo,
      no_sello:    u.remolque.noSello,
      no_caja:     u.remolque.noCaja,
      placas:      u.remolque.placas,
      color:       u.remolque.color,
      comentarios: u.remolque.comentarios,
    });

    if (u.config === "remolque_contenedor") {
      contenedorIdx++;
      const contenedorRef = `contenedor_${contenedorIdx}`;

      contenedores.push({
        index:         u.contenedorApiIndex ?? null,
        ref:           contenedorRef,
        ref_remolque:  remolqueRef,
        tipo:          u.contenedor.tipo,
        no_sello:      u.contenedor.noSello,
        no_contenedor: u.contenedor.noContenedor,
        no_caja:       u.contenedor.noCaja,
        color:         u.contenedor.color,
        comentarios:   u.contenedor.comentarios,
      });

      u.contenedor.materiales
        .filter((m) => m.producto)
        .forEach((m) => materiales.push({ index: m.apiIndex, ref: contenedorRef, ...serializeMaterial(m) }));
    } else {
      u.remolque.materiales
        .filter((m) => m.producto)
        .forEach((m) => materiales.push({ index: m.apiIndex, ref: remolqueRef, ...serializeMaterial(m) }));
    }
  });

  return { remolques, contenedores, materiales };
};

// ─── Constantes ───────────────────────────────────────────────────────────────

export const COLORES = [
  { label: "Blanco",   hex: "#F3F4F6" },
  { label: "Rojo",     hex: "#EF4444" },
  { label: "Azul",     hex: "#3B82F6" },
  { label: "Verde",    hex: "#22C55E" },
  { label: "Naranja",  hex: "#F97316" },
  { label: "Negro",    hex: "#1F2937" },
];

// El color puede venir de dos formas: un hex elegido en el selector de arriba,
// o un nombre libre en español que manda el servicio de IA (ej. "GRIS",
// "AZUL REY"). Este helper resuelve un swatch aproximado para ambos casos sin
// perder nunca el texto original.
const COLOR_HEX_POR_NOMBRE: Record<string, string> = {
  blanco: "#F3F4F6", rojo: "#EF4444", azul: "#3B82F6", verde: "#22C55E",
  naranja: "#F97316", negro: "#1F2937", gris: "#9CA3AF", amarillo: "#EAB308",
  morado: "#8B5CF6", violeta: "#8B5CF6", rosa: "#EC4899", cafe: "#78350F", marron: "#78350F",
};

export function resolveColorSwatch(value: string): { hex: string | null; label: string } | null {
  if (!value) return null;
  const exact = COLORES.find((c) => c.hex.toLowerCase() === value.trim().toLowerCase());
  if (exact) return exact;
  const normalized = value.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const key = Object.keys(COLOR_HEX_POR_NOMBRE).find((k) => normalized.includes(k));
  return { hex: key ? COLOR_HEX_POR_NOMBRE[key] : null, label: value };
}

export const TIPOS_REMOLQUE = ["Caja seca", "Plataforma", "Caja refrigerada", "Ganadero", "Basculante", "Portavehículos", "Caravana"];
export const TIPOS_CONTENEDOR = ["20' Standard (20GP)", "40' Standard (40GP)", "40' High Cube (40HC)", "20' Reefer (20RF)", "40' Reefer (40RF)", "40' HC Reefer (40HR)", "20' Open Top (20OT)", "40' Open Top (40OT)", "20' Flat Rack (20FR)", "40' Flat Rack (40FR)", "ISO Tank", "20' Ventilado (20VH)", "Open Side"];

// ─── Agregar Unidad Modal ─────────────────────────────────────────────────────

// `UnidadEditorCard` es el formulario "puro" (sin overlay ni posicionamiento
// fijo) para poder embeberlo tanto dentro de un modal (`AgregarUnidadModal`,
// usado en el detalle de transportista) como inline dentro de otro modal ya
// abierto (el de "Nuevo acceso"), evitando apilar un modal sobre otro.
export function UnidadEditorCard({
  onCancel,
  onSave,
  initialData,
  className,
}: {
  onCancel: () => void;
  onSave: (unidad: UnidadItem) => void;
  initialData?: UnidadItem;
  className?: string;
}) {
  const [config, setConfig] = useState<UnidadConfig>(initialData?.config ?? "solo_remolque");
  const [activeTab, setActiveTab] = useState<"remolque" | "contenedor">("remolque");
  const [remolque, setRemolque] = useState<RemolqueData>(initialData?.remolque ?? emptyRemolqueData());
  const [contenedor, setContenedor] = useState<ContenedorData>(initialData?.contenedor ?? emptyContenedorData());

  const updateR = (field: keyof RemolqueData, value: string) =>
    setRemolque((p) => ({ ...p, [field]: value }));
  const updateC = (field: keyof ContenedorData, value: string) =>
    setContenedor((p) => ({ ...p, [field]: value }));

  const addMaterialR = () => setRemolque((p) => ({ ...p, materiales: [...p.materiales, emptyMaterial()] }));
  const removeMaterialR = (id: string) => setRemolque((p) => ({ ...p, materiales: p.materiales.filter((m) => m.id !== id) }));
  const updateMaterialR = (id: string, field: keyof MaterialCarga, value: string) =>
    setRemolque((p) => ({ ...p, materiales: p.materiales.map((m) => m.id === id ? { ...m, [field]: value } : m) }));

  const addMaterialC = () => setContenedor((p) => ({ ...p, materiales: [...p.materiales, emptyMaterial()] }));
  const removeMaterialC = (id: string) => setContenedor((p) => ({ ...p, materiales: p.materiales.filter((m) => m.id !== id) }));
  const updateMaterialC = (id: string, field: keyof MaterialCarga, value: string) =>
    setContenedor((p) => ({ ...p, materiales: p.materiales.map((m) => m.id === id ? { ...m, [field]: value } : m) }));

  const handleSave = () => {
    onSave({
      id:                 initialData?.id                 ?? Math.random().toString(36).slice(2),
      config,
      remolqueApiIndex:   initialData?.remolqueApiIndex   ?? null,
      contenedorApiIndex: initialData?.contenedorApiIndex ?? null,
      remolque,
      contenedor,
    });
  };

  const renderMateriales = (
    materiales: MaterialCarga[],
    onAdd: () => void,
    onRemove: (id: string) => void,
    onUpdate: (id: string, field: keyof MaterialCarga, value: string) => void,
  ) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Material de carga</p>
        <button type="button" onClick={onAdd} className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
          <Plus className="w-3 h-3" /> Agregar material
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse" style={{ minWidth: 480 }}>
          <thead>
            <tr>
              {["Producto", "Lote", "Cant. esperada", "Cant. física", "Peso", "Volumen", ""].map((h) => (
                <th key={h} className="text-[9px] font-bold text-gray-400 uppercase tracking-widest text-left pb-1.5 pr-2">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="space-y-1">
            {materiales.map((m) => (
              <tr key={m.id}>
                <td className="pr-2 pb-1.5"><input className="w-full h-8 rounded-lg border border-gray-200 px-2.5 text-xs focus:outline-none focus:border-blue-400" placeholder="Nombre del producto" value={m.producto} onChange={(e) => onUpdate(m.id, "producto", e.target.value)} /></td>
                <td className="pr-2 pb-1.5"><input className="w-24 h-8 rounded-lg border border-gray-200 px-2.5 text-xs focus:outline-none focus:border-blue-400" placeholder="L-4471" value={m.lote} onChange={(e) => onUpdate(m.id, "lote", e.target.value)} /></td>
                <td className="pr-2 pb-1.5"><input className="w-24 h-8 rounded-lg border border-gray-200 px-2.5 text-xs focus:outline-none focus:border-blue-400" placeholder="12 ton" value={m.cantEsperada} onChange={(e) => onUpdate(m.id, "cantEsperada", e.target.value)} /></td>
                <td className="pr-2 pb-1.5"><input className="w-24 h-8 rounded-lg border border-gray-200 px-2.5 text-xs focus:outline-none focus:border-blue-400" placeholder="—" value={m.cantFisica} onChange={(e) => onUpdate(m.id, "cantFisica", e.target.value)} /></td>
                <td className="pr-2 pb-1.5"><input className="w-24 h-8 rounded-lg border border-gray-200 px-2.5 text-xs focus:outline-none focus:border-blue-400" placeholder="2.5 ton" value={m.peso} onChange={(e) => onUpdate(m.id, "peso", e.target.value)} /></td>
                <td className="pr-2 pb-1.5"><input className="w-24 h-8 rounded-lg border border-gray-200 px-2.5 text-xs focus:outline-none focus:border-blue-400" placeholder="44.6 m³" value={m.volumen} onChange={(e) => onUpdate(m.id, "volumen", e.target.value)} /></td>
                <td className="pb-1.5"><button type="button" onClick={() => onRemove(m.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className={cn("bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
          <Truck className="w-4.5 h-4.5 text-blue-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-800">{initialData ? "Editar unidad" : "Agregar unidad"}</p>
          <p className="text-xs text-gray-400">Completa los datos del remolque o contenedor</p>
        </div>
        <button onClick={onCancel} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Config toggle */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-100 bg-gray-50/60">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Configuración:</span>
          <div className="flex gap-2">
            <button type="button" onClick={() => { setConfig("solo_remolque"); setActiveTab("remolque"); }}
              className={cn("h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all",
                config === "solo_remolque" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300")}>
              <Truck className="w-3.5 h-3.5" /> Solo remolque
            </button>
            <button type="button" onClick={() => setConfig("remolque_contenedor")}
              className={cn("h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all",
                config === "remolque_contenedor" ? "bg-violet-600 text-white border-violet-600" : "bg-white text-gray-600 border-gray-200 hover:border-violet-300")}>
              <Package className="w-3.5 h-3.5" /> Remolque + Contenedor
            </button>
          </div>
        </div>

        {/* Tabs (solo cuando config === remolque_contenedor) */}
        {config === "remolque_contenedor" && (
          <div className="flex border-b border-gray-100 px-6">
            {(["remolque", "contenedor"] as const).map((tab) => (
              <button key={tab} type="button" onClick={() => setActiveTab(tab)}
                className={cn("py-2.5 px-1 mr-5 text-xs font-semibold border-b-2 transition-colors capitalize",
                  activeTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600")}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {(config === "solo_remolque" || activeTab === "remolque") ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">1</div>
                <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">Remolque</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Tipo de remolque <span className="text-red-400">*</span></p>
                  <select className="w-full h-9 rounded-lg border border-gray-200 px-2.5 text-xs focus:outline-none focus:border-blue-400 bg-white" value={remolque.tipo} onChange={(e) => updateR("tipo", e.target.value)}>
                    <option value="">Seleccionar tipo...</option>
                    {TIPOS_REMOLQUE.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">No. de sello</p>
                  <input className="w-full h-9 rounded-lg border border-gray-200 px-2.5 text-xs focus:outline-none focus:border-blue-400" placeholder="Ej. S-987654" value={remolque.noSello} onChange={(e) => updateR("noSello", e.target.value)} />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">No. de caja <span className="text-red-400">*</span></p>
                  <input className="w-full h-9 rounded-lg border border-gray-200 px-2.5 text-xs font-mono uppercase focus:outline-none focus:border-blue-400" placeholder="Ej. CAJA-001" value={remolque.noCaja} onChange={(e) => updateR("noCaja", e.target.value)} />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Placas de caja <span className="text-red-400">*</span></p>
                  <input className="w-full h-9 rounded-lg border border-gray-200 px-2.5 text-xs font-mono uppercase focus:outline-none focus:border-blue-400" placeholder="Ej. 123-AB-4" value={remolque.placas} onChange={(e) => updateR("placas", e.target.value)} />
                </div>
              </div>
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Color</p>
                <div className="flex gap-2">
                  {COLORES.map((c) => (
                    <button key={c.hex} type="button" onClick={() => updateR("color", c.hex)}
                      className={cn("w-7 h-7 rounded-full border-2 transition-all", remolque.color === c.hex ? "border-blue-500 scale-110" : "border-transparent hover:border-gray-300")}
                      style={{ background: c.hex }} title={c.label} />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Comentarios</p>
                <textarea className="w-full rounded-lg border border-gray-200 px-2.5 py-2 text-xs focus:outline-none focus:border-blue-400 resize-none" rows={2} placeholder="Escribe cualquier comentario adicional" value={remolque.comentarios} onChange={(e) => updateR("comentarios", e.target.value)} />
              </div>
              {config === "solo_remolque" && renderMateriales(remolque.materiales, addMaterialR, removeMaterialR, updateMaterialR)}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">2</div>
                <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">Contenedor</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Tipo de contenedor <span className="text-red-400">*</span></p>
                  <select className="w-full h-9 rounded-lg border border-gray-200 px-2.5 text-xs focus:outline-none focus:border-blue-400 bg-white" value={contenedor.tipo} onChange={(e) => updateC("tipo", e.target.value)}>
                    <option value="">Seleccionar tipo...</option>
                    {TIPOS_CONTENEDOR.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">No. de sello</p>
                  <input className="w-full h-9 rounded-lg border border-gray-200 px-2.5 text-xs focus:outline-none focus:border-blue-400" placeholder="Ej. S-987655" value={contenedor.noSello} onChange={(e) => updateC("noSello", e.target.value)} />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">No. de contenedor <span className="text-red-400">*</span></p>
                  <input className="w-full h-9 rounded-lg border border-gray-200 px-2.5 text-xs font-mono uppercase focus:outline-none focus:border-blue-400" placeholder="Ej. CNTR-5512" value={contenedor.noContenedor} onChange={(e) => updateC("noContenedor", e.target.value)} />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">No. de caja <span className="text-red-400">*</span></p>
                  <input className="w-full h-9 rounded-lg border border-gray-200 px-2.5 text-xs font-mono uppercase focus:outline-none focus:border-blue-400" placeholder="Ej. CT-101" value={contenedor.noCaja} onChange={(e) => updateC("noCaja", e.target.value)} />
                </div>
              </div>
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Color</p>
                <div className="flex gap-2">
                  {COLORES.map((c) => (
                    <button key={c.hex} type="button" onClick={() => updateC("color", c.hex)}
                      className={cn("w-7 h-7 rounded-full border-2 transition-all", contenedor.color === c.hex ? "border-blue-500 scale-110" : "border-transparent hover:border-gray-300")}
                      style={{ background: c.hex }} title={c.label} />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Comentarios</p>
                <textarea className="w-full rounded-lg border border-gray-200 px-2.5 py-2 text-xs focus:outline-none focus:border-blue-400 resize-none" rows={2} placeholder="Escribe cualquier comentario adicional" value={contenedor.comentarios} onChange={(e) => updateC("comentarios", e.target.value)} />
              </div>
              {renderMateriales(contenedor.materiales, addMaterialC, removeMaterialC, updateMaterialC)}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/60">
          <button type="button" onClick={onCancel} className="h-9 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors">Cancelar</button>
          <button type="button" onClick={handleSave} className="flex-1 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors">Guardar</button>
        </div>
    </div>
  );
}

// Envoltorio de modal (overlay + centrado) alrededor del mismo formulario —
// se usa en el detalle de transportista, donde sí abre como modal propio.
export function AgregarUnidadModal({
  onClose,
  onSave,
  initialData,
}: {
  onClose: () => void;
  onSave: (unidad: UnidadItem) => void;
  initialData?: UnidadItem;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <UnidadEditorCard
        className="w-full max-w-3xl max-h-[90vh] shadow-2xl"
        initialData={initialData}
        onCancel={onClose}
        onSave={(u) => { onSave(u); onClose(); }}
      />
    </div>
  );
}
