/* eslint-disable react-hooks/exhaustive-deps */
import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { useForm } from "react-hook-form";
import { Textarea } from "../ui/textarea";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import LoadImage, { Imagen } from "../upload-Image";

import { useCatalogoAreaEmpleado } from "@/hooks/useCatalogoAreaEmpleado";
import { format,  } from 'date-fns';

import { useCatalogoArticulos } from "@/hooks/useCatalogoArticulos";
import { Input } from "../ui/input";
import { capitalizeFirstLetter, catalogoColores } from "@/lib/utils";
import { Articulo_perdido_record } from "../table/articulos/perdidos/pendientes-columns";
import { useGetLockers } from "@/hooks/useGetLockers";
import { Camera, Edit, Loader2, MapPin, Package, User } from "lucide-react";
import DateTime from "../dateTime";
import { useArticulosPerdidos } from "@/hooks/useArticulosPerdidos";
import { useCatalogoPaseAreaLocation } from "@/hooks/useCatalogoPaseAreaLocation";

interface EditarFallaModalProps {
  	title: string;
	data: Articulo_perdido_record;
	setShowLoadingModal:Dispatch<SetStateAction<boolean>>;
	showLoadingModal:boolean;
}

const formSchema = z.object({
	area_perdido: z.string().min(1, { message: "Este campo es obligatorio" }),
	articulo_perdido: z.string().optional(),
	articulo_seleccion: z.string().min(1, { message: "Comentario es obligatorio" }), 
    color_perdido:z.string().min(1, { message: "Comentario es obligatorio" }), 
	comentario_perdido:z.string().optional(),
	date_hallazgo_perdido: z.string().optional(),
	descripcion: z.string().optional(),
	estatus_perdido: z.string().optional(), 
	foto_perdido: z.array(
        z.object({
          file_url: z.string(),
          file_name: z.string(),
        })
      ).optional(),
	locker_perdido: z.string().min(1, { message: "Este campo es obligatorio" }), 
	quien_entrega: z.string().optional(),
    quien_entrega_externo: z.string().optional(),
    quien_entrega_interno: z.string().optional(),
    tipo_articulo_perdido: z.string().min(1, { message: "Este campo es obligatorio" }), 
    ubicacion_perdido: z.string().min(1, { message: "Este campo es obligatorio" }),
});

