"use client";

import Link from "next/link";
import { Bell, Inbox } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useBandeja } from "@/hooks/useBandeja";
import { BandejaItemRow } from "./bandeja-item";

// Campana del header: cuántos pendientes tiene en su bandeja y los primeros.
export function BandejaBell() {
  const { data } = useBandeja();
  const pendientes = data?.pendientes ?? 0;
  const primeros = (data?.items ?? []).filter((i) => ["new", "in_progress", "paused"].includes(i.estado)).slice(0, 5);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={pendientes ? `Bandeja: ${pendientes} pendientes` : "Bandeja"}
          className="relative mr-1 flex h-11 w-11 items-center justify-center rounded-[10px] text-slate-600 transition-colors hover:bg-slate-100 data-[state=open]:bg-slate-100">
          <Bell className="h-5 w-5" />
          {pendientes > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-semibold text-white">
              {pendientes > 99 ? "99+" : pendientes}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5">
          <span className="text-sm font-semibold text-slate-900">Tu bandeja</span>
          <span className="text-xs text-slate-500">{pendientes} pendientes</span>
        </div>
        {primeros.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
            <Inbox className="h-6 w-6 text-slate-300" />
            <div className="text-sm font-medium text-slate-700">Tu bandeja está al día</div>
            <div className="text-xs text-slate-500">Aquí verás los rondines y pendientes que te asignen.</div>
          </div>
        ) : (
          <div className="max-h-[360px] divide-y divide-slate-100 overflow-y-auto">
            {primeros.map((i) => (
              <BandejaItemRow key={i.id} item={i} compacto />
            ))}
          </div>
        )}
        <Link
          href="/dashboard/bandeja"
          className="block border-t border-slate-100 px-3 py-2.5 text-center text-sm font-medium text-[#2F80ED] hover:bg-slate-50">
          Ver toda la bandeja
        </Link>
      </PopoverContent>
    </Popover>
  );
}
