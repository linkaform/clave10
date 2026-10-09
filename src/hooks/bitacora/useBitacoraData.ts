import { useMemo } from "react";
import { SearchFacet } from "@/components/common/FacetSearch";
import { useBitacoras } from "./useBitacoras";
import { useGetStats } from "../useGetStats";
import {
  processBitacorasE,
  processBitacorasV,
} from "@/utils/processBitacoraRecord";

export interface BitacoraDataProps {
  selectedLocation: string | string[];
  selectedArea: string;
  selectedOptions: string[];
  startDate: Date | "";
  endDate: Date | "";
  formattedDates: string[];
  activeDateFilter: string;
  appliedFilters?: { key: string; value: string }[];
  pagination: { pageIndex: number; pageSize: number };
  textFacets?: SearchFacet[];
  selectedTab?: string;
}

export const useBitacoraData = ({
  selectedLocation,
  selectedArea,
  selectedOptions,
  formattedDates,
  activeDateFilter,
  appliedFilters,
  pagination,
  textFacets = [],
  selectedTab = "personal",
}: BitacoraDataProps) => {
  const isEnabled = selectedLocation && selectedArea ? true : false;
  // Vehículos y Equipos piden al back una fila por vehículo/equipo; Personal, una por bitácora.
  const desglose =
    selectedTab === "vehiculos" || selectedTab === "equipos" ? selectedTab : "";

  const { listBitacoras, isLoadingListBitacoras, refetchBitacoras } =
    useBitacoras(
      selectedLocation,
      selectedArea === "todas" ? "" : selectedArea,
      selectedOptions,
      isEnabled,
      formattedDates[0],
      formattedDates[1],
      activeDateFilter,
      appliedFilters,
      pagination.pageSize,
      pagination.pageIndex * pagination.pageSize,
      textFacets,
      desglose,
    );

  const { data: stats, refetch: refetchStats } = useGetStats(
    isEnabled,
    selectedLocation,
    selectedArea === "todas" ? "" : selectedArea,
    "Bitacoras",
    undefined,
    undefined,
    formattedDates[0],
    formattedDates[1],
    activeDateFilter,
    appliedFilters,
  );

  const refreshData = async () => {
    await Promise.all([refetchBitacoras(), refetchStats()]);
  };

  const recordsVehiculos = useMemo(
    () => (desglose === "vehiculos" ? processBitacorasV(listBitacoras?.records || []) : []),
    [desglose, listBitacoras?.records],
  );

  const recordsEquipos = useMemo(
    () => (desglose === "equipos" ? processBitacorasE(listBitacoras?.records || []) : []),
    [desglose, listBitacoras?.records],
  );

  return {
    listBitacoras,
    isLoadingListBitacoras,
    recordsVehiculos,
    recordsEquipos,
    stats,
    refreshData,
  };
};
