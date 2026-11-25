// F0-06 · Filtros de Contratistas. Las pantallas importan de aquí:
//   import { ConFiltros, FiltroChips, FiltroFecha, useFiltros } from "@/components/contratistas/filtros";
// Ficha: lkf-claude, knowledge/modules/contratistas/contratistas_f006_filtros.md.
// Muestra: /dashboard/contratistas/ui-kit (bloque "Tabla, lista y cards").
export {
  ANCHO_PANEL, ChipOpcion, ConFiltros, FiltroChips, FiltroFecha, FiltroInterruptor, FiltroLista, FiltrosCabecera, GrupoFiltro,
  PastillaFiltros, type OpcionFiltro,
} from "./Filtros";
export { FECHA_TODOS, PERIODOS, enFecha, fechaActiva, rangoFecha, type FiltroFecha as ValorFecha, type Periodo } from "./fecha";
export { coincide, enLista, normal, useFiltros, type Filtros, type UsoFiltros, type ValorFiltro } from "./useFiltros";
