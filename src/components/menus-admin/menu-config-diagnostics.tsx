"use client";

import { useState } from "react";
import { ArrowRightLeft, RefreshCw, ScanSearch, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useMenuConfigDiagnostics,
  useMigrateLegacyMenus,
  usePermissionGaps,
  useReapplyPermissions,
} from "@/hooks/menus-admin/useUserMenuAssignment";
import { MenuUser, PermissionGapUser, PermissionItemType } from "@/services/menus-admin";
import { MigrateLegacyMenusDialog } from "@/components/modals/migrate-legacy-menus-dialog";
import { ReapplyPermissionsDialog } from "@/components/modals/reapply-permissions-dialog";

export const MenuConfigDiagnosticsPanel = () => {
  const {
    missingConfig,
    isLoadingMissingConfig,
    isFetchingMissingConfig,
    errorMissingConfig,
    refetchMissingConfig,
    onlyLegacy,
    isLoadingOnlyLegacy,
    isFetchingOnlyLegacy,
    errorOnlyLegacy,
    refetchOnlyLegacy,
  } = useMenuConfigDiagnostics();

  const { migrateMutation, isRunning: isMigrateRunning } = useMigrateLegacyMenus();
  const [migrateOpen, setMigrateOpen] = useState(false);

  const handleRefetch = async (
    refetch: () => Promise<{ data?: MenuUser[] }>,
  ) => {
    const result = await refetch();
    toast.success(`Actualizado: ${result.data?.length ?? 0} usuario(s) encontrados.`);
  };

  const handleConfirmMigrate = () => {
    migrateMutation.mutate(
      onlyLegacy.map((u) => u.user_id),
      { onSuccess: () => setMigrateOpen(false) },
    );
  };

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
            onClick={() => handleRefetch(refetchMissingConfig)}
            disabled={isFetchingMissingConfig}>
            <RefreshCw size={14} className={isFetchingMissingConfig ? "animate-spin" : ""} />
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
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRefetch(refetchOnlyLegacy)}
              disabled={isFetchingOnlyLegacy}>
              <RefreshCw size={14} className={isFetchingOnlyLegacy ? "animate-spin" : ""} />
              Actualizar
            </Button>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => setMigrateOpen(true)}
              disabled={onlyLegacy.length === 0 || isMigrateRunning}>
              <ArrowRightLeft size={14} className={isMigrateRunning ? "animate-spin" : ""} />
              {isMigrateRunning ? "Migrando..." : `Migrar (${onlyLegacy.length})`}
            </Button>
          </div>
        </div>
        <UsersDiagnosticTable
          users={onlyLegacy}
          isLoading={isLoadingOnlyLegacy}
          error={errorOnlyLegacy}
          emptyMessage="Ningún usuario quedó solo en Configuración Accesos."
        />
      </section>

      <PermissionGapsSection />

      <MigrateLegacyMenusDialog
        open={migrateOpen}
        onOpenChange={setMigrateOpen}
        userCount={onlyLegacy.length}
        isMigrating={isMigrateRunning}
        onConfirm={handleConfirmMigrate}
      />
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

const TIPOS: { key: PermissionItemType; label: string }[] = [
  { key: "form", label: "Formas" },
  { key: "catalog", label: "Catálogos" },
  { key: "script", label: "Scripts" },
];

const nombres = (grupo: PermissionGapUser["faltan"]) =>
  TIPOS.flatMap((t) => (grupo[t.key] ?? []).map((i) => `${t.label.slice(0, -1)}: ${i.nombre}`));

