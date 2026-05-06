"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { getLogin } from "@/lib/login/get-login";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import useAuthStore from "@/store/useAuthStore";
import { ReloadIcon } from "@radix-ui/react-icons";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { OlvidoContraModal } from "@/components/modals/olvido-contra";
import { useQueryClient } from "@tanstack/react-query";
import { getShift } from "@/lib/get-shift";
import { useBoothStore } from "@/store/useBoothStore";
import { errorMsj } from "@/lib/utils";
import { toast } from "sonner";

const formSchema = z.object({
  username: z
    .string()
    .min(2, { message: "El usuario debe tener al menos 2 caracteres" }),
  password: z
    .string()
    .min(2, { message: "La contraseña debe tener al menos 2 caracteres" }),
});

export default function LoginPage() {
  const router = useRouter();
  const [openOlvido, setOpenOlvido] = useState(false);
  const [showPassword, setShowPassword] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const queryClient = useQueryClient();
  const { setBooth } = useBoothStore();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onSubmit",
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      const response = await getLogin(values.username, values.password);
      if (response.success) {
        setAuth(
          response.jwt,
          response.session_id,
          response.user.name,
          response.user.email,
          response.user.id,
          response.user.thumb,
          response.user.parent_info.id,
        );
        const shiftData = await getShift({});
        const hasError =
          !shiftData?.success || shiftData?.response?.data?.status_code === 400;

        if (hasError) {
          const textMsj = errorMsj(shiftData);
          toast.error(`Error al obtener load shift, Error: ${textMsj?.text}`);
        } else {
          const area =
            shiftData?.response?.data?.location?.area ||
            shiftData?.response?.data?.guard?.area;
          const location =
            shiftData?.response?.data?.location?.name ||
            shiftData?.response?.data?.guard?.location;

          setBooth(area, location);

          queryClient.setQueryData(["getShift"], shiftData?.response?.data);
        }

        router.push("/");
      } else {
        form.setError("password", {
          type: "manual",
          message: response.error || "Usuario o contraseña inválida",
        });
      }
    } catch (error) {
      console.log("Error durante el inicio de sesión:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Suspense>
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card className="w-[440px] shadow-md border-0 rounded-2xl">
              <CardContent className="flex flex-col items-center px-10 py-12">
                <Image
                  className="mb-10"
                  src="https://f001.backblazeb2.com/file/app-linkaform/public-client-126/71202/60b81349bde5588acca320e1/694ace05f1bef74262302cc9.png"
                  alt="Clave 10"
                  width={174}
                  height={58}
                  priority
                />

                <div className="w-full space-y-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Usuario"
                            className="bg-white border border-gray-200 h-12 rounded-lg placeholder:text-gray-400 text-sm"
                            type="text"
                            onBlur={() => field.onChange(field.value?.trim())}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              onBlur={() => field.onChange(field.value?.trim())}
                              placeholder="Password"
                              className="bg-white border border-gray-200 h-12 rounded-lg placeholder:text-gray-400 text-sm pr-10"
                              type={showPassword ? "password" : "text"}
                            />
                            <div
                              className="absolute right-3 top-3 cursor-pointer text-gray-400 hover:text-gray-600"
                              onClick={() => setShowPassword(!showPassword)}>
                              {showPassword ? (
                                <EyeOff size={18} />
                              ) : (
                                <Eye size={18} />
                              )}
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  className="w-full mt-6 h-12 bg-[#3D8BF2] hover:bg-blue-700 text-white rounded-lg font-bold text-sm"
                  type="submit"
                  disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <ReloadIcon className="mr-2 size-4 animate-spin" />
                      Cargando...
                    </>
                  ) : (
                    "Iniciar sesión"
                  )}
                </Button>

                <button
                  type="button"
                  className="mt-4 text-sm text-[#3D8BF2] hover:underline font-semibold"
                  onClick={() => setOpenOlvido(true)}>
                  ¿Olvidaste tu contraseña?
                </button>
              </CardContent>
            </Card>
          </form>
        </Form>

        <OlvidoContraModal
          title="Recuperar contraseña"
          open={openOlvido}
          setOpen={setOpenOlvido}
        />
      </div>
    </Suspense>
  );
}
