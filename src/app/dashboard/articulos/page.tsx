/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Archive, CircleHelp, Package } from "lucide-react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import PageTitle from "@/components/page-title";
import { useArticulosPerdidos } from "@/hooks/useArticulosPerdidos";
import ArticulosPerdidosTable from "@/components/table/articulos/pendientes/table";
import { AddArticuloModal } from "@/components/modals/add-article-lost";
import ArticulosConTable from "@/components/table/articulos/concecionados/table";
import { useArticulosConcesionados } from "@/hooks/useArticulosConcesionados";
import PaqueteriaTable from "@/components/table/articulos/paqueteria/table";
import { usePaqueteria } from "@/hooks/usePaqueteria";
import { useShiftStore } from "@/store/useShiftStore";
import { AddPaqueteriaModal } from "@/components/modals/add-paqueteria";
import { dateToString } from "@/lib/utils";
import { toast } from "sonner";
import ChangeLocation from "@/components/changeLocation";
import { useGetStats } from "@/hooks/useGetStats";
import { useBoothStore } from "@/store/useBoothStore";
import { AddArticuloConModal } from "@/components/modals/add-article.con";

const TAB_MAP: Record<string, string> = {
  paqueteria: "Paqueteria",
  articulos_concesionados: "Concecionados",
  articulos_perdidos: "Perdidos",
};

const ArticulosPage = () => {
  return (
    <React.Suspense fallback={<div>Cargando...</div>}>
      <ArticulosContent />
    </React.Suspense>
  );
};

