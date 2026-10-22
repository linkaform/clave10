import { z } from "zod";

// Campos comunes del alta y de la edición de usuarios.
export const userBaseShape = {
  name: z.string().trim().min(1, "Nombre obligatorio"),
  email: z.string().trim().min(1, "Email obligatorio").email("Email no válido"),
  phone: z.string().trim().min(1, "Teléfono obligatorio"),
  role: z.string().trim().min(1, "Rol obligatorio"),
};
