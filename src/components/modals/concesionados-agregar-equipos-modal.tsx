/* eslint-disable react-hooks/exhaustive-deps */
//eslint-disable react-hooks/exhaustive-deps
import { Button } from "../ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "../ui/dialog";

import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import { toast } from "sonner";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Calculator } from "lucide-react";
import LoadImage from "../upload-Image";
import { EquipoConcesionado } from "../concesionados-agregar-equipos";
import { formatCurrency } from "@/lib/utils";
import { equipoSchema } from "./add-article.con";
import { format } from "date-fns";
import { useCatalogoConcesion } from "@/hooks/useCatalogoConcesion";
import { useBoothStore } from "@/store/useBoothStore";
import { getTipoConcesion } from "@/lib/articulos-concesionados";
import Image from "next/image";

interface AgregarEquiposModalProps {
	title: string;
	children: React.ReactNode;
	isSuccess: boolean;
	setIsSuccess: Dispatch<SetStateAction<boolean>>;
    setEquipos: Dispatch<SetStateAction<EquipoConcesionado[]>>;
    indice:number| null;
    editarAgregarEquiposModal:boolean;
    setEditarAgregarEquiposModal: Dispatch<SetStateAction<any>>;
    agregarEquiposSeleccion:any;
}

// const formSchema = z.object({
// 	id_movimiento: z.string(),
// 	categoria_equipo_concesion: z.string().min(1, { message: "Este campo es oblicatorio" }),
// 	nombre_equipo: z.string().min(1, { message: "Este campo es oblicatorio" }),
// 	cantidad_equipo_concesion: z.number().optional(),
// 	comentario_entrega:  z.string().optional(),
// 	imagen_equipo_concesion:  z.array(z.any()).optional(),
// 	costo_equipo_concesion:z.number().optional()
// });

// type Equipo = {
// 	value: string;
// 	label: string;
// 	img: string;
// 	precio:number;
//   };
  type Equipo = {
	article_name: string;
	article_image?: { file_url: string }[];
	article_cost?: number;
  };
  
