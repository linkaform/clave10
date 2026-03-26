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

const BitacorasPage = () => {
  const {
    filtersConfig,
    selectedRecord,
    dynamicFilters,
    setDynamicFilters,
    startDate,
    endDate,
    activeDateFilter,
    handleAgregarBadge,
    handlePrintPase,
    handleRegresarGafete,
    handleSalida,
    isForcingQuit,
    isLoadingListBitacoras,
    hasPeopleInside,
    listBitacoras,
    isAddBadgeOpen,
    isForceQuitOpen,
    isReturnGafeteOpen,
    isDoOutOpen,
    pagination,
    refreshData,
    searchTags,
    setStartDate,
    setEndDate,
    setActiveDateFilter,
    setIsForcingQuit,
    setIsAddBadgeOpen,
    setIsForceQuitOpen,
    setIsReturnGafeteOpen,
    setIsDoOutOpen,
    setPagination,
    setSearchTags,
    setViewMode,
    selectedLocation,
    viewMode,
    externalFilters,
    onExternalFiltersChange,
    activeFiltersCount,
  } = useBitacora();

  const [selectedTab, setSelectedTab] = React.useState("personal");
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  return (
    <div className="w-full relative">
      {viewMode === "table" && (
        <FloatingFiltersDrawer
          isOpen={isSidebarOpen}
          onOpenChange={setIsSidebarOpen}
          activeFiltersCount={activeFiltersCount}
          filters={externalFilters}
          onFiltersChange={onExternalFiltersChange}
          filtersConfig={filtersConfig}
        />
      )}
      <div className="p-6 space-y-4 pt-3 w-full">
        {/* FILA ÚNICA: Título -> Search -> Tabs -> ViewModes */}
        <div className="flex items-center justify-between w-full gap-4 sticky top-[68px] z-40 bg-white backdrop-blur-sm py-2">
          {/* 1. Título (Izquierda) */}
          <div className="flex items-baseline gap-2 min-w-fit">
            <h1 className="text-xl font-bold text-slate-900 whitespace-nowrap">
              Bitácora de Entradas & Salidas
            </h1>
            <span className="text-sm font-light text-slate-500 whitespace-nowrap">
              {listBitacoras?.total_records || 0} registros{" "}
              {activeDateFilter === "today"
                ? "de hoy"
                : activeDateFilter === ""
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
            {hasPeopleInside && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setIsForceQuitOpen(true)}
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
                date1={startDate}
                date2={endDate}
                dateFilter={activeDateFilter}
                externalDynamicFilters={dynamicFilters}
                filtersConfig={filtersConfig}
                handleAgregarBadge={handleAgregarBadge}
                handleRegresarGafete={handleRegresarGafete}
                handleSalida={handleSalida}
                isLoading={isLoadingListBitacoras}
                onExternalDynamicFiltersChange={setDynamicFilters}
                pagination={pagination}
                printPase={handlePrintPase}
                searchTags={searchTags}
                setDate1={setStartDate}
                setDate2={setEndDate}
                setDateFilter={setActiveDateFilter}
                setPagination={setPagination}
                total={listBitacoras?.total_records}
                viewMode={viewMode}
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
        {isReturnGafeteOpen && selectedRecord ? (
          <ReturnGafeteModal
            title={"Recibir Gafete"}
            id_bitacora={selectedRecord._id}
            ubicacion={selectedRecord.ubicacion}
            area={
              selectedRecord?.status_visita?.toLowerCase() == "entrada"
                ? selectedRecord.caseta_entrada
                : selectedRecord.caseta_salida || ""
            }
            fecha_salida={selectedRecord.fecha_salida}
            gafete={selectedRecord.id_gafet}
            locker={selectedRecord.id_locker || ""}
            tipo_movimiento={selectedRecord?.status_visita?.toLowerCase()}
            modalRegresarGafeteAbierto={isReturnGafeteOpen}
            setModalRegresarGafeteAbierto={setIsReturnGafeteOpen}
          />
        ) : null}

        {isAddBadgeOpen && selectedRecord ? (
          <AddBadgeModal
            title={"Gafete"}
            status={"Disponible"}
            id_bitacora={selectedRecord._id}
            pase_id={selectedRecord.pase_id}
            tipo_movimiento={selectedRecord.status_visita}
            ubicacion={selectedRecord.ubicacion}
            area={
              selectedRecord?.status_visita?.toLowerCase() == "entrada"
                ? selectedRecord.caseta_entrada
                : selectedRecord.caseta_salida || ""
            }
            modalAgregarBadgeAbierto={isAddBadgeOpen}
            setModalAgregarBadgeAbierto={setIsAddBadgeOpen}
          />
        ) : null}

        {isDoOutOpen && selectedRecord ? (
          <DoOutModal
            title={"Registar Salida"}
            id_bitacora={selectedRecord.codigo_qr}
            ubicacion={selectedRecord.ubicacion}
            area={
              selectedRecord?.status_visita?.toLowerCase() == "entrada"
                ? selectedRecord.caseta_entrada
                : selectedRecord.caseta_salida || ""
            }
            fecha_salida={selectedRecord.fecha_salida}
            modalSalidaAbierto={isDoOutOpen}
            setModalSalidaAbierto={setIsDoOutOpen}
          />
        ) : null}

        <ForceQuitConfirmationModal
          open={isForceQuitOpen}
          locationName={selectedLocation}
          isLoading={isForcingQuit}
          personasDentro={0}
          onClose={() => setIsForceQuitOpen(false)}
          onConfirm={async () => {
            setIsForcingQuit(true);
            try {
              const data = await forceQuitAllPersons(selectedLocation);
              const msg = data?.response?.data?.json?.msg;
              setIsForceQuitOpen(false);
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
