"use client";

import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
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
import Image from "next/image";

const formSchema = z.object({
  username: z
    .string()
    .min(2, { message: "El usuario debe tener al menos 2 caracteres" }),
  password: z
    .string()
    .min(2, { message: "La contraseña debe tener al menos 2 caracteres" }),
});

function TrianglePattern() {
  return (
    <div
      className="pointer-events-none fixed right-0 top-10 z-10 p-3"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(16, 38px)",
        gap: "14px",
      }}
    >
      {Array.from({ length: 6 * 16 }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 0,
            height: 0,
            borderTop: "11px solid transparent",
            borderBottom: "11px solid transparent",
            borderRight: "19px solid #D71920",
            opacity: 0.82,
          }}
        />
      ))}
    </div>
  );
}

function DotGrid() {
  return (
    <div
      className="pointer-events-none fixed bottom-1 left-80 z-10"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 26px)",
        gap: "16px",
      }}
    >
      {Array.from({ length: 3 * 6 }).map((_, i) => (
        <span
          key={i}
          className="block rounded-full bg-white"
          style={{ width: 26, height: 26, opacity: 0.92 }}
        />
      ))}
    </div>
  );
}

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
    defaultValues: { username: "", password: "" },
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
          response.user.parent_info.id
        );
        const shiftData = await getShift({});
        const hasError =
          !shiftData?.success ||
          shiftData?.response?.data?.status_code === 400;

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
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .card-3b { animation: fadeUp 0.5s ease forwards; }

        .field-wrap { position: relative; width: 100%; }
        .field-label {
          position: absolute;
          top: 8px; left: 14px;
          font-size: 10px;
          font-weight: 700;
          color: #b0b0b0;
          pointer-events: none;
          letter-spacing: 0.04em;
          text-transform: capitalize;
        }
        .field-input {
          width: 100%;
          height: 54px;
          border: 1.5px solid #e2e2e2;
          border-radius: 8px;
          padding: 22px 14px 6px 14px;
          font-size: 14px;
          background: #ffffff;
          outline: none;
          color: #222;
          transition: border-color 0.2s;
          font-family: inherit;
        }
        .field-input:focus { border-color: #D71920; box-shadow: 0 0 0 3px rgba(215,25,32,0.08); }
      `}</style>

      <div className="fixed inset-0 z-0">
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: "#F5EBDD", 
          }}
        />

        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/bg-chica.png')",
            backgroundSize: "cover",
            backgroundPosition: "center top",
            backgroundRepeat: "no-repeat",
            opacity: 0.4, 
            filter: "saturate(0.85)",
          }}
        />
      </div>
        
      <div className="absolute left-0 top-0 h-screen w-[500px]">
        <div
          className="h-full w-full"
          style={{
            background: "#EF2029",
            clipPath: "polygon(0% 30%, 120% 40%, 100% 39%, 0 500%)",
          }}
        />
      </div>

      <TrianglePattern />
      <DotGrid />

      <span
        className="pointer-events-none fixed z-10 font-black leading-none text-[#D71920]"
        style={{ fontSize: 200, bottom: 230, right: 390, opacity: 0.95 }}
      >
        +
      </span>
      <span
        className="pointer-events-none fixed z-10 font-black leading-none text-[#D71920]"
        style={{ fontSize: 150, bottom: 60, right: 200, opacity: 0.85 }}
      >
        +
      </span>

      <div className="relative z-20 flex min-h-screen items-center justify-center">
        <div
          className="card-3b rounded-2xl bg-transparent shadow-2xl"
          style={{
            width: 400,
            padding: "40px 44px 36px",
            border: "5px solid #D71920",
          }}
        >
          <div className="mb-4 flex flex-col items-center gap-1">
            <div
              className="flex items-center justify-center rounded-full shadow"
              style={{ width: 90, height: 90, background: "#D71920" }}
            >
              <Image
              width={100}
              height={100}
              src="https://f001.backblazeb2.com/file/lkf-media/profile_pictures/profile_pic_29909.thumbnail"
              alt="Logo Tiendas 3B"
              className="w-20 h-20 object-contain"
              />
            </div>
            <p
              className="mt-1 font-extrabold text-gray-800"
              style={{ fontSize: 22 }}
            >
              Tiendas <span style={{ color: "#D71920" }}>3B</span>
            </p>
            <p className="text-xs italic text-gray-600">
              ¡Tu despensa inteligente!
            </p>
          </div>

          <h2 className="mb-5 text-center text-[15px] font-semibold text-slate-900">
            Ingresa tus credenciales para iniciar:
          </h2>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-[14px]"
            >
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="field-wrap">
                        <span className="field-label lowercase">User</span>
                        <input
                          {...field}
                          className="field-input"
                          type="text"
                          autoComplete="username"
                          onBlur={() => field.onChange(field.value?.trim())}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs text-[#D71920]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="field-wrap">
                        <span className="field-label">Password</span>
                        <input
                          {...field}
                          className="field-input"
                          style={{ paddingRight: 44 }}
                          type={showPassword ? "password" : "text"}
                          autoComplete="current-password"
                          onBlur={() => field.onChange(field.value?.trim())}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-[16px] text-gray-400 hover:text-gray-600"
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="size-[18px]" />
                          ) : (
                            <Eye className="size-[18px]" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs text-[#D71920]" />
                  </FormItem>
                )}
              />

              <div className="-mt-1 flex justify-start">
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-xs font-semibold text-[#D71920] hover:text-[#b51218]"
                  onClick={() => setOpenOlvido(true)}
                >
                  ¿Olvidó su contraseña?
                </Button>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="h-12 w-full rounded-lg text-base font-bold tracking-wide text-white transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: "#D71920", border: "none" }}
              >
                {isLoading ? (
                  <>
                    <ReloadIcon className="mr-2 size-4 animate-spin" />
                    Cargando...
                  </>
                ) : (
                  "Ingresar"
                )}
              </Button>
            </form>
          </Form>

          <p className="mt-6 border-t border-gray-400 pt-4 text-center text-[11px] text-gray-500">
            © Tiendas 3B 2026
          </p>
        </div>
      </div>

      <OlvidoContraModal
        title="Recuperar contraseña"
        open={openOlvido}
        setOpen={setOpenOlvido}
      />
    </Suspense>
  );
}