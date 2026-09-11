"use client";

import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMenuConfigDiagnostics } from "@/hooks/menus-admin/useUserMenuAssignment";
import { MenuUser } from "@/services/menus-admin";

export const MenuConfigDiagnosticsPanel = () => {
  const {
    missingConfig,
    isLoadingMissingConfig,
    errorMissingConfig,
    refetchMissingConfig,
    onlyLegacy,
    isLoadingOnlyLegacy,
    errorOnlyLegacy,
    refetchOnlyLegacy,
  } = useMenuConfigDiagnostics();

  return (
    <div className="flex flex-col gap-8">
      <section>
        <div className="flex items-center justify-between mb-2 gap-4">
          <div>
            <h2 className="text-lg font-semibold">Usuarios sin configuración de menús</h2>
            <p className="text-sm text-muted-foreground">
              Existen en el catálogo de usuarios pero nunca se les asignó ningún menú
              (CONFIGURACION_MENUS).
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchMissingConfig()}
            disabled={isLoadingMissingConfig}>
            <RefreshCw size={14} className={isLoadingMissingConfig ? "animate-spin" : ""} />
            Actualizar
          </Button>
        </div>
        <UsersDiagnosticTable
          users={missingConfig}
          isLoading={isLoadingMissingConfig}
          error={errorMissingConfig}
          emptyMessage="Todos los usuarios tienen configuración de menús."
        />
      </section>

      <section>
        <div className="flex items-center justify-between mb-2 gap-4">
          <div>
            <h2 className="text-lg font-semibold">
              Usuarios solo en Configuración Accesos (legacy)
            </h2>
            <p className="text-sm text-muted-foreground">
              Tienen registro en la forma legacy de permisos (Configuración Accesos) pero
              nunca se migraron a CONFIGURACION_MENUS — pueden estar operando con permisos
              desactualizados.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchOnlyLegacy()}
            disabled={isLoadingOnlyLegacy}>
            <RefreshCw size={14} className={isLoadingOnlyLegacy ? "animate-spin" : ""} />
            Actualizar
          </Button>
        </div>
        <UsersDiagnosticTable
          users={onlyLegacy}
          isLoading={isLoadingOnlyLegacy}
          error={errorOnlyLegacy}
          emptyMessage="Ningún usuario quedó solo en Configuración Accesos."
        />
      </section>
    </div>
  );
};

interface UsersDiagnosticTableProps {
  users: MenuUser[];
  isLoading: boolean;
  error: unknown;
  emptyMessage: string;
}

const UsersDiagnosticTable: React.FC<UsersDiagnosticTableProps> = ({
  users,
  isLoading,
  error,
  emptyMessage,
}) => {
  if (isLoading) {
    return <div className="text-center py-6 text-muted-foreground text-sm">Cargando...</div>;
  }
  if (error) {
    return (
      <div className="text-center py-6 text-red-600 text-sm">
        Error al cargar la lista. Intenta actualizar de nuevo.
      </div>
    );
  }
  if (users.length === 0) {
    return <div className="text-center py-6 text-muted-foreground text-sm">{emptyMessage}</div>;
  }
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User ID</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Email</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.user_id}>
              <TableCell>{user.user_id}</TableCell>
              <TableCell>{user.nombre}</TableCell>
              <TableCell>{user.username}</TableCell>
              <TableCell>{user.email}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
