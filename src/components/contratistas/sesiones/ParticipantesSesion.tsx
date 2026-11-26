"use client";
// CF-04 · Pestaña Participantes del detalle de una sesión: KPI, filtros, buscador,
// tabla con asistencia y examen; inscribir, quitar y calificar.
// Ficha: lkf-claude, contratistas_cf04_sesiones_participantes.md.
// Diseño: plataforma.dc.html, ssnTPar (~2142–2159), ssnInsOpen (~2290) y ssnVals (~7504–7560).
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { ClipboardPen, UserMinus, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Boton, BotonIcono, Buscador, ChipEstado, ChipKpi, Entrada, EstadoVacio, Modal, ModalConfirmar, Paginacion, Tabla, avisar,
  tipoVacio, useTabla,
} from "@/components/contratistas/ui";
import { FiltroChips, FiltrosCabecera, coincide, enLista, useFiltros } from "@/components/contratistas/filtros";
import { Avatar, useResaltados } from "@/components/contratistas/ligar";
import { calificarParticipante, getParticipantes, inscribirParticipantes, quitarParticipante, registrarAsistencia } from "@/services/contratistas";
import type { Id, ParticipantesSesion as Datos, Sesion } from "@/types/contratistas";
import { ModalInscribir } from "./ModalInscribir";
import { CLAVE_SESIONES, fechaLarga } from "./sesiones";

type Fila = Datos["participantes"][number];
type Marca = "Asistió" | "Faltó";

const estadoAsistencia = (p: Fila, dias: string[]): string => {
  if (!dias.length) return "Inscrito";
  const marcas = dias.map((d) => p.asistencia[d]);
  if (marcas.every((m) => m === "Asistió")) return "Asistió";
  if (marcas.some((m) => m === "Faltó")) return "Faltó";
  return "Pendiente";
};

