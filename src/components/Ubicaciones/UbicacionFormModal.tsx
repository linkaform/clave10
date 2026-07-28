"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { catalogoEstados } from "@/lib/utils";
import { NormalizedUbicacion } from "@/lib/ubicaciones";
import { UbicacionFormData } from "@/lib/ubicaciones-sdk";
import { useUbicacionActions } from "@/hooks/Ubicaciones/useUbicacionActions";

interface UbicacionFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ubicacion?: NormalizedUbicacion | null;
  onSuccess?: () => void;
}

const emptyForm: UbicacionFormData = {
  nombre: "",
  direccion: "",
  colonia: "",
  ciudad: "",
  estado: "",
  pais: "",
  codigo_postal: "",
  telefono: "",
  email: "",
};

export function UbicacionFormModal({ open, onOpenChange, ubicacion, onSuccess }: UbicacionFormModalProps) {
  const isEdit = !!ubicacion;
  const { handleCreateUbicacion, handleUpdateUbicacion } = useUbicacionActions();
  const [form, setForm] = React.useState<UbicacionFormData>(emptyForm);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    if (ubicacion) {
      setForm({
        nombre: ubicacion.nombre === "-" ? "" : ubicacion.nombre,
        direccion: ubicacion.direccion,
        colonia: ubicacion.colonia,
        ciudad: ubicacion.ciudad,
        estado: ubicacion.estado,
        pais: ubicacion.pais,
        codigo_postal: ubicacion.codigoPostal,
        telefono: ubicacion.telefono,
        email: ubicacion.email,
      });
    } else {
      setForm(emptyForm);
    }
  }, [open, ubicacion]);

  const setField = (key: keyof UbicacionFormData) => (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.nombre?.trim()) return;
    setIsSubmitting(true);
    try {
      const ok = isEdit
        ? await handleUpdateUbicacion(ubicacion!.recordId, form)
        : await handleCreateUbicacion(form);
      if (ok) {
        onOpenChange(false);
        onSuccess?.();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl w-full max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar ubicación" : "Nueva ubicación"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="ubicacion-nombre">Nombre *</Label>
            <Input
              id="ubicacion-nombre"
              value={form.nombre}
              onChange={setField("nombre")}
              placeholder="Ej. Planta Monterrey"
              disabled={isEdit}
            />
            {isEdit && (
              <span className="text-xs text-slate-400">
                El nombre de una ubicación existente no se puede modificar desde aquí.
              </span>
            )}
          </div>

          <div className="col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="ubicacion-direccion">Dirección</Label>
            <Input id="ubicacion-direccion" value={form.direccion} onChange={setField("direccion")} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ubicacion-colonia">Colonia</Label>
            <Input id="ubicacion-colonia" value={form.colonia} onChange={setField("colonia")} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ubicacion-ciudad">Ciudad</Label>
            <Input id="ubicacion-ciudad" value={form.ciudad} onChange={setField("ciudad")} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Estado</Label>
            <Select
              value={form.estado || undefined}
              onValueChange={(value) => setForm((prev) => ({ ...prev, estado: value }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un estado" />
              </SelectTrigger>
              <SelectContent>
                {catalogoEstados().map((estado) => (
                  <SelectItem key={estado} value={estado}>
                    {estado}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ubicacion-pais">País</Label>
            <Input id="ubicacion-pais" value={form.pais} onChange={setField("pais")} placeholder="México" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ubicacion-cp">Código Postal</Label>
            <Input id="ubicacion-cp" value={form.codigo_postal} onChange={setField("codigo_postal")} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ubicacion-telefono">Teléfono</Label>
            <Input id="ubicacion-telefono" value={form.telefono} onChange={setField("telefono")} />
          </div>

          <div className="col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="ubicacion-email">Email</Label>
            <Input id="ubicacion-email" type="email" value={form.email} onChange={setField("email")} />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !form.nombre?.trim()}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Guardando...
              </>
            ) : isEdit ? (
              "Guardar cambios"
            ) : (
              "Crear ubicación"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
