"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export interface SectionFormValues {
  seccionKey: string;
  seccion: string;
  seccionHref: string;
  seccionIcon: string;
  seccionIconColor: string;
  seccionDescription: string;
}

interface EditSectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: SectionFormValues | null;
  isSaving: boolean;
  onSubmit: (values: SectionFormValues) => void;
}

const formSchema = z.object({
  seccion: z.string().min(1, "Requerido"),
  seccionKey: z.string().min(1, "Requerido"),
  seccionHref: z.string().optional(),
  seccionIcon: z.string().optional(),
  seccionIconColor: z.string().optional(),
  seccionDescription: z.string().optional(),
});

const emptyValues: SectionFormValues = {
  seccionKey: "",
  seccion: "",
  seccionHref: "",
  seccionIcon: "",
  seccionIconColor: "",
  seccionDescription: "",
};

export const EditSectionDialog: React.FC<EditSectionDialogProps> = ({
  open,
  onOpenChange,
  initialValues,
  isSaving,
  onSubmit,
}) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (open) {
      form.reset(initialValues || emptyValues);
    }
  }, [open, initialValues]);

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit({
      seccionKey: values.seccionKey,
      seccion: values.seccion,
      seccionHref: values.seccionHref || "",
      seccionIcon: values.seccionIcon || "",
      seccionIconColor: values.seccionIconColor || "",
      seccionDescription: values.seccionDescription || "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal>
      <DialogContent className="max-w-md" aria-describedby="">
        <DialogHeader>
          <DialogTitle className="text-xl text-center font-bold">
            {initialValues ? "Editar sección" : "Nueva sección"}
          </DialogTitle>
          <p className="text-xs text-muted-foreground text-center">
            Esto no se guarda todavía — hace falta "Guardar cambios" en el tablero.
          </p>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="seccion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Entradas & Salidas" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="seccionKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Key</FormLabel>
                  <FormControl>
                    <Input placeholder="entradas_salidas" {...field} disabled={!!initialValues} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="seccionHref"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Href (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="/bitacoras" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="seccionIcon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icono</FormLabel>
                  <FormControl>
                    <Input placeholder="login-variant" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="seccionIconColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color del icono</FormLabel>
                  <FormControl>
                    <Input placeholder="#4CAF50" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="seccionDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Gestión de pases de entrada" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-2 mt-2">
              <DialogClose asChild>
                <Button type="button" className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white" disabled={isSaving}>
                Aplicar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
