"use client";

import React, { useState } from "react";
import { X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Miembro {
  nombre: string;
  foto?: string;
  email?: string;
  telefono?: string;
  estatus?: string;
  status_pase?: string;
  tipo_movimiento?: string;
}

interface MembersModalProps {
  open: boolean;
  onClose: () => void;
  miembros: Miembro[];
}

// const statusColor: Record<string, string> = {
//   pendiente: "bg-red-100 text-red-700 border-red-200",
//   completo:  "bg-green-100 text-green-700 border-green-200",
// };

export const MembersModal: React.FC<MembersModalProps> = ({ open, onClose, miembros }) => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 10;

  if (!open) return null;

  const filtered = miembros.filter((m) =>
    m.nombre?.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-start justify-between px-6 pt-6 pb-2">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Miembros del grupo</h2>
            <p className="text-sm text-slate-400 mt-0.5">{miembros.length} miembros en total</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors mt-0.5"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-3">
          <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50">
            <Search size={15} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Buscar"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none w-full"
            />
          </div>
        </div>

        <div className="overflow-auto flex-1 px-6 pb-6">
          <div className="rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-gray-50 z-10">
                <tr>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-100">Nombre</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-100">Email</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-100">Teléfono</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-100"></th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((miembro, index) => {
                //   const status = (miembro.status_pase ?? miembro.estatus ?? "").toLowerCase();
                //   const cls = statusColor[status] ?? "bg-gray-100 text-gray-600 border-gray-200";
                  return (
                    <tr key={index} className="border-t border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-2.5 font-medium text-slate-700">{miembro.nombre ?? "—"}</td>
                      <td className="px-4 py-2.5 text-slate-500">{miembro.email || "—"}</td>
                      <td className="px-4 py-2.5 text-slate-500">{miembro.telefono || "—"}</td>
                      {/* <td className="px-4 py-2.5">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[10px] font-semibold capitalize ${cls}`}>
                          {miembro.status_pase ?? miembro.estatus ?? "—"}
                        </span>
                      </td> */}
                      <td className="px-4 py-2.5">
                        <div className="flex gap-1.5 justify-end">
                          <button
                            type="button"
                            onClick={() => toast.success("Servicio pendiente en back")}
                            className="px-2.5 py-1 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-[10px] font-semibold transition-colors whitespace-nowrap"
                          >
                            Reenviar QR
                          </button>
                          <button
                            type="button"
                            onClick={() => toast.success("Servicio pendiente en back")}
                            className="px-2.5 py-1 rounded-lg bg-orange-400 hover:bg-orange-500 text-white text-[10px] font-semibold transition-colors whitespace-nowrap"
                          >
                            Reenviar Invitación
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-sm text-slate-400 py-8">No se encontraron miembros</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
            <span>Registros por página &nbsp; {pageSize} &nbsp;·&nbsp; {filtered.length} registros</span>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" className="rounded-lg text-xs h-8" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                Anterior
              </Button>
              <span>Página {page + 1} de {Math.max(totalPages, 1)}</span>
              <Button type="button" variant="outline" size="sm" className="rounded-lg text-xs h-8" disabled={page + 1 >= totalPages} onClick={() => setPage(p => p + 1)}>
                Siguiente
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};