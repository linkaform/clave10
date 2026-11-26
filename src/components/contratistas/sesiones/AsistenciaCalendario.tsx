"use client";
// CF-04 · Calendario → Asistencia: matriz empleado × día del periodo con % de asistencia
// y leyenda que filtra por estado. Diseño: plataforma.dc.html, scalIsCu (~1910–1953).
// "Sin registro de ingreso" del diseño queda fuera: su origen no está definido (ficha CF-04).
import { useMemo, useState } from "react";
import { Check, Clock, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/contratistas/ligar";
import { fechaLocal } from "@/components/contratistas/vigencia";
import type { Sesion } from "@/types/contratistas";
import { fechaLarga } from "./sesiones";

type Estado = "Asistió" | "Faltó" | "Pendiente" | "Inscrito";
const ESTADOS: { k: Estado; Icono: LucideIcon | null; clase: string; ayuda: string }[] = [
  { k: "Asistió", Icono: Check, clase: "bg-green-100 text-green-700", ayuda: "Registró asistencia" },
  { k: "Faltó", Icono: X, clase: "bg-red-100 text-red-700", ayuda: "Marcado como falta" },
  { k: "Pendiente", Icono: Clock, clase: "bg-amber-100 text-amber-700", ayuda: "Día transcurrido sin registro" },
  { k: "Inscrito", Icono: null, clase: "bg-c10-sunken text-c10-meta", ayuda: "Sesión por venir" },
];
const SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export interface DiaSesion {
  s: Sesion;
  dia: string;
}

interface Marca {
  s: Sesion;
  estado: Estado;
}

export function AsistenciaCalendario({
  dias, eventos, hoy, onVer,
}: {
  dias: string[];
  /** Cada día que ocupa cada sesión visible. */
  eventos: DiaSesion[];
  hoy: string;
  onVer: (s: Sesion) => void;
}) {
  const [filtro, setFiltro] = useState<Estado[]>([]);

  // empleado → día → marcas (una por sesión ese día)
  const { filas, conteo } = useMemo(() => {
    const porEmpleado = new Map<string, { nombre: string; dias: Map<string, Marca[]> }>();
    const conteo: Record<Estado, number> = { Asistió: 0, Faltó: 0, Pendiente: 0, Inscrito: 0 };
    for (const { s, dia } of eventos) {
      if (s.estatus === "Cancelada") continue;
      for (const p of s.participantes) {
        const m = p.asistencia[dia];
        const estado: Estado = m ?? (dia <= hoy ? "Pendiente" : "Inscrito");
        let e = porEmpleado.get(p.empleado.id);
        if (!e) porEmpleado.set(p.empleado.id, (e = { nombre: p.empleado.nombre, dias: new Map() }));
        e.dias.set(dia, [...(e.dias.get(dia) ?? []), { s, estado }]);
        conteo[estado]++;
      }
    }
    const filas = [...porEmpleado.entries()]
      .map(([id, e]) => {
        const todas = [...e.dias.values()].flat();
        const cuentan = todas.filter((m) => m.estado !== "Inscrito");
        const pct = cuentan.length ? Math.round((cuentan.filter((m) => m.estado === "Asistió").length * 100) / cuentan.length) : null;
        return { id, nombre: e.nombre, dias: e.dias, pct, estados: new Set(todas.map((m) => m.estado)) };
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
    return { filas, conteo };
  }, [eventos, hoy]);

  const visibles = filtro.length ? filas.filter((f) => filtro.some((e) => f.estados.has(e))) : filas;
  const cols = `minmax(200px, 240px) repeat(${dias.length}, minmax(44px, 1fr)) 64px`;

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-c10-line px-4 py-2.5">
        {ESTADOS.map(({ k, Icono, clase }) => {
          const on = filtro.includes(k);
          return (
            <button
              key={k} type="button" aria-pressed={on} onClick={() => setFiltro((x) => (on ? x.filter((y) => y !== k) : [...x, k]))}
              className={cn(
                "inline-flex h-[30px] items-center gap-1.5 rounded-full px-3 text-[13px] transition-colors",
                on ? "bg-c10-acc-l font-semibold text-c10-acc ring-1 ring-c10-acc" : "text-c10-label ring-1 ring-c10-line hover:ring-c10-acc",
              )}
            >
              <span className={cn("flex size-4 items-center justify-center rounded-full [&_svg]:size-2.5", clase)}>{Icono && <Icono aria-hidden />}</span>
              {k}
              <span className="tabular-nums text-c10-meta">{conteo[k]}</span>
            </button>
          );
        })}
        {!!filtro.length && <button type="button" onClick={() => setFiltro([])} className="ml-1 text-[13px] font-semibold text-c10-acc hover:underline">Limpiar</button>}
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-fit">
          <div className="grid border-b border-c10-line bg-c10-panel" style={{ gridTemplateColumns: cols }}>
            <span className="px-4 py-2 text-xs font-semibold uppercase tracking-[.05em] text-c10-secondary">Empleado</span>
            {dias.map((d) => {
              const f = fechaLocal(d)!;
              return (
                <span key={d} title={fechaLarga(d)} className={cn("flex flex-col items-center py-1.5 text-center", d === hoy && "text-c10-acc")}>
                  <span className="text-[10px] font-semibold uppercase">{SEMANA[f.getDay()]}</span>
                  <span className="text-xs tabular-nums">{f.getDate()}</span>
                </span>
              );
            })}
            <span className="py-2 text-center text-xs font-semibold uppercase tracking-[.05em] text-c10-secondary" title="Porcentaje de asistencia">Asist.</span>
          </div>

          {!visibles.length && (
            <div className="px-6 py-12 text-center text-sm text-c10-meta">
              {filas.length ? "No hay empleados con ese estado." : "No hay participantes inscritos en las sesiones de este periodo."}
            </div>
          )}

          {visibles.map((f) => (
            <div key={f.id} className="grid items-center border-b border-c10-line last:border-b-0 hover:bg-c10-panel" style={{ gridTemplateColumns: cols }}>
              <span className="flex min-w-0 items-center gap-2 px-4 py-2">
                <Avatar nombre={f.nombre} tam={32} />
                <span className="truncate text-sm font-medium text-c10-title">{f.nombre}</span>
              </span>
              {dias.map((d) => {
                const marcas = f.dias.get(d) ?? [];
                if (!marcas.length) return <span key={d} className="text-center text-c10-faint">-</span>;
                // La peor marca del día manda el color: falta > pendiente > inscrito > asistió
                const orden: Estado[] = ["Faltó", "Pendiente", "Inscrito", "Asistió"];
                const estado = orden.find((e) => marcas.some((m) => m.estado === e))!;
                const cfg = ESTADOS.find((x) => x.k === estado)!;
                const Icono = cfg.Icono;
                return (
                  <span key={d} className="flex justify-center">
                    <button
                      type="button" onClick={() => onVer(marcas[0].s)}
                      title={`${fechaLarga(d)}\n${marcas.map((m) => `${m.s.nombre} · ${m.estado}`).join("\n")}`}
                      className={cn("relative flex size-7 items-center justify-center rounded-full [&_svg]:size-3.5", cfg.clase)}
                    >
                      {Icono ? <Icono aria-hidden /> : <span className="size-1.5 rounded-full bg-current" />}
                      {marcas.length > 1 && (
                        <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-c10-surface text-[9px] font-semibold text-c10-label ring-1 ring-c10-line">
                          {marcas.length}
                        </span>
                      )}
                    </button>
                  </span>
                );
              })}
              <span className="text-center text-sm font-semibold tabular-nums text-c10-title">{f.pct != null ? `${f.pct}%` : "---"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
