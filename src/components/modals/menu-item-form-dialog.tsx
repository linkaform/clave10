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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MenuItemAdmin } from "@/services/menus-admin";

export interface ItemFormValues {
  elemento: string;
  key: string;
  type: "option" | "config" | "report" | "action" | "link";
  href_web: string;
  route_mobile: string;
  item_icon: string;
  seccionKey: string;
}

interface MenuItemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: MenuItemAdmin | null;
  defaultSeccionKey: string;
  sectionOptions: { seccionKey: string; seccion: string }[];
  platform: "web" | "mobile";
  isSaving: boolean;
  onSubmit: (values: ItemFormValues) => void;
}

const formSchema = z.object({
  elemento: z.string().min(1, "Requerido"),
  key: z.string().min(1, "Requerido"),
  type: z.enum(["option", "config", "report", "action", "link"]),
  href_web: z.string().optional(),
  route_mobile: z.string().optional(),
  item_icon: z.string().optional(),
  seccionKey: z.string().min(1, "Requerido"),
});

export const MenuItemFormDialog: React.FC<MenuItemFormDialogProps> = ({
  open,
  onOpenChange,
  initialValues,
  defaultSeccionKey,
  sectionOptions,
  platform,
  isSaving,
  onSubmit,
}) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      elemento: "",
      key: "",
      type: "link",
      href_web: "",
      route_mobile: "",
      item_icon: "",
      seccionKey: defaultSeccionKey,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset(
        initialValues
          ? {
              elemento: initialValues.elemento,
              key: initialValues.key,
              type: initialValues.type,
              href_web: initialValues.href_web || "",
              route_mobile: initialValues.route_mobile || "",
              item_icon: initialValues.item_icon || "",
              seccionKey: initialValues.seccion_key,
            }
          : {
              elemento: "",
              key: "",
              type: "link",
              href_web: "",
              route_mobile: "",
              item_icon: "",
              seccionKey: defaultSeccionKey,
            },
      );
    }
  }, [open, initialValues, defaultSeccionKey]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal>
      <DialogContent className="max-w-md" aria-describedby="">
        <DialogHeader>
          <DialogTitle className="text-xl text-center font-bold">
            {initialValues ? "Editar item" : "Nuevo item"}
          </DialogTitle>
          <p className="text-xs text-muted-foreground text-center">
            Esto no se guarda todavía — hace falta "Guardar cambios" en el tablero.
          </p>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) =>
              onSubmit({
                ...values,
                href_web: values.href_web || "",
                route_mobile: values.route_mobile || "",
                item_icon: values.item_icon || "",
              }),
            )}
            className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="elemento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Entradas" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Key</FormLabel>
                  <FormControl>
                    <Input placeholder="entradas" {...field} disabled={!!initialValues} />
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
                  <FormLabel>Sección</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sectionOptions.map((s) => (
                        <SelectItem key={s.seccionKey} value={s.seccionKey}>
                          {s.seccion}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="link">link</SelectItem>
                      <SelectItem value="option">option</SelectItem>
                      <SelectItem value="config">config</SelectItem>
                      <SelectItem value="report">report</SelectItem>
                      <SelectItem value="action">action</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {platform === "web" ? (
              <FormField
                control={form.control}
                name="href_web"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Href Web</FormLabel>
                    <FormControl>
                      <Input placeholder="/bitacoras?status=entrada" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <>
                <FormField
                  control={form.control}
                  name="route_mobile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Route Mobile</FormLabel>
                      <FormControl>
                        <Input placeholder="/ListNotas?action=new" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="item_icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="plus-circle-outline" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            <div className="flex gap-2 mt-2">
              <DialogClose asChild>
                <Button type="button" className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700">
                  Cancelar
                </Button>
              </DialogClose>
              <Button
                type="submit"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                disabled={isSaving}>
                Aplicar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
