/* eslint-disable react-hooks/exhaustive-deps */
import React, { Dispatch, SetStateAction, useState } from "react";
import { ArrowRightLeft, Calculator, Eye } from "lucide-react";
import { ConcesionadosAgregarEquipoModal } from "./modals/concesionados-agregar-equipos-modal";
import { Imagen } from "./upload-Image";
import { ConcesionadosDetalleSeguimiento } from "./modals/conceisonados-detalle-seg";

export interface EquipoConcesionado {
	categoria?: string;
	equipo?: string;
	unidades?: number;
	comentarios?: string;
	evidencia?: Imagen[];
	precio?: string;
	total?:string;
  }

interface AgregarEquiposListProps {
    equipos: EquipoConcesionado[];
    setEquipos: Dispatch<SetStateAction<EquipoConcesionado[]>>
}

const ConcesionadosSeguimientos:React.FC<AgregarEquiposListProps> = ({ equipos, setEquipos})=> {
	const [openAgregarEquiposModal, setOpenAgregarEquiposModal] = useState(false);
	const [openVerEquiposModal, setOpenVerEquiposModal] = useState(false);
	const [agregarEquipoSeleccion, setAgregarEquipoSeleccion] = useState<EquipoConcesionado>({});
	const [editarAgregarEquiposModal, setEditarAgregarEquiposModal] = useState(false)
	const [indiceSeleccionado, setIndiceSeleccionado]= useState<number | null>(null)

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

    return (
    <div>
		<div className="mt-3 flex justify-between">
			<div className="text-lg font-bold">Equipos</div>
			<div className="cursor-pointer  bg-blue-500 hover:bg-blue-600 text-white mr-5 rounded-md p-2 px-4 text-center text-sm" onClick={()=>{setOpenAgregarEquiposModal(!openAgregarEquiposModal);
				setEditarAgregarEquiposModal(false)
			}}>
				Agregar Equipo
			</div>
		</div>

		<ConcesionadosDetalleSeguimiento
		title={"Equipo"}
		setIsSuccess={setOpenVerEquiposModal}
		isSuccess={openVerEquiposModal}
		data={agregarEquipoSeleccion}
		>
			<div></div>
		</ConcesionadosDetalleSeguimiento>

		<ConcesionadosAgregarEquipoModal
                title="Nuevo Equipo"
                isSuccess={openAgregarEquiposModal}
                setIsSuccess={setOpenAgregarEquiposModal}
                agregarEquiposSeleccion={agregarEquipoSeleccion}
                setEquipos={setEquipos}
                setEditarAgregarEquiposModal={setEditarAgregarEquiposModal}
                editarAgregarEquiposModal={editarAgregarEquiposModal}
                indice={indiceSeleccionado} >
			<div></div>
		</ConcesionadosAgregarEquipoModal>

		
		<table className="min-w-full table-auto mb-5 border">
			<thead>
			<tr className="bg-gray-100">
				<th className="px-4 py-2 text-left border-b border-gray-300">Equipo</th>
				<th className="px-4 py-2 text-left border-b border-gray-300">Unidades</th>
				<th className="px-4 py-2 text-left border-b border-gray-300">Precio($)</th>
				<th></th>
			</tr>
			</thead>
			<tbody>
			{equipos && equipos.length > 0 ? (
			equipos.map((item, index) => (
				<tr key={index} className="border-t border-gray-200">
				<td className="px-4 py-2 max-w-[200px] truncate" title={item?.equipo || "-"}> {item?.equipo || "-"}</td>
				<td className="px-4 py-2">{item.unidades||"-"}</td>
				<td className="px-4 py-2"> 
                    <div
                        className={`inline-flex items-center justify-center px-2  text-sm font-semibold rounded-md border capitalize
                        ${
                            item.precio=="Pendiente"
                            ? "bg-red-100 text-red-700 border-red-700"
                            : "bg-green-100 text-green-700 border-green-700"
                        }
                        `}
                    >
                        {item?.precio}
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
						onClick={() => handleEditEquipo(item, index)}
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