/* eslint-disable react-hooks/exhaustive-deps */
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { calcularTiempoDesdeIncidencia, convertirDateToISO, formatDateToString } from "@/lib/utils";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import { Imagen } from "../upload-Image";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { useSeguimientoIncidencia } from "@/hooks/Incidencias/useSeguimientoIncidencia";
import { EvidenciaCaptura } from "../incidencias/evidencia-captura";

interface IncidenciaModalProps {
	title: string;
	/** Texto bajo el título (p. ej. "Nueva incidencia" o el folio). */
	subtitulo?: string;
	children: React.ReactNode;
	isSuccess: boolean;
	setIsSuccess: Dispatch<SetStateAction<boolean>>;
	setSeguimientos: Dispatch<SetStateAction<any[]>>;
	indice: number | null;
	editarSeguimiento: boolean;
	setEditarSeguimiento: Dispatch<SetStateAction<any>>;
	seguimientoSeleccionado: any;
	dateIncidencia: string;
	/** true: guarda directo en el back (incidencia ya creada) y pide el estatus. */
	enviarSeguimiento?: boolean;
	folioIncidencia: string;
	estatusIncidencia: string;
	/** Nombres de las personas involucradas de la incidencia, para agregarlas con un clic. */
	personasRegistradas?: string[];
	/** Con enviarSeguimiento: avisa el seguimiento y el estatus ya guardados. */
	onGuardado?: (seguimiento: any, estatus: string) => void;
}

const label = "text-[11px] font-bold uppercase tracking-wide text-gray-600";
const ESTATUS = ["Abierto", "Cerrado"];

// incidencia_personas_involucradas se guarda como texto: nombres separados por coma.
const separarPersonas = (texto?: string) =>
	(texto || "")
		.split(",")
		.map((p) => p.trim())
		.filter(Boolean);

