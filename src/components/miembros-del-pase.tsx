'use client';

import React, { useState } from "react";
import { Users, Upload, Trash2 } from "lucide-react";

import AgregarMiembroModal from "./modals/agregar-miembro-modal";
import EliminarMiembroModal from "./modals/eliminar-miembro-modal";
import ImportarMiembrosModal from "./modals/importar-miembros-modal";
import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

export interface Miembro {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
}

interface MiembrosPaseProps {
  miembros: Miembro[];
  setMiembros: React.Dispatch<React.SetStateAction<Miembro[]>>;
}

const MiembrosPase: React.FC<MiembrosPaseProps> = ({ miembros, setMiembros }) => {
  const [openAgregar, setOpenAgregar] = useState(false);
  const [openEliminar, setOpenEliminar] = useState(false);
  const [openImportar, setOpenImportar] = useState(false);
  const [miembroAEliminar, setMiembroAEliminar] = useState<Miembro | null>(null);
  const [pagination, setPagination] = useState({ page: 0, pageSize: 10 });

  const paginatedMiembros = miembros.slice(
    pagination.page * pagination.pageSize,
    (pagination.page + 1) * pagination.pageSize
  );
  const totalPages = Math.ceil(miembros.length / pagination.pageSize);

  const handleEliminar = () => {
    if (!miembroAEliminar) return;
    setMiembros((prev) => prev.filter((m) => m.id !== miembroAEliminar.id));
    setMiembroAEliminar(null);
    setOpenEliminar(false);
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-blue-50 p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <h1 className="font-semibold text-gray-700">Miembros del pase</h1>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50 text-sm"
              onClick={() => setOpenImportar(true)}
            >
              <Upload className="w-4 h-4 mr-1" />
              Importar Registros
            </Button>
            <Button
              type="button"
              className="rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm"
              onClick={() => setOpenAgregar(true)}
            >
              Agregar
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Teléfono</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedMiembros.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-gray-400 py-8">
                    Al agregar un miembro, aparecerá aquí
                  </TableCell>
                </TableRow>
              ) : (
                paginatedMiembros.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-sm text-gray-700">{m.nombre}</TableCell>
                    <TableCell className="text-sm text-gray-500">{m.email || "—"}</TableCell>
                    <TableCell className="text-sm text-gray-500">{m.telefono || "—"}</TableCell>
                    <TableCell className="text-right">
                      <button
                        type="button"
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        onClick={() => { setMiembroAEliminar(m); setOpenEliminar(true); }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
          <span>Registros por página &nbsp; {pagination.pageSize} &nbsp;·&nbsp; {miembros.length} registros</span>
          <div className="flex gap-2 items-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-lg text-xs"
              disabled={pagination.page === 0}
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
            >
              Anterior
            </Button>
            <span>Página {pagination.page + 1} de {Math.max(totalPages, 1)}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-lg text-xs"
              disabled={pagination.page + 1 >= totalPages}
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
            >
              Siguiente
            </Button>
          </div>
        </div>
      </div>

      <AgregarMiembroModal
        open={openAgregar}
        setOpen={setOpenAgregar}
        onAgregar={(m: Miembro) => setMiembros((prev) => [...prev, m])}
      />

      <EliminarMiembroModal
        open={openEliminar}
        setOpen={setOpenEliminar}
        onEliminar={handleEliminar}
      />

        <ImportarMiembrosModal
        open={openImportar}
        setOpen={setOpenImportar}
        onImportar={(nuevos) => setMiembros((prev) => [...prev, ...nuevos])}
        />
    </>
  );
};

export default MiembrosPase;