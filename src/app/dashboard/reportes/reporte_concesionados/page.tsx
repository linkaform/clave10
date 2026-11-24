"use client";

import React, { useEffect, useMemo, useState } from "react";
import { BarChart3, ChevronLeft, FileDown, SlidersHorizontal, Table2 } from "lucide-react";
import { useSelectedLocationsStore } from "@/store/useSelectedLocationsStore";
import { KpiChip, SegTabs } from "../components/shared/ui";
import { FechaPicker } from "../components/shared/periodo/FechaPicker";
import { PeriodNav } from "../components/shared/periodo/PeriodNav";
import { ChartCard } from "../components/shared/graficas/Charts";
import { ReportTable } from "../components/shared/tabla/ReportTable";
import { descargarExcel } from "../components/shared/excel";
import { MultiCombo } from "../components/shared/filtros/MultiCombo";
import { Seccion } from "../components/shared/filtros/Seccion";
import { QuickFilters, QuickPill } from "../components/shared/filtros/QuickFilters";
import { EcoPanel, EcoRail } from "../components/concesionados/EcoPanel";
import { DetallePanel } from "../components/concesionados/DetallePanel";
import { useReporteConcesionados } from "./lib/api";
import { Calc, QI, QUICK, SER, filtrarTabla } from "./lib/cards";
import { Prestamo, VLBL, Vista, addDias, corte, enriquecer, n, paso, periodo, sod, uniq } from "./lib/core";
import { resumen } from "./lib/resumen";
import { PanelSel, panelSpec } from "./lib/paneles";
import { articulos, economico, forzadas, guardias, solicitantes } from "./lib/tabs";

type Tab = "resumen" | "guardias" | "solicitantes" | "articulos" | "forzadas" | "economico";
type Modo = "graficas" | "tablas";
type FKey = "guardia" | "tipo" | "categoria" | "articulo";

const TABS: { value: Tab; label: string }[] = [
  { value: "resumen", label: "Resumen operativo" }, { value: "guardias", label: "Guardias" }, { value: "solicitantes", label: "Solicitantes" },
  { value: "articulos", label: "Artículos" }, { value: "forzadas", label: "Cierres forzados" }, { value: "economico", label: "Económico" },
];
const VISTAS: Record<Tab, Vista[]> = {
  resumen: ["dia", "semana", "mes"], guardias: ["u30", "dia", "semana", "mes"], solicitantes: ["u60", "semana", "mes", "historico"],
  articulos: ["u60", "semana", "mes"], forzadas: ["u60", "semana", "mes"], economico: ["u60", "dia", "semana", "mes"],
};
const VISTA0: Record<Tab, Vista> = { resumen: "mes", guardias: "u30", solicitantes: "u60", articulos: "u60", forzadas: "u60", economico: "mes" };
// Filtros del panel por pestaña, en el orden del diseño. La ubicación sale del selector global.
const FILTROS: Record<Tab, FKey[]> = {
  resumen: ["guardia", "tipo", "categoria"], guardias: ["guardia"], solicitantes: ["tipo", "categoria"],
  articulos: ["tipo", "categoria", "articulo"], forzadas: ["guardia", "tipo", "categoria", "articulo"], economico: ["tipo", "categoria", "articulo"],
};
const toISO = (t: number) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const FDEF: Record<FKey, { t: string; ph: string; campo: (r: Prestamo) => string[] }> = {
  guardia: { t: "Guardias", ph: "Buscar guardia", campo: r => [r.guardia_presto, r.guardia_cierre].filter(Boolean) },
  tipo: { t: "Tipo de solicitante", ph: "Buscar tipo de solicitante", campo: r => [r.tipo_solicitante] },
  categoria: { t: "Categorías", ph: "Buscar categoría", campo: r => [r.categoria] },
  articulo: { t: "Artículos", ph: "Buscar artículo", campo: r => [r.articulo] },
};
const F0: Record<FKey, string[]> = { guardia: [], tipo: [], categoria: [], articulo: [] };

