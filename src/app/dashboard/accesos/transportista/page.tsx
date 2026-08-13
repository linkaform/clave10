"use client";

import React, { useState } from "react";
import {
  ArrowLeft, ChevronRight, Search, Menu, LogIn, QrCode, Pencil,
  Camera, FileText, Truck, CheckCircle2, X, Plus,
  AlertTriangle, Bell, Shield, Lock, ClipboardCheck, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Data (pendiente de conectar con API) ─────────────────────────────────────

type Remolque = {
  titulo: string; tipo: string | null; caja: string | null; placas: string | null;
  estado: string | null; sello: string | null; material: string[]; comentarios: string[];
};
type Documento = { id: number; nombre: string; type: string; status: string; sub: string };

const DEMO = {
  folio:       null as string | null,
  tipo_accion: null as string | null,
  // Etapa actual — se mantiene como demo mientras se define el flujo real
  entradaDone: false,
  cargaDone:   false,
  salidaDone:  false,
  conductor:      { nombre: null as string | null, no_licencia: null as string | null },
  empresa:        null as string | null,
  tipo_operacion: null as string | null,
  fecha_ingreso:  null as string | null,
  material: {
    proveedor_cliente: null as string | null,
    orden_compra:      null as string | null,
    procedencia:       null as string | null,
    material_carga:    null as string | null,
  },
  lugar: {
    ubicacion:     null as string | null,
    area:          null as string | null,
    anden:         null as string | null,
    anden_ocupado: false,
    fecha_descarga: null as string | null,
    alerta:         null as string | null,
  },
  documentos: [] as Documento[],
  vehiculo: { tipo: null as string | null, placas: null as string | null, no_economico: null as string | null },
  remolques: [] as Remolque[],
  inspecciones: {
    entrada: { completados: 0, total: 17 },
    salida:  { completados: 0, total: 17 },
    sello:   { completados: 0, total: 4  },
  },
};

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ entradaDone, cargaDone, salidaDone }: { entradaDone: boolean; cargaDone: boolean; salidaDone: boolean }) {
  const BLUE  = "#2F80ED";
  const AMBER = "#F5A623";
  const GRAY  = "#E2E8F0";

  const defs = [
    { label: "Arribo",           done: true        },
    { label: "Insp. entrada",    done: entradaDone },
    { label: "Carga / Descarga", done: cargaDone   },
    { label: "Insp. salida",     done: salidaDone  },
    { label: "Terminado",        done: false       },
  ];
  const activeIdx = defs.findIndex((d) => !d.done);

  return (
    <div className="w-full">
      {/* Labels */}
      <div className="flex items-end mb-2">
        {defs.map((d, i) => {
          const isActive = i === activeIdx;
          const isLast = i === defs.length - 1;
          const color = d.done ? BLUE : isActive ? AMBER : GRAY;
          return (
            <span
              key={i}
              style={{ color }}
              className={cn(
                "flex-1 text-[10px] font-bold leading-none",
                i === 0 ? "text-left" : isLast ? "text-right" : "text-center",
              )}
            >
              {d.label}
            </span>
          );
        })}
      </div>

      {/* Dots + connectors */}
      <div className="flex items-center">
        {defs.map((d, i) => {
          const isActive = i === activeIdx;
          // Color of the connector TO the LEFT of this node (between i-1 → i)
          const connColor =
            i === 0 ? "" :
            (defs[i - 1].done && d.done)   ? BLUE  :
            (defs[i - 1].done && isActive)  ? AMBER :
            GRAY;

          return (
            <React.Fragment key={i}>
              {/* Left connector */}
              {i > 0 && (
                <div
                  style={{ background: connColor, height: "3px", borderRadius: "3px" }}
                  className="flex-1 mx-1"
                />
              )}

              {/* Node */}
              {d.done ? (
                <div
                  style={{ width: 30, height: 30, borderRadius: "50%", background: BLUE, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 3px 8px -2px rgba(47,128,237,.5)" }}
                >
                  <CheckCircle2 style={{ width: 16, height: 16, color: "#fff" }} />
                </div>
              ) : isActive ? (
                <div
                  style={{ width: 30, height: 30, borderRadius: "50%", background: "#fff", border: `3px solid ${AMBER}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 0 0 5px rgba(245,166,35,.18)` }}
                >
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: AMBER, animation: "pulse 2s infinite" }} />
                </div>
              ) : (
                <div
                  style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", border: `2px solid ${GRAY}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

type DocType = "pdf" | "img" | "xls";

const DOC_TYPE_META: Record<DocType, { ext: string; bg: string; color: string }> = {
  pdf: { ext: "PDF", bg: "#DC2626", color: "#fff" },
  xls: { ext: "XLS", bg: "#16A34A", color: "#fff" },
  img: { ext: "IMG", bg: "rgba(47,128,237,.12)", color: "#2F80ED" },
};

function Field({ label, value, mono, icon: Icon }: {
  label: string; value?: string | null; mono?: boolean;
  icon?: React.ElementType;
}) {
  return (
    <div>
      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className={cn(
        "text-xs text-gray-700 leading-snug flex items-center gap-1",
        mono && "font-mono",
        !value && "text-gray-300 italic",
      )}>
        {Icon && <Icon className="w-3 h-3 text-gray-400 shrink-0" />}
        {value ?? "Sin información"}
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DetalleTransportistaPage() {
  const d = DEMO;
  const [docTab, setDocTab] = useState<"pendientes" | "subidos">("pendientes");

  const docsPendientes = d.documentos.filter((x) => x.status !== "validado");
  const docsCargados   = d.documentos.filter((x) => x.status === "validado");
  const docsVisible    = docTab === "pendientes" ? docsPendientes : docsCargados;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Sticky top bar ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm">
        <div className="px-4">

          {/* Row 1: breadcrumb */}
          <div className="flex items-center gap-1 pt-2 pb-1 text-[11px] text-gray-400">
            <span className="hover:text-gray-600 cursor-pointer">Accesos</span>
            <ChevronRight className="w-3 h-3" />
            <span className="hover:text-gray-600 cursor-pointer">Transportistas</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-700 font-semibold">Detalle del pase</span>
          </div>

          {/* Row 2: back · search · actions */}
          <div className="flex items-center gap-3 py-2">
            <button className="h-8 px-3 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5 text-gray-600 shrink-0">
              <ArrowLeft className="w-3.5 h-3.5" />
              Volver al control
            </button>

            <div className="flex-1 flex justify-center">
              <div className="flex items-center border border-gray-200 rounded-lg bg-white h-8 w-64 overflow-hidden">
                <Search className="w-3.5 h-3.5 text-gray-400 ml-2.5 shrink-0 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Escanear Pase"
                  className="flex-1 h-full px-2 text-xs bg-transparent focus:outline-none"
                />
                <div className="border-l border-gray-200 h-full flex items-center px-2 cursor-pointer hover:bg-gray-50">
                  <Menu className="w-3.5 h-3.5 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button className="h-8 px-3.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1.5">
                <LogIn className="w-3.5 h-3.5" />
                Registrar Ingreso
              </button>
              <button className="h-8 px-3.5 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5" />
                Escanear Pase
              </button>
              <button className="h-8 w-8 flex items-center justify-center text-white bg-rose-500 hover:bg-rose-600 rounded-lg transition-colors">
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Row 3: progress */}
          <div className="pb-4 pt-0.5">
            <ProgressBar entradaDone={d.entradaDone} cargaDone={d.cargaDone} salidaDone={d.salidaDone} />
          </div>
        </div>
      </div>

      {/* ── 3-column body ──────────────────────────────────────────────────── */}
      <div className="px-4 py-4 grid grid-cols-[22rem_1fr_22rem] gap-4 items-start">

        {/* ── LEFT SIDEBAR ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

          {/* Folio header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm text-gray-600">
              Folio:{" "}
              <span className={cn("font-bold", d.folio ? "text-gray-800" : "text-gray-300 italic font-normal text-xs")}>
                {d.folio ?? "Sin asignar"}
              </span>
            </span>
            <span className={cn(
              "inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full",
              d.tipo_accion ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-400",
            )}>
              <LogIn className="w-3 h-3" />
              {d.tipo_accion ?? "—"}
            </span>
          </div>

          {/* Photos + identity */}
          <div className="px-4 pt-4 pb-3 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "FOTO",           icon: Camera   },
                { label: "IDENTIFICACIÓN", icon: FileText },
              ].map(({ label, icon: Icon }) => (
                <div key={label} className="h-24 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-1.5">
                  <Icon className="w-5 h-5 text-gray-300" />
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
                </div>
              ))}
            </div>
            <div className="text-center">
              <p className={cn("text-sm font-bold", d.conductor.nombre ? "text-gray-800" : "text-gray-300 italic font-normal text-xs")}>
                {d.conductor.nombre ?? "Sin información"}
              </p>
              <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                <Truck className="w-2.5 h-2.5" />
                Transportista
              </span>
            </div>
          </div>

          {/* Driver fields */}
          <div className="px-4 pb-4 pt-2 space-y-2.5 border-t border-gray-50">
            <Field label="Empresa Transportista"  value={d.empresa} />
            <Field label="Tipo de Operación"      value={d.tipo_operacion} />
            <Field label="No. de Licencia"         value={d.conductor.no_licencia} mono />
            <Field label="Fecha y Hora de Ingreso" value={d.fecha_ingreso} icon={Clock} />
          </div>

          {/* Material / carga */}
          <div className="border-t border-gray-100 px-4 py-3 space-y-2.5">
            <p className="text-xs font-bold text-gray-700">Material / carga</p>
            <Field label="Proveedor / Cliente"       value={d.material.proveedor_cliente} />
            <Field label="Orden de Compra"           value={d.material.orden_compra} mono />
            <Field label="Procedencia"               value={d.material.procedencia} />
            <Field label="Material de Carga / Carga" value={d.material.material_carga} />
          </div>

          {/* Lugar de entrega */}
          <div className="border-t border-gray-100 px-4 py-3 space-y-2.5">
            <p className="text-xs font-bold text-gray-700">Lugar de entrega / recepción</p>
            <Field label="Ubicación" value={d.lugar.ubicacion} />
            <Field label="Área"      value={d.lugar.area} />
            <div>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Andén</p>
              {d.lugar.anden ? (
                <span className={cn(
                  "inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full",
                  d.lugar.anden_ocupado ? "bg-orange-100 text-orange-700" : "bg-emerald-100 text-emerald-700",
                )}>
                  {d.lugar.anden_ocupado && <AlertTriangle className="w-3 h-3" />}
                  {d.lugar.anden} {d.lugar.anden_ocupado ? "ocupado" : "disponible"}
                </span>
              ) : (
                <p className="text-xs text-gray-300 italic">Sin información</p>
              )}
            </div>
            <Field label="Fecha y Hora de Descarga" value={d.lugar.fecha_descarga} />
          </div>

          {/* Andén alert */}
          {d.lugar.anden_ocupado && (
            <div className="border-t border-gray-100 px-4 py-3">
              <div className="rounded-xl bg-orange-50 border border-orange-200 p-3 space-y-2">
                <div className="flex gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-orange-800 leading-relaxed">{d.lugar.alerta}</p>
                </div>
                <button className="flex items-center gap-1.5 text-[11px] font-semibold text-orange-600 hover:text-orange-700 transition-colors">
                  <Bell className="w-3 h-3" />
                  Notificar al chofer
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── CENTER ───────────────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Documentos */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100">
              <FileText className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-bold text-gray-800 flex-1">Documentos</span>
              {/* Tabs */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setDocTab("pendientes")}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all",
                    docTab === "pendientes"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700",
                  )}
                >
                  Pendientes
                  <span className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                    docTab === "pendientes" ? "bg-red-100 text-red-600" : "bg-gray-200 text-gray-400",
                  )}>
                    {docsPendientes.length}
                  </span>
                </button>
                <button
                  onClick={() => setDocTab("subidos")}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all",
                    docTab === "subidos"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700",
                  )}
                >
                  Subidos
                  <span className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                    docTab === "subidos" ? "bg-emerald-100 text-emerald-600" : "bg-gray-200 text-gray-400",
                  )}>
                    {docsCargados.length}
                  </span>
                </button>
              </div>
            </div>

            {/* Doc list */}
            <div className="p-4 space-y-2">
              {docsVisible.map((doc) => {
                const meta = DOC_TYPE_META[doc.type as DocType] ?? DOC_TYPE_META.pdf;
                const isPendiente = doc.status !== "validado";
                return (
                  <div key={doc.id} className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 border cursor-pointer transition-colors",
                    isPendiente ? "border-red-100 bg-red-50/30 hover:bg-red-50/60" : "border-gray-100 bg-white hover:bg-gray-50",
                  )}>
                    {/* Type chip */}
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-extrabold"
                      style={{ background: meta.bg, color: meta.color }}
                    >
                      {meta.ext}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{doc.nombre}</p>
                      <p className={cn(
                        "text-[11px] truncate mt-0.5",
                        isPendiente ? "text-red-500" : "text-emerald-600",
                      )}>
                        {doc.sub}
                      </p>
                    </div>
                    {isPendiente ? (
                      <button className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 flex items-center justify-center shrink-0 transition-colors">
                        <Camera className="w-3.5 h-3.5 text-white" />
                      </button>
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    )}
                  </div>
                );
              })}

              {docsVisible.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-gray-300">
                  <FileText className="w-8 h-8 mb-2" />
                  <p className="text-xs">
                    {docTab === "pendientes" ? "No hay documentos pendientes" : "Aún no hay documentos subidos"}
                  </p>
                </div>
              )}

              <button className="w-full h-9 mt-1 rounded-xl border border-dashed border-gray-300 hover:border-blue-300 hover:bg-blue-50/40 text-xs font-medium text-gray-400 hover:text-blue-600 transition-all flex items-center justify-center gap-1.5">
                <Camera className="w-3.5 h-3.5" />
                Tomar foto a otro documento
              </button>
            </div>
          </div>

          {/* Vehículo & Remolques */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100">
              <Truck className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-bold text-gray-800">Vehículo &amp; Remolques</span>
              <span className="text-[11px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                {d.remolques.length}
              </span>
            </div>
            <div className="p-4 space-y-5">

              {/* Datos del vehículo */}
              <div className="rounded-xl overflow-hidden border border-indigo-100">
                <div className="px-4 py-2 bg-indigo-50">
                  <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest">
                    Datos del Vehículo
                  </span>
                </div>
                <div className="px-4 py-3 grid grid-cols-3 gap-4 bg-white">
                  <Field label="Tipo de Vehículo" value={d.vehiculo.tipo} />
                  <Field label="Placas Vehículo"  value={d.vehiculo.placas} mono />
                  <Field label="No. Económico"    value={d.vehiculo.no_economico} mono />
                </div>
              </div>

              {/* Remolques */}
              {d.remolques.length === 0 && (
                <div className="flex flex-col items-center justify-center py-6 text-gray-300 border border-dashed border-gray-200 rounded-xl">
                  <Truck className="w-7 h-7 mb-1.5" />
                  <p className="text-xs">Sin remolques registrados</p>
                </div>
              )}
              {d.remolques.map((r, ri) => {
                const loaded = r.estado === "Cargado";
                return (
                  <div key={ri} className="rounded-xl border border-gray-100 overflow-hidden">
                    <div className={cn(
                      "flex items-center gap-2 px-4 py-2.5 border-b border-gray-100",
                      loaded ? "bg-blue-50" : "bg-gray-50",
                    )}>
                      <span className={cn(
                        "text-[11px] font-bold uppercase tracking-widest flex-1",
                        loaded ? "text-blue-900" : "text-gray-700",
                      )}>
                        {r.titulo}
                      </span>
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                        loaded ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-500",
                      )}>
                        {r.estado}
                      </span>
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase">
                        Pendiente
                      </span>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="grid grid-cols-4 gap-3">
                        <Field label="Tipo"        value={r.tipo} />
                        <Field label="No. Caja"    value={r.caja} mono />
                        <Field label="Placas Caja" value={r.placas} mono />
                        <div>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">No. Sello</p>
                          {r.sello
                            ? <p className="text-xs font-mono text-gray-700">{r.sello}</p>
                            : <span className="text-xs font-semibold text-orange-600 italic">Sin sello · caja abierta</span>
                          }
                        </div>
                      </div>

                      {r.material.length > 0 && (
                        <div>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Material</p>
                          <div className="flex flex-wrap gap-1.5">
                            {r.material.map((tag, ti) => (
                              <span key={ti} className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Comentarios</p>
                          <button className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700">
                            <Plus className="w-3 h-3" />
                            Agregar comentario
                          </button>
                        </div>
                        <div className="space-y-1.5">
                          {r.comentarios.map((c, ci) => (
                            <div key={ci} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-700 border border-gray-100">
                              <span className="flex-1">{c}</span>
                              <button className="w-5 h-5 rounded hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-rose-500 transition-colors shrink-0">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          {r.comentarios.length === 0 && (
                            <p className="text-xs text-gray-300 italic">Sin comentarios</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── RIGHT SIDEBAR ────────────────────────────────────────────────── */}
        <div className="space-y-3">

          {/* Inspección de entrada */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-bold text-gray-800">Inspección de entrada</span>
              </div>
              <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Pendiente
              </span>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-gray-800">{d.inspecciones.entrada.completados}</span>
                <span className="text-sm text-gray-400">de {d.inspecciones.entrada.total}</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-0.5">Inspección por realizar</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Recorre los {d.inspecciones.entrada.total} puntos del vehículo. Cada punto admite foto y la IA evalúa la evidencia.
                </p>
              </div>
              <button className="w-full h-9 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center gap-2">
                <ClipboardCheck className="w-3.5 h-3.5" />
                Realizar inspección
              </button>
            </div>
          </div>

          {/* Inspección de salida */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden opacity-70">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-gray-300" />
                <span className="text-sm font-bold text-gray-400">Inspección de salida</span>
              </div>
              <span className="text-[10px] font-bold bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" />
                Bloqueada
              </span>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-gray-300">{d.inspecciones.salida.completados}</span>
                <span className="text-sm text-gray-300">de {d.inspecciones.salida.total}</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Disponible al registrar el ingreso del transportista.
              </p>
              <button disabled className="w-full h-9 rounded-xl text-xs font-medium bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-100 flex items-center justify-center gap-1.5">
                <Lock className="w-3 h-3" />
                Completa la etapa anterior
              </button>
            </div>
          </div>

          {/* Inspección de sello */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-teal-500" />
                <span className="text-sm font-bold text-gray-800">Inspección de sello</span>
              </div>
              <span className="text-[10px] font-bold bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Pendiente
              </span>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-[11px] text-gray-400">ISO 17712 · Método VVTT</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-gray-800">{d.inspecciones.sello.completados}</span>
                <span className="text-sm text-gray-400">de {d.inspecciones.sello.total}</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-0.5">Inspección de sello pendiente</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Método VVTT (View · Verify · Tug · Twist) sobre el sello clase H.
                </p>
              </div>
              <button className="w-full h-9 rounded-xl text-xs font-semibold bg-teal-900 hover:bg-teal-800 text-white transition-colors flex items-center justify-center gap-2">
                <Shield className="w-3.5 h-3.5" />
                Realizar inspección de sello
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
