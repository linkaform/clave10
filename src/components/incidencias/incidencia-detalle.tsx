"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Swal from "sweetalert2";
import { Check, ClipboardCheck, Download, Eye, Mic, Paperclip, Users, FileText, ImageIcon, Pencil, Plus, Printer, Trash2, X } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Tooltip } from "@/components/ui/tooltip";
import { calcularTiempoDesdeIncidencia, convertirDateToISO, dateStringToISO, formatCurrency, formatDateToString } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useInciencias } from "@/hooks/Incidencias/useIncidencias";
import { useCatalogoAreaEmpleado } from "@/hooks/useCatalogoAreaEmpleado";
import { useCatalogoPaseAreaLocation } from "@/hooks/useCatalogoPaseAreaLocation";
import { AfectacionPatrimonialModal } from "@/components/modals/add-afectacion-patrimonial";
import { AccionCorrectiva, AccionCorrectivaModal } from "@/components/modals/add-accion-correctiva";
import { SeguimientoIncidenciaLista } from "@/components/modals/add-seguimientos";
import { SeguimientoDetalleModal } from "./seguimiento-detalle-modal";

// Vista de detalle de una incidencia (panel lateral). Solo lectura: las
// acciones de editar/imprimir/eliminar las resuelve quien la abre.

interface IncidenciaDetalleProps {
  incidencia: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditar?: (incidencia: any) => void;
  onImprimir?: (incidencia: any) => void;
  onEliminar?: (incidencia: any) => void;
  /** Vista tabla: sin fondo gris y el ojito de otra fila cambia de incidencia
   *  sin cerrar el panel. En grid/lista se comporta como modal normal. */
  modoTabla?: boolean;
}

type Tab = "datos" | "afectacion" | "acciones" | "seguimiento";

const etiqueta = "text-[11px] uppercase tracking-wide text-gray-400";
const thTab = "px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-gray-600";
const tdTab = "px-4 py-3 text-sm text-gray-700 align-top";

const GRAVEDAD: Record<string, string> = {
  leve: "bg-emerald-50 text-emerald-700",
  moderada: "bg-amber-50 text-amber-700",
  critica: "bg-red-50 text-red-600",
};

const sinAcentos = (t: string) => (t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// "2026-10-02 02:47:31" -> "2026-10-02 02:47"
const fechaCorta = (f?: string) => (f || "").replace(/^(\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}):\d{2}.*$/, "$1") || "-";

// "Hoy 02:47", "Ayer 18:10" o "2026-10-02 02:47".
const fechaRelativa = (f?: string) => {
  const corta = fechaCorta(f);
  const fecha = f ? new Date(f.replace(" ", "T")) : null;
  if (!fecha || isNaN(fecha.getTime())) return corta;
  const hora = corta.slice(-5);
  const hoy = new Date();
  const ayer = new Date();
  ayer.setDate(hoy.getDate() - 1);
  if (fecha.toDateString() === hoy.toDateString()) return `Hoy ${hora}`;
  if (fecha.toDateString() === ayer.toDateString()) return `Ayer ${hora}`;
  return corta;
};

const tipoArchivo = (url = "", nombre = "") => {
  // Se revisa la liga y, si no trae extensión, el nombre del archivo.
  const deTexto = (t: string) => {
    const limpio = (t || "").split("?")[0];
    return limpio.includes(".") ? limpio.split(".").pop()!.toLowerCase() : "";
  };
  const ext = deTexto(url) || deTexto(nombre);
  if (["mp4", "mov", "webm", "m4v"].includes(ext)) return "video";
  if (["mp3", "m4a", "wav", "ogg", "aac", "weba"].includes(ext)) return "audio";
  if (["jpg", "jpeg", "png", "gif", "webp", "heic", "bmp"].includes(ext)) return "imagen";
  return "documento";
};

const Card = ({ titulo, extra, children }: { titulo: string; extra?: React.ReactNode; children: React.ReactNode }) => (
  <section className="rounded-2xl border border-gray-200 bg-white p-5">
    <div className="mb-4 flex items-baseline gap-2">
      <h3 className="text-base font-bold text-gray-900">{titulo}</h3>
      {extra && <span className="text-xs text-gray-500">{extra}</span>}
    </div>
    {children}
  </section>
);

const Dato = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="min-w-0">
    <p className={etiqueta}>{label}</p>
    <div className="mt-0.5 break-words text-sm text-gray-900">{children || "-"}</div>
  </div>
);

