"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CalendarDays, ChartColumn, ChevronLeft, Info, LayoutDashboard, LayoutGrid, RotateCw, SlidersHorizontal, Table2, X } from "lucide-react";
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
import { GalleryView, galleryToDay } from "../components/asistencia/GalleryView";
import { EmployeeCharts, LocationCharts } from "../components/asistencia/Charts";
import { FacetSearch, SearchCandidate, SearchFacet, SearchFieldConfig } from "@/components/common/FacetSearch";
import { KpiChip, MultiCombo, PanelAnim, PeriodNav, QuickFilters, QuickPill, SegTabs, matches } from "../components/asistencia/ui";
import { EmployeeAttendance, EmployeeLocationRow, jornadaLabel, mergeEmployees } from "./lib/employees";
import { ShiftRow, ShiftSelection } from "./lib/shifts";
import { MESES, PERIOD_VIEWS, PeriodView, fromISO, periodRange, toISO } from "./lib/period";
import { employeeMetrics } from "./lib/metrics";
import { exportNomina, exportRegistros } from "./lib/exportExcel";
import { PlazasSelection, plantillaTurnoLabel, plazaQuickKey, resumenPlazas, turnoActual, turnoKey } from "./lib/plantilla";
import { useSelectedLocationsStore } from "@/store/useSelectedLocationsStore";
import { FechaPicker } from "../components/shared/periodo/FechaPicker";
import { Seccion } from "../components/shared/filtros/Seccion";

const MODES: { mode: DisplayMode; label: string; icon: React.ReactNode }[] = [
  { mode: "cov", label: "Vista de tablero", icon: <LayoutDashboard size={16} aria-hidden="true" /> },
  { mode: "cal", label: "Vista de calendario", icon: <CalendarDays size={16} aria-hidden="true" /> },
  { mode: "gallery", label: "Vista de galería", icon: <LayoutGrid size={16} aria-hidden="true" /> },
  { mode: "table", label: "Vista de tabla", icon: <Table2 size={16} aria-hidden="true" /> },
  { mode: "charts", label: "Vista de gráficas", icon: <ChartColumn size={16} aria-hidden="true" /> },
];

// Estatus de la galería (los calcula el back por registro de check-in)
const GALLERY_QUICK: { key: string; label: string }[] = [
  { key: "presente", label: "Asistencia" },
  { key: "en_turno", label: "En turno" },
  { key: "retardo", label: "Retardo" },
  { key: "sin_salida", label: "Sin salida" },
  { key: "falta", label: "Falta" },
];

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

type FacetKey = "nombre" | "departamento" | "jornada" | "rol" | "guardia" | "caseta";
type FacetValues = Partial<Record<FacetKey, string[]>>;

// Valores de cada campo del buscador por empleado (rol: los de sus check-ins del periodo)
const employeeValues = (e: EmployeeAttendance, fechas: string[]): FacetValues => ({
  nombre: [e.nombre],
  departamento: [e.departamento],
  jornada: [jornadaLabel(e.jornada)],
  rol: Array.from(new Set(fechas.flatMap(f => e.dias[f]?.roles ?? []))),
});
const shiftValues = (r: ShiftRow): FacetValues => ({
  guardia: Array.from(new Set(r.dias.flatMap(d => d.guardias.map(g => g.nombre)))),
  caseta: [`${r.ubicacion} · ${r.caseta}`],
});
// AND entre chips, OR entre valores del mismo chip; exacto = igual, texto = contiene
const passFacets = (vals: FacetValues, facets: SearchFacet[]) =>
  facets.every(f => {
    const have = vals[f.key as FacetKey];
    if (!have) return true;
    return f.values.some(q => have.some(h => (f.exact ? h === q : matches(h, q))));
  });

