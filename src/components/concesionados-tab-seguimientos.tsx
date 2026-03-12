import React, { Dispatch, SetStateAction } from "react";
import { EquipoConcesionado } from "./concesionados-tab-datos";
import { ConcesionadosSeguimientoContenido } from "./concesionados-seguimientos-contenido";
import { Concesion } from "./modals/concesionados-detalle-de-la-concesion";

interface TabSeguimientosProps {
  dataConcesion: Concesion;
  onClose?: () => void;
  equipos?: EquipoConcesionado[];
  setEquipos?: Dispatch<SetStateAction<EquipoConcesionado[]>>;
  mode?: string;
}

const TabSeguimientos: React.FC<TabSeguimientosProps> = ({
  dataConcesion,
  onClose,
}) => {
  return (
    <div className="flex flex-col h-full">
      <ConcesionadosSeguimientoContenido
        data={dataConcesion}
        onClose={onClose ?? (() => {})}
      />
    </div>
  );
};

export default TabSeguimientos;