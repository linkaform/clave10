"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScanQrCameraModal } from "@/components/modals/scan-qr-camera-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  FileText,
  Link2,
  Loader2,
  Package,
  Search,
  Sparkles,
  Truck,
} from "lucide-react";
import { cn, errorMsj, reemplazarGuionMinuscula } from "@/lib/utils";
import { useUploadImage } from "@/hooks/useUploadImage";
import { useBoothStore } from "@/store/useBoothStore";
import { getPassTransportista, createVisitTransportista, ocrAccesoTransportista } from "@/services/endpoints";
import { TIPOS_DOCUMENTO_SUBIDA, tieneMinCaracteres } from "@/config/documentos-transportista";
import { toast } from "sonner";
import {
  type UnidadItem,
  type MaterialCarga,
  type ContenedorData,
  emptyUnidad,
  emptyMaterial,
  emptyContenedorData,
  serializeUnidades,
  faltantesCarga,
  cajaRapidaOpcional,
  unidadesARegistrar,
  soloMaterialDelVehiculo,
  emptyCajaRapida,
  type CajaRapida,
  materialesDeUnidad,
} from "@/components/transportista/agregar-unidad-modal";
import { CapturaFotosDocumentos, etiquetaDeFoto, type OpcionFoto } from "@/components/transportista/captura-fotos-documentos";
import { VisorFotosModal } from "@/components/transportista/visor-fotos-modal";
import { RenglonesRemolque } from "@/components/transportista/renglones-remolque";
import { MaterialesCarga } from "@/components/transportista/materiales-carga";
import { SelectorTipoVehiculo, GaleriaTipoVehiculo, resolverTipoVehiculo, camposDeVehiculo } from "@/components/transportista/selector-tipo-vehiculo";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

// Registrar llegada de pase — mismo flujo simplificado que Nuevo Acceso
// Transportista (2610-1323 / 2610-1382): buscar pase → fotos primero →
// formulario de pantalla única. Lo propio de este modal es el buscador del
// pase, la precarga de sus datos y mandar num_de_pase para que el back
// convierta la bitácora "programado" en "arribo".

// ─── Types ───────────────────────────────────────────────────────────────────

// Material tal como lo regresa el análisis de IA — puede venir suelto a nivel
// del documento o ya ligado dentro de un remolque/contenedor específico.
interface RawMaterialAI {
  producto?: string;
  lote?: string;
  cant_esperada?: string;
  peso?: string;
  volumen?: string;
  no_orden_compra?: string; // aún sin campo propio en MaterialCarga — no se mapea
}

type TipoOperacion = "Entrega" | "Recolección";

// Mismo vocabulario que Nuevo Acceso y el detalle de la visita
// (config/documentos-transportista.ts).
const DOC_TYPES = TIPOS_DOCUMENTO_SUBIDA;

interface DocItem {
  id:        string;
  file_url:  string;
  file_name: string;
  uploading: boolean;
  preview:   string | null;
  tipo?:     string;
  // Opción de la cámara (Conductor, Vehículo, Carga) y pista para la IA.
  opcion?:   string;
  hint?:     string;
  // true cuando el tipo quedó fijo — la IA no lo sobrescribe.
  tipoManual?: boolean;
}

// Documento capturado al crear el pase (BL, factura, etc.) — de solo lectura
// aquí, no se sube de nuevo.
interface DocumentoDelPase {
  tipo: string;
  noDoc: string;
  archivo: { file_name?: string; file_url?: string } | null;
}

interface ArchivoPase { file_name?: string; file_url?: string }

// El QR del pase codifica la URL completa del preview público
// (/transportistas/preview/transportista/{id}?p_id=...), no el id en texto
// plano — se extrae el último segmento de la ruta antes de buscar. Si el
// texto escaneado no es una URL (QRs antiguos o folio tecleado a mano), se
// usa tal cual.
const extraerIdDePase = (raw: string): string => {
  const texto = raw.trim();
  try {
    const url = new URL(texto);
    const segmentos = url.pathname.split("/").filter(Boolean);
    const ultimo = segmentos.at(-1);
    if (ultimo) return decodeURIComponent(ultimo);
  } catch {
    // no es una URL válida — se usa el texto tal cual
  }
  return texto;
};

// El campo "Vigencia de Licencia" de la bitácora es tipo fecha: Linkaform
// rechaza el registro completo ("Este campo debe ser una fecha") si recibe
// otro formato. La vigencia que trae el pase la captura el transportista en
// el formulario público, así que se normaliza a YYYY-MM-DD; si no se
// reconoce como fecha se descarta en vez de bloquear el registro.
const normalizarFecha = (valor: string): string => {
  const v = (valor || "").trim();
  if (!v) return "";
  const valida = (y: string, m: string, d: string) => {
    const iso = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    const fecha = new Date(`${iso}T00:00:00`);
    return !Number.isNaN(fecha.getTime()) && fecha.toISOString().startsWith(iso) ? iso : "";
  };
  const isoMatch = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) return valida(isoMatch[1], isoMatch[2], isoMatch[3]);
  const mxMatch = v.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (mxMatch) return valida(mxMatch[3], mxMatch[2], mxMatch[1]);
  return "";
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5 block">
      {children}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );
}

function SectionDivider({ label, icon }: { label: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 pt-1 pb-0.5">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-widest shrink-0">
        {icon}
        {label}
      </div>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );
}

function IaBadge() {
  return (
    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[9px] font-bold text-violet-500 bg-violet-100 border border-violet-200 rounded px-1.5 py-0.5 pointer-events-none">
      <Sparkles className="w-2.5 h-2.5" /> IA
    </span>
  );
}

