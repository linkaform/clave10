"use client";

import { Download, Loader2 } from "lucide-react";
import { useDescargarPdfConcesion } from "@/hooks/Concesionados/useDescargarPdfConcesion";

interface DescargarPdfConcesionButtonProps {
  recordId: string;
  folio?: string;
  /** Clases del contenedor (cada vista trae su estilo de ícono). */
  className?: string;
  iconClassName?: string;
  /** Texto junto al ícono (el modal lo usa; las vistas solo muestran el ícono). */
  label?: string;
}

// Descarga el PDF de un artículo concesionado (plantilla 655).
export function DescargarPdfConcesionButton({
  recordId,
  folio,
  className = "cursor-pointer",
  iconClassName = "w-5 h-5",
  label,
}: DescargarPdfConcesionButtonProps) {
  const { descargarPdf, isDescargando } = useDescargarPdfConcesion();

  return (
    <button
      type="button"
      title="Descargar PDF"
      disabled={isDescargando}
      onClick={(e) => {
        // En las cards el clic no debe abrir el detalle.
        e.stopPropagation();
        descargarPdf(recordId, folio);
      }}
      className={`${className} disabled:opacity-60 disabled:cursor-wait`}
    >
      {isDescargando ? (
        <Loader2 className={`${iconClassName} animate-spin`} />
      ) : (
        <Download className={iconClassName} />
      )}
      {label && <span>{label}</span>}
    </button>
  );
}
