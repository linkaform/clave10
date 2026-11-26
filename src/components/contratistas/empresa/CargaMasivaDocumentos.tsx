"use client";
// ME-06 · Carga masiva con IA: varios archivos, un comentario común para toda la
// carga. Se suben uno por uno con origen "Carga masiva"; la IA propone el
// propietario (RFC/CURP/NSS → empleado) y los que no lo tienen quedan a nombre de la
// empresa, Por revisar. Diseño: plataforma.dc.html, nomLoad / nomRev (~4330–4369).
import { useState } from "react";
import { Check, Loader2, TriangleAlert } from "lucide-react";
import { AreaTexto, Campo, Modal, avisar } from "@/components/contratistas/ui";
import { analizarDocumento, subirArchivo } from "@/services/contratistas/analisis";
import { commentDocumento, uploadDocumento } from "@/services/contratistas/documentos";
import type { EmpresaRef, Id } from "@/types/contratistas";
import { documentoInput } from "./documentosEmpresa";

type Estado = "pendiente" | "subiendo" | "listo" | "error";

export function CargaMasivaDocumentos({
  archivos, empresa, propietarios, contratoId, onCerrar, onTermino,
}: {
  archivos: File[];
  empresa: EmpresaRef;
  /** ids válidos de propietario (empresa y empleados): lo que la IA proponga fuera de aquí se ignora. */
  propietarios: Set<Id>;
  contratoId?: Id;
  onCerrar: () => void;
  onTermino: () => void;
}) {
  const [comentario, setComentario] = useState("");
  const [estados, setEstados] = useState<Estado[]>(() => archivos.map(() => "pendiente"));
  const [corriendo, setCorriendo] = useState(false);
  const poner = (i: number, e: Estado) => setEstados((s) => s.map((x, j) => (j === i ? e : x)));

  const subir = async () => {
    setCorriendo(true);
    let bien = 0;
    for (const [i, file] of archivos.entries()) {
      if (estados[i] === "listo") continue;
      poner(i, "subiendo");
      try {
        const signal = new AbortController().signal;
        const archivo = await subirArchivo(file, () => {}, signal);
        const analisis = await analizarDocumento(archivo, {}, signal).catch(() => null);
        const propietario = analisis?.propietario.id;
        const doc = await uploadDocumento(
          documentoInput(
            empresa,
            {
              archivo,
              nombre: analisis?.nombre_sugerido || file.name.replace(/\.[^.]+$/, ""),
              requerimiento_id: analisis?.mapeo.id ?? null,
              propietario_id: propietario && propietarios.has(propietario) ? propietario : null,
              analisis,
            },
            { origen: "Carga masiva", contratos: contratoId ? [contratoId] : undefined },
          ),
        );
        if (comentario.trim()) await commentDocumento(doc.id, comentario.trim());
        poner(i, "listo");
        bien++;
      } catch {
        poner(i, "error");
      }
    }
    setCorriendo(false);
    onTermino();
    const fallas = archivos.length - bien - estados.filter((e) => e === "listo").length;
    if (fallas > 0) avisar(`No se pudieron subir ${fallas} de ${archivos.length} archivos; puedes reintentarlos`, "error");
    else {
      avisar(archivos.length === 1 ? "Se subió el documento para revisión" : `Se subieron ${archivos.length} documentos para revisión`);
      onCerrar();
    }
  };

  const hayError = estados.includes("error");
  return (
    <Modal
      abierto
      onCerrar={() => !corriendo && onCerrar()}
      titulo="Carga masiva con IA"
      descripcion="La IA lee cada archivo, lo clasifica y lo relaciona con tus empleados. Los que no tengan propietario quedan Por revisar."
      onGuardar={subir}
      guardando={corriendo}
      etiquetaGuardar={hayError ? "Reintentar" : `Subir ${archivos.length} documentos`}
    >
      <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
        {archivos.map((f, i) => (
          <li key={`${f.name}-${i}`} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm shadow-[0_0_0_1px_var(--c10-line)]">
            <span className="min-w-0 flex-1 truncate text-c10-title">{f.name}</span>
            {estados[i] === "subiendo" && <Loader2 className="size-4 animate-spin text-c10-acc" aria-label="Subiendo" />}
            {estados[i] === "listo" && <Check className="size-4 text-green-600" aria-label="Subido" />}
            {estados[i] === "error" && <TriangleAlert className="size-4 text-red-600" aria-label="No se pudo subir" />}
          </li>
        ))}
      </ul>
      <Campo etiqueta="Comentario para toda la carga">
        <AreaTexto value={comentario} onChange={(e) => setComentario(e.target.value)} disabled={corriendo} placeholder="Opcional" />
      </Campo>
    </Modal>
  );
}
