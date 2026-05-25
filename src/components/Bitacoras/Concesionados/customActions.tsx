import React from "react";
import { PhotoGridActionButtons } from "@/components/Bitacoras/PhotoGrid/PhotoGridActionButtons";
import { Articulo_con_record } from "@/components/table/articulos/concecionados/concecionados-columns";
import { DetalleDelSeguimiento } from "@/components/modals/concesionados-detalle-del-seguimiento";
import { ArrowLeftRight } from "lucide-react";

interface ConcesionadosActionButtonsProps {
  concesionado: Articulo_con_record;
}

export const ConcesionadosActionButtons = ({ concesionado }: ConcesionadosActionButtonsProps) => {
  const iconClass = (disabled: boolean) =>
    `p-1.5 rounded-full transition-all duration-200 bg-white/90 hover:bg-white shadow-sm border border-slate-100 ${
      disabled
        ? "text-slate-300 cursor-not-allowed opacity-50"
        : "cursor-pointer hover:shadow-md text-slate-700 hover:text-blue-600 active:scale-95"
    }`;

  const isDevuelto = concesionado.status_concesion?.toLowerCase() === "devuelto";

  return (
    <PhotoGridActionButtons
      actions={[
        !isDevuelto ? (
          <DetalleDelSeguimiento
            key="devolucion"
            data={concesionado}
            isSuccess={false}>
            <div className={iconClass(false)} title="Devolución">
                <ArrowLeftRight className="w-4 h-4" />
            </div>
          </DetalleDelSeguimiento>
        ) : (
          <div key="devolucion" className={iconClass(true)} title="Ya devuelto">
                <ArrowLeftRight className="w-4 h-4" />
          </div>
        ),
      ].filter(Boolean) as React.ReactNode[]}
    />
  );
};