import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useShiftStore } from "@/store/useShiftStore";
import { resetPasswordEmail } from "@/lib/login/reset-pass";

export const useResetPassEmail = () => {
  const { isLoading, setLoading } = useShiftStore();

  const resetPassEmailMutation = useMutation({
    mutationFn: async ({ username }: { username: string }) => {
      return await resetPasswordEmail({ username });
    },

    onMutate: () => {
      setLoading(true);
    },

    onSuccess: () => {
      toast.success("Correo para actualizar contraseña enviado correctamente.", {
        style: {
          background: "#22C55E",
          color: "#fff",
          border: "none",
        },
      });
    },

    onError: (err: any) => {
      toast.error(
        err?.message || "Hubo un error al enviar el correo.",
        {
          style: {
            background: "#dc2626",
            color: "#fff",
            border: "none",
          },
        }
      );
    },

    onSettled: () => {
      setLoading(false);
    },
  });

  return {
    resetPassEmailMutation,
    isLoading,
  };
};
