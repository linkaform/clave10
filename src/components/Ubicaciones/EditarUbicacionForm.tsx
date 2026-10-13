"use client";

import * as React from "react";
import { Building2, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NormalizedUbicacion } from "@/lib/ubicaciones";
import { useUbicacionActions } from "@/hooks/Ubicaciones/useUbicacionActions";
import { SelectorContacto } from "./SelectorContacto";

interface EditarUbicacionFormProps {
  ubicacion: NormalizedUbicacion;
}

const labelClass = "text-xs font-semibold text-gray-500 uppercase tracking-wide";

// Edición de la ubicación en el tab "Configuración" del detalle (panel lateral).
// La dirección sale del catálogo "contacto": aquí solo se elige a qué contacto
// apunta la ubicación (preseleccionado el actual). Los contactos existentes no
// se modifican -- pueden ser compartidos por otras ubicaciones o áreas. Para
// una dirección nueva, el "+" da de alta un contacto y lo deja seleccionado.
export function EditarUbicacionForm({ ubicacion }: EditarUbicacionFormProps) {
  const { handleUpdateUbicacion } = useUbicacionActions();
  const [contacto, setContacto] = React.useState(ubicacion.contacto);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Al guardar se vuelve a pedir la ubicación y el selector toma el contacto nuevo.
  React.useEffect(() => setContacto(ubicacion.contacto), [ubicacion.contacto]);

  const hayCambios = !!contacto && contacto !== ubicacion.contacto;

  const handleSubmit = async () => {
    if (!hayCambios || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await handleUpdateUbicacion(ubicacion.recordId, { contacto });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-5">
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="text-blue-500 w-5 h-5" />
          <h3 className="font-semibold text-gray-700">Información general</h3>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="editar-ubicacion-nombre" className={labelClass}>Nombre</Label>
          <Input id="editar-ubicacion-nombre" value={ubicacion.nombre} disabled className="bg-white border-gray-200" />
          <span className="text-xs text-slate-400">
            El nombre de una ubicación existente no se puede modificar desde aquí.
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="text-blue-500 w-5 h-5" />
          <h3 className="font-semibold text-gray-700">Dirección</h3>
        </div>
        <SelectorContacto value={contacto} onChange={setContacto} />
      </div>

      <div className="flex gap-3">
        <Button
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
          onClick={() => setContacto(ubicacion.contacto)}
          disabled={!hayCambios || isSubmitting}
        >
          Descartar cambios
        </Button>
        <Button
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium"
          onClick={handleSubmit}
          disabled={!hayCambios || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Guardando...
            </>
          ) : (
            "Guardar cambios"
          )}
        </Button>
      </div>

    </div>
  );
}
