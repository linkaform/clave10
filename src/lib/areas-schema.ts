import { z } from "zod";

// Validación compartida de los modales de Nueva área y Editar área.
export const areaFormSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre del área es obligatorio."),
  ubicacion: z.string().min(1, "Selecciona una ubicación."),
  tipo_de_area: z.string().min(1, "Selecciona un tipo de área."),
  geolocalizacion: z
    .object({
      latitude: z.number().min(-90, "Latitud fuera de rango.").max(90, "Latitud fuera de rango."),
      longitude: z.number().min(-180, "Longitud fuera de rango.").max(180, "Longitud fuera de rango."),
    })
    .nullable(),
});

export type AreaFormValues = z.infer<typeof areaFormSchema>;
export type AreaFormErrors = Partial<Record<keyof AreaFormValues, string>>;

/** Primer mensaje de error por campo, listo para pintar debajo de cada input. */
export const validarAreaForm = (values: AreaFormValues): AreaFormErrors => {
  const result = areaFormSchema.safeParse(values);
  if (result.success) return {};
  const errores: AreaFormErrors = {};
  for (const issue of result.error.issues) {
    const campo = issue.path[0] as keyof AreaFormValues;
    if (campo && !errores[campo]) errores[campo] = issue.message;
  }
  return errores;
};

/** Clases para marcar en rojo un Input o SelectTrigger con error. */
export const claseError = (error?: string) =>
  error ? "border-red-500 focus-visible:ring-red-500 focus:ring-red-500" : "";
