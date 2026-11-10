"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownAZ, ArrowUpAZ, PanelRightOpen, Search, X } from "lucide-react";
import { useMenuUsers, useAllUsersMenuItems } from "@/hooks/menus-admin/useUserMenuAssignment";
import { groupByModule } from "@/lib/menus-admin-tree";
import { MenuItemAdmin, MenuUser } from "@/services/menus-admin";
import { cn } from "@/lib/utils";
import { AssignCheckbox, CheckState, checkState } from "./assign-checkbox";
import { MenuAssignmentDrawer } from "./menu-assignment-drawer";
import { DiagEmpty } from "./diag-ui";

interface MenuAssignmentGridProps {
  /** Items del catálogo de la plataforma que se está viendo (web o móvil). */
  items: MenuItemAdmin[];
  onDirtyChange?: (dirty: boolean) => void;
}

const sameKeys = (a: string[], b: string[]) => {
  if (a.length !== b.length) return false;
  const s = new Set(a);
  return b.every((k) => s.has(k));
};

/**
 * Asignación por usuario: tabla usuarios × módulos. Cada celda asigna o quita
 * el módulo completo; el detalle por sección/menú está en el panel lateral.
 * Nada se guarda hasta "Guardar cambios".
 */
export function MenuAssignmentGrid({ items, onDirtyChange }: MenuAssignmentGridProps) {
  const { users, isLoadingUsers } = useMenuUsers();
  const { keysByUser, isLoading, error, saveManyMutation, progress } = useAllUsersMenuItems();

  const modules = useMemo(() => groupByModule(items), [items]);
  const moduleKeys = useMemo(
    () => modules.map((m) => m.sections.flatMap((s) => s.items.map((i) => i.key))),
    [modules],
  );
  const platformKeys = useMemo(() => new Set(items.map((i) => i.key)), [items]);

  // Cambios sin guardar: lista completa de keys por usuario.
  const [pending, setPending] = useState<Record<number, string[]>>({});
  const [query, setQuery] = useState("");
  const [sortDesc, setSortDesc] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [detailUserId, setDetailUserId] = useState<number | null>(null);

  const originalKeys = (userId: number) => keysByUser?.[userId] ?? [];
  const keysOf = (userId: number) => pending[userId] ?? originalKeys(userId);

  const changedIds = Object.keys(pending)
    .map(Number)
    .filter((id) => !sameKeys(pending[id], originalKeys(id)));
  const dirty = changedIds.length > 0;

  useEffect(() => {
    onDirtyChange?.(dirty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty]);

  const visibleUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? users.filter((u) =>
          [u.nombre, u.username, u.email].some((v) => (v || "").toLowerCase().includes(q)),
        )
      : users;
    const name = (u: MenuUser) => (u.nombre || u.username || "").toLowerCase();
    return [...list].sort((a, b) =>
      sortDesc ? name(b).localeCompare(name(a)) : name(a).localeCompare(name(b)),
    );
  }, [users, query, sortDesc]);

  /** Si todos los usuarios tienen todas las keys, las quita; si no, las agrega a todos. */
  const toggleKeys = (userIds: number[], keys: string[]) => {
    if (!userIds.length || !keys.length) return;
    const allHave = userIds.every((id) => {
      const s = new Set(keysOf(id));
      return keys.every((k) => s.has(k));
    });
    setPending((prev) => {
      const next = { ...prev };
      for (const id of userIds) {
        const current = new Set(prev[id] ?? originalKeys(id));
        for (const k of keys) {
          if (allHave) current.delete(k);
          else current.add(k);
        }
        next[id] = Array.from(current);
      }
      return next;
    });
  };

  // Las acciones de columna aplican a los seleccionados; si no hay, a los visibles.
  const targetIds = (() => {
    const sel = visibleUsers.filter((u) => selected.has(u.user_id)).map((u) => u.user_id);
    return sel.length ? sel : visibleUsers.map((u) => u.user_id);
  })();

  const columnState = (mKeys: string[]): CheckState => {
    if (!targetIds.length) return "none";
    const states = targetIds.map((id) => checkState(mKeys, new Set(keysOf(id))));
    if (states.every((s) => s === "all")) return "all";
    if (states.every((s) => s === "none")) return "none";
    return "some";
  };

  const allVisibleSelected =
    visibleUsers.length > 0 && visibleUsers.every((u) => selected.has(u.user_id));
  const someVisibleSelected = visibleUsers.some((u) => selected.has(u.user_id));

  const toggleSelectAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) visibleUsers.forEach((u) => next.delete(u.user_id));
      else visibleUsers.forEach((u) => next.add(u.user_id));
      return next;
    });
  };

  const toggleRow = (userId: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });

  const handleSave = () => {
    const changes = changedIds.map((id) => ({ userId: id, keys: pending[id] }));
    saveManyMutation.mutate(changes, {
      onSuccess: () => setPending({}),
    });
  };

  const gridCols = `minmax(280px, 1fr) repeat(${modules.length}, 120px)`;
  const detailUser = users.find((u) => u.user_id === detailUserId) ?? null;
  const isSaving = saveManyMutation.isPending;

  if (isLoading || isLoadingUsers) {
    return (
      <div className="flex flex-col gap-2" aria-label="Cargando">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-c10-skeleton" />
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <DiagEmpty tone="error">
        No se pudieron cargar los menús de los usuarios. Si la cuenta todavía no tiene la
        versión nueva del editor, falta instalar el módulo base.
      </DiagEmpty>
    );
  }
  if (!modules.length) {
    return <DiagEmpty>No hay módulos en esta plataforma.</DiagEmpty>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-[320px]">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-c10-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar usuario o correo"
            aria-label="Buscar usuario o correo"
            className="h-10 w-full rounded-lg border border-c10-line bg-c10-surface pl-9 pr-3 text-sm text-c10-title outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-c10-faint focus:border-[#2F80ED] focus:shadow-[0_0_0_3px_rgba(59,130,246,.15)]"
          />
        </div>
        <span className="text-[13px] tabular-nums text-c10-meta">
          {visibleUsers.length} usuario{visibleUsers.length === 1 ? "" : "s"}
          {selected.size > 0 && ` · ${selected.size} seleccionado${selected.size === 1 ? "" : "s"}`}
        </span>
        {selected.size > 0 && (
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="flex h-8 items-center gap-1 rounded-lg px-2 text-[13px] font-medium text-c10-secondary transition-colors duration-150 hover:bg-c10-sunken">
            <X className="h-3.5 w-3.5" /> Quitar selección
          </button>
        )}
      </div>

      <p className="text-xs text-c10-faint">
        La casilla de cada columna asigna o quita el módulo a{" "}
        {selected.size > 0 ? "los usuarios seleccionados" : "todos los usuarios visibles"}. Para
        elegir menús sueltos abre el detalle del usuario.
      </p>

      <div className="max-h-[70vh] overflow-auto rounded-xl shadow-[0_0_0_1px_var(--c10-line)]">
        <div className="min-w-full" style={{ width: "max-content" }}>
          {/* Encabezado */}
          <div
            className="sticky top-0 z-10 grid bg-c10-blue-light"
            style={{ gridTemplateColumns: gridCols }}>
            <div className="sticky left-0 z-10 flex items-center gap-3 bg-c10-blue-light px-3 py-2.5 shadow-[1px_0_0_var(--c10-blue-border)]">
              <AssignCheckbox
                state={allVisibleSelected ? "all" : someVisibleSelected ? "some" : "none"}
                onToggle={toggleSelectAll}
                label="Seleccionar usuarios visibles"
              />
              <button
                type="button"
                onClick={() => setSortDesc((d) => !d)}
                className="flex items-center gap-1 text-xs font-semibold uppercase tracking-[.05em] text-c10-secondary">
                Usuario
                {sortDesc ? (
                  <ArrowUpAZ className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDownAZ className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            {modules.map((m, i) => (
              <div
                key={m.menuKey}
                className="flex flex-col items-center justify-end gap-2 px-1.5 py-2.5 text-center">
                <span className="w-full text-[11px] font-semibold uppercase leading-tight tracking-[.04em] text-c10-secondary [overflow-wrap:anywhere] [text-wrap:balance]">
                  {m.menu}
                </span>
                <AssignCheckbox
                  state={columnState(moduleKeys[i])}
                  onToggle={() => toggleKeys(targetIds, moduleKeys[i])}
                  label={`Asignar o quitar ${m.menu} a ${selected.size > 0 ? "los seleccionados" : "todos los visibles"}`}
                  disabled={!targetIds.length}
                />
              </div>
            ))}
          </div>

          {/* Filas */}
          {visibleUsers.length === 0 && (
            <div className="border-t border-c10-line bg-c10-surface p-6 text-center text-sm text-c10-meta">
              Ningún usuario coincide con la búsqueda.
            </div>
          )}
          {visibleUsers.map((u) => {
            const keys = keysOf(u.user_id);
            const assigned = new Set(keys);
            const hasPlatformMenus = keys.some((k) => platformKeys.has(k));
            const changed = changedIds.includes(u.user_id);
            const isSel = selected.has(u.user_id);
            const rowBg = isSel ? "bg-c10-blue-subtle" : "bg-c10-surface";
            return (
              <div
                key={u.user_id}
                className={cn("grid border-t border-c10-line", rowBg)}
                style={{ gridTemplateColumns: gridCols }}>
                <div
                  className={cn(
                    "sticky left-0 z-[1] flex min-w-0 items-center gap-3 px-3 py-2.5 shadow-[1px_0_0_var(--c10-line)]",
                    rowBg,
                  )}>
                  <AssignCheckbox
                    state={isSel ? "all" : "none"}
                    onToggle={() => toggleRow(u.user_id)}
                    label={`Seleccionar ${u.nombre || u.username}`}
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="truncate text-sm font-semibold text-c10-title">
                      {u.nombre || u.username}
                    </span>
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span className="truncate text-xs text-c10-meta">{u.username}</span>
                      <span
                        className={cn(
                          "inline-flex h-[18px] shrink-0 items-center rounded-full px-[7px] text-[11px] font-semibold",
                          changed
                            ? "bg-[rgba(245,158,11,.14)] text-amber-700"
                            : hasPlatformMenus
                              ? "bg-[rgba(22,163,74,.12)] text-[#16A34A]"
                              : "bg-c10-red-subtle text-[#DC2626]",
                        )}>
                        {changed ? "Sin guardar" : hasPlatformMenus ? "Asignado" : "Por asignar"}
                      </span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDetailUserId(u.user_id)}
                    title="Ver menús asignados"
                    aria-label={`Ver menús asignados de ${u.nombre || u.username}`}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-c10-sunken text-c10-secondary transition-colors duration-150 hover:bg-c10-blue-light hover:text-[#2F80ED]">
                    <PanelRightOpen className="h-4 w-4" />
                  </button>
                </div>
                {modules.map((m, i) => {
                  const mKeys = moduleKeys[i];
                  const n = mKeys.filter((k) => assigned.has(k)).length;
                  const state = checkState(mKeys, assigned);
                  return (
                    <div
                      key={m.menuKey}
                      className={cn(
                        "flex flex-col items-center justify-center gap-1 px-1.5 py-2",
                        state === "all" && !isSel && "bg-c10-panel",
                      )}>
                      <AssignCheckbox
                        state={state}
                        onToggle={() => toggleKeys([u.user_id], mKeys)}
                        label={`Asignar o quitar ${m.menu} a ${u.nombre || u.username}`}
                      />
                      <button
                        type="button"
                        onClick={() => setDetailUserId(u.user_id)}
                        className={cn(
                          "text-[11px] tabular-nums hover:text-[#2F80ED] hover:underline",
                          n > 0 ? "font-semibold text-c10-label" : "text-c10-faint",
                        )}>
                        {n}/{mKeys.length}
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {dirty && (
        <div className="sticky bottom-4 z-30 flex items-center justify-end gap-3 rounded-2xl bg-c10-surface px-4 py-3 shadow-[0_0_0_1px_var(--c10-line-card),0_12px_32px_rgba(15,23,42,.14)]">
          <span className="mr-auto flex items-center gap-2 text-sm text-c10-secondary">
            <span className="h-2 w-2 rounded-full bg-[#F59E0B]" />
            {isSaving && progress
              ? `Guardando ${progress.done} de ${progress.total}...`
              : `${changedIds.length} usuario${changedIds.length === 1 ? "" : "s"} con cambios sin guardar`}
          </span>
          <button
            type="button"
            onClick={() => setPending({})}
            disabled={isSaving}
            className="h-10 rounded-lg border border-c10-line bg-c10-surface px-4 text-sm font-medium text-c10-text transition-colors duration-150 hover:bg-c10-sunken disabled:opacity-50">
            Descartar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="h-10 rounded-lg bg-[#2F80ED] px-4 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#1E6FDB] disabled:opacity-50">
            {isSaving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      )}

      <MenuAssignmentDrawer
        user={detailUser}
        modules={modules}
        assignedKeys={detailUser ? keysOf(detailUser.user_id) : []}
        onToggleKeys={(keys) => detailUser && toggleKeys([detailUser.user_id], keys)}
        onClose={() => setDetailUserId(null)}
      />
    </div>
  );
}
