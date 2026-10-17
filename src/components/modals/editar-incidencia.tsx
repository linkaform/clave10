import { Dispatch, SetStateAction } from "react";
import { AddIncidenciaModal } from "./add-incidencia";

interface EditarIncidenciaModalProps {
	title: string;
	data: any;
	selectedIncidencia: string;
	onClose: () => void;
	setModalEditarAbierto: Dispatch<SetStateAction<boolean>>;
	modalEditarAbierto: boolean;
	tab: string;
	setTab: Dispatch<SetStateAction<string>>;
}

// Editar usa el mismo modal que crear (AddIncidenciaModal) en modo edición:
// se llena con la incidencia y guarda con update_incidence.
export const EditarIncidenciaModal: React.FC<EditarIncidenciaModalProps> = ({
	data,
	onClose,
	modalEditarAbierto,
	setModalEditarAbierto,
	tab,
	setTab,
}) => (
	<AddIncidenciaModal
		title={data?.folio ? `Editar ${data.folio}` : "Editar incidencia"}
		isSuccess={modalEditarAbierto}
		setIsSuccess={setModalEditarAbierto}
		onClose={onClose}
		incidencia={data}
		tab={tab}
		setTab={setTab}
	/>
);
