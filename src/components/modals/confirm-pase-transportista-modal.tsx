"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CalendarDays, Truck, BoxesIcon, FileText, User, CheckCircle2 } from "lucide-react";

interface ConfirmPaseTransportistaModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  payload: Record<string, any> | null | undefined;
  isPending: boolean;
}

function Row({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between gap-4 py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-400 uppercase tracking-wide font-medium shrink-0">{label}</span>
      <span className="text-xs text-gray-700 text-right">{value}</span>
    </div>
  );
}

function SectionBlock({ icon: Icon, title, children }: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-blue-500" />
        <p className="text-sm font-semibold text-gray-700">{title}</p>
      </div>
      {children}
    </div>
  );
}

export function ConfirmPaseTransportistaModal({
  open, onClose, onConfirm, payload, isPending,
}: ConfirmPaseTransportistaModalProps) {
  if (!payload) return null;

  const tipoLabel = (payload.tipo_de_operacion as string)?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const proveedor = payload.proveedor_y_material;
  const origen = payload.origen_recoleccion;
  const cliente = payload.cliente_y_producto;
  const mainSection = proveedor ?? origen ?? cliente;

  const transportista = payload.transportista;
  const programacion = payload.programacion ?? payload.programacion_regreso ?? payload.programacion_salida;
  const documentos: any[] = payload.documentos ?? [];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-gray-800">Confirmar pase de entrada</DialogTitle>
          <p className="text-sm text-gray-400 mt-0.5">Revisa la información antes de enviar</p>
        </DialogHeader>

        <div className="space-y-3 py-2">

          {/* Tipo de operación */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-teal-50 border border-teal-200 text-teal-700 text-xs font-semibold px-3 py-1.5 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {tipoLabel}
            </span>
          </div>

          {/* Datos principales */}
          {mainSection && (
            <SectionBlock icon={BoxesIcon} title={
              proveedor ? "Proveedor y material"
              : origen ? "Origen de recolección"
              : "Cliente y producto"
            }>
              <Row label="Proveedor / Cliente" value={mainSection.proveedor ?? mainSection.cliente} />
              <Row label="Dirección" value={mainSection.direccion_recoleccion ?? mainSection.direccion_entrega} />
              <Row label="Material / Producto" value={mainSection.material ?? mainSection.material_a_recoger ?? mainSection.producto} />
              <Row label="Cantidad" value={mainSection.cantidad} />
              <Row label="Orden de compra" value={mainSection.orden_compra} />
              <Row label="Orden de venta / Remisión" value={mainSection.orden_venta_remision} />
              <Row label="Responsable" value={mainSection.responsable_entrega ?? mainSection.responsable_despacho} />
            </SectionBlock>
          )}

          {/* Transportista */}
          {transportista && (transportista.nombre || transportista.placas_vehiculo) && (
            <SectionBlock icon={User} title="Transportista">
              <Row label="Nombre" value={transportista.nombre} />
              <Row label="Placas" value={transportista.placas_vehiculo} />
              <Row label="Operador" value={transportista.nombre_operador} />
            </SectionBlock>
          )}

          {/* Programación */}
          {programacion && (
            <SectionBlock icon={CalendarDays} title="Programación">
              <Row label="Fecha desde" value={programacion.fecha_pase_transportista_desde} />
              <Row label="Fecha hasta" value={programacion.fecha_pase_transportista_hasta} />
              <Row label="Horario" value={programacion.horario_disponible} />
              <Row label="Andén" value={programacion.anden} />
            </SectionBlock>
          )}

          {/* Documentos */}
          {documentos.filter((d) => d.tipo_de_documento).length > 0 && (
            <SectionBlock icon={FileText} title="Documentos">
              {documentos
                .filter((d) => d.tipo_de_documento)
                .map((doc, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                    <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">
                      {(doc.tipo_de_documento as string).replace(/_/g, " ")}
                    </span>
                    <span className="text-xs text-gray-600 truncate max-w-[200px]">
                      {doc.documento_transportista?.[0]?.file_name ?? "—"}
                    </span>
                  </div>
                ))}
            </SectionBlock>
          )}

        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isPending}
            className="rounded-full border-gray-200 text-gray-600">
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={isPending}
            className="rounded-full bg-blue-600 hover:bg-blue-700 text-white">
            {isPending
              ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Enviando...</span>
              : <span className="flex items-center gap-1.5"><Truck className="w-4 h-4" />Confirmar y enviar</span>
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
