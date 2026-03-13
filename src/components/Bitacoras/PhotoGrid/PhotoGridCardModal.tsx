'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  ChevronLeft,
  ChevronRight,
  Hash,
  Info,
} from 'lucide-react'
import { PhotoRecord } from '@/types/bitacoras'
import { cn } from '@/lib/utils'

interface PhotoDetailModalProps {
  record: PhotoRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Card-style row — used only for "Visita a"
interface InfoRowProps {
  icon: React.ReactNode
  iconBg: string
  label: string
  value: string
  subValue?: string
}

function InfoRow({ icon, iconBg, label, value, subValue }: InfoRowProps) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40">
      <div className={cn('mt-0.5 shrink-0 w-8 h-8 rounded-lg flex items-center justify-center', iconBg)}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
          {label}
        </p>
        <p className="text-sm font-semibold text-foreground leading-snug">{value}</p>
        {subValue && (
          <p className="text-xs text-muted-foreground mt-0.5">{subValue}</p>
        )}
      </div>
    </div>
  )
}

// Simple list item for the additional info block
interface ListItemProps {
  icon: React.ReactNode
  iconColor: string
  label: string
  value: string
}

function ListItem({ icon, iconColor, label, value }: ListItemProps) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
      <span className={cn('mt-0.5 shrink-0', iconColor)}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
          {label}
        </p>
        <p className="text-sm font-semibold text-foreground leading-snug">{value}</p>
      </div>
    </div>
  )
}

export function PhotoGridCardModal({
  record,
  open,
  onOpenChange,
}: PhotoDetailModalProps) {
  const [slideIndex, setSlideIndex] = useState(0)

  if (!record) return null

  const slides = record.images.length > 0 
    ? record.images.map((img, i) => ({ src: img, label: `Imagen ${i + 1}` }))
    : [{ src: '/placeholder.svg', label: 'Sin imagen' }]

  const prevSlide = () => setSlideIndex((i) => (i - 1 + slides.length) % slides.length)
  const nextSlide = () => setSlideIndex((i) => (i + 1) % slides.length)

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setSlideIndex(0) }}>
      <DialogContent className="p-0 overflow-hidden !max-w-[920px] w-[92vw] max-h-[90vh] rounded-2xl shadow-2xl flex flex-col border-none">
        <DialogTitle className="sr-only">Detalle — {record.title}</DialogTitle>

        <div className="flex flex-col sm:flex-row flex-1 min-h-0 overflow-hidden">

          {/* ── LEFT: Modern Image Preview ── */}
          <div className="relative sm:w-[55%] shrink-0 bg-muted/30 flex flex-col min-h-[400px] border-r border-border">
            {/* Focal Image Container */}
            <div className="relative flex-1 group overflow-hidden bg-zinc-950">
              <Image
                key={slides[slideIndex].src}
                src={slides[slideIndex].src}
                alt={slides[slideIndex].label}
                fill
                className="object-contain transition-all duration-300"
                priority
              />

              {/* Navigation Overlay (Visible on Hover) */}
              {slides.length > 1 && (
                <div className="absolute inset-0 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <button
                    onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                    className="pointer-events-auto h-10 w-10 flex items-center justify-center bg-background/80 hover:bg-background text-foreground rounded-full shadow-lg backdrop-blur-md transition-all transform hover:scale-110"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                    className="pointer-events-auto h-10 w-10 flex items-center justify-center bg-background/80 hover:bg-background text-foreground rounded-full shadow-lg backdrop-blur-md transition-all transform hover:scale-110"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </div>
              )}

              {/* Counter Badge */}
              {slides.length > 1 && (
                <div className="absolute top-4 right-4 z-10">
                  <span className="bg-black/60 text-white text-[10px] font-bold px-2.5 py-1 rounded-md backdrop-blur-md border border-white/10">
                    {slideIndex + 1} / {slides.length}
                  </span>
                </div>
              )}

              {/* Dot Indicators (Modern Overlay) */}
              {slides.length > 1 && (
                <div className="absolute bottom-6 inset-x-0 flex justify-center gap-1.5 z-10">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setSlideIndex(i)}
                      className={cn(
                        'h-1.5 rounded-full transition-all duration-300 shadow-sm',
                        i === slideIndex 
                          ? 'w-6 bg-white' 
                          : 'w-1.5 bg-white/40 hover:bg-white/60'
                      )}
                      aria-label={`Ir a imagen ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT: Info panel ── */}
          <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden bg-background">

            {/* Top section: folio + name + badges */}
            <div className="px-6 pt-6 pb-4 shrink-0">
              {/* Folio pill */}
              {record.folio && (
                <div className="mb-3">
                  <span className="inline-flex items-center border border-primary/40 text-primary text-xs font-semibold px-3 py-1 rounded-full bg-primary/5 tracking-wide">
                    FOLIO: {record.folio}
                  </span>
                </div>
              )}

              {/* Title label */}
              <p className="text-[10px] font-semibold uppercase tracking-widest text-primary mb-1">
                Título del Registro
              </p>
              <h2 className="text-xl font-bold text-foreground leading-tight mb-3">
                {record.title}
              </h2>

              {/* Status badge */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  className={cn(
                    'text-xs font-semibold px-3',
                    record.status === 'completado' && 'bg-green-500 hover:bg-green-500 text-white',
                    record.status === 'en_proceso' && 'bg-amber-500 hover:bg-amber-500 text-white',
                    record.status === 'cerrado' && 'bg-zinc-500 hover:bg-zinc-500 text-white',
                    record.status === 'entrada' && 'bg-green-600 hover:bg-green-600 text-white',
                    record.status === 'salida' && 'bg-red-600 hover:bg-red-600 text-white',
                  )}
                >
                  {record.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-border mx-6 shrink-0" />

            {/* Info section */}
            <div className="overflow-y-auto flex-1 px-6 py-4 flex flex-col gap-3">

              {/* Description — card style */}
              <InfoRow
                icon={<Info className="h-4 w-4 text-blue-600" />}
                iconBg="bg-blue-100 dark:bg-blue-900/40"
                label="Descripción"
                value={record.description}
              />

              {/* Additional Details mapping */}
              {record.detailsList && record.detailsList.length > 0 && (
                <div className="mt-2">
                  {record.detailsList.map((item, index) => (
                    <ListItem
                      key={index}
                      icon={item.icon}
                      iconColor="text-primary"
                      label={`Detalle ${index + 1}`}
                      value={item.value}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Bottom: Registry ID */}
            <div className="px-6 py-4 border-t border-border shrink-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1">
                <Hash className="h-3 w-3" /> ID del Registro
              </p>
              <p className="text-xs font-mono text-muted-foreground break-all">{record.id}</p>
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  )
}
