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
  MessageSquare,
  Package,
  PenLine,
  User,
  IdCard,
} from "lucide-react";
import Image from "next/image";
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
  icon: Icon,
  label,
  value,
}: {
  icon?: React.ElementType;
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex items-start gap-2.5">
    {Icon && <Icon className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />}
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
      <div className="text-sm font-medium text-gray-700">{value}</div>
    </div>
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

  const totalDevolucion = equiposAgregados.reduce((acc, { equipo, form }) => {
    return acc + form.unidades * getCosto(equipo?.costo_equipo_concesion);
  }, 0);
  console.log("DETALLE DEV", equipoForms)
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl flex flex-col bg-white p-0 max-h-[90vh] overflow-hidden"
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

        <div className="flex-grow overflow-y-auto">

          <div className="px-6 py-4 border-b">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-blue-500" />
              <p className="text-sm font-bold text-gray-700 uppercase tracking-wide">Información de entrega</p>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <InfoField
                icon={User}
                label={entregaTipo === "empleado" ? "Empleado" : "Persona externa"}
                value={quienEntrega || "—"}
              />

              {firma?.file_url && (
                <InfoField
                  icon={PenLine}
                  label="Firma"
                  value={
                    <Image
                      src={firma.file_url}
                      alt="Firma"
                      width={160}
                      height={40}
                      className="h-9 w-auto mt-0.5"
                      unoptimized
                    />
                  }
                />
              )}
            </div>

            {identificacion?.[0]?.file_url && (
              <div className="mt-4">
                <InfoField
                  icon={IdCard}
                  label="Identificación"
                  value={
                    <div className="mt-1 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 w-48 h-28">
                      <Image
                        src={identificacion[0].file_url}
                        alt="Identificación"
                        width={192}
                        height={112}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    </div>
                  }
                />
              </div>
            )}
          </div>

          <div className="px-6 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-4 h-4 text-blue-500" />
              <p className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                Equipos a devolver
                <span className="ml-2 text-xs font-semibold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                  {equiposAgregados.length}
                </span>
              </p>
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
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize shrink-0 ml-2 ${estatusBadge[form.estatus] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                      {form.estatus}
                    </span>
                  </div>

                  <div className="px-4 py-3 grid grid-cols-3 gap-4 border-b border-gray-100">
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
                  </div>

                  {(form?.comentario_entrega?.trim() || form?.evidencia_entrega?.length > 0) && (
                    <div className="px-4 py-3 space-y-2.5">
                      {form?.comentario_entrega?.trim() && (
                        <div>
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Comentario</p>
                          <div className="flex items-start gap-2">
                            <MessageSquare className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                            <p className="text-sm text-gray-600">{form.comentario_entrega}</p>
                          </div>
                        </div>
                      )}

                      {form?.evidencia_entrega?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                            Evidencia ({form?.evidencia_entrega.length})
                          </p>
                          <div className="flex gap-2 flex-wrap">
                            {form?.evidencia_entrega.map((img, idx) =>
                              img?.file_url ? (
                                <div key={idx} className="w-14 h-14 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                                  <Image
                                    src={img?.file_url}
                                    alt={`Evidencia ${idx + 1}`}
                                    width={56}
                                    height={56}
                                    className="w-full h-full object-cover"
                                    unoptimized
                                  />
                                </div>
                              ) : null
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="px-6 pb-5">
            <div className="flex justify-between items-center bg-blue-50 border border-blue-100 rounded-xl px-5 py-3.5">
              <p className="text-sm font-semibold text-blue-600">Total devolución</p>
              <p className="text-xl font-bold text-blue-700">{formatCurrency(totalDevolucion)}</p>
            </div>
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