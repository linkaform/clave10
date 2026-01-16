import { useMutation } from "@tanstack/react-query";
import { errorMsj } from "@/lib/utils";
import { toast } from "sonner";
import { useShiftStore } from "@/store/useShiftStore";
import { resetPasswordConfirm } from "@/lib/login/reset-pass";

export const useResetPass = () => {
    const { isLoading, setLoading } = useShiftStore();
  
    const resetPassMutation = useMutation({
        mutationFn: async ({ password, password2, token }: { password: string, password2:string, token:string }) => {

            console.log(password, password2, token)

            const response = await resetPasswordConfirm({password, password2, token});
            const hasError = (!response?.success)
            if (hasError) {
                const textMsj = errorMsj(response)
                throw new Error(`Error al reestablecer contraseña, Error: ${textMsj?.text}`);
            } else {
                return response
            }
        },
        onMutate: () => {
            setLoading(true);
        },
        onSuccess: () => {
            toast.success("Contraseña actualizada correctamente.",{style: {
                background: "#22C55E",
                color: "#fff",
                border: 'none'
            },});
        },
        onError: (err) => {
            toast.error(err.message || "Hubo un error al reestablecer contraseña.",{
                style: {
                    background: "#dc2626",
                    color: "#fff",
                    border: 'none'
                },
            })

        },
        onSettled: () => {
            setLoading(false);
        },
    });
return{
    resetPassMutation,
    isLoading
}
}