"use client"

import { useState, useMemo } from "react"
import { PhotoGridCard } from "./PhotoGridCard"
import { PhotoRecord } from "@/types/bitacoras"
import { FiltersPanel, type FilterState } from "./PhotoGridFiltersPanel"
import { FilterConfig } from "@/types/bitacoras"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Filter, ImageIcon } from "lucide-react"

interface PhotoGridViewProps {
  records: PhotoRecord[]
  title?: string
  onRecordClick?: (record: PhotoRecord) => void
  children?: React.ReactNode | ((record: PhotoRecord) => React.ReactNode)
  filtersConfig: FilterConfig[]
}

export function PhotoGridView({
  records,
  onRecordClick,
  children,
  filtersConfig,
}: PhotoGridViewProps) {
  const [filters, setFilters] = useState<FilterState>({
    dynamic: {}
  })

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const dynamicMatch = Object.entries(filters.dynamic || {}).every(([key, value]) => {
        if (!value || (Array.isArray(value) && value.length === 0)) return true
        
        let recordValue = record.rawData?.[key] || record[key as keyof PhotoRecord]

        // Handle specific case for visita_a which is an array of objects
        if (key === "visita_a" && Array.isArray(recordValue)) {
          recordValue = recordValue[0]?.nombre || ""
        }

        if (Array.isArray(value)) {
          return value.includes(String(recordValue))
        }
        return String(recordValue) === String(value)
      })

      return dynamicMatch
    })
  }, [records, filters])

  const activeFiltersCount = Object.values(filters.dynamic || {}).reduce((acc: number, curr) => {
    if (Array.isArray(curr)) return acc + curr.length
    return acc + (curr ? 1 : 0)
  }, 0)

  return (
    <div className="flex h-full w-full bg-background">
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border bg-card">
        <ScrollArea className="flex-1 p-5">
          <FiltersPanel
            filters={filters}
            onFiltersChange={setFilters}
            filtersConfig={filtersConfig}
          />
        </ScrollArea>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="lg:hidden">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {activeFiltersCount > 0 && (
                <span className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-5">
            <FiltersPanel
              filters={filters}
              onFiltersChange={setFilters}
              filtersConfig={filtersConfig}
            />
          </SheetContent>
        </Sheet>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {filteredRecords.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2">
                {filteredRecords.map((record) => (
                  <PhotoGridCard
                    titleCard={record.title}
                    descriptionCard={record.description}
                    key={record.id}
                    record={record}
                    cardConfig={{
                      tagPosition: "sup-der",
                      folioTag: true,
                    }}
                    onClick={onRecordClick}
                  >
                    {children}
                  </PhotoGridCard>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground">No hay registros</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  {activeFiltersCount > 0
                    ? "No se encontraron registros con los filtros seleccionados"
                    : "No hay registros disponibles"}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
