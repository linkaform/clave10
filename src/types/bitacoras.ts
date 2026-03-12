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