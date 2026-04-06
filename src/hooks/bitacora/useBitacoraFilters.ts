import { useState, useEffect, useMemo } from "react";
import { useBoothStore } from "@/store/useBoothStore";
import { useShiftStore } from "@/store/useShiftStore";
import { getBitacoraFilters } from "@/services/endpoints";
import { useFilters } from "./useFilters";
import { dateToString } from "@/lib/utils";
import { useQueryParams } from "@/hooks/useQueryParams";

export const useBitacoraFilters = () => {
  const { filter, option } = useShiftStore();
  const { location } = useBoothStore();

  // Estado de ubicación (sincronizado con BoothStore)
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState<
    string | string[]
  >("");
  const [areaSeleccionada, setAreaSeleccionada] = useState<string>("todas");

  // Filtros dinámicos (Custom Selects)
  const [dynamicFilters, setDynamicFilters] = useState<Record<string, any>>({});

  // Sincronización inicial con URL Query Params usando el nuevo hook unificado
  const queryParams = useQueryParams((p) => {
    // Si la URL tiene parámetros, actualizamos filters. Si no los tiene, se mantienen los actuales
    // o se limpian según la lógica necesaria.

    // 1. Manejo de status (Dynamic Filters)
    setDynamicFilters((prev) => {
      // Si existe status en la URL, lo ponemos. Si NO existe, lo limpiamos de dynamicFilters
      // para evitar que se arrastren filtros de navegación anterior.
      const newFilters = { ...prev };
      if (p.status) {
        newFilters.status = p.status;
      } else {
        delete newFilters.status;
      }
      return newFilters;
    });

    // 2. Manejo de date (Active Date Filter)
    if (p.date) {
      const dateValue = Array.isArray(p.date) ? p.date[0] : p.date;
      setDateFilter(dateValue);
    } else {
      // Si no viene fecha en la URL, regresamos al valor por defecto (shiftStore) o vacío
      setDateFilter(filter || "");
    }
  });

  const dynamicFiltersArray = useMemo(() => {
    return Object.entries(dynamicFilters)
      .filter(
        ([, value]) =>
          value !== undefined &&
          value !== null &&
          value !== "" &&
          (!Array.isArray(value) || value.length > 0),
      )
      .map(([key, value]) => ({ key, value }));
  }, [dynamicFilters]);

  // Estado de fechas
  const [date1, setDate1] = useState<Date | "">("");
  const [date2, setDate2] = useState<Date | "">("");
  const [dateFilter, setDateFilter] = useState<string>(filter);

  const dates = useMemo(() => {
    if (date1 && date2) {
      return [dateToString(new Date(date1)), dateToString(new Date(date2))];
    }
    return [];
  }, [date1, date2]);

  // Otros estados de filtrado
  const [selectedOption, setSelectedOption] = useState<string[]>(option);
  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [isPersonasDentro, setIsPersonasDentro] = useState(false);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 100,
  });

  // Configuración de filtros desde API
  const { filters: bitacoraFilters, loadingFilters } = useFilters({
    key: "bitacora-filters",
    endpoint: getBitacoraFilters,
  });

  // Sincronización inicial con Session/Auth
  useEffect(() => {
    if (location) {
      setUbicacionSeleccionada(location);
    }
  }, [location]);

  return {
    // State
    activeDateFilter: dateFilter,
    appliedFilters: dynamicFiltersArray,
    dynamicFilters,
    endDate: date2,
    filtersConfig: bitacoraFilters,
    formattedDates: dates,
    hasPeopleInside: isPersonasDentro,
    isLoadingFilters: loadingFilters,
    pagination,
    queryParams,
    searchTags,
    selectedArea: areaSeleccionada,
    selectedLocation: ubicacionSeleccionada,
    selectedOptions: selectedOption,
    startDate: date1,

    // Setters
    setActiveDateFilter: setDateFilter,
    setDynamicFilters,
    setEndDate: setDate2,
    setHasPeopleInside: setIsPersonasDentro,
    setPagination,
    setSearchTags,
    setSelectedArea: setAreaSeleccionada,
    setSelectedLocation: setUbicacionSeleccionada,
    setSelectedOptions: setSelectedOption,
    setStartDate: setDate1,
  };
};

export const useBitacoraFiltersExtra = (filters: any) => {
  const {
    dynamicFilters,
    activeDateFilter,
    startDate,
    endDate,
    setSelectedLocation,
    setDynamicFilters,
    setActiveDateFilter,
    setStartDate,
    setEndDate,
  } = filters;

  const externalFilters = useMemo(
    () => ({
      dynamic: dynamicFilters,
      dateFilter: activeDateFilter,
      date1: startDate,
      date2: endDate,
    }),
    [dynamicFilters, activeDateFilter, startDate, endDate],
  );

  const onExternalFiltersChange = (newFilters: any) => {
    if (
      !newFilters.dynamic ||
      (Object.keys(newFilters.dynamic).length === 0 &&
        newFilters.dateFilter === "")
    ) {
      if (setSelectedLocation) setSelectedLocation([]);
      setDynamicFilters({});
      setActiveDateFilter("");
      setStartDate("");
      setEndDate("");
      return;
    }

    if (newFilters.dateFilter !== undefined)
      setActiveDateFilter(newFilters.dateFilter);
    if (newFilters.date1 !== undefined) setStartDate(newFilters.date1);
    if (newFilters.date2 !== undefined) setEndDate(newFilters.date2);
    if (newFilters.dynamic !== undefined) {
      if (
        setSelectedLocation &&
        JSON.stringify(newFilters.dynamic.ubicacion) !==
          JSON.stringify(dynamicFilters.ubicacion)
      ) {
        setSelectedLocation(newFilters.dynamic.ubicacion || []);
      }
      setDynamicFilters(newFilters.dynamic);
    }
  };

  const activeFiltersCount = useMemo(() => {
    return (
      (activeDateFilter && activeDateFilter !== "today" ? 1 : 0) +
      (startDate ? 1 : 0) +
      (endDate ? 1 : 0) +
      Object.values(dynamicFilters).filter((v) =>
        Array.isArray(v) ? v.length > 0 : !!v,
      ).length
    );
  }, [activeDateFilter, startDate, endDate, dynamicFilters]);

  return {
    externalFilters,
    onExternalFiltersChange,
    activeFiltersCount,
  };
};
