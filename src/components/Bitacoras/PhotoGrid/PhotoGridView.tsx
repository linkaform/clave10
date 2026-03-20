"use client";

import { useState, useEffect, useMemo } from "react";
import { PhotoGridCard } from "./PhotoGridCard";
import { FiltersPanel } from "./PhotoGridFiltersPanel";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Filter, ImageIcon } from "lucide-react";
import { PhotoGridViewProps, PhotoRecord } from "@/types/bitacoras";
import { usePhotoGridView } from "@/hooks/bitacora/usePhotoGridView";
import { SelectionBar } from "../SelectionBar";
import { PhotoGridCardModal } from "./PhotoGridCardModal";
import { FloatingFiltersDrawer } from "./FloatingFiltersDrawer";

export function PhotoGridView({
  isLoading,
  records,
  onRecordClick,
  children,
  filtersConfig,
  onSelectionChange,
  renderCustomActions,
  globalSearch = [],
}: PhotoGridViewProps & { globalSearch?: string[] }) {
  const {
    filters,
    setFilters,
    filteredRecords: baseFilteredRecords,
    activeFiltersCount,
  } = usePhotoGridView(records);
  const [selectedItems, setSelectedItems] = useState<
    { record_id: string; record_status: string }[]
  >([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PhotoRecord | null>(
    null,
  );

  const filteredRecords = useMemo(() => {
    if (!globalSearch || globalSearch.length === 0) return baseFilteredRecords;

    return baseFilteredRecords.filter((record) => {
      // Lógica OR: Si el registro coincide con AL MENOS UNO de los tags
      return globalSearch.some((tag) => {
        const tagLower = tag.toLowerCase();
        return (
          record.title?.toLowerCase().includes(tagLower) ||
          record.description?.toLowerCase().includes(tagLower) ||
          record.folio?.toLowerCase().includes(tagLower) ||
          record.status?.toLowerCase().includes(tagLower) ||
          record.detailsList?.some((detail) => {
            if (Array.isArray(detail.value)) {
              return detail.value.some((val) =>
                val?.toString().toLowerCase().includes(tagLower),
              );
            }
            return detail.value?.toString().toLowerCase().includes(tagLower);
          }) ||
          record.modalDetailsList?.some((detail) => {
            if (Array.isArray(detail.value)) {
              return detail.value.some((val) =>
                val?.toString().toLowerCase().includes(tagLower),
              );
            }
            return detail.value?.toString().toLowerCase().includes(tagLower);
          })
        );
      });
    });
  }, [baseFilteredRecords, globalSearch]);

  useEffect(() => {
    onSelectionChange?.(selectedItems);
    if (selectedItems.length > 0) {
      console.log("Registros seleccionados:", selectedItems);
    }
  }, [selectedItems, onSelectionChange]);

  const handleSelect = (record: PhotoRecord) => {
    setSelectedItems((prev) =>
      prev.some((item) => item?.record_id === record?.id)
        ? prev.filter((item) => item?.record_id !== record?.id)
        : [...prev, { record_id: record?.id, record_status: record?.status }],
    );
  };

  const handleCardClick = (record: PhotoRecord) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
    onRecordClick?.(record);
  };

  const clearSelection = () => setSelectedItems([]);

  return (
    <div className="flex h-full w-full bg-background flex-col relative overflow-hidden">
      <SelectionBar
        selectedCount={selectedItems.length}
        totalVisible={filteredRecords.length}
        onClear={clearSelection}
        onSelectAll={() => {
          if (selectedItems.length === filteredRecords.length) {
            clearSelection();
          } else {
            const allSelected = filteredRecords.map((r) => ({
              record_id: r.id,
              record_status: r.status,
            }));
            setSelectedItems(allSelected);
          }
        }}
        renderCustomActions={renderCustomActions}
        selectedItems={selectedItems}
      />
      <div className="flex flex-1 min-h-0 relative z-50">
        {/* Componente de Filtros Flotantes */}
        <FloatingFiltersDrawer
          isOpen={isSidebarOpen}
          onOpenChange={setIsSidebarOpen}
          activeFiltersCount={activeFiltersCount}
          filters={filters}
          onFiltersChange={setFilters}
          filtersConfig={filtersConfig}
        />

        <main className="flex-1 flex flex-col min-w-0 transition-all duration-300">
          <div className="lg:hidden p-4 border-b">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
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
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {isLoading ? (
                <div className="flex flex-col items-center gap-2 text-slate-300 h-96 w-full justify-center">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-100 border-t-slate-300" />
                  <span className="text-sm font-normal text-muted-foreground">
                    Cargando registros...
                  </span>
                </div>
              ) : filteredRecords.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2">
                  {filteredRecords.map((record) => (
                    <PhotoGridCard
                      headerBadge={record.visit_type}
                      titleCard={record.title}
                      descriptionCard={record.description}
                      key={record.id}
                      record={record}
                      cardConfig={{
                        tagPosition: "sup-der",
                        folioTag: true,
                      }}
                      onClick={handleCardClick}
                      isSelected={selectedItems.some(
                        (item) => item.record_id === record.id,
                      )}
                      onSelect={handleSelect}>
                      {children}
                    </PhotoGridCard>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground">
                    No hay registros
                  </h3>
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
      <PhotoGridCardModal
        record={selectedRecord}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  );
}
