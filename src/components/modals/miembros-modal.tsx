"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { X, Search, Share2, ArrowUpRight, ChevronLeft, ChevronRight, CheckCircle2, Clock ,QrCode} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { useAccessStore } from "@/store/useAccessStore";

interface Miembro {
  nombre: string;
  foto?: string;
  identificacion?: string;
  email?: string;
  telefono?: string;
  estatus?: string;
  link?: string;
  es_padre?: boolean;
}

interface MembersModalProps {
  open: boolean;
  onClose: () => void;
  miembros: Miembro[];
  onSeleccionMiembros?: (miembros: Miembro[]) => void;
  puedeSeleccionar:boolean;
}

const statusConfig: Record<string, { cls: string; icon: React.ReactNode }> = {
  activo: {
    cls: "bg-green-50 text-green-600",
    icon: <CheckCircle2 size={12} className="text-green-500" />,
  },
  "en proceso": {
    cls: "bg-blue-50 text-blue-600",
    icon: <Clock size={12} className="text-blue-500" />,
  },
};

// Mini carrusel para foto / identificación dentro de la celda de la tabla
const PhotoMiniCarousel: React.FC<{ foto?: string; identificacion?: string; nombre: string }> = ({
  foto,
  identificacion,
  nombre,
}) => {
  const images = [foto, identificacion].filter(Boolean) as string[];
  const [index, setIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 shrink-0">
        <Image src="/nouser.svg" alt={nombre} fill className="object-cover" />
      </div>
    );
  }

  return (
    <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 shrink-0 group">
      <Image src={images[index]} alt={nombre} fill className="object-cover" />
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIndex((prev) => (prev - 1 + images.length) % images.length);
            }}
            className="absolute left-0 top-0 bottom-0 w-3.5 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft size={10} className="text-white" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIndex((prev) => (prev + 1) % images.length);
            }}
            className="absolute right-0 top-0 bottom-0 w-3.5 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight size={10} className="text-white" />
          </button>
          <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
            {images.map((_, i) => (
              <span
                key={i}
                className={`w-1 h-1 rounded-full ${i === index ? "bg-white" : "bg-white/50"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export const MembersModal: React.FC<MembersModalProps> = ({
  open,
  onClose,
  miembros,
  onSeleccionMiembros,
  puedeSeleccionar = true,
}) => {
  const { setPassCode } = useAccessStore();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [qrMiembro, setQrMiembro] = useState<Miembro | null>(null);
  const [selected, setSelected] = useState<Set<Miembro>>(new Set());
  const pageSize = 10;

  // Avisa al padre (Credentials) cada vez que cambia la selección, con los
  // miembros marcados para ingreso.
  useEffect(() => {
    onSeleccionMiembros?.(Array.from(selected));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  // Si el pase pasa a estar en proceso (o el padre lo marca como no
  // seleccionable) mientras el modal está abierto, limpiamos cualquier
  // selección previa para que no quede "ingreso" pendiente inválido.
  useEffect(() => {
    if (!puedeSeleccionar) {
      setSelected(new Set());
    }
  }, [puedeSeleccionar]);

  if (!open) return null;

  const filtered = miembros.filter((m) =>
    m.nombre?.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);

  // Además del bloqueo general (puedeSeleccionar, cuando el pase que se está
  // viendo está en proceso), cada fila solo se puede marcar si ESE acompañante
  // en particular ya está "activo" — no tiene sentido dar ingreso a alguien
  // cuyo pase individual sigue en proceso.
  const esSeleccionable = (miembro: Miembro) =>
    puedeSeleccionar && (miembro.estatus ?? "").toLowerCase() === "activo";

  const toggleSelect = (miembro: Miembro) => {
    if (!esSeleccionable(miembro)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(miembro)) {
        next.delete(miembro);
      } else {
        next.add(miembro);
      }
      return next;
    });
  };

  const toggleSelectAll = (checked: boolean) => {
    if (!puedeSeleccionar) return;
    setSelected((prev) => {
      const next = new Set(prev);
      paginated.forEach((m) => {
        if (!esSeleccionable(m)) return;
        if (checked) {
          next.add(m);
        } else {
          next.delete(m);
        }
      });
      return next;
    });
  };

  const handleShare = async (miembro: Miembro) => {
    if (!miembro.link) {
      toast.error("Este acompañante no tiene link disponible");
      return;
    }
    if (navigator.share) {
      try {
        await navigator.share({
          title: miembro.nombre,
          text: `Link de acceso de ${miembro.nombre}`,
          url: miembro.link,
        });
      } catch {
        // usuario canceló el share, no hacer nada
      }
    } else {
      await navigator.clipboard.writeText(miembro.link);
      toast.success("Link copiado al portapapeles");
    }
  };

  const handleOpenLink = (miembro: Miembro) => {
    if (!miembro.link) {
      toast.error("Este acompañante no tiene link disponible");
      return;
    }
    // El link trae el id como query param (ej: "...pase-update?id=<id>&user=...").
    // Si lo encontramos, navegamos dentro de la pantalla de accesos en vez de
    // abrir el link en una pestaña nueva.
    try {
      const url = new URL(miembro.link);
      const id = url.searchParams.get("id");
      if (id) {
        setPassCode(id);
        onClose();
        return;
      }
    } catch {
      // si no es una URL válida, caemos al fallback de abrir el link directo
    }
    window.open(miembro.link, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-start justify-between px-6 pt-6 pb-2">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Listado de Acompañantes</h2>
            <p className="text-sm text-slate-400 mt-0.5">{miembros.length} acompañantes en total</p>
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
          {selected.size > 0 && (
            <p className="text-xs text-emerald-700 font-medium mt-2">
              {selected.size} seleccionado{selected.size !== 1 ? "s" : ""} para ingreso
            </p>
          )}
          {!puedeSeleccionar && (
            <p className="text-xs text-amber-600 font-medium mt-2">
              La selección para ingreso está deshabilitada mientras el pase esté en proceso.
            </p>
          )}
        </div>

        <div className="overflow-auto flex-1 px-6 pb-6">
          <div className="rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-gray-50 z-10">
                <tr>
                  <th className="px-4 py-3 border-b border-gray-100 w-8">
                    <input
                      type="checkbox"
                      checked={
                        paginated.some(esSeleccionable) &&
                        paginated.filter(esSeleccionable).every((m) => selected.has(m))
                      }
                      onChange={(e) => toggleSelectAll(e.target.checked)}
                      disabled={!puedeSeleccionar || !paginated.some(esSeleccionable)}
                      title={!puedeSeleccionar ? "Selección deshabilitada mientras el pase esté en proceso" : undefined}
                      className="w-4 h-4 rounded border-slate-300 accent-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed"
                    />
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-100">Foto</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-100">Nombre</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-100">Email</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-100">Teléfono</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-100">Estatus</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-100">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((miembro, index) => {
                  const statusKey = (miembro.estatus ?? "").toLowerCase();
                  const config = statusConfig[statusKey] ?? {
                    cls: "bg-gray-50 text-gray-500",
                    icon: null,
                  };
                  return (
                    <tr
                      key={index}
                      className={`border-t border-gray-50 hover:bg-gray-50/50 ${
                        miembro.es_padre ? "bg-purple-50 hover:bg-purple-100/60" : ""
                      }`}
                    >
                      <td className="px-4 py-2.5">
                        <input
                          type="checkbox"
                          checked={selected.has(miembro)}
                          onChange={() => toggleSelect(miembro)}
                          disabled={!esSeleccionable(miembro)}
                          title={
                            !puedeSeleccionar
                              ? "Selección deshabilitada mientras el pase esté en proceso"
                              : (miembro.estatus ?? "").toLowerCase() !== "activo"
                                ? "Solo se puede seleccionar si el pase de este acompañante está activo"
                                : undefined
                          }
                          className="w-4 h-4 rounded border-slate-300 accent-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <PhotoMiniCarousel
                          foto={miembro.foto}
                          identificacion={miembro.identificacion}
                          nombre={miembro.nombre}
                        />
                      </td>
                      <td className="px-4 py-2.5 font-medium text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <span className={miembro.es_padre ? "text-purple-700 font-semibold" : ""}>
                            {miembro.nombre ?? "—"}
                          </span>
                          {miembro.es_padre && (
                            <span className="text-[9px] font-bold text-white bg-purple-600 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                              Titular
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-slate-500">{miembro.email || "—"}</td>
                      <td className="px-4 py-2.5 text-slate-500">{miembro.telefono || "—"}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${config.cls}`}>
                          {config.icon}
                          {miembro.estatus ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex gap-1.5 justify-end">
                          <button
                            type="button"
                            onClick={() => setQrMiembro(miembro)}
                            title="Mostrar QR"
                            className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors"
                          >
                            <QrCode size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenLink(miembro)}
                            title="Ver pase en accesos"
                            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-colors"
                          >
                            <ArrowUpRight size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleShare(miembro)}
                            title="Compartir link"
                            className="w-7 h-7 rounded-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-colors"
                          >
                            <Share2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-sm text-slate-400 py-8">No se encontraron miembros</td>
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

      {qrMiembro && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative">
            <button
              type="button"
              onClick={() => setQrMiembro(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
            >
              <X size={16} />
            </button>

            <h3 className="text-lg font-bold text-slate-800 text-center mb-1 pr-8">
              {qrMiembro.nombre}
            </h3>
            <p className="text-sm text-slate-500 text-center mb-4">
              Muestra este QR al acompañante para que lo escanee y complete su pase.
            </p>

            {qrMiembro.link ? (
              <div className="flex justify-center p-3 bg-white rounded-xl border border-slate-100">
                <QRCodeSVG value={qrMiembro.link} size={220} level="M" />
              </div>
            ) : (
              <p className="text-center text-sm text-red-500 py-8">
                Este acompañante no tiene link disponible.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
};