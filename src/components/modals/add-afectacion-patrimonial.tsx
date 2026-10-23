/* eslint-disable react-hooks/exhaustive-deps */
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Imagen } from "../upload-Image";
import { EvidenciaCaptura } from "../incidencias/evidencia-captura";

interface IncidenciaModalProps {
	title: string;
	/** Texto bajo el título (p. ej. "Nueva incidencia" o el folio). */
	subtitulo?: string;
	children: React.ReactNode;
	openAfectacionPatrimonialModal: boolean;
	setOpenAfectacionPatrimonialModal: Dispatch<SetStateAction<boolean>>;
	setAfectacionPatrimonial: Dispatch<SetStateAction<any>>;
	indice: number | null;
	editarAfectacionPatrimonial: boolean;
	setEditarAfectacionPatrimonial: Dispatch<SetStateAction<any>>;
	afectacionPatrimonialSeleccionada: any;
}

const TIPOS = ["Daño a infraestructura", "Suspensión de actividades", "Paro de producción", "Impacto económico estimado", "Otro"];
const ESTATUS = ["Perdido", "Recuperación parcial", "Recuperación total"];
const UNIDADES = ["Minutos", "Horas", "Días", "Semanas", "Meses"];

const label = "text-[11px] font-bold uppercase tracking-wide text-gray-600";

// duracion_estimada se guarda como texto ("4 Horas"); se separa para editarla.
const separarDuracion = (texto?: string) => {
	const m = (texto || "").trim().match(/^(\d+(?:[.,]\d+)?)\s*(.*)$/);
	if (!m) return { cantidad: "", unidad: "Horas" };
	return { cantidad: m[1], unidad: UNIDADES.includes(m[2]) ? m[2] : "Horas" };
};

