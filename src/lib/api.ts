// lib/api.ts
import useAuthStore from "@/store/useAuthStore";
import { toast } from "sonner";

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
  public_script = false,
): Promise<TData> {
  const { messages, showToast = false } = options;
  const userJwt = localStorage.getItem("access_token");
  const { userParentId } = useAuthStore.getState();
  if (public_script) {
    body.account_id = userParentId;
  }

  const promise = fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${userJwt}`,
    },
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
