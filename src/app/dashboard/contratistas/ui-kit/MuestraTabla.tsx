"use client";
// F0-05 · Ejemplo del listado completo para la página de muestra: los tres modos con el
// mismo dato, orden, ancho ajustable, paginación, selección con acciones masivas, estados
// vacíos, panel de detalle (F0-07), filtros (F0-06) y botón flotante. Datos inventados.
import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ClipboardCheck, Copy, Download, Eye, FileText, IdCard, Pencil, Plus, RotateCw, ShieldCheck, Trash2, UserRound } from "lucide-react";
import {
  BarraCumplimiento, BarraSeleccion, Boton, BotonBarra, BotonFlotante, BotonIcono, Buscador, ChipEstado, ChipFiltro, ChipFolio,
  ChipKpi, ColumnaLista, DatoLista, EstadoVacio, FilaDato, ModalConfirmar, Paginacion, RejillaCards, SelectorVista, Tabla,
  TarjetaCompacta, TarjetaLista, avisar, tipoVacio, useTabla, useVista,
} from "@/components/contratistas/ui";
import { Dato, Datos, PANEL_OJO, PanelDetalle, TarjetaPanel } from "@/components/contratistas/panel";
import {
  ConFiltros, FECHA_TODOS, FiltroChips, FiltroFecha, FiltroInterruptor, FiltroLista, FiltrosCabecera, coincide, enFecha, enLista, useFiltros,
} from "@/components/contratistas/filtros";
import { ESTATUS_REPSE_TONO, SEMAFORO_TONO, semaforo } from "@/mappers/contratistas.mapper";
import type { EstatusRepse } from "@/types/contratistas/empresa";

interface Ctr {
  id: string;
  folio: string;
  razon: string;
  rfc: string;
  activo: boolean;
  repse: EstatusRepse;
  vence: string;
  contratos: number;
  cumplimiento: number;
  representante: string;
}

const NOMBRES = [
  "Ternium México, S.A. de C.V.", "Pemex Transformación Industrial", "Lennox México, S. de R.L. de C.V.", "Grupo Alfa, S.A.B. de C.V.",
  "Cemex, S.A.B. de C.V.", "Vitro, S.A.B. de C.V.", "Grupo Bimbo, S.A.B. de C.V.", "Industrias Peñoles, S.A.B. de C.V.",
  "Arca Continental, S.A.B. de C.V.", "Nemak, S.A.B. de C.V.", "Orbia Advance Corporation", "Grupo Lala, S.A.B. de C.V.",
  "Transportes y Logística Escobedo, S.A. de C.V.", "Telecomunicaciones del Norte, S.A. de C.V.", "Seguridad Privada Cumbres, S.A. de C.V.",
  "Pintura Industrial Anáhuac, S.A. de C.V.", "Servicios Médicos Monterrey, S.C.", "Soldaduras Especiales del Golfo",
  "Limpieza Integral del Norte, S.A. de C.V.", "Jardines y Áreas Verdes, S.A. de C.V.", "Mantenimiento Eléctrico Apodaca",
  "Andamios y Estructuras Linares", "Climas y Refrigeración Santa Catarina", "Fumigaciones Profesionales del Valle",
  "Grúas y Montacargas García", "Ingeniería Civil Sabinas", "Vigilancia Táctica, S.A. de C.V.", "Comedores Industriales Guadalupe",
  "Elevadores del Bajío", "Herrería y Pailería Cadereyta", "Recolección de Residuos Escobedo", "Capacitación Industrial Integral",
  "Tecnologías de Acceso Cumbres", "Pisos Industriales Allende", "Sistemas Contra Incendio del Norte", "Uniformes y Equipo de Seguridad",
  "Plomería Industrial Juárez", "Transporte de Personal Santiago", "Topografía y Geomática Regia", "Laboratorio de Calidad Saltillo",
  "Impermeabilizantes Monterrey", "Control de Plagas Mitras",
];
const REPRES = ["Laura Garza", "Jorge Treviño", "Ana Cantú", "Luis Villarreal", "Sofía Elizondo", "Carlos Salinas", "Diana Rocha"];
const REPSE: EstatusRepse[] = ["Vigente", "Vigente", "Por vencer", "Vigente", "Vencido", "Vigente", "Sin REPSE"];

