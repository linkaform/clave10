/* eslint-disable react-hooks/exhaustive-deps */
import React, { Dispatch, SetStateAction, useState } from "react";
import { PersonasInvolucradas } from "@/lib/incidencias";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PersonasInvolucradasModal } from "./modals/add-personas-involucradas";

interface PersonasInvolucradasListProps {
	personasInvolucradas: PersonasInvolucradas[];
	setPersonasInvolucradas: Dispatch<SetStateAction<PersonasInvolucradas[]>>
}

const th = "px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-gray-600";
const td = "px-4 py-3 text-sm text-gray-700";
// Se guarda Masculino/Femenino; en pantalla se muestra Hombre/Mujer.
const SEXO_LABEL: Record<string, string> = { Masculino: "Hombre", Femenino: "Mujer" };
const siNo = (v?: string) => (v === "sí" ? "Sí" : v === "no" ? "No" : "-");

const SeccionPersonasInvolucradas: React.FC<PersonasInvolucradasListProps> = ({ personasInvolucradas, setPersonasInvolucradas }) => {
	const [openPersonasInvolucradasModal, setOpenPersonasInvolucradasModal] = useState(false);
	const [personasInvolucradasSeleccion, setPersonasInvolucradasSeleccion] = useState([]);
	const [editarPersonasInvolucradas, setEditarPersonasInvolucradas] = useState(false)
	const [indiceSeleccionado, setIndiceSeleccionado] = useState<number | null>(null)

	const handleEditPersonasInvolucradas = (item: any, index: number) => {
		setPersonasInvolucradasSeleccion(item);
		setIndiceSeleccionado(index);
		setEditarPersonasInvolucradas(true)
		setOpenPersonasInvolucradasModal(true);
	};

	const handleDeletePersonasInvolucradas = (index: number) => {
		const nuevas = [...personasInvolucradas];
		nuevas.splice(index, 1);
		setPersonasInvolucradas(nuevas);
		toast.success("Persona eliminada correctamente.")
	};

	return (
		<div>
			<div className="mb-3 flex items-center justify-between">
				<div className="flex items-baseline gap-2">
					<h3 className="text-base font-bold text-gray-900">Personas involucradas</h3>
					<span className="text-xs text-gray-400">
						{personasInvolucradas?.length ? `${personasInvolucradas.length} registrada${personasInvolucradas.length === 1 ? "" : "s"}` : "Opcional"}
					</span>
				</div>
				<button
					type="button"
					className="flex items-center gap-1.5 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
					onClick={() => {
						setEditarPersonasInvolucradas(false)
						setOpenPersonasInvolucradasModal(true);
					}}>
					<Plus className="h-4 w-4" />
					Agregar
				</button>
			</div>

			<PersonasInvolucradasModal
				title="Persona involucrada"
				isSuccess={openPersonasInvolucradasModal}
				setIsSuccess={setOpenPersonasInvolucradasModal}
				personasInvolucradasSeleccion={personasInvolucradasSeleccion}
				setPersonasInvolucradas={setPersonasInvolucradas}
				setEditarPersonasInvolucradas={setEditarPersonasInvolucradas}
				editarPersonasInvolucradas={editarPersonasInvolucradas}
				indice={indiceSeleccionado}
				setPersonasInvolucradasSeleccion={setPersonasInvolucradasSeleccion}>
				<div></div>
			</PersonasInvolucradasModal>

			<div className="overflow-x-auto rounded-xl border border-gray-200">
				<table className="min-w-full">
					<thead className="bg-blue-50">
						<tr>
							<th className={`${th} w-24`}></th>
							<th className={th}>Nombre completo</th>
							<th className={th}>Relación con el sitio</th>
							<th className={th}>Rol</th>
							<th className={th}>Sexo</th>
							<th className={th}>Atención médica</th>
							<th className={th}>Detenido</th>
							<th className={th}>Comentarios</th>
						</tr>
					</thead>
					<tbody>
						{personasInvolucradas && personasInvolucradas.length > 0 ? (
							personasInvolucradas.map((item, index) => (
								<tr key={index} className="border-t border-gray-100">
									<td className={td}>
										<div className="flex items-center gap-1.5">
											<button type="button" title="Editar" className="rounded-lg bg-gray-100 p-2 text-gray-600 hover:bg-blue-50 hover:text-blue-600" onClick={() => handleEditPersonasInvolucradas(item, index)}>
												<Pencil className="h-4 w-4" />
											</button>
											<button type="button" title="Borrar" className="rounded-lg bg-gray-100 p-2 text-gray-600 hover:bg-red-50 hover:text-red-600" onClick={() => handleDeletePersonasInvolucradas(index)}>
												<Trash2 className="h-4 w-4" />
											</button>
										</div>
									</td>
									<td className={`${td} font-medium text-gray-900`}>{item.nombre_completo || "-"}</td>
									<td className={td}>{item.puesto || "-"}</td>
									<td className={td}>
										{[item.rol, item.grupo_etario].filter(Boolean).join(" · ") || "-"}
									</td>
									<td className={td}>{SEXO_LABEL[item.sexo] || item.sexo || "-"}</td>
									<td className={td}>{siNo(item.atencion_medica)}</td>
									<td className={td}>{siNo(item.retenido)}</td>
									<td className={`${td} max-w-[240px] whitespace-normal break-words`}>{item?.comentarios || "-"}</td>
								</tr>
							))
						) : (
							<tr>
								<td colSpan={8} className="py-6 text-center text-sm text-gray-500">
									No hay personas involucradas.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
};

export default SeccionPersonasInvolucradas;
