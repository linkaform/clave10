import * as XLSX from "xlsx";
import { MenuItemAdmin, MenuItemPlatform, MenuItemType } from "@/services/menus-admin";

const PLATFORM_LABELS: Record<string, string> = {
  web: "web",
  mobile: "mobile",
  both: "both",
};

export function exportMenuItemsToExcel(items: MenuItemAdmin[]) {
  const rows = items.map((item) => ({
    "Menu Key": item.menu_key,
    "Menu": item.menu,
    "Menu Order": item.menu_order,
    "Menu Icon": item.menu_icon || "",
    "Menu Columns": item.menu_columns,
    "Seccion Key": item.seccion_key,
    "Seccion": item.seccion,
    "Seccion Order": item.seccion_order,
    "Seccion Column": item.seccion_column,
    "Seccion Href": item.seccion_href || "",
    "Seccion Icon": item.seccion_icon || "",
    "Seccion Icon Color": item.seccion_icon_color || "",
    "Elemento": item.elemento,
    "Key": item.key,
    "Type": item.type,
    "Item Order": item.item_order,
    "Href Web": item.href_web || "",
    "Route Mobile": item.route_mobile || "",
    "Platforms": PLATFORM_LABELS[item.platforms] || item.platforms,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Menu Items");
  XLSX.writeFile(workbook, "Default Menus.xlsx");
}

const VALID_TYPES: MenuItemType[] = ["option", "config", "report", "action", "link"];
const VALID_PLATFORMS: MenuItemPlatform[] = ["web", "mobile", "both"];

function str(value: unknown): string {
  return value === undefined || value === null ? "" : String(value).trim();
}

function num(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Parsea un archivo .xlsx con el mismo formato que genera exportMenuItemsToExcel
 * (mismos encabezados de columna) de vuelta a MenuItemAdmin[], para importar/
 * restaurar un catálogo completo en otra cuenta.
 */
export async function parseMenuItemsFromExcel(file: File): Promise<MenuItemAdmin[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) throw new Error("El archivo no tiene ninguna hoja.");

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

  const items: MenuItemAdmin[] = rows
    .map((row) => {
      const typeRaw = str(row["Type"]).toLowerCase();
      const platformsRaw = str(row["Platforms"]).toLowerCase();
      return {
        menu_key: str(row["Menu Key"]),
        menu: str(row["Menu"]),
        menu_order: num(row["Menu Order"], 0),
        menu_icon: str(row["Menu Icon"]),
        menu_columns: num(row["Menu Columns"], 1),
        seccion_key: str(row["Seccion Key"]),
        seccion: str(row["Seccion"]),
        seccion_order: num(row["Seccion Order"], 0),
        seccion_column: num(row["Seccion Column"], 1),
        seccion_href: str(row["Seccion Href"]),
        seccion_icon: str(row["Seccion Icon"]),
        seccion_icon_color: str(row["Seccion Icon Color"]),
        elemento: str(row["Elemento"]),
        key: str(row["Key"]),
        type: (VALID_TYPES.includes(typeRaw as MenuItemType) ? typeRaw : "link") as MenuItemType,
        item_order: num(row["Item Order"], 0),
        href_web: str(row["Href Web"]),
        route_mobile: str(row["Route Mobile"]),
        platforms: (VALID_PLATFORMS.includes(platformsRaw as MenuItemPlatform)
          ? platformsRaw
          : "web") as MenuItemPlatform,
      };
    })
    .filter((item) => item.menu_key && item.seccion_key && item.key && item.elemento);

  if (items.length === 0) {
    throw new Error(
      "No se encontraron filas válidas — revisa que el archivo tenga las columnas Menu Key, Seccion Key, Key y Elemento.",
    );
  }

  return items;
}
