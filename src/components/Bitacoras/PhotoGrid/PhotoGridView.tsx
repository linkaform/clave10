"use client";

import { useState, useEffect, useMemo } from "react";
import { PhotoGridCard } from "./PhotoGridCard";
import { FiltersPanel } from "./PhotoGridFiltersPanel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Filter, ImageIcon, X } from "lucide-react";
import { PhotoGridViewProps, PhotoRecord } from "@/types/bitacoras";
import { usePhotoGridView } from "@/hooks/bitacora/usePhotoGridView";
import { PhotoGridCardModal } from "./PhotoGridCardModal";

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
          record.detailsList?.some((detail) =>
            detail.value.toLowerCase().includes(tagLower),
          ) ||
          record.modalDetailsList?.some((detail) =>
            detail.value.toLowerCase().includes(tagLower),
          )
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-2 text-slate-300 h-96 w-full justify-center">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-100 border-t-slate-300" />
        <span className="text-xs font-normal">Cargando registros...</span>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-background flex-col">
      {selectedItems.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-primary/10 border-b border-primary/20 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={clearSelection}>
              <X className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              {selectedItems.length}{" "}
              {selectedItems.length === 1 ? "seleccionado" : "seleccionados"}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="ml-2 h-8"
              onClick={() => {
                if (selectedItems.length === filteredRecords.length) {
                  clearSelection();
                } else {
                  const allSelected = filteredRecords.map((r) => ({
                    record_id: r.id,
                    record_status: r.status,
                  }));
                  setSelectedItems(allSelected);
                }
              }}>
              {selectedItems.length === filteredRecords.length
                ? "Deseleccionar todos"
                : "Seleccionar todos"}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {renderCustomActions && renderCustomActions(selectedItems)}
          </div>
        </div>
      )}
      <div className="flex flex-1 min-h-0">
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