const Tabla = ({ columnas, filas, vacio }: { columnas: string[]; filas: React.ReactNode[][]; vacio: string }) => (
  <div className="overflow-x-auto rounded-xl border border-gray-200">
    <table className="min-w-full">
      <thead className="bg-blue-50">
        <tr>
          {columnas.map((c) => (
            <th key={c} className={thTab}>
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {filas.length > 0 ? (
          filas.map((fila, i) => (
            <tr key={i} className="border-t border-gray-100">
              {fila.map((celda, j) => (
                <td key={j} className={tdTab}>
                  {celda || "-"}
                </td>
              ))}
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={columnas.length} className="py-6 text-center text-sm text-gray-500">
              {vacio}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

// Se guarda Masculino/Femenino; en pantalla, Hombre/Mujer.
const SEXO: Record<string, string> = { masculino: "Hombre", femenino: "Mujer" };

const iniciales = (nombre = "") =>
  nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "?";

const PersonaCard = ({ persona: p }: { persona: any }) => {
  const atencion = sinAcentos(p.atencion_medica || "");
  const detenido = sinAcentos(p.retenido || "");
  const estado = [
    atencion === "si" ? "Con atención médica" : atencion === "no" ? "Sin atención médica" : "",
    detenido === "si" ? "Detenida" : detenido === "no" ? "No detenida" : "",
  ].filter(Boolean);
  const detalle = [p.puesto, SEXO[sinAcentos(p.sexo || "")] || p.sexo].filter(Boolean).join(" · ");
  return (
    <div className="flex gap-3 rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
        {iniciales(p.nombre_completo)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-bold text-gray-900">{p.nombre_completo || "Sin nombre"}</p>
          {p.rol && (
            <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold capitalize text-blue-700">
              {p.rol}
            </span>
          )}
        </div>
        {detalle && <p className="text-xs text-gray-500">{detalle}</p>}
        {estado.length > 0 && (
          <p className="mt-1 text-xs font-semibold text-gray-600">{estado.join("   ·   ")}</p>
        )}
        {p.comentarios && <p className="mt-1.5 text-sm text-gray-700">{p.comentarios}</p>}
      </div>
    </div>
  );
};

const ESTATUS_AFECTACION: Record<string, string> = {
  perdido: "bg-red-50 text-red-600",
  "recuperacion parcial": "bg-amber-50 text-amber-700",
  "recuperacion total": "bg-emerald-50 text-emerald-700",
};
const ESTATUS_ACCION: Record<string, string> = {
  pendiente: "bg-amber-50 text-amber-700",
  "en proceso": "bg-blue-50 text-blue-700",
  completada: "bg-emerald-50 text-emerald-700",
  cancelada: "bg-gray-100 text-gray-600",
};
const monto = (v: any) => Number(String(v ?? "").replace(/[^\d.]/g, "")) || 0;

const BotonFila = ({ titulo, onClick, peligro = false, disabled = false, children }: { titulo: string; onClick: () => void; peligro?: boolean; disabled?: boolean; children: React.ReactNode }) => (
  <button
    type="button"
    title={titulo}
    aria-label={titulo}
    onClick={onClick}
    disabled={disabled}
    className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
      peligro ? "hover:bg-red-50 hover:text-red-600" : "hover:bg-blue-50 hover:text-blue-600"
    }`}>
    {children}
  </button>
);

const Resumen = ({ label, valor, clase = "text-gray-900" }: { label: string; valor: string; clase?: string }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-5">
    <p className={etiqueta}>{label}</p>
    <p className={`mt-1 text-2xl font-bold ${clase}`}>{valor}</p>
  </div>
);

const BotonNuevo = ({ texto, onClick, disabled = false }: { texto: string; onClick: () => void; disabled?: boolean }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="flex shrink-0 items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50">
    <Plus className="h-4 w-4" />
    {texto}
  </button>
);

const BotonHeader = ({ tooltip, onClick, children }: { tooltip: string; onClick: () => void; children: React.ReactNode }) => (
  <Tooltip content={tooltip} contentClassName="mb-1.5 min-w-0 whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium text-gray-800 shadow-md">
    <button
      type="button"
      aria-label={tooltip}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition-colors hover:bg-blue-50 hover:text-blue-600">
      {children}
    </button>
  </Tooltip>
);

export const IncidenciaDetalle = ({
  incidencia,
  open,
  onOpenChange,
  onEditar,
  onImprimir,
  onEliminar,
  modoTabla = false,
}: IncidenciaDetalleProps) => {
  const [tab, setTab] = useState<Tab>("datos");
  // Ancho del panel: se arrastra desde el borde izquierdo (igual que Script Logs).
  const [ancho, setAncho] = useState(1024);
  const empezarRedimension = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const mover = (ev: PointerEvent) =>
      setAncho(Math.min(window.innerWidth, Math.max(480, window.innerWidth - ev.clientX)));
    const soltar = () => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
    };
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
  };
  // Afectaciones y acciones correctivas se editan aquí mismo: se guarda solo
  // el grupo que cambió (update_incidence parcha las llaves que recibe).
  const [afectaciones, setAfectaciones] = useState<any[]>([]);
  const [acciones, setAcciones] = useState<AccionCorrectiva[]>([]);
  const [afectacionModal, setAfectacionModal] = useState(false);
  const [editarAfectacion, setEditarAfectacion] = useState(false);
  const [indiceAfectacion, setIndiceAfectacion] = useState<number | null>(null);
  const [afectacionVer, setAfectacionVer] = useState<any | null>(null);
  const [accionModal, setAccionModal] = useState(false);
  const [seguimientos, setSeguimientos] = useState<any[]>([]);
  const [estatusActual, setEstatusActual] = useState("");
  const [seguimientoModal, setSeguimientoModal] = useState(false);
  const [indiceAccion, setIndiceAccion] = useState<number | null>(null);
  const [accionVer, setAccionVer] = useState<AccionCorrectiva | null>(null);
  const [seguimientoVer, setSeguimientoVer] = useState<any | null>(null);
  const { editarIncidenciaMutation } = useInciencias("", "", [], "", "", "");
  const guardando = editarIncidenciaMutation.isPending;
  const ubicacion = incidencia?.ubicacion_incidencia || "";
  const { data: empleados } = useCatalogoAreaEmpleado(open && accionModal, ubicacion, "Incidencias");
  const { dataAreas } = useCatalogoPaseAreaLocation(ubicacion, open && accionModal, !!ubicacion, { uso: "incidencias" });

  useEffect(() => {
    if (!open) return;
    setTab("datos");
    setAfectaciones(incidencia?.afectacion_patrimonial_incidencia || []);
    setAcciones(incidencia?.acciones_correctivas_incidencia || []);
    setSeguimientos(incidencia?.seguimientos_incidencia || []);
    setEstatusActual(incidencia?.estatus || "");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, incidencia?.folio]);

  // update_incidence reemplaza las respuestas completas del registro (y valida
  // los obligatorios), así que se manda la incidencia entera con el grupo que
  // cambió, igual que el modal de editar.
  const datosCompletos = (inc: any) => ({
    reporta_incidencia: inc.reporta_incidencia || "",
    fecha_hora_incidencia: inc.fecha_hora_incidencia || "",
    ubicacion_incidencia: inc.ubicacion_incidencia || "",
    area_incidencia: inc.area_incidencia || "",
    incidencia: inc.incidencia || inc.incidente || "",
    incidente: inc.incidencia || inc.incidente || "",
    categoria: inc.categoria || "",
    sub_categoria: inc.sub_categoria || "",
    comentario_incidencia: inc.comentario_incidencia || "",
    dano_incidencia: inc.dano_incidencia || "",
    evidencia_incidencia: inc.evidencia_incidencia || [],
    documento_incidencia: inc.documento_incidencia || [],
    prioridad_incidencia: inc.prioridad_incidencia || "",
    notificacion_incidencia: inc.notificacion_incidencia || "no",
    datos_deposito_incidencia: inc.datos_deposito_incidencia || [],
    tags: inc.tags || [],
    estatus: estatusActual || inc.estatus || "",
    personas_involucradas_incidencia: inc.personas_involucradas_incidencia || [],
    acciones_tomadas_incidencia: inc.acciones_tomadas_incidencia || [],
    seguimientos_incidencia: seguimientos,
    afectacion_patrimonial_incidencia: afectaciones,
    acciones_correctivas_incidencia: acciones,
    nombre_completo_persona_extraviada: inc.nombre_completo_persona_extraviada,
    edad: inc.edad,
    color_piel: inc.color_piel,
    color_cabello: inc.color_cabello,
    estatura_aproximada: inc.estatura_aproximada,
    descripcion_fisica_vestimenta: inc.descripcion_fisica_vestimenta,
    nombre_completo_responsable: inc.nombre_completo_responsable,
    parentesco: inc.parentesco,
    num_doc_identidad: inc.num_doc_identidad,
    telefono: inc.telefono,
    info_coincide_con_videos: inc.info_coincide_con_videos,
    valor_estimado: inc.valor_estimado,
    pertenencias_sustraidas: inc.pertenencias_sustraidas,
    placas: inc.placas,
    tipo: inc.tipo,
    marca: inc.marca,
    modelo: inc.modelo,
    color: inc.color,
  });

  // Guarda la incidencia con el grupo nuevo; si falla, regresa la lista anterior.
  // Los avisos de éxito/error los da editarIncidenciaMutation.
  // Entrada automática en la línea de tiempo (p. ej. "Acción correctiva completada").
  const seguimientoAutomatico = (texto: string) => {
    const ahora = new Date();
    return {
      accion_correctiva_incidencia: texto,
      incidencia_personas_involucradas: "",
      fecha_inicio_seg: formatDateToString(ahora),
      tiempo_transcurrido: calcularTiempoDesdeIncidencia(dateStringToISO(incidencia?.fecha_hora_incidencia || ""), convertirDateToISO(ahora)),
      incidencia_documento_solucion: [],
      incidencia_evidencia_solucion: [],
    };
  };

  const guardar = (
    cambio: { afectacion_patrimonial_incidencia?: any[]; acciones_correctivas_incidencia?: any[] },
    deshacer: () => void,
    evento?: string,
  ) => {
    const data: any = { ...datosCompletos(incidencia), ...cambio };
    if (evento) {
      const anteriores = seguimientos;
      const nuevos = [...seguimientos, seguimientoAutomatico(evento)];
      setSeguimientos(nuevos);
      data.seguimientos_incidencia = nuevos;
      const deshacerAccion = deshacer;
      deshacer = () => {
        deshacerAccion();
        setSeguimientos(anteriores);
      };
    }
    // Bloquea la pantalla mientras se guarda (mismo aviso que otras páginas).
    Swal.fire({
      title: "Actualizando incidencia",
      html: "Guardando los cambios...",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => Swal.showLoading(),
    });
    editarIncidenciaMutation.mutate(
      { data_incidencia: data, folio: incidencia?.folio },
      { onError: deshacer, onSettled: () => Swal.close() },
    );
  };
  // Los modales llaman setX(prev => ...): se calcula la lista y se guarda.
  const actualizarAfectaciones = (upd: any) => {
    const anterior = afectaciones;
    const lista = typeof upd === "function" ? upd(afectaciones) : upd;
    setAfectaciones(lista);
    guardar({ afectacion_patrimonial_incidencia: lista }, () => setAfectaciones(anterior));
  };
  // evento: texto para la línea de tiempo. Si no se da y la lista creció,
  // es una acción nueva ("Se registró acción correctiva: …").
  const actualizarAcciones = (upd: any, evento?: string) => {
    const anterior = acciones;
    const lista = typeof upd === "function" ? upd(acciones) : upd;
    const nueva = lista.length > anterior.length ? lista[lista.length - 1] : null;
    const texto = evento ?? (nueva ? `Se registró acción ${(nueva.tipo || "correctiva").toLowerCase()}: ${nueva.accion}` : undefined);
    setAcciones(lista);
    guardar({ acciones_correctivas_incidencia: lista }, () => setAcciones(anterior), texto);
  };

  if (!incidencia) return null;
  const d = incidencia;

  // Línea de tiempo: el más reciente arriba.
  const seguimientosOrdenados: any[] = [...seguimientos].sort(
    (a, b) => new Date(b.fecha_inicio_seg).getTime() - new Date(a.fecha_inicio_seg).getTime(),
  );
  const personas: any[] = d.personas_involucradas_incidencia || [];
  const accionesTomadas: any[] = d.acciones_tomadas_incidencia || [];

  const archivos = [...(d.evidencia_incidencia || []), ...(d.documento_incidencia || [])].filter((a: any) => a?.file_url);
  const medios = archivos.filter((a: any) => ["imagen", "video"].includes(tipoArchivo(a.file_url, a.file_name)));
  const audios = archivos.filter((a: any) => tipoArchivo(a.file_url, a.file_name) === "audio");
  const documentos = archivos.filter((a: any) => tipoArchivo(a.file_url, a.file_name) === "documento");

  const gravedad = d.prioridad_incidencia || "";
  const estatus = (estatusActual || d.estatus || "").toString();
  const abierto = sinAcentos(estatus) === "abierto";
  const subcategoria = d.sub_categoria && d.sub_categoria !== "General" ? d.sub_categoria : "";

  const tabs: { key: Tab; label: string; n?: number }[] = [
    { key: "datos", label: "Datos" },
    { key: "afectacion", label: "Afectación patrimonial", n: afectaciones.length },
    { key: "acciones", label: "Acciones correctivas", n: acciones.length },
    { key: "seguimiento", label: "Seguimiento", n: seguimientos.length },
  ];

  return (
    // En tabla el panel no es modal (como Script Logs): la tabla sigue clicable
    // y el ojito de otra fila solo cambia de incidencia. El fondo gris se pinta
    // igual, pero sin bloquear clics. En grid/lista, modal normal.
    <>
    {modoTabla &&
      open &&
      typeof document !== "undefined" &&
      createPortal(
        <div className="pointer-events-none fixed inset-0 z-[49] bg-black/50 animate-in fade-in-0" aria-hidden />,
        document.body,
      )}
    <Sheet open={open} onOpenChange={onOpenChange} modal={!modoTabla}>
      <SheetContent
        side="right"
        overlayClassName={modoTabla ? "hidden" : undefined}
        onInteractOutside={(e) => {
          if (!modoTabla) return;
          const target = e.target as HTMLElement | null;
          if (target?.closest("[data-ver-incidencia]")) e.preventDefault();
        }}
        className="flex w-full flex-col gap-0 p-0 sm:max-w-none [&>button.absolute]:hidden"
        style={{ width: ancho, maxWidth: "100vw" }}
        aria-describedby={undefined}>
        {/* Borde izquierdo: se arrastra para cambiar el ancho del panel */}
        <div
          onPointerDown={empezarRedimension}
          title="Arrastra para cambiar el tamaño"
          className="absolute left-0 top-0 z-10 h-full w-1.5 cursor-col-resize hover:bg-blue-400/60"
        />
        {/* Encabezado */}
        <div className="border-b border-gray-100 px-6 pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <SheetTitle className="text-2xl font-bold text-gray-900">{d.folio}</SheetTitle>
                {estatus && (
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                      abierto ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"
                    }`}>
                    {estatus}
                  </span>
                )}
              </div>
              <p className="mt-1 truncate text-sm text-gray-500">{d.incidencia || d.incidente}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {onEditar && (
                <BotonHeader tooltip="Editar" onClick={() => onEditar(d)}>
                  <Pencil className="h-4 w-4" />
                </BotonHeader>
              )}
              {onImprimir && (
                <BotonHeader tooltip="Imprimir comprobante" onClick={() => onImprimir(d)}>
                  <Printer className="h-4 w-4" />
                </BotonHeader>
              )}
              {onEliminar && (
                <BotonHeader tooltip="Eliminar" onClick={() => onEliminar(d)}>
                  <Trash2 className="h-4 w-4" />
                </BotonHeader>
              )}
              <button
                type="button"
                aria-label="Cerrar"
                onClick={() => onOpenChange(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-4 flex gap-1 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`whitespace-nowrap border-b-2 px-3 pb-3 text-sm transition-colors ${
                  tab === t.key
                    ? "border-blue-600 font-semibold text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}>
                {t.label}
                {!!t.n && ` (${t.n})`}
              </button>
            ))}
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50/50 px-6 py-5">
          {tab === "datos" && (
            <>
              <Card titulo="Generales">
                <div className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-4">
                  <Dato label="Categoría">{[d.categoria, subcategoria].filter(Boolean).join(" / ")}</Dato>
                  <Dato label="Registrado como">Incidencia</Dato>
                  <Dato label="Gravedad">
                    {gravedad && (
                      <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${GRAVEDAD[sinAcentos(gravedad)] || "bg-gray-100 text-gray-700"}`}>
                        {gravedad === "Critica" ? "Crítica" : gravedad}
                      </span>
                    )}
                  </Dato>
                  <Dato label="Ubicación">{d.ubicacion_incidencia}</Dato>
                  <Dato label="Área">{d.area_incidencia}</Dato>
                  <Dato label="Fecha y hora">{fechaCorta(d.fecha_hora_incidencia)}</Dato>
                  <Dato label="Reporta">{d.reporta_incidencia}</Dato>
                </div>
                <hr className="my-4 border-gray-100" />
                <p className={etiqueta}>Descripción</p>
                <p className="mt-1 whitespace-pre-line text-sm text-gray-900">{d.comentario_incidencia || "-"}</p>
              </Card>

              <Card titulo="Evidencia" extra={archivos.length ? `${archivos.length} archivo${archivos.length === 1 ? "" : "s"}` : undefined}>
                {archivos.length === 0 ? (
                  <p className="text-sm text-gray-500">Sin evidencia.</p>
                ) : (
                  <div className="space-y-3">
                    {audios.map((a: any, i: number) => (
                      <audio key={`audio-${i}`} controls src={a.file_url} className="w-full" />
                    ))}
                    {medios.length > 0 && (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {medios.map((a: any, i: number) =>
                          tipoArchivo(a.file_url, a.file_name) === "video" ? (
                            <video
                              key={`m-${i}`}
                              src={a.file_url}
                              controls
                              className="aspect-square w-full rounded-xl border border-gray-100 bg-black object-cover"
                            />
                          ) : (
                            <a key={`m-${i}`} href={a.file_url} target="_blank" rel="noopener noreferrer">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={a.file_url}
                                alt={a.file_name || "Evidencia"}
                                className="aspect-square w-full rounded-xl border border-gray-100 object-cover transition-opacity hover:opacity-90"
                              />
                            </a>
                          ),
                        )}
                      </div>
                    )}
                    {documentos.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {documentos.map((a: any, i: number) => (
                          <a
                            key={`doc-${i}`}
                            href={a.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex min-w-[220px] items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5 hover:bg-gray-50">
                            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                              <FileText className="h-4 w-4" />
                            </span>
                            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900">
                              {a.file_name || "Documento"}
                            </span>
                            <Download className="h-4 w-4 text-gray-400" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>

              <Card
                titulo="Personas involucradas"
                extra={personas.length ? `${personas.length} registrada${personas.length === 1 ? "" : "s"}` : undefined}>
                {personas.length === 0 ? (
                  <p className="text-sm text-gray-500">No hay personas involucradas.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {personas.map((p, i) => (
                      <PersonaCard key={i} persona={p} />
                    ))}
                  </div>
                )}
              </Card>

              <Card titulo="Acciones tomadas" extra={accionesTomadas.length ? `${accionesTomadas.length}` : undefined}>
                <Tabla
                  columnas={["Acción tomada", "Autoridades", "Responsable"]}
                  filas={accionesTomadas.map((a) => [
                    a.acciones_tomadas,
                    a.llamo_a_policia === "sí"
                      ? [a.autoridad || "Sí", a.numero_folio_referencia && `Folio ${a.numero_folio_referencia}`].filter(Boolean).join(" · ")
                      : a.llamo_a_policia
                        ? "No"
                        : "",
                    a.responsable,
                  ])}
                  vacio="No hay acciones tomadas."
                />
              </Card>
            </>
          )}

          {tab === "afectacion" && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Resumen label="Monto estimado" valor={formatCurrency(afectaciones.reduce((t, a) => t + monto(a.monto_estimado), 0))} />
                <Resumen
                  label="Recuperación total"
                  clase="text-emerald-600"
                  valor={formatCurrency(
                    afectaciones
                      .filter((a) => sinAcentos(a.estatus_afectacion || "") === "recuperacion total")
                      .reduce((t, a) => t + monto(a.monto_estimado), 0),
                  )}
                />
                <Resumen label="Afectaciones" valor={String(afectaciones.length)} />
              </div>
              <section className="rounded-2xl border border-gray-200 bg-white p-5">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-base font-bold text-gray-900">Afectaciones patrimoniales</h3>
                    <span className="text-sm text-gray-500">{afectaciones.length}</span>
                  </div>
                  <BotonNuevo
                    disabled={guardando}
                    texto="Nueva Afectación"
                    onClick={() => {
                      setEditarAfectacion(false);
                      setIndiceAfectacion(null);
                      setAfectacionModal(true);
                    }}
                  />
                </div>
                <Tabla
                  columnas={["Opciones", "Afectación", "Monto", "Duración", "Evidencia", "Estatus"]}
                  filas={afectaciones.map((a, i) => {
                    const nArchivos = (a.evidencia?.length ?? 0) + (a.documento?.length ?? 0);
                    return [
                      <div key="o" className="flex gap-1.5">
                        <BotonFila titulo="Ver" onClick={() => setAfectacionVer(a)}>
                          <Eye className="h-4 w-4" />
                        </BotonFila>
                        <BotonFila
                          disabled={guardando}
                          titulo="Editar"
                          onClick={() => {
                            setEditarAfectacion(true);
                            setIndiceAfectacion(i);
                            setAfectacionModal(true);
                          }}>
                          <Pencil className="h-4 w-4" />
                        </BotonFila>
                        <BotonFila titulo="Eliminar" peligro disabled={guardando} onClick={() => actualizarAfectaciones(afectaciones.filter((_, k) => k !== i))}>
                          <Trash2 className="h-4 w-4" />
                        </BotonFila>
                      </div>,
                      <div key="a" className="max-w-[280px]">
                        <p className="font-semibold text-gray-900">{a.tipo_afectacion || "-"}</p>
                        {a.descripcion_afectacion && (
                          <p className="line-clamp-2 break-words text-xs text-gray-500" title={a.descripcion_afectacion}>
                            {a.descripcion_afectacion}
                          </p>
                        )}
                      </div>,
                      formatCurrency(monto(a.monto_estimado)),
                      a.duracion_estimada,
                      nArchivos ? (
                        <span key="e" className="flex items-center gap-1 text-gray-500">
                          <ImageIcon className="h-3.5 w-3.5" /> {nArchivos}
                        </span>
                      ) : (
                        ""
                      ),
                      a.estatus_afectacion ? (
                        <span
                          key="s"
                          className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                            ESTATUS_AFECTACION[sinAcentos(a.estatus_afectacion)] || "bg-gray-100 text-gray-700"
                          }`}>
                          {a.estatus_afectacion}
                        </span>
                      ) : (
                        ""
                      ),
                    ];
                  })}
                  vacio="No se han agregado afectaciones patrimoniales."
                />
              </section>
            </>
          )}

          {tab === "acciones" && (
            <section className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-base font-bold text-gray-900">Acciones correctivas</h3>
                    <span className="text-sm text-gray-500">{acciones.length}</span>
                  </div>
                  <p className="text-sm text-gray-500">Qué se hará y quién, para que no vuelva a ocurrir.</p>
                </div>
                <BotonNuevo
                  disabled={guardando}
                  texto="Nueva Acción"
                  onClick={() => {
                    setIndiceAccion(null);
                    setAccionModal(true);
                  }}
                />
              </div>
              {acciones.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-10 text-center">
                  <ClipboardCheck className="h-8 w-8 text-gray-300" />
                  <p className="mt-2 text-sm font-semibold text-gray-900">Sin acciones correctivas</p>
                  <p className="text-sm text-gray-500">Agrega qué se hará y quién, para que no vuelva a ocurrir.</p>
                </div>
              ) : (
                <>
                  {(() => {
                    const completadas = acciones.filter((a) => sinAcentos(a.estatus || "") === "completada").length;
                    return (
                      <div className="mb-4">
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className={etiqueta}>Avance</span>
                          <span className="text-sm font-bold text-gray-900">
                            {completadas} de {acciones.length} completada{acciones.length === 1 ? "" : "s"}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full bg-green-600 transition-all"
                            style={{ width: `${acciones.length ? (completadas / acciones.length) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    );
                  })()}
                  <Tabla
                    columnas={["Opciones", "Acción correctiva", "Responsable", "¿Qué la causó?", "Estatus"]}
                    filas={acciones.map((a, i) => {
                      const completada = sinAcentos(a.estatus || "") === "completada";
                      return [
                        <div key="o" className="flex gap-1.5">
                          <BotonFila titulo="Ver" onClick={() => setAccionVer(a)}>
                            <Eye className="h-4 w-4" />
                          </BotonFila>
                          <BotonFila
                            disabled={guardando}
                            titulo="Editar"
                            onClick={() => {
                              setIndiceAccion(i);
                              setAccionModal(true);
                            }}>
                            <Pencil className="h-4 w-4" />
                          </BotonFila>
                          <BotonFila titulo="Eliminar" peligro disabled={guardando} onClick={() => actualizarAcciones(acciones.filter((_, k) => k !== i))}>
                            <Trash2 className="h-4 w-4" />
                          </BotonFila>
                          {!completada && (
                            <BotonFila
                              titulo="Marcar como completada"
                              disabled={guardando}
                              onClick={() =>
                                actualizarAcciones(
                                  acciones.map((x, k) => (k === i ? { ...x, estatus: "Completada" } : x)),
                                  `Acción ${(a.tipo || "correctiva").toLowerCase()} completada: ${a.accion}`,
                                )
                              }>
                              <Check className="h-4 w-4" />
                            </BotonFila>
                          )}
                        </div>,
                        <div key="a" className="max-w-[260px]">
                          <p className="text-xs text-gray-400">Acción {(a.tipo || "correctiva").toLowerCase()}</p>
                          <p className="line-clamp-2 break-words text-gray-900" title={a.accion}>{a.accion}</p>
                        </div>,
                        <span key="r" className="block max-w-[180px]">
                          <span className="block truncate" title={a.responsable}>{a.responsable}</span>
                          <span className="block text-xs text-gray-400">{a.responsable_tipo}</span>
                        </span>,
                        <span key="c" className="line-clamp-2 block max-w-[220px] break-words" title={a.causa || ""}>
                          {a.causa || "---"}
                        </span>,
                        <span
                          key="s"
                          className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                            ESTATUS_ACCION[sinAcentos(a.estatus || "")] || "bg-gray-100 text-gray-700"
                          }`}>
                          {a.estatus}
                        </span>,
                      ];
                    })}
                    vacio=""
                  />
                </>
              )}
            </section>
          )}

          {tab === "seguimiento" && (
            <section className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div className="flex items-baseline gap-2">
                  <h3 className="text-base font-bold text-gray-900">Seguimiento</h3>
                  <span className="text-sm text-gray-500">El supervisor actualiza el estatus.</span>
                </div>
                <BotonNuevo texto="Nuevo Seguimiento" onClick={() => setSeguimientoModal(true)} />
              </div>
              <ol>
                {[
                  ...seguimientosOrdenados.map((sg) => ({ tipo: "seguimiento" as const, sg })),
                  // Primer evento: cuando se levantó la incidencia.
                  { tipo: "reporte" as const, sg: null as any },
                ].map((item, i, todos) => {
                  const ultimo = i === todos.length - 1;
                  const sg = item.sg;
                  const archivos = sg
                    ? [...(sg.incidencia_evidencia_solucion || []), ...(sg.incidencia_documento_solucion || [])].filter((x: any) => x?.file_url)
                    : [];
                  const imagenes = archivos.filter((x: any) => tipoArchivo(x.file_url, x.file_name) === "imagen");
                  const audios = archivos.filter((x: any) => tipoArchivo(x.file_url, x.file_name) === "audio");
                  const otros = archivos.filter((x: any) => !["imagen", "audio"].includes(tipoArchivo(x.file_url, x.file_name)));
                  return (
                    <li key={i} className="relative pl-8">
                      {!ultimo && <span className="absolute left-[7px] top-6 bottom-0 w-px bg-gray-200" />}
                      <span
                        className={`absolute left-0 top-4 h-4 w-4 rounded-full border-2 border-white ring-1 ${
                          item.tipo === "reporte" ? "bg-red-500 ring-red-200" : "bg-gray-300 ring-gray-200"
                        }`}
                      />
                      <div
                        role={sg ? "button" : undefined}
                        tabIndex={sg ? 0 : undefined}
                        onClick={sg ? () => setSeguimientoVer(sg) : undefined}
                        onKeyDown={sg ? (e) => e.key === "Enter" && setSeguimientoVer(sg) : undefined}
                        className={`rounded-xl px-3 py-3 transition-colors hover:bg-gray-50 ${sg ? "cursor-pointer" : ""}`}>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          {item.tipo === "reporte" ? (
                            <>
                              {d.reporta_incidencia && <span className="text-sm font-bold text-gray-900">{d.reporta_incidencia}</span>}
                              <span className="text-xs text-gray-500">{fechaRelativa(d.fecha_hora_incidencia)}</span>
                              <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-600">
                                Abierto
                              </span>
                            </>
                          ) : (
                            <>
                              {sg.registrado_por && <span className="text-sm font-bold text-gray-900">{sg.registrado_por}</span>}
                              <span className="text-xs text-gray-500">{fechaRelativa(sg.fecha_inicio_seg)}</span>
                            </>
                          )}
                        </div>
                        <p className="mt-1 whitespace-pre-line break-words text-sm text-gray-700">
                          {item.tipo === "reporte" ? "Se levantó el reporte." : sg.accion_correctiva_incidencia}
                        </p>
                        {sg?.incidencia_personas_involucradas && (
                          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-500">
                            <Users className="h-3.5 w-3.5" />
                            {sg.incidencia_personas_involucradas}
                          </p>
                        )}
                        {imagenes.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {imagenes.map((x: any, k: number) => (
                              <a key={k} href={x.file_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={x.file_url} alt={x.file_name || "Evidencia"} className="h-20 w-20 rounded-lg border border-gray-100 object-cover" />
                              </a>
                            ))}
                          </div>
                        )}
                        {(otros.length > 0 || audios.length > 0) && (
                          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                            {otros.length > 0 && (
                              <a
                                href={otros[0].file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={otros.map((x: any) => x.file_name).filter(Boolean).join(", ")}
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1 hover:text-blue-600">
                                <Paperclip className="h-3.5 w-3.5" /> {otros.length}
                              </a>
                            )}
                            {audios.length > 0 && (
                              <a href={audios[0].file_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 hover:text-blue-600">
                                <Mic className="h-3.5 w-3.5" /> {audios.length}
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}
        </div>

        <div className="flex justify-end border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg bg-gray-100 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
            Cerrar
          </button>
        </div>
      </SheetContent>

      <AfectacionPatrimonialModal
        title="Afectación patrimonial"
        subtitulo={d.folio}
        openAfectacionPatrimonialModal={afectacionModal}
        setOpenAfectacionPatrimonialModal={setAfectacionModal}
        setAfectacionPatrimonial={actualizarAfectaciones}
        indice={indiceAfectacion}
        editarAfectacionPatrimonial={editarAfectacion}
        setEditarAfectacionPatrimonial={setEditarAfectacion}
        afectacionPatrimonialSeleccionada={indiceAfectacion !== null ? afectaciones[indiceAfectacion] : null}>
        <div></div>
      </AfectacionPatrimonialModal>

      <AccionCorrectivaModal
        open={accionModal}
        setOpen={setAccionModal}
        setAcciones={(upd: any) => actualizarAcciones(upd)}
        indice={indiceAccion}
        seleccionada={indiceAccion !== null ? acciones[indiceAccion] : null}
        empleados={Array.isArray(empleados) ? empleados : []}
        areas={dataAreas ?? []}
      />

      <SeguimientoIncidenciaLista
        title="Nuevo seguimiento"
        isSuccess={seguimientoModal}
        setIsSuccess={setSeguimientoModal}
        setSeguimientos={setSeguimientos}
        indice={null}
        editarSeguimiento={false}
        setEditarSeguimiento={() => {}}
        seguimientoSeleccionado={null}
        dateIncidencia={d.fecha_hora_incidencia || ""}
        enviarSeguimiento={true}
        folioIncidencia={d.folio}
        estatusIncidencia={estatus}
        personasRegistradas={personas.map((p) => p.nombre_completo)}
        onGuardado={(seguimiento, nuevoEstatus) => {
          setSeguimientos((prev) => [...prev, seguimiento]);
          if (nuevoEstatus) setEstatusActual(nuevoEstatus);
        }}>
        <div></div>
      </SeguimientoIncidenciaLista>

      {/* Ver un seguimiento */}
      <SeguimientoDetalleModal seguimiento={seguimientoVer} onClose={() => setSeguimientoVer(null)} />

      {/* Ver una acción correctiva (texto completo) */}
      <Dialog open={!!accionVer} onOpenChange={(o) => !o && setAccionVer(null)}>
        <DialogContent className="max-w-xl p-6 gap-0" aria-describedby={undefined}>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                accionVer?.tipo === "Preventiva" ? "bg-purple-50 text-purple-700" : "bg-blue-50 text-blue-700"
              }`}>
              Acción {(accionVer?.tipo || "correctiva").toLowerCase()}
            </span>
            {accionVer?.estatus && (
              <span
                className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                  ESTATUS_ACCION[sinAcentos(accionVer.estatus)] || "bg-gray-100 text-gray-700"
                }`}>
                {accionVer.estatus}
              </span>
            )}
          </div>
          <DialogTitle className="mt-3 text-base font-bold text-gray-900">Acción</DialogTitle>
          <p className="mt-1 whitespace-pre-line break-words text-sm text-gray-700">{accionVer?.accion}</p>

          <p className={`${etiqueta} mt-5`}>¿Qué la causó?</p>
          <p className="mt-1 whitespace-pre-line break-words text-sm text-gray-700">{accionVer?.causa || "---"}</p>

          <p className={`${etiqueta} mt-5`}>Responsable</p>
          <p className="mt-1 text-sm text-gray-900">
            {accionVer?.responsable || "-"}
            <span className="ml-2 text-xs text-gray-400">{accionVer?.responsable_tipo}</span>
          </p>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => setAccionVer(null)}
              className="rounded-lg bg-gray-100 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
              Cerrar
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ver una afectación */}
      <Dialog open={!!afectacionVer} onOpenChange={(o) => !o && setAfectacionVer(null)}>
        <DialogContent className="max-w-lg p-6" aria-describedby={undefined}>
          <DialogTitle className="text-lg font-bold text-gray-900">{afectacionVer?.tipo_afectacion}</DialogTitle>
          <p className="text-sm text-gray-600 whitespace-pre-line">{afectacionVer?.descripcion_afectacion || "-"}</p>
          <div className="mt-3 grid grid-cols-3 gap-4">
            <Dato label="Monto">{formatCurrency(monto(afectacionVer?.monto_estimado))}</Dato>
            <Dato label="Duración">{afectacionVer?.duracion_estimada}</Dato>
            <Dato label="Estatus">{afectacionVer?.estatus_afectacion}</Dato>
          </div>
          {[...(afectacionVer?.evidencia || []), ...(afectacionVer?.documento || [])].filter((x: any) => x?.file_url).length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {[...(afectacionVer?.evidencia || []), ...(afectacionVer?.documento || [])]
                .filter((x: any) => x?.file_url)
                .map((x: any, i: number) =>
                  tipoArchivo(x.file_url, x.file_name) === "imagen" ? (
                    <a key={i} href={x.file_url} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={x.file_url} alt={x.file_name || "Evidencia"} className="h-20 w-20 rounded-lg border border-gray-100 object-cover" />
                    </a>
                  ) : (
                    <a
                      key={i}
                      href={x.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <FileText className="h-4 w-4 text-blue-600" />
                      {x.file_name || "Documento"}
                    </a>
                  ),
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Sheet>
    </>
  );
};