export function ParticipantesSesion({ sesion }: { sesion: Sesion }) {
  const qc = useQueryClient();
  const clave = [...CLAVE_SESIONES, sesion.id, "participantes"];
  const q = useQuery({ queryKey: clave, queryFn: () => getParticipantes(sesion.id) });
  const d = q.data;

  const [busqueda, setBusqueda] = useState("");
  const [inscribir, setInscribir] = useState(false);
  const [quitar, setQuitar] = useState<Fila | null>(null);
  const [calificar, setCalificar] = useState<Fila | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const { resaltados, resaltar } = useResaltados();
  const f = useFiltros({ asistencia: [] as string[], resultado: [] as string[] }, { url: false });

  const estatus = d?.sesion.estatus ?? sesion.estatus;
  const conExamen = !!d?.sesion.examenes.length;
  const dias = useMemo(() => d?.dias ?? [], [d]);
  const variosDias = sesion.fecha_fin !== sesion.fecha_inicio || !!sesion.recurrencia;
  const editableAsistencia = estatus === "En curso" || estatus === "Finalizada";
  const puedeInscribir = estatus === "Programada" || estatus === "En curso";
  const cupo = d?.kpi.cupo ?? sesion.cupo ?? null;
  const lleno = !!cupo && (d?.kpi.inscritos ?? 0) >= cupo;

  /** Toda respuesta del back trae los participantes al día: se guarda y se refresca la lista. */
  const aplicar = (nuevo: Datos) => {
    qc.setQueryData(clave, nuevo);
    qc.invalidateQueries({ queryKey: CLAVE_SESIONES, refetchType: "active" });
    nuevo.documentos_otorgados?.forEach((x) => avisar(`Se otorgó ${x.requerimiento} a ${x.empleado}`));
  };
  const correr = async (fn: () => Promise<Datos>, ok?: string) => {
    setOcupado(true);
    try {
      aplicar(await fn());
      if (ok) avisar(ok);
      return true;
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se pudo guardar", "error");
      return false;
    } finally {
      setOcupado(false);
    }
  };

  const marcar = (p: Fila, fecha: string, estado: Marca | null) =>
    correr(() => registrarAsistencia(sesion.id, [{ empleado_id: p.empleado.id, fecha, estado }]));

  const base = useMemo(() => d?.participantes ?? [], [d]);
  const datos = useMemo(
    () =>
      base.filter(
        (p) =>
          coincide(busqueda, p.empleado.nombre, p.puesto, p.centro_trabajo) &&
          enLista(f.valores.asistencia, estadoAsistencia(p, dias)) &&
          enLista(f.valores.resultado, p.resultado ?? "Sin resultado"),
      ),
    [base, busqueda, f.valores, dias],
  );
  const cuenta = (fn: (p: Fila) => string, v: string) => base.filter((p) => fn(p) === v).length;
  const controles = (
    <>
      <FiltroChips
        titulo="Asistencia"
        opciones={(dias.length ? ["Asistió", "Faltó", "Pendiente"] : ["Inscrito"]).map((v) => ({ valor: v, cuenta: cuenta((p) => estadoAsistencia(p, dias), v) }))}
        valor={f.valores.asistencia} onCambio={(v) => f.poner("asistencia", v)}
      />
      {conExamen && (
        <FiltroChips
          titulo="Resultado"
          opciones={["Aprobado", "No aprobado", "Sin resultado"].map((v) => ({ valor: v, cuenta: cuenta((p) => p.resultado ?? "Sin resultado", v) }))}
          valor={f.valores.resultado} onCambio={(v) => f.poner("resultado", v)}
        />
      )}
    </>
  );

  const columnas = useMemo<ColumnDef<Fila, unknown>[]>(
    () => [
      {
        id: "empleado", header: "Empleado", accessorFn: (p) => p.empleado.nombre, meta: { principal: true },
        cell: ({ row: { original: p } }) => (
          <span className="flex min-w-0 items-center gap-2.5">
            <Avatar nombre={p.empleado.nombre} tam={32} />
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-semibold text-c10-title">{p.empleado.nombre}</span>
              <span className="truncate text-xs text-c10-meta">{p.puesto || "Sin puesto"}</span>
            </span>
          </span>
        ),
      },
      { id: "centro", header: "Ubicación", accessorFn: (p) => p.centro_trabajo ?? "---", meta: { minimo: 140 } },
      {
        id: "asistencia", header: "Asistencia", enableSorting: false, meta: { minimo: 190 },
        cell: ({ row: { original: p } }) =>
          variosDias ? (
            <AsistenciaDias p={p} dias={dias} editable={editableAsistencia && !ocupado} onMarcar={(fecha, e) => marcar(p, fecha, e)} />
          ) : (
            <AsistenciaUnDia p={p} dia={dias[0]} editable={editableAsistencia && !!dias[0] && !ocupado} onMarcar={(e) => marcar(p, dias[0], e)} />
          ),
      },
      ...(conExamen
        ? [{
            id: "examen", header: "Examen", accessorFn: (p: Fila) => p.calificacion ?? -1, meta: { minimo: 150 },
            cell: ({ row: { original: p } }: { row: { original: Fila } }) =>
              p.calificacion != null ? (
                <span className="flex items-center gap-2">
                  <span className="font-semibold tabular-nums text-c10-title">{p.calificacion}</span>
                  {p.resultado && <ChipEstado texto={p.resultado} tono={p.resultado === "Aprobado" ? "success" : "danger"} />}
                </span>
              ) : (
                <span className="text-c10-faint">---</span>
              ),
          }]
        : []),
    ],
    // marcar depende de la sesión y de `ocupado`
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [variosDias, dias, editableAsistencia, ocupado, conExamen],
  );
  const tabla = useTabla({ datos, columnas, getId: (p) => p.empleado.id });

  const asistio = (p: Fila) => Object.values(p.asistencia).includes("Asistió");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-base font-semibold text-c10-title">Participantes</span>
          <ChipKpi n={d?.kpi.inscritos ?? 0} singular={cupo ? `de ${cupo} inscritos` : "inscrito"} plural={cupo ? `de ${cupo} inscritos` : "inscritos"} />
          {d && dias.length > 0 && (
            <span className="text-xs text-c10-meta">
              {variosDias && d.kpi.asistencia_pct != null ? `${d.kpi.asistencia_pct}% de asistencia` : `${d.kpi.asistieron} ${d.kpi.asistieron === 1 ? "asistió" : "asistieron"}`}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <FiltrosCabecera cuenta={f.cuenta} onLimpiar={f.limpiar} filtros={controles} />
          <Buscador value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar participante" className="w-[200px]" />
          {puedeInscribir && (
            <span title={lleno ? "Se alcanzó el cupo de la sesión" : undefined}>
              <Boton tam="sm" icono={<UserPlus />} disabled={lleno} onClick={() => setInscribir(true)}>Inscribir Empleados</Boton>
            </span>
          )}
        </div>
      </div>

      <Tabla
        tabla={tabla} cargando={q.isLoading} nombreFila={(p) => p.empleado.nombre}
        filaActiva={resaltados[0] ?? null}
        vacio={
          <EstadoVacio
            tipo={tipoVacio({ error: q.error, filtrando: !!busqueda.trim() || f.activos })}
            titulo={!q.error && !busqueda.trim() && !f.activos ? "Aún no hay participantes inscritos" : undefined}
            texto={!q.error && !busqueda.trim() && !f.activos ? (puedeInscribir ? "Inscribe empleados para llevar su asistencia." : "Esta sesión ya no admite inscripciones.") : undefined}
            className="min-h-[260px]"
          />
        }
        acciones={(p) => (
          <>
            {conExamen && (
              <BotonIcono
                titulo={asistio(p) ? "Calificar examen" : "Solo se califica a quien asistió"} icono={<ClipboardPen />} enTabla
                disabled={!asistio(p) || ocupado} onClick={() => setCalificar(p)}
              />
            )}
            <BotonIcono
              titulo={estatus === "Programada" ? "Quitar participante" : "Solo se quita a un participante de una sesión Programada"}
              icono={<UserMinus />} enTabla peligro disabled={estatus !== "Programada" || ocupado} onClick={() => setQuitar(p)}
            />
          </>
        )}
      />
      <Paginacion tabla={tabla} />

      <ModalInscribir
        abierto={inscribir} onCerrar={() => setInscribir(false)} sesion={sesion}
        inscritos={base.map((p) => p.empleado.id)} restantes={cupo ? Math.max(cupo - base.length, 0) : null}
        onInscribir={async (ids) => {
          const nuevo = await inscribirParticipantes(sesion.id, ids);
          aplicar(nuevo);
          resaltar(ids);
        }}
      />

      <ModalConfirmar
        abierto={!!quitar} onCancelar={() => setQuitar(null)} peligro icono={<UserMinus />} cargando={ocupado}
        titulo="¿Quitar participante?" etiqueta="Quitar Participante" elemento={quitar?.empleado.nombre}
        descripcion="Se le notificará al empleado que ya no está inscrito en la sesión."
        onConfirmar={async () => {
          if (quitar && (await correr(() => quitarParticipante(sesion.id, quitar.empleado.id), "Se quitó al participante"))) setQuitar(null);
        }}
      />

      {calificar && d && (
        <ModalCalificar
          p={calificar} examenes={d.sesion.examenes} minimas={d.examenes_minimas} ocupado={ocupado}
          onCerrar={() => setCalificar(null)}
          onGuardar={async (cal) => {
            if (await correr(() => calificarParticipante(sesion.id, calificar.empleado.id, cal), "Se guardó la calificación")) setCalificar(null);
          }}
        />
      )}
    </div>
  );
}

/* ---------- Asistencia ---------- */

function AsistenciaUnDia({ p, dia, editable, onMarcar }: { p: Fila; dia?: string; editable: boolean; onMarcar: (e: Marca | null) => void }) {
  if (!dia) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-c10-meta">
        <span className="size-1.5 rounded-full bg-slate-400" />Inscrito
      </span>
    );
  }
  const actual = p.asistencia[dia];
  return (
    <span role="radiogroup" aria-label={`Asistencia de ${p.empleado.nombre}`} className="inline-flex overflow-hidden rounded-lg ring-1 ring-c10-line">
      {(["Asistió", "Faltó"] as Marca[]).map((m, i) => {
        const on = actual === m;
        return (
          <button
            key={m} type="button" role="radio" aria-checked={on} disabled={!editable}
            onClick={() => onMarcar(on ? null : m)}
            className={cn(
              "h-8 px-3 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
              i > 0 && "border-l border-c10-line",
              on ? (m === "Asistió" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700") : "bg-c10-surface text-c10-secondary hover:bg-c10-sunken",
            )}
          >
            {m}
          </button>
        );
      })}
    </span>
  );
}

