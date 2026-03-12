"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import type { PhotoStatus } from "./PhotoGridCard"

export interface FilterState {
  status: PhotoStatus[]
  locations: string[]
}

interface FiltersPanelProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  availableLocations: string[]
  availableStatuses: PhotoStatus[]
}

const statusOptions: { value: PhotoStatus; label: string }[] = [
  { value: "completado", label: "Completado" },
  { value: "en_proceso", label: "En Proceso" },
  { value: "cerrado", label: "Cerrado" },
  { value: "entrada", label: "Entrada" },
  { value: "salida", label: "Salida" },
]

export function FiltersPanel({
  filters,
  onFiltersChange,
  availableLocations,
  availableStatuses,
}: FiltersPanelProps) {
  const handleStatusChange = (status: PhotoStatus, checked: boolean) => {
    const newStatus = checked
      ? [...filters.status, status]
      : filters.status.filter((s) => s !== status)
    onFiltersChange({ ...filters, status: newStatus })
  }

  const handleLocationChange = (location: string, checked: boolean) => {
    const newLocations = checked
      ? [...filters.locations, location]
      : filters.locations.filter((l) => l !== location)
    onFiltersChange({ ...filters, locations: newLocations })
  }

  const clearFilters = () => {
    onFiltersChange({ status: [], locations: [] })
  }

  const hasActiveFilters = filters.status.length > 0 || filters.locations.length > 0

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Filtros</h2>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3 mr-1" />
            Limpiar
          </Button>
        )}
      </div>
      
      <Separator />

      {/* Status Filter */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-medium text-foreground">Estatus</h3>
        <div className="flex flex-col gap-2.5">
          {statusOptions
            .filter((option) => availableStatuses.includes(option.value))
            .map((option) => (
              <div key={option.value} className="flex items-center gap-2.5">
                <Checkbox
                  id={`status-${option.value}`}
                  checked={filters.status.includes(option.value)}
                  onCheckedChange={(checked) =>
                    handleStatusChange(option.value, checked as boolean)
                  }
                />
                <Label
                  htmlFor={`status-${option.value}`}
                  className="text-sm font-normal text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                >
                  {option.label}
                </Label>
              </div>
            ))}
        </div>
      </div>

      <Separator />

      {/* Location Filter */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-medium text-foreground">Ubicación</h3>
        <div className="flex flex-col gap-2.5">
          {availableLocations.map((location) => (
            <div key={location} className="flex items-center gap-2.5">
              <Checkbox
                id={`location-${location}`}
                checked={filters.locations.includes(location)}
                onCheckedChange={(checked) =>
                  handleLocationChange(location, checked as boolean)
                }
              />
              <Label
                htmlFor={`location-${location}`}
                className="text-sm font-normal text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
              >
                {location}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
