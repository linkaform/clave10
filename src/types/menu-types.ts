// Tipos para el sistema de menú dinámico

export type MenuItemType = "option" | "config" | "report" | "action" | "link";

export interface MenuItem {
  key: string;
  label: string;
  type: MenuItemType;
  order: number;
  icon?: string;
  href?: string;
  action?: string; // Para items especiales como "Abrir dashboard"
  variant?: "default" | "primary" | "destructive"; // Para estilos especiales
}

export interface MenuSection {
  id: string;
  key: string;
  label: string;
  order: number;
  column: number; // Columna donde se mostrará (1, 2, 3, etc.)
  href?: string; // URL opcional para la cabecera de la sección
  items: MenuItem[];
}

export interface MenuModule {
  id: string;
  key: string;
  label: string;
  icon?: string;
  order: number;
  href?: string; // Si no tiene submenú, enlace directo
  columns?: number; // Número de columnas en el dropdown (default: auto)
  sections: MenuSection[];
  // Sidebar con acciones especiales (como "Card", "Lorem input", "Abrir dashboard")
  sidebar?: {
    items: MenuItem[];
  };
}

export interface MenuConfig {
  modules: MenuModule[];
}

// Función helper para agrupar secciones por columna
export function groupSectionsByColumn(
  sections: MenuSection[],
): Map<number, MenuSection[]> {
  const grouped = new Map<number, MenuSection[]>();

  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  for (const section of sortedSections) {
    const column = section.column || 1;
    if (!grouped.has(column)) {
      grouped.set(column, []);
    }
    grouped.get(column)!.push(section);
  }

  return grouped;
}

// Función helper para ordenar items dentro de una sección
export function sortMenuItems(items: MenuItem[]): MenuItem[] {
  return [...items].sort((a, b) => a.order - b.order);
}

// Función helper para separar items por tipo (opciones vs configuración)
export function separateItemsByType(items: MenuItem[]): {
  options: MenuItem[];
  config: MenuItem[];
  reports: MenuItem[];
  actions: MenuItem[];
} {
  const sorted = sortMenuItems(items);
  return {
    options: sorted.filter(
      (item) => item.type === "option" || item.type === "link",
    ),
    config: sorted.filter((item) => item.type === "config"),
    reports: sorted.filter((item) => item.type === "report"),
    actions: sorted.filter((item) => item.type === "action"),
  };
}
