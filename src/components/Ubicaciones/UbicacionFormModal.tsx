"use client";

import * as React from "react";
import { Building2, Loader2, MapPin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UbicacionFormData } from "@/lib/ubicaciones-sdk";
import { useUbicacionActions } from "@/hooks/Ubicaciones/useUbicacionActions";
import { SelectorContacto } from "./SelectorContacto";

interface UbicacionFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  /** Recibe el record_id de la ubicación nueva. */
  onCreated?: (recordId: string) => void;
}

export const emptyUbicacionForm: UbicacionFormData = {
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

// Alta de una ubicación: nombre + contacto del catálogo "contacto" (o uno
// nuevo con el "+"). La edición vive en el tab "Configuración" del panel
// lateral (EditarUbicacionForm), con el mismo selector.
export function UbicacionFormModal({ open, onOpenChange, onSuccess, onCreated }: UbicacionFormModalProps) {
  const { handleCreateUbicacion } = useUbicacionActions();
  const [nombre, setNombre] = React.useState("");
  const [contacto, setContacto] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setNombre("");
    setContacto("");
  }, [open]);

  const puedeCrear = !!nombre.trim() && !!contacto && !isSubmitting;

  const handleSubmit = async () => {
    if (!puedeCrear) return;
    setIsSubmitting(true);
    try {
      const res = await handleCreateUbicacion({ nombre: nombre.trim(), contacto });
      if (res) {
        onOpenChange(false);
        onSuccess?.();
        if (res.recordId) onCreated?.(res.recordId);
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
            Nueva ubicación
          </DialogTitle>
          <p className="text-center text-sm text-gray-400">
            Completa la información para registrar la ubicación
          </p>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto px-6">
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="text-blue-500 w-5 h-5" />
              <h3 className="font-semibold text-gray-700">Información general</h3>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nueva-ubicacion-nombre" className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Nombre *
              </Label>
              <Input
                id="nueva-ubicacion-nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Planta Monterrey"
                className="bg-white border-gray-200"
              />
            </div>
          </div>

          <div className="p-5 pt-0 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="text-blue-500 w-5 h-5" />
              <h3 className="font-semibold text-gray-700">Dirección *</h3>
            </div>
            <SelectorContacto value={contacto} onChange={setContacto} />
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
            disabled={!puedeCrear}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Guardando...
              </>
            ) : (
              "Crear ubicación"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
