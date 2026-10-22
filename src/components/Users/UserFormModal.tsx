"use client";

import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateUser } from "@/hooks/Users/useUsers";
import { userBaseShape } from "./user-schema";

// "none" porque Select no admite value vacío.
const EMPLEADO_OPTIONS = [
  { value: "none", label: "No crear ni ligar" },
  { value: "crear_empleado", label: "Crear empleado" },
  { value: "ligar_empleado", label: "Ligar a empleado existente" },
];

const createSchema = z
  .object({
    ...userBaseShape,
    username: z
      .string()
      .trim()
      .min(1, "Username obligatorio")
      .regex(/^[\w.@+-]+$/, "Solo letras, números, punto, guion, + y @"),
    empleado: z.string(),
    empleadoNombre: z.string().trim(),
  })
  .superRefine((v, ctx) => {
    if (v.empleado === "ligar_empleado" && !v.empleadoNombre) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["empleadoNombre"],
        message: "Escribe el nombre completo del empleado a ligar",
      });
    }
  });

type CreateValues = z.infer<typeof createSchema>;

const EMPTY_CREATE: CreateValues = {
  name: "",
  username: "",
  email: "",
  phone: "",
  role: "",
  empleado: "none",
  empleadoNombre: "",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Alta de usuario. La edición vive en el panel lateral (UserEditForm).
export function UserFormModal({ open, onOpenChange }: Props) {
  const createUser = useCreateUser();
  const isPending = createUser.isPending;

  const form = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: EMPTY_CREATE,
  });
  const empleado = form.watch("empleado");

  // Al abrir, el formulario parte vacío.
  React.useEffect(() => {
    if (open) form.reset(EMPTY_CREATE);
  }, [open, form]);

  const onSubmit = (v: CreateValues) => {
    createUser.mutate(
      {
        name: v.name,
        username: v.username,
        email: v.email,
        phone: v.phone,
        role: v.role,
        empleado: v.empleado === "none" ? "" : v.empleado,
        empleadoNombre: v.empleado === "ligar_empleado" ? v.empleadoNombre : "",
      },
      {
        onSuccess: () => {
          toast.success(
            `Usuario creado. Se envió un correo de activación a ${v.email}`,
          );
          onOpenChange(false);
        },
        onError: (e) =>
          toast.error((e as Error).message || "No se pudo crear el usuario"),
      },
    );
  };

  const textField = (
    name: keyof CreateValues,
    label: string,
    opts?: { hint?: string; type?: string },
  ) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }: any) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input type={opts?.type} {...field} />
          </FormControl>
          {opts?.hint && <p className="text-xs text-slate-500">{opts.hint}</p>}
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => !isPending && onOpenChange(v)}
      modal
    >
      <DialogContent
        className="w-full max-w-md px-4 py-6 overflow-y-auto max-h-[90vh]"
        aria-describedby=""
      >
        <DialogHeader>
          <DialogTitle className="text-xl text-center font-bold">
            Nuevo usuario
          </DialogTitle>
          <DialogDescription className="text-center">
            Se enviará un correo al usuario para que active su cuenta.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {textField("name", "* Nombre")}
            {textField("username", "* Username")}
            {textField("email", "* Email", { type: "email" })}
            {textField("phone", "* Teléfono")}
            {textField("role", "* Rol")}

            <FormField
              control={form.control}
              name="empleado"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Empleado</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EMPLEADO_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {empleado === "ligar_empleado" &&
              textField("empleadoNombre", "* Nombre del empleado a ligar", {
                hint: "Debe coincidir exactamente con el nombre del empleado.",
              })}

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700"
                disabled={isPending}
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center gap-2"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Crear usuario
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
