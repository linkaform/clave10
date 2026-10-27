import { runScriptSdk } from "./script-logs-sdk";

// Pantalla "Usuarios" (Administración). Backend: lkf-sanic-apps, módulo Base,
// users_sdk.py (form Usuarios + empleados ligados).

export interface UserFiltersState {
  /** Estatus del form Usuarios: crear | creado | activado | restaurar */
  statuses: string[];
  names: string[];
  usernames: string[];
  emails: string[];
}

export interface UserFormValues {
  name: string;
  username: string;
  email: string;
  phone: string;
  role: string;
  /** "crear_empleado" | "ligar_empleado" | "" */
  empleado: string;
  empleadoNombre: string;
  /** Vacío = el valor por defecto del backend. */
  timezone: string;
  language: string;
}

export type UserEditValues = Pick<
  UserFormValues,
  "name" | "email" | "phone" | "role" | "timezone" | "language"
>;

const runScript = (payload: Record<string, any>) =>
  runScriptSdk("users_sdk.py", payload);

export const getUsersSdk = (
  filters: UserFiltersState,
  limit: number = 25,
  skip: number = 0,
) =>
  runScript({
    option: "list_users",
    limit,
    offset: skip,
    status: filters.statuses,
    name: filters.names,
    username: filters.usernames,
    email: filters.emails,
  });

/** Opciones de los selects Uso Horario e Idioma, y sus valores por defecto. */
export interface UserOptions {
  timezones: string[];
  languages: { value: string; label: string }[];
  defaults: { timezone: string; language: string };
}

export const getUserOptionsSdk = () =>
  runScript({ option: "get_user_options" });

export const getUserDetailSdk = (record_id: string) =>
  runScript({ option: "get_user_detail", record_id });

export const createUserSdk = (values: UserFormValues) =>
  runScript({
    option: "create_user",
    name: values.name,
    username: values.username,
    email: values.email,
    phone: values.phone,
    role: values.role,
    empleado: values.empleado,
    empleado_nombre: values.empleadoNombre,
    timezone: values.timezone,
    language: values.language,
  });

export const updateUserSdk = (record_id: string, values: UserEditValues) =>
  runScript({ option: "update_user", record_id, ...values });

export const resetUserPasswordSdk = (record_id: string) =>
  runScript({ option: "reset_password", record_id });

/** Fila del Excel ya normalizada, tal como la recibe `create_users` en sanic. */
export interface UserCreateRow {
  name: string;
  username: string;
  email: string;
  phone: string;
  role: string;
  /** Vacío = el valor por defecto del backend. */
  timezone: string;
  language: string;
}

export interface UserCreateResult {
  created: number;
  /** `row` es el número de la fila dentro de lo enviado (empieza en 1). */
  rejected: { row: number; username: string; msg: string }[];
}

export const createUsersSdk = (
  rows: UserCreateRow[],
  createEmployee: boolean,
) =>
  runScript({ option: "create_users", rows, create_employee: createEmployee });
