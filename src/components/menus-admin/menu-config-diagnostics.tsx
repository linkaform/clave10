"use client";

import { useState } from "react";
import { ArrowRightLeft, RefreshCw, ScanSearch } from "lucide-react";
import { toast } from "sonner";

import { DiagBlock, DiagEmpty, diagBtn, diagTableWrap } from "./diag-ui";
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
import { MassShareSection } from "@/components/menus-admin/mass-share-section";

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
    <div className="flex flex-col gap-4">
      <DiagBlock
        title="Usuarios sin menús"
        count={isLoadingMissingConfig ? undefined : missingConfig.length}
        description="Existen en el catálogo de usuarios pero nunca se les asignó ningún menú. Al iniciar sesión verán una pantalla vacía."
        actions={
          <button
            type="button"
            className={diagBtn.secondary}
            onClick={() => handleRefetch(refetchMissingConfig)}
            disabled={isFetchingMissingConfig}>
            <RefreshCw size={14} className={isFetchingMissingConfig ? "animate-spin" : ""} />
            Actualizar
          </button>
        }>
        <UsersDiagnosticTable
          users={missingConfig}
          isLoading={isLoadingMissingConfig}
          error={errorMissingConfig}
          emptyMessage="Todos los usuarios tienen configuración de menús."
        />
      </DiagBlock>

      <DiagBlock
        title="Usuarios con configuración anterior"
        count={isLoadingOnlyLegacy ? undefined : onlyLegacy.length}
        description="Sus permisos siguen en la configuración de accesos anterior y no se han migrado. Pueden estar operando con permisos desactualizados."
        actions={
          <>
            <button
              type="button"
              className={diagBtn.secondary}
              onClick={() => handleRefetch(refetchOnlyLegacy)}
              disabled={isFetchingOnlyLegacy}>
              <RefreshCw size={14} className={isFetchingOnlyLegacy ? "animate-spin" : ""} />
              Actualizar
            </button>
            <button
              type="button"
              className={diagBtn.primary}
              onClick={() => setMigrateOpen(true)}
              disabled={onlyLegacy.length === 0 || isMigrateRunning}>
              <ArrowRightLeft size={14} className={isMigrateRunning ? "animate-spin" : ""} />
              {isMigrateRunning ? "Migrando..." : `Migrar Todos (${onlyLegacy.length})`}
            </button>
          </>
        }>
        <UsersDiagnosticTable
          users={onlyLegacy}
          isLoading={isLoadingOnlyLegacy}
          error={errorOnlyLegacy}
          emptyMessage="Ningún usuario quedó en la configuración anterior."
        />
      </DiagBlock>

      <PermissionGapsSection />

      <MassShareSection />

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
    return <DiagEmpty>Cargando...</DiagEmpty>;
  }
  if (error) {
    return (
      <DiagEmpty tone="error">Error al cargar la lista. Intenta actualizar de nuevo.</DiagEmpty>
    );
  }
  if (users.length === 0) {
    return <DiagEmpty>{emptyMessage}</DiagEmpty>;
  }
  return (
    <div className={diagTableWrap}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Usuario</TableHead>
            <TableHead>Correo</TableHead>
            <TableHead>ID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.user_id}>
              <TableCell className="font-semibold">{user.nombre || "—"}</TableCell>
              <TableCell>{user.username}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell className="tabular-nums text-c10-meta">{user.user_id}</TableCell>
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
    <DiagBlock
      title="Usuarios con permisos incompletos"
      count={gaps ? usuarios.length : undefined}
      description="Tienen menús asignados, pero les falta acceso a alguna forma, catálogo o script que esos menús necesitan. Reaplicar vuelve a compartirlos sin cambiar sus menús. Para varios usuarios usa Compartir masivo (abajo)."
      actions={
        /* Sin "Reaplicar todos" (1509): reaplicar usuario por usuario a muchos es la
            carga que tumbó el servicio. Para varios usuarios se usa Compartir masivo. */
        <button
          type="button"
          className={diagBtn.secondary}
          onClick={handleAnalyze}
          disabled={isAnalyzing || isReapplying}>
          <ScanSearch size={14} className={isAnalyzing ? "animate-pulse" : ""} />
          {isAnalyzing ? "Analizando..." : "Analizar"}
        </button>
      }>

      {isAnalyzing && !gaps ? (
        <DiagEmpty>
          Analizando permisos de cada usuario... puede tardar en cuentas con muchos usuarios.
        </DiagEmpty>
      ) : error ? (
        <DiagEmpty tone="error">Error al analizar. Intenta de nuevo.</DiagEmpty>
      ) : !gaps ? (
        <DiagEmpty>
          Presiona &quot;Analizar&quot; para revisar los permisos compartidos de cada usuario.
        </DiagEmpty>
      ) : (
        <>
          <p className="text-xs text-c10-meta">
            Revisados: {gaps.revisados} · Con faltantes: {usuarios.length}
            {gaps.borrados > 0 && ` · Usuarios borrados en Linkaform (se omiten): ${gaps.borrados}`}
            {gaps.errores.length > 0 && ` · No se pudieron revisar: ${gaps.errores.length}`}
          </p>
          {usuarios.length === 0 ? (
            <DiagEmpty>Todos los usuarios tienen completos los permisos de sus menús.</DiagEmpty>
          ) : (
            <div className={diagTableWrap}>
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
                          <summary className="cursor-pointer text-[#2F80ED]">
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
                        <button
                          type="button"
                          className={diagBtn.secondary}
                          disabled={isReapplying}
                          onClick={() => setSeleccion([u])}>
                          Reaplicar
                        </button>
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
    </DiagBlock>
  );
};
