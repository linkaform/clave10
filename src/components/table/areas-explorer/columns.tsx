import { ColumnDef } from "@tanstack/react-table";
import { Eye, Power, Printer, Tag as TagIcon } from "lucide-react";
import { NormalizedArea } from "@/lib/areas";
import { AreaDisponibilidadMenu } from "./AreaDisponibilidadMenu";

export const getAreasColumns = (
  onVerArea: (area: NormalizedArea) => void,
  onPrintArea: (area: NormalizedArea) => void,
  onToggleEstado: (area: NormalizedArea) => void,
): ColumnDef<NormalizedArea>[] => [
  {
    id: "options",
    header: "Opciones",
    cell: ({ row }) => {
      const esActiva = row.original.estado?.toLowerCase() === "activa";
      return (
        <div className="flex items-center gap-3">
          <div
            className="cursor-pointer"
            onClick={() => onVerArea(row.original)}
            title="Ver Área"
          >
            <Eye className="w-5 h-5" />
          </div>
          <div
            className="cursor-pointer"
            onClick={() => onPrintArea(row.original)}
            title="Imprimir QR"
          >
            <Printer className="w-5 h-5" />
          </div>
          <div
            className={`cursor-pointer ${esActiva ? "text-green-600" : "text-slate-400"}`}
            onClick={() => onToggleEstado(row.original)}
            title={esActiva ? "Desactivar área" : "Activar área"}
          >
            <Power className="w-5 h-5" />
          </div>
          <AreaDisponibilidadMenu recordId={row.original.recordId} />
        </div>
      );
    },
    enableSorting: false,
  },
  {
    id: "foto",
    header: "Foto",
    cell: ({ row }) => {
      const foto = row.original.foto;
      return foto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={foto} alt={row.original.nombre} className="h-10 w-10 rounded-md object-cover" />
      ) : (
        <div className="h-10 w-10 rounded-md bg-slate-100 flex items-center justify-center text-slate-300 text-[10px]">
          Sin foto
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "nombre",
    header: "Área",
    cell: ({ row }) => (
      <span className="font-medium text-slate-700">{row.getValue("nombre")}</span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "ubicacion",
    header: "Ubicación",
    cell: ({ row }) => (
      <span className="text-slate-600 text-xs">{row.getValue("ubicacion")}</span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "tipo",
    header: "Tipo",
    cell: ({ row }) => (
      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs border border-slate-200 capitalize">
        {row.getValue("tipo")}
      </span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "tagId",
    header: "Tag/QR",
    cell: ({ row }) => {
      const tagId = row.getValue("tagId") as string;
      return tagId ? (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold border border-blue-100 w-fit">
          <TagIcon size={11} />
          Con tag
        </span>
      ) : (
        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs border border-slate-200 w-fit">
          Sin tag
        </span>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "disponibilidad",
    header: "Disponibilidad",
    cell: ({ row }) => {
      const disponibilidad = row.getValue("disponibilidad") as string;
      const esDisponible = disponibilidad?.toLowerCase() === "disponible";
      return disponibilidad ? (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-bold border w-fit ${
            esDisponible
              ? "bg-green-50 text-green-600 border-green-100"
              : "bg-amber-50 text-amber-600 border-amber-100"
          }`}
        >
          {disponibilidad}
        </span>
      ) : (
        <span className="text-slate-400 text-xs">-</span>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "estado",
    header: "Estatus",
    cell: ({ row }) => (
      <span className="text-slate-500 text-xs capitalize">
        {(row.getValue("estado") as string) || "-"}
      </span>
    ),
    enableSorting: true,
  },
];
