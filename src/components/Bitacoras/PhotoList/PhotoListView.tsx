"use client";

import { useState, useMemo, useEffect } from "react";
import { Filter, ImageIcon } from "lucide-react";
import { PhotoListCard } from "./PhotoListCard";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PhotoListViewProps, ListRecord } from "@/types/bitacoras";
import { usePhotoListView } from "@/hooks/bitacora/usePhotoListView";
import { SelectionBar } from "../SelectionBar";
import { FiltersPanel } from "../PhotoGrid/PhotoGridFiltersPanel";
import { PhotoListCardModal } from "./PhotoListCardModal";
import { FloatingFiltersDrawer } from "../PhotoGrid/FloatingFiltersDrawer";

export default function PhotoListView({
  isLoading,
  records,
  onRecordClick,
  children,
  filtersConfig,
  onSelectionChange,
  renderCustomActions,
  globalSearch = [],
}: PhotoListViewProps & { globalSearch?: string[] }) {
  const {
    filters,
    setFilters,
    filteredRecords: baseFilteredRecords,
    activeFiltersCount,
  } = usePhotoListView(records as any);
  const [selectedItems, setSelectedItems] = useState<
    { record_id: string; record_status: string }[]
  >([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ListRecord | null>(null);

  const filteredRecords = useMemo(() => {
    const base = baseFilteredRecords as unknown as ListRecord[];
    if (!globalSearch || globalSearch.length === 0) return base;

    return base.filter((record) => {
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
  }, [selectedItems, onSelectionChange]);

  const handleCardClick = (record: ListRecord) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
    onRecordClick?.(record as any);
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
            const allSelected = (filteredRecords as any[]).map((r) => ({
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
        <FloatingFiltersDrawer
          isOpen={isSidebarOpen}
          onOpenChange={setIsSidebarOpen}
          activeFiltersCount={activeFiltersCount}
          filters={filters}
          onFiltersChange={setFilters}
          filtersConfig={filtersConfig}
        />

        <section className="flex-1 flex flex-col min-w-0">
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
              <div className={"space-y-4w-full"}>
                {isLoading ? (
                  <div className="flex flex-col items-center gap-2 text-slate-300 h-96 w-full justify-center">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-100 border-t-slate-300" />
                    <span className="text-sm font-normal text-muted-foreground">
                      Cargando registros...
                    </span>
                  </div>
                ) : filteredRecords.length > 0 ? (
                  filteredRecords.map((record) => (
                    <PhotoListCard
                      key={record.id}
                      record={record}
                      titleCard={record.title}
                      descriptionCard={record.description}
                      isSelected={selectedItems.some(
                        (i) => i.record_id === record.id,
                      )}
                      onSelect={(rec) => {
                        setSelectedItems((prev) => {
                          const exists = prev.some(
                            (i) => i.record_id === rec.id,
                          );
                          if (exists) {
                            return prev.filter((i) => i.record_id !== rec.id);
                          }
                          return [
                            ...prev,
                            { record_id: rec.id, record_status: rec.status },
                          ];
                        });
                      }}
                      onClick={handleCardClick}>
                      {children}
                    </PhotoListCard>
                  ))
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
          </div>
        </section>
      </div>
      <PhotoListCardModal
        record={selectedRecord as any}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  );
}
