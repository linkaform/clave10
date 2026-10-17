"use client";

import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { ScriptLogRow } from "@/hooks/ScriptLogs/useScriptLogs";

export const formatDuration = (s: number | null) => {
  if (s === null || s === undefined) return "-";
  if (s < 60) return `${s.toFixed(1)} s`;
  const m = Math.floor(s / 60);
  return `${m} min ${Math.round(s - m * 60)} s`;
};

export const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "medium" }) : "-";

export const StatusBadge = ({ row }: { row: ScriptLogRow }) => {
  if (row.status === "running") {
    return <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">En ejecución</Badge>;
  }
  return row.run_success ? (
    <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">Exitoso</Badge>
  ) : (
    <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">Con error</Badge>
  );
};

const HEADERS = ["Opciones", "Estado", "Script", "Usuario", "Inicio", "Fin", "Duración"];

interface Props {
  rows: ScriptLogRow[];
  isLoading?: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export const ScriptLogsTable: React.FC<Props> = ({ rows, isLoading, selectedId, onSelect }) => (
  <div className="border border-slate-200 rounded-md overflow-hidden bg-white shadow-sm">
    <Table className="text-xs">
      <TableHeader className="bg-[#DBEAFE] hover:bg-[#DBEAFE] border-b border-slate-200">
        <TableRow className="hover:bg-transparent border-none">
          {HEADERS.map((h) => (
            <TableHead key={h} className="text-slate-600 h-10 font-medium uppercase tracking-wider py-2 px-3 shadow-none">
              {h}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length > 0 ? (
          rows.map((r) => (
            <TableRow
              key={r.id}
              data-state={selectedId === r.id ? "selected" : undefined}
              className="hover:bg-slate-100 transition-colors border-slate-50"
            >
              <TableCell className="py-2 px-3 border-r border-slate-100">
                <button
                  type="button"
                  title="Ver log"
                  data-script-log-eye
                  className="text-slate-500 hover:text-blue-600"
                  onClick={() => onSelect(r.id)}
                >
                  <Eye className="w-4 h-4" />
                </button>
              </TableCell>
              <TableCell className="py-2 px-3 border-r border-slate-100"><StatusBadge row={r} /></TableCell>
              <TableCell className="py-2 px-3 border-r border-slate-100">{r.script_name}</TableCell>
              <TableCell className="py-2 px-3 border-r border-slate-100">{r.user_name}</TableCell>
              <TableCell className="py-2 px-3 border-r border-slate-100">{formatDate(r.start_date)}</TableCell>
              <TableCell className="py-2 px-3 border-r border-slate-100">{formatDate(r.end_date)}</TableCell>
              <TableCell className="py-2 px-3">{formatDuration(r.duration)}</TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={HEADERS.length} className="h-32 text-center">
              <span className="text-base text-slate-400 font-normal">
                {isLoading ? "Cargando logs..." : "No se encontraron logs"}
              </span>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </div>
);
