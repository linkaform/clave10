"use client";

import { use, useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  FileText,
  Download,
  Share2,
  Send,
  QrCode,
  Copy,
  Check,
  X,
  Loader2,
  MapPin,
  Building2,
  User,
  Truck,
  Package,
  Camera,
  Sparkles,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getPassTransportista,
  generateSubmitTokenTransportista,
  updateInformationTransportista,
} from "@/services/endpoints";
import { cn, reemplazarGuionMinuscula } from "@/lib/utils";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { useMenuStore } from "@/store/useGetMenuStore";
import useAuthStore from "@/store/useAuthStore";
import { useSelectedLocationsStore } from "@/store/useSelectedLocationsStore";
import { useUploadImage } from "@/hooks/useUploadImage";

// ── Helpers ───────────────────────────────────────────────────────────────────

const TIPO_LABEL: Record<string, string> = {
  entrega_de_materia_prima: "Entrega de material",
  recoleccion_de_materia_prima: "Recolección de material",
  entrega_de_producto_terminado: "Entrega de producto terminado",
  recoleccion_de_producto_terminado: "Recolección de producto terminado",
};

const SEGUNDA_PERSONA_TITULO: Record<string, string> = {
  entrega_de_materia_prima: "Quien envía",
  recoleccion_de_materia_prima: "Proveedor origen",
  entrega_de_producto_terminado: "Cliente destino",
  recoleccion_de_producto_terminado: "Cliente",
};

function formatFecha(desde?: string, hasta?: string) {
  if (!desde) return null;
  const fmt = (s: string) =>
    new Date(s + "T00:00:00").toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  return hasta && hasta !== desde
    ? `${fmt(desde)} – ${fmt(hasta)}`
    : fmt(desde);
}

// ── Sub-componentes ────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">
        {label}
      </span>
      <span
        className={
          value
            ? "text-xs font-semibold text-gray-800 leading-snug break-all"
            : "text-xs text-blue-300 italic"
        }>
        {value ?? "—"}
      </span>
    </div>
  );
}

function InfoCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-white rounded-lg shadow-sm shrink-0">
          <Icon className="w-3.5 h-3.5 text-blue-500" />
        </div>
        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">
          {title}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">{children}</div>
    </div>
  );
}

function IaBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 bg-blue-100 text-blue-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
      <Sparkles className="w-2.5 h-2.5" /> IA
    </span>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  ia,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  ia?: boolean;
  disabled?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
        {label}
        {ia && <IaBadge />}
      </p>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "w-full h-9 px-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 placeholder:text-gray-300 transition",
          disabled
            ? "border-gray-100 bg-gray-50/50 text-gray-500 cursor-not-allowed"
            : "border-gray-200 bg-gray-50",
        )}
      />
    </div>
  );
}

interface PhotoValue {
  file_name: string;
  file_url: string;
}

function PhotoField({
  label,
  required,
  ia,
  value,
  uploading,
  onChange,
  disabled,
}: {
  label: string;
  required?: boolean;
  ia?: boolean;
  value?: PhotoValue | null;
  uploading?: boolean;
  onChange?: (file: File) => void;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [lightbox, setLightbox] = useState(false);

  const isPdf = value?.file_name?.toLowerCase().endsWith(".pdf");
  const handlePreview = () => {
    if (!value?.file_url) return;
    if (isPdf) window.open(value.file_url, "_blank");
    else {
      setLightbox(true);
      document.body.style.overflow = "hidden";
    }
  };
  const closeLightbox = () => {
    setLightbox(false);
    document.body.style.overflow = "";
  };

  return (
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
        {required && <span className="text-red-400 mr-0.5">*</span>}
        {label}
        {ia && <IaBadge />}
      </p>
      <input
        ref={ref}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f && onChange) onChange(f);
          e.target.value = "";
        }}
      />
      {value?.file_url ? (
        <div className="flex items-center gap-2 h-10 px-2 rounded-xl border border-blue-200 bg-blue-50/50">
          <button type="button" onClick={handlePreview} className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value.file_url}
              alt=""
              className="h-7 w-7 rounded-lg object-cover border border-blue-100 hover:opacity-80 transition-opacity"
            />
          </button>
          <button
            type="button"
            onClick={handlePreview}
            className="text-xs text-blue-700 font-medium truncate flex-1 text-left hover:underline">
            {value.file_name}
          </button>
          {!disabled && (
            <button
              type="button"
              onClick={() => onChange?.(null as any)}
              className="text-blue-300 hover:text-red-400 transition-colors shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={uploading || disabled}
          className="w-full flex items-center justify-center gap-2 h-10 rounded-xl border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-400 hover:border-blue-400 hover:text-blue-500 disabled:opacity-60 transition-colors">
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Subiendo...
            </>
          ) : (
            <>
              <Camera className="w-4 h-4" /> Tomar foto o subir imagen
            </>
          )}
        </button>
      )}

      {lightbox && value?.file_url && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80"
          onClick={closeLightbox}>
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value.file_url}
            alt={value.file_name}
            className="max-w-5xl max-h-[92vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-xs text-white/60 font-medium">
            {value.file_name}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Página ─────────────────────────────────────────────────────────────────────

