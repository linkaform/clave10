"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { MenuUser } from "@/services/menus-admin";
import { CheckState } from "./assign-checkbox";
import {
  DrawerPlatformGroup,
  MenuKeysColumns,
  groupKeys,
} from "./menu-keys-columns";

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

        <MenuKeysColumns
          groups={groups}
          stateOf={stateOf}
          onToggleKeys={onToggleKeys}
        />
      </SheetContent>
    </Sheet>
  );
}
