"use client";

import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { WorkflowLogRow } from "@/hooks/WorkflowLogs/useWorkflowLogs";
import { formatDate } from "@/components/ScriptLogs/ScriptLogsTable";

export const WorkflowStatusBadge = ({ row }: { row: WorkflowLogRow }) =>
  row.success === false ? (
    <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">Con error</Badge>
  ) : row.success ? (
    <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">Exitoso</Badge>
  ) : (
    <Badge className="bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-100">Sin estado</Badge>
  );

const HEADERS = ["Opciones", "Estado", "Workflow", "Acción", "Evento", "Formulario", "Folio", "Usuario", "Fecha"];

interface Props {
  rows: WorkflowLogRow[];
  isLoading?: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export const WorkflowLogsTable: React.FC<Props> = ({ rows, isLoading, selectedId, onSelect }) => (
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
                  title="Ver detalle"
                  data-workflow-log-eye
                  className="text-slate-500 hover:text-blue-600"
                  onClick={() => onSelect(r.id)}
                >
                  <Eye className="w-4 h-4" />
                </button>
              </TableCell>
              <TableCell className="py-2 px-3 border-r border-slate-100"><WorkflowStatusBadge row={r} /></TableCell>
              <TableCell className="py-2 px-3 border-r border-slate-100">{r.name}</TableCell>
              <TableCell className="py-2 px-3 border-r border-slate-100">{r.rule_label}</TableCell>
              <TableCell className="py-2 px-3 border-r border-slate-100">{r.event_label}</TableCell>
              <TableCell className="py-2 px-3 border-r border-slate-100">{r.form_name}</TableCell>
              <TableCell className="py-2 px-3 border-r border-slate-100">{r.folio}</TableCell>
              <TableCell className="py-2 px-3 border-r border-slate-100">{r.user_name}</TableCell>
              <TableCell className="py-2 px-3">{formatDate(r.created_at)}</TableCell>
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