function ListaDocumentosPase({ documentos, fotoLicencia }: { documentos: DocumentoDelPase[]; fotoLicencia: ArchivoPase | null }) {
  if (!documentos.length && !fotoLicencia) return null;
  return (
    <div className="space-y-1.5">
      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Documentos del pase</p>
      <div className="space-y-1.5">
        {fotoLicencia?.file_url && (
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2">
            <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="flex-1 min-w-0 text-xs font-medium text-gray-700 truncate">Licencia del conductor</span>
            <a href={fotoLicencia.file_url} target="_blank" rel="noopener noreferrer"
              className="text-[11px] font-medium text-blue-600 hover:text-blue-800 underline underline-offset-2 shrink-0">
              Ver archivo
            </a>
          </div>
        )}
        {documentos.map((doc, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2">
            <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <span className="text-xs font-medium text-gray-700 truncate">{doc.tipo || "Sin tipo"}</span>
              {doc.noDoc && <span className="text-xs text-gray-400 font-mono truncate">{doc.noDoc}</span>}
            </div>
            {doc.archivo?.file_url ? (
              <a href={doc.archivo.file_url} target="_blank" rel="noopener noreferrer"
                className="text-[11px] font-medium text-blue-600 hover:text-blue-800 underline underline-offset-2 shrink-0">
                Ver archivo
              </a>
            ) : (
              <span className="text-[11px] text-gray-300 italic shrink-0">Sin archivo</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  // Cuando ya se sabe a qué pase corresponde (ej. desde el detalle de una
  // bitácora "programada", que ya trae su num_de_pase) se salta el buscador
  // manual y se busca este pase directo al abrir.
  initialPaseId?: string;
  onLlegadaConfirmada?: (bitacoraId: string) => void;
}

export function RegistrarLlegadaPaseModal({ open, onClose, initialPaseId, onLlegadaConfirmada }: Props) {
  const router = useRouter();
  const { uploadImageMutation } = useUploadImage();
  const { area, location } = useBoothStore();

  // Buscador del pase
  const [busqueda, setBusqueda] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [showScanQr, setShowScanQr] = useState(false);
  const [numDePase, setNumDePase] = useState<string | null>(null);
  const [paseInfo, setPaseInfo] = useState<{ folio: string | null } | null>(null);

  // Ya con pase: fotos primero, luego la captura de pantalla única.
  const [modo, setModo] = useState<"fotos" | "manual">("fotos");
  const [visorFoto, setVisorFoto] = useState<number | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  // La confirmación de cierre solo aplica DESPUÉS de encontrar un pase (una
  // vez que hay datos capturados que se perderían) — antes de buscar, el
  // modal solo tiene el buscador vacío, así que cerrar sin avisar es correcto.
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const requestClose = () => {
    if (paseInfo) setShowCancelConfirm(true);
    else { resetForm(); onClose(); }
  };
  const confirmCancel = () => { setShowCancelConfirm(false); resetForm(); onClose(); };

  // Vehículo — el tipo de operación viene fijo del pase.
  const [tipoOperacion, setTipoOperacion] = useState<TipoOperacion>("Entrega");
  const [transportista, setTransportista] = useState("");
  const [procedencia, setProcedencia] = useState("");
  const [tipoVehiculo, setTipoVehiculo] = useState("");
  const [placa, setPlaca] = useState("");
  const [noEconomico, setNoEconomico] = useState("");
  const [marcaVehiculo, setMarcaVehiculo] = useState("");
  const [modeloVehiculo, setModeloVehiculo] = useState("");
  const [colorVehiculo, setColorVehiculo] = useState("");
  const [conductor, setConductor] = useState("");
  // Para avisarle al chofer su andén por SMS (2610-1323).
  const [celular, setCelular] = useState("");
  const [noLicencia, setNoLicencia] = useState("");
  const [vigenciaLicencia, setVigenciaLicencia] = useState("");
  const [rfcConductor, setRfcConductor] = useState("");
  const [acompanante, setAcompanante] = useState("");
  // Placa leída en la tarjeta de circulación del vehículo — sin campo visual,
  // se manda al confirmar la llegada.
  const [placaTarjetaVehiculo, setPlacaTarjetaVehiculo] = useState<string | null>(null);

  // Fotos nuevas de la llegada + documentos que ya trae el pase (solo lectura)
  const [documentos, setDocumentos] = useState<DocItem[]>([]);
  const [documentosPase, setDocumentosPase] = useState<DocumentoDelPase[]>([]);
  // Foto de la licencia que el transportista subió en el formulario público
  // del pase — cuenta como la foto obligatoria de la licencia.
  const [fotoLicenciaPase, setFotoLicenciaPase] = useState<ArchivoPase | null>(null);

  // IA
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiFilledFields, setAiFilledFields] = useState<Set<string>>(new Set());

  // Fotos que ya se analizaron (url + tipo elegido): si al volver a "fotos" no
  // cambió nada, se continúa sin volver a llamar a la IA.
  const [firmaAnalizada, setFirmaAnalizada] = useState<string | null>(null);
  const firmaFotos = () =>
    documentos.filter((d) => d.file_url).map((d) => `${d.file_url}|${d.opcion ?? ""}`).sort().join(",");
  // Remolques tal como los dejó la IA, para saber si alguien los editó.
  const unidadesDeIA = useRef<string | null>(null);

  const clearAiField = (field: string) =>
    setAiFilledFields((prev) => {
      const next = new Set(prev);
      next.delete(field);
      return next;
    });

  // Embarque
  const [proveedorCliente, setProveedorCliente] = useState("");
  const [ordenCompra, setOrdenCompra] = useState("");

  // Remolques / contenedores — mismo modelo de unidades que Nuevo Acceso y el
  // detalle de transportista.
  const [unidades, setUnidades] = useState<UnidadItem[]>([]);
  // Caja rápida sin UI (los remolques van en renglones, 2610-1382); se queda
  // vacía y solo alimenta los helpers de validación y registro.
  const [cajaRapida, setCajaRapida] = useState<CajaRapida>(emptyCajaRapida());

  // Contenedores detectados por IA que no se pudieron ligar automáticamente
  // a un remolque — se ligan eligiendo su caja en los renglones de Remolque.
  const [contenedoresSueltos, setContenedoresSueltos] = useState<(ContenedorData & { id: string })[]>([]);

  const linkContenedorSuelto = (unidadId: string, contenedorId: string) => {
    const target = unidades.find((x) => x.id === unidadId);
    if (!target) return;
    if (target.config === "remolque_contenedor") {
      toast.error("Este remolque ya tiene un contenedor asignado. Desligalo primero para asignar otro.");
      return;
    }

    const suelto = contenedoresSueltos.find((c) => c.id === contenedorId);
    if (!suelto) return;

    // El material capturado en el remolque se pasa automáticamente al contenedor al ligarlos
    const materialesRemolque = target.remolque.materiales.filter((m) => m.producto);
    const materialesSuelto = suelto.materiales.filter((m) => m.producto);
    const materialesContenedor = [...materialesRemolque, ...materialesSuelto];

    const contenedorData: ContenedorData = {
      tipo: suelto.tipo, noSello: suelto.noSello, noContenedor: suelto.noContenedor,
      noCaja: suelto.noCaja, color: suelto.color, comentarios: suelto.comentarios,
      materiales: materialesContenedor.length > 0 ? materialesContenedor : suelto.materiales,
    };
    setUnidades((prev) => prev.map((u) => u.id === unidadId
      ? {
          ...u,
          config: "remolque_contenedor",
          contenedor: contenedorData,
          remolque: materialesRemolque.length > 0
            ? { ...u.remolque, materiales: [emptyMaterial()] }
            : u.remolque,
        }
      : u));
    setContenedoresSueltos((prev) => prev.filter((c) => c.id !== contenedorId));
  };

  const resetForm = () => {
    setBusqueda("");
    setBuscando(false);
    setNumDePase(null);
    setPaseInfo(null);
    setModo("fotos");
    setVisorFoto(null);
    setShowValidation(false);
    setConfirmando(false);
    setFirmaAnalizada(null);
    unidadesDeIA.current = null;
    setTipoOperacion("Entrega");
    setTransportista("");
    setProcedencia("");
    setTipoVehiculo("");
    setPlaca("");
    setNoEconomico("");
    setMarcaVehiculo("");
    setModeloVehiculo("");
    setColorVehiculo("");
    setConductor("");
    setCelular("");
    setNoLicencia("");
    setVigenciaLicencia("");
    setRfcConductor("");
    setAcompanante("");
    setPlacaTarjetaVehiculo(null);
    setDocumentos([]);
    setDocumentosPase([]);
    setFotoLicenciaPase(null);
    setAiAnalyzing(false);
    setAiFilledFields(new Set());
    setProveedorCliente("");
    setOrdenCompra("");
    setUnidades([]);
    setCajaRapida(emptyCajaRapida());
    setContenedoresSueltos([]);
  };

  // ── Upload helpers ────────────────────────────────────────────────────────────

  // tipo: el que eligió el guardia al tomar la foto (modo fotos); queda como
  // manual para que "Analizar con IA" no lo sobrescriba.
  const uploadDocumento = async (file: File, opcion?: OpcionFoto) => {
    const id = Math.random().toString(36).slice(2);
    setDocumentos((p) => [...p, {
      id, file_url: "", file_name: "", uploading: true, preview: URL.createObjectURL(file),
      // `fijo` = la IA no puede cambiarle el tipo (conductor → licencia).
      ...(opcion ? { opcion: opcion.value, hint: opcion.hint, tipo: opcion.tipo, tipoManual: opcion.fijo } : {}),
    }]);
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

  // Igual que Nuevo Acceso Transportista — no cambiar aquí sin cambiar allá.
  const analyzePhotosWithAI = async () => {
    setAiAnalyzing(true);
    try {
      const result = await ocrAccesoTransportista(
        documentos
          .filter((d) => d.file_url)
          .map((d) => ({
            file_url: d.file_url,
            file_name: d.file_name,
            tipo_hint: d.hint ?? (d.tipo ? DOC_TYPES.find((t) => t.value === d.tipo)?.label : undefined),
          })),
      );
      const hasError = !result?.success || (result?.response?.data?.status_code ?? 0) >= 400;
      if (hasError) {
        const textMsj = errorMsj(result);
        toast.error(textMsj?.text || "Error al analizar los documentos con IA.");
        return false;
      }
      const d = (result?.response?.data?.data ?? {}) as Partial<{
        vehiculo: Partial<{
          transportista: string; tipo_vehiculo: string; placa: string;
          procedencia: string; no_economico: string;
          marca: string; modelo: string; color: string;
          placa_tarjeta_circulacion: string;
        }>;
        conductor: Partial<{ nombre: string; no_licencia: string; vigencia_licencia: string; rfc: string; acompanante: string }>;
        documentos_detectados: { url: string; fuente: string; tipo: string }[];
        remolques: {
          tipo?: string; no_caja?: string; no_sello?: string; placas?: string;
          placas_tarjeta_circulacion?: string; color?: string; comentarios?: string;
          materiales?: RawMaterialAI[];
        }[];
        contenedores: {
          tipo?: string; no_caja?: string; no_contenedor?: string; no_sello?: string; placas?: string;
          color?: string; comentarios?: string; materiales?: RawMaterialAI[];
        }[];
        materiales: RawMaterialAI[];
        embarque: Partial<{
          proveedor_cliente: string; no_orden_compra: string;
          fecha_embarque: string; origen: string; destino: string;
          naviera: string; no_bl: string; no_autorizacion_puerto: string; no_pedimento: string;
        }>;
        observaciones: string;
      }>;

      const toMaterialesCarga = (raw?: RawMaterialAI[]) =>
        (raw ?? []).map((m) => ({
          ...emptyMaterial(),
          producto:     m.producto      ?? "",
          lote:         m.lote          ?? "",
          cantEsperada: m.cant_esperada ?? "",
          peso:         m.peso          ?? "",
          volumen:      m.volumen       ?? "",
        }));

      // Al re-analizar se respeta lo capturado a mano: solo se llenan los
      // campos vacíos o los que llenó la IA y nadie tocó (clearAiField los
      // saca de aiFilledFields al editarlos).
      const filled = new Set<string>(aiFilledFields);
      const poner = (campo: string, actual: string, valor: string | undefined, set: (v: string) => void) => {
        if (!valor || (actual.trim() && !aiFilledFields.has(campo))) return;
        set(valor);
        filled.add(campo);
      };

      // Vehículo
      const tipoIA = d.vehiculo?.tipo_vehiculo;
      poner("transportista",    transportista,    d.vehiculo?.transportista, setTransportista);
      poner("tipoVehiculo",     tipoVehiculo,     tipoIA && (resolverTipoVehiculo(tipoIA)?.value ?? tipoIA), setTipoVehiculo);
      poner("placa",            placa,            d.vehiculo?.placa,         setPlaca);
      poner("procedencia",      procedencia,      d.vehiculo?.procedencia,   setProcedencia);
      poner("noEconomico",      noEconomico,      d.vehiculo?.no_economico,  setNoEconomico);
      poner("marcaVehiculo",    marcaVehiculo,    d.vehiculo?.marca,         setMarcaVehiculo);
      poner("modeloVehiculo",   modeloVehiculo,   d.vehiculo?.modelo,        setModeloVehiculo);
      poner("colorVehiculo",    colorVehiculo,    d.vehiculo?.color,         setColorVehiculo);

      // Conductor
      poner("conductor",        conductor,        d.conductor?.nombre,            setConductor);
      poner("noLicencia",       noLicencia,       d.conductor?.no_licencia,       setNoLicencia);
      poner("vigenciaLicencia", vigenciaLicencia, d.conductor?.vigencia_licencia, setVigenciaLicencia);
      poner("rfcConductor",     rfcConductor,     d.conductor?.rfc,               setRfcConductor);
      poner("acompanante",      acompanante,      d.conductor?.acompanante,       setAcompanante);

      // Documentos detectados — asigna tipo a cada DocItem por URL
      if (Array.isArray(d.documentos_detectados) && d.documentos_detectados.length) {
        const byUrl = new Map(d.documentos_detectados.map((dd) => [dd.url, dd.tipo]));
        setDocumentos((prev) =>
          prev.map((doc) => byUrl.has(doc.file_url) && !doc.tipoManual ? { ...doc, tipo: byUrl.get(doc.file_url) } : doc),
        );
      }

      // Remolques y contenedores llegan en arreglos separados — la IA no
      // sabe qué contenedor va sobre qué remolque. Si se detectó como mucho
      // un remolque real, se duplica su info para cubrir cada contenedor
      // sobrante y se ligan automáticamente 1:1 (el usuario corrige después
      // si en realidad son remolques distintos). Si se detectaron 2+
      // remolques reales, la correspondencia es ambigua y los contenedores
      // quedan "sueltos" para que el usuario los ligue.
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
          materiales:  r.materiales?.length ? toMaterialesCarga(r.materiales) : u.remolque.materiales,
        };
        return u;
      });

      const contenedoresParaLigar: (ContenedorData & { id: string })[] = contenedoresAI.map((c) => ({
        id: Math.random().toString(36).slice(2),
        ...emptyContenedorData(),
        tipo:         c.tipo         ?? "",
        noSello:      c.no_sello     ?? "",
        noContenedor: c.no_contenedor ?? "",
        noCaja:       c.no_caja      ?? "",
        color:        c.color        ?? "",
        comentarios:  c.comentarios  ?? "",
        materiales:   c.materiales?.length ? toMaterialesCarga(c.materiales) : emptyContenedorData().materiales,
      }));

      // ¿Ya vino algún material ligado directamente al remolque/contenedor?
      // Si es así, el arreglo plano `materiales` de abajo (formato legado) se ignora.
      const materialesYaLigadosPorEntidad =
        remolquesAI.some((r) => r.materiales?.length) || contenedoresAI.some((c) => c.materiales?.length);

      // Si se detectó un único remolque real y hay más contenedores que
      // remolques, se duplica la info de ese remolque para cada contenedor
      // sobrante. Con 2+ remolques reales no se rellena nada.
      const remolquesRealesDetectados = unidadesFromAI.length;
      if (remolquesRealesDetectados === 1) {
        while (unidadesFromAI.length < contenedoresParaLigar.length) {
          const u = emptyUnidad();
          u.remolque = { ...unidadesFromAI[0].remolque, materiales: [emptyMaterial()] };
          unidadesFromAI.push(u);
        }
      }

      if (
        remolquesRealesDetectados <= 1 &&
        unidadesFromAI.length > 0 &&
        unidadesFromAI.length === contenedoresParaLigar.length
      ) {
        // Correspondencia 1:1 sin ambigüedad — se ligan automáticamente
        contenedoresParaLigar.forEach((c, i) => {
          const { tipo, noSello, noContenedor, noCaja, color, comentarios, materiales } = c;
          unidadesFromAI[i] = {
            ...unidadesFromAI[i],
            config: "remolque_contenedor",
            contenedor: { tipo, noSello, noContenedor, noCaja, color, comentarios, materiales },
          };
        });
      }

      // Materiales — formato legado: cuando el servicio no liga cada material
      // a su remolque/contenedor, llegan sueltos en un arreglo plano y se
      // anexan a la primera unidad con contenedor (o a la primera unidad).
      if (!materialesYaLigadosPorEntidad && d.materiales?.length) {
        const materialesCarga = toMaterialesCarga(d.materiales);
        if (!unidadesFromAI.length && !contenedoresParaLigar.length) {
          // Ni remolque ni contenedor detectados: el material va directo
          // sobre el vehículo (pickup, caja integrada).
          const u = emptyUnidad();
          u.config = "solo_vehiculo";
          u.vehiculo = { materiales: materialesCarga };
          unidadesFromAI.push(u);
        } else {
          if (!unidadesFromAI.length) unidadesFromAI.push(emptyUnidad());
          const targetIdx = Math.max(unidadesFromAI.findIndex((u) => u.config === "remolque_contenedor"), 0);
          const target = unidadesFromAI[targetIdx];
          unidadesFromAI[targetIdx] = target.config === "remolque_contenedor"
            ? { ...target, contenedor: { ...target.contenedor, materiales: materialesCarga } }
            : { ...target, remolque: { ...target.remolque, materiales: materialesCarga } };
        }
        filled.add("carga");
      } else if (materialesYaLigadosPorEntidad) {
        filled.add("carga");
      }

      const sinCaptura = unidades.every((u) =>
        !u.remolque.tipo && !u.remolque.placas.trim() && !u.remolque.noCaja.trim()
        && !materialesDeUnidad(u).some((m) => m.producto));
      const intactas = unidadesDeIA.current === JSON.stringify(unidades);
      if (unidadesFromAI.length || contenedoresParaLigar.length) {
        if (sinCaptura || intactas) {
          const ligados = unidadesFromAI.some((u) => u.config === "remolque_contenedor");
          setContenedoresSueltos(ligados ? [] : contenedoresParaLigar);
          if (unidadesFromAI.length) {
            setUnidades(unidadesFromAI);
            unidadesDeIA.current = JSON.stringify(unidadesFromAI);
            filled.add("remolques");
          }
        } else {
          toast.info("Se conservaron los remolques y materiales que ya estaban capturados.");
        }
      }

      // Embarque
      poner("proveedorCliente", proveedorCliente, d.embarque?.proveedor_cliente, setProveedorCliente);
      poner("ordenCompra",      ordenCompra,      d.embarque?.no_orden_compra,   setOrdenCompra);

      // Placa de la tarjeta de circulación del vehículo — sin campo visual.
      if (d.vehiculo?.placa_tarjeta_circulacion) setPlacaTarjetaVehiculo(d.vehiculo.placa_tarjeta_circulacion);

      setAiFilledFields(filled);
      setFirmaAnalizada(firmaFotos());
      return true;
    } catch (err) {
      const textMsj = errorMsj(err instanceof Error ? err.message : err);
      toast.error(textMsj?.text || "Error al analizar los documentos con IA.");
      return false;
    } finally {
      setAiAnalyzing(false);
    }
  };

  // ── Buscar pase y precargar sus datos ─────────────────────────────────────────

  const handleBuscar = async (idOverride?: string) => {
    const id = extraerIdDePase(idOverride ?? busqueda);
    if (!id) return;
    setBuscando(true);
    try {
      const result = await getPassTransportista(id);
      if (!result?.success || !result?.response?.data?._id) {
        toast.error("No se encontró ningún pase con ese folio/id.");
        return;
      }
      const d = result.response.data as Partial<{
        _id: string;
        folio: string;
        estado_transportista: string;
        tipo_de_operacion: string;
        empresa_transportista: string;
        proveedor_cliente_material: string;
        orden_de_compra: string;
        vehiculo_tipo_unidad: string;
        vehiculo_marca: string;
        vehiculo_modelo: string;
        vehiculo_color: string;
        vehiculo_placas: string;
        vehiculo_no_economico: string;
        conductor_nombre: string;
        conductor_no_licencia: string;
        conductor_vigencia: string;
        conductor_rfc: string;
        conductor_foto_licencia: ArchivoPase[];
        ayudante_nombre: string;
        documentos: { tipo?: string; no_doc?: string; archivo?: ArchivoPase[] }[];
        contenedores: { numero?: string; sello?: string; tipo?: string }[];
        materiales: {
          tipo?: string; cantidad?: string; volumen?: string; peso?: string;
          producto?: string; lote?: string; no_referencia?: string; contenedor?: string;
        }[];
      }>;

      if (d.estado_transportista === "completado") {
        toast.error("Este pase ya fue registrado anteriormente en la bitácora.");
        return;
      }

      const esRecoleccion = (d.tipo_de_operacion || "").startsWith("recoleccion");
      setTipoOperacion(esRecoleccion ? "Recolección" : "Entrega");
      setTransportista(d.empresa_transportista || "");
      setProveedorCliente(d.proveedor_cliente_material || "");
      setOrdenCompra(d.orden_de_compra || "");
      setTipoVehiculo(resolverTipoVehiculo(d.vehiculo_tipo_unidad || "")?.value ?? (d.vehiculo_tipo_unidad || ""));
      setMarcaVehiculo(d.vehiculo_marca || "");
      setModeloVehiculo(d.vehiculo_modelo || "");
      setColorVehiculo(d.vehiculo_color || "");
      setPlaca(d.vehiculo_placas || "");
      setNoEconomico(d.vehiculo_no_economico || "");
      setConductor(d.conductor_nombre || "");
      setNoLicencia(d.conductor_no_licencia || "");
      setVigenciaLicencia(normalizarFecha(d.conductor_vigencia || ""));
      setRfcConductor(d.conductor_rfc || "");
      setAcompanante(d.ayudante_nombre || "");
      setFotoLicenciaPase(d.conductor_foto_licencia?.find((a) => a?.file_url) ?? null);

      setDocumentosPase(
        (d.documentos || [])
          .filter((doc) => doc.tipo || doc.no_doc)
          .map((doc) => ({
            tipo: doc.tipo || "",
            noDoc: doc.no_doc || "",
            archivo: doc.archivo?.[0]?.file_url ? doc.archivo[0] : null,
          })),
      );

      // El pase captura contenedores (lista formal) y materiales (cada uno con
      // su propio texto libre de "contenedor") por separado, sin ligarlos — se
      // convierten a unidades aquí para revisarlos con los mismos renglones
      // que Nuevo Acceso.
      const contenedoresPase = (d.contenedores || []).filter((c) => c.numero || c.sello || c.tipo);
      const materialesPase = d.materiales || [];

      const unidadesIniciales: UnidadItem[] = contenedoresPase.map((c) => {
        const u = emptyUnidad();
        u.config = "remolque_contenedor";
        u.contenedor = { ...u.contenedor, tipo: c.tipo || "", noSello: c.sello || "", noContenedor: c.numero || "", materiales: [] };
        return u;
      });

      const buscarUnidadPorContenedor = (nombre: string) =>
        unidadesIniciales.find(
          (u) => u.config === "remolque_contenedor" && u.contenedor.noContenedor.trim().toLowerCase() === nombre.trim().toLowerCase(),
        );

      let unidadGeneral: UnidadItem | null = null;

      materialesPase.forEach((m) => {
        const materialCarga: MaterialCarga = {
          ...emptyMaterial(),
          producto: m.producto || m.tipo || "",
          lote: m.lote || "",
          cantEsperada: m.cantidad || "",
          peso: m.peso || "",
          volumen: m.volumen || "",
        };
        const contenedorNombre = (m.contenedor || "").trim();
        if (contenedorNombre) {
          let target = buscarUnidadPorContenedor(contenedorNombre);
          if (!target) {
            target = emptyUnidad();
            target.config = "remolque_contenedor";
            target.contenedor = { ...target.contenedor, noContenedor: contenedorNombre, materiales: [] };
            unidadesIniciales.push(target);
          }
          target.contenedor.materiales.push(materialCarga);
        } else {
          if (!unidadGeneral) {
            unidadGeneral = emptyUnidad();
            unidadGeneral.remolque = { ...unidadGeneral.remolque, materiales: [] };
            unidadesIniciales.push(unidadGeneral);
          }
          unidadGeneral.remolque.materiales.push(materialCarga);
        }
      });

      // Toda unidad que se haya quedado sin ningún material empieza con un
      // renglón vacío, igual que hace emptyUnidad() por defecto.
      setUnidades(unidadesIniciales.map((u) => ({
        ...u,
        remolque: { ...u.remolque, materiales: u.remolque.materiales.length ? u.remolque.materiales : [emptyMaterial()] },
        contenedor: { ...u.contenedor, materiales: u.contenedor.materiales.length ? u.contenedor.materiales : [emptyMaterial()] },
      })));

      setNumDePase(id);
      setPaseInfo({ folio: d.folio ?? null });
      setModo("fotos");
    } catch (err) {
      const textMsj = errorMsj(err instanceof Error ? err.message : err);
      toast.error(textMsj?.text || "No se pudo buscar el pase.");
    } finally {
      setBuscando(false);
    }
  };

  // Se abre ya sabiendo a qué pase corresponde (ej. desde el detalle de una
  // bitácora "programada") — se busca directo, sin pasar por el buscador manual.
  useEffect(() => {
    if (open && initialPaseId && !numDePase) {
      setBusqueda(initialPaseId);
      handleBuscar(initialPaseId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialPaseId]);

  // ── Validación y registro ─────────────────────────────────────────────────────

  // Igual que Nuevo Acceso (juntas 14 y 19 oct): conductor, celular, no. de
  // licencia y no. de tracto opcionales; se exige la foto de la licencia — la
  // tomada aquí o la que el transportista ya subió al pase.
  const tieneFotoLicenciaModal = documentos.some((d) => d.tipo === "licencia" && d.file_url);
  const tieneFotoLicencia = tieneFotoLicenciaModal || !!fotoLicenciaPase?.file_url;
  const licenciaVencida = !!vigenciaLicencia && new Date(vigenciaLicencia) < new Date();
  // Rígidos y pickup no piden no. de tracto ni caja.
  const campos = camposDeVehiculo(tipoVehiculo);
  const camposFaltantes = [
    !transportista.trim() && "Línea",
    !tipoVehiculo.trim() && "Tipo de vehículo",
    !placa.trim() && (campos.tracto ? "Placa de tracto" : "Placa del vehículo"),
    !tieneFotoLicencia && "Foto de la licencia",
    !tieneMinCaracteres(ordenCompra) && "Factura / Orden de compra (mín. 4)",
    // Las unidades "Solo vehículo" solo llevan material sin ligar: no cuentan como caja.
    // Sin caja (rígidos, pickup) los remolques ocultos no se validan.
    ...(campos.caja
      ? faltantesCarga(unidades.filter((u) => u.config !== "solo_vehiculo"), cajaRapida, cajaRapidaOpcional(tipoVehiculo))
      : []),
  ].filter((v): v is string => Boolean(v));

  const handleConfirmar = async () => {
    if (!numDePase) return;
    if (camposFaltantes.length > 0) {
      setShowValidation(true);
      toast.error(`Completa los campos obligatorios: ${camposFaltantes.join(", ")}`);
      return;
    }
    if (contenedoresSueltos.length > 0) {
      toast.error("Liga los contenedores pendientes antes de registrar.");
      return;
    }
    setConfirmando(true);
    try {
      const { remolques, contenedores, materiales } = serializeUnidades(
        campos.caja ? unidadesARegistrar(unidades, cajaRapida) : soloMaterialDelVehiculo(unidades),
      );
      const documentosAdicionales = documentos
        .filter((d) => d.file_url)
        .map((d) => ({ file_url: d.file_url, file_name: d.file_name, ...(d.tipo ? { tipo: d.tipo } : {}) }));
      // Si la licencia no se fotografió aquí, se guarda la del pase en la
      // bitácora para que el detalle y las inspecciones la vean igual.
      if (!tieneFotoLicenciaModal && fotoLicenciaPase?.file_url) {
        documentosAdicionales.push({
          file_url: fotoLicenciaPase.file_url,
          file_name: fotoLicenciaPase.file_name || "licencia",
          tipo: "licencia",
        });
      }
      const payload = {
        num_de_pase: numDePase,
        tipo_operacion: tipoOperacion,
        ubicacion: location || null,
        area: area || null,
        vehiculo: {
          transportista: transportista || null,
          procedencia: procedencia || null,
          tipo_vehiculo: tipoVehiculo || null,
          placa: placa || null,
          no_economico: noEconomico || null,
          marca: marcaVehiculo || null,
          modelo: modeloVehiculo || null,
          color: colorVehiculo || null,
          placa_tarjeta_circulacion: placaTarjetaVehiculo || null,
        },
        conductor: {
          nombre: conductor || null,
          celular: celular || null,
          no_licencia: noLicencia || null,
          // Campo fecha en la bitácora: solo se manda si es una fecha válida.
          vigencia_licencia: normalizarFecha(vigenciaLicencia) || null,
          rfc: rfcConductor || null,
          acompanante: acompanante || null,
        },
        embarque: {
          proveedor_cliente: proveedorCliente || null,
          no_orden_compra: ordenCompra || null,
        },
        documentos_adicionales: documentosAdicionales,
        remolques,
        contenedores,
        materiales,
      };

      const result = await createVisitTransportista(payload);
      const hasError = !result?.success || (result?.response?.data?.status_code ?? 0) >= 400;
      if (hasError) {
        const textMsj = errorMsj(result);
        toast.error(textMsj?.text || "No se pudo registrar la llegada.");
        return;
      }
      const bitacoraId = result?.response?.data?.json?.id;
      toast.success("Llegada registrada correctamente.");
      resetForm();
      onClose();
      if (bitacoraId && onLlegadaConfirmada) onLlegadaConfirmada(bitacoraId);
      else if (bitacoraId) router.push(`/dashboard/accesos/transportista/${bitacoraId}`);
    } catch {
      toast.error("No se pudo registrar la llegada.");
    } finally {
      setConfirmando(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  const enFotos = !!numDePase && modo === "fotos";

  return (
    <>
    <Dialog
      open={open}
      onOpenChange={(v) => {
        // Solo llega aquí por la X del Dialog (outside-click y Escape se
        // bloquean antes, en DialogContent, solo cuando ya hay un pase
        // encontrado) — mismo criterio que el botón Cancelar.
        if (!v) requestClose();
      }}>
      <DialogContent
        onPointerDownOutside={(e) => { if (paseInfo) e.preventDefault(); }}
        onInteractOutside={(e) => { if (paseInfo) e.preventDefault(); }}
        onEscapeKeyDown={(e) => { if (paseInfo) e.preventDefault(); }}
        className={cn("p-0 gap-0 overflow-hidden rounded-2xl shadow-2xl", enFotos ? "max-w-5xl" : "max-w-3xl")}>
        <DialogTitle className="sr-only">Registrar llegada de pase</DialogTitle>

        {/* ── Header ────────────────────────────────── */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 opacity-[0.06] pointer-events-none" />
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm shadow-blue-200 shrink-0">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-gray-800 leading-tight">
                Registrar llegada de pase
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Liga un pase de entrada ya creado con su llegada física
              </p>
            </div>
          </div>
        </div>

        {!numDePase ? (
          /* ── Paso 1: buscar el pase ─────────────────── */
          <div className="px-6 py-5">
            <div className="flex items-center gap-2">
              <Input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleBuscar();
                  }
                }}
                placeholder="Folio o ID del pase de entrada"
                className="rounded-xl border-gray-200"
                autoFocus
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowScanQr(true)}
                title="Escanear código QR"
                aria-label="Escanear código QR"
                className="rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50 shrink-0">
                <Camera className="w-3.5 h-3.5" />
              </Button>
              <Button
                type="button"
                disabled={buscando || !busqueda.trim()}
                onClick={() => handleBuscar()}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shrink-0">
                {buscando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                {buscando ? "Buscando..." : "Buscar"}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* ── Pase encontrado ──────────────────────── */}
            <div className="px-6 pt-4">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    Pase <span className="font-semibold">{paseInfo?.folio || numDePase}</span>
                    {" — "}{tipoOperacion}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs font-medium text-green-700 hover:text-green-900 underline underline-offset-2">
                  Buscar otro
                </button>
              </div>
            </div>

            <div className={cn("overflow-y-auto px-6 py-5 space-y-5", enFotos ? "max-h-[70vh]" : "max-h-[58vh]")}>
              {modo === "fotos" ? (
                /* ── Paso 2: fotos primero ──────────────── */
                <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-6 items-stretch">
                  {/* Izquierda: tipo de vehículo (define qué campos aplican) y
                      lo que ya trae el pase. Derecha: la cámara. */}
                  <div className="space-y-4">
                    <div>
                      <FieldLabel required>Tipo de vehículo</FieldLabel>
                      <GaleriaTipoVehiculo
                        compacta
                        value={tipoVehiculo}
                        onChange={(t) => { setTipoVehiculo(t); clearAiField("tipoVehiculo"); }}
                      />
                    </div>
                    <ListaDocumentosPase documentos={documentosPase} fotoLicencia={fotoLicenciaPase} />
                  </div>
                  <div className="min-w-0">
                    <CapturaFotosDocumentos
                      llenarAlto
                      fotos={documentos}
                      onCapturar={(file, opcion) => uploadDocumento(file, opcion)}
                      onQuitar={removeDocumento}
                      onCambiarTipo={(id, opcion) => setDocumentos((p) => p.map((d) => d.id === id
                        ? { ...d, opcion: opcion.value, hint: opcion.hint, tipo: opcion.tipo, tipoManual: opcion.fijo }
                        : d))}
                    />
                  </div>
                </div>
              ) : (
                /* ── Paso 3: formulario de pantalla única ── */
                <>
                  {/* Fotos ya tomadas en el paso anterior: compactas, para verlas o volver. */}
                  <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-2.5">
                    <span className="text-xs font-medium text-gray-500">
                      {documentos.length
                        ? `${documentos.length} foto${documentos.length > 1 ? "s" : ""} de la llegada`
                        : "Sin fotos de la llegada"}
                    </span>
                    <div className="flex items-center gap-1.5 min-w-0">
                      {documentos.map((d, i) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => setVisorFoto(i)}
                          aria-label="Ver foto en grande"
                          className="relative w-10 h-8 rounded-md overflow-hidden border border-gray-200 bg-white shrink-0 hover:border-blue-400">
                          {d.preview && <Image src={d.preview} fill className="object-cover" alt="" unoptimized />}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setModo("fotos")}
                        className="ml-1 flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 shrink-0">
                        <Camera className="w-3.5 h-3.5" /> {documentos.length ? "Ver fotos" : "Tomar fotos"}
                      </button>
                    </div>
                  </div>
                  {showValidation && !tieneFotoLicencia && (
                    <p className="text-[11px] text-red-500 -mt-3">Falta la foto del documento del conductor.</p>
                  )}
                  {!tieneFotoLicenciaModal && fotoLicenciaPase?.file_url && (
                    <p className="text-[11px] text-gray-400 -mt-3">Se usará la foto de la licencia que viene en el pase.</p>
                  )}
                  <VisorFotosModal
                    fotos={documentos.map((d) => ({ id: d.id, src: d.preview, etiqueta: etiquetaDeFoto(d) }))}
                    indice={visorFoto}
                    onIndice={setVisorFoto}
                  />

                  <SectionDivider label="Conductor" icon={<Search className="w-3 h-3" />} />

                  {/* Vigencia y RFC no se muestran: los lee la IA de la licencia (o
                      vienen del pase) y se guardan igual; la vigencia solo se
                      avisa si viene vencida. */}
                  {licenciaVencida && (
                    <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      Licencia vencida (vigencia {vigenciaLicencia})
                    </div>
                  )}

                  <div>
                    <FieldLabel>Nombre del conductor</FieldLabel>
                    <div className="relative">
                      <Input
                        className={cn("text-sm", aiFilledFields.has("conductor") && "border-violet-200 bg-violet-50/40")}
                        placeholder="Nombre completo"
                        value={conductor}
                        onChange={(e) => { setConductor(e.target.value); clearAiField("conductor"); }}
                      />
                      {aiFilledFields.has("conductor") && <IaBadge />}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <FieldLabel>Celular</FieldLabel>
                      <PhoneInput
                        limitMaxLength
                        defaultCountry="MX"
                        placeholder="81 1234 5678"
                        value={celular}
                        onChange={(v) => setCelular(v || "")}
                        containerComponentProps={{
                          className: "flex h-10 w-full rounded-md border border-input bg-background pl-3 py-0 text-sm focus-within:ring-2 focus-within:ring-ring",
                        }}
                        numberInputProps={{ className: "pl-3 bg-transparent outline-none text-sm font-mono" }}
                      />
                    </div>
                    <div>
                      <FieldLabel>No. de licencia</FieldLabel>
                      <div className="relative">
                        <Input
                          className={cn(
                            "text-sm font-mono uppercase placeholder:normal-case placeholder:font-sans",
                            aiFilledFields.has("noLicencia") && "border-violet-200 bg-violet-50/40",
                          )}
                          placeholder="Ej. AB123456"
                          value={noLicencia}
                          onChange={(e) => { setNoLicencia(e.target.value); clearAiField("noLicencia"); }}
                        />
                        {aiFilledFields.has("noLicencia") && <IaBadge />}
                      </div>
                    </div>
                    <div>
                      <FieldLabel>Acompañante</FieldLabel>
                      <div className="relative">
                        <Input
                          className={cn("text-sm", aiFilledFields.has("acompanante") && "border-violet-200 bg-violet-50/40")}
                          placeholder="Nombre del acompañante"
                          value={acompanante}
                          onChange={(e) => { setAcompanante(e.target.value); clearAiField("acompanante"); }}
                        />
                        {aiFilledFields.has("acompanante") && <IaBadge />}
                      </div>
                    </div>
                  </div>

                  <SectionDivider label="Vehículo" icon={<Truck className="w-3 h-3" />} />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <FieldLabel required>Tipo de vehículo</FieldLabel>
                      <SelectorTipoVehiculo
                        value={tipoVehiculo}
                        onChange={(t) => { setTipoVehiculo(t); clearAiField("tipoVehiculo"); }}
                        aiFilled={aiFilledFields.has("tipoVehiculo")}
                        invalid={showValidation && !tipoVehiculo.trim()}
                      />
                      {showValidation && !tipoVehiculo.trim() && (
                        <p className="text-[10px] text-red-500 mt-1">Campo obligatorio</p>
                      )}
                    </div>
                    <div>
                      <FieldLabel required>Línea</FieldLabel>
                      <div className="relative">
                        <Input
                          className={cn(
                            "text-sm",
                            aiFilledFields.has("transportista") && "border-violet-200 bg-violet-50/40",
                            showValidation && !transportista.trim() && "border-red-300 bg-red-50",
                          )}
                          placeholder="Nombre de la línea transportista"
                          value={transportista}
                          onChange={(e) => { setTransportista(e.target.value); clearAiField("transportista"); }}
                        />
                        {aiFilledFields.has("transportista") && <IaBadge />}
                      </div>
                      {showValidation && !transportista.trim() && (
                        <p className="text-[10px] text-red-500 mt-1">Campo obligatorio</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <FieldLabel required>{campos.tracto ? "Placa de tracto" : "Placa del vehículo"}</FieldLabel>
                      <div className="relative">
                        <Input
                          className={cn(
                            "text-sm font-mono uppercase",
                            aiFilledFields.has("placa") && "border-violet-200 bg-violet-50/40",
                            showValidation && !placa.trim() && "border-red-300 bg-red-50",
                          )}
                          placeholder="AB-1234-C"
                          value={placa}
                          onChange={(e) => { setPlaca(e.target.value); clearAiField("placa"); }}
                        />
                        {aiFilledFields.has("placa") && <IaBadge />}
                      </div>
                      {showValidation && !placa.trim() && (
                        <p className="text-[10px] text-red-500 mt-1">Campo obligatorio</p>
                      )}
                    </div>
                    {campos.tracto && (
                      <div>
                        <FieldLabel>No. de tracto</FieldLabel>
                        <div className="relative">
                          <Input
                            className={cn("text-sm", aiFilledFields.has("noEconomico") && "border-violet-200 bg-violet-50/40")}
                            placeholder="Ej. ECO-001"
                            value={noEconomico}
                            onChange={(e) => { setNoEconomico(e.target.value); clearAiField("noEconomico"); }}
                          />
                          {aiFilledFields.has("noEconomico") && <IaBadge />}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pickup y rígidos (torton, rabón, 3.5 t) no traen remolque. */}
                  {campos.caja && (
                    <>
                      <SectionDivider label="Remolque" icon={<Package className="w-3 h-3" />} />
                      <RenglonesRemolque
                        unidades={unidades}
                        setUnidades={setUnidades}
                        sueltos={contenedoresSueltos}
                        onLigarSuelto={linkContenedorSuelto}
                        requerido={campos.caja && !cajaRapidaOpcional(tipoVehiculo)}
                        showValidation={showValidation}
                        tipoVehiculo={tipoVehiculo}
                        conSello={tipoOperacion !== "Recolección"}
                      />
                    </>
                  )}

                  <SectionDivider label="Material" icon={<Package className="w-3 h-3" />} />
                  <MaterialesCarga unidades={unidades} setUnidades={setUnidades} sinCajas={!campos.caja} />

                  <SectionDivider label="Origen y documento" />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <FieldLabel>Procedencia</FieldLabel>
                      <div className="relative">
                        <Input
                          className={cn("text-sm", aiFilledFields.has("procedencia") && "border-violet-200 bg-violet-50/40")}
                          placeholder="Ej. Bodega central del proveedor"
                          value={procedencia}
                          onChange={(e) => { setProcedencia(e.target.value); clearAiField("procedencia"); }}
                        />
                        {aiFilledFields.has("procedencia") && <IaBadge />}
                      </div>
                    </div>
                    <div>
                      <FieldLabel required>Factura / Orden de compra</FieldLabel>
                      <Input
                        className={cn("text-sm", showValidation && !tieneMinCaracteres(ordenCompra) && "border-red-300 bg-red-50")}
                        placeholder="Mín. 4 caracteres"
                        value={ordenCompra}
                        onChange={(e) => { setOrdenCompra(e.target.value); clearAiField("ordenCompra"); }}
                      />
                      {showValidation && !tieneMinCaracteres(ordenCompra) && (
                        <p className="text-[10px] text-red-500 mt-1">Mínimo 4 caracteres</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <FieldLabel>Proveedor / Cliente</FieldLabel>
                      <Input
                        className="text-sm"
                        placeholder="Nombre del proveedor o cliente"
                        value={proveedorCliente}
                        onChange={(e) => { setProveedorCliente(e.target.value); clearAiField("proveedorCliente"); }}
                      />
                    </div>
                  </div>

                  <ListaDocumentosPase documentos={documentosPase} fotoLicencia={fotoLicenciaPase} />
                </>
              )}
            </div>
          </>
        )}

        {/* ── Footer ────────────────────────────────── */}
        <div className="flex flex-col gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/80">
          {contenedoresSueltos.length > 0 && (
            <p className="text-[11px] font-medium text-violet-600 flex items-center gap-1.5">
              <Link2 className="w-3 h-3" />
              Liga {contenedoresSueltos.length === 1 ? "el contenedor pendiente" : "los contenedores pendientes"} en la sección Remolque antes de registrar.
            </p>
          )}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={requestClose}
              className="rounded-xl border-gray-200 text-gray-600 hover:bg-gray-100">
              Cancelar
            </Button>
            {enFotos && (() => {
              // Con tipo de vehículo se puede continuar: con fotos, la IA llena
              // lo que falte; sin fotos, directo a la captura manual.
              const listas = documentos.filter((d) => d.file_url).length;
              const subiendo = documentos.some((d) => d.uploading);
              // Mismas fotos que ya se analizaron: se regresa sin llamar a la IA.
              const yaAnalizadas = listas > 0 && firmaFotos() === firmaAnalizada;
              const puede = !!tipoVehiculo.trim() && !subiendo && !aiAnalyzing;
              return (
                <Button
                  disabled={!puede}
                  onClick={async () => {
                    if (listas === 0 || yaAnalizadas) { setModo("manual"); return; }
                    // La IA llena el formulario; lo que falte queda marcado en rojo.
                    if (await analyzePhotosWithAI()) { setShowValidation(true); setModo("manual"); }
                  }}
                  className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-2">
                  {aiAnalyzing ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Analizando…
                    </>
                  ) : !tipoVehiculo.trim() ? (
                    "Elige el tipo de vehículo"
                  ) : subiendo ? (
                    "Subiendo fotos…"
                  ) : listas > 0 && !yaAnalizadas ? (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Analizar y continuar
                    </>
                  ) : (
                    "Continuar"
                  )}
                </Button>
              );
            })()}
            {!enFotos && (
              <Button
                disabled={!numDePase || confirmando || contenedoresSueltos.length > 0}
                onClick={handleConfirmar}
                className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-2">
                {confirmando && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirmar llegada
              </Button>
            )}
          </div>
        </div>

        {showCancelConfirm && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col items-center gap-3 text-center">
              <p className="text-sm font-semibold text-gray-800">¿Cancelar el registro de llegada?</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Se perderá la información capturada en este formulario.
              </p>
              <div className="flex items-center gap-3 w-full mt-1">
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 h-9 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
                  Seguir editando
                </button>
                <button
                  type="button"
                  onClick={confirmCancel}
                  className="flex-1 h-9 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors">
                  Sí, cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
    <ScanQrCameraModal
      open={showScanQr}
      onClose={() => setShowScanQr(false)}
      onScan={(decodedText) => {
        setShowScanQr(false);
        const id = extraerIdDePase(decodedText);
        setBusqueda(id);
        handleBuscar(id);
      }}
    />
    </>
  );
}
