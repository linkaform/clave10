"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeftRight,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Link2,
  Package,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Truck,
  Unlink,
  X,
} from "lucide-react";
import { cn, reemplazarGuionMinuscula } from "@/lib/utils";
import { useUploadImage } from "@/hooks/useUploadImage";
import { useCreateVisitTransportista } from "@/hooks/useCreateVisitTransportista";
import { useQueryClient } from "@tanstack/react-query";
import { ocrAccesoTransportista } from "@/services/endpoints";
import type { VisitaTransportista } from "@/hooks/useGetVisitTransportista";
import {
  type UnidadItem,
  type ContenedorData,
  emptyUnidad,
  emptyMaterial,
  emptyContenedorData,
  resolveColorSwatch,
  UnidadEditorCard,
  serializeUnidades,
} from "@/components/transportista/agregar-unidad-modal";

// ─── Types ───────────────────────────────────────────────────────────────────

type TipoOperacion = "Entrega" | "Recolección";

const TIPOS_OPERACION = [
  {
    value: "Entrega" as TipoOperacion,
    label: "Entrega",
    description: "El transportista llega a tu planta",
    icon: Truck,
  },
  {
    value: "Recolección" as TipoOperacion,
    label: "Recolección",
    description: "El transportista sale de tu planta",
    icon: ArrowLeftRight,
  },
] as const;

// ─── Document upload types ────────────────────────────────────────────────────

const DOC_TYPES_LABELS = [
  "Foto de placa del vehículo",
  "Foto del conductor",
  "Licencia del conductor",
  "Tarjeta de circulación - Vehículo",
  "Tarjeta de circulación - Remolque",
  "OC / BL / Materiales",
  "Contenedor / Doc. contenedor",
];

interface DocItem {
  id:        string;
  file_url:  string;
  file_name: string;
  uploading: boolean;
  preview:   string | null;
  tipo?:     string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ESTADOS_MX = [
  "Aguascalientes",
  "Baja California",
  "Baja California Sur",
  "Campeche",
  "Chiapas",
  "Chihuahua",
  "Ciudad de México",
  "Coahuila",
  "Colima",
  "Durango",
  "Estado de México",
  "Guanajuato",
  "Guerrero",
  "Hidalgo",
  "Jalisco",
  "Michoacán",
  "Morelos",
  "Nayarit",
  "Nuevo León",
  "Oaxaca",
  "Puebla",
  "Querétaro",
  "Quintana Roo",
  "San Luis Potosí",
  "Sinaloa",
  "Sonora",
  "Tabasco",
  "Tamaulipas",
  "Tlaxcala",
  "Veracruz",
  "Yucatán",
  "Zacatecas",
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5 block">
      {children}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );
}

