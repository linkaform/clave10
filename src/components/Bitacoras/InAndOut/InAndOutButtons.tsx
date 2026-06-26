import React, { useState } from 'react'
import { Bitacora_record } from "@/components/table/bitacoras/bitacoras-columns"
import { PhotoGridActionButtons } from "@/components/Bitacoras/PhotoGrid/PhotoGridActionButtons"
import { VehicleLocalPassModal } from "@/components/modals/add-local-vehicule"
import { EqipmentLocalPassModal } from "@/components/modals/add-local-equipo"
import { AddBadgeModal } from "@/components/modals/add-badge-modal"
import { ReturnGafeteModal } from "@/components/modals/return-gafete-modal"
import { Car, Forward, Hammer, IdCard, Printer } from "lucide-react"
import useAuthStore from '@/store/useAuthStore'

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
  const [isAddBadgeOpen, setIsAddBadgeOpen] = useState(false);
  const [isReturnGafeteOpen, setIsReturnGafeteOpen] = useState(false);
  const {userIdSoter} = useAuthStore()
  const isSalida = bitacora.status_visita?.toLowerCase() === "salida";
  const isEntrada = bitacora.status_visita?.toLowerCase() === "entrada";
  const isAsignado = bitacora.status_gafete?.toLowerCase() === "asignado";

  const iconClass = (disabled: boolean) =>
    `p-1.5 rounded-full transition-all duration-200 bg-white/90 hover:bg-white shadow-sm border border-slate-100 ${disabled ? 'text-slate-300 cursor-not-allowed opacity-50' : 'cursor-pointer hover:shadow-md text-slate-700 hover:text-blue-600 active:scale-95'}`;

  const gafeteButton = isSalida ? (
    <div key="gafete" className={iconClass(true)} title="Gafete (No disponible)">
      <IdCard className="w-4 h-4" />
    </div>
  ) : isEntrada && isAsignado ? (
    <div key="gafete" className={iconClass(false)} title="Regresar gafete" onClick={() => setIsReturnGafeteOpen(true)}>
      <IdCard className="w-4 h-4 text-rose-500" />
    </div>
  ) : (
    <div key="gafete" className={iconClass(false)} title="Agregar gafete" onClick={() => setIsAddBadgeOpen(true)}>
      <IdCard className="w-4 h-4" />
    </div>
  );

  return (
    <>
      {isReturnGafeteOpen && (
        <ReturnGafeteModal
          title="Recibir Gafete"
          id_bitacora={bitacora._id}
          ubicacion={bitacora.ubicacion}
          area={bitacora.caseta_entrada || ""}
          fecha_salida={bitacora.fecha_salida}
          gafete={bitacora.id_gafet}
          locker={bitacora.id_locker || ""}
          tipo_movimiento="entrada"
          modalRegresarGafeteAbierto={isReturnGafeteOpen}
          setModalRegresarGafeteAbierto={setIsReturnGafeteOpen}
        />
      )}
      {isAddBadgeOpen && (
        <AddBadgeModal
          title="Gafete"
          status="Disponible"
          id_bitacora={bitacora._id}
          pase_id={bitacora.pase_id}
          tipo_movimiento={bitacora.status_visita}
          ubicacion={bitacora.ubicacion}
          area={bitacora.caseta_entrada || ""}
          modalAgregarBadgeAbierto={isAddBadgeOpen}
          setModalAgregarBadgeAbierto={setIsAddBadgeOpen}
        />
      )}
      <PhotoGridActionButtons
        actions={[
          !isSalida ? (
            <VehicleLocalPassModal key="car" title="Agregar vehículo" vehicles={[]} setVehiculos={() => {}} isAccesos={false} id={bitacora._id} fetch={true}>
              <div className={iconClass(false)} title="Agregar vehículo">
                <Car className="w-4 h-4" />
              </div>
            </VehicleLocalPassModal>
          ) : null,
          !isSalida ? (
            <EqipmentLocalPassModal key="hammer" title="Agregar equipo" id={bitacora._id} equipos={[]} setEquipos={() => {}} isAccesos={false} userId={userIdSoter}>
              <div className={iconClass(false)} title="Agregar equipo" >
                <Hammer className="w-4 h-4" />
              </div>
            </EqipmentLocalPassModal>
          ) : null,
          gafeteButton,
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
    </>
  );
};