export default function PaseEntradaPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data: rawData, isLoading } = useQuery({
    queryKey: ["getPassTransportista", id],
    queryFn: () => getPassTransportista(id, accountId),
    refetchOnWindowFocus: false,
    enabled: !!id,
  });

  const { grupoRequisitos } = useMenuStore();
  const { selectedLocations } = useSelectedLocationsStore();
  const { isAuth, userParentId } = useAuthStore();
  const searchParams = useSearchParams();
  const pId = searchParams.get("p_id");
  const accountId: number | undefined = isAuth
    ? (userParentId ?? undefined)
    : pId
      ? parseInt(pId, 10)
      : undefined;

  const PHONE_PREFIX_TO_COUNTRY: Record<number, string> = {
    1: "US",
    52: "MX",
    34: "ES",
    57: "CO",
    55: "BR",
    54: "AR",
    56: "CL",
  };
  const primeraLocation = selectedLocations?.[0];
  const grupoReq = grupoRequisitos.find((g) => g.ubicacion === primeraLocation);
  const defaultCountry =
    (grupoReq?.prefijo_telefonico != null &&
      PHONE_PREFIX_TO_COUNTRY[grupoReq.prefijo_telefonico]) ||
    "MX";

  const { uploadImageMutation } = useUploadImage();

  // Fotos
  type PhotoState = { file_name: string; file_url: string; uploading: boolean };
  const emptyPhoto = (): PhotoState => ({
    file_name: "",
    file_url: "",
    uploading: false,
  });
  const [photos, setPhotos] = useState({
    conductor: emptyPhoto(),
    ayudante: emptyPhoto(),
    vehiculo: emptyPhoto(),
    contenedores: emptyPhoto(),
  });

  const uploadPhoto = async (key: keyof typeof photos, file: File | null) => {
    if (!file) {
      setPhotos((p) => ({ ...p, [key]: emptyPhoto() }));
      return;
    }
    setPhotos((p) => ({ ...p, [key]: { ...p[key], uploading: true } }));
    try {
      const renamed = new File(
        [file],
        reemplazarGuionMinuscula(`${key}_transportista ${file.name}`),
        { type: file.type },
      );
      const result = await uploadImageMutation.mutateAsync({ img: renamed });
      setPhotos((p) => ({
        ...p,
        [key]: {
          file_name: result?.file_name ?? file.name,
          file_url: result?.file_url ?? "",
          uploading: false,
        },
      }));
    } catch {
      setPhotos((p) => ({ ...p, [key]: emptyPhoto() }));
    }
  };

  // Guardar información
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<Record<
    string,
    any
  > | null>(null);
  const { mutate: guardarInfo, isPending: guardando } = useMutation({
    mutationFn: (payload: unknown) =>
      updateInformationTransportista(payload, accountId),
    onSuccess: () => {
      setConfirmOpen(false);
      setPendingPayload(null);
      // Lock all fields that now have a value
      setLockedFields((prev) => {
        const next = { ...prev };
        (Object.keys(form) as (keyof typeof form)[]).forEach((k) => {
          if (form[k]) next[k] = true;
        });
        return next;
      });
      setLockedPhotos((prev) => ({
        conductor: prev.conductor || !!photos.conductor.file_url,
        ayudante: prev.ayudante || !!photos.ayudante.file_url,
        vehiculo: prev.vehiculo || !!photos.vehiculo.file_url,
        contenedores: prev.contenedores || !!photos.contenedores.file_url,
      }));
      if (contenedores.some((c) => c.numero || c.sello || c.tipo)) {
        setLockedContenedores(true);
      }
    },
  });

  // Modal reenviar
  const [reenviarOpen, setReenviarOpen] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [submitToken, setSubmitToken] = useState<string | null>(null);
  const [envioNombre, setEnvioNombre] = useState("");
  const [envioCorreo, setEnvioCorreo] = useState("");
  const [envioTelefono, setEnvioTelefono] = useState<string | undefined>(
    undefined,
  );

  // Form de complementación
  const [form, setForm] = useState({
    // Conductor
    conductorNombre: "",
    conductorLicencia: "",
    conductorExpedicion: "",
    conductorVigencia: "",
    // Ayudante / Conductor 2
    ayudanteNombre: "",
    ayudanteLicencia: "",
    ayudanteExpedicion: "",
    ayudanteVigencia: "",
    // Vehículo
    vehiculoLinea: "",
    vehiculoTipo: "",
    vehiculoMarca: "",
    vehiculoModelo: "",
    vehiculoAño: "",
    vehiculoPlacas: "",
    vehiculoEconomico: "",
    vehiculoNIV: "",
  });
  const setField = (key: string, value: string) =>
    setForm((p) => ({ ...p, [key]: value }));

  // Contenedores (multi)
  const [contenedores, setContenedores] = useState([
    { id: "contenedor-0", numero: "", sello: "", tipo: "" },
  ]);
  const addContenedor = () =>
    setContenedores((p) => [
      ...p,
      { id: crypto.randomUUID(), numero: "", sello: "", tipo: "" },
    ]);
  const removeContenedor = (id: string) =>
    setContenedores((p) => p.filter((c) => c.id !== id));
  const setContenedorField = (
    id: string,
    field: "numero" | "sello" | "tipo",
    value: string,
  ) =>
    setContenedores((p) =>
      p.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    );

  // Bloqueo de campos pre-llenados por API
  const [lockedFields, setLockedFields] = useState<Record<string, boolean>>({});
  const [lockedPhotos, setLockedPhotos] = useState<Record<string, boolean>>({});
  const [lockedContenedores, setLockedContenedores] = useState(false);
  const initializedRef = useRef(false);

  const d = rawData?.response?.data;

  useEffect(() => {
    if (!d || initializedRef.current) return;
    initializedRef.current = true;

    const locked: Record<string, boolean> = {};
    const lockedPh: Record<string, boolean> = {};
    const updates: Partial<typeof form> = {};

    if (d.conductor_nombre) {
      updates.conductorNombre = d.conductor_nombre;
      locked.conductorNombre = true;
    }
    if (d.conductor_no_licencia) {
      updates.conductorLicencia = d.conductor_no_licencia;
      locked.conductorLicencia = true;
    }
    if (d.conductor_lugar_expedicion) {
      updates.conductorExpedicion = d.conductor_lugar_expedicion;
      locked.conductorExpedicion = true;
    }
    if (d.conductor_vigencia) {
      updates.conductorVigencia = d.conductor_vigencia;
      locked.conductorVigencia = true;
    }

    if (d.ayudante_nombre) {
      updates.ayudanteNombre = d.ayudante_nombre;
      locked.ayudanteNombre = true;
    }
    if (d.ayudante_no_licencia) {
      updates.ayudanteLicencia = d.ayudante_no_licencia;
      locked.ayudanteLicencia = true;
    }
    if (d.ayudante_lugar_expedicion) {
      updates.ayudanteExpedicion = d.ayudante_lugar_expedicion;
      locked.ayudanteExpedicion = true;
    }
    if (d.ayudante_vigencia) {
      updates.ayudanteVigencia = d.ayudante_vigencia;
      locked.ayudanteVigencia = true;
    }

    if (d.vehiculo_linea) {
      updates.vehiculoLinea = d.vehiculo_linea;
      locked.vehiculoLinea = true;
    }
    if (d.vehiculo_tipo_unidad) {
      updates.vehiculoTipo = d.vehiculo_tipo_unidad;
      locked.vehiculoTipo = true;
    }
    if (d.vehiculo_marca) {
      updates.vehiculoMarca = d.vehiculo_marca;
      locked.vehiculoMarca = true;
    }
    if (d.vehiculo_modelo) {
      updates.vehiculoModelo = d.vehiculo_modelo;
      locked.vehiculoModelo = true;
    }
    if (d.vehiculo_year) {
      updates.vehiculoAño = d.vehiculo_year;
      locked.vehiculoAño = true;
    }
    if (d.vehiculo_placas) {
      updates.vehiculoPlacas = d.vehiculo_placas;
      locked.vehiculoPlacas = true;
    }
    if (d.vehiculo_no_economico) {
      updates.vehiculoEconomico = d.vehiculo_no_economico;
      locked.vehiculoEconomico = true;
    }
    if (d.vehiculo_niv) {
      updates.vehiculoNIV = d.vehiculo_niv;
      locked.vehiculoNIV = true;
    }

    if (Object.keys(updates).length) setForm((p) => ({ ...p, ...updates }));
    setLockedFields(locked);

    const photoUpdates: Partial<typeof photos> = {};
    if (d.conductor_foto_licencia?.[0]) {
      photoUpdates.conductor = {
        ...d.conductor_foto_licencia[0],
        uploading: false,
      };
      lockedPh.conductor = true;
    }
    if (d.ayudante_foto_licencia?.[0]) {
      photoUpdates.ayudante = {
        ...d.ayudante_foto_licencia[0],
        uploading: false,
      };
      lockedPh.ayudante = true;
    }
    if (d.vehiculo_tarjeta_circulacion?.[0]) {
      photoUpdates.vehiculo = {
        ...d.vehiculo_tarjeta_circulacion[0],
        uploading: false,
      };
      lockedPh.vehiculo = true;
    }
    if (d.foto_contenedores?.[0]) {
      photoUpdates.contenedores = {
        ...d.foto_contenedores[0],
        uploading: false,
      };
      lockedPh.contenedores = true;
    }
    if (Object.keys(photoUpdates).length)
      setPhotos((p) => ({ ...p, ...photoUpdates }));
    setLockedPhotos(lockedPh);

    if (d.contenedores?.length > 0) {
      setContenedores(
        (
          d.contenedores as Array<{
            numero?: string;
            sello?: string;
            tipo?: string;
          }>
        ).map((c) => ({
          id: crypto.randomUUID(),
          numero: c.numero ?? "",
          sello: c.sello ?? "",
          tipo: c.tipo ?? "",
        })),
      );
      setLockedContenedores(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d]);

  const { mutate: generarToken, isPending: generandoToken } = useMutation({
    mutationFn: () => generateSubmitTokenTransportista(d?._id, accountId),
    onSuccess: (res) => {
      const token = res?.response?.data?.token;
      if (token) setSubmitToken(token);
    },
  });

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [submitUrl, setSubmitUrl] = useState<string | null>(null);
  useEffect(() => {
    if (d?._id) {
      setSubmitUrl(
        `${window.location.origin}/transportistas/submit/transportista/${d._id}${accountId ? `?p_id=${accountId}` : ""}`,
      );
    }
  }, [d?._id, accountId]);

  const submitMessage =
    submitUrl && submitToken
      ? `👋 Hola, te comparto tu pase de entrada.\n\n🔗 Enlace de acceso:\n${submitUrl}\n\n🔑 Tu código de acceso:\n${submitToken}\n\n✅ Abre el enlace e ingresa el código cuando te lo soliciten.`
      : null;

  const handleOpenReenviar = () => {
    setReenviarOpen(true);
    if (!submitToken) generarToken();
  };
  const handleCopyMsg = async () => {
    if (!submitMessage) return;
    await navigator.clipboard.writeText(submitMessage);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2500);
  };
  const handleCopyUrl = async () => {
    if (!submitUrl) return;
    await navigator.clipboard.writeText(submitUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };
  const handleCopyToken = async () => {
    if (!submitToken) return;
    await navigator.clipboard.writeText(submitToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2500);
  };
  const handleEnviarCorreo = () => {
    /* TODO: conectar endpoint */
  };
  const handleEnviarSms = () => {
    /* TODO: conectar endpoint */
  };

  if (!mounted || isLoading)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <span className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );

  if (!d)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-400">No se encontró el pase.</p>
      </div>
    );

  const qrUrl = d.qr?.[0]?.file_url ?? null;
  const tipoLabel = TIPO_LABEL[d.tipo_de_operacion] ?? d.tipo_de_operacion;
  const horario =
    d.hora_inicial && d.hora_final
      ? `${d.hora_inicial.slice(0, 5)} – ${d.hora_final.slice(0, 5)}`
      : null;
  const horarioRecoleccion =
    d.hora_inicial_recoleccion && d.hora_final_recoleccion
      ? `${d.hora_inicial_recoleccion.slice(0, 5)} – ${d.hora_final_recoleccion.slice(0, 5)}`
      : null;

  const documentos: {
    tipo?: string;
    no_doc?: string;
    file_name: string;
    file_url: string;
  }[] = (d.documentos ?? []).flatMap((doc: any) =>
    (doc.archivo ?? []).map((a: any) => ({
      tipo: doc.tipo ?? null,
      no_doc: doc.no_doc ?? null,
      file_name: a.file_name,
      file_url: a.file_url,
    })),
  );
  const materiales: Record<string, any>[] = d.materiales ?? [];

  const MATERIAL_COLS = [
    { key: "contenedor", label: "Contenedor" },
    { key: "sello", label: "Sello" },
    { key: "tipo", label: "Tipo" },
    { key: "cantidad", label: "Cantidad" },
    { key: "peso", label: "Peso" },
    { key: "volumen", label: "Volumen" },
  ];
  const colsConDatos = MATERIAL_COLS.filter((c) =>
    materiales.some((row) => row[c.key] != null && row[c.key] !== ""),
  );

  const segundaPersonaLabel =
    SEGUNDA_PERSONA_TITULO[d.tipo_de_operacion] ?? "Contacto";

  const fechaEntrega = formatFecha(d.fecha_desde, d.fecha_hasta);

  const allFieldsLocked =
    Object.keys(form).every((k) => !!lockedFields[k]) &&
    !!lockedPhotos.conductor &&
    !!lockedPhotos.ayudante &&
    !!lockedPhotos.vehiculo &&
    !!lockedPhotos.contenedores &&
    lockedContenedores;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="w-full max-w-4xl mx-auto space-y-5">
        {/* Marca + título */}
        <div className="flex items-center gap-2 px-1">
          <span className="text-sm text-gray-500">
            Clave10 <span className="text-gray-300">·</span> Pase de entrada
          </span>
        </div>

        <div className="px-1">
          <h1 className="text-xl font-bold text-gray-800">{tipoLabel}</h1>
          {(d.ubicacion || horario) && (
            <p className="text-sm text-gray-400 mt-0.5">
              {d.ubicacion}
              {horario ? ` · ${horario}` : ""}
            </p>
          )}
        </div>

        {/* ── Layout principal: info + sidebar ── */}
        <div className="flex flex-col lg:flex-row gap-4 items-stretch">
          {/* Columna izquierda: cards de info */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* 2x2 info cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Lugar de recolección */}
              <InfoCard title="Lugar de recolección" icon={Truck}>
                <InfoRow label="Lugar" value={d.lugar_recoleccion} />
                <InfoRow label="Dirección" value={d.direccion_recoleccion} />
                <InfoRow label="Fecha" value={d.fecha_recoleccion} />
                <InfoRow label="Horario" value={horarioRecoleccion} />
                <InfoRow label="Andén" value={d.anden_recoleccion} />
                <InfoRow label="Responsable" value={d.responsable} />
              </InfoCard>

              {/* Lugar de entrega / recepción */}
              <InfoCard title="Lugar de entrega / recepción" icon={MapPin}>
                <InfoRow label="Ubicación" value={d.ubicacion} />
                <InfoRow label="Dirección" value={d.direccion} />
                <InfoRow label="Fecha" value={fechaEntrega} />
                <InfoRow label="Horario" value={horario} />
                <InfoRow label="Andén" value={d.anden} />
              </InfoCard>

              {/* Segunda persona (proveedor / cliente) */}
              <InfoCard title={segundaPersonaLabel} icon={Building2}>
                <InfoRow label="Nombre" value={d.proveedor} />
                <InfoRow label="Email" value={d.proveedor_email} />
                <InfoRow label="Teléfono" value={d.proveedor_telefono} />
              </InfoCard>

              {/* Quien recibe */}
              <InfoCard title="Quien recibe" icon={User}>
                <InfoRow label="Nombre" value={d.nombre_crea_el_pase} />
                <InfoRow label="Email" value={d.email_crea_el_pase} />
                <InfoRow label="Teléfono" value={d.telefono_crea_el_pase} />
              </InfoCard>
            </div>

            {/* Tabla de materiales */}
            {colsConDatos.length > 0 && materiales.length > 0 && (
              <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-3">
                  Materiales
                  {d.proveedor_cliente_material && (
                    <span className="ml-2 normal-case font-normal text-blue-400">
                      — {d.proveedor_cliente_material}
                    </span>
                  )}
                  {d.orden_de_compra && (
                    <span className="ml-2 normal-case font-normal text-blue-400">
                      OC {d.orden_de_compra}
                    </span>
                  )}
                </p>
                <div className="overflow-x-auto rounded-xl border border-blue-100 bg-white">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-blue-50 bg-blue-50/80">
                        {colsConDatos.map((c) => (
                          <th
                            key={c.key}
                            className="text-left px-3 py-2 text-[10px] font-bold text-blue-400 uppercase tracking-wide whitespace-nowrap">
                            {c.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {materiales.map((row, i) => (
                        <tr
                          key={i}
                          className="border-b border-blue-50/60 last:border-0">
                          {colsConDatos.map((c) => (
                            <td
                              key={c.key}
                              className="px-3 py-2 text-gray-700 font-medium whitespace-nowrap">
                              {row[c.key] ?? (
                                <span className="text-gray-300">—</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Documentos dentro del card de materiales */}
                {documentos.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {documentos.map((doc, i) => (
                      <a
                        key={i}
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 bg-white border border-blue-100 rounded-lg px-2.5 py-1.5 hover:border-blue-300 transition-colors">
                        <FileText className="w-3 h-3 text-blue-400 shrink-0" />
                        <div className="flex flex-col min-w-0">
                          {(doc.tipo || doc.no_doc) && (
                            <span className="text-[10px] text-blue-500 font-medium leading-tight">
                              {[doc.tipo, doc.no_doc]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          )}
                          <span className="text-[11px] text-gray-600 truncate max-w-[160px]">
                            {doc.file_name}
                          </span>
                        </div>
                        <Download className="w-3 h-3 text-blue-300 shrink-0" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar: QR + acciones */}
          <div className="w-full lg:w-64 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-center gap-4 h-full">
              {/* Datos del pase */}
              <div className="w-full space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Datos del pase
                </p>
                {[
                  { label: "Fecha creación", value: d.created_at ?? null },
                  { label: "Folio", value: d.folio ?? null },
                  { label: "Planta", value: d.ubicacion ?? null },
                  { label: "Destino", value: d.direccion ?? null },
                  {
                    label: "Fecha",
                    value: fechaEntrega
                      ? `${fechaEntrega}${horario ? `, ${horario}` : ""}`
                      : (horario ?? null),
                  },
                  { label: "Andén", value: d.anden ?? null },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex items-baseline justify-between gap-2 py-1 border-b border-gray-50 last:border-0">
                    <span className="text-[11px] text-gray-400 shrink-0">
                      {label}
                    </span>
                    <span
                      className={cn(
                        "text-[11px] font-semibold text-right min-w-0 break-words",
                        value ? "text-gray-700" : "text-gray-300 italic",
                      )}>
                      {value ?? "—"}
                    </span>
                  </div>
                ))}
              </div>

              {/* QR */}
              <div className="w-44 h-44 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                {qrUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrUrl}
                    alt="QR pase"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <QrCode className="w-16 h-16 text-gray-200" />
                )}
              </div>

              {/* Acciones */}
              <div className="w-full space-y-2">
                <button
                  type="button"
                  onClick={handleOpenReenviar}
                  className="w-full flex items-center justify-center gap-2 h-9 rounded-xl border border-blue-200 text-blue-600 text-xs font-semibold hover:bg-blue-50 transition-colors">
                  <Share2 className="w-3.5 h-3.5" /> Compartir
                </button>
                <button
                  type="button"
                  disabled
                  className="w-full flex items-center justify-center gap-2 h-9 rounded-xl border border-gray-200 text-gray-400 text-xs font-semibold cursor-not-allowed">
                  <Download className="w-3.5 h-3.5" /> Descargar pase
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Sección de complementación ── */}
        <div className="space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-1">
            Complementar información
          </p>

          {/* Fila 1: Conductor + Ayudante */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Conductor */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 rounded-xl">
                  <User className="w-4 h-4 text-indigo-600" />
                </div>
                <p className="font-semibold text-gray-800 text-sm">Conductor</p>
              </div>
              <PhotoField
                label="Foto de licencia"
                required
                value={photos.conductor.file_url ? photos.conductor : null}
                uploading={photos.conductor.uploading}
                onChange={(f) => uploadPhoto("conductor", f)}
                disabled={lockedPhotos.conductor}
              />
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  label="Nombre"
                  value={form.conductorNombre}
                  onChange={(v) => setField("conductorNombre", v)}
                  placeholder="Extraído de licencia..."
                  ia
                  disabled={lockedFields.conductorNombre}
                />
                <FormField
                  label="No. de licencia"
                  value={form.conductorLicencia}
                  onChange={(v) => setField("conductorLicencia", v)}
                  placeholder="Extraído de licencia..."
                  ia
                  disabled={lockedFields.conductorLicencia}
                />
                <FormField
                  label="Lugar de expedición"
                  value={form.conductorExpedicion}
                  onChange={(v) => setField("conductorExpedicion", v)}
                  placeholder="Extraído de licencia..."
                  ia
                  disabled={lockedFields.conductorExpedicion}
                />
                <FormField
                  label="Vigencia"
                  type="date"
                  value={form.conductorVigencia}
                  onChange={(v) => setField("conductorVigencia", v)}
                  ia
                  disabled={lockedFields.conductorVigencia}
                />
              </div>
            </div>

            {/* Ayudante / Conductor 2 */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-50 rounded-xl">
                  <User className="w-4 h-4 text-purple-600" />
                </div>
                <p className="font-semibold text-gray-800 text-sm">
                  Ayudante / Conductor 2
                </p>
              </div>
              <PhotoField
                label="Foto de licencia"
                value={photos.ayudante.file_url ? photos.ayudante : null}
                uploading={photos.ayudante.uploading}
                onChange={(f) => uploadPhoto("ayudante", f)}
                disabled={lockedPhotos.ayudante}
              />
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  label="Nombre"
                  value={form.ayudanteNombre}
                  onChange={(v) => setField("ayudanteNombre", v)}
                  placeholder="Extraído de licencia..."
                  ia
                  disabled={lockedFields.ayudanteNombre}
                />
                <FormField
                  label="No. de licencia"
                  value={form.ayudanteLicencia}
                  onChange={(v) => setField("ayudanteLicencia", v)}
                  placeholder="Extraído de licencia..."
                  ia
                  disabled={lockedFields.ayudanteLicencia}
                />
                <FormField
                  label="Lugar de expedición"
                  value={form.ayudanteExpedicion}
                  onChange={(v) => setField("ayudanteExpedicion", v)}
                  placeholder="Extraído de licencia..."
                  ia
                  disabled={lockedFields.ayudanteExpedicion}
                />
                <FormField
                  label="Vigencia"
                  type="date"
                  value={form.ayudanteVigencia}
                  onChange={(v) => setField("ayudanteVigencia", v)}
                  ia
                  disabled={lockedFields.ayudanteVigencia}
                />
              </div>
            </div>
          </div>

          {/* Fila 2: Vehículo (ancho completo) */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-teal-50 rounded-xl">
                <Truck className="w-4 h-4 text-teal-600" />
              </div>
              <p className="font-semibold text-gray-800 text-sm">Vehículo</p>
            </div>
            <PhotoField
              label="Tarjeta de circulación"
              required
              value={photos.vehiculo.file_url ? photos.vehiculo : null}
              uploading={photos.vehiculo.uploading}
              onChange={(f) => uploadPhoto("vehiculo", f)}
              disabled={lockedPhotos.vehiculo}
            />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <FormField
                label="Línea"
                value={form.vehiculoLinea}
                onChange={(v) => setField("vehiculoLinea", v)}
                placeholder="Extraído de tarjeta..."
                ia
                disabled={lockedFields.vehiculoLinea}
              />
              <FormField
                label="Tipo de unidad"
                value={form.vehiculoTipo}
                onChange={(v) => setField("vehiculoTipo", v)}
                placeholder="Extraído de tarjeta..."
                ia
                disabled={lockedFields.vehiculoTipo}
              />
              <FormField
                label="Marca"
                value={form.vehiculoMarca}
                onChange={(v) => setField("vehiculoMarca", v)}
                placeholder="Extraído de tarjeta..."
                ia
                disabled={lockedFields.vehiculoMarca}
              />
              <FormField
                label="Modelo"
                value={form.vehiculoModelo}
                onChange={(v) => setField("vehiculoModelo", v)}
                placeholder="Extraído de tarjeta..."
                ia
                disabled={lockedFields.vehiculoModelo}
              />
              <FormField
                label="Año"
                value={form.vehiculoAño}
                onChange={(v) => setField("vehiculoAño", v)}
                placeholder="Extraído de tarjeta..."
                ia
                disabled={lockedFields.vehiculoAño}
              />
              <FormField
                label="Placas"
                value={form.vehiculoPlacas}
                onChange={(v) => setField("vehiculoPlacas", v)}
                placeholder="Extraído de tarjeta..."
                ia
                disabled={lockedFields.vehiculoPlacas}
              />
              <FormField
                label="No. económico"
                value={form.vehiculoEconomico}
                onChange={(v) => setField("vehiculoEconomico", v)}
                placeholder="Extraído de tarjeta..."
                ia
                disabled={lockedFields.vehiculoEconomico}
              />
              <FormField
                label="NIV"
                value={form.vehiculoNIV}
                onChange={(v) => setField("vehiculoNIV", v)}
                placeholder="Extraído de tarjeta..."
                ia
                disabled={lockedFields.vehiculoNIV}
              />
            </div>
          </div>

          {/* Fila 3: Contenedores (ancho completo, multi) */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 rounded-xl">
                  <Package className="w-4 h-4 text-amber-600" />
                </div>
                <p className="font-semibold text-gray-800 text-sm">
                  Contenedores
                </p>
                <span className="text-[10px] font-semibold bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">
                  {contenedores.length}
                </span>
              </div>
            </div>

            {/* Foto general */}
            <PhotoField
              label="Foto de contenedores"
              value={photos.contenedores.file_url ? photos.contenedores : null}
              uploading={photos.contenedores.uploading}
              onChange={(f) => uploadPhoto("contenedores", f)}
              disabled={lockedPhotos.contenedores}
            />

            {/* Lista de contenedores */}
            <div className="space-y-2">
              {contenedores.map((c, idx) => (
                <div
                  key={c.id}
                  className="flex items-start gap-2 bg-gray-50 rounded-xl p-3 group">
                  <span className="text-[10px] font-bold text-gray-300 pt-2.5 w-5 shrink-0 text-center">
                    {idx + 1}
                  </span>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <FormField
                      label="No. contenedor"
                      value={c.numero}
                      onChange={(v) => setContenedorField(c.id, "numero", v)}
                      placeholder="Ej. CRLU2332440"
                      ia
                      disabled={lockedContenedores}
                    />
                    <FormField
                      label="Sello"
                      value={c.sello}
                      onChange={(v) => setContenedorField(c.id, "sello", v)}
                      placeholder="Ej. SL-1234"
                      ia
                      disabled={lockedContenedores}
                    />
                    <FormField
                      label="Tipo"
                      value={c.tipo}
                      onChange={(v) => setContenedorField(c.id, "tipo", v)}
                      placeholder="Ej. 40HC"
                      ia
                      disabled={lockedContenedores}
                    />
                  </div>
                  {!lockedContenedores && contenedores.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeContenedor(c.id)}
                      className="mt-1 p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {!lockedContenedores && (
              <button
                type="button"
                onClick={addContenedor}
                className="w-full flex items-center justify-center gap-2 h-9 rounded-xl border border-dashed border-amber-200 text-amber-500 text-xs font-semibold hover:bg-amber-50 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Agregar contenedor
              </button>
            )}
          </div>

          {/* Botón guardar */}
          <div className="mt-4 flex justify-end">
            <Button
              disabled={allFieldsLocked}
              onClick={() => {
                const payload = {
                  record_id: d._id,
                  conductor: {
                    foto: photos.conductor.file_url
                      ? {
                          file_name: photos.conductor.file_name,
                          file_url: photos.conductor.file_url,
                        }
                      : null,
                    nombre: form.conductorNombre || null,
                    licencia: form.conductorLicencia || null,
                    lugar_expedicion: form.conductorExpedicion || null,
                    vigencia: form.conductorVigencia || null,
                  },
                  ayudante: {
                    foto: photos.ayudante.file_url
                      ? {
                          file_name: photos.ayudante.file_name,
                          file_url: photos.ayudante.file_url,
                        }
                      : null,
                    nombre: form.ayudanteNombre || null,
                    licencia: form.ayudanteLicencia || null,
                    lugar_expedicion: form.ayudanteExpedicion || null,
                    vigencia: form.ayudanteVigencia || null,
                  },
                  vehiculo: {
                    foto: photos.vehiculo.file_url
                      ? {
                          file_name: photos.vehiculo.file_name,
                          file_url: photos.vehiculo.file_url,
                        }
                      : null,
                    linea: form.vehiculoLinea || null,
                    tipo: form.vehiculoTipo || null,
                    marca: form.vehiculoMarca || null,
                    modelo: form.vehiculoModelo || null,
                    año: form.vehiculoAño || null,
                    placas: form.vehiculoPlacas || null,
                    economico: form.vehiculoEconomico || null,
                    niv: form.vehiculoNIV || null,
                  },
                  foto_contenedores: photos.contenedores.file_url
                    ? {
                        file_name: photos.contenedores.file_name,
                        file_url: photos.contenedores.file_url,
                      }
                    : null,
                  contenedores: contenedores
                    .filter((c) => c.numero || c.sello || c.tipo)
                    .map((c) => ({
                      numero: c.numero || null,
                      sello: c.sello || null,
                      tipo: c.tipo || null,
                    })),
                };
                setPendingPayload(payload);
                setConfirmOpen(true);
              }}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-6 disabled:opacity-50 disabled:cursor-not-allowed">
              Guardar información
            </Button>
          </div>
        </div>

        <p className="text-center text-[11px] text-gray-300 pb-4">
          Clave10 · Pase #{id.slice(-8).toUpperCase()}
        </p>
      </div>

      {/* ── Modal reenviar ── */}
      {reenviarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setReenviarOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 rounded-lg">
                  <Send className="w-4 h-4 text-blue-600" />
                </div>
                <p className="font-semibold text-gray-800 text-sm">
                  Compartir pase
                </p>
              </div>
              <button
                onClick={() => setReenviarOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {generandoToken ? (
              <div className="flex items-center justify-center gap-2 py-6">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span className="text-xs text-gray-400">
                  Generando enlace...
                </span>
              </div>
            ) : submitMessage ? (
              <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 p-4 space-y-3">
                <p className="text-[12px] text-white/95 leading-relaxed font-medium">
                  👋 Hola, te comparto tu pase de entrada.
                  <br />
                  <span className="text-white/70 text-[11px]">
                    Abre el enlace e ingresa tu código cuando te lo soliciten.
                  </span>
                </p>
                <div className="space-y-1">
                  <p className="text-[10px] text-blue-100/80 uppercase font-bold tracking-widest">
                    🔗 Enlace de acceso
                  </p>
                  <div className="bg-white/10 border border-white/15 rounded-xl px-3 py-2 flex items-center gap-2">
                    <p className="text-[11px] text-white/90 font-mono break-all leading-relaxed flex-1">
                      {submitUrl}
                    </p>
                    <button
                      type="button"
                      onClick={handleCopyUrl}
                      className="shrink-0 text-white/50 hover:text-white transition-colors">
                      {copiedUrl ? (
                        <Check className="w-3.5 h-3.5 text-green-300" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-blue-100/80 uppercase font-bold tracking-widest">
                    🔑 Tu código de acceso
                  </p>
                  <div className="bg-white rounded-xl px-4 py-3 flex items-center justify-center gap-2 shadow-sm overflow-hidden">
                    <p className="text-xs text-indigo-600 font-mono font-bold tracking-[0.08em] break-all text-center leading-relaxed flex-1">
                      {submitToken}
                    </p>
                    <button
                      type="button"
                      onClick={handleCopyToken}
                      className="shrink-0 text-indigo-300 hover:text-indigo-500 transition-colors">
                      {copiedToken ? (
                        <Check className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyMsg}
                  className={cn(
                    "w-full flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-bold transition-all",
                    copiedMsg
                      ? "bg-green-400/25 text-green-200 border border-green-400/40"
                      : "bg-white/15 text-white border border-white/20 hover:bg-white/25",
                  )}>
                  {copiedMsg ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> ✅ Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copiar mensaje
                    </>
                  )}
                </button>
              </div>
            ) : (
              <p className="text-xs text-red-400 text-center py-4">
                No se pudo generar el enlace.
              </p>
            )}

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-[10px] text-gray-300 font-medium uppercase tracking-widest">
                o enviar directamente
              </span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
                  Nombre del transportista
                </label>
                <input
                  value={envioNombre}
                  onChange={(e) => setEnvioNombre(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 placeholder:text-gray-300 transition"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={envioCorreo}
                  onChange={(e) => setEnvioCorreo(e.target.value)}
                  placeholder="juan@ejemplo.com"
                  className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 placeholder:text-gray-300 transition"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
                  Teléfono
                </label>
                <PhoneInput
                  value={envioTelefono}
                  onChange={setEnvioTelefono}
                  defaultCountry={defaultCountry as any}
                  containerComponentProps={{
                    className:
                      "flex h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-3 text-sm focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300 transition",
                  }}
                  numberInputProps={{
                    className:
                      "pl-2 bg-transparent text-sm placeholder:text-gray-300 outline-none w-full",
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleEnviarCorreo}
                disabled={!envioCorreo || !envioNombre}
                className="flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-semibold border border-blue-200 text-blue-600 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                <Send className="w-3.5 h-3.5" /> Enviar por correo
              </button>
              <button
                type="button"
                onClick={handleEnviarSms}
                disabled={!envioTelefono || !envioNombre}
                className="flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                <Send className="w-3.5 h-3.5" /> Enviar por SMS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal confirmación guardar ── */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !guardando && setConfirmOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 rounded-xl shrink-0">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">
                  Confirmar información
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  ¿Deseas guardar la información complementaria del pase?
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 bg-gray-50 rounded-xl px-4 py-3 leading-relaxed">
              Esta acción actualizará los datos del conductor, vehículo,
              ayudante y contenedores asociados al pase.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={guardando}
                className="h-9 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 transition-colors">
                Cancelar
              </button>
              <button
                type="button"
                disabled={guardando}
                onClick={() => pendingPayload && guardarInfo(pendingPayload)}
                className="h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
                {guardando ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                  </>
                ) : (
                  "Confirmar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
