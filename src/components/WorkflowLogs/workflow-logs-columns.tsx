import { Badge } from "@/components/ui/badge";
import { WorkflowLogRow } from "@/hooks/WorkflowLogs/useWorkflowLogs";
import { formatDate } from "@/components/ScriptLogs/script-logs-columns";
import { ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";

export const WorkflowStatusBadge = ({ row }: { row: WorkflowLogRow }) =>
  row.success === false ? (
    <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">Con error</Badge>
  ) : row.success ? (
    <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">Exitoso</Badge>
  ) : (
    <Badge className="bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-100">Sin estado</Badge>
  );

interface WorkflowLogsColumnsHandlers {
  onSelect: (id: string) => void;
}

// Mismo esquema que bitacoras-columns.tsx: las columnas viven aparte de la tabla.
export const getWorkflowLogsColumns = ({
  onSelect,
}: WorkflowLogsColumnsHandlers): ColumnDef<WorkflowLogRow>[] => [
  {
    id: "options",
    header: "Opciones",
    cell: ({ row }) => (
      <button
        type="button"
        title="Ver detalle"
        data-workflow-log-eye
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
    id: "status",
    header: "Estado",
    cell: ({ row }) => <WorkflowStatusBadge row={row.original} />,
  },
  { accessorKey: "name", header: "Workflow" },
  { accessorKey: "rule_label", header: "Acción" },
  { accessorKey: "event_label", header: "Evento" },
  { accessorKey: "form_name", header: "Formulario" },
  { accessorKey: "folio", header: "Folio" },
  { accessorKey: "user_name", header: "Usuario" },
  {
    accessorKey: "created_at",
    header: "Fecha",
    cell: ({ row }) => formatDate(row.original.created_at),
  },
];
