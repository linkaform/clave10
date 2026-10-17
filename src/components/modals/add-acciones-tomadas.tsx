/* eslint-disable react-hooks/exhaustive-deps */
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import useAuthStore from "@/store/useAuthStore";

interface IncidenciaModalProps {
	title: string;
	children: React.ReactNode;
	isSuccess: boolean;
	setIsSuccess: Dispatch<SetStateAction<boolean>>;
	setAccionesTomadas: Dispatch<SetStateAction<any>>;
	indice: number | null;
	editarAccionesTomadas: boolean;
	setEditarAccionesTomadas: Dispatch<SetStateAction<any>>;
	accionesTomadasSeleccion: any;
}

const AUTORIDADES = [
	"911 Emergencias",
	"Bomberos",
	"Cruz Roja Mexicana",
	"DIF Municipal / Estatal (Desarrollo Integral de la Familia)",
	"Policía Municipal / Estatal",
	"Servicios Médicos de Emergencia",
	"Tránsito Municipal / Estatal",
];
const SI_NO = [
	{ value: "sí", label: "Sí" },
	{ value: "no", label: "No" },
];

const VACIO = {
	acciones_tomadas: "",
	llamo_a_policia: "",
	autoridad: "",
	numero_folio_referencia: "",
	responsable: "",
};

const label = "text-[11px] font-bold uppercase tracking-wide text-gray-600";

export const AccionesTomadasModal: React.FC<IncidenciaModalProps> = ({
	children,
	isSuccess,
	setIsSuccess,
	setAccionesTomadas,
	indice,
	editarAccionesTomadas,
	setEditarAccionesTomadas,
	accionesTomadasSeleccion,
}) => {
	const { userNameSoter } = useAuthStore();
	const [datos, setDatos] = useState(VACIO);
	const set = (campo: keyof typeof VACIO) => (valor: string) => setDatos((prev) => ({ ...prev, [campo]: valor }));

	useEffect(() => {
		if (!isSuccess) return;
		setDatos(editarAccionesTomadas && accionesTomadasSeleccion ? { ...VACIO, ...accionesTomadasSeleccion } : VACIO);
	}, [isSuccess]);

	const puedeGuardar = !!datos.acciones_tomadas.trim() && !!datos.llamo_a_policia;

	const handleClose = () => {
		setIsSuccess(false);
		setEditarAccionesTomadas(false);
	};

	const handleGuardar = () => {
		if (!puedeGuardar) return;
		const formatData = {
			...datos,
			acciones_tomadas: datos.acciones_tomadas.trim(),
			// Autoridad y folio solo aplican si se contactó a las autoridades.
			autoridad: datos.llamo_a_policia === "sí" ? datos.autoridad : "",
			numero_folio_referencia: datos.llamo_a_policia === "sí" ? datos.numero_folio_referencia : "",
		};
		if (editarAccionesTomadas) {
			setAccionesTomadas((prev: any[]) => prev.map((item, i) => (i === indice ? formatData : item)));
			toast.success("Acción editada correctamente.");
		} else {
			setAccionesTomadas((prev: any) => [...prev, formatData]);
			toast.success("Acción agregada correctamente.");
		}
		handleClose();
	};

	return (
		<Dialog onOpenChange={(open) => (open ? setIsSuccess(true) : handleClose())} open={isSuccess} modal>
			<DialogContent
				className="max-w-xl max-h-[90vh] overflow-y-auto p-6 gap-0"
				onInteractOutside={(e) => e.preventDefault()}
				onOpenAutoFocus={(e) => e.preventDefault()}
				aria-describedby="">
				<DialogTitle className="text-xl font-bold text-gray-900">Acción tomada</DialogTitle>
				<p className="mt-1 text-sm text-gray-500">Describe lo que se hizo en el momento.</p>

				<div className="mt-5 space-y-5">
					<div>
						<p className={label}>
							Acción <span className="text-red-500">*</span>
						</p>
						<Textarea
							className="mt-2 resize-none focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:ring-offset-0"
							rows={4}
							placeholder="Ej. Se aseguró el área y se acordonó la puerta."
							value={datos.acciones_tomadas}
							onChange={(e) => set("acciones_tomadas")(e.target.value)}
						/>
					</div>

					<div className="grid grid-cols-1 gap-5 md:grid-cols-2">
						<div>
							<p className={label}>
								¿Se contactó a las autoridades? <span className="text-red-500">*</span>
							</p>
							<div className="mt-1.5 grid h-11 grid-cols-2 overflow-hidden rounded-lg border border-gray-200">
								{SI_NO.map((o) => (
									<button
										key={o.value}
										type="button"
										onClick={() => set("llamo_a_policia")(o.value)}
										className={`border-r border-gray-200 text-sm last:border-r-0 transition-colors ${
											datos.llamo_a_policia === o.value
												? "bg-blue-600 font-semibold text-white"
												: "text-gray-600 hover:bg-gray-50"
										}`}>
										{o.label}
									</button>
								))}
							</div>
						</div>
						<div>
							<p className={label}>Responsable de ejecutarla</p>
							<div className="mt-1.5 flex gap-2">
								<Input
									className="h-11"
									placeholder="Nombre"
									value={datos.responsable}
									onChange={(e) => set("responsable")(e.target.value)}
								/>
								{userNameSoter && (
									<Button
										type="button"
										className="h-11 shrink-0 bg-blue-500 hover:bg-blue-600 text-white"
										onClick={() => set("responsable")(userNameSoter)}>
										<Check className="mr-1 h-4 w-4" />
										Fui yo
									</Button>
								)}
							</div>
						</div>
					</div>

					{datos.llamo_a_policia === "sí" && (
						<div className="grid grid-cols-1 gap-5 md:grid-cols-2">
							<div>
								<p className={label}>Autoridad</p>
								<Select value={datos.autoridad || undefined} onValueChange={set("autoridad")}>
									<SelectTrigger className="mt-1.5 h-11 w-full">
										<SelectValue placeholder="Selecciona la autoridad" />
									</SelectTrigger>
									<SelectContent>
										{AUTORIDADES.map((a) => (
											<SelectItem key={a} value={a}>
												{a}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div>
								<p className={label}>Número de folio o referencia</p>
								<Input
									className="mt-1.5 h-11"
									placeholder="Folio que dio la autoridad"
									value={datos.numero_folio_referencia}
									onChange={(e) => set("numero_folio_referencia")(e.target.value)}
								/>
							</div>
						</div>
					)}
				</div>

				<div className="mt-6 flex gap-3">
					<Button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700" onClick={handleClose}>
						Cancelar
					</Button>
					<Button className="w-full bg-blue-500 hover:bg-blue-600 text-white" onClick={handleGuardar} disabled={!puedeGuardar}>
						Guardar
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};