const useWide = () => {
  const [wide, setWide] = useState(true);
  useEffect(() => {
    const q = window.matchMedia("(min-width: 1100px)");
    const on = () => setWide(q.matches);
    on();
    q.addEventListener("change", on);
    return () => q.removeEventListener("change", on);
  }, []);
  return wide;
};

const Icono = ({ d, size = 15 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);

// Ícono de cada botón de estatus: caja de 20px como los de asistencias, con el trazo del diseño
const QuickIcon = ({ k }: { k: string }) => (
  <span className="inline-flex h-5 w-5 flex-none items-center justify-center" style={{ color: QI[k][1] }}><Icono d={QI[k][0]} /></span>
);


const ReporteConcesionadosPage = () => {
  const wide = useWide();
  const [ahora] = useState(() => Date.now());
  const [tab, setTab] = useState<Tab>("resumen");
  const [modo, setModo] = useState<Modo>("graficas");
  const [vistas, setVistas] = useState<Record<Tab, Vista>>(VISTA0);
  const [ref, setRef] = useState(() => sod(ahora));
  const [f, setF] = useState<Record<FKey, string[]>>(F0);
  const [quick, setQuick] = useState<string[]>([]);
  const [tablaSel, setTablaSel] = useState<Partial<Record<Tab, string>>>({});
  const [panelOpen, setPanelOpen] = useState(true);
  const [narrowOpen, setNarrowOpen] = useState(false);
  const [agrupar, setAgrupar] = useState<"persona" | "empresa">("persona");
  const [ecoOpen, setEcoOpen] = useState(true);

  // Datos: se piden los últimos 12 meses (cubre todos los periodos salvo meses más viejos).
  // TODO(back): ver lib/api.ts
  const desde = toISO(addDias(sod(ahora), -365)), hasta = toISO(ahora);
  const { selectedLocations } = useSelectedLocationsStore();
  const { raw } = useReporteConcesionados({ desde, hasta, ubicaciones: selectedLocations });
  const rows = useMemo(() => {
    const l = enriquecer(raw, ahora);
    return selectedLocations.length ? l.filter(r => selectedLocations.includes(r.ubicacion)) : l;
  }, [raw, ahora, selectedLocations]);
  const d0 = useMemo(() => (rows.length ? sod(Math.min(...rows.map(r => r.t_ini))) : addDias(sod(ahora), -365)), [rows, ahora]);

  const vista = vistas[tab];
  const p = useMemo(() => periodo(vista, ref, ahora, d0), [vista, ref, ahora, d0]);
  const usa = FILTROS[tab];

  // Al cambiar de pestaña, periodo o vista se limpian los filtros rápidos
  useEffect(() => setQuick([]), [tab, vista, ref]);

  const filtrar = (omit?: FKey) => rows.filter(r =>
    usa.every(k => k === omit || k === "guardia" || !f[k].length || FDEF[k].campo(r).some(v => f[k].includes(v))));

  const multi = useMemo(() => (selectedLocations.length ? selectedLocations : uniq(rows.map(r => r.ubicacion))).length > 1, [rows, selectedLocations]);
  const { base, c } = useMemo(() => {
    const base = rows.filter(r => usa.every(k => k === "guardia" || !f[k].length || FDEF[k].campo(r).some(v => f[k].includes(v))));
    return { base, c: corte(base, p, usa.includes("guardia") ? f.guardia : []) };
  }, [rows, usa, f, p]);

  const R: Calc = useMemo(() => {
    switch (tab) {
      case "resumen": return resumen(c, multi);
      case "guardias": return guardias(c, f.guardia, multi);
      case "solicitantes": return solicitantes(c, agrupar === "empresa", multi);
      case "articulos": return articulos(c, f.categoria);
      case "forzadas": {
        const g = f.guardia;
        return forzadas(c, base.filter(r => !g.length || g.includes(r.guardia_presto) || g.includes(r.guardia_cierre)), quick.filter(k => QUICK.forzadas.includes(k)), d0, multi);
      }
      case "economico": return economico(c, multi);
    }
  }, [base, c, multi, f, tab, agrupar, quick, d0]);

  // Panel de detalle: se recalcula con el periodo y los filtros actuales (lib/paneles.ts)
  const [panel, setPanel] = useState<PanelSel | null>(null);
  // El panel de cierres forzados cuenta solo los que pasan los filtros de estatus, como las gráficas
  const actForz = useMemo(() => (tab === "forzadas" ? quick.filter(k => QUICK.forzadas.includes(k)) : []), [tab, quick]);
  const spec = useMemo(() => (panel ? panelSpec(panel, c, multi, actForz) : null), [panel, c, multi, actForz]);
  useEffect(() => setPanel(null), [tab]);

  // Opciones de cada filtro: lo que hubo en el periodo con los demás filtros aplicados
  const opciones = (k: FKey) => {
    const c = corte(filtrar(k), p);
    return uniq([...c.hechos, ...c.cerrados].flatMap(FDEF[k].campo).concat(f[k])).filter(Boolean).sort((a, b) => a.localeCompare(b));
  };

  const keys = QUICK[tab];
  const act = quick.filter(k => keys.includes(k));
  const toggleQuick = (k: string) => setQuick(q => (q.includes(k) ? q.filter(x => x !== k) : [...q, k]));
  // Botones de estatus (QuickFilters de shared). Sin datos todavía se muestran todos en 0.
  const pills: QuickPill[] = keys.map(k => ({ key: k, label: SER[k][0], count: R.qn[k] ?? 0, icon: <QuickIcon k={k} /> }));
  const activos = usa.reduce((a, k) => a + f[k].length, 0);
  const clearAll = () => { setF(F0); setQuick([]); };

  // En Cierres forzados los filtros rápidos ya filtran los datos (lib/tabs.ts)
  const tablas = useMemo(() => (tab === "forzadas" ? R.tab : R.tab.map(t => filtrarTabla(t, act, keys))), [R, act, keys, tab]);
  const tAct = tablas.find(t => t.id === tablaSel[tab]) ?? tablas[0];
  const tabNombre = TABS.find(t => t.value === tab)?.label ?? "";

  const setVista = (v: Vista) => { setVistas(s => ({ ...s, [tab]: v })); setRef(sod(ahora)); };
  const navView = (["dia", "semana", "mes"] as Vista[]).includes(vista) ? (vista as "dia" | "semana" | "mes") : null;

  const graficas = modo === "graficas";
  const showPanel = wide ? panelOpen : narrowOpen;
  const cerrarPanel = () => (wide ? setPanelOpen(false) : setNarrowOpen(false));

  const filterPanel = (
    <aside aria-label="Filtros" className={`flex w-[280px] flex-none flex-col bg-c10-surface px-[18px] pb-[18px] pt-4 shadow-[0_1px_2px_rgba(15,23,42,.04),0_6px_20px_rgba(15,23,42,.04)] ${wide ? "sticky top-[84px] max-h-[calc(100vh-100px)] overflow-y-auto rounded-2xl" : "fixed bottom-0 left-0 top-0 z-[58] overflow-y-auto"}`}>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2">
          <button type="button" title="Ocultar filtros" aria-label="Ocultar filtros" onClick={cerrarPanel} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-c10-sunken text-c10-secondary transition-colors hover:bg-c10-blue-light hover:text-button-primary">
            <ChevronLeft size={16} />
          </button>
          <b className="text-base font-semibold text-c10-title">Filtros</b>
          {activos > 0 && <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-button-primary px-[5px] text-[11px] font-bold text-white">{activos}</span>}
        </span>
        <button type="button" onClick={clearAll} className="h-7 rounded-md px-2 text-sm font-semibold text-button-primary hover:bg-c10-blue-subtle">Limpiar</button>
      </div>
      <div className="mt-3" />
      {graficas && (
        <>
          <Seccion titulo="Periodo">
            <div role="group" aria-label="Periodo" className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${VISTAS[tab].length === 4 ? 2 : VISTAS[tab].length}, minmax(0, 1fr))` }}>
              {VISTAS[tab].map(v => {
                const on = vista === v;
                return (
                  <button key={v} type="button" aria-pressed={on} onClick={() => setVista(v)} className={`h-[30px] min-w-0 whitespace-nowrap rounded-full px-1.5 text-[13px] ${on ? "bg-button-primary font-semibold text-white" : "bg-c10-sunken font-medium text-c10-label hover:bg-c10-line"}`}>
                    {VLBL[v]}
                  </button>
                );
              })}
            </div>
          </Seccion>
          {navView && (
            <Seccion titulo="Fecha">
              <FechaPicker view={navView} date={new Date(ref)} label={p.label} onPick={d => setRef(Math.min(sod(ahora), sod(d.getTime())))} />
            </Seccion>
          )}
          {tab === "solicitantes" && (
            <Seccion titulo="Ver por">
              <div role="group" aria-label="Ver por" className="grid grid-cols-2 gap-1.5">
                {([["persona", "Persona"], ["empresa", "Empresa"]] as const).map(([v, l]) => (
                  <button key={v} type="button" aria-pressed={agrupar === v} onClick={() => setAgrupar(v)} className={`h-8 rounded-full px-2.5 text-[13px] ${agrupar === v ? "bg-button-primary font-semibold text-white" : "bg-c10-sunken font-medium text-c10-label hover:bg-c10-line"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </Seccion>
          )}
          {(!rows.length || keys.some(k => (R.qn[k] ?? 0) > 0 || act.includes(k))) && (
            <Seccion titulo="Estatus" cnt={act.length}>
              <QuickFilters pills={pills} active={act} onToggle={toggleQuick} todos={!rows.length} />
            </Seccion>
          )}
        </>
      )}
      {usa.map(k => (
        // MultiCombo ya pinta su título, así que aquí solo va el separador de sección
        <div key={k} className="border-t border-c10-sunken py-3.5">
          <MultiCombo label={FDEF[k].t} placeholder={FDEF[k].ph} options={opciones(k)} value={f[k]} onChange={v => setF(s => ({ ...s, [k]: v }))} />
        </div>
      ))}
    </aside>
  );

  const toolbar = (
    <>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {navView ? (
          <PeriodNav
            view={navView}
            date={new Date(ref)}
            label={p.label}
            isCurrent={p.end >= ahora}
            onPrev={() => setRef(r => Math.max(d0, paso(vista, r, -1)))}
            onNext={() => setRef(r => Math.min(sod(ahora), paso(vista, r, 1)))}
            onToday={() => setRef(sod(ahora))}
            onPick={d => setRef(Math.min(sod(ahora), sod(d.getTime())))}
          />
        ) : (
          <strong className="px-1 text-xl font-semibold leading-10 tracking-[-.02em] text-c10-title">{p.label}</strong>
        )}
        <button
          type="button"
          title="Descargar Excel"
          aria-label="Descargar Excel"
          onClick={() => descargarExcel(tablas, `Reporte de artículos concesionados - ${tabNombre} - ${p.label}`)}
          className="ml-auto inline-flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-green-600 text-white transition-colors hover:bg-green-700"
        >
          <FileDown size={18} />
        </button>
        <SegTabs<Vista> label="Periodo" variant="outline" value={vista} onChange={setVista} options={VISTAS[tab].map(v => ({ value: v, label: VLBL[v] }))} />
      </div>
      <QuickFilters pills={pills} active={act} onToggle={toggleQuick} todos={!rows.length} />
    </>
  );

  return (
    <div className="flex min-h-[calc(100vh-64px)] w-full flex-col gap-4 bg-c10-canvas px-6 pb-24 pt-6 text-sm text-c10-text max-md:px-4">
      {/* Cabecera */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-none items-center gap-2.5">
          <h1 className="m-0 whitespace-nowrap text-2xl font-semibold tracking-[-.02em] text-c10-title">Reporte de artículos concesionados</h1>
          <KpiChip>{n(R.total)} préstamos</KpiChip>
        </div>
        <span className="flex-auto" />
        {!wide && (
          <button
            type="button"
            title="Filtros"
            aria-label="Filtros"
            onClick={() => setNarrowOpen(true)}
            className={`relative inline-flex h-10 w-10 items-center justify-center rounded-lg border transition-colors hover:border-button-primary hover:text-button-primary ${activos ? "border-button-primary bg-c10-blue-subtle text-button-primary" : "border-c10-line bg-c10-surface text-c10-meta"}`}
          >
            <SlidersHorizontal size={16} />
            {activos > 0 && <span className="absolute -right-1.5 -top-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-button-primary px-1 text-[11px] font-semibold text-white">{activos}</span>}
          </button>
        )}
        <div className="max-w-full overflow-x-auto">
          <SegTabs<Tab> label="Secciones del reporte" value={tab} onChange={t => { setTab(t); if (t === "economico") setEcoOpen(true); }} options={TABS} />
        </div>
        <div role="group" aria-label="Tipo de vista" className="inline-flex h-10 flex-none overflow-hidden rounded-lg border border-c10-line bg-c10-surface">
          {([["graficas", "Vista gráfica", <BarChart3 key="g" size={18} />], ["tablas", "Vista de tabla", <Table2 key="t" size={18} />]] as [Modo, string, React.ReactNode][]).map(([m, l, ic]) => (
            <button
              key={m}
              type="button"
              title={l}
              aria-label={l}
              aria-pressed={modo === m}
              onClick={() => setModo(m)}
              className={`inline-flex w-[42px] items-center justify-center border-l border-c10-line transition-colors first:border-l-0 ${modo === m ? "bg-button-primary text-white" : "text-c10-secondary hover:bg-c10-sunken"}`}
            >
              {ic}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-4">
        {showPanel && !wide && <div className="fixed inset-0 z-[57] bg-white/70" onClick={() => setNarrowOpen(false)} />}
        {showPanel && filterPanel}
        {wide && !panelOpen && (
          <button
            type="button"
            title="Mostrar filtros"
            aria-label="Mostrar filtros"
            onClick={() => setPanelOpen(true)}
            className="fixed left-0 top-1/2 z-40 inline-flex h-[52px] w-[38px] -translate-y-1/2 items-center justify-center rounded-r-full bg-button-primary text-white shadow-[0_4px_12px_rgba(47,128,237,.3)] hover:bg-button-primary-hover"
          >
            <SlidersHorizontal size={18} />
            {activos > 0 && <span className="absolute -right-1.5 -top-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-semibold text-white">{activos}</span>}
          </button>
        )}

        <main className="flex min-w-0 flex-1 flex-col gap-4">
          {graficas ? (
            R.graf.map(cd => <ChartCard key={cd.title} card={cd} act={act} quick={keys} onSelect={(sel, serie) => setPanel({ sel, serie })} />)
          ) : (
            <ReportTable
              tablas={tablas}
              activa={tAct}
              onActiva={id => setTablaSel(s => ({ ...s, [tab]: id }))}
              toolbar={toolbar}
              resetKey={`${tab}|${p.ini}|${vista}|${act.join()}|${JSON.stringify(f)}`}
            />
          )}
        </main>
        {spec && <DetallePanel spec={spec} onClose={() => setPanel(null)} />}
        {graficas && R.eco && (ecoOpen ? <EcoPanel eco={R.eco} label={p.label} onClose={() => setEcoOpen(false)} /> : <EcoRail onOpen={() => setEcoOpen(true)} />)}
      </div>
    </div>
  );
};

export default ReporteConcesionadosPage;
