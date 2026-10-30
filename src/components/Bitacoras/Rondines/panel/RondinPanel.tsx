"use client";

import { useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { ChevronRight, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ResizableLogSheet } from "@/components/ScriptLogs/ResizableLogSheet";
import { CopyableId } from "@/components/ScriptLogs/CopyableId";
import { ChipList, DetailField, DetailPanelHeader, DetailSection, DetailTabs } from "@/components/common/DetailPanel";
import { NO_IMAGE, PANEL_KEEP_OPEN_SELECTOR, SlideCarousel, toSlides } from "@/components/common/SlideCarousel";
import { MapItem } from "@/components/table/rondines/recorridos/table";
import {
  AreaDetailPanel,
  ComentarioDetailPanel,
  ComentarioListItem,
  IncidenciaDetailPanel,
  IncidenciaListItem,
} from "./RondinPanelParts";

const MapView = dynamic(() => import("@/components/map-v2"), { ssr: false });

/** Atributo de las acciones que abren el panel: cambiar de rondin no lo cierra. */
export const RONDIN_PANEL_OPENER = "[data-rondin-eye]";
const KEEP_OPEN_SELECTOR = `${RONDIN_PANEL_OPENER},${PANEL_KEEP_OPEN_SELECTOR}`;
const AREAS_PREVIEW = 6;

const ESTATUS_BADGE: Record<string, { label: string; className: string }> = {
  realizado: { label: "Realizado", className: "bg-green-100 text-green-700 border-green-200 hover:bg-green-100" },
  en_proceso: { label: "En proceso", className: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100" },
  programado: { label: "Programado", className: "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100" },
  cancelado: { label: "Cancelado", className: "bg-red-100 text-red-700 border-red-200 hover:bg-red-100" },
};

// Datos fijos del rondin, en el orden en que se muestran (la etiqueta del backend se compara en mayusculas).
const DETAIL_FIELDS = [
  { label: "Ubicación", match: ["UBICACIÓN", "UBICACION"] },
  { label: "Realizado por", match: ["REALIZADO"] },
  { label: "Inicio", match: ["INICIO"] },
  { label: "Finalización", match: ["FINALIZACIÓN", "FINALIZACION"] },
  { label: "Duración", match: ["DURACIÓN", "DURACION"] },
  { label: "Áreas inspeccionadas", match: ["ÁREAS INSPECCIONADAS", "AREAS INSPECCIONADAS"] },
];
// Etiquetas que ya se pintan arriba y no deben repetirse como "extras".
const EXCLUDED_EXTRAS = [...DETAIL_FIELDS.flatMap((f) => f.match), "TIPO", "ÁREA", "AREA"];

const hasValue = (v: unknown) => (Array.isArray(v) ? v.length > 0 : v !== null && v !== undefined && v !== "");
const labelOf = (item: any) => String(item?.label ?? "").toUpperCase();
const asList = (...candidates: unknown[]) => {
  const found = candidates.find((c) => Array.isArray(c) && c.length > 0);
  return (found as any[]) ?? [];
};

interface Props {
  record: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mapData?: MapItem[];
  /** Acciones extra del encabezado (ej. imprimir); recibe el registro si es funcion. */
  action?: React.ReactNode | ((record: any) => React.ReactNode);
}

// Panel lateral con el detalle de una bitacora de rondin. Igual que el de usuarios:
// ResizableLogSheet + DetailPanelHeader + secciones; el contenido se remonta por registro.
export function RondinPanel({ record, open, onOpenChange, mapData, action }: Props) {
  return (
    <ResizableLogSheet
      open={open && !!record}
      onOpenChange={onOpenChange}
      title="Detalle del rondín"
      keepOpenSelector={KEEP_OPEN_SELECTOR}
    >
      {record && (
        <RondinPanelContent
          key={record.id ?? record.folio}
          record={record}
          mapData={mapData ?? []}
          action={typeof action === "function" ? action(record) : action}
        />
      )}
    </ResizableLogSheet>
  );
}

function RondinPanelContent({
  record,
  mapData,
  action,
}: {
  record: any;
  mapData: MapItem[];
  action?: React.ReactNode;
}) {
  const [activeTab, setActiveTab] = useState<"incidencias" | "comentarios">("incidencias");
  const [areaSearch, setAreaSearch] = useState("");
  const [expandedAreas, setExpandedAreas] = useState(false);
  const [selectedArea, setSelectedArea] = useState<any>(null);
  const [selectedIncidencia, setSelectedIncidencia] = useState<any>(null);
  const [selectedComentario, setSelectedComentario] = useState<any>(null);
  // Evidencias que muestra el carrusel cuando se abre un detalle; vacio = fotos del rondin/area.
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [slideIndex, setSlideIndex] = useState(0);

  const raw = record.rawData ?? {};
  const detailsList: any[] = record.modalDetailsList || [];
  const incidencias = asList(raw.incidencias, record.incidencias);
  const comentarios = asList(raw.comentarios_generales, record.comentarios_generales);

  const areas = (raw.areas || record.areas || []).map((a: any) => ({
    nombre: a?.area || a?.detalle?.area || a?.rondin_area || "",
    hora: a?.detalle?.hora_de_check || "",
    img: a?.foto_default_area?.file_url || a?.detalle?.fotos?.[0]?.file_url || a?.foto_area?.[0]?.file_url || "/placeholder.svg",
    fotos: a?.detalle?.fotos || a?.foto_area || [],
    foto_default_area: a?.foto_default_area || null,
    incidencias: a?.detalle?.incidencias || [],
    comentarios: a?.detalle?.comentarios || "",
    tiempo_traslado: a?.detalle?.tiempo_traslado ?? "",
    checks_data: a?.checks_data ?? [],
    raw: a,
  }));
  const inspected = areas.filter((a: any) => a.hora).length;
  const progress = areas.length > 0 ? Math.round((inspected / areas.length) * 100) : 0;
  const filteredAreas = areas.filter((a: any) => a.nombre?.toLowerCase().includes(areaSearch.toLowerCase()));
  const visibleAreas = expandedAreas || areaSearch ? filteredAreas : filteredAreas.slice(0, AREAS_PREVIEW);

  const slides = buildSlides(selectedImages, selectedArea, areas);

  const estatus = ESTATUS_BADGE[raw.estatus_recorrido ?? ""];
  const folio = record.folio ?? raw.folio ?? "";
  const findDetail = (match: string[]) => detailsList.find((d) => match.some((m) => labelOf(d).includes(m)))?.value;
  const extras = detailsList.filter(
    (d) => hasValue(d.value) && !EXCLUDED_EXTRAS.some((m) => labelOf(d).includes(m)),
  );

  const openArea = (area: any) => {
    setSelectedArea({
      ...area,
      asignado_a: raw.asignado_a || "Guardia en turno",
      estatus_recorrido: raw.estatus_recorrido || "",
      folio_rondin: folio,
    });
    resetDetail({ keepArea: true });
  };
  const resetDetail = ({ keepArea = false } = {}) => {
    if (!keepArea) setSelectedArea(null);
    setSelectedIncidencia(null);
    setSelectedComentario(null);
    setSelectedImages([]);
    setSlideIndex(0);
  };
  const showImages = (urls: string[], index = 0) => {
    setSelectedImages(urls);
    setSlideIndex(index);
  };
  const evidenceUrls = (item: any): string[] =>
    (item.evidencias || item.incidente_evidencia || []).map((e: any) => e.file_url).filter(Boolean);

  return (
    <div className="flex flex-col h-full">
      <DetailPanelHeader
        title={record.title}
        subtitle={["Detalle del rondín", record.visit_type].filter(Boolean).join(" · ")}
        ids={folio ? <CopyableId id={String(folio)} label="Folio" /> : null}
        badges={
          <>
            {estatus && <Badge className={estatus.className}>{estatus.label}</Badge>}
            <Badge
              className={
                incidencias.length > 0
                  ? "bg-red-100 text-red-700 border-red-200 hover:bg-red-100"
                  : "bg-green-100 text-green-700 border-green-200 hover:bg-green-100"
              }
            >
              {incidencias.length > 0
                ? `${incidencias.length} incidencia${incidencias.length > 1 ? "s" : ""}`
                : "Sin incidencias"}
            </Badge>
          </>
        }
        actions={action}
      />

      <div className="flex-1 overflow-auto p-4 space-y-4 bg-slate-100">
        <DetailSection title="Datos del rondín">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DETAIL_FIELDS.map(({ label, match }) => (
              <DetailField key={label} label={label} value={findDetail(match) as React.ReactNode} />
            ))}
            {extras.map((item, i) => (
              <DetailField
                key={i}
                label={item.label}
                className={Array.isArray(item.value) ? "sm:col-span-2" : undefined}
                value={Array.isArray(item.value) ? <ChipList values={item.value} /> : item.value}
              />
            ))}
          </dl>
        </DetailSection>

        <DetailSection title="Evidencia y ubicación">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SlideCarousel
              slides={slides}
              index={slideIndex}
              onIndexChange={setSlideIndex}
              caption={selectedArea?.nombre || record.title}
            />
            <div className="h-56 overflow-hidden rounded-md border border-slate-200 bg-slate-100">
              <MapView map_data={mapData} areas={record.areas || []} />
            </div>
          </div>
          <MissingGeoNotice mapData={mapData} />
        </DetailSection>

        {selectedArea ? (
          <DetailBlock>
            <AreaDetailPanel area={selectedArea} onBack={() => resetDetail()} onSetImage={(url) => showImages([url])} />
          </DetailBlock>
        ) : selectedIncidencia ? (
          <DetailBlock>
            <IncidenciaDetailPanel
              item={selectedIncidencia}
              onBack={() => resetDetail()}
              onSetImage={(url) => showImages([url])}
            />
          </DetailBlock>
        ) : selectedComentario ? (
          <DetailBlock>
            <ComentarioDetailPanel item={selectedComentario} onBack={() => resetDetail()} />
          </DetailBlock>
        ) : (
          <>
            <DetailSection title={`Áreas inspeccionadas ${inspected}/${areas.length}`}>
              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden mb-3">
                <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 mb-3">
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Buscar área..."
                  value={areaSearch}
                  onChange={(e) => setAreaSearch(e.target.value)}
                  className="text-xs bg-transparent outline-none text-slate-700 placeholder:text-slate-400 w-full"
                />
              </div>
              {filteredAreas.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-3">Sin áreas registradas</p>
              ) : (
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {visibleAreas.map((area: any, i: number) => (
                    <AreaItem key={i} area={area} onClick={() => openArea(area)} />
                  ))}
                </ul>
              )}
              {!expandedAreas && !areaSearch && filteredAreas.length > AREAS_PREVIEW && (
                <button
                  type="button"
                  onClick={() => setExpandedAreas(true)}
                  className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  Ver las {filteredAreas.length - AREAS_PREVIEW} áreas restantes
                </button>
              )}
            </DetailSection>

            <DetailSection title="Seguimiento">
              <DetailTabs
                tabs={[
                  { key: "incidencias", label: "Incidencias", count: incidencias.length },
                  { key: "comentarios", label: "Comentarios", count: comentarios.length },
                ]}
                value={activeTab}
                onChange={setActiveTab}
              />
              <div className="pt-3">
                {activeTab === "incidencias" ? (
                  incidencias.length === 0 ? (
                    <EmptyText>Sin incidencias registradas</EmptyText>
                  ) : (
                    incidencias.map((item: any, i: number) => (
                      <IncidenciaListItem
                        key={item.id || i}
                        item={item}
                        onClick={() => {
                          setSelectedIncidencia(item);
                          const urls = evidenceUrls(item);
                          if (urls.length > 0) showImages(urls);
                        }}
                        onImageClick={(url) => {
                          const urls = evidenceUrls(item);
                          showImages(urls, Math.max(urls.indexOf(url), 0));
                        }}
                      />
                    ))
                  )
                ) : comentarios.length === 0 ? (
                  <EmptyText>Sin comentarios registrados</EmptyText>
                ) : (
                  comentarios.map((item: any, i: number) => (
                    <button key={i} type="button" className="block w-full text-left" onClick={() => setSelectedComentario(item)}>
                      <ComentarioListItem item={item} />
                    </button>
                  ))
                )}
              </div>
            </DetailSection>
          </>
        )}
      </div>
    </div>
  );
}

