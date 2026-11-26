"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ModuleGroup } from "@/lib/menus-admin-tree";
import { MenuItemPlatform, MenuUser } from "@/services/menus-admin";
import { cn } from "@/lib/utils";
import { AssignCheckbox, CheckState } from "./assign-checkbox";

export interface DrawerPlatformGroup {
  platform: MenuItemPlatform;
  label: string;
  modules: ModuleGroup[];
}

const groupKeys = (modules: ModuleGroup[]) =>
  modules.flatMap((m) => m.sections.flatMap((s) => s.items.map((i) => i.key)));

interface MenuAssignmentDrawerProps {
  user: MenuUser | null;
  /** Menús por plataforma (web y móvil) en una sola vista. */
  groups: DrawerPlatformGroup[];
  /** Usuarios a los que aplican los cambios (1, o los seleccionados). */
  targetCount: number;
  /** Estado de un conjunto de keys entre los usuarios destino. */
  stateOf: (keys: string[]) => CheckState;
  onToggleKeys: (keys: string[]) => void;
  onClose: () => void;
}

/**
 * Panel lateral con los menús de web y móvil, por módulo y sección. Si el
 * usuario abierto es parte de una selección de varios, los cambios aplican a
 * todos ellos.
 */
export function MenuAssignmentDrawer({
  user,
  groups,
  targetCount,
  stateOf,
  onToggleKeys,
  onClose,
}: MenuAssignmentDrawerProps) {
  const allKeys = groups.flatMap((g) => groupKeys(g.modules));
  const total = allKeys.length;
  const count = allKeys.filter((k) => stateOf([k]) === "all").length;
  const multi = targetCount > 1;

  return (
    <Sheet open={!!user} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="flex w-[min(880px,100vw)] max-w-full flex-col gap-0 p-0 font-[Arial,Helvetica,sans-serif] sm:max-w-[min(880px,100vw)]"
      >
        <SheetHeader className="border-b border-c10-line-card px-5 pb-4 pt-5 text-left">
          <SheetTitle className="text-xl font-semibold tracking-[-0.02em] text-c10-title">
            Menús asignados
          </SheetTitle>
          {user && (
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-c10-title">
                {user.nombre || user.username}
              </span>
              <span className="text-xs text-c10-meta">
                {multi
                  ? `${count}/${total} menús en común`
                  : `${user.username} · ${count}/${total} menús`}
              </span>
              {multi && (
                <span className="mt-1.5 rounded-lg bg-c10-blue-light px-2.5 py-1.5 text-xs font-medium text-c10-secondary">
                  Los cambios aplican a los {targetCount} usuarios
                  seleccionados.
                </span>
              )}
            </div>
          )}
        </SheetHeader>

        {/* Una columna por plataforma, cada una con su scroll; en pantallas angostas se apilan. */}
        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto bg-c10-panel md:grid-cols-2 md:overflow-hidden">
          {groups.map((g, gi) => {
            const gKeys = groupKeys(g.modules);
            const gCount = gKeys.filter((k) => stateOf([k]) === "all").length;
            return (
              <section
                key={g.platform}
                className={cn(
                  "flex flex-col gap-3 px-4 pb-4 md:min-h-0 md:overflow-y-auto",
                  gi > 0 &&
                    "border-t border-c10-line-card md:border-l md:border-t-0",
                )}
              >
                <div className="sticky top-0 z-[1] -mx-4 flex items-center gap-3 bg-c10-panel px-5 pb-2 pt-4">
                  <AssignCheckbox
                    state={stateOf(gKeys)}
                    onToggle={() => onToggleKeys(gKeys)}
                    label={`Asignar o quitar todos los menús de ${g.label}`}
                  />
                  <span className="flex-1 text-xs font-semibold uppercase tracking-[.05em] text-c10-secondary">
                    {g.label}
                  </span>
                  <span className="text-xs tabular-nums text-c10-meta">
                    {gCount}/{gKeys.length}
                  </span>
                </div>
                {g.modules.map((m) => {
                  const moduleKeys = m.sections.flatMap((s) =>
                    s.items.map((i) => i.key),
                  );
                  const mState = stateOf(moduleKeys);
                  const mCount = moduleKeys.filter(
                    (k) => stateOf([k]) === "all",
                  ).length;
                  return (
                    <div
                      key={m.menuKey}
                      className="rounded-xl bg-c10-surface p-3 shadow-[0_0_0_1px_var(--c10-line-card)]"
                    >
                      <div className="flex items-center gap-3">
                        <AssignCheckbox
                          state={mState}
                          onToggle={() => onToggleKeys(moduleKeys)}
                          label={`Asignar o quitar ${m.menu}`}
                        />
                        <span className="flex-1 text-sm font-bold text-c10-title">
                          {m.menu}
                        </span>
                        <span className="text-xs tabular-nums text-c10-meta">
                          {mCount}/{moduleKeys.length}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-col gap-2 pl-8">
                        {m.sections.map((s) => {
                          const sKeys = s.items.map((i) => i.key);
                          return (
                            <div
                              key={s.seccionKey}
                              className="flex flex-col gap-1"
                            >
                              <div className="flex items-center gap-2.5">
                                <AssignCheckbox
                                  state={stateOf(sKeys)}
                                  onToggle={() => onToggleKeys(sKeys)}
                                  label={`Asignar o quitar ${s.seccion}`}
                                />
                                <span className="text-[13px] font-semibold text-c10-label">
                                  {s.seccion}
                                </span>
                              </div>
                              <div className="flex flex-col gap-0.5 pl-7">
                                {s.items.map((item) => (
                                  <label
                                    key={item.key}
                                    className="flex min-h-8 cursor-pointer items-center gap-2.5 rounded-lg px-1 text-[13px] text-c10-text hover:bg-c10-panel"
                                  >
                                    <AssignCheckbox
                                      state={stateOf([item.key])}
                                      onToggle={() => onToggleKeys([item.key])}
                                      label={`Asignar o quitar ${item.elemento}`}
                                    />
                                    <span className="truncate">
                                      {item.elemento}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </section>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
