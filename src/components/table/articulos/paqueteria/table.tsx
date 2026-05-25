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
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useEffect, useMemo } from "react";
import { Paquete_record, paqueteriaColumns } from "./paqueteria-columns";
import { ViewMode } from "@/lib/utils";
import { PhotoGridView } from "@/components/Bitacoras/PhotoGrid/PhotoGridView";
import PhotoListView from "@/components/Bitacoras/PhotoList/PhotoListView";
import { formatListRecord, formatPhotoRecord } from "@/utils/formatRecords";
import { ListRecord, PhotoRecord } from "@/types/bitacoras";
import { applyPaqueteriaFilters } from "@/hooks/Paqueteria/usePaqueteriaFilters";
import { FiltersPanel } from "@/components/Bitacoras/PhotoGrid/PhotoGridFiltersPanel";
import { CustomSpinner } from "@/components/custom-spinner";
import { PaqueteriaActionButtons } from "@/components/Bitacoras/Paqueteria/customAction";

interface ListProps {
  data: Paquete_record[];
  isLoadingListPaqueteria:boolean;
  openModal: () => void;
  resetTableFilters: () => void;
  setSelectedArticulos:React.Dispatch<React.SetStateAction<string[]>>;

  setDate1 :React.Dispatch<React.SetStateAction<Date | "">>;
  setDate2 :React.Dispatch<React.SetStateAction<Date | "">>;
  date1:Date| ""
  date2:Date| ""
  dateFilter: string;
  setDateFilter :React.Dispatch<React.SetStateAction<string>>;
  Filter:() => void;
  viewMode:ViewMode;
  searchTags?: string[];
  activeFiltersCount?: number;
  externalFilters?: any;
  onExternalFiltersChange?: (filters: any) => void;
  filtersConfig?: any[];
  setTotalRegistros?: React.Dispatch<React.SetStateAction<number>>;
  
}

// const articulosColumnsCSV = [
//     { label: 'Folio', key: 'folio' },
//     { label: 'Nombre', key: 'articulo_perdido' },
//     { label: 'Articulo', key: 'articulo_seleccion' },
//     { label: 'Color', key: 'color_perdido' },
//     { label: 'Categoria', key: 'tipo_articulo_perdido' },
//     { label: 'Fecha del Hallazgo', key: 'date_hallazgo_perdido' },
//     { label: 'Area de Resguardo', key: 'locker_perdido' },
//     { label: 'Reporta Interno', key: 'quien_entrega_interno' },
// 	  { label: 'Reporta Externo', key: 'quien_entrega_externo' },
//     { label: 'Fecha de Devolucion', key: 'date_entrega_perdido' },
// 	  { label: 'Comentarios', key: 'comentario_perdido' },
//   ];

