"use client";

import * as React from "react";
import { ArrowRight, Check, ChevronDown, Clock, LogOut, Search, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { HomeCard } from "./home-card";

// Fijos por ahora: no hay un endpoint que junte accesos, paquetería, fallas,
// incidencias y objetos perdidos, ni uno de tareas del guardia. Datos del diseño.
type Tone = "blue" | "purple" | "amber" | "red" | "slate";

type Movement = {
  id: string;
  time: string;
  name: string;
  type: string;
  tone: Tone;
  meta: string;
  action?: "Dar Salida" | "Entregar" | "Seguimiento";
  status?: "Recogido" | "En proceso" | "Salió";
};

type Task = {
  id: string;
  title: string;
  origen: string;
  area: string;
  due: string;
  prio: "Alta" | "Media" | "Baja";
  done?: boolean;
};

const DOT: Record<Tone, string> = {
  blue: "bg-[#2F80ED]",
  purple: "bg-[#7C3AED]",
  amber: "bg-[#B45309]",
  red: "bg-[#DC2626]",
  slate: "bg-[#475569]",
};

const PRIO_DOT: Record<Task["prio"], string> = {
  Alta: "bg-[#DC2626]",
  Media: "bg-[#F59E0B]",
  Baja: "bg-[#94A3B8]",
};

const MOVEMENTS: Movement[] = [
  { id: "m1", time: "11:52", name: "Juan Carlos Pérez", type: "Visita", tone: "blue", meta: "Caseta Norte · ABC-123 · #12", action: "Dar Salida" },
  { id: "m2", time: "11:45", name: "Camioneta DHL · Guía 9921", type: "Paquete", tone: "purple", meta: "Caseta Principal · P-9844", status: "Recogido" },
  { id: "m3", time: "11:30", name: "Grupo Pintura Torre B (3)", type: "Proveedor", tone: "amber", meta: "Caseta Sur · NZY-221 · #P-04", action: "Dar Salida" },
  { id: "m4", time: "11:22", name: "Vehículo mal estacionado", type: "Incidencia", tone: "red", meta: "Estacionamiento B", action: "Seguimiento" },
  { id: "m5", time: "11:15", name: "Mariana Ríos (Uber)", type: "Visita", tone: "blue", meta: "Caseta Norte · L-5521 · #08", action: "Dar Salida" },
  { id: "m6", time: "11:05", name: "Mercado Libre (2 paquetes)", type: "Paquete", tone: "purple", meta: "Caseta Principal", action: "Entregar" },
  { id: "m7", time: "10:58", name: "Pluma de acceso 2 no abre", type: "Falla", tone: "amber", meta: "Acceso vehicular", status: "En proceso" },
  { id: "m8", time: "10:48", name: "Ing. Rodrigo Sánchez", type: "Visita", tone: "blue", meta: "Caseta Principal · XYZ-789 · #03", status: "Salió" },
  { id: "m9", time: "10:30", name: "Gafete encontrado en comedor", type: "Objeto perdido", tone: "slate", meta: "Comedor", action: "Entregar" },
  { id: "m10", time: "10:15", name: "Mantenimiento Elevadores Otis", type: "Proveedor", tone: "amber", meta: "Caseta Sur · OTIS-01 · #P-01", action: "Dar Salida" },
];

const TASKS: Task[] = [
  { id: "t1", title: "Cambiar foco de la entrada principal", origen: "Falla", area: "Caseta Principal", due: "12:00", prio: "Alta" },
  { id: "t2", title: "Reparar pluma de acceso 2", origen: "Falla", area: "Acceso vehicular", due: "13:00", prio: "Alta" },
  { id: "t3", title: "Retirar vehículo mal estacionado", origen: "Incidencia", area: "Estacionamiento B", due: "11:45", prio: "Media", done: true },
  { id: "t4", title: "Revisar cámara sin señal en andén 2", origen: "Falla", area: "Andén 2", due: "14:00", prio: "Media" },
  { id: "t5", title: "Dar seguimiento a persona sin gafete", origen: "Incidencia", area: "Andén 2", due: "15:30", prio: "Baja" },
];

const TYPES = ["Visita", "Paquete", "Proveedor", "Incidencia", "Falla", "Objeto perdido"];

const ACTION_ICONS = { "Dar Salida": LogOut, Entregar: Check, Seguimiento: ArrowRight };
const STATUS_ICONS = { Recogido: Check, Salió: Check, "En proceso": Clock };

const TOTAL_MOVEMENTS = 21;

export function RecentMovements({ className }: { className?: string }) {
  const [tab, setTab] = React.useState<"mov" | "tar">("mov");
  const [query, setQuery] = React.useState("");
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [types, setTypes] = React.useState<string[]>([]);
  const [tasks, setTasks] = React.useState(TASKS);

  const q = query.trim().toLowerCase();
  const movements = MOVEMENTS.filter(
    (m) =>
      (!q || `${m.name} ${m.meta}`.toLowerCase().includes(q)) &&
      (types.length === 0 || types.includes(m.type)),
  );
  const visibleTasks = tasks.filter((t) => !q || `${t.title} ${t.area}`.toLowerCase().includes(q));
  const pendingTasks = tasks.filter((t) => !t.done).length;

  const switchTab = (next: "mov" | "tar") => {
    setTab(next);
    setQuery("");
    setFilterOpen(false);
  };

  return (
    <HomeCard className={cn("min-h-[420px]", className)}>
      <div className="px-[22px] pt-5">
        <div role="tablist" className="flex gap-5 shadow-[inset_0_-1px_0_#E5E7EB]">
          <TabButton active={tab === "mov"} onClick={() => switchTab("mov")}>
            Movimientos
            <span className="ml-0.5 block h-2 w-2 rounded-full bg-green-600 animate-pulse" />
          </TabButton>
          <TabButton active={tab === "tar"} onClick={() => switchTab("tar")}>
            Mis tareas
            <span
              className={cn(
                "min-w-[18px] h-[18px] px-[5px] rounded-full text-[11px] font-bold flex items-center justify-center tabular-nums",
                tab === "tar" ? "bg-[#EFF6FF] text-[#2F80ED]" : "bg-slate-100 text-slate-500",
              )}>
              {pendingTasks}
            </span>
          </TabButton>
        </div>
      </div>

      <div className="relative flex gap-2 px-[22px] pt-2.5 pb-2.5">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tab === "mov" ? "Buscar nombre, placa, folio" : "Buscar tarea o área"}
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-200 bg-white text-sm text-neutral-900 outline-none transition-[border-color,box-shadow] focus:border-[#2F80ED] focus:shadow-[0_0_0_3px_rgba(47,128,237,.15)]"
          />
        </div>
        {tab === "mov" && (
          <button
            type="button"
            title="Filtrar por tipo"
            onClick={() => setFilterOpen((o) => !o)}
            className={cn(
              "relative h-10 w-10 flex-shrink-0 rounded-lg border flex items-center justify-center transition-colors",
              filterOpen || types.length
                ? "border-[#BFDBFE] bg-[#EFF6FF] text-[#2F80ED]"
                : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
            )}>
            <SlidersHorizontal className="h-4 w-4" />
            {types.length > 0 && (
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-[#2F80ED] ring-2 ring-white" />
            )}
          </button>
        )}
        {filterOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setFilterOpen(false)} />
            <div className="absolute top-14 left-[22px] right-[22px] z-[31] px-3.5 pt-3 pb-3.5 rounded-xl bg-white shadow-[0_0_0_1px_#E5E7EB,0_12px_32px_rgba(15,23,42,.14)] flex flex-col">
              <div className="flex items-center justify-between pb-2.5 border-b border-gray-200">
                <span className="text-base font-semibold text-slate-900">Filtros</span>
                {types.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setTypes([])}
                    className="h-7 px-2 rounded-md text-sm font-semibold text-[#2F80ED] hover:bg-[#EFF6FF]">
                    Limpiar
                  </button>
                )}
              </div>
              <span className="pt-3 pb-2.5 text-[13px] font-semibold text-slate-700">Tipo</span>
              <div className="flex flex-wrap gap-1.5">
                {TYPES.map((t) => {
                  const on = types.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTypes((cur) => (on ? cur.filter((x) => x !== t) : [...cur, t]))}
                      className={cn(
                        "h-[30px] px-3 rounded-full text-[13px] flex items-center gap-1.5 transition-colors",
                        on ? "bg-[#2F80ED] text-white font-semibold" : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                      )}>
                      {t}
                      {on && <Check className="h-3.5 w-3.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {tab === "mov" ? (
        <>
          <div className="flex-1 min-h-0 overflow-y-auto px-3 flex flex-col gap-0.5">
            {movements.length === 0 && <Empty title="Sin resultados" text="Prueba con otro nombre o quita el filtro." />}
            {movements.map((m, i) => {
              const ActionIcon = m.action ? ACTION_ICONS[m.action] : null;
              const StatusIcon = m.status ? STATUS_ICONS[m.status] : null;
              return (
                <div key={m.id} className="flex items-stretch gap-3 px-2.5 rounded-[14px] transition-colors hover:bg-slate-50">
                  <span className="relative w-3 flex-shrink-0 flex justify-center">
                    <span
                      className={cn(
                        "absolute w-0.5 bg-[#EEF2F7]",
                        i === 0 ? "top-5" : "top-0",
                        i === movements.length - 1 ? "h-5" : "bottom-0",
                      )}
                    />
                    <span className={cn("relative mt-[15px] h-2.5 w-2.5 rounded-full ring-[3px] ring-white", DOT[m.tone])} />
                  </span>
                  <span className="flex-1 min-w-0 py-2.5 flex flex-col gap-[3px]">
                    <span className="flex items-baseline gap-2.5 min-w-0">
                      <span className="flex-1 min-w-0 text-sm font-semibold text-slate-900 truncate">{m.name}</span>
                      <span className="flex-shrink-0 text-xs text-slate-400 tabular-nums">{m.time}</span>
                    </span>
                    <span className="flex items-center gap-1.5 min-w-0 text-xs text-slate-500">
                      <span className={cn("h-1.5 w-1.5 flex-shrink-0 rounded-full", DOT[m.tone])} />
                      <span className="flex-shrink-0 font-medium text-slate-700">{m.type}</span>
                      <span className="flex-shrink-0 text-slate-300">·</span>
                      <span className="min-w-0 truncate tabular-nums">{m.meta}</span>
                    </span>
                  </span>
                  <span className="w-8 flex-shrink-0 flex items-center justify-center">
                    {m.action && ActionIcon && (
                      <button
                        type="button"
                        title={m.action}
                        aria-label={m.action}
                        onClick={() => toast(`Abriendo: ${m.action} · ${m.name}`)}
                        className={cn(
                          "h-8 w-8 flex items-center justify-center rounded-[10px] transition-colors",
                          m.action === "Dar Salida"
                            ? "text-red-600 hover:bg-red-100 hover:text-red-700"
                            : "text-slate-500 hover:bg-[#EFF6FF] hover:text-[#2F80ED]",
                        )}>
                        <ActionIcon className="h-4 w-4" />
                      </button>
                    )}
                    {StatusIcon && (
                      <span title={m.status} className="text-slate-400">
                        <StatusIcon className="h-4 w-4" />
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="px-[22px] pt-2 pb-3.5 border-t border-slate-100 flex">
            <button
              type="button"
              onClick={() => toast("Pendiente: ver todos los movimientos")}
              className="flex-1 h-9 rounded-[10px] text-[13px] font-semibold text-[#2F80ED] flex items-center justify-center gap-1.5 transition-colors hover:bg-[#EFF6FF]">
              Ver más ({TOTAL_MOVEMENTS})
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-3 flex flex-col gap-0.5">
          {visibleTasks.length === 0 && <Empty title="Sin tareas" text="No hay tareas que coincidan con tu búsqueda." />}
          {visibleTasks.map((t) => (
            <div key={t.id} className="flex items-start gap-3 p-2.5 rounded-[14px] transition-colors hover:bg-slate-50">
              <button
                type="button"
                role="checkbox"
                aria-checked={!!t.done}
                title={t.done ? "Marcar como pendiente" : "Marcar como hecha"}
                onClick={() => setTasks((cur) => cur.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))}
                className={cn(
                  "mt-px h-5 w-5 flex-shrink-0 rounded-full flex items-center justify-center text-white transition-colors",
                  t.done ? "bg-green-600" : "border-[1.5px] border-slate-300 bg-white hover:border-[#2F80ED]",
                )}>
                {t.done && <Check className="h-3 w-3" />}
              </button>
              <span className="flex-1 min-w-0 flex flex-col gap-[3px]">
                <span className={cn("text-sm font-semibold", t.done ? "text-slate-400 line-through" : "text-slate-900")}>
                  {t.title}
                </span>
                <span className="flex items-center gap-1.5 min-w-0 text-xs text-slate-500">
                  <span title={`Prioridad ${t.prio}`} className={cn("h-1.5 w-1.5 flex-shrink-0 rounded-full", PRIO_DOT[t.prio])} />
                  <span className="flex-shrink-0 font-medium text-slate-700">{t.origen}</span>
                  <span className="flex-shrink-0 text-slate-300">·</span>
                  <span className="min-w-0 truncate">{t.area}</span>
                  <span className="flex-shrink-0 text-slate-300">·</span>
                  <span className="flex-shrink-0 tabular-nums">{t.due}</span>
                </span>
              </span>
            </div>
          ))}
        </div>
      )}
    </HomeCard>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "h-10 flex-shrink-0 flex items-center gap-[5px] border-b-2 text-sm whitespace-nowrap transition-colors",
        active ? "border-[#2F80ED] text-[#2F80ED] font-semibold" : "border-transparent text-slate-500 font-medium hover:text-slate-700",
      )}>
      {children}
    </button>
  );
}

function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-1.5 p-6 text-center">
      <div className="text-sm font-semibold text-slate-700">{title}</div>
      <div className="text-[13px] text-slate-500">{text}</div>
    </div>
  );
}
