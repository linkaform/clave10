export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  defaultDisplayOpen?: boolean;
  label: string;
  type: "multiple" | "single" | "search" | "multiselect";
  options: FilterOption[];
  storeLocations?: string[];
  key: string;
}

export type PhotoStatus =
  | "completado"
  | "en_proceso"
  | "cerrado"
  | "entrada"
  | "salida";
export type ListStatus =
  | "completado"
  | "en_proceso"
  | "cerrado"
  | "entrada"
  | "salida";

export interface PhotoRecord {
  id: string;
  folio?: string;
  visit_type?: string;
  title: string;
  description: string;
  images: string[];
  status: PhotoStatus;
  detailsList?: DetailsListItem[];
  modalDetailsList?: DetailsListItem[];
  rawData?: any;
  vehiculos?: Vehiculo[];
  equipos?: Equipo[];
}

export interface Vehiculo {
  tipo: string;
  marca_vehiculo: string;
  modelo_vehiculo: string;
  placas: string;
  color: string;
  nombre_estado: string;
  color_code?: string;
  imagen?: string;
}

export interface Equipo {
  tipo_equipo: string;
  marca_articulo: string;
  modelo_articulo: string;
  nombre_articulo: string;
  numero_serie: string;
  color_articulo: string;
  color_code?: string;
  imagen?: string;
}

export interface ListRecord {
  id: string;
  folio?: string;
  visit_type?: string;
  title: string;
  description: string;
  images: string[];
  status: PhotoStatus;
  badgesList?: BadgesListItem[];
  detailsList?: DetailsListItem[];
  modalDetailsList?: DetailsListItem[];
  vehiculos?: Vehiculo[];
  equipos?: Equipo[];
  rawData?: any;
}

export interface CardConfiguration {
  tagPosition?: "sup-izq" | "sup-der" | "inf-izq" | "inf-der";
  folioTag?: boolean;
}

export interface BadgesListItem {
  label: string;
  customClass?: string;
}

export interface DetailsListItem {
  label?: string;
  icon: React.ReactNode;
  value: string | string[];
  customClass?: string;
}

export interface PhotoCardProps {
  headerBadge?: string;
  titleCard?: string;
  descriptionCard?: string;
  record: PhotoRecord;
  cardConfig?: CardConfiguration;
  onClick?: (record: any) => void;
  children?: React.ReactNode | ((record: any) => React.ReactNode);
  isSelected?: boolean;
  onSelect?: (record: any) => void;
  isSelectionMode?: boolean;
}

export interface ListCardProps {
  titleCard?: string;
  descriptionCard?: string;
  record: ListRecord;
  cardConfig?: CardConfiguration;
  onClick?: (record: any) => void;
  children?: React.ReactNode | ((record: any) => React.ReactNode);
  isSelected?: boolean;
  onSelect?: (record: any) => void;
  isSelectionMode?: boolean;
}

export interface PhotoListViewProps {
  isLoading?: boolean;
  records: PhotoRecord[];
  onRecordClick?: (record: PhotoRecord) => void;
  children?: React.ReactNode | ((record: PhotoRecord) => React.ReactNode);
  filtersConfig: FilterConfig[];
  externalFilters?: FilterState;
  onExternalFiltersChange?: (filters: FilterState) => void;
  hideSidebar?: boolean; // Nueva prop
  onSelectionChange?: (
    selectedItems: { record_id: string; record_status?: string }[],
  ) => void;
  renderCustomActions?: (
    selectedItems: { record_id: string; record_status?: string }[],
  ) => React.ReactNode;
}

export interface PhotoGridViewProps {
  isLoading?: boolean;
  records: PhotoRecord[];
  onRecordClick?: (record: PhotoRecord) => void;
  children?: React.ReactNode | ((record: PhotoRecord) => React.ReactNode);
  filtersConfig: FilterConfig[];
  externalFilters?: FilterState;
  onExternalFiltersChange?: (filters: FilterState) => void;
  hideSidebar?: boolean; // Nueva prop
  onSelectionChange?: (
    selectedItems: { record_id: string; record_status?: string }[],
  ) => void;
  renderCustomActions?: (
    selectedItems: { record_id: string; record_status?: string }[],
  ) => React.ReactNode;
}

export interface FilterState {
  dynamic: Record<string, string | string[]>;
  dateFilter?: string;
  date1?: Date | "";
  date2?: Date | "";
}

export interface FiltersPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  filtersConfig?: FilterConfig[];
}

export interface Visitor {
  id: string;
  code: string;
  name: string;
  profile: string;
  status: "entrada" | "salida";
  datetime: string;
  visitTo: string;
  visitToRole?: string;
  visitToDepartment?: string;
  company: string;
  photo: string;
  idPhoto?: string;
  location: string;
  caseta?: string;
  passId?: string;
  // Additional details for modal
  document?: string;
  phone?: string;
  email?: string;
  vehicle?: string;
  plates?: string;
  authorizedBy?: string;
  badge?: string;
}

export interface Action {
  label: string;
  icon?: React.ReactNode;
  onClick: (
    selectedItems: { record_id: string; record_status?: string }[],
  ) => void;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
}
