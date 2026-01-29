import React, { useState } from "react";
import { ChevronDown, ChevronUp, Package, Calendar, User, FileText, RotateCcw } from "lucide-react";

export interface Devolucion {
  id: number;
  unidadesDevueltas: number;
  unidadesTotales: number;
  estatus: "Pendiente" | "Completado" | "En Proceso";
  progreso: number; // 0-100
  fecha: string;
  equipo: string;
  solicitante: string;
  motivo: string;
  comentarios?: string;
  fechaDevolucion?: string;
}

interface HistorialDevolucionesProps {
  devoluciones: Devolucion[];
  onDevolver?: (id: number) => void;
}

const HistorialDevoluciones: React.FC<HistorialDevolucionesProps> = ({ 
  devoluciones,
  onDevolver 
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

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
      case "Completado":
        return "bg-green-100 text-green-700 border-green-700";
      case "Pendiente":
        return "bg-red-100 text-red-700 border-red-700";
      case "En Proceso":
        return "bg-yellow-100 text-yellow-700 border-yellow-700";
      default:
        return "bg-gray-100 text-gray-700 border-gray-700";
    }
  };

  const getProgressColor = (estatus: string) => {
    switch (estatus) {
      case "Completado":
        return "bg-green-500";
      case "Pendiente":
        return "bg-red-500";
      case "En Proceso":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="w-full space-y-3">
      <div className="text-lg font-bold mb-4">Historial de Devoluciones</div>
      
      {devoluciones && devoluciones.length > 0 ? (
        devoluciones.map((devolucion, index) => (
          <div
            key={devolucion.id}
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
                      {devolucion.unidadesDevueltas}/{devolucion.unidadesTotales} unidades
                    </span>
                  </div>

                  <div
                    className={`inline-flex items-center justify-center px-3 py-1 text-xs font-semibold rounded-full border ${getEstatusColor(
                      devolucion.estatus
                    )}`}
                  >
                    {devolucion.estatus}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* {devolucion.estatus === "Pendiente" && (
                    <button
                      onClick={(e) => handleDevolver(devolucion.id, e)}
                      className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Devolver
                    </button>
                  )} */}

                  <div className="text-gray-500">
                    {expandedIndex === index ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                </div>
              </div>

              {/* Barra de Progreso */}
              <div className="mt-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-600">Progreso</span>
                  <span className="text-xs font-semibold text-gray-700">
                    {devolucion.progreso}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(
                      devolucion.estatus
                    )}`}
                    style={{ width: `${devolucion.progreso}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {expandedIndex === index && (
              <div className="border-t border-gray-200 bg-gray-50 p-4 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-2">
                    <Package className="w-4 h-4 text-blue-500 mt-1" />
                    <div>
                      <p className="text-xs text-gray-500">Equipo</p>
                      <p className="text-sm font-medium text-gray-700">
                        {devolucion.equipo}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <User className="w-4 h-4 text-blue-500 mt-1" />
                    <div>
                      <p className="text-xs text-gray-500">Solicitante</p>
                      <p className="text-sm font-medium text-gray-700">
                        {devolucion.solicitante}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-blue-500 mt-1" />
                    <div>
                      <p className="text-xs text-gray-500">Fecha de Solicitud</p>
                      <p className="text-sm font-medium text-gray-700">
                        {devolucion.fecha}
                      </p>
                    </div>
                  </div>

                  {devolucion.fechaDevolucion && (
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-green-500 mt-1" />
                      <div>
                        <p className="text-xs text-gray-500">Fecha de Devolución</p>
                        <p className="text-sm font-medium text-gray-700">
                          {devolucion.fechaDevolucion}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-2 md:col-span-2">
                    <FileText className="w-4 h-4 text-blue-500 mt-1" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Motivo</p>
                      <p className="text-sm font-medium text-gray-700">
                        {devolucion.motivo}
                      </p>
                    </div>
                  </div>

                  {devolucion.comentarios && (
                    <div className="flex items-start gap-2 md:col-span-2">
                      <FileText className="w-4 h-4 text-blue-500 mt-1" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Comentarios Adicionales</p>
                        <p className="text-sm text-gray-700">{devolucion.comentarios}</p>
                      </div>
                    </div>
                  )}
                </div>

                {devolucion.estatus === "Pendiente" && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={(e) => handleDevolver(devolucion.id, e)}
                      className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-md font-medium transition-colors"
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
          No hay devoluciones registradas.
        </div>
      )}
    </div>
  );
};

export default HistorialDevoluciones;