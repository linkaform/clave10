import { redirect } from "next/navigation";

/**
 * El editor de menús vive ahora en Configuración > Menús. Esta ruta se queda
 * porque el catálogo de menús de las cuentas todavía apunta aquí.
 */
export default function AdminMenusPage() {
  redirect("/dashboard/configuracion?tab=menus");
}