// Fotos del carrusel: evidencias abiertas > fotos del area elegida > fotos de todas las areas.
function buildSlides(selectedImages: string[], selectedArea: any, areas: any[]) {
  if (selectedImages.length > 0) {
    return toSlides(selectedImages, "Evidencia");
  }
  const fotos: any[] = selectedArea ? selectedArea.fotos : areas.flatMap((a) => a.fotos);
  const slides = fotos
    .filter((f) => f?.file_url?.startsWith("https://"))
    .map((f) => ({ src: f.file_url as string, label: (f.file_name || "Foto") as string }));
  return slides.length > 0 ? slides : toSlides([]);
}

function AreaItem({ area, onClick }: { area: any; onClick: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="w-full flex items-center gap-2.5 rounded-md border border-slate-200 bg-white p-2 text-left hover:border-blue-300 hover:bg-blue-50/40 transition-colors"
      >
        <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-slate-200 relative">
          <Image
            src={area.img}
            alt={area.nombre}
            fill
            className="object-cover"
            onError={(e) => ((e.target as HTMLImageElement).src = NO_IMAGE)}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-700 truncate">{area.nombre}</p>
          {area.hora ? (
            <p className="text-[10px] text-slate-500">{area.hora}</p>
          ) : (
            <p className="text-[10px] text-red-500 font-bold">Sin inspección</p>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
      </button>
    </li>
  );
}

function MissingGeoNotice({ mapData }: { mapData: MapItem[] }) {
  const missing = mapData.filter(
    (item: any) =>
      !item.geolocation_area || (item.geolocation_area.latitude === 0 && item.geolocation_area.longitude === 0),
  );
  if (missing.length === 0) return null;
  return (
    <div className="mt-3 px-2 py-1.5 bg-red-50 border border-red-100 rounded-lg">
      <p className="text-[10px] font-bold text-red-500 uppercase tracking-wide mb-0.5">⚠ Geolocalización no disponible</p>
      <p className="text-[10px] text-red-400 leading-snug">
        {missing.map((a: any) => a.nombre_area || a.nombre || "Área sin nombre").join(", ")}
      </p>
    </div>
  );
}

const DetailBlock = ({ children }: { children: React.ReactNode }) => (
  <section className="rounded-md border border-slate-200 bg-white overflow-hidden">{children}</section>
);

const EmptyText = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm text-slate-400 italic text-center py-6">{children}</p>
);
