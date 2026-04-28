/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import * as React from "react";

import {
  ColumnFiltersState,
  Row,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  Table as TanstackTable
} from "@tanstack/react-table";
import { Eye } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useMemo, useState } from "react";
import { EliminarIncidenciaModal } from "@/components/modals/delete-incidencia-modal";
import { convertirDateToISO } from "@/lib/utils";
import { EditarIncidenciaModal } from "@/components/modals/editar-incidencia";
import ViewImage from "@/components/modals/view-image";
import { Checkbox } from "@/components/ui/checkbox";
import { SeguimientoIncidenciaLista } from "@/components/modals/add-seguimientos";
import { Incidencia_record, OptionsCell } from "./incidencias-rondines-columns";
import { ViewIncidenciaRondin } from "@/components/modals/view-incidencia-rondin";
import { AddIncidenciaRondinesModal } from "@/components/modals/add-incidencia-rondines";
import { PhotoGridView } from "@/components/Bitacoras/PhotoGrid/PhotoGridView";
import PhotoListView from "@/components/Bitacoras/PhotoList/PhotoListView";
import OutSelectedItemsButton from "@/components/Bitacoras/OutSelectedItemsButton";
import { ListRecord, PhotoRecord } from "@/types/bitacoras";
import { formatListRecord, formatPhotoRecord } from "@/utils/formatRecords";
import { FiltersPanel } from "@/components/Bitacoras/PhotoGrid/PhotoGridFiltersPanel";

interface ListProps {
  showTabs: boolean;
  data: any[];
  isLoading: boolean;
  openModal: boolean;
  setOpenModal: React.Dispatch<React.SetStateAction<boolean>>;
  resetTableFilters: () => void;
  setSelectedIncidencias: React.Dispatch<React.SetStateAction<string[]>>;
  selectedIncidencias: string[];
  setDate1: React.Dispatch<React.SetStateAction<Date | "">>;
  setDate2: React.Dispatch<React.SetStateAction<Date | "">>;
  date1: Date | "";
  date2: Date | "";
  dateFilter: string;
  setDateFilter: React.Dispatch<React.SetStateAction<string>>;
  Filter: () => void;
  viewMode?: "table" | "photos" | "list";
	externalFilters?: any;
	onExternalFiltersChange?: (filters: any) => void;
	filtersConfig?: any[];
}

export const incidenciasColumnsCSV = [
  { label: 'Folio', key: 'folio' },
  { label: 'Ubicacion', key: 'ubicacion_incidencia' },
  { label: 'Lugar del Incidente', key: 'area_incidencia' },
  { label: 'Fecha y hora', key: 'fecha_hora_incidencia' },
  { label: 'Comentarios', key: 'comentario_incidencia' },
  { label: 'Reporta', key: 'reporta_incidencia' },
];

