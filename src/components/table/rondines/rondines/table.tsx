/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import * as React from "react";
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useEffect, useMemo, useState } from "react";
import { PhotoGridView } from "@/components/Bitacoras/PhotoGrid/PhotoGridView";
import PhotoListView from "@/components/Bitacoras/PhotoList/PhotoListView";
import OutSelectedItemsButton from "@/components/Bitacoras/OutSelectedItemsButton";
import { ListRecord, PhotoRecord } from "@/types/bitacoras";
import { formatListRecord, formatPhotoRecord } from "@/utils/formatRecords";
import { PhotoRondinCardModal } from "@/components/Bitacoras/PhotoList/PhotoRondinCardModal";
import { useGetListRondines } from "@/hooks/Rondines/useGetListRecorridos";
import { getRondinesColumns } from "./rondines-columnas";
import { mapRondinBitacoraList } from "@/mappers/rondin.bitacora.list.mapper";
import { useGetPdfMutation } from "@/hooks/usetGetPdf";
import useAuthStore from "@/store/useAuthStore";
import Swal from "sweetalert2";
import { RondinActionButtons } from "../rondinActionButtons";
import { SearchFacet } from "@/components/common/FacetSearch";
import { TableRowSkeletons } from "@/components/common/RecordSkeletons";
import { FiltersPanel } from "@/components/Bitacoras/PhotoGrid/PhotoGridFiltersPanel";
import { toast } from "sonner";
import { errorMsj, imprimirUrlEnIframe } from "@/lib/utils";
import { useSelectedLocationsStore } from "@/store/useSelectedLocationsStore";

export interface BitacoraRondin {
  id: string;
  folio: string;
  created_at: string;
  updated_at: string;
  ubicacion: string;
  nombre_recorrido: string;
  asignado_a: string;
  tipo_rondin: string;
  fecha_hora_programada_inicio: string;
  fecha_hora_inicio: string;
  estatus_recorrido: string;
  duracion_rondin: string | number;
  motivo_cancelacion: string;
  comentario_general: string;
  comentarios_generales: any[];
  porcentaje_avance: string | number;
  cantidad_areas_inspeccionadas: string | number;
  total_checks: number;
  areas: {
    area: string;
    detalle: {
      area: string;
      checks_mes: any[];
      fotos: { file_name: string; file_url: string }[];
      hora_de_check: string;
      ubicacion: string;
      tiempo_traslado: string | number;
      comentarios: string;
      incidencias: any[];
    };
  }[];
  incidencias: any[];
}

interface RondinesTableProps {
  resetTableFilters: () => void;
  setDate1: React.Dispatch<React.SetStateAction<Date | "">>;
  setDate2: React.Dispatch<React.SetStateAction<Date | "">>;
  date1: Date | "";
  date2: Date | "";
  dateFilter: string;
  viewMode?: "table" | "photos" | "list";
  searchTags?: string[];
  /** Filtros del buscador avanzado (panel + chips); se resuelven en el back. */
  facets?: SearchFacet[];
  ubicacion?: string;
  showTabs?: boolean;
  externalFilters?: any;
  onExternalFiltersChange?: (filters: any) => void;
  filtersConfig?: any[];
  setTotalRegistros: React.Dispatch<React.SetStateAction<number | 0>>;
  openRecorridoId: string | null

}

const RONDINES_POR_PAGINA = 25;

