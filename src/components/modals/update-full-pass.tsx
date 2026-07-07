/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import Multiselect from 'multiselect-react-dropdown';
import { useMenuStore } from "@/store/useGetMenuStore";
import { prefijoToCountry } from "@/lib/utils";
import type { CountryCode } from "libphonenumber-js";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { useCatalogoPaseAreaLocation } from "@/hooks/useCatalogoPaseAreaLocation";
import { formatDateToString, uniqueArray } from "@/lib/utils";
import { useGetConfSeguridad } from "@/hooks/useGetConfSeguridad";
import AreasList from "@/components/areas-list";
import { Areas, Comentarios } from "@/hooks/useCreateAccessPass";
import ComentariosList from "@/components/comentarios-list";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { EntryPassModalUpdate } from "./add-pass-modal-update";
import { useBoothStore } from "@/store/useBoothStore";
import { useSearchPass } from "@/hooks/useSearchPass";
import { Switch } from "../ui/switch";
import { getCatalogoPasesAreaNoApi } from "@/lib/get-catalogos-pase-area";
import { CalendarDays, Car, Layers, UserRound } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MiembrosPase, { Miembro } from "@/components/miembros-del-pase";
import DateTimePicker from "@/components/dateTimerPicker";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useAssetsByLocations } from "@/hooks/assetsQueries";
import { Imagen } from "../upload-Image";

const enviarPreSmsSchema = z.object({
	from: z.string().min(1, { message: "El campo 'from' no puede estar vacío." }),
	mensaje: z.string().min(1, { message: "El mensaje no puede estar vacío." }),
	numero: z.string().optional()
});

const comentariosSchema = z.array(
	z.object({
		tipo_comentario: z.string().optional(),
		comentario_pase: z.string().optional(),
	})
);

const areasSchema = z.array(
	z.object({
		nombre_area: z.string().optional(),
		commentario_area: z.string().optional(),
	})
);

const formSchema = z
	.object({
		created_from: z.string().optional(),
		nombre: z.string().min(2, { message: "Por favor, ingresa tu nombre completo" }),
		email: z.string().optional().refine((val) => {
			if (val && !/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(val)) return false;
			return true;
		}, { message: "Por favor, ingresa un correo electrónico válido." }),
		telefono: z.string().optional(),
		empresa: z.string().optional(),
		ubicacion: z.array(z.string()).min(1, { message: "Selecciona al menos una ubicación." }),
		tema_cita: z.string().optional(),
		descripcion: z.string().optional(),
		perfil_pase: z.string().min(1),
		status_pase: z.string().min(1),
		visita_a: z.array(z.any()).optional(),
		custom: z.boolean().optional(),
		link: z.any().optional(),
		enviar_correo_pre_registro: z.array(z.string()).optional(),
		tipo_visita_pase: z.enum(["fecha_fija", "rango_de_fechas"], { required_error: "Seleccione un tipo de fecha." }),
		fechaFija: z.string().optional(),
		fecha_desde_visita: z.string().optional(),
		fecha_desde_hasta: z.string().optional(),
		config_dia_de_acceso: z.enum(["cualquier_día", "limitar_días_de_acceso"], { required_error: "Seleccione un tipo de acceso." }),
		config_dias_acceso: z.array(z.string()).optional(),
		config_limitar_acceso: z.number().optional().refine((val) => (val ? !isNaN(Number(val)) && Number(val) > 0 : true), {
			message: "Ingrese un número válido mayor a 0 para el límite de accesos.",
		}),
		areas: areasSchema,
		comentarios: comentariosSchema,
		enviar_pre_sms: enviarPreSmsSchema,
		qr_pase: z.array(z.unknown()).optional(),
		todas_las_areas: z.boolean().optional(),
		habilitar_vehiculo: z.string().optional(),
		acompanantes: z.number().min(0).optional(),
		acompanantes_grupo:z.array(z.any())
	})
	.refine((data) => {
		if (data.tipo_visita_pase === 'rango_de_fechas') {
			if (!data.fecha_desde_visita || !data.fecha_desde_hasta) return false;
		}
		return true;
	}, { message: "Ambas fechas son requeridas.", path: ['fecha_desde_visita'] })
	.refine((data) => {
		if (!data.email && !data.telefono) return false;
		return true;
	}, { message: "Se requiere un email o teléfono.", path: ['email'] });

interface updatedFullPassModalProps {
	dataPass: any;
	setModalEditarAbierto: Dispatch<SetStateAction<boolean>>;
	modalEditarAbierto: boolean;
}

interface AreaAcceso {
	incidente_area: string;
	commentario_area: string;
}