export const AfectacionPatrimonialModal: React.FC<IncidenciaModalProps> = ({
	title,
	subtitulo,
	openAfectacionPatrimonialModal,
	setOpenAfectacionPatrimonialModal,
	setAfectacionPatrimonial,
	indice,
	editarAfectacionPatrimonial,
	setEditarAfectacionPatrimonial,
	afectacionPatrimonialSeleccionada,
}) => {
	const [tipo, setTipo] = useState("");
	const [descripcion, setDescripcion] = useState("");
	const [estatus, setEstatus] = useState("");
	const [monto, setMonto] = useState("");
	const [cantidad, setCantidad] = useState("");
	const [unidad, setUnidad] = useState("Horas");
	const [evidencia, setEvidencia] = useState<Imagen[]>([]);
	const [documento, setDocumento] = useState<Imagen[]>([]);

	useEffect(() => {
		if (!openAfectacionPatrimonialModal) return;
		const sel = editarAfectacionPatrimonial ? afectacionPatrimonialSeleccionada : null;
		const duracion = separarDuracion(sel?.duracion_estimada);
		setTipo(sel?.tipo_afectacion || "");
		setDescripcion(sel?.descripcion_afectacion || "");
		setEstatus(sel?.estatus_afectacion || "");
		setMonto(String(sel?.monto_estimado ?? "").replace(/[^\d.]/g, ""));
		setCantidad(duracion.cantidad);
		setUnidad(duracion.unidad);
		setEvidencia(sel?.evidencia || []);
		setDocumento(sel?.documento || []);
	}, [openAfectacionPatrimonialModal]);

	// Monto y duración son opcionales.
	const puedeGuardar = !!tipo && !!descripcion.trim() && !!estatus;

	const handleClose = () => {
		setOpenAfectacionPatrimonialModal(false);
		setEditarAfectacionPatrimonial(false);
	};

	const handleGuardar = () => {
		if (!puedeGuardar) return;
		const formatData = {
			tipo_afectacion: tipo,
			monto_estimado: monto,
			descripcion_afectacion: descripcion.trim(),
			estatus_afectacion: estatus,
			duracion_estimada: cantidad !== "" ? `${cantidad} ${unidad}` : "",
			evidencia,
			documento,
		};
		if (editarAfectacionPatrimonial) {
			setAfectacionPatrimonial((prev: any[]) => prev.map((item, i) => (i === indice ? formatData : item)));
			toast.success("Afectación editada correctamente.");
		} else {
			setAfectacionPatrimonial((prev: any) => [...prev, formatData]);
			toast.success("Afectación agregada correctamente.");
		}
		handleClose();
	};

	return (
		<Dialog onOpenChange={(open) => (open ? setOpenAfectacionPatrimonialModal(true) : handleClose())} open={openAfectacionPatrimonialModal}>
			<DialogContent
				className="max-w-3xl max-h-[90vh] overflow-y-auto p-6 gap-0"
				onInteractOutside={(e) => e.preventDefault()}
				onOpenAutoFocus={(e) => e.preventDefault()}
				aria-describedby="">
				<DialogTitle className="text-xl font-bold text-gray-900">{title}</DialogTitle>
				{subtitulo && <p className="mt-1 text-sm text-gray-500">{subtitulo}</p>}

				<div className="mt-5 space-y-5">
					<div>
						<p className={label}>
							Tipo de afectación <span className="text-red-500">*</span>
						</p>
						<div className="mt-1.5 flex flex-wrap gap-2">
							{TIPOS.map((t) => (
								<button
									key={t}
									type="button"
									onClick={() => setTipo(t)}
									className={`rounded-full border px-4 py-2 text-sm transition-colors ${
										tipo === t ? "border-blue-600 bg-blue-600 font-semibold text-white" : "border-gray-200 text-gray-700 hover:bg-gray-50"
									}`}>
									{t}
								</button>
							))}
						</div>
					</div>

					<div>
						<p className={label}>
							Descripción de la afectación <span className="text-red-500">*</span>
						</p>
						<Textarea
							className="mt-2 resize-none focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:ring-offset-0"
							rows={4}
							placeholder="Describe qué se afectó y cómo."
							value={descripcion}
							onChange={(e) => setDescripcion(e.target.value)}
						/>
					</div>

					<div className="grid grid-cols-1 gap-5 md:grid-cols-3">
						<div>
							<p className={label}>
								Estatus de la afectación <span className="text-red-500">*</span>
							</p>
							<Select value={estatus || undefined} onValueChange={setEstatus}>
								<SelectTrigger className="mt-1.5 h-11 w-full">
									<SelectValue placeholder="Selecciona" />
								</SelectTrigger>
								<SelectContent>
									{ESTATUS.map((e) => (
										<SelectItem key={e} value={e}>
											{e}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<p className={label}>
								Monto estimado del daño
							</p>
							<div className="mt-1.5 flex h-11 items-center rounded-md border border-input px-3 focus-within:ring-2 focus-within:ring-blue-100">
								<span className="text-sm text-gray-500">$</span>
								<input
									type="number"
									min={0}
									step="0.01"
									inputMode="decimal"
									placeholder="0.00"
									value={monto}
									onChange={(e) => setMonto(e.target.value)}
									className="h-full min-w-0 flex-1 bg-transparent px-2 text-sm outline-none"
								/>
								<span className="text-xs font-semibold text-gray-500">MXN</span>
							</div>
						</div>
						<div>
							<p className={label}>
								Duración estimada
							</p>
							<div className="mt-1.5 flex gap-2">
								<Input
									type="number"
									min={0}
									placeholder="0"
									className="h-11 w-20"
									value={cantidad}
									onChange={(e) => setCantidad(e.target.value)}
								/>
								<Select value={unidad} onValueChange={setUnidad}>
									<SelectTrigger className="h-11 flex-1">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{UNIDADES.map((u) => (
											<SelectItem key={u} value={u}>
												{u}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>

					<hr className="border-gray-100" />

					<div>
						<h3 className="mb-3 text-base font-bold text-gray-900">Evidencias</h3>
						<EvidenciaCaptura
							id="afectacion"
							evidencia={evidencia}
							setEvidencia={setEvidencia}
							documento={documento}
							setDocumento={setDocumento}
						/>
					</div>
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