const RondinesTable: React.FC<RondinesTableProps> = ({
  openRecorridoId,
  viewMode: viewModeProp,
  facets,
  externalFilters: externalFiltersProp,
  onExternalFiltersChange: onExternalFiltersChangeProp,
  filtersConfig: filtersConfigProp,
  setTotalRegistros
}) => {
  const { selectedLocations } = useSelectedLocationsStore();
  // Paginación en servidor: se piden solo RONDINES_POR_PAGINA por vez.
  const [paginaServidor, setPaginaServidor] = React.useState(0);
  const { listRondines, totalRondines, isLoadingListRondines: isLoading, isFetchingListRondines } = useGetListRondines(
    true, "", "", RONDINES_POR_PAGINA, paginaServidor * RONDINES_POR_PAGINA, selectedLocations, facets ?? []
  );

  // al cambiar de ubicaciones, búsqueda o filtros se vuelve a la primera página
  const facetsKey = JSON.stringify(facets ?? []);
  useEffect(() => { setPaginaServidor(0); }, [selectedLocations, facetsKey]);
  const [rowSelection, setRowSelection] = React.useState({});


  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rondinSeleccionado, setRondinSeleccionado] = useState<any | null>(null);
  const [modalVerAbierto, setModalVerAbierto] = useState(false);
  const [rondinActual, setRondinActual] = useState<BitacoraRondin | null>(null);
  const { userParentId } =useAuthStore();

  const viewMode= viewModeProp; 
  const externalFilters = useMemo(
    () => externalFiltersProp ?? { dynamic: {}, dateFilter: "" },
    [externalFiltersProp]
  );

  const onExternalFiltersChange = onExternalFiltersChangeProp ?? (() => {});
  const filtersConfig = useMemo(() => filtersConfigProp ?? [], [filtersConfigProp]);

  const { refetch } = useGetPdfMutation(
    rondinActual?.id ?? "",
    590,
    userParentId ||0 ,
    `Bitacora_de_Rondines_${rondinActual?.folio ?? ""}`
  );
  
  const handleImprimir = async (rondin: BitacoraRondin) => {
    setRondinActual(rondin);
    await new Promise(resolve => setTimeout(resolve, 50));
  
    Swal.fire({
      title: "Preparando documento",
      html: "Cargando PDF para imprimir...",
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
    });
  
    try {
      const result = await refetch();
      const downloadUrl = result.data?.response?.data?.json?.download_url;
  
      if (downloadUrl) {
        await imprimirUrlEnIframe(downloadUrl, () => Swal.close());
        Swal.close();
      } else {
        await new Promise(resolve => setTimeout(resolve, 600));
        Swal.close();
        const err = errorMsj(result.data)
        toast.warning(`Error al imprimir: ${err?.text}`, {
          style: {
            background: "#f97316",
            color: "#fff",
          },
        });
      }
    } catch (err) {
      Swal.close();
        const errMsj= errorMsj(err) 
        toast.warning(`Error al imprimir: ${errMsj}`, {
          style: {
            background: "#f97316",
            color: "#fff",
          },
        });
    }
  };

  useEffect(() => {
    setTotalRegistros(totalRondines);
  }, [totalRondines, setTotalRegistros]);


  const handleVer = (rondin: BitacoraRondin) => {
    const base = {
      id: rondin.id,
      folio: rondin.folio,
    };
    const formatted = mapRondinBitacoraList(rondin, base);
    setRondinSeleccionado(formatted as any);
    setModalVerAbierto(true);
  };

  const columns = useMemo(() => getRondinesColumns(handleVer, handleImprimir),[]);
  const memoizedData = useMemo(
    () => (Array.isArray(listRondines) ? listRondines : []) as BitacoraRondin[],
    [listRondines]
  );
  // Búsqueda, filtros y paginación ya vienen resueltos del back.
  const filteredData = memoizedData;


  useEffect(() => {
    if (!openRecorridoId || isLoading || !memoizedData.length) return;
    const found = memoizedData.find((r: any) => r.id === openRecorridoId);
    if (found) {
      handleVer(found as BitacoraRondin);
    }
  }, [openRecorridoId, isLoading, memoizedData]);
  
  const table = useReactTable({
    data: filteredData ?? [],
    columns,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: { sorting, columnFilters, columnVisibility, rowSelection },
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedItems = selectedRows.map((row) => ({
    record_id: row.original.id,
    record_status: row.original.estatus_recorrido,
  }));

  const photoListRecords: ListRecord[] = useMemo(() => {
    return filteredData.map((item: any, index: number) =>
      formatListRecord({
        ...item,
        _id: `rondin-bitacora-${index}-${item.id || index}`,
      }, "rondin_bitacora")
    );
  }, [filteredData]);
  
  const photoRecords: PhotoRecord[] = useMemo(() => {
    return filteredData.map((item: any, index: number) =>
      formatPhotoRecord({
        ...item,
        _id: `rondin-bitacora-${index}-${item.id || index}`,
      }, "rondin_bitacora")
    );
  }, [filteredData]);

  const handleImprimirMultiple = async (rondines: BitacoraRondin[]) => {
    for (const rondin of rondines) {
      await handleImprimir(rondin);
    }
  };

  const renderActions = (record: PhotoRecord | ListRecord) => {
    const rondin = memoizedData.find((b) => b.id === record.id);
    if (!rondin) return null;
    return (
      <RondinActionButtons
        rondin={rondin}
        handleImprimir={handleImprimir}
      />
    );
  };
  
  return (

    <div className="w-full">
      <div className="flex gap-4 items-start">
     
        {viewMode !== "table" && (
           <aside className="w-80 shrink-0 hidden lg:block border border-slate-200 rounded-lg bg-white p-6 sticky top-[140px] shadow-sm max-h-[calc(100vh-160px)] overflow-y-auto custom-scrollbar">
            <FiltersPanel
              filters={externalFilters}
              onFiltersChange={onExternalFiltersChange}
              filtersConfig={filtersConfig}
            />
          </aside>
        )}

        <div className="flex-1">
          {viewMode === "table" ? (
            <>
              <div className="border border-slate-200 rounded-md overflow-hidden bg-white shadow-sm">
                <Table className="text-xs">
                  <TableHeader className="bg-[#DBEAFE] hover:bg-[#DBEAFE] border-b border-slate-200">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id} className="hover:bg-transparent border-none">
                        {headerGroup.headers.map((header) => (
                          <TableHead
                            key={header.id}
                            className={`text-slate-600 h-10 font-medium uppercase tracking-wider py-2 px-3 shadow-none ${header.id === "options" ? "w-1" : ""}`}>
                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRowSkeletons columns={columns.length} />
                    ) : table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          data-state={row.getIsSelected() && "selected"}
                          className="hover:bg-slate-100 transition-colors border-slate-50">
                          {row.getVisibleCells().map((cell) => (
                            <TableCell
                              key={cell.id}
                              className={`py-2 px-3 border-r border-slate-100 last:border-r-0 ${cell.column.id === "options" ? "w-1" : ""} font-normal`}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="h-32 text-center">
                          <span className="text-base text-slate-400 font-normal">No se encontraron registros</span>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-end space-x-2 py-4">
                <div className="space-x-2">
                  <Button variant="outline" size="sm" onClick={() => setPaginaServidor((p) => Math.max(0, p - 1))}
                    disabled={paginaServidor === 0 || isFetchingListRondines}>
                    Anterior
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPaginaServidor((p) => p + 1)}
                    disabled={(paginaServidor + 1) * RONDINES_POR_PAGINA >= totalRondines || isFetchingListRondines}>
                    Siguiente
                  </Button>
                </div>
              </div>
            </>
          ) : viewMode === "photos" ? (
            <PhotoGridView
              isLoading={isLoading}
              skeleton
              records={photoRecords}
              modalType="rondines"
              getMapData={(record) => (record as any)?.rawData?.map_data ?? []}
              selectionActions={(ids) => <OutSelectedItemsButton selectedItems={ids} variant="imprimir"/>}
              externalFilters={externalFilters}
              onExternalFiltersChange={onExternalFiltersChange}>
              {renderActions}
            </PhotoGridView>
          ) : (
            <PhotoListView
              isLoading={isLoading}
              skeleton
              records={photoListRecords}
              modalType="rondines"
              getMapData={(record) => record?.rawData?.map_data ?? []}
              selectionActions={(ids) => <OutSelectedItemsButton selectedItems={ids} variant="imprimir"/>}
              externalFilters={externalFilters}
              onExternalFiltersChange={onExternalFiltersChange}>
              {renderActions}
            </PhotoListView>
          )}
        </div>
      </div>

      <PhotoRondinCardModal
        record={rondinSeleccionado as any}
        open={modalVerAbierto}
        onOpenChange={setModalVerAbierto}
        mapData={
          rondinSeleccionado?.rawData?.map_data ??
          rondinSeleccionado?.areas?.flatMap((a: any) =>
            a.detalle?.fotos?.length > 0
              ? [{ id: a.area, nombre_area: a.area, geolocation_area: { latitude: 0, longitude: 0 } }]
              : []
          ) ?? []
        }
      />

      {selectedRows.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <div className="bg-blue-600 text-white px-6 py-3 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold flex items-center gap-2">
                ✓ {selectedRows.length} seleccionado{selectedRows.length > 1 ? "s" : ""}
              </span>
              <button
                onClick={() => table.toggleAllPageRowsSelected(true)}
                className="text-sm font-bold bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-colors">
                Seleccionar todos ({memoizedData.length})
              </button>
            </div>
            <div className="flex items-center gap-3">
              <OutSelectedItemsButton
                selectedItems={selectedItems}
                variant="imprimir"
                onImprimir={() => handleImprimirMultiple(selectedRows.map(r => r.original))}
              />
              <button
                onClick={() => setRowSelection({})}
                className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white">
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* <PrintRondinModal
        open={imprimirAbierto}
        onOpenChange={setImprimirAbierto}
        rondines={rondinImprimir}
      /> */}
    </div>
  );
};

export default RondinesTable;