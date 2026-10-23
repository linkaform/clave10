/* eslint-disable react-hooks/exhaustive-deps */
import React, { Dispatch, SetStateAction, useState } from "react";
import { AccionesTomadas } from "@/lib/incidencias";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AccionesTomadasModal } from "./modals/add-acciones-tomadas";

interface PersonasInvolucradasListProps {
	accionesTomadas: AccionesTomadas[];
	setAccionesTomadas: Dispatch<SetStateAction<AccionesTomadas[]>>
}

const th = "px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-gray-600";
const td = "px-4 py-3 text-sm text-gray-700";

const SeccionAccionesTomadas: React.FC<PersonasInvolucradasListProps> = ({ accionesTomadas, setAccionesTomadas }) => {
	const [openAccionesTomadasModal, setOpenAccionesTomadasModal] = useState(false);
	const [accionesTomadasSeleccion, setAccionesTomadasSeleccion] = useState([]);
	const [editarAccionesTomadas, setEditarAccionesTomadas] = useState(false)
	const [indiceSeleccionado, setIndiceSeleccionado] = useState<number | null>(null)

	const handleEditAccionesTomadas = (item: any, index: number) => {
		setAccionesTomadasSeleccion(item);
		setIndiceSeleccionado(index);
		setEditarAccionesTomadas(true)
		setOpenAccionesTomadasModal(true);
	};

	const handleDeleteAccionesTomadas = (index: number) => {
		const nuevas = [...accionesTomadas];
		nuevas.splice(index, 1);
		setAccionesTomadas(nuevas);
		toast.success("Acción eliminada correctamente.")
	};

	// "Autoridades": la autoridad (y folio) si se contactó, o "No".
	const autoridades = (item: AccionesTomadas) => {
		if (item.llamo_a_policia !== "sí") return item.llamo_a_policia ? "No" : "-";
		return [item.autoridad || "Sí", item.numero_folio_referencia && `Folio ${item.numero_folio_referencia}`]
			.filter(Boolean)
			.join(" · ");
	};

	return (
		<div>
			<div className="mb-3 flex items-center justify-between">
				<div className="flex items-baseline gap-2">
					<h3 className="text-base font-bold text-gray-900">Acciones tomadas</h3>
					<span className="text-xs text-gray-400">
						{accionesTomadas?.length ? `${accionesTomadas.length} registrada${accionesTomadas.length === 1 ? "" : "s"}` : "Opcional"}
					</span>
				</div>
				<button
					type="button"
					className="flex items-center gap-1.5 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
					onClick={() => {
						setEditarAccionesTomadas(false)
						setOpenAccionesTomadasModal(true);
					}}>
					<Plus className="h-4 w-4" />
					Agregar
				</button>
			</div>

			<AccionesTomadasModal
				title="Acción tomada"
				isSuccess={openAccionesTomadasModal}
				setIsSuccess={setOpenAccionesTomadasModal}
				accionesTomadasSeleccion={accionesTomadasSeleccion}
				setAccionesTomadas={setAccionesTomadas}
				setEditarAccionesTomadas={setEditarAccionesTomadas}
				editarAccionesTomadas={editarAccionesTomadas}
				indice={indiceSeleccionado}>
				<div></div>
			</AccionesTomadasModal>

			<div className="overflow-x-auto rounded-xl border border-gray-200">
				<table className="min-w-full">
					<thead className="bg-blue-50">
						<tr>
							<th className={`${th} w-24`}></th>
							<th className={th}>Acción tomada</th>
							<th className={th}>Autoridades</th>
							<th className={th}>Responsable</th>
						</tr>
					</thead>
					<tbody>
						{accionesTomadas && accionesTomadas.length > 0 ? (
							accionesTomadas.map((item, index) => (
								<tr key={index} className="border-t border-gray-100">
									<td className={td}>
										<div className="flex items-center gap-1.5">
											<button type="button" title="Editar" className="rounded-lg bg-gray-100 p-2 text-gray-600 hover:bg-blue-50 hover:text-blue-600" onClick={() => handleEditAccionesTomadas(item, index)}>
												<Pencil className="h-4 w-4" />
											</button>
											<button type="button" title="Borrar" className="rounded-lg bg-gray-100 p-2 text-gray-600 hover:bg-red-50 hover:text-red-600" onClick={() => handleDeleteAccionesTomadas(index)}>
												<Trash2 className="h-4 w-4" />
											</button>
										</div>
									</td>
									<td className={`${td} max-w-[360px] whitespace-normal break-words`}>{item?.acciones_tomadas || "-"}</td>
									<td className={td}>{autoridades(item)}</td>
									<td className={td}>{item.responsable || "-"}</td>
								</tr>
							))
						) : (
							<tr>
								<td colSpan={4} className="py-6 text-center text-sm text-gray-500">
									No hay acciones tomadas.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
};

export default SeccionAccionesTomadas;
