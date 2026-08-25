"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
  Truck,
  User,
  X,
} from "lucide-react";
import { cn, errorMsj, reemplazarGuionMinuscula } from "@/lib/utils";
import { useUploadImage } from "@/hooks/useUploadImage";
import { useBoothStore } from "@/store/useBoothStore";
import { getPassTransportista, createVisitTransportista } from "@/services/endpoints";
import { toast } from "sonner";
import {
  type UnidadItem,
  type MaterialCarga,
  emptyUnidad,
  emptyMaterial,
  resolveColorSwatch,
  UnidadEditorCard,
  serializeUnidades,
} from "@/components/transportista/agregar-unidad-modal";

interface Props {
  open: boolean;
  onClose: () => void;
}

// ─── Shared field UI — mismo look que Nuevo Acceso Transportista ─────────────

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5 block">
      {children}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <Input
        className={cn("text-sm", mono && "font-mono uppercase")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function MiniField({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div>
      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className={cn("text-xs text-gray-700 leading-snug", mono && "font-mono", !value && "text-gray-300 italic")}>
        {value || "Sin información"}
      </p>
    </div>
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

// ─── Documentos — mismos tipos sugeridos que Nuevo Acceso, pero sin IA: el
// guardia sube el archivo y elige el tipo manualmente. ────────────────────────

const DOC_TYPES = [
  "Foto de placa del vehículo",
  "Foto del conductor",
  "Licencia del conductor",
  "Tarjeta de circulación - Vehículo",
  "Tarjeta de circulación - Remolque",
  "OC / BL / Materiales",
  "Contenedor / Doc. contenedor",
];

interface DocItem {
  id: string;
  file_url: string;
  file_name: string;
  uploading: boolean;
  preview: string | null;
  tipo: string;
}

// Documento capturado al crear el pase (BL, factura, etc.) — de solo lectura
// aquí, no se sube de nuevo. Distinto de `documentos` (DocItem[]), que son
// archivos nuevos capturados en este momento de la llegada (foto de placa,
// conductor, licencia...).
interface DocumentoDelPase {
  tipo: string;
  noDoc: string;
  archivo: { file_name?: string; file_url?: string } | null;
}

const esPdf = (fileName: string) => fileName.toLowerCase().endsWith(".pdf");

type Tab = "vehiculo" | "remolques" | "materiales";

const TABS: { key: Tab; label: string }[] = [
  { key: "vehiculo", label: "Vehículo" },
  { key: "remolques", label: "Remolques" },
  { key: "materiales", label: "Materiales" },
];

export function RegistrarLlegadaPaseModal({ open, onClose }: Props) {
  const router = useRouter();
  const { uploadImageMutation } = useUploadImage();
  const { area, location } = useBoothStore();

  const [tab, setTab] = useState<Tab>("vehiculo");
  const [busqueda, setBusqueda] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [numDePase, setNumDePase] = useState<string | null>(null);
  const [paseInfo, setPaseInfo] = useState<{
    folio: string | null;
    tipoOperacionLabel: string;
  } | null>(null);
  const [confirmando, setConfirmando] = useState(false);

  const [tipoOperacion, setTipoOperacion] = useState<"Entrega" | "Recolección">("Entrega");
  const [transportista, setTransportista] = useState("");
  const [procedencia, setProcedencia] = useState("");
  const [proveedorCliente, setProveedorCliente] = useState("");
  const [ordenCompra, setOrdenCompra] = useState("");
  const [tipoVehiculo, setTipoVehiculo] = useState("");
  const [marcaVehiculo, setMarcaVehiculo] = useState("");
  const [modeloVehiculo, setModeloVehiculo] = useState("");
  const [colorVehiculo, setColorVehiculo] = useState("");
  const [placa, setPlaca] = useState("");
  const [noEconomico, setNoEconomico] = useState("");
  const [conductor, setConductor] = useState("");
  const [noLicencia, setNoLicencia] = useState("");
  const [vigenciaLicencia, setVigenciaLicencia] = useState("");
  const [rfcConductor, setRfcConductor] = useState("");
  const [acompanante, setAcompanante] = useState("");

  // Documentos del pase (solo lectura) + documentos nuevos capturados ahora
  const [documentosPase, setDocumentosPase] = useState<DocumentoDelPase[]>([]);
  const [documentos, setDocumentos] = useState<DocItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  // Remolques / contenedores — mismo modelo de unidades que "Nuevo Acceso
  // Transportista" y el detalle de transportista, para que capturar carga
  // (y decidir si va a un contenedor o un remolque) se vea y funcione igual
  // sin importar por cuál de los dos flujos entró el transportista.
  const [unidades, setUnidades] = useState<UnidadItem[]>([]);
  const [showAgregarUnidad, setShowAgregarUnidad] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnidadItem | null>(null);
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());

  const toggleUnit = (id: string) =>
    setExpandedUnits((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const resetForm = () => {
    setTab("vehiculo");
    setBusqueda("");
    setBuscando(false);
    setNumDePase(null);
    setPaseInfo(null);
    setConfirmando(false);
    setTipoOperacion("Entrega");
    setTransportista("");
    setProcedencia("");
    setProveedorCliente("");
    setOrdenCompra("");
    setTipoVehiculo("");
    setMarcaVehiculo("");
    setModeloVehiculo("");
    setColorVehiculo("");
    setPlaca("");
    setNoEconomico("");
    setConductor("");
    setNoLicencia("");
    setVigenciaLicencia("");
    setRfcConductor("");
    setAcompanante("");
    setDocumentosPase([]);
    setDocumentos([]);
    setIsDragging(false);
    dragCounter.current = 0;
    setUnidades([]);
    setShowAgregarUnidad(false);
    setEditingUnit(null);
    setExpandedUnits(new Set());
  };

  // ── Upload helpers ────────────────────────────────────────────────────────

  const uploadDocumento = async (file: File) => {
    const id = Math.random().toString(36).slice(2);
    setDocumentos((p) => [...p, { id, file_url: "", file_name: "", uploading: true, preview: URL.createObjectURL(file), tipo: "" }]);
    try {
      const renamed = new File([file], reemplazarGuionMinuscula(file.name), { type: file.type });
      const result = await uploadImageMutation.mutateAsync({ img: renamed });
      setDocumentos((p) => p.map((d) => d.id === id ? {
        ...d,
        file_url: result?.file_url ?? "",
        file_name: result?.file_name ?? file.name,
        uploading: false,
      } : d));
    } catch {
      setDocumentos((p) => p.filter((d) => d.id !== id));
    }
  };
  const removeDocumento = (id: string) => setDocumentos((p) => p.filter((d) => d.id !== id));
  const setDocumentoTipo = (id: string, tipo: string) =>
    setDocumentos((p) => p.map((d) => d.id === id ? { ...d, tipo } : d));

  const handleBuscar = async () => {
    const id = busqueda.trim();
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
        ayudante_nombre: string;
        documentos: { tipo?: string; no_doc?: string; archivo?: { file_name?: string; file_url?: string }[] }[];
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
      setTipoVehiculo(d.vehiculo_tipo_unidad || "");
      setMarcaVehiculo(d.vehiculo_marca || "");
      setModeloVehiculo(d.vehiculo_modelo || "");
      setColorVehiculo(d.vehiculo_color || "");
      setPlaca(d.vehiculo_placas || "");
      setNoEconomico(d.vehiculo_no_economico || "");
      setConductor(d.conductor_nombre || "");
      setNoLicencia(d.conductor_no_licencia || "");
      setVigenciaLicencia(d.conductor_vigencia || "");
      setRfcConductor(d.conductor_rfc || "");
      setAcompanante(d.ayudante_nombre || "");

      setDocumentosPase(
        (d.documentos || [])
          .filter((doc) => doc.tipo || doc.no_doc)
          .map((doc) => ({
            tipo: doc.tipo || "",
            noDoc: doc.no_doc || "",
            archivo: doc.archivo?.[0]?.file_url ? doc.archivo[0] : null,
          })),
      );

      // El pase captura contenedores (lista formal, grupo_contenedores) y
      // materiales (cada uno con su propio texto libre de "contenedor") por
      // separado, sin ligarlos entre sí — se convierten a unidades aquí para
      // que el guardia pueda revisar/corregir esa asignación con el mismo
      // editor que usa "Nuevo Acceso Transportista".
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

      // Toda unidad que se haya quedado sin ningún material (ej. un
      // contenedor del pase que ningún material referenció) empieza con un
      // renglón vacío, igual que hace emptyUnidad() por defecto.
      const unidadesConMaterialesPorDefecto = unidadesIniciales.map((u) => ({
        ...u,
        remolque: { ...u.remolque, materiales: u.remolque.materiales.length ? u.remolque.materiales : [emptyMaterial()] },
        contenedor: { ...u.contenedor, materiales: u.contenedor.materiales.length ? u.contenedor.materiales : [emptyMaterial()] },
      }));

      setUnidades(unidadesConMaterialesPorDefecto);
      setExpandedUnits(new Set(unidadesConMaterialesPorDefecto.map((u) => u.id)));

      setNumDePase(id);
      setPaseInfo({
        folio: d.folio ?? null,
        tipoOperacionLabel: esRecoleccion ? "Recolección" : "Entrega",
      });
      setTab("vehiculo");
    } catch (err) {
      const textMsj = errorMsj(err instanceof Error ? err.message : err);
      toast.error(textMsj?.text || "No se pudo buscar el pase.");
    } finally {
      setBuscando(false);
    }
  };

  const handleConfirmar = async () => {
    if (!numDePase) return;
    setConfirmando(true);
    try {
      const { remolques, contenedores, materiales } = serializeUnidades(unidades);
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
        },
        conductor: {
          nombre: conductor || null,
          no_licencia: noLicencia || null,
          vigencia_licencia: vigenciaLicencia || null,
          rfc: rfcConductor || null,
          acompanante: acompanante || null,
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
      if (bitacoraId) router.push(`/dashboard/accesos/transportista/${bitacoraId}`);
    } catch {
      toast.error("No se pudo registrar la llegada.");
    } finally {
      setConfirmando(false);
    }
  };

  const unidadesConMaterial = unidades.some((u) => {
    const mats = u.config === "remolque_contenedor" ? u.contenedor.materiales : u.remolque.materiales;
    return mats.some((m) => m.producto);
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) { resetForm(); onClose(); }
      }}>
      <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden rounded-2xl shadow-2xl">
        <DialogTitle className="sr-only">Registrar llegada de pase</DialogTitle>

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

        {!numDePase ? (
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
                disabled={buscando || !busqueda.trim()}
                onClick={handleBuscar}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shrink-0">
                {buscando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                {buscando ? "Buscando..." : "Buscar"}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="px-6 pt-4">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    Pase <span className="font-semibold">{paseInfo?.folio || numDePase}</span>
                    {" — "}{paseInfo?.tipoOperacionLabel}
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

            <div className="overflow-y-auto max-h-[58vh] px-6 py-5 space-y-5">
              {/* ══ TAB: VEHÍCULO ════════════════════════ */}
              {tab === "vehiculo" && (
                <>
                  <SectionDivider label="Información general" />
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Empresa transportista" value={transportista} onChange={setTransportista} />
                    <div>
                      <FieldLabel>Procedencia</FieldLabel>
                      <Input
                        className="text-sm"
                        placeholder="Ej. Bodega central del proveedor"
                        value={procedencia}
                        onChange={(e) => setProcedencia(e.target.value)}
                      />
                    </div>
                  </div>

                  <SectionDivider label="Documentos" icon={<FileText className="w-3 h-3" />} />

                  {documentosPase.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Documentos del pase</p>
                      <div className="space-y-1.5">
                        {documentosPase.map((doc, i) => (
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
                  )}

                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Documentos adicionales</p>
                  <div
                    className="rounded-xl border border-gray-200 bg-gray-50/40 p-4 space-y-3"
                    onDragEnter={(e) => { e.preventDefault(); dragCounter.current++; setIsDragging(true); }}
                    onDragOver={(e) => e.preventDefault()}
                    onDragLeave={() => { dragCounter.current--; if (dragCounter.current === 0) setIsDragging(false); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      dragCounter.current = 0;
                      setIsDragging(false);
                      Array.from(e.dataTransfer.files).forEach(uploadDocumento);
                    }}
                  >
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
                      <div className={`w-full rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-1.5 py-5 ${isDragging ? "border-blue-400 bg-blue-50/60" : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/40"}`}>
                        <Camera className={`w-5 h-5 ${isDragging ? "text-blue-400" : "text-gray-300"}`} />
                        <span className="text-sm text-gray-400 font-medium">{isDragging ? "Suelta aquí" : "Subir imágenes o archivos"}</span>
                        <span className="text-[11px] text-gray-300">Puedes seleccionar múltiples archivos</span>
                      </div>
                    </label>

                    {documentos.length > 0 && (
                      <div className="space-y-2">
                        {documentos.map((doc) => (
                          <div key={doc.id} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-2">
                            <div className="relative w-10 h-10 rounded-md overflow-hidden border border-gray-200 bg-gray-50 shrink-0">
                              {doc.uploading ? (
                                <div className="w-full h-full flex items-center justify-center">
                                  <span className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                </div>
                              ) : esPdf(doc.file_name) ? (
                                <div className="w-full h-full flex items-center justify-center bg-red-50">
                                  <FileText className="w-4 h-4 text-red-400" />
                                </div>
                              ) : doc.preview ? (
                                <Image src={doc.preview} fill className="object-cover" alt="" unoptimized />
                              ) : null}
                            </div>
                            <select
                              value={doc.tipo}
                              onChange={(e) => setDocumentoTipo(doc.id, e.target.value)}
                              className="flex-1 min-w-0 h-9 px-2.5 rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-700 outline-none focus:ring-2 focus:ring-blue-200">
                              <option value="">Selecciona tipo de documento...</option>
                              {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <button
                              type="button"
                              onClick={() => removeDocumento(doc.id)}
                              className="w-6 h-6 rounded-md hover:bg-red-50 flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors shrink-0">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <SectionDivider label="Vehículo" icon={<Truck className="w-3.5 h-3.5" />} />
                  <div className="grid grid-cols-3 gap-4">
                    <Field label="Tipo de unidad" value={tipoVehiculo} onChange={setTipoVehiculo} />
                    <Field label="Placas" value={placa} onChange={setPlaca} mono />
                    <Field label="No. económico" value={noEconomico} onChange={setNoEconomico} />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <Field label="Marca" value={marcaVehiculo} onChange={setMarcaVehiculo} />
                    <Field label="Modelo" value={modeloVehiculo} onChange={setModeloVehiculo} />
                    <Field label="Color" value={colorVehiculo} onChange={setColorVehiculo} />
                  </div>

                  <SectionDivider label="Conductor" icon={<User className="w-3.5 h-3.5" />} />
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Nombre" value={conductor} onChange={setConductor} />
                    <Field label="No. de licencia" value={noLicencia} onChange={setNoLicencia} mono />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <Field label="Vigencia" value={vigenciaLicencia} onChange={setVigenciaLicencia} />
                    <Field label="RFC" value={rfcConductor} onChange={setRfcConductor} mono />
                    <Field label="Ayudante" value={acompanante} onChange={setAcompanante} />
                  </div>
                </>
              )}

              {/* ══ TAB: MATERIALES ══════════════════════ */}
              {tab === "materiales" && (
                <>
                  <SectionDivider label="Proveedor / Cliente" />
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Proveedor / Cliente" value={proveedorCliente} onChange={setProveedorCliente} />
                    <Field label="Orden de compra" value={ordenCompra} onChange={setOrdenCompra} />
                  </div>

                  <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 px-4 py-3 flex items-start gap-2.5">
                    <Package className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-500 leading-relaxed">
                      El material de carga se captura por cada remolque o contenedor —
                      revísalo o ajústalo en la pestaña <span className="font-semibold text-gray-600">Remolques</span>.
                    </p>
                  </div>

                  {unidadesConMaterial && (
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
                    if (editingUnit?.id === u.id) return null;
                    const isUnitExpanded = expandedUnits.has(u.id);
                    return (
                      <div key={u.id} className="rounded-xl border border-gray-200 overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                          <button type="button" onClick={() => toggleUnit(u.id)} className="flex items-center gap-2 flex-1 text-left">
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
                                <div className="flex items-center gap-1.5">
                                  <Package className="w-3 h-3 text-violet-500" />
                                  <span className="text-[10px] font-bold text-violet-600 uppercase tracking-widest">Contenedor</span>
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
                      className="w-full border-2 border-dashed border-blue-200 rounded-xl py-3 text-sm font-semibold text-blue-500 hover:border-blue-400 hover:bg-blue-50 transition-all flex items-center justify-center gap-2">
                      <Plus className="w-4 h-4" />
                      Agregar remolque
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/80">
          <Button
            variant="outline"
            onClick={() => { resetForm(); onClose(); }}
            className="rounded-xl border-gray-200 text-gray-600 hover:bg-gray-100">
            Cancelar
          </Button>
          <Button
            disabled={!numDePase || confirmando}
            onClick={handleConfirmar}
            className={cn(
              "flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-2",
              (!numDePase || confirmando) && "opacity-50 cursor-not-allowed",
            )}>
            {confirmando && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Confirmar llegada
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
