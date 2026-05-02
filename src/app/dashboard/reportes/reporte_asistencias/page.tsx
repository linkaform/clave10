"use client";

import React, { useEffect, useMemo, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eraser,
  LayoutGrid,
  LayoutList,
  Play,
  Search,
  Sheet,
  CheckSquare,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FloatingFiltersDrawer } from "@/components/Bitacoras/PhotoGrid/FloatingFiltersDrawer";
import { SimpleAttendanceTable } from "../components/SimpleAttendanceTable";
import AttendanceTableSymbology from "../components/AttendanceTableSymbology";
import { useAsistenciasView } from "@/hooks/asistencias/useAsistenciasView";
import { PhotoGridView } from "@/components/Bitacoras/PhotoGrid/PhotoGridView";
import { FiltersPanel } from "@/components/Bitacoras/PhotoGrid/PhotoGridFiltersPanel";
import { ListRecord, PhotoRecord } from "@/types/bitacoras";
import PhotoListView from "@/components/Bitacoras/PhotoList/PhotoListView";
import LocationShiftAttendanceTable from "../components/LocationShiftAttendanceTable";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select";
import { useAttendanceData, useReportLocations } from "../hooks/useAsistenciasReport";
import { mapAttendanceGrid } from "@/mappers/attendance.grid.mappers";
import { mapAttendanceList } from "@/mappers/attendance.list.mappers";
import { TagSearchInput } from "@/components/tag-search-input";
import { applyAttendanceFilters, useAttendanceFilters } from "@/hooks/bitacora/useAttendanceFilters";


const getMonthName = (month: number) => {
  const date = new Date();
  date.setMonth(month - 1);
  return date.toLocaleString("es-ES", { month: "long" });
};

