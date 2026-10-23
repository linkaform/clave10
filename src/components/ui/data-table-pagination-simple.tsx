"use client"

import { OnChangeFn, PaginationState } from "@tanstack/react-table"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface Props {
    pagination: PaginationState
    setPagination: OnChangeFn<PaginationState>
    /** Filas de la página actual. */
    rowsOnPage: number
    hasNext: boolean
}

// Variante de DataTablePagination para colecciones enormes (logs): contar el
// total es lo caro, así que solo se sabe si hay página anterior y siguiente.
export function DataTablePaginationSimple({
    pagination,
    setPagination,
    rowsOnPage,
    hasNext,
}: Props) {
    const { pageIndex, pageSize } = pagination
    const from = rowsOnPage === 0 ? 0 : pageIndex * pageSize + 1
    const to = pageIndex * pageSize + rowsOnPage

    return (
        <div className="flex items-center justify-between px-2 py-4 border-t bg-white">
            <div className="flex-1 text-sm text-muted-foreground">
                <span className="hidden md:inline">
                    Mostrando {from} a {to}
                </span>
            </div>
            <div className="flex items-center space-x-6 lg:space-x-8">
                <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium">Registros por página</p>
                    <Select
                        value={`${pageSize}`}
                        onValueChange={(value) =>
                            setPagination({ pageIndex: 0, pageSize: Number(value) })
                        }
                    >
                        <SelectTrigger className="h-8 w-[70px]">
                            <SelectValue placeholder={pageSize} />
                        </SelectTrigger>
                        <SelectContent side="top">
                            {[10, 20, 30, 40, 50, 100, 200, 300].map((size) => (
                                <SelectItem key={size} value={`${size}`}>
                                    {size}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                    Página {pageIndex + 1}
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => setPagination({ pageIndex: pageIndex - 1, pageSize })}
                        disabled={pageIndex === 0}
                    >
                        <span className="sr-only">Go to previous page</span>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => setPagination({ pageIndex: pageIndex + 1, pageSize })}
                        disabled={!hasNext}
                    >
                        <span className="sr-only">Go to next page</span>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