export const SeguimientoIncidenciaLista: React.FC<IncidenciaModalProps> = ({
	title,
	subtitulo,
	isSuccess,
	setIsSuccess,
	setSeguimientos,
	indice,
	editarSeguimiento,
	setEditarSeguimiento,
	seguimientoSeleccionado,
	dateIncidencia,
	enviarSeguimiento = false,
	folioIncidencia,
	estatusIncidencia,
	personasRegistradas = [],
	onGuardado,
}) => {
	const [personas, setPersonas] = useState<string[]>([]);
	const [nombrePersona, setNombrePersona] = useState("");
	const [accion, setAccion] = useState("");
	const [estatus, setEstatus] = useState(estatusIncidencia);
	const [evidencia, setEvidencia] = useState<Imagen[]>([]);
	const [documento, setDocumento] = useState<Imagen[]>([]);
	// La fecha no se captura: es la del momento (o la original al editar).
	const [fecha, setFecha] = useState<Date>(new Date());
	const seguimientoIncidenciaMutation = useSeguimientoIncidencia();
	const guardando = seguimientoIncidenciaMutation.isPending;

	useEffect(() => {
		if (!isSuccess) return;
		const sel = editarSeguimiento ? seguimientoSeleccionado : null;
		setPersonas(separarPersonas(sel?.incidencia_personas_involucradas));
		setNombrePersona("");
		setIntentoGuardar(false);
		setAccion(sel?.accion_correctiva_incidencia || "");
		setEstatus(estatusIncidencia);
		setEvidencia(sel?.incidencia_evidencia_solucion || []);
		setDocumento(sel?.incidencia_documento_solucion || []);
		const original = sel?.fecha_inicio_seg ? new Date(sel.fecha_inicio_seg) : null;
		setFecha(original && !isNaN(original.getTime()) ? original : new Date());
	}, [isSuccess]);

	const agregarPersona = (nombre: string) => {
		const limpio = nombre.trim();
		if (!limpio) return;
		setPersonas((prev) => (prev.some((p) => p.toLowerCase() === limpio.toLowerCase()) ? prev : [...prev, limpio]));
		setNombrePersona("");
	};

	const sugeridas = personasRegistradas.filter(
		(n) => n?.trim() && !personas.some((p) => p.toLowerCase() === n.trim().toLowerCase()),
	);
	const nombrePendiente = nombrePersona.trim();
	const personasFinal =
		nombrePendiente && !personas.some((p) => p.toLowerCase() === nombrePendiente.toLowerCase())
			? [...personas, nombrePendiente]
			: personas;
	const faltaPersonas = personasFinal.length === 0;
	const faltaAccion = !accion.trim();
	const [intentoGuardar, setIntentoGuardar] = useState(false);

	const handleClose = () => {
		setIsSuccess(false);
		setEditarSeguimiento(false);
	};

	const handleGuardar = () => {
		setIntentoGuardar(true);
		if (guardando || faltaPersonas || faltaAccion) return;
		setPersonas(personasFinal);
		setNombrePersona("");
		const formatData = {
			accion_correctiva_incidencia: accion.trim(),
			incidencia_personas_involucradas: personasFinal.join(", "),
			fecha_inicio_seg: formatDateToString(fecha),
			incidencia_documento_solucion: documento,
			incidencia_evidencia_solucion: evidencia,
			tiempo_transcurrido: calcularTiempoDesdeIncidencia(dateIncidencia, convertirDateToISO(fecha)),
		};

		if (editarSeguimiento) {
			setSeguimientos((prev: any[]) => prev.map((item, i) => (i === indice ? formatData : item)));
			toast.success("Seguimiento editado correctamente.");
			handleClose();
		} else if (enviarSeguimiento) {
			Swal.fire({
				title: "Actualizando incidencia",
				html: "Guardando el seguimiento...",
				allowOutsideClick: false,
				allowEscapeKey: false,
				didOpen: () => Swal.showLoading(),
			});
			seguimientoIncidenciaMutation.mutate(
				{ seguimientos_incidencia: formatData, folio: folioIncidencia, estatus: estatus || estatusIncidencia },
				{
					onSuccess: () => {
						onGuardado?.(formatData, estatus || estatusIncidencia);
						handleClose();
					},
					onError: (error) => console.error("❌ Error en la mutación:", error),
					onSettled: () => Swal.close(),
				},
			);
		} else {
			setSeguimientos((prev: any) => [...prev, formatData]);
			handleClose();
		}
	};

	return (
		<Dialog onOpenChange={(open) => (open ? setIsSuccess(true) : handleClose())} open={isSuccess}>
			<DialogContent
				className="max-w-3xl max-h-[90vh] overflow-y-auto p-6 gap-0"
				onInteractOutside={(e) => e.preventDefault()}
				onOpenAutoFocus={(e) => e.preventDefault()}
				aria-describedby="">
				<DialogTitle className="text-xl font-bold text-gray-900">
					{editarSeguimiento ? "Editar seguimiento" : title}
				</DialogTitle>
				{(subtitulo || folioIncidencia) && (
					<p className="mt-1 text-sm text-gray-500">{subtitulo || `Incidencia ${folioIncidencia}`}</p>
				)}

				<div className="mt-5 space-y-5">
					{enviarSeguimiento && (
						<div>
							<p className={label}>
								Estatus de la incidencia <span className="text-red-500">*</span>
							</p>
							<div className="mt-1.5 grid h-11 w-full max-w-xs grid-cols-2 overflow-hidden rounded-lg border border-gray-200">
								{ESTATUS.map((e) => (
									<button
										key={e}
										type="button"
										onClick={() => setEstatus(e)}
										className={`border-r border-gray-200 text-sm last:border-r-0 transition-colors ${
											estatus === e ? "bg-blue-600 font-semibold text-white" : "text-gray-600 hover:bg-gray-50"
										}`}>
										{e}
									</button>
								))}
							</div>
						</div>
					)}

					<div>
						<p className={label}>
							Personas involucradas <span className="text-red-500">*</span>
						</p>
						<div className="mt-1.5 flex gap-2">
							<Input
								className="h-11"
								placeholder="Nombre completo"
								value={nombrePersona}
								onChange={(e) => setNombrePersona(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										agregarPersona(nombrePersona);
									}
								}}
							/>
							<Button
								type="button"
								variant="outline"
								className="h-11"
								onClick={() => agregarPersona(nombrePersona)}
								disabled={!nombrePersona.trim()}>
								Agregar
							</Button>
						</div>
						{personas.length > 0 && (
							<div className="mt-2 flex flex-wrap gap-2">
								{personas.map((p) => (
									<span key={p} className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800">
										{p}
										<button
											type="button"
											onClick={() => setPersonas((prev) => prev.filter((x) => x !== p))}
											className="text-blue-500 hover:text-blue-700"
											aria-label={`Quitar ${p}`}>
											<X className="h-3.5 w-3.5" />
										</button>
									</span>
								))}
							</div>
						)}
						{sugeridas.length > 0 && (
							<div className="mt-3 flex flex-wrap items-center gap-2">
								<span className="text-xs text-gray-500">Registradas en la incidencia:</span>
								{sugeridas.map((n) => (
									<button
										key={n}
										type="button"
										onClick={() => agregarPersona(n)}
										className="flex items-center gap-1 rounded-full border border-dashed border-gray-300 px-3 py-1 text-sm text-gray-700 hover:border-blue-300 hover:bg-blue-50">
										<Plus className="h-3.5 w-3.5" />
										{n}
									</button>
								))}
							</div>
						)}
						{intentoGuardar && faltaPersonas && (
							<p className="mt-1.5 text-sm font-medium text-red-500">Agrega al menos una persona involucrada.</p>
						)}
					</div>

					<div>
						<p className={label}>
							Acción realizada <span className="text-red-500">*</span>
						</p>
						<Textarea
							className="mt-2 resize-none focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:ring-offset-0"
							rows={4}
							placeholder="Ej. Se revisó la zona con mantenimiento y se cambió la cerradura."
							value={accion}
							onChange={(e) => setAccion(e.target.value)}
						/>
						{intentoGuardar && faltaAccion && (
							<p className="mt-1.5 text-sm font-medium text-red-500">Describe la acción realizada.</p>
						)}
					</div>

					<hr className="border-gray-100" />

					<div>
						<h3 className="mb-3 text-base font-bold text-gray-900">Evidencias</h3>
						<EvidenciaCaptura
							id="seguimiento"
							evidencia={evidencia}
							setEvidencia={setEvidencia}
							documento={documento}
							setDocumento={setDocumento}
						/>
					</div>
				</div>

				<div className="mt-6 flex gap-3">
					<Button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700" onClick={handleClose} disabled={guardando}>
						Cancelar
					</Button>
					<Button className="w-full bg-blue-500 hover:bg-blue-600 text-white" onClick={handleGuardar} disabled={guardando}>
						{guardando ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Guardando...
							</>
						) : (
							"Guardar"
						)}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};
