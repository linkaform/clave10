"use client";

import { useMemo, useState } from "react";
import { Loader2, PanelRightOpen, RefreshCcw, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useMenuRoles } from "@/hooks/menus-admin/useMenuRoles";
import { useAllUsersMenuItems } from "@/hooks/menus-admin/useUserMenuAssignment";
import { MenuItemAdmin, MenuRol } from "@/services/menus-admin";
import { cn } from "@/lib/utils";
import { CheckState, checkState } from "./assign-checkbox";
import { DiagEmpty } from "./diag-ui";
import {
  MenuKeysColumns,
  buildPlatformGroups,
  groupKeys,
} from "./menu-keys-columns";

interface MenuRolesPanelProps {
  /** Catálogo completo (web y móvil). */
  allItems: MenuItemAdmin[];
}

const sameKeys = (a: string[], b: string[]) => {
  if (a.length !== b.length) return false;
  const s = new Set(a);
  return b.every((k) => s.has(k));
};

type ReapplyMode = "agregar" | "reemplazar";

/** Columnas fijas compartidas por encabezado y filas para que alineen. */
const ROW_COLS =
  "grid grid-cols-[minmax(160px,240px)_104px_88px_88px_minmax(120px,1fr)] items-center gap-3 px-4";

/**
 * Menús por rol (2611-1649). El rol de cada usuario sale de su empleado
 * (Configuración de Áreas y Empleados). Guardar un rol no toca a nadie;
 * "Reaplicar" pasa los menús a sus usuarios, uno por uno, agregando
 * (default) o reemplazando lo que ya tienen.
 */
