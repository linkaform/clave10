"use client";
// F0-14 · Vigencia de un requerimiento (Nuevo Requerimiento, paso 2): documento (por
// vigencia o periódico), inspección y examen (programación, tolerancia y vigencia del
// resultado). Diseño: plataforma.dc.html 2390–2410, lógica rqVMods / rqGFs (~7223).
// Avisos, acuse, limitante y criterios del mismo paso son de CF-01.
import {
  Calendar, CalendarCheck, CalendarClock, CalendarDays, CalendarRange, Repeat, Sun,
} from "lucide-react";
import { Consejo, Interruptor } from "../ui";
import { OPC_MESES } from "./EditorRecurrencia";
import { CadaUnidad, Fila, FrecuenciaHoras, Grupo, Hora, Numero, PanelVigencia, Pastillas, Segmentado } from "./piezas";
import {
  DIAS, FRECUENCIAS, ORDINALES, PERIODICIDADES, SEMANA_LUNES,
  ayudaPlazo, ayudaVigencia, ayudaVigenteDoc, erroresVigencia, resumenProgramacion,
  type ErroresVigencia, type Frecuencia, type Periodicidad, type TipoRequerimiento, type VigenciaRequerimiento as Valor,
} from "./textos";

const OPC_DIAS = SEMANA_LUNES.map((i) => ({ valor: i, etiqueta: DIAS[i] }));
const OPC_ORDINALES = ORDINALES.map((o, i) => ({ valor: i, etiqueta: o }));
const OPC_PERIODICIDAD = PERIODICIDADES.map((p) => ({ valor: p, etiqueta: p }));
const MODOS_DOC = [
  { valor: "vigencia" as const, etiqueta: "Por Vigencia", icono: <CalendarCheck /> },
  { valor: "periodico" as const, etiqueta: "Periódico", icono: <Repeat /> },
];
const MODOS_MESES = [
  { valor: "todos" as const, etiqueta: "Todos Los Meses", icono: <CalendarRange /> },
  { valor: "sel" as const, etiqueta: "Seleccionar Meses", icono: <CalendarCheck /> },
];
const ICONO_FRECUENCIA: Record<Frecuencia, JSX.Element> = {
  Diaria: <Sun />, Semanal: <CalendarDays />, Mensual: <Calendar />, Anual: <CalendarCheck />,
};
const MODOS_DIA_MES = [
  { valor: "dia" as const, etiqueta: "Un Día Del Mes", icono: <Calendar /> },
  { valor: "semana" as const, etiqueta: "Una Semana Del Mes", icono: <CalendarDays /> },
];

export interface VigenciaRequerimientoProps {
  tipo: TipoRequerimiento;
  valor: Valor;
  onCambio: (v: Valor) => void;
  /** Ya se intentó guardar: muestra los errores (erroresVigencia). */
  intento?: boolean;
}

/**
 *   const [vig, setVig] = useState(VIGENCIA_REQUERIMIENTO_INICIAL);
 *   <VigenciaRequerimiento tipo={tipo} valor={vig} onCambio={setVig} intento={intento} />
 *   // al guardar: si Object.keys(erroresVigencia(tipo, vig)).length, no se guarda
 *   // en la lista: textoVigenciaRequerimiento(tipo, vig)
 */
export function VigenciaRequerimiento({ tipo, valor: v, onCambio, intento }: VigenciaRequerimientoProps) {
  const set = (p: Partial<Valor>) => onCambio({ ...v, ...p });
  const e = intento ? erroresVigencia(tipo, v) : {};
  return (
    <PanelVigencia
      icono={<CalendarClock />}
      titulo="Vigencia"
      ayuda={ayudaVigencia(tipo, v)}
      activa={v.activa}
      onActiva={(activa) => set({ activa })}
    >
      {v.activa && (tipo === "Documento" ? <Documento v={v} set={set} e={e} /> : <Programacion tipo={tipo} v={v} set={set} e={e} />)}
    </PanelVigencia>
  );
}

interface ParteProps {
  v: Valor;
  set: (p: Partial<Valor>) => void;
  e: ErroresVigencia;
}

function Documento({ v, set, e }: ParteProps) {
  return (
    <>
      <Segmentado etiqueta="Tipo de vigencia" opciones={MODOS_DOC} valor={v.modo} onCambio={(modo) => set({ modo })} />
      {v.modo === "vigencia" ? (
        <div className="flex flex-col gap-2">
          <CadaUnidad
            texto="Vigente por"
            n={v.vigencia.n}
            onN={(n) => set({ vigencia: { ...v.vigencia, n } })}
            unidad={v.vigencia.unidad}
            onUnidad={(unidad) => set({ vigencia: { ...v.vigencia, unidad } })}
          />
          <span className="text-xs text-c10-meta">{ayudaVigenteDoc(v)}</span>
        </div>
      ) : (
        <>
          <Pastillas<Periodicidad>
            titulo="Periodicidad"
            mayusculas
            obligatorio
            unica
            opciones={OPC_PERIODICIDAD}
            valor={v.periodicidad ? [v.periodicidad] : []}
            onCambio={([periodicidad]) => set({ periodicidad })}
            error={e.periodicidad}
          />
          {v.periodicidad === "Mensual" && (
            <>
              <Segmentado etiqueta="Meses" opciones={MODOS_MESES} valor={v.modoMeses} onCambio={(modoMeses) => set({ modoMeses })} />
              {v.modoMeses === "sel" && (
                <Pastillas
                  titulo="Selecciona los meses"
                  todos="Todos los meses"
                  opciones={OPC_MESES}
                  valor={v.meses}
                  onCambio={(meses) => set({ meses })}
                  error={e.meses}
                />
              )}
            </>
          )}
          <Grupo titulo="Plazo de entrega" obligatorio ayuda={ayudaPlazo(v)}>
            <Fila>
              Día
              <Numero valor={v.plazo} onCambio={(plazo) => set({ plazo })} max={31} etiqueta="Día del plazo de entrega" />
              del mes siguiente al periodo
            </Fila>
          </Grupo>
        </>
      )}
    </>
  );
}

