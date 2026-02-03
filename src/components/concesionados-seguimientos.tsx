/* eslint-disable react-hooks/exhaustive-deps */
import React, { Dispatch, SetStateAction, useState } from "react";
import { ArrowRightLeft, Calculator, Eye } from "lucide-react";
import { ConcesionadosDetalleSeguimiento } from "./modals/conceisonados-detalle-seg";
import { EquipoConcesionado } from "./concesionados-agregar-equipos";
import { NuevaDevolucionEquipoModal } from "./modals/concesionados-nueva-devolucion";

interface AgregarEquiposListProps {
    equipos: EquipoConcesionado[];
    setEquipos: Dispatch<SetStateAction<EquipoConcesionado[]>>
	mode:string
}

const ConcesionadosSeguimientos:React.FC<AgregarEquiposListProps> = ({ equipos, mode})=> {
	const [openAgregarEquiposModal, setOpenAgregarEquiposModal] = useState(false);
	const [openVerEquiposModal, setOpenVerEquiposModal] = useState(false);
	const [agregarEquipoSeleccion, setAgregarEquipoSeleccion] = useState<EquipoConcesionado>({});
	const [nuevaDevolucionModal, setNuevaDevolucionEquiposModal] = useState(false)
	const [indiceSeleccionado, setIndiceSeleccionado]= useState<number | null>(null)
	console.log("indiceSeleccionado",indiceSeleccionado)
    const handleViewEquipo = (item: any, index: number) => {
		setAgregarEquipoSeleccion(item);
		setIndiceSeleccionado(index);
		setNuevaDevolucionEquiposModal(false)
		setOpenVerEquiposModal(true);
	};

	const handleNuevaDevolucion = (item: any, index: number) => {
		setAgregarEquipoSeleccion(item);
		setIndiceSeleccionado(index);
		setNuevaDevolucionEquiposModal(true)
		setOpenAgregarEquiposModal(true);
	};
	
	// const handleDeleteEquipo  = (index: number) => {
	// 	const nuevaspersonasInvolucradas = [...equipos];
	// 	nuevaspersonasInvolucradas.splice(index, 1);
	// 	setEquipos(nuevaspersonasInvolucradas);
	// 	toast.success("Seguimiento eliminado correctamente.")
	// };

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
		{/* <ConcesionadosAgregarEquipoModal
                title="Nuevo Equipo"
                isSuccess={openAgregarEquiposModal}
                setIsSuccess={setOpenAgregarEquiposModal}
                agregarEquiposSeleccion={agregarEquipoSeleccion}
                setEquipos={setEquipos}
                setNuevaDevolucionEquiposModal={setNuevaDevolucionEquiposModal}
                editarAgregarEquiposModal={editarAgregarEquiposModal}
                indice={indiceSeleccionado} >
			<div></div>
		</ConcesionadosAgregarEquipoModal> */}

		
		<table className="min-w-full table-auto mb-5 border">
			<thead>
			<tr className="bg-gray-100">
				<th className="px-4 py-2 text-left border-b border-gray-300">Equipo</th>
				<th className="px-4 py-2 text-left border-b border-gray-300">Unidades</th>
				<th className="px-4 py-2 text-left border-b border-gray-300">Estatus</th>
				<th></th>
			</tr>
			</thead>
			<tbody>
			{equipos && equipos.length > 0 ? (
			equipos.map((item, index) => (
				<tr key={index} className="border-t border-gray-200">
				<td className="px-4 py-2 max-w-[200px] truncate" title={item?.equipo || item?.nombre_equipo}> {item?.equipo || item?.nombre_equipo}</td>
				<td className="px-4 py-2">{item.unidades||item?.cantidad_equipo_concesion}</td>
				<td className="px-4 py-2"> 
                    <div
                        className={`inline-flex items-center justify-center px-2  text-sm font-semibold rounded-md border capitalize
                        ${
                            item.status_concesion_equipo=="pendiente"
                            ? "bg-red-100 text-red-700 border-red-700"
                            : "bg-green-100 text-green-700 border-green-700"
                        }
                        `}
                    >
                        {(item?.status_concesion_equipo=="pendiente" ? "Pendiente":"Completo") }
                    </div>
                </td>
				<td className="px-4 py-2 ">
					<div className="flex items-center justify-center gap-2">
                    <div
						title="Editar"
						className="hover:cursor-pointer text-blue-500 hover:text-blue-600"
						onClick={() => handleViewEquipo(item, index)}
					>
						<Eye />
					</div>
					<div
						title="Editar"
						className="hover:cursor-pointer text-blue-500 hover:text-blue-600"
						onClick={() => handleNuevaDevolucion(item, index)}
					>
						<ArrowRightLeft/>
					</div>
					{/* <div
						title="Borrar"
						className="hover:cursor-pointer text-red-500 hover:text-red-600"
						onClick={() => handleDeleteEquipo(index)}
					>
						<Trash2 />
					</div> */}
					</div>
				</td>
				</tr>
			))) : (
				<tr>
				<td colSpan={8} className="text-center text-gray-500 py-4">
					No hay equipos agregados.
				</td>
				</tr>
			)}
			</tbody>
		</table>
        <div className="flex gap-2 items-center text-blue-500">
                <span className="flex font-bold text-lg"><Calculator/> Total:</span>
                <span className="font-bold text-lg">{0}</span>
        </div>

    </div>
  );
};

export default ConcesionadosSeguimientos;