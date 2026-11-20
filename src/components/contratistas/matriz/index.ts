// F0-12 · Motor de matriz. Punto de entrada para las pantallas (MX-01, ME-07,
// MX-04, MX-05).
export { Matriz, type MatrizProps } from "./Matriz";
export { MatrizCasillas, type MatrizCasillasProps, type FilaCasillas } from "./MatrizCasillas";
export { SelectorPeriodo, type ModoPeriodo } from "./SelectorPeriodo";
export { PopoverCelda } from "./PopoverCelda";
export { CeldaEstado, ChipsEstado, Casilla, IconoEstado } from "./piezas";
export * from "@/lib/contratistas/matriz";
export type * from "@/types/contratistas/matriz";
