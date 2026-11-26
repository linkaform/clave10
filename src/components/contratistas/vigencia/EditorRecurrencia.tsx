"use client";
// F0-14 · Recurrencia personalizada: Por día, Semanal, Mensual, Anual o Configurable.
// La comparten Sesiones ("Vigencia personalizada", ssnR ~2181) y Nuevo contrato
// (sección Recurrencia, nRc ~4098). Contrato no tiene Anual.
import { CalendarCheck, Repeat } from "lucide-react";
import { Campo, Selector } from "../ui";
import { CadaUnidad, Fila, FrecuenciaHoras, Numero, Pastillas, Segmentado } from "./piezas";
import {
  DIAS, MESES, SEMANAS_MES, SEMANA_DOMINGO, TIPOS_RECURRENCIA, opcionesDiaMes,
  type ErroresRecurrencia, type Recurrencia, type TipoRecurrencia,
} from "./textos";

const OPC_DIAS = SEMANA_DOMINGO.map((i) => ({ valor: i, etiqueta: DIAS[i] }));
const OPC_SEMANAS = SEMANAS_MES.map((s, i) => ({ valor: i, etiqueta: s }));
export const OPC_MESES = MESES.map((m, i) => ({ valor: i, etiqueta: m }));
const MODOS_MESES = [
  { valor: "cada" as const, etiqueta: "Repetir Cada X Meses", icono: <Repeat /> },
  { valor: "sel" as const, etiqueta: "Seleccionar Meses", icono: <CalendarCheck /> },
];

export function EditorRecurrencia({
  valor: r, onCambio, referencia, etiqueta = "Vigencia", conAnual = true, errores = {},
}: {
  valor: Recurrencia;
  onCambio: (r: Recurrencia) => void;
  /** Fecha de la sesión o de inicio del contrato: da el "día N" y el "{ordinal} {día}" del mensual. */
  referencia: Date;
  /** Etiqueta del select: "Vigencia" (sesión) o "Recurrencia" (contrato). */
  etiqueta?: string;
  conAnual?: boolean;
  /** Solo los que se deben ver (después de intentar guardar). */
  errores?: ErroresRecurrencia;
}) {
  const set = (p: Partial<Recurrencia>) => onCambio({ ...r, ...p });
  const tipos = TIPOS_RECURRENCIA.filter((t) => conAnual || t !== "Anual").map((t) => ({ valor: t, etiqueta: t }));

  return (
    <div className="flex flex-col gap-4">
      <Campo etiqueta={etiqueta} obligatorio error={errores.tipo}>
        <Selector<TipoRecurrencia> opciones={tipos} valor={r.tipo} onCambio={(tipo) => set({ tipo })} placeholder="Selecciona una opción" />
      </Campo>

      {r.tipo === "Por día" && (
        <>
          <Pastillas
            titulo="Selecciona los días"
            todos="Todos los días"
            opciones={OPC_DIAS}
            valor={r.dias}
            onCambio={(dias) => set({ dias })}
            error={errores.dias}
          />
          <FrecuenciaHoras
            activa={r.porHoras}
            onActiva={(porHoras) => set({ porHoras })}
            horas={r.cadaHoras}
            onHoras={(cadaHoras) => set({ cadaHoras })}
          />
        </>
      )}

      {r.tipo === "Semanal" && (
        <Pastillas
          titulo="Selecciona la semana del mes"
          todos="Todas las semanas"
          opciones={OPC_SEMANAS}
          valor={r.semanas}
          onCambio={(semanas) => set({ semanas })}
          error={errores.semanas}
        />
      )}

      {r.tipo === "Mensual" && (
        <>
          <Campo etiqueta="Se repite" obligatorio>
            <Selector opciones={opcionesDiaMes(referencia)} valor={r.diaMes} onCambio={(diaMes) => set({ diaMes })} />
          </Campo>
          <Segmentado etiqueta="Meses" opciones={MODOS_MESES} valor={r.modoMeses} onCambio={(modoMeses) => set({ modoMeses })} />
          {r.modoMeses === "cada" ? (
            <Fila>
              Se repetirá cada
              <Numero valor={r.cadaMeses} onCambio={(cadaMeses) => set({ cadaMeses })} max={12} etiqueta="Cada cuántos meses" />
              mes(es)
            </Fila>
          ) : (
            <Pastillas
              titulo="Selecciona los meses"
              todos="Todos los meses"
              opciones={OPC_MESES}
              valor={r.meses}
              onCambio={(meses) => set({ meses })}
              error={errores.meses}
            />
          )}
        </>
      )}

      {r.tipo === "Configurable" && (
        <div className="flex flex-col gap-2">
          <CadaUnidad
            texto="Repetir cada"
            n={r.cadaN}
            onN={(cadaN) => set({ cadaN })}
            unidad={r.unidad}
            onUnidad={(unidad) => set({ unidad })}
            invalido={!!errores.unidad}
          />
          {errores.unidad && <span className="text-xs text-red-600">{errores.unidad}</span>}
        </div>
      )}
    </div>
  );
}
