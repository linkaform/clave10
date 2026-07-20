// lib/api.ts
import useAuthStore from "@/store/useAuthStore";
import { toast } from "sonner";
import { getValidToken } from "./login/get-valid-token";

interface ApiPostOptions {
  messages?: {
    loading?: string;
    success?: string;
    error?: string;
  };
  showToast?: boolean;
}

export async function apiPost<TData>(
  url: string,
  body: Record<string, unknown>,
  options: ApiPostOptions = {},
): Promise<TData> {
  const { messages, showToast = false } = options;
  const userJwt = await getValidToken();
  const { userParentId } = useAuthStore.getState();
  if (body.public_script) {
    body.account_id = userParentId;
  }
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (userJwt) headers.Authorization = `Bearer ${userJwt}`;

  const promise = fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  }).then(async (res) => {
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.message ?? `Error ${res.status}`);
    }
    return res.json() as Promise<TData>;
  });

  if (showToast && messages) {
    toast.promise(promise, {
      loading: messages.loading ?? "Cargando...",
      success: messages.success ?? "Operación exitosa",
      error: messages.error ?? "Ocurrió un error",
    });
    return promise;
  }

  return promise;
}
