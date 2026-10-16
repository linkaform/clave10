import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { setUserPasswordSdk, SetUserPasswordParams } from "@/lib/user-activation-sdk";
import { errorMsj } from "@/lib/utils";

export const useSetUserPassword = () => {
  const setUserPasswordMutation = useMutation({
    mutationFn: async (params: SetUserPasswordParams) => {
      const res = await setUserPasswordSdk(params);
      const msj = errorMsj(res);
      if (msj) {
        throw new Error(msj.text || "El enlace no es válido o ya fue utilizado.");
      }
      return res?.response?.data ?? null;
    },
    onError: (error: Error) => {
      toast.error(error.message, {
        style: { background: "#dc2626", color: "#fff", border: "none" },
      });
    },
  });

  return {
    setUserPasswordMutation,
    isLoading: setUserPasswordMutation.isPending,
  };
};
