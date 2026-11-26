import { z } from "zod";

// Campos comunes del alta y de la edición de usuarios.
export const userBaseShape = {
  name: z.string().trim().min(1, "Nombre obligatorio"),
  email: z.string().trim().min(1, "Email obligatorio").email("Email no válido"),
  phone: z.string().trim().min(1, "Teléfono obligatorio"),
  // "role" es el puesto (texto libre); los roles del catálogo van aparte.
  role: z.string().trim().min(1, "Puesto obligatorio"),
};