const PaqueteriaTable:React.FC<ListProps> = ({ 
  data, 
  isLoadingListPaqueteria,
	setSelectedArticulos,
  viewMode, 
  searchTags:searchTagsProp,
  filtersConfig:filtersConfigProp,
  externalFilters:externalFiltersProp,
  onExternalFiltersChange:onExternalFiltersChangeProp,
})=> {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 23,
  });

  const externalFilters = useMemo(
    () => externalFiltersProp ?? { dynamic: {}, dateFilter: "" },
    [externalFiltersProp]
  );
  const onExternalFiltersChange = onExternalFiltersChangeProp ?? (() => {});
  const filtersConfig = useMemo(() => filtersConfigProp ?? [], [filtersConfigProp]);
  const searchTags = useMemo(() => searchTagsProp ?? [], [searchTagsProp]);

  const [globalFilter, setGlobalFilter] = React.useState("");
  const columns = useMemo(() => (isLoadingListPaqueteria ? [] : paqueteriaColumns), [isLoadingListPaqueteria]);
  const memoizedData = useMemo(() => data || [], [data]);

  const filteredData = useMemo(() => {
    console.log("externalFilters:", JSON.stringify(externalFilters));
    return applyPaqueteriaFilters(memoizedData, externalFilters ?? { dynamic: {} });
  }, [memoizedData, externalFilters]);


  const table = useReactTable({
      data: filteredData,
      columns: columns,
      onSortingChange: setSorting,
      onColumnFiltersChange: setColumnFilters,
      onGlobalFilterChange: setGlobalFilter,
      getCoreRowModel: getCoreRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      onColumnVisibilityChange: setColumnVisibility,
      onRowSelectionChange: setRowSelection,
      onPaginationChange: setPagination,
      globalFilterFn: (row, _columnId, filterValue: string) => {
        if (!filterValue) return true;
        const normalize = (str: string) =>
          str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        const tags = filterValue.split("|").filter(Boolean).map(normalize);
        const allValues = row
          .getAllCells()
          .map((cell) => normalize(String(cell.getValue() || "")))
          .join(" ");
        return tags.some((tag) => allValues.includes(tag));
      },
      state: {
        sorting,
        columnFilters,
        columnVisibility,
        rowSelection,
        pagination,
        globalFilter,
      },
    });



	  useEffect(()=>{
      if(table.getFilteredSelectedRowModel().rows.length>0){
      const folios: any[] = []
      table.getFilteredSelectedRowModel().rows.map((row) => {
        folios.push(row.original);
      });
      setSelectedArticulos(folios)
      }
  	},[table.getFilteredSelectedRowModel().rows])


    const paqueteriaPhotoRecords: PhotoRecord[] = useMemo(() => {
      if (!filteredData?.length) return [];
      return filteredData.map((item: any) => formatPhotoRecord(item, "paqueteria"));
    }, [filteredData]);
  
    const paqueteriaListRecords: ListRecord[] = useMemo(() => {
      if (!filteredData?.length) return [];
      return filteredData.map((item: any) => formatListRecord(item, "paqueteria"));
    }, [filteredData]);

    React.useEffect(() => {
      if (searchTags && searchTags.length > 0) {
        setGlobalFilter(searchTags.join("|"));
      } else {
        setGlobalFilter("");
      }
    }, [searchTags]);

    const renderActions = (record: PhotoRecord | ListRecord) => {
      const paquete = memoizedData.find((p) => p._id === record.id || p.folio === record.folio);
      if (!paquete) return null;
      return <PaqueteriaActionButtons paquete={paquete} />;
    };
    
  return (
    <div className="w-full">
      <div className="flex gap-4 items-start">
        {viewMode !== "table" && (
          <aside className="w-80 shrink-0 hidden lg:block border border-slate-200 rounded-lg bg-white p-6 sticky top-[140px] shadow-sm max-h-[calc(100vh-160px)] overflow-y-auto custom-scrollbar">
            <FiltersPanel
              filters={externalFilters ?? { dynamic: {}, dateFilter: "" }}
              onFiltersChange={onExternalFiltersChange ?? (() => {})}
              filtersConfig={filtersConfig ?? []}
            />
          </aside>
        )}
  
        <div className="flex-1 min-w-0">
          {viewMode === "table" && (
            <>
              <div className="border border-slate-200 rounded-md overflow-hidden bg-white shadow-sm">
              <Table className="text-xs">
                <TableHeader className="bg-[#DBEAFE] hover:bg-[#DBEAFE] border-b border-slate-200">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="hover:bg-transparent border-none">
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          className="text-slate-600 h-10 font-medium uppercase tracking-wider py-2 px-3 shadow-none">
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                        className="hover:bg-slate-100 transition-colors border-slate-50">
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            className="py-2 px-3 border-r border-slate-100 last:border-r-0 font-normal">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={paqueteriaColumns.length} className="h-32 text-center">
                        {isLoadingListPaqueteria ? (
                          <CustomSpinner />
                        ) : (
                          <span className="text-xs text-slate-300 font-normal">No hay registros disponibles...</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              </div>
              <div className="flex items-center justify-end space-x-2 py-4">
                <div className="space-x-2">
                  <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                    Anterior
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                    Siguiente
                  </Button>
                </div>
              </div>
            </>
          )}
  
          {viewMode === "photos" && (
            <PhotoGridView
              isLoading={isLoadingListPaqueteria}
              records={paqueteriaPhotoRecords}
              globalSearch={searchTags}
              externalFilters={externalFilters}
              onExternalFiltersChange={onExternalFiltersChange}
              modalActions={(record) => {
                if (!record) return null;
                const paquete = memoizedData.find((p) => p._id === record.id || p.folio === record.folio);
                if (!paquete) return null;
                return <PaqueteriaActionButtons paquete={paquete} />;
              }}
            >
              {renderActions}
            </PhotoGridView>
          )}
  
          {viewMode === "list" && (
            <PhotoListView
              isLoading={isLoadingListPaqueteria}
              records={paqueteriaListRecords}
              globalSearch={searchTags}
              externalFilters={externalFilters}
              onExternalFiltersChange={onExternalFiltersChange}
            >
             {renderActions} 
            </PhotoListView>
          )}
        </div>
      </div>
    </div>
  );
}
export default PaqueteriaTable;