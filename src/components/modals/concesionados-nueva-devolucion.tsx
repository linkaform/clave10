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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import LoadImage from "../upload-Image";
import { EquipoConcesionado } from "../concesionados-agregar-equipos";
import { useCatalogoAreaEmpleadoApoyo } from "@/hooks/useCatalogoAreaEmpleadoApoyo";
import { toast } from "sonner";

interface NuevaDevolucionModalProps {
	title: string;
	children: React.ReactNode;
	isSuccess: boolean;
	setIsSuccess: Dispatch<SetStateAction<boolean>>;
    equipoSelecionado:EquipoConcesionado;
}

const formSchema = z.object({
	entrega_tipo: z.string().min(1, { message: "Este campo es oblicatorio" }),
	entrega_concesion: z.string().optional(),
	entrega_concesion_otro: z.string().optional(),
	estatus:z.string().min(1, { message: "Este campo es oblicatorio" }),
	unidades: z.number().optional(),
	comentarios:  z.string().optional(),
	evidencia:  z.array(z.any()).optional(),
	precio:z.number().optional()
});


export const NuevaDevolucionEquipoModal: React.FC<NuevaDevolucionModalProps> = ({
	title,
	children,
	isSuccess,
	setIsSuccess,
	equipoSelecionado
}) => {
	const { data: dataAreaEmpleadoApoyo, isLoading: loadingAreaEmpleadoApoyo } = 
    useCatalogoAreaEmpleadoApoyo(isSuccess);
	
	console.log("equipoSelecionado",equipoSelecionado)
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			entrega_tipo:"",
			entrega_concesion:"",
			entrega_concesion_otro:"",
			estatus: "",
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
				entrega_tipo:"",
				estatus: "",
                unidades: 0,
				evidencia:[],
                comentarios: "",
                precio:0,
              });
        }

		// if (editarAgregarEquiposModal && agregarEquiposSeleccion) {
		// 	reset({
        //         categoria: agregarEquiposSeleccion.categoria,
        //         equipo: agregarEquiposSeleccion.equipo,
        //         unidades: agregarEquiposSeleccion.unidades,
        //         comentarios: agregarEquiposSeleccion.comentarios,
        //         evidencia: agregarEquiposSeleccion.evidencia,
		// 		precio:agregarEquiposSeleccion.precio
        //       });
		// }
	}, [isSuccess, reset])

	function onSubmit(values: z.infer<typeof formSchema>) {
		console.log("values",values)
        // const formatData = {
		// 	entrega_tipo:values.entrega_tipo,
		// 	entrega_concesion:values.entrega_concesion,
		// 	entrega_concesion_otro:values.entrega_concesion_otro,
		// 	estatus:values.estatus,
        //     unidades: values.unidades,
        //     comentarios: values.comentarios,
        //     evidencia: values.evidencia,
		// 	precio:values.precio,
		// 	total: 0
        // }
		toast.success("SERVICIO PENDIENTE EN BACK")
        // if(editarAgregarEquiposModal){
        //     setEditarAgregarEquiposModal(false)
        //     setEquipos((prev: any[]) =>
        //         prev.map((item, i) => (i === indice ? formatData : item))
        //         );
        //     toast.success("Equipo editado correctamente.")
        // }else{
        //     setEquipos((prev: any) => [...prev, formatData]);
        //     toast.success("Equipo agregada correctamente.")
        // }
        setIsSuccess(false)
	}
	console.log("ERRORES",form?.formState?.errors)

	const handleClose = () => {
		setIsSuccess(false);
        // setEditarAgregarEquiposModal(false);
	};


    useEffect(() => {
        if(form.formState.errors){
            console.log("Errores:", form.formState.errors)
        }
    }, [form.formState.errors])

	const tipoCon = form.watch("entrega_tipo");

	return (
		<Dialog onOpenChange={setIsSuccess} open={isSuccess} modal>
			<DialogTrigger>{children}</DialogTrigger>
            
            <DialogContent className="max-w-lg max-h-[80vh] min-h-auto flex flex-col overflow-auto" onInteractOutside={(e) => e.preventDefault()} aria-describedby="" >
            <DialogHeader>
                <DialogTitle className="text-2xl text-center font-bold">
                {title}
                </DialogTitle>
            </DialogHeader>
				<div className="font-bold ml-3">Equipo: { equipoSelecionado?.nombre_equipo}</div>
                <div className="flex-grow overflow-y-auto px-2">
                <Form {...form}>
					<form  >
					<div className="flex flex-col gap-5 mb-6 px-2">

					<div >
					<FormField
						control={form.control}
						name="entrega_tipo"
						defaultValue="si"
						render={({ field }: any) => (
							<FormItem>
								<FormLabel>Entrega:</FormLabel>
								<FormControl>
									<div className="flex gap-2 ">
										<button
										type="button"
										onClick={() => {field.onChange("empleado"); form.setValue("entrega_concesion", "");}}
										className={`px-6 py-2 rounded ${
											field.value === "empleado"
											? "bg-blue-600 text-white "
											: "bg-white-200 text-blue-600 border border-blue-500 "
										}`}
										>
										Empleado
										</button>
										<button
										type="button"
										onClick={() => {field.onChange("otro"); form.setValue("entrega_concesion_otro","")}}
										className={`px-6 py-2 rounded ${
											field.value === "otro"
											? "bg-blue-600 text-white"
											: "bg-white-200 text-blue-600 border border-blue-500"
										}`}
										>
										Otro
										</button>
									</div>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
     				</div>

					{tipoCon == "otro" &&
						<FormField
						control={form.control}
						name="entrega_concesion_otro"
						render={({ field }: any) => (
							<FormItem className="col-span-1">
							<FormLabel>Persona: </FormLabel>
							<FormControl>
								<Input
								placeholder="Persona"
								className="resize-none"
								{...field}
								/>
							</FormControl>
							<FormMessage />
							</FormItem>
						)}
						/>}
					
					{tipoCon == "otro" &&
						<div className="mt-3">
						<Controller
							control={form.control}
							name="evidencia"
							render={({ field, fieldState }) => (
							<div className="flex ">
								<div className="flex flex-col">
								<LoadImage
									id="identificacion"
									titulo={"Evidencia"}
									imgArray={field.value || []}
									setImg={field.onChange}
									showWebcamOption={true}
									facingMode="environment"
									limit={10} />
								{fieldState.error && <span className="block w-full text-red-500 text-sm mt-1">{fieldState.error.message}</span>}
								</div>
							</div>)
							}
						/>
						</div>
						}

						{(tipoCon == "empleado" ) &&
							<FormField
							control={form.control}
							name="entrega_concesion"
							render={({ field }: any) => (
								<FormItem>
								<FormLabel>Persona:</FormLabel>
								<FormControl>
									<Select {...field} className="input"
									onValueChange={(value: string) => {
										field.onChange(value);
									}}
									value={field.value}
									>
									<SelectTrigger className="w-full">
										{loadingAreaEmpleadoApoyo ? (
										<SelectValue placeholder="Cargando empleados..." />
										) : (<>
										{dataAreaEmpleadoApoyo?.length > 0 ? (<SelectValue placeholder="Selecciona una opción..." />)
											: (<SelectValue placeholder="Selecciona una categoria para ver las opciones..." />)
										}
										</>)}

									</SelectTrigger>
									<SelectContent>
										{dataAreaEmpleadoApoyo?.length > 0 ? (
										dataAreaEmpleadoApoyo?.map((item: string, index: number) => {
											return (
											<SelectItem key={index} value={item}>
												{item}
											</SelectItem>
											);
										})
										) : (
										<><SelectItem disabled value={"no opciones"}>No hay opciones disponibles</SelectItem></>
										)}
									</SelectContent>
									</Select>
								</FormControl>
								<FormMessage />
								</FormItem>
							)}
							/>
						}

					
                       <div className="col-span-2">
                            <FormField
                                control={form.control}
                                name="unidades"
                                render={({ field }: any) => (
                                    <FormItem>
                                        <FormLabel>Unidades entregadas:</FormLabel>
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

						<FormField
						control={form.control}
						name="estatus"
						defaultValue="completo"
						render={({ field }: any) => (
							<FormItem>
								<FormLabel>Estado:</FormLabel>
								<FormControl>
									<div className="flex gap-2 ">
										<button
										type="button"
										onClick={() => {field.onChange("completo"); }}
										className={`px-6 py-2 rounded ${
											field.value === "completo"
											? "bg-blue-600 text-white "
											: "bg-white-200 text-blue-600 border border-blue-500 "
										}`}
										>
										Completo
										</button>
										<button
										type="button"
										onClick={() => {field.onChange("perdido");}}
										className={`px-6 py-2 rounded ${
											field.value === "perdido"
											? "bg-blue-600 text-white"
											: "bg-white-200 text-blue-600 border border-blue-500"
										}`}
										>
										Perdido
										</button>
										<button
										type="button"
										onClick={() => {field.onChange("dañado")}}
										className={`px-6 py-2 rounded ${
											field.value === "dañado"
											? "bg-blue-600 text-white"
											: "bg-white-200 text-blue-600 border border-blue-500"
										}`}
										>
										Dañado
										</button>
									</div>
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
										<FormLabel>Comentarios: </FormLabel>
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
                          
                        </div>


                         
                            <div className="w-full md:w-1/2 pr-2 mt-3">
								<Controller
									control={form.control}
									name="evidencia"
									render={({ field, fieldState }) => (
									<div className="flex">
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
                    {/* {editarAgregarEquiposModal ? "Editar" : "Agregar"} */}{"Agregar"}
                </Button>
                </div>
			</DialogContent>
		</Dialog>
	);
};
