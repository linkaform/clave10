"use client";
// F0-15 · Notificar incumplimiento a uno o varios contratistas: destinatarios, motivo
// prellenado y editable, envío. Diseño: plataforma.dc.html, ccNtf (~2921, ~5891) y
// cmNtfVals (~5819, desde el detalle del contratista). El envío real (correo y portal) es de MX-03.
import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { AreaTexto, Boton, Campo, ChipEstado, Consejo, Etiqueta, Modal } from "../ui";
import { Avatar } from "./piezas";
import { cuantos, useAlAbrir, useGuardar } from "./seleccion";

export interface DestinatarioNotificar {
  id: string;
  razonSocial: string;
  representante: string;
  correo: string;
  /** Cuántas obligaciones no cumplió. */
  incumplimientos: number;
}

export interface ModalNotificarProps {
  abierto: boolean;
  onCerrar: () => void;
  /** Usa descripcionNotificar() o un texto propio. */
  descripcion: string;
  destinatarios: DestinatarioNotificar[];
  /** Texto con el que arranca el motivo (motivoIncumplimiento()). */
  motivoInicial: string;
  onEnviar: (motivo: string) => unknown;
}

export function ModalNotificar({ abierto, onCerrar, descripcion, destinatarios, motivoInicial, onEnviar }: ModalNotificarProps) {
  const [motivo, setMotivo] = useState(motivoInicial);
  const [intento, setIntento] = useState(false);
  const g = useGuardar(onCerrar);
  useAlAbrir(abierto, () => {
    setMotivo(motivoInicial);
    setIntento(false);
  });
  const vacio = !motivo.trim();
  const n = destinatarios.length;

  const enviar = () => {
    if (vacio) {
      setIntento(true);
      return;
    }
    g.guardar(
      () => onEnviar(motivo.trim()),
      n === 1 ? "Se envió la notificación" : `Se enviaron ${n} notificaciones`,
      "No se pudo enviar la notificación. Intenta de nuevo.",
    );
  };

  return (
    <Modal
      abierto={abierto}
      onCerrar={g.cerrar}
      titulo="Notificar incumplimiento"
      descripcion={descripcion}
      pie={
        <>
          <Boton variante="cancelar" flex onClick={g.cerrar} disabled={g.guardando}>
            Cancelar
          </Boton>
          <Boton flex onClick={enviar} disabled={g.guardando} icono={g.guardando ? <Loader2 className="animate-spin" /> : <Send />}>
            Enviar Notificación
          </Boton>
        </>
      }
    >
      <div className="flex flex-col gap-2">
        <Etiqueta>Destinatarios</Etiqueta>
        <ul className="m-0 flex max-h-[196px] list-none flex-col gap-1.5 overflow-y-auto p-0 [scrollbar-width:thin]">
          {destinatarios.map((d) => (
            <li key={d.id} className="flex items-center gap-2.5 rounded-[10px] bg-c10-panel px-2.5 py-2">
              <Avatar nombre={d.razonSocial} tam={32} />
              <span className="flex min-w-0 flex-1 flex-col gap-px">
                <span className="truncate text-sm font-medium text-c10-title">{d.razonSocial}</span>
                <span className="truncate text-xs text-c10-meta">
                  {d.representante} · {d.correo}
                </span>
              </span>
              <ChipEstado texto={cuantos(d.incumplimientos, "incumplimiento")} tono="danger" className="tabular-nums" />
            </li>
          ))}
        </ul>
      </div>
      <Campo etiqueta="Motivo" obligatorio error={intento && vacio && "Escribe el motivo"}>
        <AreaTexto
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Describe por qué no cumplió"
          className="min-h-[180px] leading-normal"
        />
      </Campo>
      <Consejo>Se enviará por correo al representante legal y aparecerá en el portal del contratista.</Consejo>
    </Modal>
  );
}

/**
 * Descripción del modal según cuántos son:
 *   uno:    "Avisa al contratista qué obligaciones no cumplió en octubre 2026."
 *   varios: "Se enviará una alerta a 3 contratistas por sus obligaciones incumplidas en octubre 2026."
 * Desde el detalle de un contratista (documento pendiente), pasa `documento`:
 *   "Avisa al contratista qué le falta cumplir en Opinión de cumplimiento IMSS."
 */
export function descripcionNotificar({
  cuantos: n, periodo, documento, sujeto = "contratista", plural = `${sujeto}s`,
}: { cuantos: number; periodo?: string; documento?: string; sujeto?: string; plural?: string }) {
  if (documento) return `Avisa al ${sujeto} qué le falta cumplir en ${documento}.`;
  return n === 1
    ? `Avisa al ${sujeto} qué obligaciones no cumplió en ${periodo}.`
    : `Se enviará una alerta a ${n} ${plural} por sus obligaciones incumplidas en ${periodo}.`;
}

/**
 * Motivo prellenado, como el diseño (msgFor). Con un contratista lista cada obligación
 * y su causa; con varios, un texto general.
 */
export function motivoIncumplimiento({
  periodo, representante, obligaciones,
}: { periodo: string; representante?: string; obligaciones?: { nombre: string; causa: string }[] }) {
  if (!representante || !obligaciones?.length) {
    return `Detectamos obligaciones incumplidas en el ejercicio ${periodo}.\n\nRevisa el detalle de cada una en tu portal y carga o corrige los documentos a la brevedad para mantener vigente tu cumplimiento.`;
  }
  const lista = obligaciones.map((o) => `• ${o.nombre}: ${o.causa}`).join("\n");
  return `Hola, ${representante.split(" ")[0]}:\n\nDetectamos obligaciones incumplidas en el ejercicio ${periodo}:\n${lista}\n\nPor favor, carga o corrige los documentos a la brevedad.`;
}
