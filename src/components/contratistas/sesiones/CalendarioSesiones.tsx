"use client";
// CF-03 · Calendario de sesiones: Día / Semana / Mes con Hoy y flechas, leyenda por tipo
// que filtra, arrastrar sobre un hueco para programar y popover del evento.
// Diseño: plataforma.dc.html, ssnIsCal (~1897–1971) y scal*/sev* (~7380–7500).
// Subvista "Asistencia" (empleado × día, CF-04) en AsistenciaCalendario.
import { useEffect, useMemo, useRef, useState, type MouseEvent as ME } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Expand, Link2, MapPin, Pencil, Repeat, Trash2, UserRound, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { BotonIcono } from "@/components/contratistas/ui";
import { MESES, fechaLocal, isoLocal, textoRecurrenciaSesion } from "@/components/contratistas/vigencia";
import type { Sesion, TipoSesion } from "@/types/contratistas";
import { AsistenciaCalendario } from "./AsistenciaCalendario";
import { ChipEstatusSesion, ChipModalidad, ICONO_TIPO, Linea } from "./piezas";
import {
  COLOR_TIPO, INSTRUCTOR, TIPOS_SESION, diasEntre, horario, ocurrencias, rangoFechas, recurrenciaEditor, sesionNueva, sumarDias,
  type AbrirEditor,
  urlSegura,
} from "./sesiones";

type Modo = "dia" | "semana" | "mes";
const MODOS: { k: Modo; etiqueta: string }[] = [{ k: "dia", etiqueta: "Día" }, { k: "semana", etiqueta: "Semana" }, { k: "mes", etiqueta: "Mes" }];
const SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const ALTO_HORA = 48;
const minutos = (h: string) => +h.slice(0, 2) * 60 + +h.slice(3, 5);
const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

interface Evento {
  s: Sesion;
  /** Día que se pinta (YYYY-MM-DD). */
  dia: string;
  /** Inicio de esta repetición. */
  inicio: string;
  conHora: boolean;
}

/** Días visibles según el modo (la semana arranca en domingo, como en el diseño). */
function diasDe(modo: Modo, ref: string): string[] {
  const d = fechaLocal(ref)!;
  if (modo === "dia") return [ref];
  if (modo === "semana") return Array.from({ length: 7 }, (_, i) => sumarDias(ref, i - d.getDay()));
  const primero = new Date(d.getFullYear(), d.getMonth(), 1);
  const ini = sumarDias(isoLocal(primero), -primero.getDay());
  return Array.from({ length: 42 }, (_, i) => sumarDias(ini, i));
}

function etiquetaPeriodo(modo: Modo, dias: string[], ref: string) {
  const d = fechaLocal(ref)!;
  if (modo === "mes") return `${MESES[d.getMonth()]} ${d.getFullYear()}`;
  if (modo === "dia") return `${SEMANA[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()].toLowerCase()} ${d.getFullYear()}`;
  const a = fechaLocal(dias[0])!;
  const b = fechaLocal(dias[6])!;
  return a.getMonth() === b.getMonth()
    ? `${a.getDate()} – ${b.getDate()} ${MESES[b.getMonth()].toLowerCase()} ${b.getFullYear()}`
    : `${a.getDate()} ${MESES[a.getMonth()].slice(0, 3).toLowerCase()} – ${b.getDate()} ${MESES[b.getMonth()].slice(0, 3).toLowerCase()} ${b.getFullYear()}`;
}

function mover(modo: Modo, ref: string, n: number) {
  if (modo === "dia") return sumarDias(ref, n);
  if (modo === "semana") return sumarDias(ref, 7 * n);
  const d = fechaLocal(ref)!;
  return isoLocal(new Date(d.getFullYear(), d.getMonth() + n, 1));
}

