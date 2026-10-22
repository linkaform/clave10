import {
  UserEditValues,
  UserFiltersState,
  UserFormValues,
  createUserSdk,
  getUserDetailSdk,
  getUsersSdk,
  resetUserPasswordSdk,
  updateUserSdk,
} from "@/lib/users-sdk";
import { errorMsj } from "@/lib/utils";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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
const unwrap = <T,>(res: any, fallback: T): T => {
  const err = errorMsj(res);
  if (err) throw new Error(err.text);
  return (res?.response?.data ?? fallback) as T;
};

export const useUsers = (filters: UserFiltersState, limit: number, skip: number) => {
  const { data, isLoading, isFetching, error, refetch } = useQuery<UsersPage>({
    queryKey: ["users", filters, limit, skip],
    placeholderData: keepPreviousData,
    queryFn: async () => unwrap(await getUsersSdk(filters, limit, skip), EMPTY_PAGE),
  });
  return { users: data ?? EMPTY_PAGE, isLoading: isLoading || isFetching, error, refetch };
};

export const useUserDetail = (recordId: string | null) =>
  useQuery<UserDetail>({
    queryKey: ["userDetail", recordId],
    enabled: !!recordId,
    queryFn: async () => unwrap(await getUserDetailSdk(recordId as string), {} as UserDetail),
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
    mutationFn: async (values: UserFormValues) => unwrap(await createUserSdk(values), {}),
    onSuccess: invalidate,
  });
};

export const useUpdateUser = () => {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: async ({ recordId, values }: { recordId: string; values: UserEditValues }) =>
      unwrap(await updateUserSdk(recordId, values), {}),
    onSuccess: invalidate,
  });
};

export const useResetUserPassword = () => {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: async (recordId: string) => unwrap(await resetUserPasswordSdk(recordId), {}),
    onSuccess: invalidate,
  });
};
