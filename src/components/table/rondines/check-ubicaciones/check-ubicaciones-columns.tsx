import { ColumnDef } from "@tanstack/react-table";
import { CheckCircle2, Eye, Trash, XCircle } from "lucide-react";

export interface CheckUbicacion {
  _id: string;
  folio: string;
  check: boolean;
  ubicacion: string;
  fecha_inicio: string;
  fecha_fin:string
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
        <div
          className="cursor-pointer"
          onClick={() => handleVerCheck(row.original)}
          title="Ver Check"
        >
          <Eye />
        </div>
        <div
          className="cursor-pointer"
          title="Eliminar Check"
          onClick={() => onEliminarClick(row.original)}
        >
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
      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold border border-blue-100">
        {row.getValue("folio")}
      </span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "check",
    header: "Check",
    cell: ({ row }) => {
      const checked = row.getValue("check") as boolean;
      return checked ? (
        <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4" /> Completado
        </span>
      ) : (
        <span className="flex items-center gap-1 text-red-400 text-xs font-medium">
          <XCircle className="w-4 h-4" /> Pendiente
        </span>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "ubicacion",
    header: "Ubicación",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("ubicacion")}</div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "fecha_inicio",
    header: "Fecha Incio",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("fecha_inicio")}</div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "fecha_fin",
    header: "Fecha Fin",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("fecha_fin")}</div>
    ),
    enableSorting: true,
  },
];