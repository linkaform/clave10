"use client";

import { use, useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  FileText,
  Download,
  Share2,
  QrCode,
  Check,
  X,
  Loader2,
  User,
  Truck,
  Package,
  Camera,
  Sparkles,
  Plus,
  KeyRound,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getPassTransportista,
  validateTokenTransportista,
  updateInformationTransportista,
} from "@/services/endpoints";
import useAuthStore from "@/store/useAuthStore";
import { cn, reemplazarGuionMinuscula } from "@/lib/utils";
import { useUploadImage } from "@/hooks/useUploadImage";

// ── Helpers ────────────────────────────────────────────────────────────────────

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

// ── Sub-componentes ─────────────────────────────────────────────────────────────

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
  value,
  uploading,
  onChange,
  disabled,
}: {
  label: string;
  required?: boolean;
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

export default function SubmitTransportistaPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token: recordId } = use(params);
  const { uploadImageMutation } = useUploadImage();
  const { isAuth, userParentId } = useAuthStore();
  const searchParams = useSearchParams();
  const pId = searchParams.get("p_id");
  const accountId: number | undefined = isAuth
    ? (userParentId ?? undefined)
    : pId
      ? parseInt(pId, 10)
      : undefined;

  // ── Gate: token ──
  const [tokenInput, setTokenInput] = useState("");
  const [tokenValidated, setTokenValidated] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const { mutate: validateToken, isPending: validatingToken } = useMutation({
    mutationFn: () =>
      validateTokenTransportista(recordId, tokenInput.trim(), accountId),
    onSuccess: (res) => {
      if (res?.success && res?.response?.data === true) {
        setTokenError(null);
        setTokenValidated(true);
      } else {
        setTokenError("Token incorrecto. Verifica e intenta de nuevo.");
      }
    },
    onError: () =>
      setTokenError("No se pudo validar el token. Intenta de nuevo."),
  });

  const { data: rawData, isLoading } = useQuery({
    queryKey: ["getPassTransportista", recordId],
    queryFn: () => getPassTransportista(recordId, accountId),
    refetchOnWindowFocus: false,
    enabled: tokenValidated,
  });

  // ── Fotos ──
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

  // ── Form ──
  const [form, setForm] = useState({
    conductorNombre: "",
    conductorLicencia: "",
    conductorExpedicion: "",
    conductorVigencia: "",
    ayudanteNombre: "",
    ayudanteLicencia: "",
    ayudanteExpedicion: "",
    ayudanteVigencia: "",
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

  // ── Contenedores ──
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

  // ── Lock de campos pre-llenados ──
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

  const allFieldsLocked =
    Object.keys(form).every((k) => !!lockedFields[k]) &&
    !!lockedPhotos.conductor &&
    !!lockedPhotos.ayudante &&
    !!lockedPhotos.vehiculo &&
    !!lockedPhotos.contenedores &&
    lockedContenedores;

  // ── Guardar información ──
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<Record<
    string,
    any
  > | null>(null);
  const [savedOk, setSavedOk] = useState(false);
  const { mutate: guardarInfo, isPending: guardando } = useMutation({
    mutationFn: (payload: unknown) => updateInformationTransportista(payload),
    onSuccess: () => {
      setConfirmOpen(false);
      setPendingPayload(null);
      setSavedOk(true);
    },
  });

  // ── Copiar URL ──
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [pageUrl, setPageUrl] = useState("");
  useEffect(() => {
    setPageUrl(window.location.href);
  }, []);
  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(pageUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <span className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );

  // ── Gate: ingresar token ──
  if (!tokenValidated)
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-5">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              Clave10 · Pase de entrada
            </span>
          </div>
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
              <KeyRound className="w-8 h-8 text-blue-500" />
            </div>
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-800">
                Ingresa tu código
              </h1>
              <p className="text-sm text-gray-400 mt-1 leading-relaxed">
                Para acceder al formulario necesitas el código de acceso que te
                compartieron.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Código de acceso
            </label>
            <input
              value={tokenInput}
              onChange={(e) => {
                setTokenInput(e.target.value);
                setTokenError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && tokenInput.trim()) validateToken();
              }}
              placeholder="Ej. 6a277dfc0c501d4ac20ed79d"
              className={cn(
                "w-full h-11 px-4 text-sm font-mono border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition",
                tokenError
                  ? "border-red-300 focus:border-red-300"
                  : "border-gray-200 focus:border-blue-300",
              )}
            />
            {tokenError && (
              <div className="flex items-center gap-2 text-xs text-red-500">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {tokenError}
              </div>
            )}
          </div>
          <Button
            onClick={() => validateToken()}
            disabled={!tokenInput.trim() || validatingToken}
            className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2">
            {validatingToken ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Verificando...
              </>
            ) : (
              "Acceder al formulario"
            )}
          </Button>
          <p className="text-center text-[11px] text-gray-300">
            Si no tienes tu código, contacta a quien te generó el pase.
          </p>
        </div>
      </div>
    );

  if (isLoading)
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
  const fechaEntrega = formatFecha(d.fecha_desde, d.fecha_hasta);
  const horario =
    d.hora_inicial && d.hora_final
      ? `${d.hora_inicial.slice(0, 5)} – ${d.hora_final.slice(0, 5)}`
      : null;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="w-full max-w-4xl mx-auto space-y-5">
        {/* Cabecera */}
        <div className="flex items-center gap-2 px-1">
          <span className="text-sm text-gray-500">
            Clave10 <span className="text-gray-300">·</span> Datos de transporte
          </span>
        </div>
        <div className="px-1">
          <h1 className="text-xl font-bold text-gray-800">
            Complementa tus datos
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Sube las fotos de tu licencia y tarjeta de circulación. La IA
            extraerá los datos automáticamente.
          </p>
        </div>

        {/* Layout: form + sidebar */}
        <div className="flex flex-col lg:flex-row gap-4 items-start">
          {/* ── Columna izquierda: formulario ── */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Banner de éxito */}
            {savedOk && (
              <div className="rounded-2xl bg-white border border-green-100 shadow-sm p-8 flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-9 h-9 text-green-600" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-gray-800">
                    ¡Información guardada!
                  </h2>
                  <p className="text-sm text-gray-400 leading-relaxed max-w-xs mx-auto">
                    Tus datos quedaron asociados al pase{" "}
                    <span className="font-semibold text-gray-600">
                      {d.folio}
                    </span>
                    . El personal los tendrá listos cuando llegues.
                  </p>
                </div>
              </div>
            )}

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

            {/* Vehículo */}
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
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
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
                </div>
                <div className="h-px bg-gray-100" />
                <div className="grid grid-cols-2 gap-3">
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
            </div>

            {/* Fila 3: Contenedores */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
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
              <PhotoField
                label="Foto de contenedores"
                value={
                  photos.contenedores.file_url ? photos.contenedores : null
                }
                uploading={photos.contenedores.uploading}
                onChange={(f) => uploadPhoto("contenedores", f)}
                disabled={lockedPhotos.contenedores}
              />
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
            {!savedOk && (
              <div className="flex justify-end">
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
                      contenedores: contenedores.map((c) => ({
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
            )}
          </div>

          {/* ── Sidebar ── */}
          <div className="w-full lg:w-64 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-center gap-4">
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
                  onClick={handleCopyUrl}
                  className="w-full flex items-center justify-center gap-2 h-9 rounded-xl border border-blue-200 text-blue-600 text-xs font-semibold hover:bg-blue-50 transition-colors">
                  {copiedUrl ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> URL copiada
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" /> Compartir
                    </>
                  )}
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

        <p className="text-center text-[11px] text-gray-300 pb-4">
          Clave10 · Pase #{recordId.slice(-8).toUpperCase()}
        </p>
      </div>

      {/* ── Modal confirmación ── */}
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
