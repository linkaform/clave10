"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import RondinesTable from "@/components/table/rondines/table";
import { useShiftStore } from "@/store/useShiftStore";
import { dateToString } from "@/lib/utils";
import { useGetListRondines } from "@/hooks/Rondines/useGetListRondines";
import IncidenciasRondinesTable from "@/components/table/incidencias-rondines/table";
import { useIncidenciaRondin } from "@/hooks/Rondines/useRondinIncidencia";
import { RondinesBitacoraTable } from "@/components/table/rondines/bitacoras-table";
import { useBoothStore } from "@/store/useBoothStore";

const RondinesContent = () => {
  const searchParams = useSearchParams();
  const { location } = useBoothStore();
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState<string>("");
  const { filter } = useShiftStore();
  const [dateFilter, setDateFilter] = useState<string>(filter);
  const [date1, setDate1] = useState<Date | "">("");
  const [date2, setDate2] = useState<Date | "">("");
  const [dates, setDates] = useState<string[]>([]);
  const { listRondines } = useGetListRondines(true, dates[0], dates[1], 100, 0);
  const [activeTab, setActiveTab] = useState("Rondines");
  const [openModal, setOpenModal] = useState(false);
  const [selectedIncidencias, setSelectedIncidencias] = useState<string[]>([]);
  const { listIncidenciasRondin } = useIncidenciaRondin("", "");

  useEffect(() => {
    if (location) setUbicacionSeleccionada(location);
  }, [location]);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam) {
      const map: Record<string, string> = {
        rondines: "Rondines",
        bitacora: "Bitacora",
        incidencias: "Incidencias",
        fotos: "Fotos",
        calendario: "Calendario",
      };
      const matched = map[tabParam.toLowerCase()];
      if (matched) setActiveTab(matched);
    }
  }, [searchParams]);

  const Filter = () => {
    setDates([dateToString(new Date(date1)), dateToString(new Date(date2))]);
  };

  const resetTableFilters = () => {
    setDate1("");
    setDate2("");
    setDateFilter("");
  };

  return (
    <div className="">
      <div className="flex flex-col">
        <div className="p-3 w-full mx-auto">
          <div className="flex items-baseline gap-2 min-w-fit mb-2">
            <h1 className="text-xl font-bold text-slate-900 whitespace-nowrap">
              Registro y Seguimiento de Rondines
            </h1>
          </div>

          <div>
            <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
              <TabsContent value="Bitacora">
                  <RondinesBitacoraTable showTabs={true} ubicacion={ubicacionSeleccionada} />
              </TabsContent>

              <TabsContent value="Incidencias">
                <IncidenciasRondinesTable
                  showTabs={true}
                  data={listIncidenciasRondin}
                  isLoading={false}
                  setSelectedIncidencias={setSelectedIncidencias}
                  selectedIncidencias={selectedIncidencias}
                  date1={date1} date2={date2}
                  setDate1={setDate1} setDate2={setDate2}
                  dateFilter={dateFilter} setDateFilter={setDateFilter}
                  Filter={Filter} resetTableFilters={resetTableFilters}
                  openModal={openModal} setOpenModal={setOpenModal}
                />
              </TabsContent>

              <TabsContent value="Rondines">
                <RondinesTable
                  data={listRondines}
                  isLoading={false}
                  setDate1={setDate1} setDate2={setDate2}
                  date1={date1} date2={date2}
                  dateFilter={dateFilter} setDateFilter={setDateFilter}
                  Filter={Filter} resetTableFilters={resetTableFilters}
                  setActiveTab={setActiveTab} activeTab={activeTab}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

const RondinesPage = () => (
  <Suspense fallback={<div className="p-6 text-slate-400 text-sm">Cargando...</div>}>
    <RondinesContent />
  </Suspense>
);

export default RondinesPage;