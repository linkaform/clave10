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
import { NormalizedUbicacion } from "@/lib/ubicaciones";
import { UbicacionFormData } from "@/lib/ubicaciones-sdk";
import { useUbicacionActions } from "@/hooks/Ubicaciones/useUbicacionActions";
import { UbicacionFormFields, formDeUbicacion } from "./UbicacionFormFields";

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
      setForm(formDeUbicacion(ubicacion));
    } else {
      setForm(emptyForm);
    }
  }, [open, ubicacion]);

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
          <UbicacionFormFields form={form} setForm={setForm} isEdit={isEdit} />
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
