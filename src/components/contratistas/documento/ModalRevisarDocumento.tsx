"use client";
// F0-13 · Revisar documento: aprobar (comentario opcional) o rechazar (comentario obligatorio).
// Ficha: contratistas_f013_revisar_documento.md. Diseño: plataforma.dc.html, dcRvOpen
// (Mi empresa → Documentos, ~3826), rqRvOpen (Requerimientos del contrato, ~3839) y
// ccRvOpen (Cumplimiento, ~2914): el mismo modal con otros datos.
//
//   <ModalRevisarDocumento abierto={!!rev} documento={rev} onCerrar={() => setRev(null)}
//     onRevisado={(doc) => refrescar(doc)} />
//
// El back guarda el motivo en la aprobación y en la versión, pero no en el hilo: el
// comentario se agrega aparte con comment_documento, como pide el diseño.
import { useEffect, useState } from "react";
import { Check, ExternalLink, FileText, Loader2, X } from "lucide-react";
import { AreaTexto, Boton, Campo, Consejo, Modal, avisar } from "@/components/contratistas/ui";
import { Dato, Datos } from "@/components/contratistas/panel";
import { abrirVisor } from "@/lib/contratistas/visor";
import { commentDocumento, reviewDocumento } from "@/services/contratistas/documentos";
import type { Documento } from "@/types/contratistas";
import { propietario, versionActual } from "./formato";

/** Mismo límite que el back (MAX_COMENTARIO en contratistas_documentos.py). */
const MAX_COMENTARIO = 2000;
const ERROR_VACIO = "Escribe un comentario para rechazar el documento.";

type Decision = "Aprobado" | "Rechazado";

export interface ModalRevisarDocumentoProps {
  abierto: boolean;
  onCerrar: () => void;
  documento: Documento | null;
  /**
   * "documento" (Mi empresa, Requerimientos): Propietario y Mapeo.
   * "cumplimiento" (matrices de cumplimiento): Contratista y Subido por.
   */
  variante?: "documento" | "cumplimiento";
  /** Con el documento ya actualizado, para que la pantalla refresque lista y panel. */
  onRevisado?: (doc: Documento) => void;
}

export function ModalRevisarDocumento({
  abierto, onCerrar, documento, variante = "documento", onRevisado,
}: ModalRevisarDocumentoProps) {
  const [comentario, setComentario] = useState("");
  const [intento, setIntento] = useState(false);
  const [enviando, setEnviando] = useState<Decision | null>(null);

  // Cada vez que se abre (o cambia de documento) empieza en blanco
  useEffect(() => {
    if (!abierto) return;
    setComentario("");
    setIntento(false);
    setEnviando(null);
  }, [abierto, documento?.id]);

  const texto = comentario.trim();
  const errorVacio = intento && !texto ? ERROR_VACIO : null;

  const cerrar = () => {
    if (!enviando) onCerrar();
  };

  const revisar = async (decision: Decision) => {
    if (!documento || enviando) return;
    if (decision === "Rechazado" && !texto) {
      setIntento(true);
      return;
    }
    setEnviando(decision);
    try {
      let doc = await reviewDocumento(documento.id, { decision, motivo: texto || undefined });
      if (texto) {
        try {
          doc = await commentDocumento(documento.id, texto);
        } catch (e) {
          // La decisión ya quedó guardada: solo falta el comentario en el hilo
          avisar(`No se pudo agregar el comentario: ${(e as Error).message}`, "error");
        }
      }
      avisar(decision === "Aprobado" ? "Se aprobó el documento" : "Se rechazó el documento", "exito");
      onRevisado?.(doc);
      onCerrar();
    } catch (e) {
      avisar(`No se pudo revisar el documento: ${(e as Error).message}`, "error");
    } finally {
      setEnviando(null);
    }
  };

  const cumplimiento = variante === "cumplimiento";
  const archivo = documento?.archivo;

  return (
    <Modal
      abierto={abierto}
      onCerrar={cerrar}
      titulo="Revisar documento"
      ancho={520}
      pie={
        <>
          <Boton variante="cancelar" flex onClick={cerrar} disabled={!!enviando}>
            Cancelar
          </Boton>
          <Boton
            variante="peligro"
            flex
            onClick={() => revisar("Rechazado")}
            disabled={!!enviando}
            icono={enviando === "Rechazado" ? <Loader2 className="animate-spin" /> : <X />}
          >
            Rechazar
          </Boton>
          <Boton
            flex
            onClick={() => revisar("Aprobado")}
            disabled={!!enviando}
            icono={enviando === "Aprobado" ? <Loader2 className="animate-spin" /> : <Check />}
          >
            Aprobar
          </Boton>
        </>
      }
    >
      {documento && (
        <>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => archivo?.file_url && abrirVisor(archivo.file_url)}
              title={archivo ? `Ver ${archivo.name}` : undefined}
              className="flex h-12 min-w-0 items-center gap-2.5 overflow-hidden rounded-[20px] bg-c10-sunken p-2 text-left transition-[background,transform] duration-150 hover:bg-c10-line active:scale-[.99]"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-c10-acc text-white">
                <FileText className="size-4" aria-hidden />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-px">
                <span className="truncate text-[13px] font-medium text-c10-title">{documento.nombre}</span>
                <span className="truncate text-[11px] text-c10-secondary">{archivo?.name}</span>
              </span>
              <span className="flex size-8 shrink-0 items-center justify-center text-c10-label">
                <ExternalLink className="size-4" aria-hidden />
              </span>
            </button>
            <Datos>
              {cumplimiento ? (
                <>
                  <Dato nombre="Contratista">{documento.dueno.empresa.nombre}</Dato>
                  <Dato nombre="Subido por">{versionActual(documento)?.subido_por}</Dato>
                </>
              ) : (
                <>
                  <Dato nombre="Propietario">{propietario(documento)}</Dato>
                  <Dato nombre="Mapeo">{documento.requerimiento?.nombre ?? "Sin mapeo"}</Dato>
                </>
              )}
            </Datos>
          </div>

          <Campo etiqueta="Comentarios" error={errorVacio}>
            <AreaTexto
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              maxLength={MAX_COMENTARIO}
              placeholder="Agrega un comentario (obligatorio para rechazar)"
              disabled={!!enviando}
            />
          </Campo>
          <Consejo>
            El comentario se agrega al documento y se notifica {cumplimiento ? "al contratista" : "a quien lo subió"}.
          </Consejo>
        </>
      )}
    </Modal>
  );
}
