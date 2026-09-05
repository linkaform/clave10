"use client";

import { flexRender, Header } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface SortableTableHeadProps<TData> {
  header: Header<TData, unknown>;
  className?: string;
}

export function SortableTableHead<TData>({ header, className }: SortableTableHeadProps<TData>) {
  const canSort = header.column.getCanSort();
  const sorted = header.column.getIsSorted();

  return (
    <TableHead
      key={header.id}
      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
      className={cn(className, canSort && "cursor-pointer select-none")}>
      {header.isPlaceholder ? null : (
        <div className="flex items-center gap-1">
          {flexRender(header.column.columnDef.header, header.getContext())}
          {canSort && (
            sorted === "asc" ? <ArrowUp className="w-3 h-3 shrink-0" />
            : sorted === "desc" ? <ArrowDown className="w-3 h-3 shrink-0" />
            : <ArrowUpDown className="w-3 h-3 shrink-0 opacity-30" />
          )}
        </div>
      )}
    </TableHead>
  );
}
