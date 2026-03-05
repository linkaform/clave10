/* eslint-disable react-hooks/exhaustive-deps */
import React, { Dispatch, SetStateAction, useState } from "react";
import { ArrowLeftRightIcon, Calculator, Eye } from "lucide-react";
import { Imagen } from "./upload-Image";
import { ConcesionadosVerEquipo } from "./modals/concesionados-ver-equipo";
import { capitalizeFirstLetter, formatCurrency } from "@/lib/utils";
import { NuevaDevolucionEquipoModal } from "./modals/concesionados-nueva-devolucion";

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
	onDevolver: (equipo: EquipoConcesionado)=>void
	data:any
}

const ConcesionadosSegEquipos:React.FC<AgregarEquiposListProps> = ({ equipos, mode,data})=> {
	const [openAgregarEquiposModal, setOpenAgregarEquiposModal] = useState(false);
	const [openVerEquiposModal, setOpenVerEquiposModal] = useState(false);
	const [agregarEquipoSeleccion, setAgregarEquipoSeleccion] = useState({});
	const [editarAgregarEquiposModal, setEditarAgregarEquiposModal] = useState(false)
	const [indiceSeleccionado, setIndiceSeleccionado]= useState<number | null>(null)
	console.log(editarAgregarEquiposModal, indiceSeleccionado)
	const [openDevolucionEquiposModal, setOpenDevolucionEquiposModal] = useState(false);

	const handleViewEquipo = (item: any, index: number) => {
		setAgregarEquipoSeleccion(item);
		setIndiceSeleccionado(index);
		setEditarAgregarEquiposModal(false)
		setOpenVerEquiposModal(true);
	};

	const handleDevolverEquipo = (item: any, index: number) => {
		setAgregarEquipoSeleccion(item);
		// onDevolver(item)
		setIndiceSeleccionado(index);
		// setEditarAgregarEquiposModal(true)
		setOpenDevolucionEquiposModal(true);
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
		dataConcesion={data}
		>
			<div></div>
		</ConcesionadosVerEquipo>


		<NuevaDevolucionEquipoModal 	
				title={"Devolución de Equipos"}
				setIsSuccess={setOpenDevolucionEquiposModal}
				isSuccess={openDevolucionEquiposModal}
				equipoSelecionado={agregarEquipoSeleccion} dataConcesion={data}		>
			<div></div>
		</NuevaDevolucionEquipoModal>

        
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

		
		<table className="min-w-full table-auto mb-5">
		<thead>
			<tr className="bg-gray-100 border border-gray-200">
			<th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Equipo</th>
			<th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Unidades</th>
			<th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Precio</th>
			<th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Estatus</th>
			<th></th>
			</tr>
		</thead>
		<tbody className="border border-gray-200 divide-y divide-gray-100">
			{equipos && equipos.length > 0 ? (
			equipos.map((item, index) => (
				<tr key={index} className="hover:bg-gray-50 transition-colors">
				<td className="px-4 py-3 text-sm text-gray-700 max-w-[200px] truncate" title={item?.nombre_equipo || "-"}>
					{item?.nombre_equipo || "-"}
				</td>
				<td className="px-4 py-3 text-sm text-gray-700">
					{item?.cantidad_equipo_concesion || "-"}
				</td>
				<td className="px-4 py-3 text-sm text-gray-700">
					{formatCurrency((item.costo_equipo_concesion ?? 0) * (item.cantidad_equipo_concesion ?? 0))}
				</td>
				<td className="px-4 py-3">
					<span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
						item.status_concesion_equipo === "devuelto"
						? "bg-green-100 text-green-700"
						: item.status_concesion_equipo === "pendiente"
						? "bg-yellow-100 text-yellow-700"
						: item.status_concesion_equipo === "en proceso"
						? "bg-yellow-100 text-yellow-700"
						: item.status_concesion_equipo === "abierto"
						? "bg-red-100 text-red-600"
						: item.status_concesion_equipo === "damage"
						? "bg-red-100 text-red-600"
						: "bg-gray-100 text-gray-600"
					}`}>
					{capitalizeFirstLetter(item.status_concesion_equipo ?? "")}
					</span>
				</td>
				<td className="px-4 py-3 flex">
					<div className="flex items-center justify-center gap-3">
					<div
						title="Ver"
						className="hover:cursor-pointer text-blue-400 hover:text-blue-600 transition-colors"
						onClick={() => handleViewEquipo(item, index)}
					>
						<Eye className="w-5 h-5" />
					</div>
					{item.status_concesion_equipo!=="devuelto"&&
					<div
						title="Devolver"
						className="hover:cursor-pointer text-blue-400 hover:text-blue-600 transition-colors"
						onClick={() => handleDevolverEquipo(item, index)}
					>
						<ArrowLeftRightIcon className="w-5 h-5" />
					</div>}
					</div>
				</td>
				</tr>
			))
			) : (
			<tr>
				<td colSpan={5} className="text-center text-gray-400 py-6 text-sm">
				No hay equipos agregados.
				</td>
			</tr>
			)}
		</tbody>
		</table>

		<div className="flex gap-2 items-center text-blue-500">
		<span className="flex font-bold text-lg"><Calculator /> Total:</span>
		<span className="font-bold text-lg">{formatCurrency(totalGeneral || totalGeneral2)}</span>
		</div>

    </div>
  );
};

export default ConcesionadosSegEquipos;