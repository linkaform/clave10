"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, ChartColumn, ChevronLeft, Info, LayoutDashboard, LayoutGrid, RotateCw, Search, SlidersHorizontal, Table2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DisplayMode, MODE_PERIODS, useAsistenciasView } from "@/hooks/asistencias/useAsistenciasView";
import { GroupingMode } from "../types/attendance";
import { EMPLOYEE_QUICK, PLAZA_QUICK, PlazaStatusIcon, SHIFT_QUICK, ShiftStatusIcon, StatusIcon } from "../components/attendanceStatus";
import { AttendanceDayDrawer, DaySelection } from "../components/AttendanceDayDrawer";
import { ShiftDrawer } from "../components/ShiftDrawer";
import { PlazasDrawer } from "../components/PlazasDrawer";
import { CovFilter, CoverageFilters, CoverageView, coverageLocations } from "../components/asistencia/CoverageView";
import { usePlantilla } from "../hooks/useAsistenciasReport";
import { ReportSkeleton } from "../components/ReportSkeleton";
import { EmployeeDayCalendar, EmployeeDayTable, EmployeePeriodGrid, EmployeePeriodTable, matchQuick } from "../components/asistencia/EmployeeViews";
import { LocationDayCalendar, LocationDayTable, LocationPeriodGrid, LocationPeriodTable, matchShift, shiftQuickKey } from "../components/asistencia/LocationViews";
import { GalleryView } from "../components/asistencia/GalleryView";
import { EmployeeCharts, LocationCharts } from "../components/asistencia/Charts";
import { KpiChip, MultiCombo, PeriodNav, QuickFilters, QuickPill, SegTabs, matches } from "../components/asistencia/ui";
import { EmployeeLocationRow, jornadaLabel, mergeEmployees } from "./lib/employees";
import { ShiftRow, ShiftSelection, filterShifts } from "./lib/shifts";
import { MESES, PERIOD_VIEWS, PeriodView, periodRange, toISO } from "./lib/period";
import { employeeMetrics } from "./lib/metrics";
import { PlazasSelection, plantillaTurnoLabel, plazaQuickKey, resumenPlazas, turnoActual, turnoKey } from "./lib/plantilla";

const MODES: { mode: DisplayMode; label: string; icon: React.ReactNode }[] = [
  { mode: "cov", label: "Vista de cobertura", icon: <LayoutDashboard size={16} aria-hidden="true" /> },
  { mode: "cal", label: "Vista de calendario", icon: <CalendarDays size={16} aria-hidden="true" /> },
  { mode: "gallery", label: "Vista de galería", icon: <LayoutGrid size={16} aria-hidden="true" /> },
  { mode: "table", label: "Vista de tabla", icon: <Table2 size={16} aria-hidden="true" /> },
  { mode: "charts", label: "Vista de gráficas", icon: <ChartColumn size={16} aria-hidden="true" /> },
];

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

// Ancho de pantalla: debajo de 1100 px el panel de filtros se vuelve botón
const useWide = () => {
  const [wide, setWide] = useState(true);
  useEffect(() => {
    const q = window.matchMedia("(min-width: 1100px)");
    const up = () => setWide(q.matches);
    up();
    q.addEventListener("change", up);
    return () => q.removeEventListener("change", up);
  }, []);
  return wide;
};

