'use client';

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Users, Upload, Camera, Sparkles, Loader2, X, Download, Share2, UserPlus, Check, ExternalLink } from "lucide-react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import ImportarMiembrosModal from "./modals/importar-miembros-modal";
import { useOcr } from "@/hooks/ocr/useOcr";
import { useUploadImage } from "@/hooks/useUploadImage";
import { quitarAcentosYMinusculasYEspacios } from "@/lib/utils";
import LoadImage, { Imagen } from "./upload-Image";
import ViewImage from "./modals/view-image";
import type { CountryCode } from "libphonenumber-js";
import { toast } from "sonner";
import Image from "next/image";

export interface Miembro {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  foto?: Imagen[];
  estatus?: string;
  tipo_movimiento?: string;
  link?: string;

  url_hijo?: string;
  nombre_acompanante?: string;
  telefono_acompanante?: string;
  qr_code?: string;
  email_acompanante?: string;
  identificacion?: Imagen[];
}

type ModoMiembrosPase = 'crear' | 'ver' | 'completar';

interface MiembrosPaseProps {
  miembros: Miembro[];
  setMiembros: React.Dispatch<React.SetStateAction<Miembro[]>>;
  rowErrors: Record<string, { email: boolean; telefono: boolean }>;
  setRowErrors: React.Dispatch<React.SetStateAction<Record<string, { email: boolean; telefono: boolean }>>>;
  title?: string;
  useIA?: boolean;
  acompantes?: number;
  showDownload?: boolean;
  showCreatePass?: boolean;
  showShare?: boolean;
  onDownload?: (miembro: Miembro) => void;
  onCreatePass?: (miembro: Miembro) => void;
  onShare?: (miembro: Miembro) => void;
  defaultCountry?: CountryCode;
  allowAddRow?: boolean;
  /** @deprecated usa `modo="ver"` en su lugar. Se mantiene por compatibilidad. */
  viewMode?: boolean;
  /**
   * Comportamiento de la tabla:
   * - 'crear': todo editable, se pueden agregar filas nuevas (pantalla de creación del pase padre).
   * - 'ver': solo lectura (pantalla de pase activo).
   * - 'completar': editable, pero sin bloquear filas por estatus ni permitir agregar/eliminar filas
   *   (pantalla de completar datos de acompañantes de un pase padre en proceso).
   * Si no se especifica, se infiere de `viewMode` por compatibilidad.
   */
  modo?: ModoMiembrosPase;
  acompanantes_grupo?: Miembro[];
  acompanantesActivos?: Miembro[];
  nonDeletableIds?: string[];
}

const isValidEmail = (val: string) =>
  !val || /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(val);

const isValidPhone = (val: string) => !val || val.replace(/[\s\-().+]/g, "").length >= 7;

const EMPTY_ROW = (): Miembro => ({
  id: crypto.randomUUID(),
  nombre: "",
  email: "",
  telefono: "",
});

const MAX_VISIBLE = 15;
const ROW_HEIGHT = 52;

