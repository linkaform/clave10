import { PhotoRecord } from "@/types/bitacoras";
import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const DEFAULT_IMAGE =
  "https://f001.backblazeb2.com/file/app-linkaform/public-client-126/71202/60b81349bde5588acca320e1/64efbf5f241e60d950ff5b9e.thumbnail";

interface EquiposYVehiculosListProps {
  record: PhotoRecord | null;
}

const SectionHeader = ({ title }: { title: string }) => (
  <div className="py-3 border-b border-border/40 mb-4">
    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#94a3b8]">
      {title}
    </p>
  </div>
);

const ColorCircle = ({
  colorCode,
  colorName,
}: {
  colorCode?: string;
  colorName: string;
}) => {
  // Simple mapping if colorCode is not provided, though ideally we use the hex from data
  const style = colorCode ? { backgroundColor: colorCode } : {};

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "h-4 w-4 rounded-full border border-black/10 shadow-sm",
          !colorCode && "bg-zinc-200",
        )}
        style={style}
        title={colorName}
      />
    </div>
  );
};

const CardItem = ({
  image,
  title,
  subtitle,
  fields,
}: {
  image?: string;
  title: string;
  subtitle?: React.ReactNode;
  fields: { label: string; value: string | React.ReactNode }[];
}) => (
  <div className="flex gap-4 mb-6 last:mb-0 group cursor-default">
    <div className="relative h-[90px] w-[110px] shrink-0 overflow-hidden rounded-xl border border-border/50 bg-muted/20 shadow-sm">
      <Image
        src={image || "/placeholder.svg"}
        alt={title}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />
    </div>
    <div className="flex flex-col justify-center min-w-0 flex-1">
      <h4 className="text-[15px] font-bold text-[#1e293b] truncate mb-0.5">
        {title}
      </h4>
      {subtitle && <div className="mb-1">{subtitle}</div>}
      <div className="space-y-0.5">
        {fields.map((field, idx) => (
          <div key={idx} className="flex items-center gap-1.5 text-[11px]">
            <span className="text-[#94a3b8] font-medium whitespace-nowrap">
              {field.label}:
            </span>
            <span className="text-[#1e293b] font-bold truncate">
              {field.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const EquiposYVehiculosList = ({ record }: EquiposYVehiculosListProps) => {
  if (!record) return null;

  const hasVehiculos = record.vehiculos && record.vehiculos.length > 0;
  const hasEquipos = record.equipos && record.equipos.length > 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 mb-10">
      {/* VEHÍCULOS SECTION */}
      <section>
        <SectionHeader title="Vehículo" />
        <div className="space-y-4">
          {hasVehiculos ? (
            record.vehiculos?.map((v, i) => (
              <CardItem
                key={i}
                image={v.imagen || DEFAULT_IMAGE}
                title={`${v.marca_vehiculo} ${v.modelo_vehiculo}`}
                subtitle={
                  <span className="text-[12px] text-[#64748b] font-medium">
                    {v.tipo} {v.nombre_estado ? `(${v.nombre_estado})` : ""}
                  </span>
                }
                fields={[
                  { label: "Placas", value: v.placas },
                  {
                    label: "Color",
                    value: (
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{v.color}</span>
                        <ColorCircle
                          colorCode={v.color_code}
                          colorName={v.color}
                        />
                      </div>
                    ),
                  },
                ]}
              />
            ))
          ) : (
            <div className="opacity-50 grayscale-[0.5]">
              <CardItem
                image={DEFAULT_IMAGE}
                title="Sin vehículo registrado"
                fields={[{ label: "Placas", value: "####" }]}
              />
            </div>
          )}
        </div>
      </section>

      {/* EQUIPOS SECTION */}
      <section>
        <SectionHeader title="Equipos" />
        <div className="space-y-6">
          {hasEquipos ? (
            record.equipos?.map((e, i) => (
              <CardItem
                key={i}
                image={e.imagen || DEFAULT_IMAGE}
                title={
                  e.nombre_articulo ||
                  `${e.marca_articulo} ${e.modelo_articulo}`
                }
                subtitle={
                  <span className="text-[12px] text-[#64748b] font-medium">
                    {e.tipo_equipo}
                  </span>
                }
                fields={[
                  {
                    label: "Color",
                    value: (
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{e.color_articulo}</span>
                        <ColorCircle
                          colorCode={e.color_code}
                          colorName={e.color_articulo}
                        />
                      </div>
                    ),
                  },
                  { label: "Serie", value: e.numero_serie },
                ]}
              />
            ))
          ) : (
            <div className="opacity-50 grayscale-[0.5]">
              <CardItem
                image={DEFAULT_IMAGE}
                title="Sin equipos registrados"
                fields={[{ label: "Serie", value: "####" }]}
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default EquiposYVehiculosList;
