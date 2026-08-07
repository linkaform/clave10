"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { AlertCircle, CheckCircle2, DoorOpen, LogIn, X, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { capitalizeFirstLetter } from "@/lib/utils";
import {
  AcompanantesSearchPass,
  Miembro,
  useAcompanantesPase,
} from "@/hooks/useAcompanantesPase";

type TitularPass = AcompanantesSearchPass & {
  nombre?: string;
  foto?: { file_name?: string; file_url?: string }[];
  tipo_de_pase?: string;
  estatus?: string;
};

interface ConfirmarAccesoModalProps {
  open: boolean;
  onClose: () => void;
  /** Se llama al confirmar, después de reportar hacia arriba la selección final vía onChangeSelected. */
  onConfirm: () => void;
  searchPass?: TitularPass | null;
  tipo: "ingreso" | "salida";
  /** Selección actual (ya hecha en el carrusel embebido de Credentials) con la que arranca el modal. */
  initialSelectedIds: string[];
  /** Reporta hacia arriba la selección final (ajustada dentro del modal) para que quede sincronizada antes de ejecutar la acción. */
  onChangeSelected: (ids: string[]) => void;
  loading?: boolean;
}

const statusBadgeCls = (estatus?: string) => {
  switch ((estatus ?? "").toLowerCase()) {
    case "activo":
      return "bg-emerald-100 text-emerald-700";
    case "vencido":
      return "bg-rose-100 text-rose-700";
    case "proceso":
    case "en proceso":
      return "bg-sky-100 text-sky-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

const StatusIcon: React.FC<{ estatus?: string }> = ({ estatus }) => {
  switch ((estatus ?? "").toLowerCase()) {
    case "vencido":
      return <XCircle className="w-3 h-3" />;
    case "activo":
      return <CheckCircle2 className="w-3 h-3" />;
    case "proceso":
    case "en proceso":
      return <AlertCircle className="w-3 h-3" />;
    default:
      return null;
  }
};

export const ConfirmarAccesoModal: React.FC<ConfirmarAccesoModalProps> = ({
  open,
  onClose,
  onConfirm,
  searchPass,
  tipo,
  initialSelectedIds,
  onChangeSelected,
  loading,
}) => {
  const { data, tieneAcompanantes, esSeleccionable } = useAcompanantesPase(searchPass);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Este modal es un paso extra de confirmación sobre lo ya elegido en el
  // carrusel embebido (Credentials/MembersCarousel), no la única fuente de
  // selección — por eso arranca cada apertura sincronizado con esa selección
  // y no antes (evita mostrar una selección vieja de un pase anterior).
  useEffect(() => {
    if (open) setSelected(new Set(initialSelectedIds));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const toggle = (miembro: Miembro) => {
    if (!esSeleccionable(miembro)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(miembro.id)) next.delete(miembro.id);
      else next.add(miembro.id);
      return next;
    });
  };

  const handleConfirm = () => {
    onChangeSelected(Array.from(selected));
    onConfirm();
  };

  const esIngreso = tipo === "ingreso";
  const foto = searchPass?.foto?.[0]?.file_url;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[85vh]">
        <div className="flex items-start justify-between px-6 pt-6 pb-2">
          <div className="flex items-center gap-2">
            <div
              className={`p-2 rounded-xl ${
                esIngreso ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
              }`}
            >
              {esIngreso ? <LogIn className="w-5 h-5" /> : <DoorOpen className="w-5 h-5" />}
            </div>
            <h2 className="text-lg font-bold text-slate-800">
              Confirmar {esIngreso ? "ingreso" : "salida"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-3 space-y-4">
          {/* El titular del pase escaneado siempre entra/sale junto con la acción — no es seleccionable. */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 border border-purple-100">
            <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-purple-300 shrink-0">
              <Image
                src={foto || "/nouser.svg"}
                alt={searchPass?.nombre || "Titular"}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-purple-800 truncate">
                  {searchPass?.nombre || "—"}
                </span>
                <span className="text-[9px] font-bold text-white bg-purple-600 px-1.5 py-0.5 rounded-full shrink-0">
                  Titular
                </span>
              </div>
              <span className="text-xs text-purple-500">{searchPass?.tipo_de_pase}</span>
            </div>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0 ${statusBadgeCls(
                searchPass?.estatus,
              )}`}
            >
              <StatusIcon estatus={searchPass?.estatus} />
              {capitalizeFirstLetter(searchPass?.estatus ?? "")}
            </span>
          </div>

          {tieneAcompanantes && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                ¿Con quién más {esIngreso ? "hará ingreso" : "hará salida"}?
              </p>
              {data.map((miembro) => {
                const seleccionable = esSeleccionable(miembro);
                const checked = selected.has(miembro.id);
                return (
                  <label
                    key={miembro.id}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border transition-colors ${
                      seleccionable
                        ? "cursor-pointer hover:bg-slate-50 border-slate-100"
                        : "opacity-60 border-slate-100 cursor-not-allowed"
                    } ${miembro.es_padre ? "bg-purple-50/60" : ""}`}
                    title={
                      !seleccionable
                        ? "Solo se puede seleccionar si el pase de este acompañante está activo"
                        : undefined
                    }
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={!seleccionable}
                      onChange={() => toggle(miembro)}
                      className="w-4 h-4 rounded border-slate-300 accent-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                    />
                    <div className="relative w-9 h-9 rounded-full overflow-hidden border border-slate-200 shrink-0">
                      <Image
                        src={miembro.foto || "/nouser.svg"}
                        alt={miembro.nombre}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-slate-700 truncate">
                          {miembro.nombre}
                        </span>
                        {miembro.es_padre && (
                          <span className="text-[9px] font-bold text-white bg-purple-600 px-1.5 py-0.5 rounded-full shrink-0">
                            Titular
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${statusBadgeCls(
                        miembro.estatus,
                      )}`}
                    >
                      <StatusIcon estatus={miembro.estatus} />
                      {miembro.estatus ?? "—"}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            className="flex-1 rounded-xl"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className={`flex-1 rounded-xl text-white ${
              esIngreso ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-500 hover:bg-rose-600"
            }`}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "Procesando..." : `Confirmar ${esIngreso ? "ingreso" : "salida"}`}
          </Button>
        </div>
      </div>
    </div>
  );
};
