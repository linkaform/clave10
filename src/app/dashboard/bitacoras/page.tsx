"use client";

import React from "react";
import BitacorasTable from "@/components/table/bitacoras/table";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddBadgeModal } from "@/components/modals/add-badge-modal";
import { DoOutModal } from "@/components/modals/do-out-modal";
import ForceQuitConfirmationModal from "@/components/modals/force-quit-confirmation";
import { ReturnGafeteModal } from "@/components/modals/return-gafete-modal";
import { TagSearchInput } from "@/components/tag-search-input";
import { forceQuitAllPersons } from "@/lib/endpoints";
import { Search, LogOut, LayoutGrid, Sheet, LayoutList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBitacora } from "@/hooks/bitacora/useBitacora";
import { FloatingFiltersDrawer } from "@/components/Bitacoras/PhotoGrid/FloatingFiltersDrawer";
import { FilterConfig } from "@/types/bitacoras";

const BitacorasPage = () => {
  const {
    bitacoraSeleccionada,
    date1,
    date2,
    dateFilter,
    handleAgregarBadge,
    handlePrintPase,
    handleRegresarGafete,
    handleSalida,
    isForcingQuit,
    isLoadingListBitacoras,
    isPersonasDentro,
    listBitacoras,
    modalAgregarBadgeAbierto,
    modalForceQuitAbierto,
    modalRegresarGafeteAbierto,
    modalSalidaAbierto,
    pagination,
    refreshData,
    searchTags,
    setDate1,
    setDate2,
    setDateFilter,
    setIsForcingQuit,
    setModalAgregarBadgeAbierto,
    setModalForceQuitAbierto,
    setModalRegresarGafeteAbierto,
    setModalSalidaAbierto,
    setPagination,
    setSearchTags,
    setViewMode,
    setUbicacionSeleccionada,
    ubicacionSeleccionada,
    viewMode,
  } = useBitacora();

  const [selectedTab, setSelectedTab] = React.useState("personal");
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [filtersConfig, setFiltersConfig] = React.useState<FilterConfig[]>([]);
  const [dynamicFilters, setDynamicFilters] = React.useState<
    Record<string, any>
  >({});

  const externalFilters = React.useMemo(
    () => ({
      dynamic: dynamicFilters,
      dateFilter,
      date1,
      date2,
    }),
    [dynamicFilters, dateFilter, date1, date2],
  );

  const onExternalFiltersChange = (newFilters: any) => {
    // Si los filtros se están limpiando completamente (ubicacion es [] y dateFilter es "")
    if (
      newFilters.dynamic &&
      Array.isArray(newFilters.dynamic.ubicacion) &&
      newFilters.dynamic.ubicacion.length === 0 &&
      newFilters.dateFilter === ""
    ) {
      if (setUbicacionSeleccionada) setUbicacionSeleccionada([]);
      setDynamicFilters({ ubicacion: [] });
      setDateFilter("");
      setDate1("");
      setDate2("");
      return;
    }

    if (newFilters.dateFilter !== undefined)
      setDateFilter(newFilters.dateFilter);
    if (newFilters.date1 !== undefined) setDate1(newFilters.date1);
    if (newFilters.date2 !== undefined) setDate2(newFilters.date2);
    if (newFilters.dynamic !== undefined) {
      if (
        setUbicacionSeleccionada &&
        JSON.stringify(newFilters.dynamic.ubicacion) !==
          JSON.stringify(dynamicFilters.ubicacion)
      ) {
        setUbicacionSeleccionada(newFilters.dynamic.ubicacion || []);
      }
      setDynamicFilters(newFilters.dynamic);
    }
  };

  const activeFiltersCount =
    (dateFilter && dateFilter !== "today" ? 1 : 0) +
    (date1 ? 1 : 0) +
    (date2 ? 1 : 0) +
    Object.values(dynamicFilters).filter((v) =>
      Array.isArray(v) ? v.length > 0 : !!v,
    ).length;

  return (
    <div className="w-full relative">
      <FloatingFiltersDrawer
        isOpen={isSidebarOpen}
        onOpenChange={setIsSidebarOpen}
        activeFiltersCount={activeFiltersCount}
        filters={externalFilters}
        onFiltersChange={onExternalFiltersChange}
        filtersConfig={filtersConfig}
      />
      <div className="p-6 space-y-4 pt-3 w-full">
        {/* FILA ÚNICA: Título -> Search -> Tabs -> ViewModes */}
        <div className="flex items-center justify-between w-full gap-4">
          {/* 1. Título (Izquierda) */}
          <div className="flex items-baseline gap-2 min-w-fit">
            <h1 className="text-xl font-bold text-slate-900 whitespace-nowrap">
              Bitácora de Entradas & Salidas
            </h1>
            <span className="text-sm font-light text-slate-500 whitespace-nowrap">
              {listBitacoras?.total_records || 0} registros{" "}
              {dateFilter === "today"
                ? "de hoy"
                : dateFilter === ""
                  ? "en total"
                  : ""}
            </span>
          </div>

          {/* Contenedor Derecha: Search -> Tabs -> ViewModes */}
          <div className="flex items-center gap-4 min-w-0 justify-end flex-shrink-0">
            {/* 2. Search */}
            <div className="flex p-1 rounded-lg items-center border border-slate-200 w-[240px] overflow-hidden focus-within:ring-1 focus-within:ring-blue-400 focus-within:border-blue-400 bg-white transition-all">
              <Search
                className="ml-2 mr-1 flex-shrink-0 text-slate-400"
                size={14}
              />
              <TagSearchInput
                tags={searchTags}
                onTagsChange={setSearchTags}
                placeholder="Buscar..."
                className="w-full bg-transparent border-none shadow-none focus-visible:ring-0 h-8 text-sm min-w-0 px-1"
              />
            </div>

            {/* 3. Tabs */}
            <Tabs
              value={selectedTab}
              onValueChange={setSelectedTab}
              className="w-auto">
              <TabsList className="bg-slate-100/50 h-10 p-0 border border-slate-300 divide-x divide-slate-300 rounded-lg overflow-hidden shadow-sm">
                <TabsTrigger
                  value="personal"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white px-6 h-full font-medium transition-all rounded-none border-x border-slate-300/50 shadow-none text-slate-600 hover:bg-slate-200/50">
                  Personal
                </TabsTrigger>
                <TabsTrigger
                  value="vehiculos"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white px-6 h-full font-medium transition-all rounded-none border-x border-slate-300/50 shadow-none text-slate-600 hover:bg-slate-200/50">
                  Vehículos
                </TabsTrigger>
                <TabsTrigger
                  value="equipos"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white px-6 h-full font-medium transition-all rounded-none border-x border-slate-300/50 shadow-none text-slate-600 hover:bg-slate-200/50">
                  Equipos
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* 4. ViewModes (Final) */}
            <div className="flex items-center bg-slate-100/50 h-10 border border-slate-300 rounded-lg divide-x divide-slate-300 overflow-hidden shadow-sm">
              <Button
                variant="ghost"
                size="icon"
                className={`h-full w-10 transition-all rounded-none hover:bg-slate-200/50 border-x border-slate-300/50 ${viewMode === "photos" ? "bg-blue-600 text-white hover:bg-blue-700" : "text-slate-500"}`}
                onClick={() => setViewMode?.("photos")}>
                <LayoutGrid size={18} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-full w-10 transition-all rounded-none hover:bg-slate-200/50 border-x border-slate-300/50 ${viewMode === "table" ? "bg-blue-600 text-white hover:bg-blue-700" : "text-slate-500"}`}
                onClick={() => setViewMode?.("table")}>
                <Sheet size={18} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-full w-10 transition-all rounded-none hover:bg-slate-200/50 border-x border-slate-300/50 ${viewMode === "list" ? "bg-blue-600 text-white hover:bg-blue-700" : "text-slate-500"}`}
                onClick={() => setViewMode?.("list")}>
                <LayoutList size={18} />
              </Button>
            </div>

            {/* Sacar (Si aplica) al final */}
            {isPersonasDentro && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setModalForceQuitAbierto(true)}
                className="h-10 px-3 flex gap-2">
                <LogOut size={16} />
                Sacar
              </Button>
            )}
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="w-full">
          <Tabs value={selectedTab} className="w-full">
            <TabsContent
              value="personal"
              className="m-0 border-none p-0 focus-visible:ring-0">
              <BitacorasTable
                data={listBitacoras?.records}
                isLoading={isLoadingListBitacoras}
                printPase={handlePrintPase}
                total={listBitacoras?.total_records}
                pagination={pagination}
                setPagination={setPagination}
                viewMode={viewMode}
                handleSalida={handleSalida}
                handleRegresarGafete={handleRegresarGafete}
                handleAgregarBadge={handleAgregarBadge}
                dateFilter={dateFilter}
                setDateFilter={setDateFilter}
                date1={date1}
                setDate1={setDate1}
                date2={date2}
                setDate2={setDate2}
                onFiltersConfigReady={setFiltersConfig}
                externalDynamicFilters={dynamicFilters}
                onExternalDynamicFiltersChange={setDynamicFilters}
                searchTags={searchTags}
              />
            </TabsContent>
            <TabsContent
              value="vehiculos"
              className="m-0 border-none p-0 focus-visible:ring-0 min-h-[400px]">
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-xl border border-dashed">
                <h3 className="text-lg font-semibold">Módulo de Vehículos</h3>
                <p>Contenido en desarrollo...</p>
              </div>
            </TabsContent>
            <TabsContent
              value="equipos"
              className="m-0 border-none p-0 focus-visible:ring-0 min-h-[400px]">
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-xl border border-dashed">
                <h3 className="text-lg font-semibold">Módulo de Equipos</h3>
                <p>Contenido en desarrollo...</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Modales */}
        {modalRegresarGafeteAbierto && bitacoraSeleccionada ? (
          <ReturnGafeteModal
            title={"Recibir Gafete"}
            id_bitacora={bitacoraSeleccionada._id}
            ubicacion={bitacoraSeleccionada.ubicacion}
            area={
              bitacoraSeleccionada?.status_visita?.toLowerCase() == "entrada"
                ? bitacoraSeleccionada.caseta_entrada
                : bitacoraSeleccionada.caseta_salida || ""
            }
            fecha_salida={bitacoraSeleccionada.fecha_salida}
            gafete={bitacoraSeleccionada.id_gafet}
            locker={bitacoraSeleccionada.id_locker || ""}
            tipo_movimiento={bitacoraSeleccionada?.status_visita?.toLowerCase()}
            modalRegresarGafeteAbierto={modalRegresarGafeteAbierto}
            setModalRegresarGafeteAbierto={setModalRegresarGafeteAbierto}
          />
        ) : null}

        {modalAgregarBadgeAbierto && bitacoraSeleccionada ? (
          <AddBadgeModal
            title={"Gafete"}
            status={"Disponible"}
            id_bitacora={bitacoraSeleccionada._id}
            pase_id={bitacoraSeleccionada.pase_id}
            tipo_movimiento={bitacoraSeleccionada.status_visita}
            ubicacion={bitacoraSeleccionada.ubicacion}
            area={
              bitacoraSeleccionada?.status_visita?.toLowerCase() == "entrada"
                ? bitacoraSeleccionada.caseta_entrada
                : bitacoraSeleccionada.caseta_salida || ""
            }
            modalAgregarBadgeAbierto={modalAgregarBadgeAbierto}
            setModalAgregarBadgeAbierto={setModalAgregarBadgeAbierto}
          />
        ) : null}

        {modalSalidaAbierto && bitacoraSeleccionada ? (
          <DoOutModal
            title={"Registar Salida"}
            id_bitacora={bitacoraSeleccionada.codigo_qr}
            ubicacion={bitacoraSeleccionada.ubicacion}
            area={
              bitacoraSeleccionada?.status_visita?.toLowerCase() == "entrada"
                ? bitacoraSeleccionada.caseta_entrada
                : bitacoraSeleccionada.caseta_salida || ""
            }
            fecha_salida={bitacoraSeleccionada.fecha_salida}
            modalSalidaAbierto={modalSalidaAbierto}
            setModalSalidaAbierto={setModalSalidaAbierto}
          />
        ) : null}

        <ForceQuitConfirmationModal
          open={modalForceQuitAbierto}
          locationName={ubicacionSeleccionada}
          isLoading={isForcingQuit}
          personasDentro={0}
          onClose={() => setModalForceQuitAbierto(false)}
          onConfirm={async () => {
            setIsForcingQuit(true);
            try {
              const data = await forceQuitAllPersons(ubicacionSeleccionada);
              const msg = data?.response?.data?.json?.msg;
              setModalForceQuitAbierto(false);
              toast.success(msg);
              await refreshData();
            } catch (error) {
              toast.error(
                "Error al registrar salida masiva, contacta soporte.",
              );
              console.error(error);
            } finally {
              setIsForcingQuit(false);
            }
          }}
        />
      </div>
    </div>
  );
};

export default BitacorasPage;
