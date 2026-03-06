/* eslint-disable react-hooks/exhaustive-deps */
import React, { Dispatch, SetStateAction, useState } from "react";
import { Calculator, Eye } from "lucide-react";
import { Imagen } from "./upload-Image";
import { ConcesionadosVerEquipo } from "./modals/concesionados-ver-equipo";
import { capitalizeFirstLetter, formatCurrency } from "@/lib/utils";
import { NuevaDevolucionMiniEquipoModal } from "./modals/concesionados-nueva-devolucion-mini";

export interface EquipoConcesionado {
  id_movimiento?: string;
  categoria_equipo_concesion?: string;
  nombre_equipo?: string;
  costo_equipo_concesion?: number;
  imagen_equipo_concesion?: Imagen[];
  cantidad_equipo_concesion?: number;
  cantidad_equipo_devuelto?: number;
  cantidad_equipo_pendiente?: number;
  evidencia_entrega?: Imagen[];
  comentario_entrega?: string;
  status_concesion_equipo?: string;
  total?: number;
}

interface AgregarEquiposListProps {
  equipos: EquipoConcesionado[];
  setEquipos: Dispatch<SetStateAction<EquipoConcesionado[]>>;
  onDevolver: (equipo: EquipoConcesionado) => void;
  data: any;
  dataDevolucion: any;
}

const estatusBadge = (estatus: string) => {
  const map: Record<string, string> = {
    devuelto: "bg-green-100 text-green-700",
    completo: "bg-green-100 text-green-700",
    pendiente: "bg-yellow-100 text-yellow-700",
    "en proceso": "bg-yellow-100 text-yellow-700",
    abierto: "bg-red-100 text-red-600",
    damage: "bg-red-100 text-red-600",
  };
  return map[estatus?.toLowerCase()] ?? "bg-gray-100 text-gray-600";
};

type EquipoForm = { unidades: number; estatus: string };