const ArticulosContent = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const actionParam = searchParams.get("action");
  const statusParam = searchParams.get("status");

  const { location } = useBoothStore();
  console.log("LOCATION", location);
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState(
    location || "Planta Monterrey",
  );
  const [areaSeleccionada, setAreaSeleccionada] = useState("todas");

  const [date1, setDate1] = useState<Date | "">("");
  const [date2, setDate2] = useState<Date | "">("");
  const [dates, setDates] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<string>("");
  const [statusPaqueteria, setStatusPaqueteria] = useState<string>("");
  const [statusPerdidos, setStatusPerdidos] = useState<string>("");
  const [statusConcesionados, setStatusConcesionados] = useState<string>("");

  const { data: stats } = useGetStats(
    true,
    ubicacionSeleccionada,
    areaSeleccionada == "todas" ? "" : areaSeleccionada,
    "Articulos",
  );

  const { listArticulosPerdidos, isLoadingListArticulosPerdidos } =
    useArticulosPerdidos(
      ubicacionSeleccionada,
      areaSeleccionada == "todas" ? "" : areaSeleccionada,
      statusPerdidos,
      true,
      dates[0],
      dates[1],
      dateFilter,
    );

  const { listArticulosCon, isLoadingListArticulosCon } =
    useArticulosConcesionados(
      ubicacionSeleccionada,
      areaSeleccionada == "todas" ? "" : areaSeleccionada,
      statusConcesionados,
      true,
      dates[0],
      dates[1],
      dateFilter,
    );

  const { listPaqueteria, isLoadingListPaqueteria } = usePaqueteria(
    ubicacionSeleccionada,
    areaSeleccionada == "todas" ? "" : areaSeleccionada,
    statusPaqueteria,
    true,
    dates[0],
    dates[1],
    dateFilter,
  );

  const { tab, setTab } = useShiftStore();

  const getInitialTab = () => {
    if (tabParam) {
      const mappedTab = TAB_MAP[tabParam.toLowerCase()];
      if (mappedTab) return mappedTab;

      const normalized =
        tabParam.charAt(0).toUpperCase() + tabParam.slice(1).toLowerCase();
      if (["Paqueteria", "Concecionados", "Perdidos"].includes(normalized)) {
        return normalized;
      }
    }
    return tab ? tab : "Paqueteria";
  };

  const [selectedTab, setSelectedTab] = useState<string>(getInitialTab());

  // Sincronizar selectedTab con el parámetro 'tab' de la URL
  useEffect(() => {
    if (tabParam) {
      const mappedTab = TAB_MAP[tabParam.toLowerCase()];
      if (mappedTab) {
        setSelectedTab(mappedTab);
      } else {
        const normalized =
          tabParam.charAt(0).toUpperCase() + tabParam.slice(1).toLowerCase();
        if (["Paqueteria", "Concecionados", "Perdidos"].includes(normalized)) {
          setSelectedTab(normalized);
        }
      }
    }
  }, [tabParam]);

  // Manejar el parámetro 'action' de la URL
  useEffect(() => {
    if (actionParam === "nuevo_paquete") {
      setIsSuccessPaq(true);
    }
    if (actionParam === "nuevo_articulo_perdido") {
      setIsSuccess(true);
    }
    if (actionParam === "nuevo_articulo_concesionado") {
      setIsSuccessCon(true);
    }
  }, [actionParam]);

  // Sincronizar status con el parámetro 'status' de la URL de forma independiente
  useEffect(() => {
    const currentStatus = statusParam || "";
    if (selectedTab === "Paqueteria") setStatusPaqueteria(currentStatus);
    if (selectedTab === "Perdidos") setStatusPerdidos(currentStatus);
    if (selectedTab === "Concecionados") setStatusConcesionados(currentStatus);
  }, [statusParam, selectedTab]);

  const [isSuccess, setIsSuccess] = useState(false);
  const [isSuccessCon, setIsSuccessCon] = useState(false);
  const [isSuccessPaq, setIsSuccessPaq] = useState(false);

  const [modalData] = useState<any>(null);
  const [selectedArticulos, setSelectedArticulos] = useState<string[]>([]);
  console.log(selectedArticulos);
  useEffect(() => {
    if (tab) {
      setTab("");
    }
  }, []);

  useEffect(() => {
    setUbicacionSeleccionada(location || "");
    setAreaSeleccionada("todas");
  }, []);

  const openModal = () => setIsSuccess(true);

  const openModalCon = () => setIsSuccessCon(true);

  const openModalPaq = () => setIsSuccessPaq(true);

  const handleOpenChange = (value: React.SetStateAction<boolean>) => {
    const open = typeof value === "function" ? value(isSuccess) : value;
    setIsSuccess(open);
    if (!open && actionParam === "nuevo_articulo_perdido") {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("action");
      router.replace(`${pathname}?${params.toString()}`);
    }
  };

  const handleOpenChangePaq = (value: React.SetStateAction<boolean>) => {
    const open = typeof value === "function" ? value(isSuccessPaq) : value;
    setIsSuccessPaq(open);
    if (!open && actionParam === "nuevo_paquete") {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("action");
      router.replace(`${pathname}?${params.toString()}`);
    }
  };

  const handleOpenChangeCon = (value: React.SetStateAction<boolean>) => {
    const open = typeof value === "function" ? value(isSuccessCon) : value;
    setIsSuccessCon(open);
    if (!open && actionParam === "nuevo_articulo_concesionado") {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("action");
      router.replace(`${pathname}?${params.toString()}`);
    }
  };

  const closeModalPaq = () => {
    handleOpenChangePaq(false);
  };

  const Filter = () => {
    if (date1 && date2) {
      const f1 = dateToString(new Date(date1));
      const f2 = dateToString(new Date(date2));

      setDates([f1, f2]);
    } else {
      toast.error("Escoge un rango de fechas.");
    }
  };

  const handleTabChangeTab = (newTab: any) => {
    setSelectedTab(newTab);
  };

  const resetTableFilters = () => {
    setDate1("");
    setDate2("");
    setDateFilter("");
    setStatusPaqueteria("");
    setStatusPerdidos("");
    setStatusConcesionados("");
  };

  const handleTabChange = (tab: string, option: string, estado: string) => {
    setDateFilter(option);
    if (tab === "Paqueteria") setStatusPaqueteria(estado);
    if (tab === "Perdidos") setStatusPerdidos(estado);
    if (tab === "Concecionados") setStatusConcesionados(estado);
    setSelectedTab(tab);
  };

  return (
    <div>
      <div className="p-6 space-y-1 pt-3 w-full mx-auto">
        <div className="flex justify-between">
          <div>
            <PageTitle title="Registro y Seguimiento de Artículos" />
          </div>

          <div className="flex items-center gap-5">
            <div className="w-1/2">
              <ChangeLocation
                ubicacionSeleccionada={ubicacionSeleccionada}
                areaSeleccionada={areaSeleccionada}
                setUbicacionSeleccionada={setUbicacionSeleccionada}
                setAreaSeleccionada={setAreaSeleccionada}
              />
            </div>

            {selectedTab === "Concecionados" ? (
              <>
                <div
                  className={`border p-4 px-12 py-1 rounded-md cursor-pointer transition ${
                    statusConcesionados === "abierto"
                      ? "bg-blue-100"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={() =>
                    handleTabChange("Concecionados", "", "abierto")
                  }>
                  <div className="flex gap-6">
                    <Archive className="text-primary w-10 h-10" />
                    <span className="flex items-center font-bold text-4xl">
                      {stats?.articulos_abiertos || 0}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="h-1 w-1/2 bg-cyan-100" />
                    <div className="h-1 w-1/2 bg-blue-500" />
                  </div>
                  <span className="text-md">Artículos Abiertos</span>
                </div>

                <div
                  className={`border p-4 px-12 py-1 rounded-md cursor-pointer transition ${
                    statusConcesionados === "parcial"
                      ? "bg-blue-100"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={() =>
                    handleTabChange("Concecionados", "", "parcial")
                  }>
                  <div className="flex gap-6">
                    <Archive className="text-primary w-10 h-10" />
                    <span className="flex items-center font-bold text-4xl">
                      {stats?.articulos_parciales || 0}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <div className="h-1 w-1/2 bg-cyan-100" />
                    <div className="h-1 w-1/2 bg-blue-500" />
                  </div>
                  <span className="text-md">Artículos Parciales</span>
                </div>

                <div
                  className={`border p-4 px-12 py-1 rounded-md cursor-pointer transition ${
                    statusConcesionados === "devuelto"
                      ? "bg-blue-100"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={() =>
                    handleTabChange("Concecionados", "", "devuelto")
                  }>
                  <div className="flex gap-6">
                    <Archive className="text-primary w-10 h-10" />
                    <span className="flex items-center font-bold text-4xl">
                      {stats?.articulos_devueltos || 0}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <div className="h-1 w-1/2 bg-cyan-100" />
                    <div className="h-1 w-1/2 bg-blue-500" />
                  </div>

                  <span className="text-md">Artículos Devueltos</span>
                </div>
              </>
            ) : (
              <>
                <div
                  className={`border p-4 px-12 py-1 rounded-md cursor-pointer transition ${
                    selectedTab == "Paqueteria"
                      ? "bg-blue-100"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={() => handleTabChange("Paqueteria", "today", "")}>
                  <div className="flex gap-6">
                    <Package className="text-primary w-10 h-10" />
                    <span className="flex items-center font-bold text-4xl">
                      {stats?.paquetes_recibidos}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <div className="h-1 w-1/2 bg-cyan-100" />
                    <div className="h-1 w-1/2 bg-blue-500" />
                  </div>

                  <span className="text-md">Paquetería</span>
                </div>

                <div
                  className={`border p-4 px-12 py-1 rounded-md cursor-pointer transition ${
                    selectedTab == "Concecionados"
                      ? "bg-blue-100"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={() => handleTabChange("Concecionados", "", "")}>
                  <div className="flex gap-6">
                    <Archive className="text-primary w-10 h-10" />
                    <span className="flex items-center font-bold text-4xl">
                      {stats?.articulos_concesionados_pendientes}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <div className="h-1 w-1/2 bg-cyan-100" />
                    <div className="h-1 w-1/2 bg-blue-500" />
                  </div>

                  <span className="text-md">Artículos Concesionados</span>
                </div>

                <div
                  className={`border p-4 px-12 py-1 rounded-md cursor-pointer transition ${
                    selectedTab == "Perdidos"
                      ? "bg-blue-100"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={() => handleTabChange("Perdidos", "", "")}>
                  <div className="flex gap-6">
                    <CircleHelp className="text-primary w-10 h-10" />
                    <span className="flex items-center font-bold text-4xl">
                      {stats?.articulos_perdidos}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <div className="h-1 w-1/2 bg-cyan-100" />
                    <div className="h-1 w-1/2 bg-blue-500" />
                  </div>

                  <span className="text-md">Artículos Perdidos</span>
                </div>
              </>
            )}
          </div>
        </div>

        <Tabs value={selectedTab} onValueChange={handleTabChangeTab}>
          <TabsContent value="Paqueteria">
            <PaqueteriaTable
              data={listPaqueteria}
              isLoadingListPaqueteria={isLoadingListPaqueteria}
              openModal={openModalPaq}
              setSelectedArticulos={setSelectedArticulos}
              date1={date1}
              date2={date2}
              setDate1={setDate1}
              setDate2={setDate2}
              dateFilter={dateFilter}
              setDateFilter={setDateFilter}
              Filter={Filter}
              resetTableFilters={resetTableFilters}
            />
          </TabsContent>

          <TabsContent value="Concecionados">
            <ArticulosConTable
              data={listArticulosCon ?? []}
              isLoadingListArticulosCon={isLoadingListArticulosCon}
              openModal={openModalCon}
              setSelectedArticulos={setSelectedArticulos}
              date1={date1}
              date2={date2}
              setDate1={setDate1}
              setDate2={setDate2}
              dateFilter={dateFilter}
              setDateFilter={setDateFilter}
              Filter={Filter}
              resetTableFilters={resetTableFilters}
            />
          </TabsContent>

          <TabsContent value="Perdidos">
            <ArticulosPerdidosTable
              data={listArticulosPerdidos}
              isLoadingListArticulosPerdidos={isLoadingListArticulosPerdidos}
              openModal={openModal}
              setSelectedArticulos={setSelectedArticulos}
              date1={date1}
              date2={date2}
              setDate1={setDate1}
              setDate2={setDate2}
              dateFilter={dateFilter}
              setDateFilter={setDateFilter}
              Filter={Filter}
              resetTableFilters={resetTableFilters}
            />
          </TabsContent>
        </Tabs>

        <AddArticuloModal
          title={"Crear Artículo Perdido"}
          data={modalData}
          isSuccess={isSuccess}
          setIsSuccess={handleOpenChange}
          onClose={() => handleOpenChange(false)}
        />

        <AddArticuloConModal
          isSuccess={isSuccessCon}
          setIsSuccess={handleOpenChangeCon}
          initialData={{}}>
          <div></div>
        </AddArticuloConModal>

        <AddPaqueteriaModal
          title={"Crear Paquetería"}
          isSuccess={isSuccessPaq}
          setIsSuccess={handleOpenChangePaq}
          onClose={closeModalPaq}
        />
      </div>
    </div>
  );
};

export default ArticulosPage;
