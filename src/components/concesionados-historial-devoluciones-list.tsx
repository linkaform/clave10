import { AlertTriangle, Box, Calendar, CheckCircle2, Eye, RotateCcw, ShieldCheck, User, XCircle, Zap } from "lucide-react";
import { campoConcesion } from "@/lib/concesionados-campos";
import { useEffect, useState } from "react";
import { Tooltip } from "@/components/ui/tooltip";
import { VerDetalleDevolucion } from "./modals/concesionados-ver-detalle-devolucion";

const TextoTruncado = ({ text }: { text: string }) => {
  const [el, setEl] = useState<HTMLSpanElement | null>(null);
  const [cortado, setCortado] = useState(false);

  useEffect(() => {
    if (!el) return;
    const revisar = () => setCortado(el.scrollWidth > el.clientWidth);
    revisar();
    const observer = new ResizeObserver(revisar);
    observer.observe(el);
    return () => observer.disconnect();
  }, [el, text]);

  const span = (
    <span ref={setEl} className="block truncate text-xs font-medium text-gray-700">
      {text}
    </span>
  );

  if (!cortado) return span;
  return (
    <Tooltip
      className="block min-w-0 max-w-full"
      contentClassName="max-w-xs"
      content={<span className="text-xs text-gray-700 break-words">{text}</span>}
    >
      {span}
    </Tooltip>
  );
};

const chip = "flex items-center gap-1 whitespace-nowrap text-xs font-semibold border px-2.5 py-1 rounded-full";

// Estado en que regresó el equipo: Completo / Dañado / Perdido
const ESTADOS: Record<string, { t: string; cls: string; Icon: typeof CheckCircle2 }> = {
  completo: { t: "Completo", cls: "bg-green-50 text-green-700 border-green-200", Icon: CheckCircle2 },
  danado: { t: "Dañado", cls: "bg-yellow-50 text-yellow-700 border-yellow-200", Icon: AlertTriangle },
  perdido: { t: "Perdido", cls: "bg-red-50 text-red-600 border-red-200", Icon: XCircle },
};
const EstadoChip = ({ estado }: { estado?: string }) => {
  const clave = (estado ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const e = ESTADOS[clave];
  if (!e) return null;
  return (
    <span className={`${chip} ${e.cls}`}>
      <e.Icon className="w-3.5 h-3.5" />
      {e.t}
    </span>
  );
};

interface HistorialDevolucionesListProps {
  devoluciones: any[];
  fillHeight?: boolean;
}
export const HistorialDevolucionesList: React.FC<HistorialDevolucionesListProps> = ({
  devoluciones,
  fillHeight = false,
}) => {
  const [verDevolucionModal, setVerDevolucionModal] = useState(false);
  const [devolucionSeleccionada, setDevolucionSeleccionada] = useState<any>(null);
  console.log("devo", devoluciones)
  if (!devoluciones || devoluciones.length === 0) return null;

  return (
    <div className={`col-span-2 ${fillHeight ? "h-full flex flex-col" : ""}`}>
      <div className="flex items-center gap-2 mb-2">
        <RotateCcw className="w-5 h-5 text-purple-500" />
        <h3 className="font-semibold text-gray-700">Devoluciones</h3>
        <span className="text-xs font-semibold bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
          {devoluciones.length}
        </span>
      </div>

      <div
        className={`flex flex-col gap-2 rounded-xl border border-purple-100 bg-purple-50/60 p-3 overflow-y-auto ${
          fillHeight || devoluciones.length > 1 ? "border-l-4 border-l-purple-400" : ""
        } ${
          fillHeight ? "flex-1 min-h-0 max-h-72 md:max-h-none" : "max-h-72"
        }`}
      >
        {devoluciones.map((devItem: any, index: number) => (
          <div
            key={index}
            className="flex justify-between items-center rounded-lg border border-purple-100 border-l-4 border-l-purple-400 bg-white shadow-sm p-3 gap-x-3"
          >
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <Calendar className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                <span className="text-xs text-gray-500 flex-shrink-0">Fecha:</span>
                <div className="min-w-0 flex-1">
                  <TextoTruncado text={devItem.fecha_devolucion_concesion || "-"} />
                </div>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <User className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                <span className="text-xs text-gray-500 flex-shrink-0">Devuelve:</span>
                <div className="min-w-0 flex-1">
                  <TextoTruncado text={devItem.quien_entrega || "-"} />
                </div>
              </div>
              {campoConcesion(devItem, "recibio_devolucion") && (
                <div className="flex items-center gap-2 min-w-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                  <span className="text-xs text-gray-500 flex-shrink-0">Recibió:</span>
                  <div className="min-w-0 flex-1">
                    <TextoTruncado text={campoConcesion(devItem, "recibio_devolucion")} />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <EstadoChip estado={devItem.estatus_equipo} />
              {["sí", "si"].includes(devItem.se_forzo_devolucion ?? "") && (
                <span className={`${chip} bg-orange-50 text-orange-700 border-orange-200`}>
                  <Zap className="w-3.5 h-3.5" />
                  Forzada
                </span>
              )}
              <span className={`${chip} bg-purple-50 text-purple-700 border-purple-200`}>
                <Box className="w-3.5 h-3.5" />
                {(() => {
                  const unidades = devItem.cantidad_devolucion?.parsedValue ?? devItem.cantidad_devolucion ?? "-";
                  return `${unidades} ${Number(unidades) === 1 ? "unidad" : "unidades"}`;
                })()}
              </span>
              <button
                type="button"
                title="Ver detalle de la devolución"
                onClick={() => {
                  setDevolucionSeleccionada(devItem);
                  setVerDevolucionModal(true);
                }}
                className="ml-1 text-blue-400 hover:text-blue-600 transition-colors"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {fillHeight && (
          <div className="flex-1 min-h-[5rem] flex flex-col items-center justify-center gap-1.5 text-purple-300/70 select-none pointer-events-none">
            <RotateCcw className="w-8 h-8" />
            <span className="text-sm font-medium">Listado de devoluciones</span>
          </div>
        )}
      </div>

      <VerDetalleDevolucion
        devolucion={devolucionSeleccionada}
        isSuccess={verDevolucionModal}
        setIsSuccess={setVerDevolucionModal}
      >
        <div />
      </VerDetalleDevolucion>
    </div>
  );
};