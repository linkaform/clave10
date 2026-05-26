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
import { ViewIncidenciaModal } from "../PhotoGrid/PhotoGridCardModalIncidencia";
import { CustomSpinner } from "@/components/custom-spinner";

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
  modalActions
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
  getMapData?: (record: ListRecord) => MapItem[] | undefined;
  /** "rondines" usa PhotoRondinCardModal, "normal" usa PhotoListCardModal (default) */
  modalType?: "rondines" | "normal"| "incidencia" ;
}) {
  const { filteredRecords: baseFilteredRecords, activeFiltersCount } =
    usePhotoListView(records as any, externalFilters, onExternalFiltersChange);
  const [selectedItems, setSelectedItems] = useState<
    { record_id: string; record_status: string }[]
  >([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ListRecord | null>(null);
  const [selectedChildren, setSelectedChildren] = useState<React.ReactNode>(null);

  const filteredRecords = useMemo(() => {
    const base = baseFilteredRecords as unknown as ListRecord[];
    if (!globalSearch || globalSearch.length === 0) return base;
  
    const normalize = (str: string) =>
      str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  
    return base.filter((record) => {
      return globalSearch.some((tag) => {
        const tagLower = normalize(tag);
        const tagNormalized = normalize(tag.replace(/_/g, " "));
  
        const statusValue = normalize((record.status?.toString() || "").replace(/_/g, " "));
        const statusMatches = statusValue.includes(tagNormalized) || statusValue.includes(tagLower);
        return (
          statusMatches ||
          normalize(record.title?.toString() || "").includes(tagLower) ||
          normalize(record.description?.toString() || "").includes(tagLower) ||
          normalize(record.folio?.toString() || "").includes(tagLower) ||
          record.detailsList?.some((detail) => {
            if (Array.isArray(detail.value)) {
              return detail.value.some((val) =>
                normalize(val?.toString() || "").includes(tagLower),
              );
            }
            return normalize(detail.value?.toString() || "").includes(tagLower);
          }) ||
          record.modalDetailsList?.some((detail) => {
            if (Array.isArray(detail.value)) {
              return detail.value.some((val) =>
                normalize(val?.toString() || "").includes(tagLower),
              );
            }
            return normalize(detail.value?.toString() || "").includes(tagLower);
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
    if (typeof children === "function") {
      setSelectedChildren(children(record));
    } else {
      setSelectedChildren(children);
    }
    setIsModalOpen(true);
    onRecordClick?.(record as any);
  };
  const clearSelection = () => setSelectedItems([]);

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
                 <CustomSpinner />
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
          action={children}
        />
      ) : modalType === "incidencia" ? (
        <ViewIncidenciaModal
          record={selectedRecord}
          open={isModalOpen}
          actions={modalActions?.(selectedRecord)}
          onOpenChange={setIsModalOpen}
          badges={[
            {
              label: "",
              value: `#${selectedRecord?.folio || ""}`,
              customClass: "bg-[#DBEAFE] text-[#2987F7] text-xs font-bold border border-blue-200",
            },
            ...((selectedRecord as any)?.rawData?.estatus ? [{
              label: "",
              value: (selectedRecord as any).rawData.estatus,
              customClass: (selectedRecord as any).rawData.estatus?.toLowerCase() === "abierto"
                ? "bg-red-100 text-red-600 text-xs font-bold border border-red-200"
                : "bg-green-100 text-green-600 text-xs font-bold border border-green-200",
            }] : []),
            ...((selectedRecord as any)?.rawData?.prioridad_incidencia ? [{
              label: "",
              value: (selectedRecord as any).rawData.prioridad_incidencia,
              customClass: "bg-amber-100 text-amber-600 text-xs font-bold border border-amber-200",
            }] : []),
          ]}
        />
      ) : (
        <PhotoListCardModal
          record={selectedRecord as any}
          open={isModalOpen}
          actions={modalActions?.(selectedRecord)}
          onOpenChange={setIsModalOpen}>
          {selectedChildren}
          <EquiposYVehiculosList record={selectedRecord as any} />
        </PhotoListCardModal>
      )}
    </div>
  );
}