import React from "react";
import { PhotoGridActionButtons } from "@/components/Bitacoras/PhotoGrid/PhotoGridActionButtons";
import { Trash2, ListChecks, Edit } from "lucide-react";
import { Incidencia_record } from "@/components/table/incidencias/incidencias-columns";

interface IncidenciasActionButtonsProps {
  incidencia: Incidencia_record;
  handleEditar: (incidencia: Incidencia_record) => void;
  handleSeguimiento: (incidencia: Incidencia_record) => void;
  handleEliminar: (incidencia: Incidencia_record) => void;
}

export const IncidenciasActionButtons = ({
  incidencia,
  handleEditar,
  handleSeguimiento,
  handleEliminar,
}: IncidenciasActionButtonsProps) => {
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
          key="edit"
          className={iconClass(false)}
          title="Editar incidencia"
          onClick={() => handleEditar(incidencia)}>
          <Edit className="w-4 h-4" />
        </div>,
        <div
          key="seguimiento"
          className={iconClass(false)}
          title="Seguimiento"
          onClick={() => handleSeguimiento(incidencia)}>
          <ListChecks className="w-4 h-4" />
        </div>,
        <div
          key="delete"
          className={iconClass(false)}
          title="Eliminar incidencia"
          onClick={() => handleEliminar(incidencia)}>
          <Trash2 className="w-4 h-4 text-red-500" />
        </div>,
      ]}
    />
  );
};