/** Varios días: % y un punto por día transcurrido. Clic: sin marca → Asistió → Faltó → sin marca. */
function AsistenciaDias({ p, dias, editable, onMarcar }: { p: Fila; dias: string[]; editable: boolean; onMarcar: (fecha: string, e: Marca | null) => void }) {
  const r = p.asistencia_resumen;
  const siguiente = (m?: Marca): Marca | null => (!m ? "Asistió" : m === "Asistió" ? "Faltó" : null);
  if (!dias.length) return <span className="text-xs text-c10-meta">Inscrito · aún no empieza</span>;
  return (
    <span className="flex flex-col gap-1">
      <span className="flex items-baseline gap-1.5">
        <span className="font-semibold tabular-nums text-c10-title">{r.pct ?? 0}%</span>
        <span className="text-xs text-c10-meta">{r.asistio} de {r.dias} {r.dias === 1 ? "día" : "días"}</span>
      </span>
      <span className="flex flex-wrap gap-1">
        {dias.map((dia) => {
          const m = p.asistencia[dia];
          return (
            <button
              key={dia} type="button" disabled={!editable} onClick={() => onMarcar(dia, siguiente(m))}
              title={`${fechaLarga(dia)} · ${m ?? "Sin registro"}${editable ? " · clic para cambiar" : ""}`}
              aria-label={`${fechaLarga(dia)}: ${m ?? "sin registro"}`}
              className={cn(
                "size-3 rounded-full ring-offset-1 transition-transform hover:scale-125 disabled:cursor-not-allowed disabled:hover:scale-100",
                m === "Asistió" ? "bg-green-500" : m === "Faltó" ? "bg-red-500" : "bg-slate-300",
              )}
            />
          );
        })}
      </span>
    </span>
  );
}

