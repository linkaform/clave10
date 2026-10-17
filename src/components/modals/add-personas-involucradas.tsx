/* eslint-disable react-hooks/exhaustive-deps */
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import { toast } from "sonner";

interface IncidenciaModalProps {
	title: string;
	children: React.ReactNode;
	isSuccess: boolean;
	setIsSuccess: Dispatch<SetStateAction<boolean>>;
	setPersonasInvolucradas: Dispatch<SetStateAction<any>>;
	indice: number | null;
	editarPersonasInvolucradas: boolean;
	setEditarPersonasInvolucradas: Dispatch<SetStateAction<any>>;
	personasInvolucradasSeleccion: any;
	setPersonasInvolucradasSeleccion: Dispatch<SetStateAction<any>>;
}

const ROLES = ["Testigo", "Afectado", "Agresor", "Sospechoso", "Responsable", "Otro"];
const SEXOS = [
	{ value: "Masculino", label: "Hombre" },
	{ value: "Femenino", label: "Mujer" },
];
const GRUPOS_ETARIOS = ["Infancia", "Adolescencia", "Juventud", "Adultez temprana", "Adultez media", "Adultez mayor"];
const SI_NO = [
	{ value: "sí", label: "Sí" },
	{ value: "no", label: "No" },
];

const VACIO = {
	nombre_completo: "",
	puesto: "",
	rol: "",
	sexo: "",
	grupo_etario: "",
	atencion_medica: "",
	retenido: "",
	comentarios: "",
};

const label = "text-[11px] font-bold uppercase tracking-wide text-gray-600";

const Segmentado = ({
	opciones,
	value,
	onChange,
}: {
	opciones: { value: string; label: string }[];
	value: string;
	onChange: (v: string) => void;
}) => (
	<div className="mt-1.5 grid h-11 overflow-hidden rounded-lg border border-gray-200" style={{ gridTemplateColumns: `repeat(${opciones.length}, 1fr)` }}>
		{opciones.map((o) => (
			<button
				key={o.value}
				type="button"
				onClick={() => onChange(value === o.value ? "" : o.value)}
				className={`border-r border-gray-200 text-sm last:border-r-0 transition-colors ${
					value === o.value ? "bg-blue-600 font-semibold text-white" : "text-gray-600 hover:bg-gray-50"
				}`}>
				{o.label}
			</button>
		))}
	</div>
);

