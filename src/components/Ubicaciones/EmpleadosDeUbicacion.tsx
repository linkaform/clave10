"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { useEmpleadosByUbicacion } from "@/hooks/Ubicaciones/useEmpleadosByUbicacion";
import { normalizeEmpleadoUbicacion } from "@/lib/ubicaciones";
import { normalizeText } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface EmpleadosDeUbicacionProps {
  ubicacion: string;
}

// Mismo formato que AreasDeUbicacion: contador, buscador en memoria y lista.
export function EmpleadosDeUbicacion({ ubicacion }: EmpleadosDeUbicacionProps) {
  const { empleados, isLoading, error } = useEmpleadosByUbicacion(ubicacion);
  const [search, setSearch] = React.useState("");

  const empleadosNormalizados = React.useMemo(
    () => empleados.map((empleado, index) => normalizeEmpleadoUbicacion(empleado, index)),
    [empleados],
  );

  const empleadosFiltrados = search
    ? empleadosNormalizados.filter((empleado) =>
        normalizeText([empleado.nombre, empleado.puesto, empleado.departamento].join(" ")).includes(
          normalizeText(search),
        ),
      )
    : empleadosNormalizados;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="font-semibold text-sm text-gray-800">
          Empleados con acceso
          <span className="ml-2 text-blue-600 font-bold">{empleadosNormalizados.length}</span>
        </span>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar empleado..."
          className="pl-8 h-8 text-sm"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-24 text-sm text-gray-400">Cargando empleados...</div>
      ) : error ? (
        <div className="flex items-center justify-center h-24 text-sm text-red-400 text-center">
          No se pudieron cargar los empleados de esta ubicación.
        </div>
      ) : empleadosNormalizados.length === 0 ? (
        <div className="flex items-center justify-center h-24 text-sm text-gray-400 text-center">
          Esta ubicación todavía no tiene empleados asignados.
        </div>
      ) : empleadosFiltrados.length === 0 ? (
        <div className="flex items-center justify-center h-24 text-sm text-gray-400 text-center">
          Ningún empleado coincide con &quot;{search}&quot;.
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-gray-100">
          {empleadosFiltrados.map((empleado) => (
            <div key={empleado.recordId || empleado.id} className="flex items-center gap-3 py-2.5">
              {empleado.foto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={empleado.foto} alt={empleado.nombre} className="h-9 w-9 rounded-full object-cover shrink-0" />
              ) : (
                <div className="h-9 w-9 rounded-full bg-gray-100 shrink-0 flex items-center justify-center text-xs font-semibold text-gray-400">
                  {empleado.nombre.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate">{empleado.nombre}</div>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  {empleado.puesto && (
                    <span className="px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] capitalize">
                      {empleado.puesto}
                    </span>
                  )}
                  {empleado.departamento && (
                    <span className="px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-semibold">
                      {empleado.departamento}
                    </span>
                  )}
                </div>
              </div>

              {(empleado.email || empleado.telefono) && (
                <div className="hidden sm:flex flex-col items-end text-[11px] text-gray-400 shrink-0 max-w-[40%]">
                  {empleado.email && <span className="truncate max-w-full">{empleado.email}</span>}
                  {empleado.telefono && <span>{empleado.telefono}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
