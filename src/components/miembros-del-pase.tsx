'use client';

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Users, Upload, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import EliminarMiembroModal from "./modals/eliminar-miembros.modal";
import ImportarMiembrosModal from "./modals/importar-miembros-modal";

export interface Miembro {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  foto?: string;
  estatus?: string;
  tipo_movimiento?: string;
}

interface MiembrosPaseProps {
  miembros: Miembro[];
  setMiembros: React.Dispatch<React.SetStateAction<Miembro[]>>;
  rowErrors: Record<string, { email: boolean; telefono: boolean }>;
  setRowErrors: React.Dispatch<React.SetStateAction<Record<string, { email: boolean; telefono: boolean }>>>;
}

const isValidEmail = (val: string) =>
  !val || /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(val);

const isValidPhone = (val: string) => !val || val.replace(/[\s\-().+]/g, "").length >= 7;

const EMPTY_ROW = (): Miembro => ({
  id: crypto.randomUUID(),
  nombre: "",
  email: "",
  telefono: "",
});

const MiembrosPase: React.FC<MiembrosPaseProps> = ({ miembros, setMiembros, rowErrors, setRowErrors }) => {
  const [openEliminar, setOpenEliminar] = useState(false);
  const [openImportar, setOpenImportar] = useState(false);
  const [miembroAEliminar, setMiembroAEliminar] = useState<Miembro | null>(null);
  const [pagination, setPagination] = useState({ page: 0, pageSize: 10 });
  const [draftRow, setDraftRow] = useState<Miembro>(EMPTY_ROW());
  const [draftErrors, setDraftErrors] = useState({ email: false, telefono: false });

  const paginatedMiembros = miembros.slice(
    pagination.page * pagination.pageSize,
    (pagination.page + 1) * pagination.pageSize
  );
  const totalPages = Math.ceil(miembros.length / pagination.pageSize);

  const hasAnyError =
    Object.values(rowErrors).some((e) => e.email || e.telefono) ||
    draftErrors.email || draftErrors.telefono;

  // Edit saved row
  const handleEditCell = (id: string, field: keyof Miembro, value: string) => {
    setMiembros((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  // Validate on blur for saved rows
  const handleBlurSaved = (id: string, field: "email" | "telefono", value: string) => {
    const invalid =
      field === "email" ? !isValidEmail(value) : !isValidPhone(value);
    setRowErrors((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || { email: false, telefono: false }), [field]: invalid },
    }));
  };

  // Validate on blur for draft row
  const handleBlurDraft = (field: "email" | "telefono") => {
    const value = field === "email" ? draftRow.email : draftRow.telefono;
    const invalid = field === "email" ? !isValidEmail(value) : !isValidPhone(value);
    setDraftErrors((prev) => ({ ...prev, [field]: invalid }));
  };

  const commitDraft = () => {
    if (!draftRow.nombre.trim()) return;
    const emailErr = !isValidEmail(draftRow.email);
    const phoneErr = !isValidPhone(draftRow.telefono);
    const newMiembro = { ...draftRow };
    setMiembros((prev) => [...prev, newMiembro]);
    // Si la fila tiene errores, registrarlos en rowErrors para que persistan en la tabla
    if (emailErr || phoneErr) {
      setRowErrors((prev) => ({
        ...prev,
        [newMiembro.id]: { email: emailErr, telefono: phoneErr },
      }));
    }
    setDraftRow(EMPTY_ROW());
    setDraftErrors({ email: false, telefono: false });
    setTimeout(() => document.getElementById("draft-nombre")?.focus(), 50);
  };

  const handleDraftKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, field: "nombre" | "email" | "telefono") => {
    if (e.key === "Enter") { e.preventDefault(); commitDraft(); }
    if (e.key === "Tab" && field === "telefono") { e.preventDefault(); commitDraft(); }
  };


  const handleEliminar = () => {
    if (!miembroAEliminar) return;
    setMiembros((prev) => prev.filter((m) => m.id !== miembroAEliminar.id));
    setRowErrors((prev) => { const n = { ...prev }; delete n[miembroAEliminar.id]; return n; });
    setMiembroAEliminar(null);
    setOpenEliminar(false);
  };

  const baseCellClass = "w-full bg-transparent border-none outline-none text-sm placeholder:text-gray-300 focus:ring-0 p-0";
  const errorCellClass = baseCellClass + " text-red-500 placeholder:text-red-300";

  return (
    <>
      <div className="bg-white rounded-2xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <h1 className="font-semibold text-gray-700">Miembros del pase</h1>
          </div>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50 text-sm"
            onClick={() => setOpenImportar(true)}
          >
            <Upload className="w-4 h-4 mr-1" />
            Importar Registros
          </Button>
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
              {paginatedMiembros.map((m) => {
                const err = rowErrors[m.id] || { email: false, telefono: false };
                return (
                  <TableRow key={m.id} className="group">
                    <TableCell className="py-2">
                      <input
                        className={baseCellClass + " text-gray-700"}
                        value={m.nombre}
                        onChange={(e) => handleEditCell(m.id, "nombre", e.target.value)}
                      />
                    </TableCell>
                    <TableCell className="py-2">
                      <input
                        className={err.email ? errorCellClass : baseCellClass + " text-gray-700"}
                        value={m.email}
                        onChange={(e) => handleEditCell(m.id, "email", e.target.value)}
                        onBlur={(e) => handleBlurSaved(m.id, "email", e.target.value)}
                      />
                    </TableCell>
                    <TableCell className="py-2">
                      <PhoneInput
                        defaultCountry="MX"
                        value={m.telefono}
                        onChange={(value) => handleEditCell(m.id, "telefono", value || "")}
                        onBlur={() => handleBlurSaved(m.id, "telefono", m.telefono)}
                        containerComponentProps={{
                          className: err.telefono
                            ? "flex w-full bg-transparent text-red-500"
                            : "flex w-full bg-transparent",
                        }}
                        numberInputProps={{
                          className: "bg-transparent border-none outline-none text-sm w-full focus:ring-0 p-0 " + (err.telefono ? "text-red-500 placeholder:text-red-300" : "text-gray-700 placeholder:text-gray-300"),
                        }}
                      />
                    </TableCell>
                    <TableCell className="text-right py-2">
                      <button
                        type="button"
                        className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        onClick={() => { setMiembroAEliminar(m); setOpenEliminar(true); }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}

              {/* Fila draft */}
              <TableRow className="bg-blue-50/30">
                <TableCell className="py-2">
                  <input
                    id="draft-nombre"
                    className={baseCellClass + " text-gray-700 placeholder:text-gray-400"}
                    placeholder="Nombre *"
                    value={draftRow.nombre}
                    onChange={(e) => setDraftRow((d) => ({ ...d, nombre: e.target.value }))}
                    onKeyDown={(e) => handleDraftKeyDown(e, "nombre")}
                  />
                </TableCell>
                <TableCell className="py-2">
                  <input
                    className={draftErrors.email ? errorCellClass : baseCellClass + " text-gray-700 placeholder:text-gray-400"}
                    placeholder="Email"
                    type="email"
                    value={draftRow.email}
                    onChange={(e) => setDraftRow((d) => ({ ...d, email: e.target.value }))}
                    onBlur={() => handleBlurDraft("email")}
                    onKeyDown={(e) => {
                      if (e.key === "Tab") {
                        e.preventDefault();
                        // Saltar directo al input numérico ignorando el selector de país
                        document.getElementById("draft-telefono-input")?.focus();
                      }
                      if (e.key === "Enter") { e.preventDefault(); commitDraft(); }
                    }}
                  />
                </TableCell>
                <TableCell className="py-2">
                  <div
                    onKeyDown={(e) => {
                      if (e.key === "Tab") { e.preventDefault(); commitDraft(); }
                      if (e.key === "Enter") { e.preventDefault(); commitDraft(); }
                    }}
                  >
                    <PhoneInput
                      defaultCountry="MX"
                      value={draftRow.telefono}
                      onChange={(value) => setDraftRow((d) => ({ ...d, telefono: value || "" }))}
                      onBlur={() => handleBlurDraft("telefono")}
                      containerComponentProps={{
                        className: draftErrors.telefono
                          ? "flex w-full bg-transparent text-red-500"
                          : "flex w-full bg-transparent",
                      }}
                      numberInputProps={{
                        id: "draft-telefono-input",
                        className: "bg-transparent border-none outline-none text-sm w-full focus:ring-0 p-0 " + (draftErrors.telefono ? "text-red-500 placeholder:text-red-300" : "text-gray-700 placeholder:text-gray-400"),
                        placeholder: "Teléfono",
                      }}
                    />
                  </div>
                </TableCell>
                <TableCell className="py-2 text-right">
                  {draftRow.nombre.trim() && (
                    <button
                      type="button"
                      className="text-blue-400 hover:text-blue-600 transition-colors text-xs font-medium"
                      onClick={commitDraft}
                    >
                      + Agregar
                    </button>
                  )}
                </TableCell>
              </TableRow>


            </TableBody>
          </Table>
        </div>

        {/* Aviso de errores */}
        {hasAnyError && (
          <p className="text-xs text-red-500 mt-2">
            Los campos marcados en rojo requieren corrección antes de continuar.
          </p>
        )}

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