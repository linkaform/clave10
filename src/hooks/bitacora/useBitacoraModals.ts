import { useState } from "react";
import { Bitacora_record } from "@/components/table/bitacoras/bitacoras-columns";

export const useBitacoraModals = () => {
  const [isForceQuitOpen, setIsForceQuitOpen] = useState(false);
  const [isDoOutOpen, setIsDoOutOpen] = useState(false);
  const [isAddBadgeOpen, setIsAddBadgeOpen] = useState(false);
  const [isReturnGafeteOpen, setIsReturnGafeteOpen] = useState(false);

  const [selectedRecord, setSelectedRecord] = useState<Bitacora_record | null>(
    null,
  );

  // Funciones específicas para abrir los modales con el registro
  const openDoOutModal = (record: Bitacora_record) => {
    setSelectedRecord(record);
    setIsDoOutOpen(true);
  };

  const openReturnGafeteModal = (record: Bitacora_record) => {
    setSelectedRecord(record);
    setIsReturnGafeteOpen(true);
  };

  const openAddBadgeModal = (record: Bitacora_record) => {
    setSelectedRecord(record);
    setIsAddBadgeOpen(true);
  };

  return {
    // UI State
    isForceQuitOpen,
    isDoOutOpen,
    isAddBadgeOpen,
    isReturnGafeteOpen,
    selectedRecord,

    // Setters directos para cerrar
    setIsForceQuitOpen,
    setIsDoOutOpen,
    setIsAddBadgeOpen,
    setIsReturnGafeteOpen,
    setSelectedRecord,

    // Métodos de acción
    openDoOutModal,
    openReturnGafeteModal,
    openAddBadgeModal,
  };
};
