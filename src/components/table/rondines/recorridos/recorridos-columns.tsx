  import { AddRondinModal } from "@/components/modals/add-rondin";
  import { ColumnDef } from "@tanstack/react-table";
  import { Eye, Pencil, Trash, Play, Pause } from "lucide-react";

  export interface Recorrido {
    _id: string;
    folio: string;
    recurrencia: string;
    asignado_a?: string;
    checkpoints: number;
    nombre_del_rondin: string;
    ubicacion: string;
    duracion_estimada?: string;
    duracion_esperada_rondin?: string;
    fecha_hora_programada: string;
    cada_cuantos_dias_se_repite?: string;
    areas: any[];
    areas_name?: string[];
    estatus_rondin?: string;
    estatus_recorrido?: string;
    dag_id: string;
    id_grupo?: string | null;
    se_repite_cada?: string;
    fecha_final_rondin?: string;
    tipo_rondin?: string;
    que_dias_de_la_semana?: string[];
    accion_recurrencia?: string;
    ubicacion_geolocation?: { latitude: number; longitude: number };
    fecha_inicio_rondin?: string;
    programar_anticipacion?: string;
    tiempo_para_ejecutar_tarea_expresado_en?: string;
    sucede_recurrencia?: string[];
    grupo_asignado?: string;
    cantidad_de_puntos?: number;
    images_data?: {
      nombre_area: string;
      geolocation_area: { latitude: number; longitude: number };
      id: string;
      foto_area: { file_name: string; file_url: string; file_path?: string }[];
    }[];
    map_data?: {
      nombre_area: string;
      geolocation_area: { latitude: number; longitude: number };
      id: string;
      foto_area: { file_name: string; file_url: string; file_path?: string }[];
    }[];
    tipo_asignacion?: string;
    empleados_asignado?: string[];
    en_que_semana_sucede?: string;
    tiempo_para_ejecutar_tarea?: number;
    duracion_promedio?: any;
    la_recurrencia_cuenta_con_fecha_final?: string;
  }

  export const getRecorridosColumns = (
    onEliminarClick: (rondin: Recorrido) => void,
    handleVerRondin: (rondin: Recorrido) => void,
    handlePlayPause?: (rondin: Recorrido, paused: boolean) => void
  ): ColumnDef<Recorrido>[] => [
    {
      id: "options",
      header: "Opciones",
      cell: ({ row }) => {
        const estatus = row.original.estatus_rondin?.toLowerCase();
        const isCorriendo = estatus === "corriendo";
        const isPausado = estatus === "pausado";
        const showPlayPause = isCorriendo || isPausado;

        return (
          <div className="flex space-x-2 items-center">
            <div className="cursor-pointer" onClick={() => handleVerRondin(row.original)} title="Ver Rondin">
              <Eye className="w-5 h-5" />
            </div>
            <AddRondinModal
              title="Editar Rondín"
              mode="edit"
              rondinData={row.original}
              rondinId={row.original._id}
              folio={row.original.folio}>
              <div className="cursor-pointer" title="Editar Rondin">
                <Pencil className="w-5 h-5" />
              </div>
            </AddRondinModal>

            {handlePlayPause && showPlayPause && (
              isCorriendo ? (
                <div
                  className="cursor-pointer text-yellow-500 hover:text-yellow-700 transition-colors"
                  title="Pausar Rondín"
                  onClick={() => handlePlayPause(row.original, true)}>
                  <Pause className="w-5 h-5" />
                </div>
              ) : (
                <div
                  className="cursor-pointer text-green-500 hover:text-green-700 transition-colors"
                  title="Reanudar Rondín"
                  onClick={() => handlePlayPause(row.original, false)}>
                  <Play className="w-5 h-5" />
                </div>
              )
            )}

            <div className="cursor-pointer" title="Eliminar Rondin" onClick={() => onEliminarClick(row.original)}>
              <Trash className="w-5 h-5" />
            </div>
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "folio",
      header: "Folio",
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("folio")}</div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "nombre_del_rondin",
      header: "Nombre del recorrido",
      cell: ({ row }) => <div>{row.getValue("nombre_del_rondin")}</div>,
      enableSorting: true,
    },
    {
      accessorKey: "estatus_rondin",
      header: "Estatus",
      cell: ({ row }) => {
        const estatus = row.getValue("estatus_rondin") as string;
        const statusStyles: Record<string, string> = {
          corriendo: "bg-green-100 text-green-700 border border-green-200",
          pausado:   "bg-yellow-50 text-yellow-700 border border-yellow-200",
          cancelado: "bg-red-50 text-red-700 border border-red-200",
          cerrado:   "bg-slate-50 text-slate-500 border border-slate-200",
          programado:"bg-purple-50 text-purple-700 border border-purple-200",
        };
        const style = statusStyles[estatus?.toLowerCase()] ?? "bg-slate-50 text-slate-500 border border-slate-200";
        return (
          <span className={`inline-flex items-center px-2.5  rounded-full text-xs font-semibold ${style} capitalize`}>
            {estatus}
          </span>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: "sucede_recurrencia",
      header: "Recurrencia",
      cell: ({ row }) => {
        const valor = row.getValue("sucede_recurrencia");
        const arr = Array.isArray(valor) ? valor : valor ? [valor] : [];
        return (
          <div className="flex flex-wrap gap-1">
            {arr.length === 0 ? (
              <span className="text-slate-400">—</span>
            ) : (
              arr.map((item: string, i: number) => (
                <span key={i} className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-medium border border-blue-100 capitalize">
                  {item?.replace(/_/g, " ")}
                </span>
              ))
            )}
          </div>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: "asignado_a",
      header: "Asignado a",
      cell: ({ row }) => {
        const empleados = row.original?.empleados_asignado;
        const grupo = row.original?.grupo_asignado;

        if (Array.isArray(empleados) && empleados.length > 0) {
          return (
            <div className="flex flex-wrap gap-1">
              {empleados.map((e: string, i: number) => (
                <span key={i} className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 text-xs font-medium border border-purple-100 capitalize">
                  {e}
                </span>
              ))}
            </div>
          );
        }

        if (grupo) {
          return (
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-medium border border-indigo-100 capitalize">
              {grupo}
            </span>
          );
        }

        return (
          <span className="px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 text-xs font-medium border border-gray-100">
            Responsable en turno
          </span>
        );
      },
      enableSorting: true,
    },{
      accessorKey: "checkpoints",
      header: "Checkpoints",
      cell: ({ row }) => (
        <div className="flex justify-start">
          <span className="px-2 py-.5 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold border border-blue-100">
            {row.getValue("checkpoints")}
          </span>
        </div>
      ),
      enableSorting: true,
    },

    {
      accessorKey: "duracion_estimada",
      header: "Duracion",
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("duracion_estimada")}</div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "tipo_rondin",
      header: "Tipo",
      cell: ({ row }) => <div className="uppercase">{row.getValue("tipo_rondin")}</div>,
      enableSorting: true,
    },
  ];