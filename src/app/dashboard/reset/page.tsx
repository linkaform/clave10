"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { useResetPass } from "@/hooks/Login/useResetPass";
import { useEffect, useState } from "react";

const formSchema = z.object({
  password: z.string().min(1, "La contraseña es obligatoria"),
  password2: z.string().min(1, "La contraseña es obligatoria"),
}).refine((data: { password: any; password2: any; }) => data.password === data.password2, {
  message: "Las contraseñas no coinciden",
  path: ["password2"],
});

const ResetPage = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      password2: "",
    },
  });

  const { resetPassMutation, isLoading } = useResetPass();
  const [token, setToken] = useState("")
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    console.log("Informacion para hacer submit", data, token);
    resetPassMutation.mutate({ password: data.password, password2:data.password2 , token: token}, {
      onSuccess: () => {
          router.push(`/auth/login`);
      }
  })
  };

  useEffect(() => {
      if (typeof window !== "undefined") {
        const valores = window.location.search
        const urlParams = new URLSearchParams(valores);
        const t= urlParams.get('t') ?? ""
        setToken(t)
      }
	  }, []);
    

  return (
    <div className="flex justify-center items-start mt-24 ">
      <Card className="w-full max-w-lg p-5">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold pb-5">
            Reestablecer contraseña
          </CardTitle>
          <CardDescription>
            Por favor ingrese su nueva contraseña y después confírmela.
            Haga clic en <strong>Reestablecer contraseña</strong> cuando haya terminado.
          </CardDescription>
        </CardHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}
          >
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <span className="text-red-500">*</span> Contraseña
                    </FormLabel>
                   
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={!showPassword ? "text" : "password"}
                        placeholder="Nueva contraseña"
                        {...field}
                        className="pr-10"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <span className="text-red-500">*</span> Confirmar contraseña
                    </FormLabel>
                          
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={!showPassword2 ? "text" : "password"}
                          placeholder="Confirmar contraseña"
                          {...field}
                          className="pr-10"
                        />

                        <button
                          type="button"
                          onClick={() => setShowPassword2(!showPassword2)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPassword2 ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>

            <CardFooter className="flex justify-center">
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-blue-500 hover:bg-blue-600 text-white w-full"
              >
                {isLoading? ("Cargando..."): <>
                  <LockKeyhole />
                  Reestablecer contraseña</>}
             
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
};

export default ResetPage;
