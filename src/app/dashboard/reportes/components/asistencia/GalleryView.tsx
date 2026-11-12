"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CalendarDays, CameraOff, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAttendanceData } from "../../hooks/useAsistenciasReport";
import { StatusChip } from "../attendanceStatus";
import { CloseButton, EvidencePhotos } from "../drawerParts";
import { amd, fromISO, toISO } from "../../reporte_asistencias/lib/period";
import { Empty, Pager, matches } from "./ui";

type Raw = Record<string, any>;

const hh = (v?: string | null) => v?.substring(11, 16);
const pic = (p: any) => (p && !Array.isArray(p) ? p.file_url : Array.isArray(p) ? p[0]?.file_url : undefined) as string | undefined;

// Estatus del registro de check-in con el catálogo del reporte
const statusOf = (r: Raw) => {
  if (!r.attendance_end_time) return r.attendance_start_time?.substring(0, 10) === toISO(new Date()) ? "en_turno" : "sin_salida";
  const s = String(r.attendance_status || "").toLowerCase();
  return s === "retardo" ? "retardo" : s.startsWith("falta") ? "falta" : "presente";
};

const Card = ({ r, locations, onOpen }: { r: Raw; locations: boolean; onOpen: () => void }) => {
  const start = pic(r.attendance_start_pic);
  const end = pic(r.attendance_end_pic);
  const status = statusOf(r);
  const fecha = r.attendance_start_time?.substring(0, 10);
  const sub = locations
    ? [r.attendance_location, r.attendance_area].filter(Boolean).join(" · ")
    : [r.attendance_position, r.attendance_area].filter(Boolean).join(" · ");
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex flex-col overflow-hidden rounded-xl border border-c10-line-card bg-c10-surface text-left shadow-[0_1px_2px_rgba(15,23,42,.06),0_4px_10px_rgba(15,23,42,.06)] transition-[box-shadow,transform] duration-150 hover:-translate-y-[3px] hover:shadow-[0_2px_4px_rgba(15,23,42,.06),0_14px_30px_rgba(15,23,42,.12)] active:translate-y-0 active:shadow-[0_0_0_2px_var(--button-primary)]"
    >
      <span className="relative block aspect-[4/3] w-full bg-c10-sunken">
        {start ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={start} alt={`Foto de entrada de ${r.attendance_name}`} className="absolute inset-0 h-full w-full object-cover" />
            {end && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={end} alt={`Foto de salida de ${r.attendance_name}`} className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
            )}
          </>
        ) : (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-xs text-c10-meta"><CameraOff size={20} aria-hidden="true" />Sin foto</span>
        )}
        <span className="absolute right-2 top-2"><StatusChip status={status} label={status === "en_turno" ? "En turno" : undefined} /></span>
        <span className="absolute bottom-2 left-2 rounded-md bg-slate-900/70 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-white">
          <span className="group-hover:hidden">Entrada {hh(r.attendance_start_time)}</span>
          <span className="hidden group-hover:inline">{end ? `Salida ${hh(r.attendance_end_time)}` : `Entrada ${hh(r.attendance_start_time)}`}</span>
        </span>
      </span>
      <span className="flex flex-col gap-1.5 p-3">
        <span>
          <b className="block truncate text-sm font-semibold text-c10-title">{r.attendance_name || "Sin nombre"}</b>
          {sub && <span className="block truncate text-xs text-c10-secondary">{sub}</span>}
        </span>
        {r.attendance_horario && (
          <span className="inline-flex h-[22px] w-fit max-w-full items-center truncate rounded-full bg-c10-sunken px-[9px] text-[11px] font-semibold text-c10-label">{r.attendance_horario}</span>
        )}
        <span className="flex flex-col gap-1 text-xs text-c10-secondary">
          <span className="flex items-center gap-1.5"><MapPin size={12} aria-hidden="true" className="text-c10-faint" />{r.attendance_location || "---"}</span>
          <span className="flex items-center gap-1.5 tabular-nums"><Clock size={12} aria-hidden="true" className="text-c10-faint" />{hh(r.attendance_start_time)} → {r.attendance_end_time ? hh(r.attendance_end_time) : status === "en_turno" ? "En turno" : "Sin salida"}</span>
          <span className="flex items-center gap-1.5 tabular-nums"><CalendarDays size={12} aria-hidden="true" className="text-c10-faint" />{fecha ? amd(fromISO(fecha)) : "---"}</span>
        </span>
      </span>
    </button>
  );
};

