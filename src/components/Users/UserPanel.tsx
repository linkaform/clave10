"use client";

import * as React from "react";
import { ExternalLink, KeyRound, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/confirm-modal";
import { ResizableLogSheet } from "@/components/ScriptLogs/ResizableLogSheet";
import { CopyableId } from "@/components/ScriptLogs/CopyableId";
import { formatDate } from "@/components/ScriptLogs/ScriptLogsTable";
import {
  LinkedEmployee,
  UserRow,
  useResetUserPassword,
  useUserDetail,
} from "@/hooks/Users/useUsers";
import { UserEditForm } from "./UserEditForm";
import { EDITABLE_USER_STATUSES, UserStatusBadge } from "./users-columns";

const RECORD_URL = "https://app.linkaform.com/#/records/detail/";

const Field = ({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) => (
  <div className="min-w-0">
    <dt className="text-xs uppercase tracking-wider text-slate-500">{label}</dt>
    <dd className="text-sm text-slate-800 break-words">{value || "—"}</dd>
  </div>
);

function EmployeeItem({ employee }: { employee: LinkedEmployee }) {
  const active = employee.status === "activo";
  const detail = [employee.position, employee.department]
    .filter(Boolean)
    .join(" · ");
  return (
    <li className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">
          {employee.name || "—"}
        </p>
        <p className="text-xs text-slate-500 truncate">
          {detail || "Sin puesto"}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {employee.status && (
          <Badge
            className={
              active
                ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-100"
                : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-100"
            }
          >
            {active ? "Activo" : employee.status}
          </Badge>
        )}
        <Button size="sm" variant="outline" asChild>
          <a
            href={`${RECORD_URL}${employee.id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink size={14} className="mr-1" /> Ver registro
          </a>
        </Button>
      </div>
    </li>
  );
}

interface Props {
  row: UserRow | null;
  onOpenChange: (open: boolean) => void;
  /** true = la sección de datos es el formulario de edición. */
  editing: boolean;
  onEditingChange: (editing: boolean) => void;
}

export function UserPanel({
  row,
  onOpenChange,
  editing,
  onEditingChange,
}: Props) {
  const detail = useUserDetail(row?.id ?? null);
  const reset = useResetUserPassword();
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  // El detalle trae el registro fresco; mientras llega se usa la fila de la lista.
  const user = detail.data?.user ?? row;
  const employees = detail.data?.employees ?? [];
  const canEdit = !!user && EDITABLE_USER_STATUSES.includes(user.status);

  const onReset = () => {
    if (!user) return;
    reset.mutate(user.id, {
      onSuccess: () => {
        setConfirmOpen(false);
        toast.success(
          `Se envió un correo para restaurar la contraseña a ${user.email}`,
        );
      },
      onError: (e) => {
        setConfirmOpen(false);
        toast.error(
          (e as Error).message || "No se pudo restaurar la contraseña",
        );
      },
    });
  };

  return (
    <ResizableLogSheet
      open={!!row}
      onOpenChange={onOpenChange}
      title="Detalle del usuario"
      keepOpenSelector="[data-user-eye]"
    >
      {user && (
        <div className="flex flex-col h-full">
          <div className="p-5 border-b bg-white space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  {user.name || user.username}
                </h2>
                <p className="text-xs text-slate-500">
                  {[
                    user.folio && `Folio ${user.folio}`,
                    user.created_at && formatDate(user.created_at),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {user.username && (
                  <CopyableId id={user.username} label="Username" />
                )}
                <CopyableId id={user.id} />
              </div>
              <div className="flex items-center gap-2 pr-20">
                <UserStatusBadge status={user.status} />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {canEdit && !editing && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEditingChange(true)}
                >
                  <Pencil size={14} className="mr-1" /> Editar
                </Button>
              )}
              {user.status === "activado" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirmOpen(true)}
                >
                  <KeyRound size={14} className="mr-1" /> Restaurar contraseña
                </Button>
              )}
              <Button size="sm" variant="outline" asChild>
                <a
                  href={`${RECORD_URL}${user.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink size={14} className="mr-1" /> Ver registro
                </a>
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-4 bg-slate-100">
            {editing && canEdit ? (
              <UserEditForm user={user} onDone={() => onEditingChange(false)} />
            ) : (
              <section className="rounded-md border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                  Datos del usuario
                </h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Nombre" value={user.name} />
                  <Field label="Username" value={user.username} />
                  <Field label="Email" value={user.email} />
                  <Field label="Teléfono" value={user.phone} />
                  <Field label="Rol" value={user.role} />
                  <Field label="Id de usuario" value={user.user_id} />
                </dl>
              </section>
            )}

            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-700">
                Empleados ligados {detail.data ? `(${employees.length})` : ""}
              </h3>
              {detail.isLoading ? (
                <p className="text-sm text-slate-500">Cargando empleados...</p>
              ) : detail.error ? (
                <p className="text-sm text-red-500">
                  {(detail.error as Error).message}
                </p>
              ) : employees.length === 0 ? (
                <p className="text-sm text-slate-500 rounded-md border border-dashed border-slate-300 bg-white p-3">
                  Este usuario no tiene empleados ligados.
                </p>
              ) : (
                <ul className="space-y-2">
                  {employees.map((e) => (
                    <EmployeeItem key={e.id} employee={e} />
                  ))}
                </ul>
              )}
            </section>
          </div>

          <ConfirmModal
            open={confirmOpen}
            onClose={() => setConfirmOpen(false)}
            onConfirm={onReset}
            isLoading={reset.isPending}
            title="Restaurar contraseña"
            description={`Se enviará un correo con una liga para crear una contraseña nueva a ${user?.email ?? "el correo registrado"}.`}
            confirmText="Enviar correo"
          />
        </div>
      )}
    </ResizableLogSheet>
  );
}