/* ---------- Calificar ---------- */

function ModalCalificar({
  p, examenes, minimas, ocupado, onCerrar, onGuardar,
}: {
  p: Fila;
  examenes: { id: Id; nombre: string }[];
  minimas: Record<Id, number>;
  ocupado: boolean;
  onCerrar: () => void;
  onGuardar: (cal: Record<Id, number | null>) => void;
}) {
  const [v, setV] = useState<Record<Id, string>>(() =>
    Object.fromEntries(examenes.map((x) => [x.id, p.calificaciones?.[x.id] != null ? String(p.calificaciones[x.id]) : ""])),
  );
  const invalido = (s: string) => s !== "" && (Number.isNaN(Number(s)) || Number(s) < 0 || Number(s) > 100);
  const hayError = Object.values(v).some(invalido);
  return (
    <Modal
      abierto onCerrar={onCerrar} titulo="Calificar examen" descripcion={p.empleado.nombre} ancho={480}
      etiquetaGuardar="Guardar Calificación" guardando={ocupado}
      onGuardar={() => !hayError && onGuardar(Object.fromEntries(Object.entries(v).map(([k, s]) => [k, s === "" ? null : Number(s)])))}
    >
      {examenes.map((x) => (
        <label key={x.id} className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-c10-title">{x.nombre}</span>
            <span className="text-xs text-c10-meta">Aprueba con {minimas[x.id] ?? 80} o más</span>
          </span>
          <Entrada
            type="number" min={0} max={100} step={1} value={v[x.id]} placeholder="0–100" className="w-[96px]"
            invalido={invalido(v[x.id])} onChange={(e) => setV((s) => ({ ...s, [x.id]: e.target.value }))}
          />
        </label>
      ))}
      {hayError && <span className="text-xs text-red-600">La calificación va de 0 a 100.</span>}
      <span className="text-xs text-c10-meta">Deja vacío para borrar una calificación.</span>
    </Modal>
  );
}
