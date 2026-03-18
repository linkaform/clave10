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
import { CalendarDays, LayoutList, LogOut, Search, Sheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Bitacora_record, getBitacorasColumns } from "./bitacoras-columns";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DateTime from "@/components/dateTime";
import { catalogoFechas } from "@/lib/utils";
import { DoOutModal } from "@/components/modals/do-out-modal";
import { AddBadgeModal } from "@/components/modals/add-badge-modal";
import { ReturnGafeteModal } from "@/components/modals/return-gafete-modal";
import ForceQuitConfirmationModal from "@/components/modals/force-quit-confirmation";
import { forceQuitAllPersons } from "@/lib/endpoints";
import { toast } from "sonner";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { PhotoGridView } from "@/components/Bitacoras/PhotoGrid/PhotoGridView";
import PhotoListView from "@/components/Bitacoras/PhotoList/PhotoListView";
import { LayoutGrid } from "lucide-react";
import { ListRecord, PhotoRecord } from "@/types/bitacoras";
import { formatListRecord, formatPhotoRecord } from "@/utils/formatRecords";
import { generateFiltersConfig } from "@/config/filters/bitacora";
import { useGetBitacoraFilters } from "@/hooks/bitacora/useGetBitacoraFilters";
import { InAndOutButtons } from "@/components/Bitacoras/InAndOut/InAndOutButtons";
import PhotoSelectedActions from "@/components/Bitacoras/PhotoGrid/PhotoGridSelectedActions";
import OutSelectedItemsButton from "@/components/Bitacoras/OutSelectedItemsButton";
import { TagSearchInput } from "@/components/tag-search-input";

interface ListProps {
	data: Bitacora_record[] | undefined;
	isLoading: boolean;
	setDate1: React.Dispatch<React.SetStateAction<Date | "">>;
	setDate2: React.Dispatch<React.SetStateAction<Date | "">>;
	date1: Date | ""
	date2: Date | ""
	dateFilter: string;
	setDateFilter: React.Dispatch<React.SetStateAction<string>>;
	Filter: () => void;
	isPersonasDentro: boolean;
	ubicacionSeleccionada: string;
	printPase: (paseId: string) => void;
	setPaseIdSeleccionado: React.Dispatch<React.SetStateAction<string>>;
	personasDentro: number;
	refreshData: () => Promise<void>;
	total: number | undefined;
	pagination: { pageIndex: number; pageSize: number };
	setPagination: React.Dispatch<React.SetStateAction<{ pageIndex: number; pageSize: number }>>;
	viewMode?: "table" | "photos" | "list";
	setViewMode?: (mode: "table" | "photos" | "list") => void;
}


