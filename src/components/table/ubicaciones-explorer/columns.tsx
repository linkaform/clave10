import { ColumnDef } from "@tanstack/react-table";
import { Eye, Pencil } from "lucide-react";
import { NormalizedUbicacion } from "@/lib/ubicaciones";

export const getUbicacionesColumns = (
  onVerUbicacion: (ubicacion: NormalizedUbicacion) => void,
  onEditarUbicacion: (ubicacion: NormalizedUbicacion) => void,
): ColumnDef<NormalizedUbicacion>[] => [
  {
    id: "options",
    header: "Opciones",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div
          className="cursor-pointer"
          onClick={() => onVerUbicacion(row.original)}
          title="Ver ubicación"
        >
          <Eye className="w-5 h-5" />
        </div>
        <div
          className="cursor-pointer"
          onClick={() => onEditarUbicacion(row.original)}
          title="Editar ubicación"
        >
          <Pencil className="w-5 h-5" />
        </div>
      </div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "nombre",
    header: "Ubicación",
    cell: ({ row }) => (
      <span className="font-medium text-slate-700">{row.getValue("nombre")}</span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "direccion",
    header: "Dirección",
    cell: ({ row }) => (
      <span className="text-slate-600 text-xs">{(row.getValue("direccion") as string) || "-"}</span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "ciudad",
    header: "Ciudad",
    cell: ({ row }) => (
      <span className="text-slate-600 text-xs">{(row.getValue("ciudad") as string) || "-"}</span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "estado",
    header: "Estado",
    cell: ({ row }) => (
      <span className="text-slate-600 text-xs">{(row.getValue("estado") as string) || "-"}</span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "telefono",
    header: "Teléfono",
    cell: ({ row }) => (
      <span className="text-slate-600 text-xs">{(row.getValue("telefono") as string) || "-"}</span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <span className="text-slate-600 text-xs">{(row.getValue("email") as string) || "-"}</span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "areasCount",
    header: "Áreas",
    cell: ({ row }) => (
      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold border border-blue-100 w-fit">
        {row.getValue("areasCount")}
      </span>
    ),
    enableSorting: true,
  },
];
