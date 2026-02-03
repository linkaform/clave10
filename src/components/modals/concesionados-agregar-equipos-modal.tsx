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
import { Dispatch, SetStateAction, useEffect } from "react";
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

const formSchema = z.object({
	categoria: z.string().min(1, { message: "Este campo es oblicatorio" }),
	equipo: z.string().min(1, { message: "Este campo es oblicatorio" }),
	unidades: z.number().optional(),
	comentarios:  z.string().optional(),
	evidencia:  z.array(z.any()).optional(),
	precio:z.number().optional()
});

type Equipo = {
	value: string;
	label: string;
	img: string;
	precio:number;
  };
  
const equiposPorCategoria: Record<string, Equipo[]> ={
	Herramienta: [
		{ value: "Martillo", label: "Martillo", img: "https://m.media-amazon.com/images/I/61CTt-OrpzL.jpg", precio:200 },
		{ value: "Desarmador", label: "Desarmador", img: "https://incom.mx/cdn/shop/files/URREA_9308M-DESARMADOR_PUNTAS_INTERCAMBIABLES-F1.jpg?v=1752030405", precio:185 },
	  ],
	Electricas: [
		{ value: "Taladro", label: "Taladro", img: "https://yaqui.com.mx/cdn/shop/products/TALI-20A_e5f53438-0d59-48a3-9daa-ba9ec1ceab32.jpg?v=1746478029", precio:545 },
	  ],
	Computacion: [
		{ value: "Laptop", label: "Laptop", img: "https://m.media-amazon.com/images/I/81+fSmSTdRL._AC_UF894,1000_QL80_.jpg" , precio:3400},
	  ],
  };
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

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			categoria: "",
            equipo: "",
			unidades: 0,
			comentarios: "",
			evidencia: [],
			precio: 0,
		},
	});

	const { reset } = form;

	useEffect(() => {
        if (isSuccess){
            reset({
                categoria: "",
                equipo: "",
                unidades: 0,
				evidencia:[],
                comentarios: "",
                precio:0,
              });
        }

		if (editarAgregarEquiposModal && agregarEquiposSeleccion) {
			reset({
                categoria: agregarEquiposSeleccion.categoria,
                equipo: agregarEquiposSeleccion.equipo,
                unidades: agregarEquiposSeleccion.unidades,
                comentarios: agregarEquiposSeleccion.comentarios,
                evidencia: agregarEquiposSeleccion.evidencia,
				precio:agregarEquiposSeleccion.precio
              });
		}
	}, [isSuccess, reset])

	function onSubmit(values: z.infer<typeof formSchema>) {
        const formatData = {
            categoria: values.categoria,
            equipo: values.equipo,
            unidades: values.unidades,
            comentarios: values.comentarios,
            evidencia: values.evidencia,
			precio:values.precio,
			total: subtotal
        }
        if(editarAgregarEquiposModal){
            setEditarAgregarEquiposModal(false)
            setEquipos((prev: any[]) =>
                prev.map((item, i) => (i === indice ? formatData : item))
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


    useEffect(() => {
        if(form.formState.errors){
            console.log("Errores:", form.formState.errors)
        }
    }, [form.formState.errors])

	const categoriaSeleccionada = form.watch("categoria") as string | undefined;
	const equipoSeleccionado = form.watch("equipo") as string | undefined;
	const unidades = form.watch("unidades") as number | undefined;

	useEffect(() => {
		form.setValue("equipo", "");
	  }, [categoriaSeleccionada]);
	
	const equipoData =
	categoriaSeleccionada && equiposPorCategoria[categoriaSeleccionada]
	? equiposPorCategoria[categoriaSeleccionada].find(
		(e) => e.value === equipoSeleccionado
		)
	: undefined;

	const subtotal =
	equipoData && unidades
	  ? equipoData.precio * unidades
	  : 0;

	  useEffect(() => {
		if (equipoData?.precio) {
		  form.setValue("precio", equipoData.precio);
		} else {
		  form.setValue("precio", 0);
		}
	  }, [equipoData]);

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
								name="categoria"
								render={({ field }: any) => (
									<FormItem >
										<FormLabel>
										<div className="text-red-500"> *<span className="text-black"> Categoría:</span> </div> 
										</FormLabel>
										<Select 
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<FormControl >
												<SelectTrigger>
													<SelectValue placeholder="Selecciona una categoría" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem key={"Herramienta"} value={"Herramienta"}>
                                                    Herramienta
												</SelectItem>
												<SelectItem key={"Computacion"} value={"Computacion"}>
                                                    Computación
												</SelectItem>
												<SelectItem key={"Electricas"} value={"Electricas"}>
                                                    Eléctricas
												</SelectItem>
											</SelectContent>
										</Select>

										<FormMessage />
									</FormItem>
								)}
							/>
							

                            <FormField
								control={form.control}
								name="equipo"
								render={({ field }: any) => (
									<FormItem>
										<FormLabel><div className="text-red-500"> *<span className="text-black"> Equipo:</span> </div> </FormLabel>
										<FormControl>
                                        <Select 
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<FormControl >
												<SelectTrigger>
													<SelectValue placeholder="Selecciona un equipo" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
											{categoriaSeleccionada &&
											equiposPorCategoria[categoriaSeleccionada]?.map((equipo) => (
												<SelectItem key={equipo.value} value={equipo.value}>
												{equipo.label}
												</SelectItem>
											))}
											</SelectContent>
										</Select>

										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

						{equipoData?.img && (
						<div className="mt-4 flex justify-center">
							<Image
							width={100}
							height={100}
							src={equipoData.img}
							alt={equipoData.label}
							className="h-40 object-contain rounded-md border"
							/>
						</div>
						)}

                       <div className="col-span-2">
                            <FormField
                                control={form.control}
                                name="unidades"
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
								name="comentarios"
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
									name="evidencia"
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
											showArray={true} 
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
