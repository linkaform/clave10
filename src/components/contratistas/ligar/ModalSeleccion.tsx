"use client";
// F0-15 · Marco de los modales de selección: título y contexto, aviso, buscador con
// filtros, "seleccionar todos", lista con scroll y pie con conteo. Las variantes
// (empleados, requerimientos) lo arman con sus filas.
// Diseño: plataforma.dc.html, clkVals (~5528) y template ~3388.
import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Boton, Consejo, Modal } from "../ui";
import { BarraBusqueda, MensajeVacio, type FiltrosSeleccion } from "./piezas";
import { useGuardar } from "./seleccion";

export type { FiltrosSeleccion };

export interface ModalSeleccionProps {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  /** Contexto bajo el título: "{objeto} #folio" o una frase. */
  descripcion?: ReactNode;
  /** Label azul: "Solo puedes ligar empleados activos registrados…". */
  aviso?: ReactNode;
  busqueda: string;
  onBusqueda: (q: string) => void;
  placeholder?: string;
  filtros?: FiltrosSeleccion;
  /** Junto al buscador (p. ej. el chip de seleccionados cuando no hay barra). */
  junto?: ReactNode;
  /** Fila de "seleccionar todos" (BarraTodos). */
  barra?: ReactNode;
  /** Las filas. */
  children: ReactNode;
  /** Sin filas visibles: mensaje centrado en lugar de la lista. */
  vacio?: string | false;
  seleccionados: number;
  /** Botón principal según cuántos van: "Ligar 3 empleados". */
  etiqueta: (n: number) => string;
  /** Toast al terminar: "Se ligaron 3 empleados al contrato". */
  exito: (n: number) => string;
  /** Guarda. Si regresa una promesa, el botón espera; si falla, el modal no se cierra. */
  onLigar: () => unknown;
  ancho?: number;
  alto?: number;
  /** La lista va en una tabla con su propio borde (requerimientos): otro padding. */
  claseCuerpo?: string;
}

export function ModalSeleccion({
  abierto, onCerrar, titulo, descripcion, aviso, busqueda, onBusqueda, placeholder = "Buscar", filtros, junto, barra,
  children, vacio, seleccionados: n, etiqueta, exito, onLigar, ancho = 640, alto = 680, claseCuerpo = "gap-1 px-4 pb-4 pt-3",
}: ModalSeleccionProps) {
  const g = useGuardar(onCerrar);

  return (
    <Modal
      abierto={abierto}
      onCerrar={g.cerrar}
      titulo={titulo}
      descripcion={descripcion}
      ancho={ancho}
      alto={alto}
      cabecera={
        <>
          {aviso && <Consejo>{aviso}</Consejo>}
          <BarraBusqueda valor={busqueda} onCambio={onBusqueda} placeholder={placeholder} filtros={filtros} despues={junto} />
          {barra}
        </>
      }
      claseCuerpo={claseCuerpo}
      pie={
        <>
          <Boton variante="cancelar" flex onClick={g.cerrar} disabled={g.guardando}>
            Cancelar
          </Boton>
          <Boton flex onClick={() => n && g.guardar(onLigar, exito(n))} disabled={!n || g.guardando}>
            {g.guardando && <Loader2 className="animate-spin" />}
            {etiqueta(n)}
          </Boton>
        </>
      }
    >
      {vacio ? <MensajeVacio>{vacio}</MensajeVacio> : children}
    </Modal>
  );
}
