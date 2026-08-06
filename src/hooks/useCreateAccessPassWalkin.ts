import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { errorMsj } from "@/lib/utils";
import {
  AccessPassWalkin,
  createAccessPassWalkin,
} from "@/lib/create-access-pass-walkin";

export const useCreateAccessPassWalkin = () => {
  const [isLoadingCreate, setIsLoadingCreate] = useState(false);

  const createAccessPassWalkinMutation = useMutation({
    mutationFn: async ({
      access_pass,
      account_id,
    }: {
      access_pass: AccessPassWalkin;
      account_id: number;
    }) => {
      const data = await createAccessPassWalkin({ access_pass, account_id });
      const hasError = data?.response?.data?.status_code;

      if (hasError == 400 || hasError == 401) {
        const textMsj = errorMsj(data.response.data);
        throw new Error(`Error al crear pase, Error: ${textMsj?.text}`);
      } else {
        return data.response?.data;
      }
    },
    onMutate: () => {
      setIsLoadingCreate(true);
    },
    onSuccess: () => {
      toast.success("Pase de entrada creado correctamente.");
    },
    onError: (err) => {
      console.error("Error al crear el pase de entrada:", err);
      toast.error(err.message || "Hubo un error al crear el pase de entrada.");
    },
    onSettled: () => {
      setIsLoadingCreate(false);
    },
  });

  return {
    createAccessPassWalkinMutation,
    isLoadingCreate,
  };
};
