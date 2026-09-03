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

interface EditModuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: { menuKey: string; menu: string; menuIcon: string } | null;
  isSaving: boolean;
  onSubmit: (values: { menuKey: string; menu: string; menuIcon: string }) => void;
}

const formSchema = z.object({
  menu: z.string().min(1, "Requerido"),
  menuKey: z.string().min(1, "Requerido"),
  menuIcon: z.string().optional(),
});

export const EditModuleDialog: React.FC<EditModuleDialogProps> = ({
  open,
  onOpenChange,
  initialValues,
  isSaving,
  onSubmit,
}) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { menu: "", menuKey: "", menuIcon: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset(
        initialValues
          ? { menu: initialValues.menu, menuKey: initialValues.menuKey, menuIcon: initialValues.menuIcon }
          : { menu: "", menuKey: "", menuIcon: "" },
      );
    }
  }, [open, initialValues]);

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit({ menu: values.menu, menuKey: values.menuKey, menuIcon: values.menuIcon || "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal>
      <DialogContent className="max-w-md" aria-describedby="">
        <DialogHeader>
          <DialogTitle className="text-xl text-center font-bold">
            {initialValues ? "Editar módulo" : "Nuevo módulo"}
          </DialogTitle>
          <p className="text-xs text-muted-foreground text-center">
            Esto no se guarda todavía — hace falta &quot;Guardar cambios&quot; en el tablero.
          </p>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="menu"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Accesos" {...field} disabled={!!initialValues} />
                  </FormControl>
                  {initialValues && (
                    <p className="text-xs text-muted-foreground">
                      El nombre de un módulo existente no se puede cambiar aquí: los permisos
                      de forms/catálogos/scripts se resuelven por este nombre, y renombrarlo
                      podría quitarle acceso a los usuarios que ya lo tienen.
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="menuKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Key</FormLabel>
                  <FormControl>
                    <Input placeholder="accesos" {...field} disabled={!!initialValues} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="menuIcon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icono</FormLabel>
                  <FormControl>
                    <Input placeholder="account-group-outline" {...field} />
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
