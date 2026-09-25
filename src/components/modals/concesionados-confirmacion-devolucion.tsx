"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Loader2,
  Package,
  User,
} from "lucide-react";
import Image from "next/image";
import ViewImage from "./view-image";
import { EquipoConcesionado } from "@/components/concesionados-tab-datos";
import { EquipoForm } from "@/components/concesionados-seguimientos-table";
import { formatCurrency } from "@/lib/utils";
import { Imagen } from "@/components/upload-Image";

interface ConfirmacionDevolucionProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  equipos: EquipoConcesionado[];
  equipoForms: Record<string, EquipoForm>;
  quienEntrega: string;
  entregaTipo: string;
  firma: any;
  identificacion?: Imagen[];
}

const estatusBadge: Record<string, string> = {
  completo: "bg-green-100 text-green-700 border-green-200",
  perdido: "bg-red-100 text-red-700 border-red-200",
  dañado: "bg-orange-100 text-orange-700 border-orange-200",
};

const getCosto = (costo: number | number[] | undefined): number => {
  if (Array.isArray(costo)) return costo[0] ?? 0;
  return costo ?? 0;
};

const InfoField = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div>
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
    <div className="text-sm font-medium text-gray-700">{value}</div>
  </div>
);

export const ConfirmacionDevolucionModal: React.FC<ConfirmacionDevolucionProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  equipos,
  equipoForms,
  quienEntrega,
  entregaTipo,
  firma,
  identificacion,
}) => {
  const equiposAgregados = Object.entries(equipoForms ??[])
    .filter(([, form]) => form.agregado && form.estatus)
    .map(([key, form]) => ({
      equipo: equipos.find((e) => String(e.id_movimiento) === key),
      form,
    }));

  const totalUnidades = equiposAgregados.reduce((acc, { form }) => acc + Number(form.unidades ?? 0), 0);

  const totalDevolucion = equiposAgregados.reduce((acc, { equipo, form }) => {
    return acc + form.unidades * getCosto(equipo?.costo_equipo_concesion);
  }, 0);
  console.log("DETALLE DEV", equipoForms)
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-4xl flex flex-col gap-0 bg-white p-0 max-h-[90vh] overflow-hidden"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="flex-shrink-0 px-6 py-5 border-b">
          <DialogTitle className="text-xl text-center font-bold text-gray-800">
            Confirmar Devolución
          </DialogTitle>
          <p className="text-center text-sm text-gray-400">
            Revisa los datos antes de continuar
          </p>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto overflow-x-hidden px-6 pt-3 pb-4 flex flex-col gap-5">

          {/* Quién devuelve: una franja con los tres datos */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-gray-700">Información de la devolución</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-xl border border-gray-100 bg-gray-50/70 p-4">
              <InfoField
                label={entregaTipo === "empleado" ? "Empleado que devuelve" : "Nombre de quien devuelve"}
                value={quienEntrega || "—"}
              />

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Firma de quien devuelve</p>
                <div className="flex justify-center">
                  {firma?.file_url ? (
                    <div className="inline-flex rounded-xl border bg-white overflow-hidden">
                      <ViewImage imageUrl={firma} size="md" />
                    </div>
                  ) : (
                    <p className="text-xs italic text-gray-400">Sin firma</p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Identificación de quien devuelve</p>
                <div className="flex justify-center">
                  {identificacion && identificacion.some((img) => img?.file_url) ? (
                    <div className={`inline-flex items-center rounded-xl border bg-white overflow-hidden ${identificacion.length > 1 ? "pr-2" : ""}`}>
                      <ViewImage imageUrl={identificacion.filter((img) => img?.file_url)} size="md" />
                    </div>
                  ) : (
                    <p className="text-xs italic text-gray-400">Sin identificación</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Equipos a todo lo ancho */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-gray-700">Equipos a devolver</h3>
              <span className="text-xs font-semibold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                {totalUnidades} {totalUnidades === 1 ? "unidad" : "unidades"}
              </span>
            </div>

            <div className="space-y-3">
              {equiposAgregados.map(({ equipo, form }, i) => (
                <div key={i} className="rounded-xl border border-gray-200 overflow-hidden">

                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                    <div className="flex items-center gap-3 min-w-0">
                      {equipo?.imagen_equipo_concesion?.[0]?.file_url ? (
                        <Image
                          src={equipo?.imagen_equipo_concesion[0].file_url}
                          alt={equipo?.nombre_equipo ?? ""}
                          width={36}
                          height={36}
                          className="w-9 h-9 rounded-lg object-cover shrink-0"
                          unoptimized
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                          <Package className="w-4 h-4 text-blue-400" />
                        </div>
                      )}
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {equipo?.nombre_equipo || "—"}
                      </p>
                    </div>
                    <span className={`text-sm font-semibold px-4 py-1.5 rounded-full border-2 capitalize shrink-0 ml-2 ${estatusBadge[form.estatus] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                      {form.estatus}
                    </span>
                  </div>

                  <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-5 gap-4 items-start">
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Unidades totales</p>
                      <p className="text-sm font-semibold text-gray-700">{equipo?.cantidad_equipo_concesion ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">A devolver</p>
                      <p className="text-sm font-bold text-blue-600">{form?.unidades}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Subtotal</p>
                      <p className="text-sm font-semibold text-gray-700">
                        {formatCurrency(form?.unidades * getCosto(equipo?.costo_equipo_concesion))}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Comentario</p>
                      {form?.comentario_entrega?.trim() ? (
                        <p className="text-sm text-gray-600 break-words">{form.comentario_entrega}</p>
                      ) : (
                        <p className="text-xs italic text-gray-400">Sin comentario disponible</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Evidencia de devolución</p>
                      {form?.evidencia_entrega?.some((img) => img?.file_url) ? (
                        <div className={`inline-flex items-center rounded-xl border bg-gray-50 overflow-hidden ${form.evidencia_entrega.length > 1 ? "pr-2" : ""}`}>
                          <ViewImage imageUrl={form.evidencia_entrega.filter((img) => img?.file_url)} size="md" />
                        </div>
                      ) : (
                        <p className="text-xs italic text-gray-400">Sin evidencia</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center bg-blue-50 border border-blue-100 rounded-xl px-5 py-3.5">
            <p className="text-sm font-semibold text-blue-600">Total devolución</p>
            <p className="text-xl font-bold text-blue-700">{formatCurrency(totalDevolucion)}</p>
          </div>
        </div>

        <div className="flex gap-3 border-t px-6 py-4 bg-white flex-shrink-0">
          <Button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium shadow-sm disabled:opacity-50"
          >
            {isLoading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Procesando...</>
              : <><CheckCircle2 className="w-4 h-4" /> Confirmar devolución</>
            }
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
};