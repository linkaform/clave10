"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { PhotoStatus, PhotoCardProps } from "@/types/bitacoras"

const statusConfig: Record<PhotoStatus, { label: string; variant?: "default" | "secondary" | "outline"; customClass?: string }> = {
  completado: { label: "Completado", variant: "default" },
  en_proceso: { label: "En Proceso", variant: "secondary" },
  cerrado: { label: "Cerrado", variant: "outline" },
  entrada: { label: "Entrada", customClass: "bg-green-600 text-white hover:bg-green-600" },
  salida: { label: "Salida", customClass: "bg-red-600 text-white hover:bg-red-600" },
}

export function PhotoGridCard({ titleCard, descriptionCard, record, cardConfig, onClick, children }: PhotoCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseEnter = () => {
    setIsHovered(true)
    if (record.images.length > 1) {
      setCurrentImageIndex(1)
    }
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    setCurrentImageIndex(0)
  }

  const statusInfo = statusConfig[record.status]

  return (
    <Card
      className="group cursor-pointer overflow-hidden py-0 transition-all duration-300 hover:shadow-lg hover:border-primary/30"
      onClick={() => onClick?.(record)}
    >
      <div 
        className="relative h-80 overflow-hidden bg-muted"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Image
          src={record.images[currentImageIndex] || "/placeholder.svg"}
          alt={record.title}
          fill={true}
          className={`object-cover transition-all duration-500 ${isHovered ? "scale-105" : "scale-100"
            }`}
        />
        <div className="absolute inset-0 bg-linear-to-t from-background/80 via-transparent to-transparent" />

        {(cardConfig.tagPosition === "sup-izq" || cardConfig.tagPosition === "sup-der" || cardConfig.tagPosition === "inf-izq" || cardConfig.tagPosition === "inf-der") && (
          <div 
            className={cn(
              "absolute z-10 transition-all duration-300",
              cardConfig.tagPosition === "sup-izq" && "top-3 left-3",
              cardConfig.tagPosition === "sup-der" && "top-3 right-3",
              cardConfig.tagPosition === "inf-izq" && "bottom-3 left-3",
              cardConfig.tagPosition === "inf-der" && "bottom-3 right-3"
            )}
          >
            <Badge 
              variant={statusInfo.variant} 
              className={cn("text-xs", !statusInfo.variant && statusInfo.customClass)}
            >
              {statusInfo.label}
            </Badge>
          </div>
        )}

        {record.images.length > 1 && (
          <div className="absolute bottom-3 right-3 flex gap-1">
            {record.images.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${index === currentImageIndex
                  ? "bg-primary w-3"
                  : "bg-primary/40"
                  }`}
              />
            ))}
          </div>
        )}
      </div>

      <CardContent className="flex flex-col gap-3 p-4">
        {(cardConfig.folioTag && record?.folio) && (
          <div className="self-start">
            <Badge variant={"default"} className="bg-blue-400 text-[0.7rem] text-blue-700 hover:bg-blue-400 hover:bg-opacity-10 bg-opacity-10 rounded-sm">
              {record?.folio}
            </Badge>
          </div>
        )}

        <div className="space-y-1">
          <h3 className="font-semibold text-sm leading-tight line-clamp-1 text-foreground">
            {titleCard}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {descriptionCard}
          </p>
        </div>

        <div className="flex gap-1">
          {children && (
            <>
              {typeof children === "function" ? children(record) : children}
            </>
          )}
        </div>

        {record?.detailsList && record?.detailsList?.length > 0 && (
          <div className="flex flex-col gap-1.5 pt-2 border-t border-border">
            {record?.detailsList?.map((item, index) => (
              <div key={index} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {item.icon}
                <span>{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
