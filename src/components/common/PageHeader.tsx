"use client";

import React, { useEffect, useMemo, useState } from "react";
import { RefreshCw, Search } from "lucide-react";
import debounce from "lodash.debounce";

interface PageHeaderProps {
  title: string;
  totalRecords?: number;
  onSearch?: (value: string) => void;
  /** Oculta el buscador (pantallas que filtran solo desde el panel de filtros). */
  hideSearch?: boolean;
  /** Si se pasa, muestra un boton de actualizar junto al contador. */
  onRefresh?: () => void;
  isRefreshing?: boolean;
  searchPlaceholder?: string;
  children?: React.ReactNode;
  /** Cambia este valor (ej. un contador) para limpiar el input de búsqueda desde afuera. */
  resetSignal?: number | string;
  /** Muestra el contador como una pastilla gris parpadeando mientras llega el total. */
  isLoadingTotal?: boolean;
  /** Reemplaza el input de búsqueda simple (ej. por FacetSearch) y le da todo el ancho libre. */
  search?: React.ReactNode;
}

export const PageHeader = ({
  title,
  totalRecords,
  onSearch,
  hideSearch = false,
  onRefresh,
  isRefreshing = false,
  searchPlaceholder = "Buscar...",
  children,
  resetSignal,
  search,
  isLoadingTotal = false,
}: PageHeaderProps) => {
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    if (resetSignal !== undefined) setSearchInput("");
  }, [resetSignal]);

  const debouncedSearch = useMemo(
    () => debounce((val: string) => onSearch?.(val), 400),
    [onSearch],
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    debouncedSearch(e.target.value);
  };

  return (
    <div className="flex flex-wrap items-center justify-between w-full gap-x-4 gap-y-2 sticky top-[57px] z-40 bg-white py-2">
      <div className="flex items-baseline gap-2 min-w-fit">
        <h1 className="text-xl font-bold text-slate-900 whitespace-nowrap">
          {title}
        </h1>
        {/* La pastilla de carga se monta encima del texto (que queda invisible
            pero ocupando su lugar) para que el header no cambie de ancho. */}
        <span className="relative text-sm font-light text-slate-500 whitespace-nowrap">
          <span className={isLoadingTotal ? "invisible" : ""}>
            {(totalRecords ?? 0).toLocaleString("en-US")} registros
          </span>
          {isLoadingTotal && (
            <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-5 rounded-full bg-slate-200 animate-pulse" />
          )}
        </span>
        {onRefresh && (
          <button
            type="button"
            title="Actualizar"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="self-center p-1 rounded-md text-slate-500 hover:text-blue-600 hover:bg-slate-100 disabled:opacity-60 transition-colors"
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
          </button>
        )}
      </div>

      <div className={`flex flex-wrap items-center gap-3 min-w-0 ${search ? "flex-1 justify-end" : "justify-start"}`}>
        {search}
        {!search && !hideSearch && (
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
        )}

        {children}
      </div>
    </div>
  );
};
