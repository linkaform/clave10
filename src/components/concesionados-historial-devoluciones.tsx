import React, { useState } from "react";
import { ChevronDown, ChevronUp, Package, Calendar, User, FileText, RotateCcw } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { EquipoConcesionado } from "./concesionados-agregar-equipos";

export interface Devolucion {
  id: number;
  unidadesDevueltas: number;
  unidadesTotales: number;
  estatus: "pendiente" | "abierto" | "En Proceso";
  progreso: number; 
  fecha: string;
  equipo: string;
  solicitante: string;
  motivo: string;
  comentarios?: string;
  fechaDevolucion?: string;
}

interface HistorialDevolucionesProps {
  equipos: EquipoConcesionado[];
  onDevolver?: (id: number) => void;
}

type FiltroEstatus = "todos" | "abierto" | "en proceso" | "completo";

const HistorialDevoluciones: React.FC<HistorialDevolucionesProps> = ({ 
  equipos,
  onDevolver 
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [filtroActivo, setFiltroActivo] = useState<FiltroEstatus>("todos");

  const toggleAccordion = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleDevolver = (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (onDevolver) {
      onDevolver(id);
    }
  };

  const getEstatusColor = (estatus: string) => {
    switch (estatus) {
      case "completo":
        return "bg-green-100 text-green-700 border-green-700";
      case "pendiente":
        return "bg-red-100 text-red-700 border-red-700";
      case "abierto":
        return "bg-red-100 text-red-700 border-red-700";
      case "en proceso":
        return "bg-yellow-100 text-yellow-700 border-yellow-700";
      default:
        return "bg-gray-100 text-gray-700 border-gray-700";
    }
  };

  const getProgressColor = (estatus: string) => {
    console.log(estatus);
    switch (estatus) {
      case "completo":
        return "bg-green-500";
      case "pendiente":
        return "bg-red-500";
      case "abierto":
        return "bg-red-500";
      case "en proceso":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const equiposFiltrados = equipos.filter((equipo) => {
    if (filtroActivo === "todos") return true;
    return equipo.status_concesion_equipo === filtroActivo;
  });

  const botonesFiltro: { label: string; value: FiltroEstatus }[] = [
    { label: "Todos", value: "todos" },
    { label: "Pendiente", value: "abierto" },
    { label: "En Proceso", value: "en proceso" },
    { label: "Completado", value: "completo" },
  ];

  return (
    <div className="max-h-[500px] overflow-y-auto space-y-3 pr-2">
      
      <div className="flex gap-2 mb-4 flex-wrap">
        {botonesFiltro.map((boton) => (
          <button
            key={boton.value}
            onClick={() => setFiltroActivo(boton.value)}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              filtroActivo === boton.value
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {boton.label}
          </button>
        ))}
      </div>

      <div className="max-h-[500px] overflow-y-hidden space-y-3 pr-2">
        {equiposFiltrados && equiposFiltrados.length > 0 ? (
          equiposFiltrados.map((dev, index) => (
            <div
              key={index}
              className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm"
            >
              <div
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleAccordion(index)}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-gray-600" />
                      <span className="font-semibold text-gray-700">
                        0/{dev?.cantidad_equipo_concesion} {dev.nombre_equipo}
                      </span>
                    </div>

                    <div
                      className={`inline-flex items-center justify-center px-3 py-1 text-xs font-semibold rounded-full border ${getEstatusColor(
                        dev.status_concesion_equipo ?? ""
                      )}`}
                    >
                      {dev.status_concesion_equipo === "abierto"
                        ? "Pendiente"
                        : dev.status_concesion_equipo === "en proceso"
                        ? "En Proceso"
                        : "Completo"}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-gray-500">
                      {expandedIndex === index ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-600">Progreso</span>
                    <span className="text-xs font-semibold text-gray-700">
                      {0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(
                        dev.status_concesion_equipo ?? ""
                      )}`}
                      style={{ width: `${dev.status_concesion_equipo}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {expandedIndex === index && (
                <div className="border-t border-gray-200 bg-gray-50 p-4 animate-fadeIn">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dev.status_concesion_equipo == "completo" && (
                      <>
                        <div className="flex items-start gap-2">
                          <User className="w-4 h-4 text-blue-500 mt-1" />
                          <div>
                            <p className="text-sm text-blue-500 font-bold">
                              Precio unitario ($)
                            </p>
                            <p className="text-sm font-medium text-gray-700">
                              {formatCurrency(200)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <User className="w-4 h-4 text-blue-500 mt-1" />
                          <div>
                            <p className="text-sm text-blue-500 font-bold">
                              Subtotal ($)
                            </p>
                            <p className="text-sm font-medium text-gray-700">
                              {formatCurrency(400)}
                            </p>
                          </div>
                        </div>
                        <div className="col-span-2 text-sm font-bold text-gray-800">
                          Sobre la devolucion
                        </div>
                        <div className="flex items-start gap-2">
                          <Calendar className="w-4 h-4 text-green-500 mt-1" />
                          <div>
                            <p className="text-xs text-gray-500">
                              Fecha y hora de la devolución
                            </p>
                            <p className="text-sm font-medium text-gray-700">
                              {"12-02-14 3:3-pm"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <User className="w-4 h-4 text-blue-500 mt-1" />
                          <div>
                            <p className="text-xs text-gray-500">
                              Empleado (entrega)
                            </p>
                            <p className="text-sm font-medium text-gray-700">
                              {"Emiliano Zapata demo data"}
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                    {(dev.status_concesion_equipo == "en proceso" ||
                      dev.status_concesion_equipo == "abierto") &&
                      dev.comentario_entrega && (
                        <div className="flex items-start gap-2 md:col-span-2">
                          <FileText className="w-4 h-4 text-blue-500 mt-1" />
                          <div className="flex-1">
                            <p className="text-xs text-gray-500">Comentarios</p>
                            <p className="text-sm text-gray-700">
                              {dev.comentario_entrega}
                            </p>
                          </div>
                        </div>
                      )}
                  </div>
                  {(dev.status_concesion_equipo == "pendiente" ||
                    dev.status_concesion_equipo == "en proceso" ||
                    dev.status_concesion_equipo == "abierto") && (
                    <div className="mt-4 pt-4 border-t border-gray-200 flex justify-center">
                      <button
                        onClick={(e) => handleDevolver(0, e)}
                        className="w-1/2 size-10 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-md font-small transition-colors"
                      >
                        <RotateCcw className="w-5 h-5" />
                        Devolver
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 py-8 border border-gray-300 rounded-lg bg-gray-50">
            No hay equipos{" "}
            {filtroActivo !== "todos"
              ? `con estatus "${filtroActivo}"`
              : "registrados"}
            .
          </div>
        )}
      </div>
    </div>
  );
};

export default HistorialDevoluciones;