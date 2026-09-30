"use client";

import * as React from "react";
import { Building2, Loader2, MapPin, Phone } from "lucide-react";
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

  const labelClass = "text-xs font-semibold text-gray-500 uppercase tracking-wide";
  const inputClass = "bg-white border-gray-200";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="flex-shrink-0 bg-white px-6 py-5 border-b">
          <DialogTitle className="text-2xl text-center font-bold text-gray-800">
            {isEdit ? "Editar ubicación" : "Nueva ubicación"}
          </DialogTitle>
          <p className="text-center text-sm text-gray-400">
            {isEdit
              ? "Actualiza la información de la ubicación"
              : "Completa la información para registrar la ubicación"}
          </p>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto px-6">
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="text-blue-500 w-5 h-5" />
              <h3 className="font-semibold text-gray-700">Información general</h3>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ubicacion-nombre" className={labelClass}>Nombre *</Label>
              <Input
                id="ubicacion-nombre"
                value={form.nombre}
                onChange={setField("nombre")}
                placeholder="Ej. Planta Monterrey"
                disabled={isEdit}
                className={inputClass}
              />
              {isEdit && (
                <span className="text-xs text-slate-400">
                  El nombre de una ubicación existente no se puede modificar desde aquí.
                </span>
              )}
            </div>
          </div>

          <div className="p-5 pt-0 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="text-blue-500 w-5 h-5" />
              <h3 className="font-semibold text-gray-700">Dirección</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 flex flex-col gap-1.5">
                <Label htmlFor="ubicacion-direccion" className={labelClass}>Dirección</Label>
                <Input id="ubicacion-direccion" value={form.direccion} onChange={setField("direccion")} placeholder="Calle y número" className={inputClass} />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ubicacion-colonia" className={labelClass}>Colonia</Label>
                <Input id="ubicacion-colonia" value={form.colonia} onChange={setField("colonia")} className={inputClass} />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ubicacion-ciudad" className={labelClass}>Ciudad</Label>
                <Input id="ubicacion-ciudad" value={form.ciudad} onChange={setField("ciudad")} className={inputClass} />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className={labelClass}>Estado</Label>
                <Select
                  value={form.estado || undefined}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, estado: value }))}
                >
                  <SelectTrigger className={`w-full ${inputClass}`}>
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
                <Label htmlFor="ubicacion-pais" className={labelClass}>País</Label>
                <Input id="ubicacion-pais" value={form.pais} onChange={setField("pais")} placeholder="México" className={inputClass} />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ubicacion-cp" className={labelClass}>Código Postal</Label>
                <Input id="ubicacion-cp" value={form.codigo_postal} onChange={setField("codigo_postal")} className={inputClass} />
              </div>
            </div>
          </div>

          <div className="p-5 pt-0 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Phone className="text-blue-500 w-5 h-5" />
              <h3 className="font-semibold text-gray-700">Contacto</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ubicacion-telefono" className={labelClass}>Teléfono</Label>
                <Input id="ubicacion-telefono" value={form.telefono} onChange={setField("telefono")} className={inputClass} />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ubicacion-email" className={labelClass}>Email</Label>
                <Input id="ubicacion-email" type="email" value={form.email} onChange={setField("email")} placeholder="correo@empresa.com" className={inputClass} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 bg-white border-t px-6 py-4 flex gap-3">
          <Button
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium"
            onClick={handleSubmit}
            disabled={isSubmitting || !form.nombre?.trim()}
          >
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
