import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  Calculator,
  ChevronDown,
  ChevronUp,
  Eye,
  FileText,
  Loader2,
  MessageSquare,
  Package,
  PackageCheck,
  RotateCcw,
  Search,
} from "lucide-react";
import { ConcesionadosVerEquipo } from "./modals/concesionados-ver-equipo";
import { capitalizeFirstLetter, formatCurrency } from "@/lib/utils";
import { NuevaDevolucionMiniEquipoModal } from "./modals/concesionados-nueva-devolucion-mini";
import LoadImage, { Imagen } from "./upload-Image";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "./ui/carousel";
import Image from "next/image";
import { Button } from "./ui/button";
import { VerDetalleDevolucion } from "./modals/concesionados-ver-detalle-devolucion";
import { HistorialDevolucionesList } from "./concesionados-historial-devoluciones-list";
import { EquipoConcesionado, DevolucionItem } from "./concesionados-tab-datos";

export type EquipoForm = {
  unidades: number;
  estatus: string;
  agregado: boolean;
  evidencia_entrega: Imagen[];
  comentario_entrega: string;
};

type FiltroEstatus = "todos" | "abierto" | "en proceso" | "devuelto"| "parcial";
const getProgreso = (equipo: EquipoConcesionado) => {
  const total = Number(equipo.cantidad_equipo_concesion ?? 0);

  let pendiente = Number(
    typeof equipo.cantidad_equipo_pendiente === "object"
      ? equipo.cantidad_equipo_pendiente
      : equipo.cantidad_equipo_pendiente
  );
  if (!pendiente) {
    pendiente = total;
  }
  const devueltosReales = total - pendiente;
  const porcentaje =
    total > 0 ? Math.round((devueltosReales / total) * 100) : 0;
  const color =
    porcentaje === 100
      ? "bg-green-500"
      : porcentaje > 0
      ? "bg-yellow-400"
      : "bg-red-400";
  return { porcentaje, color };
};

const getEstatusLabel = (equipo: EquipoConcesionado) => {
  const status = equipo.status_concesion_equipo?.toLowerCase();
  if (status === "devuelto") return "Devuelto";
  if (status === "parcial" || status === "en proceso") return "En Proceso";
  if (status === "abierto" || status === "pendiente") {
    return Number(equipo.cantidad_equipo_devuelto ?? 0) > 0 ? "En Proceso" : "Pendiente";
  }
  const { porcentaje } = getProgreso(equipo);
  if (porcentaje === 100) return "Devuelto";
  if (porcentaje > 0)     return "En Proceso";
  return "Pendiente";
};

const getEstatusStyle = (equipo: EquipoConcesionado) => {
  const status = equipo.status_concesion_equipo?.toLowerCase();
  if (status === "devuelto") return "bg-green-100 text-green-700 border-green-200";
  if (status === "parcial" || status === "en proceso") return "bg-yellow-100 text-yellow-700 border-yellow-200";
  if (status === "abierto" || status === "pendiente") {
    return Number(equipo.cantidad_equipo_devuelto ?? 0) > 0
      ? "bg-yellow-100 text-yellow-700 border-yellow-200"
      : "bg-red-100 text-red-700 border-red-200";
  }
  const { porcentaje } = getProgreso(equipo);
  if (porcentaje === 100) return "bg-green-100 text-green-700 border-green-200";
  if (porcentaje > 0)     return "bg-yellow-100 text-yellow-700 border-yellow-200";
  return "bg-red-100 text-red-700 border-red-200";
};

const getCardStyle = (equipo: EquipoConcesionado, form: EquipoForm) => {
  const yaDevuelto = equipo.status_concesion_equipo === "devuelto";
  if (yaDevuelto) return "border-gray-200 bg-white";
  if (form.agregado) return "border-green-300 bg-green-50 shadow-green-100";
  const { porcentaje } = getProgreso(equipo);
  if (porcentaje > 0 && porcentaje < 100) return "border-yellow-300 bg-yellow-50/40";
  return "border-red-200 bg-red-50/30";
};

