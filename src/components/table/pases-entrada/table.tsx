"use client";
/* eslint-disable react-hooks/exhaustive-deps */

import * as React from "react";
import {
  ColumnFiltersState,
  Row,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";
import SearchPases from "@/components/pages/pases/SearchPases";
import UpdateFullPassModal from "@/components/modals/update-full-pass";
import { useMemo, useState } from "react";
import { OptionsCell } from "./pases-entrada-columns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { capitalizeFirstLetter } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

  interface ListProps {
    isLoading:boolean;
    pases: any[];
    onSearch: (value: string) => void;
  }

const PasesEntradaTable:React.FC<ListProps> = ({ isLoading, pases, onSearch})=>{
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
      []
    );
    const [columnVisibility, setColumnVisibility] =
      React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});

    const [globalFilter, setGlobalFilter] = React.useState("");
    const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
    const [paseSeleccionado, setPaseSeleccionado] = useState<any | null>(null);



    const handleEditar = (pase: any) => {
      setPaseSeleccionado(pase);
      setModalEditarAbierto(true);
    };
 

    const columns = useMemo(() => {
      if (isLoading) return [];
         return [
      {
        id: "options",
        header: "Opciones",
        cell: ({row}: { row: Row<any> }) => <OptionsCell  onEditarClick={handleEditar}  row={row} key={row.original._id}/>,
        enableSorting: false,
      },
      {
        accessorKey: "pase",
        header: "Nombre",
        cell: ({ row }: { row: Row<any> }) => {
          const foto = row.original.foto;
          const nombre = row.original.nombre;
          const estatus = row.original.estatus;
          const primeraImagen = foto && foto.length > 0 ? foto[0].file_url : '/nouser.svg';
    
          return (
            <div className="flex items-center space-x-4">
            <div>
              {primeraImagen ? (
                <>
                <Avatar>
                  <AvatarImage src={primeraImagen} alt="Avatar" className="object-cover"/>
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                </>
              ) : (
              <span>No hay imagen</span>
              )}
            </div>
          <div className="flex flex-col">
          <span className="font-bold">{nombre}</span>
            <div>
              <Badge
              className={`text-white text-sm ${
                estatus?.toLowerCase() == "vencido"
                ? "bg-red-600 hover:bg-red-600"
                : estatus?.toLowerCase() == "activo"
                ? "bg-green-600 hover:bg-green-600"
                : estatus?.toLowerCase() == "proceso"
                ? "bg-blue-600 hover:bg-blue-600"
                : "bg-gray-400"
              }`}
              >
              {capitalizeFirstLetter(estatus)}
              </Badge>
            </div>
          </div>
            </div>
          );
        },
        enableSorting: false, 
      },
      {
        accessorKey: "visita_a",
        header: "Visita a",
        cell: ({ row }: { row: Row<any> }) => {
          const visitaA = row.getValue("visita_a");
          let nombre = "-";
          
          if (Array.isArray(visitaA) && visitaA.length > 0) {
            nombre = visitaA[0]?.nombre || "-";
          } else if (typeof visitaA === "string") {
            nombre = visitaA;
          }
          
          return <div>{nombre}</div>;
        },
        enableSorting: true,
      },   
      {
        accessorKey: "autorizado_por",
        header: "Autorizado Por",
        cell: ({ row }: { row: Row<any> }) => <div>{row.getValue("autorizado_por")}</div>,
        enableSorting: true,
      },   
      {
        accessorKey: "ubicacion",
        header: "Ubicación",
        cell: ({ row }: { row: Row<any> }) => {
          return (
            <div className="w-full flex gap-2">
              <div className="relative group w-full break-words">
                {Array.isArray(row.original?.ubicacion) && row.original.ubicacion.length > 0 ? row.original.ubicacion[0] : ""}
                {Array.isArray(row.original?.ubicacion) && row.original.ubicacion.length > 1 && (
    
                <span className="text-blue-600 cursor-pointer ml-1 underline relative">
                  +{row.original?.ubicacion.length - 1}
                  <div className="absolute left-0 top-full z-10 mt-1 hidden w-max max-w-xs rounded bg-gray-800 px-2 py-1 text-sm text-white shadow-lg group-hover:block">
                  {Array.isArray(row.original?.ubicacion) && row.original.ubicacion.length > 1 && (
                    row.original.ubicacion.slice(1).map((ubic:string, idx:number) => (
                      <div key={idx}>{ubic}</div>
                    ))
                    )}
                  </div>
                </span>
                )}
              </div>
          </div>
          )
        },
        enableSorting: true,
      },
      {
        accessorKey: "folio",
        header: "Folio",
        cell: ({ row }: { row: Row<any> }) => <div>{row.getValue("folio")}</div>,
        enableSorting: true,
      },
      {
        accessorKey: "fecha_desde_visita", 
        header: "Fecha de creación", 
        cell: ({ row }: { row: Row<any> }) => {
          const fecha = row.getValue("fecha_desde_visita");
          const fechaSinSegundos = typeof fecha === 'string' ? fecha.slice(0, -3) : '';
          return <div>{fechaSinSegundos}</div>;
        },
        enableSorting: true,
      },
      {
        accessorKey: "fecha_desde_hasta", 
        header: "Vigencia del Pase",  
        cell: ({ row }: { row: Row<any> }) => {
          const fecha = row.getValue("fecha_desde_hasta");
          const fechaSinSegundos = typeof fecha === 'string' ? fecha.slice(0, -3) : '';
          return <div>{fechaSinSegundos}</div>;
        },
        enableSorting: true,
      },
      {
        accessorKey: "limite_de_acceso",
        header: "Limite de Entradas",
        cell: ({ row }: { row: Row<any> }) => {
          const total_entradas = row.original.total_entradas;
          const limite_entradas = row.original.limite_de_acceso ?? 1;
          return <div>{total_entradas} / {limite_entradas}</div>;
        },
        enableSorting: true,
      },
      {
        accessorKey: "limitado_a_dias",
        header: "Días de acceso",
        cell: ({ row }: { row: Row<any> }) => {
          const dias = row.original.limitado_a_dias;
      
          if (!dias || dias.length === 0) {
            return <span className="text-gray-400 italic">Todos los días</span>;
          }
      
          return (
            <div className="flex flex-wrap gap-1">
              {dias.map((dia:number, index:number) => (
                <Badge
                  key={index}
                  className="bg-blue-100 text-blue-800 hover:bg-blue-200 text-sm font-semibold px-2.5 py-0.5 rounded-full"
                >
                  {dia}
                </Badge>
              ))}
            </div>
          );
        },
      },
    ];
  }, [isLoading, handleEditar]);
    
  const memoizedData = useMemo(() => pases || [], [pases]);

  const table = useReactTable({
    data: memoizedData || [],
    columns: columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,

    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  });

    return (
      <div className="w-full">
        <div className="flex justify-between items-center my-5">
          <div id="searchpases">
            <SearchPases onSearch={onSearch} />
          </div>

          {/* Botones a la derecha */}
          <div className="flex items-center justify-end space-x-4">

          <Link href="/dashboard/pase-entrada">

            <Button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2">
              <Plus />
              Nuevo Pase
            </Button>

            </Link>
          </div>
        </div>

        <div className="">

        {modalEditarAbierto && paseSeleccionado && (
					<UpdateFullPassModal dataPass={paseSeleccionado}
          modalEditarAbierto={modalEditarAbierto}
          setModalEditarAbierto={setModalEditarAbierto}
					
					/>
				)}


        <ScrollArea className="h-100 w-full border rounded-md">
          <Table>
          <TableHeader className="bg-[#F0F2F5]">
          {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} className="px-1">
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
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="p-1 pl-1">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    {isLoading ? "Cargando registros..." : "No hay registros disponibles"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          </ScrollArea>

        </div>
      </div>
    );
}
export default PasesEntradaTable;