const BASE: Ctr[] = NOMBRES.map((razon, i) => {
  const letras = razon.replace(/[^A-ZÁÉÍÓÚÑ]/g, "").slice(0, 3).padEnd(3, "X");
  const mes = String(((i * 5) % 12) + 1).padStart(2, "0");
  const dia = String(((i * 7) % 27) + 1).padStart(2, "0");
  return {
    id: `ct${i}`,
    folio: `CT-${31 + i * 4}`,
    razon,
    rfc: `${letras}${String(880101 + i * 1373).slice(0, 6)}${"AB1QW2KM5PL4"[i % 12]}${i % 10}`,
    activo: i % 9 !== 4,
    repse: REPSE[i % REPSE.length],
    vence: `${26 + (i % 3)}-${mes}-${dia}`,
    contratos: (i * 7) % 6,
    cumplimiento: [100, 92, 45, 78, 96, 88, 30, 84, 64, 100, 94, 72][i % 12],
    representante: REPRES[i % REPRES.length],
  };
});

const SIMULAR = ["3 registros", "42 registros", "Sin registros", "Error", "Tiempo agotado"] as const;
type Simular = (typeof SIMULAR)[number];

/** "26-05-12" → "2026-05-12" */
const fechaVence = (c: Ctr) => (c.repse === "Sin REPSE" ? null : `20${c.vence}`);
const estatusDe = (c: Ctr) => (c.activo ? "Activo" : "Inactivo");

function CopiarRfc({ rfc }: { rfc: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 tabular-nums">
      {rfc}
      <button
        type="button"
        title="Copiar RFC"
        aria-label="Copiar RFC"
        onClick={() => {
          navigator.clipboard?.writeText(rfc).catch(() => {});
          avisar("Se copió el RFC");
        }}
        className="text-c10-faint transition-colors hover:text-c10-acc"
      >
        <Copy className="size-3.5" />
      </button>
    </span>
  );
}

const Estatus = ({ c }: { c: Ctr }) => <ChipEstado texto={c.activo ? "Activo" : "Inactivo"} tono={c.activo ? "success" : "neutral"} />;
const Repse = ({ c }: { c: Ctr }) => <ChipEstado texto={c.repse} tono={ESTATUS_REPSE_TONO[c.repse]} />;
const Cumplimiento = ({ c }: { c: Ctr }) => <ChipEstado texto={`${c.cumplimiento}%`} tono={SEMAFORO_TONO[semaforo(c.cumplimiento)]} />;

