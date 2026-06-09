"use client";

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { User, MapPin, Truck, Send, Building2, FileText } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  payload: Record<string, any> | null | undefined;
  isPending: boolean;
}

const TIPO_LABEL: Record<string, string> = {
  entrega_de_materia_prima:          "Entrega de materia prima",
  recoleccion_de_materia_prima:      "Recolección de materia prima",
  entrega_de_producto_terminado:     "Entrega de producto terminado",
  recoleccion_de_producto_terminado: "Recolección de producto terminado",
};

const SEGUNDA_PERSONA_TITULO: Record<string, string> = {
  entrega_de_materia_prima:          "Quien envía",
  recoleccion_de_materia_prima:      "Proveedor origen",
  entrega_de_producto_terminado:     "Cliente destino",
  recoleccion_de_producto_terminado: "Cliente",
};

function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2.5">
      {children}
    </p>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5 py-1.5">
      <span className="text-[10px] text-blue-300 uppercase tracking-wide font-medium">{label}</span>
      <span className="text-xs text-gray-700 font-medium leading-snug">{value}</span>
    </div>
  );
}

function Card({ icon: Icon, title, children }: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 flex flex-col gap-0.5">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 bg-white rounded-lg shadow-sm">
          <Icon className="w-3.5 h-3.5 text-blue-500" />
        </div>
        <CardLabel>{title}</CardLabel>
      </div>
      {children}
    </div>
  );
}

export function ConfirmPaseTransportistaModal({ open, onClose, onConfirm, payload, isPending }: Props) {
  if (!payload) return null;

  const tipo = payload.tipo_de_operacion as string;
  const tipoLabel = TIPO_LABEL[tipo] ?? tipo;
  const segundaLabel = SEGUNDA_PERSONA_TITULO[tipo] ?? "Contacto";

  const quienRecibe    = payload.crea_el_pase;
  const segundaPersona = payload.recibe_el_pase;
  const material       = payload.material;
  const lugar          = payload.lugar_entrega_recepcion;
  const recoleccion    = payload.lugar_recoleccion;

  const materialItems: any[] = material?.items ?? [];
  const documentos: any[]    = material?.documentos ?? [];

  const MATERIAL_COLS: { key: string; label: string }[] = [
    { key: "contenedor", label: "Contenedor" },
    { key: "sello",      label: "Sello" },
    { key: "tipo",       label: "Tipo" },
    { key: "cantidad",   label: "Cantidad" },
    { key: "peso",       label: "Peso" },
    { key: "volumen",    label: "Volumen" },
  ];

  const colsConDatos = MATERIAL_COLS.filter((c) =>
    materialItems.some((row) => row[c.key]),
  );

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-gray-800">
            Confirmar pase de entrada
          </DialogTitle>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center bg-teal-50 border border-teal-200 text-teal-700 text-[11px] font-semibold px-2.5 py-1 rounded-full">
              {tipoLabel}
            </span>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-1">

          {/* Fila 1: Lugares */}
          <div className="grid grid-cols-2 gap-3">
            <Card icon={Truck} title="Lugar de recolección">
              {recoleccion ? (
                <div className="grid grid-cols-2 gap-x-4">
                  <InfoRow label="Lugar"       value={recoleccion.lugar} />
                  <InfoRow label="Dirección"   value={recoleccion.direccion} />
                  <InfoRow label="Fecha"       value={recoleccion.fecha} />
                  <InfoRow label="Horario"     value={recoleccion.horario} />
                  <InfoRow label="Andén"       value={recoleccion.anden} />
                  <InfoRow label="Responsable" value={recoleccion.transporte?.responsable} />
                  <InfoRow label="Incoterm"    value={recoleccion.incoterm} />
                </div>
              ) : (
                <p className="text-xs text-blue-200 italic">No aplica para este tipo de operación</p>
              )}
            </Card>

            <Card icon={MapPin} title="Lugar de entrega / recepción">
              {lugar ? (
                <div className="grid grid-cols-2 gap-x-4">
                  <InfoRow label="Ubicación"   value={lugar.ubicacion} />
                  <InfoRow label="Dirección"   value={lugar.direccion} />
                  <InfoRow label="Área"        value={lugar.area} />
                  <InfoRow label="Fecha desde" value={lugar.fecha_pase_transportista_desde} />
                  <InfoRow label="Fecha hasta" value={lugar.fecha_pase_transportista_hasta} />
                  <InfoRow label="Horario"     value={lugar.horario_disponible} />
                  <InfoRow label="Andén"       value={lugar.anden} />
                </div>
              ) : (
                <p className="text-xs text-blue-200 italic">Sin información</p>
              )}
            </Card>
          </div>

          {/* Fila 2: Personas */}
          <div className="grid grid-cols-2 gap-3">
            <Card icon={Building2} title={segundaLabel}>
              {segundaPersona?.nombre ? (
                <>
                  <InfoRow label="Nombre"   value={segundaPersona.nombre} />
                  <InfoRow label="Email"    value={segundaPersona.email} />
                  <InfoRow label="Teléfono" value={segundaPersona.telefono} />
                </>
              ) : (
                <p className="text-xs text-blue-200 italic">Sin información</p>
              )}
            </Card>

            <Card icon={User} title="Quien recibe">
              {quienRecibe ? (
                <>
                  <InfoRow label="Nombre"   value={quienRecibe.nombre} />
                  <InfoRow label="Email"    value={quienRecibe.email} />
                  <InfoRow label="Teléfono" value={quienRecibe.telefono} />
                </>
              ) : (
                <p className="text-xs text-blue-200 italic">Sin información</p>
              )}
            </Card>
          </div>

          {/* Fila 3: Tabla de materiales */}
          <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
            <div className="flex items-center gap-2 mb-3">
              <CardLabel>
                Materiales
                {material?.proveedor_cliente && (
                  <span className="ml-2 normal-case font-normal text-blue-300">— {material.proveedor_cliente}</span>
                )}
                {material?.orden_compra && (
                  <span className="ml-2 normal-case font-normal text-blue-300">OC {material.orden_compra}</span>
                )}
              </CardLabel>
            </div>

            {colsConDatos.length > 0 && materialItems.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-blue-100 bg-white">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-blue-50 bg-blue-50/80">
                      {colsConDatos.map((c) => (
                        <th key={c.key} className="text-left px-3 py-2 text-[10px] font-bold text-blue-400 uppercase tracking-wide whitespace-nowrap">
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {materialItems.map((row, i) => (
                      <tr key={i} className="border-b border-blue-50/60 last:border-0">
                        {colsConDatos.map((c) => (
                          <td key={c.key} className="px-3 py-2 text-gray-700 font-medium whitespace-nowrap">
                            {row[c.key] ?? <span className="text-gray-300">—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-blue-200 italic">Sin materiales registrados</p>
            )}

            {/* Documentos adjuntos */}
            {documentos.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {documentos.map((doc, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-white border border-blue-100 rounded-lg px-2.5 py-1.5">
                    <FileText className="w-3 h-3 text-blue-400 shrink-0" />
                    <span className="text-[11px] text-gray-600 truncate max-w-[160px]">{doc.file_name}</span>
                  </div>
                ))}
              </div>
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
