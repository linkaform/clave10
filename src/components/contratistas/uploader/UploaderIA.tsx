"use client";
// F0-10 · Uploader con IA (individual). Estilos con los tokens de
// contratistas_ui_spec.md; los botones/modales pasan a los primitivos de F0-05
// cuando existan (día 2). La pantalla consumidora pone el <input type=file>,
// el botón flotante o el drag&drop y llama `ref.abrir(file)`.
import { forwardRef, useImperativeHandle, useState } from "react";
import { toast } from "sonner";
import { AlertCircle, Check, FileText, Info, Layers, Loader2, Sparkles, TriangleAlert, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useUploaderIA } from "@/hooks/Contratistas/useUploaderIA";
import { abrirVisor } from "@/lib/contratistas/visor";
import type { DocumentoExistente, OpcionCombo, ResultadoUploader } from "@/types/contratistas/uploader";
import { ComboConfianza } from "./ComboConfianza";

export interface UploaderIAProps {
  existentes: DocumentoExistente[];
  opcionesMapeo: OpcionCombo[];
  opcionesPropietario: OpcionCombo[];
  /** Preseleccionados cuando se sube desde una fila (ME-11, ME-07, ME-04). */
  requerimientoId?: string;
  propietarioId?: string;
  /** Oculta Mapeo (Cumplimiento por empleado, edición de documento). */
  sinMapeo?: boolean;
  onSubmit: (r: ResultadoUploader) => Promise<void>;
}
export interface UploaderIAHandle { abrir: (file: File) => void }

const btn = "h-10 flex-1 rounded-lg text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50";
const btnCancel = `${btn} bg-[#F1F5F9] font-medium text-[#334155] hover:bg-[#E2E8F0]`;
const btnPrim = `${btn} bg-[var(--c10-acc,#2F80ED)] font-semibold text-white hover:bg-[var(--c10-acc-h,#1E6FDB)]`;
const chip = "inline-flex h-[22px] items-center gap-1 rounded-full px-[9px] text-[11px] font-semibold whitespace-nowrap";

export const UploaderIA = forwardRef<UploaderIAHandle, UploaderIAProps>(function UploaderIA(p, ref) {
  const { estado: s, acciones: a, valido, nombreRepetido, reemplazaFolio } = useUploaderIA({
    existentes: p.existentes, requerimiento_id: p.requerimientoId, propietario_id: p.propietarioId,
  });
  const [guardando, setGuardando] = useState(false);
  useImperativeHandle(ref, () => ({ abrir: a.abrir }), [a.abrir]);

  if (!s.fase) return null;
  const ilegible = s.analisis?.legible === false;

  const subir = async () => {
    if (!valido) return a.set({ intento: true });
    setGuardando(true);
    const comentarios = [
      ...(ilegible || !s.analisis ? ["Datos capturados manualmente: el archivo no se pudo leer."] : []),
      ...(s.comentario.trim() ? [s.comentario.trim()] : []),
    ];
    try {
      await p.onSubmit({
        archivo: s.archivo!, nombre: s.nombre.trim(), requerimiento_id: s.mapeoId, propietario_id: s.propietarioId,
        comentarios, reemplaza_id: reemplazaFolio ? s.duplicado!.id : undefined, analisis: s.analisis,
        mapeo_manual: s.mapeoManual, propietario_manual: s.propietarioManual,
      });
      toast.success(reemplazaFolio ? `Se guardó como nueva versión de «${s.duplicado!.nombre}»` : "Se subió el documento para revisión");
      a.cancelar();
    } catch (e) {
      toast.error(`No se pudo subir el documento: ${(e as Error).message}`);
    } finally { setGuardando(false); }
  };

  /* ---------- 1. El archivo ya existe ---------- */
  if (s.fase === "pregunta") {
    const opt = (id: "reemplazar" | "conservar", t: string, d: string) => (
      <button role="radio" aria-checked={s.eleccion === id} onClick={() => a.set({ eleccion: id })}
        className={`flex w-full gap-3 rounded-xl border p-3 text-left ${s.eleccion === id ? "border-[var(--c10-acc,#2F80ED)] bg-[var(--c10-acc-s,#EFF6FF)]" : "border-[#E2E8F0] bg-white"}`}>
        <span className={`mt-0.5 size-4 shrink-0 rounded-full ${s.eleccion === id ? "shadow-[inset_0_0_0_5px_var(--c10-acc,#2F80ED)]" : "shadow-[inset_0_0_0_1.5px_#CBD5E1]"}`} />
        <span className="flex flex-col"><span className="text-sm font-semibold text-[#0F172A]">{t}</span><span className="text-[13px] text-[#64748B]">{d}</span></span>
      </button>
    );
    return (
      <Dialog open onOpenChange={(o) => !o && a.cancelar()}>
        <DialogContent className="max-w-[480px] gap-4 rounded-2xl p-6">
          <DialogTitle className="text-xl font-semibold tracking-[-0.02em]">El archivo ya existe</DialogTitle>
          <p className="text-sm text-[#475569]">
            El archivo «<b>{s.file!.name}</b>» ya existe en esta ubicación. ¿Deseas reemplazar el archivo existente por la nueva versión o conservar ambos archivos?
          </p>
          <div role="radiogroup" className="flex flex-col gap-2">
            {opt("reemplazar", "Reemplazar el archivo existente", "Se guarda como nueva versión; las anteriores quedan en el historial.")}
            {opt("conservar", "Conservar ambos archivos", "Se crea un documento nuevo e independiente.")}
          </div>
          <div className="flex gap-3"><button className={btnCancel} onClick={a.cancelar}>Cancelar</button><button className={btnPrim} onClick={a.confirmarDuplicado}>Subir</button></div>
        </DialogContent>
      </Dialog>
    );
  }

  /* ---------- 2. Progreso: subiendo / analizando / listo / falla ---------- */
  if (s.fase !== "revision" && s.fase !== "guardando") {
    const titulo = { subiendo: reemplazaFolio ? "Subiendo nueva versión" : "Subiendo documento", analizando: "Analizando con IA", listo: "Análisis completo", falla: s.error ? "No se pudo subir el documento" : "No se pudo leer el documento" }[s.fase];
    const sub = { subiendo: "No cierres esta ventana", analizando: "Extrayendo y validando los datos del documento", listo: "Abriendo la revisión de datos…", falla: s.error ? s.error : "Podrás capturar los datos manualmente…" }[s.fase];
    return (
      <Dialog open onOpenChange={() => {}}>
        <DialogContent
          onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}
          className="max-w-[420px] justify-items-center [&>button:last-child]:hidden gap-4 rounded-2xl p-6 text-center">
          <Indicador fase={s.fase} pct={s.pct} />
          <div><DialogTitle className="text-lg font-semibold">{titulo}</DialogTitle><p className="text-[13px] text-[#64748B]">{sub}</p></div>
          {s.fase === "analizando" && (
            <ul className="flex flex-col gap-1 text-left text-[13px] text-[#475569]">
              {["Identificando documento", "Extrayendo datos con OCR", "Validando contra el expediente"].map((t, i) => (
                <li key={t} className="flex items-center gap-2 animate-in fade-in" style={{ animationDelay: `${i * 600}ms` }}><Check className="size-3.5 text-[var(--c10-acc,#2F80ED)]" />{t}</li>
              ))}
            </ul>
          )}
          <span className="inline-flex max-w-full items-center gap-2 rounded-lg bg-[#F1F5F9] px-3 py-1.5 text-[13px]" title={s.file!.name}>
            <FileText className="size-4 shrink-0 text-[#64748B]" /><span className="truncate">{s.file!.name}</span>
          </span>
          {(s.fase === "subiendo" || s.fase === "analizando") && <button className={btnCancel + " w-full flex-none"} onClick={a.cancelar}>Cancelar</button>}
          {/* NUEVO (no está dibujado en el diseño): reintento tras la falla */}
          {s.fase === "falla" && (
            <div className="flex w-full gap-3">
              <button className={btnCancel} onClick={a.reintentar}>Reintentar</button>
              <button className={btnPrim} onClick={a.capturarManual} disabled={!s.archivo}>Capturar Manualmente</button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  /* ---------- 3. Revisión de datos ---------- */
  const an = s.analisis;
  const nomErr = nombreRepetido || (s.intento && !s.nombre.trim());
  return (
    <Dialog open onOpenChange={(o) => !o && a.cancelar()}>
      <DialogContent className="max-w-[560px] gap-4 rounded-2xl p-6">
        <DialogTitle className="text-xl font-semibold tracking-[-0.02em]">Subir documento</DialogTitle>

        <div className="flex flex-wrap items-center gap-2">
          <span className={`${chip} ${ilegible ? "bg-[#FEE2E2] text-[#DC2626]" : "bg-[var(--c10-acc-l,#DBEAFE)] text-[var(--c10-acc-h,#1E6FDB)]"}`}>
            {ilegible ? <AlertCircle className="size-3" /> : <Sparkles className="size-3" />}
            {ilegible ? "No se pudo identificar el documento" : <>Identificado como <b>{an?.tipo}</b></>}
          </span>
          {/* NUEVO: confianza global (dupConf, calculada en el diseño pero no dibujada) */}
          {an && !ilegible && (
            <span className={`${chip} ${an.confianza >= 95 ? "bg-[#DCFCE7] text-[#15803D]" : "bg-[#F3E8FF] text-[#7C3AED]"}`} title="Confianza global de la lectura">
              {an.confianza}% confianza
            </span>
          )}
          {reemplazaFolio && <span className={`${chip} bg-[#F1F5F9] text-[#334155]`}><Layers className="size-3" />Nueva versión de #{reemplazaFolio}</span>}
        </div>

        {/* Visor: "Ver <archivo>" abre el PDF en pestaña nueva */}
        <button onClick={() => abrirVisor(s.archivo!.file_url)} className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2 text-left text-sm hover:border-[var(--c10-acc,#2F80ED)]" title={`Ver ${s.file!.name}`}>
          <FileText className="size-4 text-[var(--c10-acc,#2F80ED)]" /><span className="flex-1 truncate">{s.file!.name}</span><Check className="size-4 text-[#16A34A]" />
        </button>

        {/* NUEVO: inconsistencias (dupAlerts), no dibujadas en el diseño. Pendiente validar ubicación con Paco. */}
        {an?.alertas.filter((x) => !(x.accion?.tipo === "usar_valor" && s.registro === x.accion.valor)).map((al) => (
          <div key={al.titulo} role="alert" className={`flex gap-3 rounded-lg border p-3 ${al.nivel === "error" ? "border-[#FECACA] bg-[#FEF2F2]" : "border-[#FED7AA] bg-[#FFF7ED]"}`}>
            {al.nivel === "error" ? <AlertCircle className="size-4 shrink-0 text-[#DC2626]" /> : <TriangleAlert className="size-4 shrink-0 text-[#EA580C]" />}
            <div className="flex-1 text-[13px]">
              <div className={`font-semibold ${al.nivel === "error" ? "text-[#B91C1C]" : "text-[#C2410C]"}`}>{al.titulo}</div>
              <div className="text-[#475569]">{al.detalle}</div>
              {al.accion && (
                <button className="mt-1 font-semibold text-[var(--c10-acc,#2F80ED)] hover:underline" onClick={() =>
                  al.accion!.tipo === "usar_valor" ? a.set({ registro: al.accion!.valor }) : a.cancelar() /* la pantalla reabre su selector de archivo */}>
                  {al.accion.etiqueta}
                </button>
              )}
            </div>
          </div>
        ))}

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase text-[#334155]">Nombre del documento<span className="text-[#DC2626]">*</span></span>
          <input value={s.nombre} onChange={(e) => a.set({ nombre: e.target.value })} placeholder="Escribe el nombre del documento"
            className={`h-10 rounded-lg border px-3 text-sm outline-none focus:border-[var(--c10-acc,#2F80ED)] focus:shadow-[0_0_0_3px_rgba(59,130,246,.15)] ${nomErr ? "border-[#DC2626]" : "border-[#E5E7EB]"}`} />
          {nomErr && <span role="alert" className="flex items-center gap-1 text-xs text-[#DC2626]"><AlertCircle className="size-3.5" />
            {nombreRepetido ? "Ya existe un documento con este nombre. Usa otro nombre." : "Escribe el nombre del documento."}</span>}
        </label>

        <div className="grid grid-cols-2 gap-3">
          {!p.sinMapeo && (
            <ComboConfianza etiqueta="Mapeo" placeholder="Buscar documento" opciones={p.opcionesMapeo} valor={s.mapeoId}
              confianza={s.mapeoManual ? "Manual" : `${an?.mapeo.confianza ?? 58}%`}
              onChange={(id) => a.set({ mapeoId: id, mapeoManual: true })} />
          )}
          <ComboConfianza etiqueta="Propietario" placeholder="Buscar propietario" opciones={p.opcionesPropietario} valor={s.propietarioId}
            confianza={s.propietarioManual ? "Manual" : `${an?.propietario.confianza ?? 61}%`} error={s.intento && !s.propietarioId}
            onChange={(id) => a.set({ propietarioId: id, propietarioManual: true })} />
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase text-[#334155]">Comentarios</span>
          <textarea value={s.comentario} onChange={(e) => a.set({ comentario: e.target.value })} rows={3}
            placeholder="Escribe un comentario para quien revise el documento"
            className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[var(--c10-acc,#2F80ED)] focus:shadow-[0_0_0_3px_rgba(59,130,246,.15)]" />
        </label>

        <div className="flex w-fit items-center gap-2 rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-2 text-[13px] text-[#1E6FDB]">
          <Info className="size-4 shrink-0" />Revisa el documento y su propietario. Al subirlo queda en Por revisar hasta que Administración lo apruebe.
        </div>

        <div className="flex gap-3">
          <button className={btnCancel} onClick={a.cancelar} disabled={guardando}>Cancelar</button>
          <button className={btnPrim + " inline-flex items-center justify-center gap-2"} onClick={subir} disabled={guardando}>
            {guardando && <Loader2 className="size-4 animate-spin" />}{guardando ? "Subiendo…" : "Subir"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
});

function Indicador({ fase, pct }: { fase: string; pct: number }) {
  if (fase === "subiendo")
    return (
      <span className="relative grid size-16 place-items-center rounded-full" style={{ background: `conic-gradient(var(--c10-acc,#2F80ED) ${pct * 3.6}deg, #E2E8F0 0)` }}>
        <span className="grid size-[52px] place-items-center rounded-full bg-white text-sm font-semibold tabular-nums">{pct}%</span>
      </span>
    );
  if (fase === "analizando") return <span className="grid size-16 place-items-center rounded-full bg-[var(--c10-acc-l,#DBEAFE)]"><Sparkles className="size-7 animate-pulse text-[var(--c10-acc,#2F80ED)]" /></span>;
  if (fase === "listo") return <span className="grid size-16 place-items-center rounded-full bg-[#DCFCE7]"><Check className="size-7 text-[#16A34A]" /></span>;
  return <span className="grid size-16 place-items-center rounded-full bg-[#FEE2E2]"><X className="size-7 text-[#DC2626]" /></span>;
}
