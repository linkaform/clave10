import { redirect } from "next/navigation";

// La pantalla de Turnos se retiró: el Check In/Out vive en el inicio y en el menú del avatar.
export default function TurnosPage() {
  redirect("/");
}
