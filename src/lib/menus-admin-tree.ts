import { MenuItemAdmin } from "@/services/menus-admin";

export interface SectionGroup {
  seccionKey: string;
  seccion: string;
  seccionHref: string;
  seccionIcon: string;
  seccionIconColor: string;
  column: number;
  items: MenuItemAdmin[];
}

export interface ModuleGroup {
  menuKey: string;
  menu: string;
  menuIcon: string;
  order: number;
  sections: SectionGroup[];
}

export function groupByModule(items: MenuItemAdmin[]): ModuleGroup[] {
  const modules = new Map<string, ModuleGroup>();

  for (const item of items) {
    if (!modules.has(item.menu_key)) {
      modules.set(item.menu_key, {
        menuKey: item.menu_key,
        menu: item.menu,
        menuIcon: item.menu_icon || "",
        order: item.menu_order,
        sections: [],
      });
    }
    const module = modules.get(item.menu_key)!;
    let section = module.sections.find((s) => s.seccionKey === item.seccion_key);
    if (!section) {
      section = {
        seccionKey: item.seccion_key,
        seccion: item.seccion,
        seccionHref: item.seccion_href || "",
        seccionIcon: item.seccion_icon || "",
        seccionIconColor: item.seccion_icon_color || "",
        column: item.seccion_column || 1,
        items: [],
      };
      module.sections.push(section);
    }
    section.items.push(item);
  }

  const result = Array.from(modules.values());
  for (const module of result) {
    module.sections.sort((a, b) => a.column - b.column);
    for (const section of module.sections) {
      section.items.sort((a, b) => a.item_order - b.item_order);
    }
  }
  result.sort((a, b) => a.order - b.order);
  return result;
}

export function groupSectionsByColumn(
  sections: SectionGroup[],
): Map<number, SectionGroup[]> {
  const grouped = new Map<number, SectionGroup[]>();
  for (const section of sections) {
    const column = section.column || 1;
    if (!grouped.has(column)) grouped.set(column, []);
    grouped.get(column)!.push(section);
  }
  return grouped;
}

function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "_");
}

export function newItemKey(label: string, existingKeys: Set<string>): string {
  const base = slugify(label) || "item";
  let key = base;
  let i = 2;
  while (existingKeys.has(key)) {
    key = `${base}_${i}`;
    i += 1;
  }
  return key;
}

/**
 * Recalcula menu_order/menu_columns/seccion_order/seccion_column/item_order
 * de TODAS las filas de un módulo según la posición actual en el árbol
 * (columnas -> secciones -> items), y regresa el array plano listo para
 * mandar a save_menu_items_batch.
 */
export function flattenModule(module: ModuleGroup, menuOrder: number): MenuItemAdmin[] {
  const columns = groupSectionsByColumn(module.sections);
  const columnIndexes = Array.from(columns.keys()).sort((a, b) => a - b);
  const menuColumns = columnIndexes.length || 1;

  const rows: MenuItemAdmin[] = [];
  let seccionOrder = 1;

  columnIndexes.forEach((columnIndex, compactedIndex) => {
    const sections = columns.get(columnIndex)!;
    const compactedColumn = compactedIndex + 1;
    for (const section of sections) {
      let itemOrder = 1;
      for (const item of section.items) {
        rows.push({
          ...item,
          menu_key: module.menuKey,
          menu: module.menu,
          menu_order: menuOrder,
          menu_icon: module.menuIcon,
          menu_columns: menuColumns,
          seccion_key: section.seccionKey,
          seccion: section.seccion,
          seccion_order: seccionOrder,
          // se compacta a 1..N (sin huecos) aunque el estado en memoria
          // todavía traiga columnas con saltos (ej. 1,2,4)
          seccion_column: compactedColumn,
          seccion_href: section.seccionHref,
          seccion_icon: section.seccionIcon,
          seccion_icon_color: section.seccionIconColor,
          item_order: itemOrder,
        });
        itemOrder += 1;
      }
      seccionOrder += 1;
    }
  });

  return rows;
}

export function flattenAllModules(modules: ModuleGroup[]): MenuItemAdmin[] {
  const rows: MenuItemAdmin[] = [];
  modules.forEach((module, index) => {
    rows.push(...flattenModule(module, index + 1));
  });
  return rows;
}
