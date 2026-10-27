import React from "react";
import { PhotoGridActionButtons } from "@/components/Bitacoras/PhotoGrid/PhotoGridActionButtons";
import { Trash2, MessageSquarePlus, Pencil, Printer } from "lucide-react";
import { Incidencia_record } from "@/components/table/incidencias/incidencias-columns";
import { generarComprobanteIncidencia } from "@/lib/generar-comprobante";
import { Tooltip } from "@/components/ui/tooltip";

interface IncidenciasActionButtonsProps {
  incidencia: Incidencia_record;
  handleEditar: (incidencia: Incidencia_record) => void;
  handleSeguimiento: (incidencia: Incidencia_record) => void;
  handleEliminar?: (incidencia: Incidencia_record) => void;
}

// Botón redondo de acción con hover y tooltip con el nombre de la acción.
// Lo usan las tarjetas y la tabla de incidencias.
export const BotonAccion = ({
  tooltip,
  onClick,
  peligro = false,
  children,
  ...rest
}: {
  tooltip: string;
  onClick: () => void;
  peligro?: boolean;
  children: React.ReactNode;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "children">) => (
  <Tooltip
    content={tooltip}
    contentClassName="mb-1.5 min-w-0 whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium text-gray-800 shadow-md">
    <button
        type="button"
        aria-label={tooltip}
        onClick={onClick}
        {...rest}
        className={`flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-slate-600 transition-all duration-200 active:scale-95 ${
          peligro
            ? "hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            : "hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
        }`}>
      {children}
    </button>
  </Tooltip>
);

export const IncidenciasActionButtons = ({
  incidencia,
  handleEditar,
  handleSeguimiento,
  handleEliminar,
}: IncidenciasActionButtonsProps) => (
  <PhotoGridActionButtons
      actions={[
        <BotonAccion key="edit" tooltip="Editar" onClick={() => handleEditar(incidencia)}>
          <Pencil className="w-4 h-4" />
        </BotonAccion>,
        <BotonAccion key="seguimiento" tooltip="Agregar seguimiento" onClick={() => handleSeguimiento(incidencia)}>
          <MessageSquarePlus className="w-4 h-4" />
        </BotonAccion>,
        <BotonAccion key="comprobante" tooltip="Imprimir comprobante" onClick={() => generarComprobanteIncidencia(incidencia)}>
          <Printer className="w-4 h-4" />
        </BotonAccion>,
        ...(handleEliminar
          ? [
              <BotonAccion key="delete" tooltip="Eliminar" peligro onClick={() => handleEliminar(incidencia)}>
                <Trash2 className="w-4 h-4" />
              </BotonAccion>,
            ]
          : []),
      ]}
  />
);
