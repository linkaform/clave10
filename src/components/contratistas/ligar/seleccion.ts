"use client";
// F0-15 · Lógica común de los modales de selección: seleccionar todos (con estado
// intermedio), alternar un grupo, reiniciar al abrir, guardar y resaltar lo recién ligado.
import { useCallback, useEffect, useRef, useState } from "react";
import { avisar } from "../ui";

export type EstadoGrupo = "nada" | "parcial" | "todos";

/** aria-checked de una casilla de "seleccionar todos". */
export const ariaMarcado = (e: EstadoGrupo) => (e === "parcial" ? "mixed" : e === "todos");

/**
 * Guardar desde un modal: espera a la pantalla (onLigar / onEnviar), avisa y cierra; si
 * falla, avisa en rojo y deja el modal abierto. Mientras guarda no se puede cerrar.
 *
 *   const g = useGuardar(onCerrar);
 *   <Modal onCerrar={g.cerrar} …>  ·  onClick={() => g.guardar(() => onLigar(sel), "Se ligó…")}
 */
export function useGuardar(onCerrar: () => void) {
  const [guardando, setGuardando] = useState(false);
  const enCurso = useRef(false);
  const guardar = async (fn: () => unknown, exito: string, fallo = "No se pudo guardar. Intenta de nuevo.") => {
    if (enCurso.current) return;
    enCurso.current = true;
    setGuardando(true);
    try {
      await fn();
      avisar(exito);
      onCerrar();
    } catch (e) {
      avisar(e instanceof Error && e.message ? e.message : fallo, "error");
    } finally {
      enCurso.current = false;
      setGuardando(false);
    }
  };
  const cerrar = () => {
    if (!enCurso.current) onCerrar();
  };
  return { guardando, guardar, cerrar };
}

/** ¿Cuántos de `ids` están seleccionados? Sin ids = "nada". */
export function estadoDe(ids: readonly string[], sel: readonly string[]): EstadoGrupo {
  const n = ids.filter((id) => sel.includes(id)).length;
  return !ids.length || !n ? "nada" : n === ids.length ? "todos" : "parcial";
}

/** Si todos los ids ya están, los quita; si no, agrega los que falten. Lo demás se respeta. */
export function alternarVarios(sel: readonly string[], ids: readonly string[]): string[] {
  const todos = ids.length > 0 && ids.every((id) => sel.includes(id));
  return todos ? sel.filter((id) => !ids.includes(id)) : [...new Set([...sel, ...ids])];
}

export const alternarUno = (sel: readonly string[], id: string): string[] =>
  sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id];

/**
 * Corre `reiniciar` cuando el modal pasa de cerrado a abierto, en el mismo render
 * (sin un cuadro con lo de la vez anterior). El modal sigue montado al cerrar para
 * que se vea su animación de salida.
 */
export function useAlAbrir(abierto: boolean, reiniciar: () => void) {
  const [antes, setAntes] = useState(abierto);
  if (abierto !== antes) {
    setAntes(abierto);
    if (abierto) reiniciar();
  }
}

/**
 * Resalta por un momento lo recién ligado en la lista de la pantalla (2.7 s, como el diseño).
 *
 *   const { resaltados, resaltar } = useResaltados();
 *   onLigar={(ids) => { guardar(ids); resaltar(ids); }}
 *   <tr className={resaltados.includes(r.id) ? "bg-c10-acc-subtle" : ""}>
 */
export function useResaltados(ms = 2700) {
  const [resaltados, setResaltados] = useState<string[]>([]);
  const t = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(t.current), []);
  const resaltar = useCallback(
    (ids: string[]) => {
      clearTimeout(t.current);
      setResaltados(ids);
      t.current = setTimeout(() => setResaltados([]), ms);
    },
    [ms],
  );
  return { resaltados, resaltar };
}

/** "1 empleado" / "3 empleados". */
export const cuantos = (n: number, singular: string, plural = `${singular}s`) => `${n} ${n === 1 ? singular : plural}`;
