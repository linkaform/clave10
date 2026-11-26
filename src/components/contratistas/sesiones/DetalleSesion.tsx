"use client";
// CF-03 · Panel de detalle de una sesión: Generales, Temario (Curso) o Recursos, y
// Participantes (CF-04: inscribir, asistencia, examen). Cancelar con motivo (CF-04).
// Diseño: plataforma.dc.html, ssnDetOpen (~2111–2159) y ssnD.lines (~7504).
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Award, Ban, CalendarDays, ChevronDown, ClipboardCheck, ExternalLink, FileText, Link2, MapPin, Pencil, Repeat, Trash2, UserRound, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AreaTexto, BotonIcono, Campo, ChipKpi, Modal, avisar } from "@/components/contratistas/ui";
import { PanelDetalle, TarjetaPanel } from "@/components/contratistas/panel";
import { duracionSesion, textoRecurrenciaSesion } from "@/components/contratistas/vigencia";
import { cancelSesion, getSesion } from "@/services/contratistas";
import type { Sesion } from "@/types/contratistas";
import { ParticipantesSesion } from "./ParticipantesSesion";
import { ChipEstatusSesion, ChipModalidad, ChipTipoSesion, IconoMaterial, Linea } from "./piezas";
import {
  CLAVE_SESIONES, INSTRUCTOR, conExamenes, conTemario, horario, horarioDe, nombreMaterial, rangoFechas, recurrenciaEditor, resumenTemario,
  temarioEditor, valorMaterial, type AbrirEditor,
  urlSegura,
} from "./sesiones";

export function DetalleSesion({
  id, enTabla, onCerrar, onEditar, onEliminar,
}: {
  id: string | null;
  enTabla?: boolean;
  onCerrar: () => void;
  onEditar: AbrirEditor;
  onEliminar: (s: Sesion) => void;
}) {
  const q = useQuery({ queryKey: [...CLAVE_SESIONES, id], queryFn: () => getSesion(id!), enabled: !!id });
  const s = q.data;
  const [tab, setTab] = useState("generales");
  const [cancelar, setCancelar] = useState(false);
  useEffect(() => setTab("generales"), [id]);

  const tabs = s
    ? [
        { k: "generales", etiqueta: "Generales" },
        conTemario(s.tipo)
          ? { k: "temario", etiqueta: "Temario", cuenta: resumenTemario(s.temario).lecciones }
          : { k: "recursos", etiqueta: "Recursos", cuenta: s.recursos.length },
        { k: "participantes", etiqueta: "Participantes", cuenta: s.inscritos ?? s.participantes.length },
      ]
    : [];

  return (
    <PanelDetalle
      abierto={!!id} onCerrar={onCerrar} enTabla={enTabla} etiqueta="Detalle de la sesión" sinPie
      titulo={s?.nombre ?? "Cargando…"} cargando={q.isLoading}
      chips={s && (
        <>
          <ChipEstatusSesion estatus={s.estatus} />
          <ChipTipoSesion tipo={s.tipo} />
          <ChipModalidad modalidad={s.modalidad} />
        </>
      )}
      acciones={s && (
        <>
          <BotonIcono titulo="Editar" icono={<Pencil />} disabled={s.estatus === "Cancelada"} onClick={() => onEditar(s)} />
          {s.estatus === "Programada" && <BotonIcono titulo="Cancelar sesión" icono={<Ban />} peligro onClick={() => setCancelar(true)} />}
          {s.estatus === "Programada" && <BotonIcono titulo="Eliminar" icono={<Trash2 />} peligro onClick={() => onEliminar(s)} />}
        </>
      )}
      tabs={tabs} tab={tab} onTab={setTab}
    >
      {s && tab === "generales" && <Generales s={s} />}
      {s && tab === "temario" && <Temario s={s} />}
      {s && tab === "recursos" && <Recursos s={s} />}
      {s && tab === "participantes" && <ParticipantesSesion sesion={s} />}
      {s && cancelar && <ModalCancelar s={s} onCerrar={() => setCancelar(false)} />}
    </PanelDetalle>
  );
}

