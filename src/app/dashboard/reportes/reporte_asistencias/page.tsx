"use client";

import React, { useMemo, useState } from "react";
import { CalendarDays, LayoutGrid, Search, Sheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAsistenciasView, DisplayMode } from "@/hooks/asistencias/useAsistenciasView";
import { GroupingMode } from "../types/attendance";
import { EmployeeAttendanceGrid } from "../components/EmployeeAttendanceGrid";
import { EmployeeSummaryTable } from "../components/EmployeeSummaryTable";
import { EmployeeDayView } from "../components/EmployeeDayView";
import { QuincenaBanner } from "../components/QuincenaBanner";
import { AttendanceDayDrawer, DaySelection } from "../components/AttendanceDayDrawer";
import { LocationDayView } from "../components/LocationDayView";
import { LocationPeriodView } from "../components/LocationPeriodView";
import { ShiftDrawer } from "../components/ShiftDrawer";
import { ReportSkeleton } from "../components/ReportSkeleton";
import { AttendanceRecordsView } from "../components/AttendanceRecordsView";
import { Skeleton } from "@/components/ui/skeleton";
import { ShiftStatusIcon, StatusIcon, attendanceStatusConfig, legendStatuses, shiftLegendStatuses, shiftStatusConfig } from "../components/attendanceStatus";
import { EmployeeLocationRow, jornadaLabel, mergeEmployees } from "./lib/employees";
import { ShiftRow, ShiftSelection, filterShifts } from "./lib/shifts";
import { PERIOD_VIEWS, PeriodView, periodRange } from "./lib/period";

const segBtn = (active: boolean) =>
  `h-full px-5 border-l border-[#E2E8F0] first:border-l-0 ${active ? "bg-[#2F80ED] text-white font-semibold" : "bg-transparent text-[#475569]"}`;

