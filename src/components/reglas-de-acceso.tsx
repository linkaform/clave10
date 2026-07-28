"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useUploadImage } from "@/hooks/useUploadImage";
import { base64ToFile, convertirTextoAImagen } from "@/lib/utils";

const firmaSchema = z.object({
  firma: z.object({
    file_url: z.string().min(1, "Debes firmar para continuar"),
    file_name: z.string().optional(),
  }),
});

export type FirmaValue = { file_url: string; file_name: string };

interface FirmaReglasAccesoProps {
  /** Se llama cada vez que la firma cambia (incluyendo cuando se borra). */
  onFirmaChange?: (firma: FirmaValue) => void;
}

export default function FirmaReglasAcceso({ onFirmaChange }: FirmaReglasAccesoProps) {
  const form = useForm<z.infer<typeof firmaSchema>>({
    resolver: zodResolver(firmaSchema),
    defaultValues: { firma: { file_url: "", file_name: "" } },
  });

  const [textoFirma, setTextoFirma] = useState("");
  const [vistaPrevia, setVistaPrevia] = useState("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { uploadImageMutation, response, isLoading: isLoadingImage } = useUploadImage();

  const handleTextoChange = async (texto: string) => {
    setTextoFirma(texto);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (texto.trim()) {
      timeoutRef.current = setTimeout(async () => {
        try {
          const imagenBase64 = await convertirTextoAImagen(texto);
          setVistaPrevia(imagenBase64);
          const imagenFile = base64ToFile(imagenBase64, `firma_${Date.now()}`);
          uploadImageMutation.mutate({ img: imagenFile });
        } catch (error) {
          console.error("Error:", error);
        }
      }, 800);
    } else {
      setVistaPrevia("");
      const vacio = { file_url: "", file_name: "" };
      form.setValue("firma", vacio, { shouldValidate: true });
      onFirmaChange?.(vacio);
    }
  };

  useEffect(() => {
    if (response?.file_url) {
      const firma = { file_url: response.file_url, file_name: response.file_name ?? "" };
      form.setValue("firma", firma, { shouldValidate: true });
      onFirmaChange?.(firma);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  return (
    <Form {...form}>
      <div className="flex justify-center px-4">
        <FormField
          control={form.control}
          name="firma"
          render={() => (
            <FormItem className="w-full max-w-md">
              <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Firma
              </FormLabel>
              <FormControl>
                <div className="space-y-3">
                  <Input
                    className="border-gray-200 font-bold italic bg-white"
                    style={{ fontFamily: "Georgia, serif" }}
                    placeholder="Escribe tu firma..."
                    value={textoFirma}
                    disabled={isLoadingImage}
                    onChange={(e) => handleTextoChange(e.target.value)}
                  />
                  {vistaPrevia && (
                    <div className="border rounded-lg p-3 bg-gray-50">
                      <p className="text-xs text-gray-500 mb-2">Vista previa:</p>
                      <Image
                        height={100}
                        width={160}
                        src={vistaPrevia}
                        alt="Vista previa de firma"
                        className="max-w-full h-auto"
                      />
                    </div>
                  )}
                  {isLoadingImage && (
                    <p className="text-sm text-gray-400 flex items-center gap-2">
                      <Loader2 className="animate-spin w-4 h-4" /> Subiendo firma...
                    </p>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </Form>
  );
}