function ComboboxSelect({
  value,
  onChange,
  options,
  placeholder = "Buscar...",
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = query.trim()
    ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))
    : options;

  if (value) {
    return (
      <div className="flex items-center justify-between gap-2 h-10 px-3 rounded-xl border border-blue-200 bg-blue-50 text-sm">
        <span className="truncate text-gray-700 font-medium">{value}</span>
        <button
          type="button"
          onClick={() => onChange("")}
          className="text-gray-400 hover:text-gray-600 shrink-0 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 px-3 h-10 rounded-xl border border-gray-200 bg-gray-50 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-200 transition-all">
        <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none"
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
          <ul className="max-h-48 overflow-y-auto py-1">
            {filtered.map((o) => (
              <li key={o}>
                <button
                  type="button"
                  onMouseDown={() => {
                    onChange(o);
                    setQuery("");
                    setOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors truncate">
                  {o}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function MiniField({
  label,
  value,
  mono,
}: {
  label: string;
  value?: string | null;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className={cn("text-xs text-gray-700 leading-snug", mono && "font-mono", !value && "text-gray-300 italic")}>
        {value || "Sin información"}
      </p>
    </div>
  );
}

function SectionDivider({
  label,
  icon,
  required,
}: {
  label: string;
  icon?: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 pt-1 pb-0.5">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-widest shrink-0">
        {icon}
        {required && <span className="text-red-400">*</span>}
        {label}
      </div>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );
}


function SignaturePad({
  onChange,
  onSave,
  saveState = "idle",
  onReset,
}: {
  onChange: (data: string | null) => void;
  onSave?: () => void;
  saveState?: "idle" | "uploading" | "done";
  onReset?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const hasContent = useRef(false);
  const onChangeCb = useCallback(onChange, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const getPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    };

    const startDraw = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      isDrawing.current = true;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    };

    const draw = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      if (!isDrawing.current) return;
      const pos = getPos(e);
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#1e293b";
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      hasContent.current = true;
    };

    const stopDraw = () => {
      if (isDrawing.current) {
        isDrawing.current = false;
        if (hasContent.current) onChangeCb(canvas.toDataURL());
      }
    };

    canvas.addEventListener("mousedown", startDraw);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDraw);
    canvas.addEventListener("mouseleave", stopDraw);
    canvas.addEventListener("touchstart", startDraw, { passive: false });
    canvas.addEventListener("touchmove", draw, { passive: false });
    canvas.addEventListener("touchend", stopDraw);
    return () => {
      canvas.removeEventListener("mousedown", startDraw);
      canvas.removeEventListener("mousemove", draw);
      canvas.removeEventListener("mouseup", stopDraw);
      canvas.removeEventListener("mouseleave", stopDraw);
      canvas.removeEventListener("touchstart", startDraw);
      canvas.removeEventListener("touchmove", draw);
      canvas.removeEventListener("touchend", stopDraw);
    };
  }, [onChangeCb]);

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    hasContent.current = false;
    onChangeCb(null);
    onReset?.();
  };

  return (
    <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={600}
          height={120}
          className="w-full touch-none cursor-crosshair bg-white"
          style={{ display: "block" }}
        />
        {/* guide line */}
        <div className="absolute bottom-5 left-6 right-6 h-px bg-gray-200 pointer-events-none" />
        <span className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[11px] text-gray-300 pointer-events-none select-none">
          Firma aquí
        </span>
      </div>
      <div className="flex justify-between items-center px-4 py-2 border-t border-gray-100 bg-gray-50">
        <span className="text-[11px] text-gray-400">
          Dibuja tu firma con el mouse o con el dedo
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={clear}
            className="text-[11px] font-semibold text-gray-400 hover:text-red-500 transition-colors">
            Limpiar
          </button>
          {onSave && (
            <button
              type="button"
              disabled={
                !hasContent.current ||
                saveState === "uploading" ||
                saveState === "done"
              }
              onClick={onSave}
              className={cn(
                "flex items-center gap-1.5 text-[11px] font-semibold transition-colors",
                saveState === "done"
                  ? "text-green-600 cursor-default"
                  : hasContent.current && saveState === "idle"
                    ? "text-blue-600 hover:text-blue-700"
                    : "text-gray-300 cursor-not-allowed",
              )}>
              {saveState === "uploading" ? (
                <>
                  <span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </>
              ) : saveState === "done" ? (
                <>
                  <Check className="w-3 h-3" /> Guardada
                </>
              ) : (
                <>
                  <Check className="w-3 h-3" /> Guardar firma
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

type Tab = "vehiculo" | "materiales" | "remolques";

interface Props {
  open: boolean;
  onClose: () => void;
}

const TABS: { key: Tab; label: string }[] = [
  { key: "vehiculo",   label: "Vehículo"   },
  { key: "remolques",  label: "Remolques"  },
  { key: "materiales", label: "Materiales" },
];

type PhotoState = { file_name: string; file_url: string; uploading: boolean };
const emptyPhoto = (): PhotoState => ({
  file_name: "",
  file_url: "",
  uploading: false,
});

export function NuevoAccesoTransportistaModal({ open, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("vehiculo");
  const { uploadImageMutation } = useUploadImage();
  const { mutate: createVisit, isPending } = useCreateVisitTransportista();
  const queryClient = useQueryClient();
  const router = useRouter();

  // Vehículo
  const [tipoOperacion, setTipoOperacion] = useState<TipoOperacion | null>(
    null,
  );
  const [transportista, setTransportista] = useState("");
  const [procedencia, setProcedencia] = useState("");
  const [tipoVehiculo, setTipoVehiculo] = useState("");
  const [placa, setPlaca] = useState("");
  const [noEconomico, setNoEconomico] = useState("");
  const [marcaVehiculo, setMarcaVehiculo] = useState("");
  const [modeloVehiculo, setModeloVehiculo] = useState("");
  const [colorVehiculo, setColorVehiculo] = useState("");
  const [conductor, setConductor] = useState("");
  const [noLicencia, setNoLicencia] = useState("");
  const [vigenciaLicencia, setVigenciaLicencia] = useState("");
  const [rfcConductor, setRfcConductor] = useState("");
  const [acompanante, setAcompanante] = useState("");
  const [documentosDetectados, setDocumentosDetectados] = useState<string[]>([]);

  // Fotos y firma
  const [documentos, setDocumentos] = useState<DocItem[]>([]);
  const [firma, setFirma] = useState<PhotoState>(emptyPhoto());
  const [pendingSignature, setPendingSignature] = useState<string | null>(null);

  // IA
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiFilledFields, setAiFilledFields] = useState<Set<string>>(new Set());

  const clearAiField = (field: string) =>
    setAiFilledFields((prev) => {
      const next = new Set(prev);
      next.delete(field);
      return next;
    });

  // Materiales (embarque)
  const [proveedorCliente, setProveedorCliente] = useState("");
  const [ordenCompra, setOrdenCompra] = useState("");

  // Remolques / contenedores — mismo modelo de unidades que el detalle de transportista
  const [unidades, setUnidades] = useState<UnidadItem[]>([]);
  const [showAgregarUnidad, setShowAgregarUnidad] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnidadItem | null>(null);
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());

  const toggleUnit = (id: string) =>
    setExpandedUnits((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

  // Contenedores detectados por IA que no se pudieron ligar automáticamente
  // a un remolque (más de un remolque y/o contenedor detectados) — se ligan
  // arrastrándolos sobre la tarjeta del remolque correspondiente.
  const [contenedoresSueltos, setContenedoresSueltos] = useState<(ContenedorData & { id: string })[]>([]);
  const [dragOverUnidadId, setDragOverUnidadId] = useState<string | null>(null);

  const linkContenedorSuelto = (unidadId: string, contenedorId: string) => {
    const suelto = contenedoresSueltos.find((c) => c.id === contenedorId);
    if (!suelto) return;
    const contenedorData: ContenedorData = {
      tipo: suelto.tipo, noSello: suelto.noSello, noContenedor: suelto.noContenedor,
      noCaja: suelto.noCaja, color: suelto.color, comentarios: suelto.comentarios, materiales: suelto.materiales,
    };
    setUnidades((prev) => prev.map((u) => u.id === unidadId
      ? { ...u, config: "remolque_contenedor", contenedor: contenedorData }
      : u));
    setContenedoresSueltos((prev) => prev.filter((c) => c.id !== contenedorId));
    setExpandedUnits((prev) => new Set(prev).add(unidadId));
  };

  const unlinkContenedor = (unidadId: string) => {
    const u = unidades.find((x) => x.id === unidadId);
    if (!u || u.config !== "remolque_contenedor") return;
    setContenedoresSueltos((prev) => [...prev, { id: Math.random().toString(36).slice(2), ...u.contenedor }]);
    setUnidades((prev) => prev.map((x) => x.id === unidadId
      ? { ...x, config: "solo_remolque", contenedor: emptyContenedorData() }
      : x));
  };

  // ── Upload helpers ────────────────────────────────────────────────────────────

  const uploadDocumento = async (file: File) => {
    const id = Math.random().toString(36).slice(2);
    setDocumentos((p) => [...p, { id, file_url: "", file_name: "", uploading: true, preview: URL.createObjectURL(file) }]);
    try {
      const renamed = new File([file], reemplazarGuionMinuscula(file.name), { type: file.type });
      const result = await uploadImageMutation.mutateAsync({ img: renamed });
      setDocumentos((p) => p.map((d) => d.id === id ? {
        ...d,
        file_url:  result?.file_url  ?? "",
        file_name: result?.file_name ?? file.name,
        uploading: false,
      } : d));
    } catch {
      setDocumentos((p) => p.filter((d) => d.id !== id));
    }
  };
  const removeDocumento = (id: string) => setDocumentos((p) => p.filter((d) => d.id !== id));

  const uploadSignature = async (base64: string) => {
    setFirma((p) => ({ ...p, uploading: true }));
    try {
      const res = await fetch(base64);
      const blob = await res.blob();
      const file = new File([blob], "firma_conductor.png", {
        type: "image/png",
      });
      const result = await uploadImageMutation.mutateAsync({ img: file });
      setFirma({
        file_name: result?.file_name ?? "firma_conductor.png",
        file_url: result?.file_url ?? "",
        uploading: false,
      });
    } catch {
      setFirma((p) => ({ ...p, uploading: false }));
    }
  };

  const analyzePhotosWithAI = async () => {
    setAiAnalyzing(true);
    try {
      const result = await ocrAccesoTransportista(
        documentos
          .filter((d) => d.file_url)
          .map((d) => ({ file_url: d.file_url, file_name: d.file_name })),
      );
      const d = (result?.response?.data?.data ?? {}) as Partial<{
        vehiculo: Partial<{
          transportista: string; tipo_vehiculo: string; placa: string;
          procedencia: string; no_economico: string;
          marca: string; modelo: string; color: string;
        }>;
        conductor: Partial<{ nombre: string; no_licencia: string; vigencia_licencia: string; rfc: string; acompanante: string }>;
        documentos_detectados: { url: string; fuente: string; tipo: string }[];
        remolques: { tipo?: string; no_caja?: string; no_sello?: string; placas?: string; color?: string; comentarios?: string }[];
        contenedores: { tipo?: string; no_caja?: string; no_sello?: string; placas?: string; color?: string; comentarios?: string }[];
        materiales: { producto?: string; lote?: string; cant_esperada?: string; peso?: string; volumen?: string }[];
        embarque: Partial<{ proveedor_cliente: string; no_orden_compra: string }>;
      }>;

      const filled = new Set<string>();

      // Vehículo
      if (d.vehiculo?.transportista)  { setTransportista(d.vehiculo.transportista);    filled.add("transportista"); }
      if (d.vehiculo?.tipo_vehiculo)  { setTipoVehiculo(d.vehiculo.tipo_vehiculo);      filled.add("tipoVehiculo"); }
      if (d.vehiculo?.placa)          { setPlaca(d.vehiculo.placa);                     filled.add("placa"); }
      if (d.vehiculo?.procedencia)    { setProcedencia(d.vehiculo.procedencia);         filled.add("procedencia"); }
      if (d.vehiculo?.no_economico)   { setNoEconomico(d.vehiculo.no_economico);        filled.add("noEconomico"); }
      if (d.vehiculo?.marca)           { setMarcaVehiculo(d.vehiculo.marca);            filled.add("marcaVehiculo"); }
      if (d.vehiculo?.modelo)          { setModeloVehiculo(d.vehiculo.modelo);           filled.add("modeloVehiculo"); }
      if (d.vehiculo?.color)           { setColorVehiculo(d.vehiculo.color);             filled.add("colorVehiculo"); }

      // Conductor
      if (d.conductor?.nombre)        { setConductor(d.conductor.nombre);               filled.add("conductor"); }
      if (d.conductor?.no_licencia)   { setNoLicencia(d.conductor.no_licencia);         filled.add("noLicencia"); }
      if (d.conductor?.vigencia_licencia) { setVigenciaLicencia(d.conductor.vigencia_licencia); filled.add("vigenciaLicencia"); }
      if (d.conductor?.rfc)            { setRfcConductor(d.conductor.rfc);                filled.add("rfcConductor"); }
      if (d.conductor?.acompanante)    { setAcompanante(d.conductor.acompanante);         filled.add("acompanante"); }

      // Documentos detectados — asigna tipo a cada DocItem por URL
      if (Array.isArray(d.documentos_detectados) && d.documentos_detectados.length) {
        const byUrl = new Map(d.documentos_detectados.map((dd) => [dd.url, dd.tipo]));
        setDocumentos((prev) =>
          prev.map((doc) => byUrl.has(doc.file_url) ? { ...doc, tipo: byUrl.get(doc.file_url) } : doc),
        );
        setDocumentosDetectados([...new Set(d.documentos_detectados.map((dd) => dd.tipo))]);
      }

      // Remolques y contenedores llegan en arreglos separados — la IA no
      // sabe qué contenedor va sobre qué remolque. Si hay exactamente uno de
      // cada uno se ligan automáticamente (caso simple); si hay más de uno,
      // se crea una unidad por remolque y los contenedores quedan "sueltos"
      // para que el usuario los ligue arrastrándolos sobre el remolque.
      const remolquesAI = d.remolques ?? [];
      const contenedoresAI = d.contenedores ?? [];
      const unidadesFromAI: UnidadItem[] = remolquesAI.map((r) => {
        const u = emptyUnidad();
        u.remolque = {
          ...u.remolque,
          tipo:        r.tipo        ?? "",
          noSello:     r.no_sello    ?? "",
          noCaja:      r.no_caja     ?? "",
          placas:      r.placas      ?? "",
          color:       r.color       ?? "",
          comentarios: r.comentarios ?? "",
        };
        return u;
      });

      const contenedoresParaLigar: (ContenedorData & { id: string })[] = contenedoresAI.map((c) => ({
        id: Math.random().toString(36).slice(2),
        ...emptyContenedorData(),
        tipo:         c.tipo        ?? "",
        noSello:      c.no_sello    ?? "",
        noContenedor: c.no_caja     ?? "",
        color:        c.color       ?? "",
        comentarios:  c.comentarios ?? "",
      }));

      if (remolquesAI.length === 1 && contenedoresParaLigar.length === 1) {
        // Caso simple — se liga solo, sin pasar por el pool de sueltos
        const { tipo, noSello, noContenedor, noCaja, color, comentarios, materiales } = contenedoresParaLigar[0];
        unidadesFromAI[0] = {
          ...unidadesFromAI[0],
          config: "remolque_contenedor",
          contenedor: { tipo, noSello, noContenedor, noCaja, color, comentarios, materiales },
        };
      } else if (contenedoresParaLigar.length) {
        setContenedoresSueltos(contenedoresParaLigar);
      }

      // Materiales — el servicio aún no indica a qué remolque/contenedor
      // pertenece cada uno, así que se anexan a la primera unidad con
      // contenedor (o a la primera unidad si ninguna tiene contenedor).
      if (d.materiales?.length) {
        if (!unidadesFromAI.length) unidadesFromAI.push(emptyUnidad());
        const targetIdx = Math.max(unidadesFromAI.findIndex((u) => u.config === "remolque_contenedor"), 0);
        const materialesCarga = d.materiales.map((m) => ({
          ...emptyMaterial(),
          producto:     m.producto      ?? "",
          lote:         m.lote          ?? "",
          cantEsperada: m.cant_esperada ?? "",
          peso:         m.peso          ?? "",
          volumen:      m.volumen       ?? "",
        }));
        const target = unidadesFromAI[targetIdx];
        unidadesFromAI[targetIdx] = target.config === "remolque_contenedor"
          ? { ...target, contenedor: { ...target.contenedor, materiales: materialesCarga } }
          : { ...target, remolque: { ...target.remolque, materiales: materialesCarga } };
        filled.add("carga");
      }

      if (unidadesFromAI.length) {
        setUnidades(unidadesFromAI);
        setExpandedUnits(new Set(unidadesFromAI.map((u) => u.id)));
        filled.add("remolques");
      }

      // Embarque
      if (d.embarque?.proveedor_cliente) { setProveedorCliente(d.embarque.proveedor_cliente); filled.add("proveedorCliente"); }
      if (d.embarque?.no_orden_compra)   { setOrdenCompra(d.embarque.no_orden_compra);        filled.add("ordenCompra"); }

      setAiFilledFields(filled);
    } finally {
      setAiAnalyzing(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}>
      <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden rounded-2xl shadow-2xl">
        <DialogTitle className="sr-only">
          Nuevo acceso de transportista
        </DialogTitle>

        {/* ── Header ────────────────────────────────── */}
        <div className="relative overflow-hidden">
          {/* gradient stripe */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 opacity-[0.06] pointer-events-none" />
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm shadow-blue-200 shrink-0">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-gray-800 leading-tight">
                  Nuevo acceso de transportista
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Registra el ingreso de transporte y carga
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tab navigation ────────────────────────── */}
        <div className="px-6 pt-4 pb-0">
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={cn(
                  "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                  tab === key
                    ? "bg-white text-gray-800 shadow-sm"
                    : "text-gray-500 hover:text-gray-700",
                )}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content ───────────────────────────────── */}
        <div className="overflow-y-auto max-h-[58vh] px-6 py-5 space-y-5">
          {/* ══ TAB: VEHÍCULO ════════════════════════ */}
          {tab === "vehiculo" && (
            <>
              <SectionDivider label="Tipo de operación" required />

              <div className="grid grid-cols-2 gap-3">
                {TIPOS_OPERACION.map(
                  ({ value, label, description, icon: Icon }) => {
                    const selected = tipoOperacion === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setTipoOperacion(value)}
                        className={cn(
                          "text-left p-4 rounded-xl border-2 transition-all duration-150",
                          selected
                            ? "border-teal-500 bg-teal-50/80"
                            : "border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/40",
                        )}>
                        <div className="flex items-start gap-3">
                          <Icon
                            className={cn(
                              "w-5 h-5 mt-0.5 shrink-0",
                              selected ? "text-teal-600" : "text-blue-400",
                            )}
                          />
                          <div className="min-w-0">
                            <p
                              className={cn(
                                "font-semibold text-sm leading-snug",
                                selected ? "text-teal-700" : "text-gray-700",
                              )}>
                              {label}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5 leading-snug">
                              {description}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  },
                )}
              </div>

              <SectionDivider
                label="Fotografías"
                icon={<Camera className="w-3 h-3" />}
              />

              {/* ── Bloque unificado de fotos + IA ── */}
              {(() => {
                const anyUploading = documentos.some((d) => d.uploading);
                const canAnalyze = documentos.some((d) => d.file_url) && !anyUploading;
                return (
                  <div className="rounded-xl border border-gray-200 bg-gray-50/40 p-4 space-y-3">
                    {/* Upload zone — large when empty, small thumbnail at end when files exist */}
                    {documentos.length === 0 ? (
                      <label className="block cursor-pointer">
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            Array.from(e.target.files ?? []).forEach(uploadDocumento);
                            e.target.value = "";
                          }}
                        />
                        <div className="w-full rounded-xl border-2 border-dashed border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/40 transition-all flex flex-col items-center justify-center gap-1.5 py-5">
                          <Camera className="w-5 h-5 text-gray-300" />
                          <span className="text-sm text-gray-400 font-medium">Subir imágenes o archivos</span>
                          <span className="text-[11px] text-gray-300">Puedes seleccionar múltiples archivos</span>
                        </div>
                      </label>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {documentos.map((doc) => (
                          <div key={doc.id} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex-shrink-0">
                            {doc.uploading ? (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                              </div>
                            ) : doc.preview ? (
                              <img src={doc.preview} className="w-full h-full object-cover" alt="" />
                            ) : null}
                            <button
                              type="button"
                              onClick={() => removeDocumento(doc.id)}
                              className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors">
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ))}
                        <label className="cursor-pointer flex-shrink-0">
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                              Array.from(e.target.files ?? []).forEach(uploadDocumento);
                              e.target.value = "";
                            }}
                          />
                          <div className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/40 transition-all flex flex-col items-center justify-center gap-0.5">
                            <Camera className="w-4 h-4 text-gray-300" />
                            <span className="text-[9px] text-gray-300 font-medium leading-tight text-center px-1">Agregar</span>
                          </div>
                        </label>
                      </div>
                    )}

                    {/* Info */}
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      <span className="font-semibold text-gray-500">Archivos sugeridos: </span>
                      {DOC_TYPES_LABELS.join(" · ")}
                    </p>

                    <button
                      type="button"
                      disabled={!canAnalyze || aiAnalyzing}
                      onClick={analyzePhotosWithAI}
                      className={cn(
                        "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all border-2",
                        canAnalyze && !aiAnalyzing
                          ? "border-violet-300 bg-violet-50 text-violet-600 hover:bg-violet-100 hover:border-violet-400"
                          : "border-gray-200 bg-white text-gray-300 cursor-not-allowed",
                      )}>
                      {aiAnalyzing ? (
                        <>
                          <span className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                          Analizando imágenes...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Analizar con IA
                        </>
                      )}
                    </button>

                    {aiFilledFields.size > 0 && !aiAnalyzing && (
                      <p className="text-[11px] text-violet-500 font-medium flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3" />
                        {aiFilledFields.size} campo
                        {aiFilledFields.size > 1 ? "s completados" : " completado"}{" "}
                        automáticamente — puedes editarlos si es necesario
                      </p>
                    )}

                    {documentosDetectados.length > 0 && !aiAnalyzing && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          Documentos detectados
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {documentosDetectados.map((doc) => (
                            <span
                              key={doc}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-600 border border-blue-100">
                              {doc.replace(/_/g, " ")}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              <SectionDivider label="Información general" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Transportista</FieldLabel>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    <Input
                      className="pl-9 text-sm"
                      placeholder="Buscar o escribir transportista..."
                      value={transportista}
                      onChange={(e) => setTransportista(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
                      Procedencia
                    </span>
                    {aiFilledFields.has("procedencia") && (
                      <span className="flex items-center gap-1 text-[9px] font-bold text-violet-500 bg-violet-100 border border-violet-200 rounded px-1.5 py-0.5">
                        <Sparkles className="w-2.5 h-2.5" /> IA
                      </span>
                    )}
                  </div>
                  <ComboboxSelect
                    value={procedencia}
                    onChange={(v) => {
                      setProcedencia(v);
                      clearAiField("procedencia");
                    }}
                    options={ESTADOS_MX}
                    placeholder="Buscar estado..."
                  />
                </div>
              </div>

              <SectionDivider
                label="Vehículo"
                icon={<Truck className="w-3 h-3" />}
              />

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <FieldLabel>Tipo de vehículo</FieldLabel>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    <Input
                      className={cn(
                        "pl-9 text-sm",
                        aiFilledFields.has("tipoVehiculo") &&
                          "border-violet-200 bg-violet-50/40",
                      )}
                      placeholder="Seleccionar tipo de vehículo..."
                      value={tipoVehiculo}
                      onChange={(e) => {
                        setTipoVehiculo(e.target.value);
                        clearAiField("tipoVehiculo");
                      }}
                    />
                    {aiFilledFields.has("tipoVehiculo") && (
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[9px] font-bold text-violet-500 bg-violet-100 border border-violet-200 rounded px-1.5 py-0.5 pointer-events-none">
                        <Sparkles className="w-2.5 h-2.5" /> IA
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <FieldLabel>Placa del vehículo</FieldLabel>
                  <div className="relative">
                    <Input
                      className={cn(
                        "text-sm font-mono uppercase",
                        aiFilledFields.has("placa") &&
                          "border-violet-200 bg-violet-50/40",
                      )}
                      placeholder="AB-1234-C"
                      value={placa}
                      onChange={(e) => {
                        setPlaca(e.target.value);
                        clearAiField("placa");
                      }}
                    />
                    {aiFilledFields.has("placa") && (
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[9px] font-bold text-violet-500 bg-violet-100 border border-violet-200 rounded px-1.5 py-0.5 pointer-events-none">
                        <Sparkles className="w-2.5 h-2.5" /> IA
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <FieldLabel>No. Económico / No. Rótulo</FieldLabel>
                  <div className="relative">
                    <Input
                      className={cn("text-sm", aiFilledFields.has("noEconomico") && "border-violet-200 bg-violet-50/40")}
                      placeholder="Ej. ECO-001"
                      value={noEconomico}
                      onChange={(e) => { setNoEconomico(e.target.value); clearAiField("noEconomico"); }}
                    />
                    {aiFilledFields.has("noEconomico") && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[9px] font-bold text-violet-500 bg-violet-100 border border-violet-200 rounded px-1.5 py-0.5 pointer-events-none"><Sparkles className="w-2.5 h-2.5" /> IA</span>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <FieldLabel>Marca</FieldLabel>
                  <div className="relative">
                    <Input
                      className={cn("text-sm", aiFilledFields.has("marcaVehiculo") && "border-violet-200 bg-violet-50/40")}
                      placeholder="Ej. Kenworth"
                      value={marcaVehiculo}
                      onChange={(e) => { setMarcaVehiculo(e.target.value); clearAiField("marcaVehiculo"); }}
                    />
                    {aiFilledFields.has("marcaVehiculo") && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[9px] font-bold text-violet-500 bg-violet-100 border border-violet-200 rounded px-1.5 py-0.5 pointer-events-none"><Sparkles className="w-2.5 h-2.5" /> IA</span>}
                  </div>
                </div>
                <div>
                  <FieldLabel>Modelo / Año</FieldLabel>
                  <div className="relative">
                    <Input
                      className={cn("text-sm", aiFilledFields.has("modeloVehiculo") && "border-violet-200 bg-violet-50/40")}
                      placeholder="Ej. 2023"
                      value={modeloVehiculo}
                      onChange={(e) => { setModeloVehiculo(e.target.value); clearAiField("modeloVehiculo"); }}
                    />
                    {aiFilledFields.has("modeloVehiculo") && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[9px] font-bold text-violet-500 bg-violet-100 border border-violet-200 rounded px-1.5 py-0.5 pointer-events-none"><Sparkles className="w-2.5 h-2.5" /> IA</span>}
                  </div>
                </div>
                <div>
                  <FieldLabel>Color</FieldLabel>
                  <div className="relative">
                    <Input
                      className={cn("text-sm", aiFilledFields.has("colorVehiculo") && "border-violet-200 bg-violet-50/40")}
                      placeholder="Ej. Blanco"
                      value={colorVehiculo}
                      onChange={(e) => { setColorVehiculo(e.target.value); clearAiField("colorVehiculo"); }}
                    />
                    {aiFilledFields.has("colorVehiculo") && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[9px] font-bold text-violet-500 bg-violet-100 border border-violet-200 rounded px-1.5 py-0.5 pointer-events-none"><Sparkles className="w-2.5 h-2.5" /> IA</span>}
                  </div>
                </div>
              </div>

              <SectionDivider
                label="Conductor"
                icon={<Search className="w-3 h-3" />}
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Conductor</FieldLabel>
                  <div className="relative">
                    <Input
                      className={cn(
                        "text-sm",
                        aiFilledFields.has("conductor") &&
                          "border-violet-200 bg-violet-50/40",
                      )}
                      placeholder="Nombre completo del conductor"
                      value={conductor}
                      onChange={(e) => {
                        setConductor(e.target.value);
                        clearAiField("conductor");
                      }}
                    />
                    {aiFilledFields.has("conductor") && (
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[9px] font-bold text-violet-500 bg-violet-100 border border-violet-200 rounded px-1.5 py-0.5 pointer-events-none">
                        <Sparkles className="w-2.5 h-2.5" /> IA
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <FieldLabel>No. de licencia</FieldLabel>
                  <div className="relative">
                    <Input
                      className={cn(
                        "text-sm font-mono uppercase",
                        aiFilledFields.has("noLicencia") &&
                          "border-violet-200 bg-violet-50/40",
                      )}
                      placeholder="Número de licencia"
                      value={noLicencia}
                      onChange={(e) => {
                        setNoLicencia(e.target.value);
                        clearAiField("noLicencia");
                      }}
                    />
                    {aiFilledFields.has("noLicencia") && (
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[9px] font-bold text-violet-500 bg-violet-100 border border-violet-200 rounded px-1.5 py-0.5 pointer-events-none">
                        <Sparkles className="w-2.5 h-2.5" /> IA
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <FieldLabel>Vigencia de licencia</FieldLabel>
                  <div className="relative">
                    {(() => {
                      const expired = vigenciaLicencia && new Date(vigenciaLicencia) < new Date();
                      return (
                        <>
                          <Input
                            className={cn(
                              "text-sm",
                              aiFilledFields.has("vigenciaLicencia") && !expired && "border-violet-200 bg-violet-50/40",
                              expired && "border-red-300 bg-red-50 text-red-700",
                            )}
                            placeholder="YYYY-MM-DD"
                            value={vigenciaLicencia}
                            onChange={(e) => { setVigenciaLicencia(e.target.value); clearAiField("vigenciaLicencia"); }}
                          />
                          {expired && (
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[9px] font-bold text-red-500 bg-red-100 border border-red-200 rounded px-1.5 py-0.5 pointer-events-none">
                              Vencida
                            </span>
                          )}
                          {aiFilledFields.has("vigenciaLicencia") && !expired && (
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[9px] font-bold text-violet-500 bg-violet-100 border border-violet-200 rounded px-1.5 py-0.5 pointer-events-none"><Sparkles className="w-2.5 h-2.5" /> IA</span>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
                <div>
                  <FieldLabel>RFC</FieldLabel>
                  <div className="relative">
                    <Input
                      className={cn("text-sm font-mono uppercase", aiFilledFields.has("rfcConductor") && "border-violet-200 bg-violet-50/40")}
                      placeholder="Ej. GASS901012AB3"
                      value={rfcConductor}
                      onChange={(e) => { setRfcConductor(e.target.value); clearAiField("rfcConductor"); }}
                    />
                    {aiFilledFields.has("rfcConductor") && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[9px] font-bold text-violet-500 bg-violet-100 border border-violet-200 rounded px-1.5 py-0.5 pointer-events-none"><Sparkles className="w-2.5 h-2.5" /> IA</span>}
                  </div>
                </div>
                <div>
                  <FieldLabel>Acompañante</FieldLabel>
                  <div className="relative">
                    <Input
                      className={cn("text-sm", aiFilledFields.has("acompanante") && "border-violet-200 bg-violet-50/40")}
                      placeholder="Nombre (opcional)"
                      value={acompanante}
                      onChange={(e) => { setAcompanante(e.target.value); clearAiField("acompanante"); }}
                    />
                    {aiFilledFields.has("acompanante") && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[9px] font-bold text-violet-500 bg-violet-100 border border-violet-200 rounded px-1.5 py-0.5 pointer-events-none"><Sparkles className="w-2.5 h-2.5" /> IA</span>}
                  </div>
                </div>
              </div>

              <div>
                <FieldLabel required>Firma del conductor</FieldLabel>
                <SignaturePad
                  onChange={(data) => setPendingSignature(data)}
                  onSave={() => {
                    if (pendingSignature) uploadSignature(pendingSignature);
                  }}
                  saveState={
                    firma.uploading
                      ? "uploading"
                      : firma.file_url
                        ? "done"
                        : "idle"
                  }
                  onReset={() => {
                    setFirma(emptyPhoto());
                    setPendingSignature(null);
                  }}
                />
              </div>
            </>
          )}

          {/* ══ TAB: MATERIALES ══════════════════════ */}
          {tab === "materiales" && (
            <>
              <SectionDivider label="Proveedor / Cliente" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Proveedor / Cliente</FieldLabel>
                  <Input
                    className="text-sm"
                    placeholder="Nombre del proveedor o cliente"
                    value={proveedorCliente}
                    onChange={(e) => setProveedorCliente(e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel>Orden de compra</FieldLabel>
                  <Input
                    className="text-sm"
                    placeholder="Ej. OC-2026-001"
                    value={ordenCompra}
                    onChange={(e) => setOrdenCompra(e.target.value)}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 px-4 py-3 flex items-start gap-2.5">
                <Package className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                <p className="text-xs text-gray-500 leading-relaxed">
                  El material de carga se captura por cada remolque o contenedor —
                  agrégalo en la pestaña <span className="font-semibold text-gray-600">Remolques</span>.
                </p>
              </div>

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
            </>
          )}

          {/* ══ TAB: REMOLQUES ═══════════════════════ */}
          {tab === "remolques" && (
            <div className="space-y-3">
              {unidades.map((u, idx) => {
                if (editingUnit?.id === u.id) return null; // se edita inline debajo de la lista
                const isUnitExpanded = expandedUnits.has(u.id);
                const isDropTarget = dragOverUnidadId === u.id;
                return (
                  <div key={u.id}
                    onDragOver={(e) => { e.preventDefault(); if (dragOverUnidadId !== u.id) setDragOverUnidadId(u.id); }}
                    onDragLeave={() => setDragOverUnidadId((prev) => prev === u.id ? null : prev)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOverUnidadId(null);
                      const contenedorId = e.dataTransfer.getData("text/plain");
                      if (contenedorId) linkContenedorSuelto(u.id, contenedorId);
                    }}
                    className={cn(
                      "rounded-xl border overflow-hidden transition-colors",
                      isDropTarget ? "border-violet-400 ring-2 ring-violet-100 bg-violet-50/30" : "border-gray-200",
                    )}>
                    {/* card header */}
                    <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                      <button
                        type="button"
                        onClick={() => toggleUnit(u.id)}
                        className="flex items-center gap-2 flex-1 text-left">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                          {u.config === "remolque_contenedor" ? "Remolque + Contenedor" : "Solo remolque"}
                        </span>
                      </button>
                      <div className="flex items-center gap-2 shrink-0">
                        <button type="button" onClick={() => setEditingUnit(u)}
                          className="w-6 h-6 rounded-md hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button type="button" onClick={() => setUnidades((p) => p.filter((x) => x.id !== u.id))}
                          className="w-6 h-6 rounded-md hover:bg-red-50 flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors">
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <button type="button" onClick={() => toggleUnit(u.id)} className="text-gray-400 hover:text-gray-600 transition-colors">
                          {isUnitExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    {/* card body */}
                    {isUnitExpanded && (
                      <div className="p-4 space-y-3 bg-white divide-y divide-gray-50">
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5">
                            <Truck className="w-3 h-3 text-blue-500" />
                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Remolque</span>
                          </div>
                          <div className="grid grid-cols-4 gap-3">
                            <MiniField label="Tipo" value={u.remolque.tipo} />
                            <MiniField label="No. Remolque" value={u.remolque.noCaja} mono />
                            <MiniField label="Placas" value={u.remolque.placas} mono />
                            <div>
                              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Color</p>
                              {u.remolque.color ? (
                                <div className="flex items-center gap-1.5">
                                  <div className="w-3.5 h-3.5 rounded-full border border-gray-200" style={{ background: resolveColorSwatch(u.remolque.color)?.hex ?? "transparent" }} />
                                  <span className="text-xs text-gray-600">{resolveColorSwatch(u.remolque.color)?.label}</span>
                                </div>
                              ) : <p className="text-xs text-gray-300 italic">Sin información</p>}
                            </div>
                          </div>
                          {u.remolque.materiales.some((m) => m.producto) && (
                            <div className="pt-1">
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
                        </div>
                        {u.config === "remolque_contenedor" && (
                          <div className="pt-3 space-y-2">
                            <div className="flex items-center gap-1.5 justify-between">
                              <div className="flex items-center gap-1.5">
                                <Package className="w-3 h-3 text-violet-500" />
                                <span className="text-[10px] font-bold text-violet-600 uppercase tracking-widest">Contenedor</span>
                              </div>
                              <button type="button" onClick={() => unlinkContenedor(u.id)}
                                className="flex items-center gap-1 text-[10px] font-semibold text-gray-400 hover:text-red-500 transition-colors">
                                <Unlink className="w-3 h-3" /> Desligar
                              </button>
                            </div>
                            <div className="grid grid-cols-4 gap-3">
                              <MiniField label="Tipo contenedor" value={u.contenedor.tipo} />
                              <MiniField label="No. Contenedor" value={u.contenedor.noContenedor} mono />
                              <MiniField label="No. de Caja" value={u.contenedor.noCaja} mono />
                              <div>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Color</p>
                                {u.contenedor.color ? (
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-3.5 h-3.5 rounded-full border border-gray-200" style={{ background: resolveColorSwatch(u.contenedor.color)?.hex ?? "transparent" }} />
                                    <span className="text-xs text-gray-600">{resolveColorSwatch(u.contenedor.color)?.label}</span>
                                  </div>
                                ) : <p className="text-xs text-gray-300 italic">Sin información</p>}
                              </div>
                            </div>
                            {u.contenedor.materiales.some((m) => m.producto) && (
                              <div className="pt-1">
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
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {contenedoresSueltos.length > 0 && (
                <div className="rounded-xl border-2 border-dashed border-violet-200 bg-violet-50/40 p-3.5 space-y-2.5">
                  <div className="flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-violet-500" />
                    <p className="text-[11px] font-bold text-violet-700">Contenedores por ligar</p>
                  </div>
                  <p className="text-[11px] text-violet-500/80 leading-relaxed">
                    La IA detectó más de un remolque y/o contenedor y no pudo saber cuál va con cuál.
                    Arrastra cada contenedor sobre el remolque que lo carga.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {contenedoresSueltos.map((c) => (
                      <div key={c.id}
                        draggable
                        onDragStart={(e) => { e.dataTransfer.setData("text/plain", c.id); e.dataTransfer.effectAllowed = "move"; }}
                        onDragEnd={() => setDragOverUnidadId(null)}
                        className="flex items-center gap-2 rounded-lg border border-violet-200 bg-white pl-2 pr-3 py-2 cursor-grab active:cursor-grabbing shadow-sm">
                        <GripVertical className="w-3.5 h-3.5 text-violet-300 shrink-0" />
                        <Package className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-gray-700 truncate">{c.noContenedor || c.tipo || "Contenedor"}</p>
                          <p className="text-[10px] text-gray-400 truncate">{[c.tipo, c.noSello && `Sello ${c.noSello}`].filter(Boolean).join(" · ") || "Sin datos"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {showAgregarUnidad || editingUnit ? (
                <UnidadEditorCard
                  initialData={editingUnit ?? undefined}
                  onCancel={() => { setShowAgregarUnidad(false); setEditingUnit(null); }}
                  onSave={(u) => {
                    if (editingUnit) {
                      setUnidades((p) => p.map((x) => x.id === u.id ? u : x));
                    } else {
                      setUnidades((p) => [...p, u]);
                      setExpandedUnits((prev) => new Set(prev).add(u.id));
                    }
                    setShowAgregarUnidad(false);
                    setEditingUnit(null);
                  }}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAgregarUnidad(true)}
                  className="w-full border-2 border-dashed border-blue-200 rounded-xl py-3.5 text-sm font-semibold text-blue-500 hover:border-blue-400 hover:bg-blue-50 transition-all flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" />
                  Agregar remolque
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ────────────────────────────────── */}
        <div className="flex flex-col gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/80">
          {contenedoresSueltos.length > 0 && (
            <p className="text-[11px] font-medium text-violet-600 flex items-center gap-1.5">
              <Link2 className="w-3 h-3" />
              Liga {contenedoresSueltos.length === 1 ? "el contenedor pendiente" : "los contenedores pendientes"} en la pestaña Remolques antes de registrar.
            </p>
          )}
          <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xl border-gray-200 text-gray-600 hover:bg-gray-100">
            Cancelar
          </Button>
          <Button
            disabled={isPending || contenedoresSueltos.length > 0}
            className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-2"
            onClick={() => {
              const { remolques, contenedores, materiales } = serializeUnidades(unidades);
              const payload = {
                creado_desde: "acceso_web",
                tipo_operacion: tipoOperacion,
                vehiculo: {
                  transportista: transportista || null,
                  procedencia: procedencia || null,
                  tipo_vehiculo: tipoVehiculo || null,
                  placa: placa || null,
                  no_economico: noEconomico || null,
                  marca: marcaVehiculo || null,
                  modelo: modeloVehiculo || null,
                  color: colorVehiculo || null,
                },
                conductor: {
                  nombre: conductor || null,
                  no_licencia: noLicencia || null,
                  vigencia_licencia: vigenciaLicencia || null,
                  rfc: rfcConductor || null,
                  acompanante: acompanante || null,
                  firma: firma.file_url
                    ? { file_name: firma.file_name, file_url: firma.file_url }
                    : null,
                },
                embarque: {
                  proveedor_cliente: proveedorCliente || null,
                  no_orden_compra: ordenCompra || null,
                },
                documentos_adicionales: documentos
                  .filter((d) => d.file_url)
                  .map((d) => ({ file_url: d.file_url, file_name: d.file_name, ...(d.tipo ? { tipo: d.tipo } : {}) })),
                remolques,
                contenedores,
                materiales,
              };
              createVisit(payload, {
                onSuccess: (result) => {
                  if (result?.id) {
                    const cacheData: VisitaTransportista = {
                      id: result.id,
                      folio: result.folio ?? null,
                      tipo_operacion: tipoOperacion,
                      created_at: result.created_at ? String(result.created_at) : null,
                      estatus: null,
                      vehiculo: {
                        transportista: transportista || null,
                        procedencia: procedencia || null,
                        tipo_vehiculo: tipoVehiculo || null,
                        placa: placa || null,
                        no_economico: noEconomico || null,
                        marca: marcaVehiculo || null,
                        modelo: modeloVehiculo || null,
                        color: colorVehiculo || null,
                        material: null,
                        foto_placa: null,
                      },
                      conductor: {
                        nombre: conductor || null,
                        no_licencia: noLicencia || null,
                        vigencia_licencia: vigenciaLicencia || null,
                        rfc: rfcConductor || null,
                        acompanante: acompanante || null,
                        foto_conductor: null,
                        foto_licencia: null,
                        firma: firma.file_url ? { file_url: firma.file_url } : null,
                      },
                      embarque: {
                        proveedor_cliente: proveedorCliente || null,
                        no_orden_compra: ordenCompra || null,
                      },
                      documentos_adicionales: documentos
                        .filter((d) => d.file_url)
                        .map((d) => ({ file_url: d.file_url, file_name: d.file_name, ...(d.tipo ? { tipo: d.tipo } : {}) })),
                      // Los remolques/contenedores/materiales quedan vacíos aquí:
                      // el backend los agrupa (remolque + contenedor + refs de
                      // material) al guardar, así que se dejan para que la
                      // siguiente carga real los traiga ya vinculados.
                      remolques: [],
                      materiales: [],
                      inspecciones: [],
                    };
                    queryClient.setQueryData(
                      ["visitaTransportista", result.id],
                      cacheData,
                    );
                    queryClient.invalidateQueries({ queryKey: ["visitaTransportista", result.id] });
                    onClose();
                    router.push(
                      `/dashboard/accesos/transportista/${result.id}`,
                    );
                  } else {
                    onClose();
                  }
                },
              });
            }}>
            {isPending ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <Package className="w-4 h-4" />
                Registrar acceso
              </>
            )}
          </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
