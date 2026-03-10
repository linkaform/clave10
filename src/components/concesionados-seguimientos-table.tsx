/* eslint-disable react-hooks/exhaustive-deps */
import React, { Dispatch, SetStateAction, useState } from "react";
import { Calculator, ChevronDown, ChevronUp, Eye } from "lucide-react";
import { Imagen } from "./upload-Image";
import { ConcesionadosVerEquipo } from "./modals/concesionados-ver-equipo";
import { capitalizeFirstLetter, formatCurrency } from "@/lib/utils";
import { NuevaDevolucionMiniEquipoModal } from "./modals/concesionados-nueva-devolucion-mini";
import LoadImage from "./upload-Image";

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

interface AgregarEquiposListProps {
  equipos: EquipoConcesionado[];
  setEquipos: Dispatch<SetStateAction<EquipoConcesionado[]>>;
  onDevolver: (equipo: EquipoConcesionado) => void;
  data: any;
  dataDevolucion: any;
  equipoForms: Record<number, EquipoForm>;
  setEquipoForms: Dispatch<SetStateAction<Record<number, EquipoForm>>>;
}

export type EquipoForm = {
  unidades: number;
  estatus: string;
  agregado: boolean;
  evidencia_entrega: Imagen[];
  comentario: string;
};

const DetalleSeguimientoTable: React.FC<AgregarEquiposListProps> = ({
  equipos,
  data,
  dataDevolucion,
  equipoForms,
  setEquipoForms,
}) => {
  const [openVerEquiposModal, setOpenVerEquiposModal] = useState(false);
  const [agregarEquipoSeleccion, setAgregarEquipoSeleccion] = useState<EquipoConcesionado | null>(null);
  const [openDevolucionMiniEquiposModal, setOpenDevolucionMiniEquiposModal] = useState(false);
  const [colapsados, setColapsados] = useState<Record<number, boolean>>({});

  const handleViewEquipo = (item: EquipoConcesionado) => {
    setAgregarEquipoSeleccion(item);
    setOpenVerEquiposModal(true);
  };

  const setForm = (index: number, key: keyof EquipoForm, value: any) => {
    setEquipoForms((prev) => ({
      ...prev,
      [index]: {
        ...(prev[index] ?? { unidades: 0, estatus: "", agregado: false, evidencia_entrega: [], comentario: "" }),
        [key]: value,
      },
    }));
  };

  const toggleColapsado = (index: number) => {
    setColapsados((prev) => ({ ...prev, [index]: !prev[index] }));
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
            const pendientes = Number(
              typeof item.cantidad_equipo_pendiente === "object"
                ? (item.cantidad_equipo_pendiente as any)?.parsedValue ?? 0
                : item.cantidad_equipo_pendiente ?? item.cantidad_equipo_concesion ?? 0
            );
            const form = equipoForms[index] ?? {
              unidades: 0,
              estatus: "",
              agregado: false,
              evidencia_entrega: [],
              comentario: "",
            };
            const yaDevuelto = item.status_concesion_equipo === "devuelto";
            const isColapsado = colapsados[index] ?? false;

            return (
              <div
                key={index}
                className={`rounded-xl border shadow-sm overflow-hidden transition-all duration-300 ${
                  yaDevuelto
                    ? "border-gray-200 bg-white"
                    : form.agregado
                    ? "border-green-300 bg-green-50 shadow-green-100"
                    : "border-red-200 bg-red-50/30"
                }`}
              >
                <div
                  className={`flex items-center justify-between px-4 py-2.5 border-b cursor-pointer ${
                    yaDevuelto
                      ? "bg-gray-50 border-gray-100"
                      : form.agregado
                      ? "bg-green-100 border-green-200"
                      : "bg-red-50 border-red-100"
                  }`}
                  onClick={() => toggleColapsado(index)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="text-sm font-semibold text-gray-700 truncate">
                      {item.nombre_equipo || "—"}
                    </p>
                    <span
                      className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        form.agregado && !yaDevuelto
                          ? "bg-green-200 text-green-800"
                          : estatusBadge(item.status_concesion_equipo ?? "")
                      }`}
                    >
                      {form.agregado && !yaDevuelto
                        ? "✓ Agregado"
                        : capitalizeFirstLetter(item.status_concesion_equipo ?? "")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <button
                      type="button"
                      title="Ver detalle"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewEquipo(item);
                      }}
                      className="text-blue-400 hover:text-blue-600 transition-colors"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    {isColapsado ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>

                {!isColapsado && (
                  <>
                    <div className="px-4 py-3">
                      {yaDevuelto ? (
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs text-gray-400 mb-0.5">Unidades totales</p>
                            <p className="text-sm font-medium text-gray-700">
                              {item.cantidad_equipo_concesion ?? "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 mb-0.5">Devueltas</p>
                            <p className="text-sm font-medium text-gray-700">
                              {item.cantidad_equipo_devuelto ?? "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 mb-0.5">Precio</p>
                            <p className="text-sm font-medium text-gray-700">
                              {formatCurrency(
                                (item.costo_equipo_concesion ?? 0) * (item.cantidad_equipo_concesion ?? 0)
                              )}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">

                          <div className="flex flex-col gap-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-xs text-gray-400 mb-0.5">Unidades totales</p>
                                <p className="text-sm font-medium text-gray-700">
                                  {item.cantidad_equipo_concesion ?? "—"}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400 mb-0.5">Precio</p>
                                <p className="text-sm font-medium text-gray-700">
                                  {formatCurrency(
                                    (item.costo_equipo_concesion ?? 0) * (item.cantidad_equipo_concesion ?? 0)
                                  )}
                                </p>
                              </div>
                            </div>

                            <div>
                              <p className="text-xs text-gray-400 mb-1">Unidades a devolver</p>
                              <div className="flex gap-2 items-center">
                                <input
                                  type="number"
                                  min={0}
                                  max={pendientes}
                                  disabled={form.agregado}
                                  value={form.unidades ?? 0}
                                  className="w-full h-9 rounded-md border border-gray-200 bg-white px-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setForm(index, "unidades", val > pendientes ? 0 : val);
                                  }}
                                  onBlur={(e) => {
                                    const val = Math.min(Math.max(Number(e.target.value), 0), pendientes);
                                    setForm(index, "unidades", val);
                                  }}
                                />
                                <button
                                  type="button"
                                  disabled={form.agregado}
                                  onClick={() => setForm(index, "unidades", pendientes)}
                                  className="flex-shrink-0 px-2.5 h-9 rounded-md border border-blue-300 text-blue-600 bg-white hover:bg-blue-50 text-xs font-medium whitespace-nowrap transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Agregar todo
                                </button>
                              </div>
                              <p className="text-xs text-gray-400 mt-1">Pendientes: {pendientes}</p>
                            </div>

                        <div>
                          <p className="text-xs text-gray-400 mb-1">Estado</p>
                          <div className="flex gap-1 flex-wrap">
                            {["completo", "perdido", "dañado"].map((val) => (
                              <button
                                key={val}
                                type="button"
                                disabled={form.agregado}
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

                        <div>
                          <p className="text-xs text-gray-400 mb-1">Comentario</p>
                          <textarea
                            disabled={form.agregado}
                            value={form.comentario ?? ""}
                            onChange={(e) => setForm(index, "comentario", e.target.value)}
                            placeholder="Escribe un comentario..."
                            rows={3}
                            className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm resize-none disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-blue-300"
                          />
                        </div>
                          </div>

                          <div>
                            <LoadImage
                              id={`evidencia-equipo-${index}`}
                              titulo="Evidencia de entrega"
                              showWebcamOption={true}
                              imgArray={form.evidencia_entrega || []}
                              setImg={(imgs) => setForm(index, "evidencia_entrega", imgs)}
                              facingMode="environment"
                              limit={5}
                            />
                          </div>

                        </div>
                      )}
                    </div>

                    {!yaDevuelto && (
                      <div
                        className={`px-4 py-3 border-t flex flex-col gap-2 ${
                          form.agregado ? "border-green-200" : "border-red-100"
                        }`}
                      >
                        {!form.agregado && (form.unidades <= 0 || !form.estatus) && (
                          <p className="text-xs text-red-400">
                            {form.unidades <= 0 && !form.estatus
                              ? "Rellena las unidades y el estado para agregar."
                              : form.unidades <= 0
                              ? "Indica las unidades a devolver."
                              : "Selecciona el estado del equipo."}
                          </p>
                        )}

                        <div className="flex justify-end gap-2">
                          {form.agregado && (
                            <button
                              type="button"
                              onClick={() =>
                                setEquipoForms((prev) => ({
                                  ...prev,
                                  [index]: {
                                    unidades: 0,
                                    estatus: "",
                                    agregado: false,
                                    evidencia_entrega: [],
                                    comentario: "",
                                  },
                                }))
                              }
                              className="px-4 py-1.5 rounded-lg text-xs font-medium border border-gray-300 text-gray-500 bg-white hover:bg-gray-50 transition-colors"
                            >
                              Limpiar
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={form.agregado || !form.estatus || form.unidades <= 0}
                            onClick={() => setForm(index, "agregado", true)}
                            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed ${
                              form.agregado
                                ? "bg-green-100 text-green-700"
                                : "bg-orange-500 hover:bg-orange-600 active:scale-95 text-white"
                            }`}
                          >
                            {form.agregado ? "✓ Agregado" : "⊕ Agregar a devolución"}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
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
        <span className="flex font-bold text-lg">
          <Calculator /> Total:
        </span>
        <span className="font-bold text-lg">{formatCurrency(totalGeneral || totalGeneral2)}</span>
      </div>
    </div>
  );
};

export default DetalleSeguimientoTable;