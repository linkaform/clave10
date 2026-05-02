import { useState, useEffect } from "react";
import {
  useBitacoraFilters,
  useBitacoraFiltersExtra,
} from "./useBitacoraFilters";
import { useBitacoraModals } from "./useBitacoraModals";
import { useBitacoraData } from "./useBitacoraData";
import { useBitacoraActions } from "./useBitacoraActions";

export const useBitacora = () => {
  const [viewMode, setViewMode] = useState<"table" | "photos" | "list">(
    "photos",
  );

  const filters = useBitacoraFilters();
  const modals = useBitacoraModals();
  const data = useBitacoraData({
    ...filters,
  });
  const actions = useBitacoraActions();

  // Lógica extra para el Drawer de filtros externos
  const extraFilters = useBitacoraFiltersExtra(filters);

  // Manejo de Tabs desde la URL
  const initialTab = filters.queryParams.tab?.[0] || "personal";
  const [selectedTab, setSelectedTab] = useState(initialTab);

  // Sincronizar el estado de la pestaña si cambia en la URL
  useEffect(() => {
    if (filters.queryParams.tab?.[0]) {
      setSelectedTab(filters.queryParams.tab[0]);
    } else {
      setSelectedTab("personal");
    }
  }, [filters.queryParams.tab]);

  // Mapeamos para mantener nombres limpios
  return {
    ...filters,
    ...modals,
    ...data,
    ...actions,
    ...extraFilters,

    // Vista local
    viewMode,
    setViewMode,

    // Tabs
    selectedTab,
    setSelectedTab,

    // Acciones específicas mapeadas
    handleAgregarBadge: modals.openAddBadgeModal,
    handleRegresarGafete: modals.openReturnGafeteModal,
    handleSalida: modals.openDoOutModal,
  };
};
