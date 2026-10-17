"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle,
  ArrowLeftRight,
  Camera,
  Link2,
  Package,
  Search,
  Sparkles,
  Truck,
} from "lucide-react";
import { cn, errorMsj, reemplazarGuionMinuscula } from "@/lib/utils";
import { useUploadImage } from "@/hooks/useUploadImage";
import { useCreateVisitTransportista } from "@/hooks/useCreateVisitTransportista";
import { useBoothStore } from "@/store/useBoothStore";
import { useQueryClient } from "@tanstack/react-query";
import { ocrAccesoTransportista } from "@/services/endpoints";
import { toast } from "sonner";
import type { VisitaTransportista } from "@/hooks/useGetVisitTransportista";
import {
  type UnidadItem,
  type ContenedorData,
  emptyUnidad,
  emptyMaterial,
  emptyContenedorData,
  serializeUnidades,
  faltantesCarga,
  cajaRapidaOpcional,
  unidadesARegistrar,
  emptyCajaRapida,
  type CajaRapida,
} from "@/components/transportista/agregar-unidad-modal";
import { CapturaFotosDocumentos, etiquetaDeFoto, type OpcionFoto } from "@/components/transportista/captura-fotos-documentos";
import { VisorFotosModal } from "@/components/transportista/visor-fotos-modal";
import { RenglonesRemolque } from "@/components/transportista/renglones-remolque";
import { MaterialesCarga } from "@/components/transportista/materiales-carga";
import { SelectorTipoVehiculo, GaleriaTipoVehiculo, resolverTipoVehiculo, camposDeVehiculo } from "@/components/transportista/selector-tipo-vehiculo";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { TIPOS_DOCUMENTO_SUBIDA, tieneMinCaracteres } from "@/config/documentos-transportista";

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

// Tipo de documento — selección OPCIONAL antes de "Analizar con IA": darle este
// hint al análisis evita que la IA interprete un archivo como lo que no es
// (ej. confundir una carta porte con una tarjeta de circulación). El `value`
// es el mismo slug compartido con el detalle de la visita y "Registrar llegada
// de pase" (config/documentos-transportista.ts) — así un documento etiquetado
// aquí se reconoce igual en los demás flujos.
const DOC_TYPES = TIPOS_DOCUMENTO_SUBIDA;

interface DocItem {
  id:        string;
  file_url:  string;
  file_name: string;
  uploading: boolean;
  preview:   string | null;
  tipo?:     string;
  // Opción de la cámara (Tracto, Caja…) y pista para la IA (2610-1382).
  opcion?:   string;
  hint?:     string;
  // true cuando el usuario asignó el tipo a mano — evita que el resultado de
  // "Analizar con IA" lo sobrescriba con su propia detección automática.
  tipoManual?: boolean;
}

// El navegador no puede pintar un PDF dentro de un <img> — se muestra un ícono
// en vez de la miniatura rota cuando el archivo no es una imagen.

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


// ─── Main Modal ───────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
}

