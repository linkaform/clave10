"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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
  Sparkles,
  ArrowLeftRight,
  IdCard,
} from "lucide-react";
import { cn, capitalizeOnlyFirstLetter } from "@/lib/utils";
import { useGetVisitTransportista } from "@/hooks/useGetVisitTransportista";
import { saveBitacoraTransportistaRecord, saveInspeccionesTransportista, saveInspeccionesSelloTransportista, ocrAccesoTransportista } from "@/services/endpoints";
import { uploadImage } from "@/lib/get-upload-image";
import { toast } from "sonner";
import {
  type UnidadConfig,
  type MaterialCarga,
  type UnidadItem,
  emptyMaterial,
  emptyContenedorData,
  resolveColorSwatch,
  AgregarUnidadModal,
  serializeUnidades,
} from "@/components/transportista/agregar-unidad-modal";

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
        {value || "Sin información"}
      </p>
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
  onSaved,
}: {
  recordId: string;
  unidades: UnidadItem[];
  inspeccionesDone: { tipo: string; unidad?: number; url?: string }[];
  onClose: () => void;
  onSaved?: () => void;
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
      onSaved?.();
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
    locked: boolean = false,
  ) => {
    const uploadingFoto = uploadingSection === ptKey;
    return (
      <div key={idx} className={cn("border-b border-gray-50 last:border-0", locked && "opacity-40")}>
        <div className="flex items-center gap-2 py-2.5">
          <span className="text-[11px] text-gray-400 w-5 text-right shrink-0">{idx + 1}.</span>
          <span className="text-xs text-gray-700 flex-1 leading-snug">{label}</span>
          {locked
            ? <Lock className="w-3.5 h-3.5 text-gray-300 shrink-0" />
            : <HelpCircle className="w-3.5 h-3.5 text-gray-200 shrink-0" />
          }
          <button
            type="button"
            onClick={() => onSet("sí")}
            disabled={locked}
            className={cn(
              "h-7 w-9 rounded-full text-[11px] font-bold transition-colors shrink-0",
              locked && "cursor-not-allowed",
              punto.value === "sí" ? "bg-blue-600 text-white" : "border border-gray-200 text-gray-400 hover:border-blue-300"
            )}
          >
            Sí
          </button>
          <button
            type="button"
            onClick={() => onSet("no")}
            disabled={locked}
            className={cn(
              "h-7 w-9 rounded-full text-[11px] font-bold transition-colors shrink-0",
              locked && "cursor-not-allowed",
              punto.value === "no" ? "bg-red-500 text-white border-red-500" : "border border-gray-200 text-gray-400 hover:border-red-300"
            )}
          >
            No
          </button>
          <button
            type="button"
            onClick={() => triggerUpload(ptKey)}
            disabled={uploadingFoto || locked}
            className={cn(
              "relative w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 transition-colors",
              locked && "cursor-not-allowed",
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
              disabled={locked}
              placeholder="Añadir comentario u observación…"
              value={punto.comentario}
              onChange={(e) => onComentario(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-700 placeholder-gray-300 focus:outline-none focus:border-red-300 resize-none disabled:cursor-not-allowed"
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
                renderSiNoRow(
                  label, i, tractorPuntos[i],
                  (val) => setTractorPunto(i, val), (text) => setTractorComentario(i, text),
                  `pt:tractor:${i}`,
                  i > 0 && tractorPuntos[i - 1].value === null,
                )
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
                renderSiNoRow(
                  label, i, sec.puntos[i],
                  (val) => setUnitPunto(unitIdx, i, val), (text) => setUnitComentario(unitIdx, i, text),
                  `pt:remolque:${unitIdx}:${i}`,
                  i > 0 && sec.puntos[i - 1].value === null,
                )
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

// ─── Inspección de Sello ──────────────────────────────────────────────────────

interface SelloVVTT { view: boolean; verify: boolean; tug: boolean; twist: boolean; }
type SelloClasificacion = "I" | "S" | "H";
interface SelloUnitData {
  noSelloRevisado: string;
  clasificacion: SelloClasificacion | null;
  vvtt: SelloVVTT;
  evidencias: Record<string, EvidenciaImg | null>;
  comentario: string;
}

const VVTT_PUNTOS: { key: keyof SelloVVTT; sigla: string; label: string; descripcion: string }[] = [
  { key: "view",   sigla: "V", label: "View",   descripcion: "Verificar visualmente el sello" },
  { key: "verify", sigla: "V", label: "Verify",  descripcion: "Confirmar que el número coincide con documentos y sistemas" },
  { key: "tug",    sigla: "T", label: "Tug",     descripcion: "Jalar el sello para confirmar que está asegurado" },
  { key: "twist",  sigla: "T", label: "Twist",   descripcion: "Girar para detectar manipulación" },
];

const SELLO_CLASIFICACIONES: { value: SelloClasificacion; sigla: string; label: string }[] = [
  { value: "I", sigla: "I", label: "Indicative" },
  { value: "S", sigla: "S", label: "Security" },
  { value: "H", sigla: "H", label: "High Security" },
];

const SELLO_EVIDENCIA_SLOTS: { key: string; label: string; icon: React.ElementType }[] = [
  { key: "foto_sello",              label: "Foto del sello",                 icon: Lock },
  { key: "sello_puertas",           label: "Sello colocado en las puertas",  icon: FileText },
  { key: "puertas_completas",       label: "Puertas completas del remolque", icon: FileText },
  { key: "placas_economico",        label: "Placas o económico",             icon: Truck },
  { key: "identificacion_operador", label: "Identificación del operador",    icon: IdCard },
];

function InspeccionSelloModal({
  recordId,
  unidades,
  inspeccionesDone,
  onClose,
  onSaved,
}: {
  recordId: string;
  unidades: UnidadItem[];
  inspeccionesDone: { tipo: string; unidad?: number; url?: string }[];
  onClose: () => void;
  onSaved?: () => void;
}) {
  const getDone = (unidad: number) => inspeccionesDone.find((i) => i.tipo === `sello_${unidad}`);
  const isDone = (unidad: number) => !!getDone(unidad);

  const emptySelloUnit = (): SelloUnitData => ({
    noSelloRevisado: "",
    clasificacion: null,
    vvtt: { view: false, verify: false, tug: false, twist: false },
    evidencias: Object.fromEntries(SELLO_EVIDENCIA_SLOTS.map((s) => [s.key, null])),
    comentario: "",
  });

  const [activeTab, setActiveTab] = useState(0);
  const [unitsData, setUnitsData] = useState<SelloUnitData[]>(() => unidades.map(emptySelloUnit));
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingSlotRef = useRef<string | null>(null);

  const refUnidad = (u: UnidadItem) =>
    u.config === "remolque_contenedor"
      ? { noCaja: u.contenedor.noContenedor || u.contenedor.noCaja, noSello: u.contenedor.noSello }
      : { noCaja: u.remolque.noCaja, noSello: u.remolque.noSello };

  const updateUnit = (ui: number, patch: Partial<SelloUnitData>) =>
    setUnitsData((p) => p.map((d, i) => i !== ui ? d : { ...d, ...patch }));

  const toggleVVTT = (ui: number, key: keyof SelloVVTT) =>
    setUnitsData((p) => p.map((d, i) => i !== ui ? d : { ...d, vvtt: { ...d.vvtt, [key]: !d.vvtt[key] } }));

  const triggerSlotUpload = (ui: number, slotKey: string) => {
    pendingSlotRef.current = `${ui}:${slotKey}`;
    fileInputRef.current?.click();
  };

  const handleSlotFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const target = pendingSlotRef.current;
    e.target.value = "";
    if (!file || !target) return;
    const [uiStr, slotKey] = target.split(":");
    const ui = parseInt(uiStr);
    setUploadingSlot(target);
    try {
      const res = await uploadImage(file);
      if (res?.file) {
        setUnitsData((p) => p.map((d, i) => i !== ui ? d : {
          ...d,
          evidencias: { ...d.evidencias, [slotKey]: { file_url: res.file, file_name: res.file_name } },
        }));
      }
    } finally {
      setUploadingSlot(null);
      pendingSlotRef.current = null;
    }
  };

  const removeSlotFoto = (ui: number, slotKey: string) =>
    setUnitsData((p) => p.map((d, i) => i !== ui ? d : { ...d, evidencias: { ...d.evidencias, [slotKey]: null } }));

  const buildPayload = () =>
    unidades.map((u, i) => {
      const d = unitsData[i];
      const { noCaja, noSello } = refUnidad(u);
      return {
        tipo: "sello",
        unidad: i + 1,
        no_caja: noCaja,
        no_sello_sistema: noSello,
        no_sello_revisado: d.noSelloRevisado,
        clasificacion_iso: d.clasificacion,
        vvtt: VVTT_PUNTOS.map((v) => ({ punto: v.label, verificado: d.vvtt[v.key] })),
        evidencias: SELLO_EVIDENCIA_SLOTS
          .filter((s) => d.evidencias[s.key])
          .map((s) => ({ slot: s.key, ...(d.evidencias[s.key] as EvidenciaImg) })),
        comentario: d.comentario,
      };
    });

  const handleGuardar = async () => {
    setSaving(true);
    try {
      await saveInspeccionesSelloTransportista(recordId, buildPayload());
      toast.success("Inspección de sello guardada");
      onSaved?.();
      onClose();
    } catch {
      toast.error("Error al guardar la inspección");
    } finally {
      setSaving(false);
    }
  };

  const d = unitsData[activeTab];
  const u = unidades[activeTab];
  if (!d || !u) return null;
  const { noCaja, noSello } = refUnidad(u);
  const vvttCompletos = VVTT_PUNTOS.filter((v) => d.vvtt[v.key]).length;
  const todasUnidadesDone = unidades.every((_, i) => isDone(i + 1));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
            <Shield className="w-4.5 h-4.5 text-teal-600" />
          </div>
          <p className="text-sm font-bold text-gray-800 flex-1">Inspección Del Sello</p>
          <button type="button" onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        {unidades.length > 1 && (
          <div className="flex border-b border-gray-100 px-5 shrink-0 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {unidades.map((_, i) => {
              const done = isDone(i + 1);
              return (
                <button key={i} type="button" onClick={() => setActiveTab(i)}
                  className={cn("py-2.5 px-1 mr-5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5",
                    activeTab === i ? "border-teal-600 text-teal-600" : "border-transparent text-gray-400 hover:text-gray-600")}>
                  {i === 0 ? "Remolque principal" : `Remolque #${i + 1}`}
                  {done && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div className="rounded-lg bg-gray-50 px-3 py-2">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              {activeTab === 0 ? "Remolque principal" : `Remolque #${activeTab + 1}`}
              {noCaja ? ` · ${noCaja}` : ""}
            </p>
          </div>

          {isDone(activeTab + 1) ? (
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-green-700">Inspección ya realizada</p>
                <p className="text-[11px] text-green-600">Esta unidad ya fue inspeccionada.</p>
              </div>
              {getDone(activeTab + 1)?.url && (
                <a
                  href={getDone(activeTab + 1)?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-semibold text-green-700 hover:text-green-800 underline shrink-0"
                >
                  Ver registro
                </a>
              )}
            </div>
          ) : (
            <>
              {/* Número de sello */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 leading-tight min-h-[1.9em] flex items-end">Número de sello físico</p>
                  <div className="h-9 rounded-lg border border-gray-200 bg-gray-50 px-2.5 flex items-center gap-1.5 text-xs text-gray-700">
                    <Lock className="w-3 h-3 text-gray-400 shrink-0" />
                    <span className="flex-1 truncate">{noSello || "Sin información"}</span>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest shrink-0">Sistema</span>
                  </div>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 leading-tight min-h-[1.9em] flex items-end">Número de sello esperado (revisado)</p>
                  <input
                    className="w-full h-9 rounded-lg border border-gray-200 px-2.5 text-xs focus:outline-none focus:border-teal-400"
                    placeholder="Escribe el número revisado"
                    value={d.noSelloRevisado}
                    onChange={(e) => updateUnit(activeTab, { noSelloRevisado: e.target.value })}
                  />
                </div>
              </div>

              {/* Clasificación ISO */}
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Tipo de sello (clasificación ISO 17712)</p>
                <div className="grid grid-cols-3 gap-2">
                  {SELLO_CLASIFICACIONES.map((c) => (
                    <button key={c.value} type="button"
                      onClick={() => updateUnit(activeTab, { clasificacion: d.clasificacion === c.value ? null : c.value })}
                      className={cn(
                        "h-9 rounded-lg border-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors",
                        d.clasificacion === c.value
                          ? "border-teal-400 bg-teal-50 text-teal-700"
                          : "border-gray-200 text-gray-500 hover:border-teal-200",
                      )}>
                      <span className={cn(
                        "w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold shrink-0",
                        d.clasificacion === c.value ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-400",
                      )}>{c.sigla}</span>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Matriz VVTT */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Matriz VVTT — marca cada acción verificada</p>
                  <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">{vvttCompletos} / 4</span>
                </div>
                <div className="space-y-1.5">
                  {VVTT_PUNTOS.map((v) => {
                    const checked = d.vvtt[v.key];
                    return (
                      <button key={v.key} type="button" onClick={() => toggleVVTT(activeTab, v.key)}
                        className={cn(
                          "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 border transition-colors text-left",
                          checked ? "bg-teal-50 border-teal-200" : "bg-white border-gray-100 hover:border-gray-200",
                        )}>
                        <span className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0",
                          checked ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-400",
                        )}>{v.sigla}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800">{v.label}</p>
                          <p className="text-[11px] text-gray-400 leading-snug">{v.descripcion}</p>
                        </div>
                        <span className={cn(
                          "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors",
                          checked ? "bg-teal-600 border-teal-600" : "border-gray-300",
                        )}>
                          {checked && <Check className="w-3 h-3 text-white" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Evidencia fotográfica */}
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Evidencia fotográfica</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {SELLO_EVIDENCIA_SLOTS.map((slot, si) => {
                    const foto = d.evidencias[slot.key];
                    const slotId = `${activeTab}:${slot.key}`;
                    const loading = uploadingSlot === slotId;
                    const Icon = slot.icon;
                    return (
                      <div key={slot.key} className="rounded-xl border border-gray-100 p-2.5 space-y-1.5">
                        <p className="text-[10px] font-semibold text-gray-600 flex items-center gap-1.5 leading-snug">
                          <Icon className="w-3 h-3 text-gray-400 shrink-0" />
                          {si + 1}. {slot.label}
                        </p>
                        {foto ? (
                          <div className="relative w-full h-16 rounded-lg overflow-hidden border border-gray-200">
                            <img src={foto.file_url} className="w-full h-full object-cover" alt="" />
                            <button type="button" onClick={() => removeSlotFoto(activeTab, slot.key)}
                              className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors">
                              <X className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        ) : (
                          <button type="button" disabled={loading} onClick={() => triggerSlotUpload(activeTab, slot.key)}
                            className="w-full h-16 rounded-lg border-2 border-dashed border-gray-200 hover:border-teal-300 hover:bg-teal-50/40 flex items-center justify-center transition-colors">
                            {loading
                              ? <span className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
                              : <Camera className="w-4 h-4 text-gray-300" />}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Comentarios */}
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Comentarios</p>
                <textarea
                  rows={3}
                  placeholder="Observaciones de la inspección del sello…"
                  value={d.comentario}
                  onChange={(e) => updateUnit(activeTab, { comentario: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-700 placeholder-gray-300 focus:outline-none focus:border-teal-400 resize-none"
                />
              </div>
            </>
          )}
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleSlotFileChange} />

        {/* Footer */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50/60 shrink-0">
          <button type="button" onClick={onClose}
            className="h-9 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
            Cancelar
          </button>
          <button type="button" onClick={handleGuardar} disabled={saving || todasUnidadesDone}
            title={todasUnidadesDone ? "Todas las unidades ya fueron inspeccionadas" : undefined}
            className="flex-1 h-9 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2">
            {saving && (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
  arriboDone,
  entradaDone,
  cargaDone,
  salidaDone,
}: {
  arriboDone: boolean;
  entradaDone: boolean;
  cargaDone: boolean;
  salidaDone: boolean;
}) {
  const BLUE = "#2F80ED";
  const AMBER = "#F5A623";
  const GRAY = "#E2E8F0";

  const defs = [
    { label: "Arribo", done: arriboDone },
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

// ─── Documentos requeridos ──────────────────────────────────────────────────
// El servicio de guardado normaliza el `tipo` (minúsculas, espacios → guion
// bajo) antes de persistirlo, ej. "Foto de placa de vehículo" vuelve como
// "foto_de_placa_de_vehículo". El cruce contra lo ya subido se hace comparando
// ambos lados normalizados con `tipoSlug`.
const tipoSlug = (s: string) => s.trim().toLowerCase().replace(/\s+/g, "_");

// Una identificación válida puede ser INE, pasaporte, gafete o licencia de
// conducir — es un único requisito, no dos. Tanto el botón "Identificación"
// de la tarjeta del conductor como este renglón de pendientes comparten el
// mismo tipo (vía tipoSlug) para no duplicar el documento con dos etiquetas.
const IDENTIFICACION_CHOFER_LABEL = "Identificación del chofer";

const FOTO_CONDUCTOR_LABEL = "Foto del conductor";

const DOCUMENTOS_REQUERIDOS_DESCRIPCION: Record<string, string> = {
  [IDENTIFICACION_CHOFER_LABEL]: "INE, pasaporte, licencia de conducir o gafete de empresa",
  [FOTO_CONDUCTOR_LABEL]: "Fotografía reciente del rostro del conductor",
};

const documentosRequeridosNombres = [
  IDENTIFICACION_CHOFER_LABEL,
  FOTO_CONDUCTOR_LABEL,
  "Tarjeta de circulación - Vehículo",
  "Carta porte",
  "Factura / Orden de compra",
  "Foto de placa de vehículo",
  "Evidencia de carga",
  "Conocimiento del embarque (BL)",
];

// Slugs fijos acordados con el back para el servicio de OCR — no se derivan
// del label (acentos, "/", "()" no son seguros como identificador que debe
// generar un servicio de texto libre). tipoRequeridoSlug cae a tipoSlug(nombre)
// solo como red de seguridad si algún día se agrega un requerido sin slug fijo.
const DOCUMENTOS_REQUERIDOS_SLUGS: Record<string, string> = {
  [IDENTIFICACION_CHOFER_LABEL]: "identificacion_chofer",
  [FOTO_CONDUCTOR_LABEL]: "foto_conductor",
  "Tarjeta de circulación - Vehículo": "tarjeta_circulacion_vehiculo",
  "Carta porte": "carta_porte",
  "Factura / Orden de compra": "factura_orden_compra",
  "Foto de placa de vehículo": "foto_placa_vehiculo",
  "Evidencia de carga": "evidencia_carga",
  "Conocimiento del embarque (BL)": "conocimiento_embarque_bl",
};
const tipoRequeridoSlug = (nombre: string) => DOCUMENTOS_REQUERIDOS_SLUGS[nombre] ?? tipoSlug(nombre);

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
  const [showInspeccionSello, setShowInspeccionSello] = useState(false);
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
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

  const [docTab, setDocTab] = useState<"pendientes" | "subidos">("pendientes");
  const [fotoPicker, setFotoPicker] = useState<"foto_conductor" | "foto_licencia" | null>(null);
  const [uploadingFotoConductor, setUploadingFotoConductor] = useState(false);
  const fotoInputRef = useRef<HTMLInputElement>(null);

  const [editingDocIdx, setEditingDocIdx] = useState<number | null>(null);
  const [editingDocDraft, setEditingDocDraft] = useState<{ tipo: string; file_url: string; file_name: string } | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const editDocInputRef = useRef<HTMLInputElement>(null);

  const startEditDoc = (idx: number) => {
    const doc = data?.documentos_adicionales?.[idx];
    if (!doc) return;
    setEditingDocIdx(idx);
    setEditingDocDraft({ tipo: doc.tipo ?? "", file_url: doc.file_url, file_name: doc.file_name });
  };

  const cancelEditDoc = () => { setEditingDocIdx(null); setEditingDocDraft(null); };

  const saveEditDoc = async () => {
    if (editingDocIdx === null || !editingDocDraft) return;
    const previous = queryClient.getQueryData<import("@/hooks/useGetVisitTransportista").VisitaTransportista>(["visitaTransportista", id]);
    queryClient.setQueryData<import("@/hooks/useGetVisitTransportista").VisitaTransportista>(
      ["visitaTransportista", id],
      (old) => old ? { ...old, documentos_adicionales: old.documentos_adicionales?.map((d, i) =>
        i === editingDocIdx ? { ...d, ...editingDocDraft } : d
      ) } : old
    );
    cancelEditDoc();
    try {
      await saveBitacoraTransportistaRecord(id, "documentos", {
        documentos_adicionales: { ...editingDocDraft, index: editingDocIdx },
      });
      refetch();
      toast.success("Documento actualizado");
    } catch {
      queryClient.setQueryData(["visitaTransportista", id], previous);
      toast.error("Error al actualizar el documento");
    }
  };

  const handleEditDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingDocDraft) return;
    e.target.value = "";
    setUploadingDoc(true);
    const localUrl = URL.createObjectURL(file);
    setEditingDocDraft((p) => p ? { ...p, file_url: localUrl, file_name: file.name } : p);
    try {
      const res = await uploadImage(file);
      setEditingDocDraft((p) => p ? { ...p, file_url: res.file, file_name: res.file_name } : p);
    } catch {
      setEditingDocDraft((p) => p ? { ...p, file_url: p.file_url === localUrl ? "" : p.file_url } : p);
      toast.error("Error al subir el archivo");
    } finally {
      setUploadingDoc(false);
      URL.revokeObjectURL(localUrl);
    }
  };

  const tipoFromField = (field: "foto_conductor" | "foto_licencia") =>
    field === "foto_conductor" ? "foto_conductor" : tipoRequeridoSlug(IDENTIFICACION_CHOFER_LABEL);

  // Subida de un documento requerido específico — se guarda de inmediato
  // enviando el nombre del documento como `tipo` al servicio de guardado.
  const [uploadingReqDoc, setUploadingReqDoc] = useState<string | null>(null);
  const reqDocInputRef = useRef<HTMLInputElement>(null);
  const reqDocTargetRef = useRef<string | null>(null);

  const triggerReqDocUpload = (nombre: string) => {
    reqDocTargetRef.current = nombre;
    reqDocInputRef.current?.click();
  };

  const handleReqDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const nombre = reqDocTargetRef.current;
    e.target.value = "";
    reqDocTargetRef.current = null;
    if (!file || !nombre) return;
    setUploadingReqDoc(nombre);
    try {
      const res = await uploadImage(file);
      if (!res?.file) throw new Error("upload failed");
      await saveBitacoraTransportistaRecord(id, "documentos", {
        documentos_adicionales: { file_url: res.file, file_name: res.file_name ?? file.name, tipo: tipoRequeridoSlug(nombre), index: null },
      });
      refetch();
      toast.success("Documento guardado");
    } catch {
      toast.error("Error al subir el documento");
    } finally {
      setUploadingReqDoc(null);
    }
  };

  // Picker para encajar un documento pendiente con algo ya subido — misma
  // idea que el selector de foto de conductor/identificación.
  const [docAssignPicker, setDocAssignPicker] = useState<string | null>(null);

  const assignExistingDocToPendiente = async (nombre: string, fileUrl: string, fileName: string, index: number) => {
    setDocAssignPicker(null);
    const slug = tipoRequeridoSlug(nombre);
    const previous = queryClient.getQueryData<import("@/hooks/useGetVisitTransportista").VisitaTransportista>(["visitaTransportista", id]);
    queryClient.setQueryData<import("@/hooks/useGetVisitTransportista").VisitaTransportista>(
      ["visitaTransportista", id],
      (old) => old ? { ...old, documentos_adicionales: old.documentos_adicionales?.map((d, i) => i === index ? { ...d, tipo: slug } : d) } : old
    );
    try {
      await saveBitacoraTransportistaRecord(id, "documentos", {
        documentos_adicionales: { file_url: fileUrl, file_name: fileName, tipo: slug, index },
      });
      refetch();
      toast.success("Documento asignado");
    } catch {
      queryClient.setQueryData(["visitaTransportista", id], previous);
      toast.error("Error al asignar el documento");
    }
  };

  const [uploadingNewDoc, setUploadingNewDoc] = useState(false);
  const [analyzingDocs, setAnalyzingDocs] = useState(false);
  const newDocInputRef = useRef<HTMLInputElement>(null);

  // Documentos subidos en bloque desde "Pendientes" — solo se suben al storage
  // (para previsualizar/analizar), no se guardan en la bitácora hasta que el
  // usuario confirme con "Guardar documentos". `asignadoA` es el nombre del
  // documento pendiente al que quedó ligado (manual o por IA), en espera de guardar.
  type StagedDoc = { id: string; file_url: string; file_name: string; uploading: boolean; preview: string | null; tipo?: string; asignadoA?: string };
  const [stagedDocs, setStagedDocs] = useState<StagedDoc[]>([]);
  const stagingUpload = stagedDocs.some((d) => d.uploading);

  const removeStagedDoc = (id: string) =>
    setStagedDocs((p) => {
      const doc = p.find((d) => d.id === id);
      if (doc?.preview) URL.revokeObjectURL(doc.preview);
      return p.filter((d) => d.id !== id);
    });

  const stageDocumento = async (file: File) => {
    const id = Math.random().toString(36).slice(2);
    setStagedDocs((p) => [...p, { id, file_url: "", file_name: file.name, uploading: true, preview: URL.createObjectURL(file) }]);
    try {
      const res = await uploadImage(file);
      setStagedDocs((p) => p.map((d) => d.id === id ? { ...d, file_url: res?.file ?? "", file_name: res?.file_name ?? file.name, uploading: false } : d));
    } catch {
      setStagedDocs((p) => p.filter((d) => d.id !== id));
      toast.error("Error al subir el documento");
    }
  };

  // Ligar (o quitar) un documento recién subido a un pendiente — no guarda
  // nada todavía, solo lo marca para que "Guardar documentos" lo persista.
  const marcarAsignacionStaged = (stagedId: string, nombre: string) =>
    setStagedDocs((p) => p.map((d) => d.id === stagedId ? { ...d, asignadoA: nombre } : d));

  const desasignarStaged = (stagedId: string) =>
    setStagedDocs((p) => p.map((d) => d.id === stagedId ? { ...d, asignadoA: undefined } : d));

  const [savingStagedDocs, setSavingStagedDocs] = useState(false);
  const guardarDocumentosPendientes = async () => {
    const asignados = stagedDocs.filter((d) => d.asignadoA && d.file_url && !d.uploading);
    if (!asignados.length) return;
    setSavingStagedDocs(true);
    try {
      await Promise.all(asignados.map((d) =>
        saveBitacoraTransportistaRecord(id, "documentos", {
          documentos_adicionales: { file_url: d.file_url, file_name: d.file_name, tipo: tipoRequeridoSlug(d.asignadoA as string), index: null },
        })
      ));
      // Optimista: ya sabemos que se guardaron bien, así que se marcan como
      // subidos de inmediato (para que la fila de pendientes no "parpadee" de
      // vuelta a rojo mientras el refetch trae la confirmación del servidor).
      queryClient.setQueryData<import("@/hooks/useGetVisitTransportista").VisitaTransportista>(
        ["visitaTransportista", id],
        (old) => old ? {
          ...old,
          documentos_adicionales: [
            ...(old.documentos_adicionales ?? []),
            ...asignados.map((d) => ({ file_url: d.file_url, file_name: d.file_name, tipo: tipoRequeridoSlug(d.asignadoA as string) })),
          ],
        } : old
      );
      setStagedDocs((p) => p.filter((d) => !asignados.includes(d)));
      refetch();
      toast.success(asignados.length > 1 ? "Documentos guardados" : "Documento guardado");
    } catch {
      toast.error("Error al guardar los documentos");
    } finally {
      setSavingStagedDocs(false);
    }
  };

  const handleAddDocumento = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;

    // Pendientes: solo subir a storage, sin llamar al servicio de guardado
    if (docTab === "pendientes") {
      files.forEach(stageDocumento);
      return;
    }

    // Subidos: sube y guarda de inmediato en la bitácora
    setUploadingNewDoc(true);
    try {
      for (const file of files) {
        const res = await uploadImage(file);
        if (!res?.file) continue;
        await saveBitacoraTransportistaRecord(id, "documentos", {
          documentos_adicionales: { file_url: res.file, file_name: res.file_name, index: null },
        });
      }
      refetch();
      toast.success(files.length > 1 ? "Documentos agregados" : "Documento agregado");
    } catch {
      toast.error("Error al subir el documento");
    } finally {
      setUploadingNewDoc(false);
    }
  };

  const handleAnalizarDocumentos = async () => {
    // En "pendientes" se analizan los documentos recién subidos (aún no guardados);
    // en "subidos" se analizan los ya persistidos en la bitácora.
    const usingStaged = docTab === "pendientes";
    const source = usingStaged
      ? stagedDocs.filter((d) => d.file_url).map((d) => ({ file_url: d.file_url, file_name: d.file_name }))
      : (data?.documentos_adicionales ?? []).filter((d) => d.file_url).map((d) => ({ file_url: d.file_url, file_name: d.file_name }));
    if (!source.length) return;
    setAnalyzingDocs(true);
    try {
      const result = await ocrAccesoTransportista(source);
      const detectados = (result?.response?.data?.data?.documentos_detectados ?? []) as { url: string; tipo: string }[];
      if (Array.isArray(detectados) && detectados.length) {
        const byUrl = new Map(detectados.map((dd) => [dd.url, dd.tipo]));

        if (usingStaged) {
          // Solo actualiza tipo/asignación localmente — sin llamar al servicio
          // de guardado. Si el tipo detectado coincide con un pendiente que
          // sigue sin resolver, se coloca ahí automáticamente (sin duplicar
          // el mismo pendiente entre dos documentos de este lote).
          // El updater debe ser puro (React lo invoca 2 veces en modo estricto
          // de desarrollo para detectar efectos secundarios): todo el cálculo
          // de "quién queda asignado a quién" vive dentro de la propia función,
          // sin mutar nada externo entre invocaciones.
          let autoColocados = 0;
          setStagedDocs((prev) => {
            const yaAsignados = new Set(prev.filter((d) => d.asignadoA).map((d) => d.asignadoA));
            let colocadosEnEstaPasada = 0;
            const next = prev.map((d) => {
              if (!byUrl.has(d.file_url)) return d;
              const detectedTipo = byUrl.get(d.file_url);
              let asignadoA = d.asignadoA;
              if (!asignadoA) {
                const nombreMatch = documentosRequeridosNombres.find((n) =>
                  tipoRequeridoSlug(n) === detectedTipo && docsPendientesReq.includes(n) && !yaAsignados.has(n)
                );
                if (nombreMatch) { asignadoA = nombreMatch; yaAsignados.add(nombreMatch); colocadosEnEstaPasada++; }
              }
              return { ...d, tipo: detectedTipo, asignadoA };
            });
            autoColocados = colocadosEnEstaPasada;
            return next;
          });
          toast.success(
            autoColocados > 0
              ? `Documentos analizados — ${autoColocados} colocado${autoColocados > 1 ? "s" : ""} automáticamente`
              : "Documentos analizados — ninguno coincidió con un pendiente, revisa las sugerencias",
          );
        } else {
          const docs = data?.documentos_adicionales ?? [];
          const previous = queryClient.getQueryData<import("@/hooks/useGetVisitTransportista").VisitaTransportista>(["visitaTransportista", id]);
          queryClient.setQueryData<import("@/hooks/useGetVisitTransportista").VisitaTransportista>(
            ["visitaTransportista", id],
            (old) => old ? { ...old, documentos_adicionales: old.documentos_adicionales?.map((d) => byUrl.has(d.file_url) ? { ...d, tipo: byUrl.get(d.file_url) } : d) } : old
          );
          try {
            await Promise.all(
              docs.map((d, idx) =>
                byUrl.has(d.file_url)
                  ? saveBitacoraTransportistaRecord(id, "documentos", {
                      documentos_adicionales: { file_url: d.file_url, file_name: d.file_name, tipo: byUrl.get(d.file_url), index: idx },
                    })
                  : null
              )
            );
            refetch();
            toast.success("Documentos analizados");
          } catch {
            queryClient.setQueryData(["visitaTransportista", id], previous);
            toast.error("Error al guardar el análisis");
          }
        }
      } else {
        toast.success("Análisis completado, sin documentos por clasificar");
      }
    } catch {
      toast.error("Error al analizar los documentos");
    } finally {
      setAnalyzingDocs(false);
    }
  };

  const saveFotoConductor = async (field: "foto_conductor" | "foto_licencia", file_url: string, file_name: string, index?: number) => {
    setFotoPicker(null);
    const tipo = tipoFromField(field);
    // Si no se pasa index (archivo nuevo), buscar si ya existe uno con ese tipo para actualizarlo
    const docs = queryClient.getQueryData<import("@/hooks/useGetVisitTransportista").VisitaTransportista>(["visitaTransportista", id])?.documentos_adicionales ?? [];
    const resolvedIndex = index !== undefined ? index : (docs.findIndex((d) => d.tipo === tipo) >= 0 ? docs.findIndex((d) => d.tipo === tipo) : null);
    const previous = queryClient.getQueryData<import("@/hooks/useGetVisitTransportista").VisitaTransportista>(["visitaTransportista", id]);
    // Optimistic update — muestra la imagen de inmediato
    queryClient.setQueryData<import("@/hooks/useGetVisitTransportista").VisitaTransportista>(
      ["visitaTransportista", id],
      (old) => old ? { ...old, conductor: old.conductor ? { ...old.conductor, [field]: { file_url, file_name } } : old.conductor } : old
    );
    try {
      await saveBitacoraTransportistaRecord(id, "documentos", {
        documentos_adicionales: { file_url, file_name, tipo, index: resolvedIndex },
      });
      refetch();
      toast.success("Imagen actualizada");
    } catch {
      queryClient.setQueryData(["visitaTransportista", id], previous);
      toast.error("Error al guardar la imagen");
    }
  };

  const deleteDocumento = async (index: number) => {
    const previous = queryClient.getQueryData<import("@/hooks/useGetVisitTransportista").VisitaTransportista>(["visitaTransportista", id]);
    queryClient.setQueryData<import("@/hooks/useGetVisitTransportista").VisitaTransportista>(
      ["visitaTransportista", id],
      (old) => old ? { ...old, documentos_adicionales: old.documentos_adicionales?.filter((_, i) => i !== index) } : old
    );
    try {
      await saveBitacoraTransportistaRecord(id, "documentos", { delete_documentos: [index] });
      refetch();
      toast.success("Archivo eliminado");
    } catch {
      queryClient.setQueryData(["visitaTransportista", id], previous);
      toast.error("Error al eliminar el archivo");
    }
  };

  const handleFotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fotoPicker) return;
    const field = fotoPicker;
    e.target.value = "";
    setFotoPicker(null);
    setUploadingFotoConductor(true);
    // Preview local mientras sube
    const localUrl = URL.createObjectURL(file);
    const previous = queryClient.getQueryData<import("@/hooks/useGetVisitTransportista").VisitaTransportista>(["visitaTransportista", id]);
    queryClient.setQueryData<import("@/hooks/useGetVisitTransportista").VisitaTransportista>(
      ["visitaTransportista", id],
      (old) => old ? { ...old, conductor: old.conductor ? { ...old.conductor, [field]: { file_url: localUrl, file_name: file.name } } : old.conductor } : old
    );
    try {
      const res = await uploadImage(file);
      await saveFotoConductor(field, res.file, res.file_name);
    } catch {
      queryClient.setQueryData(["visitaTransportista", id], previous);
      toast.error("Error al subir la imagen");
    } finally {
      setUploadingFotoConductor(false);
      URL.revokeObjectURL(localUrl);
    }
  };

  // Etapas derivadas del estatus real del registro
  const estatus = data?.estatus ?? "";
  const ORDEN_ESTATUS = ["arribo", "inspeccion_entrada", "carga_descarga", "inspeccion_salida", "terminado"];
  const estatusIdx = ORDEN_ESTATUS.indexOf(estatus);
  const arriboDone  = estatusIdx > 0;
  const entradaDone = estatusIdx > 1;
  const cargaDone   = estatusIdx > 2;
  const salidaDone  = estatusIdx > 3;

  // Inspecciones — valores estructurales (no vienen del API aún)
  const inspecciones = {
    entrada: { completados: 0, total: 17 },
    salida: { completados: 0, total: 17 },
    sello: {
      completados: (data?.inspecciones ?? []).filter((i) => i.tipo.startsWith("sello_")).length,
      total: unidades.length,
    },
  };

  const tiposSubidos = new Set(
    (data?.documentos_adicionales ?? [])
      .map((d) => d.tipo)
      .filter((t): t is string => !!t)
      .map(tipoSlug),
  );
  const docsPendientesReq = documentosRequeridosNombres.filter((nombre) => !tiposSubidos.has(tipoRequeridoSlug(nombre)));

  const tipo_accion = data?.tipo_operacion?.toLowerCase().includes("entrega")
    ? "ENTRADA"
    : data?.tipo_operacion?.toLowerCase().includes("recolec")
      ? "SALIDA"
      : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Top bar skeleton */}
        <div className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm px-4 py-2">
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="h-3 w-48" />
            <div className="flex-1" />
            <Skeleton className="h-7 w-28 rounded-lg" />
          </div>
          <div className="pb-4">
            <Skeleton className="h-8 w-full rounded-xl" />
          </div>
        </div>

        {/* Body skeleton */}
        <div className="flex gap-4 p-4 w-full">
          {/* Sidebar izquierda */}
          <div className="w-64 shrink-0 flex flex-col gap-3">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-3">
              <Skeleton className="h-4 w-24" />
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-24 rounded-xl" />
              </div>
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 rounded-lg" />)}
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-3">
              <Skeleton className="h-4 w-32" />
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-8 rounded-lg" />)}
            </div>
          </div>

          {/* Contenido central */}
          <div className="flex-1 flex flex-col gap-3 min-w-0">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-3">
              <Skeleton className="h-4 w-40" />
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 rounded-xl" />)}
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-3">
              <Skeleton className="h-4 w-32" />
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 rounded-xl" />)}
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-3">
              <Skeleton className="h-4 w-36" />
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 rounded-xl" />)}
            </div>
          </div>

          {/* Panel derecho */}
          <div className="w-72 shrink-0 flex flex-col gap-3">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-3">
              <Skeleton className="h-4 w-28" />
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 rounded-xl" />)}
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-3">
              <Skeleton className="h-4 w-32" />
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 rounded-xl" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              arriboDone={arriboDone}
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
            {/* Input oculto para subir nueva foto */}
            <input ref={fotoInputRef} type="file" accept="image/*" className="hidden" onChange={handleFotoUpload} />

            <div className="grid grid-cols-2 gap-2">
              {/* Foto conductor */}
              {(() => {
                const url = data?.conductor?.foto_conductor?.file_url
                  ?? data?.documentos_adicionales?.find((d) => d.tipo === "foto_conductor")?.file_url;
                return (
                  <button type="button" onClick={() => setFotoPicker("foto_conductor")}
                    className="h-24 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden flex flex-col items-center justify-center gap-1.5 relative group hover:border-blue-300 transition-colors">
                    {url ? (
                      <>
                        <img src={url} alt="Conductor" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Pencil className="w-4 h-4 text-white" />
                        </div>
                      </>
                    ) : (
                      <>
                        <Camera className="w-5 h-5 text-gray-300 group-hover:text-blue-400 transition-colors" />
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">FOTO</span>
                      </>
                    )}
                    <div className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full bg-white shadow flex items-center justify-center">
                      <Pencil className="w-2.5 h-2.5 text-gray-500" />
                    </div>
                  </button>
                );
              })()}
              {/* Foto licencia */}
              {(() => {
                const url = data?.conductor?.foto_licencia?.file_url
                  ?? data?.documentos_adicionales?.find((d) => d.tipo === tipoRequeridoSlug(IDENTIFICACION_CHOFER_LABEL))?.file_url;
                return (
                  <button type="button" onClick={() => setFotoPicker("foto_licencia")}
                    className="h-24 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden flex flex-col items-center justify-center gap-1.5 relative group hover:border-blue-300 transition-colors">
                    {url ? (
                      <>
                        <img src={url} alt="Licencia" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Pencil className="w-4 h-4 text-white" />
                        </div>
                      </>
                    ) : (
                      <>
                        <FileText className="w-5 h-5 text-gray-300 group-hover:text-blue-400 transition-colors" />
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">IDENTIFICACIÓN</span>
                      </>
                    )}
                    <div className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full bg-white shadow flex items-center justify-center">
                      <Pencil className="w-2.5 h-2.5 text-gray-500" />
                    </div>
                  </button>
                );
              })()}
            </div>

            {/* Picker de foto — renderizado via portal para escapar el stacking context */}
            {fotoPicker && typeof document !== "undefined" && createPortal(
              <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setFotoPicker(null)}>
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <p className="text-sm font-bold text-gray-800">
                      {fotoPicker === "foto_conductor" ? "Foto del conductor" : "Identificación"}
                    </p>
                    <button type="button" onClick={() => setFotoPicker(null)} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Opción: subir nueva */}
                  <button type="button" disabled={uploadingFotoConductor}
                    onClick={() => fotoInputRef.current?.click()}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <Camera className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-semibold text-gray-700">Subir nueva imagen</p>
                      <p className="text-[10px] text-gray-400">Selecciona un archivo de tu dispositivo</p>
                    </div>
                    {uploadingFotoConductor && <div className="ml-auto w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />}
                  </button>

                  {/* Opción: seleccionar de documentos existentes */}
                  {(() => {
                    const docs = data?.documentos_adicionales ?? [];
                    if (docs.length === 0) return null;
                    return (
                      <div className="px-4 py-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Del registro</p>
                        <div className="space-y-1.5">
                          {docs.map((doc, docIdx) => (
                            <button key={doc.file_url} type="button"
                              onClick={() => saveFotoConductor(fotoPicker, doc.file_url, doc.file_name ?? "", docIdx)}
                              className="w-full flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-blue-50 transition-colors text-left">
                              <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-100 shrink-0">
                                <img src={doc.file_url} alt="" className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-semibold text-gray-700 truncate">
                                  {doc.tipo ? doc.tipo.replace(/_/g, " ") : doc.file_name}
                                </p>
                                <p className="text-[10px] text-gray-400 truncate">{doc.file_name}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  <div className="px-4 pb-4 pt-2">
                    <button type="button" onClick={() => setFotoPicker(null)}
                      className="w-full py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors">
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>,
              document.body
            )}
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
                <Field label="Tipo de Operación" value={capitalizeOnlyFirstLetter(data?.tipo_operacion)} />
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
                    {docsPendientesReq.length}
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
                    {data?.documentos_adicionales?.length ?? 0}
                  </span>
                </button>
              </div>
            </div>
            <div className="p-4 space-y-2">
              {docTab === "pendientes" && docsPendientesReq.map((nombre) => {
                const isUploading = uploadingReqDoc === nombre;
                const staged = stagedDocs.find((d) => d.asignadoA === nombre);

                if (staged) {
                  return (
                    <div key={nombre}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 border border-violet-200 bg-violet-50/40">
                      <div className="w-9 h-9 rounded-lg overflow-hidden border border-violet-100 bg-white shrink-0 flex items-center justify-center">
                        {staged.preview
                          ? <img src={staged.preview} alt="" className="w-full h-full object-cover" />
                          : <FileText className="w-4 h-4 text-violet-300" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{nombre}</p>
                        <p className="text-[11px] truncate mt-0.5 text-violet-600 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" /> Listo para guardar — {staged.file_name}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => desasignarStaged(staged.id)}
                        title="Quitar asignación"
                        className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:border-red-300 hover:bg-red-50 flex items-center justify-center shrink-0 transition-colors text-gray-400 hover:text-red-500">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={nombre}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 border border-red-100 bg-red-50/30 hover:bg-red-50/60 transition-colors">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-red-100 text-red-500">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{nombre}</p>
                      <p className="text-[11px] truncate mt-0.5 text-red-500">
                        {DOCUMENTOS_REQUERIDOS_DESCRIPCION[nombre] ?? "Pendiente de subir"}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => triggerReqDocUpload(nombre)}
                      title="Tomar / subir nueva foto"
                      className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 flex items-center justify-center shrink-0 transition-colors disabled:opacity-60">
                      {isUploading
                        ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <Camera className="w-3.5 h-3.5 text-white" />}
                    </button>
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => setDocAssignPicker(nombre)}
                      title="Asignar documento ya subido"
                      className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 flex items-center justify-center shrink-0 transition-colors disabled:opacity-60">
                      <ArrowLeftRight className="w-3.5 h-3.5 text-gray-500" />
                    </button>
                  </div>
                );
              })}
              <input ref={reqDocInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleReqDocUpload} />

              {/* Picker para encajar un documento pendiente — subir nuevo o elegir uno ya subido */}
              {docAssignPicker && typeof document !== "undefined" && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setDocAssignPicker(null)}>
                  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
                      <p className="text-sm font-bold text-gray-800">{docAssignPicker}</p>
                      <button type="button" onClick={() => setDocAssignPicker(null)} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Opción: recién subidos (aún sin guardar) */}
                    {stagedDocs.filter((d) => d.file_url && !d.uploading).length > 0 && (
                      <div className="px-4 py-2 border-b border-gray-50">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Recién subidos</p>
                        <div className="space-y-1.5">
                          {stagedDocs.filter((d) => d.file_url && !d.uploading).map((doc) => (
                            <button key={doc.id} type="button"
                              onClick={() => { const nombre = docAssignPicker; setDocAssignPicker(null); marcarAsignacionStaged(doc.id, nombre); }}
                              className="w-full flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-blue-50 transition-colors text-left disabled:opacity-50">
                              <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-100 shrink-0">
                                {doc.preview && <img src={doc.preview} alt="" className="w-full h-full object-cover" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-semibold text-gray-700 truncate">{doc.file_name}</p>
                                {doc.asignadoA && <p className="text-[10px] text-gray-400 truncate">Actualmente: {doc.asignadoA}</p>}
                                {doc.tipo && !doc.asignadoA && <p className="text-[10px] text-violet-500 truncate">Sugerido por IA: {doc.tipo}</p>}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Opción: seleccionar de documentos existentes */}
                    {(() => {
                      const docs = data?.documentos_adicionales ?? [];
                      if (docs.length === 0) return null;
                      return (
                        <div className="px-4 py-2">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Del registro</p>
                          <div className="space-y-1.5">
                            {docs.map((doc, docIdx) => (
                              <button key={doc.file_url} type="button"
                                onClick={() => assignExistingDocToPendiente(docAssignPicker, doc.file_url, doc.file_name ?? "", docIdx)}
                                className="w-full flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-blue-50 transition-colors text-left">
                                <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-100 shrink-0">
                                  <img src={doc.file_url} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[11px] font-semibold text-gray-700 truncate">
                                    {doc.tipo ? doc.tipo.replace(/_/g, " ") : doc.file_name}
                                  </p>
                                  <p className="text-[10px] text-gray-400 truncate">{doc.file_name}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {stagedDocs.filter((d) => d.file_url && !d.uploading).length === 0
                      && (data?.documentos_adicionales?.length ?? 0) === 0 && (
                      <p className="px-4 py-6 text-center text-xs text-gray-400">
                        Aún no hay documentos subidos para asignar.
                      </p>
                    )}

                    <div className="px-4 pb-4 pt-2">
                      <button type="button" onClick={() => setDocAssignPicker(null)}
                        className="w-full py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors">
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>,
                document.body
              )}

              {/* Input oculto para reemplazar archivo al editar */}
              <input ref={editDocInputRef} type="file" className="hidden" onChange={handleEditDocUpload} />

              {/* Documentos subidos desde el acceso (documentos_adicionales) */}
              {docTab === "subidos" && data?.documentos_adicionales?.map((doc, docIdx) => {
                const isEditing = editingDocIdx === docIdx;
                const draft = isEditing ? editingDocDraft : null;
                const displayUrl = draft?.file_url ?? doc.file_url;
                const displayName = draft?.file_name ?? doc.file_name;
                const isImg = /\.(jpe?g|png|gif|webp)$/i.test(displayName);
                const tipoLabel = doc.tipo ? doc.tipo.replace(/_/g, " ").toUpperCase() : doc.file_name;

                if (isEditing && draft) {
                  // Opciones del select: los documentos aún pendientes + el que ya
                  // trae este archivo (para que se muestre seleccionado aunque ya
                  // esté cubierto por otro lado).
                  const tipoOptions = documentosRequeridosNombres.filter(
                    (nombre) => !tiposSubidos.has(tipoRequeridoSlug(nombre)) || tipoRequeridoSlug(nombre) === draft.tipo,
                  );
                  return (
                    <div key={doc.file_url} className="rounded-xl border-2 border-blue-200 bg-blue-50/30 p-3.5 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-lg overflow-hidden border border-white shadow-sm bg-white shrink-0 flex items-center justify-center">
                          {isImg && displayUrl ? (
                            <img src={displayUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <FileText className="w-5 h-5 text-gray-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-700 truncate">{displayName || "Sin archivo"}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">Editando documento</p>
                        </div>
                        <button type="button" disabled={uploadingDoc}
                          onClick={() => editDocInputRef.current?.click()}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-[10px] font-semibold text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors shrink-0">
                          {uploadingDoc
                            ? <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                            : <Camera className="w-3 h-3" />}
                          Reemplazar
                        </button>
                      </div>

                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Tipo de documento</p>
                        <select
                          value={draft.tipo}
                          onChange={(e) => setEditingDocDraft((p) => p ? { ...p, tipo: e.target.value } : p)}
                          className="w-full h-9 rounded-lg border border-gray-200 px-2.5 text-xs bg-white focus:outline-none focus:border-blue-400">
                          <option value="">Sin asignar</option>
                          {tipoOptions.map((nombre) => (
                            <option key={nombre} value={tipoRequeridoSlug(nombre)}>{nombre}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex gap-2 justify-end pt-1 border-t border-blue-100">
                        <button type="button" onClick={cancelEditDoc}
                          className="px-3 py-1.5 text-[10px] font-semibold text-gray-500 hover:text-gray-700 transition-colors">
                          Cancelar
                        </button>
                        <button type="button" onClick={saveEditDoc} disabled={uploadingDoc}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-[10px] font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50">
                          <Save className="w-3 h-3" />
                          Guardar
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={doc.file_url} className="flex items-center gap-2">
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-1 items-center gap-3 rounded-xl px-3 py-2.5 border border-gray-100 bg-white hover:bg-gray-50 cursor-pointer transition-colors min-w-0">
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
                    <button type="button" onClick={() => startEditDoc(docIdx)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-blue-400 hover:bg-blue-50 transition-colors shrink-0">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => deleteDocumento(docIdx)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}

              {docTab === "pendientes" && stagedDocs.some((d) => !d.asignadoA) && (
                <div className="space-y-1.5 pb-1">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Sin asignar</p>
                  <div className="flex flex-wrap gap-2">
                    {stagedDocs.filter((d) => !d.asignadoA).map((doc) => (
                      <div key={doc.id} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 shrink-0">
                        {doc.uploading ? (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                          </div>
                        ) : doc.preview ? (
                          <img src={doc.preview} className="w-full h-full object-cover" alt="" />
                        ) : null}
                        {doc.tipo && !doc.uploading && (
                          <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] font-bold text-center py-0.5 truncate px-1">
                            {doc.tipo.replace(/_/g, " ")}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeStagedDoc(doc.id)}
                          className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors">
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {stagedDocs.length === 0 && (docTab === "pendientes" ? docsPendientesReq.length === 0 : !data?.documentos_adicionales?.length) && (
                <div className="flex flex-col items-center justify-center py-8 text-gray-300">
                  <FileText className="w-8 h-8 mb-2" />
                  <p className="text-xs">
                    {docTab === "pendientes"
                      ? "No hay documentos pendientes"
                      : "Aún no hay documentos subidos"}
                  </p>
                </div>
              )}
              <input ref={newDocInputRef} type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={handleAddDocumento} />
              {docTab === "pendientes" && stagedDocs.length === 0 ? (
                <button
                  type="button"
                  disabled={stagingUpload}
                  onClick={() => newDocInputRef.current?.click()}
                  className="w-full rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/40 hover:border-blue-300 hover:bg-blue-50/40 transition-all flex flex-col items-center justify-center gap-1.5 py-5 disabled:opacity-60 disabled:cursor-not-allowed">
                  {stagingUpload ? (
                    <>
                      <span className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-gray-400 font-medium">Subiendo...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-5 h-5 text-gray-300" />
                      <span className="text-sm text-gray-400 font-medium">Subir imágenes o archivos</span>
                      <span className="text-[11px] text-gray-300">Puedes seleccionar múltiples archivos</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={docTab === "pendientes" ? stagingUpload : uploadingNewDoc}
                  onClick={() => newDocInputRef.current?.click()}
                  className="w-full h-9 mt-1 rounded-xl border border-dashed border-gray-300 hover:border-blue-300 hover:bg-blue-50/40 text-xs font-medium text-gray-400 hover:text-blue-600 transition-all flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed">
                  {(docTab === "pendientes" ? stagingUpload : uploadingNewDoc) ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Camera className="w-3.5 h-3.5" />
                      {docTab === "pendientes" ? "Agregar más documentos" : "Tomar foto a otro documento"}
                    </>
                  )}
                </button>
              )}
              {(() => {
                const hasAnalyzable = docTab === "pendientes"
                  ? stagedDocs.some((d) => d.file_url)
                  : (data?.documentos_adicionales?.some((d) => d.file_url) ?? false);
                const analyzeDisabled = analyzingDocs || !hasAnalyzable;
                return (
                  <button
                    type="button"
                    disabled={analyzeDisabled}
                    onClick={handleAnalizarDocumentos}
                    className={cn(
                      "w-full h-9 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 border-2",
                      analyzeDisabled
                        ? "border-gray-200 bg-white text-gray-300 cursor-not-allowed"
                        : "border-violet-300 bg-violet-50 text-violet-600 hover:bg-violet-100 hover:border-violet-400",
                    )}>
                    {analyzingDocs ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                        Analizando documentos...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        Analizar con IA
                      </>
                    )}
                  </button>
                );
              })()}
              {docTab === "pendientes" && (() => {
                const asignados = stagedDocs.filter((d) => d.asignadoA);
                const guardarDisabled = savingStagedDocs || asignados.length === 0;
                return (
                  <button
                    type="button"
                    disabled={guardarDisabled}
                    onClick={guardarDocumentosPendientes}
                    className={cn(
                      "w-full h-9 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5",
                      guardarDisabled
                        ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white",
                    )}>
                    {savingStagedDocs ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        Guardar documentos{asignados.length > 0 ? ` (${asignados.length})` : ""}
                      </>
                    )}
                  </button>
                );
              })()}
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
              {savingUnidades && (
                <span className="text-[11px] font-semibold text-blue-500 flex items-center gap-1.5 ml-auto">
                  <span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  Guardando…
                </span>
              )}
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
                          <button type="button" disabled={savingUnidades} onClick={() => setEditingUnit(u)}
                            className="w-6 h-6 rounded-md hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button type="button" disabled={savingUnidades} onClick={() => {
                            const next = unidades.filter((x) => x.id !== u.id);
                            setUnidades(next);
                            persistUnidades(next, deletionsFromUnit(u));
                          }}
                            className="w-6 h-6 rounded-md hover:bg-red-50 flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
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
                                  <div className="w-3.5 h-3.5 rounded-full border border-gray-200" style={{ background: resolveColorSwatch(u.remolque.color)?.hex ?? "transparent" }} />
                                  <span className="text-xs text-gray-600">{resolveColorSwatch(u.remolque.color)?.label}</span>
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
                                    <div className="w-3.5 h-3.5 rounded-full border border-gray-200" style={{ background: resolveColorSwatch(u.contenedor.color)?.hex ?? "transparent" }} />
                                    <span className="text-xs text-gray-600">{resolveColorSwatch(u.contenedor.color)?.label}</span>
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
                  <button type="button" disabled={savingUnidades} onClick={() => setShowAgregarUnidad(true)}
                    className="w-full border-2 border-dashed border-blue-200 rounded-xl py-3.5 text-sm font-semibold text-blue-500 hover:border-blue-400 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
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
            // Solo tractor/remolque/contenedor pertenecen a esta inspección —
            // excluye otros tipos que compartan el mismo arreglo (ej. "sello_N").
            const inspecsDone = (data?.inspecciones ?? []).filter((i) =>
              i.tipo === "tractor" || i.tipo.startsWith("remolque_") || i.tipo.startsWith("contenedor_")
            );
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

          {/* Inspección de sello */}
          {(() => {
            const selloTodasDone = inspecciones.sello.total > 0 && inspecciones.sello.completados >= inspecciones.sello.total;
            const sinUnidades = unidades.length === 0;
            return (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-teal-500" />
                    <span className="text-sm font-bold text-gray-800">
                      Inspección de sello
                    </span>
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                    selloTodasDone ? "bg-green-100 text-green-700" : "bg-teal-100 text-teal-700",
                  )}>
                    {selloTodasDone ? "Completa" : "Pendiente"}
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
                      {sinUnidades
                        ? "Agrega un remolque para poder inspeccionar el sello"
                        : selloTodasDone
                          ? "Inspección de sello completa"
                          : "Inspección de sello pendiente"}
                    </p>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Método VVTT (View · Verify · Tug · Twist) sobre el sello clase
                      H.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={sinUnidades}
                    onClick={() => setShowInspeccionSello(true)}
                    className={cn(
                      "w-full h-9 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
                      selloTodasDone ? "bg-white border border-teal-200 text-teal-700 hover:bg-teal-50" : "bg-teal-900 hover:bg-teal-800 text-white",
                    )}>
                    <Shield className="w-3.5 h-3.5" />
                    {selloTodasDone ? "Ver inspección de sello" : "Realizar inspección de sello"}
                  </button>
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
        </div>
      </div>
      {showInspeccion && (
        <InspeccionEntradaModal
          recordId={id}
          unidades={unidades}
          inspeccionesDone={data?.inspecciones ?? []}
          onClose={() => setShowInspeccion(false)}
          onSaved={refetch}
        />
      )}
      {showInspeccionSello && (
        <InspeccionSelloModal
          recordId={id}
          unidades={unidades}
          inspeccionesDone={data?.inspecciones ?? []}
          onClose={() => setShowInspeccionSello(false)}
          onSaved={refetch}
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
