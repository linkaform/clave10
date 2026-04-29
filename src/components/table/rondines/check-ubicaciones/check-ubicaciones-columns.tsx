import { ColumnDef } from "@tanstack/react-table";
import { Eye, Trash } from "lucide-react";

export interface CheckUbicacion {
  id: string;
  nombre_recorrido: string;
  ubicacion: string;
  created_at: string;
  total_checks: number;
  areas: {
    area: string;
    detalle: {
      hora_de_check: string;
      fotos: { file_name: string; file_url: string }[];
      area: string;
      tiempo_traslado: string | number;
      ubicacion: string;
      incidencias: any[];
      comentarios: string;
    };
  }[];
  incidencias: any[];
}

export const getCheckUbicacionesColumns = (
  onEliminarClick: (check: CheckUbicacion) => void,
  handleVerCheck: (check: CheckUbicacion) => void
): ColumnDef<CheckUbicacion>[] => [
  {
    id: "options",
    header: "Opciones",
    cell: ({ row }) => (
      <div className="flex space-x-2">
        <div className="cursor-pointer" onClick={() => handleVerCheck(row.original)} title="Ver Check">
          <Eye />
        </div>
        <div className="cursor-pointer" title="Eliminar Check" onClick={() => onEliminarClick(row.original)}>
          <Trash />
        </div>
      </div>
    ),
    enableSorting: false,
    enableHiding: true,
  },
  {
    accessorKey: "nombre_recorrido",
    header: "Recorrido",
    cell: ({ row }) => (
      <span className="font-medium text-slate-700">{row.getValue("nombre_recorrido") || "-"}</span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "ubicacion",
    header: "Ubicación",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("ubicacion") || "-"}</div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "created_at",
    header: "Fecha",
    cell: ({ row }) => (
      <div>{row.getValue("created_at") || "-"}</div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "total_checks",
    header: "Total Checks",
    cell: ({ row }) => (
      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold border border-blue-100">
        {row.getValue("total_checks")}
      </span>
    ),
    enableSorting: true,
  },
  {
    id: "incidencias",
    header: "Incidencias",
    cell: ({ row }) => {
      const incidencias = row.original.incidencias ?? [];
      return incidencias.length > 0 ? (
        <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-xs font-bold border border-red-100">
          {incidencias.length} incidencia{incidencias.length > 1 ? "s" : ""}
        </span>
      ) : (
        <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-600 text-xs font-bold border border-green-100">
          Sin incidencias
        </span>
      );
    },
    enableSorting: false,
  },
  {
    id: "areas",
    header: "Áreas",
    cell: ({ row }) => {
      const areas = row.original.areas ?? [];
      return (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {areas.length === 0 ? (
            <span className="text-slate-400 text-xs">Sin áreas</span>
          ) : (
            areas.slice(0, 3).map((a, i) => (
              <span key={i} className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs border border-slate-200">
                {a.area}
              </span>
            ))
          )}
          {areas.length > 3 && (
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs">
              +{areas.length - 3}
            </span>
          )}
        </div>
      );
    },
    enableSorting: false,
  },
];