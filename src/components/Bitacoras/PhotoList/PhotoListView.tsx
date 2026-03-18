'use client';

import { useState, useMemo, useEffect } from 'react';
import { Filter, ImageIcon, X } from 'lucide-react';
import { PhotoListCard } from './PhotoListCard';
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { PhotoListViewProps, ListRecord } from "@/types/bitacoras"
import { usePhotoListView } from "@/hooks/bitacora/usePhotoListView"
import { FiltersPanel } from "../PhotoGrid/PhotoGridFiltersPanel"
import { PhotoListCardModal } from "./PhotoListCardModal"

export default function PhotoListView({
  records,
  onRecordClick,
  children,
  filtersConfig,
  onSelectionChange,
  renderCustomActions,
  globalSearch = [],
}: PhotoListViewProps & { globalSearch?: string[] }) {
  const { filters, setFilters, filteredRecords: baseFilteredRecords, activeFiltersCount } = usePhotoListView(records as any);
  const [selectedItems, setSelectedItems] = useState<{ record_id: string; record_status: string }[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ListRecord | null>(null);

  const filteredRecords = useMemo(() => {
    const base = baseFilteredRecords as unknown as ListRecord[];
    if (!globalSearch || globalSearch.length === 0) return base;
    
    return base.filter(record => {
      return globalSearch.some(tag => {
        const tagLower = tag.toLowerCase();
        return (
          record.title?.toLowerCase().includes(tagLower) ||
          record.description?.toLowerCase().includes(tagLower) ||
          record.folio?.toLowerCase().includes(tagLower) ||
          record.status?.toLowerCase().includes(tagLower) ||
          record.detailsList?.some(detail => detail.value.toLowerCase().includes(tagLower)) ||
          record.modalDetailsList?.some(detail => detail.value.toLowerCase().includes(tagLower))
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
    <div className="flex h-full w-full bg-background flex-col">
      {selectedItems.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-primary/10 border-b border-primary/20 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={clearSelection}>
              <X className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              {selectedItems.length} {selectedItems.length === 1 ? "seleccionado" : "seleccionados"}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-2 h-8"
              onClick={() => {
                if (selectedItems.length === filteredRecords.length) {
                  clearSelection();
                } else {
                  const allSelected = (filteredRecords as any[]).map(r => ({
                    record_id: r.id,
                    record_status: r.status
                  }));
                  setSelectedItems(allSelected);
                }
              }}
            >
              {selectedItems.length === filteredRecords.length ? "Deseleccionar todos" : "Seleccionar todos"}
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
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((record) => (
                    <PhotoListCard
                      key={record.id}
                      record={record}
                      titleCard={record.title}
                      descriptionCard={record.description}
                      cardConfig={{
                        tagPosition: "sup-der",
                        folioTag: true,
                      }}
                      isSelected={selectedItems.some(i => i.record_id === record.id)}
                      onSelect={(rec) => {
                        setSelectedItems(prev => {
                          const exists = prev.some(i => i.record_id === rec.id);
                          if (exists) {
                            return prev.filter(i => i.record_id !== rec.id);
                          }
                          return [...prev, { record_id: rec.id, record_status: rec.status }];
                        });
                      }}
                      onClick={handleCardClick}
                    >
                      {children}
                    </PhotoListCard>
                  ))
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
