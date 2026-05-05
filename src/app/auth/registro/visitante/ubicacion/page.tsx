"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Building2, Search, ChevronRight } from "lucide-react";
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

const formSchema = z.object({
  nombreUbicacion: z.string().min(1, "El nombre de la ubicación es requerido"),
  direccion: z.string().min(1, "La dirección es requerida"),
});

type FormValues = z.infer<typeof formSchema>;

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 justify-end mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1 w-10 rounded-full transition-colors ${
            i < current ? "bg-[#3D8BF2]" : "bg-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

export default function UbicacionPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      nombreUbicacion: "",
      direccion: "",
    },
  });

  const isValid = form.formState.isValid;

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    console.log(values);
    // TODO: guardar ubicación
    await new Promise((r) => setTimeout(r, 1000));
    setIsLoading(false);
    router.push("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <Card className="w-[600px] shadow-md border-0 rounded-2xl">
        <CardContent className="px-10 py-10">
          <StepIndicator current={1} total={2} />

          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
              <Building2 size={22} className="text-[#3D8BF2]" />
            </div>
            <h1 className="text-xl font-bold text-gray-800">
              Ubicación principal
            </h1>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* NOMBRE DE LA UBICACIÓN */}
              <FormField
                control={form.control}
                name="nombreUbicacion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      <span className="text-red-500 mr-1">*</span>
                      Nombre de la Ubicación
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ej. Planta Monterrey"
                        className="bg-white border border-gray-200 h-11 rounded-lg text-sm placeholder:text-gray-300"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* DIRECCIÓN COMPLETA */}
              <FormField
                control={form.control}
                name="direccion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      <span className="text-red-500 mr-1">*</span>
                      Dirección Completa
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Search
                          size={16}
                          className="absolute left-3 top-3.5 text-gray-400"
                        />
                        <Input
                          {...field}
                          placeholder="Buscar dirección..."
                          className="bg-white border border-gray-200 h-11 rounded-lg text-sm placeholder:text-gray-300 pl-9"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Nota informativa */}
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm text-blue-700 leading-relaxed">
                <span className="font-semibold">Nota:</span> Esta será tu
                ubicación principal. Puedes agregar más en cualquier momento
                desde configuraciones.
              </div>

              {/* Botón */}
              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={!isValid || isLoading}
                  className="h-11 px-6 bg-gray-200 hover:bg-[#3D8BF2] text-gray-500 hover:text-white rounded-xl font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed data-[valid=true]:bg-[#3D8BF2] data-[valid=true]:text-white"
                  data-valid={isValid}>
                  {isLoading ? "Guardando..." : "Continuar"}
                  {!isLoading && <ChevronRight size={16} className="ml-1" />}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
