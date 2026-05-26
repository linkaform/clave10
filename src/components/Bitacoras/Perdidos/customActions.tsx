import React, { useState } from "react";
import { PhotoGridActionButtons } from "@/components/Bitacoras/PhotoGrid/PhotoGridActionButtons";
import { Articulo_perdido_record } from "@/components/table/articulos/pendientes/pendientes-columns";
import { EditarArticuloModal } from "@/components/modals/editar-article-modal";
import { DevolucionArticuloModal } from "@/components/modals/devolucion-article-modal";
import { LoadingModal } from "@/components/modals/loading-modal";

interface PerdidosActionButtonsProps {
  articulo: Articulo_perdido_record;
}

export const PerdidosActionButtons = ({ articulo }: PerdidosActionButtonsProps) => {
  const [showLoadingModal, setShowLoadingModal] = useState(false);

  const isEntregado = articulo.estatus_perdido?.toLowerCase() === "entregado" ||
                      articulo.estatus_perdido?.toLowerCase() === "donado";

  return (
    <>
      <LoadingModal isOpen={showLoadingModal} text="Cargando..." />
      <PhotoGridActionButtons
        actions={[
          <EditarArticuloModal
            key="edit"
            title="Editar Artículo"
            data={articulo}
            setShowLoadingModal={setShowLoadingModal}
            showLoadingModal={showLoadingModal}
          />,
          !isEntregado ? (
            <DevolucionArticuloModal
              key="devolucion"
              title="Devolver Artículo"
              data={articulo}
            />
          ) : null,
        ].filter(Boolean) as React.ReactNode[]}
      />
    </>
  );
};