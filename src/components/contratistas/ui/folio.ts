// F0-05 · Folios. Spec: contratistas_ui_spec.md §3.11. El back ya manda el folio
// armado ("C-142"); esto es para armarlo en el front cuando haga falta (mocks,
// registros nuevos antes de guardar) y para mostrarlo siempre igual.

export const PREFIJO_FOLIO = {
  documento: "D",
  empleado: "E",
  contrato: "C",
  cliente: "CL",
  contratista: "CT",
  activo: "A",
  falla: "F",
  incidencia: "I",
  mantenimiento: "M",
} as const;

export type EntidadFolio = keyof typeof PREFIJO_FOLIO;

/** folio("contrato", 142) → "C-142". Sin ceros a la izquierda. */
export const folio = (entidad: EntidadFolio, n: number | string) => `${PREFIJO_FOLIO[entidad]}-${Number(n)}`;

/** Como se muestra junto al nombre: "#C-142". */
export const textoFolio = (f: string) => `#${f.replace(/^#/, "")}`;