const ReportPage = () => {
  const {
    groupingMode,
    setGroupingMode,
    period,
    setPeriod,
    days,
    label,
    isCurrent,
    goPrev,
    goNext,
    goToday,
    displayMode,
    setDisplayMode,
    search,
    setSearch,
    date,
    from: dateFrom,
    to: dateTo,
    reportAsistencias,
    isLoading,
    errorReportAsistencias,
    refetchReportAsistencias,
  } = useAsistenciasView();
  const [daySelection, setDaySelection] = useState<DaySelection | null>(null);
  const [shiftSelection, setShiftSelection] = useState<ShiftSelection | null>(null);
  const [departamento, setDepartamento] = useState("");
  const [jornada, setJornada] = useState("");
  const openDay = (employee: DaySelection["employee"], fecha: string) => setDaySelection({ employee, fecha });

  const isEmployees = groupingMode === "employees";

  const allEmployees = useMemo(
    () => (isEmployees ? mergeEmployees(reportAsistencias as EmployeeLocationRow[]) : []),
    [isEmployees, reportAsistencias]
  );
  const departamentos = useMemo(
    () => Array.from(new Set(allEmployees.map(e => e.departamento).filter(Boolean))).sort(),
    [allEmployees]
  );
  const jornadas = useMemo(
    () => Array.from(new Set(allEmployees.map(e => jornadaLabel(e.jornada)).filter(Boolean))).sort(),
    [allEmployees]
  );
  const employees = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allEmployees.filter(e =>
      (!q || e.nombre.toLowerCase().includes(q)) &&
      (!departamento || e.departamento === departamento) &&
      (!jornada || jornadaLabel(e.jornada) === jornada)
    );
  }, [allEmployees, search, departamento, jornada]);

  const shifts = useMemo(
    () => (isEmployees ? [] : filterShifts(reportAsistencias as ShiftRow[], search)),
    [isEmployees, reportAsistencias, search]
  );
  const casetas = new Set(shifts.map(s => `${s.ubicacion}|${s.caseta}`)).size;

  const changeGrouping = (mode: GroupingMode) => {
    if (mode === groupingMode) return;
    setGroupingMode(mode);
    setSearch("");
    setDepartamento("");
    setJornada("");
  };

  const isCards = displayMode === "cards";

  const renderView = () => {
    if (isCards) return <AttendanceRecordsView dateFrom={dateFrom} dateTo={dateTo} search={search} />;
    if (isLoading) {
      if (displayMode === "table") return <ReportSkeleton variant="table" />;
      return period === "dia" ? <ReportSkeleton variant="cards" /> : <ReportSkeleton variant="grid" columns={days.length} />;
    }
    if (errorReportAsistencias) {
      return (
        <div className="text-center p-8">
          <p className="text-red-500 mb-2">Error al cargar los datos</p>
          <Button onClick={() => refetchReportAsistencias()}>Reintentar</Button>
        </div>
      );
    }
    if (!isEmployees) {
      if (!shifts.length) {
        return (
          <div className="rounded-xl border border-dashed border-[#CBD5E1] p-8 text-center text-[#64748B]">
            No se encontraron casetas con ese filtro
          </div>
        );
      }
      return period === "dia"
        ? <LocationDayView rows={shifts} date={date} mode={displayMode} onOpenShift={setShiftSelection} />
        : <LocationPeriodView rows={shifts} days={days} mode={displayMode} onOpenShift={setShiftSelection} />;
    }
    if (!employees.length) {
      return (
        <div className="rounded-xl border border-dashed border-[#CBD5E1] p-8 text-center text-[#64748B]">
          No se encontraron empleados con ese filtro
        </div>
      );
    }
    if (period === "dia") {
      return <EmployeeDayView employees={employees} date={date} mode={displayMode} onOpenDay={openDay} />;
    }
    const content = displayMode === "table"
      ? (
        <EmployeeSummaryTable
          employees={employees}
          showReview={period === "quincena"}
          onSelectEmployee={nombre => {
            setSearch(nombre);
            setDisplayMode("cal");
          }}
        />
      )
      : <EmployeeAttendanceGrid employees={employees} days={days} onOpenDay={openDay} />;
    if (period !== "quincena") return content;
    const [from, to] = periodRange(period, date);
    return (
      <div className="flex flex-col gap-3.5">
        <QuincenaBanner employees={employees} from={from} to={to} />
        {content}
      </div>
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-[18px] px-8 pb-12 pt-6 text-sm text-[#171717] max-md:px-4">
      {/* Barra principal */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="m-0 text-2xl font-bold tracking-[-.02em] text-[#0F172A]">Reporte de asistencia</h1>
          {isLoading && <Skeleton className="h-6 w-28" />}
          {!isLoading && !isCards && (
            <span className="inline-flex rounded-md bg-[#2F80ED] px-2 py-0.5 font-semibold tabular-nums text-white">
              {isEmployees
                ? `${employees.length} ${employees.length === 1 ? "empleado" : "empleados"}`
                : `${casetas} ${casetas === 1 ? "caseta" : "casetas"}`}
            </span>
          )}
          <label className="flex h-10 w-[240px] items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-3 text-[#64748B] max-md:w-full">
            <Search size={16} />
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={isEmployees ? "Buscar empleado..." : "Buscar caseta o guardia..."}
              aria-label={isEmployees ? "Buscar empleado" : "Buscar caseta o guardia"}
              className="w-full border-none bg-transparent text-[#171717] outline-none"
            />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" disabled title="Pendiente" className="inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-lg border border-[#E2E8F0] bg-white px-4 font-semibold disabled:cursor-not-allowed disabled:opacity-50">
            Reglas de Jornada
          </button>
          <button type="button" disabled title="Pendiente" className="inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-lg border border-[#E2E8F0] bg-white px-4 font-semibold disabled:cursor-not-allowed disabled:opacity-50">
            Exportar Excel
          </button>
          <div role="group" aria-label="Tipo de vista" className="inline-flex h-10 overflow-hidden rounded-lg border border-[#E2E8F0] bg-white">
            {([
              ["cal", "Vista de calendario", <CalendarDays key="cal" size={20} aria-hidden="true" />],
              ["cards", "Vista de registros con foto", <LayoutGrid key="cards" size={20} aria-hidden="true" />],
              ["table", "Vista de tabla", <Sheet key="table" size={20} aria-hidden="true" />],
            ] as [DisplayMode, string, React.ReactNode][]).map(([mode, title, svg]) => (
              <button
                key={mode}
                type="button"
                title={title}
                aria-label={title}
                aria-pressed={displayMode === mode}
                onClick={() => setDisplayMode(mode)}
                className={`${segBtn(displayMode === mode)} inline-flex items-center justify-center !px-3.5`}
              >
                {svg}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Periodo */}
      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Reporte por" className="inline-flex h-10 overflow-hidden rounded-lg border border-[#E2E8F0] bg-white">
          {([["employees", "Empleados"], ["locations", "Ubicaciones"]] as [GroupingMode, string][]).map(([mode, text]) => (
            <button key={mode} type="button" aria-pressed={groupingMode === mode} onClick={() => changeGrouping(mode)} className={segBtn(groupingMode === mode)}>
              {text}
            </button>
          ))}
        </div>
        <select
          aria-label="Periodo"
          value={period}
          onChange={e => setPeriod(e.target.value as PeriodView)}
          className="h-10 min-w-[130px] rounded-lg border border-[#E2E8F0] bg-white px-2.5 text-[#475569]"
        >
          {PERIOD_VIEWS.map(v => (
            <option key={v.value} value={v.value}>{v.label}</option>
          ))}
        </select>
        <div className="inline-flex h-10 items-center overflow-hidden rounded-lg border border-[#E2E8F0] bg-white">
          <button type="button" aria-label="Periodo anterior" onClick={goPrev} className="h-10 w-10 text-lg text-[#475569] hover:bg-[#F8FAFC]">‹</button>
          <strong className="whitespace-nowrap px-3.5 tabular-nums text-[#0F172A]">{label}</strong>
          <button type="button" aria-label="Periodo siguiente" onClick={goNext} className="h-10 w-10 text-lg text-[#475569] hover:bg-[#F8FAFC]">›</button>
        </div>
        <button
          type="button"
          onClick={goToday}
          disabled={isCurrent}
          title={isCurrent ? "Ya estás viendo el periodo actual" : "Regresar al periodo actual"}
          className="h-10 rounded-lg border border-[#2F80ED] bg-[#2F80ED] px-3.5 font-semibold text-white hover:bg-[#1E6FDB] disabled:cursor-default disabled:border-[#E2E8F0] disabled:bg-white disabled:text-[#64748B] disabled:opacity-70"
        >
          Hoy
        </button>
        {isEmployees && !isCards && (
          <>
            <select
              aria-label="Departamento"
              value={departamento}
              onChange={e => setDepartamento(e.target.value)}
              className="h-10 rounded-lg border border-[#E2E8F0] bg-white px-2.5 text-[#475569]"
            >
              <option value="">Departamento: Todos</option>
              {departamentos.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select
              aria-label="Jornada"
              value={jornada}
              onChange={e => setJornada(e.target.value)}
              className="h-10 max-w-[240px] rounded-lg border border-[#E2E8F0] bg-white px-2.5 text-[#475569]"
            >
              <option value="">Jornada: Todas</option>
              {jornadas.map(j => <option key={j} value={j}>{j}</option>)}
            </select>
          </>
        )}
      </div>

      <div>{renderView()}</div>

      {!isCards && <div className="flex flex-wrap justify-center gap-x-4 gap-y-2.5 py-1">
        {isEmployees
          ? legendStatuses.map(status => (
            <span key={status} className="inline-flex items-center gap-1.5 text-xs text-[#475569]">
              <StatusIcon status={status} size={22} />
              {attendanceStatusConfig[status].label}
            </span>
          ))
          : shiftLegendStatuses.map(status => (
            <span key={status} className="inline-flex items-center gap-1.5 text-xs text-[#475569]">
              <ShiftStatusIcon status={status} size={22} />
              {shiftStatusConfig[status].label}
            </span>
          ))}
      </div>}

      <AttendanceDayDrawer selection={daySelection} onClose={() => setDaySelection(null)} />
      <ShiftDrawer selection={shiftSelection} onClose={() => setShiftSelection(null)} />
    </div>
  );
};

export default ReportPage;
