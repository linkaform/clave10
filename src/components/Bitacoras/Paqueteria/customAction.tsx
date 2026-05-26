import React, { useState } from "react";
import { PhotoGridActionButtons } from "@/components/Bitacoras/PhotoGrid/PhotoGridActionButtons";
import { Paquete_record } from "@/components/table/articulos/paqueteria/paqueteria-columns";
import { EditarPaqueteria } from "@/components/modals/editar-paqueteria";
import { DevolucionPaqModal } from "@/components/modals/entregar-paqueteria";
import { LoadingModal } from "@/components/modals/loading-modal";

interface PaqueteriaActionButtonsProps {
  paquete: Paquete_record;
}

export const PaqueteriaActionButtons = ({ paquete }: PaqueteriaActionButtonsProps) => {
  const [showLoadingModal, setShowLoadingModal] = useState(false);

  const isEntregado = paquete.estatus_paqueteria === "entregado";

  return (
    <>
      <LoadingModal isOpen={showLoadingModal} text="Cargando..." />
      <PhotoGridActionButtons
        actions={[
          <EditarPaqueteria
            key="edit"
            title="Editar Paqueteria"
            data={paquete}
            setShowLoadingModal={setShowLoadingModal}
            showLoadingModal={showLoadingModal}
          />,
          !isEntregado ? (
            <DevolucionPaqModal
              key="entregar"
              title="Entregar paquete"
              data={paquete}
            />
          ) : null,
        ].filter(Boolean) as React.ReactNode[]}
      />
    </>
  );
};