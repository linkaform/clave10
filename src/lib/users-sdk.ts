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
}

export type UserEditValues = Pick<UserFormValues, "name" | "email" | "phone" | "role">;

const runScript = (payload: Record<string, any>) => runScriptSdk("users_sdk.py", payload);

export const getUsersSdk = (filters: UserFiltersState, limit: number = 25, skip: number = 0) =>
  runScript({
    option: "list_users",
    limit,
    offset: skip,
    status: filters.statuses,
    name: filters.names,
    username: filters.usernames,
    email: filters.emails,
  });

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
  });

export const updateUserSdk = (record_id: string, values: UserEditValues) =>
  runScript({ option: "update_user", record_id, ...values });

export const resetUserPasswordSdk = (record_id: string) =>
  runScript({ option: "reset_password", record_id });
