import { apiPost } from "@/lib/api";
import { API_ENDPOINTS } from "@/config/api";
import { ApiResponse } from "@/types/api";

export type MenuItemType = "option" | "config" | "report" | "action" | "link";
export type MenuItemPlatform = "web" | "mobile";

export interface MenuItemAdmin {
  _id?: string;
  menu_key: string;
  menu: string;
  menu_order: number;
  menu_icon?: string;
  menu_columns: number;
  seccion_key: string;
  seccion: string;
  seccion_order: number;
  seccion_column: number;
  seccion_href?: string;
  seccion_icon?: string;
  seccion_icon_color?: string;
  elemento: string;
  key: string;
  type: MenuItemType;
  item_order: number;
  href_web?: string;
  route_mobile?: string;
  platforms: MenuItemPlatform;
  item_icon?: string;
  seccion_description?: string;
}

export interface MenuUser {
  user_id: number;
  nombre: string;
  username: string;
  email: string;
}

const SCRIPT_NAME = "menus_admin.py";

export const listMenuItems = () =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: SCRIPT_NAME,
    option: "list_menu_items",
  });

export const saveMenuItem = (payload: MenuItemAdmin) =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: SCRIPT_NAME,
    option: "save_menu_item",
    payload,
  });

export const deleteMenuItem = (record_id: string) =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: SCRIPT_NAME,
    option: "delete_menu_item",
    record_id,
  });

export const saveMenuItemsBatch = (items: MenuItemAdmin[]) =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: SCRIPT_NAME,
    option: "save_menu_items_batch",
    items,
  });

export const replaceMenuCatalog = (items: MenuItemAdmin[]) =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: SCRIPT_NAME,
    option: "replace_menu_catalog",
    items,
  });

export const listMenuUsers = () =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: SCRIPT_NAME,
    option: "list_users",
  });

export const getUserMenuItems = (user_id: number) =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: SCRIPT_NAME,
    option: "get_user_menu_items",
    user_id,
  });

export const saveUserMenuItems = (user_id: number, item_keys: string[]) =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: SCRIPT_NAME,
    option: "save_user_menu_items",
    user_id,
    item_keys,
  });