// Estatus del día que cuentan como "ya entró" y como "se esperaba que viniera"
const PRESENTE = ["presente", "retardo", "en_turno", "sin_salida"];
const ESPERADO = [...PRESENTE, "falta", "por_llegar"];

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
  const { groupingMode, period, date, days, displayMode, reportAsistencias, isLoading } = v;
  const isEmployees = groupingMode === "employees";
  const wide = useWide();

  const [daySelection, setDaySelection] = useState<DaySelection | null>(null);
  const [shiftSelection, setShiftSelection] = useState<ShiftSelection | null>(null);
  // En Calendario y Tabla los filtros arrancan colapsados para dar espacio a la vista
  const [panelOpen, setPanelOpen] = useState(false);
  // Altura del botón flotante de filtros (se puede arrastrar arriba/abajo para que no tape la tabla)
  const [fbY, setFbY] = useState<number | null>(null);
  const fbDrag = useRef<{ y0: number; top0: number; moved: boolean } | null>(null);
  const [narrowOpen, setNarrowOpen] = useState(false);
  // Buscador y panel son el mismo filtro: cada chip exacto es una selección del panel,
  // los chips de texto libre filtran por "contiene"
  const [facets, setFacets] = useState<SearchFacet[]>([]);
  const exact = (key: FacetKey) => facets.find(f => f.key === key && f.exact)?.values ?? [];
  const setExact = (key: FacetKey) => (values: string[]) =>
    setFacets(prev => [...prev.filter(f => !(f.key === key && f.exact)), ...(values.length ? [{ key, values, exact: true }] : [])]);
  const fEmp = exact("nombre"), setFEmp = setExact("nombre");
  const fDep = exact("departamento"), setFDep = setExact("departamento");
  const fJor = exact("jornada"), setFJor = setExact("jornada");
  const fRol = exact("rol"), setFRol = setExact("rol");
  const fGua = exact("guardia"), setFGua = setExact("guardia");
  const fCas = exact("caseta"), setFCas = setExact("caseta");
  // Texto libre (para galería y cobertura, que buscan con un solo texto)
  const search = facets.find(f => !f.exact)?.values[0] ?? "";
  const [quick, setQuick] = useState<string[]>([]);
  // Galería: filtro de estatus propio (sus estatus son por registro, no por día)
  const [galQuick, setGalQuick] = useState<string[]>([]);
  const [galCounts, setGalCounts] = useState<Record<string, number> | null>(null);
  // undefined = el back aún no manda conteos: se conserva lo último para no parpadear
  const onGalCounts = useCallback((c?: Record<string, number>) => { if (c) setGalCounts(c); }, []);
  const [selected, setSelected] = useState<number[]>([]);
  const [toastOpen, setToastOpen] = useState(true);
  const [covTurno, setCovTurno] = useState<string>();
  const [covFilter, setCovFilter] = useState<CovFilter>("all");
  const [plazasSel, setPlazasSel] = useState<PlazasSelection | null>(null);
  // Vista desde la que se abrió un empleado (para el botón Regresar)
  const [prevView, setPrevView] = useState<{ mode: DisplayMode; period: PeriodView; date: Date; fEmp: string[] } | null>(null);
  // Ubicaciones elegidas en el selector del header (vacío = todas)
  const { selectedLocations } = useSelectedLocationsStore();
  const inLoc = useCallback((u?: string) => !selectedLocations.length || (!!u && selectedLocations.includes(u)), [selectedLocations]);

  const openDay = useCallback((employee: DaySelection["employee"], fecha: string) => setDaySelection({ employee, fecha }), []);
  const closeDay = useCallback(() => setDaySelection(null), []);
  const closeShift = useCallback(() => setShiftSelection(null), []);
  const closePlazas = useCallback(() => setPlazasSel(null), []);

  // Al cambiar de vista o agrupación: colapsados en Calendario y Tabla, abiertos en el resto
  useEffect(() => {
    setPanelOpen(!["cal", "table"].includes(displayMode));
  }, [displayMode, groupingMode]);

  // Al cambiar de periodo se limpian los filtros rápidos y la selección
  useEffect(() => {
    setQuick([]);
    setGalQuick([]);
    setSelected([]);
    setToastOpen(true);
  }, [period, v.from]);

  const fechas = useMemo(() => days.map(toISO), [days]);
  const fecha = toISO(date);
  const isDay = period === "dia";
  const mode = displayMode;
  const isCov = mode === "cov";
  // Galería y Gráficas: periodo, fecha y estatus van en el panel y las tarjetas van sin tarjeta blanca alrededor
  const side = mode === "gallery" || mode === "charts";

  // ───── Empleados ─────
  const allEmployees = useMemo(
    () => (isEmployees ? mergeEmployees(reportAsistencias as EmployeeLocationRow[]) : []),
    [isEmployees, reportAsistencias]
  );
  // El registro de la galería no trae departamento, puesto ni jornada: se toman del empleado del reporte
  const withEmployeeData = useCallback((sel: DaySelection): DaySelection => {
    const g = sel.employee;
    const nombre = g.nombre.trim().toLowerCase();
    const e = allEmployees.find(x => x.employee_id === g.employee_id) ?? allEmployees.find(x => x.nombre.trim().toLowerCase() === nombre);
    if (!e) return sel;
    // El estatus del día sale del reporte (el de la galería no distingue retardo en turno abierto)
    const rep = e.dias[sel.fecha];
    const day = g.dias[sel.fecha];
    const dias = rep ? { [sel.fecha]: { ...day, status: rep.status, asueto: rep.asueto, roles: rep.roles } } : g.dias;
    return { ...sel, employee: { ...g, departamento: e.departamento, puesto: e.puesto, jornada: g.jornada ?? e.jornada, dias } };
  }, [allEmployees]);
  const locEmployees = useMemo(() => allEmployees.filter(e => !selectedLocations.length || e.ubicaciones.some(inLoc)), [allEmployees, selectedLocations, inLoc]);
  const baseEmployees = useMemo(() => locEmployees.filter(e => passFacets(employeeValues(e, fechas), facets)), [locEmployees, fechas, facets]);
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
  const locShifts = useMemo(() => allShifts.filter(r => inLoc(r.ubicacion)), [allShifts, inLoc]);
  const baseShifts = useMemo(() => locShifts.filter(r => passFacets(shiftValues(r), facets)), [locShifts, facets]);
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
    () => Array.from(new Map(plantilla.filter(r => !r.sin_plantilla).map(r => [turnoKey(r), r])).values()).sort((a, b) => a.hora_entrada.localeCompare(b.hora_entrada) || a.horario.localeCompare(b.horario)),
    [plantilla]
  );
  const covTurnoRow = covTurnos.find(t => turnoKey(t) === covTurno) ?? turnoActual(plantilla);
  const covKey = covTurnoRow ? turnoKey(covTurnoRow) : undefined;
  const covAll = useMemo(() => {
    const rows = plantilla.filter(r =>
      inLoc(r.ubicacion) &&
      (!fCas.length || fCas.includes(`${r.ubicacion} · ${r.caseta}`)) &&
      (matches(`${r.ubicacion} ${r.caseta}`, search) || r.dias.some(d => d.plazas.some(p => matches(p.guardia, search)) || d.extras.some(e => matches(e.guardia, search))))
    );
    return coverageLocations(rows, covKey, fecha);
  }, [plantilla, inLoc, fCas, search, covKey, fecha]);
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
        icon: <PlazaStatusIcon status={q.key} size={20} />,
      }));
    }
    if (isEmployees) {
      const statuses = baseEmployees.flatMap(e => (isDay ? [e.dias[fecha]?.status] : fechas.map(f => e.dias[f]?.status)));
      return EMPLOYEE_QUICK.filter(q => q.key !== "por_llegar" || (isDay && isToday)).map(q => ({
        key: q.key,
        label: q.label,
        count: statuses.filter(s => s && q.match.includes(s)).length,
        icon: <StatusIcon status={q.status} size={20} />,
      }));
    }
    const keys = baseShifts.flatMap(r => r.dias.filter(d => (isDay ? d.fecha === fecha : fechas.includes(d.fecha))).map(shiftQuickKey));
    return SHIFT_QUICK.filter(q => q.key !== "por_abrir" || (isDay && isToday)).map(q => ({
      key: q.key,
      label: q.label,
      count: keys.filter(k => k === q.key).length,
      icon: <ShiftStatusIcon status={q.status} size={20} />,
    }));
  }, [isEmployees, isCov, covAll, baseEmployees, baseShifts, isDay, fecha, fechas]);

  // ───── Opciones de los filtros del panel (solo de las ubicaciones elegidas) ─────
  const opts = useMemo(() => ({
    emp: locEmployees.map(e => e.nombre),
    dep: Array.from(new Set(locEmployees.map(e => e.departamento).filter(Boolean))).sort(),
    jor: Array.from(new Set(locEmployees.map(e => jornadaLabel(e.jornada)).filter(Boolean))).sort(),
    rol: Array.from(new Set(locEmployees.flatMap(e => fechas.flatMap(f => e.dias[f]?.roles ?? [])))).sort(),
    gua: Array.from(new Set(locShifts.flatMap(r => r.dias.flatMap(d => d.guardias.map(g => g.nombre))))).sort(),
    cas: Array.from(new Set(locShifts.map(r => `${r.ubicacion} · ${r.caseta}`))).sort(),
  }), [locEmployees, locShifts, fechas]);

  const searchFields: SearchFieldConfig[] = useMemo(() => {
    const enumField = (key: FacetKey, label: string, values: string[]): SearchFieldConfig =>
      ({ key, label, type: "enum", options: values.map(o => ({ value: o, label: o })) });
    return isEmployees
      ? [
          enumField("nombre", "Empleado", opts.emp),
          enumField("departamento", "Departamento", opts.dep),
          enumField("jornada", "Jornada", opts.jor),
          ...(opts.rol.length ? [enumField("rol", "Rol", opts.rol)] : []),
        ]
      : [enumField("guardia", "Guardia", opts.gua), enumField("caseta", "Caseta", opts.cas)];
  }, [isEmployees, opts]);
  // Conteo del menú: cuántos quedarían con los chips actuales más la fila
  const fetchCounts = useCallback(async (current: SearchFacet[], candidates: SearchCandidate[]) => {
    const rows = isEmployees ? locEmployees.map(e => employeeValues(e, fechas)) : locShifts.map(shiftValues);
    return candidates.map(c => rows.filter(r => passFacets(r, [...current, { key: c.key, values: [c.value], exact: c.exact }])).length);
  }, [isEmployees, locEmployees, locShifts, fechas]);

  const activeFilters = isEmployees ? fEmp.length + fDep.length + fJor.length + fRol.length : fGua.length + fCas.length;
  // Galería: el back filtra por id los empleados que pasan los filtros del panel (paginación en el servidor).
  // El texto libre y las ubicaciones los sigue aplicando la galería.
  const galleryUserIds = useMemo(() => {
    if (!isEmployees || !activeFilters) return undefined;
    const exactFacets = facets.filter(f => f.exact);
    return allEmployees.filter(e => passFacets(employeeValues(e, fechas), exactFacets)).map(e => e.employee_id).sort((x, y) => x - y);
  }, [isEmployees, activeFilters, facets, allEmployees, fechas]);
  const clearFilters = () => {
    setFacets([]); setQuick([]); setGalQuick([]); setCovFilter("all");
    setPrevView(null);
  };

  const changeGrouping = (g: GroupingMode) => {
    if (g === groupingMode) return;
    v.setGroupingMode(g);
    // Cobertura solo existe agrupando por Ubicaciones
    if (g === "employees" && isCov) v.setDisplayMode("cal");
    clearFilters();
    setSelected([]);
  };
  // Abre el mes del empleado en el calendario (desde tabla, gráficas o el detalle del día)
  const selectEmployee = (nombre: string, fechaMes?: string) => {
    setPrevView(p => p ?? { mode, period, date, fEmp });
    setFEmp([nombre]);
    setDaySelection(null);
    v.setView("cal", "mes");
    if (fechaMes) v.setDate(fromISO(fechaMes));
  };
  const goBack = () => {
    if (!prevView) return;
    v.setView(prevView.mode, prevView.period);
    v.setDate(prevView.date);
    setFEmp(prevView.fEmp);
    setPrevView(null);
  };

  const casetas = new Set(shifts.map(s => `${s.ubicacion}|${s.caseta}`)).size;
  const loading = isCov ? isLoadingPlantilla : isLoading;
  const showKpi = !loading && mode !== "gallery";
  // Día: cuántos de los que se esperaban hoy ya registraron entrada
  const kpiDia = isEmployees && isDay
    ? {
        presentes: baseEmployees.filter(e => PRESENTE.includes(e.dias[fecha]?.status ?? "")).length,
        esperados: baseEmployees.filter(e => ESPERADO.includes(e.dias[fecha]?.status ?? "")).length,
      }
    : null;
  const showPanel = wide ? panelOpen : narrowOpen;
  const quincena = period === "quincena";
  const resetKey = `${v.from}|${groupingMode}|${quick.join()}|${JSON.stringify(facets)}`;

  // ───── Contenido ─────
  const renderView = () => {
    if (mode === "gallery") return <div><GalleryView dateFrom={v.from} dateTo={v.to} search={search} locations={!isEmployees} ubicaciones={selectedLocations} userIds={galleryUserIds} waiting={!!galleryUserIds && isLoading} statuses={galQuick} onCounts={onGalCounts} onOpen={r => setDaySelection(withEmployeeData(galleryToDay(r)))} /></div>;
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
      if (mode === "charts") return <EmployeeCharts employees={employees} days={days} quick={quick} onSelectEmployee={selectEmployee} />;
      if (mode === "table") {
        return isDay
          ? <EmployeeDayTable employees={employees} date={date} sel={sel} onOpenDay={openDay} />
          : <EmployeePeriodTable employees={employees} metrics={metrics} quincena={quincena} sel={sel} resetKey={resetKey} onSelectEmployee={selectEmployee} />;
      }
      return isDay
        ? <EmployeeDayCalendar employees={employees} date={date} quick={quick} onOpenDay={openDay} />
        : <EmployeePeriodGrid employees={employees} days={days} quick={quick} metrics={metrics} onOpenDay={openDay} />;
    }
    if (mode === "charts") return <LocationCharts rows={shifts} days={days} quick={quick} />;
    if (mode === "table") {
      return isDay
        ? <LocationDayTable rows={shifts} date={date} onOpenShift={setShiftSelection} />
        : <LocationPeriodTable rows={shifts} resetKey={resetKey} />;
    }
    return isDay
      ? <LocationDayCalendar rows={shifts} date={date} quick={quick} onOpenShift={setShiftSelection} />
      : <LocationPeriodGrid rows={shifts} days={days} quick={quick} onOpenShift={setShiftSelection} />;
  };

  const selectedEmployees = employees.filter(e => selected.includes(e.employee_id));

  // Resumen de la quincena (Empleados)
  const [qFrom, qTo] = periodRange(period, date);
  const quincenaToast = isEmployees && quincena && !isLoading && mode !== "gallery" && mode !== "charts" && toastOpen && employees.length > 0;
  const porRevisar = Array.from(metrics.values()).filter(m => m.revisar).length;
  const sinSalida = employees.reduce((n, e) => n + fechas.filter(f => e.dias[f]?.status === "sin_salida").length, 0);
  const enCurso = qTo >= new Date(new Date().toDateString());

  const filterPanel = (
    <aside aria-label="Filtros" className={`flex w-[280px] flex-none flex-col gap-4 rounded-2xl bg-c10-surface p-4 shadow-[0_1px_2px_rgba(15,23,42,.04),0_6px_20px_rgba(15,23,42,.04)] ${wide ? "sticky top-[84px] max-h-[calc(100vh-100px)] overflow-y-auto" : "fixed bottom-0 left-0 top-0 z-[58] overflow-auto rounded-none"}`}>
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
      {side && (
        <div className="-mb-2 flex flex-col [&>div:last-child]:pb-0">
          <Seccion titulo="Periodo">
            <div role="group" aria-label="Periodo" className="flex flex-wrap gap-1.5">
              {PERIOD_VIEWS.filter(p => MODE_PERIODS[mode].includes(p.value)).map(p => {
                const on = period === p.value;
                return (
                  <button key={p.value} type="button" aria-pressed={on} onClick={() => v.setPeriod(p.value)} className={`h-[30px] flex-none whitespace-nowrap rounded-full px-3 text-[13px] transition-colors ${on ? "bg-button-primary font-semibold text-white" : "bg-c10-sunken font-medium text-c10-label hover:bg-c10-line"}`}>
                    {p.label}
                  </button>
                );
              })}
            </div>
          </Seccion>
          <Seccion titulo="Fecha">
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1"><FechaPicker view={period} date={date} label={v.label} onPick={v.setDate} /></div>
              {mode === "charts" && (
                <button
                  type="button"
                  title="Recargar"
                  aria-label="Recargar"
                  onClick={() => v.refetchReportAsistencias()}
                  disabled={v.isFetching}
                  className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-full bg-c10-sunken text-c10-secondary transition-colors hover:bg-c10-blue-light hover:text-button-primary disabled:opacity-40"
                >
                  <RotateCw size={16} className={v.isFetching ? "animate-spin" : ""} />
                </button>
              )}
            </div>
          </Seccion>
          {mode === "gallery" && galCounts && (galQuick.length > 0 || Object.values(galCounts).some(n => n > 0)) && (
            <Seccion titulo="Estatus" cnt={galQuick.length}>
              <QuickFilters
                pildora
                pills={GALLERY_QUICK.map(q => ({ key: q.key, label: q.label, count: galCounts[q.key] ?? 0, icon: <StatusIcon status={q.key} size={20} /> }))}
                active={galQuick}
                onToggle={k => setGalQuick(q => (q.includes(k) ? q.filter(x => x !== k) : [...q, k]))}
              />
            </Seccion>
          )}
          {mode === "charts" && !loading && pills.some(p => p.count > 0 || quick.includes(p.key)) && (
            <Seccion titulo="Estatus" cnt={quick.length}>
              <QuickFilters pildora pills={pills} active={quick} onToggle={k => setQuick(q => (q.includes(k) ? q.filter(x => x !== k) : [...q, k]))} />
            </Seccion>
          )}
        </div>
      )}
      {side && <div className="border-t border-c10-sunken" />}
      {!isEmployees && isCov ? (
        <CoverageFilters turnos={covTurnos} turno={covKey} onTurno={setCovTurno} filter={covFilter} onFilter={setCovFilter} counts={covCounts} />
      ) : isEmployees ? (
        <>
          <MultiCombo label="Empleado" placeholder="Buscar empleado" options={opts.emp} value={fEmp} onChange={setFEmp} />
          <div className="border-t border-c10-sunken" />
          <MultiCombo label="Departamento" placeholder="Buscar departamento" options={opts.dep} value={fDep} onChange={setFDep} />
          <div className="border-t border-c10-sunken" />
          <MultiCombo label="Jornada" placeholder="Buscar jornada" options={opts.jor} value={fJor} onChange={setFJor} />
          <div className="border-t border-c10-sunken" />
          {opts.rol.length > 0 || fRol.length > 0 ? (
            <MultiCombo label="Rol" placeholder="Buscar rol" options={opts.rol} value={fRol} onChange={setFRol} />
          ) : (
            <div>
              <span className="mb-1.5 block text-[13px] font-semibold text-c10-title">Rol</span>
              <p className="m-0 text-xs text-c10-meta">Ningún check-in del periodo trae rol. Asigna roles a los usuarios para filtrar por rol.</p>
            </div>
          )}
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
          {prevView && (
            <button type="button" title="Regresar" aria-label="Regresar" onClick={goBack} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-c10-sunken text-c10-secondary hover:bg-c10-blue-light hover:text-button-primary">
              <ArrowLeft size={16} />
            </button>
          )}
          <h1 className="m-0 text-2xl font-semibold tracking-[-.02em] text-c10-title">Reporte de asistencia</h1>
          {showKpi && (
            <KpiChip>
              {kpiDia && kpiDia.esperados > 0
                ? `${kpiDia.presentes} de ${plural(kpiDia.esperados, "empleado", "empleados")}`
                : isEmployees ? plural(employees.length, "empleado", "empleados") : isCov ? plural(covShown.length, "ubicación", "ubicaciones") : plural(casetas, "caseta", "casetas")}
            </KpiChip>
          )}
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
          <FacetSearch
            fields={searchFields}
            facets={facets}
            onChange={setFacets}
            fetchCounts={fetchCounts}
            placeholder={isEmployees ? "Buscar empleado, departamento, jornada..." : "Buscar caseta o guardia"}
            className="w-[340px] max-md:w-full"
          />
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
        <PanelAnim open={showPanel}>{filterPanel}</PanelAnim>
        {wide && !panelOpen && (
          <button
            type="button"
            title="Filtros · arrastra para moverlo"
            aria-label="Mostrar filtros"
            onPointerDown={e => {
              const r = e.currentTarget.getBoundingClientRect();
              fbDrag.current = { y0: e.clientY, top0: r.top + r.height / 2, moved: false };
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={e => {
              const d = fbDrag.current;
              if (!d) return;
              if (Math.abs(e.clientY - d.y0) > 4) d.moved = true;
              if (d.moved) setFbY(Math.min(window.innerHeight - 34, Math.max(110, d.top0 + e.clientY - d.y0)));
            }}
            onPointerUp={() => {
              const moved = fbDrag.current?.moved;
              fbDrag.current = null;
              if (!moved) setPanelOpen(true);
            }}
            style={{ top: fbY ?? "50%", touchAction: "none" }}
            className="fixed left-0 z-40 inline-flex h-[52px] w-[38px] -translate-y-1/2 cursor-grab items-center active:cursor-grabbing justify-center rounded-r-full bg-button-primary text-white shadow-[0_4px_12px_rgba(47,128,237,.3)] hover:bg-button-primary-hover"
          >
            <SlidersHorizontal size={18} />
            {activeFilters > 0 && <span className="absolute -right-1.5 -top-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-semibold text-white">{activeFilters}</span>}
          </button>
        )}

        {side ? (
          <main className="flex min-w-0 flex-1 flex-col gap-4">{renderView()}</main>
        ) : (
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
                  disabled={(isCov ? isFetchingPlantilla : v.isFetching)}
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
            {!loading && (
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
        )}

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
          {selected.length < employees.length && (
            <button type="button" onClick={() => setSelected(employees.map(e => e.employee_id))} className="h-9 rounded-lg px-2 font-semibold text-blue-300 hover:underline">
              Seleccionar los {employees.length}
            </button>
          )}
          <button type="button" onClick={() => exportRegistros(selectedEmployees, fechas, v.label)} className="h-9 rounded-lg bg-white/10 px-3 font-semibold hover:bg-white/20">Descargar Registros</button>
          <button type="button" onClick={() => exportNomina(selectedEmployees, metrics, fechas, v.label)} className="h-9 rounded-lg bg-white/10 px-3 font-semibold hover:bg-white/20">Exportar Nómina</button>
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

      <AttendanceDayDrawer selection={daySelection} onClose={closeDay} onViewMonth={isEmployees ? selectEmployee : undefined} />
      <ShiftDrawer selection={shiftSelection} onClose={closeShift} onOpenPlazas={s => { setShiftSelection(null); setPlazasSel(s); }} />
      <PlazasDrawer selection={plazasSel} onClose={closePlazas} />
    </div>
  );
};

export default ReportPage;