export function MenuRolesPanel({ allItems }: MenuRolesPanelProps) {
  const { roles, isLoading, error, saveRolMutation } = useMenuRoles();
  const { keysByUser, saveManyMutation, progress } = useAllUsersMenuItems();

  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<MenuRol | null>(null);
  const [pendingKeys, setPendingKeys] = useState<string[]>([]);
  const [reapplying, setReapplying] = useState<MenuRol | null>(null);
  const [understood, setUnderstood] = useState(false);
  const [reapplyMode, setReapplyMode] = useState<ReapplyMode>("agregar");

  const groups = useMemo(
    () => buildPlatformGroups(allItems, "web"),
    [allItems],
  );
  const catalogKeys = useMemo(
    () => new Set(groups.flatMap((g) => groupKeys(g.modules))),
    [groups],
  );

  const visibleRoles = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? roles.filter((r) => r.rol.toLowerCase().includes(q)) : roles;
  }, [roles, query]);

  /** Menús que le tocan a un usuario: la suma de sus roles ya configurados. */
  const keysForUser = (userId: number) => {
    const keys = new Set<string>();
    for (const r of roles) {
      if (r.configured && r.user_ids.includes(userId))
        r.item_keys.forEach((k) => keys.add(k));
    }
    return Array.from(keys);
  };

  // ---- Editor de un rol ----
  const openEditor = (rol: MenuRol) => {
    setEditing(rol);
    setPendingKeys(rol.item_keys);
  };
  const pendingSet = new Set(pendingKeys);
  const stateOf = (keys: string[]): CheckState => checkState(keys, pendingSet);
  const toggleKeys = (keys: string[]) => {
    if (!keys.length) return;
    const allHave = keys.every((k) => pendingSet.has(k));
    setPendingKeys((prev) => {
      const next = new Set(prev);
      for (const k of keys) {
        if (allHave) next.delete(k);
        else next.add(k);
      }
      return Array.from(next);
    });
  };
  const editorDirty = !!editing && !sameKeys(pendingKeys, editing.item_keys);
  const editorCount = pendingKeys.filter((k) => catalogKeys.has(k)).length;

  const closeEditor = () => {
    if (
      editorDirty &&
      !window.confirm("Tienes cambios sin guardar en este rol. ¿Descartarlos?")
    )
      return;
    setEditing(null);
  };
  const saveEditor = () => {
    if (!editing) return;
    saveRolMutation.mutate(
      { rol: editing.rol, keys: pendingKeys },
      { onSuccess: () => setEditing(null) },
    );
  };

  // ---- Reaplicar ----
  // "agregar": suma los menús de este rol a lo que ya tiene cada usuario (no quita nada).
  // "reemplazar": deja a cada usuario con la suma de sus roles configurados (quita lo demás).
  const reapplyChanges = (rol: MenuRol, mode: ReapplyMode) =>
    rol.user_ids
      .map((userId) => {
        const current = keysByUser?.[userId] ?? [];
        const keys =
          mode === "agregar"
            ? Array.from(new Set([...current, ...rol.item_keys]))
            : keysForUser(userId);
        return { userId, keys, current };
      })
      .filter((c) => !sameKeys(c.keys, c.current))
      .map(({ userId, keys }) => ({ userId, keys }));

  const pendingReapply = reapplying
    ? reapplyChanges(reapplying, reapplyMode)
    : [];
  const needsUnderstood = reapplyMode === "reemplazar";

  const openReapply = (rol: MenuRol) => {
    setReapplyMode("agregar");
    setUnderstood(false);
    setReapplying(rol);
  };

  const confirmReapply = () => {
    if (!reapplying) return;
    saveManyMutation.mutate(pendingReapply, {
      onSettled: () => {
        setReapplying(null);
        setUnderstood(false);
      },
    });
  };

  const isReapplying = saveManyMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2" aria-label="Cargando">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-14 animate-pulse rounded-lg bg-c10-skeleton"
          />
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <DiagEmpty tone="error">
        {(error as Error).message || "No se pudieron cargar los roles."}
      </DiagEmpty>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-[320px]">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-c10-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar rol"
            aria-label="Buscar rol"
            className="h-10 w-full rounded-lg border border-c10-line bg-c10-surface pl-9 pr-3 text-sm text-c10-title outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-c10-faint focus:border-[#2F80ED] focus:shadow-[0_0_0_3px_rgba(59,130,246,.15)]"
          />
        </div>
        <span className="text-[13px] tabular-nums text-c10-meta">
          {visibleRoles.length} rol{visibleRoles.length === 1 ? "" : "es"}
        </span>
        {isReapplying && progress && (
          <span className="flex items-center gap-1.5 text-[13px] text-c10-secondary">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Reaplicando {progress.done} de {progress.total}...
          </span>
        )}
      </div>

      <p className="text-xs text-c10-faint">
        El rol de cada usuario sale de su empleado (Configuración de Áreas y
        Empleados). Guardar los menús de un rol no cambia a nadie: usa Reaplicar
        para pasárselos a sus usuarios.
      </p>

      <div className="overflow-hidden rounded-xl shadow-[0_0_0_1px_var(--c10-line)]">
        <div
          className={cn(
            ROW_COLS,
            "bg-c10-blue-light py-2.5 text-xs font-semibold uppercase tracking-[.05em] text-c10-secondary",
          )}
        >
          <span>Rol</span>
          {/* Columnas de botones sin título (el botón dice lo que hace). */}
          <span aria-hidden />
          <span className="text-center">Menús</span>
          <span className="text-center">Usuarios</span>
          <span aria-hidden />
        </div>
        {visibleRoles.length === 0 && (
          <div className="border-t border-c10-line bg-c10-surface p-6 text-center text-sm text-c10-meta">
            {roles.length
              ? "Ningún rol coincide con la búsqueda."
              : "No hay roles en el catálogo."}
          </div>
        )}
        {visibleRoles.map((r) => {
          const menus = r.item_keys.filter((k) => catalogKeys.has(k)).length;
          const canReapply =
            r.configured && r.user_ids.length > 0 && !isReapplying;
          return (
            <div
              key={r.rol}
              className={cn(
                ROW_COLS,
                "border-t border-c10-line bg-c10-surface py-2.5",
              )}
            >
              <div className="flex min-w-0 flex-col gap-1">
                <span className="truncate text-sm font-semibold text-c10-title">
                  {r.rol}
                </span>
                <span
                  className={cn(
                    "inline-flex h-[18px] w-fit items-center rounded-full px-[7px] text-[11px] font-semibold",
                    r.configured
                      ? "bg-[rgba(22,163,74,.12)] text-[#16A34A]"
                      : "bg-c10-sunken text-c10-meta",
                  )}
                >
                  {r.configured ? "Configurado" : "Sin menús"}
                </span>
              </div>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => openEditor(r)}
                  className="flex h-8 items-center gap-1.5 rounded-lg bg-c10-sunken px-2.5 text-[13px] font-medium text-c10-secondary transition-colors duration-150 hover:bg-c10-blue-light hover:text-[#2F80ED]"
                >
                  <PanelRightOpen className="h-4 w-4" /> Menús
                </button>
              </div>
              <span className="text-center text-sm tabular-nums text-c10-label">
                {menus}
              </span>
              <span
                className="text-center text-sm tabular-nums text-c10-label"
                title="Empleados con este rol que tienen usuario"
              >
                {r.user_ids.length}
              </span>
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => openReapply(r)}
                  disabled={!canReapply}
                  title={
                    !r.configured
                      ? "Primero guarda los menús del rol"
                      : !r.user_ids.length
                        ? "Ningún empleado con usuario tiene este rol"
                        : "Pasar los menús del rol a sus usuarios"
                  }
                  className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium text-[#2F80ED] transition-colors duration-150 hover:bg-c10-blue-light disabled:cursor-not-allowed disabled:text-c10-faint disabled:hover:bg-transparent"
                >
                  <RefreshCcw className="h-4 w-4" /> Reaplicar
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Editor de menús del rol */}
      <Sheet open={!!editing} onOpenChange={(open) => !open && closeEditor()}>
        <SheetContent
          side="right"
          className="flex w-[min(880px,100vw)] max-w-full flex-col gap-0 p-0 font-[Arial,Helvetica,sans-serif] sm:max-w-[min(880px,100vw)]"
        >
          <SheetHeader className="border-b border-c10-line-card px-5 pb-4 pt-5 text-left">
            <SheetTitle className="text-xl font-semibold tracking-[-0.02em] text-c10-title">
              Menús del rol
            </SheetTitle>
            {editing && (
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-c10-title">
                  {editing.rol}
                </span>
                <span className="text-xs text-c10-meta">
                  {editorCount}/{catalogKeys.size} menús ·{" "}
                  {editing.user_ids.length} usuario
                  {editing.user_ids.length === 1 ? "" : "s"} con este rol
                </span>
              </div>
            )}
          </SheetHeader>
          <MenuKeysColumns
            groups={groups}
            stateOf={stateOf}
            onToggleKeys={toggleKeys}
          />
          <div className="flex items-center justify-end gap-2 border-t border-c10-line-card px-5 py-3">
            <span className="mr-auto text-xs text-c10-meta">
              Guardar no cambia a los usuarios; después usa Reaplicar.
            </span>
            <Button
              type="button"
              variant="ghost"
              onClick={closeEditor}
              disabled={saveRolMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={saveEditor}
              disabled={!editorDirty || saveRolMutation.isPending}
              className="bg-[#2F80ED] text-white hover:bg-[#1E6FDB]"
            >
              {saveRolMutation.isPending && (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              )}
              Guardar
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Confirmación de reaplicar */}
      <Dialog
        open={!!reapplying}
        onOpenChange={(open) => !open && !isReapplying && setReapplying(null)}
        modal
      >
        <DialogContent className="max-w-md" aria-describedby="">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Reaplicar rol {reapplying?.rol}
            </DialogTitle>
          </DialogHeader>
          {reapplying && (
            <div className="flex flex-col gap-3 text-sm text-c10-secondary">
              <div
                className="flex flex-col gap-2"
                role="radiogroup"
                aria-label="Cómo reaplicar"
              >
                {(
                  [
                    {
                      value: "agregar",
                      title: "Agregar a lo que ya tienen",
                      desc: "Suma los menús del rol. No les quita nada.",
                    },
                    {
                      value: "reemplazar",
                      title: "Reemplazar por los de sus roles",
                      desc: "Quedan solo con los menús de sus roles configurados; lo asignado a mano se quita.",
                    },
                  ] as const
                ).map((opt) => (
                  <label
                    key={opt.value}
                    className={cn(
                      "flex cursor-pointer items-start gap-2.5 rounded-lg px-3 py-2.5 shadow-[0_0_0_1px_var(--c10-line)] transition-colors duration-150",
                      reapplyMode === opt.value &&
                        "bg-c10-blue-light shadow-[0_0_0_1px_#2F80ED]",
                    )}
                  >
                    <input
                      type="radio"
                      name="reapply-mode"
                      value={opt.value}
                      checked={reapplyMode === opt.value}
                      onChange={() => {
                        setReapplyMode(opt.value);
                        setUnderstood(false);
                      }}
                      disabled={isReapplying}
                      className="mt-0.5"
                    />
                    <span className="flex flex-col gap-0.5">
                      <span className="font-semibold text-c10-title">
                        {opt.title}
                      </span>
                      <span className="text-xs text-c10-meta">{opt.desc}</span>
                    </span>
                  </label>
                ))}
              </div>
              {pendingReapply.length === 0 ? (
                <p>
                  Los {reapplying.user_ids.length} usuarios con este rol ya
                  quedan así. No hay nada que cambiar.
                </p>
              ) : (
                <>
                  <p>
                    Se van a guardar los menús de{" "}
                    <strong className="text-c10-title">
                      {pendingReapply.length} de {reapplying.user_ids.length}{" "}
                      usuarios
                    </strong>
                    ; los demás ya quedan así. Los permisos pueden tardar unos
                    minutos en reflejarse.
                  </p>
                  {needsUnderstood && (
                    <label className="flex cursor-pointer items-start gap-2 text-c10-title">
                      <input
                        type="checkbox"
                        checked={understood}
                        onChange={(e) => setUnderstood(e.target.checked)}
                        className="mt-0.5"
                      />
                      Entiendo que a {pendingReapply.length} usuario
                      {pendingReapply.length === 1 ? "" : "s"} se le
                      {pendingReapply.length === 1 ? "" : "s"} quitan los menús
                      que no estén en sus roles.
                    </label>
                  )}
                </>
              )}
              <div className="mt-1 flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setReapplying(null)}
                  disabled={isReapplying}
                >
                  Cancelar
                </Button>
                {pendingReapply.length > 0 && (
                  <Button
                    type="button"
                    className="w-full bg-[#2F80ED] text-white hover:bg-[#1E6FDB]"
                    onClick={confirmReapply}
                    disabled={(needsUnderstood && !understood) || isReapplying}
                  >
                    {isReapplying && progress
                      ? `Reaplicando ${progress.done} de ${progress.total}...`
                      : reapplyMode === "agregar"
                        ? `Agregar a ${pendingReapply.length}`
                        : `Reemplazar en ${pendingReapply.length}`}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
