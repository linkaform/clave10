'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { ListCardProps, ListStatus } from '@/types/bitacoras';
import { Checkbox } from '@/components/ui/checkbox';

const statusConfig: Record<ListStatus, { label: string; variant?: "default" | "secondary" | "outline"; customClass?: string }> = {
  completado: { label: "Completado", variant: "default" },
  en_proceso: { label: "En Proceso", variant: "secondary" },
  cerrado: { label: "Cerrado", variant: "outline" },
  entrada: { label: "Entrada", customClass: "bg-green-600 text-white hover:bg-green-600" },
  salida: { label: "Salida", customClass: "bg-red-600 text-white hover:bg-red-600" },
}

export function PhotoListCard({
  titleCard,
  descriptionCard,
  record,
  cardConfig,
  onClick,
  children,
  isSelected,
  onSelect,
}: ListCardProps) {
  const allImages = record.images || [];
  const [activeImage, setActiveImage] = useState(allImages[0] || "/placeholder.svg");
  const statusInfo = statusConfig[record.status];

  return (
    <div 
      className={cn(
        "w-full rounded-2xl border-2 bg-white shadow-sm hover:shadow-md transition-all duration-300 mb-4 last:mb-0 cursor-pointer group relative",
        isSelected ? "border-primary shadow-md bg-primary/5" : "border-slate-200 hover:border-primary/30"
      )}
      onClick={() => onClick?.(record)}
    >
      <div 
        className={cn(
          "absolute top-4 left-4 z-20 transition-opacity duration-200",
          isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}
        onClick={(e) => {
          e.stopPropagation()
          onSelect?.(record)
        }}
      >
        <Checkbox 
          checked={isSelected} 
          className="h-5 w-5 border-2 border-primary bg-card data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
        />
      </div>

      <div className="flex gap-8 p-6 items-start w-full">

        {/* ── Bloque de imágenes: 30% del ancho del contenedor ── */}
        <div className="flex-shrink-0 w-[30%] flex flex-col gap-3">
          {/* Contenedor de la foto principal ── */}
          <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 relative w-full aspect-[4/3]">
            <Image
              key={activeImage}
              src={activeImage}
              alt={`Fotografía de ${titleCard}`}
              fill
              loading="eager"
              className="object-contain transition-opacity duration-200"
              sizes="(max-width: 768px) 100vw, 30vw"
            />
          </div>

          {/* Miniaturas de navegación */}
          {allImages.length > 1 && (
            <div className="flex gap-2 flex-wrap justify-center p-1">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  aria-label={`Ver fotografía ${idx + 1} de ${titleCard}`}
                  onMouseEnter={() => setActiveImage(img)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImage(img);
                  }}
                  className={cn(
                    'relative w-10 h-10 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all duration-150',
                    activeImage === img
                      ? 'border-blue-500 ring-1 ring-blue-300 scale-105'
                      : 'border-slate-200 hover:border-blue-400 hover:scale-105 opacity-60 hover:opacity-100'
                  )}
                >
                  <Image
                    src={img}
                    alt=""
                    fill
                    className="object-cover object-top"
                    sizes="40px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Información del registro ── */}
        <div className="flex-1 flex flex-col justify-start min-w-0">

          {/* Encabezado: código, nombre y badge */}
          <div className="flex justify-between items-start mb-2">
            <div className="min-w-0 flex-1">
              {(cardConfig?.folioTag && record?.folio) && (
                <span className="text-xs font-mono text-blue-600 font-semibold tracking-wide block mb-1">
                  {record.folio}
                </span>
              )}
              <h3 className="text-lg font-bold text-slate-900 leading-tight text-balance">
                {titleCard}
              </h3>
            </div>
            <Badge
              variant={statusInfo.variant}
              className={cn(
                'rounded-lg px-3 py-1 text-sm font-semibold whitespace-nowrap ml-4 border-0',
                !statusInfo.variant && statusInfo.customClass
              )}
            >
              {statusInfo.label}
            </Badge>
          </div>

          {/* Empresa y descripción principal */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm text-slate-500 line-clamp-2">{descriptionCard}</span>
          </div>

          {/* Detalles dinámicos (como en el grid) */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-4">
            {record.detailsList?.map((item, index) => (
              <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex-shrink-0">{item.icon}</span>
                <span className="line-clamp-1">{item.value}</span>
              </div>
            ))}
          </div>

          {/* Botones de acción (children) */}
          {children && (
            <div 
              className="flex gap-2 flex-wrap pt-3 border-t border-slate-100"
              onClick={(e) => e.stopPropagation()}
            >
              {typeof children === "function" ? children(record) : children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
