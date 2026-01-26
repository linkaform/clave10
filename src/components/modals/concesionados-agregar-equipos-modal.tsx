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

interface AgregarEquiposModalProps {
	title: string;
	children: React.ReactNode;
	isSuccess: boolean;
	setIsSuccess: Dispatch<SetStateAction<boolean>>;
    setEquipos: Dispatch<SetStateAction<any>>;
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
	evidencia:  z.string().optional(),
});

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
			evidencia: "",
		},
	});

	const { reset } = form;

	useEffect(() => {
        if (isSuccess){
            reset({
                categoria: "",
                equipo: "",
                unidades: 0,
                comentarios: "",
                evidencia: "",
              });
        }

		if (editarAgregarEquiposModal && agregarEquiposSeleccion) {
			reset({
                categoria: agregarEquiposSeleccion.categoria,
                equipo: agregarEquiposSeleccion.equipo,
                unidades: agregarEquiposSeleccion.unidades,
                comentarios: agregarEquiposSeleccion.comentarios,
                evidencia: agregarEquiposSeleccion.evidencia,
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
        }
        if(editarAgregarEquiposModal){
            setEditarAgregarEquiposModal(false)
            setEquipos((prev: any[]) =>
                prev.map((item, i) => (i === indice ? formatData : item))
                );
            toast.success("Equipo editada correctamente.")
        }else{
            setEquipos((prev: any) => [...prev, formatData]);
            toast.success("Equipo agregada correctamente.")
        }
        setIsSuccess(false)
	}

	const handleClose = () => {
		setIsSuccess(false);
        setEditarAgregarEquiposModal(false);
	};

    useEffect(() => {
        if(form.formState.errors){
            console.log("Errores:", form.formState.errors)
        }
    }, [form.formState.errors])


      
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
												<SelectItem key={1} value={"1"}>
                                                    Herramienta
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
												<SelectItem key={1} value={"1"}>
                                                    Martillo
												</SelectItem>
											</SelectContent>
										</Select>

										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
                       <div className="col-span-2">
                            <FormField
                                control={form.control}
                                name="unidades"
                                render={({ field }: any) => (
                                    <FormItem>
                                        <FormLabel>Unidades:</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="Responsable..." {...field}
                                                onChange={(e) => {
                                                    field.onChange(e);
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
											<Textarea placeholder="Acciones Tomadas..." {...field}
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
                                <span className="font-bold text-lg">{0}</span>
                            </div>
                        </div>


                         
                            <div className="w-full md:w-1/2 pr-2">
								<Controller
									control={form.control}
									name="evidencia"
									render={({ field, fieldState }) => (
									<div className="flex ">
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
