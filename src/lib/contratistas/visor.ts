import { toast } from "sonner";

/** Visor: abre el archivo en pestaña nueva y avisa si el navegador la bloquea. */
export function abrirVisor(url: string) {
  // Sin "noopener" en los features: con él window.open siempre regresa null
  // y no se podría detectar el bloqueo. Se corta el opener a mano.
  const w = window.open(url, "_blank");
  if (!w) return void toast.info("Permite ventanas emergentes para visualizar");
  w.opener = null;
}
