'use client';

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Users, Upload, Camera, Sparkles, Loader2, X, Download, Share2, UserPlus } from "lucide-react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import ImportarMiembrosModal from "./modals/importar-miembros-modal";
import { useOcr } from "@/hooks/ocr/useOcr";
import { useUploadImage } from "@/hooks/useUploadImage";
import { quitarAcentosYMinusculasYEspacios } from "@/lib/utils";
import LoadImage, { Imagen } from "./upload-Image";
import ViewImage from "./modals/view-image";

export interface Miembro {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  foto?: Imagen[];
  estatus?: string;
  tipo_movimiento?: string;
}

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

const MiembrosPase: React.FC<MiembrosPaseProps> = ({
  miembros,
  setMiembros,
  rowErrors,
  setRowErrors,
  title = "Miembros del pase",
  useIA = false,
  acompantes,
  showDownload = false,
  showCreatePass = false,
  showShare = false,
  onDownload,
  onCreatePass,
  onShare,
}) => {
  const [openImportar, setOpenImportar] = useState(false);
  const [draftRow, setDraftRow] = useState<Miembro>(EMPTY_ROW());
  const [draftErrors, setDraftErrors] = useState({ email: false, telefono: false });
  const [analizandoGlobal, setAnalizandoGlobal] = useState(false);
  const globalInputRef = useRef<HTMLInputElement>(null);

  const { ocrIdMutation } = useOcr();
  const { uploadImageMutation } = useUploadImage();

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

  const extraerDatosOcr = (item: any) => {
    if (!item) return null;
    const data = Array.isArray(item) ? item[0] : item;
    return {
      nombre: data.nombre_completo ?? data.nombre ?? "",
      email: data.email ?? "",
      telefono: data.telefono ?? "",
    };
  };

  const subirYAnalizar = async (file: File, prefijo: string) => {
    const ext = file.type.split("/")[1];
    const nombre = `${quitarAcentosYMinusculasYEspacios(prefijo)}.${ext}`;
    const nuevoArchivo = new File([file], nombre, { type: file.type });
    const uploaded = await uploadImageMutation.mutateAsync({ img: nuevoArchivo });
    if (!uploaded?.file_url) return null;
    const result = await ocrIdMutation.mutateAsync([uploaded.file_url]);
    return { data: result?.data ?? null, file_url: uploaded.file_url };
  };

  const handleGlobalFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setAnalizandoGlobal(true);
    try {
      const todosExtraidos: Array<{ nombre: string; email: string; telefono: string; foto: string }> = [];

      for (const file of files) {
        const resultado = await subirYAnalizar(file, "identificacion-global");
        if (!resultado) continue;
        const { data: datos, file_url } = resultado;
        const items = Array.isArray(datos) ? datos : datos ? [datos] : [];
        for (const item of items) {
          const extraido = extraerDatosOcr(item);
          if (extraido?.nombre) todosExtraidos.push({ ...extraido, foto: file_url });
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
                foto: extraido.foto ? [{ file_url: extraido.foto, file_name: "foto" }] : updated[filaIndex].foto,
              };
            } else {
              updated.push({
                id: crypto.randomUUID(),
                nombre: extraido.nombre,
                email: extraido.email,
                telefono: extraido.telefono,
                foto: extraido.foto ? [{ file_url: extraido.foto, file_name: "foto" }] : undefined,
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

  const showActionsCol = showDownload || showCreatePass || showShare;
  const actionsColWidth = (showCreatePass ? 90 : 0) + ((showDownload?1:0)+(showShare?1:0)+1) * 36 + 16;

  return (
    <>
      <div className="bg-white rounded-2xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <h1 className="font-semibold text-gray-700 text-sm">{title}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {useIA && (
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
          </div>
        </div>

        {/* Banner IA */}
        {useIA && (
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

        {/* Tabla unificada */}
        <div
          className="rounded-xl border border-gray-100 overflow-hidden overflow-x-auto"
          style={{ maxHeight: `${ROW_HEIGHT * MAX_VISIBLE + 40}px` }}
        >
          <table className="w-full min-w-[500px] text-xs border-collapse">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr className="border-b border-gray-100">
                {useIA && <th className={th} style={{ width: 44 }}>Foto</th>}
                <th className={th} style={{ width: "22%" }}>Nombre</th>
                <th className={th} style={{ width: "28%" }}>Email</th>
                <th className={th} style={{ width: "22%" }}>Teléfono</th>
                {useIA && <th className={th} style={{ width: 80 }}>Identificación</th>}
                {showActionsCol && <th className={th} style={{ width: actionsColWidth }}>Acciones</th>}
                <th className={th} style={{ width: 44 }}></th>
              </tr>
            </thead>
            <tbody className="overflow-y-auto">
              {miembros.map((m, idx) => {
                const err = rowErrors[m.id] || { email: false, telefono: false };
                return (
                  <tr
                    key={m.id}
                    className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${idx % 2 === 0 ? "" : "bg-gray-50/30"}`}
                  >
                  {useIA && (
                    <td className={td} style={{ width: 44 }}>
                      {m.foto && m.foto.length > 0 ? (
                        <ViewImage imageUrl={{ file_url: m.foto[0].file_url ?? "", file_name: m.foto[0].file_name ?? "foto" }} size="sm" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center">
                          <Users className="w-4 h-4 text-blue-400" strokeWidth={2.5} />
                        </div>
                      )}
                    </td>
                  )}
                    <td className={td} style={{ width: "22%" }}>
                      <input
                        className={inp + " text-gray-700"}
                        value={m.nombre}
                        placeholder="Nombre"
                        onChange={(e) => handleEditCell(m.id, "nombre", e.target.value)}
                      />
                    </td>
                    <td className={td} style={{ width: "28%" }}>
                      <input
                        className={err.email ? inpErr : inp + " text-gray-700"}
                        value={m.email}
                        placeholder="Email"
                        onChange={(e) => handleEditCell(m.id, "email", e.target.value)}
                        onBlur={(e) => handleBlurSaved(m.id, "email", e.target.value)}
                      />
                    </td>
                    <td className={td} style={{ width: "22%" }}>
                      <PhoneInput
                        defaultCountry="MX"
                        value={m.telefono}
                        onChange={(value) => handleEditCell(m.id, "telefono", value || "")}
                        onBlur={() => handleBlurSaved(m.id, "telefono", m.telefono)}
                        containerComponentProps={{ className: "flex w-full bg-transparent" }}
                        numberInputProps={{
                          className: "bg-transparent border-none outline-none text-xs w-full focus:ring-0 p-0 " +
                            (err.telefono ? "text-red-500" : "text-gray-700"),
                        }}
                      />
                    </td>
                    {useIA && (
                      <td className={td} style={{ width: 80 }}>
                        <div className="flex justify-center">
                          <LoadImage
                          showImage={false}
                          id={`id-miembro-${m.id}`}
                          titulo=""
                          imgArray={[]}
                         setImg={((value: any) => {
                            const arr = typeof value === "function" ? value([]) : value;
                            const url = Array.isArray(arr) ? arr?.[0]?.file_url : null;
                            if (url) {
                              setMiembros((prev) => prev.map((row) =>
                                row.id === m.id ? { ...row, foto: [{ file_url: url, file_name: "foto" }] } : row
                              ));
                            }
                          }) as any}
                          showWebcamOption={true}
                          facingMode="environment"
                          tipoOcr="id"
                          limit={1}
                          onOcrResult={(result) => {
                            const datos = result?.data;
                            const items = Array.isArray(datos) ? datos : datos ? [datos] : [];
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
                    <td className={td} style={{ width: actionsColWidth }}>
                      <div className="flex items-center justify-center gap-1.5">
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
                          className="flex items-center justify-center w-7 h-7 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 transition-colors border border-red-100"
                          onClick={() => handleEliminarDirecto(m)}
                          title="Eliminar"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                  
                  </tr>
                );
              })}

              {/* Fila draft */}
              <tr className="bg-blue-50/20 border-t border-blue-100">
                {useIA && <td className={td} style={{ width: 44 }}></td>}
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
                      defaultCountry="MX"
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
                {useIA && <td className={td} style={{ width: 80 }}></td>}
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
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-2 text-[11px] text-gray-400">
          <span>{miembros.length} registro{miembros.length !== 1 ? "s" : ""}</span>
          {hasAnyError && <p className="text-red-500">Campos en rojo requieren corrección.</p>}
        </div>
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