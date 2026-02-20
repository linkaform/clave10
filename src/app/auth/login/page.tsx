"use client";

import { Suspense,  useState } from "react";
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
  username: z.string()
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
  const {setBooth}= useBoothStore()
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
        setAuth(response.jwt, response.session_id, response.user.name, response.user.email, response.user.id, response.user.thumb, response.user.parent_info.id);
        const shiftData = await getShift({});
         const hasError = (!shiftData?.success) || (shiftData?.response?.data?.status_code === 400);
         
         if (hasError) {
           const textMsj = errorMsj(shiftData);
           toast.error(`Error al obtener load shift, Error: ${textMsj?.text}`);
         } else {
           const area = shiftData?.response?.data?.location?.area || shiftData?.response?.data?.guard?.area;
           const location = shiftData?.response?.data?.location?.name || shiftData?.response?.data?.guard?.location;
           
           setBooth(area, location);
 
           queryClient.setQueryData(
             ["getShift"],
             shiftData?.response?.data
           );
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
      <div className="flex flex-col h-screen items-center justify-center">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card className="">
              <CardContent className="flex  w-full md:w-[400px] h-[600px]  flex-col justify-center items-center ">
                <Image
                  className="mb-10 flex mx-auto"
                  src="https://f001.backblazeb2.com/file/lkf-media/profile_pictures/profile_pic_29909.thumbnail"
                  alt="soter logo"
                  width={174}
                  height={58}
                  priority
                />

                <div className="w-full">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Usuario"
                            className="mb-5 placeholder:text-[#3D4D5C] bg-[#F0F2F5] h-[56px]  rounded-lg"
                            type="text"
                            onBlur={() => {
                              field.onChange(field.value?.trim());
                            }}
                          />
                        </FormControl>
                        <FormMessage className="my-10" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="w-full mt-5">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="w-full relative">
                        <Input
                          {...field}
                          onBlur={() => {
                            field.onChange(field.value?.trim());
                          }}
                          placeholder="Password"
                          className="w-full mb-5 placeholder:text-[#3D4D5C] bg-[#F0F2F5] h-[56px] rounded-lg"
                          type={showPassword ? "password" : "text"}
                        />
                          <div
                            className="absolute right-3 top-4 cursor-pointer"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {!showPassword && (
                              <Eye className="text-gray-light" />
                            )}
                            {showPassword && (
                              <EyeOff className="text-gray-light" />
                            )}
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                </div>

                <div className="flex justify-start w-full">
                  <Button type="button" variant="link" className="mb-5" onClick={() => setOpenOlvido(true)}>
                    ¿Olvidó su contraseña?
                  </Button>
                </div>

                <Button
                  className="flex w-3/4 mx-auto bg-button-primary hover:bg-bg-button-primary"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <ReloadIcon className="mr-2 size-4 animate-spin" />
                      Cargando...
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
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
