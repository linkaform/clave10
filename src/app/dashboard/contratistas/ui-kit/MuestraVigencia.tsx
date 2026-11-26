"use client";
// F0-14 · Muestra del selector de vigencia / recurrencia en sus tres variantes.
// "Guardar" valida como lo harán las pantallas (CF-01, CF-03, ME-12) y enseña el texto
// que va a la lista o al resumen.
import { useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Boton, Campo, Entrada, Modal, avisar } from "@/components/contratistas/ui";
import { iconoTipo } from "@/components/contratistas/ligar/piezas";
import {
  ProgramacionSesion, RECURRENCIA_CONTRATO_INICIAL, RECURRENCIA_SESION_INICIAL, RecurrenciaContrato, Segmentado,
  VIGENCIA_REQUERIMIENTO_INICIAL, VigenciaRequerimiento, erroresContrato, erroresSesion, erroresVigencia, isoLocal,
  resumenContrato, textoRecurrenciaSesion, textoVigenciaRequerimiento,
  type HorarioSesion, type TipoRequerimiento,
} from "@/components/contratistas/vigencia";

const TIPOS: TipoRequerimiento[] = ["Documento", "Examen", "Inspección"];
const INICIO_CONTRATO = "2026-12-01";

function Caso({
  titulo, resultado, onGuardar, etiqueta = "Guardar", children,
}: { titulo: string; resultado: string; onGuardar: () => void; etiqueta?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-4 rounded-xl p-4 shadow-[0_0_0_1px_var(--c10-line)]">
      <span className="text-[13px] font-semibold text-c10-secondary">{titulo}</span>
      {children}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-c10-line pt-3">
        <span className="min-w-0 text-[13px] text-c10-meta">
          Texto: <span className="font-medium text-c10-title">{resultado}</span>
        </span>
        <Boton onClick={onGuardar}>{etiqueta}</Boton>
      </div>
    </div>
  );
}

function manana() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return isoLocal(d);
}

export function MuestraVigencia() {
  const [abierto, setAbierto] = useState(false);
  const [guardado, setGuardado] = useState<string | null>(null);

  const [horario, setHorario] = useState<HorarioSesion>(() => ({ fecha: manana(), fechaFin: manana(), inicio: "09:00", fin: "10:00", todoElDia: false }));
  const [recSesion, setRecSesion] = useState(RECURRENCIA_SESION_INICIAL);
  const [intSesion, setIntSesion] = useState(false);

  const [recContrato, setRecContrato] = useState(RECURRENCIA_CONTRATO_INICIAL);
  const [intContrato, setIntContrato] = useState(false);

  const guardar = (marcar: (v: boolean) => void, hayErrores: boolean, texto: string) => {
    marcar(true);
    if (hayErrores) avisar("Revisa los campos marcados", "error");
    else avisar(`Guardado: ${texto}`);
  };

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Caso
        titulo="Requerimientos · Nuevo Requerimiento, paso 2"
        resultado={guardado ?? "—"}
        onGuardar={() => setAbierto(true)}
        etiqueta={
          <>
            <Plus /> Nuevo requerimiento
          </>
        }
      >
        <p className="text-[13px] text-c10-meta">
          El selector va en el paso 2 del modal. Aquí el paso 1 solo pide nombre y tipo; el resto del alta (documento de
          ejemplo, plataforma, descripción, avisos y criterios) es de CF-01.
        </p>
        <ModalRequerimiento abierto={abierto} onCerrar={() => setAbierto(false)} onGuardar={setGuardado} />
      </Caso>

      <div className="flex min-w-0 flex-col gap-4">
        <Caso
          titulo="Sesiones · Nueva Sesión"
          resultado={textoRecurrenciaSesion(recSesion, horario.fecha)}
          onGuardar={() => guardar(setIntSesion, erroresSesion(horario, recSesion).hayErrores, textoRecurrenciaSesion(recSesion, horario.fecha))}
        >
          <ProgramacionSesion horario={horario} onHorario={setHorario} recurrencia={recSesion} onRecurrencia={setRecSesion} intento={intSesion} />
        </Caso>

        <Caso
          titulo={`Nuevo Contrato · Recurrencia (inicio ${INICIO_CONTRATO.split("-").reverse().join("/")})`}
          resultado={resumenContrato(recContrato, INICIO_CONTRATO)}
          onGuardar={() =>
            guardar(setIntContrato, Object.keys(erroresContrato(recContrato)).length > 0, resumenContrato(recContrato, INICIO_CONTRATO))
          }
        >
          <RecurrenciaContrato valor={recContrato} onCambio={setRecContrato} inicio={INICIO_CONTRATO} intento={intContrato} />
        </Caso>
      </div>
    </div>
  );
}

/** Muestra del alta en dos pasos: 1 nombre y tipo, 2 vigencia. */
function ModalRequerimiento({ abierto, onCerrar, onGuardar }: { abierto: boolean; onCerrar: () => void; onGuardar: (texto: string) => void }) {
  const [paso, setPaso] = useState<1 | 2>(1);
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<TipoRequerimiento>("Documento");
  const [vig, setVig] = useState(VIGENCIA_REQUERIMIENTO_INICIAL);
  const [intento, setIntento] = useState(false);
  const [antes, setAntes] = useState(abierto);
  if (abierto !== antes) {
    setAntes(abierto);
    if (abierto) {
      setPaso(1);
      setNombre("");
      setTipo("Documento");
      setVig(VIGENCIA_REQUERIMIENTO_INICIAL);
      setIntento(false);
    }
  }

  const siguiente = () => {
    setIntento(true);
    if (paso === 1) {
      if (!nombre.trim()) return;
      setPaso(2);
      setIntento(false);
      return;
    }
    if (Object.keys(erroresVigencia(tipo, vig)).length) return;
    const texto = `${nombre.trim()} · ${tipo} · ${textoVigenciaRequerimiento(tipo, vig)}`;
    onGuardar(texto);
    avisar("Se agregó el requerimiento");
    onCerrar();
  };

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Nuevo requerimiento"
      ancho={600}
      alto={680}
      cabecera={
        <div className="flex gap-1.5" aria-label={`Paso ${paso} de 2`}>
          {[1, 2].map((p) => (
            <span key={p} className={cn("h-1 w-10 rounded-full transition-colors duration-200", p <= paso ? "bg-c10-acc" : "bg-c10-line")} />
          ))}
        </div>
      }
      claseCuerpo="gap-5 px-6 py-5"
      pie={
        <>
          <Boton variante="cancelar" flex onClick={paso === 1 ? onCerrar : () => setPaso(1)}>
            {paso === 1 ? "Cancelar" : "Anterior"}
          </Boton>
          <Boton flex onClick={siguiente}>
            {paso === 1 ? "Siguiente" : "Guardar"}
          </Boton>
        </>
      }
    >
      {paso === 1 ? (
        <>
          <Campo etiqueta="Requerimiento" obligatorio error={intento && !nombre.trim() && "Escribe el nombre del requerimiento"}>
            <Entrada value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Opinión de cumplimiento IMSS" />
          </Campo>
          <Campo etiqueta="Tipo" obligatorio>
            <Segmentado
              etiqueta="Tipo"
              opciones={TIPOS.map((t) => {
                const Icono = iconoTipo(t);
                return { valor: t, etiqueta: t, icono: <Icono /> };
              })}
              valor={tipo}
              onCambio={setTipo}
            />
          </Campo>
        </>
      ) : (
        <VigenciaRequerimiento tipo={tipo} valor={vig} onCambio={setVig} intento={intento} />
      )}
    </Modal>
  );
}