const EstatusBadge: React.FC<{ estatus?: string }> = ({ estatus }) => {
  const map: Record<string, { label: string; className: string }> = {
    proceso: { label: "Proceso", className: "bg-blue-600 text-white" },
    activo: { label: "Activo", className: "bg-green-500 text-white" },
    pendiente: { label: "Pendiente", className: "bg-amber-500 text-white" },
    usado: { label: "Usado", className: "bg-gray-400 text-white" },
    cancelado: { label: "Cancelado", className: "bg-red-500 text-white" },
  };
  const info = map[estatus?.toLowerCase() ?? ""] ?? {
    label: estatus || "Sin estatus",
    className: "bg-gray-200 text-gray-500",
  };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold shadow-sm w-fit ${info.className}`}>
      {info.label}
    </span>
  );
};

const MiembrosPase: React.FC<MiembrosPaseProps> = ({
  miembros,
  setMiembros,
  rowErrors,
  setRowErrors,
  title = "Listado de Acompañantes",
  useIA = false,
  acompantes,
  showDownload = false,
  showCreatePass = false,
  showShare = false,
  onDownload,
  onCreatePass,
  onShare,
  defaultCountry = "MX",
  allowAddRow,
  viewMode = false,
  modo,
  acompanantesActivos = [],
  nonDeletableIds = [],
}) => {
  const [draftRow, setDraftRow] = useState<Miembro>(EMPTY_ROW());
  const [draftErrors, setDraftErrors] = useState({ email: false, telefono: false });
  const [analizandoGlobal, setAnalizandoGlobal] = useState(false);
  const globalInputRef = useRef<HTMLInputElement>(null);
  const [copiedActivoId, setCopiedActivoId] = useState<string | null>(null);

  // Modo efectivo: si viene `modo` explícito se usa ese, si no se infiere de `viewMode`
  const modoActual: ModoMiembrosPase = modo ?? (viewMode ? 'ver' : 'crear');
  const esVista = modoActual === 'ver';
  const esCompletar = modoActual === 'completar';

  const ESTATUS_NO_EDITABLES = ["proceso", "activo"];

  // En modo "completar" nunca bloqueamos filas por estatus: todos los
  // acompañantes deben poder editarse aunque ya tengan su pase individual creado.
  const esNoEditable = (m: Miembro) =>
    !esCompletar &&
    !!m.estatus &&
    ESTATUS_NO_EDITABLES.includes(m.estatus.toLowerCase());

  const gruposExistentes = [
    ...acompanantesActivos,
    ...miembros.filter(esNoEditable),
  ];

  const miembrosEditables = miembros.filter((m) => !esNoEditable(m));

  const [openImportar, setOpenImportar] = useState(false);

  const handleCopyLinkActivo = async (m: Miembro) => {
    if (!m.link) {
      toast?.error?.("Este miembro no tiene link disponible");
      return;
    }
    try {
      await navigator.clipboard.writeText(m.link);
      setCopiedActivoId(m.id);
      toast?.success?.("Link copiado");
      setTimeout(() => setCopiedActivoId(null), 1500);
    } catch {
      toast?.error?.("No se pudo copiar el link");
    }
  };

  const { ocrIdMutation } = useOcr();
  const { uploadImageMutation } = useUploadImage();

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = async (m: Miembro) => {
    if (!m.link) {
      toast?.error?.("Este miembro no tiene link disponible");
      return;
    }
    try {
      await navigator.clipboard.writeText(m.link);
      setCopiedId(m.id);
      toast?.success?.("Link copiado");
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      toast?.error?.("No se pudo copiar el link");
    }
  };

  const hasAnyError =
    Object.values(rowErrors).some((e) => e.email || e.telefono) ||
    draftErrors.email || draftErrors.telefono;

  // Crear filas vacías al montar si hay acompañantes definidos
  useEffect(() => {
    if (!acompantes || acompantes <= 0) return;
    setMiembros((prev) => {
      if (prev.length >= acompantes) return prev; // ya hay filas suficientes
      const faltantes = acompantes - prev.length;
      const nuevas = Array.from({ length: faltantes }, () => EMPTY_ROW());
      return [...prev, ...nuevas];
    });
  }, [acompantes, setMiembros]);

  const handleEditCell = (id: string, field: keyof Miembro, value: string) => {
    setMiembros((prev) => prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  };

  const handleBlurSaved = (id: string, field: "email" | "telefono", value: string) => {
    const invalid = field === "email" ? !isValidEmail(value) : !isValidPhone(value);
    setRowErrors((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || { email: false, telefono: false }), [field]: invalid },
    }));
  };

  const handleBlurDraft = (field: "email" | "telefono") => {
    const value = field === "email" ? draftRow.email : draftRow.telefono;
    const invalid = field === "email" ? !isValidEmail(value) : !isValidPhone(value);
    setDraftErrors((prev) => ({ ...prev, [field]: invalid }));
  };

  const commitDraft = () => {
    if (!draftRow.nombre.trim()) return;
    const emailErr = !isValidEmail(draftRow.email);
    const phoneErr = !isValidPhone(draftRow.telefono);
    const newMiembro = { ...draftRow };
    setMiembros((prev) => [...prev, newMiembro]);
    if (emailErr || phoneErr) {
      setRowErrors((prev) => ({
        ...prev,
        [newMiembro.id]: { email: emailErr, telefono: phoneErr },
      }));
    }
    setDraftRow(EMPTY_ROW());
    setDraftErrors({ email: false, telefono: false });
    setTimeout(() => document.getElementById("draft-nombre")?.focus(), 50);
  };

  const handleEliminarDirecto = (m: Miembro) => {
    setMiembros((prev) => prev.filter((x) => x.id !== m.id));
    setRowErrors((prev) => { const n = { ...prev }; delete n[m.id]; return n; });
  };

  const handleDraftKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, field: string) => {
    if (e.key === "Enter") { e.preventDefault(); commitDraft(); }
    if (e.key === "Tab" && field === "telefono") { e.preventDefault(); commitDraft(); }
  };

  const getFotoDisplay = (m: Miembro): string | undefined => {
    if (m.foto && m.foto.length > 0 && m.foto[0].file_url) {
      return m.foto[0].file_url;
    }
    if (m.identificacion && m.identificacion.length > 0 && m.identificacion[0].file_url) {
      return m.identificacion[0].file_url;
    }
    return undefined;
  };

  // El backend a veces regresa los datos "planos" ({ data: [...] })
  // y otras veces anidados bajo "response" ({ response: { data: [...] } }),
  // sobre todo cuando hay warnings (status_code 206). Normalizamos aquí
  // para no perder el resultado en ninguno de los dos casos.

  const subirYAnalizar = async (file: File, prefijo: string) => {
    const ext = file.type.split("/")[1];
    const nombre = `${quitarAcentosYMinusculasYEspacios(prefijo)}.${ext}`;
    const nuevoArchivo = new File([file], nombre, { type: file.type });
    const uploaded = await uploadImageMutation.mutateAsync({ img: nuevoArchivo });
    if (!uploaded?.file_url) return null;
    const result = await ocrIdMutation.mutateAsync([uploaded.file_url]);
    // ocrIdMutation ya resuelve directo al array de personas (result.response.data del back)
    return { data: result ?? null, file_url: uploaded.file_url };
  };
 const handleGlobalFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setAnalizandoGlobal(true);
    try {
      const todosExtraidos: Array<{ nombre: string; email: string; telefono: string; foto: string }> = [];

      for (const file of files) {
        try {
          const resultado = await subirYAnalizar(file, "identificacion-global");
          if (!resultado) continue;
          const { data: datos, file_url } = resultado;
          const items = Array.isArray(datos) ? datos : datos ? [datos] : [];
          for (const item of items) {
            const extraido = extraerDatosOcr(item);
            if (!extraido) continue;
            todosExtraidos.push({ ...extraido, foto: file_url }); 
          }
        } catch (err) {
          console.error("Error procesando archivo", file.name, err);
          toast?.error?.(`No se pudo analizar "${file.name}"`);
        }
      }

      console.log('todosExtraidos=', todosExtraidos);

      if (todosExtraidos.length > 0) {
        setMiembros((prev) => {
          const updated = [...prev];
          todosExtraidos.forEach((extraido, filaIndex) => {
            if (updated[filaIndex]) {
              updated[filaIndex] = {
                ...updated[filaIndex],
                nombre: extraido.nombre || updated[filaIndex].nombre,
                email: extraido.email || updated[filaIndex].email,
                telefono: extraido.telefono || updated[filaIndex].telefono,
                identificacion: extraido.foto
                  ? [{ file_url: extraido.foto, file_name: "identificacion" }]
                  : updated[filaIndex].identificacion,
              };
            } else {
              updated.push({
                id: crypto.randomUUID(),
                nombre: extraido.nombre,
                email: extraido.email,
                telefono: extraido.telefono,
                identificacion: extraido.foto
                  ? [{ file_url: extraido.foto, file_name: "identificacion" }]
                  : undefined,
              });
            }
          });
          return updated;
        });
      }
    } finally {
      setAnalizandoGlobal(false);
      if (globalInputRef.current) globalInputRef.current.value = "";
    }
  };

  const inp = "w-full bg-transparent border-none outline-none text-xs placeholder:text-gray-300 focus:ring-0 p-0";
  const inpErr = inp + " text-red-500 placeholder:text-red-300";
  const th = "text-[10px] font-bold text-gray-400 uppercase tracking-wide px-3 py-2 border-r border-gray-100 last:border-r-0";
  const td = "px-3 py-2 border-r border-gray-100 last:border-r-0 align-middle";

  const efectivoUseIA = useIA && !esVista && !esCompletar;
  // En modo "completar" el número de acompañantes ya está fijo (definido al crear
  // el pase padre), así que no se permite agregar filas nuevas ahí.
  const efectivoAllowAddRow = allowAddRow && modoActual === 'crear';
  // En "ver" y "completar" mostramos la columna de acciones (compartir/descargar),
  // aunque en "completar" no se muestran crear-pase/eliminar.
  const showActionsCol = (esVista || esCompletar)
    ? true
    : (showDownload || showCreatePass || showShare);
  const actionsColWidth = (showCreatePass ? 90 : 0) + ((showDownload?1:0)+(showShare?1:0)+1) * 36 + 16;

  const AvatarCarousel: React.FC<{
    items: { url: string; label: string; onDelete: () => void }[];
    }> = ({ items }) => {
    const [index, setIndex] = useState(0);

    if (items.length === 0) {
      return (
        <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
          <Users className="w-6 h-6 text-gray-400" strokeWidth={2.5} />
        </div>
      );
    }

    const safeIndex = index % items.length;
    const current = items[safeIndex];

    const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      current.onDelete();
      setIndex((i) => (i > 0 ? i - 1 : 0));
    };

    
    return (
      <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0 select-none">
        <Image
          src={current.url}
          alt={current.label}
          width={56}
          height={56}
          unoptimized
          className="w-14 h-14 object-cover"
        />
        <button
          type="button"
          onClick={handleDelete}
          title={`Eliminar ${current.label}`}
          className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500/90 hover:bg-red-600 text-white flex items-center justify-center leading-none"
        >
          <span className="text-[9px]">✕</span>
        </button>
        {items.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setIndex((i) => (i - 1 + items.length) % items.length)}
              className="absolute left-0 top-0 bottom-0 w-4 flex items-center justify-center bg-black/25 hover:bg-black/45 text-white transition-colors"
              title="Anterior"
            >
              <span className="text-xs leading-none">‹</span>
            </button>
            <button
              type="button"
              onClick={() => setIndex((i) => (i + 1) % items.length)}
              className="absolute right-0 top-0 bottom-0 w-4 flex items-center justify-center bg-black/25 hover:bg-black/45 text-white transition-colors"
              title="Siguiente"
            >
              <span className="text-xs leading-none">›</span>
            </button>
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
              {items.map((_, i) => (
                <span
                  key={i}
                  className={`w-1 h-1 rounded-full ${i === safeIndex ? "bg-white" : "bg-white/50"}`}
                />
              ))}
            </div>
          </>
        )}
        <span className="absolute bottom-0.5 left-0.5 bg-black/40 text-white text-[8px] px-1 rounded leading-tight">
          {current.label}
        </span>
      </div>
    );
  };


  const extraerDatosOcr = (item: any) => {
    if (!item) return null;
    const data = Array.isArray(item) ? item[0] : item;
    const nombreArmado = [data.nombres, data.apellido_paterno, data.apellido_materno]
      .filter(Boolean)
      .join(" ");
    return {
      nombre: data.nombre_completo || nombreArmado || data.nombre || "",
      email: data.email ?? "",
      telefono: data.telefono ?? "",
    };
  };
  return (
    <>
      <div className="bg-white rounded-2xl p-2">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 ">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <h1 className="font-semibold text-gray-700 text-sm">{title}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {efectivoUseIA &&  miembrosEditables.length>0 && (
              <>
                <input
                  ref={globalInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  multiple
                  className="hidden"
                  onChange={handleGlobalFiles}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50 text-xs gap-1.5 h-8"
                  onClick={() => globalInputRef.current?.click()}
                  disabled={analizandoGlobal}
                >
                  {analizandoGlobal
                    ? <><Loader2 className="w-3 h-3 animate-spin" /> Analizando...</>
                    : <><Camera className="w-3 h-3" /> Subir IDs</>
                  }
                </Button>
              </>
            )}
            {!esVista &&  miembrosEditables.length>0 && modoActual === 'crear' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50 text-xs h-8"
                onClick={() => setOpenImportar(true)}
              >
                <Upload className="w-3 h-3 mr-1" />
                Importar
              </Button>
            )}
          </div>
        </div>

        {/* Banner IA */}
        {efectivoUseIA && (
          <div className="flex items-start gap-3 rounded-xl bg-blue-50 border border-blue-100 px-3 py-2 mb-3">
            <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-xs font-semibold text-blue-900">Análisis automático con IA</p>
              <p className="text-[11px] text-blue-600">
                Sube fotos de las identificaciones — la IA extraerá nombre, email y teléfono. También puedes analizar fila por fila.
              </p>
              <p className="text-[11px] text-amber-500 font-medium mt-0.5">
                ⚠ La IA puede cometer errores, verifica los datos antes de continuar.
              </p>
            </div>
          </div>
        )}

        {/* Bloque "ya registrados / no editables" — no aparece en modo "completar" */}
        {gruposExistentes.length > 0 && (
          <div className="mb-3 space-y-1.5">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
              Ya registrados ({gruposExistentes.length}) — no editables
            </p>
            {gruposExistentes.map((a) => {
              const fotoUrl = getFotoDisplay(a);
              return (
                <div key={a.id} className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
                  {fotoUrl ? (
                    <ViewImage imageUrl={{ file_url: fotoUrl, file_name: "foto" }} size="sm" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-[11px] font-bold shrink-0">
                      {a.nombre?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{a.nombre || "Sin nombre"}</p>
                    <p className="text-[10px] text-gray-500 truncate">
                      {[a.email, a.telefono].filter(Boolean).join(" · ") || "Sin datos de contacto"}
                    </p>
                  </div>
                  <EstatusBadge estatus={a.estatus} />
                  {a.link && (
                    <button
                      type="button"
                      title="Copiar link"
                      className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-600 text-white shadow-sm hover:bg-blue-700 transition-colors shrink-0"
                      onClick={() => handleCopyLinkActivo(a)}
                    >
                      {copiedActivoId === a.id ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!(esVista && miembrosEditables.length === 0) && (
        <div
          className="rounded-xl border border-gray-100 overflow-hidden overflow-x-auto"
          style={{ maxHeight: `${ROW_HEIGHT * MAX_VISIBLE + 40}px` }}
        >
          <table className="w-full min-w-[500px] text-xs border-collapse">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr className="border-b border-gray-100">
                <th className={th} style={{ width: 44 }}>Foto</th>
                <th className={th} style={{ width: "22%" }}>Nombre</th>
                <th className={th} style={{ width: "28%" }}>Email</th>
                <th className={th} style={{ width: "22%" }}>Teléfono</th>
                {!esVista && !esCompletar  && <th className={th} style={{ width: 70 }}>Foto</th>}
                {(esVista || esCompletar) && <th className={th} style={{ width: 110 }}>Estatus</th>}
                {efectivoUseIA && <th className={th} style={{ width: 80 }}>Identificación</th>}
                {showActionsCol && <th className={th} style={{ width: (esVista || esCompletar) ? 60 : actionsColWidth }}>Acciones</th>}
                <th className={th} style={{ width: 44 }}></th>
              </tr>
            </thead>
            <tbody className="overflow-y-auto">
              {miembrosEditables.map((m, idx) => {
                const err = rowErrors[m.id] || { email: false, telefono: false };
                return (
                  <tr
                    key={m.id}
                    className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${idx % 2 === 0 ? "" : "bg-gray-50/30"}`}
                  >
                   <td className={td} style={{ width: 60 }}>
                      <AvatarCarousel
                        items={[
                          ...(m.foto?.[0]?.file_url
                            ? [{
                                url: m.foto[0].file_url,
                                label: "Foto",
                                onDelete: () =>
                                  setMiembros((prev) =>
                                    prev.map((row) => (row.id === m.id ? { ...row, foto: [] } : row))
                                  ),
                              }]
                            : []),
                          ...(m.identificacion?.[0]?.file_url
                            ? [{
                                url: m.identificacion[0].file_url,
                                label: "ID",
                                onDelete: () =>
                                  setMiembros((prev) =>
                                    prev.map((row) => (row.id === m.id ? { ...row, identificacion: [] } : row))
                                  ),
                              }]
                            : []),
                        ]}
                      />
                    </td>
                    
                    <td className={td} style={{ width: "22%" }}>
                      {esVista ? (
                        <span className="text-gray-700">{m.nombre || "—"}</span>
                      ) : (
                        <input
                          className={inp + " text-gray-700"}
                          value={m.nombre}
                          placeholder="Nombre"
                          onChange={(e) => handleEditCell(m.id, "nombre", e.target.value)}
                        />
                      )}
                    </td>
                    <td className={td} style={{ width: "28%" }}>
                      {esVista ? (
                        <span className="text-gray-700">{m.email || "—"}</span>
                      ) : (
                        <input
                          className={err.email ? inpErr : inp + " text-gray-700"}
                          value={m.email}
                          placeholder="Email"
                          onChange={(e) => handleEditCell(m.id, "email", e.target.value)}
                          onBlur={(e) => handleBlurSaved(m.id, "email", e.target.value)}
                        />
                      )}
                    </td>
                    <td className={td} style={{ width: "22%" }}>
                      {esVista ? (
                        <span className="text-gray-700">{m.telefono || "—"}</span>
                      ) : (
                        <PhoneInput
                          defaultCountry={defaultCountry}
                          value={m.telefono}
                          onChange={(value) => handleEditCell(m.id, "telefono", value || "")}
                          onBlur={() => handleBlurSaved(m.id, "telefono", m.telefono)}
                          containerComponentProps={{ className: "flex w-full bg-transparent" }}
                          numberInputProps={{
                            className: "bg-transparent border-none outline-none text-xs w-full focus:ring-0 p-0 " +
                              (err.telefono ? "text-red-500" : "text-gray-700"),
                          }}
                        />
                      )}
                    </td>
                    {!esVista && !esCompletar && (
                      <td className={td} style={{ width: 70 }}>
                        <div className="flex justify-center">
                          <LoadImage
                            showImage={false}
                            id={`foto-persona-${m.id}`}
                            titulo=""
                            imgArray={m.foto ?? []}
                            setImg={((value: any) => {
                              const arr = typeof value === "function" ? value(m.foto ?? []) : value;
                              const url = Array.isArray(arr) ? arr?.[arr.length - 1]?.file_url : null;
                              if (url) {
                                setMiembros((prev) =>
                                  prev.map((row) =>
                                    row.id === m.id
                                      ? { ...row, foto: [{ file_url: url, file_name: "foto" }] }
                                      : row
                                  )
                                );
                              } else if (Array.isArray(arr) && arr.length === 0) {
                                // Se limpió la foto (botón "Limpiar")
                                setMiembros((prev) =>
                                  prev.map((row) => (row.id === m.id ? { ...row, foto: [] } : row))
                                );
                              }
                            }) as any}
                            showWebcamOption={true}
                            facingMode="user"
                            tipoOcr="persona"
                          />
                        </div>
                      </td>
                    )}
                    {(esVista || esCompletar) && (
                      <td className={td +` pb-4`} style={{ width: 110 }}>
                        <EstatusBadge estatus={m.estatus} />
                      </td>
                    )}
                    {efectivoUseIA && (
                      <td className={td} style={{ width: 80 }}>
                        <div className="flex justify-center">
                          <LoadImage
                            showImage={false}
                            id={`id-miembro-${m.id}`}
                            titulo=""
                            imgArray={m.identificacion ?? []}
                            setImg={((value: any) => {
                              const arr = typeof value === "function" ? value(m.identificacion ?? []) : value;
                              const url = Array.isArray(arr) ? arr?.[arr.length - 1]?.file_url : null;
                              if (url) {
                                setMiembros((prev) =>
                                  prev.map((row) =>
                                    row.id === m.id
                                      ? { ...row, identificacion: [{ file_url: url, file_name: "identificacion" }] }
                                      : row
                                  )
                                );
                              } else if (Array.isArray(arr) && arr.length === 0) {
                                setMiembros((prev) =>
                                  prev.map((row) => (row.id === m.id ? { ...row, identificacion: [] } : row))
                                );
                              }
                            }) as any}
                            showWebcamOption={true}
                            facingMode="environment"
                            tipoOcr="id"
                            onOcrResult={(result) => {
                              const items = Array.isArray(result) ? result : result ? [result] : [];
                              const extraido = extraerDatosOcr(items[0]);
                              if (extraido) {
                                setMiembros((prev) =>
                                  prev.map((row) =>
                                    row.id === m.id
                                      ? {
                                          ...row,
                                          nombre: extraido.nombre ?? row.nombre,
                                          email: extraido.email ?? row.email,
                                          telefono: extraido.telefono ?? row.telefono,
                                        }
                                      : row
                                  )
                                );
                              }
                            }}
                          />
                        </div>
                      </td>
                    )}
                    {showActionsCol && (
                      <td className={td} style={{ width: (esVista || esCompletar) ? 60 : actionsColWidth }}>
                        <div className="flex items-center justify-start gap-1.5">
                          {(esVista || esCompletar) ? (
                            <>
                              {(m.estatus?.toLowerCase() === "proceso" || m.estatus?.toLowerCase() === "activo") && (
                                <>
                                  <button
                                    type="button"
                                    title="Copiar link"
                                    className="flex items-center justify-center w-7 h-7 mb-3 rounded-lg bg-green-600 text-white shadow-sm hover:bg-green-700 transition-colors"
                                    onClick={() => handleCopyLink(m)}
                                  >
                                    {copiedId === m.id ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                                  </button>

                                  {m.link && (
                                    <button
                                      type="button"
                                      title="Abrir link"
                                      className="flex items-center justify-center w-7 h-7 mb-3 rounded-lg bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 transition-colors"
                                      onClick={() => window.open(m.link, "_blank", "noopener,noreferrer")}
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </>
                              )}

                              {m.estatus?.toLowerCase() === "activo" && (
                                <button
                                  type="button"
                                  title="Descargar"
                                  className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500 text-white shadow-sm hover:bg-amber-600 transition-colors"
                                  onClick={() => onDownload?.(m)}
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          ) : (
                            <>
                              {showCreatePass && (
                                <button
                                  type="button"
                                  title="Crear pase"
                                  className="flex items-center justify-center gap-1 h-7 px-2.5 rounded-full bg-blue-600 text-white text-[10px] font-bold shadow-sm hover:bg-blue-700 transition-colors whitespace-nowrap"
                                  onClick={() => onCreatePass?.(m)}
                                >
                                  <UserPlus className="w-3.5 h-3.5" />
                                  <span>Crear pase</span>
                                </button>
                              )}
                              {showDownload && (
                                <button
                                  type="button"
                                  title="Descargar"
                                  className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500 text-white shadow-sm hover:bg-amber-600 transition-colors"
                                  onClick={() => onDownload?.(m)}
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {showShare && (
                                <button
                                  type="button"
                                  title="Compartir"
                                  className="flex items-center justify-center w-7 h-7 rounded-lg bg-green-600 text-white shadow-sm hover:bg-green-700 transition-colors"
                                  onClick={() => onShare?.(m)}
                                >
                                  <Share2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            <button
                              type="button"
                              className="flex items-center justify-center w-7 h-7 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 transition-colors border border-red-100 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-red-50"
                              onClick={() => handleEliminarDirecto(m)}
                              disabled={nonDeletableIds.includes(m.id)}
                              title={nonDeletableIds.includes(m.id) ? "No se puede eliminar — el pase ya está activo" : "Eliminar"}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                    
                  </tr>
                );
              })}

              {efectivoAllowAddRow && (
                <tr className="bg-blue-50/20 border-t border-blue-100">
                  {efectivoUseIA && <td className={td} style={{ width: 44 }}></td>}
                  <td className={td} style={{ width: "22%" }}>
                    <input
                      id="draft-nombre"
                      className={inp + " text-gray-700 placeholder:text-gray-400"}
                      placeholder="Nombre *"
                      value={draftRow.nombre}
                      onChange={(e) => setDraftRow((d) => ({ ...d, nombre: e.target.value }))}
                      onKeyDown={(e) => handleDraftKeyDown(e, "nombre")}
                    />
                  </td>
                  <td className={td} style={{ width: "28%" }}>
                    <input
                      className={draftErrors.email ? inpErr : inp + " text-gray-700 placeholder:text-gray-400"}
                      placeholder="Email"
                      type="email"
                      value={draftRow.email}
                      onChange={(e) => setDraftRow((d) => ({ ...d, email: e.target.value }))}
                      onBlur={() => handleBlurDraft("email")}
                      onKeyDown={(e) => {
                        if (e.key === "Tab") { e.preventDefault(); document.getElementById("draft-telefono-input")?.focus(); }
                        if (e.key === "Enter") { e.preventDefault(); commitDraft(); }
                      }}
                    />
                  </td>
                  <td className={td} style={{ width: "22%" }}>
                    <div onKeyDown={(e) => {
                      if (e.key === "Tab") { e.preventDefault(); commitDraft(); }
                      if (e.key === "Enter") { e.preventDefault(); commitDraft(); }
                    }}>
                      <PhoneInput
                        defaultCountry={defaultCountry}
                        value={draftRow.telefono}
                        onChange={(value) => setDraftRow((d) => ({ ...d, telefono: value || "" }))}
                        onBlur={() => handleBlurDraft("telefono")}
                        containerComponentProps={{ className: "flex w-full bg-transparent" }}
                        numberInputProps={{
                          id: "draft-telefono-input",
                          className: "bg-transparent border-none outline-none text-xs w-full focus:ring-0 p-0 " +
                            (draftErrors.telefono ? "text-red-500" : "text-gray-700 placeholder:text-gray-400"),
                          placeholder: "Teléfono",
                        }}
                      />
                    </div>
                  </td>
                  {!esVista && <td className={td} style={{ width: 70 }}></td>}
                  {(esVista || esCompletar) && <td className={td} style={{ width: 110 }}></td>}
                  {efectivoUseIA && <td className={td} style={{ width: 80 }}></td>}
                  {showActionsCol && <td className={td} style={{ width: actionsColWidth }}></td>}
                  <td className={td + " text-right"} style={{ width: 44 }}>
                    {draftRow.nombre.trim() && (
                      <button
                        type="button"
                        className="text-blue-400 hover:text-blue-600 text-[10px] font-semibold whitespace-nowrap"
                        onClick={commitDraft}
                      >
                        + Add
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
           {miembrosEditables.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">
                Actualiza el número de acompañantes para agregar nuevos registros.
              </p>
            )}
        </div>
        )}
        {!(esVista && miembrosEditables.length === 0) && (
          <div className="flex items-center justify-between mt-2 text-[11px] text-gray-400">
            <span>{miembros.length} registro{miembros.length !== 1 ? "s" : ""}</span>
            {hasAnyError && <p className="text-red-500">Campos en rojo requieren corrección.</p>}
          </div>
        )}
      </div>

      <ImportarMiembrosModal
        open={openImportar}
        setOpen={setOpenImportar}
        onImportar={(nuevos) => setMiembros((prev) => [...prev, ...nuevos])}
      />
    </>
  );
};

export default MiembrosPase;