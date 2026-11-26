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
import { UserRow, useUpdateUser, useUserOptions } from "@/hooks/Users/useUsers";
import { cn } from "@/lib/utils";
import { UserLocaleFields } from "./UserLocaleFields";
import { userBaseShape } from "./user-schema";

// Zona e idioma pueden venir vacíos en usuarios anteriores a estos campos.
const editSchema = z.object({
  ...userBaseShape,
  timezone: z.string(),
  language: z.string(),
});
type EditValues = z.infer<typeof editSchema>;

const toValues = (user: UserRow): EditValues => ({
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  timezone: user.timezone,
  language: user.language,
});

interface Props {
  user: UserRow;
  /** Roles actuales del empleado ligado (catálogo `rol`). */
  roles: string[];
  /** Sin empleado ligado no se pueden asignar roles. */
  rolesEditable: boolean;
  /** Se llama al guardar o al cancelar, para que el panel salga del modo edición. */
  onDone: () => void;
}

// Edición dentro del panel lateral. El username no se puede cambiar.
export function UserEditForm({ user, roles, rolesEditable, onDone }: Props) {
  const updateUser = useUpdateUser();
  const { data: options } = useUserOptions();
  const roleOptions = options?.roles ?? [];
  // Roles: fuera del form de zod porque no son texto del registro de Usuarios.
  const [selectedRoles, setSelectedRoles] = React.useState<string[]>(roles);
  React.useEffect(() => {
    setSelectedRoles(roles);
  }, [user.id, roles.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps
  const rolesChanged =
    selectedRoles.length !== roles.length ||
    selectedRoles.some((r) => !roles.includes(r));
  const toggleRole = (rol: string) =>
    setSelectedRoles((prev) =>
      prev.includes(rol) ? prev.filter((r) => r !== rol) : [...prev, rol],
    );
  const form = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: toValues(user),
  });

  // Si el detalle trae datos más frescos, el formulario parte de ellos.
  React.useEffect(() => {
    form.reset(toValues(user));
  }, [user.id, form]); // eslint-disable-line react-hooks/exhaustive-deps

  // Si solo cambiaron los roles se guardan sin validar el resto: hay usuarios
  // viejos sin teléfono o puesto y eso no debe impedir asignarles roles.
  const handleSave = (e: React.FormEvent) => {
    if (!form.formState.isDirty && rolesChanged) {
      e.preventDefault();
      onSubmit(toValues(user));
      return;
    }
    form.handleSubmit(onSubmit)(e);
  };

  const onSubmit = (values: EditValues) => {
    // Solo viajan los campos que cambiaron; vacío = sin cambio para el backend.
    const changed = (key: keyof EditValues) =>
      values[key] !== user[key] ? values[key] : "";
    const edit = {
      name: changed("name"),
      email: changed("email"),
      phone: changed("phone"),
      role: changed("role"),
      timezone: changed("timezone"),
      language: changed("language"),
    };
    if (!Object.values(edit).some(Boolean) && !rolesChanged) {
      toast.info("No hay cambios que guardar.");
      return;
    }
    updateUser.mutate(
      {
        recordId: user.id,
        values: rolesChanged ? { ...edit, roles: selectedRoles } : edit,
      },
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
        <form onSubmit={handleSave} className="space-y-4">
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
          {field("role", "* Puesto")}
          <div className="space-y-2">
            <p className="text-sm font-medium">Roles</p>
            {rolesEditable ? (
              <>
                <div
                  className="flex flex-wrap gap-1.5"
                  role="group"
                  aria-label="Roles"
                >
                  {roleOptions.map((rol) => {
                    const on = selectedRoles.includes(rol);
                    return (
                      <button
                        key={rol}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleRole(rol)}
                        disabled={updateUser.isPending}
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors duration-150",
                          on
                            ? "border-blue-500 bg-blue-500 text-white"
                            : "border-slate-300 bg-white text-slate-600 hover:border-blue-400",
                        )}
                      >
                        {rol}
                      </button>
                    );
                  })}
                  {roleOptions.length === 0 && (
                    <span className="text-xs text-slate-500">
                      No hay roles en el catálogo.
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Se guardan en el empleado (Configuración de Áreas y
                  Empleados). Los usan turnos, rondines, asistencias y los menús
                  por rol.
                </p>
              </>
            ) : (
              <p className="text-xs text-slate-500">
                Este usuario no tiene empleado ligado; los roles se asignan al
                empleado.
              </p>
            )}
          </div>
          <UserLocaleFields
            control={form.control}
            emptyLabel="Sin definir"
            unavailableNote="No se modificarán."
          />
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
