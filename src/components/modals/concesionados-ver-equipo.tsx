import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { EquipoConcesionado } from "../concesionados-tab-datos";
import { Dispatch, SetStateAction, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { Calculator, ImageOff, Package, RotateCcw } from "lucide-react";
import { DevolucionItem, VerDetalleDevolucion } from "./concesionados-ver-detalle-devolucion";
import { HistorialDevolucionesList } from "../concesionados-historial-devoluciones-list";
import ViewImage from "./view-image";

interface ConcesionadosVerEquipoProps {
  title: string;
  data: EquipoConcesionado;
  children: React.ReactNode;
  setIsSuccess: Dispatch<SetStateAction<boolean>>;
  isSuccess: boolean;
  dataConcesion:any
}

export const ConcesionadosVerEquipo: React.FC<ConcesionadosVerEquipoProps> = ({
  title,
  data,
  children,
  setIsSuccess,
  isSuccess,
}) => {
  const getCosto = (costo: number | number[] | undefined): number => {
    if (Array.isArray(costo)) return costo[0] ?? 0;
    return costo ?? 0;
  };
  const subtotal = data?.total
    ? data?.total
    : (data?.cantidad_equipo_concesion ?? 0) * getCosto(data?.costo_equipo_concesion);


  const [verDevolucionModal, setVerDevolucionModal] = useState(false);
  const [devolucionSeleccionada] = useState<DevolucionItem | null>(null);
  
    return (
    <Dialog open={isSuccess} onOpenChange={setIsSuccess}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent
        className="max-w-4xl flex flex-col gap-0 bg-white p-0 max-h-[90vh] overflow-hidden"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="flex-shrink-0 bg-white px-6 py-5 border-b">
          <DialogTitle className="text-2xl text-center font-bold text-gray-800">
            {title}
          </DialogTitle>
          <p className="text-center text-sm text-gray-400">Detalle del equipo concesionado</p>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto overflow-x-hidden px-6 pt-2 pb-3 grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Columna izquierda: información del equipo */}
          <div className="flex flex-col gap-4 min-w-0">
          <div>
            <div className="flex items-center gap-2 mb-1 pb-2">
              <Package className="text-blue-500 w-5 h-5" />
              <h3 className="font-semibold text-gray-700">Información del equipo</h3>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div className="col-span-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Categoría</p>
                <p className="text-sm text-gray-700">{data?.categoria_equipo_concesion || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Equipo</p>
                <p className="text-sm text-gray-700">{data?.nombre_equipo || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Unidades</p>
                <p className="text-sm text-gray-700">{data?.cantidad_equipo_devuelto??0} / {data?.cantidad_equipo_concesion ?? "—"}</p>
              </div>

              {data?.comentario_prestamo && (
                <div className="col-span-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Comentario</p>
                  <p className="text-sm text-gray-700">{data.comentario_prestamo}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-3">
              <div className="flex-1 flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5">
                <Calculator size={14} className="text-blue-400" />
                <div>
                  <p className="text-xs text-blue-400 font-medium">Precio unitario</p>
                  <p className="text-sm font-bold text-blue-700">{formatCurrency(getCosto(data?.costo_equipo_concesion))}</p>
                </div>
              </div>
              <div className="flex-1 flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5">
                <Calculator size={14} className="text-blue-500" />
                <div>
                  <p className="text-xs text-blue-400 font-medium">Subtotal</p>
                  <p className="text-sm font-bold text-blue-700">{formatCurrency(subtotal)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Imagen del catálogo | evidencia del préstamo; con varias, el visor muestra "+N" */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Imagen del equipo</p>
              {data?.imagen_equipo_concesion && data?.imagen_equipo_concesion.length > 0 ? (
                <div className="flex justify-center">
                  <div className={`inline-flex items-center rounded-xl border bg-gray-50 overflow-hidden ${data?.imagen_equipo_concesion.length > 1 ? "pr-2" : ""}`}>
                    <ViewImage imageUrl={data?.imagen_equipo_concesion} size="lg" />
                  </div>
                </div>
              ) : (
                <div className="flex justify-center">
                  <div className="w-24 h-24 rounded-xl border border-dashed border-gray-200 bg-gray-50 flex flex-col gap-1 items-center justify-center text-center px-2">
                    <ImageOff className="w-5 h-5 text-gray-300" />
                    <p className="text-xs text-gray-400">Sin imagen</p>
                  </div>
                </div>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Evidencia del préstamo</p>
              {data?.evidencia_prestamo && data?.evidencia_prestamo.length > 0 ? (
                <div className="flex justify-center">
                  <div className={`inline-flex items-center rounded-xl border bg-gray-50 overflow-hidden ${data?.evidencia_prestamo.length > 1 ? "pr-2" : ""}`}>
                    <ViewImage imageUrl={data?.evidencia_prestamo} size="lg" />
                  </div>
                </div>
              ) : (
                <div className="flex justify-center">
                  <div className="w-24 h-24 rounded-xl border border-dashed border-gray-200 bg-gray-50 flex flex-col gap-1 items-center justify-center text-center px-2">
                    <ImageOff className="w-5 h-5 text-gray-300" />
                    <p className="text-xs text-gray-400">Sin evidencia</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          </div>

          {/* Columna derecha: devoluciones. En md toma el alto de la columna izquierda y hace scroll dentro */}
          <div className="relative min-w-0 md:min-h-[21rem]">
            <div className="md:absolute md:inset-0 flex flex-col">
            {data?.devoluciones?.length ? (
              <HistorialDevolucionesList devoluciones={data.devoluciones} fillHeight />
            ) : (
              <div className="h-full flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <RotateCcw className="w-5 h-5 text-purple-500" />
                  <h3 className="font-semibold text-gray-700">Devoluciones</h3>
                  <span className="text-xs font-semibold bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">0</span>
                </div>
                {/* Mismo formato que la marca de agua del listado */}
                <div className="flex flex-1 flex-col items-center justify-center gap-1.5 min-h-[6rem] rounded-xl border border-purple-100 border-l-4 border-l-purple-400 bg-purple-50/60 text-purple-300/70 select-none">
                  <RotateCcw className="w-8 h-8" />
                  <span className="text-sm font-medium">Sin devoluciones registradas</span>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
        <VerDetalleDevolucion
          devolucion={devolucionSeleccionada}
          isSuccess={verDevolucionModal}
          setIsSuccess={setVerDevolucionModal}
        >
          <div />
        </VerDetalleDevolucion>
      
        <div className="flex-shrink-0 bg-white border-t px-6 py-4">
          <DialogClose asChild>
            <Button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium">
              Cerrar
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
};