function SectionCard({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
	return (
		<div className="bg-white rounded-2xl shadow-sm border border-blue-50 p-6">
			<div className="flex items-center gap-2 mb-1">
				<div className="p-2 bg-blue-50 rounded-xl">
					<span className="text-blue-600 flex">{icon}</span>
				</div>
				<p className="font-semibold text-gray-700">{label}</p>
			</div>
			<div className="mt-4">{children}</div>
		</div>
	);
}

const UpdateFullPassModal: React.FC<updatedFullPassModalProps> = ({ dataPass, setModalEditarAbierto, modalEditarAbierto }) => {
	const { location } = useBoothStore();
	const [tipoVisita, setTipoVisita] = useState(dataPass.tipo_visita_pase || "fecha_fija");
	const [config_dias_acceso, set_config_dias_acceso] = useState<string[]>(dataPass.config_dias_acceso || []);
	const [config_dia_de_acceso, set_config_dia_de_acceso] = useState(dataPass.config_dia_de_acceso || "cualquier_día");
	const [isSuccess, setIsSuccess] = useState(false);
	const [modalData, setModalData] = useState<any>(null);
	const { ubicacionesDefaultFormatted, dataLocations: ubicaciones, isLoadingAreas: loadingCatAreas } = useCatalogoPaseAreaLocation(location ?? "", true, location ? true : false);
	const [ubicacionesSeleccionadas, setUbicacionesSeleccionadas] = useState<any[]>(ubicacionesDefaultFormatted ?? []);
	const userEmailSoter = typeof window !== "undefined" ? localStorage.getItem("userEmail_soter") || "" : "";
	const userIdSoter = typeof window !== "undefined" ? parseInt(localStorage.getItem("userId_soter") || "0", 10) : 0;

	const { data: dataConfigLocation, isLoading: loadingConfigLocation } = useGetConfSeguridad(ubicacionesSeleccionadas?.[0]?.id ?? []);
	const ubicacionesFormatted = ubicaciones?.map((u: any) => ({ id: u, name: u }));
	const [formatedDocs, setFormatedDocs] = useState<string[]>([]);
	const [formatedEnvio, setFormatedEnvio] = useState<string[]>([]);
	const [comentariosList, setComentariosList] = useState<Comentarios[]>(dataPass.comentarios || []);
	const [habilitarVehiculo, setHabilitarVehiculo] = useState(dataPass.habilitar_vehiculo === "sí" || dataPass.habilitar_vehiculo === true);
	const [miembrosAcompanantes, setMiembrosAcompanantes] = useState<Miembro[]>([]);
	const [miembrosRowErrors, setMiembrosRowErrors] = useState<Record<string, { email: boolean; telefono: boolean }>>({});
	const [acompanantesActivos, setAcompanantesActivos] = useState<Miembro[]>([]);
	const [existingIds, setExistingIds] = useState<Set<string>>(new Set());
	const areasFormateadas = dataPass?.areas?.map(({ incidente_area, commentario_area }: AreaAcceso) => ({
		nombre_area: incidente_area,
		commentario_area,
	})) || [];

	const [areasList, setAreasList] = useState<Areas[]>(areasFormateadas);
	const [isActiveFechaFija, setIsActiveFechaFija] = useState(dataPass.tipo_visita_pase === "fecha_fija");
	const [isActiveRangoFecha, setIsActiveRangoFecha] = useState(dataPass.tipo_visita_pase === "rango_de_fechas");
	const [isActivelimitarDias, setIsActiveLimitarDias] = useState(dataPass.config_limitar_acceso > 0);
	const [isActiveCualquierDia, setIsActiveCualquierDia] = useState(dataPass.config_dia_de_acceso !== "limitar_días_de_acceso");
	const [isActivelimitarDiasSemana, setIsActiveLimitarDiasSemana] = useState(dataPass.config_dia_de_acceso === "limitar_días_de_acceso");
	const [isActiveAdvancedOptions, setIsActiveAdvancedOptions] = useState(dataPass.areas?.length > 0);
	const [date, setDate] = useState<Date | undefined>(
		dataPass.tipo_visita_pase === "fecha_fija" ? new Date(dataPass.fecha_desde_visita) : new Date(dataPass.fecha_desde_visita)
	);
	const [todasAreas, setTodasAreas] = useState(dataPass?.todas_las_areas || false);
	const [fechaDesde, setFechaDesde] = useState<string>('');

	const { assets } = useSearchPass(true);
	const assetsUnique = uniqueArray(assets?.Visita_a);
	assetsUnique.unshift("Usuario Actual");
	const visitaAFormatted = (assetsUnique || []).filter((u: any) => u !== null && u !== undefined).map((u: any) => ({ id: u, name: u }));
	const [visitaASeleccionadas, setVisitaASeleccionadas] = useState<any[]>(dataPass?.visita_a || []);

	const { visitas, perfiles, isLoading: assetsLoading } = useAssetsByLocations(
		ubicacionesSeleccionadas?.length ? ubicacionesSeleccionadas : []
	);
	console.log(visitas,fechaDesde)
	const { grupoRequisitos } = useMenuStore();
	const [defaultCountry, setDefaultCountry] = useState<CountryCode  | undefined>(undefined);

	const normalizeImageField = (value: unknown): Imagen[] | undefined => {
		if (!value) return undefined;
		if (Array.isArray(value)) {
			return value.length > 0 ? value : undefined;
		}
		if (typeof value === "string" && value.trim() !== "") {
			return [{ file_url: value, file_name: "foto" }];
		}
		return undefined;
	};

	useEffect(() => {
	if (!ubicacionesSeleccionadas?.length || !grupoRequisitos?.length) return;

	const ubicacionNombre = ubicacionesSeleccionadas[0]?.name ?? ubicacionesSeleccionadas[0]?.id ?? "";

	const requisito = grupoRequisitos.find(
		(r) => r.ubicacion?.toLowerCase() === ubicacionNombre?.toLowerCase()
	);

	if (requisito?.prefijo_telefonico) {
	const country = prefijoToCountry[String(requisito.prefijo_telefonico)];
		setDefaultCountry(country as CountryCode | undefined);
	} else {
		setDefaultCountry(undefined);
	}
	}, [ubicacionesSeleccionadas, grupoRequisitos]);
	// Estados para áreas dinámicas
	const [areasTodas, setAreasTodas] = useState<any[]>([]);
	const [areasDisponibles, setAreasDisponibles] = useState<any[]>([]);

	useEffect(() => {
		if (modalEditarAbierto && dataPass?.ubicacion) {
			const ubicacionesFormateadas = Array.isArray(dataPass.ubicacion)
				? dataPass.ubicacion.map((u: any) => typeof u === "string" ? { id: u, name: u } : u)
				: [];
			setUbicacionesSeleccionadas(ubicacionesFormateadas);
		}
	}, [modalEditarAbierto]);

	useEffect(() => {
		if (!dataPass?.visita_a) { setVisitaASeleccionadas([]); return; }
		setVisitaASeleccionadas(dataPass?.visita_a);
	}, [dataPass]);

	useEffect(() => {
		if (!ubicacionesSeleccionadas?.length) { setAreasTodas([]); return; }
		const fetchAreasTodas = async () => {
			const resultados = await Promise.all(
				ubicacionesSeleccionadas.map(async (ubicacion) => {
					const res = await getCatalogoPasesAreaNoApi(ubicacion.id);
					const areas = res?.response?.data?.areas_by_location ?? [];
					return areas.map((area: string) => ({ nombre: area, locationId: ubicacion.id, nombreUbicacion: ubicacion.nombre }));
				})
			);
			setAreasTodas(resultados.flat());
		};
		fetchAreasTodas();
	}, [ubicacionesSeleccionadas]);

	useEffect(() => {
		setAreasDisponibles(areasTodas.map((area) => ({ value: `${area.nombre}`, label: `${area.nombre} — ${area.locationId}`, areaId: area.nombre })));
	}, [areasTodas]);

	// Acompañantes: generar filas vacías si viene un número
	// Acompañantes: mapear datos reales del back, o generar filas vacías si solo viene el número
	useEffect(() => {
	const mapAcompanante = (a: any): Miembro => ({
		id: a.qr_code || crypto.randomUUID(),
		nombre: a.nombre_acompanante ?? "",
		email: a.email_acompanante ?? "",
		telefono: a.telefono_acompanante ?? "",
		estatus: a.estatus ?? "",
		foto: normalizeImageField(a.foto),
		identificacion: normalizeImageField(a.identificacion),
		link: a.url_hijo ?? "",
	});

	if (dataPass?.acompanantes_grupo?.length) {
		const grupo = dataPass.acompanantes_grupo as any[];

		const activos = grupo
		.filter((a) => a.estatus?.toLowerCase() === "activo")
		.map(mapAcompanante);

		const proceso = grupo
		.filter((a) => a.estatus?.toLowerCase() === "proceso")
		.map(mapAcompanante);

		setAcompanantesActivos(activos);
		setMiembrosAcompanantes(proceso);
		setExistingIds(new Set(proceso.map((p) => p.id)));
		return;
	}

	const numAcompanantes = Number(dataPass?.acompanantes) || 0;
	if (numAcompanantes > 0) {
		const rows = Array.from({ length: numAcompanantes }, () => ({
		id: crypto.randomUUID(),
		nombre: "",
		email: "",
		telefono: "",
		}));
		setMiembrosAcompanantes(rows);
	} else {
		setMiembrosAcompanantes([]);
	}
	setAcompanantesActivos([]);
	setExistingIds(new Set());
	}, [dataPass]);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			created_from: "web",
			nombre: dataPass.nombre || "",
			email: dataPass.email || "",
			telefono: dataPass.telefono || "",
			empresa: dataPass.empresa || "",
			ubicacion: dataPass.ubicacion || [],
			tema_cita: dataPass.tema_cita || "",
			descripcion: dataPass.descripcion || "",
			perfil_pase: dataPass.perfil_pase || "Visita General",
			status_pase: dataPass.status_pase || "Activo",
			visita_a: Array.isArray(dataPass?.visita_a)
				? dataPass.visita_a.map((v: any) => v?.nombre || v)
				: [dataPass?.visita_a?.nombre || dataPass?.visita_a || ""],
			custom: true,
			link: { link: dataPass.link?.link || "", docs: formatedDocs, creado_por_id: userIdSoter, creado_por_email: userEmailSoter },
			qr_pase: dataPass.qr_pase || [],
			enviar_correo_pre_registro: formatedEnvio,
			tipo_visita_pase: dataPass.tipo_fechas_pase || dataPass.tipo_visita_pase || "fecha_fija",
			config_limitar_acceso: Number(dataPass.limite_de_acceso) || Number(dataPass.config_limitar_acceso) || 1,
			fechaFija: dataPass.tipo_visita_pase === "fecha_fija" ? dataPass.fechaFija : dataPass.fecha_desde_visita,
			fecha_desde_visita: dataPass.tipo_visita_pase === "fecha_fija" ? (dataPass.fechaFija || dataPass.fecha_desde_visita) : dataPass.fecha_desde_visita,
			fecha_desde_hasta: dataPass.fecha_desde_hasta || "",
			config_dia_de_acceso: config_dia_de_acceso === "limitar_días_de_acceso" ? config_dia_de_acceso : "cualquier_día",
			config_dias_acceso: config_dias_acceso,
			areas: areasList,
			comentarios: comentariosList,
			enviar_pre_sms: { from: "enviar_pre_sms", mensaje: "prueba", numero: dataPass.telefono },
			todas_las_areas: todasAreas,
			habilitar_vehiculo: dataPass.habilitar_vehiculo || "sí",
			acompanantes: Number(dataPass.acompanantes) || 0,
			acompanantes_grupo: dataPass.acompanantes_grupo || [],
		},
	});

	const acompanantesValue = useWatch({ control: form.control, name: "acompanantes" });

	useEffect(() => {
		const total = Number(acompanantesValue) || 0;
		const activosCount = acompanantesActivos.length;
		const existentesCount = existingIds.size;
		const minTotal = activosCount + existentesCount;
		const totalClamped = Math.max(total, minTotal);

		if (totalClamped !== total) {
			form.setValue("acompanantes", totalClamped);
		}

		const procesoTarget = totalClamped - activosCount;

		setMiembrosAcompanantes((prev) => {
			if (prev.length === procesoTarget) return prev;

			if (prev.length < procesoTarget) {
			const faltantes = procesoTarget - prev.length;
			const nuevas = Array.from({ length: faltantes }, () => ({
				id: crypto.randomUUID(),
				nombre: "",
				email: "",
				telefono: "",
			}));
			return [...prev, ...nuevas];
			}

			// Al reducir, solo se quitan filas nuevas (borrador); las existentes nunca se tocan aquí
			const existentes = prev.filter((m) => existingIds.has(m.id));
			const nuevos = prev.filter((m) => !existingIds.has(m.id));
			const nuevosRecortados = nuevos.slice(0, Math.max(procesoTarget - existentes.length, 0));
			return [...existentes, ...nuevosRecortados];
		});
	}, [acompanantesValue, acompanantesActivos, existingIds]);

	useEffect(() => {
		if (dataPass) {
			setAreasList(areasFormateadas);
			form.setValue("email", dataPass?.email);
		}
	}, [dataPass]);

	useEffect(() => {
		if (modalEditarAbierto) {
			form.setValue("fecha_desde_visita", dataPass.fecha_desde_visita?.split(" ")[0] || "");
			form.setValue("fecha_desde_hasta", dataPass.fecha_desde_hasta?.split(" ")[0] || "");
		}
	}, [modalEditarAbierto]);

	useEffect(() => {
		if (dataConfigLocation) {
			const docs: string[] = [];
			dataConfigLocation?.requerimientos?.forEach((value: string) => {
				if (value === "identificacion") docs.push("agregarIdentificacion");
				if (value === "fotografia") docs.push("agregarFoto");
			});
			setFormatedDocs(docs);
			const envioCS: string[] = [];
			dataConfigLocation?.envios?.forEach((envio: string) => {
				if (envio === "correo") envioCS.push("enviar_correo_pre_registro");
				if (envio === "sms") envioCS.push("enviar_sms_pre_registro");
			});
			setFormatedEnvio(envioCS);
		}
	}, [dataConfigLocation]);

	const toggleDia = (dia: string) => {
		set_config_dias_acceso((prev) => prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]);
	};

	const handleToggleTipoVisitaPase = (tipo: string) => {
		if (tipo === "fecha_fija") {
			form.setValue("tipo_visita_pase", "fecha_fija");
			form.setValue('fecha_desde_hasta', '');
			form.setValue('fecha_desde_visita', '');
			setIsActiveFechaFija(true);
			setIsActiveRangoFecha(false);
		} else {
			form.setValue("tipo_visita_pase", "rango_de_fechas");
			form.setValue('fechaFija', '');
			setDate(undefined);
			setIsActiveFechaFija(false);
			setIsActiveRangoFecha(true);
		}
		setTipoVisita(tipo);
	};

	const handleToggleDiasAcceso = (tipo: string) => {
		setIsActiveCualquierDia(tipo === "cualquier_día");
		setIsActiveLimitarDiasSemana(tipo !== "cualquier_día");
		set_config_dia_de_acceso(tipo);
	};

	const handleFechaDesdeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFechaDesde(e.target.value);
		form.setValue('fecha_desde_hasta', '');
	};

	// function getNextDay(date: string | number | Date) {
	// 	const currentDate = new Date(date);
	// 	currentDate.setDate(currentDate.getDate() + 1);
	// 	return currentDate.toISOString().split('T')[0];
	// }

	const formatDateToLocalISO = (date: Date) => {
		const offset = date.getTimezoneOffset();
		const localDate = new Date(date.getTime() - offset * 60 * 1000);
		return localDate.toISOString().split("T")[0];
	};

	const onSubmit = (data: z.infer<typeof formSchema>) => {
		if (!ubicacionesSeleccionadas || ubicacionesSeleccionadas.length === 0) {
			form.setError("ubicacion", { type: "manual", message: "Selecciona al menos una ubicación." });
			return;
		}
		const formattedData = {
			_id: dataPass._id,
			folio: dataPass.folio,
			nombre: data.nombre,
			email: data.email || "",
			telefono: data.telefono || "",
			empresa: data.empresa || "",
			ubicacion: ubicacionesSeleccionadas?.map((u: any) => u.name || u),
			tema_cita: data.tema_cita || "",
			descripcion: data.descripcion || "",
			perfil_pase: data.perfil_pase || dataPass.perfil_pase || "",
			status_pase: data.status_pase || "",
			visita_a: visitaASeleccionadas?.map((u: any) => u.name || u) ?? [],
			custom: true,
			link: { link: dataPass.link?.link || "", docs: formatedDocs, creado_por_id: userIdSoter, creado_por_email: userEmailSoter },
			qr_pase: dataPass.qr_pase || [],
			limitado_a_dias: dataPass.limitado_a_dias || [],
			enviar_correo_pre_registro: formatedEnvio,
			tipo_visita_pase: tipoVisita || "",
			config_dia_de_acceso: config_dia_de_acceso === "limitar_días_de_acceso" ? config_dia_de_acceso : "cualquier_día",
			config_dias_acceso: config_dias_acceso,
			config_limitar_acceso: Number(data.config_limitar_acceso) || 1,
			areas: areasList,
			comentarios: comentariosList,
			enviar_pre_sms: { from: "enviar_pre_sms", mensaje: "prueba", numero: dataPass.telefono },
			fechaFija: date ? formatDateToString(date) : "",
			fecha_desde_visita: tipoVisita === "fecha_fija" ? (date ? formatDateToString(date) : "") : (data.fecha_desde_visita || ""),
			fecha_desde_hasta: tipoVisita === "fecha_fija"
				? (date ? (() => { const d = new Date(date); d.setHours(23, 59, 59, 0); return formatDateToString(d); })() : "")
				: (data.fecha_desde_hasta ? (() => { const d = new Date(data.fecha_desde_hasta.split(" ")[0] + "T00:00:00"); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} 23:59:59`; })() : ""),
			grupo_equipos: dataPass.grupo_equipos,
			grupo_vehiculos: dataPass.grupo_vehiculos,
			foto: dataPass.foto || [],
			identificacion: dataPass.identificacion || [],
			todas_las_areas: todasAreas,
			habilitar_vehiculo: habilitarVehiculo ? "sí" : "no",
			acompanantes: Number(data.acompanantes) || 0,
			acompanantes_grupo: miembrosAcompanantes || [],
		};

		if (tipoVisita === "fecha_fija" && !date) {
			form.setError("fechaFija", { type: "manual", message: "Fecha Fija es requerida." });
		} else if (tipoVisita === "rango_de_fechas" && (!formattedData.fecha_desde_visita || !formattedData.fecha_desde_hasta)) {
			form.setError("fecha_desde_hasta", { type: "manual", message: "Ambas fechas son requeridas" });
		} else {
			setModalData(formattedData);
			setIsSuccess(true);
		}
	};
	const normalizarTelefono = (value: string | undefined): string => {
	if (!value) return "";
	if (value.startsWith("+")) return value;

	const soloDigitos = value.replace(/\D/g, "");
	if (soloDigitos.length >= 10) {
		return `+${soloDigitos}`;
	}
	return value;
	};

	console.log("URL",dataPass.url_padre)
	return (
		<Dialog open={modalEditarAbierto} onOpenChange={setModalEditarAbierto} modal>
			<DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0 rounded-3xl overflow-hidden border-none">
				<EntryPassModalUpdate
					title={"Confirmación"}
					dataPass={modalData}
					isSuccess={isSuccess}
					setIsSuccess={setIsSuccess}
					onClose={() => setIsSuccess(false)}
					id={dataPass._id}
					folio={dataPass.folio}
					from={"historial"}
				/>

				{/* Header */}
				<div className="px-6 pt-6 pb-3 flex-shrink-0 text-center border-b border-gray-100 bg-white">
					<DialogTitle className="text-2xl font-bold text-gray-800">Editar pase de entrada</DialogTitle>
					<p className="text-sm text-gray-400 mt-1">Actualiza los datos del pase — <span className="font-semibold text-gray-500">{dataPass?.perfil_pase}</span></p>
				</div>

				{/* Scrollable body */}
				<div className="flex-1 overflow-y-auto px-6 py-5 bg-gray-50/50">
					<Form {...form}>
						{/* <form onSubmit={(e) => { e.stopPropagation(); form.handleSubmit(onSubmit)(); }} className="flex flex-col gap-4"> */}

							{/* ── Detalle de la visita ── */}
							<SectionCard icon={<CalendarDays size={15} />} label="Detalle de la visita">
  								<p className="text-xs text-gray-400 mb-4 -mt-2">Indica el propósito de la visita, las ubicaciones y el responsable que recibirá al visitante.</p>
								<div className="space-y-4">
									<FormField
										control={form.control}
										name="ubicacion"
										render={() => (
											<FormItem>
												<FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
													<span className="text-red-400">*</span> Ubicaciones
												</FormLabel>
												<Multiselect
													options={ubicacionesFormatted ?? []}
													selectedValues={ubicacionesSeleccionadas}
													onSelect={(list) => { setUbicacionesSeleccionadas(list); form.clearErrors("ubicacion"); }}
													onRemove={setUbicacionesSeleccionadas}
													displayValue="name"
													style={{
														chips: { background: "#2563eb", borderRadius: "20px" },
														searchBox: { borderRadius: "12px", border: "1px solid #e5e7eb", background: "#f9fafb" },
													}}
												/>
												<FormMessage />
											</FormItem>
										)}
									/>
									<p className="text-xs text-gray-400 mb-4 -mt-2"> Selecciona las ubicaciones a ls que tendrá acceso el visitante</p>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<FormField
											control={form.control}
											name="visita_a"
											render={() => (
												<FormItem>
													<FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
														<span className="text-red-400">*</span> Responsable (Visita a)
													</FormLabel>
													<Multiselect
														options={visitaAFormatted ?? []}
														selectedValues={visitaASeleccionadas}
														onSelect={setVisitaASeleccionadas}
														onRemove={setVisitaASeleccionadas}
														displayValue="name"
														closeOnSelect
														avoidHighlightFirstOption
														style={{
															chips: { background: "#2563eb", borderRadius: "20px" },
															searchBox: { borderRadius: "12px", border: "1px solid #e5e7eb", background: "#f9fafb" },
														}}
													/>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="tema_cita"
											render={({ field }: any) => (
												<FormItem>
													<FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Motivo de visita</FormLabel>
													<FormControl>
														<Input placeholder="" className="rounded-xl border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-300" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
								</div>
							</SectionCard>

							{/* ── Datos del visitante + Acompañantes ── */}
							<div className="bg-white rounded-2xl shadow-sm border border-blue-50 p-6">
								<Tabs defaultValue="datos-visita">
									<TabsList className="w-auto justify-start bg-transparent border-b border-gray-200 rounded-none p-0 mb-5 gap-0">
										<TabsTrigger value="datos-visita" className="bg-transparent rounded-none px-4 pb-2 pt-1 text-sm font-medium text-gray-500 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 shadow-none">
											Datos del visitante
										</TabsTrigger>
										<TabsTrigger value="miembros-grupo" className="bg-transparent rounded-none px-4 pb-2 pt-1 text-sm font-medium text-gray-500 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 shadow-none">
											Acompañantes
										</TabsTrigger>
									</TabsList>

									<TabsContent value="datos-visita">
										<div className="flex items-center gap-2 mb-4">
											<div className="p-2 bg-blue-50 rounded-xl"><UserRound className="w-4 h-4 text-blue-600" /></div>
											<p className="font-semibold text-gray-700">Datos del visitante</p>
										</div>
										<p className="text-xs text-gray-400 mb-4 -mt-2">Ingresa los datos de contacto de la persona que realizará la visita.</p>
										<div className="space-y-4">
											<FormField
												control={form.control}
												name="nombre"
												render={({ field }: any) => (
													<FormItem>
														<FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
															<span className="text-red-400">*</span> Nombre completo
														</FormLabel>
														<FormControl>
															<Input placeholder="Nombre Completo" className="rounded-xl border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-300" {...field} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												<FormField
													control={form.control}
													name="empresa"
													render={({ field }: any) => (
														<FormItem>
															<FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Empresa</FormLabel>
															<FormControl>
																<Input placeholder="Empresa" className="rounded-xl border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-300" {...field} />
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
												<FormField
													control={form.control}
													name="email"
													render={({ field }: any) => (
														<FormItem>
															<FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
																<span className="text-red-400">*</span> Email
															</FormLabel>
															<FormControl>
																<Input placeholder="example@example.com" className="rounded-xl border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-300" {...field} />
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
											</div>

											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												<FormField
													control={form.control}
													name="telefono"
													render={({ field }: any) => (
														<FormItem>
														<FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Teléfono</FormLabel>
														<FormControl>
															<PhoneInput
															{...field}
															value={normalizarTelefono(field.value)}
															onChange={(value: string) => form.setValue("telefono", value || "")}
															placeholder="Teléfono"
															defaultCountry={defaultCountry}
															containerComponentProps={{
																className: "flex h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-3 py-0 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
															}}
															numberInputProps={{ className: "pl-3 bg-transparent" }}
															/>
														</FormControl>
														<FormMessage />
														</FormItem>
													)}
													/>

												{/* Perfil / tipo de visita */}
												{assetsLoading ? (
													<div className="flex items-center gap-2 py-3">
														<div className="w-5 h-5 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
														<span className="text-sm text-gray-400">Cargando perfiles...</span>
													</div>
												) : (
													<FormField
														control={form.control}
														name="perfil_pase"
														render={({ field }) => (
															<FormItem>
																<FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo de visita</FormLabel>
																<FormControl>
																	<Select value={field.value} onValueChange={field.onChange}>
																		<SelectTrigger className="w-full rounded-xl border-gray-200 bg-gray-50">
																			<SelectValue placeholder="Selecciona una opción" />
																		</SelectTrigger>
																		<SelectContent>
																			{perfiles?.map((item: any) => (
																				<SelectItem key={item.id + item.name} value={item.id}>{item.name}</SelectItem>
																			))}
																		</SelectContent>
																	</Select>
																</FormControl>
																<FormMessage />
															</FormItem>
														)}
													/>
												)}
											</div>

											{/* Acompañantes (número) */}
											<div className="w-1/2">
												<FormField
													control={form.control}
													name="acompanantes"
													render={({ field }: any) => (
													<FormItem>
													<FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Acompañantes</FormLabel>
													<FormControl>
													<Input
														placeholder="0"
														type="number"
														max={10}
														min={acompanantesActivos.length + existingIds.size}
														step={1}
														className="rounded-xl border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-300 disabled:opacity-60 disabled:cursor-not-allowed"
														{...field}
														value={field.value ?? 0}
														onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
														disabled={!!dataPass?.url_padre}
													/>
													</FormControl>
													<p className="text-xs text-gray-400 mt-1">
													{dataPass?.url_padre
														? "Este pase es un acompañante de otro pase — no puede tener sus propios acompañantes."
														: `Total: ${Number(field.value) || 0} · Activos: ${acompanantesActivos.length} (no editables) · En proceso: ${miembrosAcompanantes.length} (editables). Al aumentar este número se agregará un nuevo acompañante en proceso.`}
													</p>
													<FormMessage />
													</FormItem>
													)}
												/>
												</div>
										</div>
									</TabsContent>

									<TabsContent value="miembros-grupo">
										<MiembrosPase
											miembros={miembrosAcompanantes}
											setMiembros={setMiembrosAcompanantes}
											rowErrors={miembrosRowErrors}
											setRowErrors={setMiembrosRowErrors}
											title="Acompañantes"
											useIA
											acompanantesActivos={acompanantesActivos}
											nonDeletableIds={
												(dataPass?.status_pase || dataPass?.estatus)?.toLowerCase() === "activo"
												? Array.from(existingIds)
												: []
											}
											defaultCountry={defaultCountry}
											/>
									</TabsContent>
								</Tabs>
							</div>

							{/* ── Vigencia ── */}
							<SectionCard icon={<CalendarDays size={15} />} label="Vigencia">
  								<p className="text-xs text-gray-400 mb-5 -mt-2">Selecciona si el pase es para un día específico o define un rango de fechas de validez.</p>
								<div className="flex items-center flex-wrap gap-3 mb-6">
									<Button
										type="button"
										onClick={() => handleToggleTipoVisitaPase("rango_de_fechas")}
										className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${isActiveRangoFecha ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200" : "bg-white text-blue-600 border-blue-200 hover:border-blue-400 hover:bg-blue-50"}`}>
										Rango de fechas
									</Button>
									<Button
										type="button"
										onClick={() => handleToggleTipoVisitaPase("fecha_fija")}
										className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${isActiveFechaFija ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200" : "bg-white text-blue-600 border-blue-200 hover:border-blue-400 hover:bg-blue-50"}`}>
										Un solo día
									</Button>
								</div>

								{tipoVisita === "fecha_fija" && (
									<FormField
										control={form.control}
										name="fechaFija"
										render={() => (
											<FormItem>
												<FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
													<span className="text-red-400">*</span> Fecha y hora de visita
												</FormLabel>
												<FormControl>
													<DateTimePicker date={date} setDate={setDate} allowPast={false} use12Hour/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								)}

								{tipoVisita === "rango_de_fechas" && (
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<FormField
											control={form.control}
											name="fecha_desde_visita"
											render={({ field }: any) => (
												<FormItem>
													<FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
														<span className="text-red-400">*</span> Fecha de visita
													</FormLabel>
													<FormControl>
														<DateTimePicker
															showTime={false}
															allowPast={false}
															placeholder="Selecciona fecha desde"
															date={field.value ? new Date(field.value + "T00:00:00") : undefined}
															setDate={(date) => {
																const formattedDate = date ? formatDateToLocalISO(date) : "";
																field.onChange(formattedDate);
																handleFechaDesdeChange({ target: { value: formattedDate } } as any);
															}}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="fecha_desde_hasta"
											render={({ field }: any) => {
												const fechaDesdeVal = form.watch("fecha_desde_visita");
												const minDate = fechaDesdeVal ? new Date(fechaDesdeVal + "T00:00:00") : undefined;
												return (
													<FormItem>
														<FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
															<span className="text-red-400">*</span> Vigencia hasta
														</FormLabel>
														<FormControl>
															<DateTimePicker
																showTime={false}
																allowPast={false}
																minDate={minDate}
																placeholder="Selecciona vigencia hasta"
																date={field.value ? new Date(field.value + "T00:00:00") : undefined}
																setDate={(date) => field.onChange(date ? formatDateToLocalISO(date) : "")}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												);
											}}
										/>
									</div>
								)}
							</SectionCard>

							{/* ── Días de acceso (solo rango) ── */}
							{tipoVisita === "rango_de_fechas" && (
								<SectionCard icon={<CalendarDays size={15} />} label="Días de acceso">
									<p className="text-xs text-gray-400 mb-5 -mt-2">¿Qué días de la semana podrá ingresar el visitante durante el periodo de vigencia?</p>
									<div className="flex items-center flex-wrap gap-3 mb-4">
										<Button
											type="button"
											onClick={() => handleToggleDiasAcceso("cualquier_día")}
											className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${isActiveCualquierDia ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200" : "bg-white text-blue-600 border-blue-200 hover:border-blue-400 hover:bg-blue-50"}`}>
											Cualquier día
										</Button>
										<Button
											type="button"
											onClick={() => handleToggleDiasAcceso("limitar_días_de_acceso")}
											className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${isActivelimitarDiasSemana ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200" : "bg-white text-blue-600 border-blue-200 hover:border-blue-400 hover:bg-blue-50"}`}>
											Limitar días
										</Button>
									</div>
									{config_dia_de_acceso === "limitar_días_de_acceso" && (
										<div className="flex flex-wrap gap-2 mt-2">
											<p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Selecciona los días permitidos</p>
											<div className="flex gap-1">
												{["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].map((dia) => (
												<Button
													key={dia}
													type="button"
													onClick={() => toggleDia(dia.toLowerCase())}
													className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${config_dias_acceso.includes(dia.toLowerCase()) ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200" : "bg-white text-blue-600 border-blue-200 hover:border-blue-400 hover:bg-blue-50"}`}>
													{dia}
												</Button>
											))}
											</div>
										</div>
									)}
								</SectionCard>
							)}

							{/* ── Restricciones ── */}
							<SectionCard icon={<Layers size={15} />} label="Restricciones">
  							<p className="text-xs text-gray-400 mb-5 -mt-2">Configura el límite de ingresos permitidos y las áreas a las que el visitante podrá acceder.</p>
								<div className="space-y-4">
									{tipoVisita === "rango_de_fechas" && (
										<div>
											<div className="flex items-center flex-wrap gap-3 mb-3">
												<Button
													type="button"
													onClick={() => setIsActiveLimitarDias(!isActivelimitarDias)}
													className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${isActivelimitarDias ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200" : "bg-white text-blue-600 border-blue-200 hover:border-blue-400 hover:bg-blue-50"}`}>
													Limitar accesos
												</Button>
											</div>
											{isActivelimitarDias && (
												<div className="w-1/3">
													<FormField
														control={form.control}
														name="config_limitar_acceso"
														render={({ field }: any) => (
															<FormItem>
																<FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Número máximo de accesos</FormLabel>
																<FormControl>
																	<Input
																		placeholder="Ejemplo: 5"
																		type="number"
																		min={0}
																		step={1}
																		className="rounded-xl border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-300"
																		{...field}
																		value={field.value ? Number(field.value) : 0}
																		onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
																	/>
																</FormControl>
																<FormMessage />
															</FormItem>
														)}
													/>
												</div>
											)}
										</div>
									)}

									{/* Áreas de acceso */}
									<div>
										<div className="flex items-center justify-between flex-wrap gap-4 mb-3">
											<Button
												disabled={todasAreas}
												type="button"
												onClick={() => setIsActiveAdvancedOptions(!isActiveAdvancedOptions)}
												className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${isActiveAdvancedOptions ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200" : "bg-white text-blue-600 border-blue-200 hover:border-blue-400 hover:bg-blue-50"}`}>
												Áreas de acceso
											</Button>
											<div className="flex items-center gap-3">
												<FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Todas las áreas:</FormLabel>
												<Switch className="data-[state=checked]:bg-blue-600" checked={todasAreas} onCheckedChange={setTodasAreas} />
											</div>
										</div>
										{isActiveAdvancedOptions && (
											<AreasList
												areas={areasList}
												setAreas={setAreasList}
												catAreas={areasDisponibles.map((a) => a.label)}
												loadingCatAreas={loadingCatAreas}
												existingAreas={true}
											/>
										)}
									</div>

									{/* Vehículo */}
									<div className="bg-gray-50 rounded-2xl border border-gray-100 p-4">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<div className="p-2 bg-blue-50 rounded-xl"><Car className="w-4 h-4 text-blue-600" /></div>
												<div>
													<p className="font-semibold text-gray-700 text-sm">Vehículo</p>
													<p className="text-xs text-gray-400">Permitir acceso con vehículo</p>
												</div>
											</div>
											<Switch className="data-[state=checked]:bg-blue-600" checked={habilitarVehiculo} onCheckedChange={setHabilitarVehiculo} />
										</div>
									</div>
								</div>
							</SectionCard>

							{/* ── Comentarios ── */}
							<div className="bg-white rounded-2xl shadow-sm border border-blue-50 p-6">
								<FormField
									control={form.control}
									name="descripcion"
									render={({ field }: any) => (
										<FormItem>
											<FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Comentarios</FormLabel>
											<FormControl>
												<Textarea placeholder="Escribe un comentario" className="rounded-xl border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-300 resize-none" {...field} rows={3} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							{/* Comentarios adicionales */}
							<div className="bg-white rounded-2xl shadow-sm border border-blue-50 p-6">
								<p className="font-semibold text-gray-700 mb-3">Comentarios / Instrucciones</p>
								<ComentariosList comentarios={comentariosList} setComentarios={setComentariosList} tipo={"pase"} />
							</div>
					</Form>
				</div>

				{/* Footer */}
				<div className="flex-shrink-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3">
					<Button
						className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl h-11 font-semibold"
						onClick={() => setModalEditarAbierto(false)}>
						Cancelar
					</Button>
					<Button
						type="button"
						onClick={form.handleSubmit(onSubmit)}
						className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 font-semibold"
						disabled={loadingCatAreas || loadingConfigLocation}>
						{loadingCatAreas || loadingConfigLocation ? (
							<span className="flex items-center gap-2">
								<span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
								Cargando...
							</span>
						) : "Guardar cambios"}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default UpdateFullPassModal;