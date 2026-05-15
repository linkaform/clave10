"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { PhotoCardProps } from "@/types/bitacoras";

const statusConfig: Record<
  string,
  {
    label: string;
    variant?: "default" | "secondary" | "outline";
    customClass?: string;
  }
> = {
  completado: { label: "Completado", variant: "default" },
  en_proceso: { label: "En Proceso", variant: "secondary" },
  cerrado: { label: "Cerrado", variant: "outline" },
  con_incidencias: {
    label: "Con incidencias",
    customClass: "bg-red-100 text-red-600 hover:bg-red-100",
  },
  sin_incidencias: {
    label: "Sin incidencias",
    customClass: "bg-green-100 text-green-600 hover:bg-green-100",
  },
  entrada: {
    label: "Entrada",
    customClass: "bg-green-600 text-white hover:bg-green-600",
  },
  salida: {
    label: "Salida",
    customClass: "bg-red-600 text-white hover:bg-red-600",
  },
  corriendo: {
    label: "Corriendo",
    customClass: "bg-green-600 text-white hover:bg-green-600",
  },
  pausado: {
    label: "Pausado",
    customClass: "bg-yellow-500 text-white hover:bg-yellow-500",
  },
  cancelado: {
    label: "Cancelado",
    customClass: "bg-red-600 text-white hover:bg-red-600",
  },
  abierto: {
    label: "Abierto",
    customClass: "bg-green-600 text-white hover:bg-green-600",
  },
  resuelto: {
    label: "Resuelto",
    customClass: "bg-blue-600 text-white hover:bg-blue-600",
  },
};

export function PhotoGridCard({
  headerBadge,
  titleCard,
  descriptionCard,
  record,
  cardConfig,
  onClick,
  children,
  isSelected,
  onSelect,
}: PhotoCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (record.images.length > 1) {
      const nextImg = record.images[1];
      if (nextImg && nextImg.trim() !== "") {
        setCurrentImageIndex(1);
      }
    }
  };
  const handleMouseLeave = () => {
    setIsHovered(false);
    setCurrentImageIndex(0);
  };

  const statusInfo = statusConfig[record.status] || statusConfig["cerrado"];

  return (
    <Card
      className={cn(
        "group cursor-pointer overflow-hidden py-0 transition-all duration-300 hover:shadow-lg border-2",
        isSelected
          ? "border-[#2A7EFF] shadow-md bg-primary/5"
          : "border-gray-100 hover:border-primary/30",
      )}
      onClick={() => onClick?.(record)}>
      <div
        className="relative h-80 overflow-hidden bg-muted"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}>
        {record.images.length > 0 ? (
          <Image
            src={record.images[currentImageIndex] || "sin_imagen_rondin.svg"}
            alt={record.title}
            fill={true}
            className={`object-cover transition-all duration-500 ${
              isHovered ? "scale-105" : "scale-100"
            }`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-100 italic text-slate-400 text-xs">
            Sin imagen
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-background/80 via-transparent to-transparent" />

        <div
          className={cn(
            "absolute top-3 left-3 z-20 transition-opacity duration-200",
            isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
          )}
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(record);
          }}>
          <Checkbox
            checked={isSelected}
            className="h-5 w-5 border-2 border-white bg-transparent data-[state=checked]:bg-[#2A7EFF] data-[state=checked]:border-[#2A7EFF] data-[state=checked]:text-primary-foreground"
          />
        </div>

        <div
          className={cn(
            "absolute z-10 flex flex-col gap-1 transition-all duration-300",
            cardConfig?.tagPosition === "sup-izq" && "top-3 left-10 items-start",
            cardConfig?.tagPosition === "sup-der" && "top-3 right-3 items-end",
            cardConfig?.tagPosition === "inf-izq" && "bottom-3 left-3 items-start",
            cardConfig?.tagPosition === "inf-der" && "bottom-3 right-3 items-end",
          )}>
          {cardConfig?.folioTag && record?.folio && (
            <Badge
              variant={"default"}
              className="bg-[#DBEAFE] hover:bg-[#DBEAFE] text-[0.65rem] py-0 px-2 h-5 text-blue-700 rounded-sm">
              {record.folio}
            </Badge>
          )}
          {statusInfo && (
            <Badge
              variant={statusInfo.variant}
              className={cn(
                "text-[0.65rem] py-0 px-2 h-5",
                !statusInfo.variant && statusInfo.customClass,
              )}>
              {(record as any).statusLabel || statusInfo.label}
            </Badge>
          )}
        </div>

        {record.images.length > 1 && (
          <div className="absolute bottom-3 right-3 flex gap-1">
            {record.images.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${
                  index === currentImageIndex ? "bg-primary w-3" : "bg-primary/40"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <CardContent className="flex flex-col gap-3 p-4">
        <div className="space-y-1">
          <h3 className="font-semibold text-sm leading-tight line-clamp-1 text-foreground">
            {titleCard}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {descriptionCard}
          </p>
        </div>
        {headerBadge && (
          <div className="self-start">
            <Badge
              variant={"default"}
              className="bg-[#F3E8FF] hover:bg-[#F3E8FF] text-[0.7rem] text-[#B44BFB] rounded-sm">
              {headerBadge}
            </Badge>
          </div>
        )}

        {record?.detailsList && record?.detailsList?.length > 0 && (
          <>
            <div className="border-t border-border"></div>
            <div className="flex flex-col gap-1.5 pt-1">
              {record?.detailsList?.map((item, index) => {
                if (!item.value) return <div key={index} className="h-4" />;
                return (
                  <div
                    key={index}
                    className={`flex items-center gap-1.5 text-xs text-muted-foreground ${item.customClass}`}>
                    {item.icon}
                    <span>{item.value}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {children && <div className="border-t border-border"></div>}

        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          {children && (
            <>{typeof children === "function" ? children(record) : children}</>
          )}
        </div>
      </CardContent>
    </Card>
  );
}