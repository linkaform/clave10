"use client";

import { useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ModuleGroup } from "@/lib/menus-admin-tree";
import { MenuUser } from "@/services/menus-admin";
import { AssignCheckbox, checkState } from "./assign-checkbox";

interface MenuAssignmentDrawerProps {
  user: MenuUser | null;
  modules: ModuleGroup[];
  assignedKeys: string[];
  onToggleKeys: (keys: string[]) => void;
  onClose: () => void;
}

/** Panel lateral con los menús de un usuario, por módulo y sección. */
export function MenuAssignmentDrawer({
  user,
  modules,
  assignedKeys,
  onToggleKeys,
  onClose,
}: MenuAssignmentDrawerProps) {
  const assigned = useMemo(() => new Set(assignedKeys), [assignedKeys]);
  const total = modules.reduce(
    (n, m) => n + m.sections.reduce((k, s) => k + s.items.length, 0),
    0,
  );
  const count = modules.reduce(
    (n, m) =>
      n + m.sections.reduce((k, s) => k + s.items.filter((i) => assigned.has(i.key)).length, 0),
    0,
  );

  return (
    <Sheet open={!!user} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="flex w-[440px] max-w-full flex-col gap-0 p-0 font-[Arial,Helvetica,sans-serif] sm:max-w-[440px]">
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
                {user.username} · {count}/{total} menús
              </span>
            </div>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto bg-c10-panel p-4">
          <div className="flex flex-col gap-3">
            {modules.map((m) => {
              const moduleKeys = m.sections.flatMap((s) => s.items.map((i) => i.key));
              const mState = checkState(moduleKeys, assigned);
              const mCount = moduleKeys.filter((k) => assigned.has(k)).length;
              return (
                <div key={m.menuKey} className="rounded-xl bg-c10-surface p-3 shadow-[0_0_0_1px_var(--c10-line-card)]">
                  <div className="flex items-center gap-3">
                    <AssignCheckbox
                      state={mState}
                      onToggle={() => onToggleKeys(moduleKeys)}
                      label={`Asignar o quitar ${m.menu}`}
                    />
                    <span className="flex-1 text-sm font-bold text-c10-title">{m.menu}</span>
                    <span className="text-xs tabular-nums text-c10-meta">
                      {mCount}/{moduleKeys.length}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-col gap-2 pl-8">
                    {m.sections.map((s) => {
                      const sKeys = s.items.map((i) => i.key);
                      return (
                        <div key={s.seccionKey} className="flex flex-col gap-1">
                          <div className="flex items-center gap-2.5">
                            <AssignCheckbox
                              state={checkState(sKeys, assigned)}
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
                                className="flex min-h-8 cursor-pointer items-center gap-2.5 rounded-lg px-1 text-[13px] text-c10-text hover:bg-c10-panel">
                                <AssignCheckbox
                                  state={assigned.has(item.key) ? "all" : "none"}
                                  onToggle={() => onToggleKeys([item.key])}
                                  label={`Asignar o quitar ${item.elemento}`}
                                />
                                <span className="truncate">{item.elemento}</span>
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
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