const ReportPage = () => {
  const {
    viewMode,
    setViewMode,
    isSidebarOpen,
    setIsSidebarOpen,
    month,
    year,
    daysInMonth,
    handlePrevMonth,
    handleNextMonth,
    groupByLocation,
    handleGroupByLocationToggle,
    selectedStatus,
    setSelectedStatus,
    timeframe,
    setTimeframe,
    groupingMode,
    setGroupingMode,
    selectedLocations,
    setSelectedLocations,
    handleExecute,
    handleClear,
    isExecuted,
    reportAsistencias,
    isLoading,
    errorReportAsistencias,
    refetchReportAsistencias,
    hasData,
  } = useAsistenciasView();

  const { reportLocations } = useReportLocations({ enabled: true });

  const {
    externalFilters,
    onExternalFiltersChange,
    activeFiltersCount,
    filtersConfig,
    searchTags,
    setSearchTags,
    isSidebarOpen: isFilterSidebarOpen,
    setIsSidebarOpen: setIsFilterSidebarOpen,
  } = useAttendanceFilters();

  // Auto-fetch al entrar en vista tabla (solo una vez por visita)
  const hasAutoFetched = useRef(false);
  useEffect(() => {
    if (viewMode === "table" && !hasAutoFetched.current) {
      hasAutoFetched.current = true;
      handleExecute();
    }
  }, [handleExecute, viewMode]);

  useEffect(() => {
    if (viewMode !== "table") {
      hasAutoFetched.current = false;
    }
  }, [viewMode]);

  // Datos para vistas fotos y lista
  const { attendanceData, isLoadingAttendance } = useAttendanceData({
    locations: selectedLocations,
    limit: 100,
    offset: 0,
    enabled: viewMode === "photos" || viewMode === "list",
  });

  // Aplicar filtros de estatus antes de formatear
  const filteredAttendanceData = useMemo(
    () => applyAttendanceFilters(attendanceData ?? [], externalFilters),
    [attendanceData, externalFilters]
  );

  const attendancePhotoRecords: PhotoRecord[] = useMemo(() => {
    if (!filteredAttendanceData?.length) return [];
    return filteredAttendanceData.map((item: any) => {
      const base = { id: item._id || "no-id", folio: item.folio || "S/F" };
      return mapAttendanceGrid(item, base);
    });
  }, [filteredAttendanceData]);

  const attendanceListRecords: ListRecord[] = useMemo(() => {
    if (!filteredAttendanceData?.length) return [];
    return filteredAttendanceData.map((item: any) => {
      const base = { id: item._id || "no-id", folio: item.folio || "S/F" };
      return mapAttendanceList(item, base);
    });
  }, [filteredAttendanceData]);

  return (
    <div className="w-full relative">
      <div className="p-6 space-y-4 pt-3 w-full">

        {/* Header sticky */}
        <div className="sticky top-[68px] z-40 bg-white py-2 space-y-2">

          {/* Fila 1: título + filtros de tabla + acciones */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-baseline gap-2 mr-2">
              <h1 className="text-xl font-bold text-slate-900 whitespace-nowrap">
                Reporte de Asistencias
              </h1>
              <span className="text-sm font-light text-slate-500 whitespace-nowrap">
                {viewMode === "table"
                  ? `${Array.isArray(reportAsistencias) ? reportAsistencias.length : 0} empleados`
                  : `${filteredAttendanceData?.length ?? 0} registros`}
              </span>
            </div>

            {/* TagSearch — en todas las vistas */}
            <div className="flex p-1 rounded-lg items-center border border-slate-200 w-[240px] overflow-hidden focus-within:ring-1 focus-within:ring-blue-400 focus-within:border-blue-400 bg-white transition-all">
              <Search className="ml-2 mr-1 flex-shrink-0 text-slate-400" size={14} />
              <TagSearchInput
                tags={searchTags}
                onTagsChange={setSearchTags}
                placeholder="Buscar..."
                className="w-full bg-transparent border-none shadow-none focus-visible:ring-0 h-8 text-sm min-w-0 px-1"
              />
            </div>

            {/* Ubicaciones — solo en tabla */}
            {viewMode === "table" && (
              <MultiSelect values={selectedLocations} onValuesChange={setSelectedLocations}>
                <MultiSelectTrigger className="w-[220px] h-9">
                  <MultiSelectValue placeholder="Ubicaciones" />
                </MultiSelectTrigger>
                <MultiSelectContent>
                  <MultiSelectGroup>
                    {reportLocations?.map((location: string, i: number) => (
                      <MultiSelectItem key={`${i}-${location}`} value={location}>
                        {location}
                      </MultiSelectItem>
                    ))}
                  </MultiSelectGroup>
                </MultiSelectContent>
              </MultiSelect>
            )}

            {viewMode === "table" && (
              <Select value={groupingMode} onValueChange={(v) => setGroupingMode(v as any)}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Agrupación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="employees">Empleados</SelectItem>
                    <SelectItem value="locations">Ubicaciones</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}

            {viewMode === "table" && groupingMode === "employees" && (
              <Button
                variant="outline"
                onClick={handleGroupByLocationToggle}
                className={`flex items-center gap-2 h-9 ${
                  groupByLocation ? "bg-blue-100 border-blue-500 hover:bg-blue-200" : ""
                }`}
              >
                Agrupar por Ubicación{" "}
                {groupByLocation ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
              </Button>
            )}

            <div className="flex-1" />

            {/* Acciones + toggle vistas al mismo lado derecho */}
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <Button variant="outline" onClick={handleClear} className="h-9">
                <Eraser className="mr-1 h-4 w-4" /> Limpiar
              </Button>
              <Button variant="outline" disabled className="h-9">
                <Download className="mr-1 h-4 w-4" /> Exportar
              </Button>
              {viewMode === "table" && (
                <Button
                  className="bg-blue-600 h-9"
                  onClick={handleExecute}
                  disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      Cargando...
                    </>
                  ) : (
                    <>
                      <Play className="mr-1 h-4 w-4" /> Ejecutar
                    </>
                  )}
                </Button>
              )}
              {/* Toggle de vistas — al lado de los botones de acción */}
              <div className="flex items-center bg-slate-100/50 h-9 border border-slate-300 rounded-lg divide-x divide-slate-300 overflow-hidden shadow-sm">
                <Button
                  variant="ghost" size="icon"
                  className={`h-full w-9 rounded-none hover:bg-slate-200/50 ${viewMode === "photos" ? "bg-blue-600 text-white hover:bg-blue-700" : "text-slate-500"}`}
                  onClick={() => setViewMode("photos")}>
                  <LayoutGrid size={16} />
                </Button>
                <Button
                  variant="ghost" size="icon"
                  className={`h-full w-9 rounded-none hover:bg-slate-200/50 ${viewMode === "table" ? "bg-blue-600 text-white hover:bg-blue-700" : "text-slate-500"}`}
                  onClick={() => setViewMode("table")}>
                  <Sheet size={16} />
                </Button>
                <Button
                  variant="ghost" size="icon"
                  className={`h-full w-9 rounded-none hover:bg-slate-200/50 ${viewMode === "list" ? "bg-blue-600 text-white hover:bg-blue-700" : "text-slate-500"}`}
                  onClick={() => setViewMode("list")}>
                  <LayoutList size={16} />
                </Button>
              </div>
            </div>
          </div>

          {/* Fila 2: periodo + navegación mes + simbología (solo tabla) */}
          {viewMode === "table" && (
            <div className="flex items-center gap-3 flex-wrap">
              <Select value={timeframe} onValueChange={(v) => setTimeframe(v as "mes" | "semana")}>
                <SelectTrigger className="w-[130px] h-9">
                  <SelectValue placeholder="Periodo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="semana">Semana</SelectItem>
                    <SelectItem value="mes">Mes</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

              <div className="flex items-center bg-slate-100/50 h-9 border border-slate-300 rounded-lg overflow-hidden shadow-sm">
                <Button
                  variant="ghost" size="icon"
                  className="h-full w-9 rounded-none hover:bg-slate-200/50"
                  onClick={handlePrevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-3 font-semibold text-sm min-w-[130px] text-center capitalize">
                  {getMonthName(month)} {year}
                </span>
                <Button
                  variant="ghost" size="icon"
                  className="h-full w-9 rounded-none hover:bg-slate-200/50"
                  onClick={handleNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <AttendanceTableSymbology
                selectedStatus={selectedStatus}
                onChange={setSelectedStatus}
              />
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="w-full">

          {/* Vista tabla */}
          {viewMode === "table" && (
            isLoading ? (
              <div className="flex justify-center items-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
              </div>
            ) : errorReportAsistencias ? (
              <div className="text-center p-8">
                <p className="text-red-500 mb-2">Error al cargar los datos</p>
                <Button onClick={() => refetchReportAsistencias()}>Reintentar</Button>
              </div>
            ) : !isExecuted || !hasData ? (
              <div className="text-center p-8">
                <p className="text-gray-500 mb-2">
                  {!isExecuted ? "Cargando datos..." : "No hay registros para los filtros seleccionados"}
                </p>
              </div>
            ) : groupingMode === "locations" ? (
              <LocationShiftAttendanceTable
                data={reportAsistencias}
                month={month}
                year={year}
                timeframe={timeframe}
                selectedStatus={selectedStatus}
                onStatusChange={setSelectedStatus}
              />
            ) : (
              <>
                <FloatingFiltersDrawer
                  isOpen={isSidebarOpen}
                  onOpenChange={setIsSidebarOpen}
                  activeFiltersCount={0}
                  filters={{ dynamic: {} }}
                  onFiltersChange={() => {}}
                  filtersConfig={[]}
                />
                <SimpleAttendanceTable
                  data={reportAsistencias}
                  daysInMonth={daysInMonth}
                  groupByLocation={groupByLocation}
                  timeframe={timeframe}
                  month={month}
                  year={year}
                  selectedStatus={selectedStatus}
                />
              </>
            )
          )}

          {viewMode === "photos" && (
            <div className="flex gap-4">
              {/* FloatingFiltersDrawer para mobile */}
              <FloatingFiltersDrawer
                isOpen={isFilterSidebarOpen}
                onOpenChange={setIsFilterSidebarOpen}
                activeFiltersCount={activeFiltersCount}
                filters={externalFilters}
                onFiltersChange={onExternalFiltersChange}
                filtersConfig={filtersConfig}
              />
              <aside className="w-80 shrink-0 hidden lg:block border border-slate-200 rounded-lg bg-white p-6 sticky top-[140px] shadow-sm max-h-[calc(100vh-160px)] overflow-y-auto">
                <FiltersPanel
                  filters={externalFilters}
                  onFiltersChange={onExternalFiltersChange}
                  filtersConfig={filtersConfig}
                />
              </aside>
              <div className="flex-1 min-w-0">
                <PhotoGridView
                  isLoading={isLoadingAttendance}
                  records={attendancePhotoRecords}
                  globalSearch={searchTags}
                  externalFilters={externalFilters}
                  onExternalFiltersChange={onExternalFiltersChange}
                />
              </div>
            </div>
          )}

          {viewMode === "list" && (
            <div className="flex gap-4">
              <FloatingFiltersDrawer
                isOpen={isFilterSidebarOpen}
                onOpenChange={setIsFilterSidebarOpen}
                activeFiltersCount={activeFiltersCount}
                filters={externalFilters}
                onFiltersChange={onExternalFiltersChange}
                filtersConfig={filtersConfig}
              />
              <aside className="w-80 shrink-0 hidden lg:block border border-slate-200 rounded-lg bg-white p-6 sticky top-[140px] shadow-sm max-h-[calc(100vh-160px)] overflow-y-auto">
                <FiltersPanel
                  filters={externalFilters}
                  onFiltersChange={onExternalFiltersChange}
                  filtersConfig={filtersConfig}
                />
              </aside>
              <div className="flex-1 min-w-0">
                <PhotoListView
                  isLoading={isLoadingAttendance}
                  records={attendanceListRecords}
                  globalSearch={searchTags}
                  externalFilters={externalFilters}
                  onExternalFiltersChange={onExternalFiltersChange}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportPage;