"use client";
// ME-12 · Nuevo contrato: documento firmado con IA, datos, servicios con sus
// documentos, recurrencia (F0-14), recursos, ubicaciones, confirmar y guardar.
// Ficha: lkf-claude, contratistas_me12_nuevo_contrato.md. Diseño:
// registro-contrato/nuevo-contrato.dc.html, verNuevo (87–430) y valsNuevo (~3965).
// Datos: create_contrato (ME-14); recursos de Configuración (CF-02); lectura F0-11.
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, CloudUpload, FileText, Loader2, Sparkles, X } from "lucide-react";
import { AreaTexto, Boton, Campo, Entrada, Interruptor, avisar } from "@/components/contratistas/ui";
import { RecurrenciaContrato, erroresContrato } from "@/components/contratistas/vigencia";
import { BASE, desdeSeguro } from "@/lib/contratistas/contexto";
import { cn } from "@/lib/utils";
import {
  createContrato, listCentrosTrabajo, listRecursos, listRelaciones, listRequerimientos,
} from "@/services/contratistas";
import { analizarDocumento, subirArchivo } from "@/services/contratistas/analisis";
import type { Id, RelacionFila, TipoRecurso, TipoRequerimiento } from "@/types/contratistas";
import { ModalConfirmarContrato } from "./ModalConfirmarContrato";
import { RecursosContrato } from "./RecursosContrato";
import {
  aplicarLectura, contratoInput, contratoNuevo, equipoIncompleto, erroresDatos, fmtMontoCaptura, perfilIncompleto,
  type CampoDato, type Catalogos, type DatosContrato, type NuevoContratoEd,
} from "./nuevoContrato";
import { ChipQuitable, ComboBuscar, MarcaIA, Resumen, Tarjeta } from "./piezasNuevo";

const MAX_MB = 20;
const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

const useRecursos = (tipo: TipoRecurso) =>
  useQuery({
    queryKey: ["contratistas", "recursos", tipo, "activos"],
    queryFn: () => listRecursos(tipo, { estatus: "Activo", limit: 200 }),
    select: (p) => p.items.filter((r) => r.estatus === "Activo"),
  });

export function NuevoContrato() {
  const router = useRouter();
  const qc = useQueryClient();
  const desde = desdeSeguro(useSearchParams().get("desde"));
  const origen = desde.startsWith(`${BASE}/contratistas`) ? "Contratistas" : "Mi empresa";

  const [ed, setEd] = useState<NuevoContratoEd>(contratoNuevo);
  const [intento, setIntento] = useState(false);
  const [pestanaRec, setPestanaRec] = useState<"perfiles" | "equipos">("perfiles");
  const [confirmar, setConfirmar] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Contraparte: una relación aceptada de la red (propuesta por defecto de Negocio).
  const qRel = useQuery({
    queryKey: ["contratistas", "relaciones", "contratistas", "Activo"],
    queryFn: () => listRelaciones("contratistas", { estatus: "Activo", limit: 200 }),
  });
  const relaciones = useMemo(() => qRel.data?.items ?? [], [qRel.data]);
  const servicios = useRecursos("Servicio");
  const perfiles = useRecursos("Perfil");
  const equipos = useRecursos("Equipo");
  const qReqs = useQuery({ queryKey: ["contratistas", "requerimientos", "todos"], queryFn: () => listRequerimientos({ limit: 500 }) });
  const qCentros = useQuery({ queryKey: ["contratistas", "centros-trabajo"], queryFn: listCentrosTrabajo });

  const cat: Catalogos = { servicios: servicios.data ?? [], perfiles: perfiles.data ?? [], equipos: equipos.data ?? [] };
  const tipos = useMemo(
    () => new Map<Id, TipoRequerimiento>((qReqs.data?.items ?? []).map((r) => [r.id, r.tipo])),
    [qReqs.data],
  );

  const errDatos = intento ? erroresDatos(ed.datos) : {};
  const setDato = <K extends CampoDato>(k: K, v: DatosContrato[K]) =>
    setEd((x) => ({ ...x, datos: { ...x.datos, [k]: v }, ia: x.ia.filter((c) => c !== k) }));

  const guardar = () => {
    setIntento(true);
    const datosMal = Object.keys(erroresDatos(ed.datos)).length > 0;
    const recMal = Object.keys(erroresContrato(ed.recurrencia)).length > 0;
    const perfMal = ed.perfiles.some(perfilIncompleto);
    const eqMal = ed.equipos.some(equipoIncompleto);
    if (datosMal) return avisar("Completa los datos del contrato", "error");
    if (recMal) return avisar("Revisa la recurrencia", "error");
    if (perfMal || eqMal) {
      if (!(pestanaRec === "perfiles" ? perfMal : eqMal)) setPestanaRec(perfMal ? "perfiles" : "equipos");
      return avisar("Completa los recursos asignados", "error");
    }
    setConfirmar(true);
  };

  const confirmarGuardar = async () => {
    setGuardando(true);
    try {
      const c = await createContrato(contratoInput(ed, cat));
      await qc.invalidateQueries({ queryKey: ["contratistas", "contratos"] });
      avisar(`Se guardó el contrato ${c.folio}`);
      router.push(desde);
    } catch (x) {
      avisar(x instanceof Error ? x.message : "No se pudo guardar el contrato", "error");
      setGuardando(false);
    }
  };

  const servSel = ed.servicios.map((id) => cat.servicios.find((s) => s.id === id)).filter((s) => !!s);
  const nDocs = servSel.reduce((n, s) => n + s.requerimientos.length, 0);
  const resumenServicios = servSel.length
    ? `${plural(servSel.length, "servicio", "servicios")} · ${plural(nDocs, "documento requerido", "documentos requeridos")}`
    : "Ningún servicio agregado";

  return (
    <div data-c10-acc="propio" className="min-h-[calc(100vh-var(--c10-header-h,65px))] bg-c10-canvas font-[Arial,Helvetica,sans-serif]">
      <main className="mx-auto flex w-full max-w-[1600px] flex-col px-4 pb-20 pt-6 min-[1080px]:px-5">
        <nav aria-label="Migas" className="flex items-center gap-1.5 text-[13px] text-c10-meta">
          <Link href={desde} className="font-medium hover:text-c10-acc">{origen}</Link>
          <ChevronRight className="size-3.5 text-c10-faint" aria-hidden />
          <Link href={desde} className="font-medium hover:text-c10-acc">Contratos</Link>
          <ChevronRight className="size-3.5 text-c10-faint" aria-hidden />
          <span className="font-bold text-c10-title">Nuevo contrato</span>
        </nav>
        <div className="flex items-center gap-4 pt-5">
          <Link
            href={desde} title="Volver a contratos" aria-label="Volver a contratos"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-c10-surface text-c10-secondary ring-1 ring-c10-line hover:text-c10-title"
          >
            <ChevronLeft className="size-4" />
          </Link>
          <h1 className="m-0 text-2xl font-bold tracking-[-0.02em] text-c10-title">Contratos</h1>
        </div>

        <div className="mx-auto flex w-full max-w-[820px] flex-col gap-5 pt-6">
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-xl font-bold tracking-[-0.02em] text-c10-title">Nuevo contrato</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-c10-acc-l px-3 py-1 text-xs font-semibold text-c10-acc-h ring-1 ring-blue-200">
              Folio de registro <span className="font-normal">· se asigna al guardar</span>
            </span>
          </div>

          <Tarjeta n={1} titulo="Documento físico firmado">
            <DocumentoFirmado ed={ed} setEd={setEd} relaciones={relaciones} />
          </Tarjeta>

          <Tarjeta
            n={2} titulo="Datos del contrato"
            extra={<span className="ml-auto text-xs text-c10-meta">{ed.ia.length ? "Precargados por IA · editables" : "Puedes capturarlos manualmente"}</span>}
          >
            <DatosGenerales ed={ed} setDato={setDato} err={errDatos} relaciones={relaciones} cargandoRel={qRel.isLoading} />
            <div className="flex items-center gap-3 rounded-[10px] bg-c10-panel px-4 py-3.5 ring-1 ring-c10-line">
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-sm font-semibold text-c10-title">Permite subcontratación</span>
                <span className="text-xs text-c10-meta [text-wrap:pretty]">Si se activa, el contratista podrá registrar subcontratistas en este contrato.</span>
              </span>
              <Interruptor valor={ed.subcontratacion} onCambio={(subcontratacion) => setEd((x) => ({ ...x, subcontratacion }))} etiqueta="Permite subcontratación" />
            </div>
          </Tarjeta>

          <Tarjeta n={3} titulo="Servicios contratados" extra={<span className="ml-auto text-xs text-c10-meta">{resumenServicios}</span>}>
            <Campo etiqueta="Servicios especializados">
              <ComboBuscar
                etiqueta="Buscar servicio" placeholder="Buscar servicio..."
                opciones={cat.servicios.filter((s) => !ed.servicios.includes(s.id))
                  .map((s) => ({ id: s.id, nombre: s.nombre, extra: plural(s.requerimientos.length, "documento", "documentos") }))}
                onCambio={(id) => setEd((x) => ({ ...x, servicios: [...x.servicios, id] }))}
              />
            </Campo>
            {!!servSel.length && (
              <div className="flex flex-wrap gap-2">
                {servSel.map((s) => (
                  <ChipQuitable
                    key={s.id} texto={s.nombre} n={s.requerimientos.length} etiquetaQuitar="Quitar servicio"
                    titulo={s.requerimientos.map((r) => r.nombre).join("\n") || "Sin documentos requeridos"}
                    onQuitar={() => setEd((x) => ({ ...x, servicios: x.servicios.filter((i) => i !== s.id) }))}
                  />
                ))}
              </div>
            )}
            <Resumen fuerte={resumenServicios} texto="Pasa el cursor sobre un servicio para ver sus documentos." />
          </Tarjeta>

          <Tarjeta
            n={4} titulo="Recurrencia"
            extra={<span className="rounded-full bg-c10-sunken px-2.5 py-0.5 text-xs font-semibold text-c10-meta ring-1 ring-c10-line">Opcional</span>}
          >
            <RecurrenciaContrato
              valor={ed.recurrencia} onCambio={(recurrencia) => setEd((x) => ({ ...x, recurrencia }))}
              inicio={ed.datos.inicio || undefined} intento={intento}
            />
          </Tarjeta>

          <Tarjeta n={5} titulo="Recursos asignados">
            <RecursosContrato
              perfiles={ed.perfiles} equipos={ed.equipos}
              onPerfiles={(perfiles) => setEd((x) => ({ ...x, perfiles }))} onEquipos={(equipos) => setEd((x) => ({ ...x, equipos }))}
              catPerfiles={cat.perfiles} catEquipos={cat.equipos} tipos={tipos} intento={intento}
              pestana={pestanaRec} onPestana={setPestanaRec}
            />
          </Tarjeta>

          <Tarjeta n={6} titulo="Ubicaciones de trabajo">
            <Campo etiqueta="Centros de trabajo">
              <ComboBuscar
                etiqueta="Buscar centro de trabajo" placeholder={qCentros.isError ? "No se pudieron cargar los centros" : "Buscar centro de trabajo..."}
                opciones={(qCentros.data ?? []).filter((u) => !ed.ubicaciones.some((s) => s.id === u.id))}
                onCambio={(id) => {
                  const u = qCentros.data?.find((c) => c.id === id);
                  if (u) setEd((x) => ({ ...x, ubicaciones: [...x.ubicaciones, u] }));
                }}
              />
            </Campo>
            {!!ed.ubicaciones.length && (
              <div className="flex flex-wrap gap-2">
                {ed.ubicaciones.map((u) => (
                  <ChipQuitable
                    key={u.id} texto={u.nombre} etiquetaQuitar="Quitar centro de trabajo"
                    onQuitar={() => setEd((x) => ({ ...x, ubicaciones: x.ubicaciones.filter((s) => s.id !== u.id) }))}
                  />
                ))}
              </div>
            )}
            <Resumen
              fuerte={ed.ubicaciones.length ? plural(ed.ubicaciones.length, "centro de trabajo", "centros de trabajo") : "Ninguno seleccionado"}
              texto="Selecciona los centros donde se ejecutará el contrato."
            />
          </Tarjeta>

          <div className="flex items-center justify-end gap-3 pt-1">
            <Boton variante="cancelar" flex className="max-w-[220px]" onClick={() => router.push(desde)}>Cancelar</Boton>
            <Boton flex className="max-w-[220px]" onClick={guardar}>Guardar Contrato</Boton>
          </div>
        </div>
      </main>

      {confirmar && (
        <ModalConfirmarContrato
          ed={ed} cat={cat} relacion={relaciones.find((r) => r.id === ed.datos.relacion)} guardando={guardando}
          onCerrar={() => setConfirmar(false)} onConfirmar={confirmarGuardar}
        />
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- 1 · Documento */

type FaseIA = { fase: "subiendo"; pct: number } | { fase: "leyendo" } | { fase: "listo" } | { fase: "falla"; msg: string };

function DocumentoFirmado({ ed, setEd, relaciones }: {
  ed: NuevoContratoEd;
  setEd: React.Dispatch<React.SetStateAction<NuevoContratoEd>>;
  relaciones: RelacionFila[];
}) {
  const input = useRef<HTMLInputElement>(null);
  const abort = useRef<AbortController | null>(null);
  const [ia, setIA] = useState<FaseIA | null>(null);
  const [arrastrando, setArrastrando] = useState(false);
  useEffect(() => () => abort.current?.abort(), []);

  const cargar = async (file?: File) => {
    if (!file) return;
    if (!/\.(pdf|jpe?g|png)$/i.test(file.name)) return avisar("Sube un archivo PDF, JPG o PNG", "error");
    if (file.size > MAX_MB * 1024 * 1024) return avisar(`El archivo pesa más de ${MAX_MB} MB`, "error");
    abort.current?.abort();
    const ctl = new AbortController();
    abort.current = ctl;
    setIA({ fase: "subiendo", pct: 0 });
    try {
      const archivo = await subirArchivo(file, (pct) => setIA({ fase: "subiendo", pct }), ctl.signal);
      setEd((x) => ({ ...x, archivo }));
      setIA({ fase: "leyendo" });
      const a = await analizarDocumento(archivo, {}, ctl.signal);
      if (!a.legible) return setIA({ fase: "falla", msg: a.alertas[0]?.detalle ?? "No pudimos leer el documento. Captura los datos manualmente." });
      setEd((x) => aplicarLectura(x, a, relaciones));
      setIA({ fase: "listo" });
    } catch (x) {
      if (x instanceof DOMException && x.name === "AbortError") return;
      setIA({ fase: "falla", msg: x instanceof Error ? x.message : "No se pudo procesar el archivo" });
    }
  };

  const quitar = () => {
    abort.current?.abort();
    setIA(null);
    // Como en el diseño (nQuitar): se va el archivo y las marcas IA; los datos se quedan.
    setEd((x) => ({ ...x, archivo: null, ia: [] }));
  };

  const ocupado = ia?.fase === "subiendo" || ia?.fase === "leyendo";
  const estado =
    ia?.fase === "subiendo" ? `Subiendo… ${ia.pct}%`
      : ia?.fase === "leyendo" ? "Extrayendo datos con IA..."
        : ia?.fase === "falla" ? ia.msg
          : ia?.fase === "listo" ? (ed.ia.length ? "Datos extraídos y precargados en el formulario" : "No encontramos datos nuevos; captúralos manualmente")
            : "Documento adjunto";

  if (ed.archivo || ocupado) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-c10-acc-l px-4 py-3.5 ring-1 ring-blue-200">
        <span className="flex size-[38px] shrink-0 items-center justify-center rounded-[10px] bg-blue-100 text-c10-acc [&_svg]:size-[18px]" aria-hidden>
          {ocupado ? <Loader2 className="animate-spin" /> : <FileText />}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-bold text-c10-title">{ed.archivo?.name ?? "Subiendo…"}</span>
          <span className={cn("text-xs", ia?.fase === "falla" ? "text-red-600" : "text-blue-700")} aria-live="polite">{estado}</span>
        </span>
        <button
          type="button" onClick={quitar} title="Quitar documento" aria-label="Quitar documento"
          className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-c10-surface text-c10-meta transition-colors hover:bg-red-100 hover:text-red-600 [&_svg]:size-4"
        >
          <X />
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        type="button" onClick={() => input.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => { e.preventDefault(); setArrastrando(false); cargar(e.dataTransfer.files[0]); }}
        className={cn(
          "flex flex-col items-center gap-2 rounded-xl border border-dashed px-5 py-[34px] text-center transition-colors hover:border-c10-acc hover:bg-c10-acc-l",
          arrastrando ? "border-c10-acc bg-c10-acc-l" : "border-slate-300 bg-c10-panel",
        )}
      >
        <CloudUpload className="size-[34px] text-c10-faint" aria-hidden />
        <span className="text-sm font-medium text-c10-label">Arrastra o haz clic para subir el documento firmado</span>
        <span className="text-xs text-c10-faint">PDF, JPG o PNG · máx. {MAX_MB} MB</span>
        <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-c10-acc-l px-3 py-1 text-xs font-semibold text-c10-acc-h ring-1 ring-blue-200">
          <Sparkles className="size-3.5" aria-hidden />La IA extraerá automáticamente los datos del contrato
        </span>
      </button>
      <input
        ref={input} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
        onChange={(e) => { cargar(e.target.files?.[0]); e.target.value = ""; }}
      />
    </>
  );
}

/* ---------------------------------------------------------------- 2 · Datos */

function DatosGenerales({ ed, setDato, err, relaciones, cargandoRel }: {
  ed: NuevoContratoEd;
  setDato: <K extends CampoDato>(k: K, v: DatosContrato[K]) => void;
  err: Partial<Record<CampoDato, string>>;
  relaciones: RelacionFila[];
  cargandoRel: boolean;
}) {
  const d = ed.datos;
  const marca = (k: CampoDato) => (ed.ia.includes(k) ? <MarcaIA /> : undefined);
  const texto = (k: "numero_contrato" | "objeto", etiqueta: string, placeholder: string) => (
    <Campo etiqueta={etiqueta} obligatorio error={err[k]} extra={marca(k)} className="flex-[1_1_200px]">
      <Entrada value={d[k]} placeholder={placeholder} onChange={(e) => setDato(k, e.target.value)} />
    </Campo>
  );
  const fecha = (k: "inicio" | "fin", etiqueta: string) => (
    <Campo etiqueta={etiqueta} obligatorio error={err[k]} extra={marca(k)} className="flex-[1_1_200px]">
      <Entrada type="date" value={d[k]} min={k === "fin" ? d.inicio || undefined : undefined} onChange={(e) => setDato(k, e.target.value)} />
    </Campo>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4">
        {texto("numero_contrato", "Folio del contrato", "Folio impreso en el documento firmado")}
        {texto("objeto", "Objeto del contrato", "Servicio contratado")}
      </div>
      <Campo etiqueta="Descripción del contrato" obligatorio error={err.descripcion} extra={marca("descripcion")}>
        <AreaTexto value={d.descripcion} placeholder="Alcance y condiciones del servicio" onChange={(e) => setDato("descripcion", e.target.value)} />
      </Campo>
      <div className="flex flex-wrap gap-4">
        <Campo
          etiqueta="Contratista" obligatorio error={err.relacion} extra={marca("relacion")} className="flex-[1_1_200px]"
          ayuda={!cargandoRel && !relaciones.length ? "Primero invita al contratista y espera a que acepte la relación." : undefined}
        >
          <ComboBuscar
            etiqueta="Contratista" placeholder={cargandoRel ? "Cargando…" : "Busca un contratista de tu red"} invalido={!!err.relacion}
            opciones={relaciones.map((r) => ({ id: r.id, nombre: r.contraparte.razon_social, extra: r.contraparte.rfc }))}
            valor={d.relacion} onCambio={(id) => setDato("relacion", id)}
          />
        </Campo>
        <Campo etiqueta="Monto total" obligatorio error={err.monto} extra={marca("monto")} className="flex-[1_1_200px]">
          <div className="relative flex items-center">
            <span className="pointer-events-none absolute left-3 text-sm font-semibold text-c10-faint">$</span>
            <Entrada
              inputMode="decimal" value={d.monto} placeholder="0.00" className="pl-[26px] pr-[58px]"
              onChange={(e) => setDato("monto", e.target.value.replace(/[^\d.,]/g, ""))}
              onBlur={() => {
                const f = fmtMontoCaptura(d.monto);
                if (f !== d.monto) setDato("monto", f);
              }}
            />
            <span className="pointer-events-none absolute right-2.5 rounded-full bg-c10-sunken px-2 py-0.5 text-[11px] font-bold tracking-[.03em] text-c10-label">MXN</span>
          </div>
        </Campo>
      </div>
      <div className="flex flex-wrap gap-4">
        {fecha("inicio", "Fecha de inicio")}
        {fecha("fin", "Fecha fin")}
      </div>
    </div>
  );
}
