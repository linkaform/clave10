import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Accordion } from "@/components/ui/accordion";
import Image from "next/image";
import { Dispatch, SetStateAction } from "react";
import { Laptop, X } from "lucide-react";
import { EqipmentLocalPassModal } from "@/components/modals/add-local-equipo";
import { Equipo } from "@/lib/update-pass";

interface PaseEquiposSectionProps {
  equipos: Equipo[];
  setEquipos: Dispatch<SetStateAction<Equipo[]>>;
  userId?: number;
}

export const PaseEquiposSection: React.FC<PaseEquiposSectionProps> = ({
  equipos,
  setEquipos,
  userId,
}) => {
  const handleRemoveEq = (index: number) => {
    setEquipos((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-slate-700">Equipos</span>
        <EqipmentLocalPassModal
          title="Nuevo Equipo"
          equipos={equipos}
          setEquipos={setEquipos}
          isAccesos={false}
          userId={userId}>
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm border-2 border-blue-400 text-blue-600 hover:bg-blue-50 transition-colors">
            <Laptop size={15} />
            <span className="hidden sm:block">Agregar</span>
            <span className="sm:hidden font-bold">+</span>
          </button>
        </EqipmentLocalPassModal>
      </div>
      <Accordion type="multiple" className="w-full ">
        {equipos.map((equipo, index) => (
          <AccordionPrimitive.Item
            key={index}
            value={`equipo-${index}`}
            className="border-b border-gray-100 my-2">
            <div className="flex items-center justify-between bg-gray-50 hover:bg-blue-50 rounded-lg px-3 py-2 transition-colors">
              <AccordionPrimitive.Trigger className="flex items-center gap-2 text-sm font-medium text-slate-700 flex-1 text-left">
                <Laptop size={14} className="text-blue-400 shrink-0" />
                <span>{equipo.tipo || "Equipo sin tipo"}</span>
              </AccordionPrimitive.Trigger>

              <button
                type="button"
                onClick={() => handleRemoveEq(index)}
                className="w-5 h-5 rounded-full bg-red-200 hover:bg-red-300 flex items-center justify-center transition-colors shrink-0 ml-2"
                title="Eliminar">
                <X size={11} className="text-red-600" />
              </button>
            </div>

            <AccordionPrimitive.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
              <div className="px-3 pt-1 pb-3 text-xs text-slate-600">
                {equipo.foto_equipo && equipo.foto_equipo.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <p>
                        <strong>Tipo:</strong> {equipo.tipo}
                      </p>
                      <p>
                        <strong>Nombre:</strong> {equipo.nombre}
                      </p>
                      <p>
                        <strong>Marca:</strong> {equipo.marca}
                      </p>
                      <p>
                        <strong>Modelo:</strong> {equipo.modelo}
                      </p>
                      <p>
                        <strong>No. Serie:</strong> {equipo.serie}
                      </p>
                      <p>
                        <strong>Color:</strong> {equipo.color}
                      </p>
                    </div>
                    <div className="flex flex-col items-center justify-center border rounded-md p-1 bg-white">
                      <Image
                        src={equipo.foto_equipo[0].file_url || "/nouser.svg"}
                        alt="Foto equipo"
                        width={100}
                        height={100}
                        className="rounded-sm object-cover max-h-[80px] w-auto"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                    <p>
                      <strong>Tipo:</strong> {equipo.tipo}
                    </p>
                    <p>
                      <strong>Nombre:</strong> {equipo.nombre}
                    </p>
                    <p>
                      <strong>Marca:</strong> {equipo.marca}
                    </p>
                    <p>
                      <strong>Modelo:</strong> {equipo.modelo}
                    </p>
                    <p>
                      <strong>No. Serie:</strong> {equipo.serie}
                    </p>
                    <p>
                      <strong>Color:</strong> {equipo.color}
                    </p>
                  </div>
                )}
              </div>
            </AccordionPrimitive.Content>
          </AccordionPrimitive.Item>
        ))}

        {equipos.length === 0 && (
          <p className="text-xs text-gray-400 py-2">No se han agregado equipos.</p>
        )}
      </Accordion>
    </div>
  );
};