export function NuevoAccesoTransportistaModal({ open, onClose }: Props) {
  const [showValidation, setShowValidation] = useState(false);
  // 2610-1382 (junta 16 oct): el modal abre directo en operación, tipo de
  // vehículo y fotos; sin fotos, "Continuar" pasa a la captura manual.
  const [modo, setModo] = useState<"fotos" | "manual">("fotos");
  const [visorFoto, setVisorFoto] = useState<number | null>(null);
  // Cerrar el modal (por cualquier vía: botón Cancelar, la X, o un intento de
  // cerrar accidental) siempre pasa por aquí — nunca se cierra directo, para
  // no perder lo capturado sin que el usuario lo confirme explícitamente.
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const confirmCancel = () => { setShowCancelConfirm(false); resetForm(); onClose(); };
  const { uploadImageMutation } = useUploadImage();
  const { mutate: createVisit, isPending } = useCreateVisitTransportista();
  const { area, location } = useBoothStore();
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
  // Para avisarle al chofer su andén por SMS (2610-1323).
  const [celular, setCelular] = useState("");
  const [noLicencia, setNoLicencia] = useState("");
  const [vigenciaLicencia, setVigenciaLicencia] = useState("");
  const [rfcConductor, setRfcConductor] = useState("");
  const [acompanante, setAcompanante] = useState("");
  // Placa leída en la tarjeta de circulación del vehículo — sin campo visual
  // en este modal todavía, pero se manda al crear el registro para usarla
  // más adelante (verificación de placas en la inspección de entrada).
  const [placaTarjetaVehiculo, setPlacaTarjetaVehiculo] = useState<string | null>(null);

  // Fotos
  const [documentos, setDocumentos] = useState<DocItem[]>([]);

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
  // Caja rápida ya sin UI (los remolques van en renglones, 2610-1382); se
  // queda vacía y solo alimenta los helpers de validación y registro.
  const [cajaRapida, setCajaRapida] = useState<CajaRapida>(emptyCajaRapida());

  // Contenedores detectados por IA que no se pudieron ligar automáticamente
  // a un remolque (más de un remolque y/o contenedor detectados) — se ligan
  // eligiendo su caja en los renglones de Remolque.
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
    setModo("fotos");
    setShowValidation(false);
    setTipoOperacion(null);
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

      const filled = new Set<string>();

      // Vehículo
      if (d.vehiculo?.transportista)  { setTransportista(d.vehiculo.transportista);    filled.add("transportista"); }
      if (d.vehiculo?.tipo_vehiculo)  { setTipoVehiculo(resolverTipoVehiculo(d.vehiculo.tipo_vehiculo)?.value ?? d.vehiculo.tipo_vehiculo);      filled.add("tipoVehiculo"); }
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
          prev.map((doc) => byUrl.has(doc.file_url) && !doc.tipoManual ? { ...doc, tipo: byUrl.get(doc.file_url) } : doc),
        );
      }

      // Remolques y contenedores llegan en arreglos separados — la IA no
      // sabe qué contenedor va sobre qué remolque. Si se detectó como mucho
      // un remolque real, se duplica su info para cubrir cada contenedor
      // sobrante y se ligan automáticamente 1:1 (el usuario corrige después
      // si en realidad son remolques distintos). Si se detectaron 2+
      // remolques reales, la correspondencia es ambigua y los contenedores
      // quedan "sueltos" para que el usuario los ligue arrastrándolos.
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
      // sobrante — el usuario la ajusta después si en realidad corresponde
      // a un remolque distinto. Con 2+ remolques reales no se rellena nada:
      // la correspondencia ya es ambigua tal como venía de la IA.
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
        // Correspondencia 1:1 sin ambigüedad (0-1 remolque real, resto duplicado) — se ligan automáticamente
        contenedoresParaLigar.forEach((c, i) => {
          const { tipo, noSello, noContenedor, noCaja, color, comentarios, materiales } = c;
          unidadesFromAI[i] = {
            ...unidadesFromAI[i],
            config: "remolque_contenedor",
            contenedor: { tipo, noSello, noContenedor, noCaja, color, comentarios, materiales },
          };
        });
      } else if (contenedoresParaLigar.length) {
        setContenedoresSueltos(contenedoresParaLigar);
      }

      // Materiales — formato legado: cuando el servicio no liga cada material
      // a su remolque/contenedor, llegan sueltos en un arreglo plano y se
      // anexan a la primera unidad con contenedor (o a la primera unidad).
      // Si ya llegaron ligados por entidad (ver arriba), este bloque no hace nada.
      if (!materialesYaLigadosPorEntidad && d.materiales?.length) {
        const materialesCarga = toMaterialesCarga(d.materiales);
        if (!unidadesFromAI.length && !contenedoresParaLigar.length) {
          // Ni remolque ni contenedor detectados: el material va directo
          // sobre el vehículo (pickup, caja integrada) en vez de crear un
          // remolque fantasma para sostenerlo.
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

      if (unidadesFromAI.length) {
        setUnidades(unidadesFromAI);
        filled.add("remolques");
      }

      // Embarque
      if (d.embarque?.proveedor_cliente) { setProveedorCliente(d.embarque.proveedor_cliente); filled.add("proveedorCliente"); }
      if (d.embarque?.no_orden_compra)   { setOrdenCompra(d.embarque.no_orden_compra);        filled.add("ordenCompra"); }

      // Placa de la tarjeta de circulación del vehículo — sin campo visual,
      // se guarda para mandarla al crear el registro.
      if (d.vehiculo?.placa_tarjeta_circulacion) setPlacaTarjetaVehiculo(d.vehiculo.placa_tarjeta_circulacion);

      setAiFilledFields(filled);
      return true;
    } catch (err) {
      const textMsj = errorMsj(err instanceof Error ? err.message : err);
      toast.error(textMsj?.text || "Error al analizar los documentos con IA.");
      return false;
    } finally {
      setAiAnalyzing(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────

  // Junta 14 oct: conductor, celular y no. de licencia dejan de ser
  // obligatorios; se exige la foto de la licencia (de ahí los lee la IA).
  // Factura/OC sigue pidiendo al menos 4 caracteres.
  const tieneFotoLicencia = documentos.some((d) => d.tipo === "licencia" && d.file_url);
  const licenciaVencida = !!vigenciaLicencia && new Date(vigenciaLicencia) < new Date();
  // Rígidos y pickup no piden no. de tracto ni caja (junta 14 oct).
  const campos = camposDeVehiculo(tipoVehiculo);
  const camposFaltantes = [
    !tipoOperacion && "Tipo de operación",
    !transportista.trim() && "Línea",
    !tipoVehiculo.trim() && "Tipo de vehículo",
    !placa.trim() && (campos.tracto ? "Placa de tracto" : "Placa del vehículo"),
    campos.tracto && !noEconomico.trim() && "No. de tracto",
    !tieneFotoLicencia && "Foto de la licencia",
    !tieneMinCaracteres(ordenCompra) && "Factura / Orden de compra (mín. 4)",
    // Las unidades "Solo vehículo" solo llevan material sin ligar: no cuentan como caja.
    ...faltantesCarga(unidades.filter((u) => u.config !== "solo_vehiculo"), cajaRapida, !campos.caja || cajaRapidaOpcional(tipoVehiculo)),
  ].filter((v): v is string => Boolean(v));

  const registrarAcceso = () => {
    if (camposFaltantes.length > 0) {
      setShowValidation(true);
      toast.error(`Completa los campos obligatorios: ${camposFaltantes.join(", ")}`);
      return;
    }
    const { remolques, contenedores, materiales } = serializeUnidades(unidadesARegistrar(unidades, cajaRapida));
    const payload = {
      creado_desde: "acceso_web",
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
    createVisit(payload, {
      onSuccess: (result) => {
        if (result?.id) {
          const cacheData: VisitaTransportista = {
            id: result.id,
            folio: result.folio ?? null,
            num_de_pase: null,
            tipo_operacion: tipoOperacion,
            created_at: result.created_at ? String(result.created_at) : null,
            fecha_hora_ingreso: null,
            estatus: null,
            ubicacion: location || null,
            area: area || null,
            vehiculo: {
              transportista: transportista || null,
              procedencia: procedencia || null,
              tipo_vehiculo: tipoVehiculo || null,
              placa: placa || null,
              placa_tarjeta_circulacion: null,
              no_economico: noEconomico || null,
              marca: marcaVehiculo || null,
              modelo: modeloVehiculo || null,
              color: colorVehiculo || null,
              material: null,
              foto_placa: null,
            },
            conductor: {
              nombre: conductor || null,
              celular: celular || null,
              no_licencia: noLicencia || null,
              vigencia_licencia: vigenciaLicencia || null,
              rfc: rfcConductor || null,
              acompanante: acompanante || null,
              foto_conductor: null,
              foto_licencia: null,
              firma: null,
            },
            embarque: {
              proveedor_cliente: proveedorCliente || null,
              no_orden_compra: ordenCompra || null,
              anden_asignado: null,
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
          resetForm();
          onClose();
          router.push(
            `/dashboard/accesos/transportista/${result.id}`,
          );
        } else {
          resetForm();
          onClose();
        }
      },
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        // Solo llega aquí por la X del Dialog (outside-click y Escape se
        // bloquean antes, en DialogContent) — pide confirmación igual que
        // el botón Cancelar, nunca cierra directo.
        if (!v) setShowCancelConfirm(true);
      }}>
      <DialogContent
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className={cn("p-0 gap-0 overflow-hidden rounded-2xl shadow-2xl", modo === "fotos" ? "max-w-5xl" : "max-w-3xl")}>
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

        {/* ── Content ───────────────────────────────── */}
        <div className={cn("overflow-y-auto px-6 py-5 space-y-5", modo === "fotos" ? "max-h-[74vh]" : "max-h-[58vh]")}>
          {modo === "fotos" ? (
            <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-6 items-stretch">
              {/* Izquierda: ningún documento trae el tipo de operación, y el tipo
                  de vehículo define qué campos aplican; los dos se piden antes de
                  continuar. Derecha: la cámara. */}
              <div className="space-y-4">
              <div className="space-y-2">
                <FieldLabel required>Tipo de operación</FieldLabel>
                {TIPOS_OPERACION.map(({ value, label, description, icon: Icon }) => {
                  const selected = tipoOperacion === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setTipoOperacion(value)}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-xl border-2 transition-all flex items-center gap-3",
                        selected
                          ? "border-teal-500 bg-teal-50/80"
                          : "border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/40",
                      )}>
                      <Icon className={cn("w-5 h-5 shrink-0", selected ? "text-teal-600" : "text-blue-400")} />
                      <div className="min-w-0">
                        <p className={cn("font-semibold text-sm leading-snug", selected ? "text-teal-700" : "text-gray-700")}>{label}</p>
                        <p className="text-[11px] text-gray-400 leading-snug truncate">{description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div>
                <FieldLabel required>Tipo de vehículo</FieldLabel>
                <GaleriaTipoVehiculo
                  compacta
                  value={tipoVehiculo}
                  onChange={(t) => { setTipoVehiculo(t); clearAiField("tipoVehiculo"); }}
                />
              </div>
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
            <>
              {/* Operación y fotos ya se eligieron en el paso anterior: aquí van
                  compactos, solo para confirmar o cambiar. */}
              <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  {TIPOS_OPERACION.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setTipoOperacion(value)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all",
                        tipoOperacion === value
                          ? "border-teal-500 bg-teal-50 text-teal-700"
                          : showValidation && !tipoOperacion
                          ? "border-red-300 bg-red-50 text-red-600"
                          : "border-gray-200 bg-white text-gray-500 hover:border-blue-200",
                      )}>
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
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
              <VisorFotosModal
                fotos={documentos.map((d) => ({ id: d.id, src: d.preview, etiqueta: etiquetaDeFoto(d) }))}
                indice={visorFoto}
                onIndice={setVisorFoto}
              />

              <SectionDivider
                label="Vehículo"
                icon={<Truck className="w-3 h-3" />}
              />

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
                  <Input
                    className={cn("text-sm", showValidation && !transportista.trim() && "border-red-300 bg-red-50")}
                    placeholder="Nombre de la línea transportista"
                    value={transportista}
                    onChange={(e) => setTransportista(e.target.value)}
                  />
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
                        aiFilledFields.has("placa") &&
                          "border-violet-200 bg-violet-50/40",
                        showValidation && !placa.trim() && "border-red-300 bg-red-50",
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
                  {showValidation && !placa.trim() && (
                    <p className="text-[10px] text-red-500 mt-1">Campo obligatorio</p>
                  )}
                </div>
                {campos.tracto && (
                  <div>
                    <FieldLabel required>No. de tracto</FieldLabel>
                    <div className="relative">
                      <Input
                        className={cn(
                          "text-sm",
                          aiFilledFields.has("noEconomico") && "border-violet-200 bg-violet-50/40",
                          showValidation && !noEconomico.trim() && "border-red-300 bg-red-50",
                        )}
                        placeholder="Ej. ECO-001"
                        value={noEconomico}
                        onChange={(e) => { setNoEconomico(e.target.value); clearAiField("noEconomico"); }}
                      />
                      {aiFilledFields.has("noEconomico") && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[9px] font-bold text-violet-500 bg-violet-100 border border-violet-200 rounded px-1.5 py-0.5 pointer-events-none"><Sparkles className="w-2.5 h-2.5" /> IA</span>}
                    </div>
                    {showValidation && !noEconomico.trim() && (
                      <p className="text-[10px] text-red-500 mt-1">Campo obligatorio</p>
                    )}
                  </div>
                )}
              </div>

              {/* Pickup y rígidos (torton, rabón, 3.5 t) no traen remolque. */}
              {campos.caja && (
                <>
                <SectionDivider
                  label="Remolque"
                  icon={<Package className="w-3 h-3" />}
                />

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

              <SectionDivider
                label="Material"
                icon={<Package className="w-3 h-3" />}
              />
              <MaterialesCarga unidades={unidades} setUnidades={setUnidades} />

              <SectionDivider label="Origen y documento" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Procedencia</FieldLabel>
                  <div className="relative">
                    <Input
                      className={cn(
                        "text-sm",
                        aiFilledFields.has("procedencia") && "border-violet-200 bg-violet-50/40",
                      )}
                      placeholder="Ej. Bodega central del proveedor"
                      value={procedencia}
                      onChange={(e) => { setProcedencia(e.target.value); clearAiField("procedencia"); }}
                    />
                    {aiFilledFields.has("procedencia") && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[9px] font-bold text-violet-500 bg-violet-100 border border-violet-200 rounded px-1.5 py-0.5 pointer-events-none"><Sparkles className="w-2.5 h-2.5" /> IA</span>}
                  </div>
                </div>
                <div>
                  <FieldLabel required>Factura / Orden de compra</FieldLabel>
                  <Input
                    className={cn("text-sm", showValidation && !tieneMinCaracteres(ordenCompra) && "border-red-300 bg-red-50")}
                    placeholder="Mín. 4 caracteres"
                    value={ordenCompra}
                    onChange={(e) => setOrdenCompra(e.target.value)}
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
                    onChange={(e) => setProveedorCliente(e.target.value)}
                  />
                </div>
              </div>

              <SectionDivider
                label="Conductor"
                icon={<Search className="w-3 h-3" />}
              />

              {/* Vigencia y RFC no se muestran: los lee la IA de la licencia y se
                  guardan igual; la vigencia solo se avisa si viene vencida. El
                  nombre vuelve a verse (junta 16 oct), lo llena la IA. */}
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
                  {aiFilledFields.has("conductor") && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[9px] font-bold text-violet-500 bg-violet-100 border border-violet-200 rounded px-1.5 py-0.5 pointer-events-none"><Sparkles className="w-2.5 h-2.5" /> IA</span>}
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
                      className: cn(
                        "flex h-10 w-full rounded-md border border-input bg-background pl-3 py-0 text-sm focus-within:ring-2 focus-within:ring-ring",
                      ),
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
                        aiFilledFields.has("noLicencia") &&
                          "border-violet-200 bg-violet-50/40",
                      )}
                      placeholder="Ej. AB123456"
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
                <div>
                  <FieldLabel>Acompañante</FieldLabel>
                  <div className="relative">
                    <Input
                      className={cn("text-sm", aiFilledFields.has("acompanante") && "border-violet-200 bg-violet-50/40")}
                      placeholder="Nombre del acompañante"
                      value={acompanante}
                      onChange={(e) => { setAcompanante(e.target.value); clearAiField("acompanante"); }}
                    />
                    {aiFilledFields.has("acompanante") && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[9px] font-bold text-violet-500 bg-violet-100 border border-violet-200 rounded px-1.5 py-0.5 pointer-events-none"><Sparkles className="w-2.5 h-2.5" /> IA</span>}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

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
            onClick={() => setShowCancelConfirm(true)}
            className="rounded-xl border-gray-200 text-gray-600 hover:bg-gray-100">
            Cancelar
          </Button>
          {modo === "fotos" && (() => {
            // Con operación y tipo de vehículo se puede continuar: con fotos,
            // la IA llena el registro y se pasa al resumen; sin fotos, directo
            // a la captura manual.
            const listas = documentos.filter((d) => d.file_url).length;
            const subiendo = documentos.some((d) => d.uploading);
            const puede = !!tipoOperacion && !!tipoVehiculo.trim() && !subiendo && !aiAnalyzing;
            return (
              <Button
                disabled={!puede}
                onClick={async () => {
                  if (listas === 0) { setModo("manual"); return; }
                  // La IA llena el formulario; lo que falte queda marcado en rojo.
                  if (await analyzePhotosWithAI()) { setShowValidation(true); setModo("manual"); }
                }}
                className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-2">
                {aiAnalyzing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Analizando…
                  </>
                ) : !tipoOperacion ? (
                  "Elige el tipo de operación"
                ) : !tipoVehiculo.trim() ? (
                  "Elige el tipo de vehículo"
                ) : subiendo ? (
                  "Subiendo fotos…"
                ) : listas > 0 ? (
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
          {modo === "manual" && (
            <Button
              disabled={isPending || contenedoresSueltos.length > 0}
              className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-2"
              onClick={registrarAcceso}>
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
          )}
          </div>
        </div>

        {showCancelConfirm && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col items-center gap-3 text-center">
              <p className="text-sm font-semibold text-gray-800">¿Cancelar el nuevo acceso?</p>
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
  );
}
