"use client";
// F0-14 · Nuevo contrato, sección Recurrencia: "Restringir días y horarios de trabajo".
// Diseño: nuevo-contrato.dc.html 211–329, lógica nRc (~4098), resumen (~4325).
// La tarjeta numerada y el resto del alta son de ME-12.
import { Campo, Interruptor } from "../ui";
import { EditorRecurrencia } from "./EditorRecurrencia";
import { Hora } from "./piezas";
import { erroresContrato, fechaLocal, type RecurrenciaContratoValor as Valor } from "./textos";

export interface RecurrenciaContratoProps {
  valor: Valor;
  onCambio: (v: Valor) => void;
  /** Inicio del contrato (yyyy-mm-dd): da las opciones de "Se repite" del mensual. Sin él, hoy. */
  inicio?: string;
  /** Ya se intentó guardar: muestra los errores (erroresContrato). */
  intento?: boolean;
}

/**
 *   const [rec, setRec] = useState(RECURRENCIA_CONTRATO_INICIAL);
 *   <RecurrenciaContrato valor={rec} onCambio={setRec} inicio={datos.inicio} intento={intento} />
 *   // resumen de confirmación: resumenContrato(rec, datos.inicio)
 */
export function RecurrenciaContrato({ valor: v, onCambio, inicio, intento }: RecurrenciaContratoProps) {
  const e = intento ? erroresContrato(v) : {};
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-sm font-bold text-c10-title">Restringir días y horarios de trabajo</span>
          <span className="text-[13px] text-c10-faint">El personal solo podrá laborar dentro de los días y horas que definas.</span>
        </span>
        <Interruptor
          valor={v.restringir}
          onCambio={(restringir) => onCambio({ ...v, restringir })}
          etiqueta="Restringir días y horarios de trabajo"
        />
      </div>

      {v.restringir && (
        <div className="flex flex-col gap-4 border-t border-c10-sunken pt-4 duration-200 animate-in fade-in">
          <EditorRecurrencia
            etiqueta="Recurrencia"
            conAnual={false}
            valor={v.recurrencia}
            onCambio={(recurrencia) => onCambio({ ...v, recurrencia })}
            referencia={fechaLocal(inicio) ?? new Date()}
            errores={e}
          />
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-4">
              <Campo etiqueta="Desde">
                <Hora valor={v.desde} onCambio={(desde) => onCambio({ ...v, desde })} invalido={!!e.horario} />
              </Campo>
              <Campo etiqueta="Hasta">
                <Hora valor={v.hasta} onCambio={(hasta) => onCambio({ ...v, hasta })} invalido={!!e.horario} />
              </Campo>
            </div>
            {e.horario && <span className="text-xs text-red-600">{e.horario}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
