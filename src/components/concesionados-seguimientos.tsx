/* eslint-disable react-hooks/exhaustive-deps */
import React, { Dispatch, SetStateAction, useState } from "react";
import { History } from "lucide-react";
import { ConcesionadosDetalleSeguimiento } from "./modals/conceisonados-detalle-seg";
import { EquipoConcesionado } from "./concesionados-agregar-equipos";
import { NuevaDevolucionEquipoModal } from "./modals/concesionados-nueva-devolucion";
import HistorialDevoluciones from "./concesionados-historial-devoluciones";
import { useDevolucionEquipo } from "@/hooks/Concesionados/useDevolverConcesionado";

interface AgregarEquiposListProps {
  equipos: EquipoConcesionado[];
  setEquipos: Dispatch<SetStateAction<EquipoConcesionado[]>>;
  mode: string;
}

const ConcesionadosSeguimientos: React.FC<AgregarEquiposListProps> = ({ equipos, mode }) => {
  const [openAgregarEquiposModal, setOpenAgregarEquiposModal] = useState(false);
  const [openVerEquiposModal, setOpenVerEquiposModal] = useState(false);
  const [agregarEquipoSeleccion, setAgregarEquipoSeleccion] = useState<any>({});
  const [nuevaDevolucionModal, setNuevaDevolucionEquiposModal] = useState(false);

  const { devolverEquipoMutation , isLoading } = useDevolucionEquipo();

  const equiposActualizados = [...equipos];

  const onDevolver = (equipo: any) => {
    setAgregarEquipoSeleccion(equipo);
    setNuevaDevolucionEquiposModal(true);
  };

  const onDevolverTodo = (equipo: EquipoConcesionado) => {
    devolverEquipoMutation.mutate({
      record_id: equipo?.id_movimiento ?? "",
      status: "total",
      entregado_por: "empleado",
      quien_entrega: "",
      equipos: [{
        id_movimiento: equipo?.id_movimiento ?? "",
        cantidad_devuelta: equipo?.cantidad_equipo_concesion ?? 0,
        state: "complete",
        evidencia: [],
      }],
    });
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
        isLoadingTodo={isLoading}
      />
    </div>
  );
};

export default ConcesionadosSeguimientos;