/** Solo Programada; el motivo es obligatorio y se avisa a los inscritos. */
function ModalCancelar({ s, onCerrar }: { s: Sesion; onCerrar: () => void }) {
  const qc = useQueryClient();
  const [motivo, setMotivo] = useState("");
  const [intento, setIntento] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const n = s.inscritos ?? s.participantes.length;
  const guardar = async () => {
    setIntento(true);
    if (!motivo.trim()) return;
    setGuardando(true);
    try {
      await cancelSesion(s.id, motivo.trim());
      avisar("Se canceló la sesión");
      qc.invalidateQueries({ queryKey: CLAVE_SESIONES });
      onCerrar();
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se pudo cancelar la sesión", "error");
    } finally {
      setGuardando(false);
    }
  };
  return (
    <Modal
      abierto onCerrar={onCerrar} titulo="¿Cancelar sesión?" ancho={460} onGuardar={guardar} guardando={guardando}
      etiquetaGuardar="Cancelar Sesión"
      descripcion={n ? `Se avisará a ${n} ${n === 1 ? "participante inscrito" : "participantes inscritos"}. La sesión queda Cancelada y ya no se edita.` : "La sesión queda Cancelada y ya no se edita."}
    >
      <div className="rounded-lg bg-c10-sunken px-3 py-2 text-sm font-medium text-c10-title">{s.nombre}</div>
      <Campo etiqueta="Motivo de cancelación" obligatorio error={intento && !motivo.trim() && "Escribe el motivo"}>
        <AreaTexto value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3} placeholder="Por qué se cancela la sesión" autoFocus />
      </Campo>
    </Modal>
  );
}

function Generales({ s }: { s: Sesion }) {
  const dur = duracionSesion(horarioDe(s));
  const lista = (xs: { nombre: string }[]) => (xs.length ? xs.map((x) => x.nombre).join(", ") : "Ninguno");
  return (
    <TarjetaPanel>
      <div className="flex flex-col gap-4">
        <Linea icono={<CalendarDays />} nombre="Fecha y horario" valor={`${rangoFechas(s)} · ${horario(s)}${dur ? ` (${dur})` : ""}`} />
        {s.recurrencia && (
          <Linea icono={<Repeat />} nombre="Repetición" valor={textoRecurrenciaSesion(recurrenciaEditor(s), s.fecha_inicio)} />
        )}
        {s.lugar && <Linea icono={<MapPin />} nombre="Lugar" valor={s.lugar} />}
        {s.enlace && (
          <Linea
            icono={<Link2 />} nombre="Enlace de la reunión"
            valor={<a href={urlSegura(s.enlace)} target="_blank" rel="noopener noreferrer" className="break-all text-c10-acc hover:underline">{s.enlace}</a>}
          />
        )}
        <Linea icono={<UserRound />} nombre={INSTRUCTOR[s.tipo][0]} valor={s.instructor || "Sin asignar"} />
        <Linea icono={<Users />} nombre="Cupo" valor={s.cupo ? `${s.inscritos ?? 0} de ${s.cupo} lugares ocupados` : `${s.inscritos ?? 0} inscritos · sin límite`} />
        {conExamenes(s.tipo) && (
          <>
            <Linea icono={<ClipboardCheck />} nombre="Exámenes" valor={lista(s.examenes)} />
            <Linea icono={<Award />} nombre="Requerimientos que otorga" valor={lista(s.otorgados)} />
          </>
        )}
        {s.descripcion && <Linea icono={<FileText />} nombre="Descripción" valor={s.descripcion} />}
        {s.motivo_cancelacion && <Linea icono={<FileText />} nombre="Motivo de cancelación" valor={s.motivo_cancelacion} />}
      </div>
    </TarjetaPanel>
  );
}

