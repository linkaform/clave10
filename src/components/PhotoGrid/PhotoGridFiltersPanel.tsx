"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { FilterConfig } from "@/types/bitacoras"

export interface FilterState {
  dynamic: Record<string, string | string[]>
}

interface FiltersPanelProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  filtersConfig?: FilterConfig[]
}

export function FiltersPanel({
  filters,
  onFiltersChange,
  filtersConfig = []
}: FiltersPanelProps) {
  const handleDynamicChange = (key: string, value: string, checked: boolean, type: "multiple" | "single") => {
    const currentDynamic = filters.dynamic || {}
    const currentValue = currentDynamic[key]

    let newValue: string | string[]
    if (type === "single") {
      newValue = checked ? value : ""
    } else {
      const currentArray = Array.isArray(currentValue) ? currentValue : []
      newValue = checked
        ? [...currentArray, value]
        : currentArray.filter((v) => v !== value)
    }

    onFiltersChange({
      ...filters,
      dynamic: { ...currentDynamic, [key]: newValue }
    })
  }

  const clearFilters = () => {
    onFiltersChange({ dynamic: {} })
  }

  const hasActiveFilters = Object.values(filters.dynamic || {}).some(v => 
    Array.isArray(v) ? v.length > 0 : v !== ""
  )

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

      {filtersConfig.map((config, index) => (
        <div key={config.key} className="flex flex-col gap-3">
          {index > 0 && <Separator />}
          <h3 className="text-sm font-medium text-foreground">{config.label}</h3>
          <div className="flex flex-col gap-2.5">
            {config.options.map((option) => {
              const currentValue = (filters.dynamic || {})[config.key]
              const isChecked = Array.isArray(currentValue)
                ? currentValue.includes(option.value)
                : currentValue === option.value

              return (
                <div key={option.value} className="flex items-center gap-2.5">
                  <Checkbox
                    id={`${config.key}-${option.value}`}
                    checked={isChecked}
                    onCheckedChange={(checked) =>
                      handleDynamicChange(config.key, option.value, checked as boolean, config.type)
                    }
                  />
                  <Label
                    htmlFor={`${config.key}-${option.value}`}
                    className="text-sm font-normal text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                  >
                    {option.label}
                  </Label>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
