"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Check } from "lucide-react";
import { ReloadIcon } from "@radix-ui/react-icons";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const SERVICIOS = [
  "Mantenimiento",
  "Construcción",
  "Limpieza y sanitización",
  "Instalaciones técnicas",
  "Logística y transporte",
  "Seguridad",
  "Tecnología y TI",
  "Jardinería y paisajismo",
  "Fumigación y Plagas",
  "Otro",
];

const formSchema = z.object({
  razonSocial: z.string().min(1, "La razón social es requerida"),
  nombreComercial: z.string().min(1, "El nombre comercial es requerido"),
  rfc: z.string().min(12, "El RFC debe tener al menos 12 caracteres"),
  servicios: z.array(z.string()).min(1, "Selecciona al menos un servicio"),
  domicilioFiscal: z.string().min(1, "El domicilio fiscal es requerido"),
  representanteLegal: z.string().min(1, "El representante legal es requerido"),
  email: z.string().email("Correo electrónico inválido"),
  telefono: z.string().min(10, "El teléfono debe tener al menos 10 dígitos"),
  password: z.string().min(8, "La contraseña debe tener mínimo 8 caracteres"),
  confirmarPassword: z.string(),
}).refine((d) => d.password === d.confirmarPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmarPassword"],
});

type FormValues = z.infer<typeof formSchema>;

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <FormLabel className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
      {required && <span className="text-red-500 mr-1">*</span>}
      {children}
    </FormLabel>
  );
}

export default function RegistroContratistaPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onSubmit",
    defaultValues: {
      razonSocial: "",
      nombreComercial: "",
      rfc: "",
      servicios: [],
      domicilioFiscal: "",
      representanteLegal: "",
      email: "",
      telefono: "",
      password: "",
      confirmarPassword: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    console.log(values);
    // TODO: conectar con API
    await new Promise((r) => setTimeout(r, 1500));
    setIsLoading(false);
    setShowSuccess(true);
  };

  const inputClass =
    "bg-white border border-gray-200 h-11 rounded-lg text-sm placeholder:text-gray-300";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 py-10">
      {/* Modal de éxito */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-[400px] px-10 py-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-5">
              <Check size={28} className="text-green-500 stroke-[2.5]" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              ¡Registro exitoso!
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              Te hemos enviado un correo de confirmación. Por favor, revisa tu
              bandeja de entrada.
            </p>
            <Button
              className="w-full h-12 bg-[#3D8BF2] hover:bg-blue-600 text-white rounded-xl font-semibold"
              onClick={() => router.push("/auth/registro/contratista/ubicacion")}>
              Continuar
            </Button>
            <button type="button" className="mt-4 text-sm text-gray-500">
              ¿No recibiste correo?{" "}
              <span className="text-[#3D8BF2] hover:underline cursor-pointer font-semibold">
                Reenviar
              </span>
            </button>
          </div>
        </div>
      )}

      <Card className="w-[680px] shadow-md border-0 rounded-2xl">
        <CardContent className="flex flex-col items-center px-12 py-10">
          <Image
            src="https://f001.backblazeb2.com/file/app-linkaform/public-client-126/71202/60b81349bde5588acca320e1/694ace05f1bef74262302cc9.png"
            alt="Clave 10"
            width={140}
            height={47}
            priority
          />
          <p className="mt-4 mb-8 text-base font-bold text-gray-700">
            Crea tu perfil
          </p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-4">
              {/* RAZÓN SOCIAL */}
              <FormField
                control={form.control}
                name="razonSocial"
                render={({ field }) => (
                  <FormItem>
                    <FieldLabel required>Razón Social</FieldLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ej. Servicios Integrales S.A. de C.V." className={inputClass} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* NOMBRE COMERCIAL + RFC */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nombreComercial"
                  render={({ field }) => (
                    <FormItem>
                      <FieldLabel required>Nombre Comercial</FieldLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ej. Servicios Integrales" className={inputClass} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rfc"
                  render={({ field }) => (
                    <FormItem>
                      <FieldLabel required>RFC</FieldLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ej. ABC123456XYZ" className={`${inputClass} uppercase`} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* SERVICIOS QUE OFRECE */}
              <Controller
                control={form.control}
                name="servicios"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FieldLabel required>Servicios que Ofrece</FieldLabel>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {SERVICIOS.map((servicio) => {
                        const selected = field.value.includes(servicio);
                        return (
                          <button
                            key={servicio}
                            type="button"
                            onClick={() => {
                              const next = selected
                                ? field.value.filter((s) => s !== servicio)
                                : [...field.value, servicio];
                              field.onChange(next);
                            }}
                            className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-all ${
                              selected
                                ? "border-[#3D8BF2] text-[#3D8BF2] bg-blue-50"
                                : "border-gray-200 text-gray-600 bg-white hover:border-gray-300"
                            }`}>
                            {servicio}
                          </button>
                        );
                      })}
                    </div>
                    {fieldState.error && (
                      <p className="text-sm font-medium text-destructive mt-1">
                        {fieldState.error.message}
                      </p>
                    )}
                  </FormItem>
                )}
              />

              {/* DOMICILIO FISCAL */}
              <FormField
                control={form.control}
                name="domicilioFiscal"
                render={({ field }) => (
                  <FormItem>
                    <FieldLabel required>Domicilio Fiscal</FieldLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ej. Calle 123, Col. Centro, CDMX" className={inputClass} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* REPRESENTANTE LEGAL */}
              <FormField
                control={form.control}
                name="representanteLegal"
                render={({ field }) => (
                  <FormItem>
                    <FieldLabel required>Representante Legal</FieldLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ej. María González López" className={inputClass} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* CORREO + TELÉFONO */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FieldLabel required>Correo Electrónico</FieldLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="Ej. contacto@empresa.com" className={inputClass} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="telefono"
                  render={({ field }) => (
                    <FormItem>
                      <FieldLabel required>Teléfono</FieldLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <div className="flex items-center gap-1.5 px-3 h-11 border border-gray-200 rounded-lg bg-white text-sm select-none shrink-0">
                            🇲🇽
                            <svg className="text-gray-400" width={12} height={12} viewBox="0 0 12 12" fill="none">
                              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                          <Input {...field} type="tel" placeholder="Ej. 5512345678" className={`${inputClass} flex-1`} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* CONTRASEÑA + CONFIRMAR */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FieldLabel required>Contraseña</FieldLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="Mínimo 8 caracteres"
                            className={`${inputClass} pr-10`}
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                            onClick={() => setShowPassword(!showPassword)}>
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
                  name="confirmarPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FieldLabel required>Confirmar Contraseña</FieldLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Repite tu contraseña"
                            className={`${inputClass} pr-10`}
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Terms */}
              <div className="text-center text-sm text-gray-500 pt-1">
                <p>
                  Al dar click en Registrarse estás de acuerdo con los{" "}
                  <a href="#" className="text-[#3D8BF2] hover:underline">
                    Términos y Condiciones.
                  </a>
                </p>
                <button type="button" className="mt-1 text-[#3D8BF2] hover:underline text-sm">
                  ¿No recibiste correo de activación?
                </button>
              </div>

              {/* Buttons */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <Link href="/auth/registro" aria-disabled={isLoading} tabIndex={isLoading ? -1 : 0}>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={isLoading}
                    className="w-full h-12 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold disabled:opacity-50">
                    Cancelar
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-[#3D8BF2] hover:bg-blue-600 text-white rounded-xl font-semibold">
                  {isLoading ? (
                    <>
                      <ReloadIcon className="mr-2 size-4 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    "Registrarse"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
