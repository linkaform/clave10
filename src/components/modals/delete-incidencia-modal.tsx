/* eslint-disable react-hooks/exhaustive-deps */
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";
import { Loader2, TriangleAlert } from "lucide-react";
import { useEliminarIncidencia } from "@/hooks/Incidencias/useEliminarIncidencias";

interface AddFallaModalProps {
	title: string;
	arrayFolios: any[];
	setModalEliminarAbierto: Dispatch<SetStateAction<boolean>>;
	modalEliminarAbierto: boolean;
}

// Se muestran como máximo estos folios; el resto se resume en "+N más".
const MAX_FOLIOS = 6;

export const EliminarIncidenciaModal: React.FC<AddFallaModalProps> = ({
	arrayFolios,
	setModalEliminarAbierto,
	modalEliminarAbierto,
}) => {
	const eliminarIncidenciaMutation = useEliminarIncidencia();
	const eliminando = eliminarIncidenciaMutation.isPending;

	// Llegan como folios (string) o como registros de incidencia.
	const folios: string[] = (arrayFolios ?? []).map((item) => (typeof item === "string" ? item : item?.folio)).filter(Boolean);
	const varias = folios.length > 1;

	const handleClose = () => {
		setModalEliminarAbierto(false);
	};

	const eliminar = () => {
		if (folios.length === 0) {
			toast.error("Selecciona una incidencia para poder eliminarla.");
			return;
		}
		eliminarIncidenciaMutation.mutate(
			{ folio: folios },
			{
				onSuccess: () => handleClose(),
				onError: () => handleClose(),
			},
		);
	};

	return (
		<Dialog onOpenChange={setModalEliminarAbierto} open={modalEliminarAbierto} modal>
			<DialogContent
				className="max-w-md p-6 gap-0"
				aria-describedby=""
				onInteractOutside={(e) => e.preventDefault()}
				onOpenAutoFocus={(e) => e.preventDefault()}>
				<div className="flex items-start gap-4">
					<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50">
						<TriangleAlert className="h-5 w-5 text-red-600" />
					</div>
					<div className="min-w-0">
						<DialogTitle className="text-lg font-bold text-gray-900">
							{varias ? `Eliminar ${folios.length} incidencias` : "Eliminar incidencia"}
						</DialogTitle>
						<p className="mt-1 text-sm text-gray-500">
							{varias
								? "¿Seguro que quieres eliminar las incidencias seleccionadas? Esta acción no se puede deshacer."
								: "¿Seguro que quieres eliminar esta incidencia? Esta acción no se puede deshacer."}
						</p>
					</div>
				</div>

				{folios.length > 0 && (
					<div className="mt-4 flex flex-wrap gap-1.5 rounded-lg bg-gray-50 p-3">
						{folios.slice(0, MAX_FOLIOS).map((folio) => (
							<span
								key={folio}
								className="rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-gray-700">
								{folio}
							</span>
						))}
						{folios.length > MAX_FOLIOS && (
							<span className="px-1 py-0.5 text-xs text-gray-500">+{folios.length - MAX_FOLIOS} más</span>
						)}
					</div>
				)}

				<div className="mt-6 flex gap-3">
					<Button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700" onClick={handleClose} disabled={eliminando}>
						Cancelar
					</Button>
					<Button className="w-full bg-red-600 hover:bg-red-700 text-white" onClick={eliminar} disabled={eliminando}>
						{eliminando ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Eliminando...
							</>
						) : (
							"Eliminar"
						)}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};
