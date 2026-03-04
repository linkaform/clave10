import React, { useState } from "react";
import { ChevronDown, ChevronUp, Package, Calendar, User, FileText, RotateCcw, Loader2, PackageCheck } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { EquipoConcesionado } from "./concesionados-agregar-equipos";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "./ui/carousel";
import Image from "next/image";
import { Button } from "./ui/button";

interface HistorialDevolucionesProps {
  equipos: EquipoConcesionado[];
  onDevolver?: (equipo: EquipoConcesionado) => void;
  onDevolverTodo?: () => void;
  isLoadingTodo: boolean;
}

type FiltroEstatus = "todos" | "abierto" | "en proceso" | "completo";

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
const getEstatusStyle = (estatus: string) => {
  switch (estatus) {
    case "completo":
    case "devuelto":
      return "bg-green-100 text-green-700 border-green-200";
    case "pendiente":
    case "abierto":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "en proceso":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    default:
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
};

const getEstatusLabel = (estatus: string) => {
  switch (estatus) {
    case "abierto":return "En Proceso";
    case "pendiente": return "Pendiente";
    case "en proceso": return "En Proceso";
    case "completo":
    case "devuelto": return "Completo";
    default: return estatus;
  }
};

const HistorialDevoluciones: React.FC<HistorialDevolucionesProps> = ({
  equipos,
  onDevolver,
  onDevolverTodo,
  isLoadingTodo
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [filtroActivo, setFiltroActivo] = useState<FiltroEstatus>("todos");
  console.log("isLoadingTodo", isLoadingTodo)

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
    { label: "En Proceso", value: "abierto" },
    { label: "En Proceso", value: "en proceso" },
    { label: "Completado", value: "completo" },
  ];
  const getCosto = (costo: number | number[] | undefined): number => {
    if (Array.isArray(costo)) return costo[0] ?? 0;
    return costo ?? 0;
  };
  return (
    <div className="space-y-4">

      <div className="flex gap-2 flex-wrap">
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

        {botonesFiltro.map((boton) => (
          <button
            key={boton.value}
            onClick={() => setFiltroActivo(boton.value)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              filtroActivo === boton.value
                ? "bg-blue-500 text-white shadow-sm"
                : "border border-gray-200 text-gray-600 bg-white hover:bg-gray-50"
            }`}
          >
            {boton.label}
          </button>
        ))}
      </div>

      <div className="max-h-[460px] overflow-y-auto space-y-3 pr-1">
        {equiposFiltrados.length > 0 ? (
          equiposFiltrados.map((dev, index) => {
            const { porcentaje, color } = getProgreso(dev);
            const isOpen = expandedIndex === index;
            console.log("devvvv", dev)
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
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getEstatusStyle(dev.status_concesion_equipo ?? "")}`}>
                        {getEstatusLabel(dev.status_concesion_equipo ?? "")}
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

                    {dev.status_concesion_equipo === "completo" || dev.status_concesion_equipo=="devuelto" && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white rounded-xl border border-blue-100 px-4 py-3">
                          <p className="text-xs text-gray-400 mb-0.5">Precio unitario</p>
                          <p className="text-sm font-bold text-blue-700"> {formatCurrency(getCosto(dev.costo_equipo_concesion))}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-blue-100 px-4 py-3">
                          <p className="text-xs text-gray-400 mb-0.5">Subtotal</p>
                          <p className="text-sm font-bold text-blue-700">
                            {formatCurrency((dev.cantidad_equipo_concesion ?? 0) * getCosto(dev.costo_equipo_concesion))}
                          </p>
                        </div>

                        <div className="col-span-2">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Sobre la devolución</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-start gap-2">
                              <Calendar className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-gray-400">Fecha de devolución</p>
                                <p className="text-sm font-medium text-gray-700">12-02-14 3:30pm</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <User className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-gray-400">Empleado (entrega)</p>
                                <p className="text-sm font-medium text-gray-700">Emiliano Zapata</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {(dev.status_concesion_equipo === "en proceso" || dev.status_concesion_equipo === "abierto" || dev.status_concesion_equipo === "devuelto"|| dev.status_concesion_equipo === "completo") &&
                      dev.comentario_entrega && (
                        <div className="flex items-start gap-2">
                          <FileText className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-400 mb-0.5">Comentarios</p>
                            <p className="text-sm text-gray-700">{dev.comentario_entrega}</p>
                          </div>
                        </div>
                    )}

                    
                    {dev.imagen_equipo_concesion && dev.imagen_equipo_concesion.length > 0 && (dev.status_concesion_equipo === "devuelto"|| dev.status_concesion_equipo === "completo") &&(
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="w-full">
                          <p className="text-xs text-gray-400 mb-2">Evidencia del equipo</p>
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

export default HistorialDevoluciones;