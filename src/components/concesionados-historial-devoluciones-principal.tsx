import React, { useState } from "react";
import { ChevronDown, ChevronUp, Package, FileText, RotateCcw, Loader2, PackageCheck, MessageSquare, } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { EquipoConcesionado } from "./concesionados-tab-datos";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "./ui/carousel";
import Image from "next/image";
import { Button } from "./ui/button";
import { DevolucionItem, VerDetalleDevolucion } from "./modals/concesionados-ver-detalle-devolucion";
import { HistorialDevolucionesList } from "./concesionados-historial-devoluciones-list";

interface HistorialDevolucionesProps {
  equipos: EquipoConcesionado[];
  onDevolver?: (equipo: EquipoConcesionado) => void;
  onDevolverTodo?: () => void;
  isLoadingTodo: boolean;
  dataConcesion:any
}

type FiltroEstatus = "todos" | "abierto" | "en proceso" | "devuelto";

const getProgreso = (equipo: EquipoConcesionado) => {
  const devuelto = Number(equipo.cantidad_equipo_devuelto ?? 0);
  const total = Number(equipo.cantidad_equipo_concesion ?? 0);
  const porcentaje = total > 0 ? Math.round((devuelto / total) * 100) : 0;
  const color =
    porcentaje === 100 ? "bg-green-500" :
    porcentaje > 0     ? "bg-yellow-400" :
                         "bg-red-400";
  return { porcentaje, color };
};
const getEstatusStyle = (equipo: EquipoConcesionado) => {
  const { porcentaje } = getProgreso(equipo);
  if (porcentaje === 100) return "bg-green-100 text-green-700 border-green-200";
  if (porcentaje > 0)     return "bg-yellow-100 text-yellow-700 border-yellow-200";
  return "bg-red-100 text-red-700 border-red-200";
};

const getEstatusLabel = (equipo: EquipoConcesionado) => {
  const { porcentaje } = getProgreso(equipo);
  if (porcentaje === 100) return "Devuelto";
  if (porcentaje > 0)     return "En Proceso";
  return "Pendiente";
};


