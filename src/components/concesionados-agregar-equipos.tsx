/* eslint-disable react-hooks/exhaustive-deps */
import React, { Dispatch, SetStateAction, useState } from "react";
import { Edit, Eye, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConcesionadosAgregarEquipoModal } from "./modals/concesionados-agregar-equipos-modal";
import { Imagen } from "./upload-Image";
import { ConcesionadosVerEquipo } from "./modals/concesionados-ver-equipo";
import { formatCurrency } from "@/lib/utils";

export interface EquipoConcesionado {
  id_movimiento?: string;
  categoria_equipo_concesion?: string;
  cantidad_equipo_devuelto?:string;
  cantidad_equipo_pendiente?:string;
  nombre_equipo?: string;
  costo_equipo_concesion?: number[];
  imagen_equipo_concesion?: Imagen[];
  cantidad_equipo_concesion?: number;
  evidencia_entrega?: Imagen[];
  comentario_entrega?: string;
  status_concesion_equipo?: string;
  total?: number;
}

interface AgregarEquiposListProps {
  equipos: EquipoConcesionado[];
  setEquipos: Dispatch<SetStateAction<EquipoConcesionado[]>>;
  mode: "vista" | "editar";
}

const ConcesionadosAgregarEquipos: React.FC<AgregarEquiposListProps> = ({ equipos, setEquipos, mode }) => {
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

  // const totalGeneral = equipos.reduce((acc, item) => acc + (item.total ?? 0), 0);
  // const totalGeneral2 = equipos.reduce((acc, item) => {
  //   const cantidad = item.cantidad_equipo_concesion ?? 0;
  //   const costo = item.costo_equipo_concesion ?? 0;
  //   return acc + cantidad * costo;
  // }, 0);

  const getCosto = (costo: number | number[] | undefined): number => {
    if (Array.isArray(costo)) return costo[0] ?? 0;
    return costo ?? 0;
  };

  return (
    <div className="space-y-3">
      {/* Header */}
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
        <table className="min-w-full table-auto text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Equipo</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Unidades</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Precio</th>
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
                  <td className="px-4 py-2.5 text-gray-600 ">{item?.cantidad_equipo_concesion || "-"}</td>
                  <td className="px-4 py-2.5 text-gray-600 text-left tracking-wide">
                    {item.total
                      ? formatCurrency(item.total)
                      : formatCurrency((item.cantidad_equipo_concesion ?? 0) * getCosto(item.costo_equipo_concesion))}
                  </td>
                  <td className="px-4 ">
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
                <td colSpan={4} className="text-center text-gray-400 text-sm py-6">
                  No hay equipos agregados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        {/* <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5">
          <Calculator size={16} className="text-blue-500" />
          <span className="text-sm font-semibold text-blue-600">Total:</span>
          <span className="text-sm font-bold text-blue-700">
            {formatCurrency(totalGeneral || totalGeneral2)}
          </span>
        </div> */}
      </div>
    </div>
  );
};

export default ConcesionadosAgregarEquipos;