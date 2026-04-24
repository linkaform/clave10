"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ListCardProps } from "@/types/bitacoras";
import { Checkbox } from "@/components/ui/checkbox";
import dynamic from "next/dynamic";
import { MapItem } from "@/components/table/rondines/table";

const MapView = dynamic(() => import("@/components/map-v2"), { ssr: false });

export function PhotoListCard({
  titleCard,
  descriptionCard,
  record,
  onClick,
  children,
  isSelected,
  onSelect,
  mapData,
}: ListCardProps & { mapData?: MapItem[] }) {
  const allImages = record.images || [];
  const [activeImage, setActiveImage] = useState(
    allImages[0] || "/placeholder.svg",
  );
  console.log(record)
  const showMap = mapData && mapData.length > 0;
  console.log("MAP DATA", mapData)
  // Separar áreas del resto de detalles
  const areasItem = record.detailsList?.find(
    (item) => item.label?.toLowerCase() === "areas" || item.label?.toLowerCase() === "áreas"
  );
  const otherDetails = record.detailsList?.filter(
    (item) => item.label?.toLowerCase() !== "areas" && item.label?.toLowerCase() !== "áreas"
  );

  return (
    <div
      className={cn(
        "w-full rounded-2xl border-2 bg-white shadow-sm hover:shadow-md transition-all duration-300 mb-4 last:mb-0 cursor-pointer group relative",
        isSelected
          ? "border-[#2A7EFF] shadow-md bg-primary/5"
          : "border-slate-200 hover:border-primary/30",
      )}
      onClick={() => onClick?.(record)}>
      <div
        className={cn(
          "absolute top-4 right-4 z-20 transition-opacity duration-200",
          isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        )}
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.(record);
        }}>
        <Checkbox
          checked={isSelected}
          className="h-5 w-5 border-2 border-slate-300 bg-transparent data-[state=checked]:bg-[#2A7EFF] data-[state=checked]:border-[#2A7EFF] data-[state=checked]:text-primary-foreground"
        />
      </div>

      <div className="flex gap-8 p-6 items-start w-full">

        {/* Columna izquierda: imagen principal + thumbnails */}
        <div className="flex-shrink-0 w-[22%] flex flex-col gap-3">
          <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 relative w-full aspect-[4/3]">
            <Image
              key={activeImage}
              src={activeImage}
              alt={`Fotografía de ${titleCard}`}
              fill
              loading="eager"
              className="object-contain transition-opacity duration-200"
              sizes="(max-width: 768px) 100vw, 22vw"
            />
          </div>

          {allImages.length > 1 && (
            <div className="flex gap-2 flex-wrap justify-start p-1">
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
                    "relative w-10 h-10 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all duration-150",
                    activeImage === img
                      ? "border-blue-500 ring-1 ring-blue-300 scale-105"
                      : "border-slate-200 hover:border-blue-400 hover:scale-105 opacity-60 hover:opacity-100",
                  )}>
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

        {/* Columna derecha: info + mapa + áreas */}
        <div className="flex-1 flex flex-col justify-start min-w-0">
          <div className="flex justify-between items-start">
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-bold text-slate-900 leading-tight text-balance">
                {titleCard}
              </h3>
            </div>
            {record?.badgesList && record?.badgesList?.length > 0 && (
              <div className="flex gap-2 mr-7">
                {record?.badgesList?.map((badge, index) => (
                  <Badge key={index} className={badge.customClass}>
                    {badge.label}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm text-slate-500 line-clamp-2">
              {descriptionCard}
            </span>
          </div>

          {otherDetails && otherDetails.length > 0 && (
            <div className="grid grid-cols-2 gap-x-12 gap-y-6 mb-4">
              {otherDetails.map((item, index) => {
                const hasValue = Array.isArray(item.value)
                  ? item.value.length > 0
                  : item.value !== null && item.value !== undefined && item.value !== "";
                if (!hasValue) return null;
                const isFullWidth = Array.isArray(item.value);
                return (
                  <div
                    key={index}
                    className={cn("flex flex-col gap-1", isFullWidth ? "col-span-2" : "col-span-1")}>
                    <span className="text-[0.65rem] font-medium text-slate-400 uppercase tracking-wider">
                      {item.label}
                    </span>
                    <div className="flex flex-wrap gap-2 items-center">
                      {Array.isArray(item.value) ? (
                        item.value.map((val, i) => (
                          <Badge key={i} variant="secondary"
                            className="bg-slate-100 hover:bg-slate-200 text-slate-600 border-0 rounded-md px-2 py-0.5 text-xs font-normal shadow-none">
                            {val}
                          </Badge>
                        ))
                      ) : (
                        <span className={`text-xs ${item.customClass}`}>
                          {item.value || "\u00A0"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {showMap && (
            <div
              className="rounded-xl overflow-hidden border border-slate-200 mb-4 w-full"
              style={{ height: "180px" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ height: "180px", width: "100%" }}>
                {/* <MapView map_data={mapData} areas={record?.areas || []} /> */}
              </div>
            </div>
          )}

          {areasItem && Array.isArray(areasItem.value) && areasItem.value.length > 0 && (
            <div className="flex flex-col gap-1 mb-4">
              <span className="text-[0.65rem] font-medium text-slate-400 uppercase tracking-wider">
                {areasItem.label}
              </span>
              <div className="flex flex-wrap gap-2 items-center">
                {areasItem.value.map((val, i) => (
                  <Badge key={i} variant="secondary"
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 border-0 rounded-md px-2 py-0.5 text-xs font-normal shadow-none">
                    {val}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {children && (
            <div
              className="flex gap-2 flex-wrap pt-3 border-t border-slate-100"
              onClick={(e) => e.stopPropagation()}>
              {typeof children === "function" ? children(record) : children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}