const HistorialDevolucionesPrincipal: React.FC<HistorialDevolucionesProps> = ({
  equipos,
  onDevolver,
  onDevolverTodo,
  isLoadingTodo,
  dataConcesion
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [filtroActivo, setFiltroActivo] = useState<FiltroEstatus>("todos");
  const [verDevolucionModal, setVerDevolucionModal] = useState(false);
  const [devolucionSeleccionada] = useState<DevolucionItem | null>(null);


  const toggleAccordion = (index: number) =>
    setExpandedIndex(expandedIndex === index ? null : index);

  const handleDevolver = (equipo: EquipoConcesionado, e: React.MouseEvent) => {
    e.stopPropagation();
    onDevolver?.(equipo);
  };
  const handleDevolverTodo = () => {
    onDevolverTodo?.();
  };

  const equiposFiltrados = equipos.filter((equipo) =>
    filtroActivo === "todos" ? true : equipo.status_concesion_equipo === filtroActivo
  );

  const botonesFiltro: { label: string; value: FiltroEstatus }[] = [
    { label: "Todos", value: "todos" },
    { label: "Pendientes", value: "abierto" },
    { label: "En Proceso", value: "en proceso" },
    { label: "Completado", value: "devuelto" },
  ];
  const getCosto = (costo: number | number[] | undefined): number => {
    if (Array.isArray(costo)) return costo[0] ?? 0;
    return costo ?? 0;
  };
  return (
    <div className="space-y-4">

      <VerDetalleDevolucion
			devolucion={devolucionSeleccionada}
			isSuccess={verDevolucionModal}
			setIsSuccess={setVerDevolucionModal}
			>
			<div />
		</VerDetalleDevolucion>
      <div className="flex gap-2 flex-wrap justify-between">

        <div className=" flex gap-2">
        {botonesFiltro.map((boton) => (
          <button
            key={boton.value}
            onClick={() => setFiltroActivo(boton.value)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200  ${
              filtroActivo === boton.value
                ? "bg-blue-500 text-white shadow-sm"
                : "border border-gray-200 text-gray-600 bg-white hover:bg-gray-50"
            }`}
          >
            {boton.label}
          </button>
        ))}
        </div>
        {dataConcesion.status_concesion !=="devuelto" &&
        <div>
        <Button
            disabled={isLoadingTodo}
            onClick={() => handleDevolverTodo()}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            {isLoadingTodo
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Procesando...</>
              : <><PackageCheck className="w-4 h-4" /> Devolver todo</>
            }
          </Button>
        </div>
        }
      </div>

      <div className="max-h-[460px] overflow-y-auto space-y-3 pr-1">
        {equiposFiltrados.length > 0 ? (
          equiposFiltrados.map((dev, index) => {
            const { porcentaje, color } = getProgreso(dev);
            const isOpen = expandedIndex === index;
            return (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
              >
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleAccordion(index)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <Package className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-700 text-sm truncate">
                          {dev.nombre_equipo}
                        </p>
                        <p className="text-xs text-gray-400">
                          {dev.cantidad_equipo_devuelto ?? 0} / {dev.cantidad_equipo_concesion ?? 0} unidades devueltas
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getEstatusStyle(dev ?? "")}`}>
                        {getEstatusLabel(dev ?? "")}
                      </span>
                      {isOpen
                        ? <ChevronUp className="w-4 h-4 text-gray-400" />
                        : <ChevronDown className="w-4 h-4 text-gray-400" />
                      }
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-400">Progreso de devolución</span>
                      <span className="text-xs font-semibold text-gray-600">{porcentaje}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-300 ${color}`}
                        style={{ width: `${porcentaje}%` }}
                      />
                    </div>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-4">

                    { (
                      <div className="grid grid-cols-2 gap-3">
                         
                        <div className="bg-white rounded-xl border border-blue-100 px-4 py-3">
                          <p className="text-xs text-gray-400 mb-0.5">Precio unitario</p>
                          <p className="text-sm font-bold text-blue-700"> {formatCurrency(getCosto(dev?.costo_equipo_concesion))}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-blue-100 px-4 py-3">
                          <p className="text-xs text-gray-400 mb-0.5">Subtotal</p>
                          <p className="text-sm font-bold text-blue-700">
                            {formatCurrency((dev?.cantidad_equipo_concesion ?? 0) * getCosto(dev?.costo_equipo_concesion))}
                          </p>
                        </div>
                        {dev?.comentario_entrega && (
                            <div className="flex items-start gap-2">
                              <MessageSquare className="w-3.5 h-3.5 text-purple-400 mt-0.5 flex-shrink-0" />
                              <span className="text-xs text-gray-600">{dev?.comentario_entrega}</span>
                            </div>
                          )}
                       

                      </div>
                    )}
                      <div className="w-1/2">
                        <HistorialDevolucionesList
                          devoluciones={dataConcesion?.grupo_equipos_devolucion??[]}>
                          </HistorialDevolucionesList>

                        </div>  
              
                    {dev.imagen_equipo_concesion &&(
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="w-full">
                          <p className="text-xs text-gray-400 mb-2">Evidencia de Entrega del Equipo</p>
                          <div className="flex justify-center">
                            <Carousel className="w-52">
                              <CarouselContent>
                                {dev.imagen_equipo_concesion.map((a, i) => (
                                  <CarouselItem key={i}>
                                    <div className="p-1">
                                      <div className="rounded-xl overflow-hidden border bg-gray-50 aspect-square flex items-center justify-center">
                                        <Image
                                          width={280}
                                          height={280}
                                          src={a.file_url || "/nouser.svg"}
                                          alt={`Evidencia ${i + 1}`}
                                          className="w-full h-full object-contain"
                                          unoptimized
                                        />
                                      </div>
                                    </div>
                                  </CarouselItem>
                                ))}
                              </CarouselContent>
                              {dev.imagen_equipo_concesion.length > 1 && (
                                <>
                                  <CarouselPrevious type="button" />
                                  <CarouselNext type="button" />
                                </>
                              )}
                            </Carousel>
                          </div>
                        </div>
                      </div>
                    )}
                    {(dev.status_concesion_equipo === "pendiente" ||
                      dev.status_concesion_equipo === "en proceso" ||
                      dev.status_concesion_equipo === "abierto") && (
                      <div className="pt-2 border-t border-gray-100 flex justify-center gap-3">
                        <Button
                          onClick={(e) => handleDevolver(dev, e)}
                          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Devolver 
                        </Button>
                       
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-10 bg-white border border-gray-200 rounded-xl text-gray-400 gap-2">
            <Package className="w-8 h-8 text-gray-300" />
            <p className="text-sm">
              No hay equipos{filtroActivo !== "todos" ? ` con estatus "${filtroActivo}"` : " registrados"}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistorialDevolucionesPrincipal;