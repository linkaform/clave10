"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useGetRondinById } from "@/hooks/Rondines/useGetRondinById";
import { usePlayOrPauseRondin } from "@/hooks/Rondines/usePlayOrPauseROndin";
import { useEditAreasRondin } from "@/hooks/Rondines/useEditAreasRondin";
import { useCatalogoAreaEmpleado } from "@/hooks/useCatalogoAreaEmpleado";
import { useBoothStore } from "@/store/useBoothStore";
import { EliminarRondinModal } from "@/components/modals/delete-rondin-modal";
import { AreasList } from "@/components/areas-list-draggable";
import { Button } from "@/components/ui/button";
import {
  Loader2, MoveLeft, Pause, Play, Search, Trash2,
  MapPin, Clock, RefreshCw, User, AlertCircle, CalendarDays,
  Tag,
  Layers,
  FilePenLine,
} from "lucide-react";
import { useRecorridoStore } from "@/store/useRecorridoStore";
import { useCatalogoPaseAreaLocation } from "@/hooks/useCatalogoPaseAreaLocation";
import { capitalizeFirstLetter, formatForMultiselect } from "@/lib/utils";
import { useEditarRondin } from "@/hooks/Rondines/useEditarRondin";
import MultiSelect from "react-select";
import { useAreasLocationStore } from "@/store/useGetAreaLocationByUser";
import DateTimePicker from "@/components/dateTimerPicker";
import { format } from "date-fns";
import { useEjecutarRecorrido } from "@/hooks/Rondines/recorridos/useEjecutarRecorrido";
import { useCatalogoGrupos } from "@/hooks/Rondines/useCatalogoGrupos";
import Select from "react-select";
import { useCatalogoInspeccionesRecorridos } from "@/hooks/Rondines/recorridos/useCatalogoInspecciones";
import MapView from "@/components/map-v2";
import { useActualizarInspeccion } from "@/hooks/Rondines/recorridos/useActualizarInspeccion";

export type RecurrenciaValida = "diario" | "semana" | "mes" | "configurable";

export const RECURRENCIAS_VALIDAS: RecurrenciaValida[] = ["diario", "semana", "mes", "configurable"];

export function parseRecurrencia(value: string | undefined): RecurrenciaValida | "" {
  if (!value) return "";
  return RECURRENCIAS_VALIDAS.includes(value as RecurrenciaValida) ? (value as RecurrenciaValida) : "";
}

