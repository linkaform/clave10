export interface FilterOption {
  label: string
  value: string
}

export interface FilterConfig {
  label: string
  type: "multiple" | "single"
  options: FilterOption[]
  key: string
}

export type PhotoStatus = "completado" | "en_proceso" | "cerrado" | "entrada" | "salida"

export interface PhotoRecord {
  id: string
  folio?: string
  title: string
  description: string
  images: string[]
  status: PhotoStatus
  detailsList?: DetailsListItem[]
  rawData?: any
}

export interface CardConfiguration {
  tagPosition?: "sup-izq" | "sup-der" | "inf-izq" | "inf-der"
  folioTag?: boolean
}

export interface DetailsListItem {
  icon: React.ReactNode
  value: string
}

export interface PhotoCardProps {
  titleCard?: string
  descriptionCard?: string
  record: PhotoRecord
  cardConfig: CardConfiguration
  onClick?: (record: PhotoRecord) => void
  children?: React.ReactNode | ((record: PhotoRecord) => React.ReactNode)
  isSelected?: boolean
  onSelect?: (record: PhotoRecord) => void
  isSelectionMode?: boolean
}

export interface PhotoGridViewProps {
  records: PhotoRecord[]
  onRecordClick?: (record: PhotoRecord) => void
  children?: React.ReactNode | ((record: PhotoRecord) => React.ReactNode)
  filtersConfig: FilterConfig[]
  onSelectionChange?: (selectedIds: string[]) => void
  renderCustomActions?: (selectedIds: string[]) => React.ReactNode
}

export interface FilterState {
  dynamic: Record<string, string | string[]>
}

export interface FiltersPanelProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  filtersConfig?: FilterConfig[]
}

export interface Visitor {
  id: string
  code: string
  name: string
  profile: string
  status: 'entrada' | 'salida'
  datetime: string
  visitTo: string
  visitToRole?: string
  visitToDepartment?: string
  company: string
  photo: string
  idPhoto?: string
  location: string
  caseta?: string
  passId?: string
  // Additional details for modal
  document?: string
  phone?: string
  email?: string
  vehicle?: string
  plates?: string
  authorizedBy?: string
  badge?: string
}

export interface Action {
  label: string
  icon?: React.ReactNode
  onClick: (selectedIds: string[]) => void
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
}