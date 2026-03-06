/* eslint-disable react-hooks/exhaustive-deps */
import React, { Dispatch, SetStateAction, useState } from "react";
import { History } from "lucide-react";
import { ConcesionadosDetalleSeguimiento } from "./modals/conceisonados-detalle-seg";
import { EquipoConcesionado } from "./concesionados-tab-datos";
import { NuevaDevolucionEquipoModal } from "./modals/concesionados-nueva-devolucion";
import HistorialDevoluciones from "./concesionados-historial-devoluciones";

interface AgregarEquiposListProps {
  equipos: EquipoConcesionado[];
  setEquipos: Dispatch<SetStateAction<EquipoConcesionado[]>>;
  mode: string;
  dataConcesion: any
}

const TabSeguimientos: React.FC<AgregarEquiposListProps> = ({ equipos, mode ,dataConcesion}) => {
  const [openAgregarEquiposModal, setOpenAgregarEquiposModal] = useState(false);
  const [openVerEquiposModal, setOpenVerEquiposModal] = useState(false);
  const [agregarEquipoSeleccion, setAgregarEquipoSeleccion] = useState<any>({});
  const [nuevaDevolucionModal, setNuevaDevolucionEquiposModal] = useState(false);

  console.log("dsataaaaaa", dataConcesion)

  const equiposActualizados = [...equipos];

  const onDevolver = (equipo: any) => {
    setAgregarEquipoSeleccion(equipo);
    setNuevaDevolucionEquiposModal(true);
  };

  const onDevolverTodo = () => {
    setAgregarEquipoSeleccion(null);
    setNuevaDevolucionEquiposModal(true);
    //  //PONER AQUI DATA
    // devolverEquipoMutation.mutate({
    //     record_id: dataConcesion._id, 
    //     status:"total",
    //     state: "complete",
    //     quien_entrega: "Nombre de quien entrega",
    //     company: "Nombre Empresa",
    //     identificacion_entrega : {
    //       file_name:"foto.jpg",
    //       file_url:""
    //     },
    //     comentarios:"Poner aqui comentarios globales"
    // });
  };

  return (
    <div>
      <div className="mt-3 flex justify-between">
        {mode !== "vista" && (
          <>
            <div className="text-lg font-bold">Equipos</div>
            <div
              className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white mr-5 rounded-md p-2 px-4 text-center text-sm"
              onClick={() => {
                setOpenAgregarEquiposModal(!openAgregarEquiposModal);
                setNuevaDevolucionEquiposModal(false);
              }}
            >
              Agregar Equipo
            </div>
          </>
        )}
      </div>

      <ConcesionadosDetalleSeguimiento
        title="Equipo"
        setIsSuccess={setOpenVerEquiposModal}
        isSuccess={openVerEquiposModal}
        data={agregarEquipoSeleccion}
      >
        <div />
      </ConcesionadosDetalleSeguimiento>

      <NuevaDevolucionEquipoModal
        title="Devolución de Equipos"
        setIsSuccess={setNuevaDevolucionEquiposModal}
        isSuccess={nuevaDevolucionModal}
        equipoSelecionado={agregarEquipoSeleccion}
        dataConcesion={dataConcesion}
      >
        <div />
      </NuevaDevolucionEquipoModal>

      <div className="flex gap-2 mb-2">
        <History className="text-green-500" />
        <span className="mb-2 font-bold text-gray-700 text-sm">HISTORIAL DE DEVOLUCIONES</span>
      </div>
            
      <HistorialDevoluciones
        equipos={equiposActualizados}
        onDevolver={onDevolver}
        onDevolverTodo={onDevolverTodo}
        isLoadingTodo={false}
        dataConcesion={dataConcesion}
      />
    </div>
  );
};

export default TabSeguimientos;