// Galería: una tarjeta por registro de check-in del periodo (paginado en el servidor)
export const GalleryView = ({ dateFrom, dateTo, search, locations }: { dateFrom: string; dateTo: string; search: string; locations: boolean }) => {
  const [size, setSize] = useState(15);
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<Raw | null>(null);
  useEffect(() => setPage(1), [dateFrom, dateTo, size]);

  const { attendanceData, pagination, isLoadingAttendance, errorAttendance, refetchAttendance } = useAttendanceData({
    dateFrom,
    dateTo,
    limit: size,
    offset: (page - 1) * size,
  });
  const records = useMemo(
    () => (attendanceData as Raw[]).filter(r => matches(`${r.attendance_name ?? ""} ${r.attendance_location ?? ""} ${r.attendance_area ?? ""}`, search)),
    [attendanceData, search],
  );

  if (errorAttendance) {
    return (
      <div className="p-8 text-center">
        <p className="mb-2 text-red-600">Error al cargar los registros</p>
        <Button onClick={() => refetchAttendance()}>Reintentar</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {isLoadingAttendance ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3" aria-busy="true" aria-label="Cargando">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-c10-line-card bg-c10-surface">
              <Skeleton className="aspect-[4/3] w-full rounded-none" />
              <div className="flex flex-col gap-2 p-3"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /><Skeleton className="h-3 w-2/3" /></div>
            </div>
          ))}
        </div>
      ) : !records.length ? (
        <Empty />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
          {records.map(r => <Card key={r._id ?? r.folio} r={r} locations={locations} onOpen={() => setOpen(r)} />)}
        </div>
      )}
      {!isLoadingAttendance && (
        <Pager
          size={size}
          setSize={setSize}
          page={page}
          setPage={setPage}
          pages={pagination.total_pages || 1}
          total={pagination.total_records}
          sizes={[10, 15, 25, 50]}
        />
      )}

      {open && (
        <div role="dialog" aria-modal="true" aria-label="Registro de asistencia" className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/45 p-4" onClick={() => setOpen(null)}>
          <div className="flex w-[560px] max-w-[calc(100%-32px)] flex-col gap-4 rounded-2xl bg-c10-surface p-6 shadow-[0_20px_40px_rgba(15,23,42,.25)]" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="m-0 text-xl font-semibold tracking-[-.02em] text-c10-title">{open.attendance_name}</h2>
                <span className="text-sm text-c10-secondary">{[open.attendance_location, open.attendance_area].filter(Boolean).join(" · ")}</span>
              </div>
              <CloseButton onClick={() => setOpen(null)} />
            </div>
            <EvidencePhotos
              fecha={open.attendance_start_time?.substring(0, 10) ?? toISO(new Date())}
              person={open.attendance_name}
              registro={[open.attendance_location, open.attendance_area].filter(Boolean).join(" · ")}
              photos={[
                { label: "Check in", stamp: "ENTRADA", url: pic(open.attendance_start_pic), time: hh(open.attendance_start_time), emptyText: "Entrada sin foto" },
                { label: "Check out", stamp: "SALIDA", url: pic(open.attendance_end_pic), time: hh(open.attendance_end_time), emptyText: open.attendance_end_time ? "Salida sin foto" : "No registró salida" },
              ]}
            />
          </div>
        </div>
      )}
    </div>
  );
};
