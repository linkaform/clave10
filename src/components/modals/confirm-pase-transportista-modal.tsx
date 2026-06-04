"use client";

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { User, BoxesIcon, MapPin, Truck, FileText, Send, Building2 } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  payload: Record<string, any> | null | undefined;
  isPending: boolean;
}

function Row({ label, value }: { label: string; value?: string | number | null }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex justify-between gap-4 py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-400 uppercase tracking-wide font-medium shrink-0">{label}</span>
      <span className="text-xs text-gray-700 text-right">{value}</span>
    </div>
  );
}

function Block({ icon: Icon, title, children }: {
  icon: React.ElementType; title: string; children: React.ReactNode;
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

const TIPO_LABEL: Record<string, string> = {
  entrega_de_materia_prima:          "Entrega de materia prima",
  recoleccion_de_materia_prima:      "Recolección de materia prima",
  entrega_de_producto_terminado:     "Entrega de producto terminado",
  recoleccion_de_producto_terminado: "Recolección de producto terminado",
};

const SEGUNDA_PERSONA_TITULO: Record<string, string> = {
  entrega_de_materia_prima:          "Quién entrega",
  recoleccion_de_materia_prima:      "Proveedor origen",
  entrega_de_producto_terminado:     "Cliente destino",
  recoleccion_de_producto_terminado: "Cliente",
};

export function ConfirmPaseTransportistaModal({ open, onClose, onConfirm, payload, isPending }: Props) {
  if (!payload) return null;

  const tipo = payload.tipo_de_operacion as string;
  const tipoLabel = TIPO_LABEL[tipo] ?? tipo;
  const segundaLabel = SEGUNDA_PERSONA_TITULO[tipo] ?? "Contacto";

  const quienRecibe = payload.crea_el_pase;
  const segundaPersona = payload.recibe_el_pase;
  const material = payload.material;
  const lugar = payload.lugar_entrega_recepcion;
  const recoleccion = payload.lugar_recoleccion;
  const documentos: any[] = payload.documentos ?? [];

  const hasRecoleccion = !!recoleccion;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-gray-800">Confirmar pase de entrada</DialogTitle>
          <p className="text-sm text-gray-400 mt-0.5">Revisa la información antes de enviar</p>
        </DialogHeader>

        <div className="py-2 space-y-3">

          {/* Tipo */}
          <span className="inline-flex items-center gap-1.5 bg-teal-50 border border-teal-200 text-teal-700 text-xs font-semibold px-3 py-1.5 rounded-full">
            {tipoLabel}
          </span>

          {/* Grid 2x2 */}
          <div className="grid grid-cols-2 gap-3">

            {/* Quien recibe */}
            {quienRecibe && (
              <Block icon={User} title="Quien recibe">
                <Row label="Nombre"   value={quienRecibe.nombre} />
                <Row label="Email"    value={quienRecibe.email} />
                <Row label="Teléfono" value={quienRecibe.telefono} />
              </Block>
            )}

            {/* Segunda persona */}
            {segundaPersona?.nombre && (
              <Block icon={Building2} title={segundaLabel}>
                <Row label="Nombre"   value={segundaPersona.nombre} />
                <Row label="Email"    value={segundaPersona.email} />
                <Row label="Teléfono" value={segundaPersona.telefono} />
              </Block>
            )}

            {/* Material */}
            {material && (
              <Block icon={BoxesIcon} title="Material">
                <Row label="Proveedor / Cliente" value={material.proveedor_cliente} />
                <Row label="Material"            value={material.material} />
                <Row label="Cantidad"            value={material.cantidad} />
                <Row label="Orden de compra"     value={material.orden_compra} />
              </Block>
            )}

            {/* Lugar de entrega / recepción */}
            {lugar && (
              <Block icon={MapPin} title="Lugar de entrega / recepción">
                <Row label="Ubicación"   value={lugar.ubicacion} />
                <Row label="Dirección"   value={lugar.direccion} />
                <Row label="Fecha desde" value={lugar.fecha_pase_transportista_desde} />
                <Row label="Fecha hasta" value={lugar.fecha_pase_transportista_hasta} />
                <Row label="Horario"     value={lugar.horario_disponible} />
                <Row label="Andén"       value={lugar.anden} />
              </Block>
            )}

            {/* Lugar de recolección */}
            {hasRecoleccion && (
              <Block icon={Truck} title="Lugar de recolección">
                <Row label="Lugar"            value={recoleccion.lugar} />
                <Row label="Dirección"        value={recoleccion.direccion} />
                <Row label="Fecha"            value={recoleccion.fecha} />
                <Row label="Horario"          value={recoleccion.horario} />
                <Row label="Andén"            value={recoleccion.anden} />
                <Row label="Responsable"      value={recoleccion.transporte?.responsable} />
                <Row label="Email transporte" value={recoleccion.transporte?.email} />
                <Row label="Método embarque"  value={recoleccion.metodo_embarque} />
                <Row label="Incoterm"         value={recoleccion.incoterm} />
              </Block>
            )}

            {/* Documentos */}
            {documentos.filter((d) => d.tipo_de_documento).length > 0 && (
              <Block icon={FileText} title="Documentos">
                {documentos.filter((d) => d.tipo_de_documento).map((doc, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                    <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">
                      {(doc.tipo_de_documento as string).replace(/_/g, " ")}
                    </span>
                    <span className="text-xs text-gray-600 truncate max-w-[120px]">
                      {doc.documento_transportista?.[0]?.file_name ?? "—"}
                    </span>
                  </div>
                ))}
              </Block>
            )}

          </div>
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
              : <span className="flex items-center gap-1.5"><Send className="w-4 h-4" />Confirmar y enviar</span>
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
