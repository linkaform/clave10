"use client";

import { useState, useEffect, useMemo } from "react";
import { PhotoGridCard } from "./PhotoGridCard";
import { ImageIcon } from "lucide-react";
import { PhotoGridViewProps, PhotoRecord } from "@/types/bitacoras";
import { usePhotoGridView } from "@/hooks/bitacora/usePhotoGridView";
import { SelectionBar } from "../SelectionBar";
import { PhotoGridCardModal } from "./PhotoGridCardModal";
import EquiposYVehiculosList from "../EquiposYVehiculosList";

const STATUS_BADGE_CLASSES: Record<string, string> = {
  corriendo: "bg-green-600 border-green-600 text-white text-xs",
  pausado:   "bg-yellow-500 border-yellow-500 text-white text-xs",
  cancelado: "bg-red-600 border-red-600 text-white text-xs",
  cerrado:   "bg-gray-400 border-gray-400 text-white text-xs",
  entrada:   "bg-green-600 border-green-600 text-white text-xs",
  salida:    "bg-red-600 border-red-600 text-white text-xs",
  resuelto:  "bg-blue-600 border-blue-600 text-white text-xs",
  abierto:   "bg-green-600 border-green-600 text-white text-xs",
};

const getStatusBadgeClass = (status: string) =>
  STATUS_BADGE_CLASSES[status?.toLowerCase()] ?? "bg-gray-400 border-gray-400 text-white text-xs";

export function PhotoGridView({
  isLoading,
  records,
  children,
  onSelectionChange,
  selectionActions,
  externalFilters,
  onExternalFiltersChange,
  globalSearch = [],
}: Omit<
  PhotoGridViewProps,
  "filtersConfig" | "hideSidebar" | "renderCustomActions"
> & {
  globalSearch?: string[];
  selectionActions?:
    | React.ReactNode
    | ((
        selectedItems: { record_id: string; record_status: string }[],
      ) => React.ReactNode);
}) {
  const { filteredRecords: baseFilteredRecords, activeFiltersCount } =
    usePhotoGridView(records, externalFilters, onExternalFiltersChange);
  const [selectedItems, setSelectedItems] = useState<
    { record_id: string; record_status: string }[]
  >([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PhotoRecord | null>(null);

  const filteredRecords = useMemo(() => {
    if (!globalSearch || globalSearch.length === 0) return baseFilteredRecords;
    return baseFilteredRecords.filter((record) => {
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
        selectionActions={selectionActions}
        selectedItems={selectedItems}
      />
      <div className="flex flex-1 min-h-0 relative z-0">
        <main className="flex-1 flex flex-col min-w-0 transition-all duration-300">
          <div className="flex-1 overflow-y-auto">
            <div>
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
        badges={[
          {
            label: "",
            value: (selectedRecord?.statusLabel || selectedRecord?.status || "").toUpperCase(),
            customClass: getStatusBadgeClass(selectedRecord?.status || ""),
          },
          {
            label: "",
            value: selectedRecord?.visit_type || "",
            customClass: "bg-[#F3E8FF] text-[#9159F4] text-xs",
          },
          {
            label: "",
            value: `#${selectedRecord?.folio || ""}`,
            customClass: "bg-[#DBEAFE] text-[#2987F7] text-xs",
          },
        ]}
        record={selectedRecord}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}>
        {(selectedRecord?.vehiculos?.length ?? 0) > 0 || (selectedRecord?.equipos?.length ?? 0) > 0 ? (
          <EquiposYVehiculosList record={selectedRecord} />
        ) : null}
      </PhotoGridCardModal>
    </div>
  );
}