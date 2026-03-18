"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { FiltersPanelProps } from "@/types/bitacoras"
import { useFiltersPanel } from "@/hooks/bitacora/useFiltersPanel"
import Multiselect from 'multiselect-react-dropdown'

export function FiltersPanel({
  filters,
  onFiltersChange,
  filtersConfig = []
}: FiltersPanelProps) {

  const { handleDynamicChange, clearFilters, hasActiveFilters } = useFiltersPanel(filters, onFiltersChange);

  return (
    <div className="flex flex-col gap-6">
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

      {filtersConfig.map((config, index) => {
        if (config.type === "multiselect") {
          const currentValues = (filters.dynamic[config.key] as string[]) || []
          // Convert current simple strings to the format expected by multiselect-react-dropdown
          const selectedItems = currentValues.map(v => ({ name: v, value: v }))

          return (
            <div key={config.key} className="flex flex-col gap-3">
              {index > 0 && <Separator />}
              <h3 className="text-sm font-medium text-foreground">{config.label}</h3>
              <Multiselect
                options={config.options.map(opt => ({ name: opt.label, value: opt.value }))}
                selectedValues={selectedItems}
                onSelect={(selectedList: any[]) => 
                  handleDynamicChange(config.key, selectedList.map(item => item.value), true, "multiselect")
                }
                onRemove={(selectedList: any[]) => 
                  handleDynamicChange(config.key, selectedList.map(item => item.value), true, "multiselect")
                }
                displayValue="name"
                placeholder={`Seleccionar ${config.label.toLowerCase()}`}
                style={{
                  chips: { background: "#2563eb", borderRadius: "8px", fontSize: "11px" },
                  searchBox: { borderRadius: "8px", border: "1px solid #e5e7eb", background: "transparent", padding: "4px 8px" },
                  optionContainer: { borderRadius: "8px", marginTop: "4px" },
                  inputField: { fontSize: "12px" }
                }}
              />
            </div>
          )
        }

        return (
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
        )
      })}
    </div>
  )
}
