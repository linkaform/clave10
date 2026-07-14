"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { NuevoAccesoTransportistaModal } from "@/components/modals/nuevo-acceso-transportista-modal";
import {
  Plus,
  Search,
  Calendar,
  User,
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGetBitacoraTransportistaRecords, BitacoraTransportistaRecord } from "@/hooks/useGetBitacoraTransportistaRecords";
import { SeleccionAndenModal } from "@/components/modals/SeleccionAndenModal";
import { saveBitacoraTransportistaRecord } from "@/services/endpoints";
import { toast } from "sonner";
import { Pencil } from "lucide-react";

// ─── Columnas del kanban ────────────────────────────────────────────────────

const COLUMNAS = [
  { key: "arribo",             label: "Arribo",             color: "bg-blue-500",    light: "bg-blue-50",    border: "border-blue-200",    text: "text-blue-700"    },
  { key: "inspeccion_entrada", label: "Inspección entrada", color: "bg-violet-500",  light: "bg-violet-50",  border: "border-violet-200",  text: "text-violet-700"  },
  { key: "carga_/_descarga",   label: "Carga / Descarga",   color: "bg-emerald-500", light: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700" },
  { key: "inspeccion_salida",  label: "Inspección salida",  color: "bg-orange-500",  light: "bg-orange-50",  border: "border-orange-200",  text: "text-orange-700"  },
  { key: "terminado",          label: "Terminado",          color: "bg-green-500",   light: "bg-green-50",   border: "border-green-200",   text: "text-green-700"   },
] as const;

// ─── Helpers ────────────────────────────────────────────────────────────────

function initials(name: string | null): string {
  if (!name) return "?";
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

const AVATAR_COLORS = [
  "bg-blue-500","bg-violet-500","bg-emerald-500",
  "bg-orange-500","bg-rose-500","bg-cyan-500","bg-amber-500",
];
function avatarColor(str: string | null): string {
  if (!str) return AVATAR_COLORS[0];
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function minutosTranscurridos(dt: string | null, now: number): number {
  if (!dt) return 0;
  const ms = new Date(dt.replace(" ", "T")).getTime();
  return Math.floor((now - ms) / 60000);
}

function tiempoLabel(mins: number): { label: string; color: string; dot: string } {
  if (mins < 30) return { label: `${mins} min`, color: "text-green-600 bg-green-50", dot: "bg-green-500" };
  if (mins < 60) return { label: `${mins} min`, color: "text-amber-600 bg-amber-50", dot: "bg-amber-500" };
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return { label: h > 0 ? `${h}h ${m}m` : `${mins} min`, color: "text-red-600 bg-red-50", dot: "bg-red-500" };
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatFechaDisplay(iso: string): string {
  if (iso === todayIso()) return "Hoy";
  const [y, m, d] = iso.split("-");
  const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]} ${y}`;
}

// ─── Tarjeta ────────────────────────────────────────────────────────────────

function KanbanCard({ record, now }: { record: BitacoraTransportistaRecord; now: number }) {
  const isEntrega = record.tipo_de_operacion === "entrega";
  const sinPase = !record.num_de_pase;
  const mins = minutosTranscurridos(record.fecha_hora_ingreso, now);
  const tiempo = record.fecha_hora_ingreso ? tiempoLabel(mins) : null;
  const queryClient = useQueryClient();

  const [localAnden, setLocalAnden] = useState<string | null>(record.anden_asignado ?? null);
  const [showAndenModal, setShowAndenModal] = useState(false);
  const [savingAnden, setSavingAnden] = useState(false);

  const handleAndenConfirm = async (anden: string | null) => {
    setShowAndenModal(false);
    const prev = localAnden;
    setLocalAnden(anden);
    setSavingAnden(true);
    try {
      await saveBitacoraTransportistaRecord(record._id, "estatus", { anden: anden ?? "" });
      queryClient.invalidateQueries({ queryKey: ["bitacoraTransportistaRecords"] });
      toast.success("Andén actualizado");
    } catch {
      setLocalAnden(prev);
      toast.error("Error al actualizar el andén");
    } finally {
      setSavingAnden(false);
    }
  };

  return (
    <>
      <Link href={`/dashboard/accesos/transportista/${record._id}`} className="block bg-white rounded-xl border border-gray-100 shadow-sm p-3.5 space-y-2.5 hover:shadow-md hover:border-blue-100 transition-all cursor-pointer">
        <div className="flex items-start justify-between gap-2">
          {sinPase
            ? <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md">SIN PASE</span>
            : <span className="text-[10px] font-bold text-gray-400 tracking-wide">{record.folio}</span>
          }
          {tiempo && (
            <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1", tiempo.color)}>
              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", tiempo.dot)} />
              {tiempo.label}
            </span>
          )}
        </div>
        <p className="text-sm font-bold text-gray-800 leading-tight">{record.placas ?? "—"}</p>
        {sinPase && <p className="text-[10px] text-gray-400 -mt-1">{record.folio}</p>}
        {record.proveedor_cliente && (
          <div className="flex items-center gap-1.5">
            <div className={cn("w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold text-white shrink-0", avatarColor(record.proveedor_cliente))}>
              {initials(record.proveedor_cliente)}
            </div>
            <span className="text-xs text-gray-600 truncate">{record.proveedor_cliente}</span>
          </div>
        )}
        {record.conductor && (
          <div className="flex items-center gap-1.5 text-gray-500">
            <User className="w-3 h-3 shrink-0" />
            <span className="text-xs truncate">{record.conductor}</span>
          </div>
        )}
        {record.material && (
          <div className="flex items-center gap-1.5 text-gray-500">
            <Package className="w-3 h-3 shrink-0" />
            <span className="text-xs truncate">{record.material}</span>
          </div>
        )}
        <div className="flex items-center gap-2 pt-0.5 flex-wrap">
          <span className={cn(
            "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full",
            isEntrega ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"
          )}>
            {isEntrega ? <ArrowDownToLine className="w-3 h-3" /> : <ArrowUpFromLine className="w-3 h-3" />}
            {isEntrega ? "Entrega" : "Recolección"}
          </span>
          {localAnden && (
            <div className="flex items-center gap-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-[10px] font-bold text-blue-700">
                {savingAnden
                  ? <span className="w-2.5 h-2.5 border border-blue-400 border-t-transparent rounded-full animate-spin" />
                  : null}
                Andén {localAnden}
              </span>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowAndenModal(true); }}
                className="w-5 h-5 rounded flex items-center justify-center text-gray-300 hover:text-blue-500 transition-colors">
                <Pencil className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </Link>
      {showAndenModal && (
        <SeleccionAndenModal
          folio={record.folio}
          placa={record.placas}
          confirmLabel="Confirmar andén"
          saving={savingAnden}
          onClose={() => setShowAndenModal(false)}
          onConfirm={handleAndenConfirm}
        />
      )}
    </>
  );
}

// ─── Columna Programados (especial) ─────────────────────────────────────────

function ProgramadosColumn({
  records, fecha, now, onChangeDay,
}: {
  records: BitacoraTransportistaRecord[];
  fecha: string;
  now: number;
  onChangeDay: (delta: number) => void;
}) {
  return (
    <div className="flex flex-col flex-1 min-w-0 h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-t-xl bg-gray-100 border border-gray-200">
        <span className="w-2 h-2 rounded-full bg-gray-400 shrink-0" />
        <span className="text-xs font-bold text-gray-500 flex-1">Programados</span>
        <span className="text-xs font-semibold text-gray-500 bg-white border border-gray-200 px-1.5 py-0.5 rounded-md">{records.length}</span>
        <ArrowUpDown className="w-3 h-3 text-gray-400 shrink-0" />
      </div>
      {/* Body */}
      <div className="flex-1 border border-t-0 border-gray-200 bg-gray-50 rounded-b-xl flex flex-col overflow-hidden">
        {/* Selector de fecha */}
        <div className="flex items-center gap-1 px-2 py-2.5 border-b border-gray-200 shrink-0">
          <button type="button" onClick={() => onChangeDay(-1)}
            className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors text-gray-400 shrink-0">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-1.5 flex-1 justify-center bg-white rounded-lg px-2 py-1 border border-gray-200 shadow-sm">
            <Calendar className="w-3 h-3 text-gray-400 shrink-0" />
            <span className="text-xs font-semibold text-gray-600 whitespace-nowrap">{formatFechaDisplay(fecha)}</span>
          </div>
          <button type="button" onClick={() => onChangeDay(1)}
            className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors text-gray-400 shrink-0">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2" style={{ scrollbarWidth: "none" }}>
          {records.length === 0 ? (
            <div className="flex items-center justify-center h-16 text-xs text-gray-300 font-medium">Sin registros</div>
          ) : (
            records.map((r) => <KanbanCard key={r._id} record={r} now={now} />)
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Columna estándar ────────────────────────────────────────────────────────

function KanbanColumn({
  col, records, now,
}: {
  col: typeof COLUMNAS[number];
  records: BitacoraTransportistaRecord[];
  now: number;
}) {
  return (
    <div className="flex flex-col flex-1 min-w-0 h-full">
      {/* Header */}
      <div className={cn("flex items-center gap-2 px-3 py-2.5 rounded-t-xl border", col.border, col.light)}>
        <span className={cn("w-2 h-2 rounded-full shrink-0", col.color)} />
        <span className={cn("text-xs font-bold flex-1", col.text)}>{col.label}</span>
        <span className={cn("text-xs font-semibold px-1.5 py-0.5 rounded-md bg-white border", col.border, col.text)}>{records.length}</span>
        <ArrowUpDown className={cn("w-3 h-3 shrink-0", col.text, "opacity-50")} />
      </div>
      {/* Body */}
      <div className={cn("flex-1 border border-t-0 rounded-b-xl overflow-y-auto p-2 space-y-2", col.border, col.light)} style={{ scrollbarWidth: "none" }}>
        {records.length === 0 ? (
          <div className="flex items-center justify-center h-16 text-xs text-gray-300 font-medium">Sin registros</div>
        ) : (
          records.map((r) => <KanbanCard key={r._id} record={r} now={now} />)
        )}
      </div>
    </div>
  );
}

// ─── Página principal ────────────────────────────────────────────────────────

export default function BitacorasTransportistasPage() {
  const [fecha, setFecha] = useState(todayIso());
  const [search, setSearch] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [modalNuevoOpen, setModalNuevoOpen] = useState(false);

  // Actualiza el reloj cada minuto para refrescar los tiempos en etapa
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Bloquea el scroll global mientras esta página está montada
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const { data: records, isLoading } = useGetBitacoraTransportistaRecords(fecha);

  const filtered = records.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.folio?.toLowerCase().includes(q) ||
      r.placas?.toLowerCase().includes(q) ||
      r.conductor?.toLowerCase().includes(q) ||
      r.proveedor_cliente?.toLowerCase().includes(q)
    );
  });

  const byEstatus = (key: string) => filtered.filter((r) => r.estatus === key);

  const changeDay = (delta: number) => {
    const d = new Date(fecha + "T12:00:00");
    d.setDate(d.getDate() + delta);
    setFecha(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
  };

  return (
    <div className="flex flex-col bg-gray-50 overflow-hidden" style={{ height: "calc(100vh - 57px)" }}>
      {/* ── Top bar ── */}
      <div className="flex items-center gap-4 px-6 py-4 bg-white border-b border-gray-100 shrink-0">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-gray-400 mb-0.5">
            <span className="hover:underline cursor-pointer">Accesos</span>
            <span className="mx-1">›</span>
            <span className="font-semibold text-gray-500">Transportistas</span>
          </p>
          <h1 className="text-xl font-bold text-gray-900">Bitácoras Transportistas</h1>
        </div>

        {/* Leyenda tiempo en etapa */}
        <div className="hidden md:flex items-center gap-3 text-xs text-gray-500 border border-gray-200 rounded-full px-4 py-1.5 bg-white">
          <span className="text-gray-400">Tiempo En Etapa</span>
          <span className="w-px h-3 bg-gray-200" />
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500" />A tiempo</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" />Empieza a demorarse</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" />Demora</span>
        </div>

        {/* Búsqueda */}
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar folio, placas, chofer..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-blue-300 transition-colors shadow-sm"
          />
        </div>

        {/* Botón nuevo */}
        <button type="button"
          onClick={() => setModalNuevoOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm">
          <Plus className="w-3.5 h-3.5" />
          Nuevo Acceso Transportista
        </button>
      </div>

      {/* ── Kanban ── */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-sm text-gray-400">
            Cargando registros...
          </div>
        ) : (
          <div className="flex gap-3 p-4 h-full w-full">
            <ProgramadosColumn
              records={byEstatus("programado")}
              fecha={fecha}
              now={now}
              onChangeDay={changeDay}
            />
            {COLUMNAS.map((col) => (
              <KanbanColumn key={col.key} col={col} records={byEstatus(col.key)} now={now} />
            ))}
          </div>
        )}
      </div>

      <NuevoAccesoTransportistaModal
        open={modalNuevoOpen}
        onClose={() => setModalNuevoOpen(false)}
      />
    </div>
  );
}