export const PersonasInvolucradasModal: React.FC<IncidenciaModalProps> = ({
	isSuccess,
	setIsSuccess,
	setPersonasInvolucradas,
	indice,
	editarPersonasInvolucradas,
	setEditarPersonasInvolucradas,
	personasInvolucradasSeleccion,
	setPersonasInvolucradasSeleccion,
}) => {
	const [datos, setDatos] = useState(VACIO);
	const set = (campo: keyof typeof VACIO) => (valor: string) => setDatos((prev) => ({ ...prev, [campo]: valor }));

	useEffect(() => {
		if (!isSuccess) return;
		setDatos(
			editarPersonasInvolucradas && personasInvolucradasSeleccion
				? { ...VACIO, ...personasInvolucradasSeleccion }
				: VACIO,
		);
	}, [isSuccess]);

	const handleClose = () => {
		setIsSuccess(false);
		setEditarPersonasInvolucradas(false);
		setPersonasInvolucradasSeleccion({});
	};

	const handleGuardar = () => {
		if (!datos.nombre_completo.trim()) return;
		const formatData = {
			...datos,
			nombre_completo: datos.nombre_completo.trim(),
			// El grupo etario solo aplica a sospechosos.
			grupo_etario: datos.rol === "Sospechoso" ? datos.grupo_etario : "",
		};
		if (editarPersonasInvolucradas) {
			setPersonasInvolucradas((prev: any[]) => prev.map((item, i) => (i === indice ? formatData : item)));
			toast.success("Registro editado correctamente.");
		} else {
			setPersonasInvolucradas((prev: any) => [...prev, formatData]);
			toast.success("Registro agregado correctamente.");
		}
		handleClose();
	};

	return (
		<Dialog onOpenChange={(open) => (open ? setIsSuccess(true) : handleClose())} open={isSuccess}>
			<DialogContent
				className="max-w-xl max-h-[90vh] overflow-y-auto p-6 gap-0"
				onInteractOutside={(e) => e.preventDefault()}
				onOpenAutoFocus={(e) => e.preventDefault()}
				aria-describedby="">
				<DialogTitle className="text-xl font-bold text-gray-900">Persona involucrada</DialogTitle>
				<p className="mt-1 text-sm text-gray-500">Registra a quien participó o presenció la incidencia.</p>

				<div className="mt-5 space-y-5">
					<div>
						<p className={label}>
							Nombre completo <span className="text-red-500">*</span>
						</p>
						<Input
							className="mt-1.5 h-11"
							placeholder="Nombre y apellidos"
							value={datos.nombre_completo}
							onChange={(e) => set("nombre_completo")(e.target.value)}
						/>
					</div>

					<div className="grid grid-cols-1 gap-5 md:grid-cols-2">
						<div>
							<p className={label}>Relación con el sitio</p>
							<Input
								className="mt-1.5 h-11"
								placeholder="Ej. Colaborador, visitante, proveedor"
								value={datos.puesto}
								onChange={(e) => set("puesto")(e.target.value)}
							/>
						</div>
						<div>
							<p className={label}>Sexo</p>
							<Segmentado opciones={SEXOS} value={datos.sexo} onChange={set("sexo")} />
						</div>
					</div>

					<div>
						<p className={label}>Rol</p>
						<div className="mt-1.5 flex flex-wrap gap-2">
							{ROLES.map((rol) => (
								<button
									key={rol}
									type="button"
									onClick={() => set("rol")(datos.rol === rol ? "" : rol)}
									className={`rounded-full border px-4 py-2 text-sm transition-colors ${
										datos.rol === rol
											? "border-blue-600 bg-blue-600 font-semibold text-white"
											: "border-gray-200 text-gray-700 hover:bg-gray-50"
									}`}>
									{rol}
								</button>
							))}
						</div>
					</div>

					{datos.rol === "Sospechoso" && (
						<div>
							<p className={label}>Grupo etario</p>
							<div className="mt-1.5 flex flex-wrap gap-2">
								{GRUPOS_ETARIOS.map((g) => (
									<button
										key={g}
										type="button"
										onClick={() => set("grupo_etario")(datos.grupo_etario === g ? "" : g)}
										className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
											datos.grupo_etario === g
												? "border-blue-600 bg-blue-600 font-semibold text-white"
												: "border-gray-200 text-gray-700 hover:bg-gray-50"
										}`}>
										{g}
									</button>
								))}
							</div>
						</div>
					)}

					<div className="grid grid-cols-1 gap-5 md:grid-cols-2">
						<div>
							<p className={label}>¿Recibió atención médica?</p>
							<Segmentado opciones={SI_NO} value={datos.atencion_medica} onChange={set("atencion_medica")} />
						</div>
						<div>
							<p className={label}>¿Fue detenida?</p>
							<Segmentado opciones={SI_NO} value={datos.retenido} onChange={set("retenido")} />
						</div>
					</div>

					<div>
						<p className={label}>Comentarios / observaciones</p>
						<Textarea
							className="mt-2 resize-none focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:ring-offset-0"
							rows={4}
							placeholder="Descripción física, vestimenta, lesiones, etc."
							value={datos.comentarios}
							onChange={(e) => set("comentarios")(e.target.value)}
						/>
					</div>
				</div>

				<div className="mt-6 flex gap-3">
					<Button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700" onClick={handleClose}>
						Cancelar
					</Button>
					<Button
						className="w-full bg-blue-500 hover:bg-blue-600 text-white"
						onClick={handleGuardar}
						disabled={!datos.nombre_completo.trim()}>
						Guardar
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};
