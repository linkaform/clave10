/* eslint-disable react-hooks/exhaustive-deps */
import React, { Dispatch, SetStateAction, useState } from "react";
import { Edit, Eye, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConcesionadosAgregarEquipoModal } from "./modals/concesionados-agregar-equipos-modal";
import { Imagen } from "./upload-Image";
import { ConcesionadosVerEquipo } from "./modals/concesionados-ver-equipo";
import { formatCurrency } from "@/lib/utils";

export type DevolucionItem = {
  id_movimiento_devolucion: string;
  estatus_equipo: string;
  fecha_devolucion_concesion: string;
  cantidad_devolucion: { source: string; parsedValue: number };
  comentario_entrega: string | null;
  entregado_por: string;
  evidencia_entrega: { file_url: string; file_name: string }[];
  identificacion_entrega: { file_url: string; file_name: string }[];
  quien_entrega: string;
  quien_entrega_company: string | null;
};

export interface EquipoConcesionado {
  id_movimiento?: string;
  categoria_equipo_concesion?: string;
  cantidad_equipo_devuelto?: number | undefined;
  cantidad_equipo_pendiente?: number | undefined;
  nombre_equipo?: string;
  costo_equipo_concesion?: number;
  imagen_equipo_concesion?: Imagen[];
  cantidad_equipo_concesion?: number;
  evidencia_entrega?: Imagen[];
  comentario_entrega?: string | undefined;
  status_concesion_equipo?: string;
  devoluciones?: DevolucionItem[];
  total?: number;
}

interface AgregarEquiposListProps {
  equipos: EquipoConcesionado[];
  setEquipos: Dispatch<SetStateAction<EquipoConcesionado[]>>;
  mode: "vista" | "editar";
  dataConcesion: any;
  from?:string
}


const TabDatos: React.FC<AgregarEquiposListProps> = ({ equipos, setEquipos, mode, dataConcesion, from}) => {
  const [openAgregarEquiposModal, setOpenAgregarEquiposModal] = useState(false);
  const [openVerEquiposModal, setOpenVerEquiposModal] = useState(false);
  const [agregarEquipoSeleccion, setAgregarEquipoSeleccion] = useState({});
  const [editarAgregarEquiposModal, setEditarAgregarEquiposModal] = useState(false);
  const [indiceSeleccionado, setIndiceSeleccionado] = useState<number | null>(null);

  const handleViewEquipo = (item: any, index: number) => {
    setAgregarEquipoSeleccion(item);
    setIndiceSeleccionado(index);
    setEditarAgregarEquiposModal(false);
    setOpenVerEquiposModal(true);
  };

  const handleEditEquipo = (item: any, index: number) => {
    setAgregarEquipoSeleccion(item);
    setIndiceSeleccionado(index);
    setEditarAgregarEquiposModal(true);
    setOpenAgregarEquiposModal(true);
  };

  const handleDeleteEquipo = (index: number) => {
    const nuevas = [...equipos];
    nuevas.splice(index, 1);
    setEquipos(nuevas);
    toast.success("Equipo eliminado correctamente.");
  };

  const getEstadoEquipo = (item: EquipoConcesionado) => {
    const devueltos = Number(item.cantidad_equipo_devuelto ?? 0);
    const total = Number(item.cantidad_equipo_concesion ?? 0);
    if (devueltos === 0) return { label: "Pendiente", style: "bg-red-100 text-red-700" };
    if (devueltos < total) return { label: "En proceso", style: "bg-yellow-100 text-yellow-700" };
    return { label: "Completado", style: "bg-green-100 text-green-700" };
  };

  const getCosto = (costo: number | number[] | undefined): number => {
    if (Array.isArray(costo)) return costo[0] ?? 0;
    return costo ?? 0;
  };

  return (
    <div className="space-y-4">


      {mode === "editar" && (
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Lista de equipos
          </p>
          <button
            type="button"
            onClick={() => {
              setOpenAgregarEquiposModal(!openAgregarEquiposModal);
              setEditarAgregarEquiposModal(false);
            }}
            className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors shadow-sm"
          >
            <Plus size={13} /> Agregar equipo
          </button>
        </div>
      )}

      <ConcesionadosVerEquipo
        title="Equipo"
        setIsSuccess={setOpenVerEquiposModal}
        isSuccess={openVerEquiposModal}
        data={agregarEquipoSeleccion as any}
        dataConcesion={dataConcesion}
      >
        <div />
      </ConcesionadosVerEquipo>

      <ConcesionadosAgregarEquipoModal
        title="Nuevo Equipo"
        isSuccess={openAgregarEquiposModal}
        setIsSuccess={setOpenAgregarEquiposModal}
        agregarEquiposSeleccion={agregarEquipoSeleccion}
        setEquipos={setEquipos}
        setEditarAgregarEquiposModal={setEditarAgregarEquiposModal}
        editarAgregarEquiposModal={editarAgregarEquiposModal}
        indice={indiceSeleccionado}
      >
        <div />
      </ConcesionadosAgregarEquipoModal>

      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <div className="max-h-[240px] overflow-y-auto">
          <table className="min-w-full table-auto text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Equipo</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Unidades Totales</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Precio</th>
                {from!=="nueva_concesion" &&
                <><th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Devueltas</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Pendientes</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Estatus</th></>}
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {equipos && equipos.length > 0 ? (
                equipos.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 max-w-[180px] truncate text-gray-700 font-medium" title={item?.nombre_equipo || "-"}>
                      {item?.nombre_equipo || "-"}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">{item?.cantidad_equipo_concesion || "-"}</td>
                    <td className="px-4 py-2.5 text-gray-600 text-left tracking-wide">
                      {item.total
                        ? formatCurrency(item.total)
                        : formatCurrency((item.cantidad_equipo_concesion ?? 0) * getCosto(item.costo_equipo_concesion))}
                    </td>
                    {from!=="nueva_concesion" && <>
                    <td className="px-4 py-2.5 text-gray-600">{item?.cantidad_equipo_devuelto ?? 0}</td>
                    <td className="px-4 py-2.5 text-gray-600">
                      {(item?.cantidad_equipo_concesion ?? 0) - (item?.cantidad_equipo_devuelto ?? 0)}
                    </td>
                    <td className="px-4 py-2.5">
                      {(() => {
                        const estado = getEstadoEquipo(item);
                        return (
                          <span className={`px-2 py-1 rounded-md text-xs font-medium ${estado.style}`}>
                            {estado.label}
                          </span>
                        );
                      })()}
                    </td>
                    </>}
                    <td className="px-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          title="Ver"
                          onClick={() => handleViewEquipo(item, index)}
                          className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
                        >
                          <Eye size={20} />
                        </button>
                        {mode === "editar" && (
                          <>
                            <button
                              type="button"
                              title="Editar"
                              onClick={() => handleEditEquipo(item, index)}
                              className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
                            >
                              <Edit size={20} />
                            </button>
                            <button
                              type="button"
                              title="Eliminar"
                              onClick={() => handleDeleteEquipo(index)}
                              className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 size={20} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center text-gray-400 text-sm py-6">
                    No hay equipos agregados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TabDatos;