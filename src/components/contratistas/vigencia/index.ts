// F0-14 · Selector de vigencia / recurrencia. Tres variantes con piezas comunes:
//   - <VigenciaRequerimiento> · Nuevo Requerimiento, paso 2 (documento, inspección, examen)
//   - <ProgramacionSesion>    · Nueva Sesión (fecha, horario, repetición y término)
//   - <RecurrenciaContrato>   · Nuevo Contrato, sección Recurrencia
// Cada una trae su valor inicial, sus errores y su texto de resumen en ./textos.
// Muestra: /dashboard/contratistas/ui-kit (bloque "Vigencia y recurrencia").
export { VigenciaRequerimiento, type VigenciaRequerimientoProps } from "./VigenciaRequerimiento";
export { ProgramacionSesion, type ProgramacionSesionProps } from "./ProgramacionSesion";
export { RecurrenciaContrato, type RecurrenciaContratoProps } from "./RecurrenciaContrato";
export { EditorRecurrencia } from "./EditorRecurrencia";
export { CadaUnidad, Fila, FrecuenciaHoras, Grupo, Hora, Numero, PanelVigencia, Pastillas, Segmentado, type OpcionSegmento } from "./piezas";
export * from "./textos";
export * from "./back";
