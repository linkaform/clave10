"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowUpRight, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResizableLogSheet } from "@/components/ScriptLogs/ResizableLogSheet";
import { CopyableId } from "@/components/ScriptLogs/CopyableId";
import { DetailField, DetailPanelHeader, DetailSection, DetailTabs } from "@/components/common/DetailPanel";
import { NO_IMAGE, PANEL_KEEP_OPEN_SELECTOR, SlideCarousel, toSlides } from "@/components/common/SlideCarousel";
import { PanelBadge, PanelBadges } from "@/components/Bitacoras/PhotoGrid/RecordPanel";
import { PhotoRecord } from "@/types/bitacoras";

type Tab = "generales" | "checklist" | "incidencias";

interface Props {
  record: PhotoRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  badges?: PanelBadge[];
}

// Panel lateral de un check de area (pestaña "Check de Áreas" de Rondines).
export function CheckAreaPanel({ record, open, onOpenChange, badges = [] }: Props) {
  return (
    <ResizableLogSheet
      open={open && !!record}
      onOpenChange={onOpenChange}
      title="Detalle del check de área"
      keepOpenSelector={PANEL_KEEP_OPEN_SELECTOR}
    >
      {record && <CheckAreaContent key={record.id} record={record} badges={badges} />}
    </ResizableLogSheet>
  );
}

function CheckAreaContent({ record, badges }: { record: PhotoRecord; badges: PanelBadge[] }) {
  const [tab, setTab] = useState<Tab>("generales");
  const [slideIndex, setSlideIndex] = useState(0);

  const raw = (record as any).rawData ?? {};
  const rondin = raw.rondin ?? {};
  const incidencias: any[] = raw.grupo_incidencias_check ?? [];
  const checks: any[] = raw.checks_data ?? [];
  const fechaInspeccion = raw.fecha_inspeccion_area;

  return (
    <div className="flex flex-col h-full">
      <DetailPanelHeader
        title={record.title}
        subtitle={record.description}
        ids={record.id ? <CopyableId id={record.id} /> : null}
        badges={<PanelBadges statusLabel={record.statusLabel} badges={badges} />}
        actions={
          rondin.id && (
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" asChild>
              <a
                href={`/dashboard/rondines?tab=rondines&folio=${encodeURIComponent(rondin.folio)}&id=${rondin.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Ir al rondín <ArrowUpRight size={14} className="ml-1" />
              </a>
            </Button>
          )
        }
      />

      <div className="flex-1 overflow-auto p-4 space-y-4 bg-slate-100">
        <DetailSection title="Evidencia">
          <SlideCarousel
            slides={toSlides(record.images ?? [])}
            index={slideIndex}
            onIndexChange={setSlideIndex}
            caption={fechaInspeccion}
          />
        </DetailSection>

        <section className="rounded-md border border-slate-200 bg-white p-4 space-y-3">
          <DetailTabs
            tabs={[
              { key: "generales", label: "Generales" },
              { key: "checklist", label: "Checklist", count: checks.length },
              { key: "incidencias", label: "Incidencias", count: incidencias.length },
            ]}
            value={tab}
            onChange={setTab}
          />
          {tab === "generales" && (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <DetailField label="Ubicación" value={raw.incidente_location?.[0] || rondin.ubicacion} />
              <DetailField label="Rondín" value={rondin.nombre_recorrido} />
              <DetailField label="Realizado por" value={rondin.asignado_a} />
              <DetailField label="Fecha de inspección" value={fechaInspeccion} />
              <DetailField label="Estatus del check" value={raw.check_status?.replace(/_/g, " ")} />
              <DetailField label="Comentarios" value={raw.comentario_check_area} className="sm:col-span-2" />
            </dl>
          )}
          {tab === "checklist" && (
            <List empty="Sin checklist registrado" items={checks} render={(check, i) => <CheckItem key={i} check={check} />} />
          )}
          {tab === "incidencias" && (
            <List empty="Sin incidencias registradas" items={incidencias} render={(inc, i) => <IncidenciaItem key={i} inc={inc} />} />
          )}
        </section>
      </div>
    </div>
  );
}

function List({
  items,
  empty,
  render,
}: {
  items: any[];
  empty: string;
  render: (item: any, index: number) => React.ReactNode;
}) {
  if (items.length === 0) return <p className="text-sm text-slate-400 italic text-center py-6">{empty}</p>;
  return <div className="space-y-2">{items.map(render)}</div>;
}

function Thumb({ src, alt }: { src?: string; alt: string }) {
  return (
    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-slate-200 relative">
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          onError={(e) => ((e.target as HTMLImageElement).src = NO_IMAGE)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Camera className="w-4 h-4 text-slate-300" />
        </div>
      )}
    </div>
  );
}

function CheckItem({ check }: { check: any }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
      <Thumb src={check.evidencias_check?.[0]?.file_url} alt="Check" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800 leading-tight">{check.comentarios_check || "Sin comentarios"}</p>
        {check.fecha_check && <p className="text-xs text-slate-400 mt-0.5">{check.fecha_check}</p>}
      </div>
    </div>
  );
}

function IncidenciaItem({ inc }: { inc: any }) {
  const nombre = inc.incidencia || inc.incidente_open || "Sin incidente";
  const comentario = inc.comentario_incidente_bitacora;
  const accion = inc.incidente_accion;
  return (
    <div className="rounded-xl border border-slate-100 overflow-hidden">
      <div className="flex items-start gap-3 p-3">
        <Thumb src={inc.incidente_evidencia?.[0]?.file_url || NO_IMAGE} alt={nombre} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800 leading-tight">{nombre}</p>
          <div className="flex gap-1.5 mt-1 flex-wrap">
            {inc.categoria && (
              <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                {inc.categoria}
              </span>
            )}
            {(inc.sub_categoria || inc.subcategoria) && (
              <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-500">
                {inc.sub_categoria || inc.subcategoria}
              </span>
            )}
          </div>
        </div>
      </div>
      {comentario && (
        <div className="bg-slate-50 border-t border-slate-100 px-3 py-2">
          <p className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">Comentario</p>
          <p className="text-xs text-slate-600">{comentario}</p>
        </div>
      )}
      {accion && (
        <div className="bg-green-50 border-t border-green-100 px-3 py-2">
          <p className="text-[10px] font-bold uppercase text-green-600 mb-0.5">Acción tomada</p>
          <p className="text-xs text-green-700">{accion}</p>
        </div>
      )}
    </div>
  );
}
