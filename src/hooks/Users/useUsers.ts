import {
  UserEditValues,
  UserFiltersState,
  UserFormValues,
  UserCreateResult,
  UserCreateRow,
  UserOptions,
  createUserSdk,
  createUsersSdk,
  getUserDetailSdk,
  getUserOptionsSdk,
  getUsersSdk,
  resetUserPasswordSdk,
  updateUserSdk,
} from "@/lib/users-sdk";
import { errorMsj } from "@/lib/utils";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

export type UserStatus = "crear" | "creado" | "activado" | "restaurar";

export interface UserRow {
  id: string;
  folio: string;
  user_id: number | null;
  name: string;
  username: string;
  email: string;
  phone: string;
  role: string;
  status: UserStatus | string;
  /** Zona horaria e idioma del usuario; vacíos en registros anteriores a estos campos. */
  timezone: string;
  language: string;
  language_label: string;
  created_at: string | null;
}

export interface LinkedEmployee {
  id: string;
  folio: string;
  name: string;
  status: string;
  position: string;
  department: string;
}

export interface UserDetail {
  user: UserRow;
  employees: LinkedEmployee[];
}

export interface UsersPage {
  records: UserRow[];
  total_records: number;
  total_pages: number;
  actual_page: number;
  records_on_page: number;
}

const EMPTY_PAGE: UsersPage = {
  records: [],
  total_records: 0,
  total_pages: 1,
  actual_page: 1,
  records_on_page: 0,
};

// El runner regresa { response: { data } } si todo salió bien; si no, errorMsj
// arma el mensaje (incluido el que rechaza el workflow del alta).
const unwrap = <T>(res: any, fallback: T): T => {
  const err = errorMsj(res);
  if (err) throw new Error(err.text);
  return (res?.response?.data ?? fallback) as T;
};

export const useUsers = (
  filters: UserFiltersState,
  limit: number,
  skip: number,
) => {
  const { data, isLoading, isFetching, error, refetch } = useQuery<UsersPage>({
    queryKey: ["users", filters, limit, skip],
    placeholderData: keepPreviousData,
    // No volver a pedir la lista (ni mostrar el skeleton) cada vez que la pestaña
    // recupera el foco.
    refetchOnWindowFocus: false,
    queryFn: async () =>
      unwrap(await getUsersSdk(filters, limit, skip), EMPTY_PAGE),
  });
  return {
    users: data ?? EMPTY_PAGE,
    isLoading: isLoading || isFetching,
    error,
    refetch,
  };
};

// Las listas de zonas e idiomas vienen del backend (una sola fuente con el form
// de LinkaForm) y casi no cambian: se piden una vez.
export const useUserOptions = () =>
  useQuery<UserOptions>({
    queryKey: ["userOptions"],
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    queryFn: async () =>
      unwrap(await getUserOptionsSdk(), {
        timezones: [],
        languages: [],
        defaults: { timezone: "America/Mexico_City", language: "es_MX" },
      } as UserOptions),
  });

export const useUserDetail = (recordId: string | null) =>
  useQuery<UserDetail>({
    queryKey: ["userDetail", recordId],
    enabled: !!recordId,
    refetchOnWindowFocus: false,
    queryFn: async () =>
      unwrap(await getUserDetailSdk(recordId as string), {} as UserDetail),
  });

// Tras escribir se refresca la lista y el detalle abierto.
const useInvalidateUsers = () => {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["users"] });
    qc.invalidateQueries({ queryKey: ["userDetail"] });
  };
};

export const useCreateUser = () => {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: async (values: UserFormValues) =>
      unwrap(await createUserSdk(values), {}),
    onSuccess: invalidate,
  });
};

export const useUpdateUser = () => {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: async ({
      recordId,
      values,
    }: {
      recordId: string;
      values: UserEditValues;
    }) => unwrap(await updateUserSdk(recordId, values), {}),
    onSuccess: invalidate,
  });
};

export const useResetUserPassword = () => {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: async (recordId: string) =>
      unwrap(await resetUserPasswordSdk(recordId), {}),
    onSuccess: invalidate,
  });
};

// sanic acepta hasta 10 filas por llamada (cada alta corre el workflow completo y
// tarda unos segundos): los archivos grandes van por lotes, uno tras otro, y se
// unen en un solo resultado con los números de fila del archivo completo.
export const CREATE_USERS_BATCH = 10;

interface CreateUsersInput {
  rows: UserCreateRow[];
  /** Crea el empleado de todos los usuarios al activarse. */
  createEmployee: boolean;
  onProgress?: (processed: number, total: number) => void;
}

export const useCreateUsers = () => {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: async ({
      rows,
      createEmployee,
      onProgress,
    }: CreateUsersInput) => {
      const total: UserCreateResult = { created: 0, rejected: [] };
      for (let start = 0; start < rows.length; start += CREATE_USERS_BATCH) {
        const batch = rows.slice(start, start + CREATE_USERS_BATCH);
        try {
          const result = unwrap<UserCreateResult>(
            await createUsersSdk(batch, createEmployee),
            {
              created: 0,
              rejected: [],
            },
          );
          total.created += result.created;
          total.rejected.push(
            ...result.rejected.map((r) => ({ ...r, row: r.row + start })),
          );
        } catch (e) {
          // Si falla el lote entero (red, tiempo), sus filas se reportan y se sigue:
          // volver a subir el archivo es seguro, un username ya creado se rechaza.
          const msg = (e as Error).message || "No se pudo procesar el lote";
          total.rejected.push(
            ...batch.map((r, i) => ({
              row: start + i + 1,
              username: r.username,
              msg,
            })),
          );
        }
        onProgress?.(Math.min(start + batch.length, rows.length), rows.length);
      }
      return total;
    },
    onSuccess: invalidate,
  });
};