export function CalendarioSesiones({
  sesiones, cargando, onVer, onEditar, onEliminar,
}: {
  sesiones: Sesion[];
  cargando?: boolean;
  onVer: (s: Sesion) => void;
  onEditar: AbrirEditor;
  onEliminar: (s: Sesion) => void;
}) {
  const hoy = isoLocal(new Date());
  const [modo, setModo] = useState<Modo>("semana");
  const [ref, setRef] = useState(hoy);
  const [tipos, setTipos] = useState<TipoSesion[]>([]);
  const [pop, setPop] = useState<{ ev: Evento; x: number } | null>(null);
  const [sub, setSub] = useState<"sesiones" | "asistencia">("sesiones");

  const dias = useMemo(() => diasDe(modo, ref), [modo, ref]);
  const desde = dias[0];
  const hasta = dias[dias.length - 1];

  // Cada repetición pinta todos los días que dura (sesiones de varios días).
  const eventos = useMemo(() => {
    const out: Evento[] = [];
    for (const s of sesiones) {
      const largo = diasEntre(s.fecha_inicio, s.fecha_fin || s.fecha_inicio);
      const conHora = !!s.hora_inicio && largo === 0;
      for (const inicio of ocurrencias(s, desde, hasta)) {
        for (let i = 0; i <= largo; i++) {
          const dia = sumarDias(inicio, i);
          if (dia >= desde && dia <= hasta) out.push({ s, dia, inicio, conHora });
        }
      }
    }
    return out.sort((a, b) => (a.s.hora_inicio ?? "").localeCompare(b.s.hora_inicio ?? ""));
  }, [sesiones, desde, hasta]);

  const cuentaTipo = (t: TipoSesion) => new Set(eventos.filter((e) => e.s.tipo === t).map((e) => e.s.id)).size;
  const visibles = tipos.length ? eventos.filter((e) => tipos.includes(e.s.tipo)) : eventos;
  const delDia = (d: string) => visibles.filter((e) => e.dia === d);

  const abrir = (ev: Evento, e: ME) => {
    e.stopPropagation();
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const ancho = Math.min(420, window.innerWidth - 32);
    const x = r.right + 8 + ancho < window.innerWidth ? r.right + 8 : Math.max(16, r.left - 8 - ancho);
    setPop({ ev, x });
  };

  const nueva = (fecha: string, inicio?: string, fin?: string) => onEditar(undefined, sesionNueva(fecha, inicio, fin));

  return (
    <div className="flex flex-col overflow-hidden rounded-xl bg-c10-surface shadow-[0_0_0_1px_var(--c10-line)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-c10-line px-4 py-3">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setRef(hoy)} className="h-9 rounded-lg border border-c10-line px-3 text-sm font-medium text-c10-label hover:border-c10-acc hover:text-c10-acc">
            Hoy
          </button>
          <BotonIcono titulo="Periodo anterior" icono={<ChevronLeft />} onClick={() => setRef(mover(modo, ref, -1))} />
          <BotonIcono titulo="Periodo siguiente" icono={<ChevronRight />} onClick={() => setRef(mover(modo, ref, 1))} />
          <label className="relative ml-1 flex cursor-pointer items-center gap-1.5 text-base font-semibold text-c10-title" title="Elegir fecha">
            {etiquetaPeriodo(modo, dias, ref)}
            <CalendarDays className="size-4 text-c10-meta" aria-hidden />
            <input
              type="date" value={ref} onChange={(e) => e.target.value && setRef(e.target.value)}
              aria-label="Elegir fecha" className="absolute inset-0 cursor-pointer opacity-0"
            />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" aria-label="Qué ver" className="flex overflow-hidden rounded-lg ring-1 ring-c10-line">
          {(["sesiones", "asistencia"] as const).map((k, i) => (
            <button
              key={k} type="button" role="tab" aria-selected={sub === k} onClick={() => setSub(k)}
              className={cn(
                "h-9 px-4 text-sm transition-colors", i > 0 && "border-l border-c10-line",
                sub === k ? "bg-c10-acc font-semibold text-white" : "font-medium text-c10-secondary hover:bg-c10-sunken",
              )}
            >
              {k === "sesiones" ? "Sesiones" : "Asistencia"}
            </button>
          ))}
        </div>
        <div role="tablist" aria-label="Modo del calendario" className="flex overflow-hidden rounded-lg ring-1 ring-c10-line">
          {MODOS.map((m, i) => (
            <button
              key={m.k} type="button" role="tab" aria-selected={modo === m.k} onClick={() => setModo(m.k)}
              className={cn(
                "h-9 px-4 text-sm transition-colors", i > 0 && "border-l border-c10-line",
                modo === m.k ? "bg-c10-acc font-semibold text-white" : "font-medium text-c10-secondary hover:bg-c10-sunken",
              )}
            >
              {m.etiqueta}
            </button>
          ))}
        </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 border-b border-c10-line px-4 py-2.5">
        {TIPOS_SESION.map((t) => {
          const on = tipos.includes(t);
          const Icono = ICONO_TIPO[t];
          return (
            <button
              key={t} type="button" aria-pressed={on}
              onClick={() => setTipos((x) => (on ? x.filter((y) => y !== t) : [...x, t]))}
              className={cn(
                "inline-flex h-[30px] items-center gap-1.5 rounded-full px-3 text-[13px] transition-colors",
                on ? "bg-c10-acc-l font-semibold text-c10-acc ring-1 ring-c10-acc" : "text-c10-label ring-1 ring-c10-line hover:ring-c10-acc",
              )}
            >
              <span className={cn("flex size-4 items-center justify-center rounded-full [&_svg]:size-2.5", COLOR_TIPO[t].chip)}><Icono aria-hidden /></span>
              {t}
              <span className="tabular-nums text-c10-meta">{cuentaTipo(t)}</span>
            </button>
          );
        })}
        {!!tipos.length && (
          <button type="button" onClick={() => setTipos([])} className="ml-1 text-[13px] font-semibold text-c10-acc hover:underline">Limpiar</button>
        )}
      </div>

      <div className={cn("relative transition-opacity", cargando && "opacity-50")}>
        {sub === "asistencia" ? (
          <AsistenciaCalendario
            dias={modo === "mes" ? dias.filter((d) => fechaLocal(d)!.getMonth() === fechaLocal(ref)!.getMonth()) : dias}
            eventos={visibles} hoy={hoy} onVer={onVer}
          />
        ) : modo === "mes" ? (
          <Mes dias={dias} ref_={ref} hoy={hoy} delDia={delDia} onAbrir={abrir} onDia={(d) => { setModo("dia"); setRef(d); }} onNueva={nueva} />
        ) : (
          <Horas dias={dias} hoy={hoy} delDia={delDia} onAbrir={abrir} onDia={(d) => { setModo("dia"); setRef(d); }} onNueva={nueva} />
        )}
        {sub === "sesiones" && !cargando && !visibles.length && (
          <div className="pointer-events-none absolute inset-x-0 top-24 flex justify-center">
            <span className="rounded-full bg-c10-surface px-4 py-2 text-sm text-c10-meta shadow-[0_0_0_1px_var(--c10-line)]">No hay sesiones en este periodo.</span>
          </div>
        )}
      </div>

      {pop && (
        <Popover
          ev={pop.ev} x={pop.x} onCerrar={() => setPop(null)}
          onEditar={() => { setPop(null); onEditar(pop.ev.s); }}
          onEliminar={() => { setPop(null); onEliminar(pop.ev.s); }}
          onVer={() => { setPop(null); onVer(pop.ev.s); }}
        />
      )}
    </div>
  );
}

