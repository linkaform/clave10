"use client";

import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";
import debounce from "lodash.debounce";

interface PageHeaderProps {
  title: string;
  totalRecords?: number;
  onSearch: (value: string) => void;
  searchPlaceholder?: string;
  children?: React.ReactNode;
}

export const PageHeader = ({
  title,
  totalRecords,
  onSearch,
  searchPlaceholder = "Buscar...",
  children,
}: PageHeaderProps) => {
  const [searchInput, setSearchInput] = useState("");

  const debouncedSearch = useMemo(
    () => debounce((val: string) => onSearch(val), 400),
    [onSearch],
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    debouncedSearch(e.target.value);
  };

  return (
    <div className="flex items-center justify-between w-full gap-4 sticky top-[57px] z-40 bg-white py-2">
      <div className="flex items-baseline gap-2 min-w-fit">
        <h1 className="text-xl font-bold text-slate-900 whitespace-nowrap">
          {title}
        </h1>
        <span className="text-sm font-light text-slate-500 whitespace-nowrap">
          {totalRecords ?? 0} registros
        </span>
      </div>

      <div className="flex items-center gap-3 min-w-0 justify-end flex-shrink-0">
        <div className="flex p-1 rounded-lg items-center border border-slate-200 w-[220px] overflow-hidden focus-within:ring-1 focus-within:ring-blue-400 focus-within:border-blue-400 bg-white transition-all">
          <Search
            className="ml-2 mr-1 flex-shrink-0 text-slate-400"
            size={14}
          />
          <input
            type="text"
            value={searchInput}
            onChange={handleSearchChange}
            placeholder={searchPlaceholder}
            className="w-full bg-transparent border-none shadow-none outline-none h-8 text-sm min-w-0 px-1"
          />
        </div>

        {children}
      </div>
    </div>
  );
};
