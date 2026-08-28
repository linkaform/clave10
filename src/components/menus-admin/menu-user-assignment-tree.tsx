"use client";

import { useMemo } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { MenuItemAdmin } from "@/services/menus-admin";

interface MenuUserAssignmentTreeProps {
  items: MenuItemAdmin[];
  selectedKeys: string[];
  onChange: (keys: string[]) => void;
}

interface GroupedSeccion {
  seccionKey: string;
  seccionLabel: string;
  items: MenuItemAdmin[];
}

interface GroupedMenu {
  menuKey: string;
  menuLabel: string;
  secciones: GroupedSeccion[];
}

function groupItems(items: MenuItemAdmin[]): GroupedMenu[] {
  const menus = new Map<string, GroupedMenu>();

  for (const item of items) {
    if (!menus.has(item.menu_key)) {
      menus.set(item.menu_key, {
        menuKey: item.menu_key,
        menuLabel: item.menu,
        secciones: [],
      });
    }
    const menu = menus.get(item.menu_key)!;
    let seccion = menu.secciones.find((s) => s.seccionKey === item.seccion_key);
    if (!seccion) {
      seccion = { seccionKey: item.seccion_key, seccionLabel: item.seccion, items: [] };
      menu.secciones.push(seccion);
    }
    seccion.items.push(item);
  }

  return Array.from(menus.values()).sort((a, b) =>
    a.menuLabel.localeCompare(b.menuLabel),
  );
}

export const MenuUserAssignmentTree: React.FC<MenuUserAssignmentTreeProps> = ({
  items,
  selectedKeys,
  onChange,
}) => {
  const grouped = useMemo(() => groupItems(items), [items]);
  const selectedSet = useMemo(() => new Set(selectedKeys), [selectedKeys]);

  const toggleItem = (key: string, checked: boolean) => {
    const next = new Set(selectedSet);
    if (checked) next.add(key);
    else next.delete(key);
    onChange(Array.from(next));
  };

  const toggleSeccion = (seccionItems: MenuItemAdmin[], checked: boolean) => {
    const next = new Set(selectedSet);
    for (const item of seccionItems) {
      if (checked) next.add(item.key);
      else next.delete(item.key);
    }
    onChange(Array.from(next));
  };

  return (
    <Accordion type="multiple" className="w-full">
      {grouped.map((menu) => (
        <AccordionItem key={menu.menuKey} value={menu.menuKey}>
          <AccordionTrigger className="font-semibold">
            {menu.menuLabel}
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-4 pl-2">
              {menu.secciones.map((seccion) => {
                const allChecked = seccion.items.every((i) =>
                  selectedSet.has(i.key),
                );
                const allMobile =
                  seccion.items.length > 0 &&
                  seccion.items.every((i) => i.platforms === "mobile");
                return (
                  <div key={seccion.seccionKey} className="flex flex-col gap-1">
                    <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      <Checkbox
                        checked={allChecked}
                        onCheckedChange={(checked) =>
                          toggleSeccion(seccion.items, checked === true)
                        }
                      />
                      {seccion.seccionLabel}
                      {allMobile && (
                        <span className="text-[10px] font-normal normal-case text-muted-foreground/60">
                          (solo mobile)
                        </span>
                      )}
                    </label>
                    <div className="flex flex-col gap-1 pl-6">
                      {seccion.items.map((item) => (
                        <label
                          key={item.key}
                          className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={selectedSet.has(item.key)}
                            onCheckedChange={(checked) =>
                              toggleItem(item.key, checked === true)
                            }
                          />
                          {item.elemento}
                          {item.platforms === "mobile" && (
                            <span className="text-[10px] text-muted-foreground/60">
                              solo mobile
                            </span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};
