/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import * as React from "react";
import {
    CalendarDays,
    Search,
    User,
    Calendar,
    Briefcase,
    Maximize2,
    Filter as FilterIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DateTime from "@/components/dateTime";
import { catalogoFechas } from "@/lib/utils";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { Bitacora_record } from "@/components/table/bitacoras/bitacoras-columns";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

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
}

const BitacoraImages: React.FC<ListProps> = ({
    data,
    isLoading,
    setDate1,
    setDate2,
    date1,
    date2,
    dateFilter,
    setDateFilter,
    Filter,
    total,
    pagination,
    setPagination,
}) => {
    const [globalFilter, setGlobalFilter] = useState("");
    const [selectedRecord, setSelectedRecord] = useState<Bitacora_record | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
    const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
    const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Filter Options Extraction
    const filterOptions = React.useMemo(() => {
        if (!data) return { status: [], profiles: [], locations: [] };
        const status = new Set<string>();
        const profiles = new Set<string>();
        const locations = new Set<string>();

        data.forEach(record => {
            if (record.status_visita) status.add(record.status_visita);
            if (record.perfil_visita) profiles.add(record.perfil_visita);
            if (record.caseta_entrada) locations.add(record.caseta_entrada);
        });

        return {
            status: Array.from(status).sort(),
            profiles: Array.from(profiles).sort(),
            locations: Array.from(locations).sort(),
        };
    }, [data]);

    const filteredData = React.useMemo(() => {
        if (!data) return [];

        return data.filter(record => {
            // Search filter
            const search = globalFilter.toLowerCase();
            const contratistaStr = Array.isArray(record.contratista)
                ? record.contratista.join(', ')
                : String(record.contratista || '');

            const matchesSearch = !globalFilter || (
                record.nombre_visitante?.toLowerCase().includes(search) ||
                record.folio?.toLowerCase().includes(search) ||
                contratistaStr.toLowerCase().includes(search)
            );

            // Sidebar filters
            const matchesStatus = selectedStatus.length === 0 || selectedStatus.includes(record.status_visita);
            const matchesProfile = selectedProfiles.length === 0 || selectedProfiles.includes(record.perfil_visita);
            const matchesLocation = selectedLocations.length === 0 || selectedLocations.includes(record.caseta_entrada);

            return matchesSearch && matchesStatus && matchesProfile && matchesLocation;
        });
    }, [data, globalFilter, selectedStatus, selectedProfiles, selectedLocations]);

    const clearFilters = () => {
        setSelectedStatus([]);
        setSelectedProfiles([]);
        setSelectedLocations([]);
        setGlobalFilter("");
    };

    // Pagination helper (providing a full mock for DataTablePagination)
    const tablePlaceholder = {
        setPagination,
        getState: () => ({ pagination }),
        getPageCount: () => Math.ceil((total || 0) / pagination.pageSize),
        getCanPreviousPage: () => pagination.pageIndex > 0,
        getCanNextPage: () => (pagination.pageIndex + 1) * pagination.pageSize < (total || 0),
        previousPage: () => setPagination(prev => ({ ...prev, pageIndex: prev.pageIndex - 1 })),
        nextPage: () => setPagination(prev => ({ ...prev, pageIndex: prev.pageIndex + 1 })),
        setPageIndex: (index: number) => setPagination(prev => ({ ...prev, pageIndex: index })),
        setPageSize: (size: number) => setPagination(prev => ({ ...prev, pageSize: size })),
        getFilteredRowModel: () => ({ rows: filteredData }),
        getFilteredSelectedRowModel: () => ({ rows: [] }),
        getRowModel: () => ({ rows: filteredData }),
    };

    return (
        <div className="w-full space-y-4">
            {/* Header Controls */}
            <div className="flex justify-between items-start my-1 gap-3">
                <div className="flex w-1/2 justify-start gap-4 ">
                    <TabsList className="bg-blue-500 text-white">
                        <TabsTrigger value="Personal">Personal</TabsTrigger>
                        <TabsTrigger value="Fotos">Fotos</TabsTrigger>
                        <TabsTrigger value="Vehiculos">Vehículos</TabsTrigger>
                        <TabsTrigger value="Equipos">Equipos</TabsTrigger>
                        <TabsTrigger value="Locker">Locker</TabsTrigger>
                    </TabsList>
                    <div className="flex w-full max-w-sm items-center space-x-2">
                        <input
                            type="text"
                            placeholder="Buscar registros..."
                            value={globalFilter || ''}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            className=" border border-gray-300 rounded-md p-2 placeholder-gray-600 w-full"
                        />
                        <Search />
                    </div>
                </div>
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
                </div>
            </div>

            {/* Main Content Area with Sidebar */}
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Mobile Filter Toggle */}
                <div className="lg:hidden flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <Button
                        variant="ghost"
                        className="flex items-center gap-2 text-slate-700 font-bold"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    >
                        <FilterIcon className="w-4 h-4" />
                        {isSidebarOpen ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                    </Button>
                    {(selectedStatus.length > 0 || selectedProfiles.length > 0 || selectedLocations.length > 0) && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                            {selectedStatus.length + selectedProfiles.length + selectedLocations.length} Activos
                        </Badge>
                    )}
                </div>

                {/* Sidebar - eCommerce Style */}
                <aside className={`
                    ${isSidebarOpen ? 'block' : 'hidden'} lg:block
                    w-full lg:w-64 shrink-0 space-y-8 animate-in slide-in-from-left duration-300
                `}>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Filtros</h2>
                        {(selectedStatus.length > 0 || selectedProfiles.length > 0 || selectedLocations.length > 0) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearFilters}
                                className="h-auto p-0 text-[10px] text-blue-600 hover:text-blue-700 font-bold uppercase tracking-tighter"
                            >
                                Limpiar todo
                            </Button>
                        )}
                    </div>

                    {/* Filter Category: Estatus */}
                    <div className="space-y-4">
                        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Estatus</h3>
                        <div className="space-y-2.5">
                            {filterOptions.status.map(status => (
                                <label key={status} className="flex items-center gap-3 cursor-pointer group">
                                    <Checkbox
                                        checked={selectedStatus.includes(status)}
                                        onCheckedChange={(checked) => {
                                            setSelectedStatus(prev =>
                                                checked
                                                    ? [...prev, status]
                                                    : prev.filter(s => s !== status)
                                            );
                                        }}
                                        className="border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 rounded"
                                    />
                                    <span className={`text-sm transition-colors ${selectedStatus.includes(status) ? 'text-blue-700 font-bold' : 'text-slate-600 group-hover:text-slate-900'}`}>
                                        {status}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Filter Category: Perfil */}
                    <div className="space-y-4">
                        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Perfil de Visita</h3>
                        <div className="space-y-2.5">
                            {filterOptions.profiles.map(profile => (
                                <label key={profile} className="flex items-center gap-3 cursor-pointer group">
                                    <Checkbox
                                        checked={selectedProfiles.includes(profile)}
                                        onCheckedChange={(checked) => {
                                            setSelectedProfiles(prev =>
                                                checked
                                                    ? [...prev, profile]
                                                    : prev.filter(p => p !== profile)
                                            );
                                        }}
                                        className="border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 rounded"
                                    />
                                    <span className={`text-sm transition-colors ${selectedProfiles.includes(profile) ? 'text-blue-700 font-bold' : 'text-slate-600 group-hover:text-slate-900'}`}>
                                        {profile}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Filter Category: Ubicación */}
                    {filterOptions.locations.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Ubicación / Caseta</h3>
                            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                                {filterOptions.locations.map(location => (
                                    <label key={location} className="flex items-center gap-3 cursor-pointer group">
                                        <Checkbox
                                            checked={selectedLocations.includes(location)}
                                            onCheckedChange={(checked) => {
                                                setSelectedLocations(prev =>
                                                    checked
                                                        ? [...prev, location]
                                                        : prev.filter(l => l !== location)
                                                );
                                            }}
                                            className="border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 rounded"
                                        />
                                        <span className={`text-sm transition-colors ${selectedLocations.includes(location) ? 'text-blue-700 font-bold' : 'text-slate-600 group-hover:text-slate-900'}`}>
                                            {location}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </aside>

                {/* Gallery Grid */}
                <div className="flex-1 min-h-[500px]">
                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                                    <div className="aspect-[4/5] bg-slate-100 animate-pulse" />
                                    <div className="p-4 space-y-3">
                                        <div className="h-4 bg-slate-100 animate-pulse rounded w-3/4" />
                                        <div className="h-3 bg-slate-100 animate-pulse rounded w-1/2" />
                                        <div className="h-8 bg-slate-100 animate-pulse rounded w-full mt-4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filteredData.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 animate-in fade-in duration-500">
                            {filteredData.map((record, index) => {
                                const photoUrl = record.fotografia?.[0]?.file_url?.replace('.jpeg', '.thumbnail');
                                const isEntrada = record.status_visita === 'Entrada';

                                return (
                                    <div
                                        key={record._id || index}
                                        onClick={() => setSelectedRecord(record)}
                                        className="group bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 cursor-pointer flex flex-col"
                                    >
                                        {/* Image Container */}
                                        <div className="aspect-[4/5] relative overflow-hidden bg-slate-100">
                                            {photoUrl ? (
                                                <img
                                                    src={photoUrl}
                                                    alt={record.nombre_visitante}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                                                    <User className="w-12 h-12 mb-2 opacity-50" />
                                                    <span className="text-[10px] uppercase font-bold tracking-widest">Sin Foto</span>
                                                </div>
                                            )}

                                            {/* Status Badge Over Image */}
                                            <div className="absolute top-3 left-3">
                                                <span className={`text-[10px] font-bold px-2 py-1 rounded-md shadow-sm border ${isEntrada
                                                    ? 'bg-emerald-500/90 text-white border-emerald-400'
                                                    : 'bg-red-500/90 text-white border-red-400'
                                                    }`}>
                                                    {record.status_visita?.toUpperCase()}
                                                </span>
                                            </div>

                                            {/* Quick View Overlay */}
                                            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                                <div className="bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                                    <Maximize2 className="w-5 h-5 text-blue-600" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Content Section */}
                                        <div className="p-4 flex-1 flex flex-col">
                                            <div className="mb-auto">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                                        {record.folio}
                                                    </span>
                                                </div>
                                                <h3 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                                                    {record.nombre_visitante}
                                                </h3>
                                                <p className="text-[11px] text-slate-500 mt-1 font-medium italic">
                                                    {record.perfil_visita}
                                                </p>
                                            </div>

                                            <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    <span className="text-[10px] font-medium">{record.fecha_entrada}</span>
                                                </div>
                                                {record.visita_a && record.visita_a.length > 0 && (
                                                    <div className="flex items-center gap-2 text-slate-600">
                                                        <User className="w-3.5 h-3.5" />
                                                        <span className="text-[10px] font-medium truncate">
                                                            Visitó a: <span className="font-bold text-slate-900">{record.visita_a[0].nombre}</span>
                                                        </span>
                                                    </div>
                                                )}
                                                {record.contratista && (
                                                    <div className="flex items-center gap-2 text-slate-600">
                                                        <Briefcase className="w-3.5 h-3.5" />
                                                        <span className="text-[10px] font-medium truncate">
                                                            {Array.isArray(record.contratista)
                                                                ? (record.contratista as any[]).join(', ')
                                                                : String(record.contratista || 'N/A')}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                            <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                                <Search className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-slate-900 font-medium">No se encontraron resultados</h3>
                            <p className="text-slate-500 text-sm">Prueba ajustando los filtros o la búsqueda.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Pagination */}
            <DataTablePagination table={tablePlaceholder as any} total={total} />

            {/* Detail Modal Dialog */}
            <Dialog open={!!selectedRecord} onOpenChange={(open) => !open && setSelectedRecord(null)}>
                <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white border-none shadow-2xl rounded-xl">
                    <DialogTitle className="sr-only">Detalles del Registro</DialogTitle>

                    <div className="flex flex-col md:flex-row min-h-[550px]">
                        {/* Photo Box */}
                        <div className="w-full md:w-3/5 bg-slate-900 flex items-center justify-center relative group/photo">
                            {selectedRecord?.fotografia?.[0]?.file_url ? (
                                <img
                                    src={selectedRecord.fotografia[0].file_url}
                                    alt={selectedRecord.nombre_visitante}
                                    className="max-w-full max-h-[85vh] object-contain animate-in zoom-in-95 duration-500"
                                />
                            ) : (
                                <div className="flex flex-col items-center text-slate-500">
                                    <User className="w-20 h-20 mb-4 opacity-20" />
                                    <span className="text-sm font-medium">Sin fotografía disponible</span>
                                </div>
                            )}

                        </div>

                        {/* Metadata Panel */}
                        <div className="w-full md:w-2/5 p-6 flex flex-col bg-white border-l border-slate-100 overflow-y-auto max-h-[85vh] md:max-h-none">
                            <div className="flex items-center justify-between mb-6">
                                <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-full border border-blue-200">
                                    FOLIO: {selectedRecord?.folio}
                                </span>
                            </div>

                            <div className="space-y-6 flex-1">
                                <div className="pb-4 border-b border-slate-50">
                                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Nombre del Visitante</label>
                                    <h2 className="text-lg font-bold text-slate-900 leading-tight mt-1">
                                        {selectedRecord?.nombre_visitante}
                                    </h2>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                            {selectedRecord?.perfil_visita}
                                        </span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-white ${selectedRecord?.status_visita === 'Entrada' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                                            {selectedRecord?.status_visita}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-5">
                                    {/* Visita a section */}
                                    {selectedRecord?.visita_a && selectedRecord.visita_a.length > 0 && (
                                        <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                                                <User className="w-4 h-4 text-slate-600" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] uppercase font-bold text-slate-400">Visita a</label>
                                                <p className="text-sm font-bold text-slate-900 leading-tight">{selectedRecord.visita_a[0].nombre}</p>
                                                <p className="text-[10px] text-slate-500 mt-0.5">{selectedRecord.visita_a[0].posicion} • {selectedRecord.visita_a[0].departamento}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
                                            <Calendar className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase font-bold text-slate-400">Fecha de Entrada</label>
                                            <p className="text-sm font-medium text-slate-700">{selectedRecord?.fecha_entrada}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100">
                                            <Briefcase className="w-4 h-4 text-amber-600" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase font-bold text-slate-400">Contratista / Empresa</label>
                                            <p className="text-sm font-medium text-slate-700">
                                                {(() => {
                                                    const c = selectedRecord?.contratista;
                                                    return Array.isArray(c) ? c.join(', ') : String(c || 'N/A');
                                                })()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
                                            <Search className="w-4 h-4 text-emerald-600" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase font-bold text-slate-400">Ubicación y Caseta</label>
                                            <p className="text-sm font-medium text-slate-700">
                                                {selectedRecord?.ubicacion}
                                                <span className="text-slate-400 block text-[10px] mt-0.5">{selectedRecord?.caseta_entrada || 'No especificada'}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-4 border-t border-slate-50">
                                <div className="flex flex-col gap-1">
                                    <label className="text-[9px] uppercase font-bold text-slate-300">ID del Pase</label>
                                    <code className="text-[10px] text-slate-400 break-all">{selectedRecord?.pase_id}</code>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default BitacoraImages;