export function MuestraTabla() {
  const [filas, setFilas] = useState(BASE);
  const [q, setQ] = useState("");
  const [simular, setSimular] = useState<Simular>("3 registros");
  const [vista, setVista] = useVista("ui-kit", "tabla");
  const [abierto, setAbierto] = useState<{ c: Ctr; enTabla: boolean } | null>(null);
  const [borrar, setBorrar] = useState<Ctr[] | null>(null);
  const f = useFiltros({ estatus: [] as string[], repse: [] as string[], representante: [] as string[], vence: FECHA_TODOS, conContratos: false });
  const v = f.valores;

  // Todo lo que hay antes de buscar y filtrar: de aquí salen los contadores de cada opción
  const base = useMemo(
    () => (simular === "3 registros" ? filas.slice(0, 3) : simular === "42 registros" ? filas : []),
    [filas, simular],
  );
  const cuantos = (fn: (c: Ctr) => boolean) => base.filter(fn).length;

  const datos = useMemo(
    () =>
      base.filter(
        (c) =>
          coincide(q, c.razon, c.rfc, c.folio) &&
          enLista(v.estatus, estatusDe(c)) &&
          enLista(v.repse, c.repse) &&
          enLista(v.representante, c.representante) &&
          enFecha(fechaVence(c), v.vence) &&
          (!v.conContratos || c.contratos > 0),
      ),
    [base, q, v],
  );

  const controles = (
    <>
      <FiltroChips
        titulo="Estatus"
        opciones={["Activo", "Inactivo"].map((e) => ({ valor: e, cuenta: cuantos((c) => estatusDe(c) === e) }))}
        valor={v.estatus}
        onCambio={(x) => f.poner("estatus", x)}
      />
      <FiltroChips
        titulo="REPSE"
        opciones={["Vigente", "Por vencer", "Vencido", "Sin REPSE"].map((e) => ({ valor: e, cuenta: cuantos((c) => c.repse === e) }))}
        valor={v.repse}
        onCambio={(x) => f.poner("repse", x)}
      />
      <FiltroLista
        titulo="Representante"
        placeholder="Selecciona un representante"
        opciones={REPRES.map((r) => ({ valor: r, cuenta: cuantos((c) => c.representante === r) }))}
        valor={v.representante}
        onCambio={(x) => f.poner("representante", x)}
      />
      <FiltroFecha titulo="Vence REPSE" valor={v.vence} onCambio={(x) => f.poner("vence", x)} />
      <FiltroInterruptor titulo="Con contratos" descripcion="Solo los que tienen al menos uno" valor={v.conContratos} onCambio={(x) => f.poner("conContratos", x)} />
    </>
  );

  const columnas = useMemo<ColumnDef<Ctr, unknown>[]>(
    () => [
      {
        id: "razon",
        header: "Contratista",
        accessorFn: (c) => c.razon,
        meta: { principal: true },
        cell: ({ row: { original: c } }) => (
          <span className="flex min-w-0 flex-col gap-px">
            <span className="truncate font-semibold text-c10-title" title={c.razon}>{c.razon}</span>
            <span className="text-xs tabular-nums text-c10-faint">#{c.folio}</span>
          </span>
        ),
      },
      { id: "rfc", header: "RFC", accessorFn: (c) => c.rfc, cell: ({ row }) => <CopiarRfc rfc={row.original.rfc} />, meta: { minimo: 170 } },
      { id: "estatus", header: "Estatus", accessorFn: (c) => (c.activo ? 0 : 1), cell: ({ row }) => <Estatus c={row.original} /> },
      {
        id: "repse",
        header: "REPSE",
        accessorFn: (c) => c.repse,
        meta: { minimo: 150 },
        cell: ({ row: { original: c } }) => (
          <span className="flex flex-col items-start gap-1">
            <Repse c={c} />
            {c.repse !== "Sin REPSE" && <span className="text-xs tabular-nums text-c10-meta">Vence {c.vence}</span>}
          </span>
        ),
      },
      { id: "contratos", header: "Contratos", accessorFn: (c) => c.contratos, meta: { derecha: true } },
      { id: "cumplimiento", header: "Cumplimiento", accessorFn: (c) => c.cumplimiento, cell: ({ row }) => <Cumplimiento c={row.original} /> },
      { id: "representante", header: "Representante", accessorFn: (c) => c.representante, meta: { minimo: 150 } },
    ],
    [],
  );

  const tabla = useTabla({ datos, columnas, getId: (c) => c.id });
  const filasPagina = tabla.getRowModel().rows;

  const error = simular === "Error" ? new Error("Error 500") : simular === "Tiempo agotado" ? new Error("Tiempo agotado") : null;
  const vacio = (
    <EstadoVacio
      tipo={tipoVacio({ error, filtrando: !!q.trim() || f.activos })}
      accion={
        error ? (
          <Boton variante="contorno" tam="sm" icono={<RotateCw />} onClick={() => setSimular("3 registros")}>
            Reintentar
          </Boton>
        ) : undefined
      }
    />
  );

  const abrir = (c: Ctr, enTabla: boolean) => setAbierto({ c, enTabla });

  const AccionesFila = ({ c, enTarjeta }: { c: Ctr; enTarjeta?: boolean }) => (
    <>
      {!enTarjeta && <BotonIcono titulo="Ver detalle" icono={<Eye />} enTabla onClick={() => abrir(c, true)} {...PANEL_OJO} />}
      <BotonIcono titulo="Descargar expediente" icono={<Download />} enTabla={!enTarjeta} sinFondo={enTarjeta} onClick={() => avisar("Se inició la descarga del expediente", "info")} />
      <BotonIcono titulo="Eliminar contratista" icono={<Trash2 />} enTabla={!enTarjeta} sinFondo={enTarjeta} peligro onClick={() => setBorrar([c])} />
    </>
  );

  // Pie de las cards: botones redondos grises, como en el diseño
  const AccionesCard = ({ c }: { c: Ctr }) => (
    <>
      <BotonIcono titulo="Editar" icono={<Pencil />} onClick={() => avisar("Aquí abre el modal de editar", "info")} />
      <BotonIcono titulo="Eliminar contratista" icono={<Trash2 />} peligro onClick={() => setBorrar([c])} />
    </>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Cabecera de sección: título + KPI · buscador · vista */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h3 className="m-0 text-xl font-semibold tracking-[-0.02em] text-c10-title">Contratistas</h3>
          <ChipKpi n={datos.length} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FiltrosCabecera angosto vista={vista} cuenta={f.cuenta} onLimpiar={f.limpiar} filtros={controles} />
          <Buscador value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar contratista" className="w-[260px]" />
          <SelectorVista vista={vista} onCambio={setVista} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-c10-meta">
        Simular respuesta:
        {SIMULAR.map((s) => (
          <ChipFiltro key={s} activo={simular === s} onClick={() => setSimular(s)}>
            {s}
          </ChipFiltro>
        ))}
      </div>
      <p className="m-0 text-xs text-c10-meta">
        Filtros (F0-06): panel a la izquierda en pantalla ancha; en tabla nace oculto. Angosta: botón en la cabecera (cards y lista) o
        pastilla (tabla). Atajo del menú:{" "}
        <a className="text-c10-acc underline" href="?estatus=Activo&repse=Por%20vencer">?estatus=Activo&amp;repse=Por vencer</a>
      </p>

      {/* Panel lateral (o pastilla y cajón en pantallas angostas); en tabla nace oculto */}
      <ConFiltros conCabecera cuenta={f.cuenta} onLimpiar={f.limpiar} filtros={controles} vista={vista} tope="96px">
        <div className="flex flex-col gap-4">
          {vista === "tabla" && (
            <Tabla
              tabla={tabla}
              seleccion
              fijarPrincipal
              claveAncho="ui-kit-contratistas"
              acciones={(c) => <AccionesFila c={c} />}
              nombreFila={(c) => c.razon}
              filaActiva={abierto?.enTabla ? abierto.c.id : null}
              vacio={vacio}
            />
          )}

          {vista !== "tabla" && !filasPagina.length && <div className="rounded-xl bg-c10-surface shadow-[0_0_0_1px_var(--c10-line-card)]">{vacio}</div>}

          {/* Cards compactas: foto, nombre con punto de estatus, filas y pie de acciones. Sin folio (spec §3.11) */}
          {vista === "cards" && !!filasPagina.length && (
            <RejillaCards>
              {filasPagina.map((r) => {
                const c = r.original;
                return (
                  <TarjetaCompacta
                    key={r.id}
                    etiqueta={`Ver detalle de ${c.razon}`}
                    onAbrir={() => abrir(c, false)}
                    seleccion={{ marcada: r.getIsSelected(), onCambio: (v) => r.toggleSelected(v), titulo: `Seleccionar ${c.razon}` }}
                    textoSinImagen="Logo del contratista"
                    titulo={c.razon}
                    estatus={{ texto: c.activo ? "Activo" : "Inactivo", activo: c.activo }}
                    acciones={<AccionesCard c={c} />}
                  >
                    <BarraCumplimiento pct={c.cumplimiento} icono={<ClipboardCheck />} />
                    <FilaDato icono={<IdCard />} etiqueta="RFC" copiar={c.rfc}>{c.rfc}</FilaDato>
                    <FilaDato icono={<ShieldCheck />} etiqueta="REPSE">{c.repse === "Sin REPSE" ? c.repse : `${c.repse} · vence ${c.vence}`}</FilaDato>
                    <FilaDato icono={<FileText />} etiqueta="Contratos">{c.contratos || "Sin contratos"}</FilaDato>
                    <FilaDato icono={<UserRound />} etiqueta="Representante">{c.representante}</FilaDato>
                  </TarjetaCompacta>
                );
              })}
            </RejillaCards>
          )}

          {/* Lista de cards: foto a la izquierda; nombre, estatus y folio; cumplimiento y datos */}
          {vista === "lista" && !!filasPagina.length && (
            <ColumnaLista>
              {filasPagina.map((r) => {
                const c = r.original;
                return (
                  <TarjetaLista
                    key={r.id}
                    etiqueta={`Ver detalle de ${c.razon}`}
                    onAbrir={() => abrir(c, false)}
                    seleccion={{ marcada: r.getIsSelected(), onCambio: (v) => r.toggleSelected(v), titulo: `Seleccionar ${c.razon}` }}
                    textoSinImagen="Logo del contratista"
                    titulo={c.razon}
                    chips={<><Estatus c={c} /><ChipFolio folio={c.folio} /></>}
                    acciones={<AccionesCard c={c} />}
                  >
                    <BarraCumplimiento variante="bloque" pct={c.cumplimiento} detalle={`${Math.round((c.cumplimiento * 12) / 100)} de 12`} />
                    <DatoLista nombre="RFC" copiar={c.rfc}>{c.rfc}</DatoLista>
                    <DatoLista nombre="REPSE">{c.repse}</DatoLista>
                    <DatoLista nombre="Vence REPSE">{c.repse === "Sin REPSE" ? undefined : c.vence}</DatoLista>
                    <DatoLista nombre="Contratos">{c.contratos || "Sin contratos"}</DatoLista>
                    <DatoLista nombre="Representante">{c.representante}</DatoLista>
                  </TarjetaLista>
                );
              })}
            </ColumnaLista>
          )}

          <Paginacion tabla={tabla} />
        </div>
      </ConFiltros>

      <BarraSeleccion tabla={tabla}>
        <BotonBarra blanco icono={<Download />} onClick={() => avisar(`Se inició la descarga de ${tabla.getSelectedRowModel().rows.length} expedientes`, "info")}>
          Descargar Expedientes
        </BotonBarra>
        <BotonBarra icono={<Trash2 />} onClick={() => setBorrar(tabla.getSelectedRowModel().rows.map((r) => r.original))}>
          Eliminar
        </BotonBarra>
      </BarraSeleccion>

      <BotonFlotante etiqueta="Invitar Contratista" icono={<Plus />} onClick={() => avisar("Aquí abre el modal de invitar (R-02)", "info")} />

      <PanelDetalle
        abierto={!!abierto}
        onCerrar={() => setAbierto(null)}
        enTabla={abierto?.enTabla}
        etiqueta="Detalle del contratista"
        titulo={abierto?.c.razon}
        chips={abierto && (<><ChipFolio folio={abierto.c.folio} /><Estatus c={abierto.c} /><Repse c={abierto.c} /></>)}
        acciones={abierto && <BotonIcono titulo="Eliminar contratista" icono={<Trash2 />} peligro onClick={() => setBorrar([abierto.c])} />}
      >
        {abierto && (
          <TarjetaPanel>
            <Datos>
              <Dato nombre="RFC"><CopiarRfc rfc={abierto.c.rfc} /></Dato>
              <Dato nombre="REPSE">{abierto.c.repse === "Sin REPSE" ? undefined : `Vence ${abierto.c.vence}`}</Dato>
              <Dato nombre="Contratos">{abierto.c.contratos}</Dato>
              <Dato nombre="Cumplimiento">{abierto.c.cumplimiento}%</Dato>
              <Dato nombre="Representante">{abierto.c.representante}</Dato>
            </Datos>
          </TarjetaPanel>
        )}
      </PanelDetalle>

      <ModalConfirmar
        abierto={!!borrar}
        onCancelar={() => setBorrar(null)}
        onConfirmar={() => {
          const ids = new Set(borrar?.map((c) => c.id));
          setFilas((f) => f.filter((c) => !ids.has(c.id)));
          tabla.setRowSelection((s) => Object.fromEntries(Object.entries(s).filter(([k]) => !ids.has(k))));
          if (abierto && ids.has(abierto.c.id)) setAbierto(null);
          avisar(ids.size === 1 ? "Se eliminó el contratista" : `Se eliminaron ${ids.size} contratistas`);
          setBorrar(null);
        }}
        titulo={borrar?.length === 1 ? "¿Eliminar contratista?" : `¿Eliminar ${borrar?.length ?? 0} contratistas?`}
        descripcion="Esta acción no se puede deshacer. Sus contratos, empleados y activos quedarán sin contratista."
        elemento={borrar?.length === 1 ? `${borrar[0].razon} · ${borrar[0].rfc}` : undefined}
        etiqueta="Eliminar"
        peligro
      />
    </div>
  );
}
