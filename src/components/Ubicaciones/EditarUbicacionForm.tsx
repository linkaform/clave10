"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NormalizedUbicacion } from "@/lib/ubicaciones";
import { UbicacionFormData } from "@/lib/ubicaciones-sdk";
import { useUbicacionActions } from "@/hooks/Ubicaciones/useUbicacionActions";
import { UbicacionFormFields, formDeUbicacion } from "./UbicacionFormFields";

interface EditarUbicacionFormProps {
  ubicacion: NormalizedUbicacion;
}

// Edición de la ubicación en el tab "Configuración" del detalle (panel
// lateral), igual que EditarAreaForm en el detalle de área.
export function EditarUbicacionForm({ ubicacion }: EditarUbicacionFormProps) {
  const { handleUpdateUbicacion } = useUbicacionActions();
  const inicial = React.useMemo(() => formDeUbicacion(ubicacion), [ubicacion]);
  const [form, setForm] = React.useState<UbicacionFormData>(inicial);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Al guardar se vuelve a pedir la ubicación y el form toma los datos nuevos.
  React.useEffect(() => setForm(inicial), [inicial]);

  const hayCambios = (Object.keys(inicial) as (keyof UbicacionFormData)[]).some(
    (key) => (form[key] ?? "") !== (inicial[key] ?? ""),
  );
  const puedeGuardar = hayCambios && !!form.nombre?.trim() && !isSubmitting;

  const handleSubmit = async () => {
    if (!puedeGuardar) return;
    setIsSubmitting(true);
    try {
      await handleUpdateUbicacion(ubicacion.recordId, form);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col">
      <UbicacionFormFields form={form} setForm={setForm} isEdit />

      <div className="flex gap-3 px-5">
        <Button
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
          onClick={() => setForm(inicial)}
          disabled={!hayCambios || isSubmitting}
        >
          Descartar cambios
        </Button>
        <Button
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium"
          onClick={handleSubmit}
          disabled={!puedeGuardar}
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
