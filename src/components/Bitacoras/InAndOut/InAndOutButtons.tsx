import React from 'react'
import { Bitacora_record } from "@/components/table/bitacoras/bitacoras-columns"
import { PhotoGridActionButtons } from "@/components/Bitacoras/PhotoGrid/PhotoGridActionButtons"
import { VehicleLocalPassModal } from "@/components/modals/add-local-vehicule"
import { EqipmentLocalPassModal } from "@/components/modals/add-local-equipo"
import { Car, Forward, Hammer, Printer } from "lucide-react"

interface InAndOutButtonsProps {
  bitacora: Bitacora_record
  handleSalida: (bitacora: Bitacora_record) => void
  printPaseFn: (id: string) => void
}

export const InAndOutButtons = ({
  bitacora,
  handleSalida,
  printPaseFn
}: InAndOutButtonsProps) => {
  const isSalida = bitacora.status_visita?.toLowerCase() === "salida";
  const isEntrada = bitacora.status_visita?.toLowerCase() === "entrada";

  const iconClass = (disabled: boolean) =>
    `p-1.5 rounded-full transition-all duration-200 bg-white/90 hover:bg-white shadow-sm border border-slate-100 ${disabled ? 'text-slate-300 cursor-not-allowed opacity-50' : 'cursor-pointer hover:shadow-md text-slate-700 hover:text-blue-600 active:scale-95'}`;

  return (
    <PhotoGridActionButtons
      actions={[
        !isSalida ? (
          <VehicleLocalPassModal key="car" title="Agregar vehículo" vehicles={[]} setVehiculos={() => { }} isAccesos={false} id={bitacora._id} fetch={true}>
            <div className={iconClass(false)} title="Agregar vehículo">
              <Car className="w-4 h-4" />
            </div>
          </VehicleLocalPassModal>
        ) : null,

        !isSalida ? (
          <EqipmentLocalPassModal key="hammer" title="Agregar equipo" id={bitacora._id} equipos={[]} setEquipos={() => { }} isAccesos={false}>
            <div className={iconClass(false)} title="Agregar equipo">
              <Hammer className="w-4 h-4" />
            </div>
          </EqipmentLocalPassModal>
        ) : null,

        <div key="print" className={iconClass(false)} title="Imprimir pase" onClick={() => printPaseFn(bitacora.pase_id)}>
          <Printer className="w-4 h-4" />
        </div>,

        isEntrada ? (
          <div key="out" className={iconClass(false)} title="Registrar salida" onClick={() => handleSalida(bitacora)}>
            <Forward className="w-4 h-4 text-orange-500" />
          </div>
        ) : null,

      ].filter(Boolean) as React.ReactNode[]}
    />
  )
}
