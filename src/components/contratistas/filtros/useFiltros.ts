"use client";
// F0-06 · Estado de los filtros de una pantalla: valores, contador, limpiar y atajos por URL.
//
//   const f = useFiltros({ estatus: [] as string[], fecha: FECHA_TODOS, conUsuario: false });
//   f.valores.estatus · f.poner("estatus", [...]) · f.cuenta · f.limpiar()
//
// Cada filtro es una lista (chips o lista con "x"), una fecha o un interruptor.
// Se aplican al instante, sin botón "Aplicar".
import { useCallback, useEffect, useMemo, useState } from "react";
import { FECHA_TODOS, PERIODOS, fechaActiva, type FiltroFecha, type Periodo } from "./fecha";

export type ValorFiltro = string[] | FiltroFecha | boolean;
export type Filtros = Record<string, ValorFiltro>;

/** `conUsuario: false` se infiere como `false`; aquí se ensancha a boolean. */
type Valores<T> = { [K in keyof T]: T[K] extends boolean ? boolean : T[K] };

const esFecha = (v: ValorFiltro): v is FiltroFecha => typeof v === "object" && !Array.isArray(v);

/**
 * ¿El filtro suma al contador? Cuenta grupos con selección, no valores (ficha F0-06):
 * Estatus con Activo e Inactivo suma 1. Igual la fecha distinta de "Todos" y el interruptor prendido.
 */
const puesto = (v: ValorFiltro) => (Array.isArray(v) ? v.length > 0 : esFecha(v) ? fechaActiva(v) : v);

/**
 * Atajos del menú ("Activos", "Vencidos"…): la pantalla se abre con el filtro puesto por la URL.
 *   ?estatus=Activo,Por%20vencer  → lista
 *   ?fecha=Este%20mes             → fecha (o ?fecha=Personalizado&desde=2026-01-01&hasta=2026-01-31)
 *   ?usuario=1                    → interruptor
 * Solo se leen las llaves que existen en `inicial`; lo demás de la URL se ignora.
 */
function deUrl<T extends Filtros>(inicial: T, q: URLSearchParams): Partial<T> {
  const out: Partial<Record<keyof T, ValorFiltro>> = {};
  for (const k of Object.keys(inicial) as (keyof T & string)[]) {
    const crudo = q.get(k);
    if (crudo == null) continue;
    const base = inicial[k];
    if (Array.isArray(base)) out[k] = crudo.split(",").map((s) => s.trim()).filter(Boolean);
    else if (esFecha(base)) {
      if ((PERIODOS as readonly string[]).includes(crudo)) out[k] = { periodo: crudo as Periodo, desde: q.get("desde") ?? "", hasta: q.get("hasta") ?? "" };
    } else out[k] = crudo === "1" || crudo === "true";
  }
  return out as Partial<T>;
}

export function useFiltros<T extends Filtros>(inicial: T, { url = true }: { url?: boolean } = {}) {
  const [valores, setValores] = useState<Valores<T>>(inicial as Valores<T>);

  // La URL se lee después de montar para que el HTML del servidor y el del navegador coincidan
  useEffect(() => {
    if (!url) return;
    const desdeUrl = deUrl(inicial, new URLSearchParams(window.location.search)) as Partial<Valores<T>>;
    if (Object.keys(desdeUrl).length) setValores((v) => ({ ...v, ...desdeUrl }));
    // solo al entrar a la pantalla
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const poner = useCallback(<K extends keyof T>(k: K, v: Valores<T>[K]) => setValores((s) => ({ ...s, [k]: v })), []);

  /** Prende o apaga un valor de un filtro de lista (chips). */
  const alternar = useCallback(<K extends keyof T>(k: K, valor: string) => {
    setValores((s) => {
      const a = s[k] as unknown as string[];
      return { ...s, [k]: a.includes(valor) ? a.filter((x) => x !== valor) : [...a, valor] };
    });
  }, []);

  const vacio = useMemo(
    () => Object.fromEntries(Object.entries(inicial).map(([k, v]) => [k, Array.isArray(v) ? [] : esFecha(v) ? FECHA_TODOS : false])) as Valores<T>,
    // la forma de los filtros no cambia
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const limpiar = useCallback(() => setValores(vacio), [vacio]);

  const cuenta = useMemo(() => Object.values(valores as Filtros).filter(puesto).length, [valores]);

  return { valores, poner, alternar, limpiar, cuenta, activos: cuenta > 0 };
}

export type UsoFiltros<T extends Filtros = Filtros> = ReturnType<typeof useFiltros<T>>;

/** Para comparar en el buscador y en los filtros: sin acentos, sin mayúsculas, espacios simples. */
export const normal = (s: unknown) =>
  String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

/** ¿Alguno de los textos contiene la búsqueda? Búsqueda vacía = todo coincide. */
export const coincide = (q: string, ...textos: unknown[]) => {
  const t = normal(q);
  return !t || textos.some((x) => normal(x).includes(t));
};

/** Filtro de lista vacío = todo pasa. */
export const enLista = (elegidos: string[], valor: string | null | undefined) => !elegidos.length || (valor != null && elegidos.includes(valor));