/* ---------- Mes ---------- */

function Mes({
  dias, ref_, hoy, delDia, onAbrir, onDia, onNueva,
}: {
  dias: string[]; ref_: string; hoy: string; delDia: (d: string) => Evento[];
  onAbrir: (ev: Evento, e: ME) => void; onDia: (d: string) => void; onNueva: (fecha: string) => void;
}) {
  const mes = fechaLocal(ref_)!.getMonth();
  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[720px] grid-cols-7">
        {SEMANA.map((w) => (
          <span key={w} className="border-b border-c10-line px-2 py-2 text-center text-xs font-semibold uppercase tracking-[.05em] text-c10-secondary">{w}</span>
        ))}
        {dias.map((d, i) => {
          const evs = delDia(d);
          const fuera = fechaLocal(d)!.getMonth() !== mes;
          return (
            <div
              key={d}
              onDoubleClick={() => onNueva(d)}
              title="Doble clic para programar una sesión"
              className={cn("flex min-h-[112px] flex-col gap-1 border-b border-c10-line p-1.5", i % 7 && "border-l", fuera && "bg-c10-panel")}
            >
              <button
                type="button" onClick={() => onDia(d)} title="Ver día"
                className={cn(
                  "flex size-7 items-center justify-center self-end rounded-full text-xs tabular-nums hover:bg-c10-sunken",
                  d === hoy ? "bg-c10-acc font-semibold text-white hover:bg-c10-acc-h" : fuera ? "text-c10-faint" : "text-c10-label",
                )}
              >
                {fechaLocal(d)!.getDate()}
              </button>
              {evs.slice(0, 3).map((ev, j) => <Chip key={`${ev.s.id}-${j}`} ev={ev} onAbrir={onAbrir} />)}
              {evs.length > 3 && (
                <button type="button" onClick={() => onDia(d)} className="self-start px-1 text-xs font-semibold text-c10-acc hover:underline">
                  {evs.length - 3} más
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Chip({ ev, onAbrir }: { ev: Evento; onAbrir: (ev: Evento, e: ME) => void }) {
  const cancelada = ev.s.estatus === "Cancelada";
  return (
    <button
      type="button" onClick={(e) => onAbrir(ev, e)} title={`${ev.s.nombre} · ${horario(ev.s)}`}
      className={cn("flex w-full min-w-0 items-center gap-1.5 rounded-md px-1.5 py-0.5 text-left text-xs", COLOR_TIPO[ev.s.tipo].chip, cancelada && "line-through opacity-60")}
    >
      {ev.conHora && <span className={cn("size-1.5 shrink-0 rounded-full", COLOR_TIPO[ev.s.tipo].punto)} />}
      {ev.conHora && <span className="shrink-0 tabular-nums">{ev.s.hora_inicio}</span>}
      <span className="truncate font-medium">{ev.s.nombre}</span>
    </button>
  );
}

/* ---------- Día y semana ---------- */

function Horas({
  dias, hoy, delDia, onAbrir, onDia, onNueva,
}: {
  dias: string[]; hoy: string; delDia: (d: string) => Evento[];
  onAbrir: (ev: Evento, e: ME) => void; onDia: (d: string) => void; onNueva: (fecha: string, inicio?: string, fin?: string) => void;
}) {
  const scroll = useRef<HTMLDivElement>(null);
  const [sel, setSel] = useState<{ dia: string; a: number; b: number } | null>(null);
  const [ahora, setAhora] = useState(() => new Date());
  useEffect(() => { if (scroll.current) scroll.current.scrollTop = 7 * ALTO_HORA; }, []);
  useEffect(() => { const t = setInterval(() => setAhora(new Date()), 60_000); return () => clearInterval(t); }, []);
  const cols = `56px repeat(${dias.length}, minmax(${dias.length > 1 ? 110 : 200}px, 1fr))`;

  // Arrastrar sobre un hueco: bloques de 30 min; al soltar abre "Programar nueva sesión".
  const aMin = (e: { clientY: number }, el: HTMLElement) => {
    const y = e.clientY - el.getBoundingClientRect().top;
    return Math.max(0, Math.min(24 * 60, Math.floor(y / (ALTO_HORA / 2)) * 30));
  };
  const bajar = (dia: string) => (e: ME<HTMLDivElement>) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest("button")) return;
    const el = e.currentTarget;
    const a = aMin(e, el);
    let actual = { dia, a, b: Math.min(a + 30, 24 * 60) };
    setSel(actual);
    const mov = (m: MouseEvent) => {
      const b = aMin(m, el);
      actual = { dia, a: Math.min(a, b), b: Math.max(a + 30, b + 30, Math.min(a, b) + 30) };
      if (b < a) actual = { dia, a: b, b: a + 30 };
      setSel(actual);
    };
    const subir = () => {
      window.removeEventListener("mousemove", mov);
      window.removeEventListener("mouseup", subir);
      setSel(null);
      onNueva(dia, hhmm(actual.a), hhmm(Math.min(actual.b, 23 * 60 + 59)));
    };
    window.addEventListener("mousemove", mov);
    window.addEventListener("mouseup", subir);
  };

  const todoElDia = dias.map((d) => delDia(d).filter((e) => !e.conHora));
  const hayTodoElDia = todoElDia.some((x) => x.length);
  const minAhora = ahora.getHours() * 60 + ahora.getMinutes();

  return (
    <div className="overflow-x-auto">
      <div className="min-w-fit">
        <div className="grid border-b border-c10-line" style={{ gridTemplateColumns: cols }}>
          <span />
          {dias.map((d) => {
            const f = fechaLocal(d)!;
            return (
              <div key={d} className="flex flex-col items-center gap-0.5 border-l border-c10-line py-2">
                <span className="text-xs font-semibold uppercase tracking-[.05em] text-c10-secondary">{SEMANA[f.getDay()]}</span>
                <button
                  type="button" onClick={() => onDia(d)} title="Ver día"
                  className={cn("flex size-8 items-center justify-center rounded-full text-sm tabular-nums", d === hoy ? "bg-c10-acc font-semibold text-white" : "text-c10-title hover:bg-c10-sunken")}
                >
                  {f.getDate()}
                </button>
              </div>
            );
          })}
          {hayTodoElDia && (
            <>
              <span className="flex items-start justify-end border-t border-c10-line px-1.5 py-1.5 text-right text-[10px] leading-tight text-c10-meta">Todo el día</span>
              {todoElDia.map((evs, i) => (
                <div key={dias[i]} className="flex flex-col gap-1 border-l border-t border-c10-line p-1">
                  {evs.map((ev, j) => <Chip key={`${ev.s.id}-${j}`} ev={ev} onAbrir={onAbrir} />)}
                </div>
              ))}
            </>
          )}
        </div>

        <div ref={scroll} className="max-h-[600px] overflow-y-auto">
          <div className="relative grid" style={{ gridTemplateColumns: cols, height: 24 * ALTO_HORA }}>
            <div className="relative">
              {Array.from({ length: 24 }, (_, h) => (
                <span key={h} className="absolute right-2 -translate-y-1/2 text-[11px] tabular-nums text-c10-meta" style={{ top: h * ALTO_HORA }}>
                  {h ? `${String(h).padStart(2, "0")}:00` : ""}
                </span>
              ))}
            </div>
            {dias.map((d) => {
              const evs = delDia(d).filter((e) => e.conHora);
              const carriles = carrilesDe(evs);
              return (
                <div
                  key={d} onMouseDown={bajar(d)} title="Arrastra para programar una sesión"
                  className="relative cursor-crosshair border-l border-c10-line select-none"
                  style={{ backgroundImage: `repeating-linear-gradient(to bottom, var(--c10-line) 0 1px, transparent 1px ${ALTO_HORA}px)` }}
                >
                  {evs.map((ev, j) => {
                    const a = minutos(ev.s.hora_inicio!);
                    const b = Math.max(a + 20, minutos(ev.s.hora_fin ?? hhmm(a + 60)));
                    const { carril, de } = carriles[j];
                    const alto = ((b - a) / 60) * ALTO_HORA;
                    return (
                      <button
                        key={`${ev.s.id}-${j}`} type="button" onClick={(e) => onAbrir(ev, e)} title={`${ev.s.nombre} · ${horario(ev.s)}`}
                        className={cn(
                          "absolute flex flex-col overflow-hidden rounded-md border-l-[3px] px-1.5 py-1 text-left text-xs shadow-sm",
                          COLOR_TIPO[ev.s.tipo].evento, ev.s.estatus === "Cancelada" && "line-through opacity-60",
                        )}
                        style={{ top: (a / 60) * ALTO_HORA + 1, height: alto - 2, left: `calc(${(carril / de) * 100}% + 2px)`, width: `calc(${100 / de}% - 4px)` }}
                      >
                        <span className="truncate font-semibold">{ev.s.nombre}</span>
                        <span className="truncate tabular-nums opacity-80">{horario(ev.s)}</span>
                        {alto > 64 && ev.s.lugar && <span className="truncate opacity-80">{ev.s.lugar}</span>}
                      </button>
                    );
                  })}
                  {sel?.dia === d && (
                    <div
                      className="pointer-events-none absolute inset-x-1 flex flex-col rounded-md border border-dashed border-c10-acc bg-c10-acc-l px-1.5 py-1 text-xs text-c10-acc"
                      style={{ top: (sel.a / 60) * ALTO_HORA, height: ((sel.b - sel.a) / 60) * ALTO_HORA }}
                    >
                      <span className="font-semibold">Nueva sesión</span>
                      <span className="tabular-nums">{hhmm(sel.a)} – {hhmm(Math.min(sel.b, 23 * 60 + 59))}</span>
                    </div>
                  )}
                  {d === hoy && (
                    <div className="pointer-events-none absolute inset-x-0 z-[1] flex items-center" style={{ top: (minAhora / 60) * ALTO_HORA }}>
                      <span className="-ml-1 size-2 rounded-full bg-red-600" />
                      <span className="h-0.5 flex-1 bg-red-600" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Eventos que se enciman van lado a lado: carril de cada uno y cuántos carriles tiene su grupo. */
function carrilesDe(evs: Evento[]) {
  const out = evs.map(() => ({ carril: 0, de: 1 }));
  const fin: number[] = [];
  let grupo: number[] = [];
  let finGrupo = -1;
  const cerrar = () => { const n = Math.max(1, ...grupo.map((i) => out[i].carril + 1)); grupo.forEach((i) => (out[i].de = n)); };
  evs.forEach((ev, i) => {
    const a = minutos(ev.s.hora_inicio!);
    const b = Math.max(a + 20, minutos(ev.s.hora_fin ?? hhmm(a + 60)));
    if (a >= finGrupo) { cerrar(); grupo = []; fin.length = 0; }
    let c = fin.findIndex((f) => f <= a);
    if (c < 0) c = fin.length;
    fin[c] = b;
    out[i].carril = c;
    grupo.push(i);
    finGrupo = Math.max(finGrupo, b);
  });
  cerrar();
  return out;
}

/* ---------- Popover ---------- */

function Popover({
  ev, x, onCerrar, onEditar, onEliminar, onVer,
}: { ev: Evento; x: number; onCerrar: () => void; onEditar: () => void; onEliminar: () => void; onVer: () => void }) {
  const s = ev.s;
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onCerrar]);
  const fechaRep = s.recurrencia ? { ...s, fecha_inicio: ev.inicio, fecha_fin: sumarDias(ev.inicio, diasEntre(s.fecha_inicio, s.fecha_fin || s.fecha_inicio)) } : s;
  const participantes = s.participantes;

  return (
    <>
      <div className="fixed inset-0 z-[400]" onClick={onCerrar} />
      <div className="pointer-events-none fixed inset-y-0 z-[401] flex w-[420px] max-w-[calc(100vw-32px)] items-center py-4" style={{ left: x }}>
        <div role="dialog" aria-label={s.nombre} className="pointer-events-auto flex max-h-full w-full flex-col overflow-hidden rounded-2xl bg-c10-surface shadow-[0_1px_3px_rgba(15,23,42,.08),0_12px_32px_rgba(15,23,42,.16)] duration-200 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-end gap-1 px-3 pt-3">
            <BotonIcono titulo="Editar" icono={<Pencil />} disabled={s.estatus === "Cancelada"} onClick={onEditar} />
            {s.estatus === "Programada" && <BotonIcono titulo="Eliminar" icono={<Trash2 />} peligro onClick={onEliminar} />}
            <BotonIcono titulo="Abrir detalle completo" icono={<Expand />} onClick={onVer} />
            <span className="mx-1 h-5 w-px bg-c10-line" />
            <BotonIcono titulo="Cerrar" icono={<X />} onClick={onCerrar} />
          </div>
          <div className="flex flex-col gap-4 overflow-y-auto px-5 pb-5 pt-1">
            <div className="flex gap-3">
              <span className={cn("mt-1.5 size-3 shrink-0 rounded", COLOR_TIPO[s.tipo].punto)} />
              <div className="flex min-w-0 flex-col gap-1.5">
                <span className="text-lg font-semibold leading-tight text-c10-title">{s.nombre}</span>
                <div className="flex flex-wrap gap-1.5">
                  <ChipEstatusSesion estatus={s.estatus} />
                  <span className="text-xs leading-[22px] text-c10-meta">{s.tipo}</span>
                  <ChipModalidad modalidad={s.modalidad} />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Linea icono={<CalendarDays />} nombre="Fecha y horario" valor={`${rangoFechas(fechaRep)} · ${horario(s)}`} />
              {s.recurrencia && <Linea icono={<Repeat />} nombre="Repetición" valor={textoRecurrenciaSesion(recurrenciaEditor(s), s.fecha_inicio)} />}
              {s.lugar && <Linea icono={<MapPin />} nombre="Lugar" valor={s.lugar} />}
              {s.enlace && (
                <Linea icono={<Link2 />} nombre="Enlace de la reunión" valor={<a href={urlSegura(s.enlace)} target="_blank" rel="noopener noreferrer" className="break-all text-c10-acc hover:underline">{s.enlace}</a>} />
              )}
              {s.instructor && <Linea icono={<UserRound />} nombre={INSTRUCTOR[s.tipo][0]} valor={s.instructor} />}
            </div>
            <div className="flex flex-col gap-2 border-t border-c10-line pt-3">
              <span className="flex items-center gap-2 text-sm font-semibold text-c10-title">
                <Users className="size-4 text-c10-meta" aria-hidden />
                {participantes.length} {participantes.length === 1 ? "participante" : "participantes"}{s.cupo ? ` de ${s.cupo}` : ""}
              </span>
              {!participantes.length && <span className="text-xs text-c10-meta">No hay participantes inscritos.</span>}
              {participantes.slice(0, 6).map((p) => (
                <span key={p.empleado.id} className="flex items-center gap-2 text-sm text-c10-label">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-c10-acc-l text-[10px] font-semibold text-c10-acc-h">
                    {p.empleado.nombre.split(" ").slice(0, 2).map((w) => w[0]).join("")}
                  </span>
                  <span className="truncate">{p.empleado.nombre}</span>
                </span>
              ))}
              {participantes.length > 6 && (
                <button type="button" onClick={onVer} className="self-start text-xs font-semibold text-c10-acc hover:underline">
                  Ver los {participantes.length}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
