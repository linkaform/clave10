"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ResizableLogSheet } from "@/components/ScriptLogs/ResizableLogSheet";
import { CopyableId } from "@/components/ScriptLogs/CopyableId";
import { EstatusBadge } from "@/components/estatus-badge";
import { ChipList, DetailField, DetailPanelHeader, DetailSection } from "@/components/common/DetailPanel";
import { PANEL_KEEP_OPEN_SELECTOR, SlideCarousel, toSlides } from "@/components/common/SlideCarousel";
import { PhotoRecord } from "@/types/bitacoras";
import { cn } from "@/lib/utils";

export interface PanelBadge {
  label: string;
  value: string;
  customClass?: string;
}

interface Props {
  record: PhotoRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  badges?: PanelBadge[];
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

const hasValue = (v: unknown) => (Array.isArray(v) ? v.length > 0 : v !== null && v !== undefined && v !== "");

// Panel lateral generico para un PhotoRecord: encabezado + fotos + lista de detalles
// (modalDetailsList). Misma estructura que UserPanel / RondinPanel.
export function RecordPanel({ record, open, onOpenChange, badges = [], actions, children }: Props) {
  return (
    <ResizableLogSheet
      open={open && !!record}
      onOpenChange={onOpenChange}
      title="Detalle del registro"
      keepOpenSelector={PANEL_KEEP_OPEN_SELECTOR}
    >
      {record && (
        <RecordPanelContent key={record.id} record={record} badges={badges} actions={actions}>
          {children}
        </RecordPanelContent>
      )}
    </ResizableLogSheet>
  );
}

function RecordPanelContent({
  record,
  badges,
  actions,
  children,
}: Pick<Props, "actions" | "children"> & { record: PhotoRecord; badges: PanelBadge[] }) {
  const [slideIndex, setSlideIndex] = useState(0);
  const details = (record.modalDetailsList ?? []).filter((d) => hasValue(d.value));

  return (
    <div className="flex flex-col h-full">
      <DetailPanelHeader
        title={record.title}
        subtitle={record.description}
        ids={record.id ? <CopyableId id={record.id} /> : null}
        badges={<PanelBadges statusLabel={record.statusLabel} badges={badges} />}
        actions={actions}
      />

      <div className="flex-1 overflow-auto p-4 space-y-4 bg-slate-100">
        <DetailSection title="Evidencia">
          <SlideCarousel
            slides={toSlides(record.images ?? [])}
            index={slideIndex}
            onIndexChange={setSlideIndex}
            caption={record.title}
          />
        </DetailSection>

        {details.length > 0 && (
          <DetailSection title="Detalle">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {details.map((item, i) => (
                <DetailField
                  key={i}
                  label={item.label || `Detalle ${i + 1}`}
                  className={Array.isArray(item.value) ? "sm:col-span-2" : undefined}
                  value={Array.isArray(item.value) ? <ChipList values={item.value} /> : (item.value as React.ReactNode)}
                />
              ))}
            </dl>
          </DetailSection>
        )}

        {children}
      </div>
    </div>
  );
}

// Estatus del registro + pastillas con la clase que ya traia cada pantalla (folio, tipo...).
export function PanelBadges({ statusLabel, badges }: { statusLabel?: string; badges: PanelBadge[] }) {
  return (
    <>
      {statusLabel && <EstatusBadge estatus={statusLabel} />}
      {badges
        .filter((b) => b.value)
        .map((b, i) => (
          <Badge key={i} className={cn("hover:bg-inherit", b.customClass)}>
            {b.label}
            {b.value}
          </Badge>
        ))}
    </>
  );
}
