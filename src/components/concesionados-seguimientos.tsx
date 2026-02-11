/* eslint-disable react-hooks/exhaustive-deps */
import React, { Dispatch, SetStateAction, useState } from "react";
import {  Calculator, History } from "lucide-react";
import { ConcesionadosDetalleSeguimiento } from "./modals/conceisonados-detalle-seg";
import { EquipoConcesionado } from "./concesionados-agregar-equipos";
import { NuevaDevolucionEquipoModal } from "./modals/concesionados-nueva-devolucion";
import HistorialDevoluciones from "./concesionados-historial-devoluciones";

interface AgregarEquiposListProps {
    equipos: EquipoConcesionado[];
    setEquipos: Dispatch<SetStateAction<EquipoConcesionado[]>>
	mode:string
}
const nuevoEquipoEnProceso: EquipoConcesionado = {
	categoria_equipo_concesion: "Electrónicos",
	status_concesion_equipo: "en proceso",
	comentario_entrega: "Equipo en proceso de entrega",
	nombre_equipo: "Laptop HP",
	cantidad_equipo_concesion: 1,
	costo_equipo_concesion: 15000,
	evidencia_entrega: [],
	imagen_equipo_concesion: []
  };
  
  const nuevoEquipoCompleto: EquipoConcesionado = {
	categoria_equipo_concesion: "Artículos de Oficina",
	status_concesion_equipo: "completo",
	comentario_entrega: "Entrega completada exitosamente",
	nombre_equipo: "Silla Ergonómica",
	cantidad_equipo_concesion: 1,
	costo_equipo_concesion: 3500,
	evidencia_entrega: [
	  {
		file_name: "evidencia1.jpg",
		file_url: "https://ejemplo.com/evidencia1.jpg"
	  }
	],
	imagen_equipo_concesion: [
	  {
		file_name: "silla.jpg",
		file_url: "https://ejemplo.com/silla.jpg"
	  }
	]
  };
const ConcesionadosSeguimientos:React.FC<AgregarEquiposListProps> = ({ equipos, mode})=> {
	const [openAgregarEquiposModal, setOpenAgregarEquiposModal] = useState(false);
	const [openVerEquiposModal, setOpenVerEquiposModal] = useState(false);
	const [agregarEquipoSeleccion, setAgregarEquipoSeleccion] = useState<any>({});
	const [nuevaDevolucionModal, setNuevaDevolucionEquiposModal] = useState(false)
	const equiposActualizados = [...equipos, nuevoEquipoEnProceso, nuevoEquipoCompleto];

	const onDevolver = (equipo: any) => {
		console.log("DATA PARA DEVOLUCIIOON", equipo)

		setAgregarEquipoSeleccion(equipo[0]);
		setNuevaDevolucionEquiposModal(true);
	  };
	  
    return (
    <div>
		<div className="mt-3 flex justify-between">
			{mode!=="vista" &&
			<><div className="text-lg font-bold">Equipos</div><div className="cursor-pointer  bg-blue-500 hover:bg-blue-600 text-white mr-5 rounded-md p-2 px-4 text-center text-sm" onClick={() => {
					setOpenAgregarEquiposModal(!openAgregarEquiposModal);
					setNuevaDevolucionEquiposModal(false);
				} }>
					Agregar Equipo
			</div></>}
		</div>

		<ConcesionadosDetalleSeguimiento
		title={"Equipo"}
		setIsSuccess={setOpenVerEquiposModal}
		isSuccess={openVerEquiposModal}
		data={agregarEquipoSeleccion}
		>
			<div></div>
		</ConcesionadosDetalleSeguimiento>

		<NuevaDevolucionEquipoModal 	
			title={"Devolución de Equipos"}
			setIsSuccess={setNuevaDevolucionEquiposModal}
			isSuccess={nuevaDevolucionModal}
			equipoSelecionado={agregarEquipoSeleccion}
		>
			<div></div>
		</NuevaDevolucionEquipoModal>
	
  		<div className="flex gap-2">
        <History className="text-green-500"/> <span className="mb-2 font-bold text-gray-800"> HISTORIAL DE DEVOLUCIONES</span>
        </div>

        <HistorialDevoluciones equipos={equiposActualizados} onDevolver={onDevolver}></HistorialDevoluciones>

        <div className="flex gap-2 items-center text-blue-500 mt-2">
                <span className="flex font-bold text-lg"><Calculator/> Total:</span>
                <span className="font-bold text-lg">{0}</span>
        </div>

    </div>
  );
};

export default ConcesionadosSeguimientos;