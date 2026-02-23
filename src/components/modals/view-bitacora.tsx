import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { Bitacora_record } from "../table/bitacoras/bitacoras-columns";
import Image from "next/image";

interface ViewListBitacoraModalProps {
  title: string;
  data: Bitacora_record;
  children: React.ReactNode;
}

export const ViewListBitacoraModal: React.FC<ViewListBitacoraModalProps> = ({
  title,
  data,
  children,
}) => {
const statusColor =
  data?.status_visita?.toLowerCase() === "entrada"
    ? "bg-emerald-50 text-emerald-700 border-[2px] border-emerald-500"
    : data?.status_visita?.toLowerCase() === "salida"
    ? "bg-rose-50 text-rose-600 border border-rose-200"
    : "bg-gray-100 text-gray-600 border border-gray-200";

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 rounded-2xl overflow-hidden border-0 shadow-2xl"
        onInteractOutside={(e) => e.preventDefault()}
        aria-describedby=""
      >
      <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
		<DialogTitle className="text-xl font-semibold text-gray-900 tracking-tight text-center">
			{title}
		</DialogTitle>
		</DialogHeader>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-gray-400 font-bold mb-1">Visitante:</p>
              <p className="text-xl font-bold text-gray-900">{data?.nombre_visitante}</p>
            </div>
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap ${statusColor}`}>
              {data?.status_visita}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <InfoCard label="Tipo de pase" value="Visita General" />
            <InfoCard label="Motivo de visita" value={data?.motivo_visita || "—"} />
            <InfoCard
              label="Visita a"
              value={data?.visita_a?.length > 0 ? data.visita_a[0].nombre : "—"}
            />
            <InfoCard
              label="Sala"
              value={data?.sala || "—"}
            />
          </div>

          {(data?.foto_url || data?.file_url) && (
            <div>
              <SectionTitle>Evidencia: </SectionTitle>
              <div className="flex justify-around">
                {data?.foto_url && (
                  <PhotoCard label="Fotografía" src={data.foto_url} />
                )}
                {data?.file_url && (
                  <PhotoCard label="Identificación" src={data.file_url} />
                )}
              </div>
            </div>
          )}

          {data?.equipos?.length > 0 && (
            <div>
              <SectionTitle>Equipos: </SectionTitle>
              <Accordion type="single" collapsible className="space-y-2">
                {data.equipos.map((equipo, index) => (
                  <AccordionItem
                    key={index}
                    value={`equipo-${index}`}
                    className="border border-gray-100 rounded-xl px-4 shadow-none"
                  >
                    <AccordionTrigger className="text-sm font-medium text-gray-800 hover:no-underline py-3">
                      {equipo.tipo_equipo}
                    </AccordionTrigger>
                    <AccordionContent className="pb-3">
                      <div className="grid grid-cols-2 gap-2">
                        <DetailRow label="Tipo" value={equipo.tipo_equipo} />
                        <DetailRow label="Marca" value={equipo.marca_articulo} />
                        <DetailRow label="Modelo" value={equipo.modelo_articulo} />
                        <DetailRow label="No. Serie" value={equipo.numero_serie} />
                        <DetailRow label="Color" value={equipo.color_articulo} />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}

          {data?.vehiculos?.length > 0 && (
            <div>
              <SectionTitle>Vehículos: </SectionTitle>
              <Accordion type="single" collapsible className="space-y-2">
                {data.vehiculos.map((vehiculo, index) => (
                  <AccordionItem
                    key={index}
                    value={`vehiculo-${index}`}
                    className="border border-gray-100 rounded-xl px-4 shadow-none"
                  >
                    <AccordionTrigger className="text-sm font-medium text-gray-800 hover:no-underline py-3">
                      {vehiculo.tipo}
                    </AccordionTrigger>
                    <AccordionContent className="pb-3">
                      <div className="grid grid-cols-2 gap-2">
                        <DetailRow label="Tipo" value={vehiculo.tipo} />
                        <DetailRow label="Marca" value={vehiculo.marca_vehiculo} />
                        <DetailRow label="Modelo" value={vehiculo.modelo_vehiculo} />
                        <DetailRow label="Estado" value={vehiculo.nombre_estado} />
                        <DetailRow label="Placas" value={vehiculo.placas} />
                        <DetailRow label="Color" value={vehiculo.color} />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}

          {/* Comentarios */}
          {data?.comentarios?.length > 0 && (
            <div>
              <SectionTitle>Comentarios: </SectionTitle>
              <Accordion type="single" collapsible className="space-y-2">
                {data.comentarios.map((comentario, index) => (
                  <AccordionItem
                    key={index}
                    value={`comentario-${index}`}
                    className="border border-gray-100 rounded-xl px-4 shadow-none"
                  >
                    <AccordionTrigger className="text-sm font-medium text-gray-800 hover:no-underline py-3">
                      {comentario.comentario}
                    </AccordionTrigger>
                    <AccordionContent className="pb-3">
                      <DetailRow label="Tipo" value={comentario.tipo_comentario} />
                      <DetailRow label="Comentario" value={comentario.comentario} />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}

          {data?.grupo_areas_acceso?.length > 0 && (
            <div>
              <SectionTitle>Áreas de acceso: </SectionTitle>
              <Accordion type="single" collapsible className="space-y-2">
                {data.grupo_areas_acceso.map((area, index) => (
                  <AccordionItem
                    key={index}
                    value={`area-${index}`}
                    className="border border-gray-100 rounded-xl px-4 shadow-none"
                  >
                    <AccordionTrigger className="text-sm font-medium text-gray-800 hover:no-underline py-3">
                      {area.incidente_area}
                    </AccordionTrigger>
                    <AccordionContent className="pb-3">
                      <DetailRow label="Área" value={area.incidente_area} />
                      <DetailRow label="Comentario" value={area.commentario_area} />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <DialogClose asChild>
            <Button className="w-full h-10 rounded-xl bg-gray-200 hover:bg-gray-300 text-slate-900 text-sm font-medium transition-colors">
              Cerrar
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* ── Helpers ── */

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm font-bold text-gray-400 mb-3">
    {children}
  </p>
);

const InfoCard = ({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) => (
  <div className={`bg-gray-50 rounded-xl p-3 ${className}`}>
    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
    <p className="text-sm font-medium text-gray-800">{value}</p>
  </div>
);

const DetailRow = ({ label, value }: { label: string; value?: string }) => (
  <div className="py-0.5">
    <span className="text-xs text-gray-400">{label}: </span>
    <span className="text-sm text-gray-700">{value || "N/A"}</span>
  </div>
);

const PhotoCard = ({ label, src }: { label: string; src: string }) => (
	<div className="flex flex-col gap-1.5">
	  <p className="text-xs text-gray-400">{label}</p>
	  <div className="rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
		<Image
		  width={192}
		  height={192}
		  src={src || "/nouser.svg"}
		  alt={label}
		  className="w-full h-full object-cover"
		/>
	  </div>
	</div>
  );