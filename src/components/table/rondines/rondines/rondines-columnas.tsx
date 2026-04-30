import { ColumnDef, Row, Table as TanstackTable } from "@tanstack/react-table";
import { Eye, Printer } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { BitacoraRondin } from "./table";

const estatusStyles: Record<string, string> = {
  realizado: "bg-green-50 text-green-700 border border-green-200 ring-1 ring-green-300/50",
  en_proceso: "bg-blue-50 text-blue-700 border border-blue-200 ring-1 ring-blue-300/50",
  programado: "bg-purple-50 text-purple-700 border border-purple-200 ring-1 ring-purple-300/50",
  cancelado: "bg-red-50 text-red-700 border border-red-200 ring-1 ring-red-300/50",
};

const EstatusBadge = ({ estatus }: { estatus: string }) => {
  const style = estatusStyles[estatus?.toLowerCase()] ?? "bg-slate-50 text-slate-500 border border-slate-200";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${style}`}>
      {estatus?.replace(/_/g, " ")}
    </span>
  );
};

export const getRondinesColumns = (
  handleVer: (rondin: BitacoraRondin) => void,
  handleImprimir: (rondin: BitacoraRondin) => void,
): ColumnDef<BitacoraRondin>[] => [
  {
    id: "select",
    header: ({ table }: { table: TanstackTable<BitacoraRondin> }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }: { row: Row<BitacoraRondin> }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "options",
    header: "Opciones",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="cursor-pointer" onClick={() => handleVer(row.original)} title="Ver Rondín">
          <Eye />
        </div>
        <div className="cursor-pointer " onClick={() => handleImprimir(row.original)} title="Imprimir">
          <Printer />
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
    accessorKey: "nombre_recorrido",
    header: "Recorrido",
    cell: ({ row }) => (
      <span className="font-medium text-slate-700">
        {row.getValue("nombre_recorrido") || "-"}
      </span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "estatus_recorrido",
    header: "Estatus",
    cell: ({ row }) => <EstatusBadge estatus={row.getValue("estatus_recorrido")} />,
    enableSorting: true,
  },
  {
    accessorKey: "fecha_hora_programada_inicio",
    header: "Fecha programada",
    cell: ({ row }) => (
      <div className="text-xs">{row.getValue("fecha_hora_programada_inicio") || "-"}</div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "fecha_hora_inicio",
    header: "Fecha inicio",
    cell: ({ row }) => (
      <div className="text-xs">{row.getValue("fecha_hora_inicio") || "-"}</div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "asignado_a",
    header: "Asignado a",
    cell: ({ row }) => (
      <div className="text-xs">{row.getValue("asignado_a") || "Guardia en turno"}</div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "cantidad_areas_inspeccionadas",
    header: "Áreas",
    cell: ({ row }) => (
      <span className="px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 text-xs font-bold border border-slate-200">
        {row.getValue("cantidad_areas_inspeccionadas") || "0"}
      </span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "porcentaje_avance",
    header: "Avance",
    cell: ({ row }) => (
      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold border border-blue-100">
        {row.getValue("porcentaje_avance") || "0%"}
      </span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "duracion_rondin",
    header: "Duración",
    cell: ({ row }) => {
      const val = row.getValue("duracion_rondin");
      return <div className="text-xs">{val ? `${val} min` : "-"}</div>;
    },
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
];