const getHeaderStyle = (equipo: EquipoConcesionado, form: EquipoForm) => {
  const yaDevuelto = equipo.status_concesion_equipo === "devuelto";
  if (yaDevuelto) return "bg-gray-50 border-gray-100";
  if (form.agregado) return "bg-green-100 border-green-200";
  const { porcentaje } = getProgreso(equipo);
  if (porcentaje > 0 && porcentaje < 100) return "bg-yellow-50 border-yellow-200";
  return "bg-red-50 border-red-100";
};

const getCosto = (costo: number | number[] | undefined): number => {
  if (Array.isArray(costo)) return costo[0] ?? 0;
  return costo ?? 0;
};

interface DetalleSeguimientoTableProps {
  equipos: EquipoConcesionado[];
  setEquipos: Dispatch<SetStateAction<EquipoConcesionado[]>>;
  onDevolver: (equipo: EquipoConcesionado) => void;
  onDevolverTodo?: () => void;
  isLoadingTodo?: boolean;
  isLoadingFotoExterna?: boolean;
  onLoadingEvidenciaChange?: (isLoading: boolean) => void;
  data: any;
  dataDevolucion: any;
  equipoForms: Record<number, EquipoForm>;
  setEquipoForms: Dispatch<SetStateAction<Record<number, EquipoForm>>>;
}

