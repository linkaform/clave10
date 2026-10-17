import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { setUserPasswordSdk, SetUserPasswordParams } from "@/lib/user-activation-sdk";

export const useSetUserPassword = () => {
  const setUserPasswordMutation = useMutation({
    mutationFn: async (params: SetUserPasswordParams) => {
      const res = await setUserPasswordSdk(params);
      // El runner de scripts (/infosync/scripts/run/) contesta HTTP 200 y
      // success:true aunque la ruta de Sanic haya fallado: el error real viaja en
      // el cuerpo, en res.response ({status_code, msg: [...]}). Por eso no basta
      // con mirar el status HTTP ni errorMsj(); un 400 de adentro se trataba como
      // exito y se redirigia al login sin haber cambiado la contraseña.
      const inner = res?.response;
      const code = Number(inner?.status_code ?? inner?.status ?? 0);
      if (!res?.success || code >= 400 || inner?.data?.activated !== true) {
        const raw = inner?.msg ?? inner?.error ?? res?.error;
        const text = Array.isArray(raw)
          ? raw.join(", ")
          : typeof raw === "string"
            ? raw
            : "No pudimos guardar tu contraseña. Intenta de nuevo.";
        throw new Error(text);
      }
      return inner.data;
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
