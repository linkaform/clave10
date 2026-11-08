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

export interface ResyncPermissionsResult {
  updated: number;
  skipped: { record_id: string; user_id?: number; reason: string }[];
  total: number;
}

export const resyncAllPermissions = () =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: SCRIPT_NAME,
    option: "resync_all_permissions",
  });

export const listUsersMissingMenuConfig = () =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: SCRIPT_NAME,
    option: "list_users_missing_menu_config",
  });

export const listUsersOnlyInLegacyAccesos = () =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: SCRIPT_NAME,
    option: "list_users_only_in_legacy_accesos",
  });

export type PermissionItemType = "form" | "catalog" | "script";

export interface PermissionGapItem {
  id: number;
  nombre: string;
}

export interface PermissionGapUser {
  user_id: number;
  username: string;
  faltan: Partial<Record<PermissionItemType, PermissionGapItem[]>>;
  // Compartidos que sus menús ya no piden: reaplicar los descomparte.
  sobran: Partial<Record<PermissionItemType, PermissionGapItem[]>>;
  total: number;
  total_sobran: number;
}

export interface PermissionGapsResult {
  usuarios: PermissionGapUser[];
  revisados: number;
  borrados: number;
  errores: { user_id: number; error: string }[];
}

export interface ReapplyPermissionsResult {
  user_id: number;
  ok: boolean;
  error: string | null;
  msg?: string;
}

export const getMenuPermissionGaps = () =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: SCRIPT_NAME,
    option: "get_menu_permission_gaps",
  });

export const reapplyMenuPermissions = (user_ids: number[]) =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: SCRIPT_NAME,
    option: "reapply_menu_permissions",
    user_ids,
  });

export interface MigrateLegacyMenusResult {
  user_id: number;
  username: string;
  action: "create" | "update" | "error";
  status_code?: number;
  menu_count?: number;
  error?: unknown;
}

export const migrateLegacyMenus = (user_ids: number[], dry_run = false) =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: "migrate_legacy_menus.py",
    option: "migrate",
    user_ids,
    dry_run,
  });

// Compartir masivo (1509): un item por llamada con todos los usuarios que lo necesitan
// (topado por tiempo en el back), con intervalo entre llamadas y verificacion despues.
export type MassShareEstado =
  | "planeando"
  | "listo"
  | "corriendo"
  | "pausado"
  | "enviado"
  | "terminado";

export interface MassShareItem {
  item: string;
  tipo: PermissionItemType;
  nombre: string;
  pendientes: number;
  grande: boolean;
  enviados: number;
  llamadas: number;
  llamadas_fallidas: number;
  segundos: number;
  saltados: number;
  ok: number;
  faltan: number[];
  catalogos?: number | null;
  llamadas_estimadas?: number | null;
  seg_estimados?: number | null;
}

export interface MassShareJob {
  job_id: string;
  estado: MassShareEstado;
  usuarios: number;
  revisados: number;
  por_revisar: number;
  sin_lectura: number[];
  items: number;
  pendientes: number;
  enviados: number;
  saltados: number;
  llamadas: number;
  llamadas_fallidas: number;
  seg_por_llamada: number | null;
  ok: number;
  faltan: number;
  estimado_min: number;
  llamadas_estimadas?: number;
  items_pendientes: number;
  items_grandes: string[];
  ultimo_envio_at: number | null;
  created_at: number | null;
  msg?: string;
  error?: string;
  espera_seg?: number;
  requiere_confirmar?: string;
  detalle?: MassShareItem[];
}

const massShare = (option: string, extra: Record<string, unknown> = {}) =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: SCRIPT_NAME,
    option,
    ...extra,
  });

export const planMassShare = (job_id?: string, user_ids?: number[]) =>
  massShare("plan_mass_share", { job_id, user_ids });

export const runMassShare = (job_id: string, intervalo: number, confirmar = false) =>
  massShare("run_mass_share", { job_id, intervalo, confirmar });

export const verifyMassShare = (job_id: string) => massShare("verify_mass_share", { job_id });

export const resendMassShare = (job_id: string) => massShare("resend_mass_share", { job_id });

export const pauseMassShare = (job_id: string) => massShare("pause_mass_share", { job_id });

export const getMassShare = (job_id: string) => massShare("get_mass_share", { job_id });

export const listMassShare = () => massShare("list_mass_share");
