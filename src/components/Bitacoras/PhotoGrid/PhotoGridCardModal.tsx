"use client";

import { useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PhotoRecord } from "@/types/bitacoras";
import { cn } from "@/lib/utils";

export interface ModalBadgeItem {
  label: string;
  value: string;
  customClass?: string;
}

interface PhotoDetailModalProps {
  record: PhotoRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  badges?: ModalBadgeItem[];
  children?: React.ReactNode;
}

interface ListItemProps {
  icon?: React.ReactNode;
  iconColor?: string;
  label: string;
  value: string | string[];
}

function ListItem({ label, value }: ListItemProps) {
  return (
    <div className="py-2 first:pt-0 last:pb-0">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-0.5">
          {label}
        </p>
        <div className="flex flex-wrap gap-2 items-center">
          {Array.isArray(value) ? (
            value.map((val, i) => (
              <Badge
                key={i}
                variant="outline"
                className="bg-slate-100 text-slate-600 border-0 rounded-md px-2 py-0.5 text-xs font-normal shadow-none">
                {val}
              </Badge>
            ))
          ) : (
            <p className="text-[15px] font-medium text-[#1e293b] leading-snug">
              {value || "\u00A0"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function PhotoGridCardModal({
  record,
  open,
  onOpenChange,
  badges = [],
  children,
}: PhotoDetailModalProps) {
  const [slideIndex, setSlideIndex] = useState(0);
  console.log("Registro seleccionado para modal:", record);

  if (!record) return null;

  const slides =
    record.images && record.images.length > 0
      ? record.images.map((img, i) => ({ src: img, label: `Imagen ${i + 1}` }))
      : [{ src: "/placeholder.svg", label: "Sin imagen" }];

  const prevSlide = () =>
    setSlideIndex((i) => (i - 1 + slides.length) % slides.length);
  const nextSlide = () => setSlideIndex((i) => (i + 1) % slides.length);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setSlideIndex(0);
      }}>
      <DialogContent className="p-0 overflow-hidden !max-w-[1000px] w-[95vw] sm:w-[92vw] h-[95vh] rounded-3xl shadow-2xl flex flex-col border-none bg-background">
        <DialogTitle className="sr-only">Detalle — {record.title}</DialogTitle>

        <div className="flex flex-col lg:row flex-1 min-h-0 overflow-hidden sm:flex-row">
          {/* ── LEFT: Modern Image Preview ── */}
          <div className="relative sm:w-[50%] lg:w-[55%] shrink-0 bg-background flex flex-col min-h-[450px] sm:min-h-0 p-4">
            <div className="relative flex-1 group overflow-hidden rounded-2xl shadow-xl bg-zinc-950 border border-border/40">
              <Image
                key={slides[slideIndex].src}
                src={slides[slideIndex].src}
                alt={slides[slideIndex].label}
                fill
                className="object-contain transition-all duration-700 ease-in-out"
                priority
              />

              {/* Navigation Overlay */}
              {slides.length > 1 && (
                <div className="absolute inset-x-4 inset-y-0 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none px-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      prevSlide();
                    }}
                    className="pointer-events-auto h-11 w-11 flex items-center justify-center bg-white hover:bg-white/90 text-black rounded-full shadow-xl transition-all transform hover:scale-105 active:scale-95">
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      nextSlide();
                    }}
                    className="pointer-events-auto h-11 w-11 flex items-center justify-center bg-white hover:bg-white/90 text-black rounded-full shadow-xl transition-all transform hover:scale-105 active:scale-95">
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </div>
              )}

              {/* Floating Counter Badge (Top Right) */}
              {slides.length > 1 && (
                <div className="absolute top-5 right-5 z-30">
                  <span className="bg-black/40 text-white text-[10px] font-bold px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10 tracking-widest uppercase">
                    {slideIndex + 1} / {slides.length}
                  </span>
                </div>
              )}

              {/* ID Floating Badge (Bottom Left) - Matching Context Image Style */}
              {record.id && (
                <div className="absolute bottom-6 left-5 z-30">
                  <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                    <span className="text-[9px] font-black tracking-widest text-white/50 uppercase">
                      ID:
                    </span>
                    <span className="text-[10px] font-mono font-medium text-white/80 select-all tracking-tight">
                      {record.id}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT: Info panel ── */}
          <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden bg-background">
            {/* Main Header Container */}
            <div className="px-8 pt-8 pb-6 shrink-0 space-y-4">
              {/* Dynamic Badges Header */}
              {badges && badges.length > 0 && (
                <div className="flex flex-wrap gap-1.5 justify-end">
                  {badges.slice(0, 3).map((badge, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full border",
                        badge.customClass ||
                          "bg-primary/5 border-primary/20 text-primary",
                      )}>
                      <span className="text-[9px] font-black uppercase tracking-[0.1em]">
                        {badge.label}
                        {badge.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold">
                  {record.title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {record.description}
                </p>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="overflow-y-auto flex-1 px-8 py-2 space-y-4 no-scrollbar">
              {/* Dynamic Details List */}
              {record.modalDetailsList &&
                record.modalDetailsList.length > 0 && (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      {record.modalDetailsList.map((item, index) => {
                        const hasValue = Array.isArray(item.value)
                          ? item.value.length > 0
                          : item.value !== null &&
                            item.value !== undefined &&
                            item.value !== "";

                        if (!hasValue) return null;

                        return (
                          <ListItem
                            key={index}
                            label={item.label || `Detalle ${index + 1}`}
                            value={item.value}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

              {children && <div className="space-y-4">{children}</div>}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