function FilaMaterial({ tipo, nombre, material, meta }: { tipo: Parameters<typeof IconoMaterial>[0]["tipo"]; nombre: string; material?: Sesion["recursos"][number]["material"]; meta: string }) {
  const url = urlSegura(typeof material === "object" ? material.file_url : material);
  return (
    <div className="flex items-center gap-3 rounded-lg bg-c10-surface px-3 py-2 ring-1 ring-c10-line">
      <IconoMaterial tipo={tipo} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium text-c10-title" title={nombre}>{nombre}</span>
        <span className="text-xs text-c10-meta">{meta}</span>
      </span>
      {url && (
        <BotonIcono
          titulo={typeof material === "object" ? "Abrir archivo" : "Abrir enlace"} icono={<ExternalLink />} sinFondo
          onClick={() => window.open(url, "_blank", "noopener")}
        />
      )}
    </div>
  );
}

function Temario({ s }: { s: Sesion }) {
  const secciones = temarioEditor(s.temario);
  const r = resumenTemario(s.temario);
  const [cerradas, setCerradas] = useState<Set<string>>(new Set());
  const alternar = (k: string) => setCerradas((c) => { const n = new Set(c); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-base font-semibold text-c10-title">Temario</span>
        <ChipKpi n={r.lecciones} singular="lección" plural="lecciones" />
        {!!r.minutos && <span className="text-xs text-c10-meta">{r.minutos} min en total</span>}
      </div>
      {!secciones.length && <Vacio titulo="Aún no hay secciones en el temario" texto="Organiza el curso en secciones y lecciones desde Editar." />}
      {secciones.map((sec, i) => {
        const abierta = !cerradas.has(sec.key);
        return (
          <section key={sec.key} className="overflow-hidden rounded-xl bg-c10-surface ring-1 ring-c10-line-card">
            <button type="button" onClick={() => alternar(sec.key)} aria-expanded={abierta} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-c10-sunken">
              <span className="text-xs font-semibold text-c10-meta">Sección {i + 1}</span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-c10-title">{sec.titulo}</span>
              <span className="text-xs text-c10-meta">{sec.lecciones.length} {sec.lecciones.length === 1 ? "lección" : "lecciones"}</span>
              <ChevronDown className={cn("size-4 text-c10-meta transition-transform duration-200", abierta && "rotate-180")} aria-hidden />
            </button>
            {abierta && (
              <div className="flex flex-col gap-3 border-t border-c10-line bg-c10-panel px-4 py-3">
                {sec.lecciones.map((l, j) => (
                  <div key={l.key} className="flex flex-col gap-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-semibold tabular-nums text-c10-meta">{i + 1}.{j + 1}</span>
                      <span className="min-w-0 flex-1 text-sm font-medium text-c10-title">{l.titulo}</span>
                      {l.minutos && <span className="text-xs tabular-nums text-c10-meta">{l.minutos} min</span>}
                    </div>
                    {l.materiales.length ? (
                      l.materiales.map((m) => (
                        <FilaMaterial key={m.key} tipo={m.tipo} nombre={nombreMaterial({ material: valorMaterial(m) })} material={valorMaterial(m)} meta={`${m.tipo} · ${m.origen}`} />
                      ))
                    ) : (
                      <span className="text-xs text-c10-faint">Sin materiales</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function Recursos({ s }: { s: Sesion }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-base font-semibold text-c10-title">Recursos</span>
        <ChipKpi n={s.recursos.length} singular="recurso" />
      </div>
      {!s.recursos.length && <Vacio titulo="Sin recursos" texto="Agrega recursos desde Editar." />}
      {s.recursos.map((r, i) => (
        <FilaMaterial key={i} tipo={r.material_tipo} nombre={nombreMaterial(r)} material={r.material} meta={`${r.material_tipo} · ${r.material_origen}`} />
      ))}
    </div>
  );
}

function Vacio({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl bg-c10-surface px-6 py-10 text-center ring-1 ring-c10-line-card">
      <span className="text-sm font-semibold text-c10-title">{titulo}</span>
      <span className="text-xs text-c10-meta">{texto}</span>
    </div>
  );
}