export const EditarArticuloModal: React.FC<EditarFallaModalProps> = ({
  	title,
	data,
	setShowLoadingModal,
    showLoadingModal
}) => {
	const [isSuccess, setIsSuccess] =useState(false)
	const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState(data.ubicacion_perdido);
	const { dataAreas:areas, dataLocations:ubicaciones, isLoadingLocations, isLoadingAreas} = useCatalogoPaseAreaLocation(ubicacionSeleccionada, showLoadingModal|| isSuccess,  ubicacionSeleccionada?true:false);
	const { data:dataAreaEmpleado, isLoading:loadingAreaEmpleado } = useCatalogoAreaEmpleado(showLoadingModal|| isSuccess, ubicacionSeleccionada, "Objetos Perdidos");
    const [tipoArt, setTipoArt] = useState<string>(data.tipo_articulo_perdido);
	
    const { data: dataArticulos , isLoading: isLoadingArticles} = useCatalogoArticulos(tipoArt, showLoadingModal|| isSuccess);
	const { editarArticulosPerdidosMutation, isLoading} = useArticulosPerdidos("","", "abierto", false, "", "", "")
	const [evidencia , setEvidencia] = useState<Imagen[]>([]);
	const [date, setDate] = useState<Date|"">("");
    const [isActiveInterno, setIsActiveInterno] = useState< string | null>(data?.quien_entrega ? data?.quien_entrega.toLocaleLowerCase():"");
    const { data:responseGetLockers, isLoading:loadingGetLockers } = useGetLockers(ubicacionSeleccionada ?? null,"", "Disponible", isSuccess);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
            area_perdido: data.area_perdido,
            articulo_perdido: data.articulo_perdido,
            articulo_seleccion: data.articulo_seleccion, 
            color_perdido: capitalizeFirstLetter(data.color_perdido??""), 
            comentario_perdido: data.comentario_perdido,
            date_hallazgo_perdido: data.date_hallazgo_perdido, 
            descripcion: data.descripcion, 
            estatus_perdido: data.estatus_perdido,
            foto_perdido: evidencia,
            locker_perdido: data.locker_perdido,
            quien_entrega: data.quien_entrega,
            quien_entrega_externo: data.quien_entrega_externo,
            quien_entrega_interno: data.quien_entrega_interno, 
            tipo_articulo_perdido: tipoArt,
            ubicacion_perdido: data.ubicacion_perdido,
		},
	});

	const { reset } = form;

	useEffect(()=>{
		if(isSuccess){
			reset()
			setEvidencia(data.foto_perdido)
			setDate(new Date(data.date_hallazgo_perdido))
			setShowLoadingModal(false)
		}
	},[isSuccess, ubicaciones, areas])

    useEffect(()=>{
		if(!isLoading){
			handleClose()			
		}
	},[isLoading])

	function onSubmit(values: z.infer<typeof formSchema>) {
		let formattedDate=""
		if(date){
			formattedDate = format( new Date(date), 'yyyy-MM-dd HH:mm:ss');
			const formatData ={
                area_perdido: values.area_perdido || "",
                articulo_perdido:  values.articulo_perdido|| "",
                articulo_seleccion:  values.articulo_seleccion|| "", 
                color_perdido:  values.color_perdido|| "", 
                comentario_perdido:  values.comentario_perdido|| "",
                date_hallazgo_perdido: formattedDate|| "", 
                descripcion:  values.descripcion|| "", 
                estatus_perdido:  values.estatus_perdido|| "pendiente",
                foto_perdido: evidencia || [],
                locker_perdido:  values.locker_perdido|| "",
                quien_entrega:  values.quien_entrega|| "externo",
                quien_entrega_externo:  values.quien_entrega_externo|| "",
                quien_entrega_interno:  values.quien_entrega_interno|| "", 
                tipo_articulo_perdido: tipoArt|| "",
                ubicacion_perdido:  values.ubicacion_perdido|| "",
				}
				editarArticulosPerdidosMutation.mutate({data_article_update: formatData, folio: data.folio})
		}else{
			form.setError("date_hallazgo_perdido", { type: "manual", message: "Fecha es un campo requerido." });
		}
	}

	const handleClose = () => {
		reset()
		setShowLoadingModal(false); 
        setIsSuccess(false); 
	};


   useEffect(()=>{
        if(showLoadingModal){
            setTimeout(() => {
                setIsSuccess(true); 
            }, 4000);
        }
   },[showLoadingModal])

	const handleOpenModal = async () => {
		setShowLoadingModal(true);
	};

	return (
		<Dialog open={isSuccess} onOpenChange={setIsSuccess} modal>
		  <div className="cursor-pointer" title="Editar Artículo" onClick={handleOpenModal}>
			<Edit className="w-5 h-5" />
		  </div>
	  
		  <DialogContent
			className="p-0 overflow-hidden !max-w-[900px] w-[95vw] sm:w-[92vw] max-h-[95vh] rounded-3xl shadow-2xl flex flex-col border-none bg-background"
			aria-describedby="">
	  
			<DialogHeader className="px-8 pt-8 pb-4 shrink-0 border-b border-slate-100">
			  <DialogTitle className="text-2xl text-center font-bold text-gray-800">
				{title}
			  </DialogTitle>
			  <p className="text-center text-sm text-gray-400">
				Modifica la información del artículo perdido
			  </p>
			</DialogHeader>
	  
			<div className="overflow-y-auto flex-1 px-8 no-scrollbar">
			  {!isSuccess ? (
				// Skeleton mientras carga
				<div className="space-y-6">
				  {[1, 2, 3].map((s) => (
					<div key={s} className="space-y-4">
					  <div className="h-4 w-40 bg-slate-100 rounded animate-pulse" />
					  <div className="grid grid-cols-2 gap-5">
						{[1, 2, 3, 4].map((i) => (
						  <div key={i} className="space-y-2">
							<div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
							<div className="h-10 w-full bg-slate-100 rounded-lg animate-pulse" />
						  </div>
						))}
					  </div>
					</div>
				  ))}
				</div>
			  ) : (
				<Form {...form}>
				  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
	  
					{/* Información general */}
					<div className="space-y-4">
					  <div className="flex items-center gap-2">
						<MapPin className="text-blue-500 w-5 h-5" />
						<h3 className="font-semibold text-gray-700">Información general</h3>
					  </div>
					  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
						<FormField control={form.control} name="ubicacion_perdido"
						  render={({ field }: any) => (
							<FormItem>
							  <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ubicación</FormLabel>
							  <FormControl>
								<Select {...field} onValueChange={(value: string) => { field.onChange(value); setUbicacionSeleccionada(value); }} value={ubicacionSeleccionada}>
								  <SelectTrigger className="w-full">
									{isLoadingLocations ? <SelectValue placeholder="Cargando ubicaciones..." /> : <SelectValue placeholder="Selecciona una ubicación" />}
								  </SelectTrigger>
								  <SelectContent>
									{ubicaciones?.map((v: string, i: number) => <SelectItem key={i} value={v}>{v}</SelectItem>)}
								  </SelectContent>
								</Select>
							  </FormControl>
							  <FormMessage />
							</FormItem>
						  )}
						/>
	  
						<FormField control={form.control} name="area_perdido"
						  render={({ field }: any) => (
							<FormItem>
							  <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Área</FormLabel>
							  <FormControl>
								<Select {...field} onValueChange={(value: string) => field.onChange(value)} value={field.value}>
								  <SelectTrigger className="w-full">
									{isLoadingAreas
									  ? <SelectValue placeholder="Cargando áreas..." />
									  : <SelectValue placeholder={areas?.length > 0 ? "Selecciona una opción..." : "Selecciona una ubicación primero"} />}
								  </SelectTrigger>
								  <SelectContent>
									{areas?.length > 0
									  ? areas.map((a: string, i: number) => <SelectItem key={i} value={a}>{a}</SelectItem>)
									  : <SelectItem key="1" value="1" disabled>No hay opciones disponibles.</SelectItem>}
								  </SelectContent>
								</Select>
							  </FormControl>
							  <FormMessage />
							</FormItem>
						  )}
						/>
	  
						<FormField control={form.control} name="date_hallazgo_perdido"
						  render={() => (
							<FormItem>
							  <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha del hallazgo</FormLabel>
							  <FormControl>
								<DateTime date={date} setDate={setDate} />
							  </FormControl>
							  <FormMessage />
							</FormItem>
						  )}
						/>
	  
						<FormField control={form.control} name="locker_perdido"
						  render={({ field }: any) => (
							<FormItem>
							  <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Área de resguardo</FormLabel>
							  <FormControl>
								<Select {...field} onValueChange={(value: string) => field.onChange(value)} value={field.value}>
								  <SelectTrigger className="w-full">
									{loadingGetLockers ? <SelectValue placeholder="Cargando opciones..." /> : <SelectValue placeholder="Selecciona una opción" />}
								  </SelectTrigger>
								  <SelectContent>
									{responseGetLockers
									  ? responseGetLockers.map((locker: any, i: number) => <SelectItem key={i} value={locker.locker_id}>{locker.locker_id}</SelectItem>)
									  : <SelectItem value="0" disabled>Selecciona una ubicación</SelectItem>}
								  </SelectContent>
								</Select>
							  </FormControl>
							  <FormMessage />
							</FormItem>
						  )}
						/>
					  </div>
					</div>
	  
					{/* Fotografía */}
					<div className="space-y-4">
					  <div className="flex items-center gap-2">
						<Camera className="text-blue-500 w-5 h-5" />
						<h3 className="font-semibold text-gray-700">Fotografía del artículo</h3>
					  </div>
					  <div className="grid grid-cols-2">
						<LoadImage
						  id="evidencia"
						  titulo="Fotografía del artículo"
						  setImg={setEvidencia}
						  showWebcamOption={true}
						  facingMode="environment"
						  imgArray={evidencia}
						  limit={10}
						/>
					  </div>
					</div>
					{/* Detalles del artículo */}
					<div className="space-y-4">
					  <div className="flex items-center gap-2">
						<Package className="text-blue-500 w-5 h-5" />
						<h3 className="font-semibold text-gray-700">Detalles del artículo</h3>
					  </div>
					  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
						<FormField control={form.control} name="articulo_perdido"
						  render={({ field }: any) => (
							<FormItem>
							  <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre</FormLabel>
							  <FormControl>
								<Input placeholder="Nombre del artículo" {...field} value={field.value} />
							  </FormControl>
							  <FormMessage />
							</FormItem>
						  )}
						/>
	  
						<FormField control={form.control} name="tipo_articulo_perdido"
						  render={({ field }: any) => (
							<FormItem>
							  <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo de artículo</FormLabel>
							  <FormControl>
								<Select {...field} onValueChange={(value: string) => { field.onChange(value); setTipoArt(value); }} value={tipoArt}>
								  <SelectTrigger className="w-full">
									{isLoadingArticles && tipoArt === ""
									  ? <SelectValue placeholder="Cargando artículos..." />
									  : <SelectValue placeholder="Selecciona un tipo" />}
								  </SelectTrigger>
								  <SelectContent>
								  {[...new Set(dataArticulos ?? [])].map((v: unknown, i: number) => (
									<SelectItem key={i} value={v as string}>{v as string}</SelectItem>
									))}
								  </SelectContent>
								</Select>
							  </FormControl>
							  <FormMessage />
							</FormItem>
						  )}
						/>
	  
						<FormField control={form.control} name="articulo_seleccion"
						  render={({ field }: any) => (
							<FormItem>
							  <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Artículo</FormLabel>
							  <FormControl>
								<Select {...field} onValueChange={(value: string) => field.onChange(value)} value={field.value}>
								  <SelectTrigger className="w-full">
									{isLoadingArticles && tipoArt
									  ? <SelectValue placeholder="Cargando artículos..." />
									  : <SelectValue placeholder={dataArticulos?.length > 0 ? "Selecciona una opción..." : "Selecciona una categoría primero"} />}
								  </SelectTrigger>
								  <SelectContent>
									{dataArticulos?.length > 0
									  ? [...new Set(dataArticulos ?? [])].map((v: unknown, i: number) => (
										<SelectItem key={i} value={v as string}>{v as string}</SelectItem>
									  ))
									  : <SelectItem disabled value="no opciones">No hay opciones disponibles</SelectItem>}
								  </SelectContent>
								</Select>
							  </FormControl>
							  <FormMessage />
							</FormItem>
						  )}
						/>
	  
						<FormField control={form.control} name="color_perdido"
						  render={({ field }: any) => (
							<FormItem>
							  <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Color</FormLabel>
							  <FormControl>
								<Select {...field} onValueChange={(value: string) => field.onChange(value)} value={field.value}>
								  <SelectTrigger className="w-full">
									<SelectValue placeholder="Selecciona un color" />
								  </SelectTrigger>
								  <SelectContent>
									{catalogoColores().map((v: string) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
								  </SelectContent>
								</Select>
							  </FormControl>
							  <FormMessage />
							</FormItem>
						  )}
						/>
	  
						<FormField control={form.control} name="descripcion"
						  render={({ field }: any) => (
							<FormItem className="col-span-2">
							  <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Descripción</FormLabel>
							  <FormControl>
								<Textarea placeholder="Escribe una descripción..." className="resize-none" {...field} value={field.value} />
							  </FormControl>
							  <FormMessage />
							</FormItem>
						  )}
						/>
	  
						<FormField control={form.control} name="comentario_perdido"
						  render={({ field }: any) => (
							<FormItem className="col-span-2">
							  <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Comentarios</FormLabel>
							  <FormControl>
								<Textarea placeholder="Comentarios adicionales..." className="resize-none" {...field} value={field.value} />
							  </FormControl>
							  <FormMessage />
							</FormItem>
						  )}
						/>
					  </div>
					</div>
	  
					{/* Quién entrega */}
					<div className="space-y-4">
					  <div className="flex items-center gap-2">
						<User className="text-blue-500 w-5 h-5" />
						<h3 className="font-semibold text-gray-700">Quién entrega</h3>
					  </div>
					  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
						<div className="flex gap-2">
						  <button type="button" onClick={() => setIsActiveInterno("interno")}
							className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
							  isActiveInterno === "interno"
								? "bg-blue-600 text-white shadow-sm"
								: "border border-blue-400 text-blue-600 bg-white hover:bg-blue-50"
							}`}>
							Interno
						  </button>
						  <button type="button" onClick={() => setIsActiveInterno("externo")}
							className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
							  isActiveInterno === "externo"
								? "bg-blue-600 text-white shadow-sm"
								: "border border-blue-400 text-blue-600 bg-white hover:bg-blue-50"
							}`}>
							Externo
						  </button>
						</div>
	  
					
					  </div>
					  {isActiveInterno === "interno" ? (
						  <FormField control={form.control} name="quien_entrega_interno"
							render={({ field }: any) => (
							  <FormItem>
								<FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Quien entrega (Interno)</FormLabel>
								<FormControl>
								  <Select {...field} onValueChange={(value: string) => field.onChange(value)} value={field.value}>
									<SelectTrigger className="w-full">
									  {loadingAreaEmpleado ? <SelectValue placeholder="Cargando opciones..." /> : <SelectValue placeholder="Selecciona una opción" />}
									</SelectTrigger>
									<SelectContent>
									  {dataAreaEmpleado?.map((v: string, i: number) => <SelectItem key={i} value={v}>{v}</SelectItem>)}
									</SelectContent>
								  </Select>
								</FormControl>
								<FormMessage />
							  </FormItem>
							)}
						  />
						) : (
						  <FormField control={form.control} name="quien_entrega_externo"
							render={({ field }: any) => (
							  <FormItem>
								<FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Quien entrega (Externo)</FormLabel>
								<FormControl>
								  <Input placeholder="Nombre de quien entrega" {...field} value={field.value} />
								</FormControl>
								<FormMessage />
							  </FormItem>
							)}
						  />
						)}
					</div>
	  
	  
				  </form>
				</Form>
			  )}
			</div>
	  
			<div className="flex gap-2 px-8 py-4 border-t border-slate-100 shrink-0">
			  <DialogClose asChild>
				<Button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700" onClick={handleClose}>
				  Cancelar
				</Button>
			  </DialogClose>
			  <Button type="submit" onClick={form.handleSubmit(onSubmit)}
				className="w-full bg-blue-500 hover:bg-blue-600 text-white" disabled={isLoading}>
				{isLoading ? <><Loader2 className="animate-spin" /> Editando artículo...</> : "Editar artículo"}
			  </Button>
			</div>
		  </DialogContent>
		</Dialog>
	  );
};