// const equiposPorCategoria: Record<string, Equipo[]> ={
// 	Herramienta: [
// 		{ value: "Martillo", label: "Martillo", img: "https://m.media-amazon.com/images/I/61CTt-OrpzL.jpg", precio:200 },
// 		{ value: "Desarmador", label: "Desarmador", img: "https://incom.mx/cdn/shop/files/URREA_9308M-DESARMADOR_PUNTAS_INTERCAMBIABLES-F1.jpg?v=1752030405", precio:185 },
// 	  ],
// 	Electricas: [
// 		{ value: "Taladro", label: "Taladro", img: "https://yaqui.com.mx/cdn/shop/products/TALI-20A_e5f53438-0d59-48a3-9daa-ba9ec1ceab32.jpg?v=1746478029", precio:545 },
// 	  ],
// 	Computacion: [
// 		{ value: "Laptop", label: "Laptop", img: "https://m.media-amazon.com/images/I/81+fSmSTdRL._AC_UF894,1000_QL80_.jpg" , precio:3400},
// 	  ],
//   };
export const ConcesionadosAgregarEquipoModal: React.FC<AgregarEquiposModalProps> = ({
	title,
	children,
	isSuccess,
	setIsSuccess,
    setEquipos,
    indice,
    editarAgregarEquiposModal,
    setEditarAgregarEquiposModal,
    agregarEquiposSeleccion
}) => {
	const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
	const {location}= useBoothStore();
	
	const { 
		dataCon, 
		isLoadingCon: loadingCategorias 
	  } = useCatalogoConcesion(location??"",categoriaSeleccionada, isSuccess);
	
	const [categoriasCatalogo, setCategoriasCatalogo] = useState([])
	const [equiposCatalogo, setEquiposCatalogo] = useState<Equipo[]>([])
	
	const form = useForm<z.infer<typeof equipoSchema>>({
		resolver: zodResolver(equipoSchema),
		defaultValues: {
			id_movimiento: "", 
			categoria_equipo_concesion: "",
			nombre_equipo: "",
			cantidad_equipo_concesion: 0,
			comentario_entrega: "",
			imagen_equipo_concesion: [],
			costo_equipo_concesion: 0,
		},
	  });
	  
	const { reset } = form;

	const fetchEquipos = async () => {
		if (!categoriaSeleccionada) return
		try {
		  const equipos = await getTipoConcesion(
			location ?? "",
			categoriaSeleccionada
		  )
		  setEquiposCatalogo(equipos.response.data ?? [])
		} catch (error) {
		  console.error("Error al cargar equipos:", error)
		  setEquiposCatalogo([])
		  toast.error("No se pudieron cargar los equipos. Intenta de nuevo.")
		}
	}

	const equipoSeleccionadoNombre = form.watch("nombre_equipo");
	const cantidad = form.watch("cantidad_equipo_concesion"); 

	const equipoCompleto = equiposCatalogo?.find(
	(eq) => eq.article_name === equipoSeleccionadoNombre
	);

	const subtotal = equipoCompleto && cantidad 
	? (equipoCompleto.article_cost ?? 0) * cantidad 
	: 0;

	useEffect(() => {
		if (!dataCon?.length) return
	  
		if (categoriaSeleccionada === "") {
		  setCategoriasCatalogo(prev =>
			prev.length === 0 ? dataCon : prev
		  )
		}
	  }, [dataCon, categoriaSeleccionada])

	  useEffect(() => {
		fetchEquipos()
	  }, [categoriaSeleccionada, location])

	  useEffect(() => {
		setEquiposCatalogo([])
		form.setValue("nombre_equipo", "")
	  }, [categoriaSeleccionada])

	useEffect(() => {
        if (isSuccess){
			reset({
				id_movimiento:"",
				categoria_equipo_concesion: "",
				nombre_equipo: "",
				cantidad_equipo_concesion: 0,
				comentario_entrega: "",
				imagen_equipo_concesion: [],
				costo_equipo_concesion: 0,
			  });
			}

		if (editarAgregarEquiposModal && agregarEquiposSeleccion) {
			reset({
				id_movimiento: agregarEquiposSeleccion.id_movimiento, 
				categoria_equipo_concesion: agregarEquiposSeleccion.categoria_equipo_concesion,
				nombre_equipo: agregarEquiposSeleccion.nombre_equipo,
				cantidad_equipo_concesion: agregarEquiposSeleccion.cantidad_equipo_concesion,
				comentario_entrega: agregarEquiposSeleccion.comentario_entrega,
				imagen_equipo_concesion: agregarEquiposSeleccion.imagen_equipo_concesion,
				costo_equipo_concesion: agregarEquiposSeleccion.costo_equipo_concesion,
			});
		  }
	}, [isSuccess, reset, editarAgregarEquiposModal, agregarEquiposSeleccion]);

	function onSubmit(values: z.infer<typeof equipoSchema>) {
		const id_movimiento = `MOV-${format(new Date(), 'yyyyMMddHHmmss')}`;
		console.log("id_movimiento", id_movimiento)
        const formatData = {
			// id_movimiento:id_movimiento,
			categoria_equipo_concesion: values.categoria_equipo_concesion,
			nombre_equipo: values.nombre_equipo,
			cantidad_equipo_concesion: values.cantidad_equipo_concesion,
			comentario_entrega: values.comentario_entrega,
			imagen_equipo_concesion: values.imagen_equipo_concesion,
			costo_equipo_concesion: values.costo_equipo_concesion,
			// total: subtotal
		  };
        if(editarAgregarEquiposModal){
            setEditarAgregarEquiposModal(false)
			setEquipos((prev: any[]) =>
				prev.map((item, i) => (i === indice ? {...formatData, id_movimiento: item.id_movimiento} : item)) 
			  );
            toast.success("Equipo editado correctamente.")
        }else{
            setEquipos((prev: any) => [...prev, formatData]);
            toast.success("Equipo agregada correctamente.")
        }
        setIsSuccess(false)
	}
	console.log("ERRORES",form?.formState?.errors)

	const handleClose = () => {
		setIsSuccess(false);
        setEditarAgregarEquiposModal(false);
	};


	const categoriaSel = form.watch("categoria_equipo_concesion") as string | undefined;
	const equipoSeleccionado = form.watch("nombre_equipo") as string | undefined;

	useEffect(() => {
		form.setValue("nombre_equipo", "");
	  }, [categoriaSel]);
	
	// const subtotal =
	// equipoData && unidades
	//   ? equipoData.precio * unidades
	//   : 0;


	  
	return (
		<Dialog onOpenChange={setIsSuccess} open={isSuccess} modal>
			<DialogTrigger>{children}</DialogTrigger>
            
            <DialogContent className="max-w-xl max-h-[80vh] min-h-auto flex flex-col overflow-auto" onInteractOutside={(e) => e.preventDefault()} aria-describedby="" >
            <DialogHeader>
                <DialogTitle className="text-2xl text-center font-bold">
                {title}
                </DialogTitle>
            </DialogHeader>
                <div className="flex-grow overflow-y-auto px-2">
                <Form {...form}>
					<form  >
						<div className="grid grid-cols-2 gap-5 mb-6 px-2">
						<FormField
							control={form.control}
							name="categoria_equipo_concesion"
							render={({ field }: any) => (
							<FormItem>
								<FormLabel>
								<div className="text-red-500">
									*<span className="text-black"> Categoría:</span>
								</div>
								</FormLabel>
								<Select 
								onValueChange={(value) => {
									field.onChange(value);
									setCategoriaSeleccionada(value); 
									form.setValue("nombre_equipo", ""); 
								}}
								value={field.value}
								>
								<FormControl>
									<SelectTrigger>
									<SelectValue placeholder="Selecciona una categoría" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{loadingCategorias ? (
									<SelectItem value="loading" disabled>
										Cargando categorías...
									</SelectItem>
									) : categoriasCatalogo && categoriasCatalogo.length > 0 ? (
									categoriasCatalogo.map((cat: any) => (
										<SelectItem key={cat} value={cat}>
										{cat}
										</SelectItem>
									))
									) : (
									<>
										<SelectItem key="Herramienta" value="Herramienta">
										Herramienta
										</SelectItem>
										<SelectItem key="Computacion" value="Computacion">
										Computación
										</SelectItem>
										<SelectItem key="Electricas" value="Electricas">
										Eléctricas
										</SelectItem>
									</>
									)}
								</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
							)}
						/>

							<FormField
								control={form.control}
								name="nombre_equipo"
								render={({ field }: any) => (
								<FormItem>
									<FormLabel>
									<div className="text-red-500">
										*<span className="text-black"> Equipo:</span>
									</div>
									</FormLabel>
									<FormControl>
									<Select 
										onValueChange={field.onChange}
										value={field.value}
										disabled={!categoriaSeleccionada}
									>
										<FormControl>
										<SelectTrigger>
											<SelectValue placeholder={
											!categoriaSeleccionada 
												? "Primero selecciona una categoría"
												: "Selecciona un equipo"
											} />
										</SelectTrigger>
										</FormControl>
										<SelectContent>
										{loadingCategorias && categoriaSeleccionada ? (
											<SelectItem value="loading" disabled>
											Cargando equipos...
											</SelectItem>
										) : equiposCatalogo && equiposCatalogo.length > 0 ? (
											equiposCatalogo.map((equipo: any) => (
											<SelectItem key={equipo.article_name} value={equipo.article_name}>
												{equipo.article_name}
											</SelectItem>
											))
										) : categoriaSeleccionada ? (
											<SelectItem value="no-data" disabled>
											No hay equipos disponibles
											</SelectItem>
										) : null}
										</SelectContent>
									</Select>
									</FormControl>
									<FormMessage />


								
								</FormItem>
								)}
							/>
						{equipoSeleccionado && equiposCatalogo && (() => {
							const imagenUrl = equiposCatalogo
							?.find((eq: any) => eq.article_name === equipoSeleccionado)
							?.article_image?.[0]?.file_url || '/mountain.svg';
					  
							const precio = equiposCatalogo
							?.find((eq: any) => eq.article_name === equipoSeleccionado)
							?.article_cost || 0;
							form.setValue("costo_equipo_concesion",precio )

							return imagenUrl ? (
								<div className="mt-4 flex flex-col justify-center">
									
								<Image
									width={100}
									height={100}
									src={imagenUrl}
									alt={equipoSeleccionado}
									className="h-40 object-contain rounded-md border"
								/>
									<div className="flex gap-2 items-center text-blue-500 mt-2">
										<span className="flex font-bold text-md"><Calculator/> Precio unitario:</span>
										<span className="font-bold text-sm">{formatCurrency(precio)}</span>
									</div>
								</div>
							) : null;
						})()}

                       <div className="col-span-2">
                            <FormField
                                control={form.control}
                                name="cantidad_equipo_concesion"
                                render={({ field }: any) => (
                                    <FormItem>
                                        <FormLabel>Unidades:</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="Unidades..." {...field}
                                               onChange={(e) => {
													const value = e.target.value === '' ? 0 : Number(e.target.value);
													field.onChange(value);
												}}
												value={Number(field.value) || 0}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="col-span-2">
                            <FormField
								control={form.control}
								name="comentario_entrega"
								render={({ field }: any) => (
									<FormItem>
										<FormLabel>Comentarios: *</FormLabel>
										<FormControl>
											<Textarea placeholder="Comentarios..." {...field}
												onChange={(e) => {
													field.onChange(e);
												}}
												value={field.value || ""}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
                            <div className="flex gap-2 items-center text-blue-500 mt-2">
                                <span className="flex font-bold text-lg"><Calculator/> Subtotal($):</span>
                                <span className="font-bold text-lg">{formatCurrency(subtotal)}</span>
                            </div>
                        </div>


                         
                            <div className="w-full md:w-1/2 pr-2">
								<Controller
									control={form.control}
									name="imagen_equipo_concesion"
									render={({ field, fieldState }) => (
									<div className="flex">
										<span className="text-red-500 mr-1">*</span>
										<div className="felx flex-col">
										<LoadImage
											id="fotografia"
											titulo={"Evidencia"}
											showWebcamOption={true}
											imgArray={field.value||[]} 
											setImg={field.onChange} 
											facingMode="user" 
											limit={1}/>
											{fieldState.error && <span className="block w-full text-red-500 text-sm mt-1">{fieldState.error.message}</span>}
										</div>
									</div>)
								}/>
							</div>
						</div>
                       
					</form>
				</Form>
                </div>


                <div className="sticky bottom-0 z-50 bg-white pt-4 px-2 flex gap-2 border-t border-slate-200 mt-4">
                <DialogClose asChild>
                    <Button
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700"
                    onClick={handleClose}
                    >
                    Cancelar
                    </Button>
                </DialogClose>

                <Button
                    onClick={form.handleSubmit(onSubmit)}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                >
                    {editarAgregarEquiposModal ? "Editar" : "Agregar"}
                </Button>
                </div>
			</DialogContent>
		</Dialog>
	);
};
