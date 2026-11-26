// F0-05 · UI kit de Contratistas. Las pantallas del módulo importan de aquí:
//   import { Boton, Modal, avisar, ChipEstado } from "@/components/contratistas/ui";
// Estilo: lkf-claude, knowledge/modules/contratistas/contratistas_ui_spec.md.
// Muestra de todas las piezas: /dashboard/contratistas/ui-kit
export { Boton, BotonIcono, VerMas, type BotonProps, type BotonIconoProps, type VarianteBoton } from "./Boton";
export { AreaTexto, Buscador, Campo, Casilla, Consejo, Entrada, Etiqueta, Selector, type Opcion } from "./Campo";
export { CLASE_CHIP, ChipEstado, ChipFiltro, ChipFolio, ChipKpi, ChipPrioridad, ChipTipo } from "./Chip";
export { Modal, ModalConfirmar, type ModalConfirmarProps, type ModalProps } from "./Modal";
export { avisar, tipoDe, type TipoAviso } from "./Toast";
export { PREFIJO_FOLIO, folio, textoFolio, type EntidadFolio } from "./folio";
export { PRIORIDAD_TONO, TONO, type Prioridad, type Tono } from "./tonos";
export { Tabla, type TablaProps } from "./tabla/Tabla";
export { Paginacion, paginasVisibles } from "./tabla/Paginacion";
export { POR_PAGINA, useTabla } from "./tabla/useTabla";
export {
  BarraSeleccion, BotonBarra, BotonFlotante, EstadoVacio, SelectorVista, Tarjeta, VISTAS, tipoVacio, useVista,
  type TipoVacio, type Vista,
} from "./tabla/Listado";
export {
  BarraCumplimiento, BotonCopiar, ColumnaLista, DatoLista, FilaDato, RejillaCards, SinImagen, TarjetaCompacta, TarjetaLista,
  type SeleccionCard,
} from "./tabla/Tarjetas";