const DetalleSeguimientoTable: React.FC<DetalleSeguimientoTableProps> = ({
  equipos,
  data,
  dataDevolucion,
  equipoForms,
  setEquipoForms,
  onDevolver,
  onDevolverTodo,
  isLoadingTodo = false,
  isLoadingFotoExterna = false,
  onLoadingEvidenciaChange,
}) => {
  const [openVerEquiposModal, setOpenVerEquiposModal] = useState(false);
  const [agregarEquipoSeleccion, setAgregarEquipoSeleccion] = useState<EquipoConcesionado | null>(null);
  const [openDevolucionMiniEquiposModal, setOpenDevolucionMiniEquiposModal] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [filtroActivo, setFiltroActivo] = useState<FiltroEstatus>("todos");
  const [busqueda, setBusqueda] = useState("");
  const [verDevolucionModal, setVerDevolucionModal] = useState(false);
  const [devolucionSeleccionada] = useState<DevolucionItem | null>(null);
  const [loadingEvidencia, setLoadingEvidencia] = useState<Record<number, boolean>>({});

  const setEvidenciaLoading = (index: number, val: boolean) =>
    setLoadingEvidencia((prev) => ({ ...prev, [index]: val }));

  useEffect(() => {
    const hayAlgunaCargando = Object.values(loadingEvidencia).some(Boolean);
    onLoadingEvidenciaChange?.(hayAlgunaCargando);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingEvidencia]);

  const toggleAccordion = (index: number) =>
    setExpandedIndex(expandedIndex === index ? null : index);

  const setForm = (index: number, key: keyof EquipoForm, value: any) => {
    setEquipoForms((prev) => ({
      ...prev,
      [index]: {
        ...(prev[index] ?? { unidades: 0, estatus: "", agregado: false, evidencia_entrega: [], comentario_entrega: "" }),
        [key]: value,
      },
    }));
  };

  const botonesFiltro: { label: string; value: FiltroEstatus }[] = [
    { label: "Todos", value: "todos" },
    { label: "Pendientes", value: "abierto" },
    { label: "En Proceso", value: "en proceso" },
    { label: "Completado", value: "devuelto" },
  ];

  const equiposFiltrados = equipos.filter((equipo) => {

    const devueltos = Number(equipo.cantidad_equipo_devuelto ?? 0);
    const total = Number(equipo.cantidad_equipo_concesion ?? 0);
  
    let estadoCalculado = "pendiente";
  
    if (devueltos === 0) {
      estadoCalculado = "pendiente";
    } 
    else if (devueltos < total) {
      estadoCalculado = "en proceso";
    } 
    else if (devueltos >= total && total > 0) {
      estadoCalculado = "devuelto";
    }
  
    const matchEstatus =
      filtroActivo === "todos" ||
      estadoCalculado === filtroActivo;
  
    const matchBusqueda =
      busqueda.trim() === "" ||
      (equipo.nombre_equipo ?? "")
        .toLowerCase()
        .includes(busqueda.toLowerCase());
  
    return matchEstatus && matchBusqueda;
  });
  
  const totalGeneral = equipos.reduce((acc, item) => acc + (item.total ?? 0), 0);
  const totalGeneral2 = equipos.reduce((acc, item) =>
    acc + (item.cantidad_equipo_concesion ?? 0) * (item.costo_equipo_concesion ?? 0), 0
  );

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

      <VerDetalleDevolucion
        devolucion={devolucionSeleccionada}
        isSuccess={verDevolucionModal}
        setIsSuccess={setVerDevolucionModal}
      >
        <div />
      </VerDetalleDevolucion>

      <div className="flex gap-2 flex-wrap justify-between mb-4">
        <div className="flex gap-2 flex-wrap items-center">
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

          <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus-within:ring-1 focus-within:ring-blue-400 focus-within:border-blue-400 transition">
            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar equipo..."
              className="outline-none text-sm bg-transparent w-36"
            />
          </div>
        </div>

        {data?.status_concesion !== "devuelto" && onDevolverTodo && (
          <Button
            disabled={isLoadingTodo}
            onClick={onDevolverTodo}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            {isLoadingTodo
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Procesando...</>
              : <><PackageCheck className="w-4 h-4" /> Devolver todo</>
            }
          </Button>
        )}
      </div>

      {equipos && equipos.length > 0 ? (
        <div className="max-h-[460px] overflow-y-auto space-y-3 pr-1 mb-5">
          {equiposFiltrados.map((item, index) => {
            const yaDevuelto = item.status_concesion_equipo === "devuelto";
            const enProceso = item.status_concesion_equipo === "en proceso";
            const form = equipoForms[index] ?? {
              unidades: 0, estatus: "", agregado: false,
              evidencia_entrega: [], comentario_entrega: "",
            };
            const pendientes = Number(
              typeof item.cantidad_equipo_pendiente === "object"
                ? (item.cantidad_equipo_pendiente as any)?.parsedValue ?? 0
                : item.cantidad_equipo_pendiente ?? item.cantidad_equipo_concesion ?? 0
            );
            const { porcentaje, color } = getProgreso(item);
            const isOpen = expandedIndex === index;

            return (
              <div
                key={index}
                className={`rounded-xl border shadow-sm overflow-hidden transition-all duration-300 ${getCardStyle(item, form)}`}
              >
                <div
                  className={`flex items-center justify-between px-4 py-2.5 border-b cursor-pointer ${getHeaderStyle(item, form)}`}
                  onClick={() => toggleAccordion(index)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Package className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-700 truncate">
                        {item.nombre_equipo || "—"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {item.cantidad_equipo_devuelto ?? 0} / {item.cantidad_equipo_concesion ?? 0} unidades devueltas
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                      form.agregado && !yaDevuelto
                        ? "bg-green-200 text-green-800 border-green-300"
                        : getEstatusStyle(item)
                    }`}>
                      {form.agregado && !yaDevuelto ? "✓ Agregado" : getEstatusLabel(item)}
                    </span>
                    <button
                      type="button"
                      title="Ver detalle"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAgregarEquipoSeleccion(item);
                        setOpenVerEquiposModal(true);
                      }}
                      className="text-blue-400 hover:text-blue-600 transition-colors"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    {isOpen
                      ? <ChevronUp className="w-4 h-4 text-gray-400" />
                      : <ChevronDown className="w-4 h-4 text-gray-400" />
                    }
                  </div>
                </div>

                <div className="px-4 pt-2 pb-1">
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

                {isOpen && (
                  <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-4 space-y-4">

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-xl border border-blue-100 px-4 py-3">
                        <p className="text-xs text-gray-400 mb-0.5">Precio unitario</p>
                        <p className="text-sm font-bold text-blue-700">
                          {formatCurrency(getCosto(item.costo_equipo_concesion))}
                        </p>
                      </div>
                      <div className="bg-white rounded-xl border border-blue-100 px-4 py-3">
                        <p className="text-xs text-gray-400 mb-0.5">Subtotal</p>
                        <p className="text-sm font-bold text-blue-700">
                          {formatCurrency((item.cantidad_equipo_concesion ?? 0) * getCosto(item.costo_equipo_concesion))}
                        </p>
                      </div>
                    </div>

                    {item.comentario_entrega && (
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-purple-400 mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-gray-600">{item.comentario_entrega}</span>
                      </div>
                    )}
                    <div className="w-full">
                      <HistorialDevolucionesList devoluciones={item?.devoluciones ?? []} />
                    </div>

                    {item.imagen_equipo_concesion && item.imagen_equipo_concesion.length > 0 && (
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="w-full">
                          <p className="text-xs text-gray-400 mb-2">Evidencia de Entrega del Equipo</p>
                          <div className="flex justify-center">
                            <Carousel className="w-52">
                              <CarouselContent>
                                {item.imagen_equipo_concesion.map((a, i) => (
                                  <CarouselItem key={i}>
                                    <div className="p-1">
                                      <div className="rounded-xl overflow-hidden border bg-gray-50 aspect-square flex items-center justify-center">
                                        <Image
                                          width={280} height={280}
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
                              {item.imagen_equipo_concesion.length > 1 && (
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

                    {!yaDevuelto && (
                      <>
                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                          <div className="flex flex-col gap-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-xs text-gray-400 mb-0.5">Unidades totales</p>
                                <p className="text-sm font-medium text-gray-700">
                                  {item.cantidad_equipo_concesion ?? "—"}
                                </p>
                              </div>
                              {enProceso && (
                                <div>
                                  <p className="text-xs text-gray-400 mb-0.5">Ya devueltas</p>
                                  <p className="text-sm font-medium text-yellow-600">
                                    {item.cantidad_equipo_devuelto ?? 0}
                                  </p>
                                </div>
                              )}
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
                                    {capitalizeFirstLetter(val)}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <p className="text-xs text-gray-400 mb-1">Comentario</p>
                              <textarea
                                disabled={form.agregado}
                                value={form.comentario_entrega ?? ""}
                                onChange={(e) => setForm(index, "comentario_entrega", e.target.value)}
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
                              onLoadingChange={(val) => setEvidenciaLoading(index, val)}
                            />
                          </div>
                        </div>

                        <div className={`pt-3 border-t flex flex-col gap-2 ${form.agregado ? "border-green-200" : "border-red-100"}`}>
                          {!form.agregado && (form.unidades <= 0 || !form.estatus) && (
                            <p className="text-xs text-red-400">
                              {form.unidades <= 0 && !form.estatus
                                ? "Rellena las unidades y el estado para agregar."
                                : form.unidades <= 0
                                ? "Indica las unidades a devolver."
                                : "Selecciona el estado del equipo."}
                            </p>
                          )}
                          {loadingEvidencia[index] && (
                            <p className="text-xs text-gray-400 flex items-center gap-1.5">
                              <Loader2 className="animate-spin w-3 h-3" /> Subiendo evidencia...
                            </p>
                          )}
                          <div className="flex justify-end gap-2">
                            {form.agregado && (
                              <button
                                type="button"
                                onClick={() =>
                                  setEquipoForms((prev) => ({
                                    ...prev,
                                    [index]: { unidades: 0, estatus: "", agregado: false, evidencia_entrega: [], comentario_entrega: "" },
                                  }))
                                }
                                className="px-4 py-1.5 rounded-lg text-xs font-medium border border-gray-300 text-gray-500 bg-white hover:bg-gray-50 transition-colors"
                              >
                                Limpiar
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={form.agregado || !form.estatus || form.unidades <= 0 || !!loadingEvidencia[index] || isLoadingFotoExterna}
                              onClick={() => setForm(index, "agregado", true)}
                              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed ${
                                form.agregado
                                  ? "bg-green-100 text-green-700"
                                  : "bg-orange-500 hover:bg-orange-600 active:scale-95 text-white"
                              }`}
                            >
                              {form.agregado ? "✓ Agregado" : "⊕ Agregar a devolución"}
                            </button>
                            <Button
                              disabled={!!loadingEvidencia[index] || isLoadingFotoExterna}
                              onClick={(e) => { e.stopPropagation(); onDevolver(item); }}
                              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
                            >
                              <RotateCcw className="w-4 h-4" />
                              Devolver
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 bg-white border border-gray-200 rounded-xl text-gray-400 gap-2">
          <Package className="w-8 h-8 text-gray-300" />
          <p className="text-sm">No hay equipos registrados.</p>
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