function Programacion({ tipo, v, set, e }: ParteProps & { tipo: TipoRequerimiento }) {
  const examen = tipo === "Examen";
  const diaria = v.frecuencia === "Diaria";
  // En examen el segmentado va sin íconos (así viene en el diseño).
  const frecuencias = FRECUENCIAS.map((f) => ({ valor: f, etiqueta: f, icono: examen ? undefined : ICONO_FRECUENCIA[f] }));
  return (
    <>
      <Segmentado etiqueta="Frecuencia" opciones={frecuencias} valor={v.frecuencia} onCambio={(frecuencia) => set({ frecuencia })} />

      {diaria && (
        <FrecuenciaHoras
          activa={v.porHoras}
          onActiva={(porHoras) => set({ porHoras })}
          horas={v.cadaHoras}
          onHoras={(cadaHoras) => set({ cadaHoras })}
        />
      )}

      {v.frecuencia === "Semanal" && (
        <Pastillas
          titulo="Días de la semana"
          mayusculas
          obligatorio
          opciones={OPC_DIAS}
          valor={v.dias}
          onCambio={(dias) => set({ dias })}
          error={e.dias}
        />
      )}

      {v.frecuencia === "Mensual" && (
        <>
          <Segmentado etiqueta="Día del mes" opciones={MODOS_DIA_MES} valor={v.diaMes} onCambio={(diaMes) => set({ diaMes })} />
          {v.diaMes === "dia" ? (
            <Fila>
              Día
              <Numero valor={v.dia} onCambio={(dia) => set({ dia })} max={31} etiqueta="Día del mes" />
              de cada mes
            </Fila>
          ) : (
            <>
              <Pastillas titulo="Semana" unica opciones={OPC_ORDINALES} valor={[v.ordinal]} onCambio={([ordinal]) => set({ ordinal })} />
              <Pastillas titulo="Día" unica opciones={OPC_DIAS} valor={[v.diaSemana]} onCambio={([diaSemana]) => set({ diaSemana })} />
            </>
          )}
        </>
      )}

      {v.frecuencia === "Anual" && (
        <Pastillas
          titulo="Meses"
          mayusculas
          obligatorio
          opciones={OPC_MESES}
          valor={v.meses}
          onCambio={(meses) => set({ meses })}
          error={e.meses}
        />
      )}

      <Grupo titulo={diaria && v.porHoras ? "Hora de inicio" : "Hora de aplicación"}>
        <Hora valor={v.hora} onCambio={(hora) => set({ hora })} etiqueta="Hora" />
      </Grupo>
      <Grupo
        titulo="Tolerancia"
        ayuda={`Pasado ese tiempo, la ${examen ? "aplicación del examen" : "inspección"} se marca como no realizada.`}
      >
        <Fila>
          Se puede aplicar hasta
          {diaria ? (
            <Numero valor={v.toleranciaHoras} onCambio={(toleranciaHoras) => set({ toleranciaHoras })} max={23} etiqueta="Tolerancia en horas" />
          ) : (
            <Numero valor={v.tolerancia} onCambio={(tolerancia) => set({ tolerancia })} etiqueta="Tolerancia en días" />
          )}
          {diaria ? "hora(s)" : "día(s)"} después
        </Fila>
      </Grupo>

      <Consejo>{resumenProgramacion(tipo, v)}</Consejo>

      {examen && (
        <div className="flex flex-col gap-3 border-t border-c10-line pt-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-c10-title">Vigencia del resultado</span>
            <Interruptor valor={v.resultado} onCambio={(resultado) => set({ resultado })} etiqueta="Vigencia del resultado" />
          </div>
          {v.resultado && (
            <div className="flex flex-col gap-2 duration-200 animate-in fade-in">
              <CadaUnidad
                texto="Aprobado es válido por"
                n={v.vigenciaResultado.n}
                onN={(n) => set({ vigenciaResultado: { ...v.vigenciaResultado, n } })}
                unidad={v.vigenciaResultado.unidad}
                onUnidad={(unidad) => set({ vigenciaResultado: { ...v.vigenciaResultado, unidad } })}
              />
              <span className="text-xs text-c10-meta">Al vencer, se pide presentar el examen de nuevo.</span>
            </div>
          )}
        </div>
      )}
    </>
  );
}
