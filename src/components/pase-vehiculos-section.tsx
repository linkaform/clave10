import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Accordion } from "@/components/ui/accordion";
import Image from "next/image";
import { Dispatch, SetStateAction } from "react";
import { Car, X } from "lucide-react";
import { VehicleLocalPassModal } from "@/components/modals/add-local-vehicule";
import { Vehiculo } from "@/lib/update-pass";

interface PaseVehiculosSectionProps {
  vehicles: Vehiculo[];
  setVehiculos: Dispatch<SetStateAction<Vehiculo[]>>;
  account_id?: number;
}

export const PaseVehiculosSection: React.FC<PaseVehiculosSectionProps> = ({
  vehicles,
  setVehiculos,
  account_id,
}) => {
  const handleRemove = (index: number) => {
    setVehiculos((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-slate-700">Vehículos</span>
        <VehicleLocalPassModal
          title="Nuevo Vehiculo"
          vehicles={vehicles}
          setVehiculos={setVehiculos}
          isAccesos={false}
          fetch={false}
          account_id={account_id}>
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm border-2 border-blue-400 text-blue-600 hover:bg-blue-50 transition-colors">
            <Car size={15} />
            <span className="hidden sm:block">Agregar</span>
            <span className="sm:hidden font-bold">+</span>
          </button>
        </VehicleLocalPassModal>
      </div>
      <Accordion type="multiple" className="w-full">
        {vehicles.map((vehiculo, index) => (
          <AccordionPrimitive.Item
            key={index}
            value={`vehiculo-${index}`}
            className="border-b border-gray-100 my-2">
            <div className="flex items-center justify-between bg-gray-50 hover:bg-blue-50 rounded-lg px-3 py-2 transition-colors">
              <AccordionPrimitive.Trigger className="flex items-center gap-2 text-sm font-medium text-slate-700 flex-1 text-left">
                <Car size={14} className="text-blue-400 shrink-0" />
                <span>{vehiculo.tipo || "Vehículo sin tipo"}</span>
              </AccordionPrimitive.Trigger>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="w-5 h-5 rounded-full bg-red-200 hover:bg-red-300 flex items-center justify-center transition-colors shrink-0 ml-2"
                title="Eliminar">
                <X size={11} className="text-red-600" />
              </button>
            </div>

            <AccordionPrimitive.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
              <div className="px-3 pt-1 pb-3 text-xs text-slate-600">
                {(vehiculo.foto_vehiculo?.length ?? 0) > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <p>
                        <strong>Tipo:</strong> {vehiculo.tipo}
                      </p>
                      <p>
                        <strong>Marca:</strong> {vehiculo.marca}
                      </p>
                      <p>
                        <strong>Modelo:</strong> {vehiculo.modelo}
                      </p>
                      <p>
                        <strong>Placas:</strong> {vehiculo.placas}
                      </p>
                      <p>
                        <strong>Estado:</strong> {vehiculo.estado}
                      </p>
                      <p>
                        <strong>Color:</strong> {vehiculo.color}
                      </p>
                    </div>
                    <div className="flex flex-col items-center justify-center border rounded-md p-1 bg-white">
                      <Image
                        src={vehiculo.foto_vehiculo?.[0]?.file_url || "/nouser.svg"}
                        alt="Foto vehículo"
                        width={100}
                        height={100}
                        className="rounded-sm object-cover max-h-[80px] w-auto"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                    <p>
                      <strong>Tipo:</strong> {vehiculo.tipo}
                    </p>
                    <p>
                      <strong>Marca:</strong> {vehiculo.marca}
                    </p>
                    <p>
                      <strong>Modelo:</strong> {vehiculo.modelo}
                    </p>
                    <p>
                      <strong>Placas:</strong> {vehiculo.placas}
                    </p>
                    <p>
                      <strong>Estado:</strong> {vehiculo.estado}
                    </p>
                    <p>
                      <strong>Color:</strong> {vehiculo.color}
                    </p>
                  </div>
                )}
              </div>
            </AccordionPrimitive.Content>
          </AccordionPrimitive.Item>
        ))}

        {vehicles.length === 0 && (
          <p className="text-xs text-gray-400 py-2">No se han agregado vehículos.</p>
        )}
      </Accordion>
    </div>
  );
};
