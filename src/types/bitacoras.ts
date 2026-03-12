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
}