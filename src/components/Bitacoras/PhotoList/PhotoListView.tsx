"use client";

import { useState, useMemo, useEffect } from "react";
import { ImageIcon } from "lucide-react";
import { PhotoListCard } from "./PhotoListCard";
import { PhotoListViewProps, ListRecord } from "@/types/bitacoras";
import { usePhotoListView } from "@/hooks/bitacora/usePhotoListView";
import { SelectionBar } from "../SelectionBar";
import { PhotoListCardModal } from "./PhotoListCardModal";
import EquiposYVehiculosList from "../EquiposYVehiculosList";
import { PhotoRondinCardModal } from "./PhotoRondinCardModal";

interface MapItem {
  nombre_area: string;
  geolocation_area?: {
    latitude: number;
    longitude: number;
  };
  id: string;
}

export default function PhotoListView({
  isLoading,
  records,
  onRecordClick,
  children,
  onSelectionChange,
  selectionActions,
  externalFilters,
  onExternalFiltersChange,
  globalSearch = [],
  getMapData,
  modalType = "normal",
}: Omit<
  PhotoListViewProps,
  "filtersConfig" | "hideSidebar" | "renderCustomActions"
> & {
  globalSearch?: string[];
  selectionActions?:
    | React.ReactNode
    | ((
        selectedItems: { record_id: string; record_status: string }[],
      ) => React.ReactNode);
  /** Opcional — solo en rondines. Recibe el record seleccionado y devuelve los puntos del mapa */
  getMapData?: (record: ListRecord) => MapItem[] | undefined;
  /** "rondines" usa PhotoRondinCardModal, "normal" usa PhotoListCardModal (default) */
  modalType?: "rondines" | "normal";
}) {
  const { filteredRecords: baseFilteredRecords, activeFiltersCount } =
    usePhotoListView(records as any, externalFilters, onExternalFiltersChange);
  const [selectedItems, setSelectedItems] = useState<
    { record_id: string; record_status: string }[]
  >([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ListRecord | null>(null);

  const filteredRecords = useMemo(() => {
    const base = baseFilteredRecords as unknown as ListRecord[];
    if (!globalSearch || globalSearch.length === 0) return base;

    return base.filter((record) => {
      return globalSearch.some((tag) => {
        const tagLower = tag.toLowerCase();
        return (
          record.title?.toString().toLowerCase().includes(tagLower) ||
          record.description?.toString().toLowerCase().includes(tagLower) ||
          record.folio?.toString().toLowerCase().includes(tagLower) ||
          record.status?.toString().toLowerCase().includes(tagLower) ||
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

  // Calcular mapData para el record seleccionado (solo si getMapData viene definido)
  const currentMapData = selectedRecord && getMapData
    ? getMapData(selectedRecord)
    : undefined;

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
        selectionActions={selectionActions}
        selectedItems={selectedItems}
      />

      <div className="flex flex-1 min-h-0 relative z-0">
        <section className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto">
            <div>
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
                      mapData={getMapData ? getMapData(record) : undefined}
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

      {modalType === "rondines" ? (
        <PhotoRondinCardModal
          record={selectedRecord as any}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          mapData={currentMapData}
        />
      ) : (
        <PhotoListCardModal
          record={selectedRecord as any}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
        >
          <EquiposYVehiculosList record={selectedRecord as any} />
        </PhotoListCardModal>
      )}
    </div>
  );
}