const DetalleSeguimientoTable: React.FC<AgregarEquiposListProps> = ({
  equipos,
  data,
  dataDevolucion,
}) => {
  const [openVerEquiposModal, setOpenVerEquiposModal] = useState(false);
  const [agregarEquipoSeleccion, setAgregarEquipoSeleccion] = useState<EquipoConcesionado|null>(null);
  const [openDevolucionMiniEquiposModal, setOpenDevolucionMiniEquiposModal] = useState(false);
  const [equipoForms, setEquipoForms] = useState<Record<number, EquipoForm>>({});

  const handleViewEquipo = (item: EquipoConcesionado) => {
    setAgregarEquipoSeleccion(item);
    setOpenVerEquiposModal(true);
  };

  // const handleDevolverEquipo = (item: EquipoConcesionado, index: number) => {
  //   const form = equipoForms[index] ?? { unidades: 0, estatus: "" };
  //   setAgregarEquipoSeleccion({ ...item, _formUnidades: form.unidades, _formEstatus: form.estatus } as any);
  //   setOpenDevolucionMiniEquiposModal(true);
  // };

  const setForm = (index: number, key: keyof EquipoForm, value: any) => {
    setEquipoForms((prev) => ({
      ...prev,
      [index]: { ...(prev[index] ?? { unidades: 0, estatus: "" }), [key]: value },
    }));
  };

  const totalGeneral = equipos.reduce((acc, item) => acc + (item.total ?? 0), 0);
  const totalGeneral2 = equipos.reduce((acc, item) => {
    return acc + (item.cantidad_equipo_concesion ?? 0) * (item.costo_equipo_concesion ?? 0);
  }, 0);

  return (
    <div>
      <ConcesionadosVerEquipo
        title="Equipo"
        setIsSuccess={setOpenVerEquiposModal}
        isSuccess={openVerEquiposModal}
        data={agregarEquipoSeleccion as any}
        dataConcesion={data}
      >
        <div />
      </ConcesionadosVerEquipo>

      <NuevaDevolucionMiniEquipoModal
        title="Devolución de Equipos"
        setIsSuccess={setOpenDevolucionMiniEquiposModal}
        isSuccess={openDevolucionMiniEquiposModal}
        equipoSelecionado={agregarEquipoSeleccion}
        dataConcesion={data}
        dataDevolucion={dataDevolucion}
      >
        <div />
      </NuevaDevolucionMiniEquipoModal>

      {equipos && equipos.length > 0 ? (
        <div className="flex flex-col gap-3 mb-5">
          {equipos.map((item, index) => {
            const pendientes = Number(item.cantidad_equipo_pendiente ?? 0);
            const form = equipoForms[index] ?? { unidades: 0, estatus: "" };
            const yaDevuelto = item.status_concesion_equipo === "devuelto";

            return (
              <div
                key={index}
                className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="text-sm font-semibold text-gray-700 truncate">
                      {item.nombre_equipo || "—"}
                    </p>
                    <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${estatusBadge(item.status_concesion_equipo ?? "")}`}>
                      {capitalizeFirstLetter(item.status_concesion_equipo ?? "")}
                    </span>
                  </div>
                  <button
                    type="button"
                    title="Ver detalle"
                    onClick={() => handleViewEquipo(item)}
                    className="text-blue-400 hover:text-blue-600 transition-colors flex-shrink-0 ml-3"
                  >
                    <Eye className="w-6 h-6" />
                  </button>
                </div>

                {/* Cuerpo */}
                <div className="px-4 py-3">
                  {yaDevuelto ? (
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Unidades totales</p>
                        <p className="text-sm font-medium text-gray-700">{item.cantidad_equipo_concesion ?? "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Devueltas</p>
                        <p className="text-sm font-medium text-gray-700">{item.cantidad_equipo_devuelto ?? "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Precio</p>
                        <p className="text-sm font-medium text-gray-700">
                          {formatCurrency((item.costo_equipo_concesion ?? 0) * (item.cantidad_equipo_concesion ?? 0))}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">

                      {/* Columna izquierda */}
                      <div className="flex flex-col gap-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-gray-400 mb-0.5">Unidades totales</p>
                            <p className="text-sm font-medium text-gray-700">{item.cantidad_equipo_concesion ?? "—"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 mb-0.5">Precio</p>
                            <p className="text-sm font-medium text-gray-700">
                              {formatCurrency((item.costo_equipo_concesion ?? 0) * (item.cantidad_equipo_concesion ?? 0))}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Unidades a devolver</p>
                          <input
                            type="number"
                            min={0}
                            max={pendientes}
                            defaultValue={0}
                            className="w-full h-9 rounded-md border border-gray-200 bg-white px-3 text-sm"
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              if (val > pendientes) {
                                e.target.value = "0";
                                setForm(index, "unidades", 0);
                              } else {
                                setForm(index, "unidades", val);
                              }
                            }}
                            onBlur={(e) => {
                              const val = Math.min(Math.max(Number(e.target.value), 0), pendientes);
                              e.target.value = String(val);
                              setForm(index, "unidades", val);
                            }}
                          />
                          <p className="text-xs text-gray-400 mt-1">Pendientes: {pendientes}</p>
                        </div>
                      </div>

                      {/* Columna derecha */}
						<div>
						<p className="text-xs text-gray-400 mb-1">Estado</p>
						<div className="flex gap-1 flex-wrap">
							{["completo", "perdido", "dañado"].map((val) => (
							<button
								key={val}
								type="button"
								onClick={() => setForm(index, "estatus", val)}
								className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
								form.estatus === val
									? "bg-blue-600 text-white shadow-sm"
									: "border border-blue-300 text-blue-600 bg-white hover:bg-blue-50"
								}`}
							>
								{val.charAt(0).toUpperCase() + val.slice(1)}
							</button>
							))}
						</div>
						</div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                {/* {!yaDevuelto && (
                  <div className="px-4 py-2.5 border-t border-gray-100 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleDevolverEquipo(item, index)}
                      className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    >
                      Devolver
                    </button>
                  </div>
                )} */}

              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center text-gray-400 py-6 text-sm border border-gray-200 rounded-xl">
          No hay equipos agregados.
        </div>
      )}

      <div className="flex gap-2 items-center text-blue-500">
        <span className="flex font-bold text-lg"><Calculator /> Total:</span>
        <span className="font-bold text-lg">{formatCurrency(totalGeneral || totalGeneral2)}</span>
      </div>
    </div>
  );
};

export default DetalleSeguimientoTable;