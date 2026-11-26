// F0-15 · Modales para ligar (empleados, requerimientos, contrato) y para notificar.
//   import { ModalLigarEmpleados, ModalNotificar, useResaltados } from "@/components/contratistas/ligar";
// Ficha: lkf-claude, knowledge/modules/contratistas/contratistas_f015_modal_ligar.md.
// Muestra: /dashboard/contratistas/ui-kit (bloque "Ligar y notificar").
// Los modales solo eligen: qué pasa al ligar es de cada pantalla (ME-05, ME-11, CF-02, MX-03).
export { ModalSeleccion, type FiltrosSeleccion, type ModalSeleccionProps } from "./ModalSeleccion";
export { ModalLigarEmpleados, type EmpleadoLigar, type ModalLigarEmpleadosProps } from "./ModalLigarEmpleados";
export {
  AMBITOS, ListaRequerimientos, ModalLigarRequerimientos, TIPOS_REQUERIMIENTO,
  type ListaRequerimientosProps, type ModalLigarRequerimientosProps,
} from "./ModalLigarRequerimientos";
export { TablaRequerimientos, type RequerimientoLigar, type TablaRequerimientosProps } from "./TablaRequerimientos";
export {
  ModalLigarContrato, type ContratoLigar, type LigarContratoResultado, type ModalLigarContratoProps,
} from "./ModalLigarContrato";
export {
  ModalNotificar, descripcionNotificar, motivoIncumplimiento, type DestinatarioNotificar, type ModalNotificarProps,
} from "./ModalNotificar";
export {
  Avatar, BarraBusqueda, BarraTodos, BotonTodos, ChipAmbito, ChipMas, ChipSeleccionados, ChipTipoRequerimiento, FilaSeleccion, Marca,
  MensajeVacio, Pasos, TarjetaOpcion,
} from "./piezas";
export {
  alternarUno, alternarVarios, ariaMarcado, cuantos, estadoDe, useAlAbrir, useGuardar, useResaltados, type EstadoGrupo,
} from "./seleccion";
