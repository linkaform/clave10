"use client"

import { useState, useMemo } from "react"
import { PhotoGridCard, type PhotoRecord } from "./PhotoGridCard"
import { FiltersPanel, type FilterState } from "./PhotoGridFiltersPanel"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Car, Eye, Filter, Forward, Hammer, IdCard, ImageIcon, Printer } from "lucide-react"

interface PhotoGridViewProps {
  records: PhotoRecord[]
  title?: string
  onRecordClick?: (record: PhotoRecord) => void
}

export function PhotoGridView({
  records,
  onRecordClick,
}: PhotoGridViewProps) {
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    locations: [],
  })

  // Extract unique locations from records
  const availableLocations = useMemo(() => {
    const locations = new Set(records.map((r) => r?.rawData?.ubicacion))
    return Array.from(locations).sort()
  }, [records])

  // Extract unique statuses from records
  const availableStatuses = useMemo(() => {
    const statuses = new Set(records.map((r) => r.status))
    return Array.from(statuses)
  }, [records])

  // Filter records based on active filters
  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const statusMatch =
        filters.status.length === 0 || filters.status.includes(record.status)
      const locationMatch =
        filters.locations.length === 0 ||
        filters.locations.includes(record?.rawData?.ubicacion)
      return statusMatch && locationMatch
    })
  }, [records, filters])

  const activeFiltersCount = filters.status.length + filters.locations.length

  return (
    <div className="flex h-full w-full bg-background">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border bg-card">
        <ScrollArea className="flex-1 p-5">
          <FiltersPanel
            filters={filters}
            onFiltersChange={setFilters}
            availableLocations={availableLocations}
            availableStatuses={availableStatuses}
          />
        </ScrollArea>
      </aside>

      {/* Main Content */}
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
              availableLocations={availableLocations}
              availableStatuses={availableStatuses}
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
                    <div className="flex gap-2">
                      <Eye className="w-5 h-5" />
                      <Car className="w-5 h-5" />
                      <Hammer className="w-5 h-5" />
                      <IdCard className="w-5 h-5" />
                      <Printer className="w-5 h-5" />
                      <Forward className="w-5 h-5 text-emerald-500" />
                    </div>
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