// Usuarios con configuración de menús a los que les falta algún permiso compartido
// (ej. registros creados con una versión vieja de la lista de permisos).
const PermissionGapsSection = () => {
  const { gaps, isAnalyzing, error, analyze } = usePermissionGaps();
  const { reapplyMutation, isReapplying } = useReapplyPermissions();
  const [seleccion, setSeleccion] = useState<PermissionGapUser[] | null>(null);
  const usuarios = gaps?.usuarios ?? [];

  const handleAnalyze = async () => {
    const result = await analyze();
    if (result.data) {
      toast.success(
        `Análisis listo: ${result.data.usuarios.length} de ${result.data.revisados} usuario(s) con permisos incompletos.`,
      );
    }
  };

  const handleConfirm = () => {
    if (!seleccion) return;
    reapplyMutation.mutate(
      seleccion.map((u) => u.user_id),
      {
        onSettled: () => {
          setSeleccion(null);
          analyze();
        },
      },
    );
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-2 gap-4">
        <div>
          <h2 className="text-lg font-semibold">Usuarios con permisos incompletos</h2>
          <p className="text-sm text-muted-foreground">
            Tienen configuración de menús, pero les falta compartida alguna Forma, Catálogo o
            Script que piden sus menús. Reaplicar vuelve a compartir directo, sin cambiar sus
            menús.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={handleAnalyze} disabled={isAnalyzing || isReapplying}>
            <ScanSearch size={14} className={isAnalyzing ? "animate-pulse" : ""} />
            {isAnalyzing ? "Analizando..." : "Analizar"}
          </Button>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => setSeleccion(usuarios)}
            disabled={usuarios.length === 0 || isAnalyzing || isReapplying}>
            <ShieldCheck size={14} />
            {`Reaplicar todos (${usuarios.length})`}
          </Button>
        </div>
      </div>

      {isAnalyzing && !gaps ? (
        <div className="text-center py-6 text-muted-foreground text-sm">
          Analizando permisos de cada usuario... puede tardar en cuentas con muchos usuarios.
        </div>
      ) : error ? (
        <div className="text-center py-6 text-red-600 text-sm">
          Error al analizar. Intenta de nuevo.
        </div>
      ) : !gaps ? (
        <div className="text-center py-6 text-muted-foreground text-sm">
          Presiona &quot;Analizar&quot; para revisar los permisos compartidos de cada usuario.
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground mb-2">
            Revisados: {gaps.revisados} · Con faltantes: {usuarios.length}
            {gaps.borrados > 0 && ` · Usuarios borrados en Linkaform (se omiten): ${gaps.borrados}`}
            {gaps.errores.length > 0 && ` · No se pudieron revisar: ${gaps.errores.length}`}
          </p>
          {usuarios.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              Todos los usuarios tienen completos los permisos de sus menús.
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Username</TableHead>
                    {TIPOS.map((t) => <TableHead key={t.key}>{t.label} faltantes</TableHead>)}
                    <TableHead>Detalle</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuarios.map((u) => (
                    <TableRow key={u.user_id}>
                      <TableCell>{u.user_id}</TableCell>
                      <TableCell>{u.username}</TableCell>
                      {TIPOS.map((t) => <TableCell key={t.key}>{u.faltan[t.key]?.length ?? 0}</TableCell>)}
                      <TableCell className="max-w-xs">
                        <details className="text-xs">
                          <summary className="cursor-pointer text-blue-600">
                            {u.total} faltante(s){u.total_sobran > 0 && ` · ${u.total_sobran} de más`}
                          </summary>
                          <ul className="mt-1 space-y-0.5">
                            {nombres(u.faltan).map((n) => <li key={n}>+ {n}</li>)}
                            {nombres(u.sobran).map((n) => (
                              <li key={n} className="text-amber-700">− {n} (se quitaría)</li>
                            ))}
                          </ul>
                        </details>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" disabled={isReapplying} onClick={() => setSeleccion([u])}>
                          Reaplicar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}

      <ReapplyPermissionsDialog
        open={!!seleccion}
        onOpenChange={(open) => !open && !isReapplying && setSeleccion(null)}
        userCount={seleccion?.length ?? 0}
        faltantes={(seleccion ?? []).reduce((n, u) => n + u.total, 0)}
        sobrantes={(seleccion ?? []).reduce((n, u) => n + u.total_sobran, 0)}
        isReapplying={isReapplying}
        onConfirm={handleConfirm}
      />
    </section>
  );
};
