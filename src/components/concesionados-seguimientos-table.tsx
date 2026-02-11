/* eslint-disable react-hooks/exhaustive-deps */
import React, { Dispatch, SetStateAction, useState } from "react";
import { ArrowLeftRightIcon, Calculator, Eye } from "lucide-react";
import { Imagen } from "./upload-Image";
import { ConcesionadosVerEquipo } from "./modals/concesionados-ver-equipo";
import { capitalizeFirstLetter, formatCurrency } from "@/lib/utils";

export interface EquipoConcesionado {
	id_movimiento?:string;
	categoria_equipo_concesion?: string;
	nombre_equipo?: string;
	costo_equipo_concesion?: number; 
	imagen_equipo_concesion?: Imagen[]; 
	cantidad_equipo_concesion?: number;
	evidencia_entrega?: Imagen[];      
	comentario_entrega?: string;

	status_concesion_equipo?: string;
	total?:number;
  }



interface AgregarEquiposListProps {
    equipos: EquipoConcesionado[];
    setEquipos: Dispatch<SetStateAction<EquipoConcesionado[]>>
	mode: "vista" | "editar"
}

const ConcesionadosSegEquipos:React.FC<AgregarEquiposListProps> = ({ equipos, mode})=> {
	const [openAgregarEquiposModal, setOpenAgregarEquiposModal] = useState(false);
	const [openVerEquiposModal, setOpenVerEquiposModal] = useState(false);
	const [agregarEquipoSeleccion, setAgregarEquipoSeleccion] = useState({});
	const [editarAgregarEquiposModal, setEditarAgregarEquiposModal] = useState(false)
	const [indiceSeleccionado, setIndiceSeleccionado]= useState<number | null>(null)
	console.log(editarAgregarEquiposModal, indiceSeleccionado)


	const handleViewEquipo = (item: any, index: number) => {
		setAgregarEquipoSeleccion(item);
		setIndiceSeleccionado(index);
		setEditarAgregarEquiposModal(false)
		setOpenVerEquiposModal(true);
	};

	const handleEditEquipo = (item: any, index: number) => {
		setAgregarEquipoSeleccion(item);
		setIndiceSeleccionado(index);
		setEditarAgregarEquiposModal(true)
		setOpenAgregarEquiposModal(true);
	};
	
	// const handleDeleteEquipo  = (index: number) => {
	// 	const nuevaspersonasInvolucradas = [...equipos];
	// 	nuevaspersonasInvolucradas.splice(index, 1);
	// 	setEquipos(nuevaspersonasInvolucradas);
	// 	toast.success("Seguimiento eliminado correctamente.")
	// };
	const totalGeneral = equipos.reduce((acc, item) => {
		const totalItem = item.total ? (item.total) : 0;
		console.log(item)
		return acc + totalItem;
	  }, 0);
	const totalGeneral2 = equipos.reduce((acc, item) => {
	const cantidad = item.cantidad_equipo_concesion ?? 0;
	const costo = item.costo_equipo_concesion ?? 0; 
	return acc + cantidad * costo;
	}, 0);
    return (
    <div >
		{mode=="editar"&&
		<div className="mt-3 flex justify-between">
			<div className="text-lg font-bold">Equipos</div>
			<div className="cursor-pointer  bg-blue-500 hover:bg-blue-600 text-white mr-5 rounded-md p-2 px-4 text-center text-sm" onClick={()=>{setOpenAgregarEquiposModal(!openAgregarEquiposModal);
				setEditarAgregarEquiposModal(false)
			}}>
				Agregar Equipo
			</div>
		</div>}

		<ConcesionadosVerEquipo
		title={"Equipo"}
		setIsSuccess={setOpenVerEquiposModal}
		isSuccess={openVerEquiposModal}
		data={agregarEquipoSeleccion as any}
		>
			<div></div>
		</ConcesionadosVerEquipo>


		{/* <NuevaDevolucionEquipoModal 	
			title={"Devolución de Equipos"}
			setIsSuccess={setNuevaDevolucionEquiposModal}
			isSuccess={nuevaDevolucionModal}
			equipoSelecionado={agregarEquipoSeleccion}
		>
			<div></div>
		</NuevaDevolucionEquipoModal> */}

        
		{/* <ConcesionadosAgregarEquipoModal
                title="Nuevo Equipo"
                isSuccess={openAgregarEquiposModal}
                setIsSuccess={setOpenAgregarEquiposModal}
                agregarEquiposSeleccion={agregarEquipoSeleccion}
                setEquipos={setEquipos}
                setEditarAgregarEquiposModal={setEditarAgregarEquiposModal}
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
				<td className="px-4 py-2 max-w-[200px] truncate" title={item?.nombre_equipo || "-"}> {item?.nombre_equipo || "-"} </td>
				<td className="px-4 py-2">{item?.cantidad_equipo_concesion||"-"}</td>
                <td className="px-4 py-2">
                <span className={`px-3 py-1 rounded-md text-sm font-bold border-2 ${
                    item.status_concesion_equipo === "abierto" 
                    ? "bg-green-100 text-green-700 border-green-700" 
                    : item.status_concesion_equipo === "pendiente"
                    ? "bg-red-100 text-red-700 border-red-700"
                    : "bg-gray-100 text-gray-700 border-gray-700"
                }`}>
                    {capitalizeFirstLetter(item.status_concesion_equipo??"")}
                </span>
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
					<div className="flex gap-2">
						<div
							title="Editar"
							className="hover:cursor-pointer text-blue-500 hover:text-blue-600"
							onClick={() => handleEditEquipo(item, index)}
						>
							<ArrowLeftRightIcon />
						</div>
					</div>
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
                <span className="font-bold text-lg">{formatCurrency(totalGeneral || totalGeneral2)}</span>
        </div>

    </div>
  );
};

export default ConcesionadosSegEquipos;