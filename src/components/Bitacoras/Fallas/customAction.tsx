import React from "react";
import { PhotoGridActionButtons } from "@/components/Bitacoras/PhotoGrid/PhotoGridActionButtons";
import { Trash2, ListChecks } from "lucide-react";
import { Fallas_record } from "@/components/table/incidencias/fallas/fallas-columns";

interface FallasActionButtonsProps {
  falla: Fallas_record;
  handleCerrar: (falla: Fallas_record) => void;
  handleEliminar: (falla: Fallas_record) => void;
}

export const FallasActionButtons = ({
  falla,
  handleCerrar,
  handleEliminar,
}: FallasActionButtonsProps) => {
  const iconClass = (disabled: boolean) =>
    `p-1.5 rounded-full transition-all duration-200 bg-white/90 hover:bg-white shadow-sm border border-slate-100 ${
      disabled
        ? "text-slate-300 cursor-not-allowed opacity-50"
        : "cursor-pointer hover:shadow-md text-slate-700 hover:text-blue-600 active:scale-95"
    }`;

  return (
    <PhotoGridActionButtons
      actions={[
        <div
          key="cerrar"
          className={iconClass(false)}
          title="Cerrar falla"
          onClick={() => handleCerrar(falla)}>
          <ListChecks className="w-4 h-4" />
        </div>,
        <div
          key="delete"
          className={iconClass(false)}
          title="Eliminar falla"
          onClick={() => handleEliminar(falla)}>
          <Trash2 className="w-4 h-4 text-red-500" />
        </div>,
      ]}
    />
  );
};