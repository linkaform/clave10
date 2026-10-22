import { Badge } from "@/components/ui/badge";
import { UserRow } from "@/hooks/Users/useUsers";
import { USER_STATUS_LABELS } from "@/hooks/Users/useUsersFilters";
import { ColumnDef } from "@tanstack/react-table";
import { Copy, Eye, Pencil } from "lucide-react";
import { toast } from "sonner";

// Con estos estatus el usuario ya existe en LinkaForm (el backend los exige para editar).
export const EDITABLE_USER_STATUSES = ["creado", "activado", "restaurar"];

const STATUS_STYLES: Record<string, string> = {
  activado: "bg-green-100 text-green-700 border-green-200 hover:bg-green-100",
  creado: "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100",
  restaurar: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100",
  crear: "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-100",
};

export const UserStatusBadge = ({ status }: { status: string }) => (
  <Badge className={STATUS_STYLES[status] ?? STATUS_STYLES.crear}>
    {USER_STATUS_LABELS[status] ?? (status || "—")}
  </Badge>
);

const copyUsername = async (username: string) => {
  try {
    await navigator.clipboard.writeText(username);
    toast.success("Username copiado");
  } catch {
    toast.error("No se pudo copiar el username");
  }
};

interface UsersColumnsHandlers {
  /** Abre el panel; con edit=true ya en modo edición. */
  onSelect: (id: string, edit?: boolean) => void;
}

// Mismo esquema que bitacoras-columns.tsx: las columnas viven aparte de la tabla.
export const getUsersColumns = ({
  onSelect,
}: UsersColumnsHandlers): ColumnDef<UserRow>[] => [
  {
    id: "options",
    header: "Opciones",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <button
          type="button"
          title="Ver detalle"
          data-user-eye
          className="text-slate-500 hover:text-blue-600"
          onClick={() => onSelect(row.original.id, false)}
        >
          <Eye className="w-4 h-4" />
        </button>
        {EDITABLE_USER_STATUSES.includes(row.original.status) && (
          <button
            type="button"
            title="Editar"
            data-user-eye
            className="text-slate-500 hover:text-blue-600"
            onClick={() => onSelect(row.original.id, true)}
          >
            <Pencil className="w-4 h-4" />
          </button>
        )}
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  { accessorKey: "folio", header: "Folio" },
  { accessorKey: "name", header: "Nombre" },
  {
    accessorKey: "username",
    header: "Username",
    cell: ({ row }) => {
      const username = row.original.username;
      return (
        <span className="inline-flex items-center gap-1.5">
          {username}
          {username && (
            <button
              type="button"
              title="Copiar username"
              className="text-slate-400 hover:text-slate-700"
              onClick={() => copyUsername(username)}
            >
              <Copy size={12} />
            </button>
          )}
        </span>
      );
    },
  },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "phone", header: "Teléfono" },
  { accessorKey: "role", header: "Rol" },
  {
    accessorKey: "status",
    header: "Estatus",
    cell: ({ row }) => <UserStatusBadge status={row.original.status} />,
  },
];
