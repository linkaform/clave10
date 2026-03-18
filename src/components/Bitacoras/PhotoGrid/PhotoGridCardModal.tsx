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
} from 'lucide-react'
import { PhotoRecord } from '@/types/bitacoras'
import { cn } from '@/lib/utils'

interface PhotoDetailModalProps {
  record: PhotoRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ListItemProps {
  icon?: React.ReactNode
  iconColor?: string
  label: string
  value: string
}

function ListItem({ icon, iconColor, label, value }: ListItemProps) {
  return (
    <div className="flex items-start gap-4 py-4 border-b border-border/50 last:border-0 hover:bg-muted/5 transition-colors px-1">
      {icon && (
        <div className={cn('mt-1 shrink-0 flex items-center justify-center p-2 rounded-lg bg-muted/40', iconColor)}>
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 mb-1">
          {label}
        </p>
        <p className="text-sm font-semibold text-foreground leading-relaxed">{value}</p>
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
  console.log("Registro seleccionado para modal:", record)

  if (!record) return null

  const slides = record.images && record.images.length > 0 
    ? record.images.map((img, i) => ({ src: img, label: `Imagen ${i + 1}` }))
    : [{ src: '/placeholder.svg', label: 'Sin imagen' }]

  const prevSlide = () => setSlideIndex((i) => (i - 1 + slides.length) % slides.length)
  const nextSlide = () => setSlideIndex((i) => (i + 1) % slides.length)

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setSlideIndex(0) }}>
      <DialogContent className="p-0 overflow-hidden !max-w-[1000px] w-[95vw] sm:w-[92vw] max-h-[92vh] rounded-3xl shadow-2xl flex flex-col border-none bg-background">
        <DialogTitle className="sr-only">Detalle — {record.title}</DialogTitle>

        <div className="flex flex-col lg:row flex-1 min-h-0 overflow-hidden sm:flex-row">

          {/* ── LEFT: Modern Image Preview ── */}
          <div className="relative sm:w-[50%] lg:w-[55%] shrink-0 bg-zinc-950 flex flex-col min-h-[350px] sm:min-h-0">
            <div className="relative flex-1 group overflow-hidden">
              <Image
                key={slides[slideIndex].src}
                src={slides[slideIndex].src}
                alt={slides[slideIndex].label}
                fill
                className="object-contain transition-all duration-500 ease-in-out"
                priority
              />

              {/* Navigation Overlay */}
              {slides.length > 1 && (
                <div className="absolute inset-x-4 inset-y-0 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                  <button
                    onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                    className="pointer-events-auto h-12 w-12 flex items-center justify-center bg-black/40 hover:bg-black/60 text-white rounded-full shadow-2xl backdrop-blur-xl border border-white/20 transition-all transform hover:scale-110 active:scale-95"
                  >
                    <ChevronLeft className="h-7 w-7" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                    className="pointer-events-auto h-12 w-12 flex items-center justify-center bg-black/40 hover:bg-black/60 text-white rounded-full shadow-2xl backdrop-blur-xl border border-white/20 transition-all transform hover:scale-110 active:scale-95"
                  >
                    <ChevronRight className="h-7 w-7" />
                  </button>
                </div>
              )}

              {/* Floating Counter Badge */}
              {slides.length > 1 && (
                <div className="absolute top-6 right-6 z-30">
                  <span className="bg-white/10 text-white text-[11px] font-black px-3 py-1.5 rounded-full backdrop-blur-2xl border border-white/20 shadow-2xl tracking-tighter">
                    {slideIndex + 1} / {slides.length}
                  </span>
                </div>
              )}

              {/* Dot Indicators Overlay */}
              {slides.length > 1 && (
                <div className="absolute bottom-8 inset-x-0 flex justify-center gap-2 z-30 px-4">
                  <div className="flex gap-1.5 p-2 rounded-full bg-black/20 backdrop-blur-md border border-white/10 max-w-full overflow-x-auto no-scrollbar">
                    {slides.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setSlideIndex(i)}
                        className={cn(
                          'h-1.5 rounded-full transition-all duration-500 shadow-xl shrink-0',
                          i === slideIndex 
                            ? 'w-8 bg-white' 
                            : 'w-1.5 bg-white/30 hover:bg-white/50'
                        )}
                        aria-label={`Ir a imagen ${i + 1}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT: Info panel ── */}
          <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden bg-background">
            
            {/* Main Header Container */}
            <div className="px-8 pt-8 pb-6 shrink-0 space-y-4">
              {/* Folio Header */}
              {record.folio && (
                <div className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-primary/5 border border-primary/20">
                  <span className="text-[11px] font-black uppercase tracking-[0.15em] text-primary">
                    FOLIO: {record.folio}
                  </span>
                </div>
              )}

              <div className="space-y-1.5">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight leading-[1.1]">
                  {record.title}
                </h2>
              </div>

              {/* Status Badge Line */}
              {record.status && (
                <div className="flex pt-1">
                  <Badge
                    className={cn(
                      'text-xs font-bold px-4 py-1 rounded-full border-none shadow-sm h-7',
                      record.status === 'completado' && 'bg-green-500 text-white hover:bg-green-500',
                      record.status === 'en_proceso' && 'bg-amber-500 text-white hover:bg-amber-500',
                      record.status === 'cerrado' && 'bg-zinc-500 text-white hover:bg-zinc-500',
                      record.status === 'entrada' && 'bg-emerald-600 text-white hover:bg-emerald-600',
                      record.status === 'salida' && 'bg-rose-600 text-white hover:bg-rose-600',
                    )}
                  >
                    {record.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              )}
            </div>

            {/* Content Divider */}
            <div className="h-px bg-border/60 mx-8 shrink-0" />

            {/* Scrollable Body */}
            <div className="overflow-y-auto flex-1 px-8 py-6 space-y-8 no-scrollbar">

              {/* Dynamic Details List */}
              {record.modalDetailsList && record.modalDetailsList.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1 mb-2">
                    Detalles
                  </p>
                  <div className="bg-muted/10 rounded-2xl border border-border/40 overflow-hidden px-4">
                    {record.modalDetailsList.map((item, index) => (
                      <ListItem
                        key={index}
                        icon={item.icon}
                        iconColor="text-primary/70"
                        label={item.label || `Detalle ${index + 1}`}
                        value={item.value}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sticky/Bottom Footer: ID */}
            {record.id && (
              <div className="px-8 py-6 bg-muted/20 border-t border-border/50 shrink-0">
                <div className="flex flex-col gap-1.5">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 flex items-center gap-2">
                    <Hash className="h-3.5 w-3.5" /> ID del Registro
                  </p>
                  <p className="text-[11px] font-mono font-medium text-muted-foreground/70 break-all select-all">
                    {record.id}
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      </DialogContent>
    </Dialog>
  )
}
