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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { UserRow, useUpdateUser } from "@/hooks/Users/useUsers";
import { userBaseShape } from "./user-schema";

const editSchema = z.object(userBaseShape);
type EditValues = z.infer<typeof editSchema>;

const toValues = (user: UserRow): EditValues => ({
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
});

interface Props {
  user: UserRow;
  /** Se llama al guardar o al cancelar, para que el panel salga del modo edición. */
  onDone: () => void;
}

// Edición dentro del panel lateral. El username no se puede cambiar.
export function UserEditForm({ user, onDone }: Props) {
  const updateUser = useUpdateUser();
  const form = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: toValues(user),
  });

  // Si el detalle trae datos más frescos, el formulario parte de ellos.
  React.useEffect(() => {
    form.reset(toValues(user));
  }, [user.id, form]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = (values: EditValues) => {
    // Solo viajan los campos que cambiaron; vacío = sin cambio para el backend.
    const changed = (key: keyof EditValues) =>
      values[key] !== user[key] ? values[key] : "";
    const edit = {
      name: changed("name"),
      email: changed("email"),
      phone: changed("phone"),
      role: changed("role"),
    };
    if (!Object.values(edit).some(Boolean)) {
      toast.info("No hay cambios que guardar.");
      return;
    }
    updateUser.mutate(
      { recordId: user.id, values: edit },
      {
        onSuccess: () => {
          toast.success("Usuario actualizado");
          onDone();
        },
        onError: (e) =>
          toast.error((e as Error).message || "No se pudo guardar el usuario"),
      },
    );
  };

  const field = (
    name: keyof EditValues,
    label: string,
    hint?: string,
    type?: string,
  ) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }: any) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input type={type} {...field} />
          </FormControl>
          {hint && <p className="text-xs text-slate-500">{hint}</p>}
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <section className="rounded-md border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">
        Editar usuario
      </h3>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="min-w-0">
            <p className="text-sm font-medium">Username</p>
            <p className="text-sm text-slate-500 break-words">
              {user.username || "—"} · no se puede cambiar
            </p>
          </div>
          {field("name", "* Nombre")}
          {field(
            "email",
            "* Email",
            "Cambiar el email no reenvía la liga de activación.",
            "email",
          )}
          {field("phone", "* Teléfono")}
          {field("role", "* Rol")}
          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700"
              disabled={updateUser.isPending}
              onClick={onDone}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={updateUser.isPending}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center gap-2"
            >
              {updateUser.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Guardar
            </Button>
          </div>
        </form>
      </Form>
    </section>
  );
}
