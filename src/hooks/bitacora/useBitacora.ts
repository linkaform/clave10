import { useState } from "react";
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

    // Acciones específicas mapeadas
    handleAgregarBadge: modals.openAddBadgeModal,
    handleRegresarGafete: modals.openReturnGafeteModal,
    handleSalida: modals.openDoOutModal,
  };
};
