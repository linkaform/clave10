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

const ROW_HEIGHT = 41; // px por fila aprox
const MAX_VISIBLE = 15;

const MiembrosPase: React.FC<MiembrosPaseProps> = ({ miembros, setMiembros, rowErrors, setRowErrors }) => {
  const [openImportar, setOpenImportar] = useState(false);
  const [draftRow, setDraftRow] = useState<Miembro>(EMPTY_ROW());
  const [draftErrors, setDraftErrors] = useState({ email: false, telefono: false });

  const hasAnyError =
    Object.values(rowErrors).some((e) => e.email || e.telefono) ||
    draftErrors.email || draftErrors.telefono;

  const handleEditCell = (id: string, field: keyof Miembro, value: string) => {
    setMiembros((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleBlurSaved = (id: string, field: "email" | "telefono", value: string) => {
    const invalid = field === "email" ? !isValidEmail(value) : !isValidPhone(value);
    setRowErrors((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || { email: false, telefono: false }), [field]: invalid },
    }));
  };

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

  const handleEliminarDirecto = (m: Miembro) => {
    setMiembros((prev) => prev.filter((x) => x.id !== m.id));
    setRowErrors((prev) => { const n = { ...prev }; delete n[m.id]; return n; });
  };

  const handleDraftKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, field: "nombre" | "email" | "telefono") => {
    if (e.key === "Enter") { e.preventDefault(); commitDraft(); }
    if (e.key === "Tab" && field === "telefono") { e.preventDefault(); commitDraft(); }
  };

  const baseCellClass = "w-full bg-transparent border-none outline-none text-sm placeholder:text-gray-300 focus:ring-0 p-0";
  const errorCellClass = baseCellClass + " text-red-500 placeholder:text-red-300";

  // Alto máximo del tbody con scroll: 15 filas + fila draft
  const maxBodyHeight = ROW_HEIGHT * MAX_VISIBLE;

  return (
    <>
      <div className="bg-white rounded-2xl">
        {/* Header */}
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

        {/* Texto de formatos soportados */}
        <p className="text-xs text-gray-400 mb-3">
          Puedes importar archivos en formato <span className="font-medium text-gray-500">CSV, XLS, XLSX u ODS</span>.
        </p>

        {/* Tabla con scroll */}
        <div className="rounded-xl border border-gray-100 overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                {/* Nombre: flex-1, email: más ancho, tel: más justo */}
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide w-[30%]">Nombre</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide w-[37%]">Email</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide w-[28%]">Teléfono</TableHead>
                <TableHead className="w-[5%]" />
              </TableRow>
            </TableHeader>
          </Table>

          {/* Tbody scrolleable separado del header fijo */}
          <div
            className="overflow-y-auto"
            style={{ maxHeight: `${maxBodyHeight}px` }}
          >
            <Table>
              <TableBody>
                {miembros.map((m) => {
                  const err = rowErrors[m.id] || { email: false, telefono: false };
                  return (
                    <TableRow key={m.id} className="group">
                      <TableCell className="py-2 w-[30%]">
                        <input
                          className={baseCellClass + " text-gray-700"}
                          value={m.nombre}
                          onChange={(e) => handleEditCell(m.id, "nombre", e.target.value)}
                        />
                      </TableCell>
                      <TableCell className="py-2 w-[37%]">
                        <input
                          className={err.email ? errorCellClass : baseCellClass + " text-gray-700"}
                          value={m.email}
                          onChange={(e) => handleEditCell(m.id, "email", e.target.value)}
                          onBlur={(e) => handleBlurSaved(m.id, "email", e.target.value)}
                        />
                      </TableCell>
                      <TableCell className="py-2 w-[28%]">
                        <PhoneInput
                          defaultCountry="MX"
                          value={m.telefono}
                          onChange={(value) => handleEditCell(m.id, "telefono", value || "")}
                          onBlur={() => handleBlurSaved(m.id, "telefono", m.telefono)}
                          containerComponentProps={{
                            className: err.telefono ? "flex w-full bg-transparent" : "flex w-full bg-transparent",
                          }}
                          numberInputProps={{
                            className: "bg-transparent border-none outline-none text-sm w-full focus:ring-0 p-0 " +
                              (err.telefono ? "text-red-500 placeholder:text-red-300" : "text-gray-700 placeholder:text-gray-300"),
                          }}
                        />
                      </TableCell>
                      <TableCell className="text-right py-2 w-[5%]">
                        <button
                          type="button"
                          className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          onClick={() => handleEliminarDirecto(m)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {/* Fila draft — siempre al final */}
                <TableRow className="bg-blue-50/30">
                  <TableCell className="py-2 w-[30%]">
                    <input
                      id="draft-nombre"
                      className={baseCellClass + " text-gray-700 placeholder:text-gray-400"}
                      placeholder="Nombre *"
                      value={draftRow.nombre}
                      onChange={(e) => setDraftRow((d) => ({ ...d, nombre: e.target.value }))}
                      onKeyDown={(e) => handleDraftKeyDown(e, "nombre")}
                    />
                  </TableCell>
                  <TableCell className="py-2 w-[37%]">
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
                          document.getElementById("draft-telefono-input")?.focus();
                        }
                        if (e.key === "Enter") { e.preventDefault(); commitDraft(); }
                      }}
                    />
                  </TableCell>
                  <TableCell className="py-2 w-[28%]">
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
                          className: "flex w-full bg-transparent",
                        }}
                        numberInputProps={{
                          id: "draft-telefono-input",
                          className: "bg-transparent border-none outline-none text-sm w-full focus:ring-0 p-0 " +
                            (draftErrors.telefono ? "text-red-500 placeholder:text-red-300" : "text-gray-700 placeholder:text-gray-400"),
                          placeholder: "Teléfono",
                        }}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="py-2 text-right w-[5%]">
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
        </div>

        {/* Contador de registros */}
        <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
          <span>{miembros.length} registro{miembros.length !== 1 ? "s" : ""}</span>
          {hasAnyError && (
            <p className="text-xs text-red-500">
              Los campos marcados en rojo requieren corrección.
            </p>
          )}
        </div>
      </div>

      <ImportarMiembrosModal
        open={openImportar}
        setOpen={setOpenImportar}
        onImportar={(nuevos) => setMiembros((prev) => [...prev, ...nuevos])}
      />
    </>
  );
};

export default MiembrosPase;