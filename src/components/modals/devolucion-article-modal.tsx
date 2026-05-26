/* eslint-disable react-hooks/exhaustive-deps */
//eslint-disable react-hooks/exhaustive-deps
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
import { useEffect, useState } from "react";
import LoadImage, { Imagen } from "../upload-Image";
import { ArrowRightLeft, Loader2 } from "lucide-react";
import { Input } from "../ui/input";
import { useShiftStore } from "@/store/useShiftStore";
import { useArticulosPerdidos } from "@/hooks/useArticulosPerdidos";
import { User, Camera } from "lucide-react";
interface AddFallaModalProps {
  	title: string;
	data: any;
}

const formSchema = z.object({
	estatus_perdido: z.string().min(1, { message: "Este campo es oblicatorio" }),
	foto_recibe_perdido: z.array(
    z.object({
      file_url: z.string(),
      file_name: z.string(),
    })
  ).optional(),
	identificacion_recibe_perdido:  z.array(
    z.object({
      file_url: z.string(),
      file_name: z.string(),
    })
  ).optional(),
	recibe_perdido: z.string().min(1, { message: "Este campo es oblicatorio" }),
	telefono_recibe_perdido: z.string().min(1, { message: "Este campo es oblicatorio" })
});

export const DevolucionArticuloModal: React.FC<AddFallaModalProps> = ({
  	title,
	data,
}) => {
	const { area, location } = useShiftStore();
	const [isSuccess, setIsSuccess] =useState(false)
	const [foto, setFoto] = useState<Imagen[]>([]);
	const [iden , setIden] = useState<Imagen[]>([]);
	const { devolverArticulosPerdidosMutation, isLoading} = useArticulosPerdidos(location,area, "", false, "", "", "")
	const [isActiveDevolucion, setIsActiveDevolucion] = useState<string>("entregado");

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			estatus_perdido: isActiveDevolucion,
			foto_recibe_perdido: foto,
			identificacion_recibe_perdido: iden,
			recibe_perdido: "",
			telefono_recibe_perdido: "",
		},
	});

	const { reset } = form;

	useEffect(()=>{
		if(isSuccess){
			reset()
			setIden([])
			setFoto([])
		}
	},[isSuccess, reset])

	useEffect(()=>{
		if(!isLoading){
			handleClose()			
		}
	},[isLoading])

	function onSubmit(values: z.infer<typeof formSchema>) {
    
		if(foto && iden && isActiveDevolucion){
			const formatData ={
				estatus_perdido: isActiveDevolucion,
				foto_recibe_perdido: foto,
				identificacion_recibe_perdido: iden,
				recibe_perdido: values.recibe_perdido,
				telefono_recibe_perdido: values.telefono_recibe_perdido,
			}
			devolverArticulosPerdidosMutation.mutate({data_article_update:formatData, folio:data.folio, location, area , status:formatData.estatus_perdido})
		}else{
		if (!foto) {
			form.setError("foto_recibe_perdido", {
				type: "manual",
				message: "Foto es un campo requerido.",
			});
		}
		if (!iden) {
			form.setError("identificacion_recibe_perdido", {
				type: "manual",
				message: "Identificación es un campo requerido.",
			});
		}
		if (!iden) {
			form.setError("estatus_perdido", {
				type: "manual",
				message: "Estatus es un campo requerido.",
			});
		}
	}
	}

	const handleClose = () => {
		setIsSuccess(false); 
	};

	useEffect(()=>{
		if(!isLoading){
			handleClose()			
		}
	},[isLoading])

    const handleOpenModal = async () => {
		setIsSuccess(true);
	};

	return (
		<Dialog onOpenChange={setIsSuccess} open={isSuccess}>
		  <div className="cursor-pointer" title="Devolver Artículo" onClick={handleOpenModal}>
			<ArrowRightLeft className="w-5 h-5" />
		  </div>
	  
		  <DialogContent
			className="p-0 overflow-hidden !max-w-[700px] w-[95vw] rounded-3xl shadow-2xl flex flex-col border-none bg-background"
			aria-describedby="">
	  
			<DialogHeader className="px-8 pt-8 pb-4 shrink-0 border-b border-slate-100">
			  <DialogTitle className="text-2xl text-center font-bold text-gray-800">
				{title}
			  </DialogTitle>
			  <p className="text-center text-sm text-gray-400">
				Registra la devolución del artículo
			  </p>
			</DialogHeader>
	  
			<div className="overflow-y-auto flex-1 px-8 no-scrollbar">
			  <div className="flex gap-2 mb-6">
				<p className="text-sm font-semibold text-gray-500">Folio:</p>
				<p className="text-sm font-bold text-blue-500">{data?.folio}</p>
			  </div>
	  
			  <Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
	  
				  {/* Datos de quien recibe */}
				  <div className="space-y-4">
					<div className="flex items-center gap-2">
					  <User className="text-blue-500 w-5 h-5" />
					  <h3 className="font-semibold text-gray-700">Datos de quien recibe</h3>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
					  <FormField control={form.control} name="recibe_perdido"
						render={({ field }: any) => (
						  <FormItem>
							<FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Recibe</FormLabel>
							<FormControl>
							  <Input placeholder="Nombre de quien recibe..." {...field}
								onChange={(e) => field.onChange(e)} value={field.value || ""} />
							</FormControl>
							<FormMessage />
						  </FormItem>
						)}
					  />
	  
					  <FormField control={form.control} name="telefono_recibe_perdido"
						render={({ field }: any) => (
						  <FormItem>
							<FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Teléfono</FormLabel>
							<FormControl>
							  <Input placeholder="Teléfono..." {...field}
								onChange={(e) => field.onChange(e)} value={field.value || ""} />
							</FormControl>
							<FormMessage />
						  </FormItem>
						)}
					  />
					</div>
				  </div>
	  
				  {/* Fotografías */}
				  <div className="space-y-4">
					<div className="flex items-center gap-2">
					  <Camera className="text-blue-500 w-5 h-5" />
					  <h3 className="font-semibold text-gray-700">Fotografías</h3>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
					  <LoadImage
						id="foto_recibe_perdido"
						titulo="Foto de quien recibe"
						setImg={setFoto}
						showWebcamOption={true}
						facingMode="user"
						imgArray={foto}
						limit={10}
					  />
					  <LoadImage
						id="identificacion_recibe_perdido"
						titulo="Identificación de quien recibe"
						setImg={setIden}
						showWebcamOption={true}
						facingMode="user"
						imgArray={iden}
						limit={10}
						tipoOcr="id"
						onOcrResult={(result) => {
						  if (result?.nombre) form.setValue("recibe_perdido", result.nombre);
						  if (result?.telefono) form.setValue("telefono_recibe_perdido", result.telefono);
						}}
					  />
					</div>
				  </div>
	  
				  {/* Tipo de devolución */}
				  <div className="space-y-4">
					<div className="flex items-center gap-2">
					  <ArrowRightLeft className="text-blue-500 w-5 h-5" />
					  <h3 className="font-semibold text-gray-700">Tipo de devolución</h3>
					</div>
					<div className="flex gap-2">
					  <button type="button" onClick={() => setIsActiveDevolucion("entregado")}
						className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
						  isActiveDevolucion === "entregado"
							? "bg-blue-600 text-white shadow-sm"
							: "border border-blue-400 text-blue-600 bg-white hover:bg-blue-50"
						}`}>
						Entregado
					  </button>
					  <button type="button" onClick={() => setIsActiveDevolucion("Donado")}
						className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
						  isActiveDevolucion === "Donado"
							? "bg-blue-600 text-white shadow-sm"
							: "border border-blue-400 text-blue-600 bg-white hover:bg-blue-50"
						}`}>
						Donado
					  </button>
					</div>
				  </div>
	  
				</form>
			  </Form>
			</div>
	  
			<div className="flex gap-2 px-8 py-4 border-t border-slate-100 shrink-0">
			  <DialogClose asChild>
				<Button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700" onClick={handleClose}>
				  Cancelar
				</Button>
			  </DialogClose>
			  <Button type="submit" onClick={form.handleSubmit(onSubmit)}
				className="w-full bg-blue-500 hover:bg-blue-600 text-white" disabled={isLoading}>
				{isLoading ? <><Loader2 className="animate-spin" /> Devolviendo artículo...</> : "Devolver artículo"}
			  </Button>
			</div>
		  </DialogContent>
		</Dialog>
	  );
};