const RondinDetalle = ({ id }: { id: string }) => {

  const { recorridoSeleccionado, setRecorridoSeleccionado } = useRecorridoStore();
  const [forceRefetch, setForceRefetch] = useState(false);
  const needsFetch = recorridoSeleccionado?._id !== id || forceRefetch;
  const { data: recorridoFetched, isLoadingRondin } = useGetRondinById(needsFetch ? id : "");
  const rondin = needsFetch ? recorridoFetched : recorridoSeleccionado;

  const { locations, areas: areasStore, fetchLocations, fetchAreas } = useAreasLocationStore();
  const {actualizarInspeccionMutation}= useActualizarInspeccion();
  const [duracion, setDuracion] = useState("");
  const [tipoRondin, setTipoRondin] = useState("");
  const [areaSeleccionada, setAreaSeleccionada] = useState("");

  const { dataAreas } = useCatalogoPaseAreaLocation(
    rondin?.ubicacion ?? "", true, !!rondin?.ubicacion
  );
  const { editarRondinMutation } = useEditarRondin();
  const router = useRouter();
  const { location } = useBoothStore();
  const { playOrPauseRondinMutation } = usePlayOrPauseRondin();
  const { ejecutarRecorridoMutation } = useEjecutarRecorrido();
  const { editAreasRodindMutation, isLoading: isLoadingEditAreas } = useEditAreasRondin();
  // const { mutate: asignarRondinMutation, isPending: isLoadingAsignar } = useAsignarRondin();
  const { data: dataEmpleados, isLoading: loadingEmpleados } = useCatalogoAreaEmpleado(true, location ?? "", "Incidencias");
  const { data: dataInspecciones, isLoading: loadingInspecciones } = useCatalogoInspeccionesRecorridos();
  const [areas, setAreas] = useState<any[]>([]);
  const [areaSearch, setAreaSearch] = useState("");
  const [ubicacionesLS, setUbicacionesLS] = useState<string[]>([]);
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState(rondin?.ubicacion || "");
  const [tipoAsignado, setTipoAsignado] = useState<"guardia" | "persona" | "grupo">("guardia");
  const [grupoSeleccionado, setGrupoSeleccionado] = useState("");
  const [recurrenciaSeleccionada, setRecurrenciaSeleccionada] = useState("");
  const [que_dias_de_la_semana, set_que_dias_de_la_semana] = useState<string[]>([]);
  const [en_que_semana_sucede, set_en_que_semana_sucede] = useState<string>("");
  const [en_que_mes, set_en_que_mes] = useState<string[]>([]);
  const [todas_las_semanas, set_todas_las_semanas] = useState(false);
  const [todas_las_meses, set_todas_las_meses] = useState(false);
  const [esRepetirCada, setEsRepetirCada] = useState<boolean | null>(null);
  const [mostrarFrecuencia, setMostrarFrecuencia] = useState(false);
  const [cada_cuantas_horas_se_repite, set_cada_cuantas_horas_se_repite] = useState<number>(1);
  const [cada_cuantos_meses_se_repite, set_cada_cuantos_meses_se_repite] = useState<number>(0);
  const [que_dia_del_mes, set_que_dia_del_mes] = useState("");
  const [cron_conf, set_cron_conf] = useState("");
  const [isLoadingPause, setIsLoadingPause] = useState(false);
  const [isLoadingPlay, setIsLoadingPlay] = useState(false);
  const diasSemana = ["domingo","lunes","martes","miercoles","jueves","viernes","sabado"];
  const mesesDelAño = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const { data: dataGrupos, isLoading: loadingGrupos } = useCatalogoGrupos(true); 
  const [empleadosSeleccionados, setEmpleadosSeleccionados] = useState<string[]>([]);
  const [modalInspeccionAbierto, setModalInspeccionAbierto] = useState(false);
  const [areaInspeccion, setAreaInspeccion] = useState<string | string[]>("");
  const [inspeccionSeleccionada, setInspeccionSeleccionada] = useState("");
  const [promptInspeccion, setPromptInspeccion] = useState(""); 
  const anyLoading = isLoadingPause || isLoadingPlay || ejecutarRecorridoMutation.isPending;
  const [fechaProgramada, setFechaProgramada] = useState<Date | undefined>(
  rondin?.fecha_inicio_rondin ? new Date(rondin.fecha_inicio_rondin) : undefined);
  const opciones = fechaProgramada ? opcionesMensuales(fechaProgramada) : [];

  function toggleDia(dia: string) {
    set_que_dias_de_la_semana((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]
    );
  }
  const toggleTodos = () => {
    if (que_dias_de_la_semana.length === diasSemana.length) set_que_dias_de_la_semana([]);
    else set_que_dias_de_la_semana(diasSemana.map((d) => d.toLowerCase()));
  };
  const toggleSemana = (semana: string) => {
    set_en_que_semana_sucede((prev) => (prev === semana ? "" : semana));
  };
  const toggleMes = (mes: string) => {
    set_en_que_mes((prev) => prev.includes(mes) ? prev.filter((m) => m !== mes) : [...prev, mes]);
  };
  const seleccionar = (valor: boolean) => {
    setEsRepetirCada((prev) => (prev === valor ? null : valor));
  };
  function opcionesMensuales(fecha: Date): string[] {
    const diaDelMes = fecha.getDate();
    const op1 = `Mensualmente el día ${diaDelMes}`;
    const diaSemana = fecha.getDay();
    const nombreDia = diasSemana[diaSemana];
    const semanaDelMes = Math.ceil(diaDelMes / 7);
    const ordinales = ["","primer","segundo","tercer","cuarto","quinto"];
    const op2 = `Mensualmente el ${ordinales[semanaDelMes]} ${nombreDia} del mes`;
    return [op1, op2];
  }

  useEffect(() => {
    if (!locations?.length) fetchLocations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (rondin?.ubicacion && !areasStore?.length) {
      fetchAreas(rondin.ubicacion);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rondin?.ubicacion]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("ubicaciones_soter");
      setUbicacionesLS(stored ? JSON.parse(stored) : []);
    } catch { setUbicacionesLS([]); }
  }, []);

  useEffect(() => {
    if (!rondin) return;

    // Asignación
    const tipo = rondin.tipo_asignacion;
    if (!tipo || tipo === "responsable_en_turno") {
      setTipoAsignado("guardia");
      setEmpleadosSeleccionados([]);
      setGrupoSeleccionado("");
    } else if (tipo === "persona_especifica") {
      setTipoAsignado("persona");
      setEmpleadosSeleccionados(Array.isArray(rondin.empleados_asignado) ? rondin.empleados_asignado : []);
      setGrupoSeleccionado("");
    } else if (tipo === "grupo") {
      setTipoAsignado("grupo");
      setEmpleadosSeleccionados([]);
      setGrupoSeleccionado(rondin.id_grupo ?? "");
      setGrupoSeleccionado(rondin.grupo_asignado ?? "");
    }

    // Campos generales
    setRecurrenciaSeleccionada(parseRecurrencia(rondin.se_repite_cada));
    setDuracion(rondin.duracion_esperada_rondin?.replace(" minutos", "") || "");
    setTipoRondin(rondin.tipo_rondin || "");
    setAreaSeleccionada(rondin.area || "");
    if (rondin.fecha_inicio_rondin) setFechaProgramada(new Date(rondin.fecha_inicio_rondin));
    if (rondin.areas) setAreas(rondin.areas);
    
    // Área
    setAreaSeleccionada(rondin.ubicacion_area || rondin.area || "");

    // Días de la semana
    if (rondin.que_dias_de_la_semana?.length) {
      set_que_dias_de_la_semana(Array.isArray(rondin.que_dias_de_la_semana) ? rondin.que_dias_de_la_semana : []);
    }
    
    // Ubicación
    setUbicacionSeleccionada(rondin.ubicacion || "");

      // Frecuencia horas
      if (rondin.cada_cuantas_horas_se_repite) {
        console.log( "HORAS", rondin.cada_cuantas_horas_se_repite)
        setMostrarFrecuencia(true);
        set_cada_cuantas_horas_se_repite(Number(rondin.cada_cuantas_horas_se_repite));
      } else {
        setMostrarFrecuencia(false);
        set_cada_cuantas_horas_se_repite(1);
      }
  }, [rondin]);

  useEffect(() => {
    if (recorridoFetched) {
      setRecorridoSeleccionado(recorridoFetched as any);
      setForceRefetch(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recorridoFetched]);

  const handlePlay = async () => {
      setIsLoadingPlay(true);
      try {
        await playOrPauseRondinMutation.mutateAsync({ record_id: id, paused: false },
          { onSuccess: () => setForceRefetch(true) }
        );
      } finally {
        setIsLoadingPlay(false);
      }
  };

  const handleAbrirModalInspeccion = (areaNombre?: string) => {
      setAreaInspeccion(areaNombre ?? "");
      setInspeccionSeleccionada("");
      setPromptInspeccion("");
      setModalInspeccionAbierto(true);
  };

  const handlePause = async () => {
    setIsLoadingPause(true);
    try {
      await playOrPauseRondinMutation.mutateAsync({ record_id: id, paused: true },
        { onSuccess: () => setForceRefetch(true) }
      );
    } finally {
      setIsLoadingPause(false);
    }
  };

  const handleAsignarInspeccion = () => {
    actualizarInspeccionMutation.mutate({
      folio: rondin?._id ?? "",
      rondin_data: {
        inspeccion: inspeccionSeleccionada,
        areas: areaInspeccion === "todas"
          ? ["todas"]
          : Array.isArray(areaInspeccion)
          ? areaInspeccion
          : [areaInspeccion],
        prompt_inspeccion: promptInspeccion,
      },
    }
    ,{
      onSuccess: () => {
        setModalInspeccionAbierto(false);
        setForceRefetch(true);
      }
    })
  };
  
  const handleEjecutar = async (dag_id: string) => {
    await ejecutarRecorridoMutation.mutateAsync({ dag_id },{ onSuccess: () => setForceRefetch(true) });
  }

  const handleGuardar = () => {
    editAreasRodindMutation.mutate({ areas, record_id: id, folio: rondin?.folio ?? "" },);
  };

const handleActualizar = () => {
  const asignadoA = tipoAsignado === "guardia"
    ? "responsable_en_turno"
    : tipoAsignado === "grupo"
    ? [grupoSeleccionado]
    : empleadosSeleccionados.length > 0
    ? empleadosSeleccionados
    : "responsable_en_turno"; 

    editarRondinMutation.mutate({
      folio: rondin?.folio ?? "",
      rondin_data: {
        duracion_estimada: duracion ? `${duracion} minutos` : "",
        tipo_rondin: tipoRondin,
        se_repite_cada: recurrenciaSeleccionada,
        area: areaSeleccionada,
        tipo_asignacion: tipoAsignado === "guardia" ? "responsable_en_turno" : tipoAsignado,
        asignado_a: asignadoA,
        fecha_hora_programada: fechaProgramada ? format(fechaProgramada, "yyyy-MM-dd HH:mm:ss") : "",
        cada_cuantas_horas_se_repite: mostrarFrecuencia ? cada_cuantas_horas_se_repite : null,
      } as any,
    },{ onSuccess: () => setForceRefetch(true) });
  };

  const filteredAreas = areas.filter((a: any) =>
    (a.rondin_area || "").toLowerCase().includes(areaSearch.toLowerCase())
  );

  if (isLoadingRondin) return (
    <div className="flex flex-col items-center gap-3 h-32 justify-center">
      <div className="relative h-8 w-8">
        <div className="absolute inset-0 rounded-full border-2 border-slate-200" />
        <div className="absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
      <span className="text-base text-slate-500">Cargando registro...</span>
    </div>
  );

  if (!rondin) return <div className="p-8 text-center text-gray-400">Rondín no encontrado</div>;

  const statusMap: Record<string, string> = {
    Corriendo: "bg-green-50 text-green-700 border border-green-200 ring-1 ring-green-300/50",
    Pausado:   "bg-yellow-50 text-yellow-700 border border-yellow-200 ring-1 ring-yellow-300/50",
    Cancelado: "bg-red-50 text-red-700 border border-red-200 ring-1 ring-red-300/50",
    Cerrado:   "bg-slate-50 text-slate-500 border border-slate-200 ring-1 ring-slate-300/50",
    Programado:"bg-purple-50 text-purple-700 border border-purple-200 ring-1 ring-purple-300/50",
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 min-h-screen px-4 pt-2">
      {modalEliminarAbierto && (
        <EliminarRondinModal
          title="Eliminar Rondin"
          folio={rondin.folio}
          modalEliminarAbierto={modalEliminarAbierto}
          setModalEliminarAbierto={setModalEliminarAbierto}
        />
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-5 mb-4">
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard/rondines?tab=recorridos")}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500">
              <MoveLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-gray-900">{rondin.nombre_del_rondin}</h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Folio badge */}
            {rondin.folio && (
             <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold bg-blue-50 text-blue-700 border border-blue-200 ring-1 ring-blue-300/50">
                # {rondin.folio}
              </span>
            )}

            {/* Estatus badge */}
            <span className={`inline-flex capitalize items-center px-4 py-1.5 rounded-full text-sm font-semibold ${statusMap[rondin.estatus_rondin] ?? "bg-slate-50 text-slate-500 border border-slate-200"}`}>
              <span className={`w-2 h-2 rounded-full mr-2 ${
                rondin.estatus_rondin === "Corriendo" ? "bg-green-500" :
                rondin.estatus_rondin === "Pausado" ? "bg-yellow-500" :
                rondin.estatus_rondin === "Cancelado" ? "bg-red-500" :
                rondin.estatus_rondin === "Programado" ? "bg-purple-500" : "bg-slate-400"
              }`} />
              {rondin.estatus_rondin}
            </span>

            {/* Divider */}
            <div className="w-px h-7 bg-gray-200 mx-1" />

            {rondin.estatus_rondin === "Corriendo" ? (
              <button
                onClick={handlePause}
                disabled={anyLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-yellow-500 text-white hover:bg-yellow-600 transition-all shadow-sm disabled:opacity-50">
                {isLoadingPause ? <Loader2 size={15} className="animate-spin" /> : <Pause size={15} />}
                Pausar
              </button>
            ) : (
              <button
                onClick={handlePlay}
                disabled={anyLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-green-600 text-white hover:bg-green-700 transition-all shadow-sm disabled:opacity-50">
                {isLoadingPlay ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
                Reanudar
              </button>
            )}

            <button
              type="button"
              onClick={() => handleEjecutar(rondin.dag_id)}
              disabled={anyLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-all shadow-sm disabled:opacity-50">
              {ejecutarRecorridoMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Ejecutar ahora
            </button>

            <button
              onClick={() => setModalEliminarAbierto(true)}
              disabled={anyLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-all shadow-sm disabled:opacity-50">
              <Trash2 className="w-4 h-4" />
              Eliminar
            </button>
          </div>
        </div>

        {/* Campos */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">

        {/* Ubicación */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Ubicación
          </label>
          <select value={ubicacionSeleccionada} onChange={(e) => setUbicacionSeleccionada(e.target.value)}
            className="w-full px-2 py-1.5 h-[38px] rounded-lg border border-blue-200 bg-white text-gray-800 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-300 appearance-none">
            <option value="">Selecciona ubicación</option>
            {(locations?.length ? locations : ubicacionesLS).map((u: string) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>

        {/* Área */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1">
            <Layers className="w-3 h-3" /> Área
          </label>
          <MultiSelect
            placeholder="Área"
            className="text-xs"
            styles={{
              control: (base) => ({ ...base, minHeight: "38px", fontSize: "12px", borderColor: "#bfdbfe", borderRadius: "8px" }),
              valueContainer: (base) => ({ ...base, padding: "0 8px" }),
              indicatorsContainer: (base) => ({ ...base, height: "32px" }),
            }}
            value={areaSeleccionada ? { value: areaSeleccionada, label: areaSeleccionada } : null}
            options={formatForMultiselect(areasStore?.length ? areasStore : dataAreas ?? [])}
            onChange={(opt: any) => setAreaSeleccionada(opt ? opt.value : "")}
            isClearable
          />
        </div>
        {/* Duración */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1">
            <Clock className="w-3 h-3" /> Duración (min)
          </label>
          <input type="number" min={1} max={60} value={duracion} 
            onChange={(e) => setDuracion(e.target.value)}
            placeholder="Ej: 30"
            className="w-full px-2 py-1.5 h-[38px]  rounded-lg border border-blue-200 bg-white text-gray-800 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-300" />
        </div>
        {/* Fecha programada */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1">
            <CalendarDays className="w-3 h-3" /> Fecha programada
          </label>
          <DateTimePicker
            showTime={true}
            allowPast={true}
            placeholder="Fecha y hora"
            date={fechaProgramada}
            setDate={(d) => setFechaProgramada(d ?? undefined)}
          />
        </div>
        {/* Tipo de rondín */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1">
            <Tag className="w-3 h-3" /> Tipo
          </label>
          <select value={tipoRondin} onChange={(e) => setTipoRondin(e.target.value)}
            className="w-full h-[38px]  px-2 py-1.5 rounded-lg border border-blue-200 bg-white text-gray-800 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-300 appearance-none">
            <option value="">Selecciona tipo</option>
            <option value="nfc">NFC</option>
            <option value="qr">QR</option>
          </select>
        </div>

        {/* Recurrencia selector */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Recurrencia
          </label>
          <select value={recurrenciaSeleccionada}
            onChange={(e) => {
              setRecurrenciaSeleccionada(e.target.value);
              set_en_que_semana_sucede("");
              set_todas_las_semanas(false);
              set_en_que_mes([]);
              if (e.target.value === "diario") set_que_dias_de_la_semana(diasSemana);
            }}
            className="w-full h-[38px] px-2 py-1.5 rounded-lg border border-blue-200 bg-white text-gray-800 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-300 appearance-none">
            <option value="">Selecciona recurrencia</option>
            <option value="diario">Por Día</option>
            <option value="semana">Semanal</option>
            <option value="mes">Mensual</option>
            <option value="configurable">Configurable</option>
          </select>
        </div>

        {/* Asignado a */}
      <div className="flex flex-col gap-1 col-span-2">
        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1">
          <User className="w-3 h-3" /> Asignado a
        </label>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button type="button"
            onClick={() => { setTipoAsignado("guardia"); setGrupoSeleccionado(""); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border whitespace-nowrap ${
              tipoAsignado === "guardia" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
            }`}>
            Responsable en turno
          </button>
          <button type="button"
            onClick={() => { setTipoAsignado("persona"); setGrupoSeleccionado(""); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border whitespace-nowrap ${
              tipoAsignado === "persona" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
            }`}>
            Persona específica
          </button>
          <button type="button"
            onClick={() => { setTipoAsignado("grupo");}}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border whitespace-nowrap ${
              tipoAsignado === "grupo" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
            }`}>
            Grupo
          </button>

         {tipoAsignado === "persona" && (
          <Select
            isMulti
            placeholder="Selecciona personas"
            options={dataEmpleados?.map((e: string) => ({ value: e, label: e })) ?? []}
            isLoading={loadingEmpleados}
            loadingMessage={() => "Cargando..."}
            value={empleadosSeleccionados.map((e) => ({ value: e, label: e }))}
            onChange={(selected:any) => setEmpleadosSeleccionados(selected.map((s: any) => s.value))}
            className="flex-1 min-w-[200px] text-xs"
            styles={{
              control: (base: any) => ({ ...base, minHeight: "38px", fontSize: "12px", borderColor: "#bfdbfe", borderRadius: "8px" }),
              valueContainer: (base:any) => ({ ...base, padding: "0 8px" }),
            }}
            isClearable
          />
        )}
          {tipoAsignado === "grupo" && (
            <select value={grupoSeleccionado} onChange={(e) => setGrupoSeleccionado(e.target.value)}
              className="flex-1 h-[38px] min-w-[140px] px-2 py-1.5 rounded-lg border border-blue-200 bg-white text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-300 appearance-none">
              <option value="">Selecciona un grupo</option>
              {loadingGrupos ? <option disabled>Cargando...</option> : 
                dataGrupos?.length > 0 ? (
                  dataGrupos.map((g: string, i: number) => <option key={i} value={g}>{g}</option>)
                ) : (
                  <option disabled>Sin grupos disponibles</option>
                )
              }
            </select>
          )}
        </div>
      </div>

      

      </div>

      {/* Expansión de recurrencia */}
      {recurrenciaSeleccionada && (
        <div className="mt-3 bg-gray-50 rounded-xl p-3 border border-gray-100">

          {/* Diario */}
          {recurrenciaSeleccionada === "diario" && (
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-xs font-medium text-gray-600">Días de acceso:</span>
                <div className="flex items-center gap-1.5">
                  <input type="checkbox" checked={que_dias_de_la_semana.length === diasSemana.length} onChange={toggleTodos} />
                  <span className="text-xs">Todos los días</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {diasSemana.map((dia) => (
                  <button key={dia} type="button" onClick={() => toggleDia(dia.toLowerCase())}
                    className={`px-2.5 py-1 text-xs rounded-md transition-all ${
                      que_dias_de_la_semana.includes(dia.toLowerCase())
                        ? "bg-blue-600 text-white"
                        : "border border-blue-400 bg-white text-blue-600"
                    }`}>
                    {capitalizeFirstLetter(dia)}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-600">Frecuencia (horas)</span>
                  <button
                    type="button"
                    onClick={() => setMostrarFrecuencia(!mostrarFrecuencia)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      mostrarFrecuencia ? "bg-blue-600" : "bg-gray-300"
                    }`}>
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                      mostrarFrecuencia ? "translate-x-4" : "translate-x-1"
                    }`} />
                  </button>
                </div>
                {mostrarFrecuencia && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">Cada:</span>
                    <input
                      type="number"
                      min={1}
                      max={24}
                      value={cada_cuantas_horas_se_repite}
                      onChange={(e) => set_cada_cuantas_horas_se_repite(Number(e.target.value))}
                      className="w-16 px-2 py-1 border border-blue-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                    <span className="text-xs text-gray-600">hora(s)</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Semanal */}
          {recurrenciaSeleccionada === "semana" && (
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-xs font-medium text-gray-600">Semana del mes:</span>
                <div className="flex items-center gap-1.5">
                  <input type="checkbox" onChange={(e) => set_todas_las_semanas(e.target.checked)} />
                  <span className="text-xs">Todas las semanas</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {["Primer semana","Segunda semana","Tercer semana","Cuarta semana","Quinta semana"].map((semana, idx) => {
                  const value = ["primer_semana_del_mes","segunda_semana_del_mes","tercer_semana_del_mes","cuarta_semana_del_mes","quinta_semana_del_mes"][idx];
                  return (
                    <button key={value} type="button" onClick={() => toggleSemana(value)}
                      className={`px-2.5 py-1 text-xs rounded-md transition-all ${
                        todas_las_semanas || en_que_semana_sucede === value
                          ? "bg-blue-600 text-white"
                          : "border border-blue-400 bg-white text-blue-600"
                      }`}>
                      {semana}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mensual */}
          {recurrenciaSeleccionada === "mes" && (
            <div className="flex flex-col gap-2">
              <div>
                <span className="text-xs font-medium text-gray-600">Corriendo cada: </span>
                <select value={que_dia_del_mes} onChange={(e) => set_que_dia_del_mes(e.target.value)}
                  className="w-1/4 mt-1 h-[38px]  px-2 py-1.5 rounded-lg border border-blue-200 bg-white text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-300 appearance-none">
                  <option value="">Selecciona una opción</option>
                  {opciones.map((op, i) => <option key={i} value={op}>{op}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => seleccionar(true)}
                  className={`px-2.5 py-1 text-xs rounded-md ${esRepetirCada === true ? "bg-blue-600 text-white" : "border border-blue-400 bg-white text-blue-600"}`}>
                  Repetir cada X mes
                </button>
                <button type="button" onClick={() => seleccionar(false)}
                  className={`px-2.5 py-1 text-xs rounded-md ${esRepetirCada === false ? "bg-blue-600 text-white" : "border border-blue-400 bg-white text-blue-600"}`}>
                  Seleccionar meses
                </button>
              </div>
              {esRepetirCada === true && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">Se repetirá cada:</span>
                  <input type="number" min={1} max={12} value={cada_cuantos_meses_se_repite || ""}
                    onChange={(e) => set_cada_cuantos_meses_se_repite(Number(e.target.value))}
                    className="w-16 px-2 py-1 border rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-300" />
                  <span className="text-xs text-gray-600">mes(es)</span>
                </div>
              )}
              {esRepetirCada === false && (
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-medium text-gray-600">Meses de acceso:</span>
                    <div className="flex items-center gap-1.5">
                      <input type="checkbox" checked={todas_las_meses}
                        onChange={(e) => {
                          set_todas_las_meses(e.target.checked);
                          set_en_que_mes(e.target.checked ? ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"] : []);
                        }} />
                      <span className="text-xs">Todos</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {mesesDelAño.map((mes) => {
                      const mesLower = mes.toLowerCase();
                      return (
                        <button key={mesLower} type="button" onClick={() => toggleMes(mesLower)}
                          className={`px-2.5 py-1 text-xs rounded-md ${
                            en_que_mes.includes(mesLower) ? "bg-blue-600 text-white" : "border border-blue-400 bg-white text-blue-600"
                          }`}>
                          {mes}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Configurable */}
          {recurrenciaSeleccionada === "configurable" && (
            <div>
              <span className="text-xs font-medium text-gray-600">Configuración Cron:</span>
              <input placeholder="* * * * *" value={cron_conf}
                onChange={(e) => {
                  let v = e.target.value.replace(/\s+/g, " ");
                  if (v.startsWith(" ")) v = v.trimStart();
                  let parts = v.split(" ");
                  if (parts.length > 5) parts = parts.slice(0, 5);
                  set_cron_conf(parts.join(" "));
                }}
                className="w-full mt-1 px-2 py-1.5 rounded-lg border border-blue-200 bg-white text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-300" />
              <small className="text-gray-400 text-[10px]">Ingresa 5 valores separados por espacios.</small>
            </div>
          )}

        </div>
      )}
      {/* Botón actualizar */}
      <div className="flex justify-end mt-3">
        <button type="button" onClick={handleActualizar}
          disabled={editarRondinMutation.isPending }
          className="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed">
          {editarRondinMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FilePenLine className="w-4 h-4 " />
          )}
          {editarRondinMutation.isPending ? "Actualizando..." : "Actualizar Recorrido"}
        </button>
      </div>
      </div>
    
    {/*AREAS*/}
    <div className="flex flex-col md:flex-row gap-4 mb-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 w-full md:w-[480px] shrink-0 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-800 text-sm">Puntos del rondín</h3>
            <p className="text-xs text-gray-400">{rondin.cantidad_de_puntos} puntos</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline"
              className="rounded-lg text-xs bg-blue-600 text-white hover:bg-blue-700 hover:text-white font-bold"
              onClick={() => handleAbrirModalInspeccion()}>
              + Agregar Inspección
            </Button>
            <Button size="sm" className="rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold"
              onClick={handleGuardar} disabled={isLoadingEditAreas}>
              {isLoadingEditAreas ? <Loader2 className="animate-spin w-3.5 h-3.5" /> : "Guardar"}
            </Button>
          </div>
        </div>

        {modalInspeccionAbierto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={() => setModalInspeccionAbierto(false)}>
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 w-full max-w-sm mx-4"
              onClick={(e) => e.stopPropagation()}>
              <h3 className="text-base font-semibold text-gray-800 mb-4">Agregar inspección</h3>
              <div className="flex flex-col gap-3">

                {/* Área */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Área</label>
                  {typeof areaInspeccion === "string" && areaInspeccion !== "" && areaInspeccion !== "todas" ? (
                    // Viene desde el botón de un área específica — solo mostrar el nombre
                    <div className="px-3 py-2 rounded-lg border border-blue-100 bg-blue-50 text-xs font-medium text-blue-700">
                      {areaInspeccion}
                    </div>
                  ) : (
                    // Viene desde el botón general — mostrar checkbox + multiselect
                    <div className="flex flex-col gap-1.5">
                      <label className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-blue-200 bg-white cursor-pointer hover:bg-blue-50 transition-colors">
                        <input
                          type="checkbox"
                          checked={areaInspeccion === "todas"}
                          onChange={(e) => setAreaInspeccion(e.target.checked ? "todas" : "")}
                          className="accent-blue-600"
                        />
                        <span className="text-xs font-medium text-gray-700">Todas las áreas</span>
                      </label>
                      <Select
                        isMulti
                        isDisabled={areaInspeccion === "todas"}
                        placeholder="Selecciona áreas..."
                        options={(areasStore?.length ? areasStore : dataAreas ?? []).map((a: string) => ({ value: a, label: a }))}
                        value={
                          areaInspeccion === "todas" || !areaInspeccion
                            ? []
                            : (Array.isArray(areaInspeccion) ? areaInspeccion : [areaInspeccion]).map((a: string) => ({ value: a, label: a }))
                        }
                        onChange={(selected: any) => setAreaInspeccion(selected.map((s: any) => s.value))}
                        className="text-xs"
                        styles={{
                          control: (base: any) => ({
                            ...base,
                            minHeight: "38px",
                            fontSize: "12px",
                            borderColor: "#bfdbfe",
                            borderRadius: "8px",
                            opacity: areaInspeccion === "todas" ? 0.5 : 1,
                          }),
                          valueContainer: (base: any) => ({ ...base, padding: "0 8px" }),
                        }}
                      />
                    </div>
                  )}
                </div>
                {/* Inspección */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Inspección</label>
                  <select
                    value={inspeccionSeleccionada}
                    onChange={(e) => setInspeccionSeleccionada(e.target.value)}
                    className="w-full h-[38px] px-2 py-1.5 rounded-lg border border-blue-200 bg-white text-gray-800 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-300 appearance-none"
                  >
                    <option value="">
                      {loadingInspecciones ? "Cargando..." : "Selecciona una inspección"}
                    </option>
                    {Array.isArray(dataInspecciones) && dataInspecciones.map((inspeccion: string, i: number) => (
                      <option key={i} value={inspeccion}>{inspeccion}</option>
                    ))}
                  </select>
                </div>

                {/* Prompt inspección */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Prompt inspección
                  </label>
                  <textarea
                    value={promptInspeccion}
                    onChange={(e) => setPromptInspeccion(e.target.value)}
                    rows={3}
                    placeholder="Escribe tu observación..."
                    className="w-full px-3 py-2 rounded-lg border border-blue-200 bg-white text-gray-800 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-300 resize-none"
                  />
                  <p className="text-[10px] text-gray-400 leading-tight mt-0.5">
                    Usa lenguaje natural para mencionarle a nuestro agente de inteligencia artificial
                    alguna observación que quieras hacer sobre la inspección de esta área.
                  </p>
                </div>

              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => setModalInspeccionAbierto(false)}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                  Cancelar
                </button>
                <button onClick={handleAsignarInspeccion}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                  Guardar asignación
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 mb-3">
          <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <input type="text" placeholder="Buscar punto..." value={areaSearch}
            onChange={(e) => setAreaSearch(e.target.value)}
            className="text-xs bg-transparent outline-none text-gray-700 placeholder:text-gray-400 w-full" />
        </div>
        <div className="flex-1 overflow-y-auto">
          <AreasList
            rondin={rondin}
            setAreas={setAreas}
            areas={filteredAreas}
            onAsignarInspeccion={handleAbrirModalInspeccion}
          />
        </div>
        {areas.filter((a: any) => !a.geolocalizacion_area_ubicacion?.length).length > 0 && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-100">
            <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <p className="text-xs text-red-500">
              {areas.filter((a: any) => !a.geolocalizacion_area_ubicacion?.length).length} áreas sin geolocalización
            </p>
          </div>
        )}
      </div>
      <div
        className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
        style={{ minHeight: "420px", zIndex: 0 }}
      >
        {rondin?.map_data && rondin.map_data.length > 0 ? (
          <div className="flex flex-col h-full">
            <div className="px-4 pt-4 pb-2">
              <h3 className="font-semibold text-gray-800 text-sm">Mapa del rondín</h3>
              <p className="text-xs text-gray-400">{rondin.map_data.length} puntos en el mapa</p>
            </div>
            <div className="flex-1" style={{ minHeight: "360px" }}>
              <MapView map_data={rondin.map_data} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-300">
            <MapPin className="w-10 h-10" />
            <p className="text-sm">Sin datos de mapa</p>
          </div>
        )}
      </div>
    </div>
    </div>
  );
};

export default RondinDetalle;