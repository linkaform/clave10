import { AddRondinModal } from "@/components/modals/add-rondin";
import {
    ColumnDef,   
  } from "@tanstack/react-table";
import { Eye, Pencil, Trash } from "lucide-react";


  export interface Recorrido {
    _id:string
    folio: string
    recurrencia: string
    asignado_a: string
    checkpoints: number
    nombre_del_rondin: string
    ubicacion: string
    duracion_estimada?: string
    fecha_hora_programada: string
    cada_cuantos_dias_se_repite: string
    areas: any
  }

  // export const rondinesColumns: ColumnDef<Recorrido>[] = [
  export const getRecorridosColumns = ( onEliminarClick: (rondin: Recorrido) => void, handleVerRondin: (rondin: Recorrido) => void): ColumnDef<Recorrido>[] => [
    {
      id: "options",
      header: "Opciones",
      cell: ({ row }) => (
        
        <div className="flex space-x-2">
          <div className="cursor-pointer" onClick={() => { handleVerRondin(row.original) }}  title="Ver Rondin">
            <Eye /> 
          </div>
          <AddRondinModal
            title="Editar Rondín"
            mode="edit"
            rondinData={ row.original}
            rondinId={ row.original._id}
            folio={ row.original.folio}
          >
            <div className="cursor-pointer" title="Editar Rondin">
              <Pencil />
            </div>
          </AddRondinModal>
          <div className="cursor-pointer" title="Eliminar Rondin" onClick={() => { onEliminarClick(row.original) }} >
            <Trash /> 
          </div>
        </div>
      ),
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
          corriendo: "bg-green-50 text-green-700 border border-green-200 ring-1 ring-green-300/50",
          pausado:   "bg-yellow-50 text-yellow-700 border border-yellow-200 ring-1 ring-yellow-300/50",
          cancelado: "bg-red-50 text-red-700 border border-red-200 ring-1 ring-red-300/50",
          cerrado:   "bg-slate-50 text-slate-500 border border-slate-200 ring-1 ring-slate-300/50",
          programado:"bg-purple-50 text-purple-700 border border-purple-200 ring-1 ring-purple-300/50",
        };
        const style = statusStyles[estatus?.toLowerCase()] ?? "bg-slate-50 text-slate-500 border border-slate-200";
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${style}`}>
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
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("asignado_a")|| "Guardia en turno"}</div>
      ),
      enableSorting: true,
    },
  
    {
      accessorKey: "checkpoints",
      header: "Checkpoints",
      cell: ({ row }) => <div>{row.getValue("checkpoints")}</div>,
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
      cell: ({ row }) => <div className="capitalize">{row.getValue("tipo_rondin")}</div>,
      enableSorting: true,
    },
  ];