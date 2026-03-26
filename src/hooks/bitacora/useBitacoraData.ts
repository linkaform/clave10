import { useMemo } from "react";
import { useBitacoras } from "../Bitacora/useBitacoras";
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
}

export const useBitacoraData = ({
  selectedLocation,
  selectedArea,
  selectedOptions,
  formattedDates,
  activeDateFilter,
  appliedFilters,
  pagination,
}: BitacoraDataProps) => {
  const isEnabled = selectedLocation && selectedArea ? true : false;

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
    );

  const { data: stats, refetch: refetchStats } = useGetStats(
    isEnabled,
    selectedLocation,
    selectedArea === "todas" ? "" : selectedArea,
    "Bitacoras",
  );

  const refreshData = async () => {
    await Promise.all([refetchBitacoras(), refetchStats()]);
  };

  const recordsVehiculos = useMemo(
    () => processBitacorasV(listBitacoras?.records || []),
    [listBitacoras?.records],
  );

  const recordsEquipos = useMemo(
    () => processBitacorasE(listBitacoras?.records || []),
    [listBitacoras?.records],
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