const ReportPage = () => {
  const v = useAsistenciasView();
  const { groupingMode, period, date, days, displayMode, search, setSearch, reportAsistencias, isLoading } = v;
  const isEmployees = groupingMode === "employees";
  const wide = useWide();

  const [daySelection, setDaySelection] = useState<DaySelection | null>(null);
  const [shiftSelection, setShiftSelection] = useState<ShiftSelection | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [narrowOpen, setNarrowOpen] = useState(false);
  const [fEmp, setFEmp] = useState<string[]>([]);
  const [fDep, setFDep] = useState<string[]>([]);
  const [fJor, setFJor] = useState<string[]>([]);
  const [fGua, setFGua] = useState<string[]>([]);
  const [fCas, setFCas] = useState<string[]>([]);
  const [quick, setQuick] = useState<string[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [toastOpen, setToastOpen] = useState(true);
  const [covTurno, setCovTurno] = useState<string>();
  const [covFilter, setCovFilter] = useState<CovFilter>("all");
  const [plazasSel, setPlazasSel] = useState<PlazasSelection | null>(null);

  const openDay = useCallback((employee: DaySelection["employee"], fecha: string) => setDaySelection({ employee, fecha }), []);
  const closeDay = useCallback(() => setDaySelection(null), []);
  const closeShift = useCallback(() => setShiftSelection(null), []);
  const closePlazas = useCallback(() => setPlazasSel(null), []);

  // Al cambiar de periodo se limpian los filtros rápidos y la selección
  useEffect(() => {
    setQuick([]);
    setSelected([]);
    setToastOpen(true);
  }, [period, v.from]);

  const fechas = useMemo(() => days.map(toISO), [days]);
  const fecha = toISO(date);
  const isDay = period === "dia";
  const mode = displayMode;
  const isCov = mode === "cov";

  // ───── Empleados ─────
  const allEmployees = useMemo(
    () => (isEmployees ? mergeEmployees(reportAsistencias as EmployeeLocationRow[]) : []),
    [isEmployees, reportAsistencias]
  );
  const baseEmployees = useMemo(() => allEmployees.filter(e =>
    matches(e.nombre, search) &&
    (!fEmp.length || fEmp.includes(e.nombre)) &&
    (!fDep.length || fDep.includes(e.departamento)) &&
    (!fJor.length || fJor.includes(jornadaLabel(e.jornada)))
  ), [allEmployees, search, fEmp, fDep, fJor]);
  // En tabla los filtros rápidos quitan filas; en calendario y gráficas solo atenúan o filtran series
  const employees = useMemo(() => {
    if (!quick.length || mode !== "table") return baseEmployees;
    return baseEmployees.filter(e => isDay ? matchQuick(quick, e.dias[fecha]?.status) : fechas.some(f => e.dias[f] && matchQuick(quick, e.dias[f].status)));
  }, [baseEmployees, quick, mode, isDay, fecha, fechas]);
  const metrics = useMemo(() => {
    const now = new Date();
    return new Map(employees.map(e => [e.employee_id, employeeMetrics(e, fechas, now)]));
  }, [employees, fechas]);

  // ───── Ubicaciones ─────
  const allShifts = useMemo(() => (isEmployees ? [] : (reportAsistencias as ShiftRow[])), [isEmployees, reportAsistencias]);
  const baseShifts = useMemo(() => filterShifts(allShifts, search).filter(r =>
    (!fCas.length || fCas.includes(`${r.ubicacion} · ${r.caseta}`)) &&
    (!fGua.length || r.dias.some(d => d.guardias.some(g => fGua.includes(g.nombre))))
  ), [allShifts, search, fCas, fGua]);
  const shifts = useMemo(() => {
    if (!quick.length || mode !== "table") return baseShifts;
    return baseShifts.filter(r => isDay ? matchShift(quick, r.dias.find(d => d.fecha === fecha)) : r.dias.some(d => fechas.includes(d.fecha) && matchShift(quick, d)));
  }, [baseShifts, quick, mode, isDay, fecha, fechas]);

  // ───── Cobertura (plantilla por caseta, solo Ubicaciones · Día) ─────
  const { plantilla, isLoadingPlantilla, isFetchingPlantilla, errorPlantilla, refetchPlantilla } = usePlantilla({
    enabled: !isEmployees && isCov,
    dateFrom: fecha,
    dateTo: fecha,
  });
  const covTurnos = useMemo(
    () => Array.from(new Map(plantilla.map(r => [turnoKey(r), r])).values()).sort((a, b) => a.hora_entrada.localeCompare(b.hora_entrada) || a.horario.localeCompare(b.horario)),
    [plantilla]
  );
  const covTurnoRow = covTurnos.find(t => turnoKey(t) === covTurno) ?? turnoActual(plantilla);
  const covKey = covTurnoRow ? turnoKey(covTurnoRow) : undefined;
  const covAll = useMemo(() => {
    const rows = plantilla.filter(r =>
      (!fCas.length || fCas.includes(`${r.ubicacion} · ${r.caseta}`)) &&
      (matches(`${r.ubicacion} ${r.caseta}`, search) || r.dias.some(d => d.plazas.some(p => matches(p.guardia, search))))
    );
    return coverageLocations(rows, covKey, fecha);
  }, [plantilla, fCas, search, covKey, fecha]);
  // Con filtro rápido solo quedan las ubicaciones con alguna plaza en ese estatus
  const covVisible = useMemo(() => covAll.filter(l => !quick.length || l.plazas.some(p => quick.includes(plazaQuickKey(p)))), [covAll, quick]);
  const covCounts = {
    all: covVisible.length,
    f: covVisible.filter(l => resumenPlazas(l.plazas).sinEntrada > 0).length,
    ok: covVisible.filter(l => resumenPlazas(l.plazas).sinEntrada === 0).length,
  };
  const covShown = covVisible.filter(l => covFilter === "all" || (covFilter === "f") === resumenPlazas(l.plazas).sinEntrada > 0);
  const covTotal = resumenPlazas(covAll.flatMap(l => l.plazas));

  // ───── Filtros rápidos con conteo ─────
  const pills: QuickPill[] = useMemo(() => {
    const isToday = fecha === toISO(new Date());
    if (!isEmployees && isCov) {
      const keys = covAll.flatMap(l => l.plazas.map(plazaQuickKey));
      return PLAZA_QUICK.map(q => ({
        key: q.key,
        label: q.label,
        count: keys.filter(k => k === q.key).length,
        icon: <PlazaStatusIcon status={q.key} size={18} />,
      }));
    }
    if (isEmployees) {
      const statuses = baseEmployees.flatMap(e => (isDay ? [e.dias[fecha]?.status] : fechas.map(f => e.dias[f]?.status)));
      return EMPLOYEE_QUICK.filter(q => q.key !== "por_llegar" || (isDay && isToday)).map(q => ({
        key: q.key,
        label: q.label,
        count: statuses.filter(s => s && q.match.includes(s)).length,
        icon: <StatusIcon status={q.status} size={18} />,
      }));
    }
    const keys = baseShifts.flatMap(r => r.dias.filter(d => (isDay ? d.fecha === fecha : fechas.includes(d.fecha))).map(shiftQuickKey));
    return SHIFT_QUICK.filter(q => q.key !== "por_abrir" || (isDay && isToday)).map(q => ({
      key: q.key,
      label: q.label,
      count: keys.filter(k => k === q.key).length,
      icon: <ShiftStatusIcon status={q.status} size={18} />,
    }));
  }, [isEmployees, isCov, covAll, baseEmployees, baseShifts, isDay, fecha, fechas]);

  // ───── Opciones de los filtros del panel ─────
  const opts = useMemo(() => ({
    emp: allEmployees.map(e => e.nombre),
    dep: Array.from(new Set(allEmployees.map(e => e.departamento).filter(Boolean))).sort(),
    jor: Array.from(new Set(allEmployees.map(e => jornadaLabel(e.jornada)).filter(Boolean))).sort(),
    gua: Array.from(new Set(allShifts.flatMap(r => r.dias.flatMap(d => d.guardias.map(g => g.nombre))))).sort(),
    cas: Array.from(new Set(allShifts.map(r => `${r.ubicacion} · ${r.caseta}`))).sort(),
  }), [allEmployees, allShifts]);

  const activeFilters = isEmployees ? fEmp.length + fDep.length + fJor.length : fGua.length + fCas.length;
  const clearFilters = () => {
    setFEmp([]); setFDep([]); setFJor([]); setFGua([]); setFCas([]); setQuick([]); setCovFilter("all");
  };

  const changeGrouping = (g: GroupingMode) => {
    if (g === groupingMode) return;
    v.setGroupingMode(g);
    // Cobertura solo existe agrupando por Ubicaciones
    if (g === "employees" && isCov) v.setDisplayMode("cal");
    setSearch("");
    clearFilters();
    setSelected([]);
  };
  const selectEmployee = (nombre: string) => {
    setFEmp([nombre]);
    v.setDisplayMode("cal");
  };

  const casetas = new Set(shifts.map(s => `${s.ubicacion}|${s.caseta}`)).size;
  const loading = isCov ? isLoadingPlantilla : isLoading;
  const showKpi = !loading && mode !== "cal" && mode !== "gallery";
  const showPanel = wide ? panelOpen : narrowOpen;
  const quincena = period === "quincena";
  const resetKey = `${v.from}|${groupingMode}|${quick.join()}|${search}|${activeFilters}`;

  // ───── Contenido ─────
  const renderView = () => {
    if (mode === "gallery") return <div className="p-3"><GalleryView dateFrom={v.from} dateTo={v.to} search={search} locations={!isEmployees} /></div>;
    if (isCov) {
      if (isLoadingPlantilla) return <div className="p-3"><ReportSkeleton variant="cards" /></div>;
      if (errorPlantilla) {
        return (
          <div className="p-8 text-center">
            <p className="mb-2 text-red-600">Error al cargar la plantilla</p>
            <Button onClick={() => refetchPlantilla()}>Reintentar</Button>
          </div>
        );
      }
      if (!plantilla.length) {
        return <div className="p-8 text-center text-c10-meta">No hay plantilla configurada. Agrega caseta, rol y guardia a los horarios en la forma Horarios.</div>;
      }
      return <CoverageView locations={covShown} fecha={fecha} turnoLabel={covTurnoRow ? plantillaTurnoLabel(covTurnoRow) : undefined} quick={quick} onOpen={setPlazasSel} />;
    }
    if (isLoading) {
      if (mode === "table") return <div className="p-3"><ReportSkeleton variant="table" /></div>;
      return <div className="p-3">{isDay ? <ReportSkeleton variant="cards" /> : <ReportSkeleton variant="grid" columns={Math.min(days.length, 31)} />}</div>;
    }
    if (v.errorReportAsistencias) {
      return (
        <div className="p-8 text-center">
          <p className="mb-2 text-red-600">Error al cargar los datos</p>
          <Button onClick={() => v.refetchReportAsistencias()}>Reintentar</Button>
        </div>
      );
    }
    const sel = { ids: selected, set: setSelected };
    if (isEmployees) {
      if (mode === "charts") return <div className="p-4"><EmployeeCharts employees={employees} days={days} quick={quick} onSelectEmployee={selectEmployee} /></div>;
      if (mode === "table") {
        return isDay
          ? <EmployeeDayTable employees={employees} date={date} sel={sel} onOpenDay={openDay} />
          : <EmployeePeriodTable employees={employees} metrics={metrics} quincena={quincena} sel={sel} resetKey={resetKey} onSelectEmployee={selectEmployee} />;
      }
      return isDay
        ? <EmployeeDayCalendar employees={employees} date={date} quick={quick} onOpenDay={openDay} />
        : <EmployeePeriodGrid employees={employees} days={days} quick={quick} metrics={metrics} onOpenDay={openDay} />;
    }
    if (mode === "charts") return <div className="p-4"><LocationCharts rows={shifts} days={days} quick={quick} /></div>;
    if (mode === "table") {
      return isDay
        ? <LocationDayTable rows={shifts} date={date} onOpenShift={setShiftSelection} />
        : <LocationPeriodTable rows={shifts} resetKey={resetKey} />;
    }
    return isDay
      ? <LocationDayCalendar rows={shifts} date={date} quick={quick} onOpenShift={setShiftSelection} />
      : <LocationPeriodGrid rows={shifts} days={days} quick={quick} onOpenShift={setShiftSelection} />;
  };

  // Resumen de la quincena (Empleados)
  const [qFrom, qTo] = periodRange(period, date);
  const quincenaToast = isEmployees && quincena && !isLoading && mode !== "gallery" && mode !== "charts" && toastOpen && employees.length > 0;
  const porRevisar = Array.from(metrics.values()).filter(m => m.revisar).length;
  const sinSalida = employees.reduce((n, e) => n + fechas.filter(f => e.dias[f]?.status === "sin_salida").length, 0);
  const enCurso = qTo >= new Date(new Date().toDateString());

  const filterPanel = (
    <aside aria-label="Filtros" className={`flex w-[280px] flex-none flex-col gap-4 rounded-2xl bg-c10-surface p-4 shadow-[0_1px_2px_rgba(15,23,42,.04),0_6px_20px_rgba(15,23,42,.04)] ${wide ? "sticky top-[84px]" : "fixed bottom-0 left-0 top-0 z-[58] overflow-auto rounded-none"}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <button type="button" title="Ocultar filtros" aria-label="Ocultar filtros" onClick={() => (wide ? setPanelOpen(false) : setNarrowOpen(false))} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-c10-sunken text-c10-secondary hover:bg-c10-blue-light hover:text-button-primary">
            <ChevronLeft size={16} />
          </button>
          <b className="text-base font-semibold text-c10-title">Filtros</b>
          {activeFilters > 0 && <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-button-primary px-1 text-[11px] font-semibold text-white">{activeFilters}</span>}
        </span>
        <button type="button" onClick={clearFilters} className="text-sm font-semibold text-button-primary hover:underline">Limpiar</button>
      </div>
      {!isEmployees && isCov ? (
        <CoverageFilters turnos={covTurnos} turno={covKey} onTurno={setCovTurno} filter={covFilter} onFilter={setCovFilter} counts={covCounts} />
      ) : isEmployees ? (
        <>
          <MultiCombo label="Empleado" placeholder="Buscar empleado" options={opts.emp} value={fEmp} onChange={setFEmp} />
          <div className="border-t border-c10-sunken" />
          <MultiCombo label="Departamento" placeholder="Buscar departamento" options={opts.dep} value={fDep} onChange={setFDep} />
          <div className="border-t border-c10-sunken" />
          <MultiCombo label="Jornada" placeholder="Buscar jornada" options={opts.jor} value={fJor} onChange={setFJor} />
        </>
      ) : (
        <>
          <MultiCombo label="Guardia" placeholder="Buscar guardia" options={opts.gua} value={fGua} onChange={setFGua} />
          <div className="border-t border-c10-sunken" />
          <MultiCombo label="Caseta" placeholder="Buscar caseta" options={opts.cas} value={fCas} onChange={setFCas} />
        </>
      )}
    </aside>
  );

  return (
    <div className="flex min-h-[calc(100vh-64px)] w-full flex-col gap-4 bg-c10-canvas px-6 pb-12 pt-5 text-sm text-c10-text max-md:px-4">
      {/* Cabecera de sección */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h1 className="m-0 text-2xl font-semibold tracking-[-.02em] text-c10-title">Reporte de asistencia</h1>
          {showKpi && <KpiChip>{isEmployees ? plural(employees.length, "empleado", "empleados") : isCov ? plural(covShown.length, "ubicación", "ubicaciones") : plural(casetas, "caseta", "casetas")}</KpiChip>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!wide && (
            <button
              type="button"
              title="Filtros"
              aria-label="Filtros"
              onClick={() => setNarrowOpen(true)}
              className={`relative inline-flex h-10 w-10 items-center justify-center rounded-lg border transition-colors hover:border-button-primary hover:text-button-primary ${activeFilters ? "border-button-primary bg-c10-blue-subtle text-button-primary" : "border-c10-line bg-c10-surface text-c10-meta"}`}
            >
              <SlidersHorizontal size={16} />
              {activeFilters > 0 && <span className="absolute -right-1.5 -top-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-button-primary px-1 text-[11px] font-semibold text-white">{activeFilters}</span>}
            </button>
          )}
          <label className="flex h-10 w-[260px] items-center gap-2 rounded-lg border border-c10-line bg-c10-surface px-3 transition-colors focus-within:border-button-primary focus-within:shadow-[0_0_0_3px_rgba(59,130,246,.15)] max-md:w-full">
            <Search size={16} className="flex-none text-c10-faint" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={isEmployees ? "Buscar empleado" : "Buscar caseta o guardia"}
              aria-label={isEmployees ? "Buscar empleado" : "Buscar caseta o guardia"}
              className="w-full border-none bg-transparent text-sm text-c10-title outline-none placeholder:text-c10-faint"
            />
          </label>
          <SegTabs<GroupingMode>
            label="Agrupar por"
            value={groupingMode}
            onChange={changeGrouping}
            options={[{ value: "employees", label: "Empleados" }, { value: "locations", label: "Ubicaciones" }]}
          />
          <div role="tablist" aria-label="Modo de vista" className="inline-flex h-10 overflow-hidden rounded-lg border border-c10-line bg-c10-surface">
            {MODES.map(m => {
              const on = mode === m.mode;
              const disabled = m.mode === "cov" && isEmployees;
              return (
                <button
                  key={m.mode}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  aria-label={m.label}
                  title={disabled ? `${m.label} · solo en Ubicaciones` : m.label}
                  disabled={disabled}
                  onClick={() => v.setDisplayMode(m.mode)}
                  className={`inline-flex h-full w-10 items-center justify-center border-l border-c10-line transition-colors first:border-l-0 disabled:cursor-not-allowed disabled:opacity-40 ${on ? "bg-button-primary text-white" : "text-c10-secondary hover:bg-c10-sunken hover:text-button-primary"}`}
                >
                  {m.icon}
                </button>
              );
            })}
          </div>
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
            {activeFilters > 0 && <span className="absolute -right-1.5 -top-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-semibold text-white">{activeFilters}</span>}
          </button>
        )}

        <section className="flex min-w-0 flex-1 flex-col rounded-2xl bg-c10-surface shadow-[0_1px_2px_rgba(15,23,42,.04),0_6px_20px_rgba(15,23,42,.04)]">
          <div className="flex flex-col gap-3 border-b border-c10-line p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <PeriodNav
                view={period}
                date={date}
                label={v.label}
                isCurrent={v.isCurrent}
                onPrev={v.goPrev}
                onNext={v.goNext}
                onToday={v.goToday}
                onPick={v.setDate}
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  title="Recargar"
                  aria-label="Recargar"
                  onClick={() => (isCov ? refetchPlantilla() : v.refetchReportAsistencias())}
                  disabled={(isCov ? isFetchingPlantilla : v.isFetching) || mode === "gallery"}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-c10-sunken text-c10-secondary transition-colors hover:bg-c10-blue-light hover:text-button-primary disabled:opacity-40"
                >
                  <RotateCw size={16} className={(isCov ? isFetchingPlantilla : v.isFetching) ? "animate-spin" : ""} />
                </button>
                <SegTabs<PeriodView>
                  label="Periodo"
                  variant="outline"
                  value={period}
                  onChange={v.setPeriod}
                  options={PERIOD_VIEWS.filter(p => MODE_PERIODS[mode].includes(p.value))}
                />
              </div>
            </div>
            {mode !== "gallery" && !loading && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <QuickFilters
                  pills={pills}
                  active={quick}
                  onToggle={k => setQuick(q => (q.includes(k) ? q.filter(x => x !== k) : [...q, k]))}
                />
                {isCov && covTotal.total > 0 && (
                  <span className="ml-auto text-[13px] text-c10-secondary">
                    <b className="text-lg font-bold tabular-nums tracking-[-.01em] text-c10-title">{covTotal.entradas} de {covTotal.total}</b> plazas cubiertas
                  </span>
                )}
              </div>
            )}
          </div>
          {renderView()}
        </section>

        {isEmployees && mode === "table" && (
          <button
            type="button"
            disabled
            title="Reglas de Jornada · Pendiente"
            className="sticky top-[84px] flex h-40 w-9 flex-none cursor-not-allowed items-center justify-center rounded-xl bg-c10-surface text-[11px] font-semibold uppercase tracking-[.08em] text-c10-meta opacity-60 shadow-[0_0_0_1px_var(--c10-line)] [writing-mode:vertical-rl] max-md:hidden"
          >
            Reglas de Jornada
          </button>
        )}
      </div>

      {/* Barra de selección (tabla) */}
      {mode === "table" && isEmployees && selected.length > 0 && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 flex-wrap items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm text-white shadow-[0_12px_32px_rgba(15,23,42,.16)]">
          <b className="mr-2 tabular-nums">{plural(selected.length, "seleccionado", "seleccionados")}</b>
          <button type="button" disabled title="Pendiente" className="h-9 cursor-not-allowed rounded-lg bg-white/10 px-3 font-semibold opacity-60">Descargar Registros</button>
          {quincena && <button type="button" disabled title="Pendiente" className="h-9 cursor-not-allowed rounded-lg bg-white/10 px-3 font-semibold opacity-60">Exportar Nómina</button>}
          {quincena && <button type="button" disabled title="Pendiente" className="h-9 cursor-not-allowed rounded-lg bg-button-primary px-3 font-semibold opacity-60">Cerrar Quincena</button>}
          <button type="button" aria-label="Quitar selección" title="Quitar selección" onClick={() => setSelected([])} className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10"><X size={16} /></button>
        </div>
      )}

      {quincenaToast && !(mode === "table" && selected.length > 0) && (
        <div role="status" className="fixed bottom-6 right-6 z-50 flex w-[360px] max-w-[calc(100%-48px)] animate-[c10-menu-in_200ms_ease-in-out] items-start gap-3 rounded-xl bg-button-primary p-3.5 text-white shadow-[0_10px_15px_-3px_rgba(15,23,42,.08),0_4px_6px_-4px_rgba(15,23,42,.06)]">
          <Info size={18} className="mt-0.5 flex-none" aria-hidden="true" />
          <div className="flex flex-1 flex-col gap-1 text-[13px]">
            <b className="text-sm">{enCurso ? "Quincena en curso" : "Quincena abierta"}</b>
            <span>Corte de nómina del {qFrom.getDate()} al {qTo.getDate()} de {MESES[qTo.getMonth()]}</span>
            <span>{plural(porRevisar, "empleado", "empleados")} por revisar · {plural(sinSalida, "registro", "registros")} sin salida</span>
          </div>
          <button type="button" aria-label="Cerrar aviso" onClick={() => setToastOpen(false)} className="inline-flex h-6 w-6 flex-none items-center justify-center rounded-full hover:bg-white/15"><X size={14} /></button>
        </div>
      )}

      <AttendanceDayDrawer selection={daySelection} onClose={closeDay} />
      <ShiftDrawer selection={shiftSelection} onClose={closeShift} onOpenPlazas={s => { setShiftSelection(null); setPlazasSel(s); }} />
      <PlazasDrawer selection={plazasSel} onClose={closePlazas} />
    </div>
  );
};

export default ReportPage;