const IncidenciasRondinesTable: React.FC<ListProps> = ({
	data,
	isLoading,
	openModal,
	setOpenModal,
	setSelectedIncidencias,
	selectedIncidencias,
	viewMode,
	externalFilters,
	onExternalFiltersChange,
	filtersConfig
  // setDate1, setDate2, date1, date2, dateFilter, setDateFilter, Filter, resetTableFilters
}) => {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [tabSelected, setTabSelected] = useState("datos");
  const [modalVerAbierto, setModalVerAbierto] = useState(false);
  const [modalSeguimientoAbierto, setModalSeguimientoAbierto] = useState(false);
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
  const [modalEliminarMultiAbierto, setModalEliminarMultiAbierto] = useState(false);
  const [incidenciaSeleccionada, setIncidenciaSeleccionada] = useState<Incidencia_record | null>(null);
  const [setSeguimientos] = useState<any>([]);
  const [editarSeguimiento, setEditarSeguimiento] = useState(false);
  const [seguimientoSeleccionado] = useState(null);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 23 });
  const [globalFilter, setGlobalFilter] = React.useState("");

  const handleEditar = (incidencia: Incidencia_record) => {
    setIncidenciaSeleccionada(incidencia);
    setModalEditarAbierto(true);
  };

  const handleEliminar = (incidencia: Incidencia_record) => {
    setIncidenciaSeleccionada(incidencia);
    setModalEliminarAbierto(true);
  };

  const handleSeguimiento = (incidencia: Incidencia_record) => {
    setIncidenciaSeleccionada(incidencia);
    setModalSeguimientoAbierto(true);
  };

  const handleVer = (incidencia: Incidencia_record) => {
    setIncidenciaSeleccionada(incidencia);
    setModalVerAbierto(true);
  };

  const columns = useMemo(() => {
    if (isLoading) return [];
    return [
      {
        id: "select",
        cell: ({ row }: { row: Row<Incidencia_record> }) => (
          <div className="flex space-x-3 items-center">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
            />
            <OptionsCell row={row} onEliminarClick={handleEliminar} onSeguimientoClick={handleSeguimiento} onView={() => { handleVer(row.original); }} />
          </div>
        ),
        header: ({ table }: { table: TanstackTable<Incidencia_record> }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "folio",
        header: "Folio",
        cell: ({ row }: { row: Row<Incidencia_record> }) => (
          <div className="capitalize">{row.getValue("folio")}</div>
        ),
        enableSorting: true,
      },
      {
        id: "incidente",
        header: "Incidencia",
        accessorFn: (row: any) => `${row.categoria} / ${row.subcategoria} / ${row.incidente}`,
        cell: ({ row }: { row: Row<any> }) => {
          const { categoria, subcategoria, incidente } = row.original;
          return <div className="capitalize">{`${categoria} / ${subcategoria} / ${incidente}`}</div>;
        },
        enableSorting: true,
      },
      {
        accessorKey: "nombre_del_recorrido",
        header: "Recorrido",
        cell: ({ row }: { row: Row<any> }) => (
          <span className="px-4 py-2 block max-w-xs truncate" title={row.getValue("nombre_del_recorrido") || "-"}>
            {row.getValue("nombre_del_recorrido")}
          </span>
        ),
        enableSorting: true,
      },
      {
        accessorKey: "estatus",
        header: "Estatus",
        cell: ({ row }: { row: Row<any> }) => (
          <span className="px-4 py-2 block max-w-xs truncate" title={row.getValue("estatus") || "-"}>
            {row.getValue("estatus")}
          </span>
        ),
        enableSorting: true,
      },
      {
        accessorKey: "comentarios",
        header: "Comentarios",
        cell: ({ row }: { row: Row<any> }) => (
          <span className="px-4 py-2 block max-w-xs truncate" title={row.getValue("comentarios") || "-"}>
            {row.getValue("comentarios")}
          </span>
        ),
        enableSorting: true,
      },
      {
        accessorKey: "accion_tomada",
        header: "Acción",
        cell: ({ row }: { row: Row<any> }) => (
          <span className="px-4 py-2 block max-w-xs truncate" title={row.getValue("accion_tomada") || "-"}>
            {row.getValue("accion_tomada")}
          </span>
        ),
        enableSorting: true,
      },
      {
        accessorKey: "evidencias",
        header: "Evidencia",
        cell: ({ row }: { row: Row<any> }) => {
          const foto = row.original.evidencias;
          return <ViewImage imageUrl={foto ?? []} />;
        },
        enableSorting: false,
      },
    ];
  }, [isLoading, handleEditar]);

  const memoizedData = useMemo(() => data || [], [data]);

  const table = useReactTable({
    data: memoizedData,
    columns,
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
    state: { sorting, columnFilters, columnVisibility, rowSelection, pagination, globalFilter },
  });

  React.useEffect(() => {
    if (table.getFilteredSelectedRowModel().rows.length > 0) {
      const folios: any[] = [];
      table.getFilteredSelectedRowModel().rows.map((row) => folios.push(row.original));
      setSelectedIncidencias(folios);
    }
  }, [table.getFilteredSelectedRowModel().rows]);
  const photoListRecords: ListRecord[] = useMemo(() => {
	return memoizedData.map((item, index) =>
	  formatListRecord({
		...item,
		_id: `incidencia-${index}-${item._id || item.id || item.folio || index}`
	  }, "rondin_incidencia") 
	);
  }, [memoizedData]);
  
  const photoRecords: PhotoRecord[] = useMemo(() => {
	return memoizedData.map((item, index) =>
	  formatPhotoRecord({
		...item,
		_id: `incidencia-${index}-${item._id || item.id || item.folio || index}`
	  }, "rondin_incidencia")
	);
  }, [memoizedData]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const renderActions = (_record: PhotoRecord | ListRecord) => null;

  return (
    <div className="w-full">

      {/* modales — siempre disponibles sin importar viewMode */}
      <div className="flex w-full justify-end">
        <div>
          <EliminarIncidenciaModal
            title="Eliminar Incidencias"
            arrayFolios={selectedIncidencias}
            modalEliminarAbierto={modalEliminarMultiAbierto}
            setModalEliminarAbierto={setModalEliminarMultiAbierto}
          />
        </div>

        {modalVerAbierto && incidenciaSeleccionada && (
          <ViewIncidenciaRondin
            title="Información de la Incidencia"
            data={incidenciaSeleccionada}
            isSuccess={modalVerAbierto}
            tab={tabSelected}
            setTab={setTabSelected}
            setIsSuccess={setModalVerAbierto}>
            <div className="cursor-pointer" title="Ver Incidencia">
              <Eye />
            </div>
          </ViewIncidenciaRondin>
        )}

        {modalEditarAbierto && incidenciaSeleccionada && (
          <EditarIncidenciaModal
            title="Editar Incidencia"
            selectedIncidencia={incidenciaSeleccionada.incidencia}
            data={incidenciaSeleccionada}
            modalEditarAbierto={modalEditarAbierto}
            setModalEditarAbierto={setModalEditarAbierto}
            onClose={() => setModalEditarAbierto(false)}
            tab={tabSelected}
            setTab={setTabSelected}
          />
        )}

        {modalEliminarAbierto && incidenciaSeleccionada && (
          <EliminarIncidenciaModal
            title="Eliminar Incidencias"
            arrayFolios={[incidenciaSeleccionada.folio]}
            modalEliminarAbierto={modalEliminarAbierto}
            setModalEliminarAbierto={(state) => {
              setModalEliminarMultiAbierto(state);
              if (!state) {
                setSelectedIncidencias([]);
                setRowSelection({});
                setModalEliminarAbierto(state);
              }
            }}
          />
        )}

        <AddIncidenciaRondinesModal title="Crear incidencia" isSuccess={openModal} setIsSuccess={setOpenModal}>
        </AddIncidenciaRondinesModal>

        {modalSeguimientoAbierto && incidenciaSeleccionada && (
          <SeguimientoIncidenciaLista
            title="Seguimiento Incidencia"
            isSuccess={modalSeguimientoAbierto}
            setIsSuccess={setModalSeguimientoAbierto}
            seguimientoSeleccionado={seguimientoSeleccionado}
            setSeguimientos={setSeguimientos}
            setEditarSeguimiento={setEditarSeguimiento}
            editarSeguimiento={editarSeguimiento}
            indice={0}
            dateIncidencia={incidenciaSeleccionada.fecha_hora_incidencia ? convertirDateToISO(new Date(incidenciaSeleccionada.fecha_hora_incidencia)) : ""}
            enviarSeguimiento={true}
            folioIncidencia={incidenciaSeleccionada.folio}
            estatusIncidencia={incidenciaSeleccionada.estatus}>
            <div></div>
          </SeguimientoIncidenciaLista>
        )}
      </div>

      {/* vistas — condicional */}
	  <div className="flex gap-4 items-start">
		{viewMode !== "table" && (
			<aside className="w-80 shrink-0 hidden lg:block border border-slate-200 rounded-lg bg-white p-6 sticky top-[140px] shadow-sm max-h-[calc(100vh-160px)] overflow-y-auto custom-scrollbar">
			<FiltersPanel
				filters={externalFilters ?? { dynamic: {}, dateFilter: "", date1: "", date2: "" }}
				onFiltersChange={onExternalFiltersChange ?? (() => {})}
				filtersConfig={filtersConfig ?? []}
			/>
			</aside>
		)}

		<div className="flex-1 min-w-0">
			{viewMode === "table" ? (
			<>
				<div>
				<Table>
					<TableHeader className="bg-blue-100 hover:bg-blue-100">
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow key={headerGroup.id}>
						{headerGroup.headers.map((header) => (
							<TableHead key={header.id} className="px-1">
							{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
							</TableHead>
						))}
						</TableRow>
					))}
					</TableHeader>
					<TableBody>
					{table.getRowModel().rows?.length ? (
						table.getRowModel().rows.map((row) => (
						<TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
							{row.getVisibleCells().map((cell) => (
							<TableCell key={cell.id} className="p-1 pl-1">
								{flexRender(cell.column.columnDef.cell, cell.getContext())}
							</TableCell>
							))}
						</TableRow>
						))
					) : (
						<TableRow>
						<TableCell colSpan={table.getVisibleFlatColumns().length} className="h-24 text-center">
							{isLoading
							? <div className="text-xl font-semibold">Cargando registros...</div>
							: <div className="text-xl font-semibold">No hay registros disponibles...</div>}
						</TableCell>
						</TableRow>
					)}
					</TableBody>
				</Table>
				</div>
				<div className="flex items-center justify-end space-x-2 py-4">
				{!isLoading && (
					<div className="flex-1 text-sm text-muted-foreground">
					{table.getFilteredSelectedRowModel().rows.length} de{" "}
					{table.getFilteredRowModel().rows.length} items seleccionados.
					</div>
				)}
				<div className="space-x-2">
					<Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Anterior</Button>
					<Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Siguiente</Button>
				</div>
				</div>
			</>
			) : viewMode === "photos" ? (
			<PhotoGridView
				isLoading={isLoading}
				records={photoRecords}
				globalSearch={[globalFilter]}
				selectionActions={(ids) => <OutSelectedItemsButton selectedItems={ids} />}>
				{renderActions}
			</PhotoGridView>
			) : (
			<PhotoListView
				isLoading={isLoading}
				records={photoListRecords}
				globalSearch={[globalFilter]}
				selectionActions={(ids) => <OutSelectedItemsButton selectedItems={ids} />}>
				{renderActions}
			</PhotoListView>
			)}
		</div>
		</div>

    </div>
  );
};

export default IncidenciasRondinesTable;