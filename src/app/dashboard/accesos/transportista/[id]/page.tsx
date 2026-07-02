"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  LogIn,
  Camera,
  FileText,
  Truck,
  CheckCircle2,
  Plus,
  Trash2,
  Shield,
  Lock,
  ClipboardCheck,
  Clock,
  X,
  Package,
  Pencil,
  Save,
  HelpCircle,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGetVisitTransportista } from "@/hooks/useGetVisitTransportista";
import { saveBitacoraTransportistaRecord, saveInspeccionesTransportista } from "@/services/endpoints";
import { uploadImage } from "@/lib/get-upload-image";
import { toast } from "sonner";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTimestamp(ts: string | number): string {
  const d = typeof ts === "number" ? new Date(ts * 1000) : new Date(ts);
  const months = [
    "ene",
    "feb",
    "mar",
    "abr",
    "may",
    "jun",
    "jul",
    "ago",
    "sep",
    "oct",
    "nov",
    "dic",
  ];
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} · ${h}:${m}:${s} hrs`;
}

type DocType = "pdf" | "img" | "xls";

const DOC_TYPE_META: Record<
  DocType,
  { ext: string; bg: string; color: string }
> = {
  pdf: { ext: "PDF", bg: "#DC2626", color: "#fff" },
  xls: { ext: "XLS", bg: "#16A34A", color: "#fff" },
  img: { ext: "IMG", bg: "rgba(47,128,237,.12)", color: "#2F80ED" },
};

function Field({
  label,
  value,
  mono,
  icon: Icon,
}: {
  label: string;
  value?: string | null;
  mono?: boolean;
  icon?: React.ElementType;
}) {
  return (
    <div>
      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
        {label}
      </p>
      <p
        className={cn(
          "text-xs text-gray-700 leading-snug flex items-center gap-1",
          mono && "font-mono",
          !value && "text-gray-300 italic",
        )}>
        {Icon && <Icon className="w-3 h-3 text-gray-400 shrink-0" />}
        {value ?? "Sin información"}
      </p>
    </div>
  );
}

// ─── Unidades types & helpers ────────────────────────────────────────────────

type UnidadConfig = "solo_remolque" | "remolque_contenedor";

interface MaterialCarga {
  id: string;
  apiIndex: number | null; // null = nuevo, 0+ = existente
  producto: string;
  lote: string;
  cantEsperada: string;
  cantFisica: string;
  peso: string;
  volumen: string;
}

interface RemolqueData {
  tipo: string;
  noSello: string;
  noCaja: string;
  placas: string;
  color: string;
  comentarios: string;
  materiales: MaterialCarga[];
}

interface ContenedorData {
  tipo: string;
  noSello: string;
  noContenedor: string;
  noCaja: string;
  color: string;
  comentarios: string;
  materiales: MaterialCarga[];
}

interface UnidadItem {
  id: string;
  config: UnidadConfig;
  remolqueApiIndex: number | null;   // null = nuevo, 0+ = posición real en grupo combinado
  contenedorApiIndex: number | null; // null = nuevo, 0+ = posición real en grupo combinado
  remolque: RemolqueData;
  contenedor: ContenedorData;
}

const emptyMaterial = (): MaterialCarga => ({
  id: Math.random().toString(36).slice(2),
  apiIndex: null,
  producto: "", lote: "", cantEsperada: "", cantFisica: "", peso: "", volumen: "",
});

const emptyRemolqueData = (): RemolqueData => ({
  tipo: "", noSello: "", noCaja: "", placas: "", color: "", comentarios: "", materiales: [emptyMaterial()],
});

const emptyContenedorData = (): ContenedorData => ({
  tipo: "", noSello: "", noContenedor: "", noCaja: "", color: "", comentarios: "", materiales: [emptyMaterial()],
});

const emptyUnidad = (): UnidadItem => ({
  id: Math.random().toString(36).slice(2),
  config: "solo_remolque",
  remolqueApiIndex: null,
  contenedorApiIndex: null,
  remolque: emptyRemolqueData(),
  contenedor: emptyContenedorData(),
});

// ─── Agregar Unidad Modal ─────────────────────────────────────────────────────

const COLORES = [
  { label: "Blanco",   hex: "#F3F4F6" },
  { label: "Rojo",     hex: "#EF4444" },
  { label: "Azul",     hex: "#3B82F6" },
  { label: "Verde",    hex: "#22C55E" },
  { label: "Naranja",  hex: "#F97316" },
  { label: "Negro",    hex: "#1F2937" },
];

const TIPOS_REMOLQUE = ["Caja seca", "Plataforma", "Caja refrigerada", "Ganadero", "Basculante", "Portavehículos", "Caravana"];
const TIPOS_CONTENEDOR = ["20' Standard (20GP)", "40' Standard (40GP)", "40' High Cube (40HC)", "20' Reefer (20RF)", "40' Reefer (40RF)", "40' HC Reefer (40HR)", "20' Open Top (20OT)", "40' Open Top (40OT)", "20' Flat Rack (20FR)", "40' Flat Rack (40FR)", "ISO Tank", "20' Ventilado (20VH)", "Open Side"];

function AgregarUnidadModal({
  onClose,
  onSave,
  initialData,
}: {
  onClose: () => void;
  onSave: (unidad: UnidadItem) => void;
  initialData?: UnidadItem;
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
    onClose();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
            <Truck className="w-4.5 h-4.5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-800">{initialData ? "Editar unidad" : "Agregar unidad"}</p>
            <p className="text-xs text-gray-400">Completa los datos del remolque o contenedor</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
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
          <button type="button" onClick={onClose} className="h-9 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors">Cancelar</button>
          <button type="button" onClick={handleSave} className="flex-1 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors">Guardar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Inspección de Entrada Modal ──────────────────────────────────────────────

const PUNTOS_TRACTOR = [
  "Defensa",
  "Motor, caja de la batería, caja y filtros de aire",
  "Llantas y rines (tractor y remolque)",
  "Piso (tractor)",
  "Tanque de combustible",
  "Cabina, dormitorio, puertas y compartimientos de herramientas, sección de pasajero y techo",
  "Tanque de aire",
  "Ejes de transmisión",
  "Quinta rueda",
  "Chasis",
  "Puertas externa",
  "Piso externo (trailer, contenedor, caja)",
  "Paredes externa",
  "Pared frontal externa",
  "Techo externo",
  "Unidad de refrigeración",
  "Escape / Mofles",
];

const PUNTOS_REMOLQUE = [
  "Tanque de aire",
  "Ejes de transmisión",
  "Quinta rueda",
  "Chasis",
  "Puertas externa",
  "Piso externo (trailer, contenedor, caja)",
  "Paredes externa",
  "Pared frontal externa",
  "Techo externo",
  "Unidad de refrigeración",
  "Escape / Mofles",
];

const FILAS_CONTENEDOR = [
  "Exterior / parte inferior del contenedor (bastidor o chasis)",
  "Puertas interiores / exteriores",
  "Pared interior lado derecho",
  "Pared interior lado izquierdo",
  "Pared interior frontal",
  "Techo / cubierta superior",
  "Piso (interior)",
];

type SiNoVal = "sí" | "no" | null;
type EvidenciaImg = { file_url: string; file_name?: string };
interface PuntoInsp { value: SiNoVal; comentario: string; fotos: EvidenciaImg[]; }
type FilaOpcion = "todos" | "suciedad" | "plagas" | "fauna";
type FilaCelda = "sí" | "no" | null;
interface FilaCont { suciedad: FilaCelda; plagas: FilaCelda; fauna: FilaCelda; }
interface RemolqueInspSection {
  evidencia: EvidenciaImg[];
  altura: string; ancho: string; longitud: string;
  puntos: PuntoInsp[];
}
interface ContenedorInspSection {
  evidencia: EvidenciaImg[];
  altura: string; ancho: string; longitud: string;
  filas: FilaCont[];
}
interface UnitInspData {
  remolque: RemolqueInspSection;
  contenedor: ContenedorInspSection | null; // null para solo_remolque
}
type InspTabDef =
  | { kind: "tractor" }
  | { kind: "remolque"; unitIdx: number; label: string }
  | { kind: "contenedor"; unitIdx: number; label: string };

function InspeccionEntradaModal({
  recordId,
  unidades,
  inspeccionesDone,
  onClose,
}: {
  recordId: string;
  unidades: UnidadItem[];
  inspeccionesDone: { tipo: string; unidad?: number; url?: string }[];
  onClose: () => void;
}) {
  const buildTipoKey = (tipo: string, unidad?: number) =>
    unidad !== undefined ? `${tipo}_${unidad}` : tipo;
  const isDone = (tipo: string, unidad?: number) =>
    inspeccionesDone.some((i) => i.tipo === buildTipoKey(tipo, unidad));
  const [activeTab, setActiveTab] = useState(0);
  const [tractorEvidencia, setTractorEvidencia] = useState<EvidenciaImg[]>([]);
  const [uploadingSection, setUploadingSection] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingSectionRef = useRef<string | null>(null);
  const tabsScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const checkTabsScroll = () => {
    const el = tabsScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };
  const scrollTabs = (dir: "left" | "right") => {
    tabsScrollRef.current?.scrollBy({ left: dir === "left" ? -120 : 120, behavior: "smooth" });
  };
  const emptyPunto = (): PuntoInsp => ({ value: null, comentario: "", fotos: [] });
  const emptyRemolqueSection = (): RemolqueInspSection => ({
    evidencia: [], altura: "", ancho: "", longitud: "",
    puntos: PUNTOS_REMOLQUE.map(emptyPunto),
  });
  const emptyContenedorSection = (): ContenedorInspSection => ({
    evidencia: [], altura: "", ancho: "", longitud: "",
    filas: FILAS_CONTENEDOR.map(() => ({ suciedad: null as FilaCelda, plagas: null as FilaCelda, fauna: null as FilaCelda })),
  });
  const [tractorPuntos, setTractorPuntos] = useState<PuntoInsp[]>(PUNTOS_TRACTOR.map(emptyPunto));
  const [unitsData, setUnitsData] = useState<UnitInspData[]>(() =>
    unidades.map((u) => ({
      remolque: emptyRemolqueSection(),
      contenedor: u.config === "remolque_contenedor" ? emptyContenedorSection() : null,
    }))
  );

  // Tab list: Tractor siempre primero; para remolque_contenedor → 2 tabs por unidad
  const inspTabs: InspTabDef[] = [
    { kind: "tractor" },
    ...unidades.flatMap((u, i) => {
      const remTab: InspTabDef = { kind: "remolque", unitIdx: i, label: `Unidad ${i + 1} · Remolque` };
      if (u.config === "remolque_contenedor") {
        return [remTab, { kind: "contenedor", unitIdx: i, label: `Unidad ${i + 1} · Contenedor` } as InspTabDef];
      }
      return [remTab];
    }),
  ];
  useEffect(() => { checkTabsScroll(); }, [inspTabs.length]);

  const tractorEval = tractorPuntos.filter((p) => p.value !== null).length;

  const remolqueEval = (d: UnitInspData) => d.remolque.puntos.filter((p) => p.value !== null).length;
  const contenedorEval = (d: UnitInspData) =>
    (d.contenedor?.filas ?? []).filter((f) => f.suciedad !== null || f.plagas !== null || f.fauna !== null).length;


  const setTractorPunto = (i: number, val: SiNoVal) =>
    setTractorPuntos((p) =>
      p.map((pt, idx) => idx !== i ? pt : { ...pt, value: pt.value === val ? null : val, comentario: pt.value === val ? "" : pt.comentario })
    );

  const setTractorComentario = (i: number, text: string) =>
    setTractorPuntos((p) => p.map((pt, idx) => idx !== i ? pt : { ...pt, comentario: text }));

  const setUnitPunto = (ui: number, pi: number, val: SiNoVal) =>
    setUnitsData((p) =>
      p.map((u, i) =>
        i !== ui ? u : {
          ...u,
          remolque: {
            ...u.remolque,
            puntos: u.remolque.puntos.map((pt, j) =>
              j !== pi ? pt : { ...pt, value: pt.value === val ? null : val, comentario: pt.value === val ? "" : pt.comentario }
            ),
          },
        }
      )
    );

  const setUnitComentario = (ui: number, pi: number, text: string) =>
    setUnitsData((p) =>
      p.map((u, i) =>
        i !== ui ? u : {
          ...u,
          remolque: { ...u.remolque, puntos: u.remolque.puntos.map((pt, j) => j !== pi ? pt : { ...pt, comentario: text }) },
        }
      )
    );

  const setRemolqueMeasure = (ui: number, field: "altura" | "ancho" | "longitud", val: string) =>
    setUnitsData((p) => p.map((u, i) => i !== ui ? u : { ...u, remolque: { ...u.remolque, [field]: val } }));

  const cycleCelda = (v: FilaCelda): FilaCelda => (v === null ? "sí" : v === "sí" ? "no" : null);
  const setFilaVal = (ui: number, fi: number, opcion: FilaOpcion) =>
    setUnitsData((p) =>
      p.map((u, i) => {
        if (i !== ui || !u.contenedor) return u;
        return {
          ...u,
          contenedor: {
            ...u.contenedor,
            filas: u.contenedor.filas.map((f, j) => {
              if (j !== fi) return f;
              if (opcion === "todos") {
                const allSi = f.suciedad === "sí" && f.plagas === "sí" && f.fauna === "sí";
                const next: FilaCelda = allSi ? null : "sí";
                return { suciedad: next, plagas: next, fauna: next };
              }
              return { ...f, [opcion]: cycleCelda(f[opcion]) };
            }),
          },
        };
      })
    );

  const setContenedorMeasure = (ui: number, field: "altura" | "ancho" | "longitud", val: string) =>
    setUnitsData((p) =>
      p.map((u, i) => {
        if (i !== ui || !u.contenedor) return u;
        return { ...u, contenedor: { ...u.contenedor, [field]: val } };
      })
    );

  const [saving, setSaving] = useState(false);

  const buildPayload = () => {
    const inspecciones: unknown[] = [];

    // Tractor
    inspecciones.push({
      tipo: "tractor",
      evidencias: tractorEvidencia,
      puntos: PUNTOS_TRACTOR.map((descripcion, i) => ({
        numero: i + 1,
        descripcion,
        resultado: tractorPuntos[i].value,
        comentario: tractorPuntos[i].comentario,
        fotos: tractorPuntos[i].fotos,
      })),
    });

    // Unidades
    unidades.forEach((u, i) => {
      const d = unitsData[i];
      if (!d) return;

      // Remolque
      inspecciones.push({
        tipo: "remolque",
        unidad: i + 1,
        evidencias: d.remolque.evidencia,
        medidas: {
          altura: d.remolque.altura,
          ancho: d.remolque.ancho,
          longitud: d.remolque.longitud,
        },
        puntos: PUNTOS_REMOLQUE.map((descripcion, pi) => ({
          numero: pi + 1,
          descripcion,
          resultado: d.remolque.puntos[pi].value,
          comentario: d.remolque.puntos[pi].comentario,
          fotos: d.remolque.puntos[pi].fotos,
        })),
      });

      // Contenedor (solo si aplica)
      if (u.config === "remolque_contenedor" && d.contenedor) {
        const sec = d.contenedor;
        inspecciones.push({
          tipo: "contenedor",
          unidad: i + 1,
          evidencias: sec.evidencia,
          medidas: {
            altura: sec.altura,
            ancho: sec.ancho,
            longitud: sec.longitud,
          },
          filas: FILAS_CONTENEDOR.map((punto, fi) => {
            const f = sec.filas[fi];
            return {
              punto,
              valores: (["suciedad", "plagas", "fauna"] as const).filter((col) => f[col] === "sí"),
            };
          }),
        });
      }
    });

    return inspecciones;
  };

  const handleGuardar = async () => {
    setSaving(true);
    try {
      await saveInspeccionesTransportista(recordId, buildPayload());
      toast.success("Inspección guardada");
      onClose();
    } catch {
      toast.error("Error al guardar la inspección");
    } finally {
      setSaving(false);
    }
  };

  // Upload target keys:
  //   "ev:tractor"         → evidencia de sección tractor
  //   "ev:remolque:N"      → evidencia de sección remolque unidad N
  //   "ev:contenedor:N"    → evidencia de sección contenedor unidad N
  //   "pt:tractor:I"       → foto del punto I de tractor
  //   "pt:remolque:N:I"    → foto del punto I del remolque de unidad N

  const triggerUpload = (key: string) => {
    pendingSectionRef.current = key;
    fileInputRef.current?.click();
  };

  const addImg = (key: string, img: EvidenciaImg) => {
    const parts = key.split(":");
    if (parts[0] === "ev") {
      const [, kind, uiStr] = parts;
      if (kind === "tractor") {
        setTractorEvidencia((p) => [...p, img]);
      } else if (kind === "remolque") {
        const ui = parseInt(uiStr);
        setUnitsData((p) => p.map((u, i) => i !== ui ? u : { ...u, remolque: { ...u.remolque, evidencia: [...u.remolque.evidencia, img] } }));
      } else {
        const ui = parseInt(uiStr);
        setUnitsData((p) => p.map((u, i) => {
          if (i !== ui || !u.contenedor) return u;
          return { ...u, contenedor: { ...u.contenedor, evidencia: [...u.contenedor.evidencia, img] } };
        }));
      }
    } else {
      const [, kind, ...rest] = parts;
      if (kind === "tractor") {
        const pi = parseInt(rest[0]);
        setTractorPuntos((p) => p.map((pt, i) => i !== pi ? pt : { ...pt, fotos: [...pt.fotos, img] }));
      } else {
        const ui = parseInt(rest[0]);
        const pi = parseInt(rest[1]);
        setUnitsData((p) => p.map((u, i) =>
          i !== ui ? u : { ...u, remolque: { ...u.remolque, puntos: u.remolque.puntos.map((pt, j) => j !== pi ? pt : { ...pt, fotos: [...pt.fotos, img] }) } }
        ));
      }
    }
  };

  const removeImg = (key: string, imgIdx: number) => {
    const parts = key.split(":");
    if (parts[0] === "ev") {
      const [, kind, uiStr] = parts;
      if (kind === "tractor") {
        setTractorEvidencia((p) => p.filter((_, i) => i !== imgIdx));
      } else if (kind === "remolque") {
        const ui = parseInt(uiStr);
        setUnitsData((p) => p.map((u, i) => i !== ui ? u : { ...u, remolque: { ...u.remolque, evidencia: u.remolque.evidencia.filter((_, j) => j !== imgIdx) } }));
      } else {
        const ui = parseInt(uiStr);
        setUnitsData((p) => p.map((u, i) => {
          if (i !== ui || !u.contenedor) return u;
          return { ...u, contenedor: { ...u.contenedor, evidencia: u.contenedor.evidencia.filter((_, j) => j !== imgIdx) } };
        }));
      }
    } else {
      const [, kind, ...rest] = parts;
      if (kind === "tractor") {
        const pi = parseInt(rest[0]);
        setTractorPuntos((p) => p.map((pt, i) => i !== pi ? pt : { ...pt, fotos: pt.fotos.filter((_, j) => j !== imgIdx) }));
      } else {
        const ui = parseInt(rest[0]);
        const pi = parseInt(rest[1]);
        setUnitsData((p) => p.map((u, i) =>
          i !== ui ? u : { ...u, remolque: { ...u.remolque, puntos: u.remolque.puntos.map((pt, j) => j !== pi ? pt : { ...pt, fotos: pt.fotos.filter((_, k) => k !== imgIdx) }) } }
        ));
      }
    }
  };

  const handleEvidenciaFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const key = pendingSectionRef.current;
    e.target.value = "";
    if (!file || !key) return;
    setUploadingSection(key);
    try {
      const res = await uploadImage(file);
      if (res?.file) addImg(key, { file_url: res.file, file_name: res.file_name });
    } finally {
      setUploadingSection(null);
      pendingSectionRef.current = null;
    }
  };

  const Spinner = ({ className }: { className?: string }) => (
    <svg className={cn("animate-spin", className)} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
    </svg>
  );

  const renderEvidence = (sectionLabel: string, evKey: string, evidencias: EvidenciaImg[]) => {
    const loading = uploadingSection === evKey;
    return (
      <div className="bg-blue-50/60 rounded-xl p-3 space-y-2">
        <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1">
          <Camera className="w-3 h-3" /> {sectionLabel}
        </p>
        <div className="flex gap-2 flex-wrap">
          {evidencias.map((img, i) => (
            <div key={i} className="relative w-14 h-14 rounded-lg overflow-hidden border border-blue-100 shrink-0">
              <img src={img.file_url} className="w-full h-full object-cover" alt="" />
              <button
                type="button"
                onClick={() => removeImg(evKey, i)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow"
              >
                <X className="w-2.5 h-2.5 text-white" />
              </button>
            </div>
          ))}
          {loading ? (
            <div className="w-14 h-14 rounded-xl bg-blue-100/60 flex items-center justify-center border-2 border-blue-200 shrink-0">
              <Spinner className="w-5 h-5 text-blue-400" />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => triggerUpload(evKey)}
              className="w-14 h-14 rounded-xl border-2 border-dashed border-blue-200 hover:border-blue-400 hover:bg-blue-50 flex items-center justify-center transition-colors shrink-0"
            >
              <Camera className="w-5 h-5 text-blue-300" />
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderSiNoRow = (
    label: string,
    idx: number,
    punto: PuntoInsp,
    onSet: (v: SiNoVal) => void,
    onComentario: (text: string) => void,
    ptKey: string,
  ) => {
    const uploadingFoto = uploadingSection === ptKey;
    return (
      <div key={idx} className="border-b border-gray-50 last:border-0">
        <div className="flex items-center gap-2 py-2.5">
          <span className="text-[11px] text-gray-400 w-5 text-right shrink-0">{idx + 1}.</span>
          <span className="text-xs text-gray-700 flex-1 leading-snug">{label}</span>
          <HelpCircle className="w-3.5 h-3.5 text-gray-200 shrink-0" />
          <button
            type="button"
            onClick={() => onSet("sí")}
            className={cn(
              "h-7 w-9 rounded-full text-[11px] font-bold transition-colors shrink-0",
              punto.value === "sí" ? "bg-blue-600 text-white" : "border border-gray-200 text-gray-400 hover:border-blue-300"
            )}
          >
            Sí
          </button>
          <button
            type="button"
            onClick={() => onSet("no")}
            className={cn(
              "h-7 w-9 rounded-full text-[11px] font-bold transition-colors shrink-0",
              punto.value === "no" ? "bg-red-500 text-white border-red-500" : "border border-gray-200 text-gray-400 hover:border-red-300"
            )}
          >
            No
          </button>
          <button
            type="button"
            onClick={() => triggerUpload(ptKey)}
            disabled={uploadingFoto}
            className={cn(
              "relative w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 transition-colors",
              punto.fotos.length > 0
                ? "border-blue-400 bg-blue-50 text-blue-500"
                : "border-gray-200 hover:border-blue-300 text-gray-300"
            )}
          >
            {uploadingFoto
              ? <Spinner className="w-3.5 h-3.5 text-blue-400" />
              : <Camera className="w-3.5 h-3.5" />
            }
            {punto.fotos.length > 0 && !uploadingFoto && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                {punto.fotos.length}
              </span>
            )}
          </button>
        </div>
        {punto.fotos.length > 0 && (
          <div className="pb-2.5 pl-6 flex gap-2 flex-wrap">
            {punto.fotos.map((img, fi) => (
              <div key={fi} className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                <img src={img.file_url} className="w-full h-full object-cover" alt="" />
                <button
                  type="button"
                  onClick={() => removeImg(ptKey, fi)}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center shadow"
                >
                  <X className="w-2.5 h-2.5 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
        {punto.value === "no" && (
          <div className="pb-2.5 pl-6">
            <textarea
              rows={2}
              placeholder="Añadir comentario u observación…"
              value={punto.comentario}
              onChange={(e) => onComentario(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-700 placeholder-gray-300 focus:outline-none focus:border-red-300 resize-none"
            />
          </div>
        )}
      </div>
    );
  };

  const renderDoneBanner = (tipo: string, unidad?: number) => {
    const key = buildTipoKey(tipo, unidad);
    const rec = inspeccionesDone.find((i) => i.tipo === key);
    if (!rec) return null;
    return (
      <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-green-700">Inspección ya realizada</p>
          <p className="text-[11px] text-green-600">Esta sección fue inspeccionada anteriormente.</p>
        </div>
        {rec.url && (
          <a
            href={rec.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-semibold text-green-700 hover:text-green-800 underline shrink-0"
          >
            Ver registro
          </a>
        )}
      </div>
    );
  };

  const renderTractorTab = () => {
    const done = isDone("tractor");
    return (
      <div className="p-5 space-y-4">
        {renderDoneBanner("tractor")}
        {!done && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                Inspección de {PUNTOS_TRACTOR.length} puntos
                <HelpCircle className="w-3.5 h-3.5 text-gray-300" />
              </span>
              <span className="text-[11px] font-bold text-orange-500 bg-orange-50 px-2.5 py-0.5 rounded-full">
                {tractorEval} / {PUNTOS_TRACTOR.length} evaluados
              </span>
            </div>
            {renderEvidence("EVIDENCIA DEL VEHÍCULO · ENTRADA", "ev:tractor", tractorEvidencia)}
            <div>
              {PUNTOS_TRACTOR.map((label, i) =>
                renderSiNoRow(label, i, tractorPuntos[i], (val) => setTractorPunto(i, val), (text) => setTractorComentario(i, text), `pt:tractor:${i}`)
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  const renderMeasures = (
    section: RemolqueInspSection | ContenedorInspSection,
    onMeasure: (field: "altura" | "ancho" | "longitud", val: string) => void,
  ) => (
    <div className="grid grid-cols-3 gap-3">
      {(["altura", "ancho", "longitud"] as const).map((field) => (
        <div key={field}>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">
            {field === "altura" ? "Altura Interior" : field === "ancho" ? "Ancho Interior" : "Longitud Interior"}
          </p>
          <input
            className="w-full h-8 rounded-lg border border-gray-200 px-2.5 text-xs focus:outline-none focus:border-blue-400"
            placeholder={field === "longitud" ? "ej. 16.1m" : "ej. 2.4m"}
            value={section[field]}
            onChange={(e) => onMeasure(field, e.target.value)}
          />
        </div>
      ))}
    </div>
  );

  const renderRemolqueTab = (unitIdx: number) => {
    const d = unitsData[unitIdx];
    if (!d) return null;
    const sec = d.remolque;
    const eval_ = remolqueEval(d);
    const done = isDone("remolque", unitIdx + 1);
    return (
      <div className="p-5 space-y-4">
        {renderDoneBanner("remolque", unitIdx + 1)}
        {!done && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                Unidad {unitIdx + 1} · Remolque
                <HelpCircle className="w-3.5 h-3.5 text-gray-300" />
              </span>
              <span className="text-[11px] font-bold text-orange-500 bg-orange-50 px-2.5 py-0.5 rounded-full">
                {eval_} / {PUNTOS_REMOLQUE.length} evaluados
              </span>
            </div>
            {renderEvidence("EVIDENCIA DEL REMOLQUE · ENTRADA", `ev:remolque:${unitIdx}`, sec.evidencia)}
            {renderMeasures(sec, (field, val) => setRemolqueMeasure(unitIdx, field, val))}
            <div>
              {PUNTOS_REMOLQUE.map((label, i) =>
                renderSiNoRow(label, i, sec.puntos[i], (val) => setUnitPunto(unitIdx, i, val), (text) => setUnitComentario(unitIdx, i, text), `pt:remolque:${unitIdx}:${i}`)
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  const renderContenedorTab = (unitIdx: number) => {
    const d = unitsData[unitIdx];
    const sec = d?.contenedor;
    if (!sec) return null;
    const eval_ = contenedorEval(d);
    const done = isDone("contenedor", unitIdx + 1);
    return (
      <div className="p-5 space-y-4">
        {renderDoneBanner("contenedor", unitIdx + 1)}
        {!done && <>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
            Unidad {unitIdx + 1} · Contenedor
            <HelpCircle className="w-3.5 h-3.5 text-gray-300" />
          </span>
          <span className="text-[11px] font-bold text-orange-500 bg-orange-50 px-2.5 py-0.5 rounded-full">
            {eval_} / {FILAS_CONTENEDOR.length} evaluados
          </span>
        </div>
        {renderEvidence("EVIDENCIA DEL CONTENEDOR · ENTRADA", `ev:contenedor:${unitIdx}`, sec.evidencia)}
        {renderMeasures(sec, (field, val) => setContenedorMeasure(unitIdx, field, val))}
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <th className="text-[9px] font-bold text-gray-400 uppercase tracking-widest text-left pb-2 pr-3">
                  Punto de inspección
                </th>
                {["Todos", "Suciedad", "Plagas", "Fauna"].map((h) => (
                  <th key={h} className="text-[9px] font-bold text-gray-400 uppercase tracking-widest pb-2 px-1.5 text-center w-14">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sec.filas.map((fila, fi) => {
                const allSi = fila.suciedad === "sí" && fila.plagas === "sí" && fila.fauna === "sí";
                const anyEval = fila.suciedad !== null || fila.plagas !== null || fila.fauna !== null;
                const hasNo = fila.suciedad === "no" || fila.plagas === "no" || fila.fauna === "no";
                return (
                  <tr key={fi} className={cn("border-t border-gray-50", hasNo && "bg-red-50/30", !hasNo && anyEval && "bg-green-50/30")}>
                    <td className="py-2 pr-3 text-xs text-gray-700 leading-snug">{FILAS_CONTENEDOR[fi]}</td>
                    <td className="py-2 px-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => setFilaVal(unitIdx, fi, "todos")}
                        className={cn(
                          "w-5 h-5 rounded border-2 flex items-center justify-center mx-auto transition-colors",
                          allSi ? "bg-green-500 border-green-500" : "border-gray-200 hover:border-green-400"
                        )}
                      >
                        {allSi && <Check className="w-3 h-3 text-white" />}
                      </button>
                    </td>
                    {(["suciedad", "plagas", "fauna"] as const).map((col) => {
                      const v = fila[col];
                      return (
                        <td key={col} className="py-2 px-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => setFilaVal(unitIdx, fi, col)}
                            className={cn(
                              "w-5 h-5 rounded border-2 flex items-center justify-center mx-auto transition-colors",
                              v === "sí" ? "bg-green-500 border-green-500" :
                              v === "no" ? "bg-red-500 border-red-500" :
                              "border-gray-200 hover:border-gray-400"
                            )}
                          >
                            {v === "sí" && <Check className="w-3 h-3 text-white" />}
                            {v === "no" && <X className="w-3 h-3 text-white" />}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </>}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <ClipboardCheck className="w-4.5 h-4.5 text-blue-600" />
          </div>
          <p className="text-sm font-bold text-gray-800 flex-1">Inspección De Entrada</p>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        {/* Tabs con scroll por flechas */}
        <div className="relative border-b border-gray-100 shrink-0">
          {canScrollLeft && (
            <>
              <div className="absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
              <button type="button" onClick={() => scrollTabs("left")}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
            </>
          )}
          {canScrollRight && (
            <>
              <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
              <button type="button" onClick={() => scrollTabs("right")}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
          <div
            ref={tabsScrollRef}
            onScroll={checkTabsScroll}
            className="flex overflow-x-auto px-5 gap-0"
            style={{ scrollbarWidth: "none" }}
          >
            {inspTabs.map((tab, i) => {
              const label = tab.kind === "tractor" ? "Tractor / Cabezal" : tab.label;
              const done = tab.kind === "tractor"
                ? isDone("tractor")
                : tab.kind === "remolque"
                ? isDone("remolque", tab.unitIdx + 1)
                : isDone("contenedor", tab.unitIdx + 1);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => { setActiveTab(i); setTimeout(checkTabsScroll, 50); }}
                  className={cn(
                    "py-2.5 px-1 mr-5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5",
                    activeTab === i
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-400 hover:text-gray-600"
                  )}
                >
                  {label}
                  {done && <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {(() => {
            const tab = inspTabs[activeTab];
            if (!tab) return null;
            if (tab.kind === "tractor") return renderTractorTab();
            if (tab.kind === "remolque") return renderRemolqueTab(tab.unitIdx);
            return renderContenedorTab(tab.unitIdx);
          })()}
        </div>

        {/* Hidden file input for evidence uploads */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          className="hidden"
          onChange={handleEvidenciaFileChange}
        />

        {/* Footer */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50/60 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleGuardar}
            disabled={saving}
            className="flex-1 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {saving && (
              <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
              </svg>
            )}
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({
  entradaDone,
  cargaDone,
  salidaDone,
}: {
  entradaDone: boolean;
  cargaDone: boolean;
  salidaDone: boolean;
}) {
  const BLUE = "#2F80ED";
  const AMBER = "#F5A623";
  const GRAY = "#E2E8F0";

  const defs = [
    { label: "Arribo", done: true },
    { label: "Insp. entrada", done: entradaDone },
    { label: "Carga / Descarga", done: cargaDone },
    { label: "Insp. salida", done: salidaDone },
    { label: "Terminado", done: false },
  ];
  const activeIdx = defs.findIndex((d) => !d.done);

  const NODE_SIZE = 28;

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="flex items-start">
        {defs.map((d, i) => {
          const isActive = i === activeIdx;
          const connColor =
            i === 0
              ? ""
              : defs[i - 1].done && d.done
                ? BLUE
                : defs[i - 1].done && isActive
                  ? AMBER
                  : GRAY;
          const labelColor = d.done ? BLUE : isActive ? AMBER : GRAY;
          return (
            <React.Fragment key={i}>
              {i > 0 && (
                <div
                  style={{
                    background: connColor,
                    height: "3px",
                    borderRadius: "3px",
                    marginTop: NODE_SIZE / 2 - 1.5,
                  }}
                  className="flex-1"
                />
              )}
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                {/* fixed-size wrapper so all nodes have the same height for connector alignment */}
                <div style={{ width: NODE_SIZE, height: NODE_SIZE, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {d.done ? (
                    <div
                      style={{
                        width: NODE_SIZE, height: NODE_SIZE, borderRadius: "50%",
                        background: BLUE, display: "flex",
                        alignItems: "center", justifyContent: "center",
                        boxShadow: "0 3px 8px -2px rgba(47,128,237,.5)",
                      }}>
                      <CheckCircle2 style={{ width: 15, height: 15, color: "#fff" }} />
                    </div>
                  ) : isActive ? (
                    <div
                      style={{
                        width: NODE_SIZE, height: NODE_SIZE, borderRadius: "50%",
                        background: "#fff", border: `3px solid ${AMBER}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: `0 0 0 5px rgba(245,166,35,.18)`,
                      }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: AMBER }} />
                    </div>
                  ) : (
                    <div
                      style={{
                        width: 16, height: 16, borderRadius: "50%",
                        background: "#fff", border: `2px solid ${GRAY}`,
                      }}
                    />
                  )}
                </div>
                <span style={{ color: labelColor }} className="text-[10px] font-bold leading-none whitespace-nowrap">
                  {d.label}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse bg-gray-100 rounded-lg", className)} />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DetalleTransportistaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading, error, refetch } = useGetVisitTransportista(id);
  const queryClient = useQueryClient();

  const unidadesInitialized = useRef(false);

  useEffect(() => {
    if (!data || unidadesInitialized.current) return;
    if (!data.remolques.length) return;
    unidadesInitialized.current = true;

    type RV = import("@/hooks/useGetVisitTransportista").RemolqueVisita;
    type MV = import("@/hooks/useGetVisitTransportista").MaterialVisita;

    const toMaterial = (m: MV, matIdx: number): MaterialCarga => ({
      id:           Math.random().toString(36).slice(2),
      apiIndex:     matIdx,
      producto:     m.producto        ?? "",
      lote:         m.lote            ?? "",
      cantEsperada: m.cantidad        ?? "",
      cantFisica:   m.cantidad_fisica ?? "",
      peso:         m.peso            ?? "",
      volumen:      m.volumen         ?? "",
    });

    // El array completo representa el grupo combinado — la posición de cada item ES su índice real
    const allRaw = data.remolques;
    const baseRemolques = allRaw.filter((r) => !r.no_referencia_remolque);
    const rawContenedores = allRaw.filter((r) => !!r.no_referencia_remolque);

    let contenedorSeq = 0;

    const mapped: UnidadItem[] = baseRemolques.map((r: RV, baseIdx) => {
      const remolqueRef  = `remolque_${baseIdx + 1}`;
      const rawCont = rawContenedores.find((c) => c.no_referencia_remolque === remolqueRef) ?? null;

      // Índice real = posición en el array combinado completo
      const remolqueGlobalIdx   = allRaw.indexOf(r);
      const contenedorGlobalIdx = rawCont ? allRaw.indexOf(rawCont) : null;

      const currentContenedorSeq = rawCont ? ++contenedorSeq : 0;
      const contenedorRef = rawCont ? `contenedor_${currentContenedorSeq}` : "";

      const remMats = (data.materiales ?? [])
        .map((m, i) => ({ m, i }))
        .filter(({ m }) => m.no_referencia === remolqueRef)
        .map(({ m, i }) => toMaterial(m, i));

      const conMats = rawCont
        ? (data.materiales ?? [])
            .map((m, i) => ({ m, i }))
            .filter(({ m }) => m.no_referencia === contenedorRef)
            .map(({ m, i }) => toMaterial(m, i))
        : [];

      const config: UnidadConfig = rawCont ? "remolque_contenedor" : "solo_remolque";

      return {
        id: Math.random().toString(36).slice(2),
        config,
        remolqueApiIndex:   remolqueGlobalIdx,
        contenedorApiIndex: contenedorGlobalIdx,
        remolque: {
          tipo:        r.tipo_remolque ?? "",
          noSello:     r.no_sello      ?? "",
          noCaja:      r.no_caja       ?? "",
          placas:      r.placas_caja   ?? "",
          color:       r.color         ?? "",
          comentarios: r.comentarios   ?? "",
          materiales:  remMats.length ? remMats : [emptyMaterial()],
        },
        contenedor: rawCont ? {
          tipo:          rawCont.tipo_remolque ?? "",
          noSello:       rawCont.no_sello      ?? "",
          noContenedor:  "",
          noCaja:        rawCont.no_caja       ?? "",
          color:         rawCont.color         ?? "",
          comentarios:   rawCont.comentarios   ?? "",
          materiales:    conMats.length ? conMats : [emptyMaterial()],
        } : emptyContenedorData(),
      };
    });

    setUnidades(mapped);
    setExpandedUnits(new Set(mapped.map((u) => u.id)));
  }, [data]);

  const [unidades, setUnidades] = useState<UnidadItem[]>([]);
  const [showAgregarUnidad, setShowAgregarUnidad] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnidadItem | null>(null);
  const [showInspeccion, setShowInspeccion] = useState(false);
  const [vehicleExpanded, setVehicleExpanded] = useState(true);
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());

  // Vehicle inline edit
  const [vehicleEditMode, setVehicleEditMode] = useState(false);
  const [vehicleDraft, setVehicleDraft] = useState({
    tipo_vehiculo: "", placa: "", no_economico: "", marca: "", modelo: "", color: "",
  });

  const startVehicleEdit = () => {
    setVehicleDraft({
      tipo_vehiculo: data?.vehiculo?.tipo_vehiculo ?? "",
      placa: data?.vehiculo?.placa ?? "",
      no_economico: data?.vehiculo?.no_economico ?? "",
      marca: data?.vehiculo?.marca ?? "",
      modelo: data?.vehiculo?.modelo ?? "",
      color: data?.vehiculo?.color ?? "",
    });
    setVehicleEditMode(true);
    setVehicleExpanded(true);
  };

  const cancelVehicleEdit = () => setVehicleEditMode(false);

  const [savingVehicle, setSavingVehicle] = useState(false);

  // Material Carga / Descarga edit
  const [materialEditMode, setMaterialEditMode] = useState(false);
  const [materialDraft, setMaterialDraft] = useState({ proveedor_cliente: "", no_orden_compra: "", procedencia: "" });
  const [savingMaterial, setSavingMaterial] = useState(false);

  const startMaterialEdit = () => {
    setMaterialDraft({
      proveedor_cliente: data?.embarque?.proveedor_cliente ?? "",
      no_orden_compra:   data?.embarque?.no_orden_compra   ?? "",
      procedencia:       data?.vehiculo?.procedencia       ?? "",
    });
    setMaterialEditMode(true);
  };

  const cancelMaterialEdit = () => setMaterialEditMode(false);

  const saveMaterial = async () => {
    setSavingMaterial(true);
    try {
      await saveBitacoraTransportistaRecord(id, "embarque", {
        embarque: {
          proveedor_cliente: materialDraft.proveedor_cliente,
          no_orden_compra:   materialDraft.no_orden_compra,
          procedencia:       materialDraft.procedencia,
        },
      });
      queryClient.setQueryData(["visitaTransportista", id], (old: import("@/hooks/useGetVisitTransportista").VisitaTransportista | null) => {
        if (!old) return old;
        return {
          ...old,
          embarque: { proveedor_cliente: materialDraft.proveedor_cliente, no_orden_compra: materialDraft.no_orden_compra },
          vehiculo: old.vehiculo ? { ...old.vehiculo, procedencia: materialDraft.procedencia } : old.vehiculo,
        };
      });
      setMaterialEditMode(false);
      refetch();
    } catch (err) {
      console.error("[saveMaterial]", err);
    } finally {
      setSavingMaterial(false);
    }
  };

  const saveVehicle = async () => {
    setSavingVehicle(true);
    try {
      await saveBitacoraTransportistaRecord(id, "vehiculo", {
        vehiculo: {
          tipo_de_vehiculo:   vehicleDraft.tipo_vehiculo,
          placas_de_vehiculo: vehicleDraft.placa,
          num_eco_num_rotulo: vehicleDraft.no_economico,
          marca:  vehicleDraft.marca,
          modelo: vehicleDraft.modelo,
          color:  vehicleDraft.color,
        },
      });
      // Optimistic: actualizar cache inmediatamente
      queryClient.setQueryData(["visitaTransportista", id], (old: import("@/hooks/useGetVisitTransportista").VisitaTransportista | null) => {
        if (!old) return old;
        return {
          ...old,
          vehiculo: {
            ...old.vehiculo,
            tipo_vehiculo: vehicleDraft.tipo_vehiculo,
            placa:         vehicleDraft.placa,
            no_economico:  vehicleDraft.no_economico,
            marca:         vehicleDraft.marca,
            modelo:        vehicleDraft.modelo,
            color:         vehicleDraft.color,
          },
        };
      });
      setVehicleEditMode(false);
      refetch(); // confirma con el servidor en background
    } catch (err) {
      console.error("[saveVehicle]", err);
    } finally {
      setSavingVehicle(false);
    }
  };

  const [savingUnidades, setSavingUnidades] = useState(false);

  const serializeMaterial = (m: MaterialCarga) => ({
    producto:      m.producto,
    lote:          m.lote,
    cant_esperada: m.cantEsperada,
    cant_fisica:   m.cantFisica,
    peso:          m.peso,
    volumen:       m.volumen,
  });

  const serializeUnidades = (list: UnidadItem[]) => {
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

  interface Deletions {
    delete_remolques:    number[];
    delete_contenedores: number[];
    delete_materiales:   number[];
  }

  const emptyDeletions = (): Deletions => ({
    delete_remolques: [], delete_contenedores: [], delete_materiales: [],
  });

  const deletionsFromUnit = (u: UnidadItem): Deletions => {
    const mats = u.config === "remolque_contenedor" ? u.contenedor.materiales : u.remolque.materiales;
    return {
      delete_remolques:    u.remolqueApiIndex   !== null ? [u.remolqueApiIndex]   : [],
      delete_contenedores: u.config === "remolque_contenedor" && u.contenedorApiIndex !== null
        ? [u.contenedorApiIndex] : [],
      delete_materiales:   mats.filter((m) => m.apiIndex !== null).map((m) => m.apiIndex as number),
    };
  };

  const deletionsFromMaterialDiff = (oldUnit: UnidadItem, updated: UnidadItem): Deletions => {
    const oldMats = oldUnit.config === "remolque_contenedor" ? oldUnit.contenedor.materiales : oldUnit.remolque.materiales;
    const newMats = updated.config === "remolque_contenedor" ? updated.contenedor.materiales : updated.remolque.materiales;
    const kept = new Set(newMats.map((m) => m.id));
    return {
      ...emptyDeletions(),
      delete_materiales: oldMats.filter((m) => !kept.has(m.id) && m.apiIndex !== null).map((m) => m.apiIndex as number),
    };
  };

  const persistUnidades = async (list: UnidadItem[], deletions: Deletions = emptyDeletions()) => {
    setSavingUnidades(true);
    try {
      const payload = {
        ...serializeUnidades(list),
        ...(deletions.delete_remolques.length    && { delete_remolques:    deletions.delete_remolques }),
        ...(deletions.delete_contenedores.length && { delete_contenedores: deletions.delete_contenedores }),
        ...(deletions.delete_materiales.length   && { delete_materiales:   deletions.delete_materiales }),
      };
      await saveBitacoraTransportistaRecord(id, "remolques", payload);
      // Resetear para que el useEffect re-inicialice unidades con los índices reales del servidor
      unidadesInitialized.current = false;
      refetch();
    } catch (err) {
      console.error("[saveUnidades]", err);
    } finally {
      setSavingUnidades(false);
    }
  };

  const toggleUnit = (id: string) =>
    setExpandedUnits((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const [docTab, setDocTab] = useState<"pendientes" | "subidos">("pendientes");

  // Etapas — pendiente de conectar con estado real del registro
  const entradaDone = false;
  const cargaDone = false;
  const salidaDone = false;

  // Inspecciones — valores estructurales (no vienen del API aún)
  const inspecciones = {
    entrada: { completados: 0, total: 17 },
    salida: { completados: 0, total: 17 },
    sello: { completados: 0, total: 4 },
  };

  const documentos: {
    id: number;
    nombre: string;
    type: string;
    status: string;
    sub: string;
  }[] = [];
  const docsPendientes = documentos.filter((x) => x.status !== "validado");
  const docsCargados = documentos.filter((x) => x.status === "validado");
  const docsVisible = docTab === "pendientes" ? docsPendientes : docsCargados;

  const tipo_accion = data?.tipo_operacion?.toLowerCase().includes("entrega")
    ? "ENTRADA"
    : data?.tipo_operacion?.toLowerCase().includes("recolec")
      ? "SALIDA"
      : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Sticky top bar ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm">
        <div className="px-4">
          {/* Row 1: breadcrumb + back button */}
          <div className="flex items-center gap-1 py-2 text-[11px] text-gray-400">
            <span className="hover:text-gray-600 cursor-pointer">Accesos</span>
            <ChevronRight className="w-3 h-3" />
            <span className="hover:text-gray-600 cursor-pointer">Transportistas</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-700 font-semibold">Detalle del pase</span>
            <div className="flex-1" />
            <button
              onClick={() => router.back()}
              className="h-7 px-3 text-[11px] font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5 text-gray-600 shrink-0">
              <ArrowLeft className="w-3 h-3" />
              Volver al control
            </button>
          </div>

          {/* Row 3: progress */}
          <div className="pb-4 pt-0.5">
            <ProgressBar
              entradaDone={entradaDone}
              cargaDone={cargaDone}
              salidaDone={salidaDone}
            />
          </div>
        </div>
      </div>

      {/* ── Error ──────────────────────────────────────────────────────────── */}
      {error && !isLoading && (
        <div className="px-4 py-6 flex items-center justify-center">
          <div className="bg-red-50 border border-red-200 rounded-xl px-6 py-4 text-sm text-red-600">
            No se pudo cargar la información del pase. Intenta de nuevo.
          </div>
        </div>
      )}

      {/* ── 3-column body ──────────────────────────────────────────────────── */}
      <div className="px-4 py-4 grid grid-cols-[22rem_1fr_22rem] gap-4 items-start">
        {/* ── LEFT SIDEBAR ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Folio header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            {isLoading ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              <span className="text-sm text-gray-600">
                Folio:{" "}
                <span
                  className={cn(
                    "font-bold",
                    data?.folio
                      ? "text-gray-800"
                      : "text-gray-300 italic font-normal text-xs",
                  )}>
                  {data?.folio ?? "Sin asignar"}
                </span>
              </span>
            )}
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full",
                tipo_accion
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-gray-100 text-gray-400",
              )}>
              <LogIn className="w-3 h-3" />
              {tipo_accion ?? "—"}
            </span>
          </div>

          {/* Photos + identity */}
          <div className="px-4 pt-4 pb-3 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {/* Foto conductor — desde documentos_adicionales tipo foto_conductor */}
              {(() => {
                const url = data?.conductor?.foto_conductor?.file_url
                  ?? data?.documentos_adicionales?.find((d) => d.tipo === "foto_conductor")?.file_url;
                return (
                  <div className="h-24 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden flex flex-col items-center justify-center gap-1.5">
                    {url ? (
                      <img src={url} alt="Conductor" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Camera className="w-5 h-5 text-gray-300" />
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">FOTO</span>
                      </>
                    )}
                  </div>
                );
              })()}
              {/* Foto licencia — desde documentos_adicionales tipo licencia_conducir */}
              {(() => {
                const url = data?.conductor?.foto_licencia?.file_url
                  ?? data?.documentos_adicionales?.find((d) => d.tipo === "licencia_conducir")?.file_url;
                return (
                  <div className="h-24 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden flex flex-col items-center justify-center gap-1.5">
                    {url ? (
                      <img src={url} alt="Licencia" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <FileText className="w-5 h-5 text-gray-300" />
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">IDENTIFICACIÓN</span>
                      </>
                    )}
                  </div>
                );
              })()}
            </div>
            <div className="text-center">
              {isLoading ? (
                <Skeleton className="h-4 w-40 mx-auto" />
              ) : (
                <p
                  className={cn(
                    "text-sm font-bold",
                    data?.conductor?.nombre
                      ? "text-gray-800"
                      : "text-gray-300 italic font-normal text-xs",
                  )}>
                  {data?.conductor?.nombre ?? "Sin información"}
                </p>
              )}
              <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                <Truck className="w-2.5 h-2.5" />
                Transportista
              </span>
            </div>
          </div>

          {/* Driver fields */}
          <div className="px-4 pb-4 pt-2 space-y-2.5 border-t border-gray-50">
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-3/4" />
              </>
            ) : (
              <>
                <Field
                  label="Empresa Transportista"
                  value={data?.vehiculo?.transportista}
                />
                <Field label="Tipo de Operación" value={data?.tipo_operacion} />
                <Field
                  label="No. de Licencia"
                  value={data?.conductor?.no_licencia}
                  mono
                />
                <Field
                  label="Fecha y Hora de Ingreso"
                  value={
                    data?.created_at ? formatTimestamp(data.created_at) : null
                  }
                  icon={Clock}
                />
              </>
            )}
          </div>

          {/* Material / carga */}
          <div className="border-t border-gray-100 px-4 py-3 space-y-2.5">
            <p className="text-xs font-bold text-gray-700">Material / carga</p>
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </>
            ) : (
              <>
                <Field label="Proveedor / Cliente" value={data?.embarque?.proveedor_cliente} />
                <Field label="Orden de Compra" value={data?.embarque?.no_orden_compra} mono />
                <Field label="Procedencia" value={data?.vehiculo?.procedencia} />
                <Field label="Material de Carga / Carga" value={data?.vehiculo?.material} />
              </>
            )}
          </div>

          {/* Lugar de entrega */}
          <div className="border-t border-gray-100 px-4 py-3 space-y-2.5">
            <p className="text-xs font-bold text-gray-700">
              Lugar de entrega / recepción
            </p>
            <Field label="Ubicación" value={null} />
            <Field label="Área" value={null} />
            <div>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                Andén
              </p>
              <p className="text-xs text-gray-300 italic">Sin información</p>
            </div>
            <Field label="Fecha y Hora de Descarga" value={null} />
          </div>
        </div>

        {/* ── CENTER ───────────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Documentos */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100">
              <FileText className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-bold text-gray-800 flex-1">
                Documentos
              </span>
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setDocTab("pendientes")}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all",
                    docTab === "pendientes"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700",
                  )}>
                  Pendientes
                  <span
                    className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                      docTab === "pendientes"
                        ? "bg-red-100 text-red-600"
                        : "bg-gray-200 text-gray-400",
                    )}>
                    {docsPendientes.length}
                  </span>
                </button>
                <button
                  onClick={() => setDocTab("subidos")}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all",
                    docTab === "subidos"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700",
                  )}>
                  Subidos
                  <span
                    className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                      docTab === "subidos"
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-gray-200 text-gray-400",
                    )}>
                    {docsCargados.length + (data?.documentos_adicionales?.length ?? 0)}
                  </span>
                </button>
              </div>
            </div>
            <div className="p-4 space-y-2">
              {docsVisible.map((doc) => {
                const meta =
                  DOC_TYPE_META[doc.type as DocType] ?? DOC_TYPE_META.pdf;
                const isPendiente = doc.status !== "validado";
                return (
                  <div
                    key={doc.id}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 border cursor-pointer transition-colors",
                      isPendiente
                        ? "border-red-100 bg-red-50/30 hover:bg-red-50/60"
                        : "border-gray-100 bg-white hover:bg-gray-50",
                    )}>
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-extrabold"
                      style={{ background: meta.bg, color: meta.color }}>
                      {meta.ext}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{doc.nombre}</p>
                      <p className={cn("text-[11px] truncate mt-0.5", isPendiente ? "text-red-500" : "text-emerald-600")}>
                        {doc.sub}
                      </p>
                    </div>
                    {isPendiente ? (
                      <button className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 flex items-center justify-center shrink-0 transition-colors">
                        <Camera className="w-3.5 h-3.5 text-white" />
                      </button>
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    )}
                  </div>
                );
              })}

              {/* Documentos subidos desde el acceso (documentos_adicionales) */}
              {docTab === "subidos" && data?.documentos_adicionales?.map((doc) => {
                const isImg = /\.(jpe?g|png|gif|webp)$/i.test(doc.file_name) || doc.tipo === "foto_conductor" || doc.tipo === "foto_vehiculo" || doc.tipo === "foto_placa";
                const tipoLabel = doc.tipo ? doc.tipo.replace(/_/g, " ").toUpperCase() : doc.file_name;
                return (
                  <a
                    key={doc.file_url}
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 border border-gray-100 bg-white hover:bg-gray-50 cursor-pointer transition-colors">
                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-100 bg-gray-50 shrink-0 flex items-center justify-center">
                      {isImg ? (
                        <img src={doc.file_url} alt={tipoLabel} className="w-full h-full object-cover" />
                      ) : (
                        <FileText className="w-5 h-5 text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-gray-700 truncate">{tipoLabel}</p>
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">{doc.file_name}</p>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  </a>
                );
              })}

              {docsVisible.length === 0 && (docTab !== "subidos" || !data?.documentos_adicionales?.length) && (
                <div className="flex flex-col items-center justify-center py-8 text-gray-300">
                  <FileText className="w-8 h-8 mb-2" />
                  <p className="text-xs">
                    {docTab === "pendientes"
                      ? "No hay documentos pendientes"
                      : "Aún no hay documentos subidos"}
                  </p>
                </div>
              )}
              <button className="w-full h-9 mt-1 rounded-xl border border-dashed border-gray-300 hover:border-blue-300 hover:bg-blue-50/40 text-xs font-medium text-gray-400 hover:text-blue-600 transition-all flex items-center justify-center gap-1.5">
                <Camera className="w-3.5 h-3.5" />
                Tomar foto a otro documento
              </button>
            </div>
          </div>

          {/* Material Carga / Descarga */}
          <div className={cn("bg-white rounded-xl border shadow-sm overflow-hidden", materialEditMode ? "border-orange-300 ring-2 ring-orange-100" : "border-gray-100")}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-bold text-gray-800">Material Carga / Descarga</span>
              </div>
              <div className="flex items-center gap-2">
                {data?.tipo_operacion && (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-600 uppercase tracking-wide">
                    {data.tipo_operacion} de material
                  </span>
                )}
                {!materialEditMode && (
                  <button type="button" onClick={startMaterialEdit}
                    className="w-6 h-6 rounded-md hover:bg-orange-50 flex items-center justify-center text-gray-400 hover:text-orange-500 transition-colors">
                    <Pencil className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
            <div className="p-4 space-y-3">
              {materialEditMode ? (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    {(
                      [
                        { key: "proveedor_cliente", label: "Proveedor / Cliente" },
                        { key: "no_orden_compra",   label: "Orden de Compra",     mono: true },
                        { key: "procedencia",       label: "Procedencia" },
                      ] as { key: keyof typeof materialDraft; label: string; mono?: boolean }[]
                    ).map(({ key, label, mono }) => (
                      <div key={key}>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                        <input
                          className={cn("w-full h-8 rounded-lg border border-gray-200 px-2.5 text-xs focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100", mono && "font-mono")}
                          value={materialDraft[key]}
                          onChange={(e) => setMaterialDraft((p) => ({ ...p, [key]: e.target.value }))}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                    <button type="button" onClick={cancelMaterialEdit}
                      className="h-8 px-3 rounded-lg border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-gray-100 transition-colors">
                      Cancelar
                    </button>
                    <button type="button" onClick={saveMaterial} disabled={savingMaterial}
                      className="h-8 px-4 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors">
                      <Save className="w-3 h-3" /> {savingMaterial ? "Guardando…" : "Guardar cambios"}
                    </button>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Proveedor / Cliente" value={data?.embarque?.proveedor_cliente} />
                  <Field label="Orden de Compra" value={data?.embarque?.no_orden_compra} mono />
                  <Field label="Procedencia" value={data?.vehiculo?.procedencia} />
                </div>
              )}
              {unidades.some((u) => {
                const mats = u.config === "remolque_contenedor" ? u.contenedor.materiales : u.remolque.materiales;
                return mats.some((m) => m.producto);
              }) && (
                <div className="space-y-2 pt-1 border-t border-gray-50">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Material por contenedor</p>
                  {unidades.map((u, idx) => {
                    const mats = u.config === "remolque_contenedor" ? u.contenedor.materiales : u.remolque.materiales;
                    const ref = u.config === "remolque_contenedor" ? u.contenedor.noContenedor : u.remolque.noCaja;
                    const withProduct = mats.filter((m) => m.producto);
                    if (!withProduct.length) return null;
                    return (
                      <div key={u.id} className="flex flex-wrap items-center gap-1.5">
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-violet-600 bg-violet-50 border border-violet-100 rounded-full px-2 py-0.5 shrink-0">
                          <Package className="w-2.5 h-2.5" />
                          Unidad {idx + 1}{ref ? ` · ${ref}` : ""}
                        </span>
                        {withProduct.map((m) => (
                          <span key={m.id} className="flex items-center gap-1 text-[11px] font-medium text-green-700 bg-green-50 border border-green-100 rounded-full px-2 py-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5" /> {m.producto}
                          </span>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Vehículo & Remolques */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100">
              <Truck className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-bold text-gray-800">
                Vehículo &amp; Remolques
              </span>
              <span className="text-[11px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                {unidades.length}
              </span>
            </div>
            <div className="p-4 space-y-5">
              {/* Datos del vehículo */}
              <div className={cn("rounded-xl overflow-hidden border", vehicleEditMode ? "border-indigo-300 ring-2 ring-indigo-100" : "border-indigo-100")}>
                <div className="flex items-center justify-between px-4 py-2.5 bg-indigo-50">
                  <button
                    type="button"
                    onClick={() => !vehicleEditMode && setVehicleExpanded((v) => !v)}
                    className="flex items-center gap-2 flex-1 text-left">
                    <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest">
                      Datos del Vehículo
                    </span>
                    {!vehicleEditMode && (vehicleExpanded
                      ? <ChevronUp className="w-3.5 h-3.5 text-indigo-400" />
                      : <ChevronDown className="w-3.5 h-3.5 text-indigo-400" />)}
                  </button>
                  {!vehicleEditMode && (
                    <button
                      type="button"
                      onClick={startVehicleEdit}
                      className="w-6 h-6 rounded-md hover:bg-indigo-100 flex items-center justify-center text-indigo-400 hover:text-indigo-600 transition-colors">
                      <Pencil className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {(vehicleExpanded || vehicleEditMode) && (
                  <div className="bg-white">
                    {isLoading ? (
                      <div className="px-4 py-3 grid grid-cols-3 gap-4">
                        <Skeleton className="h-8" /><Skeleton className="h-8" /><Skeleton className="h-8" />
                        <Skeleton className="h-8" /><Skeleton className="h-8" /><Skeleton className="h-8" />
                      </div>
                    ) : vehicleEditMode ? (
                      <>
                        <div className="px-4 py-3 grid grid-cols-3 gap-3">
                          {(
                            [
                              { key: "tipo_vehiculo", label: "Tipo de Vehículo" },
                              { key: "placa",         label: "Placas Vehículo",   mono: true },
                              { key: "no_economico",  label: "No. Económico",     mono: true },
                              { key: "marca",         label: "Marca" },
                              { key: "modelo",        label: "Modelo / Año" },
                              { key: "color",         label: "Color" },
                            ] as { key: keyof typeof vehicleDraft; label: string; mono?: boolean }[]
                          ).map(({ key, label, mono }) => (
                            <div key={key}>
                              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                              <input
                                className={cn("w-full h-8 rounded-lg border border-gray-200 px-2.5 text-xs focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100", mono && "font-mono uppercase")}
                                value={vehicleDraft[key]}
                                onChange={(e) => setVehicleDraft((p) => ({ ...p, [key]: e.target.value }))}
                              />
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100 bg-gray-50/60">
                          <button type="button" onClick={cancelVehicleEdit}
                            className="h-8 px-3 rounded-lg border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-gray-100 transition-colors">
                            Cancelar
                          </button>
                          <button type="button" onClick={saveVehicle} disabled={savingVehicle}
                            className="h-8 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors">
                            <Save className="w-3 h-3" /> {savingVehicle ? "Guardando…" : "Guardar cambios"}
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="px-4 py-3 grid grid-cols-3 gap-4">
                        <Field label="Tipo de Vehículo" value={data?.vehiculo?.tipo_vehiculo} />
                        <Field label="Placas Vehículo" value={data?.vehiculo?.placa} mono />
                        <Field label="No. Económico" value={data?.vehiculo?.no_economico} mono />
                        <Field label="Marca" value={data?.vehiculo?.marca} />
                        <Field label="Modelo / Año" value={data?.vehiculo?.modelo} />
                        <Field label="Color" value={data?.vehiculo?.color} />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Unidades */}
              {isLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <div className="space-y-3">
                  {unidades.map((u, idx) => {
                    const isUnitExpanded = expandedUnits.has(u.id);
                    return (
                    <div key={u.id} className="rounded-xl border border-gray-100 overflow-hidden">
                      {/* card header */}
                      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                        <button
                          type="button"
                          onClick={() => toggleUnit(u.id)}
                          className="flex items-center gap-2 flex-1 text-left">
                          <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">{idx + 1}</span>
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            {u.config === "remolque_contenedor" ? "Remolque + Contenedor" : "Solo remolque"}
                          </span>
                        </button>
                        <div className="flex items-center gap-2 shrink-0">
                          <button type="button" onClick={() => setEditingUnit(u)}
                            className="w-6 h-6 rounded-md hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button type="button" onClick={() => {
                            const next = unidades.filter((x) => x.id !== u.id);
                            setUnidades(next);
                            persistUnidades(next, deletionsFromUnit(u));
                          }}
                            className="w-6 h-6 rounded-md hover:bg-red-50 flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors">
                            <Trash2 className="w-3 h-3" />
                          </button>
                          <button type="button" onClick={() => toggleUnit(u.id)} className="text-gray-400 hover:text-gray-600 transition-colors">
                            {isUnitExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      {/* card body */}
                      {isUnitExpanded && <div className="p-4 space-y-3 bg-white divide-y divide-gray-50">
                        {/* Remolque */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5">
                            <Truck className="w-3 h-3 text-blue-500" />
                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Remolque</span>
                          </div>
                          <div className="grid grid-cols-4 gap-3">
                            <Field label="Tipo" value={u.remolque.tipo || null} />
                            <Field label="No. Remolque" value={u.remolque.noCaja || null} mono />
                            <Field label="Placas" value={u.remolque.placas || null} mono />
                            <div>
                              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Color</p>
                              {u.remolque.color ? (
                                <div className="flex items-center gap-1.5">
                                  <div className="w-3.5 h-3.5 rounded-full border border-gray-200" style={{ background: u.remolque.color }} />
                                  <span className="text-xs text-gray-600">{COLORES.find((c) => c.hex === u.remolque.color)?.label ?? "—"}</span>
                                </div>
                              ) : <p className="text-xs text-gray-300 italic">Sin información</p>}
                            </div>
                          </div>
                          {u.remolque.materiales.some((m) => m.producto) && (
                            <div>
                              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Material</p>
                              <div className="flex flex-wrap gap-1">
                                {u.remolque.materiales.filter((m) => m.producto).map((m) => (
                                  <span key={m.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-50 text-green-700 border border-green-100">
                                    <CheckCircle2 className="w-2.5 h-2.5" />{m.producto}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {u.remolque.comentarios && (
                            <div>
                              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Comentarios</p>
                              <p className="text-xs text-gray-600">{u.remolque.comentarios}</p>
                            </div>
                          )}
                        </div>
                        {/* Contenedor (solo si config === remolque_contenedor) */}
                        {u.config === "remolque_contenedor" && (
                          <div className="pt-3 space-y-2">
                            <div className="flex items-center gap-1.5">
                              <Package className="w-3 h-3 text-violet-500" />
                              <span className="text-[10px] font-bold text-violet-600 uppercase tracking-widest">Contenedor</span>
                            </div>
                            <div className="grid grid-cols-4 gap-3">
                              <Field label="Tipo contenedor" value={u.contenedor.tipo || null} />
                              <Field label="No. Contenedor" value={u.contenedor.noContenedor || null} mono />
                              <Field label="No. de Caja" value={u.contenedor.noCaja || null} mono />
                              <div>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Color</p>
                                {u.contenedor.color ? (
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-3.5 h-3.5 rounded-full border border-gray-200" style={{ background: u.contenedor.color }} />
                                    <span className="text-xs text-gray-600">{COLORES.find((c) => c.hex === u.contenedor.color)?.label ?? "—"}</span>
                                  </div>
                                ) : <p className="text-xs text-gray-300 italic">Sin información</p>}
                              </div>
                            </div>
                            {u.contenedor.materiales.some((m) => m.producto) && (
                              <div>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Material</p>
                                <div className="flex flex-wrap gap-1">
                                  {u.contenedor.materiales.filter((m) => m.producto).map((m) => (
                                    <span key={m.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-50 text-green-700 border border-green-100">
                                      <CheckCircle2 className="w-2.5 h-2.5" />{m.producto}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {u.contenedor.comentarios && (
                              <div>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Comentarios</p>
                                <p className="text-xs text-gray-600">{u.contenedor.comentarios}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>}
                    </div>
                    );
                  })}
                  <button type="button" onClick={() => setShowAgregarUnidad(true)}
                    className="w-full border-2 border-dashed border-blue-200 rounded-xl py-3.5 text-sm font-semibold text-blue-500 hover:border-blue-400 hover:bg-blue-50 transition-all flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> Agregar remolque
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT SIDEBAR ────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {/* Inspección de entrada */}
          {(() => {
            const inspecsDone = data?.inspecciones ?? [];
            // Total esperado: 1 tractor + 1 por cada unidad (remolque) + 1 por cada contenedor
            const totalSecciones = 1 + unidades.length + unidades.filter(u => u.config === "remolque_contenedor").length;
            const seccionesDone = inspecsDone.length;
            const hayAlguna = seccionesDone > 0;
            const todasDone = seccionesDone >= totalSecciones;
            return (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-bold text-gray-800">Inspección de entrada</span>
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                    todasDone ? "bg-green-100 text-green-700" : hayAlguna ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
                  )}>
                    {todasDone ? "Completada" : hayAlguna ? "En progreso" : "Pendiente"}
                  </span>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-gray-800">{seccionesDone}</span>
                    <span className="text-sm text-gray-400">de {totalSecciones} secciones</span>
                  </div>
                  {hayAlguna && (
                    <div className="space-y-1">
                      {inspecsDone.map((ins, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                          <span className="text-xs text-gray-600 capitalize flex-1">
                            {ins.tipo === "tractor"
                              ? "Tractor / Cabezal"
                              : ins.tipo.startsWith("remolque")
                              ? `Remolque · Unidad ${ins.tipo.split("_")[1] ?? ""}`
                              : `Contenedor · Unidad ${ins.tipo.split("_")[1] ?? ""}`}
                          </span>
                          {ins.url && (
                            <a href={ins.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 hover:underline shrink-0">
                              Ver
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {!todasDone && (
                    <button
                      onClick={() => setShowInspeccion(true)}
                      className="w-full h-9 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center gap-2"
                    >
                      <ClipboardCheck className="w-3.5 h-3.5" />
                      {hayAlguna ? "Continuar inspección" : "Realizar inspección"}
                    </button>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Inspección de salida */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden opacity-70">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-gray-300" />
                <span className="text-sm font-bold text-gray-400">
                  Inspección de salida
                </span>
              </div>
              <span className="text-[10px] font-bold bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" />
                Bloqueada
              </span>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-gray-300">
                  {inspecciones.salida.completados}
                </span>
                <span className="text-sm text-gray-300">
                  de {inspecciones.salida.total}
                </span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Disponible al registrar el ingreso del transportista.
              </p>
              <button
                disabled
                className="w-full h-9 rounded-xl text-xs font-medium bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-100 flex items-center justify-center gap-1.5">
                <Lock className="w-3 h-3" />
                Completa la etapa anterior
              </button>
            </div>
          </div>

          {/* Inspección de sello */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-teal-500" />
                <span className="text-sm font-bold text-gray-800">
                  Inspección de sello
                </span>
              </div>
              <span className="text-[10px] font-bold bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Pendiente
              </span>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-[11px] text-gray-400">
                ISO 17712 · Método VVTT
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-gray-800">
                  {inspecciones.sello.completados}
                </span>
                <span className="text-sm text-gray-400">
                  de {inspecciones.sello.total}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-0.5">
                  Inspección de sello pendiente
                </p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Método VVTT (View · Verify · Tug · Twist) sobre el sello clase
                  H.
                </p>
              </div>
              <button className="w-full h-9 rounded-xl text-xs font-semibold bg-teal-900 hover:bg-teal-800 text-white transition-colors flex items-center justify-center gap-2">
                <Shield className="w-3.5 h-3.5" />
                Realizar inspección de sello
              </button>
            </div>
          </div>
        </div>
      </div>
      {showInspeccion && (
        <InspeccionEntradaModal
          recordId={id}
          unidades={unidades}
          inspeccionesDone={data?.inspecciones ?? []}
          onClose={() => setShowInspeccion(false)}
        />
      )}
      {showAgregarUnidad && (
        <AgregarUnidadModal
          onClose={() => setShowAgregarUnidad(false)}
          onSave={(u) => {
            const next = [...unidades, u];
            setUnidades(next);
            setExpandedUnits((prev) => new Set(prev).add(u.id));
            persistUnidades(next);
          }}
        />
      )}
      {editingUnit && (
        <AgregarUnidadModal
          initialData={editingUnit}
          onClose={() => setEditingUnit(null)}
          onSave={(updated) => {
            const next = unidades.map((x) => x.id === updated.id ? updated : x);
            setUnidades(next);
            setEditingUnit(null);
            persistUnidades(next, deletionsFromMaterialDiff(editingUnit, updated));
          }}
        />
      )}
    </div>
  );
}
