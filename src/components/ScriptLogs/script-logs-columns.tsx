import { Badge } from "@/components/ui/badge";
import { ScriptLogRow } from "@/hooks/ScriptLogs/useScriptLogs";
import { ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";

export const formatDuration = (s: number | null) => {
  if (s === null || s === undefined) return "-";
  if (s < 60) return `${s.toFixed(1)} s`;
  const m = Math.floor(s / 60);
  return `${m} min ${Math.round(s - m * 60)} s`;
};

export const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "medium" }) : "-";

export const StatusBadge = ({ row }: { row: ScriptLogRow }) => {
  if (row.status === "running") {
    return <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">En ejecución</Badge>;
  }
  return row.run_success ? (
    <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">Exitoso</Badge>
  ) : (
    <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">Con error</Badge>
  );
};

interface ScriptLogsColumnsHandlers {
  onSelect: (id: string) => void;
}

// Mismo esquema que bitacoras-columns.tsx: las columnas viven aparte de la tabla.
export const getScriptLogsColumns = ({
  onSelect,
}: ScriptLogsColumnsHandlers): ColumnDef<ScriptLogRow>[] => [
  {
    id: "options",
    header: "Opciones",
    cell: ({ row }) => (
      <button
        type="button"
        title="Ver log"
        data-script-log-eye
        className="text-slate-500 hover:text-blue-600"
        onClick={() => onSelect(row.original.id)}
      >
        <Eye className="w-4 h-4" />
      </button>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => <StatusBadge row={row.original} />,
  },
  { accessorKey: "script_name", header: "Script" },
  { accessorKey: "user_name", header: "Usuario" },
  {
    accessorKey: "start_date",
    header: "Inicio",
    cell: ({ row }) => formatDate(row.original.start_date),
  },
  {
    accessorKey: "end_date",
    header: "Fin",
    cell: ({ row }) => formatDate(row.original.end_date),
  },
  {
    accessorKey: "duration",
    header: "Duración",
    cell: ({ row }) => formatDuration(row.original.duration),
  },
];
