import React, { useState } from "react";
import { ChevronDown, ChevronUp, Package, Calendar, User, FileText, RotateCcw } from "lucide-react";
import { toast } from "sonner";


interface HistorialDevolucionesProps {
  devoluciones: Devolucion[];
  onDevolver?: (id: number) => void;
}
import { z } from "zod";
import { Devolucion } from "../concesionados-historial-devoluciones";

export const devolucionSchema = z.object({
  id: z.number().positive("El ID debe ser un número positivo"),
  unidadesDevueltas: z
    .number()
    .int("Las unidades devueltas deben ser un número entero")
    .min(0, "Las unidades devueltas no pueden ser negativas"),
  unidadesTotales: z
    .number()
    .int("Las unidades totales deben ser un número entero")
    .positive("Las unidades totales deben ser mayor a 0"),
  estatus: z.enum(["Pendiente", "Completado", "En Proceso"], {
    errorMap: () => ({ message: "El estatus debe ser: Pendiente, Completado o En Proceso" }),
  }),
  progreso: z
    .number()
    .min(0, "El progreso no puede ser menor a 0")
    .max(100, "El progreso no puede ser mayor a 100"),
  fecha: z.string().min(1, "La fecha es requerida"),
  equipo: z.string().min(1, "El nombre del equipo es requerido"),
  solicitante: z.string().min(1, "El nombre del solicitante es requerido"),
  motivo: z.string().min(1, "El motivo es requerido"),
  comentarios: z.string().optional(),
  fechaDevolucion: z.string().optional(),
}).refine(
  (data) => data.unidadesDevueltas <= data.unidadesTotales,
  {
    message: "Las unidades devueltas no pueden ser mayores a las unidades totales",
    path: ["unidadesDevueltas"],
  }
).refine(
  (data) => {
    // Si el estatus es "Completado", debe tener fecha de devolución
    if (data.estatus === "Completado") {
      return !!data.fechaDevolucion;
    }
    return true;
  },
  {
    message: "Las devoluciones completadas deben tener fecha de devolución",
    path: ["fechaDevolucion"],
  }
).refine(
  (data) => {
    // Si el estatus es "Completado", las unidades devueltas deben ser iguales a las totales
    if (data.estatus === "Completado") {
      return data.unidadesDevueltas === data.unidadesTotales;
    }
    return true;
  },
  {
    message: "Las devoluciones completadas deben tener todas las unidades devueltas",
    path: ["unidadesDevueltas"],
  }
).refine(
  (data) => {
    // El progreso debe ser consistente con el estatus
    if (data.estatus === "Completado" && data.progreso !== 100) {
      return false;
    }
    if (data.estatus === "Pendiente" && data.progreso !== 0) {
      return false;
    }
    return true;
  },
  {
    message: "El progreso no es consistente con el estatus",
    path: ["progreso"],
  }
);

const DevolverEquipoModal: React.FC<HistorialDevolucionesProps> = ({ 
  devoluciones,
  onDevolver 
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Validar las devoluciones al cargar
  React.useEffect(() => {
    try {
        devolucionSchema.parse(devoluciones);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Error de validación en devoluciones:", error.errors);
        toast.error("Hay errores en los datos de devoluciones");
      }
    }
  }, [devoluciones]);

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
            {/* Header del Accordion */}
            <div
              className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleAccordion(index)}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  {/* Unidades */}
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-gray-600" />
                    <span className="font-semibold text-gray-700">
                      {devolucion.unidadesDevueltas}/{devolucion.unidadesTotales} unidades
                    </span>
                  </div>

                  {/* Estatus Badge */}
                  <div
                    className={`inline-flex items-center justify-center px-3 py-1 text-xs font-semibold rounded-full border ${getEstatusColor(
                      devolucion.estatus
                    )}`}
                  >
                    {devolucion.estatus}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Botón Devolver - Solo para estatus Pendiente */}
                  {devolucion.estatus === "pendiente" && (
                    <button
                      onClick={(e) => handleDevolver(devolucion.id, e)}
                      className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Devolver
                    </button>
                  )}

                  {/* Icono de expandir/colapsar */}
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

            {/* Contenido expandido */}
            {expandedIndex === index && (
              <div className="border-t border-gray-200 bg-gray-50 p-4 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Equipo */}
                  <div className="flex items-start gap-2">
                    <Package className="w-4 h-4 text-blue-500 mt-1" />
                    <div>
                      <p className="text-xs text-gray-500">Equipo</p>
                      <p className="text-sm font-medium text-gray-700">
                        {devolucion.equipo}
                      </p>
                    </div>
                  </div>

                  {/* Solicitante */}
                  <div className="flex items-start gap-2">
                    <User className="w-4 h-4 text-blue-500 mt-1" />
                    <div>
                      <p className="text-xs text-gray-500">Solicitante</p>
                      <p className="text-sm font-medium text-gray-700">
                        {devolucion.solicitante}
                      </p>
                    </div>
                  </div>

                  {/* Fecha de Solicitud */}
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-blue-500 mt-1" />
                    <div>
                      <p className="text-xs text-gray-500">Fecha de Solicitud</p>
                      <p className="text-sm font-medium text-gray-700">
                        {devolucion.fecha}
                      </p>
                    </div>
                  </div>

                  {/* Fecha de Devolución */}
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

                  {/* Motivo */}
                  <div className="flex items-start gap-2 md:col-span-2">
                    <FileText className="w-4 h-4 text-blue-500 mt-1" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Motivo</p>
                      <p className="text-sm font-medium text-gray-700">
                        {devolucion.motivo}
                      </p>
                    </div>
                  </div>

                  {/* Comentarios */}
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

                {/* Botón Devolver en el detalle expandido - Solo para Pendiente */}
                {devolucion.estatus === "pendiente" && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={(e) => handleDevolver(devolucion.id, e)}
                      className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-md font-medium transition-colors"
                    >
                      <RotateCcw className="w-5 h-5" />
                      Procesar Devolución
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

export default DevolverEquipoModal;