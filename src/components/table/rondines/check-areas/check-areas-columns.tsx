import { ColumnDef } from "@tanstack/react-table";
import { Eye, Trash, AlertCircle, CheckCircle } from "lucide-react";

export interface CheckArea {
  id: string;
  folio: string;
  rondin_area: string[];
  tipo_de_area: string[];
  incidente_location: string[];
  check_status: string;
  comentario_check_area: string;
  created_at: string;
  updated_at: string;
  area_tag_id: string;
  grupo_incidencias_check: {
    categoria: string;
    incidente: string;
    sub_categoria: string;
    incidente_documento: any[];
    incidente_evidencia: { file_name: string; file_url: string }[];
    incidente_open: string;
    incidente_accion: string;
  }[];
  foto_area: { file_name: string; file_url: string; name?: string }[][];
  foto_evidencia_area: { file_name: string; file_url: string }[];
  fecha_inspeccion_area: string;
  url_rondin: string;
  rondin: Record<string, any>;
}

export const getCheckAreasColumns = (
  onEliminarClick: (check: CheckArea) => void,
  handleVerCheck: (check: CheckArea) => void
): ColumnDef<CheckArea>[] => [
  {
    id: "options",
    header: "Opciones",
    cell: ({ row }) => (
      <div className="flex space-x-2">
        <div className="cursor-pointer" onClick={() => handleVerCheck(row.original)} title="Ver Check">
          <Eye className="w-5 h-5" />
        </div>
        <div className="cursor-pointer" title="Eliminar Check" onClick={() => onEliminarClick(row.original)}>
          <Trash className="w-5 h-5" />
        </div>
      </div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "folio",
    header: "Folio",
    cell: ({ row }) => (
      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold border border-blue-100">
        {row.getValue("folio") || "-"}
      </span>
    ),
    enableSorting: true,
  },
  {
    id: "rondin_area",
    header: "Área",
    accessorFn: (row) => row.rondin_area?.[0] ?? "",
    cell: ({ row }) => {
      const areas = row.original.rondin_area ?? [];
      return (
        <span className="font-medium text-slate-700">
          {areas.length > 0 ? areas.join(", ") : "-"}
        </span>
      );
    },
    enableSorting: true,
  },
  // {
  //   id: "tipo_de_area",
  //   header: "Tipo",
  //   accessorFn: (row) => row.tipo_de_area?.[0] ?? "",
  //   cell: ({ row }) => {
  //     const tipos = row.original.tipo_de_area ?? [];
  //     return tipos.length > 0 ? (
  //       <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs border border-slate-200">
  //         {tipos.join(", ")}
  //       </span>
  //     ) : (
  //       <span className="text-slate-400 text-xs">-</span>
  //     );
  //   },
  //   enableSorting: true,
  // },
  // {
  //   id: "incidente_location",
  //   header: "Ubicación",
  //   accessorFn: (row) => row.incidente_location?.[0] ?? "",
  //   cell: ({ row }) => (
  //     <span className="text-slate-600 text-xs">
  //       {row.original.incidente_location?.[0] ?? "-"}
  //     </span>
  //   ),
  //   enableSorting: true,
  // },
  {
    accessorKey: "created_at",
    header: "Fecha",
    cell: ({ row }) => (
      <span className="text-slate-500 text-xs whitespace-nowrap">
        {row.getValue("created_at") || "-"}
      </span>
    ),
    enableSorting: true,
  },
  {
    id: "incidencias",
    header: "Incidencias",
    accessorFn: (row) => row.grupo_incidencias_check?.length ?? 0,
    cell: ({ row }) => {
      const incidencias = row.original.grupo_incidencias_check ?? [];
      return incidencias.length > 0 ? (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-xs font-bold border border-red-100 w-fit">
          <AlertCircle size={11} />
          {incidencias.length} incidencia{incidencias.length > 1 ? "s" : ""}
        </span>
      ) : (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-600 text-xs font-bold border border-green-100 w-fit">
          <CheckCircle size={11} />
          Sin incidencias
        </span>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "check_status",
    header: "Estatus",
    cell: ({ row }) => {
      const status = row.getValue("check_status") as string;
      const label = status?.replace(/_/g, " ") ?? "-";
      return (
        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs border border-slate-200 capitalize">
          {label}
        </span>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "comentario_check_area",
    header: "Comentario",
    cell: ({ row }) => {
      const comentario = row.getValue("comentario_check_area") as string;
      return comentario ? (
        <span className="text-slate-600 text-xs line-clamp-2 max-w-[200px]" title={comentario}>
          {comentario}
        </span>
      ) : (
        <span className="text-slate-400 text-xs">-</span>
      );
    },
    enableSorting: false,
  },
];