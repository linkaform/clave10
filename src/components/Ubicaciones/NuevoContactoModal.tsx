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
import { UbicacionFormData } from "@/lib/ubicaciones-sdk";
import { useUbicacionActions } from "@/hooks/Ubicaciones/useUbicacionActions";
import { UbicacionFormFields } from "./UbicacionFormFields";
import { emptyUbicacionForm } from "./UbicacionFormModal";

interface NuevoContactoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Recibe el nombre (address_name) del contacto creado, para preseleccionarlo. */
  onCreated: (nombreContacto: string) => void;
}

// Alta de un contacto (dirección) en el catálogo "contacto" desde el botón "+"
// del selector de dirección de la ubicación.
export function NuevoContactoModal({ open, onOpenChange, onCreated }: NuevoContactoModalProps) {
  const { handleCreateContacto } = useUbicacionActions();
  const [form, setForm] = React.useState<UbicacionFormData>(emptyUbicacionForm);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) setForm(emptyUbicacionForm);
  }, [open]);

  const handleSubmit = async () => {
    if (!form.nombre?.trim()) return;
    setIsSubmitting(true);
    try {
      const nombre = await handleCreateContacto(form);
      if (nombre) {
        onOpenChange(false);
        onCreated(nombre);
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
            Nuevo contacto
          </DialogTitle>
          <p className="text-center text-sm text-gray-400">
            Registra una dirección nueva en el catálogo de contactos
          </p>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto px-6">
          <UbicacionFormFields
            form={form}
            setForm={setForm}
            idPrefix="contacto"
            nombrePlaceholder="Ej. Planta Monterrey (Av. Constitución)"
          />
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
            ) : (
              "Crear contacto"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