const BitacorasTable: React.FC<ListProps> = ({ 
	data, 
	isLoading, 
	setDate1, 
	setDate2, 
	date1, 
	date2, 
	dateFilter,
	setDateFilter, 
	Filter, 
	isPersonasDentro, 
	ubicacionSeleccionada, 
	printPase, 
	setPaseIdSeleccionado, 
	personasDentro, 
	refreshData, 
	total, 
	pagination, 
	setPagination, 
	viewMode = "photos", 
	setViewMode }) => {

	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
		[]
	);

	const [modalRegresarGafeteAbierto, setModalRegresarGafeteAbierto] = useState(false);
	const [modalAgregarBadgeAbierto, setModalAgregarBadgeAbierto] = useState(false);
	const [modalSalidaAbierto, setModalSalidaAbierto] = useState(false);
	const [modalForceQuitAbierto, setModalForceQuitAbierto] = useState(false);
	const [isForcingQuit, setIsForcingQuit] = useState(false);


	const [bitacoraSeleccionada, setBitacoraSeleccionada] = useState<Bitacora_record | null>(null);
	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>({});
	const [rowSelection, setRowSelection] = React.useState({});
	// const [pagination, setPagination] = React.useState({
	// 	pageIndex: 0,
	// 	pageSize: 23,
	// });

	const printPaseFn = (id: string) => {
		console.log("ID PARA IMPRESIOND E PASE", id)
		setPaseIdSeleccionado(id)
		printPase(id);
	}
	const handleRegresarGafete = (bitacora: Bitacora_record) => {
		setBitacoraSeleccionada(bitacora);
		setModalRegresarGafeteAbierto(true);
	};

	const handleAgregarBadge = (bitacora: Bitacora_record) => {

		setBitacoraSeleccionada(bitacora);
		setModalAgregarBadgeAbierto(true);
	};

	const handleSalida = (bitacora: Bitacora_record) => {
		setBitacoraSeleccionada(bitacora);
		setModalSalidaAbierto(true);
	};



	const [searchTags, setSearchTags] = React.useState<string[]>([]);
	const columns = useMemo(() => {
		if (isLoading) return [];
		return getBitacorasColumns(handleRegresarGafete, handleAgregarBadge, handleSalida, printPaseFn);
	}, [isLoading]);
	const memoizedData = useMemo(() => data || [], [data]);

	const table = useReactTable({
		data: memoizedData,
		columns: columns,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onGlobalFilterChange: setSearchTags,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: setRowSelection,
		onPaginationChange: setPagination,
		globalFilterFn: (row, columnId, filterValues: string[]) => {
			if (!filterValues || filterValues.length === 0) return true;
			const searchTags = filterValues.map(v => v.toLowerCase());
			
			// Obtenemos todos los valores de la fila de forma dinámica
			const allValues = row.getAllCells()
				.map(cell => String(cell.getValue() || '').toLowerCase())
				.join(" ");

			// Lógica OR: Si el registro coincide con AL MENOS UNO de los tags
			return searchTags.some(tag => allValues.includes(tag));
		},

		manualPagination: true,
		rowCount: total || 0,
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection,
			pagination,
			globalFilter: searchTags,
		}
	});

	const photoListRecords: ListRecord[] = useMemo(() => {
		return memoizedData.map((item) => formatListRecord(item, "bitacora"));
	}, [memoizedData]);

	const photoRecords: PhotoRecord[] = useMemo(() => {
		return memoizedData.map((item) => formatPhotoRecord(item, "bitacora"));
	}, [memoizedData]);

	const { filters: apiFilters } = useGetBitacoraFilters(true, memoizedData?.length || 0);
	
	const bitacoraFiltersConfig = useMemo(() => {
		const shouldGenerateLocally = (memoizedData?.length || 0) < 200;
		if (shouldGenerateLocally) {
			const result = generateFiltersConfig(photoRecords);
			return result;
		}
		return apiFilters;
	}, [photoRecords, apiFilters, memoizedData?.length]);


	return (
		<div className="w-full">
			<div className="flex justify-between items-start my-1 gap-3">
				<div className="flex w-1/2 justify-start gap-4 ">
					<TabsList className="bg-blue-500 text-white">
						<TabsTrigger value="Personal">Personal</TabsTrigger>
						<TabsTrigger value="Vehiculos">Vehículos</TabsTrigger>
						<TabsTrigger value="Equipos">Equipos</TabsTrigger>
						{/* <TabsTrigger value="Locker">Locker</TabsTrigger> */}
					</TabsList>
					<div className="flex bg-slate-100 p-1 rounded-lg items-center space-x-2">
						<TagSearchInput 
							tags={searchTags} 
							onTagsChange={setSearchTags}
							placeholder="Presiona Enter para buscar por tags..."
							className="w-full"
						/>
						<Search />
					</div>
				</div>
				{isPersonasDentro ? (
					<Button type="button" className={"bg-red-500 hover:bg-red-600 text-white"} onClick={() => setModalForceQuitAbierto(true)}> <LogOut className="text-white" />Sacar a todos</Button>
				) : null}

				<div className="flex w-full justify-end">
					{dateFilter == "range" ?
						<div className="flex items-center gap-2 mr-14">
							<DateTime date={date1} setDate={setDate1} disablePastDates={false} />
							<DateTime date={date2} setDate={setDate2} disablePastDates={false} />
							<Button type="button" className={"bg-blue-500 hover:bg-blue-600"} onClick={Filter}> Filtrar</Button>
						</div> : null}
					<div className="flex items-center w-48 gap-2">
						<Select value={dateFilter} onValueChange={(value) => {
							setDateFilter(value);
						}}>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Selecciona un filtro de fecha" />
							</SelectTrigger>
							<SelectContent>
								{catalogoFechas().map((option: any) => {
									return (
										<SelectItem key={option.key} value={option.key}>
											{option.label}
										</SelectItem>
									)
								})}
							</SelectContent>
						</Select>
						<CalendarDays />
					</div>
					<div className="flex items-center ml-4 bg-slate-100 p-1 rounded-lg border border-slate-200">
						<Button
							variant="ghost"
							size="icon"
							className={`h-8 w-8 transition-all duration-300 ${viewMode === 'photos' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
							onClick={() => setViewMode?.('photos')}
							title="Vista de Fotos"
						>
							<LayoutGrid size={18} />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className={`h-8 w-8 transition-all duration-300 ${viewMode === 'table' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
							onClick={() => setViewMode?.('table')}
							title="Vista de Tabla"
						>
							<Sheet size={18} />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className={`h-8 w-8 transition-all duration-300 ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
							onClick={() => setViewMode?.('list')}
							title="Vista de Lista"
						>
							<LayoutList size={18} />
						</Button>
					</div>
				</div>

				{modalRegresarGafeteAbierto && bitacoraSeleccionada ? (
					<ReturnGafeteModal
						title={"Recibir Gafete"}
						id_bitacora={bitacoraSeleccionada._id}
						ubicacion={bitacoraSeleccionada.ubicacion}
						area={bitacoraSeleccionada?.status_visita?.toLowerCase() == "entrada" ? bitacoraSeleccionada.caseta_entrada : bitacoraSeleccionada.caseta_salida || ""}
						fecha_salida={bitacoraSeleccionada.fecha_salida}
						gafete={bitacoraSeleccionada.id_gafet}
						locker={bitacoraSeleccionada.id_locker || ""}
						tipo_movimiento={bitacoraSeleccionada?.status_visita?.toLowerCase()}
						modalRegresarGafeteAbierto={modalRegresarGafeteAbierto}
						setModalRegresarGafeteAbierto={setModalRegresarGafeteAbierto}
					/>
				) : null}

				{modalAgregarBadgeAbierto && bitacoraSeleccionada ? (
					<AddBadgeModal
						title={"Gafete"}
						status={"Disponible"}
						id_bitacora={bitacoraSeleccionada._id}
						pase_id={bitacoraSeleccionada.pase_id}
						tipo_movimiento={bitacoraSeleccionada.status_visita}
						ubicacion={bitacoraSeleccionada.ubicacion}
						area={bitacoraSeleccionada?.status_visita?.toLowerCase() == "entrada" ? bitacoraSeleccionada.caseta_entrada : bitacoraSeleccionada.caseta_salida || ""}
						modalAgregarBadgeAbierto={modalAgregarBadgeAbierto}
						setModalAgregarBadgeAbierto={setModalAgregarBadgeAbierto}
					/>
				) : null}

				{modalSalidaAbierto && bitacoraSeleccionada ? (
					<DoOutModal
						title={"Registar Salida"}
						id_bitacora={bitacoraSeleccionada.codigo_qr} ubicacion={bitacoraSeleccionada.ubicacion}
						area={bitacoraSeleccionada?.status_visita?.toLowerCase() == "entrada" ? bitacoraSeleccionada.caseta_entrada : bitacoraSeleccionada.caseta_salida || ""}
						fecha_salida={bitacoraSeleccionada.fecha_salida}
						modalSalidaAbierto={modalSalidaAbierto}
						setModalSalidaAbierto={setModalSalidaAbierto}
					/>
				) : null}

				<ForceQuitConfirmationModal
					open={modalForceQuitAbierto}
					locationName={ubicacionSeleccionada}
					isLoading={isForcingQuit}
					personasDentro={personasDentro}
					onClose={() => setModalForceQuitAbierto(false)}
					onConfirm={async () => {
						setIsForcingQuit(true);
						try {
							const data = await forceQuitAllPersons(ubicacionSeleccionada);
							const msg = data?.response?.data?.json?.msg;
							setModalForceQuitAbierto(false);
							toast.success(msg);
							await refreshData();
						} catch (error) {
							toast.error("Error al registrar salida masiva, contacta soporte.");
							console.error(error);
						} finally {
							setIsForcingQuit(false);
						}
					}}
				/>



			</div>

			{viewMode === "table" ? (
				<>
					<div className="border border-slate-200 rounded-md overflow-hidden bg-white shadow-sm mt-2">
						<Table className="text-xs">
							<TableHeader className="bg-[#DBEAFE] hover:bg-[#DBEAFE] border-b border-slate-200">
								{table.getHeaderGroups().map((headerGroup: any) => (
									<TableRow key={headerGroup.id} className="hover:bg-transparent border-none">
										{headerGroup.headers.map((header: any) => {
											return (
												<TableHead
													key={header.id}
													className={`text-slate-600 h-10 font-medium uppercase tracking-wider py-2 px-3 shadow-none ${header.id === 'options' ? 'w-1' : ''}`}
												>
													{header.isPlaceholder
														? null
														: flexRender(
															header.column.columnDef.header,
															header.getContext()
														)}
												</TableHead>
											);
										})}
									</TableRow>
								))}
							</TableHeader>

							<TableBody >
								{table.getRowModel().rows?.length ? (
									table.getRowModel().rows.map((row: any) => (
										<TableRow
											key={row.id}
											data-state={row.getIsSelected() && "selected"}
											className="hover:bg-slate-100 transition-colors border-slate-50"
										>
											{row.getVisibleCells().map((cell: any) => (
												<TableCell
													key={cell.id}
													className={`py-2 px-3 border-r border-slate-100 last:border-r-0 ${cell.column.id === 'options' ? 'w-1' : ''} font-normal`}
												>
													{flexRender(
														cell.column.columnDef.cell,
														cell.getContext(),
													)}
												</TableCell>
											))}
										</TableRow>

									))
								) : (
									<TableRow>
										<TableCell
											colSpan={columns.length}
											className="h-32 text-center"
										>
											{isLoading ? (
												<div className="flex flex-col items-center gap-2 text-slate-300">
													<div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-100 border-t-slate-300" />
													<span className="text-xs font-normal">Cargando registros...</span>
												</div>
											) : (
												<span className="text-xs text-slate-300 font-normal">No se encontraron registros</span>
											)}
										</TableCell>
									</TableRow>
								)}
							</TableBody>

						</Table>
					</div>
				</>
			) : viewMode === "photos" ? (
				<div className="mt-4">
					<PhotoGridView
						filtersConfig={bitacoraFiltersConfig}
						records={photoRecords}
						globalSearch={searchTags}
						onRecordClick={() => {}}
						renderCustomActions={(ids) => (
							<PhotoSelectedActions selectedItems={ids}>
								<OutSelectedItemsButton selectedItems={ids} />
							</PhotoSelectedActions>
						)}
					>
						{(record: PhotoRecord) => {
							const bitacora = memoizedData.find(b => b._id === record.id);
							if (!bitacora) return null;
							return (
								<InAndOutButtons
									bitacora={bitacora}
									handleSalida={handleSalida}
									printPaseFn={printPaseFn}
								/>
							);
						}}
					</PhotoGridView>
				</div>
			) : (
				<div className="mt-4">
					<PhotoListView
						filtersConfig={bitacoraFiltersConfig}
						records={photoListRecords}
						globalSearch={searchTags}
						onRecordClick={() => {}}
						renderCustomActions={(ids) => (
							<PhotoSelectedActions selectedItems={ids}>
								<OutSelectedItemsButton selectedItems={ids} />
							</PhotoSelectedActions>
						)}
					>
						{(record: PhotoRecord) => {
							const bitacora = memoizedData.find(b => b._id === record.id);
							if (!bitacora) return null;
							return (
								<InAndOutButtons
									bitacora={bitacora}
									handleSalida={handleSalida}
									printPaseFn={printPaseFn}
								/>
							);
						}}
					</PhotoListView>
				</div>
			)}
			<DataTablePagination table={table} total={total} />
		</div>
	);
}
export default BitacorasTable;