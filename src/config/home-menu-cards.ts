import type { MenuConfig, MenuModule } from "@/types/menu-types";

export interface HomeMenuCardConfig {
  id: string;
  label: string;
  moduleKey: string;
  // Si se define, la tarjeta solo se muestra cuando el módulo tiene
  // asignada al menos una de estas secciones (permite que una tarjeta
  // del home represente solo una parte de un módulo del catálogo).
  sectionKeys?: string[];
}

/**
 * Mapeo entre las tarjetas históricas del home y las claves reales del
 * catálogo de menús (ELEMENTOS MENU / mega menú). El id de cada tarjeta
 * se mantiene igual al legado (usado para el ícono `/${id}.svg` y la ruta
 * `/dashboard/${id}`); solo cambia de dónde sale el permiso/label.
 */
export const HOME_MENU_CARDS: HomeMenuCardConfig[] = [
  { id: "pases", label: "Pases De Entrada", moduleKey: "pases_entrada" },
  { id: "turnos", label: "Turnos", moduleKey: "caseta", sectionKeys: ["turnos"] },
  { id: "bitacoras", label: "Bitacoras", moduleKey: "accesos", sectionKeys: ["entradas_salidas"] },
  { id: "accesos", label: "Accesos", moduleKey: "accesos" },
  { id: "rondines", label: "Rondines", moduleKey: "seguridad", sectionKeys: ["rondines"] },
  { id: "articulos", label: "Artículos Perdidos / Concesionados", moduleKey: "activos" },
  { id: "incidencias", label: "Incidencias / Fallas", moduleKey: "seguridad", sectionKeys: ["incidencias", "fallas"] },
  { id: "notas", label: "Notas", moduleKey: "caseta", sectionKeys: ["turno_notas"] },
  { id: "reportes", label: "Reportes", moduleKey: "caseta", sectionKeys: ["turno_reportes"] },
];

function moduleHasAnySection(menuModule: MenuModule, sectionKeys: string[]): boolean {
  return menuModule.sections.some((section) => sectionKeys.includes(section.key));
}

export function buildHomeMenuCards(menuConfig: MenuConfig | null | undefined): { id: string; label: string; excludes: Record<string, never> }[] {
  if (!menuConfig?.modules?.length) return [];
  const modulesByKey = new Map(menuConfig.modules.map((menuModule) => [menuModule.key, menuModule]));

  const cards: { id: string; label: string; excludes: Record<string, never> }[] = [];
  for (const card of HOME_MENU_CARDS) {
    const menuModule = modulesByKey.get(card.moduleKey);
    if (!menuModule) continue;
    if (card.sectionKeys && !moduleHasAnySection(menuModule, card.sectionKeys)) continue;
    cards.push({ id: card.id, label: card.label, excludes: {} });
  }
  return cards;
}
